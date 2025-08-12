"use client";

import { useEffect } from 'react';

interface CommonAlertProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function CommonAlert({
  isOpen,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel
}: CommonAlertProps) {
  // ESC 키로 알림 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel ? onCancel() : onConfirm();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 알림 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // 알림 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onConfirm, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
        onClick={onCancel ? onCancel : onConfirm}
      />
      
      {/* 알림 컨테이너 */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden border border-gray-700" style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
        {/* 헤더 */}
        <div className="px-6 mt-8">
          <h2 className="text-white text-xl font-bold text-center">
            {title}
          </h2>
        </div>
        
        {/* 내용 */}
        <div className="px-6 py-6">
          <div className="text-gray-200 text-center whitespace-pre-line leading-relaxed">
            {message}
          </div>
        </div>
        
        {/* 버튼 */}
        <div className="flex border-t border-gray-700">
          {onCancel && (
            <>
              <button
                onClick={onCancel}
                className="flex-1 py-4 px-6 text-gray-400 font-medium transition-colors"
              >
                {cancelText}
              </button>
              <div className="w-px bg-gray-700" />
            </>
          )}
          <button
            onClick={onConfirm}
            className="flex-1 py-4 px-6 text-purple-600 font-semibold text-lg transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 