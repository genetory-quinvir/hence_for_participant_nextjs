"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";
import { saveTokens } from "@/lib/api";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const provider = searchParams.get('provider');
        const isNewUser = searchParams.get('isNewUser') === 'true';

        console.log('소셜 로그인 콜백 처리:', { code, provider, isNewUser });

        if (!code || !provider) {
          setError('인증 정보가 올바르지 않습니다.');
          return;
        }

        // Next.js API 라우트를 통해 요청
        const response = await fetch('/api/auth/social-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            provider: provider.toLowerCase(),
            isNewUser
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          // 토큰 저장
          saveTokens(result.access_token, result.refresh_token);

          // AuthContext에 로그인 상태 업데이트
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

          showToast(
            isNewUser ? '회원가입이 완료되었습니다!' : '로그인이 완료되었습니다!',
            'success'
          );

          // 메인 페이지로 이동
          router.replace('/');
        } else {
          console.error('로그인 실패 상세:', result);
          const errorMessage = result.error || result.message || '로그인에 실패했습니다.';
          setError(`${errorMessage} (상태: ${result.status || 'unknown'})`);
        }
      } catch (error) {
        console.error('소셜 로그인 콜백 처리 오류:', error);
        setError('로그인 처리 중 오류가 발생했습니다.');
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, login, router, showToast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">로그인 실패</div>
          <p className="text-sm mb-4" style={{ opacity: 0.7 }}>{error}</p>
          <button
            onClick={() => router.push('/sign')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            로그인 페이지로 돌아가기
          </button>
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
