"use client";

import { useRef } from "react";
import { CouponItem } from "@/types/api";

interface EventCouponProps {
  coupons: CouponItem[];
}

export default function EventCoupon({ coupons }: EventCouponProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!coupons || coupons.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-5">
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">이벤트 쿠폰</h2>
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
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex-shrink-0 w-64 rounded-xl p-5 transition-all duration-300"
              style={{ 
                scrollSnapAlign: 'start',
                backgroundColor: 'rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* 쿠폰 정보 */}
              <div className="space-y-0">
                <h3 className="text-white font-bold text-xl line-clamp-2 mb-1">
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
                  className={`w-full py-3 mt-4 px-4 rounded-lg text-sm font-bold transition-colors ${
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
      </div>
    </section>
  );
} 