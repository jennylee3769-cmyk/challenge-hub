import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { CertificationFeed } from "@/components/certification/CertificationFeed";

interface PageProps { params: Promise<{ id: string }> }

export default async function CertificationsPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

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
      comments: {
        where: { isDeleted: false },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, nickname: true, profileImageUrl: true } } },
      },
      _count: { select: { likes: true } },
      likes: user ? { where: { userId: user.id }, select: { id: true } } : false,
    },
  });

  const feedItems = certs.map((c) => ({
    id: c.id,
    photoUrls: c.photoUrls,
    caption: null,
    submittedAt: c.submittedAt,
    likeCount: c._count.likes,
    isLiked: user ? c.likes.length > 0 : false,
    user: c.user,
    comments: c.comments.map((cm) => ({
      id: cm.id,
      content: cm.content,
      createdAt: cm.createdAt,
      user: cm.user,
    })),
  }));

  return (
    <>
      <Header title="인증 피드" variant="back" />
      <main className="px-4 pt-4 pb-10 max-w-lg mx-auto">
        <p className="text-sm text-[#667085] mb-4">승인된 인증만 표시됩니다</p>
        <CertificationFeed certifications={feedItems} currentUserId={user?.id} />
      </main>
    </>
  );
}
