import { notFound } from "next/navigation";
import Image from "next/image";
import { Trophy, Medal } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { db } from "@/lib/db";

interface PageProps { params: Promise<{ id: string }> }

export default async function RankingPage({ params }: PageProps) {
  const { id } = await params;

  const challenge = await db.challenge.findUnique({
    where: { id },
    select: { id: true, title: true, status: true },
  });
  if (!challenge) notFound();

  const participants = await db.participation.findMany({
    where: { challengeId: id },
    orderBy: [{ certCount: "desc" }, { joinedAt: "asc" }],
    include: { user: { select: { id: true, nickname: true, profileImageUrl: true } } },
  });

  const rankColors = ["text-[#F79009]", "text-[#98A2B3]", "text-[#B54708]"];
  const rankIcons = [
    <Trophy key="1" className="h-5 w-5 text-[#F79009]" />,
    <Medal key="2" className="h-5 w-5 text-[#98A2B3]" />,
    <Medal key="3" className="h-5 w-5 text-[#B54708]" />,
  ];

  return (
    <>
      <Header title="랭킹" variant="back" />
      <main className="px-4 pt-4 pb-10 max-w-lg mx-auto">
        <p className="text-sm text-[#667085] mb-4">인증 횟수 기준 순위 (동률 시 먼저 참가한 순)</p>
        <div className="space-y-2">
          {participants.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-2xl ${i < 3 ? "bg-[#F9FAFB]" : ""}`}
            >
              <div className="w-8 flex items-center justify-center">
                {i < 3 ? rankIcons[i] : (
                  <span className={`text-sm font-bold text-[#667085]`}>{i + 1}</span>
                )}
              </div>
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#F2F4F7] shrink-0">
                {p.user.profileImageUrl ? (
                  <Image src={p.user.profileImageUrl} alt={p.user.nickname} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#667085] text-sm font-bold">
                    {p.user.nickname.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#101828] truncate">{p.user.nickname}</p>
                <p className="text-xs text-[#667085]">
                  {p.status === "WITHDRAWN" ? "탈퇴" : p.status === "FAILED" ? "실패" : ""}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${i < 3 ? rankColors[i] : "text-[#344054]"}`}>
                  {p.certCount}
                </p>
                <p className="text-xs text-[#98A2B3]">인증</p>
              </div>
            </div>
          ))}
          {participants.length === 0 && (
            <div className="text-center py-12 text-[#98A2B3]">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>아직 참가자가 없어요</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
