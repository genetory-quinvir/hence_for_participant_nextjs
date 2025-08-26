import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = 'https://api-participant.hence.events';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params.path, 'PATCH');
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // URL 구성
    const path = pathSegments.join('/');
    const url = `${API_BASE_URL}/${path}`;
    
    // 쿼리 파라미터 추가
    const urlWithParams = new URL(url);
    request.nextUrl.searchParams.forEach((value, key) => {
      urlWithParams.searchParams.append(key, value);
    });

    // 헤더 복사 (민감한 헤더 제외)
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      if (!['host', 'origin', 'referer'].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    // 요청 본문 처리
    let body: string | undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await request.text();
    }

    // 외부 API 호출
    const response = await fetch(urlWithParams.toString(), {
      method,
      headers,
      body,
    });

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
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
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
