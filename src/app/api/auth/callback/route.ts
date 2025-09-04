import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 소셜 로그인 API 호출됨');
    
    const body = await request.json();
    const { 
      code, 
      provider, 
      isNewUser, 
      social_user_id, 
      email, 
      name, 
      nickname, 
      clientRedirect 
    } = body;
    
    console.log('📋 받은 파라미터:', { 
      code, 
      provider, 
      isNewUser, 
      social_user_id, 
      email, 
      name, 
      nickname, 
      clientRedirect 
    });

    if (!code || !provider) {
      return NextResponse.json(
        { success: false, error: '인증 코드와 제공자가 필요합니다.' },
        { status: 400 }
      );
    }

    // 백엔드로 소셜 로그인 정보 전달
    console.log('📡 백엔드로 소셜 로그인 정보 전달...');
    const response = await fetch('https://api-participant.hence.events/auth/callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        provider: provider.toUpperCase(),
        isNewUser,
        social_user_id,
        email,
        name,
        nickname,
        clientRedirect
      }),
    });

    console.log('📊 백엔드 응답 상태:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 백엔드 호출 실패:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `소셜 로그인에 실패했습니다. (${response.status})` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('✅ 백엔드 응답 성공:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ 소셜 로그인 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
