"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[#FEE4E2] transition-colors w-full text-left disabled:opacity-50"
    >
      <div className="w-9 h-9 bg-[#FEE4E2] rounded-xl flex items-center justify-center shrink-0">
        <LogOut className="h-4 w-4 text-[#F04438]" />
      </div>
      <span className="flex-1 text-[#F04438] font-medium">로그아웃</span>
    </button>
  );
}
