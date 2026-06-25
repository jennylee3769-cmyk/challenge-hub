import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | 챌린지허브",
    default: "챌린지허브 — 함께 목표를 달성하고 상금을 받아요",
  },
  description:
    "블로그, 유튜브, SNS 챌린지를 통해 목표를 달성하고 참가비 기반 상금을 받아보세요.",
  keywords: ["챌린지", "블로그챌린지", "유튜브챌린지", "목표달성", "상금"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "챌린지허브",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6172F3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="bg-[#F9FAFB] antialiased">
        <div className="max-w-lg mx-auto min-h-screen bg-white shadow-sm relative">
          {children}
        </div>
      </body>
    </html>
  );
}
