"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { getRaffleInfo, participateRaffle } from "@/lib/api";

function RaffleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParticipated, setIsParticipated] = useState(false);
  const [isLoadingParticipation, setIsLoadingParticipation] = useState(true);
  const [participationError, setParticipationError] = useState<string | null>(null);
  const [raffleData, setRaffleData] = useState<any>(null);

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 길이에 따라 포맷팅
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
  };

  // 래플 참여 상태 확인
  useEffect(() => {
    const checkParticipation = async () => {
      const eventId = searchParams.get('eventId');
      if (!eventId) {
        setParticipationError('이벤트 ID가 없습니다.');
        setIsLoadingParticipation(false);
        return;
      }

      try {
        const result = await getRaffleInfo(eventId);
        console.log('API 응답 전체:', result);
        if (result.success) {
          console.log('isParticipated 값:', result.isParticipated);
          console.log('래플 정보:', result.raffle);
          const participated = result.isParticipated || false;
          console.log('설정할 participated 값:', participated);
          setIsParticipated(participated);
          setRaffleData(result.raffle);
          console.log('상태 업데이트 완료');
        } else {
          // 인증 오류인 경우 로그인 페이지로 리다이렉트
          if (result.error?.includes('인증') || result.error?.includes('토큰') || result.error?.includes('만료')) {
            router.replace("/sign?redirect=/raffle" + (searchParams.toString() ? `&${searchParams.toString()}` : ''));
          } else {
            setParticipationError(result.error || '래플 정보를 가져오는데 실패했습니다.');
          }
        }
      } catch (error) {
        setParticipationError('래플 정보를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoadingParticipation(false);
      }
    };

    if (isAuthenticated && user) {
      checkParticipation();
    } else {
      setIsLoadingParticipation(false);
    }
  }, [isAuthenticated, user, searchParams]);

  // isParticipated 상태 변화 추적
  useEffect(() => {
    console.log('isParticipated 상태 변화:', isParticipated);
  }, [isParticipated]);

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트 (히스토리에서 삭제)
  if (!authLoading && (!isAuthenticated || !user)) {
    router.replace("/sign?redirect=/raffle" + (searchParams.toString() ? `&${searchParams.toString()}` : ''));
    return null;
  }

  const handleParticipate = async () => {
    if (!name.trim() || !phone.trim() || !agreed) {
      alert("모든 필수 항목을 입력해주세요.");
      return;
    }
    
    const eventId = searchParams.get('eventId');
    const raffleId = searchParams.get('raffleId');
    if (!eventId) {
      alert("이벤트 ID가 없습니다.");
      return;
    }
    if (!raffleId) {
      alert("래플 ID가 없습니다.");
      return;
    }

    if (!user?.id) {
      alert("사용자 정보를 찾을 수 없습니다.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await participateRaffle(eventId, raffleId, {
        userId: user.id,
        realName: name.trim(),
        phoneNumber: phone.trim(),
        privacyAgreement: agreed,
      });

      if (result.success) {
        alert("응모가 완료되었습니다!");
        // 응모 완료 후 이벤트 페이지로 돌아가기
        const eventId = searchParams.get('eventId');
        if (eventId) {
          router.replace(`/event/${eventId}`);
        } else {
          router.back();
        }
      } else {
        // 인증 오류인 경우 로그인 페이지로 리다이렉트
        if (result.error?.includes('인증') || result.error?.includes('토큰') || result.error?.includes('만료')) {
          router.replace("/sign?redirect=/raffle" + (searchParams.toString() ? `&${searchParams.toString()}` : ''));
        } else {
          alert(result.error || "응모에 실패했습니다.");
        }
      }
    } catch (error) {
      alert("응모 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 인증 상태 확인 중이거나 인증되지 않은 경우 로딩 표시
  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm" style={{ opacity: 0.7 }}>
            {authLoading ? '인증 상태 확인 중...' : '메인 페이지로 이동 중...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* 메인 컨텐츠 */}
      <main className="w-full min-h-screen overflow-y-auto px-4 pt-20 pb-8">
        {/* 래플 정보 */}
        {raffleData && (
          <div className="space-y-6">
            {/* 래플 제목 */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">
                {raffleData.title || '래플'}
              </h1>
              <p className="text-white text-lg" style={{ opacity: 0.7 }}>
                {raffleData.description || '래플에 참여해보세요!'}
              </p>
            </div>

            {/* 래플 이미지 */}
            {raffleData.imageUrl && (
              <div className="w-full aspect-video rounded-xl overflow-hidden">
                <img 
                  src={raffleData.imageUrl} 
                  alt="래플 이미지"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* 래플 정보 */}
            <div className="space-y-4">
              {/* 참여 기간 */}
              {raffleData.startDate && raffleData.endDate && (
                <div className="bg-white bg-opacity-5 rounded-xl p-4">
                  <h3 className="text-white font-semibold text-lg mb-2">참여 기간</h3>
                  <p className="text-white" style={{ opacity: 0.8 }}>
                    {new Date(raffleData.startDate).toLocaleDateString('ko-KR')} ~ {new Date(raffleData.endDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              )}

              {/* 당첨자 수 */}
              {raffleData.winnerCount && (
                <div className="bg-white bg-opacity-5 rounded-xl p-4">
                  <h3 className="text-white font-semibold text-lg mb-2">당첨자 수</h3>
                  <p className="text-white text-2xl font-bold text-purple-400">
                    {raffleData.winnerCount}명
                  </p>
                </div>
              )}

              {/* 참여 현황 */}
              <div className="bg-white bg-opacity-5 rounded-xl p-4">
                <h3 className="text-white font-semibold text-lg mb-2">참여 현황</h3>
                <p className="text-white text-2xl font-bold text-green-400">
                  {raffleData.participantCount || 0}명 참여
                </p>
              </div>
            </div>

            {/* 참여 버튼 */}
            <div className="pt-4">
              <button
                onClick={handleParticipate}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                  isSubmitting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    응모 중...
                  </div>
                ) : (
                  "응모하기"
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 네비게이션바 */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <CommonNavigationBar 
          title="래플"
          backgroundColor="transparent"
          backgroundOpacity={0}
          textColor="text-white"
        />
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function RaffleLoading() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">로딩 중...</div>
      </div>
    </div>
  );
}

// Suspense로 감싸는 메인 컴포넌트
export default function RafflePage() {
  return (
    <Suspense fallback={<RaffleLoading />}>
      <RaffleContent />
    </Suspense>
  );
} 