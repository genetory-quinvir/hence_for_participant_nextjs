"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useRef } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonProfileView from "@/components/common/CommonProfileView";
import { useAuth } from "@/contexts/AuthContext";
import { getFeaturedEvent, checkEventTopicSubscription } from "@/lib/api";
import { subscribeToTopic } from "@/lib/firebase";
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
import EventClubs from "@/components/event/EventClubs";
import EventSurvey from "@/components/event/EventSurvey";
import { useSimpleNavigation } from "@/utils/navigation";
import EventSection from "@/components/event/EventSection";

interface EventPageContentProps {
  onRequestNotificationPermission?: (eventId: string) => Promise<void>;
}

export default function EventPageContent({ onRequestNotificationPermission }: EventPageContentProps) {
  const { navigate, goBack } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [featuredData, setFeaturedData] = useState<FeaturedItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const hasCalledApi = useRef(false);
  const isMounted = useRef(false);
  const lastAuthState = useRef<{ isAuthenticated: boolean; userId?: string }>({ isAuthenticated: false });

  // eventId를 쿼리 파라미터에서 가져오기
  const eventId = searchParams.get('id');

  // 디버그: localStorage 상태 확인
  useEffect(() => {
    if (eventId) {
      const globalPermissionGranted = localStorage.getItem('notificationPermissionGranted');
      const globalPermissionDenied = localStorage.getItem('notificationPermissionDenied');
      const eventPermission = localStorage.getItem(`notificationPermissionRequested_${eventId}`);
      
      console.log('🔔 현재 localStorage 상태:', {
        globalPermissionGranted,
        globalPermissionDenied,
        eventPermission,
        eventId
      });
    }
  }, [eventId]);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      hasCalledApi.current = false;
    };
  }, []);

  // 로그인 상태 변경 감지 및 토픽 재구독 - 임시 비활성화
  // useEffect(() => {
  //   const currentAuthState = {
  //     isAuthenticated: isAuthenticated,
  //     userId: user?.id
  //   };

  //   // 로그인 상태가 변경되었고, 이전에 로그아웃 상태였다가 로그인된 경우
  //   if (currentAuthState.isAuthenticated && 
  //       !lastAuthState.current.isAuthenticated && 
  //       eventId && 
  //       onRequestNotificationPermission) {
  //     
  //     // 전역 알림 권한 상태 확인
  //     const globalPermissionGranted = localStorage.getItem('notificationPermissionGranted');
  //     const globalPermissionDenied = localStorage.getItem('notificationPermissionDenied');
  //     
  //     console.log('🔔 로그인 상태 변경 - 알림 권한 상태 확인:', {
  //       globalPermissionGranted,
  //       globalPermissionDenied,
  //       eventId
  //     });
  //     
  //     // 이미 전역적으로 권한을 허용했거나 거부한 경우 모달 표시하지 않음
  //     if (globalPermissionGranted === 'true') {
  //       // 이미 권한을 허용한 경우, 해당 이벤트에 대한 구독 상태만 확인
  //       const hasRequestedBefore = localStorage.getItem(`notificationPermissionRequested_${eventId}`);
  //       if (hasRequestedBefore === 'requested') {
  //         setIsSubscribed(true);
  //       }
  //       console.log('🔔 로그인 상태 변경 - 이미 권한을 허용했으므로 모달을 표시하지 않습니다.');
  //     } else if (globalPermissionDenied === 'true') {
  //       // 이미 권한을 거부한 경우 모달 표시하지 않음
  //       console.log('🔔 로그인 상태 변경 - 알림 권한이 이미 거부되어 모달을 표시하지 않습니다.');
  //     } else {
  //       // 새로운 사용자로 로그인한 경우 토픽 재구독 시도
  //       console.log('🔔 로그인 상태 변경 - 처음 방문하므로 모달을 표시합니다.');
  //       setTimeout(() => {
  //         if (isMounted.current) {
  //           setShowNotificationModal(true);
  //         }
  //       }, 1000);
  //     }
  //   }

  //   lastAuthState.current = currentAuthState;
  // }, [isAuthenticated, user?.id, eventId, onRequestNotificationPermission]);

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    // 인증 상태 확인이 완료된 후에만 리다이렉트 처리
    if (!authLoading && (!isAuthenticated || !user)) {
      navigate("/");
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  // 이벤트 데이터 가져오기 (단순화)
  useEffect(() => {

    
    // 인증 로딩 중이거나 인증되지 않은 경우 API 호출하지 않음
    if (authLoading || !isAuthenticated || !user) {

      return;
    }
    
    // 컴포넌트가 마운트되지 않았거나 이미 API를 호출했다면 중복 호출 방지
    if (!isMounted.current || hasCalledApi.current) {

      return;
    }
    
    // eventId가 있으면 API 호출 (인증은 apiRequest에서 처리)
    if (eventId) {
      hasCalledApi.current = true;
      setIsLoading(true);
      setError(null);
      

      
      // AbortController를 사용하여 이전 요청 취소
      const abortController = new AbortController();
      
      // eventId로 직접 이벤트 정보 가져오기
      getFeaturedEvent(eventId)
        .then((featuredResult) => {
          // 컴포넌트가 언마운트되었거나 요청이 취소되었으면 상태 업데이트하지 않음
          if (!isMounted.current || abortController.signal.aborted) return;
          
          if (featuredResult && featuredResult.success && featuredResult.featured) {
            setFeaturedData(featuredResult.featured);

            
            // 이벤트 데이터 로드 완료 후 토픽 구독 상태 확인 및 알림 권한 요청 모달 표시 - 임시 비활성화
            // if (onRequestNotificationPermission && eventId) {
            //   // 전역 알림 권한 상태 확인
            //   const globalPermissionGranted = localStorage.getItem('notificationPermissionGranted');
            //   const globalPermissionDenied = localStorage.getItem('notificationPermissionDenied');
            //   
            //   console.log('🔔 알림 권한 상태 확인:', {
            //     globalPermissionGranted,
            //     globalPermissionDenied,
            //     eventId
            //   });
            //   
            //   // 이미 전역적으로 권한을 허용했거나 거부한 경우 모달 표시하지 않음
            //   if (globalPermissionGranted === 'true') {
            //     // 이미 권한을 허용한 경우, 해당 이벤트에 대한 구독 상태만 확인
            //     const hasRequestedBefore = localStorage.getItem(`notificationPermissionRequested_${eventId}`);
            //     if (hasRequestedBefore === 'requested') {
            //       setIsSubscribed(true);
            //     }
            //     console.log('🔔 이미 권한을 허용했으므로 모달을 표시하지 않습니다.');
            //   } else if (globalPermissionDenied === 'true') {
            //     // 이미 권한을 거부한 경우 모달 표시하지 않음
            //     console.log('🔔 알림 권한이 이미 거부되어 모달을 표시하지 않습니다.');
            //   } else {
            //     // 처음 방문하는 경우 모달 표시
            //     console.log('🔔 처음 방문하므로 모달을 표시합니다.');
            //     setTimeout(() => {
            //       if (isMounted.current) {
            //         setShowNotificationModal(true);
            //       }
            //     }, 2000);
            //   }
            // }
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
  }, [eventId, authLoading, isAuthenticated, user]); // 인증 상태를 의존성에 추가

  const handleProfileClick = () => {
    if (user) {
  
      navigate("/profile");
    } else {
      
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
    <div className="min-h-screen bg-gray-100 text-black relative overflow-x-hidden">
      {/* 메인 컨텐츠 - 스크롤 가능 */}
      <main 
        className="w-full min-h-screen overflow-y-auto overflow-x-hidden"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* Internet Explorer 10+ */
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
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

        {/* 동아리 투표 랭킹 섹션 */}
        {featuredData.clubs && (
          <EventClubs 
            clubs={featuredData.clubs} 
            eventId={featuredData.event.id || 'default-event'}
          />
        )}

        {/* 실시간 채팅 섹션 */}
        {/* <EventChat 
          eventId={featuredData.event.id || 'default-event'}
          showViewAllButton={false}
        /> */}

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

        {/* 이벤트 경품 섹션 */}
        {featuredData.raffle && (
          <EventRaffle 
            raffle={featuredData.raffle} 
            eventId={featuredData.event.id || 'default-event'}
          />
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
        {featuredData.freeBoard && (
          <EventCommunity 
            freeBoard={featuredData.freeBoard} 
            showViewAllButton={true}
            onViewAllClick={() => {
              navigate(`/board/list?eventId=${featuredData.event.id || 'default-event'}`);
            }}
          />
        )}

        {/* 설문조사 섹션 */}
        {featuredData.survey && (
          <EventSurvey 
            eventId={featuredData.event.id || 'default-event'} 
            surveyData={featuredData.survey}
          />
        )}

        {/* 알림 설정 섹션 - 임시 숨김 */}
        {/* <EventSection
          title="알림 설정"
          subtitle="이벤트 소식을 놓치지 마세요"
        > 
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">푸시 알림</h3>
                <p className="text-sm text-gray-600 mt-1">
                  이벤트 소식과 중요한 업데이트를 받아보세요
                </p>
              </div>
              <button
                onClick={() => {
                  if (onRequestNotificationPermission && eventId) {
                    onRequestNotificationPermission(eventId);
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                알림 설정
              </button>
            </div>
          </div>
        </EventSection> */}

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

      {/* 알림 권한 요청 모달 - 임시 숨김 */}
      {/* {showNotificationModal && eventId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            margin: '16px',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div className="mb-6">
              <div className="flex items-center justify-center">
                <img 
                  src="/images/icon_notice.png" 
                  alt="알림 아이콘" 
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
                  <h2 className="text-black text-xl font-bold mb-1">
                    {isSubscribed ? '이벤트 알림 상태' : '이벤트 알림 설정'}
                  </h2>
                  <p className="text-black font-regular text-sm" style={{ opacity: 0.7 }}>
                    {isSubscribed ? '현재 알림이 활성화되어 있습니다' : '이벤트 소식을 놓치지 마세요'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-black font-regular text-md text-center" style={{ opacity: 0.8 }}>
                {isSubscribed ? (
                  <>
                    이미 이벤트 알림이 활성화되어 있습니다.<br />
                    이벤트 소식과 중요한 업데이트를 받아보실 수 있습니다.
                  </>
                ) : (
                  <>
                    알림을 허용하시면 이벤트 소식과<br />
                    중요한 업데이트를 받아보실 수 있습니다
                  </>
                )}
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  localStorage.setItem(`notificationPermissionRequested_${eventId}`, 'denied');
                  setShowNotificationModal(false);
                }}
                className="flex-1 py-3 px-4 rounded-lg text-black font-normal transition-colors"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
              >
                {isSubscribed ? '닫기' : '나중에'}
              </button>
              {!isSubscribed && (
                <button
                  onClick={async () => {
                    if (onRequestNotificationPermission && eventId) {
                      try {
                        await onRequestNotificationPermission(eventId);
                        setShowNotificationModal(false);
                      } catch (error) {
                        console.error('알림 권한 요청 중 오류:', error);
                        setShowNotificationModal(false);
                      }
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-lg font-bold transition-colors bg-purple-600 hover:bg-purple-700 text-white"
                >
                  알림 허용
                </button>
              )}
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}
