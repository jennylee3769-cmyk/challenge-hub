import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 금액을 한국어 형식으로 포맷 (예: 10000 → "10,000원") */
export function formatMoney(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

/** 원천징수 계산 (기타소득, 5만원 초과 시 22%) */
export function calcWithholding(gross: number): { tax: number; net: number } {
  if (gross <= 50000) return { tax: 0, net: gross };
  const tax = Math.floor(gross * 0.22);
  return { tax, net: gross - tax };
}

/** D-day 텍스트 (예: D-14, D-day, D+3) */
export function formatDday(targetDate: Date): string {
  const diff = Math.ceil((targetDate.getTime() - Date.now()) / 86400000);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-day";
  return `D+${Math.abs(diff)}`;
}

/** 날짜를 "YYYY.MM.DD" 형식으로 포맷 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

/** 날짜를 "MM.DD HH:mm" 형식으로 포맷 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 챌린지 인증 달성률 계산 */
export function calcCertRate(certCount: number, totalPossible: number): number {
  if (totalPossible === 0) return 0;
  return Math.round((certCount / totalPossible) * 100);
}

/** 플랫폼 수수료율 계산 */
export function calcPlatformFee(entryFee: number, plan: "FREE" | "STANDARD" | "PRO"): number {
  if (plan === "STANDARD") return 0.05;
  if (plan === "PRO") return 0.03;
  return entryFee < 10000 ? 0.1 : 0.07;
}

/** 상금 시뮬레이션 */
export function simulatePrize(params: {
  entryFee: number;
  participantCount: number;
  managerFeePct: number;
  platformFeePct: number;
}): { totalPool: number; platformFee: number; managerFee: number; prizePool: number; perPerson: number } {
  const totalPool = params.entryFee * params.participantCount;
  const platformFee = Math.floor(totalPool * params.platformFeePct);
  const managerFee = Math.floor(totalPool * (params.managerFeePct / 100));
  const prizePool = totalPool - platformFee - managerFee;
  const perPerson = params.participantCount > 0 ? Math.floor(prizePool / params.participantCount) : 0;
  return { totalPool, platformFee, managerFee, prizePool, perPerson };
}

/** 랜덤 초대 코드 (8자리 영숫자) */
export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/** 텍스트 말줄임 */
export function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}
