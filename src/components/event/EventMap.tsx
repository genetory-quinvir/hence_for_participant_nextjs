'use client';

import { useState } from 'react';
import { useImageGallery } from '@/hooks/useImageGallery';
import ImageGallery from '@/components/common/ImageGallery';

interface EventMapProps {
  eventId: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export default function EventMap({ eventId, location }: EventMapProps) {
  const [mapType, setMapType] = useState<'regular' | 'satellite'>('regular');
  const { openGallery, isOpen, images, initialIndex, closeGallery } = useImageGallery();

  // 기본 위치 (서울과학기술대학교)
  const defaultLocation = {
    latitude: 37.6296,
    longitude: 127.0771,
    address: '서울특별시 노원구 공릉동 232'
  };

  const currentLocation = location || defaultLocation;

  const getMapImage = (type: 'regular' | 'satellite') => {
    if (type === 'satellite') {
      return '/images/img_map_0.webp';
    } else {
      return '/images/img_map_1.webp';
    }
  };

  return (
    <div className="w-full mb-12">
      {/* 지도 컨테이너 */}
      <div className="px-4">
        <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
          {/* 지도 타입 버튼 - 상단 우측 */}
          <div className="absolute top-3 right-3 z-10 flex flex-col space-y-2">
            <button
              onClick={() => setMapType('regular')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all shadow-lg ${
                mapType === 'regular'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              일반
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all shadow-lg ${
                mapType === 'satellite'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              위성
            </button>
          </div>
          <img
            src={getMapImage(mapType)}
            alt={`이벤트 위치 ${mapType === 'satellite' ? '위성' : '일반'} 지도`}
            className="w-full h-auto object-contain cursor-pointer"
            style={{ aspectRatio: '4106/2710' }}
            onClick={() => {
              openGallery([getMapImage(mapType)], 0);
            }}
            onLoad={(e) => {
              // 이미지가 로드되면 로딩 오버레이 숨기기
              const target = e.target as HTMLImageElement;
              const overlay = target.parentElement?.querySelector('.map-loading-overlay');
              if (overlay) {
                overlay.classList.add('opacity-0');
                setTimeout(() => {
                  overlay.classList.add('hidden');
                }, 300);
              }
            }}
            onError={(e) => {
              // 이미지 로드 실패 시 기본 배경색 표시
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const overlay = target.parentElement?.querySelector('.map-loading-overlay');
              if (overlay) {
                overlay.classList.remove('opacity-0', 'hidden');
                overlay.innerHTML = `
                  <div class="text-center">
                    <p class="text-sm text-gray-600">지도 이미지를 불러올 수 없습니다.</p>
                  </div>
                `;
              }
            }}
          />
          
          {/* 지도 로딩 오버레이 */}
          <div className="map-loading-overlay absolute inset-0 bg-gray-100 flex items-center justify-center transition-opacity duration-300">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">지도를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 갤러리 */}
      <ImageGallery
        isOpen={isOpen}
        images={images}
        initialIndex={initialIndex}
        onClose={closeGallery}
      />
    </div>
  );
}
