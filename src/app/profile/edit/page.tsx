"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import CommonNavigationBar from "@/components/CommonNavigationBar";

function ProfileEditContent() {
  const router = useRouter();
  const { user, updateUser, isAuthenticated } = useAuth();
  
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  // 사용자 정보로 폼 초기화
  useEffect(() => {
    if (user) {
      setNickname((user.nickname || user.name || "") as string);
      setEmail((user.email || "") as string);
    }
  }, [user]);

  // 인증되지 않은 경우 로딩 표시
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>메인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  const handleBackClick = () => {
    router.back();
  };

  const handleSave = async () => {
    // 입력 검증
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    if (!email.trim()) {
      setError("이메일을 입력해주세요.");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // TODO: 실제 API 호출로 변경
      // const result = await updateProfile({ nickname: nickname.trim(), email: email.trim() });
      
      // 임시로 로컬 상태만 업데이트
      const updatedUser = {
        ...user,
        nickname: nickname.trim(),
        email: email.trim(),
      };
      
      updateUser(updatedUser);
      
      // 성공 메시지 표시
      alert("프로필이 성공적으로 수정되었습니다.");
      
      // 프로필 페이지로 돌아가기
      router.back();
      
    } catch (error) {
      console.error("프로필 수정 오류:", error);
      setError("프로필 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (nickname !== (user?.nickname || user?.name || "") || email !== (user?.email || "")) {
      if (confirm("변경사항이 있습니다. 정말 취소하시겠습니까?")) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden">
      {/* 네비게이션바 */}
      <CommonNavigationBar
        title="프로필 편집"
        leftButton={
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        rightButton={
          <span className="text-white text-sm">
            저장
          </span>
        }
        onLeftClick={handleCancel}
        onRightClick={handleSave}
        backgroundColor="transparent"
        backgroundOpacity={0}
        textColor="text-white"
      />

      {/* 메인 컨텐츠 */}
      <main className="w-full h-full flex flex-col px-4 py-4">
        <div className="w-full">
          {/* 프로필 아바타 섹션 */}
          <div className="flex items-center mb-8">
            <div className="w-[56px] h-[56px] bg-purple-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-2xl font-bold">
                {nickname.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">
                프로필 편집
              </h1>
              <p className="text-white font-normal text-xs" style={{ opacity: 0.6 }}>
                정보를 수정하고 저장하세요
              </p>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* 편집 폼 */}
          <div className="space-y-6">
            {/* 닉네임 입력 */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:border-purple-500 focus:bg-opacity-15 transition-all"
                placeholder="닉네임을 입력하세요"
                maxLength={20}
              />
              <p className="text-white text-xs mt-1" style={{ opacity: 0.6 }}>
                {nickname.length}/20
              </p>
            </div>

            {/* 이메일 입력 */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:border-purple-500 focus:bg-opacity-15 transition-all"
                placeholder="이메일을 입력하세요"
              />
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="absolute bottom-8 left-4 right-4">
            <button
              onClick={handleSave}
              disabled={isSubmitting || !nickname.trim() || !email.trim()}
              className={`w-full py-4 rounded-lg font-semibold text-md transition-all ${
                isSubmitting || !nickname.trim() || !email.trim()
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer'
              }`}
            >
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// 직접 내보내기
export default function ProfileEditPage() {
  return <ProfileEditContent />;
} 