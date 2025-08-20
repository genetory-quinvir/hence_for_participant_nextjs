"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CouponItem, VendorItem } from "@/types/api";
import { getVendorsSimple, useCoupon, getAccessToken } from "@/lib/api";
import CouponActionSheet from "@/components/CouponActionSheet";
import CommonAlert from "@/components/CommonAlert";
import { useToast } from "@/components/common/Toast";

interface EventCouponProps {
  coupons: CouponItem[];
  eventId: string;
}

export default function EventCoupon({ coupons, eventId }: EventCouponProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const [showVendorSheet, setShowVendorSheet] = useState(false);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [usedCoupons, setUsedCoupons] = useState<Set<string>>(new Set());

  const handleCouponUse = async (coupon: CouponItem) => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
      router.push('/sign');
      return;
    }

    if (coupon.discountType === 'EXCHANGE') {
      setSelectedCoupon(coupon);
      setShowVendorSheet(true);
      return;
    }

    if (coupon.discountType === 'FIXED_AMOUNT' || coupon.discountType === 'PERCENTAGE') {
      setSelectedCoupon(coupon);
      setLoading(true);
      
      try {
        const result = await getVendorsSimple(eventId, "FOOD_TRUCK");
        
        if (result.success && result.data) {
          const vendorArray = Array.isArray(result.data) ? result.data : [];
          setVendors(vendorArray);
          setShowVendorSheet(true);
        } else if (result.error === 'AUTH_REQUIRED') {
          showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
          router.push('/sign');
        } else {
          showToast(result.error || '사용 가능한 벤더를 불러오는데 실패했습니다.', 'error');
        }
      } catch (error) {
        showToast('사용 가능한 벤더를 불러오는데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVendorSelect = (vendor: VendorItem) => {
    setSelectedVendor(vendor);
  };

  const markCouponAsUsed = (couponId: string) => {
    setUsedCoupons(prev => new Set(prev).add(couponId));
  };



  const handleUseSelectedVendor = async () => {
    if (!selectedCoupon) return;
    
    setShowVendorSheet(false);
    setLoading(true);
    
    try {
      const result = await useCoupon(eventId, selectedCoupon.id!, selectedVendor?.id);
      if (result.success) {
        showToast(selectedCoupon.discountType === 'EXCHANGE' ? '교환권이 사용되었습니다!' : '쿠폰이 사용되었습니다!', 'success');
        markCouponAsUsed(selectedCoupon.id!);
      } else if (result.error === 'AUTH_REQUIRED') {
        showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
        router.push('/sign');
      } else {
        showToast(result.error || (selectedCoupon.discountType === 'EXCHANGE' ? '교환권 사용에 실패했습니다.' : '쿠폰 사용에 실패했습니다.'), 'error');
      }
    } catch (error) {
      showToast(selectedCoupon.discountType === 'EXCHANGE' ? '교환권 사용 중 오류가 발생했습니다.' : '쿠폰 사용 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
      setSelectedCoupon(null);
      setSelectedVendor(null);
    }
  };

  if (!coupons || coupons.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide"
          style={{ 
            paddingLeft: '16px',
            paddingRight: '16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex-shrink-0 w-80 rounded-xl p-5 transition-all duration-300 relative overflow-hidden"
              style={{ 
                scrollSnapAlign: 'start',
                background: coupon.discountType === 'PERCENTAGE' 
                  ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' :
                  coupon.discountType === 'FIXED_AMOUNT' 
                  ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)' :
                  coupon.discountType === 'EXCHANGE' 
                  ? 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)' :
                  'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
              }}
            >
              {/* 쿠폰 구멍 */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full -translate-x-3"></div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-100 rounded-full translate-x-3"></div>
              </div>
              
              {/* 배경 패턴 */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="currentColor" className="text-white"/>
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 w-24 h-24 transform -translate-x-6 translate-y-6">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="30" fill="currentColor" className="text-white"/>
                  </svg>
                </div>
              </div>
              
              {/* 카드 내용 */}
              <div className="relative z-10">
              <div className="flex space-x-3">
                <div className="w-20 h-20 bg-transparent rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {coupon.iconImageUrl ? (
                    <img 
                      src={coupon.iconImageUrl} 
                      alt="쿠폰 아이콘" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${coupon.iconImageUrl ? 'hidden' : ''}`}>
                    {coupon.discountType === 'PERCENTAGE' && (
                      <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    )}
                    {coupon.discountType === 'FIXED_AMOUNT' && (
                      <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    )}
                    {coupon.discountType === 'EXCHANGE' && (
                      <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-0">
                  <h3 className="text-white font-bold text-xl line-clamp-2 mb-1">
                    {coupon.title}
                    {coupon.discountType === 'PERCENTAGE' && ' 할인권'}
                    {coupon.discountType === 'FIXED_AMOUNT' && ' 쿠폰'}
                    {coupon.discountType === 'EXCHANGE' && ' 교환권'}
                  </h3>
                  
                  {coupon.description && (
                    <p className="text-sm text-white font-regular" style={{ opacity: 0.9 }}>
                      {coupon.description} 
                    </p>
                  )}
                </div>
              </div>

              {(() => {
                const isActive = coupon.status?.toLowerCase() === 'active';
                const isNotUsed = !coupon.isUsed && !usedCoupons.has(coupon.id!);
                const isNotLoading = !loading;
                const canUse = isActive && isNotUsed && isNotLoading;
                
                return (
                  <button
                    className={`w-full py-3 mt-4 px-4 rounded-lg text-md font-semibold transition-colors shadow-lg ${
                      canUse
                        ? coupon.discountType === 'PERCENTAGE'
                          ? 'bg-purple-600 bg-opacity-80 text-white hover:bg-opacity-90'
                          : coupon.discountType === 'FIXED_AMOUNT'
                          ? 'bg-green-700 bg-opacity-80 text-white hover:bg-opacity-90'
                          : coupon.discountType === 'EXCHANGE'
                          ? 'bg-orange-600 bg-opacity-80 text-white hover:bg-opacity-90'
                          : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 border border-white'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!canUse}
                    onClick={() => handleCouponUse(coupon)}
                  >
                    {loading ? '처리 중...' : 
                     coupon.isUsed || usedCoupons.has(coupon.id!) ? '이미 사용한 쿠폰' :
                     coupon.status?.toLowerCase() === 'active' ? '쿠폰 사용하기' : '사용 불가능한 쿠폰'}
                  </button>
                );
              })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CouponActionSheet
        isOpen={showVendorSheet}
        onClose={() => {
          setShowVendorSheet(false);
          setSelectedCoupon(null);
          setSelectedVendor(null);
        }}
        title={selectedCoupon?.discountType === 'EXCHANGE' ? '교환권 사용' : '사용할 쿠폰을 선택하세요'}
        selectedItem={selectedCoupon?.discountType === 'EXCHANGE' ? {
          label: selectedCoupon.title || '알 수 없는 교환권',
          onClick: () => {},
        } : selectedVendor ? {
          label: selectedVendor.name || '알 수 없는 벤더',
          onClick: () => {},
        } : null}
        onUseSelected={handleUseSelectedVendor}
        items={selectedCoupon?.discountType === 'EXCHANGE' ? [] : (Array.isArray(vendors) ? vendors : []).map((vendor) => {
          const item = {
            label: vendor.name || '알 수 없는 벤더',
            onClick: () => handleVendorSelect(vendor),
          };
          return item;
        })}
      />


      </section>
    );
  } 