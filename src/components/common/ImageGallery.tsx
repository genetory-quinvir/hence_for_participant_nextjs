"use client";

import { useState, useEffect, useRef } from 'react';
import CommonNavigationBar from '@/components/CommonNavigationBar';

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageGallery({ images, initialIndex = 0, isOpen, onClose }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialScale, setInitialScale] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // 이미지 변경 시 초기화
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  // 두 터치 포인트 간의 거리 계산
  const getDistance = (touches: any) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 핀치 줌 처리
  const handlePinchZoom = (touches: any) => {
    if (touches.length !== 2) return;
    
    const distance = getDistance(touches);
    if (initialDistance === 0) {
      setInitialDistance(distance);
      setInitialScale(scale);
      return;
    }
    
    const scaleFactor = distance / initialDistance;
    const newScale = Math.max(0.5, Math.min(3, initialScale * scaleFactor));
    setScale(newScale);
    
    // 줌 아웃 시 위치 초기화
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // 터치 이벤트 정리
  const resetTouchState = () => {
    setInitialDistance(0);
    setInitialScale(1);
  };

  // 터치 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 핀치 줌 시작
      handlePinchZoom(e.touches);
    } else if (e.touches.length === 1 && scale > 1) {
      // 드래그 시작 (확대된 상태에서만)
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 핀치 줌 처리
      handlePinchZoom(e.touches);
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // 드래그 처리
      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;
      
      // 이미지와 컨테이너 크기 계산
      const containerRect = containerRef.current?.getBoundingClientRect();
      const imageRect = imageRef.current?.getBoundingClientRect();
      
      if (containerRect && imageRect) {
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // 원본 이미지 크기 (스케일 적용 전)
        const originalImageWidth = imageRect.width / scale;
        const originalImageHeight = imageRect.height / scale;
        
        // 스케일 적용된 이미지 크기
        const scaledImageWidth = originalImageWidth * scale;
        const scaledImageHeight = originalImageHeight * scale;
        
        // 경계 제한 계산 - 이미지가 화면을 벗어나지 않도록
        const maxX = Math.max(0, (scaledImageWidth - containerWidth) / 2);
        const maxY = Math.max(0, (scaledImageHeight - containerHeight) / 2);
        const minX = -maxX;
        const minY = -maxY;
        
        // 위치를 경계 내로 제한
        const limitedX = Math.max(minX, Math.min(maxX, newX));
        const limitedY = Math.max(minY, Math.min(maxY, newY));
        
        setPosition({
          x: limitedX,
          y: limitedY
        });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // 모든 터치가 끝났을 때
      setIsDragging(false);
      resetTouchState();
    } else if (e.touches.length === 1) {
      // 한 손가락만 남았을 때
      resetTouchState();
    }
  };

  // 이미지 변경
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // 스와이프 제스처
  const [swipeStart, setSwipeStart] = useState(0);
  const [swipeEnd, setSwipeEnd] = useState(0);

  const handleSwipeStart = (e: React.TouchEvent) => {
    setSwipeStart(e.touches[0].clientX);
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    setSwipeEnd(e.touches[0].clientX);
  };

  const handleSwipeEnd = () => {
    if (!swipeStart || !swipeEnd) return;
    
    const distance = swipeStart - swipeEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    setSwipeStart(0);
    setSwipeEnd(0);
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* 터치 동작 제어 */
        .image-gallery-container {
          touch-action: none;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        .image-gallery-container img {
          touch-action: none;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
      {/* 네비게이션바 */}
      <div className="absolute top-0 left-0 right-0 z-[10000]">
        <CommonNavigationBar
          height="44px"
          rightButton={
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          }
          backgroundColor="transparent"
          backgroundOpacity={0}
          textColor="text-white"
          sticky={false}
          fixedHeight={true}
        />
      </div>

      {/* 이미지 카운터 */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-[10000] bg-black bg-opacity-50 rounded-full px-4 py-2 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* 이전/다음 버튼 */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-[10000] w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-[10000] w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* 이미지 컨테이너 */}
      <div 
        ref={containerRef}
        className="image-gallery-container"
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={images[currentIndex]}
          alt={`이미지 ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default',
            transition: isDragging ? 'none' : 'transform 0.2s ease-in-out'
          }}
          draggable={false}
        />
      </div>

      {/* 썸네일 미리보기 (여러 이미지가 있을 때) */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2 max-w-full overflow-x-auto px-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-white' 
                  : 'border-transparent hover:border-white hover:border-opacity-50'
              }`}
            >
              <img
                src={image}
                alt={`썸네일 ${index + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 