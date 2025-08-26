"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";

function SurveyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  
  const [answers, setAnswers] = useState({
    q1: "",
    q2: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBackClick = () => {
    router.back();
  };

  const handleAnswerSelect = (question: 'q1' | 'q2', answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!answers.q1 || !answers.q2) {
      showToast("모든 질문에 답변해주세요.", "warning");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 실제 설문 제출 API 호출 (추후 구현)
      // const result = await submitSurvey(answers);
      
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
    <div className="fixed inset-0 w-full h-full bg-purple-100 text-black overflow-hidden">
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
          backgroundColor="transparent"
          backgroundOpacity={1}
          textColor="text-black"
          sticky={true}
          fixedHeight={true}
        />

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6" style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom))'
        }}>
          
          {/* Q1 카드 */}
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-purple-700 font-bold text-lg mb-2">Q1.</h2>
              <p className="text-black text-base">오늘 어떤 기능이 가장 편리했나요?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "쿠폰", label: "쿠폰" },
                { value: "경품응모", label: "경품응모" },
                { value: "푸드트럭", label: "푸드트럭" },
                { value: "기타", label: "기타" }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswerSelect('q1', option.value)}
                  className={`p-4 rounded-lg text-center transition-all duration-200 ${
                    answers.q1 === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q2 카드 */}
          <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-purple-700 font-bold text-lg mb-2">Q2.</h2>
              <p className="text-black text-base">HENCE를 다른 축제나 행사에도 추천 하나요?</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAnswerSelect('q2', '네')}
                className={`p-6 rounded-lg text-center transition-all duration-200 ${
                  answers.q2 === '네'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <div className="text-3xl font-bold mb-2">O</div>
                <div className="text-base font-medium">네</div>
              </button>
              
              <button
                onClick={() => handleAnswerSelect('q2', '아니오')}
                className={`p-6 rounded-lg text-center transition-all duration-200 ${
                  answers.q2 === '아니오'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <div className="text-3xl font-bold mb-2">X</div>
                <div className="text-base font-medium">아니오</div>
              </button>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !answers.q1 || !answers.q2}
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

          {/* 안내 메시지 */}
          <div className="mt-6 p-4 bg-white rounded-xl border border-purple-200">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <div>
                <h3 className="text-purple-900 font-semibold text-sm mb-1">커피 쿠폰 안내</h3>
                <p className="text-purple-700 text-sm">
                  설문 완료 후 3-5일 내에 입력하신 이메일로 커피 쿠폰을 발송해드립니다.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function SurveyPageLoading() {
  return (
    <div className="fixed inset-0 w-full h-full bg-purple-100 text-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">설문 페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function SurveyPage() {
  return (
    <Suspense fallback={<SurveyPageLoading />}>
      <SurveyPageContent />
    </Suspense>
  );
}
