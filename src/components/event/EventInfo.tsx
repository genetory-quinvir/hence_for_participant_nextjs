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
              <svg className="w-4 h-4 text-gray-800 dark:text-white mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z" clipRule="evenodd"/>
              </svg>
              <p className="text-black text-sm">
                {new Date(event.startDate).toLocaleDateString('ko-KR', {
                  timeZone: 'Asia/Seoul',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {event.endDate && event.endDate !== event.startDate && (
                  <span>
                    {new Date(event.startDate).toLocaleDateString('ko-KR', {
                      timeZone: 'Asia/Seoul',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </p>
            </div>
          )}
          {event.location && (
            <div className="flex items-center">
            <svg className={`w-4 h-4 dark:text-white mr-1`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z" clipRule="evenodd"/>
            </svg>
              <p className="text-black text-sm">{event.location}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
} 