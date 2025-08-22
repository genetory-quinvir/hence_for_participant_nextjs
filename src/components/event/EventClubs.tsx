"use client";

import { ClubItem } from "@/types/api";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface EventClubsProps {
  clubs: ClubItem[];
  eventId: string;
}

export default function EventClubs({ clubs, eventId }: EventClubsProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  if (!clubs || clubs.length === 0) {
    return null;
  }

  // 랭킹 순으로 정렬 (rank가 있으면 rank 기준, 없으면 voteCount 기준)
  const sortedClubs = [...clubs].sort((a, b) => {
    if (a.rank && b.rank) {
      return a.rank - b.rank;
    }
    return (b.voteCount || 0) - (a.voteCount || 0);
  });

  // 상위 3개 동아리만 가져오기
  const top3Clubs = sortedClubs.slice(0, 3);

  // 2등-1등-3등 순서로 재배열
  const reorderedClubs = [
    top3Clubs[1], // 2등
    top3Clubs[0], // 1등
    top3Clubs[2]  // 3등
  ];

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
      
      const rotateX = (moveY / (rect.height / 2)) * -5;
      const rotateY = (moveX / (rect.width / 2)) * 5;
      
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
    <div className="relative overflow-visible px-4 py-8 bg-gray-100 mb-4">
      {/* 카드 내용 */}
      <div 
        ref={cardRef}
        className="relative z-10 p-6 rounded-xl transition-transform duration-200 ease-out"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* 헤더 */}
                  <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 mr-4">
              <img 
                src="/images/icon_vote.png" 
                alt="투표 아이콘" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            </div>
          <div className="flex-1">
            <h4 className="text-white font-bold text-xl mb-1">
              동아리 투표 랭킹
            </h4>
            <p className="text-white text-sm opacity-90">
              지금 우리 동아리에 투표하고<br/>
              회식비를 받아보세요!
            </p>
          </div>
        </div>

        {/* 랭킹 목록 - 가로 정렬 */}
        <div className="flex items-end justify-center space-x-4">
          {reorderedClubs.map((club, index) => {
            const isFirst = index === 1; // 1등 (가운데)
            const isSecond = index === 0; // 2등 (왼쪽)
            const isThird = index === 2; // 3등 (오른쪽)
            
            return (
              <div
                key={club.id}
                className="flex flex-col items-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: isFirst ? '24px 20px' : '20px 16px',
                  minWidth: isFirst ? '140px' : '120px'
                }}
              >
                {/* 랭킹 배지 */}
                <div className="flex items-center justify-center mb-4"
                  style={{
                    width: isFirst ? '64px' : '48px',
                    height: isFirst ? '64px' : '48px',
                    background: isFirst ? 'linear-gradient(135deg, #FFD700, #FFA500)' : // 1등: 금색
                              isSecond ? 'linear-gradient(135deg, #C0C0C0, #A9A9A9)' : // 2등: 은색
                              'linear-gradient(135deg, #CD7F32, #B8860B)', // 3등: 동색
                    borderRadius: '50%',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}>
                  <span className="text-white font-bold" style={{ fontSize: isFirst ? '24px' : '20px' }}>
                    {isFirst ? '🥇' : isSecond ? '🥈' : '🥉'}
                  </span>
                </div>
                
                {/* 동아리 정보 */}
                <div className="text-center">
                  <h3 className="text-white font-bold mb-2" style={{ fontSize: isFirst ? '16px' : '14px' }}>
                    {club.name || '동아리명 없음'}
                  </h3>
                  
                  <span className="text-white text-sm font-medium px-3 py-1 rounded-full mb-3 inline-block"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      fontSize: isFirst ? '14px' : '12px'
                    }}>
                    {isFirst ? '1등' : isSecond ? '2등' : '3등'}
                  </span>
                  
                  {club.description && (
                    <p className="text-white text-sm opacity-80 mb-3 line-clamp-2" style={{ fontSize: isFirst ? '13px' : '12px' }}>
                      {club.description}
                    </p>
                  )}
                  
                  {/* 투표 수 */}
                  <div className="flex items-center justify-center">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full mr-2"
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(10px)'
                      }}>
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    <span className="text-white text-sm font-medium" style={{ fontSize: isFirst ? '14px' : '12px' }}>
                      {club.voteCount || 0}표
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 전체 투표 버튼 */}
        <div className="mt-8">
          <button
            className="w-full px-8 py-3 text-white rounded-lg font-bold shadow-lg"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)'
            }}
            onClick={() => {
              // 투표 페이지로 이동
              router.push(`/vote?eventId=${eventId}`);
            }}
          >
            투표 참여하기
          </button>
        </div>
      </div>
    </div>
  );
}
