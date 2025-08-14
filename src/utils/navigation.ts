import { useRouter } from "next/navigation";

// 단순한 네비게이션 관리
export class SimpleNavigation {
  private static readonly HISTORY_KEY = 'simpleNavigationHistory';
  private static readonly MAX_HISTORY = 5; // 최대 5개만 유지

  // 페이지 이동 시 히스토리에 추가
  static addPage(path: string) {
    try {
      const history = this.getHistory();
      
      // 마지막 페이지와 같으면 추가하지 않음
      if (history.length > 0 && history[history.length - 1] === path) {
        console.log(`⏭️ 중복 페이지 무시: ${path}`);
        return;
      }

      // 연속된 같은 페이지 패턴 방지 (예: /profile → /profile/edit → /profile)
      if (history.length >= 2) {
        const lastPage = history[history.length - 1];
        const secondLastPage = history[history.length - 2];
        
        // /profile → /profile/edit → /profile 패턴 감지
        if (lastPage === '/profile/edit' && path === '/profile' && secondLastPage === '/profile') {
          console.log(`🔄 프로필 편집 패턴 감지 - /profile/edit 제거`);
          history.pop(); // /profile/edit 제거
          sessionStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
          return;
        }
      }

      // 새 페이지 추가
      history.push(path);
      
      // 최대 개수 제한
      if (history.length > this.MAX_HISTORY) {
        history.shift();
      }

      sessionStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
      console.log(`📝 페이지 추가: ${path} (히스토리: ${history.join(' → ')})`);
    } catch (error) {
      console.error('히스토리 저장 실패:', error);
    }
  }

  // 이전 페이지 가져오기
  static getPreviousPage(): string | null {
    try {
      const history = this.getHistory();
      console.log(`🔍 현재 히스토리: ${history.join(' → ')}`);
      
      // 히스토리에 2개 이상의 페이지가 있어야 이전 페이지가 있음
      if (history.length >= 2) {
        const previousPage = history[history.length - 2];
        console.log(`🔍 이전 페이지: ${previousPage}`);
        return previousPage;
      }
      
      console.log(`🔍 이전 페이지 없음 (히스토리 길이: ${history.length})`);
      return null;
    } catch (error) {
      console.error('히스토리 읽기 실패:', error);
      return null;
    }
  }

  // 현재 페이지 제거 (뒤로가기 시)
  static removeCurrentPage() {
    try {
      const history = this.getHistory();
      if (history.length > 0) {
        history.pop();
        sessionStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
        console.log(`🗑️ 현재 페이지 제거 (남은 히스토리: ${history.join(' → ')})`);
      }
    } catch (error) {
      console.error('현재 페이지 제거 실패:', error);
    }
  }

  // 히스토리 초기화
  static clearHistory() {
    try {
      sessionStorage.removeItem(this.HISTORY_KEY);
      console.log('🧹 히스토리 초기화');
    } catch (error) {
      console.error('히스토리 초기화 실패:', error);
    }
  }

  // 히스토리 가져오기
  private static getHistory(): string[] {
    try {
      const history = sessionStorage.getItem(this.HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('히스토리 파싱 실패:', error);
      return [];
    }
  }
}

// 단순한 네비게이션 훅
export function useSimpleNavigation() {
  const router = useRouter();

  // 페이지 이동
  const navigate = (path: string) => {
    console.log(`🚀 이동: ${window.location.pathname} → ${path}`);
    SimpleNavigation.addPage(path);
    router.push(path);
  };

  // 뒤로가기
  const goBack = (fallbackPath: string = '/') => {
    // 먼저 이전 페이지를 가져옴
    const previousPage = SimpleNavigation.getPreviousPage();
    
    if (previousPage) {
      console.log(`⬅️ 뒤로가기: ${window.location.pathname} → ${previousPage}`);
      // 현재 페이지를 히스토리에서 제거
      SimpleNavigation.removeCurrentPage();
      // 이전 페이지로 이동
      router.push(previousPage);
    } else {
      console.log(`⬅️ 뒤로가기: ${window.location.pathname} → ${fallbackPath} (fallback)`);
      router.push(fallbackPath);
    }
  };

  // 페이지 교체 (히스토리에 추가하지 않음)
  const replace = (path: string) => {
    console.log(`🔄 교체: ${window.location.pathname} → ${path}`);
    router.replace(path);
  };

  return {
    navigate,
    goBack,
    replace,
  };
} 