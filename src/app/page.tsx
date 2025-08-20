"use client";

import { useEffect, useState } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleNavigation } from "@/utils/navigation";
import { getUserProfile } from "@/lib/api";
import { UserItem } from "@/types/api";

export default function HomePage() {
  const { navigate } = useSimpleNavigation();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserItem | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // 사용자 프로필 정보 가져오기
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && !userProfile && !profileLoading) {
        setProfileLoading(true);
        try {
          const result = await getUserProfile();
          if (result.success && result.data) {
            setUserProfile(result.data);
          }
        } catch (error) {
          console.error('프로필 정보 가져오기 실패:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, userProfile, profileLoading]);

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
    <div className="h-screen w-full relative overflow-hidden" style={{ height: '100dvh' }}>
      {/* 백그라운드 그라데이션 */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: 'url(/images/bg_entrance.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* 검은색 블러 뷰 */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)'
        }}
      />
      
      {/* 메인 컨텐츠 */}
      <main className="w-full relative z-10 flex flex-col h-full">
        <CommonNavigationBar
        backgroundColor="transparent"
        backgroundOpacity={0}
        textColor="text-white"
        rightButton={
          <button 
            className="ml-auto w-8 h-8 rounded-full flex items-center justify-center transition-colors overflow-hidden"
            style={{
              backgroundColor: isAuthenticated ? 'transparent' : 'rgba(255, 255, 255, 0.05)'
            }}
            onClick={() => navigate(isAuthenticated ? "/profile" : "/sign")}
          >
            {isAuthenticated && userProfile?.profileImageUrl ? (
              <img 
                src={userProfile.profileImageUrl} 
                alt="프로필" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : isAuthenticated ? (
              <img 
                src="/images/icon_profile.png" 
                alt="프로필 아이콘" 
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <img 
                src="/images/icon_profile.png" 
                alt="프로필 아이콘" 
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            )}
            
            {/* 폴백: 초기 이니셜 */}
            <div className="w-full h-full bg-white bg-opacity-20 rounded-full flex items-center justify-center hidden">
              <span className="text-white font-bold text-sm">
                {userProfile?.nickname ? userProfile.nickname.charAt(0).toUpperCase() : 
                 user?.nickname ? user.nickname.charAt(0).toUpperCase() : 
                 user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </button>
        }
        ></CommonNavigationBar>

        <div className="mt-auto"
          style={{ paddingBottom: 'max(48px, env(safe-area-inset-bottom) + 48px)' }}>
          <div className="text-left text-white text-3xl font-bold px-4 py-2 mb-4 leading-11"> 
            HENCE와 함께하는<br></br>서울과학기술대학교 횃불제
          </div>
          <div className="w-full items-center justify-center px-12"> 
            <button 
              className="text-white text-md font-bold px-4 py-2 rounded-full w-full h-12"
              style={{
                background: 'linear-gradient(135deg,rgb(93, 0, 255), #ec4899)'
              }}
              onClick={() => navigate(isAuthenticated ? "/qr" : "/sign")}
            >
              입장하기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
