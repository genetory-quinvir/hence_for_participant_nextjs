// 로그 레벨 정의
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// 로거 클래스
class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, data?: unknown): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}]`;
    
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.formatMessage('DEBUG', message, data);
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.formatMessage('INFO', message, data);
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.formatMessage('WARN', message, data);
    }
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.formatMessage('ERROR', message, data);
    }
  }

  // API 요청 로깅
  apiRequest(method: string, url: string, data?: unknown): void {
    this.debug(`🔍 API 요청: ${method.toUpperCase()} ${url}`, data);
  }

  // API 응답 로깅
  apiResponse(status: number, url: string, data?: unknown): void {
    if (status >= 200 && status < 300) {
      this.debug(`✅ API 성공: ${status} ${url}`, data);
    } else if (status >= 400) {
      this.error(`❌ API 에러: ${status} ${url}`, data);
    }
  }

  // API 예외 로깅
  apiException(url: string, error: unknown): void {
    this.error(`💥 API 예외: ${url}`, error);
  }
}

// 싱글톤 로거 인스턴스
export const logger = new Logger();

// API 디버깅 헬퍼
export const apiDebugger = {
  logRequest: (method: string, url: string, headers?: unknown, body?: unknown) => {
    logger.debug(`📤 요청 시작: ${method.toUpperCase()} ${url}`);
    if (headers) logger.debug('📤 요청 헤더:', headers);
    if (body) logger.debug('📤 요청 본문:', body);
  },

  logResponse: (status: number, url: string, headers?: unknown, body?: unknown) => {
    logger.debug(`📥 응답 수신: ${status} ${url}`);
    if (headers) logger.debug('📥 응답 헤더:', headers);
    if (body) logger.debug('📥 응답 본문:', body);
  },

  logError: (url: string, error: unknown) => {
    logger.error(`💥 요청 실패: ${url}`, error);
  },

  checkNetworkStatus: (): boolean => {
    return typeof window !== 'undefined' && navigator.onLine;
  },
}; 