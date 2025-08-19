"use client";

import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { checkEventCode, registerParticipant } from "@/lib/api";
import { useSimpleNavigation } from "@/utils/navigation";
import { useToast } from "@/components/common/Toast";
import CodeInputModal from "@/components/common/CodeInputModal";

export default function QRPage() {
  const { navigate, goBack, replace } = useSimpleNavigation();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  
  const [isChecking, setIsChecking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  // QR 스캐너 정리 함수
  const stopScanner = () => {
    console.log("QR 스캐너 정리 시작");
    
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset();
        codeReaderRef.current = null;
        console.log("QR 스캐너 정리 완료");
      } catch (error) {
        console.log("QR 스캐너 정리 중 오류:", error);
      }
    }
    
    // 비디오 스트림 정리
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          track.stop();
          console.log("비디오 트랙 정리:", track.kind);
        });
        videoRef.current.srcObject = null;
        console.log("비디오 스트림 정리 완료");
      } catch (error) {
        console.log("비디오 스트림 정리 중 오류:", error);
      }
    }
    
    setIsScanning(false);
  };

  // QR 스캐너 시작 함수
  const startScanner = async () => {
    console.log("QR 스캐너 시작 시도");
    
    // 비디오 요소가 준비될 때까지 잠시 대기
    let attempts = 0;
    while (!videoRef.current && attempts < 10) {
      console.log(`비디오 요소 대기 중... (${attempts + 1}/10)`);
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!videoRef.current) {
      console.error("비디오 요소를 찾을 수 없습니다");
      setCameraError("비디오 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.");
      return;
    }
    
    if (codeReaderRef.current) {
      console.log("이미 스캐너가 실행 중입니다");
      return;
    }

    setIsScanning(true);
    setCameraError(null);
    
    try {
      // 1. 카메라 권한 요청 및 스트림 가져오기
      console.log("카메라 권한 요청 중...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log("카메라 스트림 획득 성공:", stream.getTracks().map(t => t.kind));
      
      // 2. 비디오 요소에 스트림 연결
      videoRef.current.srcObject = stream;
      
      // 3. 비디오 재생 시작
      await videoRef.current.play();
      console.log("비디오 재생 시작됨");
      
      // 4. QR 스캐너 초기화 및 시작
      codeReaderRef.current = new BrowserMultiFormatReader();
      
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
      console.error("QR 스캐너 시작 실패:", error);
      setIsScanning(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setCameraError("카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.");
          showToast("카메라 권한이 거부되었습니다.", "error");
        } else if (error.name === 'NotFoundError') {
          setCameraError("카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.");
          showToast("카메라를 찾을 수 없습니다.", "error");
        } else if (error.name === 'NotSupportedError') {
          setCameraError("이 브라우저는 카메라를 지원하지 않습니다.");
          showToast("이 브라우저는 카메라를 지원하지 않습니다.", "error");
        } else {
          setCameraError("카메라 시작에 실패했습니다: " + error.message);
          showToast("카메라 시작에 실패했습니다.", "error");
        }
      } else {
        setCameraError("알 수 없는 카메라 오류가 발생했습니다.");
        showToast("카메라 시작에 실패했습니다.", "error");
      }
    }
  };

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
        
        // 이벤트 ID 추출
        const eventId = result.event.id;
        if (eventId) {
          console.log('참여자 등록 시작:', eventId);
          
          // 참여자 등록 시도
          try {
            const registerResult = await registerParticipant(eventId);
            if (registerResult.success) {
              console.log('✅ 참여자 등록 성공');
              showToast('이벤트에 참여되었습니다!', 'success');
            } else {
              // 이미 참여 중인 경우 조용히 넘어가기
              if (registerResult.error?.includes('이미 참여') || registerResult.error?.includes('already')) {
                console.log('ℹ️ 이미 참여 중인 사용자');
              } else {
                console.log('⚠️ 참여자 등록 실패:', registerResult.error);
              }
            }
          } catch (error) {
            console.error('❌ 참여자 등록 중 오류:', error);
          }
          
          // 이벤트 화면으로 이동
          console.log('이벤트 페이지로 이동:', `/event/${eventId}`);
          sessionStorage.setItem('previousPage', '/qr');
          replace(`/event/${eventId}`);
        } else {
          console.log('이벤트 코드로 페이지 이동:', `/event?code=${qrCode.trim()}`);
          sessionStorage.setItem('previousPage', '/qr');
          replace(`/event?code=${qrCode.trim()}`);
        }
      } else {
        console.log("이벤트 확인 실패:", result.error);
        showToast(result.error || "유효하지 않은 QR 코드입니다.");
        // 실패 시 스캐너 재시작
        setTimeout(() => {
          startScanner();
        }, 1000);
      }
    } catch (error) {
      console.error("QR 코드 확인 중 오류:", error);
      showToast("QR 코드 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      // 실패 시 스캐너 재시작
      setTimeout(() => {
        startScanner();
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
        backgroundColor="black"
        backgroundOpacity={1}
        textColor="text-white"
      />

      {/* 메인 컨텐츠 */}
      <main className="flex-1 flex flex-col px-6 overflow-hidden">
        {/* QR 카메라 영역 */}
        <section className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
          <div className="w-full max-w-sm">
            {cameraError ? (
              // 카메라 오류 상태
              <div className="bg-black rounded-xl p-6 w-full">
                <div className="aspect-square bg-transparent rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">📷</div>
                    <p className="text-md font-regular text-white mb-4" style={{ opacity: 0.7 }}>
                      {cameraError}
                    </p>
                    <button
                      onClick={startScanner}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                      다시 시도하기
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // 카메라 컨테이너 (항상 렌더링)
              <div className="relative bg-black rounded-xl overflow-hidden">
                {/* 비디오 요소 (항상 렌더링하되 조건부로 표시) */}
                <video
                  ref={videoRef}
                  className={`w-full aspect-square object-cover ${isScanning ? 'block' : 'hidden'}`}
                  autoPlay
                  playsInline
                  muted
                />
                
                {isScanning ? (
                  // 스캐너 실행 중
                  <>
                    {/* QR 스캔 프레임 오버레이 */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 relative">
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
                  </>
                ) : (
                  // 카메라 시작 전 상태
                  <div className="aspect-square bg-transparent rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-4">📷</div>
                      <p className="text-md font-regular text-white mb-4" style={{ opacity: 0.7 }}>
                        QR 코드를 스캔하려면
                      </p>
                      <button
                        onClick={startScanner}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                      >
                        카메라 시작하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 하단 버튼들 */}
        <section className="flex-shrink-0 pb-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <div className="space-y-3">
            {/* 수동 입력 버튼 */}
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
          </div>
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