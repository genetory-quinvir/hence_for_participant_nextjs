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
import LoginOverlay from "@/components/common/LoginOverlay";

interface EventPageContentProps {
  onRequestNotificationPermission?: (eventId: string) => Promise<void>;
}

// 상수 정의
const DEFAULT_EVENT_ID = 'default-event';

// 스켈레톤 컴포넌트
const SkeletonPulse = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

// 스켈레톤 로딩 뷰
const EventSkeleton = () => (
  <div className="min-h-screen bg-gray-100 text-black relative overflow-x-hidden">
    {/* 네비게이션바 스켈레톤 */}
    <div className="absolute top-2 left-0 right-0 z-50">
      <div className="mx-4 h-11 bg-white rounded-lg shadow-sm flex items-center justify-between px-4">
        <SkeletonPulse className="w-20 h-6" />
        <SkeletonPulse className="w-16 h-8 rounded-full" />
      </div>
    </div>

    {/* 메인 컨텐츠 */}
    <main className="w-full min-h-screen overflow-y-auto overflow-x-hidden">
      {/* 히어로 섹션 스켈레톤 */}
      <div className="relative h-64 bg-gradient-to-br from-purple-600 to-purple-800">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative h-full flex items-end p-6">
          <div className="w-full">
            <SkeletonPulse className="w-3/4 h-8 mb-2 bg-white bg-opacity-20" />
            <SkeletonPulse className="w-1/2 h-4 bg-white bg-opacity-20" />
          </div>
        </div>
      </div>

      {/* 이벤트 정보 섹션 스켈레톤 */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg p-4 mb-4">
          <SkeletonPulse className="w-1/3 h-6 mb-4" />
          <div className="space-y-3">
            <SkeletonPulse className="w-full h-4" />
            <SkeletonPulse className="w-2/3 h-4" />
            <SkeletonPulse className="w-3/4 h-4" />
          </div>
        </div>
      </div>

      {/* 경품 섹션 스켈레톤 */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <SkeletonPulse className="w-1/4 h-6 mb-4" />
          <div className="flex space-x-4 overflow-x-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-32">
                <SkeletonPulse className="w-full h-24 mb-2" />
                <SkeletonPulse className="w-3/4 h-4 mb-1" />
                <SkeletonPulse className="w-1/2 h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 공지사항 섹션 스켈레톤 */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <SkeletonPulse className="w-1/4 h-6" />
            <SkeletonPulse className="w-16 h-6" />
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="border-b border-gray-100 pb-3 last:border-b-0">
                <SkeletonPulse className="w-full h-4 mb-2" />
                <SkeletonPulse className="w-2/3 h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 동아리 섹션 스켈레톤 */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <SkeletonPulse className="w-1/4 h-6 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <SkeletonPulse className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <SkeletonPulse className="w-1/3 h-4 mb-1" />
                  <SkeletonPulse className="w-1/4 h-3" />
                </div>
                <SkeletonPulse className="w-16 h-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 타임라인 섹션 스켈레톤 */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <SkeletonPulse className="w-1/4 h-6" />
            <SkeletonPulse className="w-16 h-6" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <SkeletonPulse className="w-3 h-3 rounded-full mt-2" />
                <div className="flex-1">
                  <SkeletonPulse className="w-2/3 h-4 mb-1" />
                  <SkeletonPulse className="w-1/3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 지도 섹션 스켈레톤 */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <SkeletonPulse className="w-1/4 h-6 mb-4" />
          <SkeletonPulse className="w-full h-48 rounded-lg" />
        </div>
      </div>

      {/* 푸드트럭 섹션 스켈레톤 */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <SkeletonPulse className="w-1/4 h-6" />
            <SkeletonPulse className="w-16 h-6" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <SkeletonPulse className="w-full h-24 rounded-lg" />
                <SkeletonPulse className="w-3/4 h-4" />
                <SkeletonPulse className="w-1/2 h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 쿠폰 섹션 스켈레톤 */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <SkeletonPulse className="w-1/4 h-6 mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <SkeletonPulse className="w-full h-4 mb-2" />
                <SkeletonPulse className="w-2/3 h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 커뮤니티 섹션 스켈레톤 */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <SkeletonPulse className="w-1/4 h-6" />
            <SkeletonPulse className="w-16 h-6" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 pb-4 last:border-b-0">
                <div className="flex items-center space-x-3 mb-2">
                  <SkeletonPulse className="w-8 h-8 rounded-full" />
                  <SkeletonPulse className="w-20 h-4" />
                </div>
                <SkeletonPulse className="w-full h-4 mb-1" />
                <SkeletonPulse className="w-2/3 h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 도움말 섹션 스켈레톤 */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <SkeletonPulse className="w-1/3 h-6 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-100 pb-3 last:border-b-0">
                <SkeletonPulse className="w-full h-4 mb-1" />
                <SkeletonPulse className="w-3/4 h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
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
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  // dismissedLoginPrompt 상태 제거 - 로그인되지 않은 사용자는 항상 블러 처리
  
  // Ref 관리
  const isMounted = useRef(false);
  const hasCalledApi = useRef(false);
  
  // eventId 메모이제이션
  const eventId = useMemo(() => searchParams.get('id'), [searchParams]);
  const safeEventId = useMemo(() => eventId || DEFAULT_EVENT_ID, [eventId]);

  // 인증 상태 확인 - 로그인되지 않은 사용자도 이벤트 페이지를 볼 수 있도록 수정
  useEffect(() => {
    console.log('인증 상태 확인:', { authLoading, isAuthenticated, eventId, user });
    if (!authLoading && !isAuthenticated && eventId) {
      // 인증되지 않은 경우 이벤트 정보를 sessionStorage에 저장
      sessionStorage.setItem('pendingEventId', eventId);
      sessionStorage.setItem('pendingEventUrl', window.location.pathname + window.location.search);
      console.log('로그인되지 않은 사용자 - 이벤트 정보 저장:', eventId);
    }
  }, [isAuthenticated, authLoading, eventId, user]);

  // 로그인되지 않은 사용자의 경우 body 스크롤 막기
  useEffect(() => {
    if (!isAuthenticated) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthenticated]);

  // 컴포넌트 마운트 상태 관리
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      hasCalledApi.current = false;
    };
  }, []);

  // 인증이 완료된 후에만 API 호출 (로그인되지 않은 사용자도 이벤트 정보를 볼 수 있도록 수정)
  useEffect(() => {
    console.log('API 호출 조건 확인:', { eventId, authLoading, isMounted: isMounted.current, hasCalledApi: hasCalledApi.current });
    if (!eventId || authLoading || !isMounted.current || hasCalledApi.current) {
      console.log('API 호출 조건 미충족 - 호출하지 않음');
      return;
    }

    console.log('API 호출 시작 - 이벤트 데이터 가져오기');
    hasCalledApi.current = true;
    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        console.log('getFeaturedEvent API 호출 시작:', { eventId, currentDay });
        const featuredResult = await getFeaturedEvent(eventId, currentDay);
        console.log('getFeaturedEvent API 응답:', featuredResult);
        
        if (!isMounted.current) {
          console.log('컴포넌트가 언마운트됨 - 처리 중단');
          return;
        }
        
        if (featuredResult?.success && featuredResult.featured) {
          console.log('이벤트 데이터 설정 성공:', featuredResult.featured);
          setFeaturedData(featuredResult.featured);
        } else {
          const errorMessage = featuredResult?.error || '이벤트 종합 정보를 가져올 수 없습니다.';
          console.log('이벤트 데이터 로드 실패:', errorMessage);
          setError(errorMessage);
        }
      } catch (error) {
        console.error('getFeaturedEvent API 호출 중 오류:', error);
        if (!isMounted.current) {
          console.log('컴포넌트가 언마운트됨 - 오류 처리 중단');
          return;
        }
        
        const errorMessage = error instanceof Error && 
          (error.message.includes('coroutine') || error.message.includes('not iterable'))
          ? '서버에서 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
          : '이벤트 로드 중 오류가 발생했습니다.';
        
        console.log('오류 메시지 설정:', errorMessage);
        setError(errorMessage);
      } finally {
        if (isMounted.current) {
          console.log('로딩 상태 해제');
          setIsLoading(false);
        }
      }
    };

    fetchData();
  }, [authLoading, eventId, currentDay]);

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
    if (user) {
      navigate("/profile");
    } else {
      setShowLoginOverlay(true);
    }
  }, [navigate, user]);

  const handleRetry = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleLoginClick = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  const handleCloseLoginOverlay = useCallback(() => {
    setShowLoginOverlay(false);
  }, []);

  const handleGoToMain = useCallback(() => {
    // sessionStorage 정리하여 메인 페이지에서 로그인 알럿이 뜨지 않도록 함
    sessionStorage.removeItem('pendingEventId');
    sessionStorage.removeItem('pendingEventUrl');
    // 메인 페이지로 이동
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
        className="rounded-lg px-4 py-1 transition-colors hover:bg-white hover:bg-opacity-10 cursor-pointer"
        style={{ 
          border: '1px solid rgba(255, 255, 255, 0.6)',
          backgroundColor: 'transparent'
        }}
        onClick={() => setShowLoginOverlay(true)}
      >
        <span className="text-white text-sm font-medium">로그인</span>
      </div>
    );
  }, [user]);

  // 모든 로딩이 완료될 때까지 스켈레톤 표시
  const isFullyLoaded = !authLoading && !isLoading && featuredData;
  
  // 로딩 중이면 스켈레톤 표시
  if (!isFullyLoaded) {
    return <EventSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} />;
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
          ...(isAuthenticated ? {} : { 
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          })
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

      {/* 로그인되지 않은 사용자를 위한 딤 오버레이 */}
      {!isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요합니다</h3>
              <p className="text-gray-600 mb-6">이벤트에 참여하려면 로그인해주세요</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleGoToMain}
                  className="flex-1 py-3 px-4 rounded-lg text-gray-600 font-normal transition-colors"
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                >
                  메인으로 돌아가기
                </button>
                <button
                  onClick={() => setShowLoginOverlay(true)}
                  className="flex-1 py-3 px-4 rounded-lg font-bold transition-colors bg-purple-600 hover:bg-purple-700 text-white"
                >
                  로그인하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 로그인 모달 */}
      {showLoginOverlay && (
        <LoginOverlay
          onLoginClick={handleLoginClick}
          onClose={handleCloseLoginOverlay}
        />
      )}
    </div>
  );
}
