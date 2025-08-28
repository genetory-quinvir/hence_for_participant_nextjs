/**
 * 소셜 로그인 시 상황별 리다이렉트 URL을 결정하는 유틸리티
 */

export interface RedirectContext {
  currentUrl: string;
  referrer?: string;
  userAgent?: string;
  isMobile?: boolean;
}

/**
 * 소셜 로그인 후 리다이렉트할 URL을 결정합니다.
 * @param redirectUrl - 명시적으로 전달된 리다이렉트 URL
 * @param context - 현재 컨텍스트 정보
 * @returns 최종 리다이렉트 URL
 */
export function determineSocialLoginRedirect(
  redirectUrl: string | null,
  context: RedirectContext
): string {
  // 1. 명시적으로 전달된 리다이렉트 URL이 있으면 우선 사용
  if (redirectUrl) {
    console.log('명시적 리다이렉트 URL 사용:', redirectUrl);
    return redirectUrl;
  }

  // 2. 현재 URL 분석
  const currentUrl = context.currentUrl;
  
  // 이벤트 페이지에서 온 경우
  if (currentUrl.includes('/event')) {
    console.log('이벤트 페이지에서 온 경우 - 이벤트 페이지로 리다이렉트');
    return currentUrl;
  }
  
  // 프로필 페이지에서 온 경우
  if (currentUrl.includes('/profile')) {
    console.log('프로필 페이지에서 온 경우 - 프로필 페이지로 리다이렉트');
    return '/profile';
  }
  
  // 설정 페이지에서 온 경우
  if (currentUrl.includes('/settings')) {
    console.log('설정 페이지에서 온 경우 - 설정 페이지로 리다이렉트');
    return '/settings';
  }
  
  // 투표 페이지에서 온 경우
  if (currentUrl.includes('/vote')) {
    console.log('투표 페이지에서 온 경우 - 투표 페이지로 리다이렉트');
    return currentUrl;
  }
  
  // 래플 페이지에서 온 경우
  if (currentUrl.includes('/raffle')) {
    console.log('래플 페이지에서 온 경우 - 래플 페이지로 리다이렉트');
    return '/raffle';
  }
  
  // 타임라인 페이지에서 온 경우
  if (currentUrl.includes('/timeline')) {
    console.log('타임라인 페이지에서 온 경우 - 타임라인 페이지로 리다이렉트');
    return currentUrl;
  }
  
  // 푸드트럭 페이지에서 온 경우
  if (currentUrl.includes('/foodtrucks')) {
    console.log('푸드트럭 페이지에서 온 경우 - 푸드트럭 페이지로 리다이렉트');
    return currentUrl;
  }
  
  // 게시판 페이지에서 온 경우
  if (currentUrl.includes('/board')) {
    console.log('게시판 페이지에서 온 경우 - 게시판 페이지로 리다이렉트');
    return currentUrl;
  }
  
  // QR 페이지에서 온 경우
  if (currentUrl.includes('/qr')) {
    console.log('QR 페이지에서 온 경우 - 메인 페이지로 리다이렉트');
    return '/';
  }
  
  // 참가자 목록 페이지에서 온 경우
  if (currentUrl.includes('/participants')) {
    console.log('참가자 목록 페이지에서 온 경우 - 참가자 목록 페이지로 리다이렉트');
    return currentUrl;
  }

  // 3. 기본값: 메인 페이지
  console.log('기본값 - 메인 페이지로 리다이렉트');
  return '/';
}

/**
 * 소셜 로그인 URL에 리다이렉트 파라미터를 추가합니다.
 * @param baseUrl - 기본 소셜 로그인 URL
 * @param redirectUrl - 리다이렉트할 URL
 * @returns 리다이렉트 파라미터가 추가된 URL
 */
export function addRedirectToSocialLoginUrl(
  baseUrl: string,
  redirectUrl: string | null
): string {
  if (!redirectUrl) {
    return baseUrl;
  }
  
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}clientRedirect=${encodeURIComponent(redirectUrl)}`;
}

/**
 * 현재 페이지의 컨텍스트 정보를 수집합니다.
 * @returns RedirectContext 객체
 */
export function getCurrentRedirectContext(): RedirectContext {
  return {
    currentUrl: window.location.pathname + window.location.search,
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  };
}
