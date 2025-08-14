"use client";

import Image from "next/image";
import { useEffect } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleNavigation } from "@/utils/navigation";

export default function HomePage() {
  const { navigate } = useSimpleNavigation();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();

  // 메인 페이지 진입 시 히스토리에 추가
  useEffect(() => {
    // 브라우저 히스토리만 사용하므로 별도 관리 불필요
  }, []);

  const handleProfileClick = () => {
    if (isAuthenticated && user) {
      console.log("프로필 버튼 클릭 - 프로필 페이지로 이동");
      navigate("/profile");
    } else {
      console.log("프로필 버튼 클릭 - 로그인 페이지로 이동");
      navigate("/sign");
    }
  };

  const handleEntryClick = () => {
    console.log("입장하기 버튼 클릭");
    
    // 로그인 상태 확인
    if (!isAuthenticated || !user) {
      console.log("로그인이 필요합니다 - 로그인 페이지로 이동");
      navigate("/sign");
      return;
    }
    
    console.log("로그인된 사용자 - QR 페이지로 이동");
    navigate("/qr");
  };

  // 로그인 상태에 따른 프로필 버튼 렌더링
  const renderProfileButton = () => {
    if (isAuthenticated && user) {
      // 로그인된 경우: 사용자 아바타 또는 프로필 아이콘
      const userName = user.nickname || user.email || '사용자';
      const userInitial = userName.charAt(0).toUpperCase();
      
      return (
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            border: '3px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span className="text-white text-sm font-semibold">
              {userInitial}
            </span>
          </div>
          <span className="text-white text-sm hidden sm:block" style={{ opacity: 0.8 }}>
            {userName}
          </span>
        </div>
      );
    } else {
      // 로그인되지 않은 경우: 투명 배경에 하얀색 보더
      return (
        <div 
          className="rounded-lg px-4 py-1 transition-colors hover:bg-white hover:bg-opacity-10"
          style={{ 
            border: '1px solid rgba(255, 255, 255, 0.6)',
            backgroundColor: 'transparent'
          }}
        >
          <span className="text-white text-sm font-medium">
            로그인
          </span>
        </div>
      );
    }
  };

  // 인증 로딩 중일 때 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden">
      {/* 백그라운드 이미지 - 전체 화면 */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/bg_entrance.png"
          alt="Background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
      </div>

      {/* 딤 뷰 */}
      <div className="absolute inset-0 bg-black" style={{ opacity: 0.7 }}></div>

      {/* 컨텐츠 레이어 */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {/* 네비게이션바 */}
        <CommonNavigationBar
          rightButton={renderProfileButton()}
          onRightClick={handleProfileClick}
          backgroundColor="transparent"
          backgroundOpacity={0}
          textColor="text-white"
        />

        {/* 메인 컨텐츠 */}
        <main className="flex-1 flex flex-col">
          {/* 히어로 섹션 */}
          <section className="flex-1 flex flex-col pt-10 px-6">
            <h1 className="text-6xl font-bold text-white mb-4 tracking-wider text-left">
              HENCE Beta
            </h1>
            <p className="text-lg text-white text-left" style={{ opacity: 0.6 }}>
              이벤트의 시작과 끝.
            </p>
          </section>

          {/* 정보 및 액션 섹션 */}
          <section className="px-6 pb-8">
            {/* 정보 섹션 */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-1">
                이벤트 입장하기
              </h2>
              <p className="text-white" style={{ opacity: 0.6 }}>
                QR 스캔 또는 코드 입력으로 참여하세요
              </p>
            </div>

            {/* 액션 버튼 */}
            <button
              onClick={handleEntryClick}
              className="w-full bg-purple-700 hover:bg-purple-700 active:bg-purple-800 rounded-xl p-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center">
                {/* QR코드 아이콘 */}
                <div className="bg-purple-600 p-3 rounded-lg mr-3 flex items-center justify-center w-16 h-16">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 11V3h8v8H3zm2-6v4h4V5H5zM3 21v-8h8v8H3zm2-6v4h4v-4H5zM13 3h8v8h-8V3zm2 2v4h4V5h-4zM19 19h2v2h-2v-2zM13 13h2v2h-2v-2zM15 15h2v2h-2v-2zM13 17h2v2h-2v-2zM15 19h2v2h-2v-2zM17 13h2v2h-2v-2zM19 15h2v2h-2v-2zM17 17h2v2h-2v-2z"/>
                  </svg>
                </div>

                <div className="text-left pl-2">
                  <div className="text-white text-xl font-bold pb-1">입장하기</div>
                  <div className="text-white" style={{ opacity: 0.6 }}>QR 스캔ㆍ코드 입력</div>
                </div>
              </div>

              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </section>

          {/* 하단 안내 텍스트 */}
          <section className="px-6 pb-10">
            <p className="text-white text-xs text-left" style={{ opacity: 0.6 }}>
              문제가 있으시면 현장 스태프에게 문의해주세요
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
