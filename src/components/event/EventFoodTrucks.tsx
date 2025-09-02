"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { VendorItem, CouponItem } from "@/types/api";

interface EventFoodTrucksProps {
  vendors: VendorItem[];
  eventId?: string;
  coupons?: CouponItem[];
}

export default function EventFoodTrucks({ 
  vendors, 
  eventId = 'default-event',
  coupons = []
}: EventFoodTrucksProps) {
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const displayVendors = vendors.filter(vendor => vendor.id);

  // 벤더별 쿠폰 사용 여부 확인
  const getVendorCouponStatus = (vendorId: string) => {
    const vendorCoupons = coupons.filter(coupon => 
      coupon.category === vendorId || coupon.id === vendorId
    );
    
    if (vendorCoupons.length === 0) {
      return { hasCoupon: false, isUsed: false };
    }
    
    const usedCoupons = vendorCoupons.filter(coupon => coupon.isUsed);
    const availableCoupons = vendorCoupons.filter(coupon => !coupon.isUsed);
    
    return {
      hasCoupon: true,
      isUsed: usedCoupons.length > 0,
      availableCount: availableCoupons.length,
      usedCount: usedCoupons.length
    };
  };

  // 모바일 체크
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 스크롤 가능 여부 체크
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      return () => container.removeEventListener('scroll', checkScrollPosition);
    }
  }, [displayVendors]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (!displayVendors || displayVendors.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 relative">
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto mb-12 scrollbar-hide px-4"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {/* 왼쪽 스크롤 화살표 - 모바일이 아닌 경우에만 표시 */}
        {!isMobile && canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-purple-100 rounded-full shadow-lg flex items-center justify-center hover:bg-purple-200 transition-all"
          >
            <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* 오른쪽 스크롤 화살표 - 모바일이 아닌 경우에만 표시 */}
        {!isMobile && canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-purple-100 rounded-full shadow-lg flex items-center justify-center hover:bg-purple-200 transition-all"
          >
            <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        {displayVendors.map((vendor) => {
          const couponStatus = getVendorCouponStatus(vendor.id || '');
          
          return (
            <div
              key={vendor.id}
              className="flex-shrink-0 w-80 rounded-xl overflow-hidden cursor-pointer flex flex-col relative"
              style={{ 
                scrollSnapAlign: 'start',
                backgroundColor: 'white',
              }}
              onClick={() => {
                const url = `/foodtrucks/${vendor.id}?eventId=${eventId}`;
                router.push(url);
              }}
            >
            {/* 쿠폰 상태 배지 */}
            {couponStatus.hasCoupon && (
              <div className="absolute top-3 right-3 z-10">
                {couponStatus.isUsed ? (
                  <div className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                    사용완료
                  </div>
                ) : (
                  <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    쿠폰 {couponStatus.availableCount}개
                  </div>
                )}
              </div>
            )}
            
            <div className="w-full aspect-[5/3] overflow-hidden relative p-3">
              {vendor.thumbImageUrl ? (
                <img 
                  src={vendor.thumbImageUrl} 
                  alt={vendor.name || '푸드트럭 이미지'} 
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
            </div>
            
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
                    <svg className={`w-4 h-4 dark:text-white mr-2`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm text-black">
                      {vendor.location}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-start mt-1">
                <svg className="w-4 h-4 text-gray-800 dark:text-white mr-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z" clipRule="evenodd"/>
                </svg>
                  <span className="text-sm text-black">
                    {vendor.operationTime || '10:00-18:00'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
} 