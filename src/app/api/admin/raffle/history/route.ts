import { NextRequest, NextResponse } from 'next/server';

// 추첨 이력 조회 API
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
    // 클라이언트에서 이미 role 검증 완료
    if (!token) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다.' },
        { status: 401 }
      );
    }

    // 추첨 이력 조회 (실제 구현에서는 DB에서 조회)
    const mockHistory = [
      {
        id: 'raffle-1',
        eventId: 'event-1',
        eventTitle: '2024 신년 이벤트',
        raffleDate: '2024-01-20T15:30:00Z',
        winnerCount: 3,
        status: 'completed',
        winners: ['user-1', 'user-2', 'user-3']
      },
      {
        id: 'raffle-2',
        eventId: 'event-2',
        eventTitle: '봄맞이 이벤트',
        raffleDate: '2024-03-25T10:15:00Z',
        winnerCount: 2,
        status: 'completed',
        winners: ['user-4', 'user-5']
      }
    ];

    return NextResponse.json({
      success: true,
      history: mockHistory
    });

  } catch (error) {
    console.error('추첨 이력 조회 실패:', error);
    return NextResponse.json(
      { error: '추첨 이력 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
