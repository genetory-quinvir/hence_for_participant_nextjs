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
      className="relative overflow-visible px-4 py-8 mb-4 bg-gray-100"
    >
              {/* 카드 내용 */}
        <div 
          className="relative z-10 p-4 rounded-xl cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #be185d 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
          }}
          onClick={() => {
            const raffleId = raffle.id || 'default-raffle';
            router.push(`/raffle?eventId=${eventId}&raffleId=${raffleId}`);
          }}
        >
          {/* 래플 제목과 아이콘 */}
          <div className="flex items-start justify-center space-x-3 mb-1 mt-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src="/images/img_giftbox.png" 
                alt="경품 아이콘" 
                className="w-full h-full object-contain"
                style={{ 
                  animation: 'gentleBounce 1.5s ease-in-out infinite'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <style jsx>{`
                @keyframes gentleBounce {
                  0%, 100% {
                    transform: translateY(0);
                  }
                  50% {
                    transform: translateY(-4px);
                  }
                }
              `}</style>
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-xl mb-1 mt-2">
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