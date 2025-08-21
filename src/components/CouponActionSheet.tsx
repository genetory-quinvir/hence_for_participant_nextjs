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
  couponType?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'EXCHANGE';
}

export default function CouponActionSheet({ 
  isOpen, 
  onClose, 
  items, 
  title,
  selectedItem,
  onUseSelected,
  couponType
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
      // 간단하게 body overflow만 hidden으로 설정
      document.body.style.overflow = 'hidden';
    } else {
      // body overflow 복원
      document.body.style.overflow = '';
    }

    // 컴포넌트 언마운트 시 스타일 복원
    return () => {
      document.body.style.overflow = '';
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
          className="w-full bg-white rounded-t-xl flex flex-col action-sheet-content"
          style={{ 
            pointerEvents: 'auto',
            userSelect: 'auto',
            WebkitUserSelect: 'auto',
            maxHeight: 'calc(100vh - 100px)',
            paddingBottom: isPWA 
              ? 'max(16px, env(safe-area-inset-bottom) + 16px)'
              : 'max(16px, env(safe-area-inset-bottom) + 16px)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 고정된 상단 영역 */}
          <div className="p-4 pb-0">
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
                    className="w-14 h-14 object-contain"
                    style={{
                      animation: 'float 1s ease-in-out infinite',
                      transformStyle: 'preserve-3d'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-black font-normal text-lg mt-2">
                  {couponType === 'FIXED_AMOUNT' ? (
                    <span><span className="text-black font-bold">{selectedItem.label}</span>에서<br></br><span className="text-purple-700 font-bold">1,000원</span>을 할인 받으실건가요?</span>
                  ) : (
                    <span><span className="text-black font-bold">{selectedItem.label}</span>을 교환해드려요.</span>
                  )}
                </div>
                <div className="mt-2">
                <span className="text-purple-700 text-sm">반드시 관련자에게 보여주셔야 사용이 가능합니다.</span>
                </div>
              </div>
            )}
          </div>
          
          {/* 스크롤 가능한 액션 아이템 영역 */}
          <div 
            className="flex-1 overflow-y-auto px-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              minHeight: '100px',
              maxHeight: 'calc(100vh - 300px)',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y'
            }}
          >
            {/* 액션 아이템들 */}
            <div className="space-y-2">
              {items && items.length > 0 ? (
                items.map((item, index) => {
                  const isSelected = selectedItem && selectedItem.label === item.label;
                  return (
                    <button
                      key={index}
                      data-item-index={index}
                      onClick={() => {
                        item.onClick();
                        // 선택된 아이템이 보이도록 스크롤
                        setTimeout(() => {
                          const selectedElement = document.querySelector(`[data-item-index="${index}"]`) as HTMLElement;
                          if (selectedElement) {
                            selectedElement.scrollIntoView({
                              behavior: 'smooth',
                              block: 'center'
                            });
                          }
                        }, 100);
                      }}
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
          </div>
          
          {/* 고정된 버튼 영역 */}
          <div className="px-4 mt-2" style={{ paddingBottom: '0px' }}>
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
