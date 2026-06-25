// 공통 타입 정의

export type UserRole = "USER" | "MANAGER" | "ADMIN";
export type ChannelType = "BLOG" | "YOUTUBE" | "FREE";
export type ChallengeCategory =
  | "EXERCISE" | "STUDY" | "READING" | "FINANCE"
  | "DIET" | "CREATION" | "PRODUCTIVITY" | "OTHER";
export type ChallengeStatus =
  | "DRAFT" | "RECRUITING" | "IN_PROGRESS" | "REVIEWING" | "COMPLETED" | "CANCELLED";
export type CertFrequency = "DAILY" | "WEEKLY_N" | "TOTAL_N";
export type RewardModel = "EQUAL" | "PROPORTIONAL" | "COMPLETION_BONUS" | "RANK" | "REFUND";
export type CertStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SubscriptionPlan = "FREE" | "STANDARD" | "PRO";

export const CATEGORY_LABELS: Record<ChallengeCategory, string> = {
  EXERCISE: "운동",
  STUDY: "공부",
  READING: "독서",
  FINANCE: "재테크",
  DIET: "다이어트",
  CREATION: "창작",
  PRODUCTIVITY: "생산성",
  OTHER: "기타",
};

export const CHANNEL_LABELS: Record<ChannelType, string> = {
  BLOG: "블로그",
  YOUTUBE: "유튜브",
  FREE: "자유형",
};

export const STATUS_LABELS: Record<ChallengeStatus, string> = {
  DRAFT: "초안",
  RECRUITING: "모집 중",
  IN_PROGRESS: "진행 중",
  REVIEWING: "검토 중",
  COMPLETED: "정산 완료",
  CANCELLED: "취소됨",
};

export const REWARD_MODEL_LABELS: Record<RewardModel, string> = {
  EQUAL: "균등 배분",
  PROPORTIONAL: "달성률 비례",
  COMPLETION_BONUS: "완주 보너스",
  RANK: "랭킹 차등",
  REFUND: "전액 환급",
};

export const SUBSCRIPTION_LABELS: Record<SubscriptionPlan, string> = {
  FREE: "무료",
  STANDARD: "스탠다드",
  PRO: "프로",
};

// API 응답 공통 형태
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 커서 기반 페이지네이션
export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// 챌린지 카드용 요약 타입
export interface ChallengeSummary {
  id: string;
  title: string;
  coverImageUrl: string | null;
  category: ChallengeCategory;
  channelType: ChannelType;
  status: ChallengeStatus;
  startsAt: string;
  endsAt: string;
  recruitEndsAt: string;
  entryFee: number;
  managerFeePct: number;
  certFrequency: CertFrequency;
  certSuccessPct: number;
  rewardModel: RewardModel;
  manager: { id: string; nickname: string; profileImageUrl: string | null };
  _count: { participations: number };
  isBoosted?: boolean;
}

// 챌린지 생성 마법사 상태
export interface WizardStep1 {
  title: string;
  description: string;
  coverImageUrl?: string;
  category: ChallengeCategory | "";
  channelType: ChannelType | "";
  hashtags: string[];
}

export interface WizardStep2 {
  startsAt: string;
  endsAt: string;
  recruitEndsAt: string;
  certFrequency: CertFrequency;
  certFrequencyN?: number;
  certDailyDeadline: string;
  certSuccessPct: number;
  minParticipants?: number;
  maxParticipants?: number;
}

export interface WizardStep3 {
  entryFee: number;
  isFree: boolean;
  managerFeePct: number;
  rewardModel: RewardModel;
  rewardRankConfig?: { rank: number; pct: number }[];
}

export interface WizardStep4 {
  reviewMode: "MANUAL" | "AUTO_WITH_EXCEPTION";
  requiredHashtags: string[];
}

export interface WizardStep5 {
  isPublic: boolean;
  disputePeriodDays: number;
  agreedToRefundPolicy: boolean;
  agreedToWithholding: boolean;
  agreedToTerms: boolean;
}

export type WizardData = WizardStep1 & WizardStep2 & WizardStep3 & WizardStep4 & WizardStep5;
