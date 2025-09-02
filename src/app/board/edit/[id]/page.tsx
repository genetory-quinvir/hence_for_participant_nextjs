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
import { resizeImages, isSupportedImageFormat, getFileSizeInMB } from "@/utils/imageResizer";

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
        // 기존 이미지가 있으면 그대로, 없으면 빈 배열로 초기화
        setImageUrls(postData.images || []);
        
        console.log('📝 게시글 데이터 로드 완료:', {
          content: postData.content,
          existingImages: postData.images || [],
          imageUrls: postData.images || []
        });
        } else {
          setError(result.error || "게시글을 불러오는데 실패했습니다.");
        }
      } catch (err) {
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
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('📁 선택된 파일들:', files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    if (files.length > 0) {
      // 파일 검증
      const validFiles = files.filter(file => {
        if (!isSupportedImageFormat(file)) {
          showToast(`${file.name}: 지원하지 않는 파일 형식입니다.`, 'warning');
          return false;
        }
        return true;
      });

      console.log('✅ 유효한 파일들:', validFiles.map(f => f.name));

      if (validFiles.length === 0) return;

      // 개수 제한 확인
      const currentImageCount = existingImages.length - removedImages.length + images.length;
      if (currentImageCount + validFiles.length > 5) {
        showToast('이미지는 최대 5개까지 업로드할 수 있습니다.', 'warning');
        return;
      }

      try {
        console.log('🔄 이미지 리사이징 시작...');
        
        // 타임아웃 설정 (20초)
        const resizePromise = resizeImages(validFiles, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.8,
          format: 'webp'
        });
        
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('리사이징 타임아웃')), 20000);
        });
        
        const resizedImages = await Promise.race([resizePromise, timeoutPromise]) as File[];

        console.log('✅ 리사이징 완료:', resizedImages.map(f => f.name));

        // 리사이징 결과 로깅
        validFiles.forEach((originalFile, index) => {
          const resizedFile = resizedImages[index];
          const originalSize = getFileSizeInMB(originalFile);
          const resizedSize = getFileSizeInMB(resizedFile);
          console.log(`📸 이미지 리사이징: ${originalFile.name}`, {
            original: `${originalSize.toFixed(2)}MB`,
            resized: `${resizedSize.toFixed(2)}MB`,
            reduction: `${((originalSize - resizedSize) / originalSize * 100).toFixed(1)}%`
          });
        });

        const newImages = [...images, ...resizedImages];
        console.log('📋 새로운 이미지 배열:', newImages.map(f => f.name));
        setImages(newImages);
        
        // 이미지 URL 생성
        const newUrls = newImages.map(file => URL.createObjectURL(file));
        console.log('🔗 생성된 URL 개수:', newUrls.length);
        
        // 기존 이미지와 새 이미지 URL을 합쳐서 설정
        const remainingExistingImages = existingImages.filter(img => !removedImages.includes(img));
        const finalImageUrls = [...remainingExistingImages, ...newUrls];
        
        console.log('🖼️ 최종 이미지 URL 구성:', {
          remainingExistingImages: remainingExistingImages.length,
          newUrls: newUrls.length,
          finalImageUrls: finalImageUrls.length
        });
        
        setImageUrls(finalImageUrls);
        
        console.log('✅ 이미지 추가 완료');
      } catch (error) {
        console.error('❌ 이미지 리사이징 실패:', error);
        showToast('이미지 리사이징에 실패했습니다. 원본 파일을 사용합니다.', 'warning');
        
        // 리사이징 실패 시 원본 파일 사용
        console.log('🔄 원본 파일로 대체...');
        const newImages = [...images, ...validFiles];
        setImages(newImages);
        const newUrls = newImages.map(file => URL.createObjectURL(file));
        
        // 기존 이미지와 새 이미지 URL을 합쳐서 설정
        const remainingExistingImages = existingImages.filter(img => !removedImages.includes(img));
        const finalImageUrls = [...remainingExistingImages, ...newUrls];
        
        console.log('🖼️ 원본 파일로 최종 이미지 URL 구성:', {
          remainingExistingImages: remainingExistingImages.length,
          newUrls: newUrls.length,
          finalImageUrls: finalImageUrls.length
        });
        
        setImageUrls(finalImageUrls);
        console.log('✅ 원본 파일로 이미지 추가 완료');
      }
    }
  };

  const handleImageLibrary = () => {
    console.log('🖼️ 이미지 라이브러리 버튼 클릭됨 (수정)');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    // 이벤트 핸들러 함수 정의
    const handleFileChange = (e: Event) => {
      console.log('🎯 파일 선택 이벤트 발생! (수정)', e);
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        console.log('📁 파일 선택됨:', target.files.length, '개');
        handleImageSelect({ target } as React.ChangeEvent<HTMLInputElement>);
      } else {
        console.log('⚠️ 파일이 선택되지 않음');
      }
    };
    
    // 기존 방식과 새로운 방식 모두 사용 (안전성 강화)
    input.onchange = handleFileChange;
    input.addEventListener('change', handleFileChange);
    
    // DOM에 추가하여 안전하게 클릭
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    
    console.log('🖱️ input 클릭 시도... (수정)');
    
    try {
      input.click();
      console.log('✅ input.click() 성공 (수정)');
    } catch (error) {
      console.log('⚠️ input.click() 실패, 대체 방법 시도 (수정):', error);
      // 포인터 이벤트 활성화 후 다시 시도
      input.style.pointerEvents = 'auto';
      input.click();
    }
    
    // 클릭 후 DOM에서 제거 (안전하게)
    setTimeout(() => {
      try {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
          console.log('🧹 input DOM에서 제거 완료 (수정)');
        }
      } catch (error) {
        console.log('⚠️ input DOM 제거 실패 (수정):', error);
      }
    }, 2000);
    
    setShowActionSheet(false);
  };

  const handleCamera = () => {
    console.log('📸 카메라 버튼 클릭됨 (수정)');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    // 이벤트 핸들러 함수 정의
    const handleFileChange = (e: Event) => {
      console.log('🎯 카메라 이벤트 발생! (수정)', e);
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        console.log('📸 카메라 촬영 완료:', target.files.length, '개');
        handleImageSelect({ target } as React.ChangeEvent<HTMLInputElement>);
      } else {
        console.log('⚠️ 카메라 촬영 실패 또는 취소됨');
      }
    };
    
    // 기존 방식과 새로운 방식 모두 사용 (안전성 강화)
    input.onchange = handleFileChange;
    input.addEventListener('change', handleFileChange);
    
    // DOM에 추가하여 안전하게 클릭
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    
    console.log('📸 카메라 input 클릭 시도... (수정)');
    
    try {
      input.click();
      console.log('✅ 카메라 input.click() 성공 (수정)');
    } catch (error) {
      console.log('⚠️ 카메라 input.click() 실패, 대체 방법 시도 (수정):', error);
      // 포인터 이벤트 활성화 후 다시 시도
      input.style.pointerEvents = 'auto';
      input.click();
    }
    
    // 클릭 후 DOM에서 제거 (안전하게)
    setTimeout(() => {
      try {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
          console.log('🧹 카메라 input DOM에서 제거 완료 (수정)');
        }
      } catch (error) {
        console.log('⚠️ 카메라 input DOM 제거 실패 (수정):', error);
      }
    }, 2000);
    
    setShowActionSheet(false);
  };

  // 이미지 제거
  const handleImageRemove = (index: number) => {
    console.log('🗑️ 새 이미지 제거 시도:', { index, imagesCount: images.length });
    
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    
    // URL 정리 - 기존 이미지 개수를 고려하여 정확한 인덱스 계산
    const remainingExistingImages = existingImages.filter(img => !removedImages.includes(img));
    const removedUrl = imageUrls[remainingExistingImages.length + index];
    
    console.log('🔗 제거할 URL 정보:', {
      remainingExistingImages: remainingExistingImages.length,
      index,
      removedUrl,
      isBlob: removedUrl?.startsWith('blob:')
    });
    
    if (removedUrl && removedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removedUrl);
      console.log('🧹 blob URL 정리 완료');
    }
    
    // 이미지 URL 업데이트
    const newUrls = newImages.map(file => URL.createObjectURL(file));
    const finalImageUrls = [...remainingExistingImages, ...newUrls];
    
    console.log('🖼️ 이미지 제거 후 URL 구성:', {
      remainingExistingImages: remainingExistingImages.length,
      newUrls: newUrls.length,
      finalImageUrls: finalImageUrls.length
    });
    
    setImageUrls(finalImageUrls);
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
      
      // 최종 이미지 목록 구성 (기존 이미지 - 제거된 이미지)
      const finalImages = existingImages.filter(img => !removedImages.includes(img));
      
      console.log('📝 수정 데이터:', {
        content: content.trim(),
        finalImages,
        newImagesCount: images.length,
        removedImages
      });
      
      // updateBoard API에 맞는 데이터 구조로 전송
      const updateData = {
        content: content.trim(),
        images: finalImages,        // 기존 이미지 URL 배열
        newImages: images          // 새로 추가된 이미지 File 배열
      };
      
      console.log('📤 수정 데이터:', {
        content: content.trim(),
        images: finalImages,
        newImagesCount: images.length,
        removedImages
      });
      
      const result = await updateBoard(eventId, postType, postId, updateData);
      
      if (result.success) {
        showToast('게시글이 수정되었습니다.', 'success');
        
        // 수정된 데이터로 로컬 상태 업데이트
        if (result.data) {
          setPost(prev => prev ? { ...prev, ...result.data } : null);
        }
        
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
          const url = imageUrls[existingImages.length - removedImages.length + index];
          if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        goBack();
      }
    } else {
      goBack();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 w-full h-full bg-white text-black flex flex-col overflow-hidden">
        <CommonNavigationBar 
          title="게시글 수정"
          leftButton={
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleCancel}
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
        />
        <div className="flex items-center justify-center flex-1">
          <div className="text-lg text-black">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="fixed inset-0 w-full h-full bg-white text-black flex flex-col overflow-hidden">
        <CommonNavigationBar 
          title="게시글 수정"
          leftButton={
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleCancel}
          backgroundColor="white"
          backgroundOpacity={1}
          textColor="text-black"
        />
        <div className="flex items-center justify-center flex-1">
          <div className="text-lg text-red-600">{error || "게시글을 찾을 수 없습니다."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-white text-black flex flex-col overflow-hidden">
      <CommonNavigationBar 
        title="게시글 수정"
        leftButton={
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                {/* 텍스트 입력 영역 - 남은 공간 채움 */}
        <div className="flex-1 min-h-0">
          <textarea
            placeholder="무슨 소식을 올리실건가요?"
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
                      onClick={() => {
                        // 현재 표시된 이미지들 중에서 기존 이미지와 새 이미지를 구분
                        const remainingExistingImages = existingImages.filter(img => !removedImages.includes(img));
                        
                        if (index < remainingExistingImages.length) {
                          // 기존 이미지 제거
                          const imageUrl = remainingExistingImages[index];
                          handleRemoveExistingImage(imageUrl);
                        } else {
                          // 새 이미지 제거
                          const newImageIndex = index - remainingExistingImages.length;
                          handleImageRemove(newImageIndex);
                        }
                      }}
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
                  <div>JPG, PNG, GIF, WebP</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {content.length}/1000
                </span>
                <button
                  onClick={handleSubmit}
                  className={`text-md font-semibold transition-all duration-200 px-4 py-3 rounded-lg whitespace-nowrap ${
                    isSubmitting || !content.trim()
                      ? 'text-gray-400 cursor-not-allowed bg-gray-300'
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
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">게시글을 불러오는 중...</p>
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