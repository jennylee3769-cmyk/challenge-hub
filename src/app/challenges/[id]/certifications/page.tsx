import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface PageProps { params: Promise<{ id: string }> }

export default async function CertificationsPage({ params }: PageProps) {
  const { id } = await params;

  const challenge = await db.challenge.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!challenge) notFound();

  const certs = await db.certification.findMany({
    where: { challengeId: id, status: "APPROVED" },
    orderBy: { submittedAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, nickname: true, profileImageUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return (
    <>
      <Header title="인증 피드" variant="back" />
      <main className="px-4 pt-4 pb-10 max-w-lg mx-auto">
        <p className="text-sm text-[#667085] mb-4">승인된 인증만 표시됩니다</p>
        <div className="space-y-3">
          {certs.map((cert) => (
            <div key={cert.id} className="bg-white border border-[#F2F4F7] rounded-2xl p-4 space-y-3">
              {/* 작성자 */}
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#F2F4F7]">
                  {cert.user.profileImageUrl ? (
                    <Image src={cert.user.profileImageUrl} alt={cert.user.nickname} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#667085]">
                      {cert.user.nickname.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#101828]">{cert.user.nickname}</p>
                  <p className="text-xs text-[#98A2B3]">{formatDate(cert.submittedAt)}</p>
                </div>
                <Badge variant="approved">승인</Badge>
              </div>

              {/* 이미지 */}
              {cert.photoUrls[0] && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#F2F4F7]">
                  <Image src={cert.photoUrls[0]} alt="인증 이미지" fill className="object-cover" />
                </div>
              )}

              {/* 링크 */}
              {cert.url && (
                <a
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-[#6172F3] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="truncate">{cert.url}</span>
                </a>
              )}

              {/* 반응 */}
              <div className="flex items-center gap-4 pt-1 border-t border-[#F2F4F7]">
                <div className="flex items-center gap-1.5 text-sm text-[#667085]">
                  <Heart className="h-4 w-4" />
                  <span>{cert._count.likes}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-[#667085]">
                  <MessageCircle className="h-4 w-4" />
                  <span>{cert._count.comments}</span>
                </div>
              </div>
            </div>
          ))}

          {certs.length === 0 && (
            <div className="text-center py-16 text-[#98A2B3]">
              <p className="text-4xl mb-3">📸</p>
              <p>아직 승인된 인증이 없어요</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
