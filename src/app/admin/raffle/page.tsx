'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RaffleItem } from '@/types/api';
import { apiRequest } from '@/lib/api';

export default function AdminRafflePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [raffleData, setRaffleData] = useState<RaffleItem | null>(null);
  const [isLoadingRaffle, setIsLoadingRaffle] = useState(false);
  const [prizes, setPrizes] = useState<{
    id: string;
    name: string;
    description: string;
    icon: string;
    rank: string;
    winnerCount: number;
  }[]>([]);
  const [raffleResults, setRaffleResults] = useState<{
    [prizeId: string]: {
      winners: { id: string; name: string; phone: string; }[];
      isRaffling: boolean;
      currentWinner: { id: string; name: string; phone: string; } | null;
    }
  }>({});
  const [showRaffleScreen, setShowRaffleScreen] = useState(false);
  const [currentRafflePrize, setCurrentRafflePrize] = useState<{
    id: string;
    name: string;
    description: string;
    icon: string;
    rank: string;
    winnerCount: number;
  } | null>(null);
  const [raffleAnimation, setRaffleAnimation] = useState<'idle' | 'spinning' | 'result' | 'completed'>('idle');
  const [raffleWinners, setRaffleWinners] = useState<{
    id: string;
    name: string;
    phone: string;
  }[]>([]);
  const [currentWinner, setCurrentWinner] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);
  const [slotMachineData, setSlotMachineData] = useState<{
    name: string;
    phone: string;
  }>({ name: '', phone: '' });

  // Admin 권한 검증
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // 로컬 스토리지에서 사용자 정보 확인
        const userData = localStorage.getItem('user');
        
        if (!userData) {
          alert('로그인이 필요합니다.');
          router.push('/sign');
          return;
        }

        const user = JSON.parse(userData);
        console.log('사용자 정보:', user); // 디버깅용
        console.log('사용자 role:', user.role); // 디버깅용
        
        if (user.role === 'admin') {
          setIsAdmin(true);
          await loadRaffleData('3158612a-6764-11f0-aaae-6de7418cfa45');
        } else {
          console.log('Admin 권한 없음:', user); // 디버깅용
          const userRole = user.role || '없음';
          alert(`관리자 권한이 필요합니다.\n현재 role: "${userRole}"\n필요한 role: "admin"`);
          router.push('/');
        }
      } catch (error) {
        console.error('Admin 권한 확인 실패:', error);
        alert('권한 확인 중 오류가 발생했습니다.');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [router]);


  // 래플 정보 로드 (apiRequest 사용)
  const loadRaffleData = async (eventId: string) => {
    setIsLoadingRaffle(true);
    try {
      console.log('🔄 래플 정보 로드 시작...', eventId);
      
      // apiRequest 사용하여 API 호출
      const result = await apiRequest(`https://api-participant.hence.events/raffles/${eventId}/153d5d80-62e9-11f0-aaae-6de7418cfa44`, {
        method: 'GET',
      });

      console.log('🔍 래플 API 응답 상세:', {
        success: result.success,
        error: result.error,
        status: result.status,
        hasData: !!result.data
      });

      if (!result.success) {
        throw new Error(result.error || 'API 요청 실패');
      }

      const data = result.data as any;
      console.log('✅ 래플 정보 로드 성공:', data);
      
      if (data.data) {
        setRaffleData(data.data);
        
        // 상품 정보를 prizes 상태로 변환 (꼴등부터 1등까지 순서로 정렬)
        if (data.data.prizes && data.data.prizes.length > 0) {
          const convertedPrizes = data.data.prizes.map((prize: any) => ({
            id: prize.id,
            name: prize.prizeName,
            description: prize.prizeDescription,
            icon: getPrizeIcon(prize.prizeRank),
            rank: prize.prizeRank,
            winnerCount: prize.winnerCount
          }));
          
          // 4등(P등)부터 1등까지 순서로 정렬 (P등이 먼저, 1등이 마지막)
          const sortedPrizes = convertedPrizes.sort((a: any, b: any) => {
            const rankOrder = { 'P': 0, '4': 0, '3': 1, '2': 2, '1': 3 };
            const aOrder = rankOrder[a.rank as keyof typeof rankOrder] ?? 999;
            const bOrder = rankOrder[b.rank as keyof typeof rankOrder] ?? 999;
            return aOrder - bOrder;
          });
          
          setPrizes(sortedPrizes);
          console.log('✅ 상품 정보 변환 완료 (정렬됨):', sortedPrizes);
        } else {
          console.log('⚠️ 상품 정보가 없습니다.');
          setPrizes([]);
        }
      } else {
        console.error('❌ 래플 데이터가 없습니다.');
        setRaffleData(null);
        setPrizes([]);
      }
    } catch (error) {
      console.error('❌ 래플 정보 로드 실패:', error);
      console.error('❌ 에러 상세 정보:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      alert('래플 정보를 불러오는 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
      setRaffleData(null);
      setPrizes([]);
    } finally {
      setIsLoadingRaffle(false);
    }
  };

  // 상품 등급에 따른 아이콘 반환
  const getPrizeIcon = (rank: string) => {
    switch (rank) {
      case '1':
        return '/images/img_applewatch.png';
      case '2':
        return '/images/img_airpod.png';
      case '3':
        return '/images/img_tumblr.png';
      case 'P':
      case '4':
        return '/images/img_starbucks.png';
      default:
        return '/images/img_starbucks.png';
    }
  };

  // 등수별 뱃지 색상 반환
  const getRankBadgeColor = (rank: string) => {
    switch (rank) {
      case '1':
        return 'bg-yellow-400 text-yellow-900';
      case '2':
        return 'bg-gray-300 text-gray-700';
      case '3':
        return 'bg-orange-400 text-orange-900';
      case 'P':
      case '4':
        return 'bg-green-400 text-green-900';
      default:
        return 'bg-green-400 text-green-900';
    }
  };

  // 등수별 랭크 텍스트 반환
  const getRankText = (rank: string) => {
    switch (rank) {
      case '1':
        return '1등';
      case '2':
        return '2등';
      case '3':
        return '3등';
      case 'P':
      case '4':
        return '4등';
      default:
        return '4등';
    }
  };

  // 등수별 카드 배경색 반환
  const getCardBackground = (rank: string) => {
    switch (rank) {
      case '1':
        return 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 50%, #DDD6FE 100%)';
      case '2':
        return 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)';
      case '3':
        return 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 50%, #FED7AA 100%)';
      case 'P':
      case '4':
        return 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)';
      default:
        return 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 50%, #BBF7D0 100%)';
    }
  };

  // 상품별 해시태그 반환
  const getPrizeHashtags = (rank: string) => {
    switch (rank) {
      case '1':
        return ['#손목위템', '#스마트라이프', '#갓생템'];
      case '2':
        return ['#언제어디서나', '#자유로운 사운드', '#잇템'];
      case '3':
        return ['#갓시원', '#불따뜻', '#인생텀블러', '#필수아이템'];
      case 'P':
      case '4':
        return ['#행복쿠폰', '#오늘은스타벅스', '#기분좋은한잔'];
      default:
        return ['#행복쿠폰', '#오늘은스타벅스', '#기분좋은한잔'];
    }
  };

  // 추첨 초기화
  const initializeRaffle = (prizeId: string) => {
    setRaffleResults(prev => ({
      ...prev,
      [prizeId]: {
        winners: [],
        isRaffling: false,
        currentWinner: null
      }
    }));
  };

  // 이름 마스킹 함수
  const maskName = (name: string) => {
    if (name.length <= 2) {
      return name.charAt(0) + '*';
    } else {
      return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
    }
  };

  // 슬롯머신 애니메이션 함수
  const runSlotMachine = (finalWinner: { id: string; name: string; phone: string; }) => {
    // 애니메이션용 목업 데이터 (실제 당첨자와는 별개)
    const mockParticipants = [
      { id: '1', name: '김철수', phone: '010-1234-5678' },
      { id: '2', name: '이영희', phone: '010-2345-6789' },
      { id: '3', name: '박민수', phone: '010-3456-7890' },
      { id: '4', name: '최지영', phone: '010-4567-8901' },
      { id: '5', name: '정현우', phone: '010-5678-9012' },
      { id: '6', name: '한소영', phone: '010-6789-0123' },
      { id: '7', name: '윤태호', phone: '010-7890-1234' },
      { id: '8', name: '강미래', phone: '010-8901-2345' },
      { id: '9', name: '임동현', phone: '010-9012-3456' },
      { id: '10', name: '송하늘', phone: '010-0123-4567' },
      { id: '11', name: '조민호', phone: '010-1111-2222' },
      { id: '12', name: '서지은', phone: '010-3333-4444' },
      { id: '13', name: '오준석', phone: '010-5555-6666' },
      { id: '14', name: '배수진', phone: '010-7777-8888' },
      { id: '15', name: '남궁민', phone: '010-9999-0000' },
      { id: '16', name: '문지윤', phone: '010-1111-7432' },
      { id: '17', name: '김민수', phone: '010-2222-1234' },
      { id: '18', name: '이서연', phone: '010-3333-5678' },
      { id: '19', name: '박준호', phone: '010-4444-9012' },
      { id: '20', name: '최유진', phone: '010-5555-3456' }
    ];

    let animationCount = 0;
    const maxAnimations = 20; // 애니메이션 횟수
    const animationInterval = 100; // 100ms마다 변경

    const animate = () => {
      if (animationCount < maxAnimations) {
        // 랜덤한 참여자 선택 (애니메이션용)
        const randomParticipant = mockParticipants[Math.floor(Math.random() * mockParticipants.length)];
        setSlotMachineData({
          name: maskName(randomParticipant.name),
          phone: randomParticipant.phone.slice(-4)
        });
        
        animationCount++;
        setTimeout(animate, animationInterval);
      } else {
        // 최종 당첨자 정보로 설정 (실제 API 결과)
        setSlotMachineData({
          name: maskName(finalWinner.name),
          phone: finalWinner.phone.slice(-4)
        });
        
        // 1초 후 result 상태로 변경
        setTimeout(() => {
          setCurrentWinner(finalWinner);
          setRaffleWinners(prev => [...prev, finalWinner]);
          
          // 마지막 당첨자인지 확인
          const isLastWinner = raffleWinners.length + 1 >= (currentRafflePrize?.winnerCount || 0);
          
          if (isLastWinner) {
            // 마지막 당첨자면 바로 완료 처리
            if (currentRafflePrize) {
              const prizeId = currentRafflePrize.id;
              setRaffleResults(prev => ({
                ...prev,
                [prizeId]: {
                  ...prev[prizeId],
                  winners: [...(prev[prizeId]?.winners || []), ...raffleWinners, finalWinner],
                  isRaffling: false
                }
              }));
            }
            closeRaffleScreen();
          } else {
            // 마지막이 아니면 result 상태로
            setRaffleAnimation('result');
            
            // raffleResults 상태 업데이트
            if (currentRafflePrize) {
              const prizeId = currentRafflePrize.id;
              setRaffleResults(prev => ({
                ...prev,
                [prizeId]: {
                  ...prev[prizeId],
                  isRaffling: false
                }
              }));
            }
          }
        }, 1000);
      }
    };

    animate();
  };

  // 추첨 화면 열기
  const openRaffleScreen = (prize: any) => {
    setCurrentRafflePrize(prize);
    setShowRaffleScreen(true);
    setRaffleAnimation('idle');
    setRaffleWinners([]);
    setCurrentWinner(null);
    setSlotMachineData({ name: '', phone: '' });
  };

  // 추첨 화면 닫기
  const closeRaffleScreen = () => {
    setShowRaffleScreen(false);
    setCurrentRafflePrize(null);
    setRaffleAnimation('idle');
    setRaffleWinners([]);
    setCurrentWinner(null);
    setSlotMachineData({ name: '', phone: '' });
  };

  // 추첨 실행 (한 명씩)
  const runRaffle = async () => {
    if (!currentRafflePrize || !raffleData) return;

    const prizeId = currentRafflePrize.id;
    const currentResult = raffleResults[prizeId];
    
    if (currentResult?.isRaffling) return;

    // 추첨 시작
    setRaffleAnimation('spinning');
    setRaffleResults(prev => ({
      ...prev,
      [prizeId]: {
        ...prev[prizeId],
        isRaffling: true
      }
    }));

    try {
      console.log('🎰 추첨 API 호출 시작...', {
        eventId: '3158612a-6764-11f0-aaae-6de7418cfa45',
        raffleId: raffleData.id
      });

      // apiRequest 사용하여 추첨 API 호출
      const result = await apiRequest(`https://api-participant.hence.events/raffles/3158612a-6764-11f0-aaae-6de7418cfa45/${raffleData.id}/select-winners`, {
        method: 'POST',
      });

      console.log('🔍 추첨 API 응답 상세:', {
        success: result.success,
        error: result.error,
        status: result.status,
        hasData: !!result.data
      });

      if (!result.success) {
        throw new Error(result.error || '추첨 API 요청 실패');
      }

      const data = result.data as any;
      console.log('✅ 추첨 API 응답:', data);

      if (data.data && data.data.length > 0) {
        // API에서 반환된 당첨자 중 첫 번째를 사용 (한 명씩 추첨)
        const newWinner = data.data[0];
        
        // 슬롯머신 애니메이션 시작
        runSlotMachine(newWinner);
      } else {
        console.error('❌ 추첨 결과가 없습니다.');
        alert('추첨 결과를 받아올 수 없습니다.');
        
        // 추첨 실패 시 상태 초기화
        setRaffleAnimation('idle');
        setRaffleResults(prev => ({
          ...prev,
          [prizeId]: {
            ...prev[prizeId],
            isRaffling: false
          }
        }));
      }
    } catch (error) {
      console.error('❌ 추첨 API 호출 실패:', error);
      console.error('❌ 추첨 에러 상세 정보:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        prizeId: prizeId,
        raffleId: raffleData?.id
      });
      alert('추첨 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
      
      // 추첨 실패 시 상태 초기화
      setRaffleAnimation('idle');
      setRaffleResults(prev => ({
        ...prev,
        [prizeId]: {
          ...prev[prizeId],
          isRaffling: false
        }
      }));
    }
  };

  // 추첨 완료 후 카드로 돌아가기
  const completeRaffle = () => {
    if (!currentRafflePrize) return;
    
    const prizeId = currentRafflePrize.id;
    
    // 모든 당첨자를 raffleResults에 저장
    setRaffleResults(prev => ({
      ...prev,
      [prizeId]: {
        ...prev[prizeId],
        winners: [...(prev[prizeId]?.winners || []), ...raffleWinners],
        isRaffling: false
      }
    }));
    
    closeRaffleScreen();
  };

  // 모든 추첨 결과 초기화
  const resetAllRaffles = () => {
    if (confirm('모든 추첨 결과를 초기화하시겠습니까?')) {
      setRaffleResults({});
      setRaffleWinners([]);
      setCurrentWinner(null);
      setSlotMachineData({ name: '', phone: '' });
      alert('모든 추첨 결과가 초기화되었습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">관리자 권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">접근 권한 없음</h1>
          <p className="text-gray-600">관리자 권한이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        width: '100vw !important',
        maxWidth: 'none !important',
        margin: '0 !important',
        padding: '0 !important',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #7E5ADC 0%, #8552CB 50%, #934CB0 100%)'
      }}
    >
      {/* 선물상자 이미지 - 왼쪽 하단 */}
      <div className="absolute bottom-0 left-0 overflow-hidden">
        <img 
          src="/images/img_giftbox.webp" 
          alt="선물상자" 
          className="transform rotate-12 opacity-60 hover:opacity-80 transition-opacity duration-300"
          style={{ 
            width: '768px',
            height: '768px',
            transform: 'translate(-80px, 80px) rotate(12deg)',
            filter: 'drop-shadow(0 18px 36px rgba(0,0,0,0.45))'
          }}
        />
      </div>

      {/* 고정 타이틀 - 좌측 상단 */}
      <div className="fixed top-6 left-6 z-20">
        <h1 className="text-4xl font-bold text-white drop-shadow-lg">
          서울과학기술대 횃불제 X HENCE
        </h1>
        <p className="text-lg text-white/90 drop-shadow-md mt-2">
          행운의 당첨자를 확인해보세요!
        </p>
      </div>

      {/* 초기화 버튼 - 우측 하단 (숨김) */}
      <div className="fixed bottom-6 right-6 z-20 opacity-20 hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={resetAllRaffles}
          className="px-4 py-2 bg-gray-600 hover:bg-red-600 text-white font-medium text-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          초기화
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">

        {/* 상품 슬라이드 쇼 */}
        <div className="mb-8 w-full max-w-6xl">
          
          {isLoadingRaffle ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/90">래플 정보를 불러오는 중...</p>
            </div>
          ) : prizes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {prizes.map((prize, index) => {
                const result = raffleResults[prize.id];
                const isRaffling = result?.isRaffling || false;
                const currentWinner = result?.currentWinner;
                const winners = result?.winners || [];
                const isCompleted = winners.length >= prize.winnerCount;
                
                return (
                  <div key={prize.id} className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="text-center">
                      
                      {/* 상품 이미지 */}
                      <div className="mb-6 flex justify-center">
                        <img 
                          src={prize.icon} 
                          alt={prize.name}
                          className="w-32 h-32 object-contain drop-shadow-lg"
                        />
                      </div>
                      
                      {/* 상품명 */}
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{prize.name}</h3>
                      
                      {/* 당첨자 수 */}
                      <p className="text-sm text-gray-500 mb-4">({prize.winnerCount}명)</p>
                      
                      {/* 추첨 상태 표시 */}
                      {isRaffling && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-2xl mb-2 animate-spin">🎰</div>
                          <p className="text-sm text-yellow-700 font-medium">추첨 중...</p>
                        </div>
                      )}
                      
                      {currentWinner && !isRaffling && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-2xl mb-2">🎉</div>
                          <p className="text-sm text-green-700 font-medium">
                            {maskName(currentWinner.name)} {currentWinner.phone.slice(-4)}
                          </p>
                          <p className="text-xs text-green-600">축하합니다!</p>
                        </div>
                      )}
                      
                      {/* 당첨자 목록 */}
                      {winners.length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-600 font-medium mb-2">당첨자 목록</p>
                          <div className="space-y-1">
                            {winners.map((winner, idx) => (
                              <p key={winner.id} className="text-xs text-blue-700">
                                {idx + 1}. {maskName(winner.name)} {winner.phone.slice(-4)}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                                            
                      {/* 추첨하기 버튼 */}
                      <button
                        onClick={() => {
                          if (!result) {
                            initializeRaffle(prize.id);
                          }
                          if (!isCompleted && !isRaffling) {
                            openRaffleScreen(prize);
                          }
                        }}
                        disabled={isRaffling || isCompleted}
                        className={`w-full py-3 px-6 rounded-full font-bold text-lg text-white shadow-lg transition-all duration-300 ${
                          isRaffling || isCompleted 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:shadow-xl'
                        }`}
                        style={{
                          background: isCompleted 
                            ? '#10B981' 
                            : isRaffling 
                            ? '#9CA3AF' 
                            : 'linear-gradient(135deg, #7E5ADC 0%, #8552CB 50%, #934CB0 100%)'
                        }}
                      >
                        {isCompleted 
                          ? '추첨 완료' 
                          : isRaffling 
                          ? '추첨 중...' 
                          : winners.length === 0 
                          ? '추첨하기' 
                          : '다음 추첨'
                        }
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-white mb-2">상품이 없습니다</h3>
              <p className="text-white/80">이 이벤트에는 추첨 상품이 설정되지 않았습니다.</p>
            </div>
          )}
        </div>

        {/* 추첨 화면 */}
        {showRaffleScreen && currentRafflePrize && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
              className="w-full h-full flex flex-col items-center justify-center text-white"
              style={{
                background: 'linear-gradient(135deg, #7E5ADC 0%, #8552CB 50%, #934CB0 100%)'
              }}
            >
              {/* 상품 정보 */}
              <div className="text-center mb-12">
                <div className="mb-6 flex justify-center">
                  <img 
                    src={currentRafflePrize.icon} 
                    alt={currentRafflePrize.name}
                    className="w-40 h-40 object-contain drop-shadow-2xl"
                  />
                </div>
                <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">
                  {currentRafflePrize.name}
                </h2>
                <p className="text-xl text-white/90 drop-shadow-md">
                  {currentRafflePrize.rank}등 • {currentRafflePrize.winnerCount}명 당첨
                </p>
              </div>

              {/* 추첨 영역 */}
              <div className="text-center mb-12">
                {raffleAnimation === 'idle' && (
                  <>
                    {raffleWinners.length === 0 ? (
                      <>
                        <p className="text-3xl font-bold mb-4 drop-shadow-lg">추첨 준비 완료!</p>
                        <p className="text-xl text-white/80 drop-shadow-md">
                          {currentRafflePrize.winnerCount}명의 행운의 당첨자를 뽑아보세요!
                        </p>
                      </>
                    ) : raffleWinners.length >= currentRafflePrize.winnerCount ? (
                      <>
                        <p className="text-3xl font-bold mb-4 drop-shadow-lg">추첨 완료!</p>
                        <p className="text-xl text-white/80 drop-shadow-md">
                          모든 당첨자가 선정되었습니다!
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-3xl font-bold mb-4 drop-shadow-lg">추첨 진행 중!</p>
                        <p className="text-xl text-white/80 drop-shadow-md">
                          {currentRafflePrize.winnerCount - raffleWinners.length}명의 당첨자를 더 뽑아보세요!
                        </p>
                      </>
                    )}
                    {raffleWinners.length > 0 && (
                      <div className="mt-6 bg-white/20 backdrop-blur-lg rounded-2xl p-6 border border-white/30">
                        <p className="text-2xl text-white/90 mb-4 font-bold">현재 당첨자 ({raffleWinners.length}/{currentRafflePrize.winnerCount})</p>
                        <div className="space-y-2">
                          {raffleWinners.map((winner, index) => (
                            <p key={winner.id} className="text-xl text-white/90 font-semibold">
                              {index + 1}. {maskName(winner.name)} {winner.phone.slice(-4)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {raffleAnimation === 'spinning' && (
                  <div className="w-200">
                    <div className="rounded-3xl p-12 shadow-2xl bg-white">
                      <div className="text-center">
                        {/* 등수 표시 */}
                        <div className="mb-8">
                          <div className="text-4xl font-bold text-gray-800 mb-3">{getRankText(currentRafflePrize.rank)}</div>
                          <p className="text-2xl font-bold text-gray-800 mb-2">
                            추첨 중...
                          </p>
                          <p className="text-xl text-gray-700">다음 당첨자를 선정하고 있습니다!</p>
                        </div>

                        {/* 슬롯머신 애니메이션 */}
                        <div className="mb-8">
                          <p className="text-7xl font-bold text-purple-600 mb-4 animate-pulse">
                            {slotMachineData.name || '추첨 중...'}
                          </p>
                          <p className="text-4xl text-gray-600 animate-pulse">
                            {slotMachineData.phone || '****'}
                          </p>
                        </div>

                        {/* 진행 상황 */}
                        <div className="bg-white/50 rounded-2xl p-6 inline-block">
                          <p className="text-2xl text-gray-700 font-semibold">
                            ({raffleWinners.length}/{currentRafflePrize.winnerCount})
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {raffleAnimation === 'result' && currentWinner && (
                  <div className="w-200">
                    <div 
                      className="rounded-3xl p-12 shadow-2xl bg-white" 
                    >
                      <div className="text-center">
                        {/* 등수 표시 */}
                        <div className="mb-8">
                          <div className="text-4xl font-bold text-gray-800 mb-3">{getRankText(currentRafflePrize.rank)}</div>
                          <p className="text-2xl font-bold text-gray-800 mb-2">
                            당첨되셨습니다.
                          </p>
                          <p className="text-xl text-gray-700">축하드립니다!</p>
                        </div>

                        {/* 당첨자 정보 - 크게 표시 */}
                        <div className="mb-8">
                          <p className="text-7xl font-bold text-purple-600 mb-4">
                            {maskName(currentWinner.name)} {currentWinner.phone.slice(-4)}
                          </p>
                        </div>

                        {/* 진행 상황 */}
                        <div className="bg-white/50 rounded-2xl p-6 inline-block">
                          <p className="text-2xl text-gray-700 font-semibold">
                            ({raffleWinners.length}/{currentRafflePrize.winnerCount})
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {raffleAnimation === 'completed' && (
                  <div className="w-full max-w-7xl mx-auto">
                    <div 
                      className="rounded-3xl p-12 shadow-2xl border border-white/20"
                      style={{
                        background: getCardBackground(currentRafflePrize.rank)
                      }}
                    >
                      <div className="text-center mb-8">
                        {/* 완료 표시 */}
                        <div className="mb-8">
                          <div className="text-4xl font-bold text-gray-800 mb-3">추첨 완료</div>
                          <p className="text-2xl font-bold text-gray-800 mb-2">
                            추첨 완료!
                          </p>
                          <p className="text-xl text-gray-700">
                            {getRankText(currentRafflePrize.rank)} • 총 {raffleWinners.length}명 당첨
                          </p>
                        </div>
                      </div>

                      {/* 당첨자 목록 - 크게 표시 */}
                      <div className="bg-white/50 rounded-2xl p-8">
                        <p className="text-4xl font-bold text-gray-800 mb-8 text-center">당첨자 목록</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {raffleWinners.map((winner, index) => (
                            <div key={winner.id} className="bg-white/70 rounded-xl p-8 text-center">
                              <div className="text-3xl font-bold text-gray-600 mb-3">#{index + 1}</div>
                              <p className="text-5xl font-bold text-purple-600 mb-3">
                                {maskName(winner.name)}
                              </p>
                              <p className="text-3xl text-gray-600">
                                {winner.phone.slice(-4)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 버튼들 */}
              <div className="flex gap-6">
                {raffleAnimation === 'idle' && (
                  <>
                    <button
                      onClick={runRaffle}
                      className="px-12 py-4 bg-white text-purple-600 font-bold text-2xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                    >
                      {raffleWinners.length === 0 ? '추첨 시작!' : '다음 추첨'}
                    </button>
                    {raffleWinners.length > 0 && (
                      <button
                        onClick={completeRaffle}
                        className="px-12 py-4 bg-yellow-400 text-yellow-900 font-bold text-2xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                      >
                        완료
                      </button>
                    )}
                  </>
                )}

                {raffleAnimation === 'result' && (
                  <button
                    onClick={() => {
                      if (raffleWinners.length >= currentRafflePrize.winnerCount) {
                        setRaffleAnimation('idle');
                      } else {
                        runRaffle();
                      }
                    }}
                    className="px-12 py-4 text-white font-bold text-xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #7E5ADC 0%, #8552CB 50%, #934CB0 100%)'
                    }}
                  >
                    {raffleWinners.length >= currentRafflePrize.winnerCount ? '완료' : '다음 발표'}
                  </button>
                )}

                {raffleAnimation === 'completed' && (
                  <button
                    onClick={completeRaffle}
                    className="px-12 py-4 bg-yellow-400 text-yellow-900 font-bold text-2xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                  >
                    완료
                  </button>
                )}

                {(raffleAnimation === 'idle' || raffleAnimation === 'result' || raffleAnimation === 'completed') && (
                  <button
                    onClick={closeRaffleScreen}
                    className="px-8 py-4 bg-white/20 backdrop-blur-lg text-white font-bold text-xl rounded-full border border-white/30 hover:bg-white/30 transition-all duration-300"
                  >
                    취소
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
