"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TimelineItem } from "@/types/api";
import { getTimelineList } from "@/lib/api";
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

  // 이벤트 ID 가져오기
  const eventId = searchParams.get('eventId') || 'default-event';

  // 초기 데이터 로딩
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        setPage(1);
        setHasNext(true);
        
        const result = await getTimelineList(eventId, 1, 10);
        
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
  }, [eventId]);

  // 추가 데이터 로딩
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasNext) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      
      const result = await getTimelineList(eventId, nextPage, 10);
      
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
  }, [eventId, hasNext, loadingMore]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title="타임라인"
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
          onLeftClick={handleBackClick}
          backgroundColor="black"
          backgroundOpacity={1}
          textColor="text-white"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm" style={{ opacity: 0.7 }}>타임라인을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title="타임라인"
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
          onLeftClick={handleBackClick}
          backgroundColor="black"
          backgroundOpacity={1}
          textColor="text-white"
        />
        <div className="flex items-center justify-center h-64">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <CommonNavigationBar 
        title="타임라인"
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
        onLeftClick={handleBackClick}
        backgroundColor="black"
        backgroundOpacity={1}
        textColor="text-white"
      />
      
      <div className="px-4 py-2">
        {/* 타임라인 리스트 */}
        <div className="space-y-4">
          {timelines.length > 0 ? (
            timelines.map((timeline, index) => (
              <div
                key={timeline.id}
                className="flex cursor-pointer"
                onClick={() => handleTimelineClick(timeline)}
              >
                {/* 왼쪽 시간 및 연결선 */}
                <div className="flex flex-col items-center mr-4">
                  {/* 시간 */}
                  <div 
                    className="text-sm font-medium mb-2 mt-1 flex-shrink-0"
                    style={{ 
                      color: timeline.status === 'COMPLETED' 
                        ? 'rgba(255, 255, 255, 0.4)' 
                        : timeline.status === 'ACTIVE'
                        ? 'white'
                        : 'rgba(255, 255, 255, 0.8)'
                    }}
                  >
                    {timeline.time || ''}
                  </div>
                  
                  {/* 닷 */}
                  <div 
                    className={`w-4 h-4 rounded-full z-10 relative flex items-center justify-center flex-shrink-0 ${
                      timeline.status === 'ACTIVE' ? 'animate-pulse' : ''
                    }`}
                    style={{ 
                      backgroundColor: timeline.status === 'COMPLETED' 
                        ? 'rgba(255, 255, 255, 0.3)' 
                        : timeline.status === 'ACTIVE'
                        ? '#7c3aed'
                        : 'rgba(255, 255, 255, 0.3)',
                      border: timeline.status === 'PENDING' ? '2px solid rgba(255, 255, 255, 0.3)' : 'none',
                      animation: timeline.status === 'ACTIVE' ? 'timelineDotPulse 1s ease-in-out infinite' : 'none'
                    }}
                  >
                    {timeline.status === 'COMPLETED' && (
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    )}
                  </div>
                  
                  {/* 연결선 (마지막 항목이 아닌 경우에만) */}
                  {index < timelines.length - 1 && (
                    <div 
                      className="w-0.5 flex-1"
                      style={{ 
                        backgroundColor: timeline.status === 'COMPLETED' 
                          ? 'rgba(255, 255, 255, 0.3)' 
                          : timeline.status === 'ACTIVE'
                          ? '#7c3aed'
                          : 'rgba(255, 255, 255, 0.3)'
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
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : timeline.status === 'ACTIVE'
                        ? 'rgba(124, 58, 237, 0.1)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: timeline.status === 'ACTIVE' ? '1px solid rgba(124, 58, 237, 0.5)' : 'none',
                    }}
                  >
                    {/* 제목 */}
                    <h3 
                      className="font-bold text-base mb-1"
                      style={{ 
                        color: timeline.status === 'COMPLETED' 
                          ? 'rgba(255, 255, 255, 0.6)' 
                          : timeline.status === 'ACTIVE'
                          ? 'white'
                          : 'rgba(255, 255, 255, 0.6)'
                      }}
                    >
                      {timeline.title || '제목 없음'}
                    </h3>
                    
                    {/* 설명 */}
                    {timeline.description && (
                      <p 
                        className="text-sm mb-3"
                        style={{ 
                          color: timeline.status === 'COMPLETED' ? 'rgba(255, 255, 255, 0.4)' : timeline.status === 'ACTIVE' ? 'white' : 'rgba(255, 255, 255, 0.8)'
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
                            <svg 
                              className="w-4 h-4 mr-1" 
                              style={{ 
                                color: timeline.status === 'COMPLETED' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.6)'
                              }} 
                              fill="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                            <span 
                              className="text-xs"
                              style={{ 
                                color: timeline.status === 'COMPLETED' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.7)'
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
                          <span className="px-4 py-2 rounded-full text-xs font-regular text-gray-300" 
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                            완료
                          </span>
                        </div>
                      )}
                      
                      {timeline.status === 'ACTIVE' && (
                        <div className="flex-shrink-0">
                          <span className="px-4 py-2 rounded-full text-xs font-regular bg-purple-700 text-white">
                            진행중
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
              <p className="text-white text-lg mb-2">아직 타임라인이 없습니다</p>
              <p className="text-white text-sm" style={{ opacity: 0.6 }}>
                새로운 타임라인을 기다려주세요!
              </p>
            </div>
          )}
          
          {/* 추가 로딩 인디케이터 */}
          {loadingMore && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-white text-sm" style={{ opacity: 0.6 }}>
                더 많은 타임라인을 불러오는 중...
              </p>
            </div>
          )}
          
          {/* 더 이상 데이터가 없을 때 */}
          {!hasNext && timelines.length > 0 && (
            <div className="text-center py-8">
              <p className="text-white text-sm" style={{ opacity: 0.6 }}>
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
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>타임라인 목록을 불러오는 중...</p>
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