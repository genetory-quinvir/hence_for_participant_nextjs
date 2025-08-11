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
    <section className="px-4 py-8">
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">경품 이벤트</h2>
        <p className="text-sm text-white" style={{ opacity: 0.7 }}>
          이벤트 참여자만을 위한 특별한 경품을 확인해보세요
        </p>
      </div>
      
      <div 
        className="rounded-xl p-6 mb-4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        {/* 래플 제목 */}
        <h4 className="text-white font-bold text-xl mb-1">
          {raffle.title || '경품 이벤트'}
        </h4>
        
        {/* 래플 설명 */}
        {raffle.description && (
          <p className="text-white text-sm mb-5" style={{ opacity: 0.7 }}>
            {raffle.description}
          </p>
        )}
        
        {/* 래플 기간 */}
        <div className="space-y-1">
          {raffle.startDate && (
            <div className="flex items-center">
              <span className="text-white text-sm pr-3" style={{ opacity: 0.6 }}>시작일</span>
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
              <span className="text-white text-sm pr-3" style={{ opacity: 0.6 }}>종료일</span>
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
            // 이미 응모한 경우 - 클릭 가능한 버튼
            <button
              className="w-full px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-lg"
              onClick={() => {
                console.log('이미 응모된 래플 페이지로 이동');
                const raffleId = raffle.id || 'default-raffle';
                router.push(`/raffle?eventId=${eventId}&raffleId=${raffleId}`);
              }}
            >
              응모 현황 보기
            </button>
          ) : (
            // 응모하지 않은 경우
            <button
              className="w-full px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
              onClick={() => {
                console.log('경품 이벤트 응모하러가기 버튼 클릭');
                const raffleId = raffle.id || 'default-raffle';
                router.push(`/raffle?eventId=${eventId}&raffleId=${raffleId}`);
              }}
            >
              응모 하러 가기
            </button>
          )}
        </div>
      </div>
    </section>
  );
} 