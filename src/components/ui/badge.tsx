import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        // 챌린지 상태
        recruiting:  "bg-[#E0EAFF] text-[#3538CD]",
        in_progress: "bg-[#D1FADF] text-[#027A48]",
        reviewing:   "bg-[#FEF0C7] text-[#B54708]",
        completed:   "bg-[#F2F4F7] text-[#344054]",
        cancelled:   "bg-[#FEE4E2] text-[#B42318]",
        draft:       "bg-[#F2F4F7] text-[#667085]",

        // 인증 상태
        approved:    "bg-[#D1FADF] text-[#027A48]",
        pending:     "bg-[#FEF0C7] text-[#B54708]",
        rejected:    "bg-[#FEE4E2] text-[#B42318]",

        // 카드 배지
        featured:    "bg-[#FDB022] text-white",
        new:         "bg-[#D1FADF] text-[#027A48]",
        closing:     "bg-[#FEE4E2] text-[#B42318]",
        free:        "bg-[#F2F4F7] text-[#344054]",

        // 카테고리
        category:    "bg-[#F2F4F7] text-[#344054]",

        // 플랜
        standard:    "bg-[#E0EAFF] text-[#3538CD]",
        pro:         "bg-[#FEF0C7] text-[#B54708]",
      },
    },
    defaultVariants: {
      variant: "category",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
