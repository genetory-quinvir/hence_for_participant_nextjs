"use client";

import { useState, useEffect, useRef } from "react";

interface CodeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (code: string) => void;
  isChecking?: boolean;
}

export default function CodeInputModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isChecking = false 
}: CodeInputModalProps) {
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCode("");
      // 입력 필드에 포커스
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (code.trim() && !isChecking) {
      // 입력 필드에서 포커스 제거하여 키보드 내리기
      inputRef.current?.blur();
      onSubmit(code.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4" style={{ 
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)'
      }}>
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-center">
            <img 
              src="/images/icon_code.png" 
              alt="입장코드 아이콘" 
              className="w-12 h-12 object-contain mr-3 mt-1 flex-shrink-0"
              style={{ 
                animationDuration: '1.5s', 
                animationIterationCount: 'infinite', 
                animationTimingFunction: 'ease-in-out',
                animation: 'gentleBounce 1.5s ease-in-out infinite'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <style jsx>{`
              @keyframes gentleBounce {
                0%, 100% {
                  transform: translateY(0);
                }
                50% {
                  transform: translateY(-4px);
                }
              }
            `}</style>
            <div className="flex-1">
              <h2 className="text-black text-xl font-bold mb-1">입장코드 입력</h2>
              <p className="text-black font-regular text-sm" style={{ opacity: 0.7 }}>
                입장코드를 입력해주세요
              </p>
            </div>
          </div>
        </div>

        {/* 코드 입력 필드 */}
        <div className="mb-6">
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="입장코드를 입력하세요"
            className="w-full px-4 py-3 rounded-lg focus:outline-none transition-colors code-input-field"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              color: 'black',
              border: '1px solid rgba(0, 0, 0, 0.2)'
            }}
            onFocus={(e) => e.target.style.border = '1px solid #7C3AED'}
            onBlur={(e) => e.target.style.border = '1px solid rgba(0, 0, 0, 0.2)'}
            disabled={isChecking}
          />
        </div>

        {/* 버튼 */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-lg text-black font-normal transition-colors"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
            disabled={isChecking}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!code.trim() || isChecking}
            className={`flex-1 py-3 px-4 rounded-lg font-bold transition-colors ${
              code.trim() && !isChecking
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "text-gray-400 cursor-not-allowed"
            }`}
            style={{ 
              backgroundColor: code.trim() && !isChecking 
                ? undefined 
                : 'rgba(0, 0, 0, 0.05)' 
            }}
          >
            {isChecking ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                확인 중...
              </div>
            ) : (
              "입장하기"
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 