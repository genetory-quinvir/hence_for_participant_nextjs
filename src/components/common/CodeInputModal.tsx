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
      <div className="bg-black rounded-2xl p-6 w-full max-w-sm mx-4" style={{ 
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 8px 16px rgba(0, 0, 0, 0.6)'
      }}>
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h2 className="text-white text-xl font-bold mb-2">입장코드 입력</h2>
          <p className="text-white font-regular text-sm" style={{ opacity: 0.7 }}>
            입장코드를 입력해주세요
          </p>
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
            className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors code-input-field"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            disabled={isChecking}
          />
        </div>

        {/* 버튼 */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-white font-medium transition-colors"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            disabled={isChecking}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!code.trim() || isChecking}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
              code.trim() && !isChecking
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "text-gray-400 cursor-not-allowed"
            }`}
            style={{ 
              backgroundColor: code.trim() && !isChecking 
                ? undefined 
                : 'rgba(255, 255, 255, 0.1)' 
            }}
          >
            {isChecking ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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