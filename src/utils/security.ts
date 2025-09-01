// 보안 관련 유틸리티 함수들

// XSS 방지를 위한 HTML 이스케이프
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 입력 길이 제한
export function validateInputLength(text: string, maxLength: number): boolean {
  return text.length <= maxLength;
}

// 특수문자 필터링 (게시글 내용용)
export function sanitizeContent(content: string): string {
  // HTML 태그 제거
  const withoutHtml = content.replace(/<[^>]*>/g, '');
  // 위험한 문자들 이스케이프
  return withoutHtml
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// 파일 업로드 보안 검증
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // 파일 크기 제한 (20MB)
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: '파일 크기가 20MB를 초과합니다.' };
  }

  // 허용된 이미지 타입만
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다.' };
  }

  // 파일명 검증 (특수문자 제거)
  const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '');
  if (safeName !== file.name) {
    return { valid: false, error: '파일명에 특수문자가 포함되어 있습니다.' };
  }

  return { valid: true };
}

// URL 검증
export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // 허용된 프로토콜만
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Rate Limiting (간단한 클라이언트 사이드)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// CSRF 토큰 생성 (간단한 클라이언트 사이드)
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 민감한 정보 마스킹
export function maskSensitiveData(data: string, type: 'email' | 'phone' | 'name'): string {
  switch (type) {
    case 'email':
      const [local, domain] = data.split('@');
      return `${local.substring(0, 2)}***@${domain}`;
    case 'phone':
      return data.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    case 'name':
      return data.length > 2 ? data.substring(0, 1) + '*'.repeat(data.length - 2) + data.substring(data.length - 1) : data;
    default:
      return data;
  }
}

// 클립보드 복사 보안
export function secureCopyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    } else {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        resolve(true);
      } catch {
        resolve(false);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  });
}
