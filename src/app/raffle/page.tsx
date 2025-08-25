"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { getRaffleInfo, participateRaffle } from "@/lib/api";
import { useSimpleNavigation } from "@/utils/navigation";
import { useToast } from "@/components/common/Toast";

function RaffleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
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
              router.push(`/event?id=${eventId}`);
    } else {
      router.back();
    }
  };



  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !agreed) {
      showToast("모든 필수 항목을 입력해주세요.", "warning");
      return;
    }
    
    const eventId = searchParams.get('eventId');
    const raffleId = searchParams.get('raffleId');
    if (!eventId) {
      showToast("이벤트 ID가 없습니다.", "error");
      return;
    }
    if (!raffleId) {
      showToast("래플 ID가 없습니다.", "error");
      return;
    }

    if (!user?.id) {
      showToast("사용자 정보를 찾을 수 없습니다.", "error");
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
        showToast("응모가 완료되었습니다!", "success");
        // 응모 완료 후 이벤트 페이지로 돌아가기
        const eventId = searchParams.get('eventId');
        if (eventId) {
          router.replace(`/event?id=${eventId}`);
        } else {
          router.back();
        }
      } else {
        // 인증 오류인 경우 로그인 페이지로 리다이렉트
        if (result.error?.includes('인증') || result.error?.includes('토큰') || result.error?.includes('만료')) {
          router.replace("/sign?redirect=/raffle" + (searchParams.toString() ? `&${searchParams.toString()}` : ''));
        } else {
          showToast(result.error || "응모에 실패했습니다.", "error");
        }
      }
    } catch (error) {
      showToast("응모 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 인증 상태 확인 중이거나 인증되지 않은 경우 로딩 표시
  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center">
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
    <div className="min-h-screen bg-white text-black flex flex-col">
        <CommonNavigationBar
          leftButton={
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          }
          onLeftClick={handleBackClick}
          backgroundColor="white"
          backgroundOpacity={0}
          textColor="text-black"
          sticky={true}
        />

      {/* 메인 컨텐츠 */}
      <main className="flex-1 w-full px-4 overflow-y-auto" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom) + 16px)' }}>
        <div className="items-center justify-center flex flex-col px-4 py-4">
          <h2 className="text-2xl font-bold text-black text-center leading-relaxed mb-6">간단하게 응모하고<br/>
            <span className="text-purple-700">횃불제</span>만의 경품을 받아보세요</h2>
          
          <div 
            style={{
              animation: 'gentleBounce 1s ease-in-out infinite'
            }}
          >
            <img 
              src="/images/img_giftbox.png" 
              alt="선물상자" 
              className="w-32 h-32 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          
          <style jsx>{`
            @keyframes gentleBounce {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-8px);
              }
            }
          `}</style>
        </div>

        {/* 경품 안내 섹션 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 mt-4">상품 안내</h2>
            <div className="space-y-4">
            {raffleData?.prizes && raffleData.prizes.length > 0 ? (
              raffleData.prizes.map((prize: any, index: number) => (
                <div 
                  key={prize.id} 
                  className="bg-white rounded-2xl"
                >
                  <div className="flex items-center">
                    <div className="w-20 h-20 rounded-xl mr-2 flex items-center justify-center">
                      <img
                        src={prize.prizeRank === '1' ? '/images/icon_gold_medal.png' : 
                             prize.prizeRank === '2' ? '/images/icon_silver_medal.png' : 
                             prize.prizeRank === '3' ? '/images/icon_bronze_medal.png' : '/images/icon_purple_medal.png'}
                        alt="메달 아이콘"
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        <span className="text-gray-900 font-semibold text-md">{prize.prizeRank}등 <span className="text-gray-400 font-normal text-md ml-1">({prize.winnerCount}명)</span></span>
                      </div>
                      <h3 className="text-gray-900 font-medium text-base">{prize.prizeName}</h3>
                      <p className="text-gray-600 text-sm">{prize.prizeDescription}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // 기본 경품 정보 (데이터가 없을 때)
              <>
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center">
                      <span className="text-xl">🥇</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-900 font-semibold text-base">1등</span>
                        <span className="text-gray-500 text-sm">1명</span>
                      </div>
                      <h3 className="text-gray-900 font-medium text-base mb-1">최신형 스마트폰</h3>
                      <p className="text-gray-600 text-sm">2024년 최신 플래그십 스마트폰</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center">
                      <span className="text-xl">🥈</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-900 font-semibold text-base">2등</span>
                        <span className="text-gray-500 text-sm">3명</span>
                      </div>
                      <h3 className="text-gray-900 font-medium text-base mb-1">무선이어폰</h3>
                      <p className="text-gray-600 text-sm">프리미엄 무선이어폰 (화이트)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center">
                      <span className="text-xl">🥉</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-900 font-semibold text-base">3등</span>
                        <span className="text-gray-500 text-sm">5명</span>
                      </div>
                      <h3 className="text-gray-900 font-medium text-base mb-1">기프티콘</h3>
                      <p className="text-gray-600 text-sm">스타벅스 아메리카노 Tall 기프티콘</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-xl mr-4 flex items-center justify-center">
                      <span className="text-xl">🎁</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-900 font-semibold text-base">행운상</span>
                        <span className="text-gray-500 text-sm">100명</span>
                      </div>
                      <h3 className="text-gray-900 font-medium text-base mb-1">모바일 상품권</h3>
                      <p className="text-gray-600 text-sm">편의점 모바일 상품권 1000원</p>
                    </div>
                  </div>
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
              <p className="text-black text-sm" style={{ opacity: 0.7 }}>응모 상태를 확인하는 중...</p>
            </div>
          </div>
        ) : isParticipated ? (
          // 이미 응모한 경우
          <div className="mb-8 mt-8">
            <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="flex items-center justify-center mb-2">
              <img 
                  src="/images/icon_check.png" 
                  alt="완료 체크" 
                  className="w-8 h-8"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <h3 className="text-black font-bold text-xl ml-2">이미 응모가 완료되었습니다!</h3>
              </div>
              <p className="text-black text-sm" style={{ opacity: 0.7 }}>
                이미 이 이벤트에 응모하셨습니다.<br />
                당첨 발표를 기다려주세요!
              </p>
            </div>
          </div>
        ) : (
          // 응모하지 않은 경우 - 응모 폼 표시
          <>
            {/* 응모 정보 섹션 */}
            <div className="mb-8 mt-12">
              <h2 className="text-xl font-bold text-black mb-4">응모 정보</h2>
              
              {/* 이름 입력 */}
              <div className="mb-4">
                <label className="block text-black text-sm mb-2">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="실명을 입력해주세요"
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors placeholder-gray-400"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: 'black',
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }}
                  disabled={isSubmitting}
                />
              </div>

              {/* 전화번호 입력 */}
              <div className="mb-4">
                <label className="block text-black text-sm mb-2">전화번호</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  maxLength={13}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors placeholder-gray-400"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: 'black',
                    border: '1px solid rgba(0, 0, 0, 0.1)'
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
                  <span className="text-black text-sm">개인정보 수집 및 이용에 동의합니다 (필수)</span>
                </label>
              </div>
            </div>

            {/* 참여 안내 섹션 */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-black mb-4">참여 안내</h2>
              <div className="rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <ul className="space-y-2 text-black text-sm">
                  <li>• 응모 기간: {raffleData?.startDate ? new Date(raffleData.startDate).toLocaleDateString('ko-KR') : '축제 기간 중'} ~ {raffleData?.endDate ? new Date(raffleData.endDate).toLocaleDateString('ko-KR') : '축제 종료'}</li>
                  <li>• 당첨자 발표: 개별 연락 및 공지사항</li>
                  <li>• 중복 당첨 불가</li>
                  <li>• 허위 정보 입력 시 당첨 무효</li>
                </ul>
              </div>
            </div>

            {/* 응모하기 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || !phone.trim() || !agreed || isSubmitting}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${
                name.trim() && phone.trim() && agreed && !isSubmitting
                  ? "bg-purple-600 hover:bg-purple-700 text-white text-md"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
            <p className="text-center text-black text-xs mt-4" style={{ opacity: 0.6 }}>
              응모 완료 후 수정이 불가능하니 신중히 입력해주세요.
            </p>
            
            {/* Safe Area Bottom */}
            <div style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom) + 24px)' }}></div>
          </>
        )}

        {/* 에러 메시지 */}
        {participationError && (
          <div className="mt-4 p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <p className="text-red-400 text-sm">{participationError}</p>
          </div>
        )}
      </main>
    </div>
  );
}

// 로딩 컴포넌트
function RaffleLoading() {
  return (
    <div className="min-h-screen bg-white text-black">
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