"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { registerUser, saveTokens } from "@/lib/api";
import { SocialProvider } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleNavigation } from "@/utils/navigation";
import { useToast } from "@/components/common/Toast";

function SignupContent() {
  const { navigate, goBack, replace } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  const handleBackClick = () => {
    goBack();
  };

  const handleSignup = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault(); // 폼 제출 기본 동작 방지
    }

    // 입력 검증
    if (!email || !password || !confirmPassword) {
      showToast("모든 필드를 입력해주세요.", "error");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("올바른 이메일 형식을 입력해주세요.", "error");
      return;
    }

    // 비밀번호 확인
    if (password !== confirmPassword) {
      showToast("비밀번호가 일치하지 않습니다.", "error");
      return;
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      showToast("비밀번호는 6자 이상이어야 합니다.", "error");
      return;
    }



    setIsLoading(true);

    try {
      console.log("회원가입 시도:", { email });

      // 이메일에서 닉네임 자동 생성 (이메일 앞부분 사용)
      const nickname = email.split('@')[0];
      const response = await registerUser(email, password, nickname, confirmPassword);

      if (response.success && response.access_token) {
        console.log("회원가입 성공:", response.data);

        // 토큰들 저장
        saveTokens(response.access_token, response.refresh_token);

        // 회원가입 성공 후 자동 로그인
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

        showToast("회원가입이 완료되었습니다!", "success");

        // redirect 파라미터가 있으면 해당 페이지로, 없으면 메인 페이지로 이동
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          replace(decodeURIComponent(redirectUrl));
        } else {
          replace("/");
        }
      } else {
        showToast(response.error || "회원가입에 실패했습니다.", "error");
      }
    } catch (error) {
      console.error("회원가입 에러:", error);
      showToast("네트워크 오류가 발생했습니다. 다시 시도해주세요.", "error");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 w-full h-full bg-white text-black overflow-hidden">
      {/* 네비게이션바 */}
      <CommonNavigationBar
        leftButton={
          <svg
            className="w-6 h-6 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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

          {/* 회원가입 폼 */}
          <form onSubmit={handleSignup} noValidate>
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
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  placeholder="비밀번호를 입력하세요 (6자 이상)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 rounded-xl bg-gray-100 text-black focus:outline-none transition-all h-14"
                  style={{
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid #7C3AED'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.2)'}
                />
              </div>

              {/* 비밀번호 확인 입력 */}
              <div>
                <label className="block text-black text-sm mb-2" style={{ opacity: 0.8 }}>
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 rounded-xl bg-gray-100 text-black focus:outline-none transition-all h-14"
                  style={{
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid #7C3AED'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.2)'}
                />
              </div>
            </div>

            {/* 회원가입 버튼 */}
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
                {isLoading ? "회원가입 중..." : "회원가입"}
              </div>
            </button>
          </form>



          {/* 로그인 링크 */}
          <div className="text-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <button
              type="button"
              onClick={() => navigate("/sign")}
              className="text-black text-sm"
            >
              이미 계정이 있으신가요? <span className="text-purple-700 font-bold hover:text-purple-800">로그인</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// 로딩 컴포넌트
function SignupLoading() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>회원가입 페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupContent />
    </Suspense>
  );
}
