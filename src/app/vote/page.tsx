"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense, useRef } from "react";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import { useAuth } from "@/contexts/AuthContext";
import { useSimpleNavigation } from "@/utils/navigation";
import { useToast } from "@/components/common/Toast";
import { getClubsRanking, voteForClub, getMyVotes } from "@/lib/api";
import { ClubItem } from "@/types/api";

function VoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [clubsData, setClubsData] = useState<ClubItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const voteSectionRef = useRef<HTMLDivElement>(null);
  const [isVoted, setIsVoted] = useState(false);
  const [votedClub, setVotedClub] = useState<any>(null);

  // 동아리 랭킹 데이터와 내 투표 상태 가져오기
  useEffect(() => {
    const fetchData = async () => {
      const eventId = searchParams.get('eventId');
      if (!eventId) {
        setError('이벤트 ID가 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // 동시에 랭킹 데이터와 내 투표 상태를 가져오기
        const [rankingResult, myVotesResult] = await Promise.all([
          getClubsRanking(eventId, 50),
          getMyVotes(eventId)
        ]);
        
        // 랭킹 데이터 처리
        if (rankingResult.success && rankingResult.data) {
          setClubsData(rankingResult.data);
        } else {
          setError(rankingResult.error || '랭킹 정보를 가져오는데 실패했습니다.');
        }
        
        // 내 투표 상태 처리 - VoteItem 배열로 처리
        if (myVotesResult.success) {
          
          
          let votes = myVotesResult.data || [];
          
          
          // 객체인 경우 배열로 변환
          if (!Array.isArray(votes)) {
        
            if (votes && typeof votes === 'object') {
              // 객체의 키들을 확인
          
              
              // 가능한 시나리오들:
              // 1. { items: [...] } 형태
              if ((votes as any).items && Array.isArray((votes as any).items)) {
                votes = (votes as any).items;
            
              }
              // 2. { data: [...] } 형태  
              else if ((votes as any).data && Array.isArray((votes as any).data)) {
                votes = (votes as any).data;
            
              }
              // 3. 단일 객체를 배열로 변환
              else if ((votes as any).id || (votes as any).club_id) {
                votes = [votes];
            
              }
              // 4. 빈 객체인 경우
              else {
                votes = [];
            
              }
            } else {
              votes = [];
          
            }
          }
          
          const hasVoted = votes.length > 0;
          
      
          
          if (hasVoted && votes.length > 0) {
            const voteData = votes[0]; // 첫 번째 투표 데이터 사용
        
            
            // 투표 데이터에서 직접 동아리 정보 구성 (ClubItem 형식)
            const votedClubData = {
              ...voteData,
              vote_id: voteData.id,
              vote_type: (voteData as any).vote_type || 'invite_code',
              vote_created_at: voteData.createdAt || (voteData as any).created_at
            };
            
        
            setVotedClub(votedClubData);
            setIsVoted(true);
          } else {
            setVotedClub(null);
            setIsVoted(false);
          }
          
      
        } else {
          console.error('내 투표 상태 조회 실패:', myVotesResult.error);
          setVotedClub(null);
          setIsVoted(false);
          // 투표 상태 조회 실패해도 랭킹은 보여줌
        }
        
      } catch (error) {
        setError('데이터를 가져오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, searchParams]);

  // 스크롤 감지하여 플로팅 버튼 표시/숨김
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 페이지 하단에 가까워지면 플로팅 버튼 숨김
      const isNearBottom = scrollTop + windowHeight >= documentHeight - 100;
      setShowFloatingButton(!isNearBottom);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 초기 상태 확인

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!authLoading && (!isAuthenticated || !user)) {
    router.replace("/sign?redirect=/vote" + (searchParams.toString() ? `&${searchParams.toString()}` : ''));
    return null;
  }

  const handleBackClick = () => {
    router.back();
  };

  const handleVoteSubmit = async () => {
    if (!inviteCode.trim()) {
      showToast("초대 코드를 입력해주세요.", "warning");
      return;
    }

    const eventId = searchParams.get('eventId');
    if (!eventId) {
      showToast("이벤트 ID가 없습니다.", "error");
      return;
    }

    if (!user?.id) {
      showToast("사용자 정보를 찾을 수 없습니다.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // 실제 투표 API 호출
      const result = await voteForClub(eventId, inviteCode.trim());
      
      if (result.success) {        
        // 투표 완료 후 랭킹 데이터와 내 투표 상태 새로고침
        const [rankingResult, myVotesResult] = await Promise.all([
          getClubsRanking(eventId, 50),
          getMyVotes(eventId)
        ]);
        
        // 랭킹 데이터 업데이트
        if (rankingResult.success && rankingResult.data) {
          setClubsData(rankingResult.data);
        }
        
        // 내 투표 상태 업데이트 - VoteItem 배열로 처리
        if (myVotesResult.success) {
      
          
          let votes = myVotesResult.data || [];
          
          
          // 객체인 경우 배열로 변환
          if (!Array.isArray(votes)) {
        
            if (votes && typeof votes === 'object') {
              // 객체의 키들을 확인
          
              
              // 가능한 시나리오들:
              // 1. { items: [...] } 형태
              if ((votes as any).items && Array.isArray((votes as any).items)) {
                votes = (votes as any).items;
            
              }
              // 2. { data: [...] } 형태  
              else if ((votes as any).data && Array.isArray((votes as any).data)) {
                votes = (votes as any).data;
            
              }
              // 3. 단일 객체를 배열로 변환
              else if ((votes as any).id || (votes as any).club_id) {
                votes = [votes];
            
              }
              // 4. 빈 객체인 경우
              else {
                votes = [];
            
              }
            } else {
              votes = [];
          
            }
          }
          
          const hasVoted = votes.length > 0;
      
          
          if (hasVoted && votes.length > 0) {
            const voteData = votes[0]; // 첫 번째 투표 데이터 사용
        
            
            // 투표 데이터에서 직접 동아리 정보 구성 (ClubItem 형식)
            const votedClubData = {
              ...voteData,
              vote_id: voteData.id,
              vote_type: (voteData as any).vote_type || 'invite_code',
              vote_created_at: voteData.createdAt || (voteData as any).created_at
            };
            
        
            setVotedClub(votedClubData);
            setIsVoted(true);
          } else {
            setVotedClub(null);
            setIsVoted(false);
          }
          
      
        }
        
        // 초대 코드 초기화
        setInviteCode("");
      } else {
        showToast(result.error || "투표에 실패했습니다.", "error");
      }
      
    } catch (error) {
      showToast("투표 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 상위 3개 동아리 (2등-1등-3등 순서로 재배열)
  const top3Clubs = [];
  if (clubsData.length > 0) {
    if (clubsData[1]) top3Clubs.push(clubsData[1]); // 2등
    if (clubsData[0]) top3Clubs.push(clubsData[0]); // 1등
    if (clubsData[2]) top3Clubs.push(clubsData[2]); // 3등
  }
  
  // 나머지 동아리들
  const remainingClubs = clubsData.slice(3).filter(Boolean);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* 최대 너비 제한 컨테이너 */}
      <div className="w-full max-w-[700px] mx-auto h-full flex flex-col overflow-hidden">
      {/* 네비게이션바 */}
      <CommonNavigationBar 
        onLeftClick={handleBackClick}
        leftButton={
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        }
        sticky={true}
        fixedHeight={true}
        backgroundColor="white"
        textColor="text-black"
      />
      
      <div className="p-4 overflow-x-hidden">
        {/* 투표 정보 헤더 섹션 */}
        <div className="items-center justify-center flex flex-col px-4 py-4">
          <h2 className="text-2xl font-bold text-black text-center leading-relaxed mb-6">
            간단하게 투표하고<br/>
            <span className="text-purple-700">우리 동아리</span>를 응원해보세요
          </h2>
          
          <div 
            style={{
              animation: 'gentleBounce 1s ease-in-out infinite'
            }}
          >
            <img 
              src="/images/icon_vote.png" 
              alt="투표 아이콘" 
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

        {/* 현재 랭킹 섹션 */}
        <div className="mb-8 mt-8">
          
          {isLoading ? (
            <div className="px-4">
              {/* 상위 3등 스켈레톤 */}
              <div className="mb-6">
                <div className="flex items-end justify-center space-x-4">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center animate-pulse"
                      style={{
                        background: 'rgba(124, 58, 237, 0.05)',
                        border: '1px solid rgba(124, 58, 237, 0.1)',
                        borderRadius: '16px',
                        padding: index === 1 ? '24px 20px' : '20px 16px',
                        minWidth: index === 1 ? '140px' : '120px'
                      }}
                    >
                      {/* 메달 스켈레톤 */}
                      <div 
                        className="bg-gray-300 rounded-full mb-4"
                        style={{
                          width: index === 1 ? '64px' : '48px',
                          height: index === 1 ? '64px' : '48px'
                        }}
                      />
                      
                      {/* 동아리 정보 스켈레톤 */}
                      <div className="text-center w-full">
                        <div className="h-4 bg-gray-300 rounded mb-2 mx-auto" style={{ width: '80%' }} />
                        <div className="h-3 bg-gray-300 rounded mb-3 mx-auto" style={{ width: '60%' }} />
                        <div className="h-3 bg-gray-300 rounded mb-3 mx-auto" style={{ width: '90%' }} />
                        <div className="flex items-center justify-center">
                          <div className="w-6 h-6 bg-gray-300 rounded-full mr-2" />
                          <div className="h-3 bg-gray-300 rounded" style={{ width: '40px' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 나머지 동아리 스켈레톤 */}
              <div className="space-y-2 mt-8">
                {[0, 1, 2, 3, 4].map((index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-100 animate-pulse"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-300 rounded-full mr-3" />
                      <div>
                        <div className="h-4 bg-gray-300 rounded mb-1" style={{ width: '120px' }} />
                        <div className="h-3 bg-gray-300 rounded" style={{ width: '80px' }} />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-300 rounded mr-1" />
                      <div className="h-3 bg-gray-300 rounded" style={{ width: '30px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-purple-700 text-white rounded-lg"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              {/* 상위 3등 - EventClubs.tsx 스타일 */}
              {top3Clubs.length > 0 && (
                <div className="mb-6 px-4">
                  <div className="flex items-end justify-center space-x-4">
                    {top3Clubs.map((club, index) => {
                      // club이 존재하는지 확인
                      if (!club) return null;
                      
                      const isFirst = index === 1; // 1등 (가운데)
                      const isSecond = index === 0; // 2등 (왼쪽)
                      const isThird = index === 2; // 3등 (오른쪽)
                      
                      return (
                        <div
                          key={club.id}
                          className={`flex flex-col items-center ${
                            isFirst ? 'transform scale-110' : ''
                          }`}
                          style={{
                            background: 'rgba(124, 58, 237, 0.05)',
                            border: '1px solid rgba(124, 58, 237, 0.1)',
                            borderRadius: '16px',
                            padding: isFirst ? '24px 20px' : '20px 16px',
                            minWidth: isFirst ? '140px' : '120px'
                          }}
                        >
                          {/* 랭킹 배지 */}
                          <div className="flex items-center justify-center mb-4"
                            style={{
                              width: isFirst ? '64px' : '48px',
                              height: isFirst ? '64px' : '48px'
                            }}>
                            <img
                              src={isFirst ? '/images/icon_gold_medal.png' : 
                                   isSecond ? '/images/icon_silver_medal.png' : 
                                   '/images/icon_bronze_medal.png'}
                              alt="메달 아이콘"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          
                          {/* 동아리 정보 */}
                          <div className="text-center">
                            <h3 className="text-gray-800 font-bold mb-2" style={{ fontSize: isFirst ? '16px' : '14px' }}>
                              {club.name || '동아리명 없음'}
                            </h3>
                            
                            <span className="text-gray-600 text-sm font-medium px-3 py-1 rounded-full mb-3 inline-block"
                              style={{
                                background: 'rgba(124, 58, 237, 0.1)',
                                fontSize: isFirst ? '14px' : '12px'
                              }}>
                              {isFirst ? '1등' : isSecond ? '2등' : '3등'}
                            </span>
                            
                            {club.description && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-2" style={{ fontSize: isFirst ? '13px' : '12px' }}>
                                {club.description}
                              </p>
                            )}
                            
                            {/* 투표 수 */}
                            <div className="flex items-center justify-center">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full mr-2"
                                style={{
                                  background: 'rgba(124, 58, 237, 0.2)'
                                }}>
                                <svg className="w-3 h-3 text-purple-700" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                              </div>
                              <span className="text-gray-700 text-sm font-medium" style={{ fontSize: isFirst ? '14px' : '12px' }}>
                                {club.voteCount || 0}표
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 나머지 동아리 리스트 */}
              {remainingClubs.length > 0 && (
                <div>
                  <div className="space-y-2 mt-8">
                    {remainingClubs.map((club, index) => {
                      // club이 존재하는지 확인
                      if (!club) return null;
                      
                      return (
                      <div
                        key={club.id}
                        className="flex items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-100"
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-purple-700 font-bold text-sm">{index + 4}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{club.name}</h4>
                            {club.description && (
                              <p className="text-gray-600 text-sm line-clamp-1">{club.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                          </svg>
                          <span className="text-gray-600 text-sm font-medium">{club.voteCount || 0}표</span>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 투표 혜택 안내 섹션 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 mt-4">상품 안내</h2>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl">
              <div className="flex items-center">
                <div className="w-20 h-20 rounded-xl mr-2 flex items-center justify-center">
                  <img
                    src="/images/icon_gold_medal.png"
                    alt="금메달 아이콘"
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="text-gray-900 font-semibold text-md">1등 동아리</span>
                  </div>
                  <h3 className="text-gray-900 font-medium text-base">40만원</h3>
                  <p className="text-gray-600 text-sm">가장 많은 투표를 받은 동아리에게 제공</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl">
              <div className="flex items-center">
                <div className="w-20 h-20 rounded-xl mr-2 flex items-center justify-center">
                  <img
                    src="/images/icon_silver_medal.png"
                    alt="은메달 아이콘"
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="text-gray-900 font-semibold text-md">2등 동아리</span>
                  </div>
                  <h3 className="text-gray-900 font-medium text-base">30만원</h3>
                  <p className="text-gray-600 text-sm">두 번째로 많은 투표를 받은 동아리에게 제공</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl">
              <div className="flex items-center">
                <div className="w-20 h-20 rounded-xl mr-2 flex items-center justify-center">
                  <img
                    src="/images/icon_bronze_medal.png"
                    alt="동메달 아이콘"
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <span className="text-gray-900 font-semibold text-md">3등 동아리</span>
                  </div>
                  <h3 className="text-gray-900 font-medium text-base">15만원</h3>
                  <p className="text-gray-600 text-sm">세 번째로 많은 투표를 받은 동아리에게 제공</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 투표 상태에 따른 조건부 렌더링 */}
        {isLoading ? (
          // 투표 상태 확인 스켈레톤
          <div className="mb-8 mt-12">
            <div className="rounded-xl p-6 text-center animate-pulse" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="flex items-center justify-center mb-4">
                <div className="w-8 h-8 bg-gray-300 rounded-full mr-2" />
                <div className="h-6 bg-gray-300 rounded" style={{ width: '200px' }} />
              </div>
              
              <div className="h-4 bg-gray-300 rounded mb-4 mx-auto" style={{ width: '80%' }} />
              <div className="h-4 bg-gray-300 rounded mx-auto" style={{ width: '60%' }} />
            </div>
          </div>
        ) : isVoted ? (
          // 이미 투표한 경우 - raffle/page.tsx 스타일 적용
          <div className="mb-8 mt-12">
            <div className="rounded-xl p-6 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="flex items-center justify-center mb-4">
                <img 
                  src="/images/icon_check.png" 
                  alt="완료 체크" 
                  className="w-8 h-8"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <h3 className="text-black font-bold text-xl ml-2">투표가 완료되었습니다!</h3>
              </div>
              
              <p className="text-black text-md" style={{ opacity: 0.7 }}>
                {votedClub ? (
                  <>
                    <span className="font-bold text-purple-700">{votedClub.name}</span>에 투표했어요!
                  </>
                ) : (
                  "이미 이 이벤트에 투표하셨습니다."
                )}
              </p>
              
              <p className="text-black text-md" style={{ opacity: 0.7 }}>
                결과 발표를 기다려주세요!
              </p>
            </div>
          </div>
        ) : (
          // 투표하지 않은 경우 - 투표하기 섹션 표시
          <div ref={voteSectionRef} className="mt-12 mb-8">
            <h2 className="text-xl font-bold text-black mb-8">투표하기</h2>
            
            <div className="mb-4">
              <label className="block text-black text-sm mb-4">초대 코드</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="동아리에서 받은 초대 코드를 입력해주세요"
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-700 transition-colors placeholder-gray-400"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  color: 'black',
                  border: '1px solid rgba(0, 0, 0, 0.1)'
                }}
                disabled={isSubmitting}
              />
            </div>

            <button
              onClick={handleVoteSubmit}
              disabled={isSubmitting || !inviteCode.trim()}
              className="w-full px-8 py-3 text-white rounded-lg font-bold transition-all duration-200"
              style={{
                backgroundColor: isSubmitting || !inviteCode.trim() ? 'rgba(0, 0, 0, 0.3)' : 'rgba(124, 58, 237, 1)',
                cursor: isSubmitting || !inviteCode.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-lg h-5 w-5 border-b-2 border-white mr-2"></div>
                  투표 중...
                </div>
              ) : (
                "투표하기"
              )}
            </button>
          </div>
        )}
      </div>

      {/* 플로팅 투표하기 버튼 */}
      {showFloatingButton && !isVoted && (
        <div className="fixed bottom-6 right-6 z-50" style={{ 
          bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
          right: 'calc(1.5rem + env(safe-area-inset-right))'
        }}>
          <button
            onClick={() => {
              voteSectionRef.current?.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
              });
            }}
            className="bg-purple-700 text-white rounded-full p-4 shadow-lg hover:bg-purple-800 transition-all duration-200"
            style={{
              boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.4)'
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

export default function VotePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    }>
      <VoteContent />
    </Suspense>
  );
}
