"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, ImagePlus, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import type { ChannelType } from "@/types";

interface Props {
  challengeId: string;
  participationId: string;
  channelType: ChannelType;
  requiredHashtags: string[];
  alreadyCertified: boolean;
}

export function CertifyForm({
  challengeId, participationId, channelType, requiredHashtags, alreadyCertified,
}: Props) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (alreadyCertified) {
    return (
      <div className="px-4 pt-8 text-center">
        <div className="w-16 h-16 bg-[#D1FADF] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-[#12B76A]" />
        </div>
        <h2 className="text-xl font-bold text-[#101828] mb-2">오늘 인증 완료!</h2>
        <p className="text-[#667085] mb-6">오늘의 인증이 이미 제출됐어요.<br />내일 다시 돌아오세요 💪</p>
        <Button variant="secondary" onClick={() => router.back()} className="w-full">
          챌린지로 돌아가기
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    setError("");

    // 링크 형식 검증
    if (channelType !== "FREE" && url) {
      try { new URL(url); } catch {
        setError("올바른 URL 형식이 아닙니다");
        return;
      }
    }

    if (channelType !== "FREE" && !url) {
      setError("링크를 입력해주세요");
      return;
    }

    // 필수 해시태그 확인 (memo 포함 여부 검사)
    const missingTags = requiredHashtags.filter((tag) =>
      !memo.includes(`#${tag}`) && !url.includes(tag)
    );
    if (missingTags.length > 0) {
      setError(`메모에 필수 해시태그를 포함해주세요: ${missingTags.map(t => `#${t}`).join(", ")}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/challenges/${challengeId}/certifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participationId,
          submitType: url ? "LINK" : "PHOTO",
          url: url || undefined,
          memo,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "제출 실패");
      }

      router.push(`/challenges/${challengeId}?certified=1`);
    } catch (err: any) {
      setError(err.message ?? "인증 제출에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-5 space-y-6">
      {/* 안내 */}
      <div className="bg-[#F0F4FF] rounded-xl p-4">
        <h3 className="font-semibold text-[#3538CD] mb-1">인증 방법</h3>
        <ul className="text-sm text-[#4A54C0] space-y-1">
          {channelType === "BLOG" && (
            <>
              <li>• 오늘 작성한 블로그 게시물 URL을 입력하세요</li>
              <li>• 포스팅 날짜가 오늘이어야 합니다</li>
            </>
          )}
          {channelType === "YOUTUBE" && (
            <>
              <li>• 오늘 업로드한 유튜브 영상 URL을 입력하세요</li>
              <li>• Shorts도 인정됩니다</li>
            </>
          )}
          {channelType === "FREE" && (
            <li>• 오늘의 활동을 자유롭게 기록해주세요</li>
          )}
          {requiredHashtags.length > 0 && (
            <li className="font-medium">• 필수 태그: {requiredHashtags.map(t => `#${t}`).join(" ")}</li>
          )}
        </ul>
      </div>

      {/* URL 입력 */}
      {channelType !== "FREE" && (
        <Input
          label={channelType === "BLOG" ? "블로그 게시물 URL" : "유튜브 영상 URL"}
          required
          type="url"
          placeholder={channelType === "BLOG" ? "https://blog.naver.com/..." : "https://youtu.be/..."}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          prefix={<Link2 className="h-4 w-4" />}
        />
      )}

      {/* 메모 */}
      <Textarea
        label="오늘의 한마디"
        placeholder={`오늘 활동을 간단히 기록해주세요${requiredHashtags.length > 0 ? `\n(필수: ${requiredHashtags.map(t => `#${t}`).join(" ")})` : ""}`}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        rows={3}
        showCount
        maxLength={200}
      />

      {/* 에러 */}
      {error && (
        <div className="flex items-start gap-2 bg-[#FEE4E2] rounded-xl p-3">
          <AlertCircle className="h-4 w-4 text-[#F04438] shrink-0 mt-0.5" />
          <p className="text-sm text-[#B42318]">{error}</p>
        </div>
      )}

      <Button size="full" onClick={handleSubmit} loading={loading}>
        인증 제출하기
      </Button>

      <p className="text-xs text-center text-[#98A2B3]">
        허위 인증 적발 시 상금 수령이 취소되고 불이익이 발생할 수 있습니다
      </p>
    </div>
  );
}
