"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { BoardItem } from "@/types/api";
import { getBoardDetail, updateBoard, getAccessToken } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonActionSheet from "@/components/CommonActionSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleNavigation } from "@/utils/navigation";
import { useToast } from "@/components/common/Toast";

function BoardEditContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { navigate, goBack, replace } = useSimpleNavigation();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [post, setPost] = useState<BoardItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  
  // 폼 상태
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);

  // URL에서 타입과 이벤트 ID 확인
  const postType = searchParams.get('type') || 'free';
  const eventId = searchParams.get('eventId') || 'default-event';
  const postId = params.id as string;

  // 게시글 데이터 로드
  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 로그인 상태 확인
        const accessToken = getAccessToken();
        if (!accessToken) {
          showToast('로그인이 필요합니다. 로그인 페이지로 이동합니다.', 'warning');
          const currentUrl = window.location.pathname + window.location.search;
          navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
          return;
        }
        
        // API 호출
        const result = await getBoardDetail(eventId, postType, postId);
        
        if (result.success && result.data) {
          const postData = result.data;
          
          // 본인이 작성한 글인지 확인
          if (user && postData.user?.id !== user.id) {
            showToast('본인이 작성한 글만 수정할 수 있습니다.', 'error');
            goBack();
            return;
          }
          
          setPost(postData);
          setContent(postData.content || "");
          setExistingImages(postData.images || []);
          setImageUrls(postData.images || []);
        } else {
          setError(result.error || "게시글을 불러오는데 실패했습니다.");
        }
      } catch (err) {
        console.error("게시글 로드 오류:", err);
        setError("게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPostDetail();
    }
  }, [params.id, postType, eventId, user]);

  // 이미지 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const currentImageCount = existingImages.length - removedImages.length + images.length;
      const newImages = [...images, ...files].slice(0, 5 - currentImageCount); // 최대 5개까지
      setImages(newImages);
      
      // 이미지 URL 생성
      const newUrls = newImages.map(file => URL.createObjectURL(file));
      setImageUrls(prev => [...prev, ...newUrls]);
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

  // 이미지 제거
  const handleImageRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImages(newImages);
    setImageUrls(newUrls);
  };

  // 기존 이미지 제거
  const handleRemoveExistingImage = (imageUrl: string) => {
    setRemovedImages(prev => [...prev, imageUrl]);
    setImageUrls(prev => prev.filter(url => url !== imageUrl));
  };

  // 카메라 지원 여부 확인
  const checkCameraSupport = async () => {
    if (hasCamera !== null) {
      return hasCamera;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasCamera(true);
      return true;
    } catch (error) {
      console.log('카메라를 지원하지 않거나 권한이 없습니다:', error);
      setHasCamera(false);
      return false;
    }
  };

  // 폼 제출
  const handleSubmit = async () => {
    if (!content.trim()) {
      showToast('내용을 입력해주세요.', 'warning');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // TODO: 이미지 업로드 API 호출
      const finalImages = [...existingImages.filter(img => !removedImages.includes(img))];
      
      const updateData = {
        content: content.trim(),
        images: finalImages
      };
      
      const result = await updateBoard(eventId, postType, postId, updateData);
      
      if (result.success) {
        showToast('게시글이 수정되었습니다.', 'success');
        replace(`/board/${postId}?type=${postType}&eventId=${eventId}`);
      } else {
        if (result.error?.includes('로그인이 만료')) {
          showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
          const currentUrl = window.location.pathname + window.location.search;
          navigate(`/sign?redirect=${encodeURIComponent(currentUrl)}`);
        } else {
          showToast(result.error || '게시글 수정에 실패했습니다.', 'error');
        }
      }
    } catch (error) {
      console.error('게시글 수정 오류:', error);
      showToast('게시글 수정 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (content.trim() !== (post?.content || "") || images.length > 0 || removedImages.length > 0) {
      if (confirm('수정 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
        // 이미지 URL 정리
        images.forEach((_, index) => {
          const url = imageUrls[existingImages.length + index];
          if (url) URL.revokeObjectURL(url);
        });
        goBack();
      }
    } else {
      goBack();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black text-white flex flex-col overflow-hidden">
        <CommonNavigationBar 
          title="게시글 수정"
          leftButton={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleCancel}
          backgroundColor="black"
          backgroundOpacity={1}
          textColor="text-white"
        />
        <div className="flex items-center justify-center flex-1">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="fixed inset-0 w-full h-full bg-black text-white flex flex-col overflow-hidden">
        <CommonNavigationBar 
          title="게시글 수정"
          leftButton={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleCancel}
          backgroundColor="black"
          backgroundOpacity={1}
          textColor="text-white"
        />
        <div className="flex items-center justify-center flex-1">
          <div className="text-lg text-red-400">{error || "게시글을 찾을 수 없습니다."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white flex flex-col overflow-hidden">
      <CommonNavigationBar 
        title="게시글 수정"
        leftButton={
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        rightButton={null}
        onLeftClick={handleCancel}
        backgroundColor="black"
        backgroundOpacity={1}
        textColor="text-white"
      />
      
      <div className="flex flex-col flex-1 px-4 min-h-0">
        {/* 텍스트 입력 영역 - 남은 공간 채움 */}
        <div className="flex-1 min-h-0">
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

        {/* 이미지 업로드 영역 - 하단 고정 */}
        <div className="flex-shrink-0 pb-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom) + 12px)' }}>
          {/* 이미지 미리보기 */}
          {imageUrls.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <div className="w-20 h-20 rounded-lg overflow-hidden" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
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
                      onClick={() => {
                        if (index < existingImages.length) {
                          handleRemoveExistingImage(url);
                        } else {
                          handleImageRemove(index - existingImages.length);
                        }
                      }}
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
          <div className="bg-black bg-opacity-20 rounded-lg">
            <div className="flex items-center justify-between">
              <button
                onClick={async () => {
                  const cameraSupported = await checkCameraSupport();
                  if (cameraSupported) {
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
                  className={`text-md font-semibold transition-all duration-200 px-6 py-3 rounded-lg ${
                    isSubmitting || !content.trim()
                      ? 'text-gray-400 cursor-not-allowed bg-gray-600'
                      : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                  }`}
                >
                  {isSubmitting ? '수정 중...' : '수정하기'}
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
function BoardEditLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>게시글을 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function BoardEditPage() {
  return (
    <Suspense fallback={<BoardEditLoading />}>
      <BoardEditContent />
    </Suspense>
  );
} 