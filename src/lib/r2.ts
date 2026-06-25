import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? "challenge-hub";
const CDN_URL = process.env.R2_PUBLIC_URL ?? "http://localhost:3000/placeholder";

export type UploadFolder = "covers" | "certs" | "profiles" | "disputes";

/** 파일을 R2에 업로드하고 공개 CDN URL 반환 */
export async function uploadToR2(
  buffer: Buffer,
  mimeType: string,
  folder: UploadFolder
): Promise<string> {
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
  const key = `${folder}/${uuidv4()}.${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // 공개 읽기 — Cloudflare R2 버킷 설정에서 Public Access 활성화 필요
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${CDN_URL}/${key}`;
}

/** R2에서 파일 삭제 */
export async function deleteFromR2(publicUrl: string): Promise<void> {
  const key = publicUrl.replace(`${CDN_URL}/`, "");
  await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
