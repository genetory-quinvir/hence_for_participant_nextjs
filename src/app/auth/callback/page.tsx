"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { saveTokens, socialLoginOrRegister } from "@/lib/api";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    // 중복 호출 방지 - isProcessing이 true인 경우에만 실행
    if (showSuccessMessage || error) {
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

        // 2단계: verify 결과에서 사용자 정보 추출하여 로그인/회원가입 처리
        console.log('👤 사용자 정보로 로그인/회원가입 처리...');
        
        // verify 결과에서 사용자 정보 추출
        const userData = verifyResult.user || verifyResult.data || verifyResult;
        const userEmail = userData.email;
        const userId = userData.id;
        const userProvider = userData.provider;
        const userName = userData.name || userData.nickname;
        const userNickname = userData.nickname || userData.name;
        
        console.log('📋 추출된 사용자 정보:', {
          email: userEmail,
          id: userId,
          provider: userProvider,
          name: userName,
          nickname: userNickname
        });

        if (!userEmail || !userId || !userProvider) {
          console.error('❌ 필수 사용자 정보 누락:', { 
            email: !!userEmail, 
            id: !!userId, 
            provider: !!userProvider 
          });
          setError('사용자 정보가 올바르지 않습니다.');
          return;
        }

        // 소셜 로그인/회원가입 API 호출
        console.log('📡 소셜 로그인/회원가입 API 호출...');
        const loginResult = await socialLoginOrRegister(
          userEmail,
          userProvider,
          userId,
          userName,
          userNickname
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

        setSuccessData({ userData: finalUserData, clientRedirectUrl });
        setShowSuccessMessage(true);
        setIsProcessing(false);
        
        console.log('🎉 소셜 로그인 완료!');
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
  }, [searchParams, login, isProcessing, showSuccessMessage, error]);

  // 성공 메시지 화면
  if (showSuccessMessage) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-green-500 text-lg mb-4">✅ 로그인 성공!</div>
          <div className="text-sm mb-6" style={{ opacity: 0.7 }}>
            소셜 로그인이 성공적으로 완료되었습니다.
          </div>
          
          {successData?.userData && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg text-left">
              <h3 className="font-semibold text-green-800 mb-2">로그인된 사용자 정보</h3>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">ID:</span> {successData.userData.id || '없음'}</div>
                <div><span className="font-medium">이메일:</span> {successData.userData.email || '없음'}</div>
                <div><span className="font-medium">이름:</span> {successData.userData.name || '없음'}</div>
                <div><span className="font-medium">닉네임:</span> {successData.userData.nickname || '없음'}</div>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mb-6">
            콘솔에서 상세한 로그를 확인할 수 있습니다. (F12 → Console)
          </div>
          
          <button
            onClick={() => {
              if (successData?.clientRedirectUrl) {
                window.location.href = successData.clientRedirectUrl;
              } else {
                window.location.href = '/';
              }
            }}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            계속하기
          </button>
        </div>
      </div>
    );
  }

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