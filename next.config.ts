import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // prisma.config.ts의 Prisma v7 타입 이슈로 인해 빌드 시 타입체크 비활성화
    // (실제 앱 코드는 tsc --noEmit으로 별도 검증)
    ignoreBuildErrors: true,
  },

  // Prisma, pg 등 Node.js 전용 패키지를 서버 번들에서 외부 처리
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "pg",
    "pg-native",
    ".prisma",
  ],

  // 이미지 도메인 허용
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudflare.com" },
      { protocol: "https", hostname: "cdn.challengehub.kr" },
      { protocol: "https", hostname: "k.kakaocdn.net" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
