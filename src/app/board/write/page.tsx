"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonActionSheet from "@/components/CommonActionSheet";
import { createPost } from "@/lib/api";
import { useSimpleNavigation } from "@/utils/navigation";
import { useToast } from "@/components/common/Toast";

function BoardWriteContent() {
  const { navigate, goBack, replace } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

  // 이벤트 ID와 게시판 타입 가져오기
  const eventId = searchParams.get('eventId') || 'default-event';
  const boardType = searchParams.get('type') || 'free';

  const handleBackClick = () => {
    goBack();
  };

  const handleSubmit = async () => {
    if (boardType === 'notice' && !title.trim()) {
      showToast('제목을 입력해주세요.', 'warning');
      return;
    }
    
    if (!content.trim()) {
      showToast('내용을 입력해주세요.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      

      
      // 글쓰기 API 호출
      const result = await createPost(
        eventId,
        boardType, // board_type을 동적으로 설정
        boardType === 'notice' ? title.trim() : null, // 공지사항은 별도 제목 사용
        content.trim(),
        images
      );
      


      if (result.success) {
        // 글 리스트 페이지로 이동 (히스토리에서 글쓰기 페이지 제거)
        replace(`/board/list?type=${boardType}&eventId=${eventId}`);
              } else {
          // 인증 오류인 경우 로그인 페이지로 리다이렉트
          if (result.error?.includes('인증') || result.error?.includes('토큰') || result.error?.includes('로그인')) {
            showToast('로그인이 필요합니다.', 'warning');
            // 로그인 후 글 리스트 페이지로 돌아가도록 redirect 설정
            const redirectUrl = `/board/list?type=${boardType}&eventId=${eventId}`;
            navigate(`/sign?redirect=${encodeURIComponent(redirectUrl)}`);
          } else {
            showToast(result.error || '글쓰기에 실패했습니다. 다시 시도해주세요.', 'error');
          }
        }
      
    } catch (error) {
      showToast('글쓰기에 실패했습니다. 다시 시도해주세요.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // 파일 검증 (크기 초과 시 자동 압축)
      const validFiles = files.filter(file => {
        // 파일 형식 확인
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          showToast(`${file.name}: 지원하지 않는 파일 형식입니다.`, 'warning');
          return false;
        }

        // 파일 크기 확인 (큰 파일은 WebP로 자동 변환)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          showToast(`${file.name}: 파일이 5MB를 초과합니다. WebP로 변환됩니다.`, 'info');
        }

        return true;
      });

      if (validFiles.length === 0) return;

      // 개수 제한 확인
      if (images.length + validFiles.length > 5) {
        showToast('이미지는 최대 5개까지 업로드할 수 있습니다.', 'warning');
        return;
      }

      const newImages = [...images, ...validFiles];
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

  // 카메라 지원 여부 확인
  const checkCameraSupport = async () => {
    if (hasCamera !== null) {
      return hasCamera; // 이미 확인된 경우 캐시된 값 반환
    }

    try {
      // 카메라 접근 권한 확인
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // 스트림 정리
      setHasCamera(true);
      return true;
    } catch (error) {
      setHasCamera(false);
      return false;
    }
  };

  const handleCancel = () => {
    if (content.trim() || title.trim() || images.length > 0) {
      if (confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
        // 이미지 URL 정리
        imageUrls.forEach(url => URL.revokeObjectURL(url));
        // handleBackClick 로직 실행
        handleBackClick();
      }
    } else {
      // handleBackClick 로직 실행
      handleBackClick();
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-white text-black flex flex-col overflow-hidden">
      <CommonNavigationBar 
        title="글쓰기"
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
        rightButton={null}
        onLeftClick={handleCancel}
        backgroundColor="white"
        backgroundOpacity={1}
        textColor="text-black"
      />
      
      <div className="flex flex-col flex-1 px-4 min-h-0">
          {/* 제목 입력 영역 (공지사항일 때만) */}
          {boardType === 'notice' && (
            <div className="flex-shrink-0 pt-4 pb-6">
              <input
                type="text"
                placeholder="공지사항 제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-black text-xl font-bold"
                style={{ 
                  color: 'black'
                }}
                maxLength={100}
              />
            </div>
          )}
          
          {/* 텍스트 입력 영역 - 남은 공간 채움 */}
          <div className="flex-1 min-h-0">
            <textarea
              placeholder={boardType === 'notice' ? "공지사항 내용을 입력하세요..." : "무슨 소식을 올리실건가요?"}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent border-none outline-none resize-none text-black text-lg board-write-textarea h-full"
              style={{ 
                color: 'black'
              }}
            />
          </div>

          {/* 이미지 업로드 영역 - 하단 고정 */}
          <div className="flex-shrink-0 pb-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom) + 12px)' }}>
            {/* 이미지 미리보기 */}
            {imageUrls.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <div className="w-20 h-20 rounded-lg overflow-hidden" style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}>
                        <img
                          src={url}
                          alt={`이미지 ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center hidden">
                          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      </div>
                      <button
                        onClick={() => handleImageRemove(index)}
                        className="absolute -top-1 -right-1 w-6 h-6 text-white rounded-full flex items-center justify-center text-sm transition-colors"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.8)'
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
            <div className="bg-gray-100 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={async () => {
                      const cameraSupported = await checkCameraSupport();
                      if (cameraSupported) {
                        setShowActionSheet(true);
                      } else {
                        handleImageLibrary();
                      }
                    }}
                    className="relative text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                  >
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </button>
                  
                  {/* 이미지 업로드 정보 */}
                  <div className="text-xs text-gray-500">
                    <div>최대 5개, WebP로 자동 변환</div>
                    <div>지원 형식: JPG, PNG, GIF, WebP</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {content.length}/1000
                  </span>
                  <button
                    onClick={handleSubmit}
                    className={`text-md font-semibold transition-all duration-200 px-6 py-3 rounded-lg ${
                      isSubmitting || !content.trim()
                        ? 'text-gray-400 cursor-not-allowed bg-gray-300'
                        : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? '작성 중...' : (boardType === 'notice' ? '공지 등록' : '올리기')}
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
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">글쓰기 페이지를 불러오는 중...</p>
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