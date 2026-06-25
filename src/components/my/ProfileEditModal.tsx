"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Camera, AlertCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  currentNickname: string;
  currentImageUrl?: string;
}

export function ProfileEditModal({ currentNickname, currentImageUrl }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(currentNickname);
  const [imageUrl, setImageUrl] = useState(currentImageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("업로드 실패");
      const { url } = await res.json();
      setImageUrl(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) { setError("닉네임을 입력해주세요"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          profileImageUrl: imageUrl || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error === "nickname_taken" ? "이미 사용 중인 닉네임이에요" : (data.error ?? "저장 실패"));
      }
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
      >
        <Pencil className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center sm:items-center" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#101828]">프로필 수정</h2>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-5 w-5 text-[#98A2B3]" />
              </button>
            </div>

            {/* 프로필 사진 */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-20 h-20">
                <div className="w-20 h-20 rounded-2xl bg-[#E0EAFF] overflow-hidden">
                  {imageUrl ? (
                    <Image src={imageUrl} alt="프로필" width={80} height={80} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#6172F3]">
                      {nickname[0]}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#6172F3] rounded-full flex items-center justify-center"
                  disabled={uploading}
                >
                  <Camera className="h-3.5 w-3.5 text-white" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              {uploading && <p className="text-xs text-[#667085]">업로드 중...</p>}
            </div>

            {/* 닉네임 */}
            <Input
              label="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              required
            />

            {error && (
              <div className="flex items-center gap-2 bg-[#FEE4E2] rounded-xl p-3">
                <AlertCircle className="h-4 w-4 text-[#F04438]" />
                <p className="text-sm text-[#B42318]">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="secondary" size="full" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button size="full" onClick={handleSave} loading={saving}>
                저장하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
