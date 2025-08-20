"use client";

import { useState } from "react";
import { EventItem } from "@/types/api";

interface EventInfoProps {
  event: EventItem;
}

export default function EventInfo({ event }: EventInfoProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  return (
    <section className="px-4 mt-4 mb-12 bg-gray-100">
      <h1 className="text-2xl font-bold text-black mb-3">
        {event.title || '이벤트'}
      </h1>

      <div className="mb-6">
        <p 
          className={`text-black text-sm leading-relaxed whitespace-pre-wrap ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`} 
          style={{ opacity: 0.6 }}
        >
          {event.description || '이벤트 설명이 없습니다.'}
        </p>
        {event.description && event.description.length > 100 && (
          <button 
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="text-purple-700 text-sm mt-1"
          >
            {isDescriptionExpanded ? '접기' : '더보기'}
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="space-y-1">
          {event.startDate && (
            <div className="flex items-center">
              <p className="text-black text-sm pr-3" style={{ opacity: 0.6 }}>일시</p>
              <p className="text-black text-sm">
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
              <p className="text-black text-sm pr-3" style={{ opacity: 0.6 }}>장소</p>
              <p className="text-black text-sm">{event.location}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
} 