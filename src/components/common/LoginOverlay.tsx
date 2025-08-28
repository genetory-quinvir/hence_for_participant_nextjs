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

  const handleGoToMain = () => {
    // sessionStorage 정리하여 메인 페이지에서 로그인 알럿이 뜨지 않도록 함
    sessionStorage.removeItem('pendingEventId');
    sessionStorage.removeItem('pendingEventUrl');
    onClose();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-center">
            <img 
              src="/images/icon_profile.png" 
              alt="로그인 아이콘" 
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
              <h2 className="text-black text-xl font-bold mb-1">로그인이 필요합니다</h2>
              <p className="text-black font-regular text-sm" style={{ opacity: 0.7 }}>
                이벤트에 참여하려면 로그인이 필요합니다
              </p>
            </div>
          </div>
        </div>

        {/* 메시지 */}
        <div className="mb-6">
            <p className="text-black font-regular text-md text-center" style={{ opacity: 0.8 }}>
              로그인하시면 이벤트에 참여할 수 있습니다
            </p>
        </div>

        {/* 버튼 */}
        <div className="flex space-x-3">
          <button
            onClick={handleGoToMain}
            className="flex-1 py-3 px-4 rounded-lg text-black font-normal transition-colors"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
          >
            메인으로 돌아가기
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
  );
}
