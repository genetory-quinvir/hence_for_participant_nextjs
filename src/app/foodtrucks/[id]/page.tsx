"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { VendorItem } from "@/types/api";
import { getVendorDetail } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useSimpleNavigation } from "@/utils/navigation";
import { useImageGallery } from "@/hooks/useImageGallery";
import ImageGallery from "@/components/common/ImageGallery";

function FoodTruckDetailContent() {
  const params = useParams();
  const { navigate, goBack } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const [vendor, setVendor] = useState<VendorItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const eventId = searchParams.get('eventId') || 'default-event';
  const vendorId = params.id as string;
  const hasCalledApi = useRef(false);

  // 이미지 갤러리 훅
  const { isOpen, images, initialIndex, openGallery, closeGallery } = useImageGallery();

  // 푸드트럭 상세 페이지 진입 시 히스토리에 추가
  useEffect(() => {
    // 브라우저 히스토리만 사용하므로 별도 관리 불필요
  }, [params.id]);

  // 벤더 상세 정보 가져오기 (단순화)
  useEffect(() => {
    console.log('🔄 통합 useEffect 실행:', { 
      vendorId, 
      eventId, 
      hasCalledApi: hasCalledApi.current 
    });
    
    // 이미 API를 호출했다면 중복 호출 방지
    if (hasCalledApi.current) {
      console.log('⏭️ 이미 API 호출됨, 중복 호출 방지');
      return;
    }
    
    // vendorId와 eventId가 있으면 API 호출 (인증은 apiRequest에서 처리)
    if (vendorId && eventId) {
      hasCalledApi.current = true;
      
      const fetchVendorDetail = async () => {
        try {
          setLoading(true);
          setError(null);
          
          console.log('🔄 벤더 상세 정보 요청:', { eventId, vendorId });
          const result = await getVendorDetail(eventId, vendorId);
          
          if (result.success && result.data) {
            setVendor(result.data);
            console.log('✅ 벤더 상세 정보 로드 완료:', result.data);
          } else {
            setError(result.error || "푸드트럭을 불러오는데 실패했습니다.");
            console.error('❌ 벤더 상세 정보 로드 실패:', result.error);
          }
        } catch (err) {
          console.error("푸드트럭 로드 오류:", err);
          setError("푸드트럭을 불러오는데 실패했습니다.");
        } finally {
          setLoading(false);
        }
      };
      
      fetchVendorDetail();
    }
  }, [vendorId, eventId]); // 단순한 의존성 배열

  const handleBackClick = () => {
    goBack();
  };

  // 푸드트럭 이미지 클릭 핸들러
  const handleVendorImageClick = () => {
    const vendorImages: string[] = [];
    
    if (vendor?.imageUrl) vendorImages.push(vendor.imageUrl);
    if (vendor?.thumbImageUrl && !vendorImages.includes(vendor.thumbImageUrl)) {
      vendorImages.push(vendor.thumbImageUrl);
    }
    if (vendor?.logoUrl && !vendorImages.includes(vendor.logoUrl)) {
      vendorImages.push(vendor.logoUrl);
    }
    
    if (vendorImages.length > 0) {
      openGallery(vendorImages, 0);
    }
  };

  // 메뉴 이미지 클릭 핸들러
  const handleMenuImageClick = (menuIndex: number) => {
    if (!vendor?.menus) return;
    
    const menu = vendor.menus[menuIndex];
    if (menu.thumbImageUrl) {
      openGallery([menu.thumbImageUrl], 0);
    }
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title='푸드트럭'
          backgroundColor="transparent"
          backgroundOpacity={0}
          textColor="text-white"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm" style={{ opacity: 0.7 }}>푸드트럭 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title='푸드트럭'
          backgroundColor="transparent"
          backgroundOpacity={0}
          textColor="text-white"
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
        title='푸드트럭'
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
      
      <div className="px-4 py-0">
        {/* 썸네일 이미지 - 상단 정방형 */}
        <div className="mb-6">
          <div className="w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center cursor-pointer" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
            {vendor.imageUrl ? (
              <img 
                src={vendor.imageUrl} 
                alt={vendor.name || '푸드트럭 이미지'}
                className="w-full h-full object-cover"
                onClick={handleVendorImageClick}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : vendor.thumbImageUrl ? (
              <img 
                src={vendor.thumbImageUrl} 
                alt={vendor.name || '푸드트럭 썸네일'}
                className="w-full h-full object-cover"
                onClick={handleVendorImageClick}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : vendor.logoUrl ? (
              <img 
                src={vendor.logoUrl} 
                alt={vendor.name || '푸드트럭 로고'}
                className="w-full h-full object-cover"
                onClick={handleVendorImageClick}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <svg className="w-24 h-24 text-white opacity-50 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        </div>

        {/* 푸드트럭 기본 정보 */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white mb-2">
            {vendor.name || '푸드트럭'}
          </h1>
          <div className="flex items-center justify-between mb-3">
            <span className="text-white text-md" style={{ opacity: 0.8 }}>
              {vendor.category || vendor.type || '푸드트럭'}
            </span>
            {/* {vendor.rating && (
              <div className="flex items-center bg-black bg-opacity-10 px-3 py-1 rounded-lg">
                <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-white font-bold">{vendor.rating.toFixed(1)}</span>
                {vendor.reviewCount && (
                  <span className="text-white text-lg ml-1" style={{ opacity: 0.7 }}>({vendor.reviewCount}개)</span>
                )}
              </div>
            )} */}
          </div>
          {vendor.description && (
            <p className="text-white text-md mb-4" style={{ opacity: 0.8 }}>
              {vendor.description}
            </p>
          )}
          
          {/* 위치 */}
          {vendor.location && (
            <div className="flex items-center mb-2">
              <span className="text-white text-md mr-3" style={{ opacity: 0.6 }}>
                장소
              </span>
              <span className="text-white text-md" style={{ opacity: 0.9 }}>
                {vendor.location}
              </span>
            </div>
          )}

          {/* 운영시간 */}
          {vendor.operationTime && (
            <div className="flex items-center mb-2">
              <span className="text-white text-md mr-3" style={{ opacity: 0.6 }}>
                운영시간
              </span>
              <span className="text-white text-md" style={{ opacity: 0.9 }}>
                {vendor.operationTime}
              </span>
            </div>
          )}

          {/* 평균 가격 */}
          {vendor.priceAverage && (
            <div className="flex items-center mb-2">
              <span className="text-white text-md mr-3" style={{ opacity: 0.6 }}>
                가격대
              </span>
              <span className="text-white text-md" style={{ opacity: 0.9 }}>
                평균 {vendor.priceAverage}
              </span>
            </div>
          )}

          {/* 연락처 */}
          {vendor.contactInfo && (
            <div className="flex items-center">
              <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-white text-md" style={{ opacity: 0.9 }}>
                {vendor.contactInfo}
              </span>
            </div>
          )}
        </div>

        {/* 메뉴 섹션 - 실제 메뉴 데이터가 있을 때만 표시 */}
        {vendor.menus && vendor.menus.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-4">메뉴</h2>
            <div className="space-y-3">
              {vendor.menus.map((menu, index) => (
                <div key={menu.id} className="rounded-xl p-4 flex items-center" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
                  <div className="w-16 h-16 rounded-lg mr-4 flex-shrink-0 overflow-hidden cursor-pointer">
                    {menu.thumbImageUrl ? (
                      <img 
                        src={menu.thumbImageUrl} 
                        alt={menu.name || '메뉴 이미지'}
                        className="w-full h-full object-cover"
                        onClick={() => handleMenuImageClick(index)}
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-900 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-md mb-1">{menu.name || '메뉴명'}</h3>
                    {menu.description && (
                      <p className="text-white text-md" style={{ opacity: 0.7 }}>
                        {menu.description}
                      </p>
                    )}
                  </div>
                  <div className="text-white font-bold text-md">
                    ₩{menu.price?.toLocaleString() || '0'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 이미지 갤러리 */}
      <ImageGallery
        images={images}
        initialIndex={initialIndex}
        isOpen={isOpen}
        onClose={closeGallery}
      />
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