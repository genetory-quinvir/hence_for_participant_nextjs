import { 
  LoginResponse, 
  SocialLoginResponse, 
  SocialProvider,
  LoginRequest,
  SocialLoginRequest,
  EventCodeResponse,
  FeaturedResponse,
  PostDetailResponse,
  CommentListResponse,
  BoardItem,
  TimelineItem,
  VendorItem
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

// 게시글 상세 정보 가져오기 API
export async function getBoardDetail(eventId: string, boardType: string, postId: string): Promise<PostDetailResponse> {
  const url = `${API_BASE_URL}/board/${eventId}/${boardType}/${postId}`;
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    // 액세스 토큰 가져오기 (옵셔널)
    const accessToken = getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    // 토큰이 있으면 Authorization 헤더 추가
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
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
      console.log('🔍 getBoardDetail 응답:', {
        hasToken: !!accessToken,
        data: responseData.data || responseData,
        isLiked: (responseData.data || responseData)?.isLiked
      });
      logger.info('✅ 게시글 상세 정보 로드 성공', responseData);
      return {
        success: true,
        data: responseData.data || responseData,
      };
    } else if (response.status === 404) {
      logger.warn('⚠️ 게시글을 찾을 수 없음', { eventId, boardType, postId });
      return {
        success: false,
        error: '게시글을 찾을 수 없습니다.',
      };
    } else {
      // 에러 응답 처리
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || '게시글 정보를 가져오는데 실패했습니다.';
        logger.error('❌ 게시글 상세 정보 로드 실패', { status: response.status, error: errorMessage });
        return {
          success: false,
          error: errorMessage,
        };
      } catch (e) {
        logger.error('❌ 에러 응답 파싱 실패', e);
        return {
          success: false,
          error: '게시글 정보를 가져오는데 실패했습니다. 다시 시도해주세요.',
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

// 댓글 목록 가져오기 API
export async function getComments(eventId: string, boardType: string, postId: string): Promise<CommentListResponse> {
  const url = `${API_BASE_URL}/board/${eventId}/${boardType}/${postId}/comments`;
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    // 액세스 토큰 가져오기 (옵셔널)
    const accessToken = getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    // 토큰이 있으면 Authorization 헤더 추가
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
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
      logger.info('✅ 댓글 목록 로드 성공', responseData);
      
      const commentsData = responseData.data?.items || responseData.data || responseData;
      
      // 배열이 아닌 경우 빈 배열로 설정
      const safeCommentsData = Array.isArray(commentsData) ? commentsData : [];
      
      return {
        success: true,
        data: safeCommentsData,
      };
    } else if (response.status === 404) {
      logger.warn('⚠️ 댓글을 찾을 수 없음', { eventId, boardType, postId });
      return {
        success: false,
        error: '댓글을 찾을 수 없습니다.',
      };
    } else {
      // 에러 응답 처리
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || '댓글을 가져오는데 실패했습니다.';
        logger.error('❌ 댓글 목록 로드 실패', { status: response.status, error: errorMessage });
        return {
          success: false,
          error: errorMessage,
        };
      } catch (e) {
        logger.error('❌ 에러 응답 파싱 실패', e);
        return {
          success: false,
          error: '댓글을 가져오는데 실패했습니다. 다시 시도해주세요.',
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

// 좋아요 토글 API
export async function toggleLike(eventId: string, boardType: string, postId: string, isLiked: boolean): Promise<{ success: boolean; error?: string; updatedIsLiked?: boolean; updatedLikeCount?: number }> {
  const url = `${API_BASE_URL}/board/${eventId}/${boardType}/${postId}/like`;
  
  console.log('🔍 좋아요 API 호출:', { 
    url, 
    isLiked, 
    method: isLiked ? 'DELETE' : 'POST',
    action: isLiked ? '좋아요 취소' : '좋아요 추가'
  });
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      console.error('❌ 네트워크 상태 체크 실패');
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    const accessToken = getAccessToken();
    console.log('🔍 토큰 확인:', accessToken ? '토큰 있음' : '토큰 없음');
    if (!accessToken) {
      return {
        success: false,
        error: '로그인이 필요합니다.',
      };
    }

    const method = isLiked ? 'DELETE' : 'POST';
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };
    
    console.log('🔍 요청 정보:', { method, url, headers: { ...headers, Authorization: 'Bearer ***' } });
    
    // 요청 로깅
    apiDebugger.logRequest(method, url, headers, {});

    const response = await fetch(url, {
      method,
      headers,
    });

    const responseText = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());
    
    console.log('🔍 응답 정보:', { 
      status: response.status, 
      statusText: response.statusText,
      responseText,
      headers: responseHeaders
    });
    
    // 응답 로깅
    apiDebugger.logResponse(response.status, url, responseHeaders, responseText);

    if (response.status === 200 || response.status === 204) {
      console.log('✅ 좋아요 토글 성공');
      logger.info('✅ 좋아요 토글 성공', { isLiked: !isLiked });
      
      // 응답에 업데이트된 상태가 포함되어 있는지 확인
      let updatedIsLiked = !isLiked;
      let updatedLikeCount = null;
      
      if (responseText) {
        try {
          const responseData = JSON.parse(responseText);
          console.log('🔍 좋아요 API 응답 데이터:', responseData);
          
          // 서버에서 업데이트된 상태를 반환하는 경우
          if (responseData.data) {
            updatedIsLiked = responseData.data.isLiked ?? updatedIsLiked;
            updatedLikeCount = responseData.data.likeCount;
          }
        } catch (e) {
          console.log('🔍 응답 파싱 실패, 기본값 사용');
        }
      }
      
      return {
        success: true,
        updatedIsLiked,
        updatedLikeCount
      };
    } else if (response.status === 401) {
      console.error('❌ 좋아요 토글 실패 - 인증 오류:', response.status);
      logger.error('❌ 좋아요 토글 실패 - 인증 오류', { status: response.status });
      return {
        success: false,
        error: '로그인이 만료되었습니다. 다시 로그인해주세요.',
      };
    } else {
      console.error('❌ 좋아요 토글 실패 - 기타 오류:', response.status, responseText);
      // 에러 응답 처리
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || '좋아요 처리에 실패했습니다.';
        logger.error('❌ 좋아요 토글 실패', { status: response.status, error: errorMessage });
        return {
          success: false,
          error: errorMessage,
        };
      } catch (e) {
        logger.error('❌ 에러 응답 파싱 실패', e);
        return {
          success: false,
          error: '좋아요 처리에 실패했습니다. 다시 시도해주세요.',
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

// 댓글 작성 API
export async function getTimelineList(eventId: string, page: number = 1, limit: number = 10): Promise<{ success: boolean; error?: string; data?: { items: TimelineItem[]; hasNext: boolean; total: number } }> {
  const url = `${API_BASE_URL}/timelines/${eventId}?page=${page}&limit=${limit}`;
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    // 액세스 토큰 가져오기
    const accessToken = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // 요청 로깅
    apiDebugger.logRequest('GET', url, headers);

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
      logger.info('✅ 타임라인 목록 조회 성공', responseData);
      return {
        success: true,
        data: {
          items: responseData.data?.items || responseData.items || [],
          hasNext: responseData.data?.hasNext || responseData.hasNext || false,
          total: responseData.data?.total || responseData.total || 0
        }
      };
    } else if (response.status === 401) {
      // 인증 오류
      logger.error('❌ 인증 오류 (401)', { status: response.status });
      return {
        success: false,
        error: '인증이 필요합니다. 다시 로그인해주세요.',
      };
    } else {
      // 기타 에러 응답 처리
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || '타임라인 목록을 불러오는데 실패했습니다.';
        logger.error('❌ 타임라인 목록 조회 실패', { status: response.status, error: errorMessage });
        return {
          success: false,
          error: errorMessage,
        };
      } catch (e) {
        logger.error('❌ 에러 응답 파싱 실패', e);
        return {
          success: false,
          error: '타임라인 목록을 불러오는데 실패했습니다. 다시 시도해주세요.',
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

export async function getBoardList(eventId: string, boardType: string, page: number = 1, limit: number = 10): Promise<{ success: boolean; error?: string; data?: { items: BoardItem[]; hasNext: boolean; total: number } }> {
  const url = `${API_BASE_URL}/board/${eventId}/${boardType}?page=${page}&limit=${limit}`;
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    // 액세스 토큰 가져오기
    const accessToken = getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // 요청 로깅
    apiDebugger.logRequest('GET', url, headers);

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
      logger.info('✅ 게시글 목록 조회 성공', responseData);
      return {
        success: true,
        data: {
          items: responseData.data?.items || responseData.items || [],
          hasNext: responseData.data?.hasNext || responseData.hasNext || false,
          total: responseData.data?.total || responseData.total || 0
        }
      };
    } else if (response.status === 401) {
      // 인증 오류
      logger.error('❌ 인증 오류 (401)', { status: response.status });
      return {
        success: false,
        error: '인증이 필요합니다. 다시 로그인해주세요.',
      };
    } else {
      // 기타 에러 응답 처리
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || '게시글 목록을 불러오는데 실패했습니다.';
        logger.error('❌ 게시글 목록 조회 실패', { status: response.status, error: errorMessage });
        return {
          success: false,
          error: errorMessage,
        };
      } catch (e) {
        logger.error('❌ 에러 응답 파싱 실패', e);
        return {
          success: false,
          error: '게시글 목록을 불러오는데 실패했습니다. 다시 시도해주세요.',
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

export async function createPost(eventId: string, boardType: string, title: string | null, content: string, images: File[]): Promise<{ success: boolean; error?: string; data?: any }> {
  const url = `${API_BASE_URL}/board/${eventId}/${boardType}`;
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

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

    // 액세스 토큰 가져오기
    const accessToken = getAccessToken();
    const headers: Record<string, string> = {};
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // 요청 로깅
    apiDebugger.logRequest('POST', url, headers, { title, content, imageCount: images.length });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const responseText = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());
    
    // 응답 로깅
    apiDebugger.logResponse(response.status, url, responseHeaders, responseText);

    if (response.status === 201 || response.status === 200) {
      const responseData = JSON.parse(responseText);
      logger.info('✅ 게시글 작성 성공', responseData);
      return {
        success: true,
        data: responseData.data || responseData,
      };
    } else if (response.status === 401) {
      // 인증 오류
      logger.error('❌ 인증 오류 (401)', { status: response.status });
      return {
        success: false,
        error: '인증이 필요합니다. 다시 로그인해주세요.',
      };
    } else if (response.status === 403) {
      // 권한 오류
      logger.error('❌ 권한 오류 (403)', { status: response.status });
      return {
        success: false,
        error: '권한이 없습니다. 다시 로그인해주세요.',
      };
    } else {
      // 기타 에러 응답 처리
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || '게시글 작성에 실패했습니다.';
        logger.error('❌ 게시글 작성 실패', { status: response.status, error: errorMessage });
        return {
          success: false,
          error: errorMessage,
        };
      } catch (e) {
        logger.error('❌ 에러 응답 파싱 실패', e);
        return {
          success: false,
          error: '게시글 작성에 실패했습니다. 다시 시도해주세요.',
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

export async function createComment(eventId: string, boardType: string, postId: string, content: string): Promise<CommentListResponse> {
  const url = `${API_BASE_URL}/board/${eventId}/${boardType}/${postId}/comments`;
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    const accessToken = getAccessToken();
    console.log('🔍 댓글 작성 - 토큰 확인:', accessToken ? '토큰 있음' : '토큰 없음');
    if (!accessToken) {
      return {
        success: false,
        error: '로그인이 필요합니다.',
      };
    }

    const requestBody = { content };
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };
    
    // 요청 로깅
    apiDebugger.logRequest('POST', url, headers, requestBody);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());
    
    // 응답 로깅
    apiDebugger.logResponse(response.status, url, responseHeaders, responseText);

    if (response.status === 201 || response.status === 200) {
      const responseData = JSON.parse(responseText);
      logger.info('✅ 댓글 작성 성공', responseData);
      
      return {
        success: true,
        data: responseData.data || responseData,
      };
    } else if (response.status === 401) {
      logger.error('❌ 댓글 작성 실패 - 인증 오류', { status: response.status });
      return {
        success: false,
        error: '로그인이 만료되었습니다. 다시 로그인해주세요.',
      };
    } else {
      // 에러 응답 처리
      try {
        const errorData = JSON.parse(responseText);
        const errorMessage = errorData.message || '댓글 작성에 실패했습니다.';
        logger.error('❌ 댓글 작성 실패', { status: response.status, error: errorMessage });
        return {
          success: false,
          error: errorMessage,
        };
      } catch (e) {
        logger.error('❌ 에러 응답 파싱 실패', e);
        return {
          success: false,
          error: '댓글 작성에 실패했습니다. 다시 시도해주세요.',
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
// 래플 참여 API
export async function participateRaffle(eventId: string, raffleId: string, data: {
  userId: string;
  realName: string;
  phoneNumber: string;
  privacyAgreement: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      error: '인증 토큰이 없습니다.',
    };
  }

  const url = `${API_BASE_URL}/raffles/${eventId}/${raffleId}/participate`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();
    
    if (response.status === 200 || response.status === 201) {
      return {
        success: true,
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: '인증이 만료되었습니다. 다시 로그인해주세요.',
      };
    } else {
      try {
        const errorData = JSON.parse(responseText);
        return {
          success: false,
          error: errorData.message || '래플 응모에 실패했습니다.',
        };
      } catch (e) {
        return {
          success: false,
          error: '래플 응모에 실패했습니다.',
        };
      }
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
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    return {
      success: false,
      error: '인증 토큰이 없습니다.',
    };
  }

  const url = `${API_BASE_URL}/raffles/${eventId}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    
    if (response.status === 200) {
      const responseData = JSON.parse(responseText);
      console.log('서버 응답 데이터:', responseData);
      
      // 응답 구조에 따라 isParticipated 추출
      let isParticipated = false;
      let raffleData = null;
      
      if (responseData.data && responseData.data.items && responseData.data.items.length > 0) {
        // 배열 형태로 오는 경우 (첫 번째 아이템 사용)
        raffleData = responseData.data.items[0];
        isParticipated = raffleData.isParticipated || false;
      } else if (responseData.isParticipated !== undefined) {
        // 단일 객체로 오는 경우
        raffleData = responseData;
        isParticipated = responseData.isParticipated;
      }
      
      console.log('추출된 isParticipated 값:', isParticipated);
      console.log('추출된 래플 데이터:', raffleData);
      
      return {
        success: true,
        isParticipated: isParticipated,
        raffle: raffleData,
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: '인증이 만료되었습니다. 다시 로그인해주세요.',
      };
    } else {
      try {
        const errorData = JSON.parse(responseText);
        return {
          success: false,
          error: errorData.message || '래플 정보를 가져오는데 실패했습니다.',
        };
      } catch (e) {
        return {
          success: false,
          error: '래플 정보를 가져오는데 실패했습니다.',
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.',
    };
  }
}

// 쿠폰 사용 가능한 벤더 목록 조회
export async function getCouponVendors(eventId: string, couponId: string): Promise<{ success: boolean; error?: string; data?: VendorItem[] }> {
  const url = `${API_BASE_URL}/events/${eventId}/coupons/${couponId}/vendors`;
  
  try {
    const accessToken = getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (response.status === 200) {
      const data = await response.json();
      return {
        success: true,
        data: data.data || data.vendors || [],
      };
    } else if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: 'AUTH_REQUIRED',
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || '벤더 목록을 불러오는데 실패했습니다.',
      };
    }
  } catch (error) {
    console.error('벤더 목록 조회 오류:', error);
    return {
      success: false,
      error: '벤더 목록을 불러오는데 실패했습니다.',
    };
  }
}

// 쿠폰 사용
export async function useCoupon(eventId: string, couponId: string, vendorId?: string): Promise<{ success: boolean; error?: string }> {
  const url = `${API_BASE_URL}/events/${eventId}/coupons/${couponId}/use`;
  
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: 'AUTH_REQUIRED',
      };
    }

    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };

    const body: any = {};
    if (vendorId) {
      body.vendorId = vendorId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.status === 200) {
      return { success: true };
    } else if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: 'AUTH_REQUIRED',
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || '쿠폰 사용에 실패했습니다.',
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
  const url = `${API_BASE_URL}/featured/${eventId}`;
  const accessToken = getAccessToken();
  
  try {
    // 네트워크 상태 체크
    if (!apiDebugger.checkNetworkStatus()) {
      return {
        success: false,
        error: '네트워크 연결을 확인해주세요.',
      };
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    
    // Access token이 있으면 헤더에 추가
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
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
    } else if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        error: '인증이 만료되었습니다. 다시 로그인해주세요.',
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