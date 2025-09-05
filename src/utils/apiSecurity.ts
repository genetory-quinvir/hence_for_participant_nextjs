/**
 * API 보안 및 무결성 검증 유틸리티
 */

/**
 * API 요청 검증
 */
export function validateApiRequest(
  url: string,
  options: RequestInit = {}
): { valid: boolean; reason?: string } {
  
  // 1. URL 검증
  if (!url || typeof url !== 'string') {
    return { valid: false, reason: '유효하지 않은 URL' };
  }
  
  // 2. 허용된 도메인 검증
  const allowedDomains = [
    'api-participant.hence.events',
    'api.hence.events',
    'localhost',
    '127.0.0.1'
  ];
  
  try {
    const urlObj = new URL(url);
    const isAllowed = allowedDomains.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
    );
    
    if (!isAllowed) {
      return { valid: false, reason: `허용되지 않은 도메인: ${urlObj.hostname}` };
    }
  } catch (error) {
    return { valid: false, reason: '유효하지 않은 URL 형식' };
  }
  
  // 3. HTTP 메서드 검증
  const method = options.method?.toUpperCase() || 'GET';
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
  
  if (!allowedMethods.includes(method)) {
    return { valid: false, reason: `허용되지 않은 HTTP 메서드: ${method}` };
  }
  
  // 4. 요청 크기 검증 (POST, PUT, PATCH)
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const body = options.body;
    if (body) {
      const bodySize = typeof body === 'string' ? body.length : 
                      body instanceof FormData ? getFormDataSize(body) : 0;
      
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (bodySize > maxSize) {
        return { valid: false, reason: `요청 크기 초과: ${bodySize} bytes` };
      }
    }
  }
  
  return { valid: true };
}

/**
 * FormData 크기 계산
 */
function getFormDataSize(formData: FormData): number {
  let size = 0;
  for (const [key, value] of formData.entries()) {
    size += key.length;
    if (value instanceof File) {
      size += value.size;
    } else if (typeof value === 'string') {
      size += value.length;
    }
  }
  return size;
}

/**
 * API 응답 검증
 */
export function validateApiResponse(
  response: Response,
  expectedContentType?: string
): { valid: boolean; reason?: string } {
  
  // 1. 상태 코드 검증
  if (response.status < 200 || response.status >= 600) {
    return { valid: false, reason: `유효하지 않은 상태 코드: ${response.status}` };
  }
  
  // 2. Content-Type 검증
  if (expectedContentType) {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes(expectedContentType)) {
      return { valid: false, reason: `예상하지 않은 Content-Type: ${contentType}` };
    }
  }
  
  // 3. 응답 크기 검증
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (size > maxSize) {
      return { valid: false, reason: `응답 크기 초과: ${size} bytes` };
    }
  }
  
  return { valid: true };
}

/**
 * API 요청 헤더 보안 검증
 */
export function validateApiHeaders(headers: HeadersInit): { valid: boolean; reason?: string } {
  const headerObj = headers instanceof Headers ? headers : new Headers(headers);
  
  // 1. 위험한 헤더 검증
  const dangerousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-originating-ip',
    'x-remote-ip',
    'x-remote-addr'
  ];
  
  for (const header of dangerousHeaders) {
    if (headerObj.has(header)) {
      return { valid: false, reason: `위험한 헤더 감지: ${header}` };
    }
  }
  
  // 2. Authorization 헤더 형식 검증
  const authHeader = headerObj.get('authorization');
  if (authHeader && !authHeader.startsWith('Bearer ')) {
    return { valid: false, reason: '잘못된 Authorization 헤더 형식' };
  }
  
  return { valid: true };
}

/**
 * API 요청 본문 보안 검증
 */
export function validateApiBody(body: any): { valid: boolean; reason?: string } {
  if (!body) return { valid: true };
  
  // 1. 문자열 본문 검증
  if (typeof body === 'string') {
    // SQL 인젝션 패턴 검증
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\b(OR|AND)\s+'.*'\s*=\s*'.*')/i
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(body)) {
        return { valid: false, reason: 'SQL 인젝션 패턴 감지' };
      }
    }
    
    // XSS 패턴 검증
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    
    for (const pattern of xssPatterns) {
      if (pattern.test(body)) {
        return { valid: false, reason: 'XSS 패턴 감지' };
      }
    }
  }
  
  // 2. 객체 본문 검증
  if (typeof body === 'object' && body !== null) {
    const bodyStr = JSON.stringify(body);
    
    // 중첩 깊이 검증
    const depth = getObjectDepth(body);
    if (depth > 10) {
      return { valid: false, reason: `객체 중첩 깊이 초과: ${depth}` };
    }
    
    // 프로토타입 오염 검증
    if (bodyStr.includes('__proto__') || bodyStr.includes('constructor')) {
      return { valid: false, reason: '프로토타입 오염 패턴 감지' };
    }
  }
  
  return { valid: true };
}

/**
 * 객체 중첩 깊이 계산
 */
function getObjectDepth(obj: any, currentDepth = 0): number {
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }
  
  let maxDepth = currentDepth;
  for (const value of Object.values(obj)) {
    const depth = getObjectDepth(value, currentDepth + 1);
    maxDepth = Math.max(maxDepth, depth);
  }
  
  return maxDepth;
}

/**
 * API 요청 속도 제한 검증
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly timeWindow: number;
  
  constructor(maxRequests: number = 100, timeWindow: number = 60000) { // 기본 1분당 100회
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // 오래된 요청 제거
    const recentRequests = requests.filter(time => now - time < this.timeWindow);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    // 새 요청 추가
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }
  
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const recentRequests = requests.filter(time => now - time < this.timeWindow);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }
  
  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

/**
 * 전역 속도 제한기
 */
export const globalRateLimiter = new RateLimiter(200, 60000); // 1분당 200회
