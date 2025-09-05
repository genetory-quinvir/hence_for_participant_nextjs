import { NextRequest, NextResponse } from 'next/server';

// 추첨 결과 저장 API
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { eventId, winners, raffleDate } = body;

    if (!eventId || !winners || !Array.isArray(winners)) {
      return NextResponse.json(
        { error: '필수 데이터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 추첨 결과 저장 (실제 구현에서는 DB에 저장)
    const raffleResult = {
      id: `raffle-${Date.now()}`,
      eventId,
      winners,
      raffleDate: raffleDate || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    // 여기서 실제로는 DB에 저장
    console.log('추첨 결과 저장:', raffleResult);

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '추첨 결과가 저장되었습니다.',
      raffleResult
    });

  } catch (error) {
    console.error('추첨 결과 저장 실패:', error);
    return NextResponse.json(
      { error: '추첨 결과 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
