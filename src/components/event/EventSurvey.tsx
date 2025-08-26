"use client";

import { useState, useEffect } from "react";
import { useSimpleNavigation } from "@/utils/navigation";
import { useToast } from "@/components/common/Toast";
import { submitSurvey } from "@/lib/api";
import { SurveyData, SurveyQuestion } from "@/types/api";
import EventSection from "@/components/event/EventSection";

interface EventSurveyProps {
  eventId?: string;
  surveyData?: SurveyData;
}

export default function EventSurvey({ eventId, surveyData }: EventSurveyProps) {
  const { navigate } = useSimpleNavigation();
  const { showToast } = useToast();
  
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Featured API에서 받은 설문 응답 상태 설정
  useEffect(() => {
    if (surveyData) {
      setHasSubmitted(surveyData.hasResponded);
    }
  }, [surveyData]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    // 서버에서 기대하는 형식: q1, q2, q3...
    const questionNumber = questionId.split('-')[0]; // "q1-001" -> "q1"
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!eventId) {
      showToast("이벤트 정보를 찾을 수 없습니다.", "error");
      return;
    }

    // 필수 질문 확인
    const requiredQuestions = surveyData?.survey.questions.filter(q => q.isRequired) || [];
    const missingAnswers = requiredQuestions.filter(q => {
      const questionNumber = q.id.split('-')[0]; // "q1-001" -> "q1"
      return !answers[questionNumber];
    });
    
    if (missingAnswers.length > 0) {
      showToast("모든 필수 질문에 답변해주세요.", "warning");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 실제 설문 제출 API 호출
      const result = await submitSurvey(eventId, answers, surveyData?.survey?.id);
      
      if (result.success) {
        showToast("설문조사가 완료되었습니다! 소중한 의견 감사합니다.", "success");
        // 설문 완료 후 상태 업데이트
        setHasSubmitted(true);
        setAnswers({});
      } else {
        showToast(result.error || "설문 제출 중 오류가 발생했습니다.", "error");
      }
      
    } catch (error) {
      showToast("설문 제출 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 설문 데이터가 없으면 표시하지 않음
  if (!surveyData?.survey) {
    return null;
  }

  // 이미 설문을 제출한 경우 아무것도 표시하지 않음
  if (hasSubmitted) {
    return null;
  }

  // 설문 폼
  return (
    <EventSection
      title="설문조사"
      subtitle="더 나은 서비스가 될 수 있도록 도와주세요!"
    >
      <div className="px-4 mb-12">
        <div className="relative overflow-hidden bg-white rounded-xl border border-gray-100 transition-all duration-300">
          <div className="relative px-4 py-6">
            {/* 질문들 */}
            {surveyData.survey.questions
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((question, index) => (
                <div key={question.id} className="bg-white rounded-xl p-4 mb-4">
                  <div className="mb-3">
                    <h3 className="text-purple-700 font-bold text-base mb-1">Q{index + 1}.</h3>
                    <p className="text-black text-sm">{question.questionText}</p>
                  </div>
                  
                  {question.questionType === 'multiple_choice' && question.options && (
                    <div className="grid grid-cols-2 gap-2">
                      {question.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleAnswerSelect(question.id, option)}
                          className={`p-3 rounded-lg text-center transition-all duration-200 text-sm ${
                            answers[question.id.split('-')[0]] === option
                              ? 'bg-purple-600 text-white'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {question.questionType === 'yes_no' && question.options && (
                    <div className="grid grid-cols-2 gap-3">
                      {question.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleAnswerSelect(question.id, option)}
                          className={`p-4 rounded-lg text-center transition-all duration-200 ${
                            answers[question.id.split('-')[0]] === option
                              ? 'bg-purple-600 text-white'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                          }`}
                        >
                          <div className="text-2xl font-bold mb-1">
                            {option === '네' ? 'O' : 'X'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            {/* 제출 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 rounded-xl font-bold text-white transition-colors text-md"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  제출 중...
                </div>
              ) : (
                "설문 제출하기"
              )}
            </button>

          </div>
        </div>
      </div>
    </EventSection>
  );
}
