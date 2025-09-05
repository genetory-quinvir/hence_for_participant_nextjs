import { NextRequest, NextResponse } from 'next/server';

// Admin용 이벤트 목록 조회 API
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Admin 권한 검증 (간단한 토큰 확인)
    // 실제 구현에서는 JWT 토큰에서 role을 추출하여 검증
    // 여기서는 토큰 존재 여부만 확인 (클라이언트에서 이미 role 검증 완료)
    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    // 실제 이벤트 데이터 조회 (예시)
    // 실제 구현에서는 DB에서 이벤트와 참여자 정보를 조회
    const mockEvents = [
      {
        id: 'event-1',
        title: '2024 신년 이벤트',
        description: '새해를 맞이하는 특별 이벤트',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        maxWinners: 5,
        status: 'active',
        participants: [
          {
            id: 'user-1',
            name: '김철수',
            email: 'kim@example.com',
            phone: '010-1234-5678',
            eventId: 'event-1',
            registeredAt: '2024-01-15T10:30:00Z'
          },
          {
            id: 'user-2',
            name: '이영희',
            email: 'lee@example.com',
            phone: '010-2345-6789',
            eventId: 'event-1',
            registeredAt: '2024-01-16T14:20:00Z'
          },
          {
            id: 'user-3',
            name: '박민수',
            email: 'park@example.com',
            phone: '010-3456-7890',
            eventId: 'event-1',
            registeredAt: '2024-01-17T09:15:00Z'
          }
        ]
      },
      {
        id: 'event-2',
        title: '봄맞이 이벤트',
        description: '봄의 시작을 알리는 이벤트',
        startDate: '2024-03-01T00:00:00Z',
        endDate: '2024-03-31T23:59:59Z',
        maxWinners: 3,
        status: 'ended',
        participants: [
          {
            id: 'user-4',
            name: '정수진',
            email: 'jung@example.com',
            phone: '010-4567-8901',
            eventId: 'event-2',
            registeredAt: '2024-03-10T16:45:00Z'
          },
          {
            id: 'user-5',
            name: '최현우',
            email: 'choi@example.com',
            phone: '010-5678-9012',
            eventId: 'event-2',
            registeredAt: '2024-03-12T11:30:00Z'
          }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      events: mockEvents
    });

  } catch (error) {
    console.error('이벤트 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '이벤트 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
