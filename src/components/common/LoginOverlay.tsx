"use client";

import { useSimpleNavigation } from "@/utils/navigation";

interface LoginOverlayProps {
  onLoginClick: () => void;
  onClose: () => void;
}

export default function LoginOverlay({ onLoginClick, onClose }: LoginOverlayProps) {
  const { navigate } = useSimpleNavigation();

  const handleLoginClick = () => {
    onLoginClick();
    navigate("/sign");
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">로그인 페이지로 이동</h3>
          <p className="text-gray-600 mb-6">로그인 페이지로 이동하시겠습니까?</p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg text-gray-600 font-normal transition-colors"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
            >
              취소
            </button>
            <button
              onClick={handleLoginClick}
              className="flex-1 py-3 px-4 rounded-lg font-bold transition-colors bg-purple-600 hover:bg-purple-700 text-white"
            >
              로그인하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
