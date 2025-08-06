"use client";

import { RaffleItem } from "@/types/api";

interface EventRaffleProps {
  raffle: RaffleItem;
}

export default function EventRaffle({ raffle }: EventRaffleProps) {
  return (
    <section className="px-4 py-8">
      <h3 className="text-white font-semibold mb-4 text-lg" style={{ opacity: 0.9 }}>
        래플 이벤트
      </h3>
      
      <div 
        className="rounded-xl p-6 mb-4"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        {/* 래플 제목 */}
        <h4 className="text-white font-bold text-xl mb-3">
          {raffle.title || '래플 이벤트'}
        </h4>
        
        {/* 래플 설명 */}
        {raffle.description && (
          <p className="text-white text-sm mb-4" style={{ opacity: 0.7 }}>
            {raffle.description}
          </p>
        )}
        
        {/* 래플 기간 */}
        <div className="space-y-2 mb-4">
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
        
        {/* 응모하러가기 버튼 */}
        <div className="mt-6">
          <button
            className="w-full px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
            onClick={() => {
              console.log('래플 응모하러가기 버튼 클릭');
              alert('래플 응모 페이지로 이동합니다.');
            }}
          >
            응모 하러 가기
          </button>
        </div>
      </div>
    </section>
  );
} 