"use client";

import { useSimpleNavigation } from "@/utils/navigation";

interface EventSurveyProps {
  eventId?: string;
}

export default function EventSurvey({ eventId }: EventSurveyProps) {
  const { navigate } = useSimpleNavigation();

  const handleSurveyClick = () => {
    navigate("/survey");
  };

  return (
    <div className="px-4 mb-12">
      <div className="relative overflow-hidden bg-white rounded-xl border border-gray-100 transition-all duration-300 group">
        <div className="relative p-6">
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-black font-bold text-xl mb-4 leading-tight">
                횃불제 만족도 설문조사
              </h3>
              <div className="flex justify-center mb-6">
                <img 
                  src="/images/icon_survey.png" 
                  alt="설문조사 아이콘" 
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
            
            {/* 참여하기 버튼 */}
            <button
              onClick={handleSurveyClick}
              className="bg-purple-700 hover:bg-purple-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <span className="flex items-center space-x-2">
                <span>설문참여하고 커피쿠폰 받기</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
