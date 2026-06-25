"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, ImagePlus, X } from "lucide-react";

interface Props {
  challenge: {
    id: string;
    title: string;
    description: string;
    coverImageUrl: string | null;
    hashtags: string[];
    status: string;
    requiredHashtags: string[];
    certDailyDeadline: string;
  };
}

export function ChallengeEditForm({ challenge }: Props) {
  const router = useRouter();
  const isInProgress = challenge.status === "IN_PROGRESS";

  const [title, setTitle] = useState(challenge.title);
  const [description, setDescription] = useState(challenge.description);
  const [coverImageUrl, setCoverImageUrl] = useState(challenge.coverImageUrl ?? "");
  const [hashtags, setHashtags] = useState(challenge.hashtags.join(", "));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "covers");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("업로드 실패");
      const { url } = await res.json();
      setCoverImageUrl(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const data: Record<string, any> = { description, coverImageUrl: coverImageUrl || null };
    if (!isInProgress) {
      data.title = title;
      data.hashtags = hashtags.split(",").map((h) => h.trim()).filter(Boolean);
    }

    try {
      const res = await fetch(`/api/challenges/${challenge.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "수정 실패");
      }
      setSuccess(true);
      setTimeout(() => router.push(`/manage/challenges/${challenge.id}`), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 bg-[#ECFDF3] rounded-2xl p-5">
        <CheckCircle className="h-6 w-6 text-[#12B76A]" />
        <div>
          <p className="font-semibold text-[#027A48]">수정이 완료됐어요!</p>
          <p className="text-sm text-[#027A48]">잠시 후 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isInProgress && (
        <div className="flex items-start gap-2 bg-[#FFFAEB] border border-[#FDB022]/30 rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-[#F79009] shrink-0 mt-0.5" />
          <p className="text-sm text-[#B54708]">
            진행 중인 챌린지는 설명과 커버 이미지만 수정할 수 있습니다
          </p>
        </div>
      )}

      {!isInProgress && (
        <Input
          label="챌린지 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={50}
        />
      )}

      {/* 커버 이미지 */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-[#344054]">커버 이미지</p>
        {coverImageUrl ? (
          <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#F2F4F7]">
            <img src={coverImageUrl} alt="커버" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setCoverImageUrl("")}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#D0D5DD] rounded-2xl cursor-pointer hover:border-[#6172F3] transition-colors">
            <ImagePlus className="h-8 w-8 text-[#98A2B3] mb-2" />
            <span className="text-sm text-[#667085]">{uploading ? "업로드 중..." : "이미지 선택"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        )}
      </div>

      <Textarea
        label="챌린지 설명"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        rows={6}
        maxLength={1000}
        showCount
      />

      {!isInProgress && (
        <Input
          label="해시태그 (쉼표로 구분)"
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="#운동, #매일, #챌린지"
          hint="예: #운동, #매일챌린지"
        />
      )}

      {error && (
        <div className="flex items-center gap-2 bg-[#FEE4E2] rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-[#F04438]" />
          <p className="text-sm text-[#B42318]">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="secondary" size="full" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" size="full" loading={loading}>
          저장하기
        </Button>
      </div>
    </form>
  );
}
