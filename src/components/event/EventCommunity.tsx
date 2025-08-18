"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BoardItem } from '@/types/api';
import PostHeader from '@/components/common/PostHeader';
import Image from 'next/image';
import EventSection from './EventSection';
import { useImageGallery } from '@/hooks/useImageGallery';
import ImageGallery from '@/components/common/ImageGallery';

interface EventCommunityProps {
  freeBoard: BoardItem[];
  showViewAllButton?: boolean;
  onViewAllClick?: () => void;
}



export default function EventCommunity({ 
  freeBoard, 
  showViewAllButton = false,
  onViewAllClick 
}: EventCommunityProps) {
  
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 이미지 갤러리 훅
  const { isOpen, images, initialIndex, openGallery, closeGallery } = useImageGallery();

  // 이미지 클릭 핸들러
  const handleImageClick = (post: BoardItem, imageIndex: number = 0) => {
    if (post.images && post.images.length > 0) {
      openGallery(post.images, imageIndex);
    }
  };

  // id가 있는 것만 필터링하고 최대 5개까지만 표시
  const displayPosts = freeBoard
    .filter(post => post.id)
    .slice(0, 5);

  if (!displayPosts || displayPosts.length === 0) {
    return null;
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
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
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
              className="flex-shrink-0 w-80 h-48 rounded-xl overflow-hidden transition-all duration-300 hover:bg-white hover:bg-opacity-5 cursor-pointer"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
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
                  createdAt={post.createdAt}
                  className="mb-4"
                  showMoreButton={true}
                  onMoreClick={() => {
                    // TODO: 더보기 메뉴 표시
                    console.log('더보기 클릭');
                  }}
                />
                
                {/* 게시글 내용과 이미지 */}
                <div className="flex-1 flex space-x-3">
                  <div className="flex-1 min-w-0">
                    {post.content && (
                      <div className="text-md text-white font-regular line-clamp-3 whitespace-pre-wrap">
                        {post.content}
                      </div>
                    )}
                  </div>
                  
                  {/* 이미지가 있는 경우 */}
                  {post.images && post.images.length > 0 && (
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-lg overflow-hidden cursor-pointer" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
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
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-white mr-1" style={{ opacity: 0.6 }} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      <span className="text-xs font-regular text-white" style={{ opacity: 0.8 }}>
                        {post.likeCount || 0}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white mr-1" style={{ opacity: 0.6 }}>
                        <path fillRule="evenodd" d="M5.337 21.718a6.707 6.707 0 0 1-.533-.074.75.75 0 0 1-.44-1.223 3.73 3.73 0 0 0 .814-1.686c.023-.115-.022-.317-.254-.543C3.274 16.587 2.25 14.41 2.25 12c0-5.03 4.428-9 9.75-9s9.75 3.97 9.75 9c0 5.03-4.428 9-9.75 9-.833 0-1.643-.097-2.417-.279a6.721 6.721 0 0 1-4.246.997Z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-regular text-white" style={{ opacity: 0.8 }}>
                        {post.commentCount || 0}
                      </span>
                    </div>
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
      <div className="mt-2">
        <button
          onClick={() => {
            const url = `/board/write?eventId=${displayPosts[0]?.eventId || 'default-event'}`;
            console.log('🔗 소식 올리기 클릭:', url);
            router.push(url);
          }}
          className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-md"
        >
          <span>소식 올리기</span>
        </button>
      </div>

      {/* 이미지 갤러리 */}
      <ImageGallery
        images={images}
        initialIndex={initialIndex}
        isOpen={isOpen}
        onClose={closeGallery}
      />
    </EventSection>
  );
} 