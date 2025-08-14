"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { loginUser, saveTokens } from "@/lib/api";
import { SocialProvider } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleNavigation } from "@/utils/navigation";

function SignContent() {
  const { navigate, goBack, replace } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

        // 성공 메시지 표시 후 redirect 파라미터가 있으면 해당 페이지로, 없으면 메인 페이지로 이동
        alert(`환영합니다, ${response.data?.nickname || '사용자'}님!`);
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
    // 회원가입 페이지로 이동 또는 모달 표시
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    console.log(`${provider} 로그인 클릭`);
    setError("");

    // 향후 소셜 로그인 SDK 연동
    alert(`${provider} 로그인 기능은 준비 중입니다.`);
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden">
      {/* 네비게이션바 */}
      <CommonNavigationBar
        leftButton={
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        }
        onLeftClick={handleBackClick}
        backgroundColor="transparent"
        backgroundOpacity={0}
        textColor="text-white"
      />

      {/* 메인 컨텐츠 */}
      <main className="w-full h-full flex flex-col px-4 py-4">
        <div className="w-full">
          {/* 로고/제목 섹션 */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-semibold text-white mb-0 tracking-wider">
              HENCE
            </h1>
            <p className="text-white text-sm" style={{ opacity: 0.6 }}>
              이벤트의 시작과 끝
            </p>
          </div>

          {/* 로그인 폼 */}
          <form onSubmit={handleLogin} noValidate>
            <div className="space-y-6 mb-6">
              {/* 이메일 입력 */}
              <div>
                <label className="block text-white text-sm mb-2" style={{ opacity: 0.8 }}>
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 rounded-xl bg-black text-white focus:outline-none transition-all placeholder-custom h-14"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.5)'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)'}
                />
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label className="block text-white text-sm mb-2" style={{ opacity: 0.8 }}>
                  비밀번호
                </label>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 rounded-xl bg-black text-white focus:outline-none transition-all placeholder-custom h-14"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.5)'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)'}
                />

                {/* 비밀번호 찾기 버튼 */}
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => console.log("비밀번호 찾기 클릭")}
                    className="text-white text-xs hover:text-white transition-colors underline"
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
              className={`w-full rounded-xl p-4 mb-4 transition-colors h-14 ${
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
              className="text-white text-sm"
              style={{ opacity: 0.6 }}
            >
              계정이 없으신가요? <span className="text-purple-400 hover:text-purple-300">회원가입</span>
            </button>
          </div>

          {/* 추가 옵션 */}
          <div className="mt-8 text-center">
            <p className="text-white text-sm" style={{ opacity: 0.6 }}>
              소셜 로그인으로 간편하게 시작하세요
            </p>

            {/* 소셜 로그인 버튼들 */}
            <div className="flex justify-center space-x-4 mt-6">
              {/* 카카오 */}
              <button
                type="button"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#FEE500' }}
                onClick={() => handleSocialLogin('kakao')}
              >
                <span className="text-black font-bold text-sm">K</span>
              </button>

              {/* 네이버 */}
              <button
                type="button"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#03C75A' }}
                onClick={() => handleSocialLogin('naver')}
              >
                <span className="text-white font-bold text-sm">N</span>
              </button>

              {/* 구글 */}
              <button
                type="button"
                className="w-12 h-12 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#ffffff' }}
                onClick={() => handleSocialLogin('google')}
              >
                <span className="text-black font-bold text-sm">G</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// 로딩 컴포넌트
function SignLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
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