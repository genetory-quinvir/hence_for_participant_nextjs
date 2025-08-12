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
          className="w-full bg-black rounded-t-xl p-4"
          style={{ 
            pointerEvents: 'auto',
            userSelect: 'auto',
            WebkitUserSelect: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 드래그 핸들 */}
          <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
          
          {/* 제목 (선택사항) */}
          {title && (
            <div className="text-center mb-4">
              <h3 className="text-white text-lg font-medium">{title}</h3>
            </div>
          )}
          
          {/* 선택된 쿠폰 안내 메시지 */}
          {selectedItem && (
            <div className="mb-4 p-4 rounded-lg" style={{backgroundColor: 'rgba(255,255,255,0.05)'}}>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                <span className="text-purple-600 text-sm font-medium">선택된 쿠폰</span>
              </div>
              <div className="text-white font-semibold text-md">
                {selectedItem.label}
              </div>
              <div className="text-gray-400 text-sm mt-1">
                아래에서 사용할 벤더를 선택하세요
              </div>
            </div>
          )}
          
          {/* 액션 아이템들 */}
          <div className="space-y-2">
            {items && items.length > 0 ? (
              items.map((item, index) => {
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      item.variant === 'destructive'
                        ? 'text-red-400 hover:bg-red-900 hover:bg-opacity-20'
                        : 'text-white hover:bg-gray-800'
                    }`}
                  >
                    {item.icon && (
                      <div className="flex-shrink-0">
                        {item.icon}
                      </div>
                    )}
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="text-center text-gray-400 py-4">
                <p>표시할 항목이 없습니다.</p>
                <p className="text-sm">items: {JSON.stringify(items)}</p>
              </div>
            )}
          </div>
          
          {/* 취소 버튼 */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            {selectedItem ? (
              // 선택된 아이템이 있을 때: 취소 + 사용하기 버튼
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-[2] p-3 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={onUseSelected}
                  className="flex-[5] p-3 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors font-medium"
                >
                  사용하기
                </button>
              </div>
            ) : (
              // 선택된 아이템이 없을 때: 취소 버튼만
              <button
                onClick={onClose}
                className="w-full p-3 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
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
