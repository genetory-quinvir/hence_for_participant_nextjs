"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useSimpleNavigation } from "@/utils/navigation";
import { changePassword } from "@/lib/api";
import { useToast } from "@/components/common/Toast";

export default function ChangePasswordPage() {
  const { navigate, goBack } = useSimpleNavigation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  if (!authLoading && (!isAuthenticated || !user)) {
    navigate("/");
    return null;
  }

  const handleBackClick = () => {
    goBack();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!currentPassword.trim()) {
      showToast("현재 비밀번호를 입력해주세요.", "error");
      return;
    }
    
    if (!newPassword.trim()) {
      showToast("새 비밀번호를 입력해주세요.", "error");
      return;
    }
    
    if (newPassword.length < 6) {
      showToast("새 비밀번호는 6자 이상이어야 합니다.", "error");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showToast("새 비밀번호가 일치하지 않습니다.", "error");
      return;
    }
    
    if (currentPassword === newPassword) {
      showToast("새 비밀번호는 현재 비밀번호와 달라야 합니다.", "error");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await changePassword(currentPassword, newPassword, confirmPassword);
      
      if (response.success) {
        showToast("비밀번호가 성공적으로 변경되었습니다.", "success");
        goBack();
      } else {
        showToast(response.error || "비밀번호 변경에 실패했습니다. 다시 시도해주세요.", "error");
      }
    } catch (error) {
      console.error("비밀번호 변경 에러:", error);
      showToast("비밀번호 변경에 실패했습니다. 다시 시도해주세요.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 로딩 상태
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>
            인증 확인 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-white text-black overflow-hidden">
      {/* 최대 너비 제한 컨테이너 */}
      <div className="w-full max-w-[700px] mx-auto h-full flex flex-col overflow-hidden">
      {/* 네비게이션바 */}
      <CommonNavigationBar
        title="비밀번호 변경"
        leftButton={
          <svg
            className="w-6 h-6 text-black"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        onLeftClick={handleBackClick}
        backgroundColor="white"
        backgroundOpacity={1}
        textColor="text-black"
        sticky={true}
        fixedHeight={true}
      />

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div className="px-4 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 현재 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 text-black placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="현재 비밀번호를 입력하세요"
                  disabled={isLoading}
                />
              </div>

              {/* 새 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 text-black placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="새 비밀번호를 입력하세요 (6자 이상)"
                  disabled={isLoading}
                />
              </div>

              {/* 새 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 text-black placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="새 비밀번호를 다시 입력하세요"
                  disabled={isLoading}
                />
              </div>

              {/* 변경 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 rounded-lg font-bold text-white transition-colors"
              >
                {isLoading ? "변경 중..." : "비밀번호 변경"}
              </button>
            </form>
          </div>

          {/* 하단 여백 */}
          <div style={{ height: 'env(safe-area-inset-bottom)' }}></div>
        </div>
      </main>
      </div>
    </div>
  );
}
