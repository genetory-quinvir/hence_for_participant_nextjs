# 🔐 Auth 에러 방지 가이드라인

프로젝트 전체에서 Auth 에러가 발생하지 않도록 하는 체계적인 접근 방법을 설명합니다.

## 📋 목차

1. [전체 구조](#전체-구조)
2. [사용 방법](#사용-방법)
3. [에러 처리 우선순위](#에러-처리-우선순위)
4. [모범 사례](#모범-사례)
5. [문제 해결](#문제-해결)

## 🏗️ 전체 구조

### **1. 에러 처리 계층**

```
┌─────────────────────────────────────┐
│           ErrorBoundary             │ ← 최상위 에러 캐치
├─────────────────────────────────────┤
│      Global Error Handler           │ ← 전역 에러 관리
├─────────────────────────────────────┤
│         API Wrapper                 │ ← API 요청 래핑
├─────────────────────────────────────┤
│      API Error Handler              │ ← API 에러 분석
├─────────────────────────────────────┤
│         Auth Context                │ ← 인증 상태 관리
└─────────────────────────────────────┘
```

### **2. 핵심 파일들**

- **`src/utils/apiErrorHandler.ts`**: API 에러 분석 및 처리
- **`src/utils/apiWrapper.ts`**: API 요청 래핑 및 자동 재시도
- **`src/utils/globalErrorHandler.ts`**: 전역 에러 저장소 및 관리
- **`src/components/ErrorBoundary.tsx`**: React 에러 바운더리
- **`src/contexts/AuthContext.tsx`**: 인증 상태 및 토큰 관리

## 🚀 사용 방법

### **1. 기본 API 요청 (권장)**

```typescript
import { apiWrapper } from '@/utils/apiWrapper';

// 인증이 필요한 API
const result = await apiWrapper(
  () => createPost(eventId, postType, content, images),
  {
    context: '게시글 작성',
    maxRetries: 3,
    onError: (error) => {
      console.log('게시글 작성 실패:', error);
    },
    onSuccess: (data) => {
      console.log('게시글 작성 성공:', data);
    }
  }
);

// 인증이 필요 없는 API
const result = await apiWrapper(
  () => getFeaturedEvent(eventId, currentDay),
  {
    requireAuth: false,
    context: '이벤트 정보 조회'
  }
);
```

### **2. 조건부 인증 API**

```typescript
import { conditionalApiWrapper } from '@/utils/apiWrapper';

const result = await conditionalApiWrapper(
  () => getUserProfile(),
  isAuthenticated, // 인증 상태에 따라 결정
  { context: '사용자 프로필 조회' }
);
```

### **3. 배치 API 요청**

```typescript
import { batchApiWrapper } from '@/utils/apiWrapper';

const results = await batchApiWrapper([
  () => getBoardList(eventId, postType, 1),
  () => getBoardList(eventId, postType, 2),
  () => getBoardList(eventId, postType, 3)
], {
  context: '게시글 목록 배치 조회',
  maxRetries: 2
});
```

### **4. 전역 에러 처리**

```typescript
import { useGlobalErrorHandler } from '@/utils/globalErrorHandler';

function MyComponent() {
  const { errors, hasUnhandledErrors, handleError, clearErrors } = useGlobalErrorHandler();

  // 에러 발생 시
  const handleApiCall = async () => {
    try {
      const result = await someApiCall();
      if (!result.success) {
        handleError(result, 'api', 'API 호출');
      }
    } catch (error) {
      handleError(error, 'unknown', '예상치 못한 오류');
    }
  };

  return (
    <div>
      {hasUnhandledErrors && (
        <div className="error-banner">
          처리되지 않은 오류가 있습니다.
          <button onClick={clearErrors}>확인</button>
        </div>
      )}
    </div>
  );
}
```

## 🎯 에러 처리 우선순위

### **1. 자동 처리 (우선순위: 높음)**

- ✅ **토큰 갱신**: `AUTH_REQUIRED` 에러 시 자동 시도
- ✅ **재시도 로직**: 네트워크 오류 시 자동 재시도
- ✅ **에러 분류**: 에러 타입별 자동 분류

### **2. 사용자 알림 (우선순위: 중간)**

- ✅ **에러 메시지**: 사용자 친화적인 메시지 표시
- ✅ **로딩 상태**: API 요청 중 로딩 표시
- ✅ **성공 피드백**: 성공 시 적절한 피드백

### **3. 수동 처리 (우선순위: 낮음)**

- ✅ **에러 로깅**: 개발자용 상세 로그
- ✅ **에러 통계**: 에러 발생 빈도 분석
- ✅ **디버깅 정보**: 문제 해결을 위한 정보

## 📚 모범 사례

### **1. 컴포넌트에서 API 호출**

```typescript
// ❌ 잘못된 방법
const handleSubmit = async () => {
  try {
    const result = await createPost(data);
    if (result.success) {
      // 성공 처리
    } else {
      // 에러 처리 (수동)
      if (result.error === 'AUTH_REQUIRED') {
        // 토큰 갱신 시도
        // 재시도 로직
        // 사용자 알림
      }
    }
  } catch (error) {
    // 에러 처리 (수동)
  }
};

// ✅ 권장 방법
const handleSubmit = async () => {
  const result = await apiWrapper(
    () => createPost(data),
    {
      context: '게시글 작성',
      onSuccess: (data) => {
        // 성공 처리만 집중
        router.push('/board/list');
      },
      onError: (error) => {
        // 에러 처리만 집중 (선택사항)
        console.log('사용자 정의 에러 처리:', error);
      }
    }
  );
};
```

### **2. 에러 바운더리 사용**

```typescript
// ❌ 잘못된 방법
function App() {
  return (
    <div>
      <ComponentThatMightError />
    </div>
  );
}

// ✅ 권장 방법
function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // 에러 통계 수집
        // 사용자 알림
        // 개발자 알림
      }}
    >
      <ComponentThatMightError />
    </ErrorBoundary>
  );
}
```

### **3. 전역 에러 모니터링**

```typescript
// ❌ 잘못된 방법
// 각 컴포넌트에서 개별적으로 에러 처리

// ✅ 권장 방법
function App() {
  const { hasUnhandledErrors, errors } = useGlobalErrorHandler();

  useEffect(() => {
    if (hasUnhandledErrors) {
      // 전역 에러 알림
      // 에러 통계 전송
      // 사용자 가이드 제공
    }
  }, [hasUnhandledErrors]);

  return (
    <div>
      {hasUnhandledErrors && (
        <GlobalErrorBanner errors={errors} />
      )}
      {children}
    </div>
  );
}
```

## 🔧 문제 해결

### **1. AUTH_REQUIRED 에러가 계속 발생하는 경우**

```typescript
// 문제 진단
import { getErrorStatistics } from '@/utils/globalErrorHandler';

const stats = getErrorStatistics();
console.log('에러 통계:', stats);

// 해결 방법
// 1. 토큰 저장소 확인
// 2. 토큰 갱신 로직 점검
// 3. 서버 응답 확인
```

### **2. 무한 재시도가 발생하는 경우**

```typescript
// 재시도 횟수 제한
const result = await apiWrapper(
  () => apiCall(),
  {
    maxRetries: 1, // 최대 1회만 재시도
    retryDelay: 2000 // 2초 대기
  }
);
```

### **3. 특정 에러만 처리하고 싶은 경우**

```typescript
// 에러 타입별 처리
const result = await apiWrapper(
  () => apiCall(),
  {
    onError: (error) => {
      if (error.error === 'AUTH_REQUIRED') {
        // 인증 에러만 특별 처리
        router.push('/sign');
      }
    }
  }
);
```

## 📊 모니터링 및 분석

### **1. 에러 통계 확인**

```typescript
import { getErrorStatistics } from '@/utils/globalErrorHandler';

// 개발자 도구에서 실행
const stats = getErrorStatistics();
console.table(stats);
```

### **2. 실시간 에러 모니터링**

```typescript
import { useGlobalErrorHandler } from '@/utils/globalErrorHandler';

function ErrorMonitor() {
  const { errors, hasUnhandledErrors } = useGlobalErrorHandler();

  useEffect(() => {
    if (hasUnhandledErrors) {
      // 에러 알림
      // 에러 리포트 전송
      // 사용자 가이드 제공
    }
  }, [hasUnhandledErrors]);

  return null; // UI 없음
}
```

## 🎉 결론

이 가이드라인을 따르면:

- ✅ **Auth 에러 자동 처리**: 사용자가 직접 처리할 필요 없음
- ✅ **일관된 에러 처리**: 모든 컴포넌트에서 동일한 방식
- ✅ **사용자 경험 향상**: 에러 발생 시 적절한 가이드 제공
- ✅ **개발 효율성**: 에러 처리 로직 중복 제거
- ✅ **유지보수성**: 중앙화된 에러 처리로 관리 용이

**핵심**: `apiWrapper`를 사용하여 모든 API 호출을 래핑하고, 에러 처리를 자동화하세요!
