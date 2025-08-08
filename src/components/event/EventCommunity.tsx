"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { BoardItem } from "@/types/api";
import EventSection from "./EventSection";
import PostHeader from "@/components/common/PostHeader";

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // id가 있는 것만 필터링하고 최대 5개까지만 표시
  const displayPosts = freeBoard
    .filter(post => post.id)
    .slice(0, 5);

  if (!displayPosts || displayPosts.length === 0) {
    return null;
  }

  // 캐러셀 스크롤 핸들러
  const handleScroll = () => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const scrollLeft = container.scrollLeft;
      const cardWidth = 320; // 카드 너비 + 간격
      const slideIndex = Math.round(scrollLeft / cardWidth);
      setCurrentSlide(Math.max(0, Math.min(slideIndex, displayPosts.length - 1)));
    }
  };

  // 특정 슬라이드로 이동
  const goToSlide = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = 320; // 카드 너비 + 간격
      carouselRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
    }
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
          ref={carouselRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
          onScroll={handleScroll}
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
                  createdAt={post.createdAt}
                  className="mb-4"
                  showMoreButton={true}
                  onMoreClick={() => {

                  }}
                />
                
                {/* 게시글 내용과 이미지 */}
                <div className="flex-1 flex space-x-3">
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
        
        {/* 캐러셀 인디케이터 */}
        {displayPosts.length > 1 && (
          <div className="flex justify-center space-x-2 mt-4">
            {displayPosts.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide
                    ? 'bg-purple-600'
                    : 'bg-white bg-opacity-30'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 더 많은 게시글이 있는 경우 표시 */}
      {freeBoard.length > 5 && (
        <div className="mt-6 pt-4 border-t border-white border-opacity-10 text-center">
          <p className="text-xs text-white" style={{ opacity: 0.6 }}>
            외 {freeBoard.length - 5}개의 게시글이 더 있습니다
          </p>
        </div>
      )}
    </EventSection>
  );
} 