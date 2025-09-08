"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { registerUser, saveTokens } from "@/lib/api";
import { SocialProvider } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleNavigation } from "@/utils/navigation";
import { useToast } from "@/components/common/Toast";

// Google Analytics 타입 정의
declare global {
  interface Window {
    dataLayer: any[];
    __dlSignupFired?: boolean;
  }
}

function SignupContent() {
  const { navigate, goBack, replace } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const handleBackClick = () => {
    goBack();
  };

  // 비밀번호 정책 검증 함수
  const validatePassword = (password: string) => {
    // 최소 길이 8자
    if (password.length < 8) {
      return {
        isValid: false,
        message: "비밀번호는 8자 이상이어야 합니다."
      };
    }

    // 최대 길이 20자
    if (password.length > 20) {
      return {
        isValid: false,
        message: "비밀번호는 20자 이하여야 합니다."
      };
    }

    // 영문자 포함 여부
    if (!/[a-zA-Z]/.test(password)) {
      return {
        isValid: false,
        message: "비밀번호에 영문자가 포함되어야 합니다."
      };
    }

    // 숫자 포함 여부
    if (!/\d/.test(password)) {
      return {
        isValid: false,
        message: "비밀번호에 숫자가 포함되어야 합니다."
      };
    }

    // 특수문자 포함 여부
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return {
        isValid: false,
        message: "비밀번호에 특수문자가 포함되어야 합니다."
      };
    }

    // 연속된 문자 3개 이상 금지
    if (/(.)\1{2,}/.test(password)) {
      return {
        isValid: false,
        message: "비밀번호에 연속된 문자 3개 이상은 사용할 수 없습니다."
      };
    }

    // 연속된 숫자 3개 이상 금지 (123, 456 등)
    if (/(012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/.test(password)) {
      return {
        isValid: false,
        message: "비밀번호에 연속된 숫자는 사용할 수 없습니다."
      };
    }

    // 공백 포함 여부
    if (/\s/.test(password)) {
      return {
        isValid: false,
        message: "비밀번호에 공백은 포함할 수 없습니다."
      };
    }

    return {
      isValid: true,
      message: "비밀번호가 정책에 맞습니다."
    };
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

    // 비밀번호 정책 검증
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      showToast(passwordValidation.message, "error");
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

        // Google Analytics 이벤트 트리거
        try {
          // dataLayer가 없으면 초기화
          if (!window.dataLayer) {
            window.dataLayer = [];
          }
          
          // 중복 실행 방지
          if (!window.__dlSignupFired) {
            window.__dlSignupFired = true;
            
            const userId = response.data?.id || '1';
            
            window.dataLayer.push({
              event: 'signup_success',
              method: 'email',
              user_id: userId,
              eventCallback: function () {
                // redirect 파라미터가 있으면 해당 페이지로, 없으면 메인 페이지로 이동
                const redirectUrl = searchParams.get('redirect');
                const nextUrl = redirectUrl ? decodeURIComponent(redirectUrl) : '/';
                console.log('📊 GA 회원가입 이벤트 완료, 리다이렉트:', nextUrl);
                location.replace(nextUrl);
              },
              eventTimeout: 2000
            });
            
            console.log('📊 Google Analytics 회원가입 이벤트 전송:', {
              event: 'signup_success',
              method: 'email',
              user_id: userId
            });
          } else {
            console.log('📊 GA 회원가입 이벤트 이미 실행됨, 바로 리다이렉트');
            // 이미 실행된 경우 바로 리다이렉트
            const redirectUrl = searchParams.get('redirect');
            const nextUrl = redirectUrl ? decodeURIComponent(redirectUrl) : '/';
            window.location.href = nextUrl;
          }
        } catch (gaError) {
          console.error('❌ Google Analytics 회원가입 이벤트 전송 실패:', gaError);
          // GA 실패해도 회원가입은 성공했으므로 리다이렉트
          const redirectUrl = searchParams.get('redirect');
          const nextUrl = redirectUrl ? decodeURIComponent(redirectUrl) : '/';
          window.location.href = nextUrl;
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
    <div className="fixed inset-0 w-full h-full bg-white text-black overflow-hidden" data-dl-page="signup">
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
          <form onSubmit={handleSignup} noValidate data-dl-submit="email_signup_start">
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
                {/* 비밀번호 정책 안내 */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    placeholder="비밀번호를 입력하세요 (8-20자, 영문+숫자+특수문자)"
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
              </div>

              {/* 비밀번호 확인 입력 */}
              <div>
                <label className="block text-black text-sm mb-2" style={{ opacity: 0.8 }}>
                  비밀번호 확인
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 pr-12 rounded-xl bg-gray-100 text-black focus:outline-none transition-all h-14"
                    style={{
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                    }}
                    onFocus={(e) => e.target.style.border = '1px solid #7C3AED'}
                    onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.2)'}
                  />
                  
                  {/* 비밀번호 확인 보기/숨기기 토글 버튼 */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    style={{ opacity: 0.7 }}
                  >
                    {showConfirmPassword ? (
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
