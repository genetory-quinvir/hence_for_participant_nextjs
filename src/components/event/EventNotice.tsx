"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { NoticeItem } from "@/types/api";

interface EventNoticeProps {
  notices: NoticeItem[];
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

export default function EventNotice({ notices }: EventNoticeProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const displayNotices = notices
    .filter(notice => notice.id)
    .slice(0, 3);

  if (!displayNotices || displayNotices.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full bg-gray-100 mb-8">
      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto scrollbar-hide"
        style={{ 
          paddingLeft: '16px',
          paddingRight: '16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {displayNotices.map((notice) => (
          <div
            key={notice.id}
            className="flex-shrink-0 w-80 rounded-xl p-4 cursor-pointer bg-white"
            style={{ 
              scrollSnapAlign: 'start',
            }}
            onClick={() => router.push(`/board/${notice.id}?type=notice&eventId=${notice.eventId || 'default-event'}`)}
          >
            {/* 공지사항 정보 */}
            <div>
              <div className="flex items-center justify-between">
                <img 
                  src="/images/icon_notice.png" 
                  alt="공지사항 아이콘" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <span className="text-xs text-gray-500 font-regular">
                  {notice.createdAt ? getRelativeTime(notice.createdAt) : ''}
                </span>
              </div>
              
              <h3 className="text-black font-bold text-lg mt-3 mb-1">
                {notice.title || '제목 없음'}
              </h3>
              
              <p className="text-sm text-gray-700 mb-2 leading-relaxed whitespace-pre-wrap">
                {notice.content || '내용 없음'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 