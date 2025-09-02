import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 보안 헤더 설정
  if (process.env.NODE_ENV === 'production') {
    // X-Frame-Options: 클릭재킹 공격 방지
    response.headers.set('X-Frame-Options', 'DENY');
    
    // X-Content-Type-Options: MIME 타입 스니핑 방지
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    // X-XSS-Protection: XSS 공격 방지 (레거시 브라우저 지원)
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    // Referrer-Policy: 리퍼러 정보 제어
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions-Policy: 브라우저 기능 제어
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  } else {
    // 개발 모드에서는 기본 보안 헤더만 설정
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
  }

  return response;
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
