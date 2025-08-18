# Hence Event App

Hence 이벤트 참여자 앱입니다.

## PWA + Firebase Cloud Messaging 설정

### 1. Firebase 프로젝트 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Cloud Messaging 활성화
3. 웹 앱 추가 및 설정 정보 복사

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Cloud Messaging VAPID Key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
```

### 3. Firebase Cloud Messaging VAPID Key 생성

1. Firebase Console → 프로젝트 설정 → Cloud Messaging
2. 웹 푸시 인증서 생성
3. 생성된 키를 `NEXT_PUBLIC_FIREBASE_VAPID_KEY`에 설정

### 4. PWA 아이콘 생성

`public/icons/` 디렉토리에 다음 크기의 아이콘들을 생성하세요:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### 5. 사용법

```typescript
import { usePWA } from '@/hooks/usePWA';

function MyComponent() {
  const { 
    isInstalled, 
    isOnline, 
    fcmToken, 
    notificationPermission, 
    requestPermission, 
    showInstallPrompt 
  } = usePWA();

  // 알림 권한 요청
  const handleRequestPermission = async () => {
    const token = await requestPermission();
    if (token) {
      // 서버에 토큰 전송
      console.log('FCM Token:', token);
    }
  };

  return (
    <div>
      {!isInstalled && (
        <button onClick={showInstallPrompt}>
          앱 설치하기
        </button>
      )}
      
      {notificationPermission !== 'granted' && (
        <button onClick={handleRequestPermission}>
          알림 권한 요청
        </button>
      )}
    </div>
  );
}
```

## 개발 서버 실행

```bash
npm run dev
```

## 빌드

```bash
npm run build
```

## 배포

```bash
npm start
```
