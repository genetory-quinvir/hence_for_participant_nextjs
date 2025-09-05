'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RaffleParticipant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  eventId: string;
  registeredAt: string;
  isWinner?: boolean;
}

interface RaffleEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  maxWinners: number;
  status: 'active' | 'ended' | 'draft';
  participants: RaffleParticipant[];
  winners?: RaffleParticipant[];
}

export default function AdminRafflePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<RaffleEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<RaffleEvent | null>(null);
  const [raffleResults, setRaffleResults] = useState<RaffleParticipant[]>([]);
  const [isRaffling, setIsRaffling] = useState(false);
  const [raffleHistory, setRaffleHistory] = useState<any[]>([]);
  const [revealedWinners, setRevealedWinners] = useState<RaffleParticipant[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<RaffleParticipant | null>(null);
  const [isSlotMachine, setIsSlotMachine] = useState(false);
  const [slotName, setSlotName] = useState('');
  const [slotPhone, setSlotPhone] = useState('');
  const [prizes, setPrizes] = useState<{
    id: number;
    name: string;
    description: string;
    icon: string;
    isDrawn: boolean;
    winner: RaffleParticipant | null;
  }[]>([
    { id: 1, name: '1등 상품', description: '특별 기념품', icon: '🏆', isDrawn: false, winner: null },
    { id: 2, name: '2등 상품', description: '기념품', icon: '🥈', isDrawn: false, winner: null },
    { id: 3, name: '3등 상품', description: '소정의 기념품', icon: '🥉', isDrawn: false, winner: null }
  ]);

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
          await loadEvents();
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

  // 이벤트 목록 로드
  const loadEvents = async () => {
    try {
      const response = await fetch('/api/admin/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('이벤트 로드 실패:', error);
    }
  };

  // 개별 상품 추첨 실행
  const runPrizeRaffle = async (prizeId: number) => {
    setIsRaffling(true);
    
    try {
      // 목업 참여자 데이터
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
        { id: '10', name: '송하늘', email: 'song@example.com', phone: '010-0123-4567', eventId: 'event1', registeredAt: '2024-01-01' }
      ];

      // 3초 대기 (추첨 중 애니메이션)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Fisher-Yates 셔플 알고리즘으로 공정한 추첨
      const shuffled = [...mockParticipants];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // 1명의 당첨자 선정
      const winner = shuffled[0];
      
      // 상품에 당첨자 설정
      setPrizes(prev => prev.map(prize => 
        prize.id === prizeId 
          ? { ...prize, isDrawn: true, winner: winner }
          : prize
      ));
      
      // 현재 당첨자 설정하여 슬롯머신 시작
      setCurrentWinner(winner);
      runSlotMachine(winner);

    } catch (error) {
      console.error('추첨 실행 실패:', error);
    } finally {
      setIsRaffling(false);
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
        setRaffleHistory(data.history || []);
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

  // 슬롯머신 애니메이션
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

  // 한 명씩 당첨자 발표
  const revealNextWinner = async () => {
    if (isRevealing || revealedWinners.length >= raffleResults.length) return;
    
    setIsRevealing(true);
    setCurrentWinner(null);
    
    // 1초 대기 (긴장감 조성)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const nextWinner = raffleResults[revealedWinners.length];
    setCurrentWinner(nextWinner);
    
    // 슬롯머신 시작
    runSlotMachine(nextWinner);
    
    // 슬롯머신 완료 후 발표된 목록에 추가
    setTimeout(() => {
      setRevealedWinners(prev => [...prev, nextWinner]);
      setIsRevealing(false);
      
      // 3초 후 다음 당첨자 자동 발표
      if (revealedWinners.length + 1 < raffleResults.length) {
        setTimeout(() => {
          revealNextWinner();
        }, 3000);
      }
    }, 2500); // 슬롯머신 애니메이션 시간 + 여유시간
  };

  // 추첨 결과 초기화
  const resetRaffle = () => {
    setRaffleResults([]);
    setRevealedWinners([]);
    setCurrentWinner(null);
    setSlotName('');
    setSlotPhone('');
    setPrizes(prev => prev.map(prize => ({ ...prize, isDrawn: false, winner: null })));
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

        {/* 당첨 상품들 */}
        <div className="mb-8 w-full max-w-6xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-4xl font-bold text-white mb-4">
              당첨 상품
            </h2>
            <p className="text-xl text-white/90">
              각 상품마다 추첨을 통해 당첨자를 선정합니다
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {prizes.map((prize) => (
              <div key={prize.id} className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 border border-white/30 shadow-2xl">
                <div className="text-center">
                  {/* 상품 아이콘 */}
                  <div className="text-6xl mb-4">{prize.icon}</div>
                  
                  {/* 상품 정보 */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {prize.name}
                  </h3>
                  <p className="text-lg text-white/90 mb-6">
                    {prize.description}
                  </p>
                  
                  {/* 당첨자 정보 */}
                  {prize.isDrawn && prize.winner && (
                    <div className="bg-green-500/20 rounded-2xl p-4 mb-4 border border-green-400/30">
                      <div className="text-lg font-bold text-green-300 mb-2">🎉 당첨자</div>
                      <div className="text-xl font-semibold text-white">
                        {maskName(prize.winner.name)}
                      </div>
                      <div className="text-sm text-white/80">
                        📱 ****-****-{prize.winner.phone ? prize.winner.phone.slice(-4) : '0000'}
                      </div>
                    </div>
                  )}
                  
                  {/* 추첨하기 버튼 */}
                  <button
                    onClick={() => runPrizeRaffle(prize.id)}
                    disabled={isRaffling || prize.isDrawn}
                    className={`w-full py-4 px-6 rounded-full font-bold text-lg transition-all duration-300 ${
                      prize.isDrawn
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-2xl transform hover:scale-105 disabled:opacity-50'
                    }`}
                  >
                    {isRaffling ? '추첨 중...' : prize.isDrawn ? '추첨 완료' : '🎲 추첨하기'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 슬롯머신 발표 */}
        {currentWinner && (
          <div className="mt-8 w-full max-w-4xl">
            <div className="bg-gradient-to-b from-yellow-400 to-orange-500 rounded-3xl p-8 border-4 border-yellow-300 shadow-2xl">
              <div className="text-center">
                <div className="text-6xl mb-6">🎰</div>
                <div className="text-3xl font-bold text-white mb-8">
                  당첨자 발표
                </div>
                
                {/* 슬롯머신 윈도우 */}
                <div className="bg-black rounded-2xl p-6 mb-6 border-4 border-gray-800">
                  <div className="bg-gray-900 rounded-xl p-4">
                    {/* 이름 슬롯 */}
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <div className="text-2xl font-bold text-gray-800 mb-2">이름</div>
                      <div className="text-5xl font-bold text-yellow-600 min-h-[60px] flex items-center justify-center border-2 border-gray-300 rounded">
                        {isSlotMachine ? (
                          <span className="animate-pulse">{slotName}</span>
                        ) : (
                          <span className="animate-fadeIn">{maskName(currentWinner.name)}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* 전화번호 슬롯 */}
                    <div className="bg-white rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-800 mb-2">전화번호</div>
                      <div className="text-5xl font-bold text-blue-600 min-h-[60px] flex items-center justify-center border-2 border-gray-300 rounded">
                        {isSlotMachine ? (
                          <span className="animate-pulse">****-****-{slotPhone}</span>
                        ) : (
                          <span className="animate-fadeIn">
                            ****-****-{currentWinner.phone ? currentWinner.phone.slice(-4) : '0000'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {!isSlotMachine && (
                  <div className="text-3xl font-bold text-white animate-bounce">
                    🎉 축하합니다! 🎉
                  </div>
                )}
              </div>
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
