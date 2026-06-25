import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signAccessToken, signRefreshToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
  }

  try {
    // 1. 인가코드 → 액세스 토큰 교환
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID!,
        client_secret: process.env.KAKAO_CLIENT_SECRET ?? "",
        redirect_uri: process.env.KAKAO_REDIRECT_URI!,
        code,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error("카카오 토큰 발급 실패");
    }

    const { access_token } = await tokenRes.json();

    // 2. 사용자 정보 조회
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) {
      throw new Error("카카오 사용자 정보 조회 실패");
    }

    const kakaoUser = await userRes.json();
    const socialId = String(kakaoUser.id);
    const nickname =
      kakaoUser.kakao_account?.profile?.nickname ??
      kakaoUser.properties?.nickname ??
      "사용자";
    const profileImageUrl =
      kakaoUser.kakao_account?.profile?.thumbnail_image_url ??
      kakaoUser.properties?.thumbnail_image ??
      null;
    const email = kakaoUser.kakao_account?.email ?? null;

    // 3. DB에 사용자 upsert
    const user = await db.user.upsert({
      where: { socialProvider_socialId: { socialProvider: "kakao", socialId } },
      update: { nickname, profileImageUrl, email },
      create: {
        socialProvider: "kakao",
        socialId,
        nickname,
        profileImageUrl,
        email,
        role: "USER",
      },
    });

    // 4. JWT 발급
    const payload = { userId: user.id, role: user.role };
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    // 5. Refresh Token DB 저장
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    await db.refreshToken.upsert({
      where: { token: refreshToken },
      update: {},
      create: { userId: user.id, token: refreshToken, expiresAt },
    });

    // 6. 쿠키 세팅 후 리다이렉트
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOpts = `HttpOnly; SameSite=Strict; Path=/; Max-Age=`;
    const secure = isProduction ? "; Secure" : "";

    const response = NextResponse.redirect(new URL("/", req.url));
    response.headers.append(
      "Set-Cookie",
      `access_token=${accessToken}; ${cookieOpts}3600${secure}`
    );
    response.headers.append(
      "Set-Cookie",
      `refresh_token=${refreshToken}; ${cookieOpts}${30 * 24 * 3600}${secure}`
    );
    return response;
  } catch (err) {
    console.error("[Kakao OAuth Error]", err);
    return NextResponse.redirect(new URL("/login?error=server_error", req.url));
  }
}
