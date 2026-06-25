"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface Props {
  certDates: string[];    // "YYYY-MM-DD"
  approvedDates: string[];
  challengeId: string;
}

export function CalendarView({ certDates, approvedDates, challengeId }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pad = (n: number) => String(n).padStart(2, "0");
  const toKey = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 hover:bg-[#F2F4F7] rounded-full">
          <ChevronLeft className="h-5 w-5 text-[#344054]" />
        </button>
        <span className="font-semibold text-[#101828]">
          {year}년 {month + 1}월
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-[#F2F4F7] rounded-full">
          <ChevronRight className="h-5 w-5 text-[#344054]" />
        </button>
      </div>

      {/* 요일 */}
      <div className="grid grid-cols-7 mb-2">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-[#98A2B3] py-1">{d}</div>
        ))}
      </div>

      {/* 날짜 */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const key = toKey(day);
          const isApproved = approvedDates.includes(key);
          const isPending = certDates.includes(key) && !isApproved;
          const isToday = key === todayKey;
          const isPast = new Date(key) < today && key !== todayKey;
          const canCertify = isToday;

          return (
            <div key={i} className="aspect-square flex items-center justify-center relative">
              {/* 승인 원 */}
              {isApproved && (
                <div className="absolute inset-0.5 rounded-full bg-[#6172F3]" />
              )}
              {/* 대기 원 */}
              {isPending && (
                <div className="absolute inset-0.5 rounded-full bg-[#FEF0C7] border border-[#F79009]" />
              )}
              {/* 오늘 테두리 */}
              {isToday && !isApproved && !isPending && (
                <div className="absolute inset-0.5 rounded-full border-2 border-[#6172F3]" />
              )}

              <span className={`relative text-xs font-medium z-10 ${
                isApproved ? "text-white" :
                isPending ? "text-[#B54708]" :
                isToday ? "text-[#6172F3]" :
                isPast ? "text-[#98A2B3]" :
                "text-[#344054]"
              }`}>
                {day}
              </span>

              {/* 오늘 인증 버튼 */}
              {canCertify && !isApproved && !isPending && (
                <Link
                  href={`/challenges/${challengeId}/certify`}
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#6172F3] rounded-full flex items-center justify-center z-20"
                >
                  <Plus className="h-2.5 w-2.5 text-white" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
