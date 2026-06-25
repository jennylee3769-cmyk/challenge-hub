"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  hint?: string;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, suffix, prefix, id, ...props }, ref) => {
    const inputId = id ?? React.useId();

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#344054]"
          >
            {label}
            {props.required && <span className="text-[#F04438] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div className="absolute left-3 text-[#667085]">{prefix}</div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "h-11 w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-[#101828] transition-colors",
              "placeholder:text-[#98A2B3]",
              "border-[#D0D5DD]",
              "focus:border-[#6172F3] focus:outline-none focus:ring-4 focus:ring-[#E0EAFF]",
              "disabled:bg-[#F9FAFB] disabled:text-[#98A2B3] disabled:cursor-not-allowed",
              error && "border-[#F04438] focus:border-[#F04438] focus:ring-[#FEE4E2]",
              prefix && "pl-10",
              suffix && "pr-12",
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 text-[#667085] text-sm">{suffix}</div>
          )}
        </div>
        {error && (
          <p className="text-sm text-[#F04438]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-[#667085]">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, showCount, maxLength, id, value, ...props }, ref) => {
    const textareaId = id ?? React.useId();
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-[#344054]"
          >
            {label}
            {props.required && <span className="text-[#F04438] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          value={value}
          maxLength={maxLength}
          className={cn(
            "w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-[#101828] transition-colors resize-none",
            "placeholder:text-[#98A2B3]",
            "border-[#D0D5DD]",
            "focus:border-[#6172F3] focus:outline-none focus:ring-4 focus:ring-[#E0EAFF]",
            "disabled:bg-[#F9FAFB] disabled:text-[#98A2B3] disabled:cursor-not-allowed",
            error && "border-[#F04438] focus:ring-[#FEE4E2]",
            className
          )}
          {...props}
        />
        <div className="flex justify-between">
          <div>
            {error && <p className="text-sm text-[#F04438]">{error}</p>}
            {hint && !error && <p className="text-sm text-[#667085]">{hint}</p>}
          </div>
          {showCount && maxLength && (
            <p className="text-xs text-[#98A2B3]">
              {currentLength}/{maxLength}자
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
