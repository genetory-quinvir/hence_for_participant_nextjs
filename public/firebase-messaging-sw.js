// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase 설정 - 환경 변수에서 가져오기
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "hence-events.firebaseapp.com",
  projectId: "hence-events",
  storageBucket: "hence-events.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop",
  measurementId: "G-XXXXXXXXXX"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firebase Cloud Messaging 초기화
const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  console.log('Payload data:', payload.data);
  console.log('Payload notification:', payload.notification);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Hence Event';
  const notificationBody = payload.notification?.body || payload.data?.body || '새로운 알림이 있습니다.';
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: payload.data || {},
    tag: 'hence-event-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  console.log('Showing notification:', notificationTitle, notificationOptions);
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 