'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RaffleItem } from '@/types/api';

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
  const [showRafflePopup, setShowRafflePopup] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<{
    id: string;
    name: string;
    description: string;
    icon: string;
    rank: string;
    winnerCount: number;
  } | null>(null);
  const [winners, setWinners] = useState<{
    id: string;
    name: string;
    phone: string;
  }[]>([]);
  const [isRaffling, setIsRaffling] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<{
    id: string;
    name: string;
    phone: string;
  } | null>(null);

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

  // 추첨 팝업 열기
  const openRafflePopup = (prize: any) => {
    setSelectedPrize(prize);
    setShowRafflePopup(true);
    setWinners([]);
    setCurrentWinner(null);
    setIsRaffling(false);
  };

  // 추첨 팝업 닫기
  const closeRafflePopup = () => {
    setShowRafflePopup(false);
    setSelectedPrize(null);
    setWinners([]);
    setCurrentWinner(null);
    setIsRaffling(false);
  };

  // 이름 마스킹 함수
  const maskName = (name: string) => {
    if (name.length <= 2) {
      return name.charAt(0) + '*';
    } else {
      return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
    }
  };

  // 추첨 실행
  const runRaffle = () => {
    if (!selectedPrize || isRaffling) return;

    setIsRaffling(true);

    // 목업 참여자 데이터
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

    // 이미 당첨된 사람들 제외
    const availableParticipants = mockParticipants.filter(
      participant => !winners.some(winner => winner.id === participant.id)
    );

    if (availableParticipants.length === 0) {
      setIsRaffling(false);
      return;
    }

    // 랜덤으로 당첨자 선택
    const randomIndex = Math.floor(Math.random() * availableParticipants.length);
    const newWinner = availableParticipants[randomIndex];

    // 2초 후 당첨자 표시
    setTimeout(() => {
      setCurrentWinner(newWinner);
      setWinners(prev => [...prev, newWinner]);
      setIsRaffling(false);
    }, 2000);
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
                    <div className="mb-4 flex justify-center">
                      <img 
                        src={prize.icon} 
                        alt={prize.name}
                        className="w-28 h-28 object-contain"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{prize.name}</h3>
                    <p className="text-sm text-white/70 mb-4">{prize.rank}등 • {prize.winnerCount}명 당첨</p>
                    
                    <button
                      onClick={() => openRafflePopup(prize)}
                      className="w-full py-4 px-6 rounded-full font-bold text-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                    >
                      추첨 시작
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

        {/* 추첨 팝업 */}
        {showRafflePopup && selectedPrize && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl mx-4 overflow-hidden flex flex-col" style={{ height: '600px' }}>
              {/* 헤더 */}
              <div className="px-8 py-4 text-center flex-shrink-0" style={{
                background: 'linear-gradient(135deg, #7E5ADC 0%, #8552CB 50%, #934CB0 100%)'
              }}>
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                  {selectedPrize.name} 추첨
                </h2>
              </div>

              {/* 메인 컨텐츠 - 좌우 분할 */}
              <div className="flex-1 flex overflow-hidden">
                {/* 좌측 - 추첨 영역 */}
                <div className="flex-1 flex flex-col justify-center px-8 py-4">
                  {/* 상품 정보 */}
                  <div className="text-center mb-6">
                    <div className="mb-4 flex justify-center">
                      <img 
                        src={selectedPrize.icon} 
                        alt={selectedPrize.name}
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedPrize.name}</h3>
                    <p className="text-base text-gray-500 mb-4">{selectedPrize.rank}등 • {selectedPrize.winnerCount}명 당첨</p>
                  </div>
                  
                  {/* 추첨 영역 */}
                  <div className="bg-gray-100 rounded-2xl p-8 mb-6">
                    {isRaffling ? (
                      <>
                        <div className="text-6xl mb-4 animate-spin">🎰</div>
                        <p className="text-2xl text-gray-700 mb-2 font-bold">추첨 중...</p>
                        <p className="text-base text-gray-500">잠시만 기다려주세요!</p>
                      </>
                    ) : currentWinner ? (
                      <>
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-3xl font-bold text-gray-800 mb-2">
                          {maskName(currentWinner.name)} {currentWinner.phone.slice(-4)}
                        </p>
                        <p className="text-xl text-gray-600">축하합니다!</p>
                      </>
                    ) : (
                      <>
                        <div className="text-6xl mb-4">🎰</div>
                        <p className="text-2xl text-gray-700 mb-2 font-bold">추첨 준비 중...</p>
                        <p className="text-base text-gray-500">당첨자 발표는 곧 시작됩니다!</p>
                      </>
                    )}
                  </div>

                  {/* 버튼들 */}
                  <div className="flex gap-4 justify-center">
                    {winners.length < selectedPrize.winnerCount ? (
                      <button
                        onClick={runRaffle}
                        disabled={isRaffling}
                        className={`text-white font-bold text-xl py-4 px-8 rounded-2xl ${
                          isRaffling ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        style={{
                          background: isRaffling 
                            ? '#9CA3AF' 
                            : 'linear-gradient(135deg, #7E5ADC 0%, #8552CB 50%, #934CB0 100%)'
                        }}
                      >
                        {isRaffling ? '추첨 중...' : '추첨 시작'}
                      </button>
                    ) : (
                      <button
                        onClick={closeRafflePopup}
                        className="text-white font-bold text-xl py-4 px-8 rounded-2xl"
                        style={{
                          background: 'linear-gradient(135deg, #7E5ADC 0%, #8552CB 50%, #934CB0 100%)'
                        }}
                      >
                        완료
                      </button>
                    )}
                    <button
                      onClick={closeRafflePopup}
                      className="px-6 py-4 bg-gray-300 text-gray-700 font-bold text-lg rounded-2xl"
                    >
                      닫기
                    </button>
                  </div>
                </div>

                {/* 우측 - 당첨자 목록 */}
                {winners.length > 0 && (
                  <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
                    <div className="p-6 border-b border-gray-200">
                      <h4 className="text-lg font-bold text-gray-800 text-center">당첨자 목록</h4>
                      <p className="text-sm text-gray-500 text-center mt-1">{winners.length}/{selectedPrize.winnerCount}명</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="space-y-3">
                        {winners.map((winner, index) => (
                          <div key={winner.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-gray-800">
                                {index + 1}. {maskName(winner.name)}
                              </span>
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {winner.phone.slice(-4)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
