"use client";

import { AdItem } from "@/types/api";
import { useState } from "react";

interface EventAdvertisementsProps {
  advertisements: AdItem[];
}

export default function EventAdvertisements({ advertisements }: EventAdvertisementsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!advertisements || advertisements.length === 0) {
    return null;
  }

  const handleAdClick = (ad: AdItem) => {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const nextAd = () => {
    setCurrentIndex((prev) => (prev + 1) % advertisements.length);
  };

  const prevAd = () => {
    setCurrentIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  };

  const currentAd = advertisements[currentIndex];

  return (
    <section className="relative bg-black py-8">
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between mb-0">
          {/* 광고 개수 표시 */}
          {advertisements.length > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm" style={{ opacity: 0.7 }}>
                {currentIndex + 1} / {advertisements.length}
              </span>
            </div>
          )}
        </div>

        {/* 광고 카드 */}
        <div className="relative">
          <div 
            className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => handleAdClick(currentAd)}
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* 광고 이미지 - 전체 카드 크기 */}
            {currentAd.imageUrl ? (
              <div className="w-full h-64 relative">
                <img 
                  src={currentAd.imageUrl} 
                  alt={currentAd.title || '광고 이미지'}
                  className="w-full h-full object-cover"
                />
                
                {/* 광고 표시 - 우측 상단 */}
                <div className="absolute top-3 right-3">
                  <span className="text-xs text-white px-4 py-2 rounded-full" style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    opacity: 0.8 
                  }}>
                    광고
                  </span>
                </div>
                
                {/* 하단 딤뷰 오버레이 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent h-24"></div>
                
                {/* 광고 내용 - 하단 오버레이 */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {currentAd.title && (
                    <h3 className="text-lg font-bold text-white mb-0">
                      {currentAd.title}
                    </h3>
                  )}
                  
                  {/* 클릭 유도 버튼 */}
                  <div className="flex items-center space-x-2 mt-0">
                    <span className="text-yellow-400 text-sm font-medium">
                      자세히 보기
                    </span>
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              // 이미지가 없는 경우 플레이스홀더
              <div className="w-full h-64 bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-12 h-12 text-white mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-white text-sm" style={{ opacity: 0.6 }}>광고 이미지</p>
                </div>
              </div>
            )}
          </div>

          {/* 네비게이션 버튼 (광고가 2개 이상일 때만) */}
          {advertisements.length > 1 && (
            <>
              {/* 이전 버튼 */}
              <button
                onClick={prevAd}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* 다음 버튼 */}
              <button
                onClick={nextAd}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* 인디케이터 (광고가 2개 이상일 때만) */}
          {advertisements.length > 1 && (
            <div className="flex justify-center space-x-2 mt-4">
              {advertisements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'bg-yellow-400' 
                      : 'bg-white bg-opacity-30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
} 