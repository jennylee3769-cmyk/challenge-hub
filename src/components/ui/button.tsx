"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6172F3] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary:
          "bg-[#6172F3] text-white hover:bg-[#444CE7] shadow-sm",
        secondary:
          "bg-white text-[#344054] border border-[#D0D5DD] hover:bg-[#F9FAFB] shadow-sm",
        destructive:
          "bg-[#F04438] text-white hover:bg-[#B42318] shadow-sm",
        ghost:
          "text-[#344054] hover:bg-[#F2F4F7]",
        link:
          "text-[#6172F3] underline-offset-4 hover:underline p-0 h-auto",
        kakao:
          "bg-[#FEE500] text-[#191919] hover:bg-[#F0D800] shadow-sm font-semibold",
        google:
          "bg-white text-[#344054] border border-[#D0D5DD] hover:bg-[#F9FAFB] shadow-sm",
      },
      size: {
        sm: "h-9 px-3.5 py-2 text-sm",
        md: "h-11 px-4.5 py-2.5 text-base",
        lg: "h-13 px-5.5 py-3 text-lg",
        xl: "h-15 px-7 py-4 text-lg",
        full: "h-14 w-full px-5 py-3.5 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
