"use client";

import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/components/common/Toast';

export default function NotificationPermission() {
  const { requestPermission, notificationPermission } = usePWA();
  const { showToast } = useToast();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const token = await requestPermission();
      if (token) {
        console.log('FCM Token received:', token);
        // 여기서 서버에 토큰을 전송할 수 있습니다
        showToast('알림 권한이 허용되었습니다!', 'success');
      } else {
        showToast('알림 권한이 거부되었습니다.', 'error');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      showToast('알림 권한 요청 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsRequesting(false);
    }
  };

  if (notificationPermission === 'granted') {
    return (
      <div className="fixed bottom-4 left-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
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
      <div className="fixed bottom-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm">알림 권한 거부됨</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
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
          {isRequesting ? '권한 요청 중...' : '알림 권한 요청'}
        </span>
      </button>
    </div>
  );
} 