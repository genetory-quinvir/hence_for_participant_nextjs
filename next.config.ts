import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // 정적 배포를 위한 설정 - 개발 환경에서는 비활성화
  ...(process.env.NODE_ENV === 'production' && {
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || 'https://participant.hence.events',
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  }),
};

export default nextConfig;
