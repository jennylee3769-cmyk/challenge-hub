import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "refresh_token_missing" }, { status: 401 });
  }

  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) {
    return NextResponse.json({ error: "refresh_token_invalid" }, { status: 401 });
  }

  // DB에서 refresh token 유효성 확인
  const stored = await db.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    return NextResponse.json({ error: "refresh_token_expired" }, { status: 401 });
  }

  // 사용자 현재 상태 조회
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 401 });
  }

  const newPayload = { userId: user.id, role: user.role };
  const newAccessToken = await signAccessToken(newPayload);
  const newRefreshToken = await signRefreshToken(newPayload);

  // 기존 refresh token 교체
  await db.refreshToken.update({
    where: { token: refreshToken },
    data: {
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    },
  });

  const isProduction = process.env.NODE_ENV === "production";
  const secure = isProduction ? "; Secure" : "";

  const response = NextResponse.json({ success: true });
  response.headers.append(
    "Set-Cookie",
    `access_token=${newAccessToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${secure}`
  );
  response.headers.append(
    "Set-Cookie",
    `refresh_token=${newRefreshToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${30 * 24 * 3600}${secure}`
  );
  return response;
}
