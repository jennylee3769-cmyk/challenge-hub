import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "dev-access-secret-please-change-in-production"
);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-please-change-in-production"
);

export interface JWTPayload {
  userId: string;
  role: string;
}

/** Access Token 발급 (1시간) */
export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(ACCESS_SECRET);
}

/** Refresh Token 발급 (30일) */
export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(REFRESH_SECRET);
}

/** Access Token 검증 */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/** Refresh Token 검증 */
export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/** 쿠키에서 현재 로그인 사용자 조회 */
export async function getSession(): Promise<{ userId: string; role: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

/** 쿠키에서 현재 로그인 사용자 + DB 정보 조회 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      nickname: true,
      profileImageUrl: true,
      email: true,
      role: true,
      payoutSellerId: true,
      payoutBankCode: true,
      payoutAccount: true,
      payoutHolderName: true,
      subscription: { select: { plan: true, status: true, currentPeriodEnd: true } },
    },
  });
}

/** 응답 쿠키에 토큰 세팅 */
export function setTokenCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): Response {
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = `HttpOnly; Secure=${isProduction}; SameSite=Strict; Path=/`;

  res.headers.append("Set-Cookie", `access_token=${accessToken}; Max-Age=3600; ${cookieOptions}`);
  res.headers.append(
    "Set-Cookie",
    `refresh_token=${refreshToken}; Max-Age=${30 * 24 * 3600}; ${cookieOptions}`
  );
  return res;
}

/** 쿠키 삭제 (로그아웃) */
export function clearTokenCookies(res: Response): Response {
  res.headers.append("Set-Cookie", "access_token=; Max-Age=0; Path=/");
  res.headers.append("Set-Cookie", "refresh_token=; Max-Age=0; Path=/");
  return res;
}
