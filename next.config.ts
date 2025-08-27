import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Next.js 15에서 변경된 설정
  serverExternalPackages: [],
  // API 라우트에서 파일 업로드 크기 제한 늘리기
  experimental: {
    serverComponentsExternalPackages: [], // Next.js 15에서 serverExternalPackages로 이동
  },
};

export default nextConfig;
