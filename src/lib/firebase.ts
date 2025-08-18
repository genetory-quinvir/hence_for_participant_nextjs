import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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

// Firebase 설정이 완전한지 확인
const isFirebaseConfigured = firebaseConfig.projectId && 
                            firebaseConfig.apiKey && 
                            firebaseConfig.authDomain;

// Firebase 앱 초기화 (설정이 완전한 경우에만)
let app = null;
let messaging = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    // Firebase Cloud Messaging 초기화
    messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    app = null;
    messaging = null;
  }
} else {
  console.warn('Firebase configuration is incomplete. Please check your environment variables.');
}

// FCM 토큰 요청
export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      console.log('Messaging is not supported or Firebase is not configured');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      });
      
      console.log('FCM Token:', token);
      return token;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};

// 포그라운드 메시지 처리
export const onMessageListener = () => {
  if (!messaging) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      resolve(payload);
    });
  });
};

export { messaging };
export default app; 