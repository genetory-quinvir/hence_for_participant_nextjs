"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonProfileView from "@/components/common/CommonProfileView";
import { useAuth } from "@/contexts/AuthContext";
import { getFeaturedEvent } from "@/lib/api";
import { useDay } from "@/contexts/DayContext";
import { FeaturedItem } from "@/types/api";
import EventHero from "@/components/event/EventHero";
import EventInfo from "@/components/event/EventInfo";
import EventRaffle from "@/components/event/EventRaffle";
import EventCoupon from "@/components/event/EventCoupon";
import EventNotice from "@/components/event/EventNotice";
import EventTimeline from "@/components/event/EventTimeline";
import EventFoodTrucks from "@/components/event/EventFoodTrucks";
import EventCommunity from "@/components/event/EventCommunity";
import EventClubs from "@/components/event/EventClubs";
import EventSurvey from "@/components/event/EventSurvey";
import EventMap from "@/components/event/EventMap";
import EventHelp from "@/components/event/EventHelp";
import { useSimpleNavigation } from "@/utils/navigation";
import EventSection from "@/components/event/EventSection";

interface EventPageContentProps {
  onRequestNotificationPermission?: (eventId: string) => Promise<void>;
}

// 상수 정의
const DEFAULT_EVENT_ID = 'default-event';

// 로딩 컴포넌트
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-white text-black flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
      <p className="text-sm" style={{ opacity: 0.7 }}>{message}</p>
    </div>
  </div>
);

// 에러 컴포넌트
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-white text-black flex items-center justify-center">
    <div className="text-center px-4">
      <div className="text-red-400 text-lg mb-4">⚠️</div>
      <p className="text-white text-lg mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        메인으로 돌아가기
      </button>
    </div>
  </div>
);

export default function EventPageContent({ onRequestNotificationPermission }: EventPageContentProps) {
  const { navigate } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentDay } = useDay();
  
  // 상태 관리
  const [featuredData, setFeaturedData] = useState<FeaturedItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Ref 관리
  const isMounted = useRef(false);
  const hasCalledApi = useRef(false);
  
  // eventId 메모이제이션
  const eventId = useMemo(() => searchParams.get('id'), [searchParams]);
  const safeEventId = useMemo(() => eventId || DEFAULT_EVENT_ID, [eventId]);

  // 인증 상태 확인
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      navigate("/");
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      hasCalledApi.current = false;
    };
  }, []);

  // 이벤트 데이터 가져오기
  const fetchEventData = useCallback(async () => {
    if (!eventId || authLoading || !isAuthenticated || !user || !isMounted.current || hasCalledApi.current) {
      return;
    }

    hasCalledApi.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const featuredResult = await getFeaturedEvent(eventId, currentDay);
      
      if (!isMounted.current) return;
      
      if (featuredResult?.success && featuredResult.featured) {
        setFeaturedData(featuredResult.featured);
      } else {
        const errorMessage = featuredResult?.error || '이벤트 종합 정보를 가져올 수 없습니다.';
        setError(errorMessage);
      }
    } catch (error) {
      if (!isMounted.current) return;
      
      const errorMessage = error instanceof Error && 
        (error.message.includes('coroutine') || error.message.includes('not iterable'))
        ? '서버에서 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        : '이벤트 로드 중 오류가 발생했습니다.';
      
      setError(errorMessage);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [eventId, currentDay, authLoading, isAuthenticated, user]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  // 네비게이션 핸들러 메모이제이션
  const handleNavigateToTimeline = useCallback(() => {
    navigate(`/timeline/list?eventId=${safeEventId}`);
  }, [navigate, safeEventId]);

  const handleNavigateToFoodTrucks = useCallback(() => {
    navigate(`/foodtrucks/list?eventId=${safeEventId}`);
  }, [navigate, safeEventId]);

  const handleNavigateToBoard = useCallback(() => {
    navigate(`/board/list?eventId=${safeEventId}`);
  }, [navigate, safeEventId]);

  const handleNavigateToNotice = useCallback(() => {
    navigate(`/board/list?eventId=${safeEventId}&type=notice`);
  }, [navigate, safeEventId]);

  const handleProfileClick = useCallback(() => {
    navigate(user ? "/profile" : "/sign");
  }, [navigate, user]);

  const handleRetry = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // 프로필 버튼 렌더링
  const renderProfileButton = useCallback(() => {
    if (user) {
      return (
        <CommonProfileView
          profileImageUrl={user.profileImageUrl}
          nickname={user.nickname}
          size="md"
          showBorder={true}
          showHover={true}
        />
      );
    }
    
    return (
      <div 
        className="rounded-lg px-4 py-1 transition-colors hover:bg-white hover:bg-opacity-10"
        style={{ 
          border: '1px solid rgba(255, 255, 255, 0.6)',
          backgroundColor: 'transparent'
        }}
      >
        <span className="text-white text-sm font-medium">로그인</span>
      </div>
    );
  }, [user]);

  // 로딩/에러 상태 처리
  if (authLoading || !isAuthenticated || !user) {
    return <LoadingSpinner message={authLoading ? '인증 상태 확인 중...' : '메인 페이지로 이동 중...'} />;
  }

  if (isLoading) {
    return <LoadingSpinner message="이벤트 정보를 불러오는 중..." />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
  }

  if (!featuredData) {
    return <ErrorDisplay error="이벤트 정보를 찾을 수 없습니다." onRetry={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black relative overflow-x-hidden">
      {/* 메인 컨텐츠 */}
      <main 
        className="w-full min-h-screen overflow-y-auto overflow-x-hidden"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        }}
      >
        <style jsx>{`
          main::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* 히어로 섹션 */}
        <EventHero event={featuredData.event} />

        {/* 이벤트 정보 섹션 */}
        <EventInfo event={featuredData.event} />

        {/* 이벤트 경품 섹션 */}
        {featuredData.raffle && (
          <EventRaffle 
            raffle={featuredData.raffle} 
            eventId={safeEventId}
          />
        )}

        {/* 공지사항 섹션 */}
        {featuredData.notices && (
          <EventSection
            title="공지사항"
            subtitle="이벤트 관련 중요한 공지사항을 확인해보세요"
            rightButton={{
              text: "전체보기",
              onClick: handleNavigateToNotice
            }}
          > 
            <EventNotice notices={featuredData.notices} />
          </EventSection>
        )}

        {/* 동아리 투표 랭킹 섹션 */}
        {featuredData.clubs && (
          <EventClubs 
            clubs={featuredData.clubs} 
            eventId={safeEventId}
          />
        )}

        {/* 타임라인 섹션 */}
        {featuredData.timelines && (
          <EventSection
            title="타임라인"
            subtitle="이벤트 일정을 확인해보세요"
            rightButton={{
              text: "전체보기",
              onClick: handleNavigateToTimeline
            }}
          > 
            <EventTimeline timelines={featuredData.timelines} />
          </EventSection>
        )}

        {/* 지도 섹션 */}
        <EventSection
          title="지도"
          subtitle="이벤트가 진행되는 장소를 확인해보세요"
        > 
          <EventMap eventId={safeEventId} />
        </EventSection>

        {/* 푸드트럭 섹션 */}
        {featuredData.vendors && (
          <EventSection
            title="푸드트럭"
            subtitle="이벤트 장소에서 푸드트럭을 확인해보세요"
            rightButton={{
              text: "전체보기",
              onClick: handleNavigateToFoodTrucks
            }}
          >     
            <EventFoodTrucks 
              vendors={featuredData.vendors} 
              eventId={safeEventId}
            />
          </EventSection>
        )}

        {/* 쿠폰 섹션 */}
        {featuredData.coupons && (
          <EventSection
            title="쿠폰"
            subtitle="이벤트 참여자만을 위한 특별한 쿠폰을 확인해보세요"
          > 
            <EventCoupon 
              coupons={featuredData.coupons} 
              eventId={safeEventId}
            />
          </EventSection>
        )}

        {/* 커뮤니티 섹션 */}
        {featuredData.freeBoard && (
          <EventCommunity 
            freeBoard={featuredData.freeBoard} 
            showViewAllButton={true}
            onViewAllClick={handleNavigateToBoard}
          />
        )}

        {/* 설문조사 섹션 */}
        {featuredData.survey && (
          <EventSurvey 
            eventId={safeEventId} 
            surveyData={featuredData.survey}
          />
        )}

        {/* 도움말 섹션 */}
        <EventSection
          title="도움말 & 문의"
          subtitle="이벤트 관련 중요한 도움말을 확인해보세요"
        > 
          <EventHelp helpData={{
            contact: featuredData.contact,
            faqs: featuredData.faqs,
            emergencyInfo: featuredData.emergencyInfo
          }} />
        </EventSection>
      </main>

      {/* 네비게이션바 */}
      <div className="absolute top-2 left-0 right-0 z-50">
        <CommonNavigationBar
          height="44px"
          rightButton={renderProfileButton()}
          onRightClick={handleProfileClick}
          backgroundColor="transparent"
          backgroundOpacity={1}
          textColor="text-black"
        />
      </div>
    </div>
  );
}
