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
  const [error, setError] = useState<string | null>(null);

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
        const socialUserId = searchParams.get('social_user_id');
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        const nickname = searchParams.get('nickname');
        
        console.log('🔍 소셜 로그인 파라미터:', { 
          code, 
          provider, 
          isNewUser, 
          socialUserId, 
          email, 
          name, 
          nickname,
          clientRedirectUrl 
        });

        if (!code || !provider) {
          console.error('❌ 필수 파라미터 누락:', { code: !!code, provider: !!provider });
          setError('인증 정보가 올바르지 않습니다.');
          return;
        }

        // 1단계: 외부 API로 인증 검증
        console.log('🔐 외부 API로 인증 검증...');
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

        console.log('📊 인증 검증 응답 상태:', verifyResponse.status);

        if (!verifyResponse.ok) {
          const verifyErrorText = await verifyResponse.text();
          console.error('❌ 인증 검증 실패:', verifyResponse.status, verifyErrorText);
          setError(`인증 검증에 실패했습니다. (${verifyResponse.status})`);
          return;
        }

        const verifyResult = await verifyResponse.json();
        console.log('✅ 인증 검증 성공:', verifyResult);
        console.log('🔍 verifyResult 구조 분석:', {
          hasUser: !!verifyResult.user,
          hasData: !!verifyResult.data,
          userKeys: verifyResult.user ? Object.keys(verifyResult.user) : [],
          dataKeys: verifyResult.data ? Object.keys(verifyResult.data) : [],
          allKeys: Object.keys(verifyResult)
        });

        // 2단계: verify 결과에서 사용자 정보 추출하여 로그인/회원가입 처리
        console.log('👤 사용자 정보로 로그인/회원가입 처리...');
        
        // verify 결과에서 사용자 정보 추출
        const userData = verifyResult.data.user;
        
        console.log('📋 userData:', userData);
        
        // user 객체에서 사용자 정보 추출
        const userEmail = userData.email;
        const userId = userData.id;
        const userProvider = userData.provider;
        const userName = userData.name;
        const userNickname = userData.nickname;
        
        // 콘솔에 추출된 데이터 찍기
        console.log('🎯 추출된 핵심 데이터:', {
          email: userEmail,
          id: userId,
          provider: userProvider
        });
        
        console.log('📋 추출된 사용자 정보:', {
          email: userEmail,
          id: userId,
          provider: userProvider,
          name: userName,
          nickname: userNickname
        });


        if (!userEmail || !userId || !userProvider) {
          console.error('❌ 필수 사용자 정보 누락:', { 
            email: userEmail, 
            id: userId, 
            provider: userProvider
          });
          setError('사용자 정보가 올바르지 않습니다.');
          return;
        }

        // 소셜 로그인/회원가입 API 호출
        console.log('📡 소셜 로그인/회원가입 API 호출...');
        console.log('📤 전달할 데이터:', {
          email: userEmail,
          provider: userProvider,
          id: userId,
          name: userName,
          nickname: userNickname,
          profile_image_url: userData.profileImage || userData.profileImageUrl || null
        });
        
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
          setError(loginResult.error || '소셜 로그인에 실패했습니다.');
          return;
        }

        console.log('✅ 소셜 로그인/회원가입 성공:', loginResult);

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

        console.log('🔐 AuthContext 로그인 상태 업데이트:', finalUserData);
        
        login(
          finalUserData,
          loginResult.access_token || '',
          loginResult.refresh_token || ''
        );

        console.log('🎉 소셜 로그인 완료!');
        
        // Google Analytics 이벤트 트리거 및 리다이렉트
        try {
          // dataLayer가 없으면 초기화
          if (!window.dataLayer) {
            window.dataLayer = [];
          }
          
          // 중복 실행 방지
          if (!window.__dlAuthFired) {
            window.__dlAuthFired = true;
            
            // 신규 사용자 여부 확인 (회원가입인지 로그인인지)
            const isNewUser = !loginResult.data?.createdAt || 
              new Date(loginResult.data.createdAt).getTime() > Date.now() - 60000; // 1분 이내 생성된 경우 신규
            
            // 리다이렉트 URL 설정
            const nextUrl = clientRedirectUrl || '/';
            console.log('📊 리다이렉트 URL:', nextUrl);
            
            // GA 이벤트 전송 (콜백 없이)
            window.dataLayer.push({
              event: 'auth_success',
              method: 'social',
              provider: userProvider,
              is_new_user: isNewUser,
              user_id: userId
            });
            
            console.log('📊 Google Analytics 이벤트 전송:', {
              event: 'auth_success',
              method: 'social',
              provider: userProvider,
              is_new_user: isNewUser,
              user_id: userId
            });
            
            // 즉시 리다이렉트 (GA 이벤트와 분리)
            setTimeout(() => {
              console.log('📊 리다이렉트 실행:', nextUrl);
              setIsProcessing(false); // 처리 완료 표시
              window.location.replace(nextUrl);
            }, 100);
            
          } else {
            console.log('📊 GA 이벤트 이미 실행됨, 바로 리다이렉트');
            // 이미 실행된 경우 바로 리다이렉트
            const nextUrl = clientRedirectUrl || '/';
            setIsProcessing(false); // 처리 완료 표시
            window.location.replace(nextUrl);
          }
        } catch (gaError) {
          console.error('❌ Google Analytics 이벤트 전송 실패:', gaError);
          // GA 실패해도 로그인은 성공했으므로 리다이렉트
          const nextUrl = clientRedirectUrl || '/';
          setIsProcessing(false); // 처리 완료 표시
          window.location.replace(nextUrl);
        }
      } catch (error) {
        console.error('❌ 소셜 로그인 처리 오류:', error);
        
        // 에러 타입에 따른 구체적인 메시지 제공
        let errorMessage = '소셜 로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
        if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
        } else if (error instanceof Error) {
          errorMessage = `처리 중 오류가 발생했습니다: ${error.message}`;
        }
        
        setError(errorMessage);
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, login, isProcessing]);


  // 에러 화면
  if (error) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-lg mb-4">❌ 로그인 실패</div>
          <div className="text-sm mb-6 text-gray-600">
            {error}
          </div>
          
          <button
            onClick={() => window.location.href = '/sign'}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  // 로딩 화면
  if (isProcessing) {
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

  // 처리 완료 후 빈 화면 (리다이렉트 대기)
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="text-lg mb-4">리다이렉트 중...</div>
        <div className="text-sm text-gray-600">
          잠시만 기다려주세요.
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