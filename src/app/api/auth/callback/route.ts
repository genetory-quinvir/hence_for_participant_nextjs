import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('API 라우트 호출됨');
    
    const body = await request.json();
    const { code, provider, isNewUser, social_user_id, email, name, nickname } = body;

    console.log('소셜 로그인 콜백 API 호출:', { 
      code, 
      provider, 
      isNewUser, 
      social_user_id, 
      email, 
      name, 
      nickname 
    });

    if (!code || !provider) {
      return NextResponse.json(
        { success: false, error: '인증 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 필수 파라미터 검증 - social_user_id와 email이 없으면 에러
    if (!social_user_id || !email) {
      console.error('필수 파라미터 누락:', { social_user_id, email });
      const missingFields = [];
      if (!social_user_id) missingFields.push('social_user_id (소셜 고유 ID)');
      if (!email) missingFields.push('email (이메일 주소)');
      
      return NextResponse.json(
        { 
          success: false, 
          error: `소셜 로그인에 필요한 정보가 누락되었습니다.\n\n누락된 정보:\n${missingFields.map(field => `• ${field}`).join('\n')}\n\n외부 소셜 로그인 서비스에서 이 정보들을 전달하지 않았습니다. 다시 로그인을 시도해주세요.`
        },
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
        isNewUser,
        // 소셜 사용자 고유 식별자와 이메일 추가 (필수!)
        social_user_id: social_user_id,
        email: email,
        name: name,
        nickname: nickname
      }),
    });

    const result = await response.json();
    console.log('외부 API 응답:', result);
    
    // 외부 API 응답 상세 분석
    console.log('🔍 외부 API 응답 분석:', {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      responseData: result,
      hasSuccess: 'success' in result,
      hasData: 'data' in result,
      hasAccessToken: 'access_token' in result || 'accessToken' in result,
      hasRefreshToken: 'refresh_token' in result || 'refreshToken' in result,
      hasError: 'error' in result || 'message' in result
    });

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
