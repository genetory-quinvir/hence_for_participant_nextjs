"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { saveTokens, socialLoginOrRegister } from "@/lib/api";

// Google Analytics 타입 정의
declare global {
  interface Window {
    dataLayer: any[];
    __dlAuthFired?: boolean;
  }
}

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // 중복 실행 방지
    if (!isProcessing) {
      return;
    }

    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const provider = searchParams.get('provider');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const clientRedirectUrl = searchParams.get('clientRedirect');

        if (!code || !provider) {
          console.error('❌ 필수 파라미터 누락:', { code: !!code, provider: !!provider });
          const nextUrl = searchParams.get('clientRedirect') || '/';
          document.body.style.display = 'none';
          window.location.replace(nextUrl);
          return;
        }

        // 1단계: 외부 API로 인증 검증
        const verifyResponse = await fetch(`https://api.hence.events/api/v1/auth/social/verify/${code}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            provider: provider.toUpperCase(),
            isNewUser
          }),
        });

        if (!verifyResponse.ok) {
          const errorText = await verifyResponse.text();
          console.error('❌ 인증 검증 실패:', { status: verifyResponse.status, error: errorText });
          const nextUrl = searchParams.get('clientRedirect') || '/';
          document.body.style.display = 'none';
          window.location.replace(nextUrl);
          return;
        }

        const verifyResult = await verifyResponse.json();
        console.log('verifyResult:', verifyResult);

        // 2단계: verify 결과에서 사용자 정보 추출하여 로그인/회원가입 처리
        const userData = verifyResult.data?.user || verifyResult.user;
        console.log('userData:', userData);
        
        if (!userData) {
          console.error('❌ userData가 없습니다');
          const nextUrl = searchParams.get('clientRedirect') || '/';
          document.body.style.display = 'none';
          window.location.replace(nextUrl);
          return;
        }
        
        const userEmail = userData.email;
        const userId = userData.id;
        const userProvider = userData.provider;
        const userName = userData.name;
        const userNickname = userData.nickname;

        console.log('추출된 사용자 정보:', { userEmail, userId, userProvider, userName, userNickname });

        if (!userEmail || !userId || !userProvider) {
          console.error('❌ 필수 사용자 정보가 누락되었습니다:', { userEmail: !!userEmail, userId: !!userId, userProvider: !!userProvider });
          const nextUrl = searchParams.get('clientRedirect') || '/';
          document.body.style.display = 'none';
          window.location.replace(nextUrl);
          return;
        }

        // 소셜 로그인/회원가입 API 호출
        const loginResult = await socialLoginOrRegister(
          userEmail,
          userProvider,
          userId,
          userName,
          userNickname,
          userData.profileImage || userData.profileImageUrl || null
        );

        if (!loginResult.success) {
          console.error('❌ 소셜 로그인/회원가입 실패:', loginResult.error);
          const nextUrl = searchParams.get('clientRedirect') || '/';
          document.body.style.display = 'none';
          window.location.replace(nextUrl);
          return;
        }

        // 토큰 저장
        if (loginResult.access_token) {
          saveTokens(loginResult.access_token, loginResult.refresh_token);
          // 소셜 로그인 시간 기록 (validateToken 검증 건너뛰기용)
          localStorage.setItem('lastSocialLoginTime', Date.now().toString());
          
          // 사용자 정보도 localStorage에 저장 (AuthContext가 나중에 읽을 수 있도록)
          const finalUserData = {
            id: loginResult.data?.id || userId,
            name: loginResult.data?.name || loginResult.data?.nickname || userName || '사용자',
            nickname: loginResult.data?.nickname || loginResult.data?.name || userNickname || '사용자',
            email: loginResult.data?.email || userEmail,
            profileImage: loginResult.data?.profileImage || loginResult.data?.profileImageUrl || '',
            provider: userProvider,
            clientRedirectUrl: clientRedirectUrl
          };
          
          localStorage.setItem('user', JSON.stringify(finalUserData));
        }

        // 토큰 저장이 완료될 때까지 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100));

        // 로그인 성공 - 즉시 리다이렉트 (validateToken 검증 없이)
        let nextUrl = clientRedirectUrl || '/';
        
        // URL 검증 및 정규화
        if (nextUrl.startsWith('http')) {
          // 절대 URL인 경우 도메인 부분 제거하고 상대 경로로 변환
          try {
            const url = new URL(nextUrl);
            nextUrl = url.pathname + url.search;
            console.log('절대 URL을 상대 경로로 변환:', { original: clientRedirectUrl, converted: nextUrl });
          } catch (error) {
            console.warn('URL 파싱 실패, 기본 경로 사용:', error);
            nextUrl = '/';
          }
        }
        
        // 상대 경로가 아닌 경우 기본 경로로 설정
        if (!nextUrl.startsWith('/')) {
          nextUrl = '/' + nextUrl;
        }
        
        console.log('✅ 소셜 로그인 성공, 리다이렉트:', {
          clientRedirectUrl,
          finalNextUrl: nextUrl,
          currentPath: window.location.pathname
        });
        
        // 강제 리다이렉트 - 서버 리다이렉트 무시하고 클라이언트에서 처리
        try {
          // 1. 먼저 페이지를 숨김
          document.body.style.display = 'none';
          
          // 2. sessionStorage에서 저장된 리다이렉트 URL 확인
          const savedRedirectUrl = sessionStorage.getItem('socialLoginRedirectUrl');
          if (savedRedirectUrl) {
            console.log('sessionStorage에서 리다이렉트 URL 발견:', savedRedirectUrl);
            sessionStorage.removeItem('socialLoginRedirectUrl'); // 사용 후 제거
            window.location.replace(savedRedirectUrl);
            return;
          }
          
          // 3. clientRedirect 파라미터 사용
          if (clientRedirectUrl) {
            console.log('clientRedirect 파라미터 사용:', clientRedirectUrl);
            window.location.replace(clientRedirectUrl);
            return;
          }
          
          // 4. 기본 리다이렉트
          console.log('기본 리다이렉트:', nextUrl);
          window.location.replace(nextUrl);
          
        } catch (error) {
          console.error('리다이렉트 실패:', error);
          // 마지막 수단
          window.location.href = nextUrl;
        }
        
      } catch (error) {
        // 에러 발생 - 디버깅을 위해 에러 화면 표시
        console.error('💥 소셜 로그인 처리 중 에러 발생:', error);
        console.error('💥 에러 스택:', error instanceof Error ? error.stack : 'No stack trace');
        console.error('💥 현재 URL:', window.location.href);
        console.error('💥 현재 경로:', window.location.pathname);
        console.error('💥 URL 파라미터:', Object.fromEntries(new URLSearchParams(window.location.search)));
        
        // registerParticipant 관련 에러는 무시 (이미 참여 중인 경우)
        if (error instanceof Error && 
            (error.message.includes('participants') || 
             error.message.includes('400') || 
             error.message.includes('Bad Request'))) {
          console.log('ℹ️ registerParticipant 관련 에러 무시, 로그인 성공으로 처리');
          // 로그인 성공으로 처리하고 리다이렉트
          document.body.style.display = 'none';
          
          // sessionStorage에서 저장된 리다이렉트 URL 확인
          const savedRedirectUrl = sessionStorage.getItem('socialLoginRedirectUrl');
          if (savedRedirectUrl) {
            console.log('에러 처리 - sessionStorage에서 리다이렉트 URL 발견:', savedRedirectUrl);
            sessionStorage.removeItem('socialLoginRedirectUrl');
            window.location.replace(savedRedirectUrl);
            return;
          }
          
          const nextUrl = searchParams.get('clientRedirect') || '/';
          window.location.replace(nextUrl);
          return;
        }
        
        // 에러 발생 시에도 우선순위에 따라 리다이렉트
        console.log('⚠️ 소셜 로그인 에러 발생, 리다이렉트:', error);
        document.body.style.display = 'none';
        
        // sessionStorage에서 저장된 리다이렉트 URL 확인
        const savedRedirectUrl = sessionStorage.getItem('socialLoginRedirectUrl');
        if (savedRedirectUrl) {
          console.log('에러 처리 - sessionStorage에서 리다이렉트 URL 발견:', savedRedirectUrl);
          sessionStorage.removeItem('socialLoginRedirectUrl');
          window.location.replace(savedRedirectUrl);
          return;
        }
        
        const nextUrl = searchParams.get('clientRedirect') || '/';
        window.location.replace(nextUrl);
      }
    };

    processCallback();
  }, [searchParams, isProcessing]);



  // 로딩 화면만 표시 (성공/실패 시 자동 리다이렉트)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return (
    <div 
      className="min-h-screen text-black flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="text-center max-w-sm mx-auto">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        </div>
        <div className={`${isMobile ? 'text-xl' : 'text-lg'} mb-4 font-medium text-white`}>
          로그인 처리 중...
        </div>
        <div className={`${isMobile ? 'text-base' : 'text-sm'} text-white leading-relaxed`} style={{ opacity: 0.8 }}>
          소셜 로그인을 처리하고 있습니다.<br />
          잠시만 기다려주세요.
        </div>
        {isMobile && (
          <div className="mt-6 text-xs text-white" style={{ opacity: 0.6 }}>
            자동으로 페이지가 이동됩니다
          </div>
        )}
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function AuthCallbackLoading() {
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return (
    <div 
      className="min-h-screen text-black flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="text-center max-w-sm mx-auto">
        <div className="mb-6">
          <div className={`animate-spin rounded-full border-b-2 border-white mx-auto mb-4 ${isMobile ? 'h-12 w-12' : 'h-8 w-8'}`}></div>
        </div>
        <p className={`${isMobile ? 'text-lg' : 'text-sm'} font-medium text-white`} style={{ opacity: 0.8 }}>
          인증 처리 중...
        </p>
        {isMobile && (
          <p className="text-xs text-white mt-2" style={{ opacity: 0.6 }}>
            잠시만 기다려주세요
          </p>
        )}
      </div>
    </div>
  );
}

// 메인 컴포넌트
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  );
}