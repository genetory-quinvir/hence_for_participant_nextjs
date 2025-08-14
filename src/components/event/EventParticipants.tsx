"use client";

import { ParticipantItem } from "@/types/api";
import { useState } from "react";
import EventSection from "./EventSection";

interface EventParticipantsProps {
  participants: ParticipantItem[];
  showViewAllButton?: boolean;
  onViewAllClick?: () => void;
}

// 상대적 시간 표시 함수
const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}초 전`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }

  // 24시간 이상 지난 경우 날짜로 표시
  return date.toLocaleDateString('ko-KR');
};

// 이니셜 생성 함수
const getInitials = (nickname: string): string => {
  if (nickname) {
    return nickname.charAt(0).toUpperCase();
  }
  return '?';
};

export default function EventParticipants({ 
  participants, 
  showViewAllButton = false, 
  onViewAllClick 
}: EventParticipantsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 최대 5명까지만 표시하고 id가 있는 것만 필터링
  const displayParticipants = participants
    .filter(participant => participant.id)
    .slice(0, 5);

  if (!displayParticipants || displayParticipants.length === 0) {
    return null;
  }

  return (
    <EventSection
      title="참여자"
      subtitle="현재 이벤트의 참여자들을 확인해보세요"
      rightButton={showViewAllButton ? {
        text: "전체보기",
        onClick: onViewAllClick || (() => {
          console.log('참여자 전체보기 클릭');
        })
      } : undefined}
    >
      {/* 참여자 리스트 컨테이너 */}
      <div 
        className="rounded-xl p-3"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <div className="space-y-1">
          {displayParticipants.map((participant, index) => (
            <div
              key={participant.id}
              className="flex items-center space-x-3 p-2 rounded-lg transition-all duration-300"
              style={{ 
                backgroundColor: hoveredIndex === index ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* 프로필 사진 */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.4)',
                border: '3px solid rgba(255, 255, 255, 0.1)'
              }}>
                {participant.user?.profileImageUrl ? (
                  <img 
                    src={participant.user.profileImageUrl} 
                    alt={participant.user.nickname || '프로필'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-bold">
                    {getInitials(participant.user?.nickname || '')}
                  </span>
                )}
              </div>

              {/* 참여자 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold text-sm truncate">
                    {participant.user?.nickname || '익명'}
                  </h3>
                  <span className="text-xs text-white" style={{ opacity: 0.6 }}>
                    {participant.joinedAt ? getRelativeTime(participant.joinedAt) : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 더 많은 참여자가 있는 경우 표시 */}
        {participants.length > 5 && (
          <div className="mt-3 pt-3 border-t border-white border-opacity-10 text-center">
            <p className="text-xs text-white" style={{ opacity: 0.6 }}>
              외 {participants.length - 5}명의 참여자가 더 있습니다
            </p>
          </div>
        )}
      </div>
    </EventSection>
  );
} 