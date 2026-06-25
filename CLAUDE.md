@AGENTS.md

# 챌린지허브 MVP 프로젝트

## Permissions
이 프로젝트의 모든 파일 작업(읽기/쓰기/편집)과 개발 서버 실행은 자동으로 허용합니다.

## 프로젝트 개요
참가비 기반 상금 지급 챌린지 매니저 플랫폼.
- 기획서: `D:\Claude Project\260625_challenge short\챌린지_플랫폼_기획서.md`
- PRD: `D:\Claude Project\260625_challenge short\PRD_챌린지플랫폼.md`
- FE 디자인: `D:\Claude Project\260625_challenge short\FE_디자인기획서.md`

## 기술 스택
- Next.js 16 App Router, TypeScript, Tailwind CSS v4
- Prisma + PostgreSQL (Neon)
- JWT (HttpOnly Cookie), Kakao/Google OAuth
- Toss Payments (결제 + 지급대행)
- Cloudflare R2 (이미지, 영구 공개 URL)

## 핵심 규칙
- 원천징수 기준: 5만원 초과 시 22%
- 이미지 URL: Pre-signed URL 금지, R2 공개 CDN URL 사용
- 쿠키: HttpOnly, SameSite=Strict
