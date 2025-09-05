/**
 * API 호출 무한 루프 방지 훅
 */

import { useRef, useCallback, useEffect } from 'react';
import { useApiCallProtection } from '../utils/apiProtection';

interface UseApiCallOptions {
  maxCalls?: number;
  timeWindow?: number;
  enabled?: boolean;
  dependencies?: any[];
}

/**
 * 안전한 API 호출을 위한 훅
 */
export function useApiCall<T>(
  apiFunction: () => Promise<T>,
  options: UseApiCallOptions = {}
) {
  const {
    maxCalls = 5,
    timeWindow = 30000, // 30초
    enabled = true,
    dependencies = []
  } = options;
  
  const { canMakeApiCall, resetApiCallCount } = useApiCallProtection();
  const hasCalledRef = useRef(false);
  const callKeyRef = useRef(`api_call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  
  const safeApiCall = useCallback(async (): Promise<{ success: boolean; data?: T; error?: string }> => {
    if (!enabled) {
      return { success: false, error: 'API 호출이 비활성화되었습니다.' };
    }
    
    if (!canMakeApiCall(callKeyRef.current, maxCalls, timeWindow)) {
      return { success: false, error: 'API 호출 제한에 도달했습니다.' };
    }
    
    try {
      const result = await apiFunction();
      return { success: true, data: result };
    } catch (error) {
      console.error('API 호출 실패:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'API 호출 중 오류가 발생했습니다.' 
      };
    }
  }, [apiFunction, enabled, canMakeApiCall, maxCalls, timeWindow]);
  
  // 컴포넌트 언마운트 시 호출 카운트 리셋
  useEffect(() => {
    return () => {
      resetApiCallCount(callKeyRef.current);
    };
  }, [resetApiCallCount]);
  
  return { safeApiCall, hasCalled: hasCalledRef.current };
}

/**
 * useEffect에서 안전한 API 호출을 위한 훅
 */
export function useSafeEffect(
  effect: () => void | (() => void),
  dependencies: any[] = [],
  options: {
    maxCalls?: number;
    timeWindow?: number;
    enabled?: boolean;
  } = {}
) {
  const { maxCalls = 3, timeWindow = 10000, enabled = true } = options;
  const { canMakeApiCall, resetApiCallCount } = useApiCallProtection();
  const effectKeyRef = useRef(`effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const hasRunRef = useRef(false);
  
  useEffect(() => {
    if (!enabled) return;
    
    if (!canMakeApiCall(effectKeyRef.current, maxCalls, timeWindow)) {
      console.warn('useEffect 호출 제한에 도달했습니다.');
      return;
    }
    
    hasRunRef.current = true;
    const cleanup = effect();
    
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, dependencies);
  
  // 컴포넌트 언마운트 시 호출 카운트 리셋
  useEffect(() => {
    return () => {
      resetApiCallCount(effectKeyRef.current);
    };
  }, [resetApiCallCount]);
  
  return { hasRun: hasRunRef.current };
}

/**
 * API 호출 상태를 관리하는 훅
 */
export function useApiState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCalledRef = useRef(false);
  
  const execute = useCallback(async (apiFunction: () => Promise<T>) => {
    if (hasCalledRef.current) {
      console.warn('API 호출이 이미 실행되었습니다.');
      return;
    }
    
    hasCalledRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction();
      setData(result);
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API 호출 중 오류가 발생했습니다.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);
  
  const reset = useCallback(() => {
    hasCalledRef.current = false;
    setData(null);
    setError(null);
    setLoading(false);
  }, []);
  
  return {
    data,
    loading,
    error,
    execute,
    reset,
    hasCalled: hasCalledRef.current
  };
}

// React import
import { useState } from 'react';
