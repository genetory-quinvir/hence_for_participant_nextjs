"use client";

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/components/common/Toast';
import { sendFCMToken } from '@/lib/api';

interface NotificationPermissionProps {
  compact?: boolean;
}

export default function NotificationPermission({ compact = false }: NotificationPermissionProps) {
  const { requestPermission, notificationPermission } = usePWA();
  const { showToast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [iosVersion, setIosVersion] = useState<string | null>(null);

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

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      // iOS에서 PWA로 설치되지 않은 경우 안내
      if (isIOS && !isPWA) {
        showToast('iOS에서는 홈화면에 추가 후 알림 권한을 요청해주세요.', 'info');
        setIsRequesting(false);
        return;
      }

      // iOS 16.4 이전 버전에서는 웹 푸시 알림 미지원
      if (isIOS && iosVersion) {
        const [major, minor] = iosVersion.split('.').map(Number);
        if (major < 16 || (major === 16 && minor < 4)) {
          showToast('iOS 16.4 이상에서만 웹 푸시 알림을 지원합니다.', 'info');
          setIsRequesting(false);
          return;
        }
      }

      const token = await requestPermission();
      if (token) {
        console.log('FCM Token received:', token);
        
        // FCM 토큰을 서버에 전송
        try {
          const sendResult = await sendFCMToken(token);
          if (sendResult.success) {
            showToast('알림 권한이 허용되었습니다!', 'success');
          } else {
            console.warn('FCM 토큰 전송 실패:', sendResult.error);
            if (isIOS) {
              showToast('iOS에서는 알림이 제한적일 수 있습니다.', 'info');
            } else {
              showToast('알림 권한이 허용되었습니다! (토큰 전송 실패)', 'success');
            }
          }
        } catch (error) {
          console.error('FCM 토큰 전송 중 오류:', error);
          if (isIOS) {
            showToast('iOS에서는 알림이 제한적일 수 있습니다.', 'info');
          } else {
            showToast('알림 권한이 허용되었습니다! (토큰 전송 실패)', 'success');
          }
        }
      } else {
        if (isIOS) {
          showToast('iOS 설정에서 알림을 허용해주세요.', 'info');
        } else {
          showToast('알림 권한이 거부되었습니다.', 'error');
        }
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      if (isIOS) {
        showToast('iOS에서는 설정에서 알림을 허용해주세요.', 'info');
      } else {
        showToast('알림 권한 요청 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  // Compact 모드 (네비게이션 바용)
  if (compact) {
    if (notificationPermission === 'granted') {
      return (
        <div className="flex items-center h-10 px-2 select-none">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="ml-2 text-md text-white">알림 허용됨</span>
        </div>
      );
    }

    if (notificationPermission === 'denied') {
      return (
        <div
          onClick={handleRequestPermission}
          className="flex items-center h-10 px-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer select-none"
          title="알림 권한 거부됨 - 다시 요청"
        >
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="ml-2 text-xs text-white" style={{ opacity: 0.7 }}>알림 설정</span>
        </div>
      );
    }

    return (
      <div
        onClick={handleRequestPermission}
        className="flex items-center h-10 px-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer select-none"
        title="알림 권한 요청"
      >
        {isRequesting ? (
          <>
            <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2 text-xs text-white" style={{ opacity: 0.7 }}>요청 중…</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4.19A4 4 0 006.73 3H11l5 5v6.27a4 4 0 11-1.46-2.73L12 9H6.73a4 4 0 01-2.54-1.46z" />
            </svg>
            <span className="ml-2 text-xs text-white" style={{ opacity: 0.7 }}>알림 요청</span>
          </>
        )}
      </div>
    );
  }

  // 기존 하단 고정 모드
  if (notificationPermission === 'granted') {
    return (
      <div className="fixed bottom-4 left-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg" style={{ 
        bottom: 'max(16px, env(safe-area-inset-bottom) + 4px)',
        left: 'max(16px, env(safe-area-inset-left) + 4px)'
      }}>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm">알림 권한 허용됨</span>
        </div>
      </div>
    );
  }

  if (notificationPermission === 'denied') {
    return (
      <div className="fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg" style={{ 
        bottom: 'max(16px, env(safe-area-inset-bottom) + 4px)',
        left: 'max(16px, env(safe-area-inset-left) + 4px)'
      }}>
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm">
            {isIOS ? 'iOS 설정에서 알림 허용 필요' : '알림 권한 거부됨'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg" style={{ 
      bottom: 'max(16px, env(safe-area-inset-bottom) + 4px)',
      left: 'max(16px, env(safe-area-inset-left) + 4px)'
    }}>
      {isIOS && !isPWA && (
        <div className="mb-2 p-2 bg-blue-600 rounded text-xs">
          📱 iOS: Safari에서 "홈화면에 추가" 후 PWA로 실행해주세요
        </div>
      )}
      {isIOS && iosVersion && (
        <div className="mb-2 p-2 bg-yellow-600 rounded text-xs">
          📱 iOS {iosVersion}: {parseInt(iosVersion.split('.')[0]) < 16 || (parseInt(iosVersion.split('.')[0]) === 16 && parseInt(iosVersion.split('.')[1]) < 4) 
            ? '웹 푸시 알림을 지원하지 않습니다' 
            : '웹 푸시 알림을 지원합니다'}
        </div>
      )}
      <button
        onClick={handleRequestPermission}
        disabled={isRequesting}
        className="flex items-center space-x-2 disabled:opacity-50"
      >
        {isRequesting ? (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4.19A4 4 0 006.73 3H11l5 5v6.27a4 4 0 11-1.46-2.73L12 9H6.73a4 4 0 01-2.54-1.46z" />
          </svg>
        )}
        <span className="text-sm">
          {isRequesting ? '권한 요청 중...' : 
           isIOS && !isPWA ? '홈화면에 추가 후 권한 요청' : '알림 권한 요청'}
        </span>
      </button>
    </div>
  );
} 