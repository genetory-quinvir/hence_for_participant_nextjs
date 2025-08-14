"use client";

import { useEffect, useState, useRef } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { checkEventCode } from "@/lib/api";
import { BrowserQRCodeReader } from "@zxing/library";
import CodeInputModal from "@/components/common/CodeInputModal";
import { useSimpleNavigation } from "@/utils/navigation";

export default function QRPage() {
  const { navigate, goBack, replace } = useSimpleNavigation();
  const { isAuthenticated, user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null); // null: 확인 중, true: 지원, false: 미지원
  const [isScanning, setIsScanning] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  // 카메라 지원 여부 확인
  useEffect(() => {
    const checkCameraSupport = async () => {
      try {
        console.log("카메라 권한 요청 중...");
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            facingMode: { ideal: 'environment' }, // 후면 카메라 우선
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          } 
        });
        
        stream.getTracks().forEach(track => track.stop()); // 스트림 정리
        console.log("카메라 권한 획득 성공");
        setHasCamera(true);
      } catch (error) {
        console.log('카메라를 지원하지 않거나 권한이 없습니다:', error);
        setHasCamera(false);
      }
    };

    const timer = setTimeout(() => {
      checkCameraSupport();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 카메라가 지원되면 QR 스캐너 시작
  useEffect(() => {
    if (hasCamera === true && !isScanning) {
      startScanner();
    }
  }, [hasCamera, isScanning]);

  // 컴포넌트 언마운트 시 스캐너 정리
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

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
    stopScanner();
    goBack();
  };

  // QR 스캐너 시작
  const startScanner = async () => {
    if (!hasCamera || !videoRef.current) {
      console.log("카메라가 지원되지 않거나 비디오 요소가 없습니다.");
      return;
    }

    if (codeReaderRef.current) {
      console.log("이미 스캐너가 실행 중입니다.");
      return;
    }

    setIsScanning(true);
    console.log("QR 스캐너 시작 중...");
    
    try {
      codeReaderRef.current = new BrowserQRCodeReader();
      
      await codeReaderRef.current.decodeFromVideoDevice(
        null, // 기본 카메라 사용
        videoRef.current,
        (result) => {
          if (result) {
            console.log("QR 코드 스캔 성공:", result.getText());
            handleQRCodeScanned(result.getText());
          }
        }
      );

      console.log("QR 스캐너 시작 완료");
    } catch (error) {
      console.error("QR 스캐너 시작 오류:", error);
      setIsScanning(false);
    }
  };

  // QR 스캐너 정리
  const stopScanner = () => {
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
      } catch (error) {
        console.log("스캐너 정리 중 오류:", error);
      }
    }
    setIsScanning(false);
  };

  // QR 코드 스캔 처리
  const handleQRCodeScanned = async (qrCode: string) => {
    // 스캐너 정리
    stopScanner();
    
    setIsChecking(true);
    console.log("QR 코드 확인 중:", qrCode);

    try {
      const result = await checkEventCode(qrCode.trim());

      if (result.success && result.event) {
        console.log("이벤트 확인 성공:", result.event);
        // 이벤트 화면으로 바로 이동 (히스토리에서 QR 페이지 제거)
        const eventId = result.event.id;
        if (eventId) {
          console.log('이벤트 페이지로 이동:', `/event/${eventId}`);
          // QR 페이지에서 온 것을 표시
          sessionStorage.setItem('previousPage', '/qr');
          replace(`/event/${eventId}`);
        } else {
          console.log('이벤트 페이지로 이동:', `/event?code=${qrCode.trim()}`);
          // QR 페이지에서 온 것을 표시
          sessionStorage.setItem('previousPage', '/qr');
          replace(`/event?code=${qrCode.trim()}`);
        }
      } else {
        console.log("이벤트 확인 실패:", result.error);
        alert(result.error || "유효하지 않은 QR 코드입니다.");
        // 실패 시 스캐너 재시작
        setTimeout(() => {
          if (hasCamera) {
            startScanner();
          }
        }, 1000);
      }
    } catch (error) {
      console.error("QR 코드 확인 중 오류:", error);
      alert("QR 코드 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      // 실패 시 스캐너 재시작
      setTimeout(() => {
        if (hasCamera) {
          startScanner();
        }
      }, 1000);
    } finally {
      setIsChecking(false);
    }
  };

  const handleManualEntry = () => {
    console.log("수동 입력 모달 열기");
    setShowCodeModal(true);
  };

  const handleCodeSubmit = async (code: string) => {
    console.log("코드 제출:", code);
    handleQRCodeScanned(code);
  };

  const handleCodeModalClose = () => {
    setShowCodeModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
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

      {/* 메인 컨텐츠 - 남은 공간 채움 */}
      <main className="flex-1 flex flex-col px-6 overflow-hidden">
        {/* QR 카메라 영역 - 유동적 높이 */}
        <section className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
          <div className="w-full max-w-sm">
            {hasCamera === null ? (
              // 카메라 확인 중 - 로딩 표시
              <div className="bg-black rounded-xl p-6 w-full">
                <div className="aspect-square bg-transparent rounded-lg flex items-center justify-center">
                  <div className="text-gray-500 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p className="text-md font-regular text-white" style={{ opacity: 0.7 }}>카메라 확인 중...</p>
                  </div>
                </div>
              </div>
            ) : hasCamera === true ? (
              // 카메라 지원 - QR 스캐너 표시
              <div className="w-full">
                <div className="relative bg-black rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full aspect-square object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  {/* QR 스캔 프레임 오버레이 */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                      {/* 모서리 표시 */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-purple-500"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-purple-500"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-purple-500"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-purple-500"></div>
                    </div>
                  </div>
                  {/* 스캔 안내 텍스트 */}
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white text-sm" style={{ opacity: 0.8 }}>
                      QR 코드를 프레임 안에 맞춰주세요
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // 카메라 미지원 - 안내 메시지 표시
              <div className="bg-black rounded-xl p-6 w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="aspect-square bg-transparent rounded-lg flex items-center justify-center">
                  <div className="text-gray-500 text-center">
                    <p className="text-md font-regular text-white" style={{ opacity: 0.7 }}>카메라를 지원하지 않습니다</p>
                    <p className="text-xs mt-1 font-light text-white" style={{ opacity: 0.7 }}>입장코드를 직접 입력해주세요</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 하단 수동 입력 버튼 - 고정 */}
        <section className="flex-shrink-0 pb-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
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

      {/* 커스텀 코드 입력 모달 */}
      <CodeInputModal
        isOpen={showCodeModal}
        onClose={handleCodeModalClose}
        onSubmit={handleCodeSubmit}
        isChecking={isChecking}
      />
    </div>
  );
} 