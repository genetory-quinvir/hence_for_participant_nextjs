"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { saveTokens } from "@/lib/api";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualUserInfo, setManualUserInfo] = useState({
    social_user_id: '',
    email: '',
    name: '',
    nickname: ''
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  useEffect(() => {
    // 중복 호출 방지
    if (isProcessing || showSuccessMessage || error) {
      return;
    }

    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const provider = searchParams.get('provider');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const clientRedirectUrl = searchParams.get('clientRedirect');
        
        console.log('🔍 소셜 로그인 파라미터:', { code, provider, isNewUser });

        if (!code || !provider) {
          setError('인증 정보가 올바르지 않습니다.');
          return;
        }

        // 1단계: 외부 API로 사용자 데이터 조회
        console.log('📡 외부 API 호출 시작...');
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
          console.error('❌ 외부 API 호출 실패:', verifyResponse.status);
          setError('사용자 정보 조회에 실패했습니다.');
          return;
        }

        const userData = await verifyResponse.json();
        console.log('✅ 사용자 데이터 조회 성공:', userData);

        // 2단계: 사용자 데이터로 로그인/회원가입 처리
        console.log('🔐 로그인/회원가입 처리 시작...');
        const loginResponse = await fetch('https://api-participant.hence.events/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            provider: provider.toUpperCase(),
            social_user_id: userData.id || userData.data?.id,
            email: userData.email || userData.data?.email,
            name: userData.name || userData.data?.name,
            nickname: userData.nickname || userData.data?.nickname,
            isNewUser
          }),
        });

        if (!loginResponse.ok) {
          console.error('❌ 로그인/회원가입 실패:', loginResponse.status);
          setError('로그인/회원가입에 실패했습니다.');
          return;
        }

        const loginResult = await loginResponse.json();
        console.log('✅ 로그인/회원가입 성공:', loginResult);

        // 3단계: 토큰 저장 및 사용자 정보 설정
        if (loginResult.access_token) {
          saveTokens(loginResult.access_token, loginResult.refresh_token);
        }

        const finalUserData = loginResult.data || loginResult;
        login(
          {
            id: finalUserData.id || '1',
            name: finalUserData.nickname || finalUserData.name || '사용자',
            email: finalUserData.email || '',
            profileImage: finalUserData.profileImage || '',
            clientRedirectUrl: clientRedirectUrl
          },
          loginResult.access_token || '',
          loginResult.refresh_token || ''
        );

        setSuccessData({ userData: finalUserData, clientRedirectUrl });
        setShowSuccessMessage(true);
        setIsProcessing(false);
        
        console.log('🎉 소셜 로그인 완료!');
      } catch (error) {
        console.error('❌ 소셜 로그인 처리 오류:', error);
        setError('소셜 로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, login, isProcessing, showSuccessMessage, error]);

  // 수동 사용자 정보 입력 처리
  const handleManualLogin = async () => {
    if (!manualUserInfo.social_user_id || !manualUserInfo.email) {
      setError('소셜 사용자 ID와 이메일은 필수입니다.');
      return;
    }

    setIsProcessing(true);
    try {
      const code = searchParams.get('code');
      const provider = searchParams.get('provider');
      const isNewUser = searchParams.get('isNewUser') === 'true';
      const clientRedirectUrl = searchParams.get('clientRedirect');

      // 수동 입력된 사용자 데이터로 로그인/회원가입 처리
      const loginResponse = await fetch('https://api-participant.hence.events/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          provider: provider?.toUpperCase(),
          social_user_id: manualUserInfo.social_user_id,
          email: manualUserInfo.email,
          name: manualUserInfo.name,
          nickname: manualUserInfo.nickname,
          isNewUser
        }),
      });

      if (!loginResponse.ok) {
        setError('수동 로그인에 실패했습니다.');
        return;
      }

      const loginResult = await loginResponse.json();

      // 토큰 저장
      if (loginResult.access_token) {
        saveTokens(loginResult.access_token, loginResult.refresh_token);
      }
      
      // 사용자 정보 저장
      const userData = loginResult.data || loginResult;
      login(
        {
          id: userData.id || '1',
          name: userData.nickname || userData.name || '사용자',
          email: userData.email || '',
          profileImage: userData.profileImage || '',
          clientRedirectUrl: clientRedirectUrl
        },
        loginResult.access_token || '',
        loginResult.refresh_token || ''
      );
      
      setSuccessData({ userData, clientRedirectUrl });
      setShowSuccessMessage(true);
      setIsProcessing(false);
      
      console.log('✅ 수동 로그인 성공!');
    } catch (error) {
      setError('수동 로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

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
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/sign'}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
            >
              로그인 페이지로 이동
            </button>
            
            <button
              onClick={() => {
                setError('');
                setShowManualForm(true);
              }}
              className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              수동 입력으로 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 수동 입력 폼
  if (showManualForm) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-lg mb-4">수동 사용자 정보 입력</div>
          <div className="text-sm mb-6 text-gray-600">
            소셜 로그인에서 필요한 정보를 수동으로 입력해주세요.
          </div>
          
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-sm font-medium mb-1">소셜 사용자 ID *</label>
              <input
                type="text"
                value={manualUserInfo.social_user_id}
                onChange={(e) => setManualUserInfo(prev => ({ ...prev, social_user_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="소셜 사용자 ID"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">이메일 *</label>
              <input
                type="email"
                value={manualUserInfo.email}
                onChange={(e) => setManualUserInfo(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="이메일"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">이름</label>
              <input
                type="text"
                value={manualUserInfo.name}
                onChange={(e) => setManualUserInfo(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="사용자 이름"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">닉네임</label>
              <input
                type="text"
                value={manualUserInfo.nickname}
                onChange={(e) => setManualUserInfo(prev => ({ ...prev, nickname: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="닉네임"
              />
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <button
              onClick={handleManualLogin}
              disabled={isProcessing}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isProcessing ? '처리 중...' : '로그인 시도'}
            </button>
            
            <button
              onClick={() => setShowManualForm(false)}
              className="w-full bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
          </div>
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