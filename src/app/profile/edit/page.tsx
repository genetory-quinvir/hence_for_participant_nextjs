"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonProfileView from "@/components/common/CommonProfileView";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";
import { useSimpleNavigation } from "@/utils/navigation";
import { updateProfile, uploadProfileImage, deleteProfileImage } from "@/lib/api";

function ProfileEditContent() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [isImageDeleted, setIsImageDeleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  // 사용자 정보로 폼 초기화
  useEffect(() => {
    if (user) {
      setNickname((user.nickname || "") as string);
      setProfileImageUrl(user.profileImageUrl || "");
    }
  }, [user]);

  // 인증되지 않은 경우 로딩 표시
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>메인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  const handleBackClick = () => {
    // 프로필 페이지로 교체 (히스토리에 추가하지 않음)
    router.replace("/profile");
  };

  // 이미지 리사이즈 함수
  const resizeImage = (file: File, maxWidth: number = 300, maxHeight: number = 300, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 비율 유지하면서 크기 조정
        let { width, height } = img;
        
        // 원본 크기가 maxWidth, maxHeight보다 작으면 그대로 사용
        if (width <= maxWidth && height <= maxHeight) {
          canvas.width = width;
          canvas.height = height;
        } else {
          // 비율 유지하면서 크기 조정
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
        }
        
        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 압축된 이미지를 Blob으로 변환
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            console.log('✅ 이미지 리사이즈 완료:', {
              originalSize: file.size,
              resizedSize: resizedFile.size,
              compressionRatio: ((file.size - resizedFile.size) / file.size * 100).toFixed(1) + '%',
              dimensions: `${width}x${height}`
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (file: File) => {
    try {
      // 이미지 리사이즈
      const resizedFile = await resizeImage(file, 300, 300, 0.8);
      
      // 파일 크기 검증 (리사이즈 후에도 1MB 제한)
      const maxSize = 1 * 1024 * 1024; // 1MB
      if (resizedFile.size > maxSize) {
        showToast("이미지가 너무 큽니다. 다른 이미지를 선택해주세요.", "error");
        return;
      }
      
      // 파일 타입 검증
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(resizedFile.type)) {
        showToast("지원하지 않는 파일 형식입니다. (JPEG, PNG, GIF, WebP만 가능)", "error");
        return;
      }
      
      setProfileImage(resizedFile);
      setProfileImageUrl(URL.createObjectURL(resizedFile));
      setIsImageDeleted(false); // 이미지 선택 시 삭제 상태 초기화
    } catch (error) {
      console.error('이미지 리사이즈 실패:', error);
      showToast("이미지 처리에 실패했습니다. 다시 시도해주세요.", "error");
    }
  };

  const handleImageDelete = () => {
    setProfileImage(null);
    setProfileImageUrl("");
    setIsImageDeleted(true); // 이미지 삭제 상태 표시
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log('🔍 프로필 편집 시작:', {
        userId: user.id,
        nickname: nickname.trim(),
        hasProfileImage: !!profileImage,
        isImageDeleted: isImageDeleted,
        profileImageName: profileImage?.name,
        profileImageSize: profileImage?.size,
        currentProfileImageUrl: profileImageUrl
      });

      let uploadedImageUrl = profileImageUrl;
      let imageUploadSuccess = true;

      // 1. 프로필 이미지 처리
      if (isImageDeleted) {
        // 이미지 삭제 처리
        console.log('🗑️ 프로필 이미지 삭제 시작');
        const deleteResult = await deleteProfileImage(user.id);
        if (deleteResult.success) {
          uploadedImageUrl = "";
          console.log('✅ 프로필 이미지 삭제 성공');
        } else {
          console.error('❌ 프로필 이미지 삭제 실패:', deleteResult.error);
          imageUploadSuccess = false;
        }
      } else if (profileImage) {
        // 새 이미지 업로드
        console.log('🖼️ 프로필 이미지 업로드 시작');
        const imageResult = await uploadProfileImage(user.id, profileImage);
        
        if (imageResult.success) {
          uploadedImageUrl = imageResult.data?.profileImageUrl || profileImageUrl;
          console.log('✅ 프로필 이미지 업로드 성공:', uploadedImageUrl);
        } else {
          console.error('❌ 프로필 이미지 업로드 실패:', imageResult.error);
          imageUploadSuccess = false;
          // 이미지 업로드 실패해도 계속 진행
        }
      }

      // 2. 닉네임 변경
      console.log('📝 닉네임 변경 시작');
      const profileResult = await updateProfile(user.id, {
        nickname: nickname.trim(),
      });
      
      console.log('🔍 프로필 편집 API 결과:', profileResult);
      
      if (profileResult.success) {
        console.log('✅ 프로필 편집 성공:', profileResult.data);
        
        const updatedUser = {
          ...user,
          nickname: nickname.trim(),
          profileImageUrl: imageUploadSuccess ? uploadedImageUrl : user.profileImageUrl, // 이미지 업로드 실패시 기존 이미지 유지
        };
        
        console.log('🔍 업데이트된 사용자 정보:', updatedUser);
        
        updateUser(updatedUser);
        
        if (isImageDeleted) {
          showToast("프로필이 성공적으로 수정되었습니다. (이미지 삭제됨)", "success");
        } else if (imageUploadSuccess) {
          showToast("프로필이 성공적으로 수정되었습니다.", "success");
        } else {
          showToast("닉네임이 성공적으로 변경되었습니다.", "success");
        }
        router.replace("/profile");
      } else {
        console.error('❌ 프로필 편집 실패:', profileResult.error);
        setError(profileResult.error || "프로필 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("프로필 수정 오류:", error);
      setError("프로필 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (nickname !== (user?.nickname || "") || profileImageUrl !== (user?.profileImageUrl || "") || isImageDeleted) {
      if (confirm("변경사항이 있습니다. 정말 취소하시겠습니까?")) {
        router.replace("/profile");
      }
    } else {
      router.replace("/profile");
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black text-white overflow-hidden">
      {/* 네비게이션바 */}
      <CommonNavigationBar
        title="프로필 편집"
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
        onLeftClick={handleCancel}
        backgroundColor="black"
        backgroundOpacity={1}
        textColor="text-white"
      />

      {/* 메인 컨텐츠 */}
      <main className="w-full h-full flex flex-col px-4 py-4 pb-24">
        {/* 프로필 아바타 섹션 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  handleImageSelect(file);
                }
              }}
              className="hidden"
              id="profile-image-input"
            />
            <div className="mr-4">
              <CommonProfileView
                profileImageUrl={profileImageUrl}
                nickname={nickname}
                size="xl"
                showBorder={true}
                showHover={true}
                onClick={() => document.getElementById('profile-image-input')?.click()}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => document.getElementById('profile-image-input')?.click()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              사진 변경
            </button>
            {(profileImage || (user?.profileImageUrl && !isImageDeleted)) && (
              <button
                onClick={handleImageDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                사진 삭제
              </button>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* 편집 폼 */}
        <div className="space-y-6">
          {/* 닉네임 입력 */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 bg-black rounded-lg text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:border-purple-500 focus:bg-opacity-15 transition-all"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
            />
            <p className="text-white text-xs mt-1" style={{ opacity: 0.6 }}>
              {nickname.length}/20
            </p>
          </div>
        </div>
      </main>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-black">
        <button
          onClick={handleSave}
          disabled={isSubmitting || !nickname.trim()}
          className={`w-full py-4 rounded-lg font-semibold text-md transition-all ${
            isSubmitting || !nickname.trim()
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer'
          }`}
        >
          {isSubmitting ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}

// 직접 내보내기
export default function ProfileEditPage() {
  return <ProfileEditContent />;
} 