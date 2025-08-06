"use client";

import { FreeBoardItem } from "@/types/api";

interface EventCommunityProps {
  freeBoard: FreeBoardItem[];
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

export default function EventCommunity({ freeBoard }: EventCommunityProps) {
  // id가 있는 것만 필터링하고 최대 5개까지만 표시
  const displayPosts = freeBoard
    .filter(post => post.id)
    .slice(0, 5);

  if (!displayPosts || displayPosts.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4">
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">커뮤니티</h2>
        <p className="text-sm text-white" style={{ opacity: 0.7 }}>
          이벤트 참여자들과 소통해보세요
        </p>
      </div>

      {/* 커뮤니티 리스트 */}
      <div 
        className="rounded-xl p-3"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div className="space-y-3">
          {displayPosts.map((post) => (
            <div
              key={post.id}
              className="p-3 rounded-lg transition-all duration-300 hover:bg-white hover:bg-opacity-5"
            >
              {/* 작성자 정보 */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {post.user?.nickname ? post.user.nickname.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-sm">
                      {post.user?.nickname || '익명'}
                    </span>
                    <span className="text-xs text-white" style={{ opacity: 0.6 }}>
                      {post.createdAt ? getRelativeTime(post.createdAt) : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 게시글 내용 */}
              <p className="text-sm text-white mb-3" style={{ opacity: 0.9 }}>
                {post.content || '내용 없음'}
              </p>

              {/* 이미지가 있는 경우 */}
              {post.images && post.images.length > 0 && (
                <div className="mb-3">
                  <img 
                    src={post.images[0]} 
                    alt="게시글 이미지"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              
              {/* 좋아요, 댓글 수 */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-white mr-1" style={{ opacity: 0.6 }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="text-xs text-white" style={{ opacity: 0.6 }}>
                    {post.likeCount || 0}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-white mr-1" style={{ opacity: 0.6 }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.99 4c0-1.1-.89-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                  </svg>
                  <span className="text-xs text-white" style={{ opacity: 0.6 }}>
                    {post.commentCount || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 더 많은 게시글이 있는 경우 표시 */}
        {freeBoard.length > 5 && (
          <div className="mt-3 pt-3 border-t border-white border-opacity-10 text-center">
            <p className="text-xs text-white" style={{ opacity: 0.6 }}>
              외 {freeBoard.length - 5}개의 게시글이 더 있습니다
            </p>
          </div>
        )}
      </div>
    </section>
  );
} 