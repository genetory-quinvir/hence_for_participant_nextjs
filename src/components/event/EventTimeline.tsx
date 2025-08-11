"use client";

import { TimelineItem } from "@/types/api";
import EventSection from "./EventSection";

interface EventTimelineProps {
  timelines: TimelineItem[];
  showViewAllButton?: boolean;
  onViewAllClick?: () => void;
}

export default function EventTimeline({ 
  timelines, 
  showViewAllButton = false,
  onViewAllClick 
}: EventTimelineProps) {
  // id가 있는 것만 필터링
  const displayTimelines = timelines.filter(timeline => timeline.id);

  if (!displayTimelines || displayTimelines.length === 0) {
    return null;
  }

  return (
    <EventSection
      title="타임라인"
      subtitle="이벤트 일정을 확인해보세요"
      rightButton={showViewAllButton ? {
        text: "전체보기",
        onClick: onViewAllClick || (() => {
          console.log('타임라인 전체보기 클릭');
        })
      } : undefined}
    >
      {/* 타임라인 리스트 */}
      <div className="space-y-4">
        {displayTimelines.map((timeline, index) => (
          <div key={timeline.id} className="flex">
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
              {index < displayTimelines.length - 1 && (
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
                className="rounded-xl p-5 transition-all duration-300"
                style={{ 
                  backgroundColor: timeline.status === 'COMPLETED' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : timeline.status === 'ACTIVE'
                    ? 'rgba(124, 58, 237, 0.1'
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
        ))}
      </div>
    </EventSection>
  );
} 