"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VendorItem } from "@/types/api";
import { getFeaturedEvent } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useSimpleNavigation } from "@/utils/navigation";

function FoodTrucksContent() {
  const { navigate, goBack } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventId = searchParams.get('eventId') || 'default-event';

  // 푸드트럭 리스트 페이지 진입 시 히스토리에 추가
  useEffect(() => {
    // 브라우저 히스토리만 사용하므로 별도 관리 불필요
  }, [eventId]);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getFeaturedEvent(eventId);
        if (result.success && result.featured && result.featured.vendors) {
          setVendors(result.featured.vendors);
        } else {
          setVendors([]);
        }
      } catch (err) {
        console.error("푸드트럭 로드 오류:", err);
        setError("푸드트럭을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [eventId]);

  const handleBackClick = () => {
    goBack();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title="푸드트럭"
          leftButton={
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
          backgroundColor="black"
          backgroundOpacity={1}
          textColor="text-white"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title="푸드트럭"
          leftButton={
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
          backgroundColor="black"
          backgroundOpacity={1}
          textColor="text-white"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <CommonNavigationBar 
        title="푸드트럭"
        leftButton={
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        onLeftClick={handleBackClick}
        backgroundColor="black"
        backgroundOpacity={1}
        textColor="text-white"
      />
      
      <div className="px-4 py-2">
        {/* 그리드 레이아웃 */}
        <div className="grid grid-cols-2 gap-4">
          {vendors.length > 0 ? (
            vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="rounded-xl overflow-hidden transition-all duration-300 cursor-pointer hover:bg-white hover:bg-opacity-10"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                onClick={() => {
                  const url = `/foodtrucks/${vendor.id}?eventId=${eventId}`;
                  console.log('🔗 푸드트럭 클릭:', url);
                  navigate(url);
                }}
              >
                {/* 썸네일 이미지 */}
                <div className="w-full aspect-[4/3] overflow-hidden relative" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                  {vendor.thumbImageUrl ? (
                    <img 
                      src={vendor.thumbImageUrl} 
                      alt={vendor.name || '푸드트럭 이미지'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : vendor.imageUrl ? (
                    <img 
                      src={vendor.imageUrl} 
                      alt={vendor.name || '푸드트럭 이미지'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center hidden">
                    <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {/* 영업중 배지 */}
                  <div className="absolute top-3 right-3">
                    <span className="px-4 py-2 rounded-full text-xs font-medium bg-purple-600 text-white">
                      {vendor.isActive ? '영업중' : '영업종료'}
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
                      {vendor.operationTime || '10:00-18:00'}
                    </span>
                  </div>

                  {/* 가격 및 평점 */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-white font-bold text-l">
                      {vendor.priceAverage || '8,000원대'}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span className="text-l text-white" style={{ opacity: 0.7 }}>
                        {vendor.rating ? `${vendor.rating} (${vendor.reviewCount || 0}개)` : '4.5 (12개)'}
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
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-white text-lg mb-2">아직 푸드트럭이 없습니다</p>
              <p className="text-white text-sm" style={{ opacity: 0.6 }}>새로운 푸드트럭을 기다려주세요!</p>
            </div>
          )}
        </div>

        {/* 모든 푸드트럭을 불러왔습니다 메시지 */}
        {vendors.length > 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-white" style={{ opacity: 0.6 }}>
              모든 푸드트럭을 불러왔습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function FoodTrucksLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>푸드트럭 목록을 불러오는 중...</p>
      </div>
    </div>
  );
}

export default function FoodTrucksPage() {
  return (
    <Suspense fallback={<FoodTrucksLoading />}>
      <FoodTrucksContent />
    </Suspense>
  );
} 