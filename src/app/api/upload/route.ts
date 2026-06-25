import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadToR2, type UploadFolder } from "@/lib/r2";
import sharp from "sharp";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as UploadFolder) ?? "certs";

  if (!file) return NextResponse.json({ error: "file_required" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "file_too_large", maxMB: 10 }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  // sharp로 리사이즈 + 최적화
  const maxWidth = folder === "covers" ? 1200 : folder === "profiles" ? 400 : 1080;
  const outputBuffer = await sharp(inputBuffer)
    .resize(maxWidth, undefined, { withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  const url = await uploadToR2(outputBuffer, "image/jpeg", folder);
  return NextResponse.json({ url }, { status: 201 });
}
