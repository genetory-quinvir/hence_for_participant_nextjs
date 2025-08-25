"use client";

import { ReactNode, useEffect } from "react";

interface ActionSheetItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface CommonActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  items: ActionSheetItem[];
  title?: string;
}

export default function CommonActionSheet({ 
  isOpen, 
  onClose, 
  items, 
  title 
}: CommonActionSheetProps) {
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
          backgroundColor: '#d1d5db',
          borderRadius: '2px',
          margin: '0 auto 16px auto'
        }}></div>
        
        {/* 제목 (선택사항) */}
        {title && (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: 'black', fontSize: '18px', fontWeight: '500' }}>{title}</h3>
          </div>
        )}
        
        {/* 액션 아이템들 */}
        <div style={{ marginBottom: '16px' }}>
          {items && items.length > 0 ? (
            items.map((item, index) => {
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: item.variant === 'destructive' ? '#dc2626' : 'black',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = item.variant === 'destructive' ? '#fef2f2' : '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                </button>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '16px 0' }}>
              <p>표시할 항목이 없습니다.</p>
            </div>
          )}
        </div>
        
        {/* 취소 버튼 */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              color: '#4b5563',
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
        </div>
      </div>
    </div>
  );
} 