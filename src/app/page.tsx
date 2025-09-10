"use client";

import { useEffect, useState } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleNavigation } from "@/utils/navigation";
import { getUserProfile, checkEventCode } from "@/lib/api";
import { UserItem } from "@/types/api";
import { useToast } from "@/components/common/Toast";
import CodeInputModal from "@/components/common/CodeInputModal";

export default function HomePage() {
  const { navigate } = useSimpleNavigation();
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [userProfile, setUserProfile] = useState<UserItem | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [pendingEventUrl, setPendingEventUrl] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);

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



  // 대기 중인 이벤트 확인 (인증 로딩 완료 후에만 처리)
  useEffect(() => {
    // 인증 로딩이 완료된 후에만 처리
    if (authLoading) {
      return;
    }

    const pendingEventId = sessionStorage.getItem('pendingEventId');
    const pendingUrl = sessionStorage.getItem('pendingEventUrl');
    
    if (pendingEventId && pendingUrl) {
      if (!isAuthenticated) {
        // 로그인이 안된 경우에만 로그인 알럿 표시
        setPendingEventUrl(pendingUrl);
        setShowLoginAlert(true);
      } else {
        // 로그인이 된 경우 바로 이벤트 페이지로 이동
        navigate(pendingUrl);
      }
      // sessionStorage에서 제거
      sessionStorage.removeItem('pendingEventId');
      sessionStorage.removeItem('pendingEventUrl');
    }
  }, [isAuthenticated, authLoading, navigate]);

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
    <div className="h-screen w-full relative overflow-hidden" style={{ height: '100dvh' }} data-dl-page="main">
      {/* 백그라운드 그라데이션 */}
      <div 
        className="fixed inset-0 w-full h-full"
        style={{
          backgroundImage: 'url(/images/bg_entrance.webp)',
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
             className={`ml-auto flex items-center justify-center transition-colors ${
               isAuthenticated ? 'w-8 h-8 rounded-full overflow-hidden' : 'px-4 py-2 rounded-lg mt-2'
             }`}
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
              <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-sm">
                  {userProfile?.nickname ? userProfile.nickname.charAt(0).toUpperCase() : 
                   user?.nickname ? user.nickname.charAt(0).toUpperCase() : 
                   user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            ) : (
              <span className="text-white text-sm font-semibold">
                로그인
              </span>
            )}
            
            {/* 폴백: 초기 이니셜 */}
            <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center hidden">
              <span className="text-black font-bold text-sm">
                {userProfile?.nickname ? userProfile.nickname.charAt(0).toUpperCase() : 
                 user?.nickname ? user.nickname.charAt(0).toUpperCase() : 
                 user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </button>
        }
        ></CommonNavigationBar>

        <div className="mt-auto"
          style={{ paddingBottom: 'calc(48px + env(safe-area-inset-bottom))' }}>
          <div className="text-left text-white text-3xl font-bold px-4 py-2 mb-4 leading-11"> 
            HENCE와 함께하는<br></br>서울과학기술대학교 횃불제
          </div>
          <div className="w-full items-center justify-center px-12"> 
            <button 
              className="text-white text-md font-bold px-4 py-2 rounded-full w-full h-12"
              style={{
                background: 'linear-gradient(135deg,rgb(93, 0, 255), #ec4899)'
              }}
              onClick={() => {
                if (isAuthenticated) {
                  setShowCodeModal(true);
                } else {
                  navigate("/sign");
                }
              }}
            >
              입장하기
            </button>
          </div>
        </div>
      </main>

      {/* 로그인 알림 */}
      {showLoginAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" style={{ 
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)'
          }}>
            {/* 헤더 */}
            <div className="mb-6">
              <div className="flex items-center justify-center">
                <img 
                  src="/images/icon_profile.png" 
                  alt="로그인 아이콘" 
                  className="w-12 h-12 object-contain mr-3 mt-1 flex-shrink-0"
                  style={{ 
                    animationDuration: '1.5s', 
                    animationIterationCount: 'infinite', 
                    animationTimingFunction: 'ease-in-out',
                    animation: 'gentleBounce 1.5s ease-in-out infinite'
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <style jsx>{`
                  @keyframes gentleBounce {
                    0%, 100% {
                      transform: translateY(0);
                    }
                    50% {
                      transform: translateY(-4px);
                    }
                  }
                `}</style>
                <div className="flex-1">
                  <h2 className="text-black text-xl font-bold mb-1">로그인이 필요합니다</h2>
                  <p className="text-black font-regular text-sm" style={{ opacity: 0.7 }}>
                    이벤트에 참여하려면 로그인이 필요합니다
                  </p>
                </div>
              </div>
            </div>

            {/* 메시지 */}
            <div className="mb-6">
                <p className="text-black font-regular text-md text-center" style={{ opacity: 0.8 }}>
                  로그인하시면 이벤트에 참여할 수 있습니다
                </p>
            </div>

            {/* 버튼 */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowLoginAlert(false);
                  setPendingEventUrl(null);
                }}
                className="flex-1 py-3 px-4 rounded-lg text-black font-normal transition-colors"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
              >
                나중에
              </button>
              <button
                onClick={() => {
                  setShowLoginAlert(false);
                  navigate(`/sign?redirect=${encodeURIComponent(pendingEventUrl || '/')}`);
                }}
                className="flex-1 py-3 px-4 rounded-lg font-bold transition-colors bg-purple-600 hover:bg-purple-700 text-white"
              >
                로그인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR 코드 입력 모달 */}
      <CodeInputModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSubmit={async (code) => {
          setIsCheckingCode(true);
          try {
            const result = await checkEventCode(code);
            if (result.success && result.event) {
              const eventId = result.event.id;
              // showToast("입장코드가 확인되었습니다.", "success");
              setShowCodeModal(false);
              navigate(`/event?id=${eventId}`);
            } else {
              showToast(result.error || "잘못된 입장코드입니다.", "error");
            }
          } catch (error) {
            console.error('입장코드 확인 실패:', error);
            showToast("입장코드 확인 중 오류가 발생했습니다.", "error");
          } finally {
            setIsCheckingCode(false);
          }
        }}
        isChecking={isCheckingCode}
      />

    </div>
  );
}
