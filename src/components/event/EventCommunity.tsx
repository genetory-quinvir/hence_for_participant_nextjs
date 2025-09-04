"use client";

import { useState, useRef, useEffect } from 'react';
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
import { getFormattedTime } from '@/utils/time';

interface EventCommunityProps {
  freeBoard: BoardItem[];
  eventId?: string;
  showViewAllButton?: boolean;
  onViewAllClick?: () => void;
  onRefresh?: () => void;
}



export default function EventCommunity({ 
  freeBoard, 
  eventId = 'default-event',
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
  const [isMobile, setIsMobile] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
    
    // 수정 페이지로 이동하기 전에 액션시트 닫기
    setShowActionSheet(false);
    
    // 수정 페이지로 이동
    const url = `/board/edit/${selectedPost.id}?eventId=${selectedPost.eventId || 'default-event'}&type=free`;
    router.push(url);
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (!selectedPost) return;
    
    try {
      const result = await deleteBoard(
        selectedPost.eventId || 'default-event',
        'free',
        selectedPost.id!
      );
      
      if (result.success) {
        // showToast('게시글이 삭제되었습니다.', 'success');
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
  };

  // 신고 핸들러
  const handleReport = () => {
    if (!selectedPost) return;
    
    showToast('게시글이 신고되었습니다. 검토 후 처리하겠습니다.', 'success');
    setShowActionSheet(false);
  };

  // 모바일 체크
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 스크롤 가능 여부 체크
  const checkScrollPosition = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [freeBoard]);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // id가 있는 것만 필터링하고 최대 5개까지만 표시
  const displayPosts = freeBoard
    .filter(post => post.id)
    .slice(0, 5);

  // 게시글이 없을 때 "첫 글을 써보세요" 메시지 표시
  if (!displayPosts || displayPosts.length === 0) {
    return (
      <EventSection
        title="커뮤니티"
        subtitle="이벤트 참여자들과 소통해보세요"
        rightButton={showViewAllButton ? {
          text: "전체보기",
          onClick: onViewAllClick || (() => {
            console.log('전체보기 클릭');
          })
        } : undefined}
      >
        <div className="px-4 py-8">
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <img 
                src="/images/icon_empty_board.png" 
                alt="빈 게시판 아이콘" 
                className="w-24 h-24 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">첫 글을 써보세요!</h3>
            <p className="text-gray-600 text-sm mb-4">
              이벤트 참여자들과 소통을 시작해보세요.
            </p>
            <button
              onClick={() => {
                const url = `/board/write?eventId=${eventId}&type=free`;
                router.push(url);
              }}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              소통 시작해보기
            </button>
          </div>
        </div>
      </EventSection>
    );
  }




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
          {/* 왼쪽 스크롤 화살표 - 모바일이 아닌 경우에만 표시 */}
          {!isMobile && canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-purple-100 rounded-full shadow-lg flex items-center justify-center hover:bg-purple-200 transition-all"
            >
              <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* 오른쪽 스크롤 화살표 - 모바일이 아닌 경우에만 표시 */}
          {!isMobile && canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-purple-100 rounded-full shadow-lg flex items-center justify-center hover:bg-purple-200 transition-all"
            >
              <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
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
                        {getFormattedTime(post.createdAt)}
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
                  label: "수정하기",
                  onClick: handleEdit
                },
                {
                  label: "삭제하기",
                  onClick: handleDelete,
                  variant: 'destructive'
                }
              ]
            : [
                // 남의 글인 경우: 신고
                {
                  label: "신고하기",
                  onClick: handleReport
                }
              ]
        }
      />
    </EventSection>
  );
} 