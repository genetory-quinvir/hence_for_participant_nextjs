"use client";

import { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { BoardItem } from "@/types/api";
import { getFeaturedEvent } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import PostHeader from "@/components/common/PostHeader";

function BoardListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [freeBoard, setFreeBoard] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'latest' | 'popular' | 'comments'>('latest');

  // 이벤트 ID 가져오기
  const eventId = searchParams.get('eventId') || 'default-event';

  useEffect(() => {
    const fetchBoardList = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getFeaturedEvent(eventId);
        
        if (result.success && result.featured?.freeBoard) {
          setFreeBoard(result.featured.freeBoard);
        } else {
          setError(result.error || '게시글을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error("게시글 로드 오류:", err);
        setError("게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchBoardList();
  }, [eventId]);

  const handleBackClick = () => {
    router.back();
  };

  const handlePostClick = (post: BoardItem) => {
    const url = `/board/${post.id}?type=free&eventId=${post.eventId || eventId}`;
    router.push(url);
  };

  const handleWriteClick = () => {
    router.push(`/board/write?eventId=${eventId}`);
  };

  // 정렬된 게시글 목록
  const sortedPosts = useMemo(() => {
    if (!Array.isArray(freeBoard)) return [];
    
    const sorted = [...freeBoard];
    
    switch (sortType) {
      case 'latest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
      case 'popular':
        return sorted.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      case 'comments':
        return sorted.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
      default:
        return sorted;
    }
  }, [freeBoard, sortType]);





  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title="커뮤니티"
          leftButton={
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title="커뮤니티"
          leftButton={
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <CommonNavigationBar 
        title="커뮤니티"
        leftButton={
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        onLeftClick={handleBackClick}
      />
      
      {/* 정렬 드롭다운 */}
      <div className="px-4 py-6">
        <div className="flex justify-end mb-4">
          <div className="relative">
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as 'latest' | 'popular' | 'comments')}
              className="px-4 py-2 text-sm font-medium text-white appearance-none cursor-pointer focus:outline-none focus:ring-0 focus:border-0 border-0 bg-black rounded-lg pr-10"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
              }}
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="comments">댓글순</option>
            </select>
          </div>
        </div>
        
        {/* 게시글 세로 리스트 */}
        <div className="space-y-4">
          {sortedPosts.length > 0 ? (
            sortedPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl overflow-hidden transition-all duration-300 hover:bg-white hover:bg-opacity-5 cursor-pointer"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                onClick={() => handlePostClick(post)}
              >
                {/* 게시글 헤더 */}
                <PostHeader 
                  nickname={post.user?.nickname}
                  createdAt={post.createdAt}
                  className="p-4 pb-3"
                  showMoreButton={true}
                  onMoreClick={() => {
                    // TODO: 더보기 메뉴 표시
                    console.log('더보기 클릭');
                  }}
                />
                
                {/* 게시글 내용과 이미지 */}
                <div className="flex-1 flex space-x-3 px-4 pb-6 pt-3">
                  <div className="flex-1 min-w-0">
                    {post.content && (
                      <p className="text-md text-white font-regular line-clamp-3">
                        {post.content}
                      </p>
                    )}
                  </div>
                  
                  {/* 이미지가 있는 경우 */}
                  {post.images && post.images.length > 0 && (
                    <div className="flex-shrink-0">
                      <Image 
                        src={post.images[0]} 
                        alt="게시글 이미지"
                        width={80}
                        height={80}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
                
                {/* 액션 버튼 */}
                <div className="px-4 pb-5 mt-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-white mr-2" style={{ opacity: 0.6 }} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span className="text-sm font-regular text-white" style={{ opacity: 0.8 }}>
                        {post.likeCount || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white mr-2" style={{ opacity: 0.6 }}>
                        <path fillRule="evenodd" d="M5.337 21.718a6.707 6.707 0 0 1-.533-.074.75.75 0 0 1-.44-1.223 3.73 3.73 0 0 0 .814-1.686c.023-.115-.022-.317-.254-.543C3.274 16.587 2.25 14.41 2.25 12c0-5.03 4.428-9 9.75-9s9.75 3.97 9.75 9c0 5.03-4.428 9-9.75 9-.833 0-1.643-.097-2.417-.279a6.721 6.721 0 0 1-4.246.997Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-regular text-white" style={{ opacity: 0.8 }}>
                        {post.commentCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-white text-lg mb-2">아직 게시글이 없습니다</p>
              <p className="text-white text-sm" style={{ opacity: 0.6 }}>
                첫 번째 게시글을 작성해보세요!
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* 플로팅 글쓰기 버튼 */}
      <button
        onClick={handleWriteClick}
        className="fixed bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-50"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

// 로딩 컴포넌트
function BoardListLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>게시글 목록을 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function BoardListPage() {
  return (
    <Suspense fallback={<BoardListLoading />}>
      <BoardListContent />
    </Suspense>
  );
}