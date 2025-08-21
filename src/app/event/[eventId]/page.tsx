"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useRef } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonProfileView from "@/components/common/CommonProfileView";
import { useAuth } from "@/contexts/AuthContext";
import { getFeaturedEvent } from "@/lib/api";
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
import EventShout from "@/components/event/EventShout";
import EventHelp from "@/components/event/EventHelp";
import EventAdvertisements from "@/components/event/EventAdvertisements";
import EventChat from "@/components/event/EventChat";
import { useSimpleNavigation } from "@/utils/navigation";
import EventSection from "@/components/event/EventSection";

function EventPageContent() {
  const { navigate, goBack } = useSimpleNavigation();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [featuredData, setFeaturedData] = useState<FeaturedItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCalledApi = useRef(false);
  const isMounted = useRef(false);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      hasCalledApi.current = false;
    };
  }, []);

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    // 인증 상태 확인이 완료된 후에만 리다이렉트 처리
    if (!authLoading && (!isAuthenticated || !user)) {
      navigate("/");
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  // 이벤트 상세 페이지 진입 시 히스토리에 추가
  useEffect(() => {
    // 브라우저 히스토리만 사용하므로 별도 관리 불필요
  }, [params.eventId]);

  // 이벤트 데이터 가져오기 (단순화)
  useEffect(() => {
    // params.eventId가 배열일 수 있으므로 안전하게 추출
    const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;
    
    console.log('🔄 이벤트 데이터 useEffect 실행:', { 
      eventId, 
      paramsEventId: params.eventId,
      hasCalledApi: hasCalledApi.current,
      isMounted: isMounted.current,
      authLoading,
      isAuthenticated,
      user
    });
    
    // 인증 로딩 중이거나 인증되지 않은 경우 API 호출하지 않음
    if (authLoading || !isAuthenticated || !user) {
      console.log('⏭️ 인증 대기 중:', { authLoading, isAuthenticated, user: !!user });
      return;
    }
    
    // 컴포넌트가 마운트되지 않았거나 이미 API를 호출했다면 중복 호출 방지
    if (!isMounted.current || hasCalledApi.current) {
      console.log('⏭️ API 호출 방지:', { isMounted: isMounted.current, hasCalledApi: hasCalledApi.current });
      return;
    }
    
    // eventId가 있으면 API 호출 (인증은 apiRequest에서 처리)
    if (eventId) {
      hasCalledApi.current = true;
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 이벤트 종합 정보 요청:', { eventId });
      
      // AbortController를 사용하여 이전 요청 취소
      const abortController = new AbortController();
      
      // eventId로 직접 이벤트 정보 가져오기
      getFeaturedEvent(eventId)
        .then((featuredResult) => {
          // 컴포넌트가 언마운트되었거나 요청이 취소되었으면 상태 업데이트하지 않음
          if (!isMounted.current || abortController.signal.aborted) return;
          
          if (featuredResult && featuredResult.success && featuredResult.featured) {
            setFeaturedData(featuredResult.featured);
            console.log('✅ 이벤트 종합 정보 로드 성공:', featuredResult.featured);
          } else if (featuredResult) {
            let errorMessage = featuredResult.error || '이벤트 종합 정보를 가져올 수 없습니다.';
            
            // coroutine 관련 오류인 경우 사용자 친화적인 메시지로 변경
            if (errorMessage.includes('coroutine') || errorMessage.includes('not iterable')) {
              errorMessage = '서버에서 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
              console.error('❌ 서버 코루틴 오류:', featuredResult.error);
            }
            
            setError(errorMessage);
            console.error('❌ 이벤트 종합 정보 로드 실패:', featuredResult.error);
          }
        })
        .catch((error) => {
          // 컴포넌트가 언마운트되었거나 요청이 취소되었으면 상태 업데이트하지 않음
          if (!isMounted.current || abortController.signal.aborted) return;
          
          let errorMessage = '이벤트 로드 중 오류가 발생했습니다.';
          
          // coroutine 관련 오류인 경우 사용자 친화적인 메시지로 변경
          if (error instanceof Error && (error.message.includes('coroutine') || error.message.includes('not iterable'))) {
            errorMessage = '서버에서 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            console.error('❌ 서버 코루틴 오류:', error.message);
          }
          
          setError(errorMessage);
          console.error('💥 이벤트 로드 오류:', error);
        })
        .finally(() => {
          // 컴포넌트가 언마운트되었거나 요청이 취소되었으면 상태 업데이트하지 않음
          if (!isMounted.current || abortController.signal.aborted) return;
          
          setIsLoading(false);
        });
      
      // cleanup 함수에서 요청 취소
      return () => {
        abortController.abort();
      };
    }
  }, [params.eventId, authLoading, isAuthenticated, user]); // 인증 상태를 의존성에 추가

  const handleProfileClick = () => {
    if (user) {
      console.log("프로필 버튼 클릭 - 프로필 페이지로 이동");
      navigate("/profile");
    } else {
      console.log("프로필 버튼 클릭 - 로그인 페이지로 이동");
      navigate("/sign");
    }
  };

  // 로그인 상태에 따른 프로필 버튼 렌더링
  const renderProfileButton = () => {
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
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
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
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
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
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-red-400 text-lg mb-4">⚠️</div>
          <p className="text-white text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
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
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-white text-lg mb-4">이벤트 정보를 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black relative">
      {/* 메인 컨텐츠 - 스크롤 가능 */}
      <main 
        className="w-full min-h-screen overflow-y-auto"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* Internet Explorer 10+ */
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <style jsx>{`
          main::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>

        {/* 히어로 섹션 */}
        <EventHero event={featuredData.event} />

        {/* 이벤트 정보 섹션 */}
        <EventInfo event={featuredData.event} />

        {/* 공지사항 섹션 */}
        {featuredData.notices && (
            <EventSection
              title="공지사항"
              subtitle="이벤트 관련 중요한 공지사항을 확인해보세요"
              rightButton={{
                text: "전체보기",
                onClick: () => {
                  navigate(`/board/list?eventId=${featuredData.event.id || 'default-event'}&type=notice`);
                }
              }}
            > 
            <EventNotice notices={featuredData.notices} />
          </EventSection>
        )}  


        {/* 실시간 채팅 섹션 */}
        {/* <EventChat 
          eventId={featuredData.event.id || 'default-event'}
          showViewAllButton={false}
        /> */}

        {/* 이벤트 경품 섹션 */}
        {featuredData.raffle && (
          <EventRaffle 
            raffle={featuredData.raffle} 
            eventId={featuredData.event.id || 'default-event'}
          />
        )}  

        {/* 광고 섹션 1 */}
        {/* {featuredData.advertisements && featuredData.advertisements.length > 0 && (
          <EventAdvertisements 
            advertisements={[featuredData.advertisements[0]]} 
          />
        )} */}

        {/* 참여자 섹션 */}
        {/* {featuredData.participants && (
          <EventParticipants 
            participants={featuredData.participants}
            showViewAllButton={true}
            onViewAllClick={() => {
              navigate(`/participants/list?eventId=${featuredData.event.id || 'default-event'}`);
            }}
          />
        )} */}

        {/* 타임라인 섹션 */}
        {featuredData.timelines && (
          <EventSection
            title="타임라인"
            subtitle="이벤트 일정을 확인해보세요"
            rightButton={{
              text: "전체보기",
              onClick: () => {
                navigate(`/timeline/list?eventId=${featuredData.event.id || 'default-event'}`);
              }
            }}
          > 
            <EventTimeline 
              timelines={featuredData.timelines} 
            />
          </EventSection>
        )}

        {/* 광고 섹션 2 */}
        {/* {featuredData.advertisements && featuredData.advertisements.length > 1 && (
          <EventAdvertisements 
            advertisements={[featuredData.advertisements[1]]} 
          />
        )} */}

        {/* 푸드트럭 섹션 */}
        {featuredData.vendors && (
          <EventSection
            title="푸드트럭"
            subtitle="이벤트 장소에서 푸드트럭을 확인해보세요"
            rightButton={{
              text: "전체보기",
              onClick: () => {
                navigate(`/foodtrucks/list?eventId=${featuredData.event.id || 'default-event'}`);
              }
            }}
          >     
            <EventFoodTrucks 
              vendors={featuredData.vendors} 
              eventId={featuredData.event.id || 'default-event'}
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
            eventId={featuredData.event.id || 'default-event'}
          />
          </EventSection>
        )}


        {/* 커뮤니티 섹션 */}
        {/* {featuredData.freeBoard && (
          <EventCommunity 
            freeBoard={featuredData.freeBoard} 
            showViewAllButton={true}
            onViewAllClick={() => {
              navigate(`/board/list?eventId=${featuredData.event.id || 'default-event'}`);
            }}
          />
        )} */}

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

      {/* 네비게이션바 - 오버레이 */}
      <div className="absolute top-0 left-0 right-0 z-50">
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

// 로딩 컴포넌트
function EventPageLoading() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
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