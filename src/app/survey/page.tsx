"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";

export default function SurveyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    satisfaction: "",
    favoriteActivity: "",
    improvement: "",
    email: "",
    agreeToContact: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBackClick = () => {
    router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.satisfaction || !formData.favoriteActivity || !formData.email || !formData.agreeToContact) {
      showToast("모든 필수 항목을 입력해주세요.", "warning");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 실제 설문 제출 API 호출 (추후 구현)
      // const result = await submitSurvey(formData);
      
      // 임시로 성공 처리
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showToast("설문조사가 완료되었습니다! 커피 쿠폰을 이메일로 발송해드리겠습니다.", "success");
      
      // 홈페이지로 이동
      setTimeout(() => {
        router.push("/");
      }, 2000);
      
    } catch (error) {
      showToast("설문 제출 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-white text-black overflow-hidden">
      {/* 최대 너비 제한 컨테이너 */}
      <div className="w-full max-w-[700px] mx-auto h-full flex flex-col overflow-hidden">
        {/* 네비게이션바 */}
        <CommonNavigationBar
          title="설문조사"
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
        <main className="flex-1 overflow-y-auto scrollbar-hide" style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div className="px-4 py-6">
            {/* 헤더 섹션 */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <img 
                  src="/images/icon_coffee.png" 
                  alt="커피 아이콘" 
                  className="w-20 h-20 mx-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <h1 className="text-2xl font-bold text-black mb-2">
                횃불제 만족도 설문조사
              </h1>
              <p className="text-gray-600 text-base">
                설문 완료 시 커피 쿠폰을 이메일로 발송해드립니다! ☕
              </p>
            </div>

            {/* 설문 폼 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. 전반적인 만족도 */}
              <div>
                <label className="block text-black text-lg font-semibold mb-3">
                  1. 횃불제 전반적인 만족도는 어떠신가요? *
                </label>
                <div className="space-y-2">
                  {[
                    { value: "매우 만족", label: "매우 만족" },
                    { value: "만족", label: "만족" },
                    { value: "보통", label: "보통" },
                    { value: "불만족", label: "불만족" },
                    { value: "매우 불만족", label: "매우 불만족" }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="satisfaction"
                        value={option.value}
                        checked={formData.satisfaction === option.value}
                        onChange={(e) => setFormData({...formData, satisfaction: e.target.value})}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className="text-black">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. 가장 즐거웠던 활동 */}
              <div>
                <label className="block text-black text-lg font-semibold mb-3">
                  2. 가장 즐거웠던 활동은 무엇인가요? *
                </label>
                <div className="space-y-2">
                  {[
                    { value: "동아리 공연", label: "동아리 공연" },
                    { value: "푸드트럭", label: "푸드트럭" },
                    { value: "게임/이벤트", label: "게임/이벤트" },
                    { value: "친구들과의 시간", label: "친구들과의 시간" },
                    { value: "기타", label: "기타" }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="favoriteActivity"
                        value={option.value}
                        checked={formData.favoriteActivity === option.value}
                        onChange={(e) => setFormData({...formData, favoriteActivity: e.target.value})}
                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className="text-black">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. 개선사항 */}
              <div>
                <label className="block text-black text-lg font-semibold mb-3">
                  3. 다음 횃불제에서 개선되었으면 하는 점이 있나요?
                </label>
                <textarea
                  value={formData.improvement}
                  onChange={(e) => setFormData({...formData, improvement: e.target.value})}
                  placeholder="의견을 자유롭게 작성해주세요..."
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>

              {/* 4. 이메일 입력 */}
              <div>
                <label className="block text-black text-lg font-semibold mb-3">
                  4. 커피 쿠폰을 받을 이메일 주소를 입력해주세요. *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 bg-gray-100 rounded-xl text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* 5. 개인정보 동의 */}
              <div>
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreeToContact}
                    onChange={(e) => setFormData({...formData, agreeToContact: e.target.checked})}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-1"
                  />
                  <span className="text-black text-sm">
                    커피 쿠폰 발송을 위한 개인정보 수집 및 이용에 동의합니다. *
                    <br />
                    <span className="text-gray-500 text-xs">
                      (수집항목: 이메일 주소, 수집목적: 커피 쿠폰 발송, 보유기간: 쿠폰 발송 후 즉시 삭제)
                    </span>
                  </span>
                </label>
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 rounded-xl font-bold text-white transition-colors"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    제출 중...
                  </div>
                ) : (
                  "설문 제출하기"
                )}
              </button>
            </form>

            {/* 안내 메시지 */}
            <div className="mt-8 p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <h3 className="text-purple-900 font-semibold text-sm mb-1">커피 쿠폰 안내</h3>
                  <p className="text-purple-700 text-sm">
                    설문 완료 후 3-5일 내에 입력하신 이메일로 커피 쿠폰을 발송해드립니다.
                    <br />
                    쿠폰은 스타벅스, 투썸플레이스, 할리스 등 주요 커피 체인점에서 사용 가능합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
