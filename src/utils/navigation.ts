import { useRouter } from "next/navigation";
import { useCallback, useRef, useEffect } from "react";

// 브라우저 히스토리와 완전 동기화된 네비게이션 훅
export function useSimpleNavigation() {
  const router = useRouter();
  const navigationHistory = useRef<string[]>([]);
  const currentPath = useRef<string>('');
  const isInitialized = useRef(false);

  // 브라우저 히스토리와 동기화
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized.current) {
      // 초기화 시 현재 URL을 히스토리에 추가
      const currentUrl = window.location.pathname + window.location.search;
      currentPath.current = currentUrl;
      
      // 브라우저 히스토리 상태에 커스텀 데이터 추가
      if (window.history.state === null) {
        window.history.replaceState(
          { 
            customHistory: [currentUrl],
            timestamp: Date.now()
          }, 
          '', 
          currentUrl
        );
      }
      
      isInitialized.current = true;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 네비게이션 초기화 완료:', {
          currentUrl,
          browserHistoryLength: window.history.length,
          customHistory: window.history.state?.customHistory
        });
      }
    }
  }, []);

  // 현재 경로 추적
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname + window.location.search;
      if (path !== currentPath.current) {
        // 새로운 경로인 경우에만 히스토리에 추가
        if (currentPath.current && !navigationHistory.current.includes(path)) {
          navigationHistory.current.push(currentPath.current);
          
          // 세션 스토리지에 히스토리 저장
          try {
            sessionStorage.setItem('navigationHistory', JSON.stringify(navigationHistory.current));
            if (process.env.NODE_ENV === 'development') {
              console.log('💾 네비게이션 히스토리 세션 스토리지에 저장:', navigationHistory.current);
            }
          } catch (error) {
            console.error('네비게이션 히스토리 저장 실패:', error);
          }
        }
        currentPath.current = path;
      }
    }
  });

  // 페이지 이동 (브라우저 히스토리와 동기화)
  const navigate = useCallback((path: string) => {
    if (currentPath.current && currentPath.current !== path) {
      // 현재 경로를 커스텀 히스토리에 추가
      navigationHistory.current.push(currentPath.current);
      
      // 브라우저 히스토리 상태 업데이트
      try {
        const currentState = window.history.state || {};
        const customHistory = currentState.customHistory || [];
        
        // 새 경로 추가
        const newCustomHistory = [...customHistory, currentPath.current];
        
        // 브라우저 히스토리에 커스텀 데이터 저장
        window.history.replaceState(
          { 
            ...currentState,
            customHistory: newCustomHistory,
            timestamp: Date.now()
          }, 
          '', 
          currentPath.current
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log('💾 브라우저 히스토리와 동기화:', {
            currentPath: currentPath.current,
            customHistory: newCustomHistory,
            browserHistoryLength: window.history.length
          });
        }
      } catch (error) {
        console.error('브라우저 히스토리 동기화 실패:', error);
      }
    }
    
    // 새 경로로 이동
    router.push(path);
    currentPath.current = path;
  }, [router]);

  // 스마트 뒤로가기 (브라우저 히스토리 우선)
  const goBack = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔙 뒤로가기 시도:', {
        currentPath: currentPath.current,
        navigationHistory: navigationHistory.current,
        browserHistoryLength: window.history.length,
        browserState: window.history.state
      });
    }
    
    // 1. 브라우저 히스토리 상태에서 커스텀 히스토리 확인
    try {
      const currentState = window.history.state;
      if (currentState?.customHistory && currentState.customHistory.length > 1) {
        const customHistory = currentState.customHistory;
        const previousPath = customHistory[customHistory.length - 2]; // 현재 경로의 이전 경로
        
        if (previousPath && previousPath !== currentPath.current) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔙 브라우저 히스토리 상태에서 커스텀 히스토리 사용:', previousPath);
          }
          
          // 커스텀 히스토리 업데이트
          const newCustomHistory = customHistory.slice(0, -1); // 마지막 경로 제거
          window.history.replaceState(
            { 
              ...currentState,
              customHistory: newCustomHistory,
              timestamp: Date.now()
            }, 
            '', 
            currentPath.current
          );
          
          // 이전 경로로 이동
          router.push(previousPath);
          currentPath.current = previousPath;
          return;
        }
      }
    } catch (error) {
      console.error('브라우저 히스토리 상태 확인 실패:', error);
    }
    
    // 2. 메모리 기반 커스텀 히스토리 확인
    if (navigationHistory.current.length > 0) {
      const previousPath = navigationHistory.current.pop();
      if (previousPath && previousPath !== currentPath.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔙 메모리 기반 커스텀 히스토리 사용:', previousPath);
        }
        router.push(previousPath);
        currentPath.current = previousPath;
        return;
      }
    }
    
    // 3. 브라우저 기본 뒤로가기
    if (window.history.length > 1) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔙 브라우저 기본 뒤로가기 사용');
      }
      router.back();
    } else {
      // 모든 히스토리가 없으면 홈으로 이동
      if (process.env.NODE_ENV === 'development') {
        console.log('🔙 모든 히스토리 없음, 홈으로 이동');
      }
      router.push('/');
    }
  }, [router]);

  // 페이지 교체 (히스토리에 추가하지 않음)
  const replace = useCallback((path: string) => {
    router.replace(path);
    currentPath.current = path;
  }, [router]);

  // 특정 경로로 직접 이동 (히스토리 변경 없음)
  const goTo = useCallback((path: string) => {
    router.push(path);
    currentPath.current = path;
  }, [router]);

  // 홈으로 이동
  const goHome = useCallback(() => {
    router.push('/');
    currentPath.current = '/';
    navigationHistory.current = []; // 홈으로 가면 히스토리 초기화
    
    // 브라우저 히스토리 상태도 초기화
    try {
      window.history.replaceState(
        { 
          customHistory: ['/'],
          timestamp: Date.now()
        }, 
        '', 
        '/'
      );
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ 홈 이동으로 모든 히스토리 초기화');
      }
    } catch (error) {
      console.error('브라우저 히스토리 초기화 실패:', error);
    }
  }, [router]);

  return {
    navigate,
    goBack,
    replace,
    goTo,
    goHome,
    getCurrentPath: () => currentPath.current,
    getNavigationHistory: () => [...navigationHistory.current],
  };
} 