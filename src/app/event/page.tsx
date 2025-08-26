"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense, useState, useRef, useCallback } from "react";
import { checkEventCode, registerParticipant, getAccessToken } from "@/lib/api";
import { subscribeToTopic } from "@/lib/firebase";
import { useSimpleNavigation } from "@/utils/navigation";
import EventPageContent from "@/components/event/EventPageContent";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";
import { usePWA } from "@/hooks/usePWA";

function EventPageWrapper() {
  const { navigate } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { requestPermission, notificationPermission } = usePWA();
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [iosVersion, setIosVersion] = useState<string | null>(null);
  const registeredEventsRef = useRef<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  // 참여자 등록 함수
  const handleParticipantRegistration = useCallback(async (eventId: string) => {
    if (registeredEventsRef.current.has(eventId)) {
      return; // 이미 등록 시도한 이벤트
    }

    registeredEventsRef.current.add(eventId);
    
    // 이전 요청이 있다면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();
    
    try {
      const result = await registerParticipant(eventId);
      if (result.success) {
        // 성공적으로 등록됨
      } else {
        // 이미 참여 중인 경우 조용히 넘어가기
        if (result.error?.includes('이미 참여') || result.error?.includes('already')) {
          // 이미 참여한 경우 정상적으로 처리
        } else if (result.error?.includes('로그인이 만료')) {
          showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
        } else {
          // 기타 오류
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 요청이 취소된 경우 조용히 처리
        return;
      }
      console.error('❌ 참여자 등록 중 오류:', error);
      // 실패 시 등록된 이벤트에서 제거하여 재시도 가능하게 함
      registeredEventsRef.current.delete(eventId);
    }
  }, [showToast]);

  // iOS 및 PWA 상태 확인
  useEffect(() => {
    const checkPlatform = () => {
      // iOS 감지
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(isIOSDevice);

      // iOS 버전 확인
      if (isIOSDevice) {
        const match = navigator.userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
        if (match) {
          const major = parseInt(match[1]);
          const minor = parseInt(match[2]);
          const patch = parseInt(match[3] || '0');
          setIosVersion(`${major}.${minor}.${patch}`);
        }
      }

      // PWA 감지
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = window.navigator.standalone === true;
      setIsPWA(isStandalone || isInApp);
    };

    checkPlatform();
  }, []);

  // 알림 권한 요청 함수
  const handleRequestNotificationPermission = async (eventId: string) => {
    setIsRequestingPermission(true);
    try {
      // iOS에서 PWA로 설치되지 않은 경우 안내
      if (isIOS && !isPWA) {
        showToast('iOS에서는 홈화면에 추가 후 알림 권한을 요청해주세요.', 'info');
        setIsRequestingPermission(false);
        return;
      }

      // iOS 16.4 이전 버전에서는 웹 푸시 알림 미지원
      if (isIOS && iosVersion) {
        const [major, minor] = iosVersion.split('.').map(Number);
        if (major < 16 || (major === 16 && minor < 4)) {
          showToast('iOS 16.4 이상에서만 웹 푸시 알림을 지원합니다.', 'info');
          setIsRequestingPermission(false);
          return;
        }
      }

      const token = await requestPermission();
      if (token) {
        // FCM 토픽 구독
        const topicName = `event_${eventId}`;
        const subscribeResult = await subscribeToTopic(topicName);
        
        if (subscribeResult) {
          // 전역 알림 권한 허용 상태 저장
          localStorage.setItem('notificationPermissionGranted', 'true');
          // LocalStorage에 토픽 구독 상태 저장
          localStorage.setItem(`notificationPermissionRequested_${eventId}`, 'requested');
          showToast('이벤트 알림이 활성화되었습니다!', 'success');
        } else {
          // 토픽 구독에 실패했지만 권한은 허용된 상태로 저장
          localStorage.setItem('notificationPermissionGranted', 'true');
          localStorage.setItem(`notificationPermissionRequested_${eventId}`, 'denied');
          showToast('알림 권한은 허용되었지만 토픽 구독에 실패했습니다.', 'warning');
        }
      } else {
        if (isIOS) {
          showToast('iOS 설정에서 알림을 허용해주세요.', 'info');
        } else {
          showToast('알림 권한이 거부되었습니다.', 'error');
        }
        // 권한이 거부되었으므로 localStorage에 기록
        localStorage.setItem('notificationPermissionDenied', 'true');
        localStorage.setItem(`notificationPermissionRequested_${eventId}`, 'denied');
      }
          } catch (error) {
        console.error('Error requesting permission:', error);
        if (isIOS) {
          showToast('iOS에서는 설정에서 알림을 허용해주세요.', 'info');
        } else {
          showToast('알림 권한 요청 중 오류가 발생했습니다.', 'error');
        }
        // 에러가 발생했으므로 localStorage에 기록
        localStorage.setItem(`notificationPermissionRequested_${eventId}`, 'denied');
      } finally {
        setIsRequestingPermission(false);
      }
  };

  // 이벤트 코드나 ID로 리다이렉트 처리
  useEffect(() => {
    const eventCode = searchParams.get('code');
    const eventId = searchParams.get('id');
    
    if (eventId) {
      // eventId가 있으면 참여자 등록 시도
      const accessToken = getAccessToken();
      if (accessToken && user) {
        // 참여자 등록 처리 (비동기로 실행)
        handleParticipantRegistration(eventId);
        // API 호출 결과와 관계없이 이벤트 페이지 렌더링 (아래 return 문에서 처리)
      } else {
        // 로그인이 안된 경우 이벤트 정보를 sessionStorage에 저장하고 메인으로 이동
        sessionStorage.setItem('pendingEventId', eventId);
        sessionStorage.setItem('pendingEventUrl', window.location.pathname + window.location.search);
        navigate('/');
        return;
      }
    } else if (eventCode) {
      // eventCode가 있으면 이벤트 코드로 이벤트 ID를 찾아서 이동
      checkEventCode(eventCode)
        .then((result) => {
          if (result.success && result.event && result.event.id) {

            const eventId = result.event.id;
            
            // 참여자 등록 시도
            const accessToken = getAccessToken();
            if (accessToken && user) {
              // 참여자 등록 처리 (비동기로 실행)
              handleParticipantRegistration(eventId);
              // API 호출 결과와 관계없이 이벤트 페이지로 이동
              navigate(`/event?id=${eventId}`);
            } else {
              // 로그인이 안된 경우 이벤트 정보를 sessionStorage에 저장하고 메인으로 이동
              sessionStorage.setItem('pendingEventId', eventId);
              sessionStorage.setItem('pendingEventUrl', `/event?id=${eventId}`);
              navigate('/');
              return;
            }
          } else {
            console.error('이벤트 코드 확인 실패:', result.error);
            navigate("/");
          }
        })
        .catch((error) => {
          console.error('이벤트 코드 확인 오류:', error);
          navigate("/");
        });
    } else {
      // 파라미터가 없으면 메인 페이지로 이동
      navigate("/");
    }
  }, [searchParams, navigate, handleParticipantRegistration]);

  // 컴포넌트 언마운트 시 진행 중인 요청 취소
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // eventId가 있으면 이벤트 페이지 컴포넌트 렌더링
  const eventId = searchParams.get('id');
  if (eventId) {
    return <EventPageContent onRequestNotificationPermission={handleRequestNotificationPermission} />;
  }

  // 로딩 상태 표시
  return (
    <div
      className="min-h-screen bg-white text-black flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-sm" style={{ opacity: 0.7 }}>이벤트를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function EventLoading() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>이벤트 페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function EventPage() {
  return (
    <Suspense fallback={<EventLoading />}>
      <EventPageWrapper />
    </Suspense>
  );
} 