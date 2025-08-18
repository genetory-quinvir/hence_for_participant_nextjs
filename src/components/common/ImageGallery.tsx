"use client";

import { useState, useEffect, useRef } from 'react';

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
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 이미지 변경 시 초기화
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  // 줌 기능
  const handleZoom = (delta: number) => {
    const newScale = Math.max(0.5, Math.min(3, scale + delta));
    setScale(newScale);
    
    // 줌 아웃 시 위치 초기화
    if (newScale <= 1) {
      setPosition({ x: 0, y: 0 });
    } else {
      // 줌 인 시 현재 위치가 새로운 스케일에서 유효한지 확인
      const containerRect = containerRef.current?.getBoundingClientRect();
      const imageRect = imageRef.current?.getBoundingClientRect();
      
      if (containerRect && imageRect) {
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        // 원본 이미지 크기 (스케일 적용 전)
        const originalImageWidth = imageRect.width / scale;
        const originalImageHeight = imageRect.height / scale;
        
        // 새로운 스케일 적용된 이미지 크기
        const scaledImageWidth = originalImageWidth * newScale;
        const scaledImageHeight = originalImageHeight * newScale;
        
        // 경계 제한 계산 - 이미지가 화면을 벗어나지 않도록
        const maxX = Math.max(0, (scaledImageWidth - containerWidth) / 2);
        const maxY = Math.max(0, (scaledImageHeight - containerHeight) / 2);
        const minX = -maxX;
        const minY = -maxY;
        
        // 현재 위치를 새로운 경계 내로 제한
        const limitedX = Math.max(minX, Math.min(maxX, position.x));
        const limitedY = Math.max(minY, Math.min(maxY, position.y));
        
        setPosition({
          x: limitedX,
          y: limitedY
        });
      }
    }
  };

  // 휠 이벤트로 줌
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    handleZoom(delta);
  };

  // 더블클릭/더블탭으로 줌 토글
  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  };

  // 터치/마우스 이벤트 핸들러
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (scale <= 1) return; // 확대되지 않은 상태에서는 드래그 불가
    
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // 새로운 위치 계산
    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;
    
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
    } else {
      setPosition({
        x: newX,
        y: newY
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
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
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
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
      `}</style>
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-all"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 이미지 카운터 */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black bg-opacity-50 rounded-full px-4 py-2 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      {/* 이전/다음 버튼 */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white hover:bg-opacity-70 transition-all"
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
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onTouchStart={handleSwipeStart}
        onTouchMove={handleSwipeMove}
        onTouchEnd={handleSwipeEnd}
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
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleTouchStart}
          onMouseMove={handleTouchMove}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
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