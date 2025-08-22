"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { VendorItem, FeaturedItem, CouponItem } from "@/types/api";
import { getVendorDetail, getFeaturedEvent, getVendorsSimple, useCoupon, getAccessToken } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useSimpleNavigation } from "@/utils/navigation";
import { useImageGallery } from "@/hooks/useImageGallery";
import ImageGallery from "@/components/common/ImageGallery";
import CouponActionSheet from "@/components/CouponActionSheet";
import { useToast } from "@/components/common/Toast";
import { useRouter } from "next/navigation";

function FoodTruckDetailContent() {
  const params = useParams();
  const { navigate, goBack } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const [vendor, setVendor] = useState<VendorItem | null>(null);
  const [featuredData, setFeaturedData] = useState<FeaturedItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVendorSheet, setShowVendorSheet] = useState(false);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponItem | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [usedCoupons, setUsedCoupons] = useState<Set<string>>(new Set());
  const eventId = searchParams.get('eventId') || 'default-event';
  const vendorId = params.id as string;
  const hasCalledApi = useRef(false);
  const router = useRouter();
  const { showToast } = useToast();

  // 이미지 갤러리 훅
  const { isOpen, images, initialIndex, openGallery, closeGallery } = useImageGallery();

  // 푸드트럭 상세 페이지 진입 시 히스토리에 추가
  useEffect(() => {
    // 브라우저 히스토리만 사용하므로 별도 관리 불필요
  }, [params.id]);

  // 벤더 상세 정보와 이벤트 정보 가져오기
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
      
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);
          
          console.log('🔄 벤더 상세 정보 요청:', { eventId, vendorId });
          const vendorResult = await getVendorDetail(eventId, vendorId);
          
          if (vendorResult.success && vendorResult.data) {
            setVendor(vendorResult.data);
            console.log('✅ 벤더 상세 정보 로드 완료:', vendorResult.data);
          } else {
            setError(vendorResult.error || "푸드트럭을 불러오는데 실패했습니다.");
            console.error('❌ 벤더 상세 정보 로드 실패:', vendorResult.error);
            return;
          }

          // 이벤트 정보와 쿠폰 정보 가져오기
          console.log('🔄 이벤트 정보 요청:', { eventId });
          const eventResult = await getFeaturedEvent(eventId);
          
          if (eventResult.success && eventResult.featured) {
            setFeaturedData(eventResult.featured);
            console.log('✅ 이벤트 정보 로드 완료:', eventResult.featured);
          } else {
            console.error('❌ 이벤트 정보 로드 실패:', eventResult.error);
            // 이벤트 정보 로드 실패는 치명적이지 않으므로 계속 진행
          }
        } catch (err) {
          console.error("데이터 로드 오류:", err);
          setError("푸드트럭을 불러오는데 실패했습니다.");
        } finally {
          setLoading(false);
        }
      };
      
      fetchData();
    }
  }, [vendorId, eventId]); // 단순한 의존성 배열

  const handleBackClick = () => {
    goBack();
  };

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
      setCouponLoading(true);
      
      try {
        const result = await getVendorsSimple(eventId, "FOOD_TRUCK");
        
        if (result.success && result.data) {
          const vendorArray = Array.isArray(result.data) ? result.data : [];
          setVendors(vendorArray);
          
          // 현재 푸드트럭을 찾아서 자동 선택
          const currentVendor = vendorArray.find(v => v.id === vendorId);
          if (currentVendor) {
            setSelectedVendor(currentVendor);
          }
          
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
        setCouponLoading(false);
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
    setCouponLoading(true);
    
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
      setCouponLoading(false);
      setSelectedCoupon(null);
      setSelectedVendor(null);
    }
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
      <div className="min-h-screen bg-white text-black flex flex-col">
        <CommonNavigationBar 
          title='푸드트럭'
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
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
          sticky={true}
          fixedHeight={true}
        />
        
        {/* 푸드트럭 스켈레톤 */}
        <div className="flex-1 overflow-y-auto px-1">
          <div className="w-full rounded-xl flex flex-col" style={{ backgroundColor: 'white' }}>
            {/* 썸네일 이미지 스켈레톤 */}
            <div className="w-full aspect-[5/3] relative p-3" style={{ backgroundColor: "white" }}>
              <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse"></div>
            </div>

            {/* 푸드트럭 정보 스켈레톤 */}
            <div className="px-4 flex-1 flex flex-col">
              <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse mb-8"></div>
              
              <div className="mt-auto mb-8 space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 rounded mr-2 animate-pulse"></div>
                  <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 rounded mr-1 animate-pulse"></div>
                  <div className="w-1/3 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 쿠폰 스켈레톤 */}
        <div className="px-4 pb-4">
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="w-full rounded-xl p-4 relative overflow-hidden bg-gray-200 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-lg animate-pulse"></div>
                    <div className="flex-1">
                      <div className="w-32 h-4 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="w-20 h-8 bg-gray-300 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 메뉴 스켈레톤 */}
        <div className="px-4 py-4">
          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="w-full bg-white h-16">
                <div className="flex h-full items-center">
                  <div className="flex-1 space-y-2">
                    <div className="w-2/3 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse ml-2"></div>
                </div>
              </div>
            ))}
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
    <div className="min-h-screen bg-white text-black flex flex-col"
      style={{ paddingBottom: 'min(env(safe-area-inset-bottom) + 16px, 16px)' }}>
      <CommonNavigationBar 
        title={vendor.name || '푸드트럭'}
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
        sticky={true}
        fixedHeight={true}
      />
      
      {/* 푸드트럭 카드 */}
      <div className="flex-1 overflow-y-auto px-1">
        <div className="w-full rounded-xl cursor-pointer flex flex-col" style={{ backgroundColor: 'white' }}>
          {/* 썸네일 이미지 */}
          <div className="w-full aspect-[5/3] relative p-3" style={{ backgroundColor: "white" }}>
            {vendor.imageUrl ? (
              <img 
                src={vendor.imageUrl} 
                alt={vendor.name || '푸드트럭 이미지'} 
                className="w-full h-full object-cover rounded-lg"
                onClick={handleVendorImageClick}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : vendor.thumbImageUrl ? (
              <img 
                src={vendor.thumbImageUrl} 
                alt={vendor.name || '푸드트럭 이미지'} 
                className="w-full h-full object-cover rounded-lg"
                onClick={handleVendorImageClick}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
          </div>

          {/* 푸드트럭 정보 */}
          <div className="px-4 flex-1 flex flex-col">
              <h3 className="text-black font-bold text-md text-left">
                {vendor.name || '푸드트럭'}
              </h3>
            
            {vendor.description && (
              <p className="text-sm text-black text-left mb-4" style={{ opacity: 0.8 }}>
                {vendor.description}
              </p>
            )}
            
            <div className="mt-auto mb-8">
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
                <svg className="w-4 h-4 text-black mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm text-black">
                  {vendor.operationTime || '10:00-18:00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 쿠폰 카드 섹션 */}
      {featuredData?.coupons && featuredData.coupons.filter(coupon => coupon.discountType === 'FIXED_AMOUNT').length > 0 && (
        <div className="px-4 pb-4">
          <div className="space-y-4">
            {featuredData.coupons
              .filter(coupon => coupon.discountType === 'FIXED_AMOUNT')
              .map((coupon) => (
              <div
                key={coupon.id}
                className="w-full rounded-xl p-4 transition-all duration-300 relative overflow-hidden"
                style={{ 
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-transparent rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {coupon.iconImageUrl ? (
                          <img 
                            src={coupon.iconImageUrl} 
                            alt="쿠폰 아이콘" 
                            className="w-full h-full object-cover ml-2"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center ${coupon.iconImageUrl ? 'hidden' : ''}`}>
                          {coupon.discountType === 'PERCENTAGE' && (
                            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          )}
                          {coupon.discountType === 'FIXED_AMOUNT' && (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          )}
                          {coupon.discountType === 'EXCHANGE' && (
                            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-base line-clamp-1">
                          {coupon.title}
                          {coupon.discountType === 'PERCENTAGE' && ' 할인권'}
                          {coupon.discountType === 'FIXED_AMOUNT' && ' 쿠폰'}
                          {coupon.discountType === 'EXCHANGE' && ' 교환권'}
                        </h3>
                      </div>
                    </div>

                    <button
                      className={`px-4 py-2 mr-2 rounded-lg text-sm font-semibold transition-colors shadow-lg flex-shrink-0 ${
                        coupon.status?.toLowerCase() === 'active' && !coupon.isUsed && !usedCoupons.has(coupon.id!)
                          ? coupon.discountType === 'PERCENTAGE'
                            ? 'bg-purple-600 bg-opacity-80 text-white hover:bg-opacity-90'
                            : coupon.discountType === 'FIXED_AMOUNT'
                            ? 'bg-green-700 bg-opacity-80 text-white hover:bg-opacity-90'
                            : coupon.discountType === 'EXCHANGE'
                            ? 'bg-orange-600 bg-opacity-80 text-white hover:bg-opacity-90'
                            : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30 border border-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                      disabled={coupon.status?.toLowerCase() !== 'active' || coupon.isUsed || usedCoupons.has(coupon.id!)}
                      onClick={() => handleCouponUse(coupon)}
                    >
                      {couponLoading ? '처리 중...' : 
                       coupon.isUsed || usedCoupons.has(coupon.id!) ? '이미 사용한 쿠폰' :
                       coupon.status?.toLowerCase() === 'active' ? '사용하기' : '사용 불가능한 쿠폰'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메뉴 리스트 섹션 */}
      {vendor.menus && vendor.menus.length > 0 && (
        <div className="px-4 py-4">
          <h2 className="text-lg font-bold text-black">메뉴</h2>
          <div className="space-y-2">
            {vendor.menus.map((menu, index) => (
              <div key={menu.id || index} className="w-full bg-white h-16">
                <div className="flex h-full">
                  {/* 메뉴 정보 */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-black font-semibold text-base truncate">
                          {menu.name || '메뉴명'}
                        </h3>
                        {menu.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {menu.description}
                          </p>
                        )}
                      </div>
                      {menu.price && (
                        <span className="text-base font-bold text-black ml-2 flex-shrink-0">
                          {typeof menu.price === 'number' 
                            ? `${menu.price.toLocaleString()}원`
                            : menu.price
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        couponType={selectedCoupon?.discountType as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'EXCHANGE' | undefined}
        items={selectedCoupon?.discountType === 'EXCHANGE' ? [] : (Array.isArray(vendors) ? vendors : []).map((vendor) => {
          const item = {
            label: vendor.name || '알 수 없는 벤더',
            onClick: () => handleVendorSelect(vendor),
          };
          return item;
        })}
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