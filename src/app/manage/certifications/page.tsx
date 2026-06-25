"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ExternalLink, CheckCircle, XCircle, Clock, ChevronDown } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

interface Cert {
  id: string;
  status: string;
  url: string | null;
  photoUrls: string[];
  memo: string | null;
  createdAt: string;
  user: { nickname: string; profileImageUrl: string | null };
  challenge: { id: string; title: string };
}

const REJECT_CODES = [
  { code: "R001", label: "오늘 날짜의 콘텐츠가 아님" },
  { code: "R002", label: "URL이 유효하지 않음" },
  { code: "R003", label: "필수 해시태그 미포함" },
  { code: "R004", label: "중복 인증" },
  { code: "R005", label: "챌린지 내용과 무관" },
  { code: "R006", label: "이미지 품질 불량" },
];

export default function ManageCertificationsPage() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectCode, setRejectCode] = useState("R001");

  const fetchCerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/manage/certifications?status=${filter}`);
      if (res.ok) setCerts(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCerts(); }, [filter]);

  const handleReview = async (certId: string, action: "APPROVE" | "REJECT") => {
    const res = await fetch(`/api/certifications/${certId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rejectCode: action === "REJECT" ? rejectCode : undefined }),
    });
    if (res.ok) {
      setCerts((prev) => prev.filter((c) => c.id !== certId));
      setReviewingId(null);
    }
  };

  const tabs = [
    { key: "PENDING", label: "대기", icon: <Clock className="h-4 w-4" /> },
    { key: "APPROVED", label: "승인", icon: <CheckCircle className="h-4 w-4" /> },
    { key: "REJECTED", label: "반려", icon: <XCircle className="h-4 w-4" /> },
  ] as const;

  return (
    <>
      <Header title="인증 관리" variant="back" />
      <main className="max-w-lg mx-auto pb-10">
        {/* 탭 */}
        <div className="flex border-b border-[#F2F4F7] px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                filter === tab.key
                  ? "border-[#6172F3] text-[#6172F3]"
                  : "border-transparent text-[#667085]"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-4 pt-4 space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-[#F2F4F7] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : certs.length === 0 ? (
            <div className="text-center py-16 text-[#98A2B3]">
              <p className="text-4xl mb-3">✅</p>
              <p>{filter === "PENDING" ? "검토할 인증이 없어요" : "해당 인증이 없어요"}</p>
            </div>
          ) : (
            certs.map((cert) => (
              <div key={cert.id} className="border border-[#F2F4F7] rounded-2xl overflow-hidden">
                {/* 인증 이미지 */}
                {cert.photoUrls[0] && (
                  <div className="relative w-full aspect-video bg-[#F2F4F7]">
                    <Image src={cert.photoUrls[0]} alt="인증" fill className="object-cover" />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#101828]">{cert.user.nickname}</p>
                      <p className="text-xs text-[#98A2B3]">{cert.challenge.title}</p>
                      <p className="text-xs text-[#98A2B3]">{formatDateTime(cert.createdAt)}</p>
                    </div>
                  </div>

                  {/* 메모 */}
                  {cert.memo && <p className="text-sm text-[#344054]">{cert.memo}</p>}

                  {/* URL */}
                  {cert.url && (
                    <a
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-[#6172F3] hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{cert.url}</span>
                    </a>
                  )}

                  {/* 대기 중 → 검토 버튼 */}
                  {filter === "PENDING" && (
                    <>
                      {reviewingId === cert.id ? (
                        <div className="space-y-3 pt-2">
                          {/* 반려 코드 선택 */}
                          <div className="relative">
                            <select
                              value={rejectCode}
                              onChange={(e) => setRejectCode(e.target.value)}
                              className="w-full appearance-none bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-4 py-2.5 text-sm text-[#344054] pr-8"
                            >
                              {REJECT_CODES.map((r) => (
                                <option key={r.code} value={r.code}>{r.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-[#667085] pointer-events-none" />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleReview(cert.id, "REJECT")}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> 반려
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="flex-1"
                              onClick={() => setReviewingId(null)}
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleReview(cert.id, "APPROVE")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" /> 승인
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => setReviewingId(cert.id)}
                          >
                            반려
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
