"use client";

import { EventItem } from "@/types/api";

interface EventHeroProps {
  event: EventItem;
}

export default function EventHero({ event }: EventHeroProps) {
  return (
    <div className="w-full flex items-center justify-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
      {event.imageUrl ? (
        <img 
          src={event.imageUrl} 
          alt={event.title || '이벤트 이미지'} 
          className="w-full h-auto object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
    </div>
  );
} 