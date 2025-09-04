"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SocialLoginDebugPage() {
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
    window.open(baseUrl, '_blank');
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
          <h2 className="text-lg font-semibold mb-4">필수 파라미터 검증</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'code', label: '인증 코드', required: true },
              { key: 'provider', label: '소셜 제공자', required: true },
              { key: 'social_user_id', label: '소셜 사용자 ID', required: true },
              { key: 'email', label: '이메일', required: true },
              { key: 'name', label: '이름', required: false },
              { key: 'nickname', label: '닉네임', required: false }
            ].map(({ key, label, required }) => {
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
          </div>
        </div>

        {/* 디버깅 결과 */}
        {debugResult && (
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">디버깅 결과</h2>
            <pre className="bg-white p-4 rounded text-sm overflow-auto">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}

        {/* 사용법 안내 */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">사용법</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>위의 소셜 로그인 테스트 버튼을 클릭하여 실제 소셜 로그인을 시도합니다.</li>
            <li>소셜 로그인 완료 후 이 페이지로 리다이렉트되면 URL 파라미터를 확인할 수 있습니다.</li>
            <li>필수 파라미터가 누락된 경우 빨간색으로 표시됩니다.</li>
            <li>디버깅 엔드포인트 테스트 버튼으로 서버 측 분석도 확인할 수 있습니다.</li>
            <li>브라우저 개발자 도구의 콘솔에서 상세한 로그를 확인하세요.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
