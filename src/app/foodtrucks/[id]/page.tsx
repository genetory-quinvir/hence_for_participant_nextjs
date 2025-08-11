"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { VendorItem } from "@/types/api";
import { getFeaturedEvent } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";

function FoodTruckDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vendor, setVendor] = useState<VendorItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventId = searchParams.get('eventId') || 'default-event';

  useEffect(() => {
    const fetchVendorDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getFeaturedEvent(eventId);
        
        if (result.success && result.featured && result.featured.vendors) {
          const foundVendor = result.featured.vendors.find(v => v.id === params.id);
          if (foundVendor) {
            setVendor(foundVendor);
          } else {
            setError("푸드트럭을 찾을 수 없습니다.");
          }
        } else {
          setError("푸드트럭 정보를 불러오는데 실패했습니다.");
        }
      } catch (err) {
        console.error("푸드트럭 로드 오류:", err);
        setError("푸드트럭을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchVendorDetail();
    }
  }, [params.id, eventId]);

  const handleBackClick = () => {
    router.back();
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
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
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
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-400">{error || "푸드트럭을 찾을 수 없습니다."}</div>
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
      />
      
      <div className="px-4 py-6">
        {/* 배송 아이콘 */}
        <div className="flex justify-center mb-6">
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>

        {/* 푸드트럭 기본 정보 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {vendor.name || '푸드트럭'}
          </h1>
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-lg" style={{ opacity: 0.8 }}>
              멕시칸
            </span>
            <div className="flex items-center bg-white bg-opacity-10 px-3 py-1 rounded-lg">
              <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span className="text-white font-bold">4.5</span>
              <span className="text-white text-sm ml-1" style={{ opacity: 0.7 }}>(12개)</span>
            </div>
          </div>
          {vendor.description && (
            <p className="text-white text-lg mb-4" style={{ opacity: 0.8 }}>
              {vendor.description}
            </p>
          )}
          
          {/* 위치 */}
          {vendor.location && (
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white text-lg" style={{ opacity: 0.9 }}>
                {vendor.location}
              </span>
            </div>
          )}

          {/* 운영시간 */}
          <div className="flex items-center">
            <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white text-lg" style={{ opacity: 0.9 }}>
              10:00-18:00
            </span>
          </div>
        </div>

        {/* 메뉴 섹션 */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">메뉴</h2>
          <div className="space-y-3">
            {/* 메뉴 아이템 1 */}
            <div className="bg-white bg-opacity-5 rounded-xl p-4 flex items-center">
              <div className="w-16 h-16 bg-purple-900 rounded-lg mr-4 flex-shrink-0"></div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">치킨 타코</h3>
                <p className="text-white text-sm" style={{ opacity: 0.7 }}>
                  매콤달콤한 치킨과 신선한 야채
                </p>
              </div>
              <div className="text-white font-bold text-lg">
                ₩8,000
              </div>
            </div>

            {/* 메뉴 아이템 2 */}
            <div className="bg-white bg-opacity-5 rounded-xl p-4 flex items-center">
              <div className="w-16 h-16 bg-purple-900 rounded-lg mr-4 flex-shrink-0"></div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">소고기 타코</h3>
                <p className="text-white text-sm" style={{ opacity: 0.7 }}>
                  부드러운 소고기와 양파
                </p>
              </div>
              <div className="text-white font-bold text-lg">
                ₩9,000
              </div>
            </div>

            {/* 메뉴 아이템 3 */}
            <div className="bg-white bg-opacity-5 rounded-xl p-4 flex items-center">
              <div className="w-16 h-16 bg-purple-900 rounded-lg mr-4 flex-shrink-0"></div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">새우 타코</h3>
                <p className="text-white text-sm" style={{ opacity: 0.7 }}>
                  신선한 새우와 아보카도
                </p>
              </div>
              <div className="text-white font-bold text-lg">
                ₩10,000
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function FoodTruckDetailLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>푸드트럭 정보를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function FoodTruckDetailPage() {
  return (
    <Suspense fallback={<FoodTruckDetailLoading />}>
      <FoodTruckDetailContent />
    </Suspense>
  );
} 