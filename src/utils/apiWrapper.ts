"use client";

import { logger } from './logger';
import { retryApiRequest, logAndNotifyError, analyzeApiError } from './apiErrorHandler';

// API 요청 옵션 타입
export interface ApiRequestOptions {
  requireAuth?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: any) => void;
  onSuccess?: (data: any) => void;
  context?: string;
}

// 기본 옵션
const DEFAULT_OPTIONS: ApiRequestOptions = {
  requireAuth: true,
  maxRetries: 2,
  retryDelay: 1000,
  context: 'API 요청'
};

/**
 * 전역 API 요청 래퍼 - auth 에러 자동 처리
 */
export async function apiWrapper<T = any>(
  requestFn: () => Promise<{ success: boolean; data?: T; error?: string; status?: number }>,
  options: ApiRequestOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    logger.info(`🚀 ${opts.context} 시작`);
    
    // API 요청 실행 (재시도 로직 포함)
    const result = await retryApiRequest(
      requestFn,
      opts.maxRetries,
      opts.retryDelay
    );
    
    if (result.success) {
      logger.info(`✅ ${opts.context} 성공`);
      opts.onSuccess?.(result.data);
      return result;
    } else {
      // 에러 분석 및 처리
      const errorInfo = logAndNotifyError(result, opts.context);
      
      // 인증 에러이고 리다이렉트가 필요한 경우
      if (errorInfo.shouldRedirect) {
        logger.warn(`🔐 ${opts.context} - 인증 에러로 인한 리다이렉트`);
        redirectToLogin();
      }
      
      // 에러 콜백 호출
      opts.onError?.(result);
      
      return result;
    }
  } catch (error) {
    logger.error(`💥 ${opts.context} - 예상치 못한 오류:`, error);
    
    const errorResult = { 
      success: false, 
      error: '네트워크 오류가 발생했습니다.',
      status: 0
    };
    
    opts.onError?.(errorResult);
    return errorResult;
  }
}

/**
 * 로그인 페이지로 리다이렉트
 */
function redirectToLogin() {
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.pathname + window.location.search;
    const loginUrl = `/sign?redirect=${encodeURIComponent(currentUrl)}`;
    
    // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
    if (!window.location.pathname.includes('/sign')) {
      logger.info(`🔄 로그인 페이지로 리다이렉트: ${loginUrl}`);
      window.location.href = loginUrl;
    }
  }
}

/**
 * 인증이 필요한 API 요청 래퍼
 */
export async function authenticatedApiWrapper<T = any>(
  requestFn: () => Promise<{ success: boolean; data?: T; error?: string; status?: number }>,
  options: Omit<ApiRequestOptions, 'requireAuth'> = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  return apiWrapper(requestFn, { ...options, requireAuth: true });
}

/**
 * 인증이 필요 없는 API 요청 래퍼
 */
export async function publicApiWrapper<T = any>(
  requestFn: () => Promise<{ success: boolean; data?: T; error?: string; status?: number }>,
  options: Omit<ApiRequestOptions, 'requireAuth'> = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  return apiWrapper(requestFn, { ...options, requireAuth: false });
}

/**
 * 조건부 인증 API 요청 래퍼
 */
export async function conditionalApiWrapper<T = any>(
  requestFn: () => Promise<{ success: boolean; data?: T; error?: string; status?: number }>,
  isAuthenticated: boolean,
  options: Omit<ApiRequestOptions, 'requireAuth'> = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  return apiWrapper(requestFn, { ...options, requireAuth: isAuthenticated });
}

/**
 * 배치 API 요청 래퍼 (여러 API를 순차적으로 실행)
 */
export async function batchApiWrapper<T = any>(
  requests: Array<() => Promise<{ success: boolean; data?: T; error?: string; status?: number }>>,
  options: ApiRequestOptions = {}
): Promise<Array<{ success: boolean; data?: T; error?: string; status?: number }>> {
  const results = [];
  
  for (let i = 0; i < requests.length; i++) {
    const request = requests[i];
    const context = `${options.context || '배치 API'} (${i + 1}/${requests.length})`;
    
    const result = await apiWrapper(request, { ...options, context });
    results.push(result);
    
    // 실패한 요청이 있고 재시도가 불가능한 경우 중단
    if (!result.success) {
      const errorInfo = analyzeApiError(result);
      if (!errorInfo.shouldRetry) {
        logger.warn(`🛑 ${context} - 재시도 불가능한 오류로 배치 중단`);
        break;
      }
    }
  }
  
  return results;
}

/**
 * 병렬 API 요청 래퍼 (여러 API를 동시에 실행)
 */
export async function parallelApiWrapper<T = any>(
  requests: Array<() => Promise<{ success: boolean; data?: T; error?: string; status?: number }>>,
  options: ApiRequestOptions = {}
): Promise<Array<{ success: boolean; data?: T; error?: string; status?: number }>> {
  const context = options.context || '병렬 API';
  logger.info(`🚀 ${context} 시작 (${requests.length}개 요청)`);
  
  try {
    const promises = requests.map((request, index) => 
      apiWrapper(request, { ...options, context: `${context} (${index + 1})` })
    );
    
    const results = await Promise.all(promises);
    logger.info(`✅ ${context} 완료 (${results.filter(r => r.success).length}/${results.length} 성공)`);
    
    return results;
  } catch (error) {
    logger.error(`💥 ${context} - 병렬 실행 중 오류:`, error);
    throw error;
  }
}
