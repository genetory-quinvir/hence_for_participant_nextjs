"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
  const { login } = useAuth();
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
          // 사파리/모바일 전용 리다이렉트
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (isSafari || isMobile) {
            setTimeout(() => window.location.href = '/sign', 100);
          } else {
            window.location.replace('/sign');
          }
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
          // 사파리/모바일 전용 리다이렉트
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (isSafari || isMobile) {
            setTimeout(() => window.location.href = '/sign', 100);
          } else {
            window.location.replace('/sign');
          }
          return;
        }

        const verifyResult = await verifyResponse.json();
        console.log('verifyResult:', verifyResult);

        // 2단계: verify 결과에서 사용자 정보 추출하여 로그인/회원가입 처리
        const userData = verifyResult.data?.user || verifyResult.user;
        console.log('userData:', userData);
        
        if (!userData) {
          console.log('userData가 없습니다');
          // 사파리/모바일 전용 리다이렉트
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (isSafari || isMobile) {
            setTimeout(() => window.location.href = '/sign', 100);
          } else {
            window.location.replace('/sign');
          }
          return;
        }
        
        const userEmail = userData.email;
        const userId = userData.id;
        const userProvider = userData.provider;
        const userName = userData.name;
        const userNickname = userData.nickname;

        console.log('추출된 사용자 정보:', { userEmail, userId, userProvider, userName, userNickname });

        if (!userEmail || !userId || !userProvider) {
          console.log('필수 사용자 정보가 누락되었습니다:', { userEmail: !!userEmail, userId: !!userId, userProvider: !!userProvider });
          // 사파리/모바일 전용 리다이렉트
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (isSafari || isMobile) {
            setTimeout(() => window.location.href = '/sign', 100);
          } else {
            window.location.replace('/sign');
          }
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
          // 사파리/모바일 전용 리다이렉트
          const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          
          if (isSafari || isMobile) {
            setTimeout(() => window.location.href = '/sign', 100);
          } else {
            window.location.replace('/sign');
          }
          return;
        }

        // 토큰 저장
        if (loginResult.access_token) {
          saveTokens(loginResult.access_token, loginResult.refresh_token);
        }

        // AuthContext에 로그인 상태 업데이트
        const finalUserData = {
          id: loginResult.data?.id || userId,
          name: loginResult.data?.name || loginResult.data?.nickname || userName || '사용자',
          nickname: loginResult.data?.nickname || loginResult.data?.name || userNickname || '사용자',
          email: loginResult.data?.email || userEmail,
          profileImage: loginResult.data?.profileImage || loginResult.data?.profileImageUrl || '',
          provider: userProvider,
          clientRedirectUrl: clientRedirectUrl
        };
        
        // 로그인 상태 업데이트 (validateToken을 거치지 않음)
        login(
          finalUserData,
          loginResult.access_token || '',
          loginResult.refresh_token || ''
        );

        // 로그인 성공 - 즉시 리다이렉트 (validateToken 검증 없이)
        const nextUrl = clientRedirectUrl || '/';
        console.log('✅ 소셜 로그인 성공, 리다이렉트:', nextUrl);
        
        // 사파리/모바일 전용 리다이렉트 로직
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        console.log('브라우저 감지:', { isSafari, isMobile, userAgent: navigator.userAgent });
        
        if (isSafari || isMobile) {
          // 사파리/모바일: 강제 페이지 이동
          console.log('사파리/모바일 리다이렉트 시작');
          
          // 1. 즉시 시도
          setTimeout(() => {
            console.log('사파리/모바일 즉시 리다이렉트:', nextUrl);
            window.location.href = nextUrl;
          }, 100);
          
          // 2. 백업 리다이렉트 (더 긴 지연)
          setTimeout(() => {
            if (window.location.pathname === '/auth/callback') {
              console.log('사파리/모바일 백업 리다이렉트:', nextUrl);
              window.location.href = nextUrl;
            }
          }, 2000);
          
          // 3. 최종 백업 (매우 긴 지연)
          setTimeout(() => {
            if (window.location.pathname === '/auth/callback') {
              console.log('사파리/모바일 최종 백업 리다이렉트:', nextUrl);
              window.location.href = nextUrl;
            }
          }, 5000);
        } else {
          // 기존 웹브라우저: 기존 로직 유지
          console.log('웹브라우저 리다이렉트:', nextUrl);
          window.location.replace(nextUrl);
        }
        
      } catch (error) {
        // 로그인 실패 - 자동으로 로그인 페이지로 리다이렉트
        // 사파리/모바일 전용 리다이렉트
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isSafari || isMobile) {
          setTimeout(() => window.location.href = '/sign', 100);
        } else {
          window.location.replace('/sign');
        }
      }
    };

    processCallback();
  }, [searchParams, login, isProcessing]);


  // 로딩 화면만 표시 (성공/실패 시 자동 리다이렉트)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-4">
      <div className="text-center max-w-sm mx-auto">
        <div className="mb-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        </div>
        <div className={`${isMobile ? 'text-xl' : 'text-lg'} mb-4 font-medium`}>
          로그인 처리 중...
        </div>
        <div className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-600 leading-relaxed`}>
          소셜 로그인을 처리하고 있습니다.<br />
          잠시만 기다려주세요.
        </div>
        {isMobile && (
          <div className="mt-6 text-xs text-gray-500">
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
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-4">
      <div className="text-center max-w-sm mx-auto">
        <div className="mb-6">
          <div className={`animate-spin rounded-full border-b-2 border-purple-600 mx-auto mb-4 ${isMobile ? 'h-12 w-12' : 'h-8 w-8'}`}></div>
        </div>
        <p className={`${isMobile ? 'text-lg' : 'text-sm'} font-medium`} style={{ opacity: 0.8 }}>
          인증 처리 중...
        </p>
        {isMobile && (
          <p className="text-xs text-gray-500 mt-2">
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