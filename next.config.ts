import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // API 라우트에서 파일 업로드 크기 제한 늘리기
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // API 라우트 설정
  api: {
    bodyParser: {
      sizeLimit: '10mb', // 10MB로 제한 늘리기
    },
    responseLimit: '10mb',
  },
};

export default nextConfig;
