import { redirect } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AdminCertActions } from "@/components/admin/AdminCertActions";

export default async function AdminCertificationsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const certs = await db.certification.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    take: 100,
    include: {
      user: { select: { nickname: true } },
      challenge: { select: { id: true, title: true } },
    },
  });

  return (
    <>
      <Header title="인증 관리" variant="back" />
      <main className="px-4 pt-4 pb-10 max-w-2xl mx-auto">
        <p className="text-sm text-[#667085] mb-4">대기 중인 인증 {certs.length}건</p>
        <div className="space-y-3">
          {certs.map((cert) => (
            <div key={cert.id} className="border border-[#F2F4F7] rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                {cert.photoUrls[0] && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-[#F2F4F7]">
                    <Image src={cert.photoUrls[0]} alt="인증" width={64} height={64} className="object-cover w-full h-full" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#101828] text-sm truncate">{cert.challenge.title}</p>
                  <p className="text-xs text-[#667085] mt-0.5">{cert.user.nickname} · {formatDate(cert.submittedAt)}</p>
                  {cert.url && (
                    <a href={cert.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-[#6172F3] truncate block mt-1 hover:underline">
                      {cert.url}
                    </a>
                  )}
                </div>
                <Badge variant="pending">대기</Badge>
              </div>
              <AdminCertActions certId={cert.id} />
            </div>
          ))}
          {certs.length === 0 && (
            <div className="text-center py-16 text-[#98A2B3]">
              <p>대기 중인 인증이 없어요</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
