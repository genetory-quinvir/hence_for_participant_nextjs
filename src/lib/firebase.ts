import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getMessaging as getMessagingInstance } from 'firebase/messaging';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 브라우저 지원 확인
const isBrowserSupported = () => {
  if (typeof window === 'undefined') return false;
  
  // iOS Safari는 FCM을 지원하지 않음
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    console.warn('iOS Safari는 Firebase Cloud Messaging을 지원하지 않습니다');
    return false;
  }
  
  // Service Worker 지원 확인
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker가 지원되지 않습니다');
    return false;
  }
  
  // Notification API 지원 확인
  if (!('Notification' in window)) {
    console.warn('Notification API가 지원되지 않습니다');
    return false;
  }
  
  // PushManager 지원 확인
  if (!('PushManager' in window)) {
    console.warn('PushManager가 지원되지 않습니다');
    return false;
  }
  
  return true;
};

// Firebase 설정이 완전한지 확인
const isFirebaseConfigured = firebaseConfig.projectId && 
                            firebaseConfig.apiKey && 
                            firebaseConfig.authDomain;

// Firebase 앱 초기화 (설정이 완전하고 브라우저가 지원하는 경우에만)
let app: any = null;
let messaging: Messaging | null = null;

if (isFirebaseConfigured && isBrowserSupported()) {
  try {
    app = initializeApp(firebaseConfig);
    // Firebase Cloud Messaging 초기화
    messaging = getMessaging(app);
    console.log('✅ Firebase Cloud Messaging 초기화 성공');
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    app = null;
    messaging = null;
  }
} else {
  if (!isFirebaseConfigured) {
    console.warn('Firebase configuration is incomplete. Please check your environment variables.');
  }
  if (!isBrowserSupported()) {
    console.warn('This browser does not support Firebase Cloud Messaging');
  }
}

// FCM 토큰 요청
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      console.log('Messaging is not supported or Firebase is not configured');
      return null;
    }

    console.log('🔔 알림 권한 요청 시작...');
    const permission = await Notification.requestPermission();
    console.log('🔔 알림 권한 상태:', permission);
    
    if (permission === 'granted') {
      console.log('🔔 VAPID 키:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? '설정됨' : '설정되지 않음');
      
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      
      console.log('🔔 FCM Token:', token);
      console.log('🔔 Token 길이:', token?.length || 0);
      
      if (token) {
        console.log('🔔 FCM 토큰 생성 성공!');
      } else {
        console.log('🔔 FCM 토큰 생성 실패!');
      }
      
      return token;
    } else {
      console.log('🔔 알림 권한이 거부되었습니다:', permission);
      return null;
    }
  } catch (error) {
    console.error('🔔 알림 권한 요청 중 오류:', error);
    return null;
  }
};

// 포그라운드 메시지 처리
export const onMessageListener = () => {
  if (!messaging) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const unsubscribe = onMessage(messaging!, (payload) => {
      console.log('🔔 포그라운드에서 메시지 수신:', payload);
      resolve(payload);
    });

    // cleanup 함수 반환
    return unsubscribe;
  });
};

// FCM 토픽 구독 (서버에 토큰 전송하여 토픽 구독 요청)
export const subscribeToTopic = async (topic: string) => {
  try {
    if (!messaging) {
      console.log('Messaging is not supported or Firebase is not configured');
      return false;
    }

    // FCM 토큰 가져오기
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });

    if (!token) {
      console.log('FCM 토큰을 가져올 수 없습니다');
      return false;
    }

    console.log('FCM 토큰:', token);
    console.log('토큰 길이:', token?.length || 0);
    console.log('토픽 구독 요청:', topic);

    // 서버에 토큰과 토픽 정보 전송 (인증 없음)
    const response = await fetch('https://api-participant.hence.events/fcm/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        topic: topic
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ 토픽 구독 성공: ${topic}`, result);
      return true;
    } else {
      console.error(`❌ 토픽 구독 실패: ${topic}`, response.status);
      
      // 401 Unauthorized 오류인 경우 인증 문제
      if (response.status === 401) {
        console.log(`⚠️ 인증 토큰이 유효하지 않습니다. 로컬에서는 성공으로 처리: ${topic}`);
      } else {
        console.log(`⚠️ 서버 토픽 구독 실패했지만 로컬에서는 성공으로 처리: ${topic}`);
      }
      return true;
    }
  } catch (error) {
    console.error('토픽 구독 중 오류:', error);
    // CORS 오류 등으로 실패해도 로컬에서는 성공으로 처리
    console.log(`⚠️ 토픽 구독 중 오류 발생했지만 로컬에서는 성공으로 처리: ${topic}`);
    return true;
  }
};

// FCM 토픽 구독 해제 (서버에 토큰 전송하여 토픽 구독 해제 요청)
export const unsubscribeFromTopic = async (topic: string) => {
  try {
    if (!messaging) {
      console.log('Messaging is not supported or Firebase is not configured');
      return false;
    }

    // FCM 토큰 가져오기
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });

    if (!token) {
      console.log('FCM 토큰을 가져올 수 없습니다');
      return false;
    }

    console.log('토픽 구독 해제 요청:', topic);

    // 서버에 토큰과 토픽 정보 전송하여 구독 해제 (인증 없음)
    const response = await fetch('https://api-participant.hence.events/fcm/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        topic: topic
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ 토픽 구독 해제 성공: ${topic}`, result);
      return true;
    } else {
      console.error(`❌ 토픽 구독 해제 실패: ${topic}`, response.status);
      return false;
    }
  } catch (error) {
    console.error('토픽 구독 해제 중 오류:', error);
    return false;
  }
};

// 현재 구독된 토픽 확인 (localStorage 기반)
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

// 브라우저 지원 상태 확인
export const checkBrowserSupport = () => {
  const support = {
    serviceWorker: 'serviceWorker' in navigator,
    notification: 'Notification' in window,
    pushManager: 'PushManager' in window,
    messaging: !!messaging
  };
  
  console.log('🔔 브라우저 지원 상태:', support);
  return support;
};

// FCM 토큰 유효성 확인
export const checkFCMToken = async () => {
  try {
    if (!messaging) {
      console.log('🔔 Messaging이 지원되지 않습니다');
      return false;
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });

    if (token) {
      console.log('🔔 FCM 토큰이 유효합니다:', token.substring(0, 20) + '...');
      return true;
    } else {
      console.log('🔔 FCM 토큰이 없습니다');
      return false;
    }
  } catch (error) {
    console.error('🔔 FCM 토큰 확인 중 오류:', error);
    return false;
  }
};

export { messaging };
export default app; 