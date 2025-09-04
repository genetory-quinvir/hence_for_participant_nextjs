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

    // 필수 파라미터 검증 - code와 provider만 있으면 진행
    // social_user_id와 email은 외부 API에서 code를 통해 조회할 예정
    console.log('🔍 API 파라미터 검증 결과:', {
      hasCode: !!code,
      hasProvider: !!provider,
      hasSocialUserId: !!social_user_id,
      hasEmail: !!email,
      hasName: !!name,
      hasNickname: !!nickname
    });

    // social_user_id와 email이 없어도 code와 provider가 있으면 외부 API에서 조회 시도
    if (!social_user_id || !email) {
      console.log('⚠️ social_user_id 또는 email이 요청에 없음. 외부 API에서 code를 통해 조회를 시도합니다.');
    }

    // 외부 API 호출
    const externalUrl = `https://api-participant.hence.events/auth/callback`;
    console.log('외부 API URL:', externalUrl);
    
    // 외부 API로 전송할 데이터 구성
    // 일반적인 소셜 로그인 플로우: code만 전송하고 외부 API에서 사용자 정보 조회
    const requestBody = {
      code,
      provider: provider.toUpperCase(),
      // 추가 정보가 있으면 포함 (없어도 됨)
      ...(isNewUser !== undefined && { isNewUser }),
      ...(social_user_id && { social_user_id }),
      ...(email && { email }),
      ...(name && { name }),
      ...(nickname && { nickname })
    };

    console.log('🚀 외부 API로 전송할 데이터:', requestBody);
    console.log('📝 참고: code만으로도 외부 API에서 사용자 정보를 조회할 수 있어야 합니다.');

    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
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
      console.error('❌ 외부 API 호출 실패:', {
        status: response.status,
        statusText: response.statusText,
        responseData: result,
        requestBody: requestBody
      });
      
      // 외부 API 실패 시 대안 처리
      // 1. 사용자 정보가 URL 파라미터에 있는 경우 사용
      if (social_user_id && email) {
        console.log('🔄 외부 API 실패, URL 파라미터의 사용자 정보 사용');
        return NextResponse.json({
          success: true,
          data: {
            id: social_user_id,
            email: email,
            nickname: nickname || name || '사용자',
            name: name || nickname || '사용자'
          },
          access_token: 'temp_token_' + Date.now(), // 임시 토큰
          refresh_token: 'temp_refresh_' + Date.now(),
          message: '외부 API 실패로 인한 임시 로그인 (URL 파라미터 사용)'
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || result.message || `외부 API 호출 실패 (${response.status}: ${response.statusText})`,
          details: {
            status: response.status,
            statusText: response.statusText,
            response: result,
            request: requestBody,
            suggestion: '외부 소셜 로그인 서비스 설정을 확인하거나, URL 파라미터에 사용자 정보가 포함되도록 설정하세요.'
          }
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
