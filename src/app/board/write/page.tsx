"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CommonNavigationBar from "@/components/CommonNavigationBar";

export default function BoardWritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 이벤트 ID 가져오기
  const eventId = searchParams.get('eventId') || 'default-event';

  const handleBackClick = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // TODO: 글쓰기 API 호출
      console.log('글쓰기 제출:', {
        eventId,
        content: content.trim()
      });

      // 임시로 성공 처리
      alert('글이 작성되었습니다.');
      router.back();
      
    } catch (error) {
      console.error('글쓰기 오류:', error);
      alert('글쓰기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (content.trim()) {
      if (confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <CommonNavigationBar 
        title="글쓰기"
        leftButton={
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        rightButton={
          <div
            onClick={handleSubmit}
            className={`text-sm font-medium transition-colors cursor-pointer ${
              isSubmitting || !content.trim()
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-purple-400 hover:text-purple-300'
            }`}
          >
            {isSubmitting ? '작성 중...' : '완료'}
          </div>
        }
        onLeftClick={handleCancel}
      />
      
      <div className="p-4 pt-6">
        {/* 글쓰기 폼 */}
        <div className="space-y-4">
          {/* 내용 입력 */}
          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <textarea
              placeholder="무엇을 공유하고 싶으신가요?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent border-none outline-none resize-none text-white text-lg placeholder-white placeholder-opacity-60 min-h-48"
              style={{ 
                color: 'white',
                opacity: 0.9
              }}
            />
          </div>

          {/* 이미지 업로드 버튼 (향후 구현) */}
          <div className="bg-white bg-opacity-5 rounded-lg p-4">
            <button className="flex items-center space-x-2 text-white text-opacity-60 hover:text-opacity-80 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>이미지 추가</span>
            </button>
          </div>

          {/* 글쓰기 가이드라인 */}
          <div className="bg-purple-900 bg-opacity-20 rounded-lg p-4 border border-purple-500 border-opacity-30">
            <h3 className="text-sm font-semibold text-purple-300 mb-2">글쓰기 가이드라인</h3>
            <ul className="text-xs text-white text-opacity-70 space-y-1">
              <li>• 다른 참여자들을 배려하는 마음으로 작성해주세요</li>
              <li>• 욕설, 비방, 스팸은 금지됩니다</li>
              <li>• 개인정보나 민감한 정보는 포함하지 마세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 