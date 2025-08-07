// API 테스트 유틸리티
import { logger } from './logger';

// API 응답 모킹 함수
export function mockApiResponse<T>(data: T, delay: number = 1000): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      logger.info('🔧 Mock API 응답 생성', data);
      resolve(data);
    }, delay);
  });
}

// API 에러 모킹 함수
export function mockApiError(message: string, delay: number = 1000): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message);
      logger.error('🔧 Mock API 에러 생성', error);
      reject(error);
    }, delay);
  });
}

// 네트워크 상태 시뮬레이션
export function simulateNetworkError(): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error('Network Error');
      logger.error('🌐 네트워크 에러 시뮬레이션', error);
      reject(error);
    }, 500);
  });
}

// API 응답 지연 시뮬레이션
export function simulateSlowNetwork<T>(data: T, delay: number = 5000): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      logger.warn('🐌 느린 네트워크 시뮬레이션', { delay });
      resolve(data);
    }, delay);
  });
}

// 테스트 데이터 생성기
export const testDataGenerator = {
  // 사용자 데이터 생성
  createUser: (id: string = '1') => ({
    id,
    email: `user${id}@example.com`,
    nickname: `사용자${id}`,
    profileImageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),

  // 이벤트 데이터 생성
  createEvent: (id: string = '1') => ({
    id,
    title: `테스트 이벤트 ${id}`,
    description: `이것은 테스트 이벤트 ${id}입니다.`,
    imageUrl: `https://picsum.photos/400/300?random=${id}`,
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    location: '서울특별시 강남구',
    participantCount: Math.floor(Math.random() * 100) + 10,
    maxParticipantCount: 200,
    status: 'ACTIVE',
    eventCode: `EVENT${id.padStart(3, '0')}`,
  }),

  // 참가자 데이터 생성
  createParticipants: (count: number = 5) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `participant-${index + 1}`,
      eventId: '1',
      user: {
        id: `user-${index + 1}`,
        email: `user${index + 1}@example.com`,
        nickname: `참가자${index + 1}`,
        profileImageUrl: null,
      },
      status: 'ACTIVE',
      joinedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  },

  // 타임라인 데이터 생성
  createTimelines: (count: number = 3) => {
    const statuses = ['COMPLETED', 'ACTIVE', 'PENDING'];
    return Array.from({ length: count }, (_, index) => ({
      id: `timeline-${index + 1}`,
      eventId: '1',
      time: `${10 + index}:00`,
      title: `타임라인 ${index + 1}`,
      description: `타임라인 ${index + 1}에 대한 설명입니다.`,
      location: `장소 ${index + 1}`,
      status: statuses[index % statuses.length],
    }));
  },

  // 공지사항 데이터 생성
  createNotices: (count: number = 3) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `notice-${index + 1}`,
      eventId: '1',
      title: `공지사항 ${index + 1}`,
      content: `공지사항 ${index + 1}의 내용입니다.`,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  },

  // 커뮤니티 데이터 생성
  createCommunityPosts: (count: number = 5) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `post-${index + 1}`,
      eventId: '1',
      type: 'FREE',
      user: {
        id: `user-${index + 1}`,
        nickname: `작성자${index + 1}`,
        profileImageUrl: null,
      },
      content: `커뮤니티 게시글 ${index + 1}의 내용입니다.`,
      images: Math.random() > 0.5 ? [`https://picsum.photos/400/300?random=${index + 100}`] : [],
      likeCount: Math.floor(Math.random() * 50),
      commentCount: Math.floor(Math.random() * 20),
      isLiked: Math.random() > 0.7,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  },
};

// API 테스트 헬퍼
export const apiTestHelper = {
  // 로그인 테스트
  testLogin: async (email: string, password: string) => {
    logger.info('🧪 로그인 테스트 시작', { email });
    
    try {
      // 실제 API 호출 대신 모킹
      const response = await mockApiResponse({
        success: true,
        data: testDataGenerator.createUser('1'),
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      });
      
      logger.info('✅ 로그인 테스트 성공', response);
      return response;
    } catch (error) {
      logger.error('❌ 로그인 테스트 실패', error);
      throw error;
    }
  },

  // 이벤트 데이터 테스트
  testEventData: async (eventId: string) => {
    logger.info('🧪 이벤트 데이터 테스트 시작', { eventId });
    
    try {
      const response = await mockApiResponse({
        success: true,
        featured: {
          event: testDataGenerator.createEvent(eventId),
          participants: testDataGenerator.createParticipants(5),
          timelines: testDataGenerator.createTimelines(3),
          notices: testDataGenerator.createNotices(3),
          freeBoard: testDataGenerator.createCommunityPosts(5),
          lastUpdated: new Date().toISOString(),
        },
      });
      
      logger.info('✅ 이벤트 데이터 테스트 성공', response);
      return response;
    } catch (error) {
      logger.error('❌ 이벤트 데이터 테스트 실패', error);
      throw error;
    }
  },

  // 네트워크 에러 테스트
  testNetworkError: async () => {
    logger.info('🧪 네트워크 에러 테스트 시작');
    
    try {
      await simulateNetworkError();
    } catch (error) {
      logger.info('✅ 네트워크 에러 테스트 성공 (예상된 에러)', error);
      throw error;
    }
  },
}; 