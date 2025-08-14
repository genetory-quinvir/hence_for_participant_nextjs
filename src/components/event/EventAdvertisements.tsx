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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-white">광고</h2>
          </div>
          
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
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
            onClick={() => handleAdClick(currentAd)}
            style={{
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* 광고 이미지 */}
            {currentAd.imageUrl && (
              <div className="w-full h-48 relative overflow-hidden">
                <img 
                  src={currentAd.imageUrl} 
                  alt={currentAd.title || '광고 이미지'}
                  className="w-full h-full object-cover"
                />
                {/* 이미지 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
            )}

            {/* 광고 내용 */}
            <div className="p-6">
              {currentAd.title && (
                <h3 className="text-lg font-bold text-white mb-2">
                  {currentAd.title}
                </h3>
              )}
              
              {currentAd.description && (
                <p className="text-white text-sm mb-4" style={{ opacity: 0.8 }}>
                  {currentAd.description}
                </p>
              )}

              {/* 클릭 유도 버튼 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400 text-sm font-medium">
                    자세히 보기
                  </span>
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                {/* 광고 표시 */}
                <span className="text-xs text-white px-2 py-1 rounded-full" style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  opacity: 0.7 
                }}>
                  광고
                </span>
              </div>
            </div>
          </div>

          {/* 네비게이션 버튼 (광고가 2개 이상일 때만) */}
          {advertisements.length > 1 && (
            <>
              {/* 이전 버튼 */}
              <button
                onClick={prevAd}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all"
                style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* 다음 버튼 */}
              <button
                onClick={nextAd}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center transition-all"
                style={{ border: '1px solid rgba(255, 255, 255, 0.2)' }}
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