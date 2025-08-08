import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // 정적 배포를 위한 설정
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || 
    (process.env.NODE_ENV === 'production' ? 'https://participant.hence.events' : ''),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

export default nextConfig;
