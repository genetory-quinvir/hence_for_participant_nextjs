"use client";

import { useState, useEffect, useRef } from 'react';
import { EventItem } from '@/types/api';
import { getEventsList } from '@/lib/api';
import { useToast } from './Toast';

interface EventCarouselProps {
  onEventClick?: (eventId: string) => void;
  onEntryClick?: () => void;
}

export default function EventCarousel({ onEventClick, onEntryClick }: EventCarouselProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // 이벤트 데이터 로드
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getEventsList(1, 20, ['active', 'draft']);
        
        if (result.success && result.data) {
          setEvents(result.data.items);
        } else {
          setError(result.error || '이벤트 목록을 불러오는데 실패했습니다.');
          showToast(result.error || '이벤트 목록을 불러오는데 실패했습니다.', 'error');
        }
      } catch (err) {
        console.error("이벤트 로드 오류:", err);
        setError("이벤트 목록을 불러오는데 실패했습니다.");
        showToast("이벤트 목록을 불러오는데 실패했습니다.", 'error');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
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
      <div className="w-full h-screen bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
        <div className="text-white text-lg">이벤트를 불러오는 중...</div>
      </div>
    );
  }

  // 에러 상태
  if (error || events.length === 0) {
    return (
      <div className="w-full h-screen bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-lg mb-2">이벤트가 없습니다</div>
          <div className="text-sm opacity-60">새로운 이벤트를 기다려주세요</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 섹션 타이틀 */}
      <div className="w-full px-4 mb-1">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white text-left">
          진행중 혹은 예정인 이벤트
        </h2>
      </div>
      
      {/* 스크롤 가능한 컨테이너 */}
      <div className="w-full overflow-x-auto overflow-y-hidden rounded-lg scrollbar-hide">
        {/* 이벤트 카드들 */}
        <div className="flex gap-4 sm:gap-6 lg:gap-8 items-start py-3 px-4 sm:px-6 lg:px-8">
          {events.map((event, index) => (
            <div 
              key={event.id || index}
              className="w-80 sm:w-96 md:w-[28rem] lg:w-[32rem] xl:w-[36rem] min-h-80 sm:min-h-96 md:min-h-[28rem] lg:min-h-[32rem] xl:min-h-[36rem] flex-shrink-0"
            >
                <div 
                  className="w-full h-full rounded-4xl overflow-hidden transition-all duration-300 flex flex-col shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
                >
                  {/* 이벤트 이미지 - 4:3 비율 고정 */}
                  <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
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
                    {event.status && (
                      <div className="absolute top-3 sm:top-4 right-2 sm:right-3">
                        <span className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-full ${
                          event.status === 'ACTIVE' ? 'bg-purple-700 text-white' :
                          event.status === 'DRAFT' ? 'bg-gray-500 text-white' :
                          event.status === 'ENDED' ? 'bg-gray-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {event.status === 'ACTIVE' ? '진행중' :
                           event.status === 'DRAFT' ? '예정' :
                           event.status === 'ENDED' ? '종료' :
                           event.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 이벤트 정보 - 상단 고정 */}
                  <div className="px-3 sm:px-4 py-2 sm:py-3 flex-1 flex flex-col">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2 line-clamp-1">
                      {event.title || '제목 없음'}
                    </h3>
                    
                    {/* Description 영역 - 항상 동일한 높이 유지 */}
                    <div 
                      className="text-sm sm:text-md lg:text-base text-white font-light opacity-80 mb-2 sm:mb-3 lg:mb-4 line-clamp-3 h-14 sm:h-16 lg:h-18 overflow-hidden"
                    >
                      {event.description || '\u00A0'}
                    </div>

                    {/* 이벤트 일정 */}
                    <div className="flex items-center justify-between text-xs sm:text-sm lg:text-base text-white mt-auto">
                      <div className="flex items-center">
                        <span className="text-white font-regular text-xs sm:text-md lg:text-base pr-2 sm:pr-3" style={{ opacity: 0.6 }}>일시</span>
                        <span className="text-xs sm:text-md lg:text-base text-white">
                          {event.startDate && formatDate(event.startDate)}
                          {event.endDate && event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 이벤트 입장하기 섹션 - 하단 고정 */}
                  <div className="p-3 sm:p-4 flex-shrink-0 flex flex-col justify-between">                  
                    {/* 액션 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEntryClick && onEntryClick();
                      }}
                      className="w-full bg-purple-700 hover:bg-purple-700 active:bg-purple-800 rounded-xl p-2 sm:p-3 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center">
                        {/* QR코드 아이콘 */}
                        <div className="bg-purple-600 rounded-lg mr-2 sm:mr-3 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16">
                          <svg
                            className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M3 11V3h8v8H3zm2-6v4h4V5H5zM3 21v-8h8v8H3zm2-6v4h4v-4H5zM13 3h8v8h-8V3zm2 2v4h4V5h-4zM19 19h2v2h-2v-2zM13 13h2v2h-2v-2zM15 15h2v2h-2v-2zM13 17h2v2h-2v-2zM15 19h2v2h-2v-2zM17 13h2v2h-2v-2zM19 15h2v2h-2v-2zM17 17h2v2h-2v-2z"/>
                          </svg>
                        </div>

                        <div className="text-left">
                          <div className="text-white text-base sm:text-xl font-bold">입장하기</div>
                          <div className="text-white text-xs sm:text-md" style={{ opacity: 0.6 }}>QR 스캔ㆍ코드 입력</div>
                        </div>
                      </div>

                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* 하단 안내 텍스트 */}
                    <div className="mt-4 sm:mt-4 mb-4">
                      <p className="text-white text-xs sm:text-sm text-center" style={{ opacity: 0.6 }}>
                        문제가 있으시면 현장 스태프에게 문의해주세요
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          ))}
          
          {/* 오른쪽 여백 - 확실히 생기도록 실제 요소 추가 */}
          <div className="w-2 flex-shrink-0"></div>
        </div>
      </div>
    </div>
  );
}
