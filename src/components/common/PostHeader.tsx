"use client";

import { ReactNode } from "react";
import CommonProfileView from "./CommonProfileView";

interface PostHeaderProps {
  nickname?: string;
  createdAt?: string;
  size?: 'sm' | 'md';
  className?: string;
  showMoreButton?: boolean;
  onMoreClick?: () => void;
  isNotice?: boolean;
  profileImageUrl?: string;
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

  return date.toLocaleDateString('ko-KR');
};

export default function PostHeader({ 
  nickname, 
  createdAt, 
  size = 'md',
  className = '',
  showMoreButton = false,
  onMoreClick, 
  isNotice = false,
  profileImageUrl
}: PostHeaderProps) {
  const displayName = nickname || '익명';
  const initial = displayName.charAt(0).toUpperCase();
  
  const isSmall = size === 'sm';
  
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {isNotice ? (
        // 공지사항 모드: 프로필과 닉네임 (운영위원회 라벨 추가)
        <>
          <CommonProfileView
            profileImageUrl={profileImageUrl}
            nickname={displayName}
            size={isSmall ? 'sm' : 'md'}
            showBorder={true}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className={`text-purple-600 font-semibold ${
                  isSmall ? 'text-xs' : 'text-sm'
                }`}>
                  운영위원회
                </span>
                <span className={`text-black font-semibold ${
                  isSmall ? 'text-xs' : 'text-sm'
                }`}>
                  {displayName}
                </span>
              </div>
              <span className={`text-black ${
                isSmall ? 'text-xs' : 'text-xs'
              }`} style={{ opacity: 0.6 }}>
                {createdAt ? getRelativeTime(createdAt) : ''}
              </span>
            </div>
          </div>
        </>
      ) : (
        // 일반 모드: 프로필과 닉네임
        <>
          <CommonProfileView
            profileImageUrl={profileImageUrl}
            nickname={displayName}
            size={isSmall ? 'sm' : 'md'}
            showBorder={true}
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col">
              <span className={`text-black font-semibold ${
                isSmall ? 'text-xs' : 'text-sm'
              }`}>
                {displayName}
              </span>
              <span className={`text-black ${
                isSmall ? 'text-xs' : 'text-xs'
              }`} style={{ opacity: 0.6 }}>
                {createdAt ? getRelativeTime(createdAt) : ''}
              </span>
            </div>
          </div>
        </>
      )}

      {/* 더보기 버튼 */}
      {showMoreButton && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // 부모 클릭 이벤트 방지
            onMoreClick?.();
          }}
          className="flex-shrink-0 p-1 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" style={{ cursor: 'pointer' }}>
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      )}
    </div>
  );
} 