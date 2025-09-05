/**
 * API 호출 모니터링 및 디버깅 도구
 */

import { getApiLimitStatus } from './apiProtection';

/**
 * API 호출 상태를 실시간으로 모니터링하는 클래스
 */
export class ApiMonitor {
  private static instance: ApiMonitor;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private callHistory: Array<{
    timestamp: number;
    endpoint: string;
    status: 'success' | 'error' | 'limited';
    responseTime?: number;
  }> = [];

  static getInstance(): ApiMonitor {
    if (!ApiMonitor.instance) {
      ApiMonitor.instance = new ApiMonitor();
    }
    return ApiMonitor.instance;
  }

  /**
   * API 호출 기록
   */
  recordCall(endpoint: string, status: 'success' | 'error' | 'limited', responseTime?: number) {
    this.callHistory.push({
      timestamp: Date.now(),
      endpoint,
      status,
      responseTime
    });

    // 최근 100개 기록만 유지
    if (this.callHistory.length > 100) {
      this.callHistory = this.callHistory.slice(-100);
    }

    // 개발 환경에서만 콘솔 로그
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 API 호출 기록: ${endpoint} - ${status}${responseTime ? ` (${responseTime}ms)` : ''}`);
    }
  }

  /**
   * 모니터링 시작
   */
  startMonitoring(intervalMs: number = 30000) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.logStatus();
    }, intervalMs);

    console.log('🔍 API 모니터링 시작');
  }

  /**
   * 모니터링 중지
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('🔍 API 모니터링 중지');
  }

  /**
   * 현재 상태 로그
   */
  private logStatus() {
    const status = getApiLimitStatus();
    const recentCalls = this.getRecentCalls(60000); // 최근 1분

    console.group('📊 API 모니터링 상태');
    console.log('전체 호출 수:', status.totalCalls);
    console.log('활성 요청 수:', status.activeRequests);
    console.log('최근 1분 호출 수:', recentCalls.length);
    console.log('엔드포인트별 호출 수:', status.endpointCalls);
    console.log('제한 설정:', status.limits);
    console.groupEnd();
  }

  /**
   * 최근 호출 기록 조회
   */
  getRecentCalls(timeWindowMs: number = 300000) { // 기본 5분
    const now = Date.now();
    return this.callHistory.filter(call => now - call.timestamp < timeWindowMs);
  }

  /**
   * 호출 통계 조회
   */
  getStats(timeWindowMs: number = 300000) {
    const recentCalls = this.getRecentCalls(timeWindowMs);
    const stats = {
      total: recentCalls.length,
      success: recentCalls.filter(call => call.status === 'success').length,
      error: recentCalls.filter(call => call.status === 'error').length,
      limited: recentCalls.filter(call => call.status === 'limited').length,
      avgResponseTime: 0,
      endpoints: {} as Record<string, number>
    };

    // 평균 응답 시간 계산
    const callsWithResponseTime = recentCalls.filter(call => call.responseTime);
    if (callsWithResponseTime.length > 0) {
      stats.avgResponseTime = callsWithResponseTime.reduce((sum, call) => sum + (call.responseTime || 0), 0) / callsWithResponseTime.length;
    }

    // 엔드포인트별 호출 수
    recentCalls.forEach(call => {
      stats.endpoints[call.endpoint] = (stats.endpoints[call.endpoint] || 0) + 1;
    });

    return stats;
  }

  /**
   * 개발자 도구용 정보 반환
   */
  getDebugInfo() {
    const status = getApiLimitStatus();
    const stats = this.getStats();
    const recentCalls = this.getRecentCalls(60000);

    return {
      status,
      stats,
      recentCalls: recentCalls.slice(-10), // 최근 10개
      isMonitoring: this.isMonitoring,
      callHistoryLength: this.callHistory.length
    };
  }

  /**
   * 모든 기록 초기화
   */
  clearHistory() {
    this.callHistory = [];
    console.log('🗑️ API 호출 기록 초기화');
  }
}

/**
 * 전역 API 모니터 인스턴스
 */
export const apiMonitor = ApiMonitor.getInstance();

/**
 * 개발 환경에서 전역 객체에 모니터 추가
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).apiMonitor = apiMonitor;
  (window as any).getApiLimitStatus = getApiLimitStatus;
  
  console.log('🔧 개발자 도구: window.apiMonitor, window.getApiLimitStatus 사용 가능');
}

/**
 * API 호출 래퍼 (모니터링 포함)
 */
export async function monitoredApiCall<T>(
  endpoint: string,
  apiFunction: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string; responseTime?: number }> {
  const startTime = Date.now();
  
  try {
    const result = await apiFunction();
    const responseTime = Date.now() - startTime;
    
    apiMonitor.recordCall(endpoint, 'success', responseTime);
    
    return { success: true, data: result, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'API 호출 실패';
    
    apiMonitor.recordCall(endpoint, 'error', responseTime);
    
    return { success: false, error: errorMessage, responseTime };
  }
}
