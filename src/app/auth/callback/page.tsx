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
      console.log('🚫 processCallback 중복 실행 방지 - isProcessing:', isProcessing);
      return;
    }

    const processCallback = async () => {
      console.log('🚀 [STEP 1] processCallback 시작');
      try {
        console.log('🔍 [STEP 2] URL 파라미터 파싱 시작');
        const code = searchParams.get('code');
        const provider = searchParams.get('provider');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const clientRedirectUrl = searchParams.get('clientRedirect');
        const socialUserId = searchParams.get('social_user_id');
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        const nickname = searchParams.get('nickname');
        
        console.log('📋 [STEP 2-1] 파싱된 파라미터:', { 
          code: code ? `${code.substring(0, 10)}...` : null, 
          provider, 
          isNewUser, 
          socialUserId, 
          email, 
          name, 
          nickname,
          clientRedirectUrl 
        });

        console.log('🔍 [STEP 3] 필수 파라미터 검증');
        if (!code || !provider) {
          console.error('❌ [STEP 3-1] 필수 파라미터 누락:', { code: !!code, provider: !!provider });
          setError('인증 정보가 올바르지 않습니다.');
          setIsProcessing(false);
          return;
        }
        console.log('✅ [STEP 3-2] 필수 파라미터 검증 통과');

        // 1단계: 외부 API로 인증 검증
        console.log('🔐 [STEP 4] 외부 API 인증 검증 시작');
        const verifyUrl = `https://api.hence.events/api/v1/auth/social/verify/${code}`;
        const verifyPayload = {
          provider: provider.toUpperCase(),
          isNewUser
        };
        
        console.log('📤 [STEP 4-1] 인증 검증 요청:', {
          url: verifyUrl,
          payload: verifyPayload
        });
        
        const verifyResponse = await fetch(verifyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(verifyPayload),
        });

        console.log('📥 [STEP 4-2] 인증 검증 응답 상태:', verifyResponse.status, verifyResponse.statusText);

        console.log('🔍 [STEP 4-3] 인증 검증 응답 처리');
        if (!verifyResponse.ok) {
          const verifyErrorText = await verifyResponse.text();
          console.error('❌ [STEP 4-4] 인증 검증 실패:', verifyResponse.status, verifyErrorText);
          setError(`인증 검증에 실패했습니다. (${verifyResponse.status})`);
          setIsProcessing(false);
          return;
        }

        const verifyResult = await verifyResponse.json();
        console.log('✅ [STEP 4-5] 인증 검증 성공');
        console.log('🔍 [STEP 4-6] verifyResult 구조 분석:', {
          hasUser: !!verifyResult.user,
          hasData: !!verifyResult.data,
          userKeys: verifyResult.user ? Object.keys(verifyResult.user) : [],
          dataKeys: verifyResult.data ? Object.keys(verifyResult.data) : [],
          allKeys: Object.keys(verifyResult)
        });

        // 2단계: verify 결과에서 사용자 정보 추출하여 로그인/회원가입 처리
        console.log('👤 [STEP 5] 사용자 정보 추출 및 로그인/회원가입 처리 시작');
        
        // verify 결과에서 사용자 정보 추출
        console.log('🔍 [STEP 5-1] verifyResult에서 userData 추출');
        const userData = verifyResult.data.user;
        
        console.log('📋 [STEP 5-2] userData:', userData);
        
        // user 객체에서 사용자 정보 추출
        console.log('🔍 [STEP 5-3] userData에서 개별 필드 추출');
        const userEmail = userData.email;
        const userId = userData.id;
        const userProvider = userData.provider;
        const userName = userData.name;
        const userNickname = userData.nickname;
        
        // 콘솔에 추출된 데이터 찍기
        console.log('🎯 [STEP 5-4] 추출된 핵심 데이터:', {
          email: userEmail,
          id: userId,
          provider: userProvider
        });
        
        console.log('📋 [STEP 5-5] 추출된 전체 사용자 정보:', {
          email: userEmail,
          id: userId,
          provider: userProvider,
          name: userName,
          nickname: userNickname
        });


        console.log('🔍 [STEP 5-6] 필수 사용자 정보 검증');
        if (!userEmail || !userId || !userProvider) {
          console.error('❌ [STEP 5-7] 필수 사용자 정보 누락:', { 
            email: userEmail, 
            id: userId, 
            provider: userProvider
          });
          setError('사용자 정보가 올바르지 않습니다.');
          setIsProcessing(false);
          return;
        }
        console.log('✅ [STEP 5-8] 필수 사용자 정보 검증 통과');

        // 소셜 로그인/회원가입 API 호출
        console.log('📡 [STEP 6] 소셜 로그인/회원가입 API 호출 시작');
        const socialLoginPayload = {
          email: userEmail,
          provider: userProvider,
          id: userId,
          name: userName,
          nickname: userNickname,
          profile_image_url: userData.profileImage || userData.profileImageUrl || null
        };
        console.log('📤 [STEP 6-1] 전달할 데이터:', socialLoginPayload);
        
        console.log('📡 [STEP 6-2] socialLoginOrRegister API 호출');
        const loginResult = await socialLoginOrRegister(
          userEmail,
          userProvider,
          userId,
          userName,
          userNickname,
          userData.profileImage || userData.profileImageUrl || null
        );

        console.log('📥 [STEP 6-3] socialLoginOrRegister 응답:', loginResult);

        if (!loginResult.success) {
          console.error('❌ [STEP 6-4] 소셜 로그인/회원가입 실패:', loginResult.error);
          setError(loginResult.error || '소셜 로그인에 실패했습니다.');
          setIsProcessing(false);
          return;
        }

        console.log('✅ [STEP 6-5] 소셜 로그인/회원가입 성공');

        // 토큰 저장
        console.log('🔑 [STEP 7] 토큰 저장 시작');
        if (loginResult.access_token) {
          console.log('🔑 [STEP 7-1] 토큰 저장 실행');
          saveTokens(loginResult.access_token, loginResult.refresh_token);
          console.log('✅ [STEP 7-2] 토큰 저장 완료');
        } else {
          console.log('⚠️ [STEP 7-3] access_token이 없음');
        }

        // AuthContext에 로그인 상태 업데이트
        console.log('🔐 [STEP 8] AuthContext 로그인 상태 업데이트 시작');
        const finalUserData = {
          id: loginResult.data?.id || userId,
          name: loginResult.data?.name || loginResult.data?.nickname || userName || '사용자',
          nickname: loginResult.data?.nickname || loginResult.data?.name || userNickname || '사용자',
          email: loginResult.data?.email || userEmail,
          profileImage: loginResult.data?.profileImage || loginResult.data?.profileImageUrl || '',
          provider: userProvider,
          clientRedirectUrl: clientRedirectUrl
        };

        console.log('🔐 [STEP 8-1] finalUserData:', finalUserData);
        
        console.log('🔐 [STEP 8-2] login 함수 호출');
        login(
          finalUserData,
          loginResult.access_token || '',
          loginResult.refresh_token || ''
        );

        console.log('✅ [STEP 8-3] AuthContext 로그인 상태 업데이트 완료');
        console.log('🎉 [STEP 9] 소셜 로그인 완료!');
        
        // Google Analytics 이벤트 트리거 및 리다이렉트
        console.log('📊 [STEP 10] Google Analytics 이벤트 및 리다이렉트 시작');
        try {
          // dataLayer가 없으면 초기화
          console.log('📊 [STEP 10-1] dataLayer 초기화 확인');
          if (!window.dataLayer) {
            console.log('📊 [STEP 10-2] dataLayer 초기화');
            window.dataLayer = [];
          }
          
          // 중복 실행 방지
          console.log('📊 [STEP 10-3] 중복 실행 방지 확인');
          if (!window.__dlAuthFired) {
            console.log('📊 [STEP 10-4] GA 이벤트 실행');
            window.__dlAuthFired = true;
            
            // 신규 사용자 여부 확인 (회원가입인지 로그인인지)
            const isNewUser = !loginResult.data?.createdAt || 
              new Date(loginResult.data.createdAt).getTime() > Date.now() - 60000; // 1분 이내 생성된 경우 신규
            
            // 리다이렉트 URL 설정
            const nextUrl = clientRedirectUrl || '/';
            console.log('📊 [STEP 10-5] 리다이렉트 URL:', nextUrl);
            
            // GA 이벤트 전송 (콜백 없이)
            const gaEvent = {
              event: 'auth_success',
              method: 'social',
              provider: userProvider,
              is_new_user: isNewUser,
              user_id: userId
            };
            
            console.log('📊 [STEP 10-6] GA 이벤트 전송:', gaEvent);
            window.dataLayer.push(gaEvent);
            
            // 즉시 리다이렉트 (GA 이벤트와 분리)
            console.log('📊 [STEP 10-7] 리다이렉트 타이머 설정 (100ms)');
            setTimeout(() => {
              console.log('📊 [STEP 10-8] 리다이렉트 실행:', nextUrl);
              setIsProcessing(false); // 처리 완료 표시
              window.location.replace(nextUrl);
            }, 100);
            
          } else {
            console.log('📊 [STEP 10-9] GA 이벤트 이미 실행됨, 바로 리다이렉트');
            // 이미 실행된 경우 바로 리다이렉트
            const nextUrl = clientRedirectUrl || '/';
            setIsProcessing(false); // 처리 완료 표시
            window.location.replace(nextUrl);
          }
        } catch (gaError) {
          console.error('❌ [STEP 10-10] Google Analytics 이벤트 전송 실패:', gaError);
          // GA 실패해도 로그인은 성공했으므로 리다이렉트
          const nextUrl = clientRedirectUrl || '/';
          setIsProcessing(false); // 처리 완료 표시
          window.location.replace(nextUrl);
        }
      } catch (error) {
        console.error('💥 [ERROR] 소셜 로그인 처리 중 예외 발생:', error);
        
        // 에러 타입에 따른 구체적인 메시지 제공
        let errorMessage = '소셜 로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
        if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
        } else if (error instanceof Error) {
          errorMessage = `처리 중 오류가 발생했습니다: ${error.message}`;
        }
        
        console.error('💥 [ERROR] 최종 에러 메시지:', errorMessage);
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