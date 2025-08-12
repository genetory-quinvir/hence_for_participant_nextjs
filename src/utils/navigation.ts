import { useRouter } from "next/navigation";

// 네비게이션 히스토리 관리
export class NavigationManager {
  private static readonly HISTORY_KEY = 'navigationHistory';
  private static readonly MAX_HISTORY = 10;

  // 현재 페이지를 히스토리에 추가
  static addToHistory(path: string) {
    try {
      const history = this.getHistory();
      
      // 마지막 페이지와 같으면 추가하지 않음
      if (history.length > 0 && history[history.length - 1] === path) {
        console.log(`📝 히스토리 중복 방지: ${path}`);
        return;
      }

      // 새 페이지 추가
      history.push(path);
      console.log(`📝 히스토리 추가: ${path} (총 ${history.length}개)`);
      
      // 최대 개수 제한
      if (history.length > this.MAX_HISTORY) {
        const removed = history.shift();
        console.log(`🗑️ 히스토리 제거: ${removed}`);
      }

      sessionStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Navigation history 저장 실패:', error);
    }
  }

  // 히스토리에서 이전 페이지 가져오기
  static getPreviousPage(): string | null {
    try {
      const history = this.getHistory();
      const previousPage = history.length > 1 ? history[history.length - 2] : null;
      console.log(`🔍 이전 페이지 조회: ${previousPage} (히스토리: ${history.join(' → ')})`);
      return previousPage;
    } catch (error) {
      console.error('Navigation history 읽기 실패:', error);
      return null;
    }
  }

  // 히스토리에서 특정 페이지까지 제거
  static removeFromHistory(path: string) {
    try {
      const history = this.getHistory();
      const index = history.indexOf(path);
      if (index !== -1) {
        history.splice(index);
        sessionStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
      }
    } catch (error) {
      console.error('Navigation history 제거 실패:', error);
    }
  }

  // 히스토리 초기화
  static clearHistory() {
    try {
      sessionStorage.removeItem(this.HISTORY_KEY);
    } catch (error) {
      console.error('Navigation history 초기화 실패:', error);
    }
  }

  // 히스토리 가져오기
  private static getHistory(): string[] {
    try {
      const history = sessionStorage.getItem(this.HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Navigation history 파싱 실패:', error);
      return [];
    }
  }
}

// 네비게이션 훅
export function useNavigation() {
  const router = useRouter();

  // 페이지 이동 (히스토리에 추가)
  const navigate = (path: string) => {
    console.log(`🚀 네비게이션: ${window.location.pathname} → ${path}`);
    NavigationManager.addToHistory(path);
    router.push(path);
  };

  // 페이지 교체 (히스토리에 추가하지 않음)
  const replace = (path: string) => {
    console.log(`🔄 교체: ${window.location.pathname} → ${path}`);
    router.replace(path);
  };

  // 뒤로가기
  const goBack = (fallbackPath: string = '/') => {
    const previousPage = NavigationManager.getPreviousPage();
    console.log(`⬅️ 뒤로가기: ${window.location.pathname} → ${previousPage || fallbackPath}`);
    
    if (previousPage) {
      // 이전 페이지로 이동
      router.push(previousPage);
      // 현재 페이지를 히스토리에서 제거
      NavigationManager.removeFromHistory(window.location.pathname);
    } else {
      // 이전 페이지가 없으면 fallback으로 이동
      router.push(fallbackPath);
    }
  };

  // 특정 페이지로 이동 (히스토리 정리)
  const goTo = (path: string, clearHistory: boolean = false) => {
    if (clearHistory) {
      NavigationManager.clearHistory();
    }
    NavigationManager.addToHistory(path);
    router.push(path);
  };

  return {
    navigate,
    replace,
    goBack,
    goTo,
  };
}

// 페이지별 뒤로가기 로직
export const getBackNavigation = (currentPath: string): string => {
  const previousPage = NavigationManager.getPreviousPage();
  
  if (!previousPage) {
    return '/';
  }

  // 특정 페이지별 처리
  switch (currentPath) {
    case '/settings':
      // 설정에서 뒤로가기
      if (previousPage.startsWith('/profile')) {
        return '/profile';
      }
      break;
      
    case '/profile/edit':
      // 프로필 편집에서 뒤로가기
      return '/profile';
      
    case '/board/write':
      // 글쓰기에서 뒤로가기
      if (previousPage.includes('/board/list')) {
        return previousPage;
      }
      break;
  }

  return previousPage;
}; 