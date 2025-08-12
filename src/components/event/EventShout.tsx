"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { useRouter } from "next/navigation";
import { ShoutItem } from "@/types/api";
import { createShout, getShouts, getAccessToken } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface EventShoutProps {
  eventId: string;
}

export default function EventShout({ eventId }: EventShoutProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [shouts, setShouts] = useState<ShoutItem[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // 외치기 목록 로드
  const loadShouts = async () => {
    setLoading(true);
    console.log('🚀 초기 외치기 목록 로드 시작...');
    
    try {
      const result = await getShouts(eventId);
      console.log('📡 초기 getShouts 결과:', result);
      
      if (result.success && result.data) {
        console.log('✅ 초기 외치기 데이터 로드 성공:', result.data.length, '개');
        console.log('📝 초기 외치기 내용:', result.data.map(s => `${s.user.nickname}: ${s.content}`));
        setShouts(result.data);
      } else if (result.error === 'AUTH_REQUIRED') {
        console.log('🔐 인증 필요, 로그인 페이지로 이동');
        alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        router.push('/sign');
      } else {
        console.error('❌ 외치기 목록 로드 실패:', result.error);
      }
    } catch (error) {
      console.error('💥 외치기 목록 요청 중 예외 발생:', error);
    } finally {
      setLoading(false);
      console.log('🏁 초기 외치기 목록 로드 완료');
    }
  };

  // 클라이언트 사이드 확인
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 외치기 목록 초기 로드
  useEffect(() => {
    if (isClient) {
      loadShouts();
    }
  }, [eventId, isClient]);

  // 메시지 순차적 표시 및 다음 메시지로 이동
  useEffect(() => {
    if (shouts.length === 0 || !isClient) return;

    const timer = setTimeout(() => {
      // 다음 메시지로 이동
      setCurrentMessageIndex(prev => {
        const nextIndex = (prev + 1) % shouts.length;
        console.log(`📺 메시지 변경: ${prev} → ${nextIndex} (${shouts[nextIndex]?.user.nickname}: ${shouts[nextIndex]?.content})`);
        return nextIndex;
      });
      // 애니메이션 키 변경으로 애니메이션 재시작
      setAnimationKey(prev => prev + 1);
    }, 6000); // 6초마다 다음 메시지로

    return () => {
      clearTimeout(timer);
    };
  }, [shouts.length, isClient, animationKey]);

  // 마지막 메시지가 나타날 때 새로운 데이터 로드
  useEffect(() => {
    if (shouts.length === 0 || !isClient) return;

    // 마지막 메시지가 나타나는 시점 계산
    const lastMessageStartTime = (shouts.length - 1) * 6 * 1000; // 마지막 메시지 시작 시점

    const timer = setTimeout(async () => {
      console.log('🔄 마지막 메시지 시작, 새로운 데이터 로드 시작...');
      const result = await getShouts(eventId);
      console.log('📡 getShouts 결과:', result);
      
      if (result.success && result.data) {
        console.log('✅ 새로운 외치기 데이터 로드 성공:', result.data.length, '개');
        // 새 데이터를 현재 리스트에 연결 (중복 제거)
        setShouts(prev => {
          const existingIds = new Set(prev.map(shout => shout.id));
          const newShouts = result.data!.filter(shout => !existingIds.has(shout.id));
          console.log('🆕 추가될 새로운 외치기:', newShouts.length, '개');
          console.log('📝 새로운 외치기 내용:', newShouts.map(s => `${s.user.nickname}: ${s.content}`));
          return [...prev, ...newShouts];
        });
        console.log('🎬 새로운 메시지들이 리스트에 추가됨');
      } else {
        console.log('❌ 새로운 외치기 데이터 로드 실패:', result.error);
      }
    }, lastMessageStartTime);

    return () => {
      clearTimeout(timer);
    };
  }, [eventId, isClient, shouts.length]);



  // 외치기 전송
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    // 로그인 상태 확인
    const accessToken = getAccessToken();
    if (!accessToken) {
      alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
      router.push('/sign');
    }

    setSubmitting(true);
    try {
      const result = await createShout(eventId, message.trim());
      if (result.success && result.data) {
        setMessage("");
        // 새 외치기를 현재 목록에 추가
        const newShout: ShoutItem = {
          id: result.data.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          content: message.trim(),
          user: {
            id: user?.id || 'current-user',
            nickname: user?.nickname || '나',
            profileImageUrl: null
          },
          createdAt: new Date().toISOString()
        };
        setShouts(prev => [...prev, newShout]);
      } else if (result.error === 'AUTH_REQUIRED') {
        alert('로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        router.push('/sign');
      } else {
        alert(result.error || '외치기 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('외치기 전송 중 오류:', error);
      alert('외치기 전송 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-8 px-4">
      {/* 섹션 헤더 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-1">전광판</h2>
        <p className="text-sm text-white" style={{ opacity: 0.7 }}>
          다른 참가자들에게 메시지를 남겨보세요
        </p>
      </div>

      {/* 전광판 메시지 표시 */}
      <div className="mb-6">
        <div 
          ref={scrollContainerRef}
          className="relative h-16 overflow-hidden rounded-lg"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgb(147, 51, 234)'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">로딩 중...</div>
            </div>
          ) : shouts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">아직 메시지가 없습니다.</div>
            </div>
          ) : (
            <div className="relative h-full px-4 overflow-hidden">
              {shouts[currentMessageIndex] && (
                <div
                  key={`${shouts[currentMessageIndex].id}-${animationKey}`}
                  className="absolute top-1/2 transform -translate-y-1/2 whitespace-nowrap"
                  style={{ 
                    animation: `scroll-left-single 6s linear`,
                    left: '100%'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-600 font-medium text-lg">
                      {shouts[currentMessageIndex].user.nickname}:
                    </span>
                    <span className="text-white text-lg">
                      {shouts[currentMessageIndex].content}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        

      </div>

      {/* 외치기 입력 폼 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex space-x-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            maxLength={100}
            className="flex-1 px-4 py-3 rounded-lg text-white placeholder-gray-400"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              outline: 'none'
            }}
            disabled={submitting}
          />
          <button
            type="submit"
            disabled={!message.trim() || submitting}
            className={`px-6 py-3 rounded-lg font-semibold ${
              message.trim() && !submitting
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? '전송 중...' : '전송'}
          </button>
        </div>
        <div className="mt-2 text-right">
          <span className="text-xs text-gray-400">
            {message.length}/100
          </span>
        </div>
      </form>


    </section>
  );
} 