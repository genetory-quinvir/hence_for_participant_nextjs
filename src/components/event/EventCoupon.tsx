"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CouponItem, VendorItem } from "@/types/api";
import { getCouponVendors, useCoupon, getAccessToken } from "@/lib/api";
import CommonActionSheet from "@/components/CommonActionSheet";

interface EventCouponProps {
  coupons: CouponItem[];
  eventId: string;
}

export default function EventCoupon({ coupons, eventId }: EventCouponProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [showVendorSheet, setShowVendorSheet] = useState(false);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);
  const [loading, setLoading] = useState(false);

  // 쿠폰 사용 처리
  const handleCouponUse = async (coupon: CouponItem) => {
    // 로그인 상태 확인
    const accessToken = getAccessToken();
    if (!accessToken) {
      alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      router.push('/sign');
      return;
    }

    // EXCHANGE 타입은 바로 사용
    if (coupon.discountType === 'EXCHANGE') {
      setLoading(true);
      try {
        const result = await useCoupon(eventId, coupon.id!, undefined);
        if (result.success) {
          alert('쿠폰이 사용되었습니다!');
        } else if (result.error === 'AUTH_REQUIRED') {
          alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/sign');
        } else {
          alert(result.error || '쿠폰 사용에 실패했습니다.');
        }
      } catch (error) {
        alert('쿠폰 사용에 실패했습니다.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // FIXED_AMOUNT, PERCENTAGE 타입은 벤더 선택 필요
    if (coupon.discountType === 'FIXED_AMOUNT' || coupon.discountType === 'PERCENTAGE') {
      setSelectedCoupon(coupon);
      setLoading(true);
      
      try {
        const result = await getCouponVendors(eventId, coupon.id!);
        if (result.success && result.data) {
          setVendors(result.data);
          setShowVendorSheet(true);
        } else if (result.error === 'AUTH_REQUIRED') {
          alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
          router.push('/sign');
        } else {
          alert(result.error || '사용 가능한 벤더를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        alert('사용 가능한 벤더를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  // 벤더 선택 처리
  const handleVendorSelect = async (vendor: VendorItem) => {
    if (!selectedCoupon) return;
    
    setShowVendorSheet(false);
    setLoading(true);
    
    try {
      const result = await useCoupon(eventId, selectedCoupon.id!, vendor.id);
      if (result.success) {
        alert('쿠폰이 사용되었습니다!');
      } else if (result.error === 'AUTH_REQUIRED') {
        alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        router.push('/sign');
      } else {
        alert(result.error || '쿠폰 사용에 실패했습니다.');
      }
    } catch (error) {
      alert('쿠폰 사용에 실패했습니다.');
    } finally {
      setLoading(false);
      setSelectedCoupon(null);
    }
  };

  if (!coupons || coupons.length === 0) {
    return null;
  }

  return (
    <section className="py-8 px-4">
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
                     coupon.status === 'active' && !loading
                       ? 'bg-purple-600 text-white hover:bg-purple-700'
                       : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                   }`}
                   disabled={coupon.status !== 'active' || loading}
                   onClick={() => handleCouponUse(coupon)}
                 >
                   {loading ? '처리 중...' : coupon.status === 'active' ? '쿠폰 사용하기' : '사용 불가'}
                 </button>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* 벤더 선택 액션시트 */}
      <CommonActionSheet
        isOpen={showVendorSheet}
        onClose={() => {
          setShowVendorSheet(false);
          setSelectedCoupon(null);
        }}
        title="사용할 벤더를 선택하세요"
        items={vendors.map((vendor) => ({
          label: vendor.name || '알 수 없는 벤더',
          onClick: () => handleVendorSelect(vendor),
        }))}
      />
    </section>
  );
} 