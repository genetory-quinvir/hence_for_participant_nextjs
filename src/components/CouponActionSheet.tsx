"use client";

import { ReactNode, useEffect } from "react";

interface ActionSheetItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface CouponActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: ActionSheetItem[];
  title?: string;
  selectedItem?: ActionSheetItem | null;
  onUseSelected?: () => void;
}

export default function CouponActionSheet({ 
  isOpen, 
  onClose, 
  items, 
  title,
  selectedItem,
  onUseSelected
}: CouponActionSheetProps) {
  // PWA 환경 감지
  const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
  // 액션시트가 열렸을 때 body에 스타일 적용
  useEffect(() => {
    if (isOpen) {
      // 현재 스크롤 위치 저장
      const scrollY = window.scrollY;
      
      // body에 스타일 추가 (overflow: hidden 제거)
      document.body.style.touchAction = 'none';
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      
      // 스크롤 위치를 강제로 유지
      const preventScroll = (e: Event) => {
        e.preventDefault();
        window.scrollTo(0, scrollY);
      };
      
      // 이벤트 리스너 추가
      document.addEventListener('scroll', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('wheel', preventScroll, { passive: false });
      
      // 스크롤 위치를 sessionStorage에 저장
      sessionStorage.setItem('actionSheetScrollY', scrollY.toString());
      
      // cleanup 함수 반환
      return () => {
        document.removeEventListener('scroll', preventScroll);
        document.removeEventListener('touchmove', preventScroll);
        document.removeEventListener('wheel', preventScroll);
      };
    } else {
      // body 스타일 복원
      document.body.style.touchAction = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      
      // 저장된 스크롤 위치 복원
      const savedScrollY = sessionStorage.getItem('actionSheetScrollY');
      if (savedScrollY) {
        const scrollY = parseInt(savedScrollY, 10);
        window.scrollTo(0, scrollY);
        sessionStorage.removeItem('actionSheetScrollY');
      }
    }

    // 컴포넌트 언마운트 시 스타일 복원
    return () => {
      document.body.style.touchAction = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      
      const savedScrollY = sessionStorage.getItem('actionSheetScrollY');
      if (savedScrollY) {
        const scrollY = parseInt(savedScrollY, 10);
        window.scrollTo(0, scrollY);
        sessionStorage.removeItem('actionSheetScrollY');
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 완전히 차단하는 오버레이 */}
      <div 
        className="fixed inset-0 z-40"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          touchAction: 'none',
          pointerEvents: 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          overflow: 'hidden'
        }}
      />
      
      {/* 액션시트 컨테이너 */}
      <div 
        className="fixed inset-0 z-50 flex items-end"
        style={{ 
          touchAction: 'none',
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        <div 
          className="w-full bg-white rounded-t-xl p-4"
          style={{ 
            pointerEvents: 'auto',
            userSelect: 'auto',
            WebkitUserSelect: 'auto',
            paddingBottom: isPWA 
              ? 'max(40px, env(safe-area-inset-bottom) + 32px)'
              : 'max(24px, env(safe-area-inset-bottom) + 16px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 드래그 핸들 */}
          <div className="w-12 h-1 bg-purple-700 rounded-full mx-auto mb-4"></div>
          
          {/* 제목 (선택사항) */}
          {title && (
            <div className="text-center mb-4">
              <h3 className="text-black text-lg font-medium">{title}</h3>
            </div>
          )}
          
          {/* 선택된 쿠폰 안내 메시지 */}
          {selectedItem && (
            <div className="mb-4 p-4 rounded-lg" style={{backgroundColor: 'rgba(124, 58, 237, 0.1)'}}>
              <div className="flex items-center mb-2 space-x-1">
                <img 
                  src="/images/icon_coupon.png" 
                  alt="쿠폰 아이콘" 
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-purple-700 text-sm font-medium">선택된 쿠폰</span>
              </div>
              <div className="text-black font-normal text-lg">
                <span className="text-black font-bold">{selectedItem.label}</span>을 교환해드려요.
              </div>
              <div className="mt-2">
              <span className="text-purple-700 text-sm">반드시 관련자에게 보여주셔야 사용이 가능합니다.</span>
              </div>
            </div>
          )}
          
          {/* 액션 아이템들 */}
          <div className="space-y-2">
            {items && items.length > 0 ? (
              items.map((item, index) => {
                const isSelected = selectedItem && selectedItem.label === item.label;
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      item.variant === 'destructive'
                        ? 'text-red-400 hover:bg-red-900 hover:bg-opacity-20'
                        : 'text-black'
                    }`}
                  >
                    {item.icon && (
                      <div className="flex-shrink-0">
                        {item.icon}
                      </div>
                    )}
                    <span className="flex-1 text-left">{item.label}</span>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <svg 
                          className="w-5 h-5 text-purple-600" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })
            ) : (
              <div></div>
            )}
          </div>
          
          {/* 취소 버튼 */}
          <div className="mt-4 pt-4">
            {selectedItem ? (
              // 선택된 아이템이 있을 때: 취소 + 사용하기 버튼
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-[2] p-3 text-gray-400 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={onUseSelected}
                  className="flex-[5] p-3 bg-purple-600 text-white rounded-lg transition-colors font-medium"
                >
                  사용하기
                </button>
              </div>
            ) : (
              // 선택된 아이템이 없을 때: 취소 버튼만
              <button
                onClick={onClose}
                className="w-full p-3 text-gray-400  rounded-lg transition-colors"
              >
                취소
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
