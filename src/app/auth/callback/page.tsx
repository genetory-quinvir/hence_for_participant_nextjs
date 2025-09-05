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
          window.location.replace('/sign');
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
          window.location.replace('/sign');
          return;
        }

        const verifyResult = await verifyResponse.json();

        // 2단계: verify 결과에서 사용자 정보 추출하여 로그인/회원가입 처리
        const userData = verifyResult.data.user;
        const userEmail = userData.email;
        const userId = userData.id;
        const userProvider = userData.provider;
        const userName = userData.name;
        const userNickname = userData.nickname;

        if (!userEmail || !userId || !userProvider) {
          window.location.replace('/sign');
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
          window.location.replace('/sign');
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
        
        login(
          finalUserData,
          loginResult.access_token || '',
          loginResult.refresh_token || ''
        );

        // 로그인 성공 - 자동으로 리다이렉트
        const nextUrl = clientRedirectUrl || '/';
        window.location.replace(nextUrl);
        
      } catch (error) {
        // 로그인 실패 - 자동으로 로그인 페이지로 리다이렉트
        window.location.replace('/sign');
      }
    };

    processCallback();
  }, [searchParams, login, isProcessing]);


  // 로딩 화면만 표시 (성공/실패 시 자동 리다이렉트)
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-lg mb-4">로그인 처리 중...</div>
        <div className="text-sm text-gray-600">
          소셜 로그인을 처리하고 있습니다. 잠시만 기다려주세요.
        </div>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function AuthCallbackLoading() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>인증 처리 중...</p>
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