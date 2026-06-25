"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, MessageCircle, Send, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  createdAt: string | Date;
  user: { id: string; nickname: string; profileImageUrl: string | null };
}

interface FeedItem {
  id: string;
  photoUrls: string[];
  caption: string | null;
  submittedAt: string | Date;
  likeCount: number;
  isLiked: boolean;
  user: { id: string; nickname: string; profileImageUrl: string | null };
  comments: Comment[];
}

interface Props {
  certifications: FeedItem[];
  currentUserId?: string;
}

function CertCard({ cert, currentUserId }: { cert: FeedItem; currentUserId?: string }) {
  const [liked, setLiked] = useState(cert.isLiked);
  const [likeCount, setLikeCount] = useState(cert.likeCount);
  const [comments, setComments] = useState<Comment[]>(cert.comments);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLike = async () => {
    if (!currentUserId) return;
    const prev = { liked, likeCount };
    setLiked(!liked);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      await fetch(`/api/certifications/${cert.id}/like`, {
        method: liked ? "DELETE" : "POST",
      });
    } catch {
      setLiked(prev.liked);
      setLikeCount(prev.likeCount);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUserId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/certifications/${cert.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((c) => [...c, newComment]);
        setCommentText("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await fetch(`/api/certifications/${cert.id}/comments/${commentId}`, { method: "DELETE" });
    setComments((c) => c.filter((x) => x.id !== commentId));
  };

  return (
    <div className="bg-white border border-[#F2F4F7] rounded-2xl overflow-hidden">
      {/* 유저 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className="w-9 h-9 rounded-xl bg-[#E0EAFF] overflow-hidden shrink-0">
          {cert.user.profileImageUrl ? (
            <Image src={cert.user.profileImageUrl} alt={cert.user.nickname} width={36} height={36} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#6172F3]">
              {cert.user.nickname[0]}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#101828]">{cert.user.nickname}</p>
          <p className="text-xs text-[#98A2B3]">{formatDate(cert.submittedAt)}</p>
        </div>
      </div>

      {/* 사진 */}
      {cert.photoUrls[0] && (
        <div className="relative aspect-square w-full bg-[#F9FAFB]">
          <Image
            src={cert.photoUrls[0]}
            alt="인증 사진"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 640px"
          />
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center gap-4 px-4 pt-3 pb-1">
        <button
          type="button"
          onClick={handleLike}
          disabled={!currentUserId}
          className="flex items-center gap-1.5"
        >
          <Heart
            className={`h-5 w-5 transition-colors ${liked ? "fill-[#F04438] text-[#F04438]" : "text-[#667085]"}`}
          />
          <span className="text-sm text-[#667085]">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5"
        >
          <MessageCircle className="h-5 w-5 text-[#667085]" />
          <span className="text-sm text-[#667085]">{comments.length}</span>
        </button>
      </div>

      {/* 캡션 */}
      {cert.caption && (
        <p className="px-4 py-1 text-sm text-[#344054]">
          <span className="font-semibold">{cert.user.nickname}</span>{" "}
          {cert.caption}
        </p>
      )}

      {/* 댓글 */}
      {showComments && (
        <div className="px-4 pb-3 space-y-2 mt-2">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2 group">
              <p className="flex-1 text-sm text-[#344054]">
                <span className="font-semibold">{c.user.nickname}</span>{" "}
                {c.content}
              </p>
              {(c.user.id === currentUserId) && (
                <button
                  type="button"
                  onClick={() => handleDeleteComment(c.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5 text-[#98A2B3]" />
                </button>
              )}
            </div>
          ))}

          {currentUserId && (
            <form onSubmit={handleComment} className="flex items-center gap-2 mt-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글 추가..."
                maxLength={300}
                className="flex-1 text-sm bg-[#F9FAFB] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#6172F3]"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="w-8 h-8 bg-[#6172F3] rounded-xl flex items-center justify-center disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function CertificationFeed({ certifications, currentUserId }: Props) {
  if (certifications.length === 0) {
    return (
      <div className="text-center py-16 text-[#98A2B3]">
        <p className="text-sm">아직 인증이 없어요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {certifications.map((cert) => (
        <CertCard key={cert.id} cert={cert} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
