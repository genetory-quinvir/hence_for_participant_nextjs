"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useSimpleNavigation } from "@/utils/navigation";
import { updateProfile, updateProfileImage, deleteProfileImage } from "@/lib/api";

function ProfileEditContent() {
  const { navigate, goBack, replace } = useSimpleNavigation();
  const { user, updateUser, isAuthenticated } = useAuth();
  
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  // 사용자 정보로 폼 초기화
  useEffect(() => {
    if (user) {
      console.log('사용자 정보 로드:', user);
      setNickname((user.nickname || user.name || "") as string);
      setProfileImage(user.profileImageUrl || null);
    }
  }, [user]);

  // 인증되지 않은 경우 로딩 표시
  if (!isAuthenticated || !user) {
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
    replace("/profile");
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      console.log('저장 시작:', { nickname: nickname.trim(), profileImageFile });
      
      // 닉네임 변경 API 호출
      const nicknameResult = await updateProfile(user!.id!, { nickname: nickname.trim() });
      
      if (!nicknameResult.success) {
        console.error('닉네임 변경 실패:', nicknameResult.error);
        setError(nicknameResult.error || "닉네임 변경에 실패했습니다. 다시 시도해주세요.");
        return;
      }
      
      console.log('닉네임 변경 성공:', nicknameResult.data);
      
      // 프로필 이미지 변경 API 호출 (이미지가 있는 경우)
      let newProfileImageUrl = user.profileImageUrl;
      
      if (profileImageFile) {
        console.log('프로필 이미지 업로드 시작');
        const imageResult = await updateProfileImage(user!.id!, profileImageFile);
        
        if (!imageResult.success) {
          console.error('프로필 이미지 변경 실패:', imageResult.error);
          setError(imageResult.error || "프로필 이미지 변경에 실패했습니다. 다시 시도해주세요.");
          return;
        }
        
        console.log('프로필 이미지 변경 성공:', imageResult.data);
        
        // 서버에서 반환된 이미지 URL 사용
        if (imageResult.data && imageResult.data.profileImageUrl) {
          newProfileImageUrl = imageResult.data.profileImageUrl;
        } else if (imageResult.data && imageResult.data.imageUrl) {
          newProfileImageUrl = imageResult.data.imageUrl;
        } else if (imageResult.data && typeof imageResult.data === 'string') {
          newProfileImageUrl = imageResult.data;
        }
        
        // 미리보기도 서버 URL로 업데이트
        if (newProfileImageUrl) {
          setProfileImage(newProfileImageUrl);
        }
      } else if (user.profileImageUrl && !profileImage) {
        // 기존 이미지가 있었는데 삭제된 경우
        console.log('프로필 이미지 삭제 시작');
        const deleteResult = await deleteProfileImage(user!.id!);
        
        if (!deleteResult.success) {
          console.error('프로필 이미지 삭제 실패:', deleteResult.error);
          setError(deleteResult.error || "프로필 이미지 삭제에 실패했습니다. 다시 시도해주세요.");
          return;
        }
        
        console.log('프로필 이미지 삭제 성공:', deleteResult.data);
        newProfileImageUrl = null; // 이미지 삭제됨
        
        // 미리보기도 제거하여 이니셜이 표시되도록 함
        setProfileImage('');
      }
      
      // 로컬 상태 업데이트
      const updatedUser = {
        ...user,
        nickname: nickname.trim(),
        profileImageUrl: newProfileImageUrl,
      };
      
      console.log('업데이트할 사용자 정보:', updatedUser);
      
      updateUser(updatedUser);
      console.log('updateUser 호출 완료');
      
      alert("프로필이 성공적으로 수정되었습니다.");
      replace("/profile");
      
    } catch (error) {
      console.error("프로필 수정 오류:", error);
      setError("프로필 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (nickname !== (user?.nickname || user?.name || "") || profileImage !== (user?.profileImageUrl || null)) {
      if (confirm("변경사항이 있습니다. 정말 취소하시겠습니까?")) {
        replace("/profile");
      }
    } else {
      replace("/profile");
    }
  };

  // 이미지 압축 함수
  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 원본 이미지 크기
        const { width: originalWidth, height: originalHeight } = img;
        
        // 새로운 크기 계산 (비율 유지)
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        
        if (originalWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = (originalHeight * maxWidth) / originalWidth;
        }
        
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = (newWidth * maxHeight) / newHeight;
        }
        
        // Canvas 크기 설정
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        
        // 압축된 이미지를 Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // 원본 파일명 유지하면서 새로운 File 객체 생성
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('이미지 압축에 실패했습니다.'));
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('이미지 로드에 실패했습니다.'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("이미지 파일만 업로드 가능합니다.");
        return;
      }

      try {
        console.log('원본 파일 크기:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        
        // 이미지 압축
        const compressedFile = await compressImage(file);
        console.log('압축 후 파일 크기:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
        
        // 압축 후에도 1MB를 초과하는 경우 추가 압축
        if (compressedFile.size > 1 * 1024 * 1024) {
          console.log('추가 압축 필요');
          const furtherCompressedFile = await compressImage(compressedFile, 600, 600, 0.6);
          console.log('추가 압축 후 파일 크기:', (furtherCompressedFile.size / 1024 / 1024).toFixed(2), 'MB');
          
          if (furtherCompressedFile.size > 1 * 1024 * 1024) {
            setError("이미지를 더 작은 크기로 압축할 수 없습니다. 다른 이미지를 선택해주세요.");
            return;
          }
          
          setProfileImageFile(furtherCompressedFile);
          
          // 미리보기용 base64 생성
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setProfileImage(result);
            setError("");
          };
          reader.readAsDataURL(furtherCompressedFile);
        } else {
          setProfileImageFile(compressedFile);
          
          // 미리보기용 base64 생성
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            setProfileImage(result);
            setError("");
          };
          reader.readAsDataURL(compressedFile);
        }
        
      } catch (error) {
        console.error('이미지 압축 오류:', error);
        setError("이미지 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };

  const handleImageDelete = async () => {
    try {
      console.log('프로필 이미지 삭제 시작');
      
      // 실제 API 호출
      const result = await deleteProfileImage(user!.id!);
      
      if (result.success) {
        console.log('프로필 이미지 삭제 성공:', result.data);
        
        // 로컬 상태 업데이트
        setProfileImage(''); // 빈 문자열로 설정하여 이니셜이 표시되도록 함
        setProfileImageFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // 사용자 정보 업데이트
        const updatedUser = {
          ...user,
          profileImageUrl: null,
        };
        updateUser(updatedUser);
        
        console.log('프로필 이미지 삭제 완료 - 이니셜 표시됨');
      } else {
        console.error('프로필 이미지 삭제 실패:', result.error);
        setError(result.error || "프로필 이미지 삭제에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error) {
      console.error("프로필 이미지 삭제 오류:", error);
      setError("프로필 이미지 삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-white text-black overflow-hidden">
      {/* 네비게이션바 */}
      <CommonNavigationBar
        title="프로필 편집"
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
        onLeftClick={handleCancel}
        backgroundColor="white"
        backgroundOpacity={1}
        textColor="text-black"
        sticky={true}
        fixedHeight={true}
      />

      {/* 메인 컨텐츠 */}
      <main className="w-full h-full flex flex-col px-4 py-4 pb-24">
        {/* 프로필 아바타 섹션 */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div 
              className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden border-2 border-gray-200"
              onClick={handleImageClick}
            >
              {profileImage && profileImage.trim() !== '' ? (
                <img 
                  src={profileImage} 
                  alt="프로필 이미지" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-black text-3xl font-bold">
                  {nickname.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
              
              {/* 편집 오버레이 */}
            </div>
            
            {/* 삭제 버튼 */}
            {profileImage && profileImage.trim() !== '' && (
              <button
                onClick={handleImageDelete}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* 숨겨진 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <div className="text-center">
            <p className="text-black font-normal text-sm mb-1" style={{ opacity: 0.6 }}>
              프로필 사진을 클릭하여 변경하세요
            </p>
            <p className="text-gray-500 text-xs" style={{ opacity: 0.5 }}>
              JPG, PNG 파일 (자동 압축됨)
            </p>
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
            <label className="block text-black text-sm font-medium mb-2">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="닉네임을 입력하세요"
              maxLength={20}
            />
            <p className="text-black text-xs mt-2" style={{ opacity: 0.6 }}>
              {nickname.length}/20
            </p>
          </div>
        </div>
      </main>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white">
        <button
          onClick={handleSave}
          disabled={isSubmitting || !nickname.trim()}
          className={`w-full py-3 rounded-lg font-bold text-md transition-all ${
            isSubmitting || !nickname.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer'
          }`}
        >
          {isSubmitting ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}

export default function ProfileEditPage() {
  return <ProfileEditContent />;
} 