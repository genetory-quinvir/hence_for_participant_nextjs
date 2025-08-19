"use client";

import Image from "next/image";
import { useEffect } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonProfileView from "@/components/common/CommonProfileView";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleNavigation } from "@/utils/navigation";
import NotificationPermission from "@/components/common/NotificationPermission";
import EventCarousel from "@/components/common/EventCarousel";
import EndedEventCarousel from "@/components/common/EndedEventCarousel";

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

  const handleEventClick = (eventId: string) => {
    console.log("이벤트 클릭:", eventId);
    navigate(`/event/${eventId}`);
  };

  // 로그인 상태에 따른 프로필 버튼 렌더링
  const renderProfileButton = () => {
    if (isAuthenticated && user) {
      // 로그인된 경우: CommonProfileView 사용
      return (
        <CommonProfileView
          profileImageUrl={user.profileImageUrl}
          nickname={user.nickname}
          size="md"
          showBorder={true}
          showHover={true}
        />
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
    <div className="min-h-screen w-full bg-black text-white scrollbar-hide">
      {/* 백그라운드 이미지 - 전체 화면 */}
      <div className="fixed inset-0 w-full h-full blur-xl">
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
      <div className="fixed inset-0 bg-black" style={{ opacity: 0.6 }}></div>

      {/* 컨텐츠 레이어 */}
      <div className="relative z-10 w-full min-h-screen flex justify-center scrollbar-hide">
        {/* 메인 컨텐츠 컨테이너 */}
        <div className="w-full max-w-md lg:max-w-2xl xl:max-w-4xl">
          {/* 네비게이션바 */}
          <CommonNavigationBar
            leftButton={<NotificationPermission compact={true} />}
            rightButton={renderProfileButton()}
            onRightClick={handleProfileClick}
            backgroundColor="transparent"
            backgroundOpacity={1}
            textColor="text-white"
            sticky={false}
          />

          {/* 메인 컨텐츠 */}
          <main className="w-full pb-8 scrollbar-hide">
            {/* 히어로 섹션 */}
            <section className="pt-8 lg:pt-12 pb-6 lg:pb-8 mb-4 lg:mb-6">
              <div className="px-4 lg:px-6">
                <img 
                  src="/images/img_logo.png" 
                  alt="HENCE Beta" 
                  className="h-8 lg:h-12 mb-3 lg:mb-4"
                  style={{ maxWidth: '300px' }}
                />
                <p className="text-lg lg:text-xl text-white text-left" style={{ opacity: 0.6 }}>
                  이벤트의 시작과 끝.
                </p>
              </div>
            </section>
            
            {/* 이벤트 캐러셀 */}
            <section className="mb-8 lg:mb-12">
              <EventCarousel 
                onEventClick={handleEventClick} 
                onEntryClick={handleEntryClick}
              />
            </section>
            
            {/* 종료된 이벤트 캐러셀 */}
            <section className="mb-8 lg:mb-16">
              <EndedEventCarousel 
                onEventClick={handleEventClick}
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
