import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('API 라우트 호출됨');
    
    const body = await request.json();
    const { code, provider, isNewUser } = body;

    console.log('소셜 로그인 콜백 API 호출:', { code, provider, isNewUser });

    if (!code || !provider) {
      return NextResponse.json(
        { success: false, error: '인증 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 외부 API 호출
    const externalUrl = `https://api-participant.hence.events/auth/callback`;
    console.log('외부 API URL:', externalUrl);
    
    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        provider: provider.toUpperCase(),
        isNewUser
      }),
    });

    const result = await response.json();
    console.log('외부 API 응답:', result);

    if (response.ok) {
      // 외부 API 응답 구조에 따라 처리
      if (result.success) {
        return NextResponse.json(result);
      } else if (result.data && result.code === 200) {
        // 성공 응답이지만 success 필드가 없는 경우
        return NextResponse.json({
          success: true,
          data: result.data.user || result.data,
          access_token: result.data.token?.accessToken || result.data.accessToken,
          refresh_token: result.data.token?.refreshToken || result.data.refreshToken,
        });
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
