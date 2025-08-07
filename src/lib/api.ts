import { 
  LoginResponse, 
  SocialLoginResponse, 
  SocialProvider,
  LoginRequest,
  SocialLoginRequest,
  EventCodeResponse,
  FeaturedResponse
} from '@/types/api';
import { apiDebugger, logger } from '@/utils/logger';

// API 기본 설정 - 환경 변수로 관리
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
//   (process.env.NODE_ENV === 'production' 
//     ? 'https://api-participant.hence.events'
//     : 'http://127.0.0.1:8000'
//   );

const API_BASE_URL = 'https://api-participant.hence.events';


// 로그인 API 호출
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const url = `${API_BASE_URL}/auth/login`;
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    const requestBody: LoginRequest = { email, password };
    const headers = { 'Content-Type': 'application/json' };
    const jsonBody = JSON.stringify(requestBody);
    
    // 요청 로깅
    apiDebugger.logRequest('POST', url, headers, requestBody);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: jsonBody,
    });

    const responseText = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());
    
    // 응답 로깅
    apiDebugger.logResponse(response.status, url, responseHeaders, responseText);

    if (response.status === 200) {
      const responseData = JSON.parse(responseText);
      
      // Swagger 응답 형식에 맞게 수정
      if (responseData.data && responseData.data.user) {
        logger.info('✅ 로그인 성공 (data.user 형식)', responseData.data.user);
        return {
          success: true,
          data: responseData.data.user,
          access_token: responseData.data.token?.accessToken || '',
          refresh_token: responseData.data.token?.refreshToken || '',
        };
      } else if (responseData.user) {
        logger.info('✅ 로그인 성공 (user 형식)', responseData.user);
        return {
          success: true,
          data: responseData.user,
          access_token: responseData.access_token || responseData.accessToken || '',
          refresh_token: responseData.refresh_token || responseData.refreshToken || '',
        };
      } else {
        logger.error('❌ 응답에서 사용자 데이터를 찾을 수 없음', responseData);
        return {
          success: false,
          error: '서버 응답에서 사용자 정보를 찾을 수 없습니다.',
        };
      }
    } else {
      // 에러 응답 처리
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || '로그인에 실패했습니다.';
        logger.error('❌ 로그인 실패', { status: response.status, error: errorMessage });
        return {
          success: false,
          error: errorMessage,
        };
      } catch (e) {
        logger.error('❌ 에러 응답 파싱 실패', e);
        return {
          success: false,
          error: '로그인에 실패했습니다. 다시 시도해주세요.',
        };
      }
    }
  } catch (error) {
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

// 토큰 저장/관리 함수들
export function saveTokens(accessToken: string, refreshToken?: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    logger.debug('🔑 토큰 저장 완료', { 
      hasAccessToken: !!accessToken, 
      hasRefreshToken: !!refreshToken 
    });
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    logger.debug('🔑 Access Token 조회', { hasToken: !!token, length: token?.length || 0 });
    return token;
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('refresh_token');
    logger.debug('🔑 Refresh Token 조회', { hasToken: !!token, length: token?.length || 0 });
    return token;
  }
  return null;
}

export function removeTokens() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    logger.info('🔑 토큰 삭제 완료');
  }
}

// 기존 호환성을 위한 함수들
export function saveToken(token: string) {
  saveTokens(token);
}

export function getToken(): string | null {
  return getAccessToken();
}

export function removeToken() {
  removeTokens();
}

// 소셜 로그인 API 호출
export async function socialLogin(provider: SocialProvider, token: string): Promise<SocialLoginResponse> {
  const url = `${API_BASE_URL}/auth/social/${provider}`;
  
  try {
    const requestBody: SocialLoginRequest = { provider, token };
    const headers = { 'Content-Type': 'application/json' };

    apiDebugger.logRequest('POST', url, headers, requestBody);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    apiDebugger.logResponse(response.status, url, undefined, responseText);

    if (response.status === 200) {
      const data = JSON.parse(responseText);
      logger.info(`✅ ${provider} 로그인 성공`, data);
      return {
        success: true,
        data: data.data || data.user,
        access_token: data.data?.token?.accessToken || data.access_token || data.accessToken || '',
        refresh_token: data.data?.token?.refreshToken || data.refresh_token || data.refreshToken || '',
      };
    } else {
      const errorData = JSON.parse(responseText);
      logger.error(`❌ ${provider} 로그인 실패`, errorData);
      return {
        success: false,
        error: errorData.message || `${provider} 로그인에 실패했습니다.`,
      };
    }
  } catch (error) {
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.',
    };
  }
} 

// 이벤트 코드 확인 API
export async function checkEventCode(eventCode: string): Promise<EventCodeResponse> {
  const url = `${API_BASE_URL}/events/code/${eventCode}`;
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    const headers = { 'Content-Type': 'application/json' };
    
    // 요청 로깅
    apiDebugger.logRequest('GET', url, headers, null);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const responseText = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());
    
    // 응답 로깅
    apiDebugger.logResponse(response.status, url, responseHeaders, responseText);

    if (response.status === 200) {
      const responseData = JSON.parse(responseText);
      logger.info('✅ 이벤트 코드 확인 성공', responseData);
      return {
        success: true,
        event: responseData.data || responseData,
      };
    } else if (response.status === 404) {
      logger.warn('⚠️ 이벤트를 찾을 수 없음', { eventCode });
      return {
        success: false,
        error: '유효하지 않은 입장코드입니다.',
      };
    } else {
      // 에러 응답 처리
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || '이벤트 확인에 실패했습니다.';
        logger.error('❌ 이벤트 코드 확인 실패', { status: response.status, error: errorMessage });
        return {
          success: false,
          error: errorMessage,
        };
      } catch (e) {
        logger.error('❌ 에러 응답 파싱 실패', e);
        return {
          success: false,
          error: '이벤트 확인에 실패했습니다. 다시 시도해주세요.',
        };
      }
    }
  } catch (error) {
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
} 

// 이벤트 상세 정보 가져오기 API
export async function getFeaturedEvent(eventId: string): Promise<FeaturedResponse> {
  const url = `${API_BASE_URL}/featured/${eventId}`;
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    const headers = { 'Content-Type': 'application/json' };
    
    // 요청 로깅
    apiDebugger.logRequest('GET', url, headers, null);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const responseText = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());
    
    // 응답 로깅
    apiDebugger.logResponse(response.status, url, responseHeaders, responseText);

    if (response.status === 200) {
      const responseData = JSON.parse(responseText);
      logger.info('✅ 이벤트 상세 정보 로드 성공', responseData);
      return {
        success: true,
        featured: responseData.data || responseData,
      };
    } else if (response.status === 404) {
      logger.warn('⚠️ 이벤트를 찾을 수 없음', { eventId });
      return {
        success: false,
        error: '이벤트를 찾을 수 없습니다.',
      };
    } else {
      // 에러 응답 처리
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || '이벤트 정보를 가져오는데 실패했습니다.';
        logger.error('❌ 이벤트 상세 정보 로드 실패', { status: response.status, error: errorMessage });
        return {
          success: false,
          error: errorMessage,
        };
      } catch (e) {
        logger.error('❌ 에러 응답 파싱 실패', e);
        return {
          success: false,
          error: '이벤트 정보를 가져오는데 실패했습니다. 다시 시도해주세요.',
        };
      }
    }
  } catch (error) {
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
} 