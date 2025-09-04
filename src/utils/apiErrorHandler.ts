import { logger } from './logger';
import { getAccessToken, refreshAccessToken } from '@/lib/api';

// API 에러 타입 정의
export interface ApiError {
  success: false;
  error: string;
  status?: number;
  retryable?: boolean;
}

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// 에러 처리 결과 타입
export interface ErrorHandleResult {
  shouldRetry: boolean;
  shouldRedirect: boolean;
  errorMessage: string;
  isAuthError: boolean;
}

/**
 * API 에러를 분석하고 적절한 처리 방법을 결정
 */
export function analyzeApiError(error: any): ErrorHandleResult {
  const errorMessage = error?.error || error?.message || '알 수 없는 오류가 발생했습니다.';
  
  // AUTH_REQUIRED 에러 체크
  const isAuthError = errorMessage === 'AUTH_REQUIRED' || 
                     errorMessage.includes('AUTH_REQUIRED') ||
                     error?.status === 401;
  
  // 재시도 가능한 에러인지 확인
  const isRetryable = isAuthError || 
                     error?.status === 500 || 
                     error?.status === 502 || 
                     error?.status === 503 ||
                     error?.status === 504;
  
  // 리다이렉트가 필요한지 확인
  const shouldRedirect = isAuthError && !isRetryable;
  
  return {
    shouldRetry: isRetryable,
    shouldRedirect,
    errorMessage,
    isAuthError
  };
}

/**
 * AUTH_REQUIRED 에러 자동 처리
 */
export async function handleAuthError(error: any): Promise<boolean> {
  try {
    const analysis = analyzeApiError(error);
    
    if (!analysis.isAuthError) {
      logger.info('🔍 AUTH_REQUIRED 에러가 아님, 다른 에러 처리');
      return false;
    }

    logger.info('🔐 AUTH_REQUIRED 에러 감지, 자동 토큰 갱신 시도');
    
    // 토큰 갱신 시도
    const refreshResult = await refreshAccessToken();
    
    if (refreshResult.success && refreshResult.accessToken) {
      logger.info('✅ 토큰 갱신 성공, 재시도 가능');
      return true; // 재시도 가능
    } else {
      logger.warn('❌ 토큰 갱신 실패, 로그인 필요');
      return false; // 재시도 불가
    }
  } catch (error) {
    logger.error('💥 AUTH_REQUIRED 에러 처리 중 오류', error);
    return false;
  }
}

/**
 * API 요청 재시도 로직
 */
export async function retryApiRequest<T>(
  requestFn: () => Promise<ApiResponse<T>>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<ApiResponse<T>> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await requestFn();
      
      // 성공이거나 재시도 불가능한 에러인 경우
      if (result.success || !analyzeApiError(result).shouldRetry) {
        return result;
      }
      
      // AUTH_REQUIRED 에러인 경우 토큰 갱신 시도
      if (result.error === 'AUTH_REQUIRED') {
        const canRetry = await handleAuthError(result);
        if (!canRetry) {
          return result; // 재시도 불가능
        }
        // 토큰 갱신 성공, 다음 시도에서 새로운 토큰 사용
      }
      
      lastError = result;
      
      // 마지막 시도가 아니면 대기
      if (attempt < maxRetries) {
        logger.info(`🔄 API 요청 재시도 ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    } catch (error) {
      lastError = { success: false, error: '네트워크 오류가 발생했습니다.' };
      
      if (attempt < maxRetries) {
        logger.warn(`🔄 API 요청 재시도 ${attempt + 1}/${maxRetries} (네트워크 오류)`);
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
      }
    }
  }
  
  return lastError;
}

/**
 * 사용자 친화적인 에러 메시지 생성
 */
export function getUserFriendlyErrorMessage(error: any): string {
  const errorMessage = error?.error || error?.message || '알 수 없는 오류가 발생했습니다.';
  
  // 에러 메시지 매핑
  const errorMap: Record<string, string> = {
    'AUTH_REQUIRED': '로그인이 필요합니다. 다시 로그인해주세요.',
    'NETWORK_ERROR': '네트워크 연결을 확인해주세요.',
    'TIMEOUT': '요청 시간이 초과되었습니다. 다시 시도해주세요.',
    'RATE_LIMIT': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    'SERVER_ERROR': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    'VALIDATION_ERROR': '입력 정보를 확인해주세요.',
    'NOT_FOUND': '요청한 정보를 찾을 수 없습니다.',
    'FORBIDDEN': '접근 권한이 없습니다.',
    'UNAUTHORIZED': '인증이 필요합니다. 다시 로그인해주세요.'
  };
  
  // HTTP 상태 코드별 메시지
  if (error?.status) {
    const statusMap: Record<number, string> = {
      400: '잘못된 요청입니다. 입력 정보를 확인해주세요.',
      401: '로그인이 필요합니다. 다시 로그인해주세요.',
      403: '접근 권한이 없습니다.',
      404: '요청한 정보를 찾을 수 없습니다.',
      429: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
      500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      502: '서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
      503: '서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
      504: '요청 시간이 초과되었습니다. 다시 시도해주세요.'
    };
    
    if (statusMap[error.status]) {
      return statusMap[error.status];
    }
  }
  
  // 에러 메시지에서 키워드 찾기
  for (const [key, message] of Object.entries(errorMap)) {
    if (errorMessage.includes(key) || errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }
  
  // 기본 메시지
  return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

/**
 * 에러 로깅 및 사용자 알림
 */
export function logAndNotifyError(error: any, context: string = 'API 요청') {
  const analysis = analyzeApiError(error);
  const userMessage = getUserFriendlyErrorMessage(error);
  
  // 에러 로깅
  if (analysis.isAuthError) {
    logger.warn(`🔐 ${context} - 인증 오류:`, error);
  } else {
    logger.error(`💥 ${context} - 오류:`, error);
  }
  
  // 사용자에게 알림 (토스트 등)
  // showToast(userMessage, 'error');
  
  return {
    analysis,
    userMessage,
    shouldRetry: analysis.shouldRetry,
    shouldRedirect: analysis.shouldRedirect
  };
}
