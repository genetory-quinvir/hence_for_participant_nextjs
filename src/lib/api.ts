import {
  LoginRequest,
  LoginResponse,
  SocialLoginRequest,
  SocialLoginResponse,
  SocialProvider,
  EventCodeResponse,
  FeaturedResponse,
  PostDetailResponse,
  CommentListResponse,
  BoardItem,
  TimelineItem,
  VendorItem,
  CouponItem,
  CreateShoutResponse,
  ShoutItem,
  ShoutDisplayResponse,
  UserItem,
  EventItem,
  CommentItem,
  ParticipantItem
} from '@/types/api';
import { apiDebugger, logger } from '@/utils/logger';

// API 기본 설정 - 통일된 API 주소
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
    // 로그 레벨을 INFO로 변경하여 DEBUG 로그 줄임
    if (process.env.NODE_ENV === 'development') {
      logger.debug('🔑 Access Token 조회', { hasToken: !!token, length: token?.length || 0 });
    }
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

// 토큰 갱신 함수
export async function refreshAccessToken(): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  const refreshToken = getRefreshToken();
  const currentAccessToken = getAccessToken();
  
  if (!refreshToken) {
    return { success: false, error: 'Refresh Token이 없습니다.' };
  }

  const url = `${API_BASE_URL}/auth/refresh`;
  
  try {
    // 디버깅: 요청 본문 로깅
    const requestBody = { 
      refreshToken: refreshToken,
      accessToken: currentAccessToken 
    };
    logger.info('🔄 토큰 갱신 요청', { url, requestBody });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (response.status === 200) {
      const data = await response.json();
      logger.info('🔄 토큰 갱신 응답', { data });
      
      const newAccessToken = data.data?.accessToken;
      const newRefreshToken = data.data?.refreshToken;
      
      if (newAccessToken) {
        // 새로운 Access Token 저장
        localStorage.setItem('access_token', newAccessToken);
        
        // 새로운 Refresh Token도 저장 (있는 경우)
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }
        
        logger.info('✅ Access Token 갱신 성공', { 
          hasNewRefreshToken: !!newRefreshToken,
          expiresIn: data.data?.expiresIn 
        });
        return { success: true, accessToken: newAccessToken };
      } else {
        logger.error('❌ 토큰 갱신 응답에서 Access Token을 찾을 수 없음', data);
        return { success: false, error: '토큰 갱신 응답에서 Access Token을 찾을 수 없습니다.' };
      }
    } else if (response.status === 401) {
      logger.error('❌ Refresh Token이 만료됨');
      // Refresh Token도 만료되었으므로 모든 토큰 제거
      removeTokens();
      return { success: false, error: 'AUTH_REQUIRED' };
    } else {
      const errorData = await response.json();
      logger.error('❌ 토큰 갱신 실패:', { 
        status: response.status, 
        errorData,
        requestBody: { refreshToken: refreshToken ? '***' : 'null' }
      });
      return { success: false, error: errorData.message || '토큰 갱신에 실패했습니다.' };
    }
  } catch (error) {
    logger.error('💥 토큰 갱신 중 오류:', error);
    return { success: false, error: '토큰 갱신 중 오류가 발생했습니다.' };
  }
}

// 공통 API 래퍼 함수 (토큰 갱신 포함)
export async function apiRequest<T>(
  url: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; status?: number }> {
  let accessToken = getAccessToken();
  
  // auth/me 호출인 경우 특별 로깅
  const isAuthMe = url.includes('/auth/me');
  if (isAuthMe) {
    console.log('🔑 auth/me 호출 - Access Token 확인:', { 
      hasToken: !!accessToken, 
      tokenLength: accessToken?.length || 0 
    });
  }
  
  if (!accessToken) {
    if (isAuthMe) {
      console.error('❌ auth/me 호출 실패: Access Token 없음');
    }
    return { success: false, error: 'AUTH_REQUIRED' };
  }

  const makeRequest = async (token: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // options.headers가 있는 경우 추가
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    // Authorization 헤더 추가
    headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      return { status: 401 };
    }

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        status: response.status, 
        error: errorData.message || `API 요청에 실패했습니다. (${response.status})` 
      };
    }

    const data = await response.json();
    return { status: 200, data };
  };

  // 첫 번째 요청 시도
  let response = await makeRequest(accessToken);

  // 401 에러가 발생하면 토큰 갱신 시도
  if (response.status === 401) {
    if (isAuthMe) {
      console.log('🔄 auth/me - Access Token 만료, 토큰 갱신 시도...');
    } else {
      console.log('🔄 Access Token 만료, 토큰 갱신 시도...');
    }
    const refreshResult = await refreshAccessToken();
    
    if (refreshResult.success && refreshResult.accessToken) {
      if (isAuthMe) {
        console.log('✅ auth/me - 토큰 갱신 성공, 재요청 시도...');
      } else {
        console.log('✅ 토큰 갱신 성공, 재요청 시도...');
      }
      accessToken = refreshResult.accessToken;
      response = await makeRequest(accessToken);
    } else {
      if (isAuthMe) {
        console.log('❌ auth/me - 토큰 갱신 실패:', refreshResult.error);
      } else {
        console.log('❌ 토큰 갱신 실패:', refreshResult.error);
      }
      return { success: false, error: 'AUTH_REQUIRED' };
    }
  }

  // 최종 응답 처리
  if (response.status === 200) {
    if (isAuthMe) {
      console.log('✅ auth/me - 최종 응답 성공:', response.data);
    }
    return { success: true, data: response.data };
  } else {
    if (isAuthMe) {
      console.error('❌ auth/me - 최종 응답 실패:', response.error);
    }
    return { success: false, error: response.error || 'API 요청에 실패했습니다.' };
  }
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

// 게시글 상세 정보 가져오기 API
export async function getBoardDetail(eventId: string, boardType: string, postId: string): Promise<PostDetailResponse> {
  try {
    const result = await apiRequest<any>(`${API_BASE_URL}/board/${eventId}/${boardType}/${postId}`, {
      method: 'GET',
    });

    if (result.success && result.data) {
      console.log('🔍 getBoardDetail 응답:', {
        data: result.data.data || result.data,
        isLiked: (result.data.data || result.data)?.isLiked
      });
      logger.info('✅ 게시글 상세 정보 로드 성공', result.data);
      return {
        success: true,
        data: result.data.data || result.data,
      };
    } else if (result.status === 404) {
      logger.warn('⚠️ 게시글을 찾을 수 없음', { eventId, boardType, postId });
      return {
        success: false,
        error: '게시글을 찾을 수 없습니다.',
      };
    } else {
      return {
        success: false,
        error: result.error || '게시글 정보를 가져오는데 실패했습니다.',
      };
    }
  } catch (error) {
    apiDebugger.logError(`${API_BASE_URL}/board/${eventId}/${boardType}/${postId}`, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

// 댓글 목록 가져오기 API
export async function getComments(eventId: string, boardType: string, postId: string): Promise<CommentListResponse> {
  try {
    const result = await apiRequest<any>(`${API_BASE_URL}/board/${eventId}/${boardType}/${postId}/comments`, {
      method: 'GET',
    });

    if (result.success && result.data) {
      logger.info('✅ 댓글 목록 로드 성공', result.data);
      
      const commentsData = result.data.data?.items || result.data.data || result.data;
      
      // 배열이 아닌 경우 빈 배열로 설정
      const safeCommentsData = Array.isArray(commentsData) ? commentsData : [];
      
      return {
        success: true,
        data: safeCommentsData,
      };
    } else if (result.status === 404) {
      logger.warn('⚠️ 댓글을 찾을 수 없음', { eventId, boardType, postId });
      return {
        success: false,
        error: '댓글을 찾을 수 없습니다.',
      };
    } else {
      return {
        success: false,
        error: result.error || '댓글을 가져오는데 실패했습니다.',
      };
    }
  } catch (error) {
    apiDebugger.logError(`${API_BASE_URL}/board/${eventId}/${boardType}/${postId}/comments`, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

// 좋아요 토글 API
export async function toggleLike(eventId: string, boardType: string, postId: string, isLiked: boolean): Promise<{ success: boolean; error?: string; updatedIsLiked?: boolean; updatedLikeCount?: number }> {
  const method = isLiked ? 'DELETE' : 'POST';
  
  console.log('🔍 좋아요 API 호출:', { 
    isLiked, 
    method,
    action: isLiked ? '좋아요 취소' : '좋아요 추가'
  });
  
  try {
    const result = await apiRequest<any>(`${API_BASE_URL}/board/${eventId}/${boardType}/${postId}/like`, {
      method,
    });

    if (result.success) {
      console.log('✅ 좋아요 토글 성공');
      logger.info('✅ 좋아요 토글 성공', { isLiked: !isLiked });
      
      // 응답에 업데이트된 상태가 포함되어 있는지 확인
      let updatedIsLiked = !isLiked;
      let updatedLikeCount = null;
      
      if (result.data) {
        console.log('🔍 좋아요 API 응답 데이터:', result.data);
        
        // 서버에서 업데이트된 상태를 반환하는 경우
        if (result.data.data) {
          updatedIsLiked = result.data.data.isLiked ?? updatedIsLiked;
          updatedLikeCount = result.data.data.likeCount;
        }
      }
      
      return {
        success: true,
        updatedIsLiked,
        updatedLikeCount
      };
    } else {
      console.error('❌ 좋아요 토글 실패:', result.error);
      return {
        success: false,
        error: result.error || '좋아요 처리에 실패했습니다.',
      };
    }
  } catch (error) {
    apiDebugger.logError(`${API_BASE_URL}/board/${eventId}/${boardType}/${postId}/like`, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

// 타임라인 목록 조회 API
export async function getTimelineList(eventId: string, page: number = 1, limit: number = 10): Promise<{ success: boolean; error?: string; data?: { items: TimelineItem[]; hasNext: boolean; total: number } }> {
  try {
    const result = await apiRequest<any>(`${API_BASE_URL}/timelines/${eventId}?page=${page}&limit=${limit}`, {
      method: 'GET',
    });

    if (result.success && result.data) {
      logger.info('✅ 타임라인 목록 조회 성공', result.data);
      return {
        success: true,
        data: {
          items: result.data.data?.items || result.data.items || [],
          hasNext: result.data.data?.hasNext || result.data.hasNext || false,
          total: result.data.data?.total || result.data.total || 0
        }
      };
    } else {
      return {
        success: false,
        error: result.error || '타임라인 목록을 불러오는데 실패했습니다.',
      };
    }
  } catch (error) {
    apiDebugger.logError(`${API_BASE_URL}/timelines/${eventId}?page=${page}&limit=${limit}`, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

export async function getBoardList(eventId: string, boardType: string, cursor?: string | null, limit: number = 10): Promise<{ success: boolean; error?: string; data?: { items: BoardItem[]; hasNext: boolean; total: number; nextCursor?: string | null } }> {
  try {
    const url = cursor 
      ? `${API_BASE_URL}/board/${eventId}/${boardType}?cursor=${cursor}&limit=${limit}`
      : `${API_BASE_URL}/board/${eventId}/${boardType}?limit=${limit}`;
      
    const result = await apiRequest<any>(url, {
      method: 'GET',
    });

    if (result.success && result.data) {
      logger.info('✅ 게시글 목록 조회 성공', result.data);
      const responseData = result.data.data || result.data;
      return {
        success: true,
        data: {
          items: responseData.items || [],
          hasNext: responseData.pagination?.hasNext || responseData.hasNext || false,
          total: responseData.pagination?.totalCount || responseData.total || 0,
          nextCursor: responseData.pagination?.nextCursor || null
        }
      };
    } else {
      return {
        success: false,
        error: result.error || '게시글 목록을 불러오는데 실패했습니다.',
      };
    }
  } catch (error) {
    const url = cursor 
      ? `${API_BASE_URL}/board/${eventId}/${boardType}?cursor=${cursor}&limit=${limit}`
      : `${API_BASE_URL}/board/${eventId}/${boardType}?limit=${limit}`;
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

export async function createPost(eventId: string, boardType: string, title: string | null, content: string, images: File[]): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // FormData 생성
    const formData = new FormData();
    
    // 제목 추가 (null이 아닌 경우에만)
    if (title) {
      formData.append('title', title);
    }
    
    // 내용 추가
    formData.append('content', content);
    
    // 이미지 파일들 추가
    images.forEach((image, index) => {
      formData.append('images', image);
    });

    // FormData를 사용하는 경우 직접 fetch 호출 (apiRequest 래퍼 사용하지 않음)
    const accessToken = getAccessToken();
    if (!accessToken) {
      return { success: false, error: 'AUTH_REQUIRED' };
    }

    const response = await fetch(`${API_BASE_URL}/board/${eventId}/${boardType}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        // Content-Type 헤더를 설정하지 않음 (브라우저가 자동으로 multipart/form-data 설정)
      },
      body: formData,
    });

    if (response.status === 401) {
      // 토큰 갱신 시도
      const refreshResult = await refreshAccessToken();
      if (refreshResult.success && refreshResult.accessToken) {
        // 갱신된 토큰으로 재요청
        const retryResponse = await fetch(`${API_BASE_URL}/board/${eventId}/${boardType}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${refreshResult.accessToken}`,
          },
          body: formData,
        });

        if (retryResponse.ok) {
          const data = await retryResponse.json();
          logger.info('✅ 게시글 작성 성공 (토큰 갱신 후)', data);
          return {
            success: true,
            data: data.data || data,
          };
        } else {
          const errorData = await retryResponse.json();
          return {
            success: false,
            error: errorData.message || '게시글 작성에 실패했습니다.',
          };
        }
      } else {
        return { success: false, error: 'AUTH_REQUIRED' };
      }
    }

    if (response.ok) {
      const data = await response.json();
      logger.info('✅ 게시글 작성 성공', data);
      return {
        success: true,
        data: data.data || data,
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || '게시글 작성에 실패했습니다.',
      };
    }
  } catch (error) {
    apiDebugger.logError(`${API_BASE_URL}/board/${eventId}/${boardType}`, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

export async function createComment(eventId: string, boardType: string, postId: string, content: string): Promise<CommentListResponse> {
  try {
    const result = await apiRequest<any>(`${API_BASE_URL}/board/${eventId}/${boardType}/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (result.success && result.data) {
      logger.info('✅ 댓글 작성 성공', result.data);
      return {
        success: true,
        data: result.data.data || result.data,
      };
    } else {
      return {
        success: false,
        error: result.error || '댓글 작성에 실패했습니다.',
      };
    }
  } catch (error) {
    apiDebugger.logError(`${API_BASE_URL}/board/${eventId}/${boardType}/${postId}/comments`, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

// 이벤트 상세 정보 가져오기 API
// 래플 참여 API
export async function participateRaffle(eventId: string, raffleId: string, data: {
  userId: string;
  realName: string;
  phoneNumber: string;
  privacyAgreement: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await apiRequest<any>(`${API_BASE_URL}/raffles/${eventId}/${raffleId}/participate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (result.success) {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
        error: result.error || '래플 응모에 실패했습니다.',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.',
    };
  }
}

// 래플 정보 및 참여 상태 확인
export async function getRaffleInfo(eventId: string): Promise<{ success: boolean; error?: string; isParticipated?: boolean; raffle?: any }> {
  try {
    const result = await apiRequest<any>(`${API_BASE_URL}/raffles/${eventId}`, {
      method: 'GET',
    });

    if (result.success && result.data) {
      console.log('서버 응답 데이터:', result.data);
      
      // 응답 구조에 따라 isParticipated 추출
      let isParticipated = false;
      let raffleData = null;
      
      if (result.data.data && result.data.data.items && result.data.data.items.length > 0) {
        // 배열 형태로 오는 경우 (첫 번째 아이템 사용)
        raffleData = result.data.data.items[0];
        isParticipated = raffleData.isParticipated || false;
      } else if (result.data.isParticipated !== undefined) {
        // 단일 객체로 오는 경우
        raffleData = result.data;
        isParticipated = result.data.isParticipated;
      }
      
      console.log('추출된 isParticipated 값:', isParticipated);
      console.log('추출된 래플 데이터:', raffleData);
      
      return {
        success: true,
        isParticipated: isParticipated,
        raffle: raffleData,
      };
    } else {
      return {
        success: false,
        error: result.error || '래플 정보를 가져오는데 실패했습니다.',
      };
    }
  } catch (error) {
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.',
    };
  }
}


// 쿠폰 가능한 벤더 목록 조회 (간단한 정보)
export async function getVendorsSimple(eventId: string, vendorType?: string): Promise<{ success: boolean; error?: string; data?: VendorItem[] }> {
  let url = `${API_BASE_URL}/vendors/${eventId}/simple`;
  
  // vendor_type이 제공된 경우에만 쿼리 파라미터 추가
  if (vendorType) {
    url += `?vendor_type=${vendorType}`;
  }
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    const result = await apiRequest<any>(url, {
      method: 'GET',
    });

    if (result.success && result.data) {
      logger.info('✅ 벤더 목록 조회 성공', result.data);
      
      // 응답 데이터 구조 확인 및 안전한 배열 반환
      let vendorArray: VendorItem[] = [];
      
      if (result.data.data && result.data.data.vendors) {
        // {"data": {"vendors": [...]}} 구조
        vendorArray = Array.isArray(result.data.data.vendors) ? result.data.data.vendors : [];
      } else if (result.data.data) {
        // {"data": [...]} 구조
        vendorArray = Array.isArray(result.data.data) ? result.data.data : [];
      } else if (Array.isArray(result.data)) {
        // [...] 구조
        vendorArray = result.data;
      } else if (result.data.items && Array.isArray(result.data.items)) {
        // {"items": [...]} 구조
        vendorArray = result.data.items;
      }
      
      return {
        success: true,
        data: vendorArray,
      };
    } else {
      return {
        success: false,
        error: result.error || '벤더 목록을 불러오는데 실패했습니다.',
      };
    }
  } catch (error) {
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}

// 쿠폰 사용
export async function useCoupon(eventId: string, couponId: string, vendorId?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const body: any = {};
    if (vendorId) {
      body.vendorId = vendorId;
    }

    const result = await apiRequest<any>(`${API_BASE_URL}/coupons/${eventId}/${couponId}/use`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || '쿠폰 사용에 실패했습니다.',
      };
    }
  } catch (error) {
    console.error('쿠폰 사용 오류:', error);
    return {
      success: false,
      error: '쿠폰 사용에 실패했습니다.',
    };
  }
}

export async function getFeaturedEvent(eventId: string): Promise<FeaturedResponse> {
  try {
    // 네트워크 상태 체크 (클라이언트 사이드에서만)
    if (typeof window !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    const result = await apiRequest<any>(`${API_BASE_URL}/featured/${eventId}`, {
      method: 'GET',
    });

    if (result.success && result.data) {
      logger.info('✅ 이벤트 상세 정보 로드 성공', result.data);
      return {
        success: true,
        featured: result.data.data || result.data,
      };
    } else {
      return {
        success: false,
        error: result.error || '이벤트 정보를 가져오는데 실패했습니다.',
      };
    }
  } catch (error) {
    apiDebugger.logError(`${API_BASE_URL}/featured/${eventId}`, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
} 

// 사용자 프로필 정보 가져오기 API (auth/me 사용)
export async function getUserProfile(): Promise<{ success: boolean; data?: UserItem; error?: string }> {
  const url = `${API_BASE_URL}/auth/me`;
  console.log('🔄 getUserProfile 시작:', { url });
  
  try {
    // 리프레시 토큰 확인
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();
    
    console.log('🔑 토큰 상태 확인:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      accessTokenLength: accessToken?.length || 0,
      refreshTokenLength: refreshToken?.length || 0
    });
    
    if (!accessToken) {
      console.error('❌ Access Token이 없습니다.');
      return {
        success: false,
        error: 'AUTH_REQUIRED',
      };
    }
    
    if (!refreshToken) {
      console.error('❌ Refresh Token이 없습니다.');
      return {
        success: false,
        error: 'AUTH_REQUIRED',
      };
    }
    
    console.log('📡 auth/me API 호출 중...');
    const result = await apiRequest<any>(url, {
      method: 'GET',
    });
    
    console.log('📡 auth/me API 응답:', result);

    if (result.success && result.data) {
      const userData = result.data.data || result.data.user || result.data;
      console.log('✅ auth/me 사용자 데이터 추출:', userData);
      logger.info('✅ 사용자 프로필 정보 로드 성공', result.data);
      return {
        success: true,
        data: userData,
      };
    } else {
      console.error('❌ auth/me API 실패:', result.error);
      return {
        success: false,
        error: result.error || '사용자 프로필 정보를 가져오는데 실패했습니다.',
      };
    }
  } catch (error) {
    console.error('💥 auth/me API 호출 중 예외 발생:', error);
    logger.error('사용자 프로필 정보 로드 중 오류:', error);
    return {
      success: false,
      error: '사용자 프로필 정보를 불러오는데 실패했습니다.',
    };
  }
}

// 외치기 관련 API
export const createShout = async (eventId: string, message: string): Promise<CreateShoutResponse> => {
  try {
    const result = await apiRequest<any>(`${API_BASE_URL}/shout/${eventId}`, {
      method: 'POST',
      body: JSON.stringify({
        content: message,
      }),
    });

    if (result.success && result.data) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || '외치기 생성에 실패했습니다.' };
    }
  } catch (error) {
    console.error('외치기 생성 중 오류:', error);
    return { success: false, error: '외치기 생성 중 오류가 발생했습니다.' };
  }
};

export const getShouts = async (eventId: string): Promise<{ success: boolean; data?: ShoutItem[]; error?: string }> => {
  try {
    const result = await apiRequest<ShoutDisplayResponse>(`${API_BASE_URL}/shout/${eventId}/display?limit=5`, {
      method: 'GET',
    });

    if (result.success && result.data) {
      if (result.data.code === 200 && result.data.data) {
        return { success: true, data: result.data.data.messages };
      } else {
        return { success: false, error: result.data.message || '외치기 목록을 불러오는데 실패했습니다.' };
      }
    } else {
      return { success: false, error: result.error || '외치기 목록을 불러오는데 실패했습니다.' };
    }
  } catch (error) {
    console.error('외치기 목록 로드 중 오류:', error);
    return { success: false, error: '외치기 목록을 불러오는데 실패했습니다.' };
  }
};

// 사용자 이벤트 목록 가져오기
export const getUserEvents = async (userId: string, cursor?: string | null, limit: number = 10): Promise<{ success: boolean; data?: EventItem[]; error?: string; hasNext?: boolean; total?: number; nextCursor?: string | null }> => {
  try {
    const url = cursor 
      ? `${API_BASE_URL}/events/user/${userId}?cursor=${cursor}&limit=${limit}`
      : `${API_BASE_URL}/events/user/${userId}?limit=${limit}`;
      
    const result = await apiRequest<any>(url, {
      method: 'GET',
    });

    if (result.success && result.data) {
      logger.info('✅ 사용자 이벤트 목록 로드 성공', result.data);
      
      // API 응답 구조에 맞게 데이터 추출
      const responseData = result.data.data || result.data;
      const eventsData = responseData.items || responseData;
      
      return {
        success: true,
        data: Array.isArray(eventsData) ? eventsData : [],
        hasNext: responseData.pagination?.hasNext || false,
        total: responseData.pagination?.totalCount || 0,
        nextCursor: responseData.pagination?.nextCursor || null,
      };
    } else {
      return {
        success: false,
        error: result.error || '사용자 이벤트 목록을 불러오는데 실패했습니다.',
      };
    }
  } catch (error) {
    const url = cursor 
      ? `${API_BASE_URL}/events/user/${userId}?cursor=${cursor}&limit=${limit}`
      : `${API_BASE_URL}/events/user/${userId}?limit=${limit}`;
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
};

// 사용자 게시글 목록 가져오기
export const getUserPosts = async (userId: string, cursor?: string | null, limit: number = 10): Promise<{ success: boolean; data?: BoardItem[]; error?: string; hasNext?: boolean; total?: number; nextCursor?: string | null }> => {
  try {
    const url = cursor 
      ? `${API_BASE_URL}/board/user/${userId}?cursor=${cursor}&limit=${limit}`
      : `${API_BASE_URL}/board/user/${userId}?limit=${limit}`;
      
    const result = await apiRequest<any>(url, {
      method: 'GET',
    });

    if (result.success && result.data) {
      logger.info('✅ 사용자 게시글 목록 로드 성공', result.data);
      
      // API 응답 구조에 맞게 데이터 추출
      const responseData = result.data.data || result.data;
      const postsData = responseData.items || responseData;
      
      return {
        success: true,
        data: Array.isArray(postsData) ? postsData : [],
        hasNext: responseData.pagination?.hasNext || false,
        total: responseData.pagination?.totalCount || 0,
        nextCursor: responseData.pagination?.nextCursor || null,
      };
    } else {
      return {
        success: false,
        error: result.error || '사용자 게시글 목록을 불러오는데 실패했습니다.',
      };
    }
  } catch (error) {
    const url = cursor 
      ? `${API_BASE_URL}/board/user/${userId}?cursor=${cursor}&limit=${limit}`
      : `${API_BASE_URL}/board/user/${userId}?limit=${limit}`;
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
};

// 사용자 댓글 목록 가져오기
export const getUserComments = async (userId: string, cursor?: string | null, limit: number = 10): Promise<{ success: boolean; data?: CommentItem[]; error?: string; hasNext?: boolean; total?: number; nextCursor?: string | null }> => {
  try {
    const url = cursor 
      ? `${API_BASE_URL}/board/comments/user/${userId}?cursor=${cursor}&limit=${limit}`
      : `${API_BASE_URL}/board/comments/user/${userId}?limit=${limit}`;
      
    const result = await apiRequest<any>(url, {
      method: 'GET',
    });

    if (result.success && result.data) {
      logger.info('✅ 사용자 댓글 목록 로드 성공', result.data);
      
      // API 응답 구조에 맞게 데이터 추출
      const responseData = result.data.data || result.data;
      const commentsData = responseData.items || responseData;
      
      return {
        success: true,
        data: Array.isArray(commentsData) ? commentsData : [],
        hasNext: responseData.pagination?.hasNext || false,
        total: responseData.pagination?.totalCount || 0,
        nextCursor: responseData.pagination?.nextCursor || null,
      };
    } else {
      return {
        success: false,
        error: result.error || '사용자 댓글 목록을 불러오는데 실패했습니다.',
      };
    }
  } catch (error) {
    const url = cursor 
      ? `${API_BASE_URL}/board/comments/user/${userId}?cursor=${cursor}&limit=${limit}`
      : `${API_BASE_URL}/board/comments/user/${userId}?limit=${limit}`;
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}; 

// 벤더 상세 정보 가져오기
export const getVendorDetail = async (eventId: string, vendorId: string): Promise<{ success: boolean; data?: VendorItem; error?: string }> => {
  const url = `${API_BASE_URL}/vendors/${eventId}/${vendorId}`;
  console.log('🔄 getVendorDetail 시작:', { url, eventId, vendorId });
  
  try {
    const result = await apiRequest<any>(url, {
      method: 'GET',
    });

    if (result.success && result.data) {
      console.log('✅ 벤더 상세 정보 로드 성공:', result.data);
      
      // API 응답 구조에 맞게 데이터 추출
      const vendorData = result.data.data || result.data;
      
      return {
        success: true,
        data: vendorData,
      };
    } else {
      console.error('❌ 벤더 상세 정보 로드 실패:', result.error);
      return {
        success: false,
        error: result.error || '벤더 정보를 불러오는데 실패했습니다.',
      };
    }
  } catch (error) {
    console.error('💥 getVendorDetail API 호출 중 예외 발생:', error);
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}; 

// 참여자 목록 가져오기
export const getParticipantsList = async (
  eventId: string, 
  cursor: string | null = null, 
  limit: number = 20
): Promise<{ success: boolean; data?: ParticipantItem[]; hasNext?: boolean; nextCursor?: string | null; error?: string }> => {
  const url = `${API_BASE_URL}/participants/${eventId}${cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`}`;
  console.log('🔄 getParticipantsList 시작:', { url, eventId, cursor, limit });

  try {
    const result = await apiRequest<any>(url, {
      method: 'GET',
    });

    if (result.success && result.data) {
      console.log('✅ 참여자 목록 로드 성공:', result.data);
      // API 응답 구조에 맞게 데이터 추출
      const participantsData = result.data.data || result.data;
      return {
        success: true,
        data: participantsData.items || participantsData,
        hasNext: participantsData.pagination?.hasNext || false,
        nextCursor: participantsData.pagination?.nextCursor || null,
      };
    } else {
      console.error('❌ 참여자 목록 로드 실패:', result.error);
      return {
        success: false,
        error: result.error || '참여자 목록을 불러오는데 실패했습니다.',
      };
    }
  } catch (error) {
    console.error('💥 getParticipantsList API 호출 중 예외 발생:', error);
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}; 

// 댓글의 postId로 게시글 정보 가져오기
export const getPostByCommentId = async (
  commentId: string
): Promise<{ success: boolean; data?: BoardItem; error?: string }> => {
  const url = `${API_BASE_URL}/comments/${commentId}/post`;
  console.log('🔄 getPostByCommentId 시작:', { url, commentId });

  try {
    const result = await apiRequest<any>(url, {
      method: 'GET',
    });

    if (result.success && result.data) {
      console.log('✅ 게시글 정보 로드 성공:', result.data);
      const postData = result.data.data || result.data;
      return {
        success: true,
        data: postData,
      };
    } else {
      console.error('❌ 게시글 정보 로드 실패:', result.error);
      return {
        success: false,
        error: result.error || '게시글 정보를 불러오는데 실패했습니다.',
      };
    }
  } catch (error) {
    console.error('💥 getPostByCommentId API 호출 중 예외 발생:', error);
    apiDebugger.logError(url, error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    };
  }
}; 