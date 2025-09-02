/**
 * 개발 환경에서만 사용하는 시간 디버깅 유틸리티
 * 프로덕션에서는 import되지 않음
 */

import { getFormattedTime, getAbsoluteTime, getDateOnly } from './time';

/**
 * 시간 함수들을 테스트하는 함수
 * 개발 환경에서만 사용
 */
export const debugTimeFunctions = (dateString: string) => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('debugTimeFunctions는 개발 환경에서만 사용 가능합니다.');
    return;
  }

  console.group('🕐 시간 함수 디버깅');
  console.log('입력값:', dateString);
  
  try {
    const formattedTime = getFormattedTime(dateString);
    const absoluteTime = getAbsoluteTime(dateString);
    const dateOnly = getDateOnly(dateString);
    
    console.log('포맷된 시간:', formattedTime);
    console.log('절대 시간:', absoluteTime);
    console.log('날짜만:', dateOnly);
    
    // 원본 Date 객체 분석
    const date = new Date(dateString);
    console.log('Date 객체:', date);
    console.log('ISO 문자열:', date.toISOString());
    console.log('로컬 문자열:', date.toString());
    console.log('타임스탬프:', date.getTime());
    
    // 현재 시간과 비교
    const now = new Date();
    console.log('현재 시간:', now.toISOString());
    console.log('시간 차이 (ms):', now.getTime() - date.getTime());
    
  } catch (error) {
    console.error('시간 변환 오류:', error);
  }
  
  console.groupEnd();
};

/**
 * 브라우저 콘솔에서 직접 사용할 수 있는 전역 함수
 * 개발 환경에서만 등록
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).debugTime = debugTimeFunctions;
  console.log('🕐 시간 디버깅 함수가 등록되었습니다. debugTime(dateString) 사용 가능');
}
