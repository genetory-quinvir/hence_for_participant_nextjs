import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api-participant.hence.events';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, 'PATCH');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    console.log('🔄 프록시 요청 시작:', { method, pathSegments });
    
    // URL 구성
    const path = pathSegments.join('/');
    const url = `${API_BASE_URL}/${path}`;
    
    console.log('🌐 프록시 URL:', url);
    
    // 쿼리 파라미터 추가
    const urlWithParams = new URL(url);
    request.nextUrl.searchParams.forEach((value, key) => {
      urlWithParams.searchParams.append(key, value);
    });

    console.log('🔗 최종 URL:', urlWithParams.toString());

    // 헤더 복사 (민감한 헤더 제외)
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'origin', 'referer'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    console.log('📋 요청 헤더:', Object.fromEntries(headers.entries()));

    // 요청 본문 처리 (FormData 지원)
    let body: string | FormData | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('multipart/form-data')) {
        // FormData인 경우 그대로 전달
        body = await request.formData();
        console.log('📦 FormData 요청 본문 크기:', body instanceof FormData ? 'FormData 객체' : '알 수 없음');
      } else {
        // JSON 또는 텍스트인 경우
        body = await request.text();
        console.log('📦 요청 본문 크기:', body?.length || 0);
      }
    }

    // 외부 API 호출 (타임아웃과 재시도 로직 포함)
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 외부 API 호출 시도 ${attempt}/${maxRetries}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃
        
        console.log('📡 fetch 요청 시작...');
        const response = await fetch(urlWithParams.toString(), {
          method,
          headers,
          body,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log('📡 fetch 요청 완료:', { status: response.status, statusText: response.statusText });
        
        // 응답 내용 확인 (에러인 경우)
        if (!response.ok) {
          let errorBody;
          try {
            errorBody = await response.text();
            console.log('❌ 서버 에러 응답:', errorBody);
          } catch (e) {
            console.log('❌ 서버 에러 응답 읽기 실패:', e);
          }
        }
        
        // 응답 헤더 복사
        const responseHeaders = new Headers();
        response.headers.forEach((value, key) => {
          responseHeaders.set(key, value);
        });

        // CORS 헤더 추가
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // 응답 반환
        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
        
      } catch (error: any) {
        lastError = error;
        console.log(`❌ 프록시 요청 시도 ${attempt}/${maxRetries} 실패:`, {
          message: error.message,
          name: error.name,
          cause: error.cause
        });
        
        if (attempt === maxRetries) {
          console.error('💥 모든 재시도 실패:', error);
          break;
        }
        
        // 재시도 전 잠시 대기 (지수 백오프)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ ${waitTime}ms 대기 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
        }
    
    // 모든 재시도가 실패한 경우
    return NextResponse.json(
      { error: 'Network Error', details: lastError?.message || 'Connection failed' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
