"use client";

import { useState, useEffect } from 'react';
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
  const { showToast } = useToast();

  // 종료된 이벤트 데이터 로드
  useEffect(() => {
    const loadEndedEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getEventsList(1, 20, ['ended']);
        
        if (result.success && result.data) {
          setEndedEvents(result.data.items);
        } else {
          setError(result.error || '이벤트 목록을 불러오는데 실패했습니다.');
          showToast(result.error || '이벤트 목록을 불러오는데 실패했습니다.', 'error');
        }
      } catch (err) {
        console.error("종료된 이벤트 로드 오류:", err);
        setError("이벤트 목록을 불러오는데 실패했습니다.");
        showToast("이벤트 목록을 불러오는데 실패했습니다.", 'error');
      } finally {
        setLoading(false);
      }
    };

    loadEndedEvents();
  }, [showToast]);

  // 이벤트 클릭 핸들러
  const handleEventClick = (eventId: string) => {
    if (onEventClick) {
      onEventClick(eventId);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className="w-full h-96 bg-black bg-opacity-20 rounded-xl flex items-center justify-center">
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
      <div className="w-full px-8 mb-8">
        <h2 className="text-3xl font-bold text-white text-left">
          종료된 이벤트 리스트
        </h2>
      </div>
      
      {/* 세로 리스트 컨테이너 */}
      <div className="w-full px-8">
        {/* 이벤트 카드들 */}
        <div className="flex flex-col gap-6">
          {endedEvents.map((event, index) => (
            <div 
              key={event.id || index}
              className="w-full"
            >
                <div 
                  className="w-full bg-black bg-opacity-30 rounded-4xl overflow-hidden transition-all duration-300 flex shadow-2xl hover:shadow-3xl"
                >
                  {/* 이벤트 이미지 - 정사각형 */}
                  <div className="relative w-36 h-36 flex-shrink-0">
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
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 text-xs rounded-full bg-gray-500 text-white">
                        {event.status === 'ENDED' ? '종료' : event.status}
                      </span>
                    </div>
                  </div>

                  {/* 이벤트 정보 */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {event.title || '제목 없음'}
                      </h3>
                      
                      {event.description && (
                        <p className="text-lg text-white font-light opacity-80 mb-3 line-clamp-2 whitespace-pre-wrap">
                          {event.description}
                        </p>
                      )}
                    </div>

                    {/* 이벤트 일정 - 하단 고정 */}
                    <div className="flex items-center text-sm text-white">
                      <span className="text-white font-regular text-base pr-2" style={{ opacity: 0.6 }}>일시</span>
                      <span className="text-base text-white">
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
