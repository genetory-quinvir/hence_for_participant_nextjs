"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ParticipantItem } from "@/types/api";
import { getParticipantsList } from "@/lib/api";
import CommonNavigationBar from "@/components/CommonNavigationBar";
import CommonProfileView from "@/components/common/CommonProfileView";
import { useSimpleNavigation } from "@/utils/navigation";

function ParticipantsListContent() {
  const searchParams = useSearchParams();
  const { navigate, goBack } = useSimpleNavigation();
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const eventId = searchParams.get('eventId') || 'default-event';
  const hasCalledApi = useRef(false);
  const isMounted = useRef(false);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      hasCalledApi.current = false;
    };
  }, []);

  // 참여자 리스트 페이지 진입 시 히스토리에 추가
  useEffect(() => {
    // 브라우저 히스토리만 사용하므로 별도 관리 불필요
  }, [eventId]);

  // 참여자 리스트 가져오기
  useEffect(() => {
    console.log('🔄 참여자 리스트 useEffect 실행:', { 
      eventId, 
      hasCalledApi: hasCalledApi.current 
    });
    
    // 이미 API를 호출했다면 중복 호출 방지
    if (hasCalledApi.current) {
      console.log('⏭️ 이미 API 호출됨, 중복 호출 방지');
      return;
    }
    
    if (eventId) {
      hasCalledApi.current = true;
      setLoading(true);
      setError(null);
      
      console.log('🔄 참여자 리스트 요청:', { eventId });
      
      getParticipantsList(eventId, null, 20)
        .then((result) => {
          // 컴포넌트가 언마운트되었으면 상태 업데이트하지 않음
          if (!isMounted.current) return;
          
          if (result.success && result.data) {
            setParticipants(result.data);
            setHasNext(result.hasNext || false);
            setCursor(result.nextCursor || null);
            console.log('✅ 참여자 리스트 로드 성공:', { 
              참여자수: result.data.length,
              hasNext: result.hasNext,
              nextCursor: result.nextCursor
            });
          } else {
            setError(result.error || '참여자 목록을 불러오는데 실패했습니다.');
            console.error('❌ 참여자 리스트 로드 실패:', result.error);
          }
        })
        .catch((error) => {
          // 컴포넌트가 언마운트되었으면 상태 업데이트하지 않음
          if (!isMounted.current) return;
          
          setError('참여자 목록을 불러오는데 실패했습니다.');
          console.error('💥 참여자 리스트 로드 오류:', error);
        })
        .finally(() => {
          // 컴포넌트가 언마운트되었으면 상태 업데이트하지 않음
          if (!isMounted.current) return;
          
          setLoading(false);
        });
    }
  }, [eventId]);

  // 추가 데이터 로딩
  const loadMore = async () => {
    if (loadingMore || !hasNext || !cursor) return;

    try {
      setLoadingMore(true);
      console.log('🔄 추가 참여자 데이터 로드:', { cursor, hasNext });
      
      const result = await getParticipantsList(eventId, cursor, 20);
      
      if (result.success && result.data) {
        setParticipants(prev => {
          // 중복 제거를 위해 기존 ID들과 비교
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = result.data!.filter(item => !existingIds.has(item.id!));
          console.log('✅ 새로운 참여자 추가:', { 
            기존: prev.length, 
            새로추가: newItems.length, 
            총: prev.length + newItems.length 
          });
          return [...prev, ...newItems];
        });
        setHasNext(result.hasNext || false);
        setCursor(result.nextCursor || null);
        console.log('✅ 추가 데이터 로드 완료:', { 
          hasNext: result.hasNext, 
          nextCursor: result.nextCursor 
        });
      } else {
        console.error("추가 데이터 로드 실패:", result.error);
      }
    } catch (err) {
      console.error("추가 데이터 로드 오류:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // 스크롤 감지
  const handleScroll = () => {
    const scrollPercentage = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
    
    if (scrollPercentage >= 0.8 && !loadingMore && hasNext) {
      console.log('🔄 스크롤 감지 - 추가 데이터 로드 트리거:', { 
        scrollPercentage: scrollPercentage.toFixed(2),
        loadingMore,
        hasNext 
      });
      loadMore();
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNext, loadingMore, cursor]);

  // 상대적 시간 표시 함수 - 한국 시간 기준
  const getRelativeTime = (dateString: string): string => {
    // 한국 시간대 설정 (KST: UTC+9)
    const koreaTimeZone = 'Asia/Seoul';
    
    // 현재 시간을 한국 시간으로 변환
    const now = new Date().toLocaleString('en-US', { timeZone: koreaTimeZone });
    const nowDate = new Date(now);
    
    // 입력된 날짜를 한국 시간으로 변환
    const inputDate = new Date(dateString).toLocaleString('en-US', { timeZone: koreaTimeZone });
    const date = new Date(inputDate);
    
    const diffInSeconds = Math.floor((nowDate.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds}초 전`;
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    }

    // 24시간 이상 지난 경우 한국 시간 기준으로 날짜 표시
    return date.toLocaleDateString('ko-KR', { timeZone: koreaTimeZone });
  };

  // 뒤로가기 함수
  const handleBackClick = () => {
    goBack();
  };

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title="참여자 목록"
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
          backgroundColor="black"
          backgroundOpacity={1}
          textColor="text-white"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm" style={{ opacity: 0.7 }}>참여자 목록을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태 표시
  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        <CommonNavigationBar 
          title="참여자 목록"
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
          backgroundColor="black"
          backgroundOpacity={1}
          textColor="text-white"
        />
        <div className="flex items-center justify-center h-64">
          <div className="text-center px-4">
            <div className="text-red-400 text-lg mb-4">⚠️</div>
            <p className="text-white text-lg mb-4">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <CommonNavigationBar 
        title="참여자 목록"
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
        backgroundColor="black"
        backgroundOpacity={1}
        textColor="text-white"
      />
      
      <div className="px-4 py-2" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* 참여자 수 표시 */}
        <div className="mb-6">
          <p className="text-sm text-white" style={{ opacity: 0.7 }}>
            총 {participants.length}명의 참여자
          </p>
        </div>

        {/* 참여자 리스트 */}
        <div className="space-y-3">
          {participants.map((participant, index) => (
            <div
              key={participant.id}
              className="flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 hover:bg-white hover:bg-opacity-10"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              {/* 프로필 사진 */}
              <CommonProfileView
                profileImageUrl={participant.user?.profileImageUrl}
                nickname={participant.user?.nickname}
                size="lg"
                showBorder={true}
              />

              {/* 참여자 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {participant.user?.nickname || '익명'}
                    </h3>
                    <p className="text-sm text-white" style={{ opacity: 0.7 }}>
                      참여 시간: {participant.joinedAt ? getRelativeTime(participant.joinedAt) : '알 수 없음'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 더 로딩 중 */}
        {loadingMore && (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}

        {/* 더 이상 데이터가 없는 경우 */}
        {!hasNext && participants.length > 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-white" style={{ opacity: 0.6 }}>
              모든 참여자를 불러왔습니다
            </p>
          </div>
        )}

        {/* 참여자가 없는 경우 */}
        {participants.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-white text-lg mb-2">아직 참여자가 없습니다</p>
            <p className="text-sm text-white" style={{ opacity: 0.7 }}>
              이벤트에 참여해보세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function ParticipantsListLoading() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm" style={{ opacity: 0.7 }}>참여자 목록을 불러오는 중...</p>
      </div>
    </div>
  );
}

// 직접 내보내기
export default function ParticipantsListPage() {
  return (
    <Suspense fallback={<ParticipantsListLoading />}>
      <ParticipantsListContent />
    </Suspense>
  );
} 