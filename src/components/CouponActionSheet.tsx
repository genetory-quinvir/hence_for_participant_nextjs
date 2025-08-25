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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '700px',
        backgroundColor: 'white',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        padding: '16px',
        maxHeight: '80vh'
      }}>
                  {/* 드래그 핸들 */}
        <div style={{
          width: '48px',
          height: '4px',
          backgroundColor: '#7c3aed',
          borderRadius: '2px',
          margin: '0 auto 16px auto'
        }}></div>
        
        {/* 제목 (선택사항) */}
        {title && (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: 'black', fontSize: '18px', fontWeight: '500' }}>{title}</h3>
          </div>
        )}
        
        {/* 선택된 쿠폰 안내 메시지 */}
        {selectedItem && (
          <div style={{
            marginBottom: '16px',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(124, 58, 237, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <img 
                src="/images/icon_coupon.png" 
                alt="쿠폰 아이콘" 
                style={{
                  width: '56px',
                  height: '56px',
                  objectFit: 'contain',
                  animation: 'float 1s ease-in-out infinite',
                  transformStyle: 'preserve-3d'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div style={{ color: 'black', fontSize: '18px', marginTop: '8px' }}>
              {couponType === 'FIXED_AMOUNT' ? (
                <span><span style={{ fontWeight: 'bold' }}>{selectedItem.label}</span>에서<br></br><span style={{ color: '#7c3aed', fontWeight: 'bold' }}>1,000원</span>을 할인 받으실건가요?</span>
              ) : (
                <span><span style={{ fontWeight: 'bold' }}>{selectedItem.label}</span>을 교환해드려요.</span>
              )}
            </div>
            <div style={{ marginTop: '8px' }}>
              <span style={{ color: '#7c3aed', fontSize: '14px' }}>반드시 관련자에게 보여주셔야 사용이 가능합니다.</span>
            </div>
          </div>
        )}
        
        {/* 스크롤 가능한 액션 아이템 영역 - 교환권이 아닐 때만 표시 */}
        {items && items.length > 0 && (
          <div style={{
            flex: 1,
            overflowY: 'auto',
            paddingLeft: '16px',
            paddingRight: '16px',
            minHeight: '100px',
            maxHeight: 'calc(100vh - 300px)',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y'
          }}>
            {/* 액션 아이템들 */}
            <div style={{ marginBottom: '8px' }}>
              {items.map((item, index) => {
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
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: item.variant === 'destructive' ? '#f87171' : 'black',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = item.variant === 'destructive' ? 'rgba(239, 68, 68, 0.1)' : '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {item.icon && (
                      <div style={{ flexShrink: 0, marginRight: '12px' }}>
                        {item.icon}
                      </div>
                    )}
                    <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                    {isSelected && (
                      <div style={{ flexShrink: 0 }}>
                        <svg 
                          style={{ width: '20px', height: '20px', color: '#7c3aed' }}
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 고정된 버튼 영역 */}
        <div style={{ paddingLeft: '16px', paddingRight: '16px', marginTop: '8px' }}>
          {selectedItem ? (
            // 선택된 아이템이 있을 때: 취소 + 사용하기 버튼
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 2,
                  padding: '12px',
                  color: '#9ca3af',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                취소
              </button>
              <button
                onClick={onUseSelected}
                style={{
                  flex: 5,
                  padding: '12px',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#6d28d9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#7c3aed';
                }}
              >
                사용하기
              </button>
            </div>
          ) : (
            // 선택된 아이템이 없을 때: 취소 버튼만
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '12px',
                color: '#9ca3af',
                border: 'none',
                backgroundColor: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
