"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';
import { analyzeApiError, getUserFriendlyErrorMessage } from '@/utils/apiErrorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  isAuthError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isAuthError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // 에러 타입 분석
    const errorAnalysis = analyzeApiError({ error: error.message });
    
    return { 
      hasError: true, 
      error,
      isAuthError: errorAnalysis.isAuthError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('💥 ErrorBoundary에서 에러 발생:', { error, errorInfo });
    
    // 부모 컴포넌트에 에러 알림
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, isAuthError: false });
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private handleGoLogin = () => {
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.pathname + window.location.search;
      window.location.href = `/sign?redirect=${encodeURIComponent(currentUrl)}`;
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error ? 
        getUserFriendlyErrorMessage({ error: this.state.error.message }) : 
        '예상치 못한 오류가 발생했습니다.';

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">
              {this.state.isAuthError ? '🔐' : '⚠️'}
            </div>
            <h1 className="text-2xl font-bold mb-4">
              {this.state.isAuthError ? '인증 오류' : '오류가 발생했습니다'}
            </h1>
            <p className="text-gray-400 mb-6">
              {errorMessage}
            </p>
            <div className="space-y-3">
              {this.state.isAuthError ? (
                <>
                  <button
                    onClick={this.handleGoLogin}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    로그인하기
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    메인으로 가기
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={this.handleRetry}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    다시 시도
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    페이지 새로고침
                  </button>
                </>
              )}
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">오류 상세정보</summary>
                <pre className="mt-2 text-xs text-red-400 bg-gray-900 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 