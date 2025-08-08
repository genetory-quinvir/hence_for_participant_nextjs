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

  // 최대 3개까지만 표시하고 id가 있는 것만 필터링
  const displayNotices = notices
    .filter(notice => notice.id)
    .slice(0, 3);

  if (!displayNotices || displayNotices.length === 0) {
    return null;
  }

  return (
    <section className="py-4 px-4">
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">공지사항</h2>
        <p className="text-sm text-white" style={{ opacity: 0.7 }}>
          이벤트 관련 중요한 공지사항을 확인해보세요
        </p>
      </div>

      {/* 공지사항 캐로셀 */}
      <div className="relative">
        {/* 스크롤 컨테이너 */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {displayNotices.map((notice) => (
            <div
              key={notice.id}
              className="flex-shrink-0 w-80 rounded-xl p-4 transition-all duration-300 cursor-pointer hover:bg-white hover:bg-opacity-10"
              style={{ 
                scrollSnapAlign: 'start',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
              onClick={() => router.push(`/board/${notice.id}?type=notice&eventId=${notice.eventId || 'default-event'}`)}
            >
              {/* 공지사항 정보 */}
              <div className="space-y-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-500 font-medium">공지사항</span>
                  <span className="text-sm text-white" style={{ opacity: 0.6 }}>
                    {notice.createdAt ? getRelativeTime(notice.createdAt) : ''}
                  </span>
                </div>
                
                <h3 className="text-white font-bold text-lg line-clamp-2 mt-3 mb-1">
                  {notice.title || '제목 없음'}
                </h3>
                
                <p className="text-sm text-white mb-2" style={{ opacity: 0.8 }}>
                  {notice.content || '내용 없음'}
                </p>

              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 