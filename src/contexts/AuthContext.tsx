"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, getRefreshToken, removeTokens } from '@/lib/api';
import { logger } from '@/utils/logger';

// 사용자 정보 타입
interface User {
  id: string;
  name: string;
  nickname: string;
  email: string;
  // 필요한 다른 사용자 정보들
}

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
    
    setAuthState({
      isAuthenticated: true,
      user,
      accessToken,
      refreshToken: refreshToken || null,
      isLoading: false,
    });
  };

  // 로그아웃 함수
  const logout = () => {
    logger.info('🔐 로그아웃 실행');
    
    // 토큰 제거
    removeTokens();
    
    // 상태 초기화
    setAuthState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
    });
  };

  // 사용자 정보 업데이트
  const updateUser = (user: User) => {
    logger.info('👤 사용자 정보 업데이트', { userId: user.id });
    
    setAuthState(prev => ({
      ...prev,
      user,
    }));
  };

  // 인증 상태 확인
  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      logger.info('🔍 인증 상태 확인 시작');
      
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!accessToken) {
        logger.info('❌ Access Token 없음 - 로그아웃 상태');
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // 토큰 유효성 검증 (실제로는 서버에 요청)
      const isValid = await validateToken(accessToken);
      
      if (isValid) {
        logger.info('✅ 토큰 유효 - 로그인 상태 유지');
        // 사용자 정보는 로컬 스토리지에서 복원하거나 서버에서 다시 가져올 수 있음
        const user = getStoredUser();
        if (user) {
          setAuthState({
            isAuthenticated: true,
            user,
            accessToken,
            refreshToken,
            isLoading: false,
          });
        }
        return true;
      } else {
        logger.warn('⚠️ 토큰 만료 - 로그아웃 처리');
        logout();
        return false;
      }
    } catch (error) {
      logger.error('💥 인증 상태 확인 실패', error);
      logout();
      return false;
    }
  };

  // 토큰 유효성 검증 (실제 구현에서는 서버 API 호출)
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      // 실제로는 서버에 토큰 유효성 검증 요청
      // 예: GET /auth/me 또는 /auth/validate
      const response = await fetch('http://127.0.0.1:8000/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // 사용자 정보 저장
        storeUser(data.data || data.user);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      logger.error('토큰 검증 실패', error);
      return false;
    }
  };

  // 사용자 정보 로컬 스토리지 저장
  const storeUser = (user: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  };

  // 사용자 정보 로컬 스토리지에서 가져오기
  const getStoredUser = (): User | null => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
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