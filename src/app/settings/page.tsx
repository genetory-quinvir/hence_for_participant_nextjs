"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useSimpleNavigation } from "@/utils/navigation";
import { deleteAccount } from "@/lib/api";
import { useToast } from "@/components/common/Toast";

export default function SettingsPage() {
  const { navigate, goBack } = useSimpleNavigation();
  const { user, logout, isAuthenticated, isLoading: authLoading, checkAuthStatus } = useAuth();
  const { showToast } = useToast();

  // 인증 상태 확인 및 사용자 정보 가져오기
  useEffect(() => {
    console.log('설정 페이지 - 인증 상태:', { authLoading, isAuthenticated, user });
    if (isAuthenticated && user) {
      console.log('설정 페이지 - 인증된 사용자:', user);
      
      // provider 정보가 없는 경우 사용자 정보를 다시 가져오기
      if (!user.provider) {
        console.log('설정 페이지 - provider 정보가 없어서 사용자 정보를 다시 가져옵니다.');
        checkAuthStatus();
      }
    }
  }, [authLoading, isAuthenticated, user, checkAuthStatus]);

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate, authLoading]);

  // 설정 페이지 진입 시 히스토리에 추가
  useEffect(() => {
    // 브라우저 히스토리만 사용하므로 별도 관리 불필요
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    if (confirm("로그아웃하시겠습니까?")) {
      logout();
      navigate("/");
    }
  };

  const handleBackClick = () => {
    goBack();
  };

  const handleChangePassword = () => {
    navigate("/settings/change-password");
  };

  const handleDeleteAccount = () => {
    navigate("/settings/delete-account");
  };

  const handleContactDeveloper = () => {
    // TODO: 개발자 연락처 페이지로 이동 또는 이메일 앱 실행
    alert("개발자 연락 기능은 준비 중입니다.");
  };

  const handleTermsOfService = () => {
    window.open('https://nettle-animal-431.notion.site/hence-b2c-terms?pvs=73', '_blank');
  };

  const handlePrivacyPolicy = () => {
    window.open('https://nettle-animal-431.notion.site/hence-b2c-privacypolicy?pvs=73', '_blank');
  };

  // 로딩 상태 - 인증 로딩 중일 때만
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 또는 사용자 정보가 없는 경우
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>메인 페이지로 이동 중...</p>
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
        title="설정"
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
          {/* 계정 정보 섹션 */}
          <div className="px-4 py-6">
            <h2 className="text-lg font-bold text-black mb-4">계정 정보</h2>
            <div className="bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">
                  {user.provider?.toLowerCase() === 'email' || user.provider === 'EMAIL' ? '이메일' : '연결된 서비스'}
                </span>
                {user.provider?.toLowerCase() === 'email' || user.provider === 'EMAIL' ? (
                  <span className="text-sm text-black">{user.email || '이메일 정보 없음'}</span>
                ) : user.provider ? (
                  <div className="flex items-center">
                    <img 
                      src={`/images/icon_${user.provider?.toLowerCase()}.png`}
                      alt={`${user.provider} 아이콘`}
                      className="w-5 h-5 mr-2"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-sm text-black capitalize">
                      {user.provider?.toLowerCase() === 'naver' ? '네이버' : 
                       user.provider?.toLowerCase() === 'google' ? '구글' : 
                       user.provider?.toLowerCase() === 'kakao' ? '카카오' : 
                       user.provider?.toLowerCase()}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-black">서비스 정보 없음</span>
                )}
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">닉네임</span>
                <span className="text-sm text-black">{user.nickname || '닉네임 정보 없음'}</span>
              </div>
              {/* 비밀번호 변경 옵션 임시 숨김
              {(user.provider?.toLowerCase() === 'email' || user.provider === 'EMAIL') && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50" onClick={handleChangePassword}>
                  <span className="text-sm text-gray-600">비밀번호 변경</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
              */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50" onClick={handleLogout}>
                <span className="text-sm text-gray-600">로그아웃</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50" onClick={handleDeleteAccount}>
                <span className="text-sm text-red-600">회원탈퇴</span>
              </div>
            </div>
          </div>

          {/* 앱 정보 섹션 */}
          <div className="px-4 py-6">
            <h2 className="text-lg font-bold text-black mb-4">앱 정보</h2>
            <div className="bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50" onClick={handleContactDeveloper}>
                <span className="text-sm text-gray-600">개발자에게 연락하기</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50" onClick={handleTermsOfService}>
                <span className="text-sm text-gray-600">이용약관</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50" onClick={handlePrivacyPolicy}>
                <span className="text-sm text-gray-600">개인정보 처리방침</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-600">버전</span>
                <span className="text-sm text-black">1.0.0</span>
              </div>
            </div>
          </div>



          {/* 하단 여백 */}
          <div style={{ height: 'env(safe-area-inset-bottom)' }}></div>
        </div>
      </main>
      </div>
    </div>
  );
} 