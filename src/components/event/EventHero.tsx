"use client";

import { EventItem } from "@/types/api";

interface EventHeroProps {
  event: EventItem;
}

export default function EventHero({ event }: EventHeroProps) {
  return (
    <div className="w-full aspect-square bg-gray-700 flex items-center justify-center">
      {event.imageUrl ? (
        <img 
          src={event.imageUrl} 
          alt={event.title || '이벤트 이미지'} 
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white text-sm" style={{ opacity: 0.5 }}>이벤트 이미지</span>
      )}
    </div>
  );
} 