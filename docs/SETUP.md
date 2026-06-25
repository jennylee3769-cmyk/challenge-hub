# 로컬 환경 세팅 가이드

## 사전 요구사항

- Node.js 20+
- PostgreSQL 15+
- Git

## 1. 저장소 클론

```bash
git clone https://github.com/jennylee3769-cmyk/challenge-hub.git
cd challenge-hub
npm install
```

## 2. PostgreSQL 설정

```sql
-- psql에서 실행
CREATE DATABASE challenge_hub;
CREATE USER challenge_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE challenge_hub TO challenge_user;
```

## 3. 환경변수

`.env.example` → `.env.local` 복사 후 값 입력:

```bash
cp .env.example .env.local
```

### ENCRYPTION_KEY 생성 (PowerShell)

```powershell
-join ((0..63) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

### ENCRYPTION_KEY 생성 (Linux/Mac)

```bash
openssl rand -hex 32
```

## 4. DB 마이그레이션

```bash
npx prisma migrate dev --name init
```

## 5. 개발 서버

```bash
npm run dev
# → http://localhost:3000
```

## 외부 서비스 설정

### 카카오 로그인

1. https://developers.kakao.com → 내 애플리케이션 → 앱 생성
2. **카카오 로그인** 활성화
3. **Redirect URI** 추가: `http://localhost:3000/api/auth/kakao/callback`
4. **동의항목**: 닉네임, 프로필사진, 이메일(선택) 설정
5. `KAKAO_CLIENT_ID` = REST API 키, `KAKAO_CLIENT_SECRET` = 보안 → Client Secret

### 구글 로그인

1. https://console.cloud.google.com → API 및 서비스 → OAuth 동의 화면
2. 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성
3. **승인된 리디렉션 URI**: `http://localhost:3000/api/auth/google/callback`
4. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 복사

### 토스페이먼츠

1. https://developers.tosspayments.com → 개발자센터 가입
2. 테스트 키 발급 (무료)
3. `TOSS_SECRET_KEY` = 시크릿 키, `NEXT_PUBLIC_TOSS_CLIENT_KEY` = 클라이언트 키

### Cloudflare R2

1. Cloudflare 대시보드 → R2 → 버킷 생성 (`challenge-hub`)
2. 버킷 설정 → 퍼블릭 액세스 활성화 → CDN URL 복사
3. API 토큰 생성 (R2 읽기/쓰기 권한)
4. 환경변수: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `NEXT_PUBLIC_R2_CDN_URL`

### AWS SES (이메일)

1. AWS 콘솔 → SES → 이메일 주소 인증
2. IAM → 사용자 → 액세스 키 생성 (`AmazonSESFullAccess`)
3. 샌드박스 환경에서는 인증된 이메일만 수신 가능
