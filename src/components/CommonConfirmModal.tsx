"use client";

import { useEffect } from 'react';

interface CommonConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CommonConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel
}: CommonConfirmModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 모달 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // 모달 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* 모달 컨테이너 */}
      <div className="relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden border border-gray-700" style={{backgroundColor: 'rgba(255,255,255,0.1)'}}>
        {/* 헤더 */}
        <div className="bg-black px-6 mt-8">
          <h2 className="text-white text-xl font-bold text-center">
            {title}
          </h2>
        </div>
        
        {/* 내용 */}
        <div className="px-6 py-6">
          <div className="text-gray-200 text-center whitespace-pre-line leading-relaxed">
            {message.split('\n').map((line, index) => {
              // 쿠폰 정보 강조
              if (line.includes('🎫 쿠폰') || line.includes('🏪 사용처')) {
                return (
                  <div key={index} className="mb-2">
                    <div className="text-purple-400 font-semibold text-sm mb-1">
                      {line}
                    </div>
                  </div>
                );
              }
              // 쿠폰/벤더 이름 강조
              else if (line && !line.includes('쿠폰을 사용하시겠습니까?') && 
                       !line.includes('⚠️') && 
                       !line.includes('🎫') && 
                       !line.includes('🏪') &&
                       line.trim() !== '') {
                return (
                  <div key={index} className="mb-3">
                    <div className="text-white font-bold text-lg bg-gray-800 rounded-lg px-4 py-2 mx-2">
                      {line}
                    </div>
                  </div>
                );
              }
              // 경고 메시지
              else if (line.includes('⚠️')) {
                return (
                  <div key={index} className="mt-4">
                    <div className="text-yellow-400 font-medium text-sm">
                      {line}
                    </div>
                  </div>
                );
              }
              // 일반 텍스트
              else {
                return (
                  <div key={index} className="mb-2">
                    {line}
                  </div>
                );
              }
            })}
          </div>
        </div>
        
        {/* 버튼 */}
        <div className="flex border-t border-gray-700">
          <button
            onClick={onCancel}
            className="flex-1 py-4 px-6 text-gray-400 font-medium transition-colors"
          >
            {cancelText}
          </button>
          <div className="w-px bg-black" />
          <button
            onClick={onConfirm}
            className="flex-1 py-4 px-6 text-purple-600 font-bold transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 