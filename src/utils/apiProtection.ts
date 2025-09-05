/**
 * API 무한 호출 방지 및 보안 유틸리티
 */

// API 호출 제한 설정
const API_LIMITS = {
  // 동일한 API 엔드포인트에 대한 호출 제한
  MAX_CALLS_PER_ENDPOINT: 10, // 10분당 최대 호출 수
  TIME_WINDOW: 10 * 60 * 1000, // 10분 (밀리초)
  
  // 전체 API 호출 제한
  MAX_TOTAL_CALLS: 100, // 10분당 최대 총 호출 수
  
  // 재시도 제한
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1초
  
  // 동시 요청 제한
  MAX_CONCURRENT_REQUESTS: 5,
};

// API 호출 추적을 위한 Map
const apiCallTracker = new Map<string, number[]>();
const totalCallTracker: number[] = [];
const activeRequests = new Set<string>();

/**
 * API 호출 제한 검사
 */
export function checkApiLimits(endpoint: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const timeWindow = API_LIMITS.TIME_WINDOW;
  
  // 1. 전체 API 호출 수 제한 검사
  const recentTotalCalls = totalCallTracker.filter(time => now - time < timeWindow);
  if (recentTotalCalls.length >= API_LIMITS.MAX_TOTAL_CALLS) {
    return {
      allowed: false,
      reason: `전체 API 호출 한도 초과 (${API_LIMITS.MAX_TOTAL_CALLS}회/10분)`
    };
  }
  
  // 2. 특정 엔드포인트 호출 수 제한 검사
  const endpointCalls = apiCallTracker.get(endpoint) || [];
  const recentEndpointCalls = endpointCalls.filter(time => now - time < timeWindow);
  
  if (recentEndpointCalls.length >= API_LIMITS.MAX_CALLS_PER_ENDPOINT) {
    return {
      allowed: false,
      reason: `${endpoint} 엔드포인트 호출 한도 초과 (${API_LIMITS.MAX_CALLS_PER_ENDPOINT}회/10분)`
    };
  }
  
  // 3. 동시 요청 수 제한 검사
  if (activeRequests.size >= API_LIMITS.MAX_CONCURRENT_REQUESTS) {
    return {
      allowed: false,
      reason: `동시 요청 한도 초과 (${API_LIMITS.MAX_CONCURRENT_REQUESTS}개)`
    };
  }
  
  return { allowed: true };
}

/**
 * API 호출 기록
 */
export function recordApiCall(endpoint: string): void {
  const now = Date.now();
  
  // 엔드포인트별 호출 기록
  const endpointCalls = apiCallTracker.get(endpoint) || [];
  endpointCalls.push(now);
  apiCallTracker.set(endpoint, endpointCalls);
  
  // 전체 호출 기록
  totalCallTracker.push(now);
  
  // 오래된 기록 정리 (메모리 누수 방지)
  cleanupOldRecords();
}

/**
 * 활성 요청 추적 시작
 */
export function startRequestTracking(requestId: string): void {
  activeRequests.add(requestId);
}

/**
 * 활성 요청 추적 종료
 */
export function endRequestTracking(requestId: string): void {
  activeRequests.delete(requestId);
}

/**
 * 오래된 기록 정리
 */
function cleanupOldRecords(): void {
  const now = Date.now();
  const timeWindow = API_LIMITS.TIME_WINDOW;
  
  // 엔드포인트별 기록 정리
  for (const [endpoint, calls] of apiCallTracker.entries()) {
    const recentCalls = calls.filter(time => now - time < timeWindow);
    if (recentCalls.length === 0) {
      apiCallTracker.delete(endpoint);
    } else {
      apiCallTracker.set(endpoint, recentCalls);
    }
  }
  
  // 전체 기록 정리
  const recentTotalCalls = totalCallTracker.filter(time => now - time < timeWindow);
  totalCallTracker.splice(0, totalCallTracker.length, ...recentTotalCalls);
}

/**
 * 고유 요청 ID 생성
 */
export function generateRequestId(endpoint: string): string {
  return `${endpoint}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * API 호출 제한 상태 조회
 */
export function getApiLimitStatus(): {
  totalCalls: number;
  endpointCalls: Record<string, number>;
  activeRequests: number;
  limits: typeof API_LIMITS;
} {
  const now = Date.now();
  const timeWindow = API_LIMITS.TIME_WINDOW;
  
  const recentTotalCalls = totalCallTracker.filter(time => now - time < timeWindow);
  const endpointCalls: Record<string, number> = {};
  
  for (const [endpoint, calls] of apiCallTracker.entries()) {
    const recentCalls = calls.filter(time => now - time < timeWindow);
    endpointCalls[endpoint] = recentCalls.length;
  }
  
  return {
    totalCalls: recentTotalCalls.length,
    endpointCalls,
    activeRequests: activeRequests.size,
    limits: API_LIMITS
  };
}

/**
 * API 호출 제한 초기화 (테스트용)
 */
export function resetApiLimits(): void {
  apiCallTracker.clear();
  totalCallTracker.splice(0, totalCallTracker.length);
  activeRequests.clear();
}

/**
 * 안전한 API 호출 래퍼
 */
export async function safeApiCall<T>(
  endpoint: string,
  apiFunction: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onLimitExceeded?: (reason: string) => void;
  } = {}
): Promise<{ success: boolean; data?: T; error?: string; limited?: boolean }> {
  const {
    maxRetries = API_LIMITS.MAX_RETRIES,
    retryDelay = API_LIMITS.RETRY_DELAY,
    onLimitExceeded
  } = options;
  
  // API 호출 제한 검사
  const limitCheck = checkApiLimits(endpoint);
  if (!limitCheck.allowed) {
    console.warn(`🚫 API 호출 제한: ${limitCheck.reason}`);
    onLimitExceeded?.(limitCheck.reason!);
    return {
      success: false,
      error: limitCheck.reason,
      limited: true
    };
  }
  
  const requestId = generateRequestId(endpoint);
  startRequestTracking(requestId);
  recordApiCall(endpoint);
  
  try {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await apiFunction();
        return { success: true, data: result };
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          console.warn(`🔄 API 재시도 ${attempt + 1}/${maxRetries}: ${endpoint}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    return {
      success: false,
      error: lastError?.message || 'API 호출 실패'
    };
  } finally {
    endRequestTracking(requestId);
  }
}

/**
 * useEffect 무한 루프 방지 훅
 */
export function useApiCallProtection() {
  const callCountRef = useRef<Map<string, number>>(new Map());
  const lastCallTimeRef = useRef<Map<string, number>>(new Map());
  
  const canMakeApiCall = useCallback((key: string, maxCalls: number = 5, timeWindow: number = 30000) => {
    const now = Date.now();
    const callCount = callCountRef.current.get(key) || 0;
    const lastCallTime = lastCallTimeRef.current.get(key) || 0;
    
    // 시간 윈도우가 지났으면 카운트 리셋
    if (now - lastCallTime > timeWindow) {
      callCountRef.current.set(key, 0);
      lastCallTimeRef.current.set(key, now);
      return true;
    }
    
    // 호출 횟수 제한 검사
    if (callCount >= maxCalls) {
      console.warn(`🚫 API 호출 제한: ${key} (${maxCalls}회/${timeWindow/1000}초)`);
      return false;
    }
    
    // 호출 기록 업데이트
    callCountRef.current.set(key, callCount + 1);
    lastCallTimeRef.current.set(key, now);
    
    return true;
  }, []);
  
  const resetApiCallCount = useCallback((key: string) => {
    callCountRef.current.delete(key);
    lastCallTimeRef.current.delete(key);
  }, []);
  
  return { canMakeApiCall, resetApiCallCount };
}

// React import (useRef, useCallback)
import { useRef, useCallback } from 'react';
