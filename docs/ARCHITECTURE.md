# 아키텍처 문서

## 전체 구조

```
사용자 브라우저
    │
    ▼
Next.js App Router (Vercel)
    ├── Server Components (DB 직접 조회)
    ├── Client Components (인터랙션)
    └── API Routes (REST)
         │
         ├── Prisma v7 (PrismaPg 어댑터)
         │        └── PostgreSQL
         │
         ├── 토스페이먼츠 API
         │        ├── 결제 확인
         │        └── 지급대행 Payout
         │
         ├── Cloudflare R2
         │        └── 이미지 영구 CDN
         │
         └── AWS SES
                  └── 트랜잭션 이메일
```

## 인증 흐름

```
1. /login 페이지 → 카카오/구글 버튼 클릭
2. OAuth Provider 인증
3. /api/auth/{provider}/callback
   - Provider에서 userinfo 조회
   - DB에 User upsert
   - Access Token (1h) + Refresh Token (30d) 발급
   - HttpOnly Cookie 세팅
4. 리다이렉트 → /
```

### JWT 쿠키 구조

| 쿠키명 | 값 | 만료 |
|--------|-----|------|
| `access_token` | JWT (userId, role) | 1시간 |
| `refresh_token` | JWT (userId, role) | 30일 |

### 토큰 갱신

- 서버 컴포넌트에서 `getSession()` 호출 → Access Token 만료 시 자동으로 `/api/auth/refresh` 통해 갱신
- Refresh Token 만료 시 → 로그인 페이지로 리다이렉트

## 결제 흐름

```
1. /challenges/[id]/join 페이지 진입
2. POST /api/payments/create-order → orderId 생성 (DB PENDING)
3. 토스 SDK requestPayment() 호출
4. 사용자 결제 완료 → 토스가 successUrl로 리다이렉트
5. GET /api/payments/toss/success
   → POST tosspayments/v1/payments/confirm
   → DB: Payment COMPLETED + Participation ACTIVE (트랜잭션)
   → 참가 확정 이메일 발송 (비동기)
6. /challenges/[id]?joined=1 리다이렉트
```

### 결제 멱등성

- `POST /api/payments/create-order` 는 같은 챌린지 PENDING 주문이 있으면 재사용
- 결제 금액은 서버에서 DB 기준으로 검증 (클라이언트 값 신뢰 X)

## 데이터 모델 요약

```
User (1) ──────── (*) Participation (1) ──── (1) Payment
                          │
                      (*) Certification
                          ├── (*) CertificationLike
                          └── (*) CertificationComment

User (1) ──── (*) Challenge (매니저)
Challenge (1) ──── (*) Participation
Challenge (1) ──── (*) Settlement
Challenge (1) ──── (*) ChallengeBoosting

User (1) ──── (1) ManagerSubscription
```

## 보안 고려사항

### PII 암호화

계좌번호 등 민감 정보는 AES-256-GCM으로 암호화 후 DB 저장:

```typescript
// 저장 시
payoutAccount: encrypt(accountNumber)

// 조회 시 마스킹 (복호화 X)
payoutAccount: maskAccount(encrypted)  // "12**...4567"
```

### 환경변수 관리

- `.env.local`은 `.gitignore`에 포함 (절대 커밋 X)
- `ENCRYPTION_KEY`: 32바이트 hex (64자) — 분실 시 모든 암호화 데이터 복구 불가
- JWT Secret: 최소 32자 이상 무작위 문자열

## Prisma v7 특이사항

Prisma v7부터 `schema.prisma`에서 `url` 필드 제거됨:

```prisma
// ❌ Prisma v6 이하
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ✅ Prisma v7
datasource db {
  provider = "postgresql"
  // url은 prisma.config.ts에서 설정
}
```

연결은 `prisma.config.ts` + `PrismaPg` 어댑터로 처리:

```typescript
// src/lib/db.ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

## Next.js 16 특이사항

- `middleware.ts` 폐기 → 인증 보호는 Server Component에서 `redirect()` 사용
- Edge Runtime에서 Prisma/pg 사용 불가 → `serverExternalPackages` 설정 필수

```typescript
// next.config.ts
serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg", ".prisma"]
```
