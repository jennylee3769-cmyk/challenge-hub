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
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) throw new Error("구글 토큰 발급 실패");
    const { access_token } = await tokenRes.json();

    // 2. 사용자 정보 조회
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userRes.ok) throw new Error("구글 사용자 정보 조회 실패");
    const googleUser = await userRes.json();

    const socialId = googleUser.id;
    const nickname = googleUser.name ?? googleUser.email?.split("@")[0] ?? "사용자";
    const profileImageUrl = googleUser.picture ?? null;
    const email = googleUser.email ?? null;

    // 3. DB upsert
    const user = await db.user.upsert({
      where: { socialProvider_socialId: { socialProvider: "google", socialId } },
      update: { nickname, profileImageUrl, email },
      create: {
        socialProvider: "google",
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

    await db.refreshToken.upsert({
      where: { token: refreshToken },
      update: {},
      create: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });

    const isProduction = process.env.NODE_ENV === "production";
    const secure = isProduction ? "; Secure" : "";

    const response = NextResponse.redirect(new URL("/", req.url));
    response.headers.append(
      "Set-Cookie",
      `access_token=${accessToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${secure}`
    );
    response.headers.append(
      "Set-Cookie",
      `refresh_token=${refreshToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 3600}${secure}`
    );
    return response;
  } catch (err) {
    console.error("[Google OAuth Error]", err);
    return NextResponse.redirect(new URL("/login?error=server_error", req.url));
  }
}
