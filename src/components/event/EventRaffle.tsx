"use client";

import { useRouter } from "next/navigation";
import { RaffleItem } from "@/types/api";

interface EventRaffleProps {
  raffle: RaffleItem;
  eventId: string;
}

export default function EventRaffle({ raffle, eventId }: EventRaffleProps) {
  const router = useRouter();
  
  return (
    <div 
      className="relative overflow-hidden px-4 mb-12"
      style={{
        // background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)'
        backgroundColor: '#7c3aed'
      }}
    >
              {/* 카드 내용 */}
        <div className="relative z-10 py-6">
          {/* 래플 제목과 아이콘 */}
          <div className="flex items-start justify-center space-x-3 mb-1">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src="/images/icon_raffle.png" 
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
        
        {/* 래플 기간 */}
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
        </div>
        
        {/* 응모 상태에 따른 버튼 */}
        <div className="mt-6">
          {raffle.isParticipated ? (
            <button
              className="w-full px-8 py-3 bg-gray-200 bg-opacity-20 text-gray-400 rounded-lg hover:bg-opacity-30 font-medium"
              onClick={() => {
                const raffleId = raffle.id || 'default-raffle';
                router.push(`/raffle?eventId=${eventId}&raffleId=${raffleId}`);
              }}
            >
              응모 현황 보기
            </button>
          ) : (
            <button
              className="w-full px-8 py-3 text-white rounded-lg font-bold shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)'
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