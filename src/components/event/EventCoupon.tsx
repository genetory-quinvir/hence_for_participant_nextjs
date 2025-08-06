"use client";

import { useRef, useEffect, useState } from "react";
import { CouponItem } from "@/types/api";

interface EventCouponProps {
  coupons: CouponItem[];
}

export default function EventCoupon({ coupons }: EventCouponProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 총 페이지 수 계산
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 280; // 카드 너비 + 마진
      const containerWidth = container.clientWidth;
      const visibleCards = Math.floor(containerWidth / cardWidth);
      const pages = Math.ceil(coupons.length / visibleCards);
      setTotalPages(pages);
    }
  }, [coupons.length]);

  // 스크롤 위치에 따른 현재 페이지 업데이트
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollLeft = container.scrollLeft;
        const cardWidth = 280; // 카드 너비 + 마진
        const currentPageIndex = Math.round(scrollLeft / cardWidth);
        setCurrentPage(currentPageIndex);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // 특정 페이지로 스크롤
  const scrollToPage = (pageIndex: number) => {
    if (scrollContainerRef.current) {
      const cardWidth = 280; // 카드 너비 + 마진
      const scrollLeft = pageIndex * cardWidth;
      scrollContainerRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  };

  if (!coupons || coupons.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-6">
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">이벤트 쿠폰</h2>
        <p className="text-sm text-white" style={{ opacity: 0.7 }}>
          이벤트에서 제공하는 다양한 쿠폰을 확인해보세요
        </p>
      </div>

      {/* 쿠폰 캐로셀 */}
      <div className="relative">
        {/* 스크롤 컨테이너 */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {coupons.map((coupon, index) => (
            <div
              key={coupon.id}
              className="flex-shrink-0 w-64 rounded-xl p-4 transition-all duration-300"
              style={{ 
                scrollSnapAlign: 'start',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }}
            >
                             {/* 쿠폰 정보 */}
               <div className="space-y-2">
                 <h3 className="text-white font-semibold text-xl line-clamp-2">
                   {coupon.title}
                   {coupon.discountType === 'PERCENTAGE' && ' 할인권'}
                   {coupon.discountType === 'FIXED_AMOUNT' && ' 쿠폰'}
                   {coupon.discountType === 'EXCHANGE' && ' 교환권'}
                 </h3>
                 
                 {coupon.description && (
                   <p className="text-sm text-white font-regular" style={{ opacity: 0.7 }}>
                     {coupon.description}
                   </p>
                 )}

                 {/* 쿠폰 사용 버튼 */}
                 <button
                   className={`w-full py-2 mt-4 px-4 rounded-lg text-sm font-medium transition-colors ${
                     coupon.status === 'active'
                       ? 'bg-purple-600 text-white hover:bg-purple-700'
                       : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                   }`}
                   disabled={coupon.status !== 'active'}
                 >
                   {coupon.status === 'active' ? '쿠폰 사용하기' : '사용 불가'}
                 </button>
               </div>
            </div>
          ))}
        </div>

        {/* 페이지 컨트롤 도트 */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => scrollToPage(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentPage
                    ? 'bg-purple-500 scale-125'
                    : 'bg-white'
                }`}
                style={{ 
                  opacity: index === currentPage ? 1 : 0.3 
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
} 