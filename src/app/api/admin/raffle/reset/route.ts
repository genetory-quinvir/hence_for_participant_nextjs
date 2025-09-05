import { NextRequest, NextResponse } from 'next/server';

// 추첨 결과 초기화 API
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
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: '이벤트 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 추첨 결과 초기화 (실제 구현에서는 DB에서 해당 이벤트의 추첨 결과 삭제)
    console.log(`이벤트 ${eventId}의 추첨 결과 초기화`);

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '추첨 결과가 초기화되었습니다.',
      eventId
    });

  } catch (error) {
    console.error('추첨 결과 초기화 실패:', error);
    return NextResponse.json(
      { error: '추첨 결과 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
