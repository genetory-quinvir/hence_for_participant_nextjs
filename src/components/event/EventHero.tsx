"use client";

import { EventItem } from "@/types/api";

interface EventHeroProps {
  event: EventItem;
}

export default function EventHero({ event }: EventHeroProps) {
  return (
    <div className="w-full aspect-square flex items-center justify-center px-0" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
      {event.imageUrl ? (
        <img 
          src={event.imageUrl} 
          alt={event.title || '이벤트 이미지'} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <span className="text-white text-sm hidden" style={{ opacity: 0.5 }}>이벤트 이미지</span>
    </div>
  );
} 