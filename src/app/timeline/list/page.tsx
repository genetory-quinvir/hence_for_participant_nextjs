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
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center px-4">
            <div className="text-red-400 text-lg mb-4">⚠️</div>
            <p className="text-black text-lg mb-4">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-purple-600 text-black rounded-lg hover:bg-purple-700 transition-colors"
            >
              메인으로 돌아가기
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
      />
      
      <div className="px-4 py-2" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom) + 24px)' }}>
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
                  {index < timelines.length - 1 && (
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
                                color: timeline.status === 'COMPLETED' ? 'rgba(0, 0, 0, 0.2)' : timeline.status === 'ACTIVE' ? '#7c3aed' : 'rgba(0, 0, 0, 0.7)'
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
                          <span className="px-4 py-2 rounded-full text-xs font-bold text-gray-400" 
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
          {!hasNext && timelines.length > 0 && (
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
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
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