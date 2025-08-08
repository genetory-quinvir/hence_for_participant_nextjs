import { BoardItem } from '@/types/api';
import { useState, useEffect } from 'react';
import { toggleLike, getAccessToken } from '@/lib/api';

interface PostActionsProps {
  post: BoardItem;
  eventId: string;
  boardType: string;
  onLikeToggle?: (newLikeCount: number, isLiked: boolean) => void;
}

export default function PostActions({ post, eventId, boardType, onLikeToggle }: PostActionsProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post.likeCount ?? 0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // post prop이 변경될 때 상태 업데이트
  useEffect(() => {
    console.log('🔍 PostActions useEffect - post 변경:', {
      postId: post.id,
      postIsLiked: post.isLiked,
      postLikeCount: post.likeCount,
      currentIsLiked: isLiked,
      currentLikeCount: likeCount
    });
    setIsLiked(post.isLiked ?? false);
    setLikeCount(post.likeCount ?? 0);
  }, [post.isLiked, post.likeCount, post.id]);

  const handleLikeClick = async () => {
    if (isLikeLoading) return;

    console.log('🔍 좋아요 클릭:', { 
      eventId, 
      boardType, 
      postId: post.id, 
      currentIsLiked: isLiked,
      currentLikeCount: likeCount,
      action: isLiked ? '좋아요 취소 (DELETE)' : '좋아요 추가 (POST)'
    });

    try {
      setIsLikeLoading(true);
      
      if (!post.id) {
        alert('게시글 ID를 찾을 수 없습니다.');
        return;
      }
      
      const result = await toggleLike(eventId, boardType, post.id, isLiked);
      
      console.log('🔍 좋아요 API 결과:', result);
      
      if (result.success) {
        // API 응답에서 업데이트된 상태를 사용하거나, 기본값 사용
        const newIsLiked = result.updatedIsLiked ?? !isLiked;
        const newLikeCount = result.updatedLikeCount ?? (newIsLiked ? likeCount + 1 : likeCount - 1);
        
        console.log('🔍 상태 업데이트:', { 
          oldIsLiked: isLiked, 
          newIsLiked,
          apiUpdatedIsLiked: result.updatedIsLiked,
          oldLikeCount: likeCount, 
          newLikeCount,
          apiUpdatedLikeCount: result.updatedLikeCount
        });
        
        setIsLiked(newIsLiked);
        setLikeCount(newLikeCount);
        
        // 부모 컴포넌트에 상태 변경 알림
        if (onLikeToggle) {
          onLikeToggle(newLikeCount, newIsLiked);
        }
      } else {
        console.error('❌ 좋아요 실패:', result.error);
        if (result.error?.includes('로그인이 만료')) {
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          // 현재 페이지 URL을 쿼리 파라미터로 전달
          const currentUrl = window.location.pathname + window.location.search;
          window.location.href = `/sign?redirect=${encodeURIComponent(currentUrl)}`;
        } else {
          alert(result.error || '좋아요 처리에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error);
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setIsLikeLoading(false);
    }
  };

  return (
    <div className="px-0 pb-5">
      <div className="flex items-center space-x-4">
        <button 
          className="flex items-center transition-colors hover:opacity-80 disabled:opacity-50"
          onClick={handleLikeClick}
          disabled={isLikeLoading}
        >
          {isLiked ? (
            // 좋아요를 누른 경우 - 빨간색 fill
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          ) : (
            // 좋아요를 누르지 않은 경우 - 흰색 outline
            <svg className="w-5 h-5 text-white mr-2" style={{ opacity: 0.6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          )}
          <span className="text-sm font-regular text-white" style={{ opacity: 0.8 }}>
            {likeCount}
          </span>
        </button>
        
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
  );
} 