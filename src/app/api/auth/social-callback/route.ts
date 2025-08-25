import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, provider, isNewUser } = body;

    console.log('소셜 로그인 콜백 API 호출:', { code, provider, isNewUser });

    // 요청 데이터 로깅
    const requestBody = {
      code,
      provider: provider.toUpperCase(),
      isNewUser
    };
    console.log('서버로 전송할 데이터:', requestBody);

    if (!code || !provider) {
      return NextResponse.json(
        { success: false, error: '인증 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 서버에서 소셜 로그인 토큰 교환 처리
    const response = await fetch('https://api-participant.hence.events/auth/social-callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('서버 응답 상태:', response.status);
    console.log('서버 응답 헤더:', Object.fromEntries(response.headers.entries()));

    const result = await response.json();
    console.log('서버 응답 데이터:', result);

    if (response.ok && result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        access_token: result.access_token || result.data?.accessToken,
        refresh_token: result.refresh_token || result.data?.refreshToken,
      });
    } else {
      console.error('소셜 로그인 토큰 교환 실패:', result);
      console.error('응답 상태:', response.status);
      console.error('응답 헤더:', Object.fromEntries(response.headers.entries()));
      
      // 서버에서 반환한 오류 메시지가 있으면 사용, 없으면 기본 메시지
      const errorMessage = result.error || result.message || '로그인에 실패했습니다.';
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: result,
          status: response.status
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
