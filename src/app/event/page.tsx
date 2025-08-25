"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { checkEventCode, registerParticipant, getAccessToken } from "@/lib/api";
import { useSimpleNavigation } from "@/utils/navigation";
import EventPageContent from "@/components/event/EventPageContent";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/common/Toast";

function EventPageWrapper() {
  const { navigate } = useSimpleNavigation();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  // 이벤트 코드나 ID로 리다이렉트 처리
  useEffect(() => {
    const eventCode = searchParams.get('code');
    const eventId = searchParams.get('id');
    
    if (eventId) {
      // eventId가 있으면 참여자 등록 후 동적 라우팅으로 이동
      const accessToken = getAccessToken();
      if (accessToken && user) {
        registerParticipant(eventId)
          .then((result) => {
            if (result.success) {
              console.log('✅ 참여자 등록 성공');
            } else {
              // 이미 참여 중인 경우 조용히 넘어가기
              if (result.error?.includes('이미 참여') || result.error?.includes('already')) {
                console.log('ℹ️ 이미 참여 중인 사용자');
              } else if (result.error?.includes('로그인이 만료')) {
                console.log('⚠️ 로그인이 만료됨');
                showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
              } else {
                console.log('⚠️ 참여자 등록 실패:', result.error);
              }
            }
          })
          .catch((error) => {
            console.error('❌ 참여자 등록 중 오류:', error);
          });
      } else {
        console.log('ℹ️ 로그인되지 않은 사용자 - 참여자 등록 건너뜀');
      }
    } else if (eventCode) {
      // eventCode가 있으면 이벤트 코드로 이벤트 ID를 찾아서 이동
      checkEventCode(eventCode)
        .then((result) => {
          if (result.success && result.event && result.event.id) {
            console.log('이벤트 코드 확인 성공:', result.event);
            const eventId = result.event.id;
            
            // 참여자 등록 후 이동
            const accessToken = getAccessToken();
            if (accessToken && user) {
              registerParticipant(eventId)
                .then((registerResult) => {
                  if (registerResult.success) {
                    console.log('✅ 참여자 등록 성공');
                  } else {
                    // 이미 참여 중인 경우 조용히 넘어가기
                    if (registerResult.error?.includes('이미 참여') || registerResult.error?.includes('already')) {
                      console.log('ℹ️ 이미 참여 중인 사용자');
                    } else if (registerResult.error?.includes('로그인이 만료')) {
                      console.log('⚠️ 로그인이 만료됨');
                      showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'warning');
                    } else {
                      console.log('⚠️ 참여자 등록 실패:', registerResult.error);
                    }
                  }
                  navigate(`/event?id=${eventId}`);
                })
                .catch((error) => {
                  console.error('❌ 참여자 등록 중 오류:', error);
                  navigate(`/event?id=${eventId}`);
                });
            } else {
              console.log('ℹ️ 로그인되지 않은 사용자 - 참여자 등록 건너뜀');
              navigate(`/event?id=${eventId}`);
            }
          } else {
            console.error('이벤트 코드 확인 실패:', result.error);
            navigate("/");
          }
        })
        .catch((error) => {
          console.error('이벤트 코드 확인 오류:', error);
          navigate("/");
        });
    } else {
      // 파라미터가 없으면 메인 페이지로 이동
      navigate("/");
    }
  }, [searchParams, navigate]);

  // eventId가 있으면 이벤트 페이지 컴포넌트 렌더링
  const eventId = searchParams.get('id');
  if (eventId) {
    return <EventPageContent />;
  }

  // 로딩 상태 표시
  return (
    <div
      className="min-h-screen bg-white text-black flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-white text-sm" style={{ opacity: 0.7 }}>이벤트를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function EventLoading() {
  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>이벤트 페이지를 불러오는 중...</p>
      </div>
    </div>
  );
}

// 메인 컴포넌트 (Suspense로 감싸기)
export default function EventPage() {
  return (
    <Suspense fallback={<EventLoading />}>
      <EventPageWrapper />
    </Suspense>
  );
} 