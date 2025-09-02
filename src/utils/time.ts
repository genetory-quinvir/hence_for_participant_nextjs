// 한국 시간대 상수 (UTC+9)
const KOREA_TIMEZONE_OFFSET = 9 * 60 * 60 * 1000; // 9시간을 밀리초로

/**
 * 시간 표시 함수 - mm. dd a hh:mm 형식 (한국 시간 기준)
 * 프로젝트 전체에서 공통으로 사용
 */
export const getFormattedTime = (dateString: string): string => {
  try {
    // 개발 환경에서만 디버깅 로그 출력
    // if (process.env.NODE_ENV === 'development') {
      // console.log('🕐 getFormattedTime 입력값:', dateString);
    // }
    
    // 서버에서 오는 UTC 시간을 한국 시간으로 변환
    const serverDate = new Date(dateString);
    
    // 개발 환경에서만 상세 로그 출력
    // if (process.env.NODE_ENV === 'development') {
      // console.log('🕐 서버 UTC 시간:', serverDate.toISOString());
    // }

    // 한국 시간대 (UTC+9) 적용
    const koreaTime = convertToKoreaTime(serverDate, dateString);
    
    // if (process.env.NODE_ENV === 'development') {
      // console.log('🕐 한국 시간 변환:', koreaTime.toISOString());
    // }

    // mm. dd a hh:mm 형식으로 반환 (한국 시간 기준)
    return koreaTime.toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Seoul'
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
    
    // 한국 시간대 (UTC+9) 적용
    const koreaTime = convertToKoreaTime(date, dateString);
    
    return koreaTime.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul'
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
    
    // 한국 시간대 (UTC+9) 적용
    const koreaTime = convertToKoreaTime(date, dateString);
    
    return koreaTime.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul'
    });
  } catch (error) {
    console.error('시간 변환 오류:', error);
    return '시간 정보 없음';
  }
};

/**
 * 서버에서 오는 시간을 한국 시간으로 변환하는 헬퍼 함수
 * 서버 시간 형식에 따라 자동으로 UTC 변환 여부 결정
 */
const convertToKoreaTime = (date: Date, originalString: string): Date => {
  if (process.env.NODE_ENV === 'development') {
    // console.log('🕐 원본 서버 시간 문자열:', originalString);
    // console.log('🕐 파싱된 Date 객체:', date.toISOString());
    // console.log('🕐 로컬 시간:', date.toString());
  }
  
  // 서버 시간 형식 분석
  const isUTC = originalString.includes('Z') || originalString.includes('+00:00');
  const hasTimezone = originalString.includes('+') || originalString.includes('-');
  
  if (process.env.NODE_ENV === 'development') {
    // console.log('🕐 UTC 여부:', isUTC);
    // console.log('🕐 타임존 정보 포함:', hasTimezone);
  }
  
  // UTC 시간이거나 타임존 정보가 없는 경우에만 변환
  if (isUTC || !hasTimezone) {
    // 서버에서 오는 시간을 한국 시간(UTC+9)으로 변환
    const koreaTime = new Date(date.getTime() + KOREA_TIMEZONE_OFFSET);
    
    if (process.env.NODE_ENV === 'development') {
      // console.log('🕐 UTC로 인식하여 한국 시간으로 변환:', koreaTime.toISOString());
    }
    
    return koreaTime;
  } else {
    // 이미 한국 시간이거나 타임존이 명시된 경우 그대로 사용
    if (process.env.NODE_ENV === 'development') {
      // console.log('🕐 이미 한국 시간이므로 변환하지 않음');
    }
    
    return date;
  }
};

/**
 * 서버 UTC 시간을 한국 시간으로 변환하는 함수 (디버깅용)
 * 개발 환경에서만 사용하여 시간 변환 과정 확인
 */
export const debugTimeConversion = (dateString: string): {
  original: string;
  utc: string;
  korea: string;
  local: string;
} => {
  try {
    const serverDate = new Date(dateString);
    const koreaTime = convertToKoreaTime(serverDate, dateString);
    
    return {
      original: dateString,
      utc: serverDate.toISOString(),
      korea: koreaTime.toISOString(),
      local: koreaTime.toString()
    };
  } catch (error) {
    return {
      original: dateString,
      utc: '변환 실패',
      korea: '변환 실패',
      local: '변환 실패'
    };
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
  
  // 개발 환경에서 시간 변환 테스트
  console.log('🕐 시간 변환 테스트:');
  const testTime = '2024-01-15T05:30:00Z'; // UTC 5:30 AM
  console.log('🕐 테스트 UTC 시간:', testTime);
  console.log('🕐 변환된 한국 시간:', getFormattedTime(testTime)); // 예상: 01. 15 오후 2:30
}
