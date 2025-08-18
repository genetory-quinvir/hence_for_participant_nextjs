"use client";

import { useState, useEffect, useRef } from 'react';
import EventSection from './EventSection';
import { ChatMessage } from '@/types/api';
import { getAccessToken } from '@/lib/api';
import { useToast } from '@/components/common/Toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const [isServerReady, setIsServerReady] = useState(false); // 초기값을 false로 변경
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // 메시지 개수 제한 (최대 200개)
  const MAX_MESSAGES = 200;

  // 메시지 목록 자동 스크롤
  const scrollToBottom = () => {
    const chatContainer = messagesEndRef.current?.parentElement;
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  };

  useEffect(() => {
    // 새 메시지가 추가될 때마다 스크롤 (자신이 보낸 메시지도 포함)
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // 서버 상태 확인 및 WebSocket 연결
  useEffect(() => {
    console.log('🔌 WebSocket 연결 시작...');

    // 최대 연결 시도 횟수 제한 (5회)
    if (connectionAttempts >= 5) {
      console.log('❌ 최대 연결 시도 횟수 초과 - 더 이상 시도하지 않음');
      setIsServerReady(false);
      return;
    }

    const connectWebSocket = async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          console.log('❌ 액세스 토큰이 없습니다.');
          showToast('로그인이 필요합니다.', 'error');
          return;
        }

        // 기존 재연결 타이머 정리
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        setIsServerReady(true);

        // 프로토콜 시도 순서: wss -> ws
        const protocols = ['wss', 'ws'];
        let ws: WebSocket | null = null;
        let lastError: any = null;
        let connectionSuccessful = false;

        for (const protocol of protocols) {
          if (connectionSuccessful) break;
          
          try {
            const wsUrl = `${protocol}://api-participant.hence.events/chat/ws/${eventId}?token=${token}`;
            console.log(`🔌 WebSocket 연결 시도 (${protocol}):`, { 
              url: wsUrl, 
              attempt: connectionAttempts + 1,
              eventId,
              tokenLength: token.length,
              protocol,
              timestamp: new Date().toISOString()
            });
            
            ws = new WebSocket(wsUrl);
            
            // 연결 타임아웃 설정 (5초)
            const connectionTimeout = setTimeout(() => {
              if (ws && ws.readyState === WebSocket.CONNECTING) {
                console.log(`⏰ ${protocol} 연결 타임아웃`);
                ws.close();
              }
            }, 5000);

            // 연결 성공 시
            ws.onopen = () => {
              clearTimeout(connectionTimeout);
              console.log(`✅ WebSocket 연결 성공 (${protocol}):`, {
                url: ws?.url,
                readyState: ws?.readyState,
                timestamp: new Date().toISOString()
              });
              console.log('🔧 상태 업데이트 시작...');
              setIsConnected(true);
              console.log('✅ isConnected = true 설정됨');
              setIsServerReady(true);
              console.log('✅ isServerReady = true 설정됨');
              setConnectionAttempts(0);
              console.log('✅ connectionAttempts = 0 설정됨');
              showToast('채팅방에 연결되었습니다.', 'success');
              connectionSuccessful = true;
              wsRef.current = ws; // WebSocket 참조 저장
              console.log('✅ WebSocket 참조 저장됨:', wsRef.current);
              
              // 연결 후 참여자 수 요청
              if (ws && ws.readyState === WebSocket.OPEN) {
                const requestData = {
                  type: 'get_participant_count'
                };
                ws.send(JSON.stringify(requestData));
                console.log('📤 참여자 수 요청 전송:', requestData);
              }
            };

            // 연결 실패 시
            ws.onerror = (error: Event) => {
              clearTimeout(connectionTimeout);
              lastError = error;
              console.error(`❌ WebSocket 에러 (${protocol}):`, {
                error,
                errorType: error.type,
                readyState: ws?.readyState,
                url: ws?.url,
                timestamp: new Date().toISOString()
              });
            };

            // 연결 종료 시
            ws.onclose = (event: CloseEvent) => {
              clearTimeout(connectionTimeout);
              console.log(`🔌 WebSocket 연결 종료 (${protocol}):`, { 
                code: event.code, 
                reason: event.reason,
                attempts: connectionAttempts 
              });
              
              if (event.code === 1000) {
                // 정상 종료
                setIsConnected(false);
                return;
              }
              
              // 비정상 종료 시 재연결 시도
              console.log('🔄 연결이 비정상적으로 종료됨 - 재연결 시도...');
              setIsConnected(false);
              
              // 3초 후 재연결 시도
              reconnectTimeoutRef.current = setTimeout(() => {
                console.log('🔄 재연결 시도 시작...');
                setConnectionAttempts(prev => prev + 1);
              }, 3000);
            };

            // 메시지 수신
            ws.onmessage = (event: MessageEvent) => {
              try {
                console.log('📨 원본 메시지 데이터:', event.data);
                const data = JSON.parse(event.data);
                console.log('📨 파싱된 메시지 데이터:', data);
                console.log('📨 현재 메시지 개수:', messages.length);
                
                // 메시지를 받았다는 것은 연결이 성공했다는 의미
                if (!isConnected) {
                  console.log('🔧 메시지 수신으로 연결 상태 확인됨 - 상태 업데이트');
                  setIsConnected(true);
                  setIsServerReady(true);
                  setConnectionAttempts(0);
                  wsRef.current = ws;
                }
                
                switch (data.type) {
                  case 'message':
                    console.log('📨 일반 메시지 수신:', data);
                    const messageData = data.data; // data 객체 안의 실제 메시지 정보
                    
                    // 입장/퇴장 메시지는 표시하지 않음
                    if (messageData.message_type === 'join' || messageData.message_type === 'leave') {
                      console.log(`📨 ${messageData.message_type} 메시지 무시:`, messageData.content);
                      break;
                    }
                    
                    const newMessage: ChatMessage = {
                      id: messageData.id || Date.now().toString(),
                      userId: messageData.user_id, // user_id로 변경
                      nickname: messageData.username, // username으로 변경
                      profileImageUrl: messageData.profileImageUrl,
                      content: messageData.content,
                      timestamp: messageData.timestamp ? new Date(messageData.timestamp).getTime() : Date.now(),
                      eventId: eventId
                    };
                    console.log('📨 새 메시지 객체:', newMessage);
                    setMessages(prev => {
                      console.log('📨 이전 메시지 개수:', prev.length);
                      const updated = [...prev, newMessage];
                      
                      // 메시지 개수 제한 (최신 100개만 유지)
                      if (updated.length > MAX_MESSAGES) {
                        console.log(`📨 메시지 개수 제한 적용: ${updated.length} → ${MAX_MESSAGES}`);
                        return updated.slice(-MAX_MESSAGES);
                      }
                      
                      console.log('📨 업데이트된 메시지 개수:', updated.length);
                      return updated;
                    });
                    break;
                    
                  case 'participant_count':
                    console.log('📨 참여자 수 업데이트:', data.count);
                    setParticipantCount(data.count || 0);
                    break;
                    
                  case 'user_list':
                    console.log('📨 사용자 목록 수신:', data.data?.users);
                    if (data.data?.users) {
                      setParticipantCount(data.data.users.length);
                    }
                    break;
                    
                  case 'error':
                    console.error('❌ WebSocket 에러:', data.message);
                    showToast(data.message || '채팅 오류가 발생했습니다.', 'error');
                    break;
                    
                  default:
                    console.log('📨 알 수 없는 메시지 타입:', data.type, data);
                }
              } catch (error) {
                console.error('❌ WebSocket 메시지 파싱 오류:', error);
                console.error('❌ 원본 데이터:', event.data);
              }
            };

            // 연결 대기
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
              }, 5000);

              if (ws) {
                ws.onopen = () => {
                  clearTimeout(timeout);
                  resolve(true);
                };

                ws.onerror = (error: Event) => {
                  clearTimeout(timeout);
                  reject(error);
                };

                ws.onclose = (event: CloseEvent) => {
                  clearTimeout(timeout);
                  reject(new Error(`Connection closed: ${event.code}`));
                };
              }
            });

            // 성공 시 루프 종료
            connectionSuccessful = true;
            break;

          } catch (error) {
            console.error(`❌ ${protocol} 연결 실패:`, error);
            lastError = error;
            
            if (protocol === 'wss') {
              console.log('🔄 ws 프로토콜로 재시도...');
            } else {
              console.log('❌ 모든 프로토콜 시도 실패');
            }
          }
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
          wsRef.current = ws;
        } else {
          console.error('❌ 모든 WebSocket 연결 시도 실패:', lastError);
          setIsConnected(false);
          setIsServerReady(false);
          
          // 연결 실패 시 5초 후 재시도
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 연결 실패 - 재시도 예약...');
            setConnectionAttempts(prev => prev + 1);
          }, 5000);
          
          showToast('채팅 연결에 실패했습니다. 재연결을 시도합니다.', 'error');
        }

      } catch (error) {
        console.error('❌ WebSocket 연결 오류:', error);
        setIsConnected(false);
        setIsServerReady(false);
        
        // 연결 오류 시 5초 후 재시도
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 연결 오류 - 재시도 예약...');
          setConnectionAttempts(prev => prev + 1);
        }, 5000);
        
        showToast('채팅 연결에 실패했습니다. 재연결을 시도합니다.', 'error');
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
              connectionAttempts > 0 && connectionAttempts < 5 ? 'bg-yellow-500' : 
              connectionAttempts >= 5 ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-white" style={{ opacity: 0.7 }}>
              {isConnected ? '연결됨' : 
               connectionAttempts > 0 && connectionAttempts < 5 ? `재연결 시도 중... (${connectionAttempts}/5)` : 
               connectionAttempts >= 5 ? '연결 실패' : '연결 시도 중...'}
            </span>
          </div>
          <span className="text-sm text-white" style={{ opacity: 0.7 }}>
            참여자 {participantCount}명
          </span>
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="bg-black bg-opacity-20 rounded-lg p-4 mb-4" style={{ height: '300px' }}>
        <div className="space-y-3 overflow-y-auto h-full">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex items-center justify-between mb-1">
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
          placeholder={isConnected ? "메시지를 입력하세요..." : "연결 중..."}
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
          {!isConnected && (
            <span className="block mt-1">
              🔧 WebSocket 연결 중입니다. 잠시만 기다려주세요.
            </span>
          )}
        </p>
      </div>
    </EventSection>
  );
}
