"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { checkEventCode } from "@/lib/api";

function EventPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 이벤트 코드나 ID로 리다이렉트 처리
  useEffect(() => {
    const eventCode = searchParams.get('code');
    const eventId = searchParams.get('eventId');
    
    if (eventId) {
      // eventId가 있으면 직접 동적 라우팅으로 이동
      router.replace(`/event/${eventId}`);
    } else if (eventCode) {
      // eventCode가 있으면 이벤트 코드로 이벤트 ID를 찾아서 이동
      checkEventCode(eventCode)
        .then((result) => {
          if (result.success && result.event && result.event.id) {
            console.log('이벤트 코드 확인 성공:', result.event);
            router.replace(`/event/${result.event.id}`);
          } else {
            console.error('이벤트 코드 확인 실패:', result.error);
            router.push("/");
          }
        })
        .catch((error) => {
          console.error('이벤트 코드 확인 오류:', error);
          router.push("/");
        });
    } else {
      // 파라미터가 없으면 메인 페이지로 이동
      router.push("/");
    }
  }, [searchParams, router]);

  // 로딩 상태 표시
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>이벤트 페이지로 이동 중...</p>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function EventPageLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>이벤트 페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 직접 내보내기
export default function EventPage() {
  return (
    <Suspense fallback={<EventPageLoading />}>
      <EventPageContent />
    </Suspense>
  );
} 