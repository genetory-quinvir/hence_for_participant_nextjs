"use client";

import { logger } from './logger';
import { analyzeApiError, getUserFriendlyErrorMessage } from './apiErrorHandler';

// 전역 에러 타입
export interface GlobalError {
  type: 'api' | 'auth' | 'network' | 'validation' | 'unknown';
  message: string;
  originalError?: any;
  context?: string;
  timestamp: number;
  handled: boolean;
}

// 전역 에러 저장소
class GlobalErrorStore {
  private errors: GlobalError[] = [];
  private maxErrors = 100; // 최대 에러 개수 제한
  private listeners: Array<(error: GlobalError) => void> = [];

  // 에러 추가
  addError(error: GlobalError): void {
    this.errors.push(error);
    
    // 최대 개수 제한
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
    
    // 리스너들에게 알림
    this.listeners.forEach(listener => listener(error));
    
    // 에러 로깅
    this.logError(error);
  }

  // 에러 가져오기
  getErrors(): GlobalError[] {
    return [...this.errors];
  }

  // 최근 에러 가져오기
  getRecentErrors(count: number = 10): GlobalError[] {
    return this.errors.slice(-count);
  }

  // 특정 타입의 에러 가져오기
  getErrorsByType(type: GlobalError['type']): GlobalError[] {
    return this.errors.filter(error => error.type === type);
  }

  // 에러 제거
  clearErrors(): void {
    this.errors = [];
  }

  // 리스너 추가
  addListener(listener: (error: GlobalError) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 에러 로깅
  private logError(error: GlobalError): void {
    const context = error.context ? ` [${error.context}]` : '';
    
    switch (error.type) {
      case 'auth':
        logger.warn(`🔐 인증 에러${context}:`, error.message);
        break;
      case 'api':
        logger.error(`💥 API 에러${context}:`, error.message);
        break;
      case 'network':
        logger.error(`🌐 네트워크 에러${context}:`, error.message);
        break;
      case 'validation':
        logger.warn(`⚠️ 검증 에러${context}:`, error.message);
        break;
      default:
        logger.error(`❓ 알 수 없는 에러${context}:`, error.message);
    }
  }
}

// 전역 에러 저장소 인스턴스
export const globalErrorStore = new GlobalErrorStore();

/**
 * 에러를 전역 에러 저장소에 추가
 */
export function addGlobalError(
  error: any,
  type: GlobalError['type'] = 'unknown',
  context?: string
): GlobalError {
  const globalError: GlobalError = {
    type,
    message: getUserFriendlyErrorMessage(error),
    originalError: error,
    context,
    timestamp: Date.now(),
    handled: false
  };

  globalErrorStore.addError(globalError);
  return globalError;
}

/**
 * API 에러를 전역 에러 저장소에 추가
 */
export function addApiError(error: any, context?: string): GlobalError {
  const analysis = analyzeApiError(error);
  
  let type: GlobalError['type'] = 'api';
  if (analysis.isAuthError) {
    type = 'auth';
  } else if (error.status === 0 || error.message?.includes('network')) {
    type = 'network';
  }

  return addGlobalError(error, type, context);
}

/**
 * 전역 에러 처리 미들웨어
 */
export function createErrorMiddleware() {
  return {
    // API 에러 처리
    handleApiError: (error: any, context?: string) => {
      return addApiError(error, context);
    },

    // 인증 에러 처리
    handleAuthError: (error: any, context?: string) => {
      return addGlobalError(error, 'auth', context);
    },

    // 네트워크 에러 처리
    handleNetworkError: (error: any, context?: string) => {
      return addGlobalError(error, 'network', context);
    },

    // 검증 에러 처리
    handleValidationError: (error: any, context?: string) => {
      return addGlobalError(error, 'validation', context);
    },

    // 일반 에러 처리
    handleGenericError: (error: any, context?: string) => {
      return addGlobalError(error, 'unknown', context);
    }
  };
}

/**
 * 전역 에러 처리 훅
 */
export function useGlobalErrorHandler() {
  const [errors, setErrors] = useState<GlobalError[]>([]);
  const [hasUnhandledErrors, setHasUnhandledErrors] = useState(false);

  useEffect(() => {
    // 초기 에러 로드
    setErrors(globalErrorStore.getErrors());
    setHasUnhandledErrors(globalErrorStore.getErrors().some(e => !e.handled));

    // 에러 리스너 등록
    const unsubscribe = globalErrorStore.addListener((error) => {
      setErrors(prev => [...prev, error]);
      setHasUnhandledErrors(true);
    });

    return unsubscribe;
  }, []);

  const handleError = useCallback((error: any, type: GlobalError['type'] = 'unknown', context?: string) => {
    return addGlobalError(error, type, context);
  }, []);

  const clearErrors = useCallback(() => {
    globalErrorStore.clearErrors();
    setErrors([]);
    setHasUnhandledErrors(false);
  }, []);

  const markErrorAsHandled = useCallback((errorId: number) => {
    const updatedErrors = errors.map(error => 
      error.timestamp === errorId ? { ...error, handled: true } : error
    );
    setErrors(updatedErrors);
    setHasUnhandledErrors(updatedErrors.some(e => !e.handled));
  }, [errors]);

  return {
    errors,
    hasUnhandledErrors,
    handleError,
    clearErrors,
    markErrorAsHandled,
    getErrorsByType: globalErrorStore.getErrorsByType.bind(globalErrorStore)
  };
}

import { useState, useEffect, useCallback } from 'react';

/**
 * 전역 에러 처리 설정
 */
export function setupGlobalErrorHandling() {
  // 클라이언트 사이드에서만 실행
  if (typeof window === 'undefined') {
    return;
  }

  // 전역 에러 이벤트 리스너
  // 전역 에러 이벤트
  window.addEventListener('error', (event) => {
    addGlobalError(event.error, 'unknown', 'Global Error Event');
  });

  // 전역 Promise rejection 이벤트
  window.addEventListener('unhandledrejection', (event) => {
    addGlobalError(event.reason, 'unknown', 'Unhandled Promise Rejection');
    event.preventDefault(); // 기본 동작 방지
  });

  // 네트워크 상태 모니터링
  window.addEventListener('online', () => {
    logger.info('🌐 네트워크 연결 복구됨');
  });

  window.addEventListener('offline', () => {
    addGlobalError(
      { message: '네트워크 연결이 끊어졌습니다.' },
      'network',
      'Network Status'
    );
  });

  logger.info('🛡️ 전역 에러 처리 설정 완료');
}

/**
 * 에러 통계 정보
 */
export function getErrorStatistics() {
  const errors = globalErrorStore.getErrors();
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  return {
    total: errors.length,
    unhandled: errors.filter(e => !e.handled).length,
    lastHour: errors.filter(e => e.timestamp > oneHourAgo).length,
    lastDay: errors.filter(e => e.timestamp > oneDayAgo).length,
    byType: {
      api: errors.filter(e => e.type === 'api').length,
      auth: errors.filter(e => e.type === 'auth').length,
      network: errors.filter(e => e.type === 'network').length,
      validation: errors.filter(e => e.type === 'validation').length,
      unknown: errors.filter(e => e.type === 'unknown').length
    }
  };
}
