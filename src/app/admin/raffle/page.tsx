'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RaffleItem, RafflePrize } from '@/types/api';

interface RaffleParticipant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  eventId: string;
  registeredAt: string;
  isWinner?: boolean;
}

// 기존 RaffleEvent 인터페이스는 EventItem으로 대체

export default function AdminRafflePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [raffleData, setRaffleData] = useState<RaffleItem | null>(null);
  const [isLoadingRaffle, setIsLoadingRaffle] = useState(false);
  const [isRaffling, setIsRaffling] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<RaffleParticipant | null>(null);
  const [isSlotMachine, setIsSlotMachine] = useState(false);
  const [slotName, setSlotName] = useState('');
  const [slotPhone, setSlotPhone] = useState('');
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  const [winnerQueue, setWinnerQueue] = useState<RaffleParticipant[]>([]);
  const [currentWinnerIndex, setCurrentWinnerIndex] = useState(0);
  const [currentPrizeId, setCurrentPrizeId] = useState<string>('');
  const [isPopupRaffling, setIsPopupRaffling] = useState(false);
  const [prizes, setPrizes] = useState<{
    id: string;
    name: string;
    description: string;
    icon: string;
    isDrawn: boolean;
    winners: RaffleParticipant[];
    rank: string;
    winnerCount: number;
  }[]>([]);

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


  // 래플 정보 로드 (직접 API 호출)
  const loadRaffleData = async (eventId: string) => {
    setIsLoadingRaffle(true);
    try {
      console.log('🔄 래플 정보 로드 시작...', eventId);
      
      // 직접 API 호출
      const response = await fetch(`https://api-participant.hence.events/raffles/${eventId}/153d5d80-62e9-11f0-aaae-6de7418cfa44`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status}`);
      }

      const data = await response.json();
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
            isDrawn: false,
            winners: [],
            rank: prize.prizeRank,
            winnerCount: prize.winnerCount
          }));
          
          // P등부터 1등까지 순서로 정렬
          const sortedPrizes = convertedPrizes.sort((a: any, b: any) => {
            const rankOrder = { 'P': 0, '3': 1, '2': 2, '1': 3 };
            return rankOrder[a.rank as keyof typeof rankOrder] - rankOrder[b.rank as keyof typeof rankOrder];
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
      alert('래플 정보를 불러오는 중 오류가 발생했습니다: ' + error);
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
        return '🏆';
      case '2':
        return '🥈';
      case '3':
        return '🥉';
      case 'P':
        return '🎁';
      default:
        return '🎁';
    }
  };



  // 팝업 열기 (실제 추첨은 하지 않음)
  const openRafflePopup = (prizeId: string) => {
    console.log('🎪 팝업 열기:', { prizeId });
    setCurrentPrizeId(prizeId);
    setShowWinnerPopup(true);
    setCurrentWinnerIndex(0);
    setWinnerQueue([]);
    setCurrentWinner(null);
    setIsPopupRaffling(false);
  };

  // 팝업 내에서 실제 추첨 실행
  const runPopupRaffle = async () => {
    console.log('🎲 추첨 시작!', { currentPrizeId, isPopupRaffling });
    
    if (!currentPrizeId) {
      console.error('❌ currentPrizeId가 설정되지 않았습니다!');
      return;
    }
    
    setIsPopupRaffling(true);
    
    try {
      // 목업 참여자 데이터 (더 많은 참여자 추가)
      const mockParticipants = [
        { id: '1', name: '김철수', email: 'kim@example.com', phone: '010-1234-5678', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '2', name: '이영희', email: 'lee@example.com', phone: '010-2345-6789', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '3', name: '박민수', email: 'park@example.com', phone: '010-3456-7890', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '4', name: '최지영', email: 'choi@example.com', phone: '010-4567-8901', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '5', name: '정현우', email: 'jung@example.com', phone: '010-5678-9012', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '6', name: '한소영', email: 'han@example.com', phone: '010-6789-0123', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '7', name: '윤태호', email: 'yoon@example.com', phone: '010-7890-1234', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '8', name: '강미래', email: 'kang@example.com', phone: '010-8901-2345', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '9', name: '임동현', email: 'lim@example.com', phone: '010-9012-3456', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '10', name: '송하늘', email: 'song@example.com', phone: '010-0123-4567', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '11', name: '조민호', email: 'cho@example.com', phone: '010-1111-2222', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '12', name: '서지은', email: 'seo@example.com', phone: '010-3333-4444', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '13', name: '오준석', email: 'oh@example.com', phone: '010-5555-6666', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '14', name: '배수진', email: 'bae@example.com', phone: '010-7777-8888', eventId: 'event1', registeredAt: '2024-01-01' },
        { id: '15', name: '남궁민', email: 'nam@example.com', phone: '010-9999-0000', eventId: 'event1', registeredAt: '2024-01-01' }
      ];
      
      // 현재 상품의 winnerCount 가져오기
      const currentPrize = prizes.find(prize => prize.id === currentPrizeId);
      const winnerCount = currentPrize?.winnerCount || 1;
      console.log('🎯 상품 정보:', { currentPrize, winnerCount });
      
      // Fisher-Yates 셔플 알고리즘으로 공정한 추첨
      const shuffled = [...mockParticipants];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // winnerCount만큼 당첨자 선정
      const winners = shuffled.slice(0, winnerCount);
      console.log('🏆 당첨자 선정:', winners);
      
      // 상품에 당첨자들 설정
      setPrizes(prev => prev.map(prize => 
        prize.id === currentPrizeId 
          ? { ...prize, isDrawn: true, winners: winners }
          : prize
      ));
      
      // 당첨자들을 큐에 넣고 슬롯머신 시작
      if (winners.length > 0) {
        console.log('🎰 슬롯머신 시작');
        setWinnerQueue(winners);
        setCurrentWinnerIndex(0);
        setCurrentWinner(winners[0]);
        runSlotMachineForPopup(winners[0]);
      }

    } catch (error) {
      console.error('추첨 실행 실패:', error);
    } finally {
      setIsPopupRaffling(false);
    }
  };

  // 추첨 이력 로드
  const loadRaffleHistory = async () => {
    try {
      const response = await fetch('/api/admin/raffle/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('추첨 이력:', data.history || []);
      }
    } catch (error) {
      console.error('추첨 이력 로드 실패:', error);
    }
  };

  // 이름 마스킹 함수
  const maskName = (name: string) => {
    if (name.length <= 2) {
      return name.charAt(0) + '*';
    } else {
      return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
    }
  };

  // 슬롯머신 효과를 위한 랜덤 텍스트 생성
  const generateRandomText = (type: 'name' | 'phone') => {
    if (type === 'name') {
      const names = ['김철수', '이영희', '박민수', '최지영', '정현우', '한소영', '윤태호', '강미래', '임동현', '송하늘', '조민호', '서지은', '오준석', '배수진', '남궁민'];
      return maskName(names[Math.floor(Math.random() * names.length)]);
    } else {
      const phones = ['1234', '2345', '3456', '4567', '5678', '6789', '7890', '8901', '9012', '0123'];
      return phones[Math.floor(Math.random() * phones.length)];
    }
  };

  // 다음 당첨자로 이동
  const showNextWinner = () => {
    if (currentWinnerIndex < winnerQueue.length - 1) {
      const nextIndex = currentWinnerIndex + 1;
      setCurrentWinnerIndex(nextIndex);
      setCurrentWinner(winnerQueue[nextIndex]);
      // 슬롯머신 애니메이션 시작
      runSlotMachineForPopup(winnerQueue[nextIndex]);
    } else {
      // 모든 당첨자 표시 완료
      setShowWinnerPopup(false);
      setWinnerQueue([]);
      setCurrentWinnerIndex(0);
    }
  };

  // 팝업 닫기
  const closeWinnerPopup = () => {
    setShowWinnerPopup(false);
    setWinnerQueue([]);
    setCurrentWinnerIndex(0);
  };

  // 현재 상품 정보 가져오기
  const getCurrentPrize = () => {
    return prizes.find(prize => prize.winners.some(winner => winner.id === currentWinner?.id));
  };

  // 슬롯머신 애니메이션 (팝업용 - 자동 종료 없음)
  const runSlotMachineForPopup = (targetWinner: RaffleParticipant) => {
    setIsSlotMachine(true);
    let count = 0;
    const maxCount = 20; // 슬롯머신이 돌아가는 횟수
    
    const interval = setInterval(() => {
      setSlotName(generateRandomText('name'));
      setSlotPhone(generateRandomText('phone'));
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        // 최종 결과 설정
        setSlotName(maskName(targetWinner.name));
        setSlotPhone(targetWinner.phone ? targetWinner.phone.slice(-4) : '0000');
        setIsSlotMachine(false);
        // 팝업에서는 자동 종료하지 않음
      }
    }, 100); // 100ms마다 변경
  };

  // 슬롯머신 애니메이션 (기존용 - 자동 종료 있음)
  const runSlotMachine = (targetWinner: RaffleParticipant) => {
    setIsSlotMachine(true);
    let count = 0;
    const maxCount = 20; // 슬롯머신이 돌아가는 횟수
    
    const interval = setInterval(() => {
      setSlotName(generateRandomText('name'));
      setSlotPhone(generateRandomText('phone'));
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        // 최종 결과 설정
        setSlotName(maskName(targetWinner.name));
        setSlotPhone(targetWinner.phone ? targetWinner.phone.slice(-4) : '0000');
        setIsSlotMachine(false);
        
        // 3초 후 현재 당첨자 초기화
        setTimeout(() => {
          setCurrentWinner(null);
        }, 3000);
      }
    }, 100); // 100ms마다 변경
  };


  // 추첨 결과 초기화
  const resetRaffle = () => {
    setCurrentWinner(null);
    setSlotName('');
    setSlotPhone('');
    setPrizes(prev => prev.map(prize => ({ ...prize, isDrawn: false, winners: [] })));
    setShowWinnerPopup(false);
    setWinnerQueue([]);
    setCurrentWinnerIndex(0);
    setCurrentPrizeId('');
    setIsPopupRaffling(false);
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {/* 화려한 배경 애니메이션 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-40 right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{ animationDelay: '6s' }}></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {prizes.map((prize, index) => (
                <div key={prize.id} className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 border border-white/30 shadow-2xl">
                  <div className="text-center">
                    <div className="text-6xl mb-4">{prize.icon}</div>
                    <h3 className="text-2xl font-bold text-white mb-2">{prize.name}</h3>
                    <p className="text-lg text-white/90 mb-2">{prize.description}</p>
                    <p className="text-sm text-white/70 mb-4">{prize.rank}등 • {prize.winnerCount}명 당첨</p>
                    
                    {prize.isDrawn && prize.winners.length > 0 && (
                      <div className="bg-green-500/20 rounded-2xl p-4 mb-4 border border-green-400/30">
                        <div className="text-lg font-bold text-green-300 mb-3">🎉 당첨자 ({prize.winners.length}명)</div>
                        {prize.winners.map((winner, index) => (
                          <div key={winner.id} className="mb-2 last:mb-0">
                            <div className="text-lg font-semibold text-white">{maskName(winner.name)}</div>
                            <div className="text-sm text-white/80">📱 ****-****-{winner.phone ? winner.phone.slice(-4) : '0000'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button
                      onClick={() => openRafflePopup(prize.id)}
                      disabled={prize.isDrawn}
                      className={`w-full py-4 px-6 rounded-full font-bold text-lg transition-all duration-300 ${
                        prize.isDrawn
                          ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-2xl transform hover:scale-105'
                      }`}
                    >
                      {prize.isDrawn ? '추첨 완료' : '🎲 추첨하기'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-white mb-2">상품이 없습니다</h3>
              <p className="text-white/80">이 이벤트에는 추첨 상품이 설정되지 않았습니다.</p>
            </div>
          )}
        </div>


        {/* 당첨자 팝업 */}
        {showWinnerPopup && (
          <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50 p-4">
            {/* 별빛 효과 */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-10 left-10 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
              <div className="absolute top-20 right-20 w-1 h-1 bg-white rounded-full animate-pulse"></div>
              <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-ping delay-1000"></div>
              <div className="absolute bottom-10 right-10 w-1 h-1 bg-white rounded-full animate-pulse delay-500"></div>
              <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-yellow-300 rounded-full animate-ping delay-700"></div>
              <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-300"></div>
            </div>

            <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden relative">
              {/* 반짝이는 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
              
              {/* 헤더 */}
              <div className="relative px-8 py-6 text-center">
                <button
                  onClick={closeWinnerPopup}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all text-xl"
                >
                  ✕
                </button>
              </div>

              {/* 상품 정보 */}
              {getCurrentPrize() && (
                <div className="px-8 py-4 text-center">
                  <div className="text-8xl mb-4 animate-pulse">{getCurrentPrize()?.icon}</div>
                  <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{getCurrentPrize()?.name}</h3>
                  <p className="text-lg text-white/90 font-medium">{getCurrentPrize()?.description}</p>
                </div>
              )}

              {/* 당첨자 정보 */}
              <div className="px-8 py-6">
                {winnerQueue.length === 0 ? (
                  // 추첨 전 화면
                  <div className="text-center">
                    <div className="text-6xl mb-6 animate-bounce">🎰</div>
                    <div className="text-3xl font-black text-white mb-6 drop-shadow-lg">
                      추첨을 시작하시겠습니까?
                    </div>
                    <button
                      onClick={() => {
                        console.log('🔘 추첨 시작 버튼 클릭', { isPopupRaffling, currentPrizeId });
                        alert('버튼이 클릭되었습니다!');
                        runPopupRaffle();
                      }}
                      disabled={isPopupRaffling}
                      className={`bg-white text-orange-600 font-black text-2xl py-4 px-8 rounded-2xl hover:bg-white/90 transition-all transform hover:scale-105 shadow-xl ${
                        isPopupRaffling ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isPopupRaffling ? '추첨 중...' : '🎲 추첨 시작!'}
                    </button>
                  </div>
                ) : (
                  // 추첨 후 화면
                  <>
                    <div className="text-center mb-8">
                      <div className="text-5xl font-black text-white mb-4 drop-shadow-lg animate-pulse">
                        🎉 {currentWinnerIndex + 1}번째 당첨자 🎉
                      </div>
                    </div>
                
                {/* 이름 슬롯머신 */}
                {currentWinner && (
                  <div className="mb-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 min-h-[80px] flex items-center justify-center">
                      {isSlotMachine ? (
                        <span className="text-4xl font-black text-white animate-pulse drop-shadow-lg">
                          {generateRandomText('name')}
                        </span>
                      ) : (
                        <span className="text-5xl font-black text-white animate-fadeIn drop-shadow-lg">
                          {maskName(currentWinner.name)}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* 전화번호 슬롯머신 */}
                {currentWinner && (
                  <div className="mb-8">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 min-h-[70px] flex items-center justify-center">
                      {isSlotMachine ? (
                        <span className="text-3xl font-black text-white animate-pulse drop-shadow-lg">
                          ****-****-{generateRandomText('phone')}
                        </span>
                      ) : (
                        <span className="text-4xl font-black text-white animate-fadeIn drop-shadow-lg">
                          ****-****-{currentWinner.phone ? currentWinner.phone.slice(-4) : '0000'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 진행 상황 */}
                <div className="mb-8">
                  <div className="flex justify-center gap-3">
                    {winnerQueue.map((_, index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full transition-all duration-500 ${
                          index <= currentWinnerIndex 
                            ? 'bg-white shadow-lg scale-125' 
                            : 'bg-white/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                  </>
                )}
              </div>

              {/* 버튼들 */}
              {winnerQueue.length > 0 && (
                <div className="px-8 py-6">
                  <div className="flex gap-4">
                    {!isSlotMachine && (
                      <>
                        {currentWinnerIndex < winnerQueue.length - 1 ? (
                          <button
                            onClick={showNextWinner}
                            className="flex-1 bg-white text-orange-600 font-black text-xl py-4 px-6 rounded-2xl hover:bg-white/90 transition-all transform hover:scale-105 shadow-xl"
                          >
                            🎯 다음 당첨자 보기
                          </button>
                        ) : (
                          <button
                            onClick={closeWinnerPopup}
                            className="flex-1 bg-white text-green-600 font-black text-xl py-4 px-6 rounded-2xl hover:bg-white/90 transition-all transform hover:scale-105 shadow-xl"
                          >
                            ✨ 완료
                          </button>
                        )}
                      </>
                    )}
                    
                    {isSlotMachine && (
                      <div className="flex-1 bg-white/20 backdrop-blur-sm text-white font-black text-xl py-4 px-6 rounded-2xl text-center">
                        🎰 추첨 중...
                      </div>
                    )}
                    
                    <button
                      onClick={closeWinnerPopup}
                      className="px-6 py-4 bg-white/20 backdrop-blur-sm text-white font-bold text-lg rounded-2xl hover:bg-white/30 transition-all"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 초기화 버튼 - 우측 하단 고정 */}
        {prizes.some(prize => prize.isDrawn) && (
          <button
            onClick={resetRaffle}
            className="fixed bottom-6 right-6 px-4 py-2 bg-gray-600/60 backdrop-blur-lg text-white text-sm font-medium rounded-lg hover:bg-gray-700/80 transition-all duration-300 shadow-lg opacity-70 hover:opacity-100"
          >
            🔄 다시 추첨
          </button>
        )}
      </div>
    </div>
  );
}
