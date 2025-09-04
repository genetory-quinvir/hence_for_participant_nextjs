"use client";

import { useEffect } from 'react';
import { setupGlobalErrorHandling } from '@/utils/globalErrorHandler';

export function GlobalErrorHandler() {
  useEffect(() => {
    // 전역 에러 처리 설정
    setupGlobalErrorHandling();
  }, []);

  return null; // UI 없음
}
