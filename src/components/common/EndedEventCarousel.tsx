"use client";

import { useState, useEffect, useRef } from 'react';
import { EventItem } from '@/types/api';
import { getEventsList } from '@/lib/api';
import { useToast } from './Toast';

interface EndedEventCarouselProps {
  onEventClick?: (eventId: string) => void;
}

export default function EndedEventCarousel({ onEventClick }: EndedEventCarouselProps) {
  const [endedEvents, setEndedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { showToast } = useToast();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 종료된 이벤트 데이터 로드
  useEffect(() => {
    const loadEndedEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 안드로이드 크롬 네트워크 상태 확인
        const isAndroidChrome = /Android.*Chrome/.test(navigator.userAgent);
        if (isAndroidChrome) {
          console.log('📱 안드로이드 크롬 - EndedEventCarousel 네트워크 상태 확인:', navigator.onLine);
          if (!navigator.onLine) {
            setError('네트워크 연결을 확인해주세요.');
            // showToast('네트워크 연결을 확인해주세요.', 'error');
            setLoading(false);
            return;
          }
        }
        
        // 재시도 횟수 제한 (안드로이드에서 무한 루프 방지)
        if (retryCount >= 3) {
          console.error('❌ EndedEventCarousel - 최대 재시도 횟수 초과');
          setError('데이터 로드에 실패했습니다. 페이지를 새로고침해주세요.');
          setLoading(false);
          return;
        }
        
        console.log('🔄 EndedEventCarousel - 종료된 이벤트 로드 시작 (시도:', retryCount + 1, '/3)');
        const result = await getEventsList(1, 20, ['ended']);
        
        if (result.success && result.data) {
          console.log('✅ EndedEventCarousel - 종료된 이벤트 로드 성공:', result.data.items.length, '개');
          setEndedEvents(result.data.items);
          setRetryCount(0); // 성공 시 재시도 카운트 리셋
        } else {
          console.error('❌ EndedEventCarousel - 종료된 이벤트 로드 실패:', result.error);
          setError(result.error || '이벤트 목록을 불러오는데 실패했습니다.');
          showToast(result.error || '이벤트 목록을 불러오는데 실패했습니다.', 'error');
          // 실패 시 3초 후 재시도
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 3000);
        }
      } catch (err) {
        console.error("💥 EndedEventCarousel - 종료된 이벤트 로드 예외:", err);
        setError("이벤트 목록을 불러오는데 실패했습니다.");
        showToast("이벤트 목록을 불러오는데 실패했습니다.", 'error');
        // 예외 발생 시 3초 후 재시도
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    // 컴포넌트 마운트 시에만 로드 (안드로이드에서 무한 루프 방지)
    if (retryCount === 0) {
      loadEndedEvents();
    }

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [showToast, retryCount]);

  // 이벤트 클릭 핸들러
  const handleEventClick = (eventId: string) => {
    if (onEventClick) {
      onEventClick(eventId);
    }
  };

  // 날짜 포맷 함수 - 한국 시간 기준
  const formatDate = (dateString: string) => {
    const koreaTimeZone = 'Asia/Seoul';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      timeZone: koreaTimeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="w-full h-96 bg-black bg-opacity-20 rounded-sm flex items-center justify-center">
        <div className="text-white text-lg">종료된 이벤트를 불러오는 중...</div>
      </div>
    );
  }

  // 종료된 이벤트가 없는 경우
  if (endedEvents.length === 0) {
    return null; // 아무것도 렌더링하지 않음
  }

  return (
    <div className="w-full">
      {/* 섹션 타이틀 */}
      <div className="w-full px-4 mb-4">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white text-left">
          종료된 이벤트 리스트
        </h2>
      </div>
      
      {/* 세로 리스트 컨테이너 */}
      <div className="w-full px-4">
        {/* 이벤트 카드들 */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {endedEvents.map((event, index) => (
            <div 
              key={event.id || index}
              className="w-full h-20 sm:h-24 lg:h-28"
            >
                <div 
                  className="w-full h-full rounded-sm overflow-hidden transition-all duration-300 flex shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
                >
                  {/* 이벤트 이미지 - 정사각형 */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 flex-shrink-0">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title || '이벤트 이미지'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-black ${event.imageUrl ? 'hidden' : ''}`}>
                      <div className="absolute inset-0 bg-purple-600 bg-opacity-20"></div>
                    </div>
                    
                    {/* 이벤트 상태 배지 */}
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                      <span className="px-2 sm:px-3 py-1 sm:py-2 text-xs rounded-full bg-gray-500 text-white">
                        {event.status === 'ENDED' ? '종료' : event.status}
                      </span>
                    </div>
                  </div>

                  {/* 이벤트 정보 */}
                  <div className="flex-1 py-2 sm:py-3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm sm:text-md lg:text-lg ml-3 font-bold text-white mb-1 line-clamp-1">
                        {event.title || '제목 없음'}
                      </h3>
                      
                      {event.description && (
                        <p className="text-xs sm:text-sm lg:text-md ml-3 text-white font-light opacity-80 mb-2 sm:mb-3 line-clamp-1 whitespace-pre-wrap">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* 이벤트 일정 - 하단 고정 */}
                    <div className="flex ml-3 items-center text-xs sm:text-sm lg:text-base text-white">
                      <span className="text-white font-regular text-xs sm:text-sm lg:text-base pr-2" style={{ opacity: 0.6 }}>일시</span>
                      <span className="text-xs sm:text-sm lg:text-base text-white">
                        {event.startDate && formatDate(event.startDate)}
                        {event.endDate && event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                      </span>
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
