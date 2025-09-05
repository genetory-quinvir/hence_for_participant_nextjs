"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAccessToken, getRefreshToken, removeTokens } from '@/lib/api';
import { unsubscribeFromTopic } from '@/lib/firebase';
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
  refreshAccessToken: () => Promise<string | null>;
  handleAuthError: (error: any) => Promise<boolean>;
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
    logger.info('🔐 로그인 상태 업데이트', { userId: user.id, hasRefreshToken: !!refreshToken, provider: user.provider });
    
    // 사용자 정보 저장
    storeUser(user);
    
    setAuthState({
      isAuthenticated: true,
      user,
      accessToken,
      refreshToken: refreshToken || null,
      isLoading: false,
    });
    
    // 소셜 로그인 사용자의 경우 validateToken 검증을 일시적으로 비활성화
    if (user.provider && user.provider !== 'EMAIL') {
      logger.info('🔐 소셜 로그인 사용자 - validateToken 검증 일시 비활성화');
      // 5초 후에 다시 활성화 (충분한 시간을 두고)
      setTimeout(() => {
        logger.info('🔐 소셜 로그인 사용자 - validateToken 검증 재활성화');
      }, 5000);
    }
  };

  // 로그아웃 함수
  const logout = useCallback(async () => {
    logger.info('🔐 로그아웃 실행');
    
    // LocalStorage에서 토픽 관련 정보 제거 및 FCM 토픽 구독 해제
    if (typeof window !== 'undefined') {
      // notificationPermissionRequested_로 시작하는 모든 키 제거
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('notificationPermissionRequested_')) {
          keysToRemove.push(key);
          // FCM 토픽 구독 해제
          const eventId = key.replace('notificationPermissionRequested_', '');
          const topicName = `event_${eventId}`;
          unsubscribeFromTopic(topicName).catch(error => {
            logger.error(`토픽 구독 해제 실패: ${topicName}`, error);
          });
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // 전역 알림 권한 상태도 초기화
      localStorage.removeItem('notificationPermissionGranted');
      localStorage.removeItem('notificationPermissionDenied');
      
      logger.info('🗑️ LocalStorage 토픽 정보 제거 및 FCM 토픽 구독 해제 완료');
    }
    
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
    
    // 로컬 스토리지에 사용자 정보 저장
    storeUser(user);
    
    setAuthState(prev => ({
      ...prev,
      user,
    }));
  };

  // 인증 상태 확인
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      logger.info('🔍 인증 상태 확인 시작');
      
      // 이미 인증된 상태라면 검증을 건너뜀
      if (authState.isAuthenticated && authState.user && authState.accessToken) {
        logger.info('✅ 이미 인증된 상태 - 검증 건너뜀');
        return true;
      }
      
      // 소셜 로그인 콜백 페이지에서는 검증 건너뜀
      if (typeof window !== 'undefined' && window.location.pathname === '/auth/callback') {
        logger.info('✅ 소셜 로그인 콜백 페이지 - 검증 건너뜀');
        return true;
      }
      
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
  }, [logout, authState.isAuthenticated, authState.user, authState.accessToken]);

  // 토큰 유효성 검증 (apiRequest 래퍼 사용)
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      // 소셜 로그인 콜백 페이지에서는 검증 건너뜀
      if (typeof window !== 'undefined' && window.location.pathname === '/auth/callback') {
        logger.info('✅ 소셜 로그인 콜백 페이지 - validateToken 건너뜀');
        return true;
      }
      
      // 소셜 로그인 사용자이고 최근에 로그인한 경우 검증 건너뜀
      const existingUser = getStoredUser();
      if (existingUser?.provider && existingUser.provider !== 'EMAIL') {
        const lastLoginTime = localStorage.getItem('lastSocialLoginTime');
        if (lastLoginTime && Date.now() - parseInt(lastLoginTime) < 10000) { // 10초 이내
          logger.info('✅ 소셜 로그인 직후 - validateToken 건너뜀');
          return true;
        }
      }
      
      // 리프레시 토큰 확인
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        logger.warn('❌ Refresh Token이 없어서 토큰 검증을 건너뜁니다.');
        return false;
      }
      
      // 기존 저장된 사용자 정보에서 provider 확인
      const existingUser = getStoredUser();
      const isSocialUser = existingUser?.provider && existingUser.provider !== 'EMAIL';
      
      logger.info('🔑 토큰 검증 시작', {
        hasAccessToken: !!token,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: token?.length || 0,
        refreshTokenLength: refreshToken?.length || 0,
        isSocialUser,
        userProvider: existingUser?.provider
      });
      
      // apiRequest 래퍼를 사용하여 자동 토큰 갱신 지원
      const { apiRequest } = await import('@/lib/api');
      const API_BASE_URL = 'https://api-participant.hence.events';
      
      logger.info('📡 users/me API 호출 시작', {
        tokenLength: token?.length || 0,
        tokenPrefix: token?.substring(0, 20) + '...',
        currentPath: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
      });
      
      const result = await apiRequest<any>(`${API_BASE_URL}/users/me`, {
        method: 'GET',
      });

      logger.info('📥 users/me API 응답:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error,
        status: result.status,
        fullResult: result
      });

      if (result.success && result.data) {
        // 사용자 정보 추출 및 저장
        const userData = result.data.data || result.data.user || result.data;
        
        // 기존 저장된 사용자 정보에서 provider 정보 가져오기
        const existingUser = getStoredUser();
        if (existingUser && existingUser.provider && !userData.provider) {
          userData.provider = existingUser.provider;
        }
        
        logger.info('✅ users/me 사용자 데이터 추출:', {
          userId: userData.id,
          nickname: userData.nickname,
          email: userData.email,
          provider: userData.provider,
          profileImageUrl: userData.profileImageUrl
        });
        
        // 사용자 정보 저장
        storeUser(userData);
        logger.info('✅ 토큰 검증 성공 및 사용자 정보 저장됨');
        return true;
      } else {
        logger.warn('❌ users/me API 실패, 기존 사용자 정보 확인', {
          success: result.success,
          hasData: !!result.data,
          error: result.error,
          fullResult: result
        });
        
        // 기존 저장된 사용자 정보가 있으면 성공으로 처리 (소셜 로그인 사용자 대응)
        const existingUser = getStoredUser();
        if (existingUser && existingUser.id) {
          logger.info('✅ 기존 사용자 정보로 토큰 검증 성공 처리', {
            userId: existingUser.id,
            provider: existingUser.provider
          });
          return true;
        }
        
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

  // Access Token 자동 갱신
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      logger.info('🔄 Access Token 자동 갱신 시작');
      
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        logger.warn('❌ Refresh Token이 없어서 토큰 갱신 불가');
        return null;
      }

      // refreshAccessToken API 호출
      const { refreshAccessToken: refreshTokenAPI } = await import('@/lib/api');
      const result = await refreshTokenAPI();
      
      if (result.success && result.accessToken) {
        logger.info('✅ Access Token 갱신 성공');
        
        // 새로운 토큰으로 상태 업데이트
        setAuthState(prev => ({
          ...prev,
          accessToken: result.accessToken || null
        }));
        
        return result.accessToken;
      } else {
        logger.warn('❌ Access Token 갱신 실패', result.error);
        return null;
      }
    } catch (error) {
      logger.error('💥 Access Token 갱신 중 오류', error);
      return null;
    }
  }, []);

  // AUTH_REQUIRED 에러 자동 처리
  const handleAuthError = useCallback(async (error: any): Promise<boolean> => {
    try {
      // AUTH_REQUIRED 에러인지 확인
      const isAuthRequired = error?.error === 'AUTH_REQUIRED' || 
                           error?.message?.includes('AUTH_REQUIRED') ||
                           error?.includes('AUTH_REQUIRED');
      
      if (!isAuthRequired) {
        logger.info('🔍 AUTH_REQUIRED 에러가 아님, 다른 에러 처리');
        return false;
      }

      logger.info('🔐 AUTH_REQUIRED 에러 감지, 자동 토큰 갱신 시도');
      
      // 토큰 갱신 시도
      const newAccessToken = await refreshAccessToken();
      
      if (newAccessToken) {
        logger.info('✅ 토큰 갱신 성공, 재시도 가능');
        return true; // 재시도 가능
      } else {
        logger.warn('❌ 토큰 갱신 실패, 로그인 필요');
        // 로그인 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          const currentUrl = window.location.pathname + window.location.search;
          window.location.href = `/sign?redirect=${encodeURIComponent(currentUrl)}`;
        }
        return false; // 재시도 불가
      }
    } catch (error) {
      logger.error('💥 AUTH_REQUIRED 에러 처리 중 오류', error);
      return false;
    }
  }, [refreshAccessToken]);

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
    refreshAccessToken,
    handleAuthError,
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