import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { SearchContent } from "@/components/search/SearchContent";

export default function SearchPage() {
  return (
    <>
      <Header title="검색" variant="back" />
      <Suspense fallback={<div className="px-4 pt-8 text-center text-[#98A2B3] text-sm">로딩 중...</div>}>
        <SearchContent />
      </Suspense>
    </>
  );
}
