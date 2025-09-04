"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";
import { saveTokens } from "@/lib/api";
import { useSimpleNavigation } from "@/utils/navigation";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const { replace } = useSimpleNavigation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualUserInfo, setManualUserInfo] = useState({
    social_user_id: '',
    email: '',
    name: '',
    nickname: ''
  });

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const provider = searchParams.get('provider');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const redirectUrl = searchParams.get('redirect');
        const clientRedirectUrl = searchParams.get('clientRedirect');
        
        console.log('로그인 콜백 처리:', { 
          code, 
          provider, 
          isNewUser, 
          redirectUrl, 
          clientRedirectUrl
        });
        console.log('전체 URL 파라미터:', window.location.search);
        console.log('clientRedirect 파라미터 존재 여부:', !!clientRedirectUrl);
        
        // URL 파라미터 디버깅을 위한 상세 로그
        const allUrlParams = Object.fromEntries(new URLSearchParams(window.location.search));
        console.log('URL 파라미터 상세 분석:', {
          hasCode: !!code,
          hasProvider: !!provider,
          hasIsNewUser: isNewUser !== undefined,
          allParams: allUrlParams,
          fullUrl: window.location.href,
          searchString: window.location.search
        });

        // 외부 소셜 로그인 서비스에서 제공하는 모든 파라미터 로깅
        console.log('🔍 외부 소셜 로그인 서비스에서 제공된 모든 파라미터:');
        Object.entries(allUrlParams).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });

        if (!code || !provider) {
          setError('인증 정보가 올바르지 않습니다.');
          return;
        }

        // 필수 파라미터 검증 - code와 provider만 있으면 진행
        // 사용자 정보는 verify API에서 code를 통해 조회
        console.log('🔍 파라미터 검증 결과:', {
          hasCode: !!code,
          hasProvider: !!provider,
          hasIsNewUser: isNewUser !== undefined
        });

        console.log('✅ verify API를 통해 사용자 정보를 조회합니다.');

        // Next.js API 라우트를 통해 요청
        const apiUrl = `/api/auth/callback`;
        console.log('API 요청 URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            provider: provider.toUpperCase(),
            isNewUser
            // verify에서 사용자 정보를 조회하므로 URL 파라미터의 사용자 정보는 전달하지 않음
          }),
        });

        const result = await response.json();
        console.log('API 응답:', result);

        if (result.success && result.access_token) {
          console.log("소셜 로그인 성공:", result.data);

          // 토큰들 저장
          saveTokens(result.access_token, result.refresh_token);

          // AuthContext에 로그인 상태 업데이트
          if (result.data) {
            login(
              {
                id: result.data.id || '1',
                name: result.data.nickname || '사용자',
                nickname: result.data.nickname || '사용자',
                email: result.data.email || '',
              },
              result.access_token,
              result.refresh_token
            );
          }

          // 소셜 로그인에서는 토스트 메시지 제거

          // 소셜 로그인 완료 후 리다이렉트 처리
          if (hasRedirected) {
            console.log('이미 리다이렉트됨 - 추가 처리 중단');
            return;
          }
          
          const savedRedirectUrl = sessionStorage.getItem('socialLoginRedirectUrl');
          
          if (savedRedirectUrl) {
            console.log('저장된 소셜 로그인 리다이렉트 URL:', savedRedirectUrl);
            sessionStorage.removeItem('socialLoginRedirectUrl');
            setHasRedirected(true);
            
            // 콘솔 로그를 보기 위해 3초 대기
            console.log('🚀 3초 후 리다이렉트됩니다. 콘솔 로그를 확인하세요!');
            setTimeout(() => {
              window.location.href = savedRedirectUrl;
            }, 3000);
          } else if (clientRedirectUrl) {
            console.log('클라이언트 리다이렉트 URL:', clientRedirectUrl);
            const decodedUrl = decodeURIComponent(clientRedirectUrl);
            console.log('디코딩된 URL:', decodedUrl);
            setHasRedirected(true);
            
            // 콘솔 로그를 보기 위해 3초 대기
            console.log('🚀 3초 후 리다이렉트됩니다. 콘솔 로그를 확인하세요!');
            setTimeout(() => {
              window.location.href = decodedUrl;
            }, 3000);
          } else {
            console.log('리다이렉트 파라미터가 없어서 메인 페이지로 리다이렉트');
            console.log('사용 가능한 파라미터들:', {
              code: !!code,
              provider: !!provider,
              isNewUser: !!isNewUser,
              redirectUrl: !!redirectUrl,
              clientRedirectUrl: !!clientRedirectUrl
            });
            setHasRedirected(true);
            
            // 콘솔 로그를 보기 위해 3초 대기
            console.log('🚀 3초 후 메인 페이지로 리다이렉트됩니다. 콘솔 로그를 확인하세요!');
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          }
        } else {
          console.error('로그인 실패 상세:', result);
          const errorMessage = result.error || result.message || '로그인에 실패했습니다.';
          setError(`${errorMessage} (상태: ${result.status || 'unknown'})`);
        }
              } catch (error) {
          console.error('로그인 콜백 처리 오류:', error);
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
          console.error('오류 상세:', {
            message: errorMessage,
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined
          });
          setError(`로그인 처리 중 오류가 발생했습니다: ${errorMessage}`);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, login, replace, showToast]);

  // 수동 사용자 정보 입력 처리
  const handleManualSubmit = async () => {
    if (!manualUserInfo.social_user_id || !manualUserInfo.email) {
      setError('소셜 사용자 ID와 이메일은 필수입니다.');
      return;
    }

    setIsProcessing(true);
    try {
      const code = searchParams.get('code');
      const provider = searchParams.get('provider');
      
      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          provider: provider?.toUpperCase(),
          social_user_id: manualUserInfo.social_user_id,
          email: manualUserInfo.email,
          name: manualUserInfo.name,
          nickname: manualUserInfo.nickname
        }),
      });

      const result = await response.json();
      
      if (result.success && result.access_token) {
        saveTokens(result.access_token, result.refresh_token);
        login(
          {
            id: result.data.id || manualUserInfo.social_user_id,
            name: result.data.nickname || manualUserInfo.name || '사용자',
            nickname: result.data.nickname || manualUserInfo.nickname || '사용자',
            email: result.data.email || manualUserInfo.email,
          },
          result.access_token,
          result.refresh_token
        );
        
        // 성공 후 리다이렉트
        const savedRedirectUrl = sessionStorage.getItem('socialLoginRedirectUrl');
        if (savedRedirectUrl) {
          sessionStorage.removeItem('socialLoginRedirectUrl');
          console.log('🚀 3초 후 리다이렉트됩니다. 콘솔 로그를 확인하세요!');
          setTimeout(() => {
            window.location.href = savedRedirectUrl;
          }, 3000);
        } else {
          console.log('🚀 3초 후 메인 페이지로 리다이렉트됩니다. 콘솔 로그를 확인하세요!');
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        }
      } else {
        setError(result.error || '수동 로그인에 실패했습니다.');
      }
    } catch (error) {
      setError('수동 로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>로그인 처리 중...</p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg max-w-md">
            <p className="text-xs text-blue-600 mb-2">🔍 디버깅 팁</p>
            <p className="text-xs text-blue-500">
              브라우저 개발자 도구(F12) → 콘솔 탭에서<br/>
              상세한 verify 과정을 확인할 수 있습니다
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-lg mb-4">로그인 실패</div>
          <div className="text-sm mb-6" style={{ opacity: 0.7 }}>
            {error.split('\n').map((line, index) => (
              <div key={index} className={line.startsWith('•') ? 'text-left ml-4' : ''}>
                {line}
              </div>
            ))}
          </div>
          
          {!showManualForm ? (
            <div className="space-y-2">
              <button
                onClick={() => setShowManualForm(true)}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                사용자 정보 수동 입력
              </button>
              <button
                onClick={() => replace('/sign')}
                className="w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                로그인 페이지로 돌아가기
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <div className="text-left">
              <h3 className="text-lg font-semibold mb-4">사용자 정보 입력</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">소셜 사용자 ID *</label>
                  <input
                    type="text"
                    value={manualUserInfo.social_user_id}
                    onChange={(e) => setManualUserInfo(prev => ({ ...prev, social_user_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="소셜 고유 ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">이메일 *</label>
                  <input
                    type="email"
                    value={manualUserInfo.email}
                    onChange={(e) => setManualUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="이메일 주소"
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
                    placeholder="사용자 닉네임"
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={handleManualSubmit}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? '처리 중...' : '로그인 완료'}
                </button>
                <button
                  onClick={() => setShowManualForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
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
