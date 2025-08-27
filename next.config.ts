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
};

export default nextConfig;
