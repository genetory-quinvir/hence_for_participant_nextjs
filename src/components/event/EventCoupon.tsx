"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CouponItem, VendorItem } from "@/types/api";
import { getVendorsSimple, useCoupon, getAccessToken } from "@/lib/api";
import CouponActionSheet from "@/components/CouponActionSheet";
import CommonAlert from "@/components/CommonAlert";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/contexts/AuthContext";

interface EventCouponProps {
  coupons: CouponItem[];
  eventId: string;
}

export default function EventCoupon({ coupons, eventId }: EventCouponProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showVendorSheet, setShowVendorSheet] = useState(false);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [showExchangeAlert, setShowExchangeAlert] = useState(false);
  const [exchangeCoupon, setExchangeCoupon] = useState<CouponItem | null>(null);
  const [usedCoupons, setUsedCoupons] = useState<Set<string>>(new Set());

  // 액션시트 디버깅
  useEffect(() => {
    if (showVendorSheet) {
      const vendorItems = (Array.isArray(vendors) ? vendors : []).map((vendor) => ({
        label: vendor.name || '알 수 없는 벤더',
        onClick: () => handleVendorSelect(vendor),
      }));
    }
  }, [showVendorSheet, vendors]);

  // vendors 상태 변화 추적
  useEffect(() => {
    // vendors 상태 변화 추적
  }, [vendors]);

  // showVendorSheet 상태 변화 추적
  useEffect(() => {
    // showVendorSheet 상태 변화 추적
  }, [showVendorSheet]);

  // 쿠폰 사용 처리
  const handleCouponUse = async (coupon: CouponItem) => {
    // 로그인 상태 확인
    const accessToken = getAccessToken();
    if (!accessToken) {
      showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
      router.push('/sign');
      return;
    }

    // EXCHANGE 타입은 커스텀 알림 표시
    if (coupon.discountType === 'EXCHANGE') {
      setExchangeCoupon(coupon);
      setShowExchangeAlert(true);
      return;
    }

    // FIXED_AMOUNT, PERCENTAGE 타입은 벤더 선택 필요
    if (coupon.discountType === 'FIXED_AMOUNT' || coupon.discountType === 'PERCENTAGE') {
      setSelectedCoupon(coupon);
      setLoading(true);
      
      try {
        // 벤더 심플 리스트 가져오기 (푸드트럭 타입)
        const result = await getVendorsSimple(eventId, "FOOD_TRUCK");
        
        if (result.success && result.data) {
          // 데이터가 배열인지 확인하고 안전하게 설정
          const vendorArray = Array.isArray(result.data) ? result.data : [];
          
          setVendors(vendorArray);
          
          setShowVendorSheet(true);
          
        } else if (result.error === 'AUTH_REQUIRED') {
          console.error('❌ 인증 오류');
          showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
          router.push('/sign');
        } else {
          console.error('❌ 벤더 목록 로드 실패:', result.error);
          showToast(result.error || '사용 가능한 벤더를 불러오는데 실패했습니다.', 'error');
        }
      } catch (error) {
        console.error('❌ 벤더 목록 요청 중 예외 발생:', error);
        showToast('사용 가능한 벤더를 불러오는데 실패했습니다.', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // 벤더 선택 처리
  const handleVendorSelect = async (vendor: VendorItem) => {
    setSelectedVendor(vendor);
  };

  // 쿠폰을 사용된 것으로 표시
  const markCouponAsUsed = (couponId: string) => {
    setUsedCoupons(prev => new Set(prev).add(couponId));
  };

  // 교환권 사용 처리
  const handleExchangeCouponUse = async () => {
    if (!exchangeCoupon) return;
    
    setShowExchangeAlert(false);
    setLoading(true);
    
    try {
      const result = await useCoupon(eventId, exchangeCoupon.id!, undefined);
      if (result.success) {
        showToast('교환권이 사용되었습니다!', 'success');
        markCouponAsUsed(exchangeCoupon.id!);
      } else if (result.error === 'AUTH_REQUIRED') {
        showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
        router.push('/sign');
      } else {
        showToast(result.error || '교환권 사용에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('교환권 사용 중 오류:', error);
      showToast('교환권 사용 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
      setExchangeCoupon(null);
    }
  };

  // 교환권 사용 취소 처리
  const handleExchangeCouponCancel = () => {
    setShowExchangeAlert(false);
    setExchangeCoupon(null);
  };

  // 선택된 벤더로 쿠폰 사용
  const handleUseSelectedVendor = async () => {
    if (!selectedCoupon || !selectedVendor) return;
    
    setShowVendorSheet(false);
    setLoading(true);
    
    try {
      const result = await useCoupon(eventId, selectedCoupon.id!, selectedVendor.id);
      if (result.success) {
        showToast('쿠폰이 사용되었습니다!', 'success');
        markCouponAsUsed(selectedCoupon.id!);
      } else if (result.error === 'AUTH_REQUIRED') {
        showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
        router.push('/sign');
      } else {
        showToast(result.error || '쿠폰 사용에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('쿠폰 사용 중 오류:', error);
      showToast('쿠폰 사용 중 오류가 발생했습니다.', 'error');
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
                 {(() => {
                   const isActive = coupon.status?.toLowerCase() === 'active';
                   const isNotUsed = !coupon.isUsed && !usedCoupons.has(coupon.id!);
                   const isNotLoading = !loading;
                   const canUse = isActive && isNotUsed && isNotLoading;
                   
                   return (
                     <button
                       className={`w-full py-3 mt-4 px-4 rounded-lg text-md font-semibold transition-colors ${
                         canUse
                           ? 'bg-purple-600 text-white hover:bg-purple-700'
                           : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                       }`}
                       disabled={!canUse}
                       onClick={() => {
                         handleCouponUse(coupon);
                       }}
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

      {/* 벤더 선택 액션시트 */}
      <CouponActionSheet
        isOpen={showVendorSheet}
        onClose={() => {
          setShowVendorSheet(false);
          setSelectedCoupon(null);
          setSelectedVendor(null);
        }}
        title="사용할 쿠폰을 선택하세요"
        selectedItem={selectedVendor ? {
          label: selectedVendor.name || '알 수 없는 벤더',
          onClick: () => {},
        } : null}
        onUseSelected={handleUseSelectedVendor}
        items={(Array.isArray(vendors) ? vendors : []).map((vendor) => {
          const item = {
            label: vendor.name || '알 수 없는 벤더',
            onClick: () => handleVendorSelect(vendor),
          };
          return item;
        })}
              />

        {/* 교환권 사용 커스텀 알림 */}
        <CommonAlert
          isOpen={showExchangeAlert}
          title={`${exchangeCoupon?.title} 교환권을 사용하시겠습니까?`}
          message={`한 번 사용하면 취소할 수 없습니다.`}
          confirmText="교환권 사용"
          cancelText="취소"
          onConfirm={handleExchangeCouponUse}
          onCancel={handleExchangeCouponCancel}
        />
      </section>
    );
  } 