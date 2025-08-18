"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
  const [hasCamera, setHasCamera] = useState<boolean | null>(null); // null: 확인 중, true: 지원, false: 미지원
  const [isScanning, setIsScanning] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 인증되지 않은 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  // 카메라 권한 요청 및 지원 여부 확인
  const requestCameraPermission = async () => {
    try {
      console.log("카메라 권한 요청 중...");
      
      // iOS에서는 가장 간단한 설정 사용
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      const constraints = {
        video: isIOS ? {
          facingMode: 'environment'
        } : {
          facingMode: 'environment',
          // 안드로이드에서만 해상도 제약 추가
          ...(navigator.userAgent.includes('Android') && {
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          })
        }
      };
      
      console.log("카메라 제약 조건:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      stream.getTracks().forEach(track => track.stop()); // 스트림 정리
      console.log("카메라 권한 획득 성공");
      setHasCamera(true);
      
      // iOS에서는 권한 획득 후 바로 스캐너 시작하지 않음 (사용자가 버튼을 눌러야 함)
      if (!isIOS) {
        setTimeout(() => {
          startScanner();
        }, 500);
      }
    } catch (error) {
      console.log('카메라를 지원하지 않거나 권한이 없습니다:', error);
      setHasCamera(false);
      
      // 플랫폼별 오류 메시지
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          const isAndroid = navigator.userAgent.includes('Android');
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const isPWA = window.matchMedia('(display-mode: standalone)').matches;
          
          if (isAndroid) {
            if (isPWA) {
              showToast('카메라 권한이 거부되었습니다. 앱 설정 > 권한 > 카메라에서 허용해주세요.', 'warning');
            } else {
              showToast('카메라 권한이 거부되었습니다. Chrome 설정 > 사이트 설정 > 카메라에서 권한을 허용해주세요.', 'warning');
            }
          } else if (isIOS) {
            if (isPWA) {
              showToast('카메라 권한이 거부되었습니다. 설정 > Safari > 고급 > 웹사이트 데이터에서 권한을 허용해주세요.', 'warning');
            } else {
              showToast('카메라 권한이 거부되었습니다. 설정 > Safari > 카메라에서 권한을 허용해주세요.', 'warning');
            }
          } else {
            showToast('카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.', 'warning');
          }
        } else if (error.name === 'NotFoundError') {
          showToast('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.', 'error');
        } else if (error.name === 'NotSupportedError') {
          showToast('이 브라우저는 카메라를 지원하지 않습니다. Chrome, Safari, Firefox를 사용해주세요.', 'error');
        } else if (error.name === 'NotReadableError') {
          showToast('카메라가 다른 앱에서 사용 중입니다. 다른 앱을 종료하고 다시 시도해주세요.', 'error');
        } else if (error.name === 'OverconstrainedError') {
          showToast('카메라 설정에 문제가 있습니다. 다른 카메라를 선택해주세요.', 'error');
        } else {
          showToast('카메라 접근 중 오류가 발생했습니다. 페이지를 새로고침하고 다시 시도해주세요.', 'error');
        }
      }
    }
  };

  // 카메라 지원 여부 확인 (권한 요청 없이)
  const checkCameraSupport = async () => {
    try {
      // 1. 먼저 카메라 지원 여부 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('카메라 API를 지원하지 않습니다.');
        setHasCamera(false);
        return;
      }

      // 2. 권한 상태 확인 (지원하는 브라우저에서만)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          console.log("카메라 권한 상태:", permission.state);
          
          if (permission.state === 'granted') {
            setHasCamera(true);
            return;
          } else if (permission.state === 'denied') {
            setHasCamera(false);
            return;
          }
          // 'prompt' 상태는 권한 요청이 필요한 상태
        } catch (permError) {
          console.log('권한 상태 확인 실패:', permError);
          // 권한 API가 지원되지 않는 경우 무시하고 계속 진행
        }
      }
      
      // 3. 권한 상태를 알 수 없는 경우 카메라 지원 여부만 확인
      // 실제 권한 요청은 사용자가 버튼을 클릭할 때만 수행
      setHasCamera(null); // null = 확인 중
      
    } catch (error) {
      console.log('카메라 지원 확인 중 오류:', error);
      setHasCamera(false);
    }
  };

  // 초기 카메라 지원 확인
  useEffect(() => {
    const timer = setTimeout(() => {
      checkCameraSupport();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // QR 스캐너 정리 함수 (먼저 정의)
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

  // QR 스캐너 시작 함수
  const startScanner = async () => {
    console.log("startScanner 호출됨");
    
    if (!videoRef.current) {
      console.log("비디오 요소가 없습니다.");
      return;
    }

    if (codeReaderRef.current) {
      console.log("이미 스캐너가 실행 중입니다.");
      return;
    }

    setIsScanning(true);
    console.log("QR 스캐너 시작 중...");
    
    try {
      // iOS에서는 먼저 카메라 스트림을 직접 시작
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        console.log("iOS 감지: 직접 카메라 스트림 시작");
        
        // iOS에서는 더 간단한 제약 조건 사용
        const constraints = {
          video: {
            facingMode: 'environment'
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoRef.current.srcObject = stream;
        
        // 비디오 로드 완료 후 QR 스캐너 시작
        videoRef.current.onloadedmetadata = async () => {
          console.log("iOS 비디오 로드 완료, QR 스캐너 시작");
          
          try {
            codeReaderRef.current = new BrowserMultiFormatReader();
            
            await codeReaderRef.current.decodeFromVideoDevice(
              null,
              videoRef.current,
              (result) => {
                if (result) {
                  console.log("QR 코드 스캔 성공:", result.getText());
                  handleQRCodeScanned(result.getText());
                }
              }
            );
            
            console.log("iOS QR 스캐너 시작 완료");
          } catch (qrError) {
            console.error("iOS QR 스캐너 시작 오류:", qrError);
            setIsScanning(false);
          }
        };
        
        videoRef.current.play().catch((playError) => {
          console.error("iOS 비디오 재생 오류:", playError);
          setIsScanning(false);
        });
        
      } else {
        // 안드로이드/웹에서는 기존 방식 사용
        console.log("안드로이드/웹: 기존 방식 사용");
        
        codeReaderRef.current = new BrowserMultiFormatReader();
        
        const hints = new Map();
        if (navigator.userAgent.includes('Android')) {
          hints.set(2, true); // TRY_HARDER 활성화
          hints.set(3, 1); // PURE_BARCODE 모드
        }
        
        await codeReaderRef.current.decodeFromVideoDevice(
          null,
          videoRef.current,
          (result) => {
            if (result) {
              console.log("QR 코드 스캔 성공:", result.getText());
              handleQRCodeScanned(result.getText());
            }
          }
        );
        
        console.log("안드로이드/웹 QR 스캐너 시작 완료");
      }

    } catch (error) {
      console.error("QR 스캐너 시작 오류:", error);
      setIsScanning(false);
      
      // iOS에서 오류 발생 시 사용자에게 안내
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        showToast('카메라 시작에 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요.', 'error');
      }
    }
  };

  // 카메라가 지원되면 QR 스캐너 시작 (iOS에서는 사용자 상호작용 후에만)
  useEffect(() => {
    if (hasCamera === true && !isScanning) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        // iOS에서는 사용자 상호작용이 필요하므로 자동 시작하지 않음
        console.log("iOS 감지: 사용자 상호작용 후 카메라 시작 필요");
        return;
      }
      
      // 안드로이드/웹에서는 자동 시작
      const timer = setTimeout(() => {
        startScanner();
      }, 500);
      
      return () => clearTimeout(timer);
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
          navigate(`/event/${eventId}`);
        } else {
          console.log('이벤트 코드로 페이지 이동:', `/event?code=${qrCode.trim()}`);
          sessionStorage.setItem('previousPage', '/qr');
          navigate(`/event?code=${qrCode.trim()}`);
        }
      } else {
        console.log("이벤트 확인 실패:", result.error);
        showToast(result.error || "유효하지 않은 QR 코드입니다.");
        // 실패 시 스캐너 재시작
        setTimeout(() => {
          if (hasCamera) {
            startScanner();
          }
        }, 1000);
      }
    } catch (error) {
      console.error("QR 코드 확인 중 오류:", error);
      showToast("QR 코드 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
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
        backgroundColor="black"
        backgroundOpacity={1}
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
                    <p className="text-xs mt-2 text-white" style={{ opacity: 0.5 }}>잠시만 기다려주세요</p>
                  </div>
                </div>
              </div>
            ) : hasCamera === true ? (
              // 카메라 지원 - QR 스캐너 표시
              <div className="w-full">
                {(() => {
                  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                  
                  // iOS에서 스캐너가 시작되지 않은 경우 시작 버튼 표시
                  if (isIOS && !isScanning) {
                    return (
                      <div className="relative bg-black rounded-xl overflow-hidden">
                        <div className="aspect-square bg-transparent rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl mb-4">📷</div>
                            <p className="text-md font-regular text-white mb-4" style={{ opacity: 0.7 }}>
                              QR 스캔을 시작하려면
                            </p>
                                                         <button
                               onClick={() => {
                                 console.log("iOS 카메라 시작 버튼 클릭됨");
                                 startScanner();
                               }}
                               className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                             >
                               카메라 시작하기
                             </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // 스캐너가 실행 중인 경우 비디오 표시
                  return (
                    <div className="relative bg-black rounded-xl overflow-hidden">
                                             <video
                         ref={videoRef}
                         className="w-full aspect-square object-cover"
                         autoPlay
                         playsInline
                         muted
                         webkit-playsinline="true"
                         x-webkit-airplay="allow"
                         // iOS Safari 호환성을 위한 추가 속성들
                         {...(/iPad|iPhone|iPod/.test(navigator.userAgent) && {
                           'webkit-playsinline': 'true',
                           'x-webkit-airplay': 'allow',
                           'data-cy': 'qr-video-ios',
                           'controls': false,
                           'disablePictureInPicture': true,
                           'disableRemotePlayback': true,
                           style: { 
                             // iOS에서는 기본 스타일 유지 (안정성 우선)
                             objectFit: 'cover'
                           }
                         })}
                         // 안드로이드에서 더 나은 성능을 위한 속성들
                         {...(navigator.userAgent.includes('Android') && !navigator.userAgent.includes('iPhone') && !navigator.userAgent.includes('iPad') && {
                           'data-cy': 'qr-video-android',
                           style: { 
                             transform: 'scaleX(-1)', // 안드로이드에서 미러링 효과
                             filter: 'brightness(1.1) contrast(1.1)', // 안드로이드에서 더 선명한 화면
                             objectFit: 'cover'
                           }
                         })}
                       />
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
                    </div>
                  );
                })()}
              </div>
            ) : (
              // 카메라 미지원 - 안내 메시지 표시
              <div className="bg-black rounded-xl p-6 w-full" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="aspect-square bg-transparent rounded-lg flex items-center justify-center">
                  <div className="text-gray-500 text-center">
                    <div className="text-4xl mb-4">📷</div>
                    <p className="text-md font-regular text-white" style={{ opacity: 0.7 }}>카메라 접근이 필요합니다</p>
                    <p className="text-xs mt-2 font-light text-white" style={{ opacity: 0.7 }}>아래 버튼을 눌러 카메라 권한을 허용하거나</p>
                    <p className="text-xs font-light text-white" style={{ opacity: 0.7 }}>입장코드를 직접 입력해주세요</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 하단 버튼들 - 고정 */}
        <section className="flex-shrink-0 pb-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
          <div className="space-y-3">
            {/* 카메라 권한 요청 버튼 (카메라가 지원되지 않거나 권한이 없는 경우) */}
            {(hasCamera === false || hasCamera === null) && (
              <button
                onClick={requestCameraPermission}
                className="w-full rounded-xl p-4 transition-colors"
                style={{
                  backgroundColor: 'rgba(124, 58, 237, 0.1)',
                  border: '1px solid rgba(124, 58, 237, 0.3)'
                }}
              >
                <div className="text-purple-400 font-semibold text-md flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  카메라 권한 허용하기
                </div>
              </button>
            )}
            
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