// 기본 API 응답 타입
export interface BaseApiResponse {
  success: boolean;
  message?: string;
}

// 사용자 정보 타입
export interface User {
  id: string;
  email: string;
  nickname?: string;
  phone?: string;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
  [key: string]: unknown;
}

// 토큰 정보 타입
export interface TokenInfo {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
}

// 로그인 응답 타입
export interface LoginResponse extends BaseApiResponse {
  data?: User;
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

// 회원가입 응답 타입
export interface SignUpResponse extends BaseApiResponse {
  data?: User;
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

// 소셜 로그인 응답 타입
export interface SocialLoginResponse extends BaseApiResponse {
  data?: User;
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

// 토큰 갱신 응답 타입
export interface RefreshTokenResponse extends BaseApiResponse {
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

// 사용자 프로필 응답 타입
export interface UserProfileResponse extends BaseApiResponse {
  data?: User;
  error?: string;
}

// 비밀번호 재설정 응답 타입
export interface ResetPasswordResponse extends BaseApiResponse {
  error?: string;
}

// API 에러 타입
export interface ApiError {
  success: false;
  error: string;
  message?: string;
  code?: string | number;
  details?: unknown;
}

// 페이지네이션 타입
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 목록 응답 타입 (제네릭)
export interface ListResponse<T> extends BaseApiResponse {
  data?: T[];
  pagination?: PaginationInfo;
  error?: string;
}

// 상세 응답 타입 (제네릭)
export interface DetailResponse<T> extends BaseApiResponse {
  data?: T;
  error?: string;
}

// 소셜 로그인 제공자 타입
export type SocialProvider = 'kakao' | 'naver' | 'google';

// 로그인 요청 타입
export interface LoginRequest {
  email: string;
  password: string;
}

// 회원가입 요청 타입
export interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing?: boolean;
}

// 소셜 로그인 요청 타입
export interface SocialLoginRequest {
  provider: SocialProvider;
  token: string;
  email?: string;
  name?: string;
}

// 비밀번호 재설정 요청 타입
export interface ResetPasswordRequest {
  email: string;
}

// 비밀번호 변경 요청 타입
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// 연락처 정보 타입
export interface ContactInfo {
  id?: string;
  eventId?: string;
  phone?: string;
  email?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

// FAQ 아이템 타입
export interface FaqItem {
  id?: string;
  eventId?: string;
  question?: string;
  answer?: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 긴급 정보 타입
export interface EmergencyInfo {
  id?: string;
  eventId?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 이벤트 아이템 타입
export interface EventItem {
  id?: string;
  title?: string;
  imageUrl?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  longitude?: number;
  latitude?: number;
  participantCount?: number;
  maxParticipantCount?: number;
  status?: string;
  eventCode?: string;
  createdAt?: string;
  updatedAt?: string;
  expiredAt?: string;
  host?: User;
  contact?: ContactInfo;
  faqs?: FaqItem[];
  emergencyInfo?: EmergencyInfo;
}

// 이벤트 코드 확인 응답 타입
export interface EventCodeResponse {
  success: boolean;
  event?: EventItem;
  error?: string;
}

// 래플 아이템 타입
export interface RaffleItem {
  id?: string;
  eventId?: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 쿠폰 아이템 타입
export interface CouponItem {
  id?: string;
  eventId?: string;
  title?: string;
  description?: string;
  discountType?: string;
  discountValue?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 참가자 아이템 타입
export interface ParticipantItem {
  id?: string;
  eventId?: string;
  user?: User;
  status?: string;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 타임라인 아이템 타입
export interface TimelineItem {
  id?: string;
  eventId?: string;
  time?: string;
  title?: string;
  description?: string;
  location?: string;
  status?: string;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 벤더 아이템 타입
export interface VendorItem {
  id?: string;
  eventId?: string;
  name?: string;
  description?: string;
  logoUrl?: string;
  imageUrl?: string;
  website?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 광고 아이템 타입
export interface AdItem {
  id?: string;
  eventId?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 공지사항 타입
export interface NoticeItem {
  id?: string;
  eventId?: string;
  title?: string;
  content?: string;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 자유게시판 타입
export interface FreeBoardItem {
  id: string;
  eventId: string;
  type: string;
  title?: string | null;
  user?: {
    id: string;
    nickname: string;
    profileImageUrl?: string | null;
  };
  images?: string[];
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

// FeaturedItem 타입 (이벤트 종합 정보)
export interface FeaturedItem {
  event: EventItem;
  raffle?: RaffleItem;
  coupons: CouponItem[];
  participants: ParticipantItem[];
  timelines: TimelineItem[];
  vendors: VendorItem[];
  notices: NoticeItem[];
  lastUpdated: string;
  contact?: ContactInfo;
  faqs?: FaqItem[];
  emergencyInfo?: EmergencyInfo;
  freeBoard?: FreeBoardItem[];
  advertisements?: AdItem[];
}

// Featured 응답 타입
export interface FeaturedResponse {
  success: boolean;
  featured?: FeaturedItem;
  error?: string;
} 