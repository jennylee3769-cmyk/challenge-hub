# 챌린지허브 (Challenge Hub)

블로그·유튜브·SNS 챌린지를 생성하고 참가비 기반 상금을 운영하는 플랫폼입니다.

## 주요 기능

| 기능 | 설명 |
|------|------|
| 챌린지 생성·관리 | 매니저가 5단계 위자드로 챌린지를 생성하고 운영 |
| 참가비·상금 시스템 | 토스페이먼츠로 참가비 수납, 성공자에게 자동 지급대행 |
| 인증 피드 | URL·사진 인증 제출, 매니저 승인/반려 |
| 원천징수 자동 계산 | 5만원 초과 상금 22% 자동 원천징수 |
| 랭킹·캘린더 | 인증 횟수 기반 랭킹, 월간 캘린더 |
| 소셜 로그인 | 카카오·구글 OAuth 2.0 |

## 기술 스택

```
Framework   : Next.js 16.x (App Router, Turbopack)
Language    : TypeScript
Styling     : Tailwind CSS v4
ORM         : Prisma v7 + PostgreSQL
Auth        : JWT (HttpOnly Cookie) — Access 1h / Refresh 30d
Payment     : 토스페이먼츠 SDK v2 + Payout API
Storage     : Cloudflare R2 (S3-compatible, 영구 CDN URL)
Email       : AWS SES
Encryption  : AES-256-GCM (계좌번호 등 PII)
```

## 로컬 개발 시작

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다:

```bash
cp .env.example .env.local
```

필수 환경변수:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/challenge_hub

JWT_ACCESS_SECRET=your-64-char-random-string
JWT_REFRESH_SECRET=your-64-char-random-string
ENCRYPTION_KEY=your-64-char-hex-string   # openssl rand -hex 32

NEXT_PUBLIC_APP_URL=http://localhost:3000

# 카카오 OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=http://localhost:3000/api/auth/kakao/callback

# 구글 OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# 토스페이먼츠 (테스트 키)
TOSS_SECRET_KEY=test_sk_...
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_WEBHOOK_SECRET=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=challenge-hub
NEXT_PUBLIC_R2_CDN_URL=https://pub-xxxx.r2.dev

# AWS SES
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SES_FROM_EMAIL=noreply@yourdomain.com
```

### 3. 데이터베이스 마이그레이션

PostgreSQL이 실행 중인 상태에서:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인합니다.

## 프로젝트 구조

```
challenge-hub/
├── prisma/
│   └── schema.prisma          # DB 스키마 (17개 모델)
├── prisma.config.ts           # Prisma v7 설정 (PrismaPg 어댑터)
├── src/
│   ├── app/                   # Next.js App Router 페이지
│   │   ├── page.tsx           # 홈 (Featured + Recent 챌린지)
│   │   ├── login/             # 카카오/구글 로그인
│   │   ├── challenges/        # 챌린지 목록·상세·참가·인증·랭킹
│   │   ├── my/                # 내 챌린지·캘린더·계좌
│   │   ├── manage/            # 매니저 대시보드·인증 관리
│   │   ├── settings/          # 설정
│   │   ├── subscription/      # 구독 플랜
│   │   └── api/               # API 라우트
│   ├── components/
│   │   ├── ui/                # Button, Badge, Input
│   │   ├── layout/            # Header, BottomNav
│   │   ├── challenge/         # ChallengeCard, Wizard, JoinPaymentForm
│   │   ├── certification/     # CertifyForm
│   │   ├── my/                # CalendarView, PayoutAccountForm
│   │   └── shared/            # LogoutButton
│   ├── lib/
│   │   ├── auth.ts            # JWT 인증, getSession, getCurrentUser
│   │   ├── db.ts              # Prisma 클라이언트 (PrismaPg 어댑터)
│   │   ├── toss.ts            # 토스페이먼츠 API
│   │   ├── ses.ts             # AWS SES 이메일
│   │   ├── r2.ts              # Cloudflare R2 업로드
│   │   ├── encrypt.ts         # AES-256-GCM 암호화
│   │   └── utils.ts           # 공통 유틸 (금액, D-day, 원천징수 계산)
│   ├── types/
│   │   └── index.ts           # 공통 타입·라벨 맵
│   └── styles/
│       └── tokens.css         # 디자인 토큰 CSS 변수
└── docs/                      # 개발 문서
```

## API 라우트 목록

### 인증

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/auth/kakao/callback` | 카카오 OAuth 콜백 |
| GET | `/api/auth/google/callback` | 구글 OAuth 콜백 |
| POST | `/api/auth/logout` | 로그아웃 |
| POST | `/api/auth/refresh` | 토큰 갱신 |

### 챌린지

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/challenges` | 챌린지 목록 (커서 페이지네이션) |
| POST | `/api/challenges` | 챌린지 생성 (MANAGER) |
| GET | `/api/challenges/[id]` | 챌린지 상세 |
| PATCH | `/api/challenges/[id]` | 챌린지 수정 |
| DELETE | `/api/challenges/[id]` | 챌린지 취소 |
| POST | `/api/challenges/[id]/join` | 무료 참가 |
| DELETE | `/api/challenges/[id]/join` | 탈퇴 |
| GET | `/api/challenges/[id]/certifications` | 인증 피드 |
| POST | `/api/challenges/[id]/certifications` | 인증 제출 |
| GET | `/api/challenges/[id]/ranking` | 랭킹 |

### 결제

| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/payments/create-order` | 결제 주문 생성 |
| POST | `/api/payments/toss/confirm` | 토스 결제 승인 |
| GET | `/api/payments/toss/success` | 결제 성공 리다이렉트 |
| POST | `/api/payments/toss/webhook` | 토스 웹훅 |

### 사용자·관리

| Method | Path | 설명 |
|--------|------|------|
| GET/PATCH | `/api/user/me` | 프로필 조회/수정 |
| PUT/DELETE | `/api/user/payout` | 상금 계좌 등록/삭제 |
| POST | `/api/manager/become` | 매니저 전환 |
| PATCH | `/api/certifications/[id]/review` | 인증 승인/반려 |
| GET | `/api/manage/certifications` | 매니저 인증 목록 |
| POST | `/api/upload` | 이미지 업로드 (R2) |

## 핵심 비즈니스 로직

### 상금 계산

```
총 참가비 = 참가비 × 참가자 수
플랫폼 수수료 = 총 참가비 × 7%
매니저 수수료 = (총 참가비 - 플랫폼 수수료) × 매니저 수수료율
상금 풀 = 총 참가비 - 플랫폼 수수료 - 매니저 수수료
1인당 상금 = 상금 풀 / 성공자 수
```

### 원천징수 (기타소득세)

- 상금 **5만원 이하**: 원천징수 없음
- 상금 **5만원 초과**: 22% (소득세 20% + 주민세 2%) 원천징수

```typescript
calcWithholding(50000)  // → { tax: 0, net: 50000 }
calcWithholding(100000) // → { tax: 22000, net: 78000 }
```

### 인증 중복 방지

같은 날 같은 챌린지에 중복 인증 불가:

```typescript
const today = new Date(); today.setHours(0,0,0,0);
const existing = await db.certification.findFirst({
  where: { challengeId, userId, submittedAt: { gte: today } }
});
```

## 배포 (Vercel)

```bash
npm i -g vercel
vercel --prod
```

Vercel 환경변수에 `.env.local`의 모든 키를 추가합니다.

## 라이선스

MIT
