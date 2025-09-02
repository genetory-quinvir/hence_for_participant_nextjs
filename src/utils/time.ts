/**
 * 시간 표시 함수 - mm. dd a hh:mm 형식
 * 프로젝트 전체에서 공통으로 사용
 */
export const getFormattedTime = (dateString: string): string => {
  try {
    // 개발 환경에서만 디버깅 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('🕐 getFormattedTime 입력값:', dateString);
    }
    
    // 서버에서 오는 시간을 Date 객체로 변환
    const serverDate = new Date(dateString);
    
    // 개발 환경에서만 상세 로그 출력
    if (process.env.NODE_ENV === 'development') {
      console.log('🕐 서버 시간:', serverDate.toISOString());
    }

    // mm. dd a hh:mm 형식으로 반환
    return serverDate.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(/\. /g, '. ').replace(/\.$/, '');
    
  } catch (error) {
    console.error('시간 변환 오류:', error);
    return '시간 정보 없음';
  }
};

/**
 * 절대 시간 표시 함수 - 한국 시간 기준
 * 프로젝트 전체에서 공통으로 사용
 */
export const getAbsoluteTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('시간 변환 오류:', error);
    return '시간 정보 없음';
  }
};

/**
 * 날짜만 표시하는 함수 - 한국 시간 기준
 * 프로젝트 전체에서 공통으로 사용
 */
export const getDateOnly = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('시간 변환 오류:', error);
    return '시간 정보 없음';
  }
};

/**
 * 하위 호환성을 위한 별칭
 * @deprecated getFormattedTime 사용을 권장
 */
export const getRelativeTime = getFormattedTime;

// 개발 환경에서만 디버깅 유틸리티 import
if (process.env.NODE_ENV === 'development') {
  import('./time-debug');
}
