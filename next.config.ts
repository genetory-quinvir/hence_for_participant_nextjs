import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // 정적 배포를 위한 설정
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  }),
};

export default nextConfig;
