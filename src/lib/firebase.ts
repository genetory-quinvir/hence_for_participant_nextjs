// Firebase Cloud Messaging 비활성화
// import { initializeApp } from 'firebase/app';
// import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
// import { getMessaging as getMessagingInstance } from 'firebase/messaging';

// Firebase 설정 (FCM 비활성화)
const firebaseConfig = {
  // apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  // messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  // appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Firebase 앱 초기화 (비활성화)
export const initializeFirebase = () => {
  console.log('🚫 Firebase Cloud Messaging이 비활성화되었습니다');
};

// FCM 토큰 요청 (비활성화)
export const requestNotificationPermission = async () => {
  console.log('🚫 FCM 알림 권한 요청이 비활성화되었습니다');
  return null;
};

// 포그라운드 메시지 처리 (비활성화)
export const onMessageListener = () => {
  console.log('🚫 FCM 메시지 리스너가 비활성화되었습니다');
  return Promise.resolve(null);
};

// FCM 토픽 구독 (비활성화)
export const subscribeToTopic = async (topic: string) => {
  console.log('🚫 FCM 토픽 구독이 비활성화되었습니다:', topic);
  return true; // 성공으로 처리하여 UI가 깨지지 않도록
};

// FCM 토픽 구독 해제 (비활성화)
export const unsubscribeFromTopic = async (topic: string) => {
  console.log('🚫 FCM 토픽 구독 해제가 비활성화되었습니다:', topic);
  return true; // 성공으로 처리하여 UI가 깨지지 않도록
};

// 현재 구독된 토픽 확인 (localStorage 기반, 유지)
export const getSubscribedTopics = () => {
  const topics: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('notificationPermissionRequested_')) {
      const eventId = key.replace('notificationPermissionRequested_', '');
      const status = localStorage.getItem(key);
      if (status === 'requested') {
        topics.push(`event_${eventId}`);
      }
    }
  }
  
  console.log('🔔 현재 구독된 토픽 (localStorage):', topics);
  return topics;
};

// 브라우저 지원 상태 확인 (비활성화)
export const checkBrowserSupport = () => {
  const support = {
    serviceWorker: false,
    notification: false,
    pushManager: false,
    messaging: false
  };
  
  console.log('🚫 FCM 브라우저 지원이 비활성화되었습니다:', support);
  return support;
};

// FCM 토큰 유효성 확인 (비활성화)
export const checkFCMToken = async () => {
  console.log('🚫 FCM 토큰 확인이 비활성화되었습니다');
  return false;
};

// 더미 export (타입 에러 방지)
export const messaging = null;
export default null; 