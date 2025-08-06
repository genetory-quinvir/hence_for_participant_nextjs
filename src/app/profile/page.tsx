"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CommonNavigationBar from "@/components/CommonNavigationBar";

function ProfilePageContent() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

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

  const handleLogout = () => {
    if (confirm("로그아웃하시겠습니까?")) {
      router.push("/");
      logout();
    }
  };

  const handleEditProfile = () => {
    console.log("프로필 수정 클릭");
    // 프로필 수정 페이지로 이동
  };

  const handleChangePassword = () => {
    console.log("비밀번호 변경 클릭");
    // 비밀번호 변경 페이지로 이동
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden">
      {/* 네비게이션바 */}
      <CommonNavigationBar
        title="프로필"
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
        rightButton={
          <span className="text-white text-sm">
            로그아웃
          </span>
        }
        onLeftClick={handleBackClick}
        onRightClick={handleLogout}
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
                {user?.nickname?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">
                {user?.nickname || user?.name || '사용자'}
              </h1>
              <p className="text-white font-normal text-xs" style={{ opacity: 0.6 }}>
                {user?.email || '이메일 정보 없음'}
              </p>
            </div>
            <button
              onClick={handleEditProfile}
              className="px-3 py-2 rounded-lg bg-purple-600 font-semibold text-white text-xs transition-colors"
            >
              프로필 편집
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// 직접 내보내기 (ProtectedRoute 제거)
export default function ProfilePage() {
  return <ProfilePageContent />;
} 