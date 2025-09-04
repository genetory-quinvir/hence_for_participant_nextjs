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
    // 중복 호출 방지: 이미 처리 중이거나 완료된 경우 스킵
    if (isProcessing || showSuccessMessage || error) {
      console.log('⏭️ 이미 처리 중이거나 완료됨. 스킵합니다.');
      return;
    }

    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const provider = searchParams.get('provider');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const clientRedirectUrl = searchParams.get('clientRedirect');
        
        console.log('✅ 내부 API 라우트를 통해 verify 및 로그인을 처리합니다.');
        console.log('🔍 파라미터:', { code, provider, isNewUser });

        if (!code || !provider) {
          setError('인증 정보가 올바르지 않습니다.');
          return;
        }

        // 내부 API 라우트를 통해 처리 (CSP 문제 해결)
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            provider,
            isNewUser
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          console.error('❌ API 호출 실패:', response.status, result);
          setError(result.message || `API 호출 실패 (${response.status})`);
          return;
        }

        console.log('✅ API 호출 성공:', result);
        
        // 성공 처리
        if (result.success || result.data) {
          console.log('✅ 로그인 성공!');
          
          // 토큰 저장
          if (result.access_token || result.data?.accessToken) {
            const accessToken = result.access_token || result.data.accessToken;
            const refreshToken = result.refresh_token || result.data.refreshToken;
            saveTokens(accessToken, refreshToken);
          }
          
          // 사용자 정보 저장
          const userData = result.data?.user || result.data;
          if (userData) {
            const accessToken = result.access_token || result.data?.accessToken;
            const refreshToken = result.refresh_token || result.data?.refreshToken;
            
            login(
              {
                id: userData.id || '1',
                name: userData.nickname || userData.name || '사용자',
                email: userData.email || '',
                profileImage: userData.profileImage || '',
                clientRedirectUrl: clientRedirectUrl
              },
              accessToken || '',
              refreshToken
            );
          }
          
          setSuccessData({ userData, clientRedirectUrl });
          setShowSuccessMessage(true);
          setIsProcessing(false);
          
          console.log('✅ 로그인 성공! 콘솔 로그를 확인한 후 "계속하기" 버튼을 클릭하세요.');
        } else {
          setError(result.error || result.message || '로그인에 실패했습니다.');
        }
      } catch (error) {
        console.error('❌ 로그인 콜백 처리 오류:', error);
        setError('로그인 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
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

      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          provider,
          isNewUser,
          social_user_id: manualUserInfo.social_user_id,
          email: manualUserInfo.email,
          name: manualUserInfo.name,
          nickname: manualUserInfo.nickname
        }),
      });

      const result = await response.json();

      if (response.ok && (result.success || result.data)) {
        // 토큰 저장
        if (result.access_token || result.data?.accessToken) {
          const accessToken = result.access_token || result.data.accessToken;
          const refreshToken = result.refresh_token || result.data.refreshToken;
          saveTokens(accessToken, refreshToken);
        }
        
        // 사용자 정보 저장
        const userData = result.data?.user || result.data;
        if (userData) {
          const accessToken = result.access_token || result.data?.accessToken;
          const refreshToken = result.refresh_token || result.data?.refreshToken;
          
          login(
            {
              id: userData.id || '1',
              name: userData.nickname || userData.name || '사용자',
              email: userData.email || '',
              profileImage: userData.profileImage || '',
              clientRedirectUrl: clientRedirectUrl
            },
            accessToken || '',
            refreshToken
          );
        }
        
        setSuccessData({ userData, clientRedirectUrl });
        setShowSuccessMessage(true);
        setIsProcessing(false);
        
        console.log('✅ 수동 로그인 성공!');
      } else {
        setError(result.error || '수동 로그인에 실패했습니다.');
      }
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