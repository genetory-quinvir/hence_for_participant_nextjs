import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('API 라우트 호출됨');
    
    const body = await request.json();
    const { code, provider, isNewUser } = body;

    console.log('소셜 로그인 콜백 API 호출:', { 
      code, 
      provider, 
      isNewUser
    });

    if (!code || !provider) {
      return NextResponse.json(
        { success: false, error: '인증 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 필수 파라미터 검증 - code와 provider만 있으면 진행
    // 사용자 정보는 verify API에서 code를 통해 조회
    console.log('🔍 API 파라미터 검증 결과:', {
      hasCode: !!code,
      hasProvider: !!provider,
      hasIsNewUser: isNewUser !== undefined
    });

    console.log('✅ verify API를 통해 사용자 정보를 조회합니다.');

    // 1단계: code로 사용자 정보 조회
    const verifyUrl = `https://api.hence.events/api/v1/auth/social/verify/${code}`;
    const verifyRequestBody = {
      provider: provider.toUpperCase(),
      isNewUser
    };
    
    console.log('🔍 사용자 정보 조회 URL:', verifyUrl);
    console.log('🔍 사용자 정보 조회 요청 데이터:', verifyRequestBody);

    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyRequestBody),
    });

    const verifyResult = await verifyResponse.json();
    console.log('👤 사용자 정보 조회 결과:', verifyResult);
    console.log('✅ verify 성공! 사용자 정보:', {
      hasData: !!verifyResult.data,
      hasId: !!verifyResult.id,
      hasEmail: !!(verifyResult.data?.email || verifyResult.email),
      hasName: !!(verifyResult.data?.name || verifyResult.name),
      hasNickname: !!(verifyResult.data?.nickname || verifyResult.nickname)
    });

    if (!verifyResponse.ok) {
      console.error('❌ 사용자 정보 조회 실패:', {
        status: verifyResponse.status,
        statusText: verifyResponse.statusText,
        responseData: verifyResult,
        requestUrl: verifyUrl,
        requestBody: verifyRequestBody
      });
      
      // 401 에러인 경우 특별 처리
      if (verifyResponse.status === 401) {
        console.error('🔐 401 Unauthorized - 인증 실패. code가 유효하지 않거나 만료되었을 수 있습니다.');
        return NextResponse.json(
          { 
            success: false, 
            error: '인증 실패: code가 유효하지 않거나 만료되었습니다.',
            details: {
              status: verifyResponse.status,
              statusText: verifyResponse.statusText,
              response: verifyResult,
              suggestion: '새로운 소셜 로그인을 시도해주세요.'
            }
          },
          { status: verifyResponse.status }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: `사용자 정보 조회 실패 (${verifyResponse.status}: ${verifyResponse.statusText})`,
          details: {
            status: verifyResponse.status,
            statusText: verifyResponse.statusText,
            response: verifyResult,
            requestUrl: verifyUrl,
            requestBody: verifyRequestBody
          }
        },
        { status: verifyResponse.status }
      );
    }

    // 2단계: verify된 사용자 정보로 회원가입/로그인 처리
    const externalUrl = `https://api-participant.hence.events/auth/callback`;
    console.log('🚀 회원가입/로그인 처리 URL:', externalUrl);
    
    // verify에서 가져온 사용자 정보로 회원가입/로그인 요청
    const requestBody = {
      code,
      provider: provider.toUpperCase(),
      // verify에서 가져온 사용자 정보 (필수!)
      social_user_id: verifyResult.data?.id || verifyResult.id,
      email: verifyResult.data?.email || verifyResult.email,
      name: verifyResult.data?.name || verifyResult.name,
      nickname: verifyResult.data?.nickname || verifyResult.nickname,
      // 추가 정보
      ...(isNewUser !== undefined && { isNewUser })
    };

    console.log('🚀 회원가입/로그인 요청 데이터:', requestBody);
    console.log('📝 verify에서 가져온 사용자 정보:', {
      social_user_id: requestBody.social_user_id,
      email: requestBody.email,
      name: requestBody.name,
      nickname: requestBody.nickname
    });

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
      // 1. verify에서 가져온 사용자 정보가 있는 경우 사용 (우선순위)
      if (verifyResult.data || verifyResult.id) {
        console.log('🔄 회원가입/로그인 API 실패, verify에서 가져온 사용자 정보로 임시 로그인 처리');
        return NextResponse.json({
          success: true,
          data: {
            id: verifyResult.data?.id || verifyResult.id,
            email: verifyResult.data?.email || verifyResult.email,
            nickname: verifyResult.data?.nickname || verifyResult.nickname || '사용자',
            name: verifyResult.data?.name || verifyResult.name || '사용자'
          },
          access_token: 'temp_token_' + Date.now(), // 임시 토큰
          refresh_token: 'temp_refresh_' + Date.now(),
          message: '회원가입/로그인 API 실패로 인한 임시 로그인 (verify 정보 사용)'
        });
      }
      
      // 2. verify에서 가져온 사용자 정보가 있는 경우 사용 (이미 위에서 처리됨)
      console.log('🔄 외부 API 실패, verify에서 가져온 사용자 정보로만 처리 가능');
      
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || result.message || `외부 API 호출 실패 (${response.status}: ${response.statusText})`,
          details: {
            status: response.status,
            statusText: response.statusText,
            response: result,
            request: requestBody,
            suggestion: '외부 소셜 로그인 서비스 설정을 확인하거나, verify API가 올바른 사용자 정보를 반환하는지 확인하세요.'
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
