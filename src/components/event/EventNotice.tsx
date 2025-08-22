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
            <div className="flex-1 flex flex-col">
              <div className="flex items-center mb-3">
                <img 
                  src="/images/icon_notice.png" 
                  alt="공지사항 아이콘" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              </div>
              
              <h3 className="text-black font-bold text-md mb-1">
                {notice.title || '제목 없음'}
              </h3>
              
              <p className="text-sm text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap line-clamp-3">
                {notice.content || '내용 없음'}
              </p>
              
              {/* 액션 버튼 - 고정 높이 */}
              <div className="mt-auto pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      {notice.isLiked ? (
                        <svg 
                          className="w-4 h-4 mr-1 text-purple-700" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      ) : (
                        <svg 
                          className="w-4 h-4 mr-1 text-black" 
                          style={{ opacity: 0.6 }}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      )}
                      <span className={`text-xs font-regular ${notice.isLiked ? 'text-purple-700' : 'text-black'}`} style={{ opacity: notice.isLiked ? 1 : 0.8 }}>
                        {notice.likeCount || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <svg 
                        className="w-4 h-4 text-black mr-1" 
                        style={{ opacity: 0.6 }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-xs font-regular text-black" style={{ opacity: 0.8 }}>
                        {notice.commentCount || 0}
                      </span>
                    </div>
                  </div>
                  
                  {/* 날짜 - 오른쪽 정렬 */}
                  <span className="text-xs text-gray-500 font-regular">
                    {notice.createdAt ? getRelativeTime(notice.createdAt) : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 