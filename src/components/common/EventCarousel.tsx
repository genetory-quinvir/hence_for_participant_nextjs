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
      <div className="w-full h-screen bg-black bg-opacity-20 rounded-xl flex items-center justify-center">
        <div className="text-white text-lg">이벤트를 불러오는 중...</div>
      </div>
    );
  }

  // 에러 상태
  if (error || events.length === 0) {
    return (
      <div className="w-full h-screen bg-black bg-opacity-20 rounded-xl flex items-center justify-center">
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
      <div className="w-full px-8 mb-4">
        <h2 className="text-3xl font-bold text-white text-left">
          진행중이거나 예정인 이벤트 리스트
        </h2>
      </div>
      
      {/* 스크롤 가능한 컨테이너 */}
      <div className="w-full overflow-x-auto overflow-y-hidden rounded-xl scrollbar-hide">
        {/* 이벤트 카드들 */}
        <div className="flex gap-8 items-start py-4">
          {/* 왼쪽 여백 */}
          <div className=" h-246 flex-shrink-0"></div>
          
          {events.map((event, index) => (
            <div 
              key={event.id || index}
              className="w-160 h-246 flex-shrink-0"
            >
                <div 
                  className="w-full h-full bg-black bg-opacity-30 rounded-4xl overflow-hidden transition-all duration-300 flex flex-col shadow-2xl hover:shadow-3xl"
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
                      <div className="absolute top-8 right-4">
                        <span className={`px-6 py-3 text-md rounded-full ${
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
                  <div className="p-8 flex-shrink-0">
                    <h3 className="text-4xl font-bold text-white mb-4 mt-4 line-clamp-2">
                      {event.title || '제목 없음'}
                    </h3>
                    
                    {event.description && (
                      <p className="text-xl text-white font-light opacity-80 mb-4 line-clamp-4 whitespace-pre-wrap">
                        {event.description}
                      </p>
                    )}

                    {/* 이벤트 일정 */}
                    <div className="flex items-center justify-between text-sm text-white">
                      <div className="flex items-center">
                        <span className="text-white font-regular text-xl pr-3" style={{ opacity: 0.6 }}>일시</span>
                        <span className="text-xl text-white">
                          {event.startDate && formatDate(event.startDate)}
                          {event.endDate && event.startDate !== event.endDate && ` - ${formatDate(event.endDate)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 이벤트 입장하기 섹션 - 하단 고정 */}
                  <div className="p-8 mt-auto flex flex-col justify-between">                  
                    {/* 액션 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEntryClick && onEntryClick();
                      }}
                      className="w-full bg-purple-700 hover:bg-purple-700 active:bg-purple-800 rounded-xl p-3 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center">
                        {/* QR코드 아이콘 */}
                        <div className="bg-purple-600 rounded-lg mr-3 flex items-center justify-center w-16 h-16">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M3 11V3h8v8H3zm2-6v4h4V5H5zM3 21v-8h8v8H3zm2-6v4h4v-4H5zM13 3h8v8h-8V3zm2 2v4h4V5h-4zM19 19h2v2h-2v-2zM13 13h2v2h-2v-2zM15 15h2v2h-2v-2zM13 17h2v2h-2v-2zM15 19h2v2h-2v-2zM17 13h2v2h-2v-2zM19 15h2v2h-2v-2zM17 17h2v2h-2v-2z"/>
                          </svg>
                        </div>

                        <div className="text-left">
                          <div className="text-white text-xl font-bold">입장하기</div>
                          <div className="text-white text-md" style={{ opacity: 0.6 }}>QR 스캔ㆍ코드 입력</div>
                        </div>
                      </div>

                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    {/* 하단 안내 텍스트 */}
                    <div className="mt-8">
                      <p className="text-white text-md text-left" style={{ opacity: 0.6 }}>
                        문제가 있으시면 현장 스태프에게 문의해주세요
                      </p>
                    </div>
                  </div>
                </div>
              </div>
          ))}
          
          {/* 오른쪽 여백 - 확실히 생기도록 실제 요소 추가 */}
          <div className="w-2 h-246 flex-shrink-0"></div>
        </div>
      </div>
    </div>
  );
}
