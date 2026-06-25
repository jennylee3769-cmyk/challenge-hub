"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, PlusCircle, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  managerOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/", label: "홈", icon: Home },
  { href: "/challenges", label: "챌린지", icon: Trophy },
  { href: "/challenges/new", label: "만들기", icon: PlusCircle, managerOnly: true },
  { href: "/manage", label: "관리", icon: ClipboardList, managerOnly: true },
  { href: "/my", label: "내 정보", icon: User },
];

interface BottomNavProps {
  role?: "USER" | "MANAGER" | "ADMIN" | null;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const isManager = role === "MANAGER" || role === "ADMIN";

  const visibleItems = navItems.filter(
    (item) => !item.managerOnly || isManager
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EAECF0] pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[52px]",
                isActive
                  ? "text-[#6172F3]"
                  : "text-[#98A2B3] hover:text-[#667085]"
              )}
            >
              <Icon
                className={cn("h-6 w-6", item.href === "/challenges/new" && "h-7 w-7")}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  item.href === "/challenges/new" && "text-[#6172F3] text-[10px]"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
