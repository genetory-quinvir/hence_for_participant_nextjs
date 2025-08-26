"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VendorItem } from "@/types/api";
import { getVendors } from "@/lib/api";
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
        const result = await getVendors(eventId, 'FOOD_TRUCK', 20);
    
        if (result.success && result.data) {
      
          setVendors(result.data);
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
      <div className="min-h-screen bg-white text-black flex flex-col">
        <CommonNavigationBar 
          title="푸드트럭"
          leftButton={
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
          fixedHeight={true}
          sticky={true}
        />
        
        {/* 푸드트럭 2열 그리드 스켈레톤 */}
        <div className="flex-1 overflow-y-auto px-1 py-1 scrollbar-hide" style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          overflow: 'auto'
        }}>
          <div className="grid grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl overflow-hidden flex flex-col"
                style={{ backgroundColor: 'white' }}
              >
                              {/* 썸네일 이미지 스켈레톤 */}
              <div className="w-full aspect-[4/3] overflow-hidden relative p-3" style={{ backgroundColor: "white" }}>
                  <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                
                {/* 푸드트럭 정보 스켈레톤 */}
                <div className="px-4 flex-1 flex flex-col">
                  <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                  
                  <div className="mt-auto mb-4 space-y-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                      <div className="w-1/3 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white text-black">
        <CommonNavigationBar 
          title="푸드트럭"
          leftButton={
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <CommonNavigationBar 
        title="푸드트럭"
        leftButton={
          <svg
            className="w-6 h-6 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        onLeftClick={handleBackClick}
        backgroundColor="white"
        backgroundOpacity={1}
        textColor="text-black"
        fixedHeight={true}
        sticky={true}
      />
      
      {/* 푸드트럭 2열 그리드 */}
      <div className="flex-1 overflow-y-auto px-1 py-1 scrollbar-hide" style={{ 
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        overflow: 'auto'
      }}>
        <div className="grid grid-cols-2">
          {vendors.length > 0 ? (
            vendors.map((vendor) => (
              <div
                key={vendor.id}
                className="rounded-xl overflow-hidden cursor-pointer flex flex-col"
                style={{ 
                  backgroundColor: 'white',
                }}
                onClick={() => {
                  const url = `/foodtrucks/${vendor.id}?eventId=${eventId}`;
                  navigate(url);
                }}
              >
                {/* 썸네일 이미지 */}
                <div className="w-full aspect-[4/3] overflow-hidden relative p-3">
                  {vendor.thumbImageUrl ? (
                    <img 
                      src={vendor.thumbImageUrl} 
                      alt={vendor.name || '푸드트럭 이미지'} 
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                
                {/* 푸드트럭 정보 */}
                <div className="px-4 flex-1 flex flex-col">
                  <h3 className="text-black font-bold text-md text-left">
                    {vendor.name || '푸드트럭'}
                  </h3>
                  
                  {vendor.description && (
                    <p className="text-sm text-black text-left mb-4 line-clamp-2" style={{ opacity: 0.8 }}>
                      {vendor.description}
                    </p>
                  )}
                  
                  <div className="mt-auto mb-4">
                    {vendor.location && (
                      <div className="flex items-center justify-start mb-1">
                        <svg className="w-4 h-4 text-black mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-sm text-black">
                          {vendor.location}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-start mt-1">
                      <svg className="w-4 h-4 text-black mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-sm text-black">
                        {vendor.operationTime || '10:00-18:00'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-12">
              <p className="text-black text-lg mb-2">아직 푸드트럭이 없습니다</p>
              <p className="text-black text-sm" style={{ opacity: 0.6 }}>새로운 푸드트럭을 기다려주세요!</p>
            </div>
          )}
        </div>

        {/* 모든 푸드트럭을 불러왔습니다 메시지 */}
        {vendors.length > 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-black" style={{ opacity: 0.6 }}>
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
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* 네비게이션바 스켈레톤 */}
      <div className="h-16 bg-white border-b border-gray-100 flex items-center px-4">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex-1 flex justify-center">
          <div className="w-24 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="w-6 h-6"></div>
      </div>
      
      {/* 푸드트럭 2열 그리드 스켈레톤 */}
      <div className="flex-1 overflow-y-auto px-1 py-1 scrollbar-hide" style={{ 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        overflow: 'auto'
      }}>
        <div className="grid grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-xl overflow-hidden flex flex-col"
              style={{ backgroundColor: 'white' }}
            >
              {/* 썸네일 이미지 스켈레톤 */}
              <div className="w-full aspect-[4/3] overflow-hidden relative p-3" style={{ backgroundColor: "white" }}>
                <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
              
              {/* 푸드트럭 정보 스켈레톤 */}
              <div className="px-4 flex-1 flex flex-col">
                <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse mb-4"></div>
                
                <div className="mt-auto mb-4 space-y-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                    <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                    <div className="w-1/3 h-4 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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