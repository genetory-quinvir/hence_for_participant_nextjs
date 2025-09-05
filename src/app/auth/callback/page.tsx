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
          // 모바일/사파리 호환성을 위한 리다이렉트
          try {
            window.location.replace('/sign');
          } catch {
            window.location.href = '/sign';
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
          // 모바일/사파리 호환성을 위한 리다이렉트
          try {
            window.location.replace('/sign');
          } catch {
            window.location.href = '/sign';
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
          // 모바일/사파리 호환성을 위한 리다이렉트
          try {
            window.location.replace('/sign');
          } catch {
            window.location.href = '/sign';
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
          // 모바일/사파리 호환성을 위한 리다이렉트
          try {
            window.location.replace('/sign');
          } catch {
            window.location.href = '/sign';
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
          // 모바일/사파리 호환성을 위한 리다이렉트
          try {
            window.location.replace('/sign');
          } catch {
            window.location.href = '/sign';
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
        
        // 모바일/사파리 호환성을 위한 다중 리다이렉트 시도
        const redirectToUrl = (url: string) => {
          try {
            // 1. window.location.replace 시도
            window.location.replace(url);
          } catch (error) {
            console.warn('window.location.replace 실패, window.location.href 시도:', error);
            try {
              // 2. window.location.href 시도
              window.location.href = url;
            } catch (error2) {
              console.warn('window.location.href 실패, location.assign 시도:', error2);
              try {
                // 3. location.assign 시도
                location.assign(url);
              } catch (error3) {
                console.error('모든 리다이렉트 방법 실패:', error3);
                // 4. 마지막 수단: setTimeout으로 지연 후 시도
                setTimeout(() => {
                  window.location.href = url;
                }, 100);
              }
            }
          }
        };
        
        // 즉시 리다이렉트 시도
        redirectToUrl(nextUrl);
        
        // 모바일에서 안전을 위해 백업 리다이렉트도 설정
        setTimeout(() => {
          if (window.location.pathname === '/auth/callback') {
            console.log('백업 리다이렉트 실행:', nextUrl);
            redirectToUrl(nextUrl);
          }
        }, 1000);
        
      } catch (error) {
        // 로그인 실패 - 자동으로 로그인 페이지로 리다이렉트
        // 모바일/사파리 호환성을 위한 리다이렉트
        try {
          window.location.replace('/sign');
        } catch {
          window.location.href = '/sign';
        }
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