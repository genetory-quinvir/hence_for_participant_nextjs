"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SocialLoginDebugContent() {
  const searchParams = useSearchParams();
  const [debugResult, setDebugResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 현재 URL의 모든 파라미터 수집
  const allParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    allParams[key] = value;
  });

  const testDebugEndpoint = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/social-login');
      const result = await response.json();
      setDebugResult(result);
    } catch (error) {
      setDebugResult({ error: '디버깅 엔드포인트 호출 실패', details: error });
    } finally {
      setIsLoading(false);
    }
  };

  const testSocialLogin = (provider: 'kakao' | 'naver' | 'google') => {
    const callbackUrl = `${window.location.origin}/auth/callback`;
    const baseUrl = `http://api.hence.events/api/v1/auth/${provider}?redirect=participant&joinPlatform=participant&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    
    console.log(`${provider} 테스트 URL:`, baseUrl);
    console.log('콜백 URL:', callbackUrl);
    
    // 새 탭에서 열기
    window.open(baseUrl, '_blank');
  };

  const testWithCurrentParams = () => {
    const currentUrl = window.location.href;
    const callbackUrl = `${window.location.origin}/auth/callback`;
    
    console.log('현재 URL:', currentUrl);
    console.log('콜백 URL:', callbackUrl);
    
    // 현재 URL에 파라미터가 있으면 콜백 페이지로 이동
    if (window.location.search) {
      window.location.href = callbackUrl + window.location.search;
    } else {
      alert('현재 URL에 파라미터가 없습니다. 먼저 소셜 로그인을 시도해주세요.');
    }
  };

  const testVerifyEndpoint = async () => {
    const code = allParams.code;
    const provider = allParams.provider;
    const isNewUser = allParams.isNewUser === 'true';
    if (!code) {
      alert('URL에 code 파라미터가 없습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const verifyUrl = `https://api.hence.events/api/v1/auth/social/verify/${code}`;
      console.log('🔍 verify 엔드포인트 테스트:', verifyUrl);
      
      const response = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: provider?.toUpperCase() || 'GOOGLE',
          isNewUser
        }),
      });
      
      const result = await response.json();
      
      console.log('👤 verify 응답:', result);
      setDebugResult({
        success: true,
        endpoint: 'verify',
        url: verifyUrl,
        method: 'POST',
        requestBody: { provider: provider?.toUpperCase() || 'GOOGLE', isNewUser },
        status: response.status,
        data: result
      });
    } catch (error) {
      console.error('❌ verify 테스트 실패:', error);
      setDebugResult({
        success: false,
        endpoint: 'verify',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">소셜 로그인 디버깅 페이지</h1>
        
        {/* 현재 URL 파라미터 표시 */}
        <div className="mb-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">현재 URL 파라미터</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">전체 URL:</h3>
              <p className="text-sm break-all bg-white p-2 rounded">{window.location.href}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Search String:</h3>
              <p className="text-sm break-all bg-white p-2 rounded">{window.location.search}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">파라미터 목록:</h3>
            <div className="bg-white p-4 rounded">
              {Object.keys(allParams).length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(allParams).map(([key, value]) => (
                    <div key={key} className="flex">
                      <span className="font-mono text-sm bg-blue-100 px-2 py-1 rounded mr-2 min-w-0 flex-shrink-0">
                        {key}:
                      </span>
                      <span className="text-sm break-all">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">파라미터가 없습니다.</p>
              )}
            </div>
          </div>
        </div>

        {/* 필수 파라미터 검증 */}
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">필수 파라미터 검증 (Verify 중심)</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'code', label: '인증 코드', required: true, description: 'verify API 호출에 필요' },
              { key: 'provider', label: '소셜 제공자', required: true, description: 'verify API 호출에 필요' },
              { key: 'isNewUser', label: '신규 사용자', required: false, description: 'verify API 호출에 필요' },
              { key: 'social_user_id', label: '소셜 사용자 ID', required: false, description: 'verify에서 조회됨' },
              { key: 'email', label: '이메일', required: false, description: 'verify에서 조회됨' },
              { key: 'name', label: '이름', required: false, description: 'verify에서 조회됨' },
              { key: 'nickname', label: '닉네임', required: false, description: 'verify에서 조회됨' }
            ].map(({ key, label, required, description }) => {
              const value = allParams[key];
              const exists = !!value;
              return (
                <div key={key} className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${exists ? 'bg-green-500' : required ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                  <div>
                    <span className="font-medium">{label}</span>
                    {required && <span className="text-red-500 ml-1">*</span>}
                    <div className="text-sm text-gray-600">
                      {exists ? `✓ ${value}` : required ? '✗ 누락' : '선택사항'}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 테스트 버튼들 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">테스트 도구</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={testDebugEndpoint}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '로딩 중...' : '디버깅 엔드포인트 테스트'}
            </button>
            
            <button
              onClick={() => testSocialLogin('kakao')}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              카카오 로그인 테스트
            </button>
            
            <button
              onClick={() => testSocialLogin('naver')}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              네이버 로그인 테스트
            </button>
            
            <button
              onClick={() => testSocialLogin('google')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              구글 로그인 테스트
            </button>
            
            <button
              onClick={testWithCurrentParams}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              현재 파라미터로 콜백 테스트
            </button>
            
            <button
              onClick={testVerifyEndpoint}
              disabled={!allParams.code || isLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {isLoading ? '테스트 중...' : 'Verify 엔드포인트 테스트'}
            </button>
            
            <button
              onClick={async () => {
                if (!allParams.code || !allParams.provider) {
                  alert('code와 provider 파라미터가 필요합니다.');
                  return;
                }
                
                setIsLoading(true);
                try {
                  const response = await fetch('/api/auth/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      code: allParams.code,
                      provider: allParams.provider.toUpperCase(),
                      isNewUser: allParams.isNewUser === 'true'
                    })
                  });
                  
                  const result = await response.json();
                  setDebugResult({
                    success: true,
                    endpoint: 'full-flow',
                    status: response.status,
                    data: result
                  });
                } catch (error) {
                  setDebugResult({
                    success: false,
                    endpoint: 'full-flow',
                    error: error instanceof Error ? error.message : '알 수 없는 오류'
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={!allParams.code || !allParams.provider || isLoading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? '테스트 중...' : '전체 플로우 테스트'}
            </button>
          </div>
        </div>

        {/* 디버깅 결과 */}
        {debugResult && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">디버깅 결과</h2>
            
            {/* 전체 플로우 테스트 결과 특별 표시 */}
            {debugResult.endpoint === 'full-flow' && (
              <div className="mb-4 p-4 bg-white rounded border">
                <h3 className="font-semibold mb-2">🚀 전체 소셜 로그인 플로우 테스트 결과</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">상태:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      debugResult.status === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {debugResult.status} {debugResult.status === 200 ? '성공' : '실패'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">성공 여부:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      debugResult.data?.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {debugResult.data?.success ? '로그인 성공' : '로그인 실패'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">토큰 발급:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      debugResult.data?.access_token ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {debugResult.data?.access_token ? '발급됨' : '발급 안됨'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">사용자 데이터:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      debugResult.data?.data ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {debugResult.data?.data ? '있음' : '없음'}
                    </span>
                  </div>
                </div>
                
                {/* 에러 메시지 표시 */}
                {debugResult.data?.error && (
                  <div className="mt-4 p-3 bg-red-50 rounded">
                    <h4 className="font-medium text-red-800 mb-2">❌ 에러 메시지</h4>
                    <p className="text-sm text-red-700">{debugResult.data.error}</p>
                  </div>
                )}
                
                {/* 성공 시 사용자 정보 표시 */}
                {debugResult.data?.success && debugResult.data?.data && (
                  <div className="mt-4 p-3 bg-green-50 rounded">
                    <h4 className="font-medium text-green-800 mb-2">✅ 로그인된 사용자 정보</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">ID:</span>
                        <span className="ml-2">{debugResult.data.data.id || '없음'}</span>
                      </div>
                      <div>
                        <span className="font-medium">이메일:</span>
                        <span className="ml-2">{debugResult.data.data.email || '없음'}</span>
                      </div>
                      <div>
                        <span className="font-medium">이름:</span>
                        <span className="ml-2">{debugResult.data.data.name || '없음'}</span>
                      </div>
                      <div>
                        <span className="font-medium">닉네임:</span>
                        <span className="ml-2">{debugResult.data.data.nickname || '없음'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Verify 테스트 결과 특별 표시 */}
            {debugResult.endpoint === 'verify' && (
              <div className="mb-4 p-4 bg-white rounded border">
                <h3 className="font-semibold mb-2">🔍 Verify API 테스트 결과</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">상태:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      debugResult.status === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {debugResult.status} {debugResult.status === 200 ? '성공' : '실패'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">URL:</span>
                    <span className="ml-2 text-xs break-all">{debugResult.url}</span>
                  </div>
                  <div>
                    <span className="font-medium">요청 데이터:</span>
                    <pre className="mt-1 text-xs bg-gray-50 p-2 rounded">
                      {JSON.stringify(debugResult.requestBody, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium">응답 데이터:</span>
                    <pre className="mt-1 text-xs bg-gray-50 p-2 rounded max-h-32 overflow-auto">
                      {JSON.stringify(debugResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
                
                {/* 사용자 정보 추출 결과 */}
                {debugResult.data && (
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <h4 className="font-medium text-blue-800 mb-2">📋 추출된 사용자 정보</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">ID:</span>
                        <span className="ml-2">{debugResult.data.data?.id || debugResult.data.id || '없음'}</span>
                      </div>
                      <div>
                        <span className="font-medium">이메일:</span>
                        <span className="ml-2">{debugResult.data.data?.email || debugResult.data.email || '없음'}</span>
                      </div>
                      <div>
                        <span className="font-medium">이름:</span>
                        <span className="ml-2">{debugResult.data.data?.name || debugResult.data.name || '없음'}</span>
                      </div>
                      <div>
                        <span className="font-medium">닉네임:</span>
                        <span className="ml-2">{debugResult.data.data?.nickname || debugResult.data.nickname || '없음'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <pre className="bg-white p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">소셜 로그인 플로우</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li><strong>소셜 로그인 시작</strong>: 위의 소셜 로그인 테스트 버튼을 클릭하여 외부 서비스로 이동</li>
            <li><strong>인증 완료</strong>: 소셜 로그인 완료 후 콜백 URL로 리다이렉트 (code 파라미터 포함)</li>
            <li><strong>사용자 정보 조회</strong>: code를 사용해 <code>api.hence.events/api/v1/auth/social/verify/&#123;code&#125;</code> 호출</li>
            <li><strong>회원가입/로그인</strong>: verify된 사용자 정보로 <code>api-participant.hence.events/auth/callback</code> 호출</li>
            <li><strong>완료</strong>: 토큰 발급 및 로그인 상태 업데이트</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h3 className="font-semibold text-yellow-800 mb-2">디버깅 팁</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
              <li>브라우저 개발자 도구의 콘솔에서 상세한 로그를 확인하세요</li>
              <li>"Verify 엔드포인트 테스트" 버튼으로 사용자 정보 조회를 직접 테스트할 수 있습니다</li>
              <li>필수 파라미터가 누락된 경우 빨간색으로 표시됩니다</li>
            </ul>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold text-green-800 mb-2">🚀 콘솔 로그 확인 방법</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-green-700">
              <li>브라우저에서 <strong>F12</strong> 키를 눌러 개발자 도구 열기</li>
              <li><strong>Console</strong> 탭 클릭</li>
              <li>소셜 로그인 테스트 진행</li>
              <li>콘솔에서 <strong>🔍 ===== VERIFY API 호출 시작 =====</strong> 로그 확인</li>
              <li>모든 verify 과정이 상세하게 로그로 출력됩니다</li>
            </ol>
            <div className="mt-2 p-2 bg-white rounded text-xs">
              <strong>참고:</strong> 로그인 성공 시 3초 후 자동으로 리다이렉트되므로, 그 전에 콘솔 로그를 확인하세요!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function SocialLoginDebugLoading() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>디버깅 페이지 로딩 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트
export default function SocialLoginDebugPage() {
  return (
    <Suspense fallback={<SocialLoginDebugLoading />}>
      <SocialLoginDebugContent />
    </Suspense>
  );
}
