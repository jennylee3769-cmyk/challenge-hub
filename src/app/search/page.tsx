"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Trophy, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";

interface Challenge {
  id: string;
  title: string;
  coverImageUrl: string | null;
  channelType: string;
  status: string;
  entryFee: number;
  _count: { participations: number };
}

const CHANNEL_LABELS: Record<string, string> = {
  BLOG: "블로그", YOUTUBE: "유튜브", INSTAGRAM: "인스타그램",
  TIKTOK: "틱톡", X: "X", THREAD: "스레드",
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("search_history");
    if (saved) setHistory(JSON.parse(saved));
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) { setQuery(q); doSearch(q); }
  }, [searchParams]);

  const doSearch = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges?q=${encodeURIComponent(q)}&limit=20`);
      const data = await res.json();
      setResults(data.challenges ?? data ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const next = [query, ...history.filter((h) => h !== query)].slice(0, 8);
    setHistory(next);
    localStorage.setItem("search_history", JSON.stringify(next));
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const removeHistory = (item: string) => {
    const next = history.filter((h) => h !== item);
    setHistory(next);
    localStorage.setItem("search_history", JSON.stringify(next));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("search_history");
  };

  const hasQuery = !!searchParams.get("q");

  return (
    <>
      <Header title="검색" variant="back" />
      <main className="px-4 pt-3 pb-10 max-w-lg mx-auto">
        {/* 검색 입력 */}
        <form onSubmit={handleSubmit} className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#98A2B3]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="챌린지 검색..."
            className="w-full bg-[#F9FAFB] border border-[#F2F4F7] rounded-2xl pl-10 pr-10 py-3 text-sm text-[#101828] outline-none focus:ring-2 focus:ring-[#6172F3]"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setResults([]); }}
              className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-[#98A2B3]" />
            </button>
          )}
        </form>

        {/* 검색 결과 */}
        {hasQuery && (
          <>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map((i) => (
                  <div key={i} className="h-20 bg-[#F2F4F7] rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 text-[#98A2B3]">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">검색 결과가 없어요</p>
                <p className="text-sm mt-1">다른 키워드로 시도해보세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#667085]">검색 결과 {results.length}개</p>
                {results.map((c) => (
                  <Link key={c.id} href={`/challenges/${c.id}`}>
                    <div className="flex items-center gap-3 p-3 border border-[#F2F4F7] rounded-2xl hover:border-[#6172F3] transition-colors">
                      <div className="w-14 h-14 rounded-xl bg-[#E0EAFF] overflow-hidden shrink-0">
                        {c.coverImageUrl ? (
                          <Image src={c.coverImageUrl} alt={c.title} width={56} height={56} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-[#6172F3]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#101828] truncate">{c.title}</p>
                        <p className="text-xs text-[#667085] mt-0.5">
                          {CHANNEL_LABELS[c.channelType] ?? c.channelType} · {c._count.participations}명 참가
                        </p>
                        <p className="text-xs text-[#6172F3] font-medium mt-0.5">
                          {c.entryFee.toLocaleString()}원
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {/* 최근 검색어 */}
        {!hasQuery && history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#344054]">최근 검색어</p>
              <button onClick={clearHistory} className="text-xs text-[#98A2B3]">전체 삭제</button>
            </div>
            <div className="space-y-1">
              {history.map((h) => (
                <div key={h} className="flex items-center justify-between py-2.5">
                  <button onClick={() => { setQuery(h); router.push(`/search?q=${encodeURIComponent(h)}`); }}
                    className="flex items-center gap-3 flex-1 text-left">
                    <Clock className="h-4 w-4 text-[#98A2B3] shrink-0" />
                    <span className="text-sm text-[#344054]">{h}</span>
                  </button>
                  <button onClick={() => removeHistory(h)}>
                    <X className="h-4 w-4 text-[#D0D5DD]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 초기 상태 */}
        {!hasQuery && history.length === 0 && (
          <div className="text-center py-16 text-[#98A2B3]">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">챌린지 이름, 채널 유형으로 검색하세요</p>
          </div>
        )}
      </main>
    </>
  );
}
