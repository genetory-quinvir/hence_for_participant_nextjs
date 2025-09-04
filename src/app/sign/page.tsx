"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { loginUser, saveTokens } from "@/lib/api";
import { SocialProvider } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleNavigation } from "@/utils/navigation";
import { useToast } from "@/components/common/Toast";
import { 
  determineSocialLoginRedirect, 
  addRedirectToSocialLoginUrl, 
  getCurrentRedirectContext 
} from "@/utils/redirect";

function SignContent() {
  const { navigate, goBack, replace } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBackClick = () => {
    goBack();
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault(); // 폼 제출 기본 동작 방지
    }

    // 입력 검증
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("로그인 시도:", { email });

      const response = await loginUser(email, password);

      if (response.success && response.access_token) {
        // 토큰들 저장
        saveTokens(response.access_token, response.refresh_token);

        console.log("로그인 성공:", response.data);

        // AuthContext에 로그인 상태 업데이트
        if (response.data) {
          login(
            {
              id: response.data.id || '1',
              name: response.data.nickname || '사용자',
              nickname: response.data.nickname || '사용자',
              email: response.data.email || email,
            },
            response.access_token,
            response.refresh_token
          );
        }

        // redirect 파라미터가 있으면 해당 페이지로, 없으면 메인 페이지로 이동
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          // router.replace를 사용하여 히스토리에서 로그인 페이지를 교체
          replace(decodeURIComponent(redirectUrl));
        } else {
          // router.replace를 사용하여 히스토리에서 로그인 페이지를 교체
          replace("/");
        }
      } else {
        setError(response.error || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("로그인 에러:", error);
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    console.log("회원가입 버튼 클릭");
    // 회원가입 페이지로 이동
    navigate("/signup");
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    console.log(`${provider} 로그인 클릭`);
    setError("");

    // 현재 페이지의 redirect 파라미터 가져오기
    const redirectUrl = searchParams.get('redirect');
    
    console.log('로그인 페이지에서 받은 redirect 파라미터:', redirectUrl);

    // 소셜 로그인 시 이벤트 정보를 sessionStorage에 저장
    if (redirectUrl && redirectUrl.includes('/event')) {
      sessionStorage.setItem('socialLoginRedirectUrl', redirectUrl);
      console.log('소셜 로그인 리다이렉트 URL 저장:', redirectUrl);
    }

    // 소셜 로그인 URL 생성 - 콜백 URL을 명시적으로 지정
    const callbackUrl = `${window.location.origin}/auth/callback`;
    const baseUrl = `http://api.hence.events/api/v1/auth/${provider}?redirect=participant&joinPlatform=participant&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    const socialLoginUrl = addRedirectToSocialLoginUrl(baseUrl, redirectUrl);
    
    console.log(`${provider} 로그인 URL:`, socialLoginUrl);
    
    // 소셜 로그인 페이지로 이동
    window.location.href = socialLoginUrl;
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-white text-black overflow-hidden" data-dl-page="login">
      <div className="w-full max-w-[700px] mx-auto h-full flex flex-col overflow-hidden">
        {/* 네비게이션바 */}
        <CommonNavigationBar
          leftButton={
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          onLeftClick={handleBackClick}
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
          sticky={true}
          fixedHeight={true}
        />

        {/* 메인 컨텐츠 */}
        <main className="w-full h-full flex flex-col px-4 py-4">
        <div className="w-full">
          {/* 로고/제목 섹션 */}
          <div className="text-center mb-4">
            <img 
              src="/images/img_logo_black.png" 
              alt="HENCE" 
              className="h-8 mx-auto mb-2"
              style={{ maxWidth: '200px' }}
            />
            <p className="text-black text-sm" style={{ opacity: 0.6 }}>
              이벤트의 시작과 끝
            </p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleLogin} noValidate data-dl-submit="email_login_start">
            <div className="space-y-6 mb-6">
              {/* 이메일 입력 */}
              <div>
                <label className="block text-black text-sm mb-2" style={{ opacity: 0.8 }}>
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 rounded-xl bg-gray-100 text-black focus:outline-none transition-all h-14"
                  style={{
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid #7C3AED'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.2)'}
                />
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label className="block text-black text-sm mb-2" style={{ opacity: 0.8 }}>
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 pr-12 rounded-xl bg-gray-100 text-black focus:outline-none transition-all h-14"
                    style={{
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                    }}
                    onFocus={(e) => e.target.style.border = '1px solid #7C3AED'}
                    onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.2)'}
                  />
                  
                  {/* 비밀번호 보기/숨기기 토글 버튼 */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    style={{ opacity: 0.7 }}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* 비밀번호 찾기 버튼 */}
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => console.log("비밀번호 찾기 클릭")}
                    className="text-black text-xs hover:text-black transition-colors underline"
                    style={{ opacity: 0.7 }}
                  >
                    비밀번호를 잊어버리셨나요?
                  </button>
                </div>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-xl py-3 mb-4 transition-colors ${
                isLoading
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
              }`}
            >
              <div className="text-white font-semibold">
                {isLoading ? "로그인 중..." : "로그인"}
              </div>
            </button>
          </form>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* 회원가입 링크 */}
          <div className="text-center">
            <button
              type="button"
              onClick={handleSignUp}
              className="text-black text-sm"
              data-dl-event="signup_button_click"
              data-cta-id="go_signup"
              data-dest="/signup"
              data-from-step="login_page"
            >
              계정이 없으신가요? <span className="text-purple-700 font-bold hover:text-purple-800">회원가입</span>
            </button>
          </div>

          {/* 추가 옵션 */}
          <div className="mt-8 text-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-center justify-center mb-6">
              <div className="flex-1 h-px bg-gray-300 mx-4"></div>
              <span className="text-black text-sm px-4">또는</span>
              <div className="flex-1 h-px bg-gray-300 mx-4"></div>
            </div>

            {/* 소셜 로그인 버튼들 */}
            <div className="flex justify-center space-x-4 mt-6">
              {/* 카카오 */}
              <button
                type="button"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 bg-white overflow-hidden"
                onClick={() => handleSocialLogin('kakao')}
                data-dl-event="auth_cta_click"
                data-provider="kakao"
                aria-label="카카오 로그인"
              >
                <img 
                  src="/images/icon_kakao.png" 
                  alt="카카오 로그인" 
                  className="w-full h-full object-cover"
                />
              </button>

              {/* 네이버 */}
              <button
                type="button"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 bg-white overflow-hidden"
                onClick={() => handleSocialLogin('naver')}
                data-dl-event="auth_cta_click"
                data-provider="naver"
                aria-label="네이버 로그인"
              >
                <img 
                  src="/images/icon_naver.png" 
                  alt="네이버 로그인" 
                  className="w-full h-full object-cover"
                />
              </button>

              {/* 구글 */}
              <button
                type="button"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-opacity hover:opacity-80 bg-white overflow-hidden"
                onClick={() => handleSocialLogin('google')}
                data-dl-event="auth_cta_click"
                data-provider="google"
                aria-label="구글 로그인"
              >
                <img 
                  src="/images/icon_google.png" 
                  alt="구글 로그인" 
                  className="w-full h-full object-cover"
                />
              </button>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function SignLoading() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>로그인 페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function SignPage() {
  return (
    <Suspense fallback={<SignLoading />}>
      <SignContent />
    </Suspense>
  );
}