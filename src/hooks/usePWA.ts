import { useState, useEffect } from 'react';
import { requestNotificationPermission, onMessageListener } from '@/lib/firebase';

// 타입 확장
declare global {
  interface Window {
    deferredPrompt?: any;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // PWA 설치 상태 확인
  useEffect(() => {
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = window.navigator.standalone === true;
      setIsInstalled(isStandalone || isInApp);
    };

    checkInstallation();
    window.addEventListener('beforeinstallprompt', checkInstallation);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', checkInstallation);
    };
  }, []);

  // 온라인 상태 확인
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service Worker 등록
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Firebase SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('Firebase SW registration failed: ', registrationError);
        });
    }
  }, []);

  // 알림 권한 요청
  const requestPermission = async () => {
    try {
      const token = await requestNotificationPermission();
      setFcmToken(token);
      setNotificationPermission(Notification.permission);
      return token;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return null;
    }
  };

  // 포그라운드 메시지 리스너
  useEffect(() => {
    if (notificationPermission === 'granted') {
      console.log('🔔 포그라운드 메시지 리스너 설정 중...');
      const messagePromise = onMessageListener();
      if (messagePromise && typeof messagePromise.then === 'function') {
        messagePromise
          .then((payload: any) => {
            console.log('📨 포그라운드 메시지 수신:', payload);
            console.log('📨 메시지 데이터:', payload.data);
            console.log('📨 알림 정보:', payload.notification);
            
            // 포그라운드에서도 알림 표시
            if (payload.notification) {
              const { title, body } = payload.notification;
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, {
                  body,
                  icon: '/icons/icon-192x192.png',
                  badge: '/icons/icon-72x72.png',
                  tag: 'hence-event-notification'
                });
              }
            }
          })
          .catch((err: any) => {
            console.error('❌ 포그라운드 메시지 수신 오류:', err);
          });
      }
    }
  }, [notificationPermission]);

  // PWA 설치 프롬프트
  const showInstallPrompt = () => {
    if ('beforeinstallprompt' in window) {
      const promptEvent = window.deferredPrompt;
      if (promptEvent) {
        promptEvent.prompt();
        promptEvent.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          } else {
            console.log('User dismissed the install prompt');
          }
          window.deferredPrompt = null;
        });
      }
    }
  };

  return {
    isInstalled,
    isOnline,
    fcmToken,
    notificationPermission,
    requestPermission,
    showInstallPrompt
  };
} 