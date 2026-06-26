"use client";

import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

export function NotificationReadAll() {
  const router = useRouter();

  const handleClick = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" });
    router.refresh();
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 text-xs text-[#6172F3] font-medium"
    >
      <CheckCheck className="h-3.5 w-3.5" />
      모두 읽음
    </button>
  );
}
