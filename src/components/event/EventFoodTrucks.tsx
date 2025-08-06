"use client";

import { useRef } from "react";
import { VendorItem } from "@/types/api";

interface EventFoodTrucksProps {
  vendors: VendorItem[];
}

export default function EventFoodTrucks({ vendors }: EventFoodTrucksProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // id가 있는 것만 필터링
  const displayVendors = vendors.filter(vendor => vendor.id);

  if (!displayVendors || displayVendors.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-5">
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">푸드트럭</h2>
        <p className="text-sm text-white" style={{ opacity: 0.7 }}>
          이벤트에서 즐길 수 있는 다양한 푸드트럭을 확인해보세요
        </p>
      </div>

      {/* 푸드트럭 캐로셀 */}
      <div className="relative">
        {/* 스크롤 컨테이너 */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {displayVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="flex-shrink-0 w-72 rounded-xl overflow-hidden transition-all duration-300"
              style={{ 
                scrollSnapAlign: 'start',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* 썸네일 이미지 */}
              <div className="w-full aspect-[4/3] overflow-hidden relative bg-black">
                {vendor.imageUrl ? (
                  <img 
                    src={vendor.imageUrl} 
                    alt={vendor.name || '푸드트럭 이미지'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {/* 영업중 배지 */}
                <div className="absolute top-3 right-3">
                  <span className="px-4 py-2 rounded-full text-xs font-medium bg-purple-600 text-white">
                    영업중
                  </span>
                </div>
              </div>
              
              {/* 푸드트럭 정보 */}
              <div className="p-4">
                {/* 푸드트럭 이름 */}
                <h3 className="text-white font-bold text-lg text-left mb-1">
                  {vendor.name || '푸드트럭'}
                </h3>
                
                {/* 설명 */}
                {vendor.description && (
                  <p className="text-sm text-white text-left mb-3" style={{ opacity: 0.8 }}>
                    {vendor.description}
                  </p>
                )}
                
                {/* 위치 */}
                {vendor.location && (
                  <div className="flex items-center justify-start mb-1">
                    <span className="text-sm text-white" style={{ opacity: 0.7 }}>
                      {vendor.location}
                    </span>
                  </div>
                )}

                {/* 운영시간 */}
                <div className="flex items-center justify-start mb-2">
                  <span className="text-sm text-white" style={{ opacity: 0.7 }}>
                    10:00-18:00
                  </span>
                </div>

                {/* 가격 및 평점 */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-white font-bold text-l">
                    8,000원대
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="text-l text-white" style={{ opacity: 0.7 }}>
                      4.5 (12개)
                    </span>
                  </div>
                </div>

                {/* 웹사이트 링크 */}
                {vendor.website && (
                  <div className="pt-2">
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors bg-purple-600 text-white hover:bg-purple-700 text-center"
                    >
                      웹사이트 방문
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 