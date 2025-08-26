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

// 상대적 시간 표시 함수 - 한국 시간 기준
const getRelativeTime = (dateString: string): string => {
  // 한국 시간대 설정 (KST: UTC+9)
  const koreaTimeZone = 'Asia/Seoul';
  
  // 현재 시간을 한국 시간으로 변환
  const now = new Date().toLocaleString('en-US', { timeZone: koreaTimeZone });
  const nowDate = new Date(now);
  
  // 입력된 날짜를 한국 시간으로 변환
  const inputDate = new Date(dateString).toLocaleString('en-US', { timeZone: koreaTimeZone });
  const date = new Date(inputDate);
  
  const diffInSeconds = Math.floor((nowDate.getTime() - date.getTime()) / 1000);

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

  // 24시간 이상 지난 경우 한국 시간 기준으로 날짜 표시
  return date.toLocaleDateString('ko-KR', { timeZone: koreaTimeZone });
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
          <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24" style={{ cursor: 'pointer' }}>
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      )}
    </div>
  );
} 