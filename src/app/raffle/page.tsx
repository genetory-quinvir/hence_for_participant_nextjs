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

  const handleBackClick = () => {
    const eventId = searchParams.get('eventId');
    if (eventId) {
      router.push(`/event/${eventId}`);
    } else {
      router.back();
    }
  };



  const handleSubmit = async () => {
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
        {/* 이벤트 설명 섹션 */}
        <div className="mb-8">
          <div className="rounded-2xl p-6 relative overflow-hidden" style={{ 
            background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(168, 85, 247, 0.2) 50%, rgba(196, 181, 253, 0.1) 100%)',
            border: '1px solid rgba(147, 51, 234, 0.3)'
          }}>
            {/* 배경 장식 요소들 */}
            <div className="absolute top-2 right-2 text-4xl opacity-20">🎁</div>
            <div className="absolute bottom-2 left-2 text-3xl opacity-20">🎯</div>
            <div className="absolute top-1/2 right-4 text-2xl opacity-15">⭐</div>
            
            <div className="flex items-center relative z-10">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h1 className="text-2xl font-bold text-white mr-3">{raffleData?.title || '횃불제만의 경품 이벤트'}</h1>
                </div>
                <p className="text-white text-base mb-3" style={{ opacity: 0.9 }}>
                  {raffleData?.description || '서울과학기술대학교 학생들만을 위한 특별한 경품 이벤트!'}
                </p>
                                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-white" style={{ opacity: 0.6 }}>
                      <span>현재까지 <span className="text-white text-md font-light">{raffleData?.participantCount || 0}</span>명이 응모중이에요</span>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* 경품 안내 섹션 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">경품 안내</h2>
          <div className="space-y-3">
            {raffleData?.prizes && raffleData.prizes.length > 0 ? (
              raffleData.prizes.map((prize: any, index: number) => (
                <div key={prize.id} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center flex-1">
                      <div className="w-12 h-12 rounded-lg mr-4 flex items-center justify-center" style={{ backgroundColor: 'rgba(147, 51, 234, 0.2)' }}>
                        <span className="text-2xl">
                          {prize.prizeRank === '1' ? '🥇' : 
                           prize.prizeRank === '2' ? '🥈' : 
                           prize.prizeRank === '3' ? '🥉' : '🎁'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-purple-600 font-bold text-md mr-2">{prize.prizeRank}등</span>
                          <span className="text-white text-sm" style={{ opacity: 0.7 }}>({prize.winnerCount}명)</span>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-1">{prize.prizeName}</h3>
                        <p className="text-white text-sm" style={{ opacity: 0.7 }}>{prize.prizeDescription}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // 기본 경품 정보 (데이터가 없을 때)
              <>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🥇</span>
                    <span className="text-purple-600 font-bold">1등 (1명)</span>
                  </div>
                  <p className="text-white font-semibold">최신형 스마트폰</p>
                  <p className="text-white text-sm" style={{ opacity: 0.7 }}>2024년 최신 플래그십 스마트폰</p>
                </div>

                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🥈</span>
                    <span className="text-purple-600 font-bold">2등 (3명)</span>
                  </div>
                  <p className="text-white font-semibold">무선이어폰</p>
                  <p className="text-white text-sm" style={{ opacity: 0.7 }}>프리미엄 무선이어폰 (화이트)</p>
                </div>

                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🥉</span>
                    <span className="text-purple-600 font-bold">3등 (5명)</span>
                  </div>
                  <p className="text-white font-semibold">기프티콘</p>
                  <p className="text-white text-sm" style={{ opacity: 0.7 }}>스타벅스 아메리카노 Tall 기프티콘</p>
                </div>

                <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🎁</span>
                    <span className="text-purple-600 font-bold">행운상 (100명)</span>
                  </div>
                  <p className="text-white font-semibold">모바일 상품권</p>
                  <p className="text-white text-sm" style={{ opacity: 0.7 }}>편의점 모바일 상품권 1000원</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 응모 상태에 따른 조건부 렌더링 */}
        {isLoadingParticipation ? (
          // 로딩 상태
          <div className="mb-8">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-sm" style={{ opacity: 0.7 }}>응모 상태를 확인하는 중...</p>
            </div>
          </div>
        ) : isParticipated ? (
          // 이미 응모한 경우
          <div className="mb-8">
            <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <h3 className="text-white font-bold text-xl mb-2">응모가 완료되었습니다</h3>
              <p className="text-white text-sm" style={{ opacity: 0.7 }}>
                이미 이 이벤트에 응모하셨습니다.<br />
                당첨 발표를 기다려주세요!
              </p>
            </div>
          </div>
        ) : (
          // 응모하지 않은 경우 - 응모 폼 표시
          <>
            {/* 응모 정보 섹션 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">응모 정보</h2>
              
              {/* 이름 입력 */}
              <div className="mb-4">
                <label className="block text-white text-sm mb-2">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="실명을 입력해주세요"
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {/* 전화번호 입력 */}
              <div className="mb-4">
                <label className="block text-white text-sm mb-2">전화번호</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  maxLength={13}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {/* 개인정보 동의 */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mr-3 w-4 h-4 text-purple-600"
                    style={{ accentColor: '#9333ea' }}
                    disabled={isSubmitting}
                  />
                  <span className="text-white text-sm">개인정보 수집 및 이용에 동의합니다 (필수)</span>
                </label>
              </div>
            </div>

            {/* 참여 안내 섹션 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-4">참여 안내</h2>
              <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <ul className="space-y-2 text-white text-sm">
                  <li>• 응모 기간: {raffleData?.startDate ? new Date(raffleData.startDate).toLocaleDateString('ko-KR') : '축제 기간 중'} ~ {raffleData?.endDate ? new Date(raffleData.endDate).toLocaleDateString('ko-KR') : '축제 종료'}</li>
                  <li>• 발표일: 축제 종료 후 1주일 이내</li>
                  <li>• 당첨자 발표: 개별 연락 및 공지사항</li>
                  <li>• 중복 당첨 가능</li>
                  <li>• 허위 정보 입력 시 당첨 무효</li>
                  <li>• 경품 수령 불가 시 다음 순번으로 이월</li>
                  {raffleData?.maxWinners && (
                    <li>• 총 당첨자 수: {raffleData.maxWinners}명</li>
                  )}
                  {raffleData?.participantCount !== undefined && (
                    <li>• 현재 참여자 수: {raffleData.participantCount}명</li>
                  )}
                </ul>
              </div>
            </div>

            {/* 응모하기 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || !phone.trim() || !agreed || isSubmitting}
              className={`w-full py-4 rounded-xl font-medium transition-colors ${
                name.trim() && phone.trim() && agreed && !isSubmitting
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
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

            {/* 안내 문구 */}
            <p className="text-center text-white text-xs mt-4" style={{ opacity: 0.6 }}>
              응모 완료 후 수정이 불가능하니 신중히 입력해주세요.
            </p>
          </>
        )}

        {/* 에러 메시지 */}
        {participationError && (
          <div className="mt-4 p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <p className="text-red-400 text-sm">{participationError}</p>
          </div>
        )}
      </main>

      {/* 네비게이션바 */}
      <div className="absolute top-0 left-0 right-0 z-50">
        <CommonNavigationBar
          title="이벤트 응모"
          leftButton={
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
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