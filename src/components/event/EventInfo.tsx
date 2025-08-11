"use client";

import { useState } from "react";
import { EventItem } from "@/types/api";

interface EventInfoProps {
  event: EventItem;
}

export default function EventInfo({ event }: EventInfoProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  return (
    <section className="px-4 py-8">
      {/* 이벤트 이름 */}
      <h1 className="text-2xl font-bold text-white mb-3">
        {event.title || '이벤트'}
      </h1>

      {/* 디스크립션 */}
      <div className="mb-6">
        <p 
          className={`text-white text-sm font-regular ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`} 
          style={{ opacity: 0.6 }}
        >
          {event.description || '이벤트 설명이 없습니다.'}
        </p>
        {event.description && event.description.length > 100 && (
          <>
            {!isDescriptionExpanded && (
              <button 
                onClick={toggleDescription}
                className="text-purple-600 hover:text-purple-700 text-sm mt-1"
              >
                더보기
              </button>
            )}
            {isDescriptionExpanded && (
              <button 
                onClick={toggleDescription}
                className="text-purple-600 hover:text-purple-700 text-sm mt-1"
              >
                접기
              </button>
            )}
          </>
        )}
      </div>

      {/* 일시 및 장소 */}
      <div className="mb-6">
        <div className="space-y-1">
          {event.startDate && (
            <div className="flex items-center">
              <p className="text-white font-regular text-sm pr-3" style={{ opacity: 0.6 }}>일시</p>
              <p className="text-white font-regular text-sm">
                {new Date(event.startDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
                {event.endDate && event.endDate !== event.startDate && (
                  <span> ~ {new Date(event.endDate).toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}</span>
                )}
              </p>
            </div>
          )}
          {event.location && (
            <div className="flex items-center">
              <p className="text-white font-regular text-sm pr-3" style={{ opacity: 0.6 }}>장소</p>
              <p className="text-white font-regular text-sm">{event.location}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
} 