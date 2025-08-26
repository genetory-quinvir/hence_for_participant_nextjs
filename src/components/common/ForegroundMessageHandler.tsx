"use client";

import { useEffect } from 'react';
import { onMessageListener, messaging } from '@/lib/firebase';
import { onMessage } from 'firebase/messaging';

export function ForegroundMessageHandler() {
  useEffect(() => {
    // 브라우저 지원 확인
    if (!('serviceWorker' in navigator)) {
      console.log('🔔 Service Worker가 지원되지 않습니다');
      return;
    }
    
    if (!('Notification' in window)) {
      console.log('🔔 Notification API가 지원되지 않습니다');
      return;
    }
    
    if (!messaging) {
      console.log('🔔 Messaging이 지원되지 않습니다');
      return;
    }

    console.log('🔔 포그라운드 메시지 리스너 설정 중...');

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('🔔 포그라운드에서 메시지 수신:', payload);
      
      // 브라우저 알림 표시
      const notificationTitle = payload.notification?.title || 
                               payload.data?.title || 
                               'Hence Event';
      const notificationBody = payload.notification?.body || 
                              payload.data?.body || 
                              '새로운 알림이 있습니다.';
      
      // 브라우저 알림 권한 확인
      if (Notification.permission === 'granted') {
        const notification = new Notification(notificationTitle, {
          body: notificationBody,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          vibrate: [100, 50, 100],
          data: payload.data || {},
          tag: 'hence-event-notification',
          requireInteraction: false
        });

        // 알림 클릭 처리
        notification.onclick = () => {
          notification.close();
          // 알림 클릭 시 앱으로 포커스
          window.focus();
        };

        console.log('🔔 브라우저 알림 표시됨:', notificationTitle);
      } else {
        console.log('🔔 알림 권한이 없어서 브라우저 알림을 표시할 수 없습니다');
      }
    });

    console.log('🔔 포그라운드 메시지 리스너 설정 완료');

    return () => {
      console.log('🔔 포그라운드 메시지 리스너 해제');
      unsubscribe();
    };
  }, []);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
}
