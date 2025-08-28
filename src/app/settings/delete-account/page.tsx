"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useSimpleNavigation } from "@/utils/navigation";
import { deleteAccountWithToken, withdrawalLogin, deleteAccount } from "@/lib/api";
import { useToast } from "@/components/common/Toast";

export default function DeleteAccountPage() {
  const { navigate, goBack } = useSimpleNavigation();
  const { user, logout, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, user, navigate]);



  const handleBackClick = () => {
    goBack();
  };

  const handleDeleteAccount = () => {
    if (user?.provider?.toLowerCase() === 'email' || user?.provider === 'EMAIL') {
      // 이메일 계정인 경우 토큰 갱신 후 회원탈퇴
      if (!email.trim() || !password.trim()) {
        showToast('이메일과 비밀번호를 입력해주세요.', 'error');
        return;
      }
      handleEmailTokenRefresh();
    } else {
      // 소셜 로그인인 경우 외부 서버 탈퇴 페이지로 이동
      if (confirm("정말로 회원탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
        handleSocialAccountDeletion();
      }
    }
  };

  const handleEmailTokenRefresh = async () => {
    setIsVerifying(true);
    try {
      const result = await withdrawalLogin(email, password);
      
      if (result.success && result.data?.external_token) {
        if (confirm("정말로 회원탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) {
          performDeleteAccount(result.data.external_token);
        }
      } else {
        showToast(result.error || '이메일 또는 비밀번호가 올바르지 않습니다.', 'error');
      }
    } catch (error) {
      console.error('토큰 갱신 오류:', error);
      showToast('로그인 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSocialAccountDeletion = () => {
    // 소셜 계정 외부 서버 탈퇴 페이지로 이동
    const provider = user?.provider?.toLowerCase();
    
    if (provider === 'naver') {
      // 네이버 계정 탈퇴 페이지
      window.open('https://nid.naver.com/user2/help/myInfo.naver?menu=secession', '_blank');
      showToast('네이버 계정 탈퇴 페이지가 열렸습니다. 외부 탈퇴 후 다시 시도해주세요.', 'info');
    } else if (provider === 'google') {
      // 구글 계정 탈퇴 페이지
      window.open('https://myaccount.google.com/deleteaccount', '_blank');
      showToast('구글 계정 탈퇴 페이지가 열렸습니다. 외부 탈퇴 후 다시 시도해주세요.', 'info');
    } else if (provider === 'kakao') {
      // 카카오 계정 탈퇴 페이지
      window.open('https://accounts.kakao.com/weblogin/account', '_blank');
      showToast('카카오 계정 탈퇴 페이지가 열렸습니다. 외부 탈퇴 후 다시 시도해주세요.', 'info');
    } else {
      showToast('지원하지 않는 소셜 로그인입니다.', 'error');
    }
  };

  const handleSocialTokenRefresh = () => {
    // 소셜 로그인으로 토큰 갱신 (현재 사용하지 않음)
    const provider = user?.provider?.toLowerCase();
    const redirectUrl = '/settings/delete-account?fromSocialLogin=true';
    
    if (provider === 'naver') {
      window.location.href = `http://api.hence.events/api/v1/auth/naver?redirect=participant&joinPlatform=participant&redirect=${encodeURIComponent(redirectUrl)}`;
    } else if (provider === 'google') {
      window.location.href = `http://api.hence.events/api/v1/auth/google?redirect=participant&joinPlatform=participant&redirect=${encodeURIComponent(redirectUrl)}`;
    } else if (provider === 'kakao') {
      window.location.href = `http://api.hence.events/api/v1/auth/kakao?redirect=participant&joinPlatform=participant&redirect=${encodeURIComponent(redirectUrl)}`;
    } else {
      showToast('지원하지 않는 소셜 로그인입니다.', 'error');
    }
  };

  const performDeleteAccount = async (externalToken?: string) => {
    setIsDeleting(true);
    try {
      let result;
      
      if (externalToken) {
        // 이메일 계정: external_token으로 회원탈퇴
        result = await deleteAccountWithToken(externalToken);
      } else {
        // 소셜 로그인: 기존 방식으로 회원탈퇴
        result = await deleteAccount();
      }
      
      if (result.success) {
        showToast('회원탈퇴가 완료되었습니다.', 'success');
        logout();
        navigate("/sign");
      } else {
        showToast(result.error || '회원탈퇴에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('회원탈퇴 오류:', error);
      showToast('회원탈퇴 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // 로딩 상태 또는 인증되지 않은 상태
  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>
            {authLoading ? '인증 확인 중...' : '인증이 필요합니다.'}
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
          title="회원탈퇴"
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
          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6" style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            {/* 회원탈퇴 아이콘 */}
            <div className="flex justify-center mb-8">
              <img 
                src="/images/icon_withdraw.png"
                alt="회원탈퇴 아이콘"
                className="w-24 h-24"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            
            {/* 경고 섹션 */}
            <div className="mb-8">
              <div className="bg-white py-4 mb-6">
                <div className="flex items-center mb-3">
                  <h2 className="text-lg font-bold text-red-700">회원탈퇴 주의사항</h2>
                </div>
                <p className="text-sm text-red-600 mb-3">
                  회원탈퇴 시 다음 사항을 확인해주세요:
                </p>
                <ul className="text-sm text-red-600 space-y-2">
                  <li>• 모든 개인정보가 영구적으로 삭제됩니다</li>
                  <li>• 참여한 이벤트 정보가 모두 삭제됩니다</li>
                  <li>• 작성한 게시글과 댓글이 모두 삭제됩니다</li>
                  <li>• 이 작업은 되돌릴 수 없습니다</li>
                </ul>
              </div>
            </div>

            {/* 계정 정보 확인 */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-black mb-4">탈퇴할 계정 정보</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">
                    {user?.provider?.toLowerCase() === 'email' || user?.provider === 'EMAIL' ? '이메일' : '연결된 서비스'}
                  </span>
                  {user?.provider?.toLowerCase() === 'email' || user?.provider === 'EMAIL' ? (
                    <span className="text-sm text-black">{user.email || '이메일 정보 없음'}</span>
                  ) : (
                    <div className="flex items-center">
                      <img 
                        src={`/images/icon_${user?.provider?.toLowerCase()}.png`}
                        alt={`${user?.provider?.toLowerCase()} 아이콘`}
                        className="w-5 h-5 mr-2"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-sm text-black">
                        {user?.provider?.toLowerCase() === 'naver' ? '네이버' : 
                         user?.provider?.toLowerCase() === 'google' ? '구글' : 
                         user?.provider?.toLowerCase() === 'kakao' ? '카카오' : 
                         user?.provider}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">닉네임</span>
                  <span className="text-sm text-black">{user?.nickname || '닉네임 정보 없음'}</span>
                </div>
              </div>
            </div>

            {/* 이메일 계정인 경우 로그인 필드 */}
            {(user?.provider?.toLowerCase() === 'email' || user?.provider === 'EMAIL') && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-black mb-4">로그인 확인</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">이메일</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일을 입력하세요"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">비밀번호</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:border-red-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleDeleteAccount();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 회원탈퇴 버튼 */}
            <div className="mb-4">
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || isVerifying}
                className={`w-full py-3 rounded-lg font-bold text-md transition-colors ${
                  isDeleting || isVerifying
                    ? 'bg-red-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                }`}
              >
                <div className="text-white">
                  {isDeleting ? "회원탈퇴 처리 중..." : 
                   isVerifying ? "로그인 확인 중..." : "회원탈퇴"}
                </div>
              </button>
            </div>

            {/* 취소 버튼 */}
            <div>
              <button
                onClick={handleBackClick}
                disabled={isDeleting}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  isDeleting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                취소
              </button>
            </div>

            {/* 하단 여백 */}
            <div style={{ height: 'env(safe-area-inset-bottom)' }}></div>
          </div>
        </main>
      </div>


    </div>
  );
}
