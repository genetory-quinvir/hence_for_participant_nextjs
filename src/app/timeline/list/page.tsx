"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TimelineItem } from "@/types/api";
import { getTimelineList } from "@/lib/api";
import { useDay } from "@/contexts/DayContext";
import CommonNavigationBar from "@/components/CommonNavigationBar";

function TimelineListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [timelines, setTimelines] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { currentDay, setCurrentDay } = useDay();

  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [availableDays, setAvailableDays] = useState<number[]>([1, 2]); // Day 1, 2만 제공

  // 이벤트 ID 가져오기
  const eventId = searchParams.get('eventId') || 'default-event';

  // 현재 시간을 1분마다 업데이트 (로컬 시간 사용)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date(); // 브라우저의 로컬 시간 사용
      setCurrentTime(now);
    };

    updateTime(); // 초기 실행
    const interval = setInterval(updateTime, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 시간에 따라 상태를 계산하는 함수
  const getTimelineStatus = (timeline: TimelineItem, index: number) => {
    // 시간 정보가 없으면 PENDING으로 처리
    if (!timeline.time) {
      return 'PENDING';
    }

    try {
      // 현재 시간을 로컬 시간으로 변환하여 시간 문자열 생성
      const currentHour = currentTime.getHours();
      const currentMinute = currentTime.getMinutes();
      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // timeline.time과 현재 시간 문자열 비교
      const timelineTimeString = timeline.time;
      
      // 다음 타임라인의 시간 찾기
      let nextTimelineTimeString: string | null = null;
      if (index < timelines.length - 1) {
        const nextTimeline = timelines[index + 1];
        if (nextTimeline.time) {
          nextTimelineTimeString = nextTimeline.time;
        }
      }

      // Day별 상태 로직
      if (currentDay === 1) {
        // Day 1일 때
        if (selectedDay === 1) {
          // Day 1의 타임라인: 시간대로 상태 진행
          if (currentTimeString < timelineTimeString) {
            return 'PENDING';
          } else if (currentTimeString >= timelineTimeString && (!nextTimelineTimeString || currentTimeString < nextTimelineTimeString)) {
            return 'ACTIVE';
          } else {
            return 'COMPLETED';
          }
        } else if (selectedDay === 2) {
          // Day 2의 타임라인: 모두 예정중 (PENDING)
          return 'PENDING';
        }
      } else if (currentDay === 2) {
        // Day 2일 때
        if (selectedDay === 1) {
          // Day 1의 타임라인: 모두 종료 (COMPLETED)
          return 'COMPLETED';
        } else if (selectedDay === 2) {
          // Day 2의 타임라인: 시간대로 상태 진행
          if (currentTimeString < timelineTimeString) {
            return 'PENDING';
          } else if (currentTimeString >= timelineTimeString && (!nextTimelineTimeString || currentTimeString < nextTimelineTimeString)) {
            return 'ACTIVE';
          } else {
            return 'COMPLETED';
          }
        }
      }
      
      // 기본값
      return 'PENDING';
    } catch (error) {
      // 시간 파싱에 실패하면 PENDING으로 처리
      console.error('시간 파싱 오류:', error);
      return 'PENDING';
    }
  };

  // 시간 기반으로 상태를 계산한 타임라인 생성 (원본 status 무시)
  const updatedTimelines = timelines.map((timeline, index) => ({
    ...timeline,
    status: getTimelineStatus(timeline, index) // 원본 status 대신 시간 기반 status 사용
  }));

  // 초기 데이터 로딩
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        setPage(1);
        setHasNext(true);
        
        const result = await getTimelineList(eventId, 1, 10, selectedDay);
        
        if (result.success && result.data) {
          setTimelines(result.data.items);
          setHasNext(result.data.hasNext);
          setTotal(result.data.total);
        } else {
          setError(result.error || '타임라인을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error("타임라인 로드 오류:", err);
        setError("타임라인을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [eventId, selectedDay]);

  // 추가 데이터 로딩
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      
      const result = await getTimelineList(eventId, nextPage, 10, selectedDay);
      
      if (result.success && result.data) {
        setTimelines(prev => {
          // 중복 제거를 위해 기존 ID들과 비교
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = result.data!.items.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
        setHasNext(result.data.hasNext);
        setPage(nextPage);
      } else {
        console.error("추가 데이터 로드 실패:", result.error);
      }
    } catch (err) {
      console.error("추가 데이터 로드 오류:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [eventId, hasNext, loadingMore, selectedDay]);

  // 스크롤 감지
  const handleScroll = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
      loadMore();
    }
  }, [loadMore]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleTimelineClick = (timeline: TimelineItem) => {
    // TODO: 타임라인 상세 페이지로 이동 (아직 구현되지 않음)
    console.log('타임라인 클릭:', timeline);
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleDayChange = (day: number) => {
    // 모든 Day로 자유롭게 이동 가능
    setSelectedDay(day);
    setTimelines([]); // 기존 타임라인 초기화
    setPage(1);
    setHasNext(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">
        <CommonNavigationBar 
          title="타임라인"
          leftButton={
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
          fixedHeight={true}
          sticky={true}
        />
        
        {/* 타임라인 스켈레톤 */}
        <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide" style={{ 
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          overflow: 'auto'
        }}>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex">
                {/* 왼쪽 시간 및 연결선 스켈레톤 */}
                <div className="flex flex-col items-center mr-4">
                  {/* 시간 스켈레톤 */}
                  <div className="w-12 h-4 bg-gray-200 rounded animate-pulse mb-2 mt-1"></div>
                  
                  {/* 닷 스켈레톤 */}
                  <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                  
                  {/* 연결선 스켈레톤 (마지막 항목이 아닌 경우에만) */}
                  {index < 4 && (
                    <div className="w-0.5 flex-1 bg-gray-200 animate-pulse"></div>
                  )}
                </div>

                {/* 오른쪽 내용 스켈레톤 */}
                <div className="flex-1">
                  <div className="rounded-xl p-5 bg-gray-100">
                    {/* 제목 스켈레톤 */}
                    <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                    
                    {/* 설명 스켈레톤 */}
                    <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                    
                    {/* 장소 및 상태 스켈레톤 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black">
        <CommonNavigationBar 
          title="타임라인"
          leftButton={
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
          sticky={true}
          fixedHeight={true}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center px-4">
            <div className="text-red-400 text-lg mb-4">⚠️</div>
            <p className="text-black text-lg mb-4">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-purple-600 text-black rounded-lg hover:bg-purple-700 transition-colors"
            >
              메인으로
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <CommonNavigationBar 
        title="타임라인"
        leftButton={
          <svg
            className="w-6 h-6 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        onLeftClick={handleBackClick}
        backgroundColor="white"
        backgroundOpacity={1}
        textColor="text-black"
        sticky={true}
        fixedHeight={true}
      />
      
      {/* Day 탭 */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide" style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {availableDays.map((day) => {
            const isCurrentDay = day === currentDay;
            const isSelected = selectedDay === day;
            
            return (
              <button
                key={day}
                onClick={() => handleDayChange(day)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Day-{day}
                {isCurrentDay && (
                  <span className="ml-1 text-xs">(오늘)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="px-4 py-2" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
        {/* 타임라인 리스트 */}
        <div className="space-y-4">
          {updatedTimelines.length > 0 ? (
            updatedTimelines.map((timeline, index) => (
              <div
                key={timeline.id}
                className="flex cursor-pointer"
                onClick={() => handleTimelineClick(timeline)}
              >
                {/* 왼쪽 시간 및 연결선 */}
                <div className="flex flex-col items-center mr-4">
                  {/* 시간 */}
                  <div 
                    className="text-sm font-normal mb-2 mt-1 flex-shrink-0"
                    style={{ 
                      color: timeline.status === 'COMPLETED' 
                        ? 'rgba(0, 0, 0, 0.4)' 
                        : timeline.status === 'ACTIVE'
                        ? '#7c3aed'
                        : 'rgba(0, 0, 0, 1)'
                    }}
                  >
                    {timeline.time || ''}
                  </div>
                  
                  {/* 닷 (ACTIVE 상태일 때만 표시) */}
                  {timeline.status === 'ACTIVE' && (
                    <div 
                      className="w-4 h-4 rounded-full z-10 relative flex items-center justify-center flex-shrink-0 animate-pulse"
                      style={{ 
                        backgroundColor: '#7c3aed',
                        animation: 'timelineDotPulse 1s ease-in-out infinite'
                      }}
                    ></div>
                  )}
                  
                  {/* 연결선 (마지막 항목이 아닌 경우에만) */}
                  {index < updatedTimelines.length - 1 && (
                    <div 
                      className="w-0.5 flex-1"
                      style={{ 
                        backgroundColor: timeline.status === 'ACTIVE' ? '#7c3aed' : 'rgba(0, 0, 0, 0.1)'
                      }}
                    ></div>
                  )}
                </div>

                {/* 오른쪽 내용 */}
                <div className="flex-1">
                  <div 
                    className="rounded-xl p-5 transition-all duration-300 hover:bg-white hover:bg-opacity-5"
                    style={{ 
                      backgroundColor: timeline.status === 'COMPLETED' 
                        ? 'rgba(0, 0, 0, 0.05)' 
                        : timeline.status === 'ACTIVE'
                        ? 'rgba(124, 58, 237, 0.1)'
                        : 'rgba(0, 0, 0, 0.05)',
                      border: timeline.status === 'ACTIVE' ? '1px solid rgba(124, 58, 237, 0.5)' : 'none',
                    }}
                  >
                    {/* 제목 */}
                    <h3 
                      className="font-semibold text-md mb-1"
                      style={{ 
                        color: timeline.status === 'COMPLETED' 
                          ? 'rgba(0, 0, 0, 0.2)' 
                          : timeline.status === 'ACTIVE'
                          ? '#7c3aed'
                          : 'rgba(0, 0, 0, 1)'
                      }}
                    >
                      {timeline.title || '제목 없음'}
                    </h3>
                    
                    {/* 설명 */}
                    {timeline.description && (
                      <p 
                        className="text-sm mb-3"
                        style={{ 
                          color: timeline.status === 'COMPLETED' ? 'rgba(0, 0, 0, 0.2)' : timeline.status === 'ACTIVE' ? '#7c3aed' : 'rgba(0, 0, 0, 0.8)'
                        }}
                      >
                        {timeline.description}
                      </p>
                    )}
                    
                    {/* 장소 및 시간 정보 */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-4">
                        {timeline.location && (
                          <div className="flex items-center">
                            <svg className={`w-4 h-4 ${timeline.status === 'COMPLETED' ? 'text-gray-400' : timeline.status === 'ACTIVE' ? 'text-purple-700' : 'text-gray-800'} dark:text-white mr-1`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z" clipRule="evenodd"/>
                            </svg>
                            <span 
                              className="text-sm"
                              style={{ 
                                color: timeline.status === 'COMPLETED' ? 'rgba(0, 0, 0, 0.2)' : timeline.status === 'ACTIVE' ? '#7c3aed' : 'rgba(0, 0, 0, 1)'
                              }}
                            >
                              {timeline.location}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* 상태 표시 */}
                      {timeline.status === 'COMPLETED' && (
                        <div className="flex-shrink-0">
                          <span className="px-4 py-2 rounded-full text-xs font-normal text-gray-400"  
                          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                            종료
                          </span>
                        </div>  
                      )}
                      
                      {timeline.status === 'ACTIVE' && (
                        <div className="flex-shrink-0">
                          <span className="px-4 py-2 rounded-full text-xs font-bold bg-purple-600 text-white">
                            진행중
                          </span>
                        </div>
                      )}
                      
                      {timeline.status === 'PENDING' && (
                        <div className="flex-shrink-0">
                          <span className="px-4 py-2 rounded-full text-xs font-normal text-gray-400" 
                          style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                            예정중
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-black text-lg mb-2">아직 타임라인이 없습니다</p>
              <p className="text-black text-sm" style={{ opacity: 0.6 }}>
                새로운 타임라인을 기다려주세요!
              </p>
            </div>
          )}
          
          {/* 추가 로딩 인디케이터 */}
          {loadingMore && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-black text-sm" style={{ opacity: 0.6 }}>
                더 많은 타임라인을 불러오는 중...
              </p>
            </div>
          )}
          
          {/* 더 이상 데이터가 없을 때 */}
          {!hasNext && updatedTimelines.length > 0 && (
            <div className="text-center py-8">
              <p className="text-black text-sm" style={{ opacity: 0.6 }}>
                모든 타임라인을 불러왔습니다
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function TimelineListLoading() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* 네비게이션바 스켈레톤 */}
      <div className="h-16 bg-white border-b border-gray-100 flex items-center px-4">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex-1 flex justify-center">
          <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-6 h-6"></div>
      </div>
      
      {/* 타임라인 스켈레톤 */}
      <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide" style={{ 
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        overflow: 'auto'
      }}>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex">
              {/* 왼쪽 시간 및 연결선 스켈레톤 */}
              <div className="flex flex-col items-center mr-4">
                {/* 시간 스켈레톤 */}
                <div className="w-12 h-4 bg-gray-200 rounded animate-pulse mb-2 mt-1"></div>
                
                {/* 닷 스켈레톤 */}
                <div className="w-4 h-4 bg-gray-200 rounded-full animate-pulse"></div>
                
                {/* 연결선 스켈레톤 (마지막 항목이 아닌 경우에만) */}
                {index < 3 && (
                  <div className="w-0.5 flex-1 bg-gray-200 animate-pulse"></div>
                )}
              </div>

              {/* 오른쪽 내용 스켈레톤 */}
              <div className="flex-1">
                <div className="rounded-xl p-5 bg-gray-100">
                  {/* 제목 스켈레톤 */}
                  <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                  
                  {/* 설명 스켈레톤 */}
                  <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                  
                  {/* 장소 및 상태 스켈레톤 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function TimelineListPage() {
  return (
    <Suspense fallback={<TimelineListLoading />}>
      <TimelineListContent />
    </Suspense>
  );
} 