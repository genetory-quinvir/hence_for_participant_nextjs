"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BoardItem } from '@/types/api';
import PostHeader from '@/components/common/PostHeader';
import Image from 'next/image';
import EventSection from './EventSection';
import { useImageGallery } from '@/hooks/useImageGallery';
import ImageGallery from '@/components/common/ImageGallery';
import CommonActionSheet from '@/components/CommonActionSheet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/common/Toast';
import { deleteBoard } from '@/lib/api';

interface EventCommunityProps {
  freeBoard: BoardItem[];
  showViewAllButton?: boolean;
  onViewAllClick?: () => void;
  onRefresh?: () => void;
}



export default function EventCommunity({ 
  freeBoard, 
  showViewAllButton = false,
  onViewAllClick,
  onRefresh
}: EventCommunityProps) {
  
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BoardItem | null>(null);

  // 이미지 갤러리 훅
  const { isOpen, images, initialIndex, openGallery, closeGallery } = useImageGallery();

  // 이미지 클릭 핸들러
  const handleImageClick = (post: BoardItem, imageIndex: number = 0) => {
    if (post.images && post.images.length > 0) {
      openGallery(post.images, imageIndex);
    }
  };

  // 더보기 버튼 클릭 핸들러
  const handleMoreClick = (post: BoardItem) => {
    setSelectedPost(post);
    setShowActionSheet(true);
  };

  // 편집 핸들러
  const handleEdit = () => {
    if (!selectedPost) return;
    
    const url = `/board/edit/${selectedPost.id}?eventId=${selectedPost.eventId || 'default-event'}&type=free`;
    router.push(url);
    setShowActionSheet(false);
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!selectedPost) return;
    
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        const result = await deleteBoard(
          selectedPost.eventId || 'default-event',
          'free',
          selectedPost.id!
        );
        
        if (result.success) {
          showToast('게시글이 삭제되었습니다.', 'success');
          // 목록 새로고침
          if (onRefresh) {
            onRefresh();
          }
        } else {
          showToast(result.error || '게시글 삭제에 실패했습니다.', 'error');
        }
      } catch (error) {
        console.error('삭제 오류:', error);
        showToast('게시글 삭제 중 오류가 발생했습니다.', 'error');
      }
      setShowActionSheet(false);
    }
  };

  // 신고 핸들러
  const handleReport = () => {
    if (!selectedPost) return;
    
    showToast('게시글이 신고되었습니다. 검토 후 처리하겠습니다.', 'success');
    setShowActionSheet(false);
  };

  // id가 있는 것만 필터링하고 최대 5개까지만 표시
  const displayPosts = freeBoard
    .filter(post => post.id)
    .slice(0, 5);

  if (!displayPosts || displayPosts.length === 0) {
    return null;
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


  return (
    <EventSection
      title="커뮤니티"
      subtitle="이벤트 참여자들과 소통해보세요"
      rightButton={showViewAllButton ? {
        text: "전체보기",
        onClick: onViewAllClick || (() => {
          // TODO: 커뮤니티 전체보기 페이지로 이동
          console.log('전체보기 클릭');
        })
      } : undefined}
    >

      {/* 커뮤니티 캐러셀 */}
      <div className="relative">
        <div 
          ref={containerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4 px-4"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          
          {displayPosts.map((post, index) => (
            <div
              key={post.id}
              className="flex-shrink-0 w-80 h-48 rounded-xl overflow-hidden transition-all duration-300 hover:bg-gray-50 cursor-pointer"
              style={{ backgroundColor: 'white' }}
              onClick={() => {
                const url = `/board/${post.id}?type=free&eventId=${post.eventId || 'default-event'}`;
                console.log('🔗 자유게시판 클릭:', url);
                router.push(url);
              }}
            >
              <div className="p-4 h-full flex flex-col">
                {/* 게시글 헤더 */}
                <PostHeader 
                  nickname={post.user?.nickname}
                  profileImageUrl={post.user?.profileImageUrl || undefined}
                  className="mb-4"
                  showMoreButton={true}
                  onMoreClick={() => handleMoreClick(post)}
                />
                
                {/* 게시글 내용과 이미지 */}
                <div className="flex-1 flex space-x-3">
                  <div className="flex-1 min-w-0">
                    {post.content && (
                      <div className="text-md text-black font-regular line-clamp-3 whitespace-pre-wrap">
                        {post.content}
                      </div>
                    )}
                  </div>
                  
                  {/* 이미지가 있는 경우 */}
                  {post.images && post.images.length > 0 && (
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg overflow-hidden cursor-pointer" style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}>
                        <Image 
                          src={post.images[0]} 
                          alt="게시글 이미지"
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(post, 0);
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center hidden">
                          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 액션 버튼 - 고정 높이 */}
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        {post.isLiked ? (
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
                        <span className={`text-xs font-regular ${post.isLiked ? 'text-purple-700' : 'text-black'}`} style={{ opacity: post.isLiked ? 1 : 0.8 }}>
                          {post.likeCount || 0}
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
                          {post.commentCount || 0}
                        </span>
                      </div>
                    </div>
                    
                    {/* 날짜 - 오른쪽 정렬 */}
                    {post.createdAt && (
                      <span className="text-xs text-gray-500 font-regular">
                        {getRelativeTime(post.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        

      </div>

      {/* 더 많은 게시글이 있는 경우 표시 */}
      {freeBoard.length > 5 && (
        <div className="mt-6 pt-4 border-t border-white border-opacity-10 text-center">
          <p className="text-xs text-white" style={{ opacity: 0.6 }}>
            외 {freeBoard.length - 5}개의 게시글이 더 있습니다
          </p>
        </div>
      )}

      {/* 소식 올리기 버튼 */}
      <div className="mt-2 mb-12 px-4">
        <button
          onClick={() => {
            const url = `/board/write?eventId=${displayPosts[0]?.eventId || 'default-event'}`;
            console.log('🔗 소식 올리기 클릭:', url);
            router.push(url);
          }}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-md"
        >
          <span>커뮤니티 글쓰기</span>
        </button>
      </div>

      {/* 이미지 갤러리 */}
      <ImageGallery
        images={images}
        initialIndex={initialIndex}
        isOpen={isOpen}
        onClose={closeGallery}
      />

      {/* 액션시트 */}
      <CommonActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        items={
          selectedPost && user && selectedPost.user?.id === user.id
            ? [
                // 내 글인 경우: 편집/삭제
                {
                  label: "편집",
                  onClick: handleEdit
                },
                {
                  label: "삭제",
                  onClick: handleDelete,
                  variant: 'destructive'
                }
              ]
            : [
                // 남의 글인 경우: 신고
                {
                  label: "신고",
                  onClick: handleReport,
                  variant: 'destructive'
                }
              ]
        }
      />
    </EventSection>
  );
} 