"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CommonNavigationBar from "@/components/CommonNavigationBar";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      router.replace("/");
    }
  }, [isAuthenticated, user, router, authLoading]);

  const handleBackClick = () => {
    // sessionStorage에서 이전 페이지 정보 확인
    const previousPage = sessionStorage.getItem('previousPage');
    
    if (previousPage) {
      // 이전 페이지가 프로필인 경우
      if (previousPage.startsWith('/profile')) {
        router.push('/profile');
      } else if (previousPage === '/') {
        // 이전 페이지가 메인 페이지인 경우
        router.push('/');
      } else {
        // 다른 페이지인 경우 해당 페이지로 이동
        router.push(previousPage);
      }
    } else {
      // 이전 페이지 정보가 없으면 메인 페이지로
      router.push('/');
    }
  };

  const handleLogout = () => {
    if (confirm("로그아웃하시겠습니까?")) {
      logout();
      router.replace("/");
    }
  };

  // 로딩 상태
  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>
            {authLoading ? '인증 확인 중...' : '메인 페이지로 이동 중...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden">
      {/* 네비게이션바 */}
      <CommonNavigationBar
        title="설정"
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
        onLeftClick={handleBackClick}
        backgroundColor="transparent"
        backgroundOpacity={0}
        textColor="text-white"
      />

      {/* 메인 컨텐츠 */}
      <main className="w-full h-full flex flex-col px-4 py-4">
        <div className="w-full h-full flex flex-col">
          {/* 설정 메뉴 */}
          <div className="space-y-4">
            {/* 계정 정보 */}
            <div className="p-4 bg-opacity-5 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <h3 className="text-lg font-bold text-white mb-2">계정 정보</h3>
              <div className="space-y-2 text-sm text-white text-opacity-70">
                <div className="flex justify-between">
                  <span>이메일</span>
                  <span>{user.email || '이메일 정보 없음'}</span>
                </div>
                <div className="flex justify-between">
                  <span>닉네임</span>
                  <span>{user.nickname || '닉네임 정보 없음'}</span>
                </div>
              </div>
            </div>

            {/* 앱 정보 */}
            <div className="p-4 bg-opacity-5 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <h3 className="text-lg font-bold text-white mb-2">앱 정보</h3>
              <div className="space-y-2 text-sm text-white text-opacity-70">
                <div className="flex justify-between">
                  <span>버전</span>
                  <span>1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>빌드 번호</span>
                  <span>2024.01.01</span>
                </div>
              </div>
            </div>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="w-full p-4 bg-red-600 hover:bg-red-700 rounded-xl font-semibold text-white transition-all"
            >
              로그아웃
            </button>
          </div>
        </div>
      </main>
    </div>
  );
} 