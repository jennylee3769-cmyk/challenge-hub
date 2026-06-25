"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORTS = [
  { key: "recent", label: "최신순" },
  { key: "popular", label: "인기순" },
  { key: "prize", label: "상금 높은순" },
];

export function SortSelect({ current }: { current?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    router.push(`/challenges?${params.toString()}`);
  };

  return (
    <select
      className="text-sm text-[#344054] border border-[#D0D5DD] rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#6172F3] shrink-0"
      value={current ?? "recent"}
      onChange={handleChange}
    >
      {SORTS.map((s) => (
        <option key={s.key} value={s.key}>{s.label}</option>
      ))}
    </select>
  );
}
