"use client";

import { TimelineItem } from "@/types/api";
import { useState, useEffect } from "react";

interface EventTimelineProps {
  timelines: TimelineItem[];
}

export default function EventTimeline({ timelines }: EventTimelineProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

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
      
      // 시간 문자열 비교 (HH:MM 형식)
      // 현재 시간이 타임라인 시간보다 작으면 PENDING
      if (currentTimeString < timelineTimeString) {
        return 'PENDING';
      }
      // 현재 시간이 타임라인 시간과 같거나 크고, 다음 타임라인이 없거나 다음 타임라인 시간보다 작으면 ACTIVE
      else if (currentTimeString >= timelineTimeString && (!nextTimelineTimeString || currentTimeString < nextTimelineTimeString)) {
        return 'ACTIVE';
      }
      // 그 외의 경우 (다음 타임라인이 시작된 경우) COMPLETED
      else {
        return 'COMPLETED';
      }
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

  const displayTimelines = updatedTimelines.filter(timeline => timeline.id);

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
        ))}
      </div>
    </div>
  );
} 