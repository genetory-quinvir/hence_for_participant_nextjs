"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { checkEventCode } from "@/lib/api";

export default function QRPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

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
    router.back();
  };



  const handleManualEntry = async () => {
    console.log("수동 입력");
    const entryCode = prompt("입장코드를 입력해주세요:");

    if (entryCode) {
      if (entryCode.trim() === "") {
        alert("입장코드를 입력해주세요.");
        return;
      }

      setIsChecking(true);
      console.log("입장코드 확인 중:", entryCode);

      try {
        const result = await checkEventCode(entryCode.trim());

        if (result.success && result.event) {
          console.log("이벤트 확인 성공:", result.event);
          alert(`이벤트 "${result.event.title || '알 수 없는 이벤트'}"에 입장합니다!`);
          // 이벤트 화면으로 이동 (이벤트 정보와 함께)
          router.push(`/event?code=${entryCode.trim()}`);
        } else {
          console.log("이벤트 확인 실패:", result.error);
          alert(result.error || "유효하지 않은 입장코드입니다.");
        }
      } catch (error) {
        console.error("이벤트 코드 확인 중 오류:", error);
        alert("입장코드 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        setIsChecking(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* 네비게이션바 */}
      <CommonNavigationBar
        title="QR 코드 확인"
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
        onLeftClick={handleBackClick}
        backgroundColor="transparent"
        backgroundOpacity={0}
        textColor="text-white"
      />

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex flex-col pt-10 px-6">
        {/* QR 카메라 영역 */}
        <section className="flex-1 flex flex-col items-center justify-center mb-8">
          <div className="bg-white rounded-xl p-6 mb-8 w-full max-w-sm">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-gray-500 text-center">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm">QR 코드를 스캔하세요</p>
              </div>
            </div>
          </div>
        </section>

        {/* 하단 수동 입력 버튼 */}
        <section className="pb-10">
          <button
            onClick={handleManualEntry}
            disabled={isChecking}
            className={`w-full rounded-xl p-4 transition-colors ${
              isChecking ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="text-white font-semibold text-md flex items-center justify-center">
              {isChecking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  확인 중...
                </>
              ) : (
                '입장코드 직접 입력'
              )}
            </div>
          </button>
        </section>
      </main>
    </div>
  );
} 