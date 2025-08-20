"use client";

import { TimelineItem } from "@/types/api";

interface EventTimelineProps {
  timelines: TimelineItem[];
}

export default function EventTimeline({ timelines }: EventTimelineProps) {
  const displayTimelines = timelines.filter(timeline => timeline.id);

  if (!displayTimelines || displayTimelines.length === 0) {
    return null;
  }

  return (
    <div className="px-4 mb-12">
      <div className="space-y-4">
        {displayTimelines.map((timeline, index) => (
          <div key={timeline.id} className="flex">
            {/* 왼쪽 시간 및 연결선 */}
            <div className="flex flex-col items-center mr-4">
              {/* 시간 */}
              <div 
                className="text-md font-normal mb-2 mt-1 flex-shrink-0"
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
              {index < displayTimelines.length - 1 && (
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
                        <img
                          src="/images/icon_pin.png"
                          alt="위치 아이콘"
                          className="w-6 h-6 mr-1 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
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
        ))}
      </div>
    </div>
  );
} 