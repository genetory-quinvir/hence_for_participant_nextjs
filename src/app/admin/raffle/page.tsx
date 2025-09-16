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
  const [existingWinners, setExistingWinners] = useState<{
    [prizeId: string]: { id: string; name: string; phone: string; }[];
  }>({});

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
      
      if (data?.data) {
        setRaffleData(data.data);
        
        // 상품 정보를 prizes 상태로 변환 (꼴등부터 1등까지 순서로 정렬)
        if (data?.data?.prizes && Array.isArray(data.data.prizes) && data.data.prizes.length > 0) {
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

          // 당첨자 정보도 함께 처리 (API 응답의 winners 배열을 등수별로 그룹화)
          const winnersData: { [prizeId: string]: { id: string; name: string; phone: string; }[] } = {};
          
          // 먼저 모든 상품에 대해 빈 배열로 초기화
          data.data.prizes.forEach((prize: any) => {
            winnersData[prize.id] = [];
          });
          
          // winners 배열을 등수별로 그룹화
          if (data.data.winners && Array.isArray(data.data.winners)) {
            data.data.winners.forEach((winner: any) => {
              const prizeRank = winner.prizeRank;
              // 해당 등수에 맞는 상품 ID 찾기
              const matchingPrize = data.data.prizes.find((prize: any) => prize.prizeRank === prizeRank);
              if (matchingPrize) {
                winnersData[matchingPrize.id].push({
                  id: winner.id || winner.userId || '',
                  name: winner.realName || winner.name || '',
                  phone: winner.phoneNumber || winner.phone || ''
                });
              }
            });
          }
          
          setExistingWinners(winnersData);
          console.log('✅ 당첨자 정보 처리 완료:', winnersData);
        } else {
          console.log('⚠️ 상품 정보가 없습니다.');
          setPrizes([]);
          setExistingWinners({});
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



  // 이름 마스킹 함수
  const maskName = (name: string) => {
    if (!name || typeof name !== 'string') {
      return '***';
    }
    if (name.length <= 2) {
      return name.charAt(0) + '*';
    } else {
      return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
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
                const existingWinnersList = existingWinners[prize.id] || [];
                const hasWinners = existingWinnersList.length > 0;
                
                return (
                  <div key={prize.id} className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 h-fit min-h-[400px] flex flex-col">
                    <div className="text-center flex-1 flex flex-col">
                      
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
                      
                      
                      {/* 당첨자 목록 */}
                      {hasWinners ? (
                        <div className="mb-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 overflow-hidden">
                          <div className="flex items-center justify-center p-3 pb-2">
                            <div className="text-xl mr-2">🏆</div>
                            <p className="text-sm font-bold text-purple-700">당첨자 목록</p>
                          </div>
                          
                          {/* 당첨자 리스트 - 한 줄씩 표시 */}
                          <div className="px-3 pb-3">
                            <div className="space-y-1">
                              {existingWinnersList.map((winner, idx) => (
                                <div key={winner.id} className="flex items-center justify-between bg-white/80 rounded-lg p-2 border border-purple-100 shadow-sm">
                                  <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full min-w-[20px] text-center">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1 mx-2 text-center">
                                    <span className="text-sm font-bold text-gray-800">
                                      {maskName(winner.name)}
                                    </span>
                                    <span className="text-xs text-gray-600 ml-2">
                                      {winner.phone.slice(-4)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-purple-500">
                                    🎉
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                          <div className="flex flex-col items-center">
                            <div className="text-3xl mb-2">📭</div>
                            <p className="text-sm font-medium text-gray-600">아직 당첨자가 없습니다</p>
                          </div>
                        </div>
                      )}
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


      </div>
    </div>
  );
}
