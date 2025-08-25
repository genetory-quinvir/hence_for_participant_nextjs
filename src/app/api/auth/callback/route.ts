import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const provider = searchParams.get('provider');
    const isNewUser = searchParams.get('isNewUser');

    console.log('소셜 로그인 콜백 API 호출:', { code, provider, isNewUser });

    if (!code || !provider) {
      return NextResponse.json(
        { success: false, error: '인증 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 외부 API 호출
    const response = await fetch(`https://api-participant.hence.events/auth/callback?code=${code}&provider=${provider}&isNewUser=${isNewUser}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('외부 API 응답:', result);

    if (response.ok && result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || result.message || '로그인에 실패했습니다.',
          details: result
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('소셜 로그인 콜백 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
