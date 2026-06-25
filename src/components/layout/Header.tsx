"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Search, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  variant?: "home" | "back" | "plain" | "transparent";
  title?: string;
  showSearch?: boolean;
  showNotification?: boolean;
  showSettings?: boolean;
  onBack?: () => void;
  className?: string;
  rightSlot?: React.ReactNode;
}

export function Header({
  variant = "plain",
  title,
  showSearch,
  showNotification,
  showSettings,
  onBack,
  className,
  rightSlot,
}: HeaderProps) {
  const router = useRouter();

  if (variant === "home") {
    return (
      <header className={cn("sticky top-0 z-40 bg-white border-b border-[#EAECF0]", className)}>
        <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-xl font-bold text-[#6172F3]">챌린지허브</span>
          </Link>
          <div className="flex items-center gap-1">
            {showSearch && (
              <Link
                href="/search"
                className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[#F2F4F7] text-[#344054]"
              >
                <Search className="h-5 w-5" />
              </Link>
            )}
            {showNotification && (
              <Link
                href="/notifications"
                className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[#F2F4F7] text-[#344054] relative"
              >
                <Bell className="h-5 w-5" />
                {/* 알림 뱃지 - 서버에서 렌더링 */}
                <span className="absolute top-2 right-2 h-2 w-2 bg-[#F04438] rounded-full" />
              </Link>
            )}
            {showSettings && (
              <Link
                href="/settings"
                className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[#F2F4F7] text-[#344054]"
              >
                <Settings className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }

  if (variant === "transparent") {
    return (
      <header className={cn("absolute top-0 left-0 right-0 z-40", className)}>
        <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
          <button
            onClick={onBack ?? (() => router.back())}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm text-[#344054]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          {rightSlot}
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-white border-b border-[#EAECF0]",
        className
      )}
    >
      <div className="max-w-lg mx-auto flex items-center h-14 px-4 gap-2">
        {variant === "back" && (
          <button
            onClick={onBack ?? (() => router.back())}
            className="h-10 w-10 -ml-2 flex items-center justify-center rounded-xl hover:bg-[#F2F4F7] text-[#344054]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        {title && (
          <h1 className="flex-1 text-lg font-semibold text-[#101828] truncate">
            {title}
          </h1>
        )}
        {rightSlot && <div className="ml-auto">{rightSlot}</div>}
      </div>
    </header>
  );
}
