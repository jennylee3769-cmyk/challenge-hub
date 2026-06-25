"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Shield, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Trophy, text: "목표 달성하고 상금 받기" },
  { icon: Shield, text: "PASS 본인인증으로 안전한 거래" },
  { icon: Award, text: "블로그·유튜브 챌린지 관리" },
];

export default function LoginPage() {
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleKakaoLogin = () => {
    setKakaoLoading(true);
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/kakao/callback`
    )}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    )}&response_type=code&scope=openid%20email%20profile`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* 상단 그라데이션 영역 */}
      <div className="flex-1 bg-gradient-to-b from-[#6172F3] to-[#8098F9] flex flex-col items-center justify-center px-6 pt-16 pb-10">
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">챌린지허브</h1>
          <p className="text-white/80 text-base">목표를 달성하고 상금을 받아보세요</p>
        </div>

        <div className="mt-10 w-full max-w-xs space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 로그인 버튼 영역 */}
      <div className="bg-white px-6 pt-8 pb-10 space-y-3">
        <p className="text-center text-sm text-[#667085] mb-5">
          소셜 계정으로 간편하게 시작하세요
        </p>

        {/* 카카오 로그인 */}
        <button
          onClick={handleKakaoLogin}
          disabled={kakaoLoading}
          className="w-full h-14 rounded-xl bg-[#FEE500] text-[#191919] font-semibold text-base flex items-center justify-center gap-3 hover:bg-[#F0D800] transition-colors disabled:opacity-60 shadow-sm"
        >
          {kakaoLoading ? (
            <div className="h-5 w-5 border-2 border-[#191919]/20 border-t-[#191919] rounded-full animate-spin" />
          ) : (
            <>
              <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 0C4.477 0 0 3.584 0 8.009c0 2.84 1.815 5.335 4.566 6.753l-.944 3.515a.3.3 0 0 0 .441.334L8.16 16.27A11.65 11.65 0 0 0 10 16.017c5.523 0 10-3.583 10-8.008S15.523 0 10 0Z"
                  fill="#191919"
                />
              </svg>
              카카오로 로그인
            </>
          )}
        </button>

        {/* 구글 로그인 */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full h-14 rounded-xl bg-white text-[#344054] font-semibold text-base flex items-center justify-center gap-3 border border-[#D0D5DD] hover:bg-[#F9FAFB] transition-colors disabled:opacity-60 shadow-sm"
        >
          {googleLoading ? (
            <div className="h-5 w-5 border-2 border-[#D0D5DD] border-t-[#344054] rounded-full animate-spin" />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 3-4.33 3-7.31z" fill="#4285F4"/>
                <path d="M10 20c2.7 0 4.96-.9 6.62-2.46l-3.24-2.5a6 6 0 0 1-8.94-3.15H1.06v2.58A10 10 0 0 0 10 20z" fill="#34A853"/>
                <path d="M4.44 11.89A6.02 6.02 0 0 1 4.13 10c0-.66.11-1.3.31-1.89V5.53H1.06A10 10 0 0 0 0 10c0 1.61.39 3.14 1.06 4.47l3.38-2.58z" fill="#FBBC05"/>
                <path d="M10 3.98a5.44 5.44 0 0 1 3.84 1.5l2.87-2.87A9.67 9.67 0 0 0 10 0 10 10 0 0 0 1.06 5.53l3.38 2.58A5.96 5.96 0 0 1 10 3.98z" fill="#EA4335"/>
              </svg>
              Google로 로그인
            </>
          )}
        </button>

        <p className="text-center text-xs text-[#98A2B3] pt-2">
          로그인 시{" "}
          <Link href="/terms" className="text-[#667085] underline">이용약관</Link>
          {" "}및{" "}
          <Link href="/privacy" className="text-[#667085] underline">개인정보처리방침</Link>
          에 동의하게 됩니다
        </p>
      </div>
    </div>
  );
}
