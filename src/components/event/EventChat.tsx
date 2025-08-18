"use client";

import { useState, useEffect, useRef } from 'react';
import EventSection from './EventSection';
import { ChatMessage } from '@/types/api';
import { getAccessToken } from '@/lib/api';
import { useToast } from '@/components/common/Toast';

interface EventChatProps {
  eventId: string;
  showViewAllButton?: boolean;
  onViewAllClick?: () => void;
}

export default function EventChat({ 
  eventId, 
  showViewAllButton = false,
  onViewAllClick 
}: EventChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isServerReady, setIsServerReady] = useState(true); // 서버 재시작했으므로 true로 설정
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showToast } = useToast();

  // 메시지 목록 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 서버 상태 확인 및 WebSocket 연결
  useEffect(() => {
    console.log('🔌 WebSocket 연결 시작...');

    // 이미 연결 시도 중이거나 최대 시도 횟수를 초과한 경우 중단
    if (connectionAttempts >= 1) { // 한 번만 시도
      console.log('❌ 이미 연결 시도 완료 - 더 이상 시도하지 않음');
      setIsServerReady(false);
      return;
    }

    const connectWebSocket = async () => {
      try {
        const token = getAccessToken();
        if (!token) {
          console.error('❌ JWT 토큰이 없습니다.');
          showToast('로그인이 필요합니다.', 'error');
          return;
        }

        // eventId 검증
        if (!eventId || eventId === 'undefined' || eventId === 'null') {
          console.error('❌ 유효하지 않은 eventId:', eventId);
          showToast('이벤트 정보가 올바르지 않습니다.', 'error');
          return;
        }

        // 최대 시도 횟수 초과 시 연결 중단
        if (connectionAttempts >= 1) { // 한 번만 시도
          console.log('❌ 이미 연결 시도 완료 - 더 이상 시도하지 않음');
          return;
        }

        // 기존 연결이 있으면 정리
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }

        // 기존 재연결 타이머 정리
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        setIsServerReady(true);

        // 개발 환경에서는 ws://, 프로덕션에서는 wss:// 사용
        const isDevelopment = process.env.NODE_ENV === 'development';
        const protocol = isDevelopment ? 'ws' : 'wss';
        const wsUrl = `${protocol}://api-participant.hence.events/chat/ws/${eventId}?token=${token}`;
        console.log('🔌 WebSocket 연결 시도:', { 
          url: wsUrl, 
          attempt: connectionAttempts + 1,
          eventId,
          tokenLength: token.length,
          timestamp: new Date().toISOString()
        });
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ WebSocket 연결 성공:', {
            url: ws.url,
            readyState: ws.readyState,
            timestamp: new Date().toISOString()
          });
          setIsConnected(true);
          setIsServerReady(true);
          setConnectionAttempts(0); // 연결 성공 시 시도 횟수 초기화
          showToast('채팅방에 연결되었습니다.', 'success');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket 메시지 수신:', data);
            
            switch (data.type) {
              case 'message':
                const newMessage: ChatMessage = {
                  id: data.id || Date.now().toString(),
                  userId: data.userId,
                  nickname: data.nickname,
                  profileImageUrl: data.profileImageUrl,
                  content: data.content,
                  timestamp: data.timestamp || Date.now(),
                  eventId: eventId
                };
                setMessages(prev => [...prev, newMessage]);
                break;
                
              case 'participant_count':
                setParticipantCount(data.count || 0);
                break;
                
              case 'error':
                console.error('❌ WebSocket 에러:', data.message);
                showToast(data.message || '채팅 오류가 발생했습니다.', 'error');
                break;
                
              default:
                console.log('📨 알 수 없는 메시지 타입:', data.type);
            }
          } catch (error) {
            console.error('❌ WebSocket 메시지 파싱 오류:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('🔌 WebSocket 연결 종료:', { 
            code: event.code, 
            reason: event.reason,
            attempts: connectionAttempts 
          });
          setIsConnected(false);
          
          if (event.code !== 1000) { // 정상 종료가 아닌 경우
            console.log('❌ WebSocket 연결 실패 - 재시도하지 않음');
            showToast('채팅 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket 에러:', {
            error,
            errorType: error.type,
            readyState: ws.readyState,
            url: ws.url,
            timestamp: new Date().toISOString()
          });
          setIsConnected(false);
          showToast('채팅 연결에 실패했습니다.', 'error');
        };

      } catch (error) {
        console.error('❌ WebSocket 연결 오류:', error);
        setIsConnected(false);
        showToast('채팅 연결에 실패했습니다.', 'error');
      }
    };

    connectWebSocket().catch(error => {
      console.error('❌ WebSocket 연결 함수 실행 오류:', error);
    });

    // 컴포넌트 언마운트 시 WebSocket 연결 종료
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmount');
        wsRef.current = null;
      }
    };
  }, [eventId, showToast, connectionAttempts]); // connectionAttempts를 다시 추가하되, 내부에서 체크

  // 메시지 전송 함수
  const sendMessage = () => {
    if (!inputMessage.trim() || !isConnected || isSending) {
      return;
    }

    try {
      setIsSending(true);
      
      const messageData = {
        type: 'message',
        content: inputMessage.trim()
      };
      
      console.log('📤 메시지 전송:', messageData);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(messageData));
        setInputMessage(''); // 입력창 초기화
      } else {
        showToast('채팅 연결이 끊어졌습니다.', 'error');
      }
    } catch (error) {
      console.error('❌ 메시지 전송 오류:', error);
      showToast('메시지 전송에 실패했습니다.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <EventSection
      title="실시간 채팅"
      subtitle="이벤트 참여자들과 실시간으로 소통해보세요"
      rightButton={showViewAllButton ? {
        text: "전체보기",
        onClick: onViewAllClick || (() => {
          console.log('채팅 전체보기 클릭');
        })
      } : undefined}
    >
      {/* 연결 상태 표시 */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 
              isServerReady ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-white" style={{ opacity: 0.7 }}>
              {isConnected ? '연결됨' : 
               isServerReady ? '서버 준비됨' : 
               connectionAttempts > 0 ? '연결 실패' : '서버 준비 중...'}
            </span>
          </div>
          <span className="text-sm text-white" style={{ opacity: 0.7 }}>
            참여자 {participantCount}명
          </span>
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="bg-black bg-opacity-20 rounded-lg p-4 mb-4" style={{ minHeight: '200px', maxHeight: '300px' }}>
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '250px' }}>
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div key={index} className="flex items-start space-x-3">
                {/* 메시지 내용 */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-white">
                      {message.nickname || '익명'}
                    </span>
                    <span className="text-xs text-white" style={{ opacity: 0.5 }}>
                      {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <p className="text-sm text-white" style={{ opacity: 0.9 }}>
                    {message.content}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-white text-sm" style={{ opacity: 0.6 }}>
                아직 메시지가 없습니다
              </p>
              <p className="text-white text-xs mt-1" style={{ opacity: 0.4 }}>
                첫 번째 메시지를 작성해보세요!
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 메시지 입력 영역 */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "메시지를 입력하세요..." : "서버 준비 중..."}
          className="flex-1 px-4 py-3 bg-black bg-opacity-20 rounded-lg text-white placeholder-white placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          disabled={!isConnected || isSending}
        />
        <button
          onClick={sendMessage}
          disabled={!isConnected || isSending || !inputMessage.trim()}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
        >
          {isSending ? '전송 중...' : isConnected ? '전송' : '대기 중'}
        </button>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-4 p-3 bg-yellow-600 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded-lg">
        <p className="text-xs text-yellow-300">
          💡 이 채팅방의 메시지는 저장되지 않으며, 페이지를 새로고침하면 사라집니다.
          {!isServerReady && (
            <span className="block mt-1">
              🔧 서버 준비 중입니다. 잠시만 기다려주세요.
            </span>
          )}
        </p>
      </div>
    </EventSection>
  );
}
