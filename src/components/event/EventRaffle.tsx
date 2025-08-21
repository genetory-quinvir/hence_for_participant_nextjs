"use client";

import { useRouter } from "next/navigation";
import { RaffleItem } from "@/types/api";
import { useState, useEffect, useRef } from "react";

interface EventRaffleProps {
  raffle: RaffleItem;
  eventId: string;
}

export default function EventRaffle({ raffle, eventId }: EventRaffleProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  
  // 3D 카드 효과
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMove = (clientX: number, clientY: number) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const moveX = clientX - centerX;
      const moveY = clientY - centerY;
      
      const rotateX = (moveY / (rect.height / 2)) * -10;
      const rotateY = (moveX / (rect.width / 2)) * 10;
      
      setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      setRotation({ x: 0, y: 0 });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleMove(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      setRotation({ x: 0, y: 0 });
    };

    // 마우스 이벤트
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    // 터치 이벤트
    card.addEventListener('touchmove', handleTouchMove, { passive: false });
    card.addEventListener('touchend', handleTouchEnd);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('touchmove', handleTouchMove);
      card.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div 
      className="relative overflow-visible px-4 py-8 mb-4 bg-gray-100"
    >
              {/* 카드 내용 */}
        <div 
          ref={cardRef}
          className="relative z-10 p-4 rounded-xl transition-transform duration-200 ease-out cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #be185d 100%)',
            transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: 'preserve-3d',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
          onClick={() => {
            const raffleId = raffle.id || 'default-raffle';
            router.push(`/raffle?eventId=${eventId}&raffleId=${raffleId}`);
          }}
        >
          {/* 래플 제목과 아이콘 */}
          <div className="flex items-start justify-center space-x-3 mb-1">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src="/images/img_giftbox.png" 
                alt="경품 아이콘" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-xl mb-2">
                {raffle.title || '경품 이벤트'}
              </h4>
              
              {/* 래플 설명 */}
              {raffle.description && (
                <p className="text-white text-sm mb-5 opacity-90">
                  {raffle.description}
                </p>
              )}
            </div>
          </div>
        
        {/* 래플 기간
        <div className="space-y-1">
          {raffle.startDate && (
            <div className="flex items-center">
              <span className="text-white text-sm pr-3 opacity-80">시작일</span>
              <span className="text-white text-sm">
                {new Date(raffle.startDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </span>
            </div>
          )}
          {raffle.endDate && (
            <div className="flex items-center">
              <span className="text-white text-sm pr-3 opacity-80">종료일</span>
              <span className="text-white text-sm">
                {new Date(raffle.endDate).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </span>
            </div>
          )}
        </div> */}
        
        {/* 응모 상태에 따른 버튼 */}
        <div>
          {raffle.isParticipated ? (
            <div className="w-full px-8 py-3 flex items-center justify-center space-x-2">
              <img src="/images/icon_check.png" alt="완료 체크" className="w-6 h-6" />
              <span className="font-medium text-white">이미 응모하셨습니다!</span>
            </div>
          ) : (
            <button
              className="w-full px-8 py-3 text-white rounded-lg font-bold shadow-lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              onClick={() => {
                const raffleId = raffle.id || 'default-raffle';
                router.push(`/raffle?eventId=${eventId}&raffleId=${raffleId}`);
              }}
            >
              응모 하러 가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 