import { NextRequest, NextResponse } from 'next/server';

/**
 * 소셜 로그인 파라미터 디버깅용 엔드포인트
 * 실제 소셜 로그인에서 어떤 파라미터가 전달되는지 확인할 수 있습니다.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // 모든 URL 파라미터 수집
    const allParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });

    // 필수 파라미터 확인
    const requiredParams = {
      code: searchParams.get('code'),
      provider: searchParams.get('provider'),
      social_user_id: searchParams.get('social_user_id'),
      email: searchParams.get('email'),
      name: searchParams.get('name'),
      nickname: searchParams.get('nickname'),
      isNewUser: searchParams.get('isNewUser'),
      redirect: searchParams.get('redirect'),
      clientRedirect: searchParams.get('clientRedirect')
    };

    // 파라미터 존재 여부 분석
    const paramAnalysis = {
      required: {
        code: !!requiredParams.code,
        provider: !!requiredParams.provider,
        social_user_id: !!requiredParams.social_user_id,
        email: !!requiredParams.email
      },
      optional: {
        name: !!requiredParams.name,
        nickname: !!requiredParams.nickname,
        isNewUser: !!requiredParams.isNewUser,
        redirect: !!requiredParams.redirect,
        clientRedirect: !!requiredParams.clientRedirect
      }
    };

    // 누락된 필수 파라미터 확인
    const missingRequired = Object.entries(paramAnalysis.required)
      .filter(([_, exists]) => !exists)
      .map(([param, _]) => param);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      url: request.url,
      analysis: {
        totalParams: Object.keys(allParams).length,
        allParams,
        requiredParams,
        paramAnalysis,
        missingRequired,
        hasAllRequired: missingRequired.length === 0
      },
      recommendations: {
        missingRequired: missingRequired.length > 0 
          ? `누락된 필수 파라미터: ${missingRequired.join(', ')}`
          : '모든 필수 파라미터가 제공되었습니다.',
        nextSteps: missingRequired.length > 0
          ? '외부 소셜 로그인 서비스 설정을 확인하고 필요한 파라미터가 전달되도록 수정하세요.'
          : '소셜 로그인이 정상적으로 작동할 것입니다.'
      }
    });
  } catch (error) {
    console.error('소셜 로그인 디버깅 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '디버깅 정보 수집 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      receivedData: body,
      analysis: {
        hasCode: !!body.code,
        hasProvider: !!body.provider,
        hasSocialUserId: !!body.social_user_id,
        hasEmail: !!body.email,
        hasName: !!body.name,
        hasNickname: !!body.nickname,
        missingRequired: [
          !body.code && 'code',
          !body.provider && 'provider', 
          !body.social_user_id && 'social_user_id',
          !body.email && 'email'
        ].filter(Boolean)
      }
    });
  } catch (error) {
    console.error('소셜 로그인 POST 디버깅 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'POST 디버깅 정보 수집 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
