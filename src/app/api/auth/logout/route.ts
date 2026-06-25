import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifyRefreshToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  // DB에서 refresh token 삭제
  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload) {
      await db.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
    }
  }

  const response = NextResponse.json({ success: true });
  response.headers.append("Set-Cookie", "access_token=; HttpOnly; Path=/; Max-Age=0");
  response.headers.append("Set-Cookie", "refresh_token=; HttpOnly; Path=/; Max-Age=0");
  return response;
}
