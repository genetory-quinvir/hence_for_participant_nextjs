"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonActionSheet from "@/components/CommonActionSheet";
import { createPost } from "@/lib/api";

function BoardWriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);

  // 이벤트 ID 가져오기
  const eventId = searchParams.get('eventId') || 'default-event';

  // 카메라 지원 여부 확인
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        // 카메라 접근 권한 확인
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // 스트림 정리
        setHasCamera(true);
      } catch (error) {
        console.log('카메라를 지원하지 않거나 권한이 없습니다:', error);
        setHasCamera(false);
      }
    };

    checkCameraSupport();
  }, []);

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
      
      // 글쓰기 API 호출
      const result = await createPost(
        eventId,
        'free', // board_type은 free로 고정
        null,   // title은 null (자유게시판은 제목 없음)
        content.trim(),
        images
      );

      if (result.success) {
        alert('글이 작성되었습니다.');
        // 글 리스트 페이지로 이동 (히스토리에서 글쓰기 페이지 제거)
        router.replace(`/board/list?type=free&eventId=${eventId}`);
      } else {
        // 인증 오류인 경우 로그인 페이지로 리다이렉트
        if (result.error?.includes('인증') || result.error?.includes('토큰') || result.error?.includes('로그인')) {
          alert('로그인이 필요합니다.');
          // 로그인 후 글 리스트 페이지로 돌아가도록 redirect 설정
          const redirectUrl = `/board/list?type=free&eventId=${eventId}`;
          router.push(`/sign?redirect=${encodeURIComponent(redirectUrl)}`);
        } else {
          alert(result.error || '글쓰기에 실패했습니다. 다시 시도해주세요.');
        }
      }
      
    } catch (error) {
      console.error('글쓰기 오류:', error);
      alert('글쓰기에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newImages = [...images, ...files].slice(0, 5); // 최대 5개까지
      setImages(newImages);
      
      // 이미지 URL 생성
      const newUrls = newImages.map(file => URL.createObjectURL(file));
      setImageUrls(newUrls);
    }
  };

  const handleImageLibrary = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        handleImageSelect({ target } as React.ChangeEvent<HTMLInputElement>);
      }
    };
    input.click();
    setShowActionSheet(false);
  };

  const handleCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        handleImageSelect({ target } as React.ChangeEvent<HTMLInputElement>);
      }
    };
    input.click();
    setShowActionSheet(false);
  };

  const handleImageRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setImageUrls(newUrls);
  };

  const handleCancel = () => {
    if (content.trim() || images.length > 0) {
      if (confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
        // 이미지 URL 정리
        imageUrls.forEach(url => URL.revokeObjectURL(url));
        // 글 리스트 페이지로 이동
        router.push(`/board/list?type=free&eventId=${eventId}`);
      }
    } else {
      // 글 리스트 페이지로 이동
      router.push(`/board/list?type=free&eventId=${eventId}`);
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
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
        rightButton={null}
        onLeftClick={handleCancel}
      />
      
      <div className="flex flex-col flex-1">
        {/* 텍스트 입력 영역 - 남은 공간 채움 */}
        <div className="flex-1 p-4 pt-6">
          <div className="bg-black bg-opacity-20 rounded-lg p-4 h-full">
            <textarea
              placeholder="무슨 소식을 올리실건가요?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent border-none outline-none resize-none text-white text-lg board-write-textarea h-full"
              style={{ 
                color: 'white'
              }}
            />
          </div>
        </div>

        {/* 이미지 업로드 영역 - 하단 고정 */}
        <div className="flex-shrink-0 p-4 pb-6">
          {/* 이미지 미리보기 */}
          {imageUrls.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`이미지 ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleImageRemove(index)}
                      className="absolute -top-1 -right-1 w-6 h-6 text-white rounded-full flex items-center justify-center text-sm transition-colors"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 이미지 업로드 */}
          <div className="bg-black bg-opacity-20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (hasCamera) {
                    setShowActionSheet(true);
                  } else {
                    handleImageLibrary();
                  }
                }}
                className="relative text-white text-opacity-60 hover:text-opacity-80 transition-colors cursor-pointer"
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </button>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-white text-opacity-60">
                  {content.length}/1000
                </span>
                <button
                  onClick={handleSubmit}
                  className={`text-md font-medium transition-all duration-200 px-6 py-3 rounded-lg ${
                    isSubmitting || !content.trim()
                      ? 'text-gray-400 cursor-not-allowed bg-gray-600'
                      : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                  }`}
                >
                  {isSubmitting ? '작성 중...' : '올리기'}
                </button>
              </div>
            </div>
          </div>

          {/* 액션시트 */}
          <CommonActionSheet
            isOpen={showActionSheet}
            onClose={() => setShowActionSheet(false)}
            items={[
              {
                label: "이미지 라이브러리에서 선택",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                onClick: handleImageLibrary
              },
              {
                label: "카메라로 촬영",
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                onClick: handleCamera
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function BoardWriteLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>글쓰기 페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function BoardWritePage() {
  return (
    <Suspense fallback={<BoardWriteLoading />}>
      <BoardWriteContent />
    </Suspense>
  );
}