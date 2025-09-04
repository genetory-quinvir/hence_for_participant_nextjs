import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 ===== 내부 API 라우트 호출됨 =====');
    console.log('🚀 요청 URL:', request.url);
    console.log('🚀 요청 메서드:', request.method);
    console.log('🚀 요청 헤더:', Object.fromEntries(request.headers.entries()));
    console.log('🚀 호출 시간:', new Date().toISOString());
    
    const body = await request.json();
    console.log('🔍 받은 요청 body:', body);
    
    const { code, provider, isNewUser } = body;
    
    // code 값이 문자열인지 확인하고 안전하게 처리
    const safeCode = String(code || '').trim();
    const safeProvider = String(provider || '').trim();

    console.log('소셜 로그인 콜백 API 호출:', { 
      code, 
      provider, 
      isNewUser,
      safeCode,
      safeProvider
    });
    
    console.log('🔍 ===== 파라미터 상세 분석 =====');
    console.log('🔍 원본 code 타입:', typeof code);
    console.log('🔍 원본 code 값:', code);
    console.log('🔍 안전한 code 값:', safeCode);
    console.log('🔍 안전한 code 길이:', safeCode.length);
    console.log('🔍 원본 provider 타입:', typeof provider);
    console.log('🔍 원본 provider 값:', provider);
    console.log('🔍 안전한 provider 값:', safeProvider);
    console.log('🔍 isNewUser 타입:', typeof isNewUser);
    console.log('🔍 isNewUser 값:', isNewUser);

    if (!safeCode || !safeProvider) {
      console.error('❌ 필수 파라미터 누락:', { 
        hasCode: !!safeCode, 
        hasProvider: !!safeProvider,
        originalCode: code,
        originalProvider: provider
      });
      return NextResponse.json(
        { success: false, error: '인증 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 필수 파라미터 검증 - code와 provider만 있으면 진행
    // 사용자 정보는 verify API에서 code를 통해 조회
    console.log('🔍 API 파라미터 검증 결과:', {
      hasCode: !!safeCode,
      hasProvider: !!safeProvider,
      hasIsNewUser: isNewUser !== undefined
    });

    console.log('✅ verify API를 통해 사용자 정보를 조회합니다.');

    // 1단계: code로 사용자 정보 조회
    console.log('🔍 ===== VERIFY URL 생성 =====');
    console.log('🔍 원본 code 값:', code);
    console.log('🔍 안전한 code 값:', safeCode);
    console.log('🔍 code 타입:', typeof safeCode);
    
    const verifyUrl = `https://api.hence.events/api/v1/auth/social/verify/${safeCode}`;
    const verifyRequestBody = {
      provider: safeProvider.toUpperCase(),
      isNewUser
    };
    
    console.log('🔍 ===== VERIFY API 호출 시작 =====');
    console.log('🔍 생성된 verify URL:', verifyUrl);
    console.log('🔍 URL에 safeCode가 제대로 들어갔는지 확인:', verifyUrl.includes(safeCode));
    console.log('🔍 URL에 원본 code가 들어갔는지 확인:', verifyUrl.includes(code));
    console.log('🔍 사용자 정보 조회 요청 데이터:', verifyRequestBody);
    console.log('🔍 요청 헤더:', {
      'Content-Type': 'application/json',
      'User-Agent': 'NextJS-App'
    });
    console.log('🔍 요청 시간:', new Date().toISOString());

    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyRequestBody),
    });

    console.log('🔍 ===== VERIFY API 응답 수신 =====');
    console.log('🔍 응답 상태:', verifyResponse.status, verifyResponse.statusText);
    console.log('🔍 응답 헤더:', Object.fromEntries(verifyResponse.headers.entries()));
    console.log('🔍 응답 시간:', new Date().toISOString());
    
    const verifyResult = await verifyResponse.json();
    console.log('👤 ===== VERIFY API 응답 데이터 =====');
    console.log('👤 전체 응답 데이터:', JSON.stringify(verifyResult, null, 2));
    console.log('👤 응답 데이터 타입:', typeof verifyResult);
    console.log('👤 응답 데이터 키들:', Object.keys(verifyResult));
    
    console.log('✅ ===== VERIFY 사용자 정보 분석 =====');
    console.log('✅ hasData:', !!verifyResult.data);
    console.log('✅ hasId:', !!verifyResult.id);
    console.log('✅ hasEmail:', !!(verifyResult.data?.email || verifyResult.email));
    console.log('✅ hasName:', !!(verifyResult.data?.name || verifyResult.name));
    console.log('✅ hasNickname:', !!(verifyResult.data?.nickname || verifyResult.nickname));
    
    // 사용자 정보 상세 분석
    if (verifyResult.data) {
      console.log('📋 verifyResult.data 상세:', JSON.stringify(verifyResult.data, null, 2));
      console.log('📋 data.id:', verifyResult.data.id);
      console.log('📋 data.email:', verifyResult.data.email);
      console.log('📋 data.name:', verifyResult.data.name);
      console.log('📋 data.nickname:', verifyResult.data.nickname);
    }
    
    if (verifyResult.id) {
      console.log('📋 verifyResult.id:', verifyResult.id);
    }
    if (verifyResult.email) {
      console.log('📋 verifyResult.email:', verifyResult.email);
    }
    if (verifyResult.name) {
      console.log('📋 verifyResult.name:', verifyResult.name);
    }
    if (verifyResult.nickname) {
      console.log('📋 verifyResult.nickname:', verifyResult.nickname);
    }

    // verify API 응답에 토큰이 포함되어 있는지 확인
    console.log('🔍 ===== 토큰 확인 =====');
    console.log('🔍 hasAccessToken:', !!(verifyResult.access_token || verifyResult.data?.access_token));
    console.log('🔍 hasRefreshToken:', !!(verifyResult.refresh_token || verifyResult.data?.refresh_token));
    
    // verify API에서 토큰을 제공하는 경우 바로 반환
    if (verifyResult.access_token || verifyResult.data?.access_token) {
      console.log('✅ verify API에서 토큰을 제공함. 바로 반환합니다.');
      return NextResponse.json({
        success: true,
        data: {
          id: verifyResult.data?.id || verifyResult.id,
          email: verifyResult.data?.email || verifyResult.email,
          name: verifyResult.data?.name || verifyResult.name,
          nickname: verifyResult.data?.nickname || verifyResult.nickname
        },
        access_token: verifyResult.access_token || verifyResult.data?.access_token,
        refresh_token: verifyResult.refresh_token || verifyResult.data?.refresh_token,
        message: 'verify API에서 토큰을 받아 로그인 완료'
      });
    }

    if (!verifyResponse.ok) {
      console.error('❌ ===== VERIFY API 실패 =====');
      console.error('❌ 응답 상태:', verifyResponse.status, verifyResponse.statusText);
      console.error('❌ 응답 헤더:', Object.fromEntries(verifyResponse.headers.entries()));
      console.error('❌ 응답 데이터:', JSON.stringify(verifyResult, null, 2));
      console.error('❌ 요청 URL:', verifyUrl);
      console.error('❌ 요청 데이터:', JSON.stringify(verifyRequestBody, null, 2));
      console.error('❌ 실패 시간:', new Date().toISOString());
      
      // 401 에러인 경우 특별 처리
      if (verifyResponse.status === 401) {
        console.error('🔐 ===== 401 UNAUTHORIZED 에러 =====');
        console.error('🔐 code가 유효하지 않거나 만료되었을 수 있습니다.');
        console.error('🔐 원본 code 값:', code);
        console.error('🔐 안전한 code 값:', safeCode);
        console.error('🔐 원본 provider 값:', provider);
        console.error('🔐 안전한 provider 값:', safeProvider);
        console.error('🔐 isNewUser 값:', isNewUser);
        console.error('🔐 요청 URL:', verifyUrl);
        console.error('🔐 요청 body:', JSON.stringify(verifyRequestBody, null, 2));
        
        return NextResponse.json(
          { 
            success: false, 
            error: '인증 실패: code가 유효하지 않거나 만료되었습니다.',
            details: {
              status: verifyResponse.status,
              statusText: verifyResponse.statusText,
              response: verifyResult,
              requestUrl: verifyUrl,
              requestBody: verifyRequestBody,
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

    // 2단계: verify된 사용자 정보로 회원가입/로그인 처리 (토큰이 없는 경우에만)
    console.log('🚀 ===== 회원가입/로그인 처리 시작 =====');
    console.log('🚀 verify API에서 토큰을 제공하지 않음. 외부 API 호출 필요.');
    const externalUrl = `https://api-participant.hence.events/auth/callback`;
    console.log('🚀 회원가입/로그인 처리 URL:', externalUrl);
    
    // verify에서 가져온 사용자 정보로 회원가입/로그인 요청
    const requestBody = {
      code: safeCode,
      provider: safeProvider.toUpperCase(),
      // verify에서 가져온 사용자 정보 (필수!)
      social_user_id: verifyResult.data?.id || verifyResult.id,
      email: verifyResult.data?.email || verifyResult.email,
      name: verifyResult.data?.name || verifyResult.name,
      nickname: verifyResult.data?.nickname || verifyResult.nickname,
      // 추가 정보
      ...(isNewUser !== undefined && { isNewUser })
    };

    console.log('🚀 ===== 회원가입/로그인 요청 데이터 =====');
    console.log('🚀 전체 요청 데이터:', JSON.stringify(requestBody, null, 2));
    console.log('📝 ===== verify에서 가져온 사용자 정보 =====');
    console.log('📝 social_user_id:', requestBody.social_user_id);
    console.log('📝 email:', requestBody.email);
    console.log('📝 name:', requestBody.name);
    console.log('📝 nickname:', requestBody.nickname);
    console.log('📝 isNewUser:', requestBody.isNewUser);
    console.log('📝 요청 시간:', new Date().toISOString());

    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('🔍 ===== 외부 API 응답 수신 =====');
    console.log('🔍 응답 상태:', response.status, response.statusText);
    console.log('🔍 응답 헤더:', Object.fromEntries(response.headers.entries()));
    console.log('🔍 응답 시간:', new Date().toISOString());
    
    const result = await response.json();
    console.log('🔍 ===== 외부 API 응답 데이터 =====');
    console.log('🔍 전체 응답 데이터:', JSON.stringify(result, null, 2));
    console.log('🔍 응답 데이터 타입:', typeof result);
    console.log('🔍 응답 데이터 키들:', Object.keys(result));
    
    // 외부 API 응답 상세 분석
    console.log('🔍 ===== 외부 API 응답 분석 =====');
    console.log('🔍 status:', response.status);
    console.log('🔍 ok:', response.ok);
    console.log('🔍 hasSuccess:', 'success' in result);
    console.log('🔍 hasData:', 'data' in result);
    console.log('🔍 hasAccessToken:', 'access_token' in result || 'accessToken' in result);
    console.log('🔍 hasRefreshToken:', 'refresh_token' in result || 'refreshToken' in result);
    console.log('🔍 hasError:', 'error' in result || 'message' in result);
    
    if (result.success) {
      console.log('✅ 로그인 성공!');
      console.log('✅ success 값:', result.success);
    }
    if (result.data) {
      console.log('✅ 사용자 데이터 있음:', JSON.stringify(result.data, null, 2));
    }
    if (result.access_token) {
      console.log('✅ 액세스 토큰 있음:', result.access_token.substring(0, 20) + '...');
    }
    if (result.refresh_token) {
      console.log('✅ 리프레시 토큰 있음:', result.refresh_token.substring(0, 20) + '...');
    }
    if (result.error) {
      console.log('❌ 에러 있음:', result.error);
    }

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
      console.error('❌ ===== 외부 API 호출 실패 =====');
      console.error('❌ 응답 상태:', response.status, response.statusText);
      console.error('❌ 응답 헤더:', Object.fromEntries(response.headers.entries()));
      console.error('❌ 응답 데이터:', JSON.stringify(result, null, 2));
      console.error('❌ 요청 URL:', externalUrl);
      console.error('❌ 요청 데이터:', JSON.stringify(requestBody, null, 2));
      console.error('❌ 실패 시간:', new Date().toISOString());
      
      // 외부 API 실패 시 에러 반환
      console.log('🔄 회원가입/로그인 API 실패, 에러 반환');
      
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
