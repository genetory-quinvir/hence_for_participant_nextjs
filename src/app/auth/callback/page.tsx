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

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const provider = searchParams.get('provider');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const redirectUrl = searchParams.get('redirect');
        const clientRedirectUrl = searchParams.get('clientRedirect');

        console.log('로그인 콜백 처리:', { code, provider, isNewUser, redirectUrl, clientRedirectUrl });
        console.log('전체 URL 파라미터:', window.location.search);
        console.log('clientRedirect 파라미터 존재 여부:', !!clientRedirectUrl);

        if (!code || !provider) {
          setError('인증 정보가 올바르지 않습니다.');
          return;
        }

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

          // clientRedirect 파라미터가 있으면 해당 페이지로, 없으면 메인 페이지로 이동
          if (clientRedirectUrl) {
            console.log('클라이언트 리다이렉트 URL:', clientRedirectUrl);
            const decodedUrl = decodeURIComponent(clientRedirectUrl);
            console.log('디코딩된 URL:', decodedUrl);
            replace(decodedUrl);
          } else {
            console.log('clientRedirect 파라미터가 없어서 메인 페이지로 리다이렉트');
            console.log('사용 가능한 파라미터들:', {
              code: !!code,
              provider: !!provider,
              isNewUser: !!isNewUser,
              redirectUrl: !!redirectUrl,
              clientRedirectUrl: !!clientRedirectUrl
            });
            replace("/");
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
            onClick={() => replace('/sign')}
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
