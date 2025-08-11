"use client";

import { ReactNode } from "react";

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
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div 
        className="w-full bg-black rounded-t-xl p-4"
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
        
        {/* 액션 아이템들 */}
        <div className="space-y-2">
          {items.map((item, index) => (
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
          ))}
        </div>
        
        {/* 취소 버튼 */}
        <div className="mt-4 pt-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full p-3 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
} 