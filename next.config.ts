import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-native-async-storage/async-storage'],
  
  // 외부 이미지 도메인 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'd1veuh7wapeo8j.cloudfront.net',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // 파비콘 캐시 문제 해결을 위한 헤더 설정
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self' https://api-participant.hence.events https://api.hence.events https://www.google-analytics.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
