"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAccessToken, getRefreshToken, removeTokens } from '@/lib/api';
import { UserItem } from '@/types/api';
import { logger } from '@/utils/logger';

// 사용자 정보 타입 (AuthContext용)
type User = UserItem;

// 인증 상태 타입
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

// AuthContext 타입
interface AuthContextType extends AuthState {
  login: (user: User, accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  checkAuthStatus: () => Promise<boolean>;
}

// 기본값
const defaultAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
};

// Context 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider 컴포넌트
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  // 로그인 함수
  const login = (user: User, accessToken: string, refreshToken?: string) => {
    logger.info('🔐 로그인 상태 업데이트', { userId: user.id, hasRefreshToken: !!refreshToken });
    
    // 사용자 정보 저장
    storeUser(user);
    
    setAuthState({
      isAuthenticated: true,
      user,
      accessToken,
      refreshToken: refreshToken || null,
      isLoading: false,
    });
  };

  // 로그아웃 함수
  const logout = useCallback(() => {
    logger.info('🔐 로그아웃 실행');
    
    // 토큰 제거
    removeTokens();
    
    // 저장된 사용자 정보 제거
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    
    // 상태 초기화
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
    });
  }, []);

  // 사용자 정보 업데이트
  const updateUser = (user: User) => {
    logger.info('👤 사용자 정보 업데이트', { userId: user.id });
    
    setAuthState(prev => ({
      ...prev,
      user,
    }));
  };

  // 인증 상태 확인
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      logger.info('🔍 인증 상태 확인 시작');
      
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      logger.info('🔑 토큰 상태 확인:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken?.length || 0,
        refreshTokenLength: refreshToken?.length || 0
      });

      if (!accessToken) {
        logger.info('❌ Access Token 없음 - 로그아웃 상태');
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
      
      if (!refreshToken) {
        logger.info('❌ Refresh Token 없음 - 로그아웃 상태');
        logout();
        return false;
      }

      // 토큰이 있으면 항상 users/me API를 호출해서 최신 사용자 정보를 가져옴
      logger.info('🔄 최신 사용자 정보 가져오기 시작');
      const isValid = await validateToken(accessToken);
      
      if (isValid) {
        const user = getStoredUser();
        if (user) {
          logger.info('✅ 최신 사용자 정보로 로그인 상태 복원', {
            userId: user.id,
            nickname: user.nickname,
            profileImageUrl: user.profileImageUrl
          });
          setAuthState({
            isAuthenticated: true,
            user,
            accessToken,
            refreshToken,
            isLoading: false,
          });
          return true;
        }
      }
      
      logger.warn('❌ 사용자 정보 가져오기 실패, 로그아웃 처리');
      logout();
      return false;
    } catch (error) {
      logger.error('💥 인증 상태 확인 실패', error);
      logout();
      return false;
    }
  }, [logout]);

  // 토큰 유효성 검증 (apiRequest 래퍼 사용)
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      // 리프레시 토큰 확인
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        logger.warn('❌ Refresh Token이 없어서 토큰 검증을 건너뜁니다.');
        return false;
      }
      
      logger.info('🔑 토큰 검증 시작', {
        hasAccessToken: !!token,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: token?.length || 0,
        refreshTokenLength: refreshToken?.length || 0
      });
      
      // apiRequest 래퍼를 사용하여 자동 토큰 갱신 지원
      const { apiRequest } = await import('@/lib/api');
      const API_BASE_URL = 'https://api-participant.hence.events';
      
      logger.info('📡 users/me API 호출 시작');
      const result = await apiRequest<any>(`${API_BASE_URL}/users/me`, {
        method: 'GET',
      });

      logger.info('📥 users/me API 응답:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error
      });

      if (result.success && result.data) {
        // 사용자 정보 추출 및 저장
        const userData = result.data.data || result.data.user || result.data;
        logger.info('✅ users/me 사용자 데이터 추출:', {
          userId: userData.id,
          nickname: userData.nickname,
          email: userData.email,
          profileImageUrl: userData.profileImageUrl
        });
        
        // 사용자 정보 저장
        storeUser(userData);
        logger.info('✅ 토큰 검증 성공 및 사용자 정보 저장됨');
        return true;
      } else {
        logger.warn('❌ 토큰 검증 실패', result.error);
        return false;
      }
    } catch (error) {
      logger.error('💥 토큰 검증 중 오류 발생', error);
      return false;
    }
  };

  // 사용자 정보 로컬 스토리지 저장
  const storeUser = (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      logger.info('💾 사용자 정보 저장됨', { 
        userId: user.id, 
        eventCount: user.eventCount, 
        postCount: user.postCount, 
        commentCount: user.commentCount 
      });
    }
  };

  // 사용자 정보 로컬 스토리지에서 가져오기
  const getStoredUser = (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          logger.info('📖 저장된 사용자 정보 로드됨', { 
            userId: user.id, 
            eventCount: user.eventCount, 
            postCount: user.postCount, 
            commentCount: user.commentCount 
          });
          return user;
        } catch (error) {
          logger.error('사용자 정보 파싱 실패', error);
          return null;
        }
      }
    }
    return null;
  };

  // 초기 인증 상태 확인
  useEffect(() => {
    const initializeAuth = async () => {
      logger.info('🚀 인증 초기화 시작');
      await checkAuthStatus();
    };

    initializeAuth();
  }, []);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 인증이 필요한 컴포넌트를 위한 HOC
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>;
    }

    if (!isAuthenticated) {
      // 로그인 페이지로 리다이렉트
      if (typeof window !== 'undefined') {
        window.location.href = '/sign';
      }
      return null;
    }

    return <Component {...props} />;
  };
} 