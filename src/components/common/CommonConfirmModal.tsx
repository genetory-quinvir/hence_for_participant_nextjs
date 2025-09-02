"use client";

import { useEffect } from "react";

interface CommonConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'destructive';
}

export default function CommonConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  variant = 'default'
}: CommonConfirmModalProps) {
  // 모달이 열렸을 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onCancel} // 배경 클릭 시 취소
    >
      <div 
        className="bg-white rounded-2xl mx-4 max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 이벤트 전파 방지
      >
        {/* 헤더 */}
        <div className="px-6 py-6 text-center border-b border-gray-100">
          <h3 className="text-lg font-bold text-black mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex">
          {/* 취소 버튼 */}
          <button
            onClick={onCancel}
            className="flex-1 py-4 text-gray-500 font-medium text-sm border-r border-gray-100 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          
          {/* 확인 버튼 */}
          <button
            onClick={onConfirm}
            className={`flex-1 py-4 font-medium text-sm transition-colors ${
              variant === 'destructive'
                ? 'text-red-600 hover:bg-red-50'
                : 'text-purple-600 hover:bg-purple-50'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
