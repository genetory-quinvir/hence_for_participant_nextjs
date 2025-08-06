import { apiDebugger, logger } from './logger';

// API 서버 테스트 도구
export const apiTester = {
  // 서버 연결 상태 확인
  async checkServerHealth(baseUrl: string = 'http://127.0.0.1:8000') {
    const endpoints = [
      '/',
      '/health',
      '/api',
      '/api/v1',
      '/api/v1/health',
      '/docs', // FastAPI 문서
      '/openapi.json', // OpenAPI 스펙
    ];

    logger.info('🔍 서버 엔드포인트 탐색 시작:', baseUrl);

    for (const endpoint of endpoints) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        logger.info(`✅ ${response.status} ${url}`);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            try {
              const data = await response.json();
              logger.debug(`📄 ${url} 응답:`, data);
            } catch (e) {
              const text = await response.text();
              logger.debug(`📄 ${url} 응답 (텍스트):`, text.substring(0, 200));
            }
          }
        }
      } catch (error) {
        logger.warn(`❌ ${baseUrl}${endpoint} - ${error}`);
      }
    }
  },

  // 인증 관련 엔드포인트 확인
  async checkAuthEndpoints(baseUrl: string = 'http://127.0.0.1:8000') {
    const authEndpoints = [
      '/api/v1/auth',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/token',
      '/api/v1/users/login',
      '/api/v1/user/login',
      '/auth/login',
      '/login',
    ];

    logger.info('🔍 인증 엔드포인트 확인 시작');

    for (const endpoint of authEndpoints) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const response = await fetch(url, { 
          method: 'OPTIONS', // CORS preflight 확인
          headers: { 
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
          }
        });
        
        logger.info(`OPTIONS ${response.status} ${url}`);
        
        // POST 요청도 테스트 (빈 body로)
        try {
          const postResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          
          logger.info(`POST ${postResponse.status} ${url}`);
          
          if (postResponse.status !== 404) {
            const responseText = await postResponse.text();
            logger.debug(`📄 POST ${url} 응답:`, responseText.substring(0, 200));
          }
        } catch (postError) {
          logger.debug(`POST ${url} 에러:`, postError);
        }
        
      } catch (error) {
        logger.warn(`❌ ${baseUrl}${endpoint} - ${error}`);
      }
    }
  },

  // 서버 API 문서 확인
  async checkApiDocs(baseUrl: string = 'http://127.0.0.1:8000') {
    const docEndpoints = [
      '/docs',
      '/redoc',
      '/openapi.json',
      '/swagger.json',
      '/api/v1/docs',
      '/api/docs',
    ];

    logger.info('📚 API 문서 엔드포인트 확인');

    for (const endpoint of docEndpoints) {
      try {
        const url = `${baseUrl}${endpoint}`;
        const response = await fetch(url);
        
        if (response.ok) {
          logger.info(`✅ API 문서 발견: ${url}`);
          logger.info(`🌐 브라우저에서 확인: ${url}`);
          
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const data = await response.json();
            if (data.paths) {
              logger.info('📋 사용 가능한 API 경로들:');
              Object.keys(data.paths).forEach(path => {
                const methods = Object.keys(data.paths[path]);
                logger.info(`  ${methods.join(', ').toUpperCase()} ${path}`);
              });
            }
          }
        }
      } catch (error) {
        logger.debug(`${baseUrl}${endpoint} - ${error}`);
      }
    }
  },

  // 전체 진단 실행
  async runFullDiagnosis(baseUrl: string = 'http://127.0.0.1:8000') {
    logger.info('🚀 API 서버 전체 진단 시작');
    logger.info('='.repeat(50));
    
    await this.checkServerHealth(baseUrl);
    logger.info('-'.repeat(30));
    
    await this.checkAuthEndpoints(baseUrl);
    logger.info('-'.repeat(30));
    
    await this.checkApiDocs(baseUrl);
    logger.info('='.repeat(50));
    logger.info('✅ 진단 완료');
  }
};

// 브라우저 콘솔에서 사용할 수 있도록 전역 등록
if (typeof window !== 'undefined') {
  (window as any).apiTester = apiTester;
} 