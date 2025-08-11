"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { checkEventCode, getFeaturedEvent } from "@/lib/api";
import { FeaturedItem } from "@/types/api";
import EventHero from "@/components/event/EventHero";
import EventInfo from "@/components/event/EventInfo";
import EventRaffle from "@/components/event/EventRaffle";
import EventCoupon from "@/components/event/EventCoupon";
import EventNotice from "@/components/event/EventNotice";
import EventParticipants from "@/components/event/EventParticipants";
import EventTimeline from "@/components/event/EventTimeline";
import EventFoodTrucks from "@/components/event/EventFoodTrucks";
import EventCommunity from "@/components/event/EventCommunity";
import EventHelp from "@/components/event/EventHelp";

function EventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [featuredData, setFeaturedData] = useState<FeaturedItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    // 인증 상태 확인이 완료된 후에만 리다이렉트 처리
    if (!authLoading && (!isAuthenticated || !user)) {
      router.push("/");
    }
  }, [isAuthenticated, user, authLoading, router]);

  // 이벤트 데이터 가져오기
  useEffect(() => {
    const eventCode = searchParams.get('code');
    const eventId = searchParams.get('eventId');
    
    if (eventCode || eventId) {
      setIsLoading(true);
      setError(null);
      
      if (eventId) {
        // eventId가 있으면 직접 이벤트 정보 가져오기
        getFeaturedEvent(eventId)
          .then((featuredResult) => {
            if (featuredResult && featuredResult.success && featuredResult.featured) {
              setFeaturedData(featuredResult.featured);
              console.log('이벤트 종합 정보 로드 성공:', featuredResult.featured);
            } else if (featuredResult) {
              setError(featuredResult.error || '이벤트 종합 정보를 가져올 수 없습니다.');
              console.error('이벤트 종합 정보 로드 실패:', featuredResult.error);
            }
          })
          .catch((error) => {
            setError('이벤트 로드 중 오류가 발생했습니다.');
            console.error('이벤트 로드 오류:', error);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else if (eventCode) {
        // 1단계: 이벤트 코드로 이벤트 확인
        checkEventCode(eventCode)
          .then((result) => {
            if (result.success && result.event) {
              console.log('이벤트 코드 확인 성공:', result.event);
              
              // 2단계: 이벤트 ID로 상세 정보 가져오기
              if (result.event.id) {
                return getFeaturedEvent(result.event.id);
              } else {
                throw new Error('이벤트 ID가 없습니다.');
              }
            } else {
              setError(result.error || '이벤트를 찾을 수 없습니다.');
              console.error('이벤트 코드 확인 실패:', result.error);
              return null;
            }
          })
          .then((featuredResult) => {
            if (featuredResult && featuredResult.success && featuredResult.featured) {
              setFeaturedData(featuredResult.featured);
              console.log('이벤트 종합 정보 로드 성공:', featuredResult.featured);
            } else if (featuredResult) {
              setError(featuredResult.error || '이벤트 종합 정보를 가져올 수 없습니다.');
              console.error('이벤트 종합 정보 로드 실패:', featuredResult.error);
            }
          })
          .catch((error) => {
            setError('이벤트 로드 중 오류가 발생했습니다.');
            console.error('이벤트 로드 오류:', error);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, [searchParams]);

  const handleBackClick = () => {
    router.back();
  };

  const handleProfileClick = () => {
    if (user) {
      console.log("프로필 버튼 클릭 - 프로필 페이지로 이동");
      router.push("/profile");
    } else {
      console.log("프로필 버튼 클릭 - 로그인 페이지로 이동");
      router.push("/sign");
    }
  };

  // 로그인 상태에 따른 프로필 버튼 렌더링
  const renderProfileButton = () => {
    if (user) {
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

  // 인증 상태 확인 중이거나 인증되지 않은 경우 로딩 표시
  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>
            {authLoading ? '인증 상태 확인 중...' : '메인 페이지로 이동 중...'}
          </p>
        </div>
      </div>
    );
  }

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>이벤트 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-red-400 text-lg mb-4">⚠️</div>
          <p className="text-white text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 이벤트 데이터가 없는 경우
  if (!featuredData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-white text-lg mb-4">이벤트 정보를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* 메인 컨텐츠 - 스크롤 가능 */}
      <main 
        className="w-full min-h-screen overflow-y-auto"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* Internet Explorer 10+ */
        }}
      >
        <style jsx>{`
          main::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>
        
        {/* 이벤트 히어로 섹션 */}
        <EventHero event={featuredData.event} />

        {/* 이벤트 정보 섹션 */}
        <EventInfo event={featuredData.event} />

        {/* 공지사항 섹션 */}
        {featuredData.notices && (
          <EventNotice 
            notices={featuredData.notices} 
            showViewAllButton={true}
            onViewAllClick={() => {
              router.push(`/board/list?eventId=${featuredData.event.id || 'default-event'}&type=notice`);
            }}
          />
        )}


        {/* FAQ 섹션 */}
        {/* {featuredData.faqs && <EventFaq faqs={featuredData.faqs} />} */}

        {/* 래플 섹션 */}
        {featuredData.raffle && <EventRaffle raffle={featuredData.raffle} />}

        {/* 쿠폰 섹션 */}
        {featuredData.coupons && <EventCoupon coupons={featuredData.coupons} />}

        {/* 참여자 섹션 */}
        {featuredData.participants && <EventParticipants participants={featuredData.participants} />}

        {/* 타임라인 섹션 */}
        {featuredData.timelines && (
          <EventTimeline 
            timelines={featuredData.timelines} 
            showViewAllButton={true}
            onViewAllClick={() => {
              router.push(`/timeline/list?eventId=${featuredData.event.id || 'default-event'}`);
            }}
          />
        )}

        {/* 푸드트럭 섹션 */}
        {featuredData.vendors && (
          <EventFoodTrucks 
            vendors={featuredData.vendors} 
            showViewAllButton={true}
            eventId={featuredData.event.id || 'default-event'}
            onViewAllClick={() => {
              router.push(`/foodtrucks/list?eventId=${featuredData.event.id || 'default-event'}`);
            }}
          />
        )}

        {/* 커뮤니티 섹션 */}
        {featuredData.freeBoard && (
          <EventCommunity 
            freeBoard={featuredData.freeBoard} 
            showViewAllButton={true}
            onViewAllClick={() => {
              router.push(`/board/list?eventId=${featuredData.event.id || 'default-event'}`);
            }}
          />
        )}

        {/* 도움말 섹션 */}
        <EventHelp />
      </main>

      {/* 네비게이션바 - 오버레이 */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <CommonNavigationBar
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
          rightButton={renderProfileButton()}
          onLeftClick={handleBackClick}
          onRightClick={handleProfileClick}
          backgroundColor="transparent"
          backgroundOpacity={0}
          textColor="text-white"
        />
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function EventPageLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>이벤트 페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 직접 내보내기 (ProtectedRoute 제거)
export default function EventPage() {
  return (
    <Suspense fallback={<EventPageLoading />}>
      <EventPageContent />
    </Suspense>
  );
} 