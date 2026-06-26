# DB + OAuth 설정 가이드 (10분 완성)

## 1단계 — Neon 무료 PostgreSQL 생성 (3분)

1. https://neon.tech 접속 → **Continue with Google** 로그인
2. **New Project** 클릭
   - Name: `challenge-hub`
   - Region: **AWS Singapore (ap-southeast-1)**
   - PostgreSQL version: 16
3. **Create Project** 클릭
4. 나타나는 화면에서 **Connection string** 복사
   - 형식: `postgresql://user:password@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

---

## 2단계 — Vercel 환경변수 설정 (2분)

https://vercel.com/jennylee3769-8515s-projects/challenge-hub/settings/environment-variables 접속

아래 변수 추가:

| 변수명 | 값 |
|---|---|
| `DATABASE_URL` | Neon에서 복사한 connection string |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | 구글 클라이언트 ID |
| `GOOGLE_CLIENT_ID` | 구글 클라이언트 ID (동일) |
| `GOOGLE_CLIENT_SECRET` | 구글 클라이언트 보안 비밀 |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID` | 카카오 REST API 키 |
| `KAKAO_CLIENT_ID` | 카카오 REST API 키 (동일) |
| `KAKAO_CLIENT_SECRET` | 카카오 Client Secret |

---

## 3단계 — DB 스키마 적용 (1분)

`.env.local`의 `DATABASE_URL`을 Neon connection string으로 교체 후:

```bash
npm run db:push    # 스키마 적용
npm run db:seed    # 샘플 데이터 입력
```

---

## 4단계 — Google OAuth 리디렉션 URI 추가 (2분)

1. https://console.cloud.google.com 접속
2. **API 및 서비스** → **사용자 인증 정보** → OAuth 2.0 클라이언트 클릭
3. **승인된 리디렉션 URI** 에 추가:
   ```
   https://challenge-hub-alpha.vercel.app/api/auth/google/callback
   ```
4. **저장**

---

## 5단계 — Kakao 리디렉션 URI 추가 (2분)

1. https://developers.kakao.com 접속
2. **내 애플리케이션** → 앱 선택 → **카카오 로그인** → **Redirect URI** 추가:
   ```
   https://challenge-hub-alpha.vercel.app/api/auth/kakao/callback
   ```
3. **저장**

---

## 완료 후 재배포

Vercel 대시보드 → **Deployments** → **Redeploy** 클릭 (또는 `npx vercel --prod`)

---

## 시드 데이터 계정

DB 연결 후 `npm run db:seed` 실행하면 아래 계정이 생성됩니다:

| 이메일 | 역할 | 비고 |
|---|---|---|
| admin@challengehub.kr | ADMIN | 관리자 |
| manager@challengehub.kr | MANAGER | 챌린지 3개 생성됨 |
| user1~5@challengehub.kr | USER | 챌린지 참가 중 |
