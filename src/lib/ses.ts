import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: process.env.AWS_REGION ?? "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const FROM = process.env.SES_FROM_EMAIL ?? "noreply@challengehub.kr";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.log(`[DEV] Email to ${to}: ${subject}`);
    return;
  }
  await ses.send(
    new SendEmailCommand({
      Source: FROM,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: { Html: { Data: html, Charset: "UTF-8" } },
      },
    })
  );
}

// ── 이메일 템플릿 ───────────────────────────────────────────

export async function sendChallengeJoinConfirm(params: {
  to: string; nickname: string; challengeTitle: string; challengeId: string;
}) {
  await sendEmail({
    to: params.to,
    subject: `[챌린지허브] '${params.challengeTitle}' 참가가 확정됐어요!`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#6172F3">챌린지허브</h2>
        <p>안녕하세요, <b>${params.nickname}</b>님!</p>
        <p><b>'${params.challengeTitle}'</b> 챌린지 참가가 확정됐어요 🎉</p>
        <p>챌린지 시작일에 맞춰 첫 인증을 제출해주세요.</p>
        <a href="${APP_URL}/challenges/${params.challengeId}"
           style="display:inline-block;background:#6172F3;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
          챌린지 보러가기
        </a>
      </div>`,
  });
}

export async function sendCertRejected(params: {
  to: string; nickname: string; challengeTitle: string;
  certId: string; rejectReason: string;
}) {
  await sendEmail({
    to: params.to,
    subject: `[챌린지허브] 인증이 반려됐어요 — '${params.challengeTitle}'`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#6172F3">챌린지허브</h2>
        <p>안녕하세요, <b>${params.nickname}</b>님!</p>
        <p><b>'${params.challengeTitle}'</b> 챌린지 인증이 반려됐어요.</p>
        <p>사유: <b>${params.rejectReason}</b></p>
        <p>오늘 자정 전까지 재인증을 제출할 수 있어요.</p>
      </div>`,
  });
}

export async function sendSettlementComplete(params: {
  to: string; nickname: string; challengeTitle: string;
  grossAmount: number; taxAmount: number; netAmount: number;
}) {
  const fmt = (n: number) => n.toLocaleString("ko-KR") + "원";
  await sendEmail({
    to: params.to,
    subject: `[챌린지허브] 상금이 입금됐어요 — '${params.challengeTitle}'`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#6172F3">챌린지허브</h2>
        <p>안녕하세요, <b>${params.nickname}</b>님!</p>
        <p><b>'${params.challengeTitle}'</b> 상금이 입금됐어요 🏆</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px">
          <tr><td style="padding:8px;border-bottom:1px solid #eee">총 상금</td><td style="text-align:right">${fmt(params.grossAmount)}</td></tr>
          ${params.taxAmount > 0 ? `<tr><td style="padding:8px;border-bottom:1px solid #eee">원천징수(22%)</td><td style="text-align:right;color:#F04438">-${fmt(params.taxAmount)}</td></tr>` : ""}
          <tr><td style="padding:8px;font-weight:bold">실수령액</td><td style="text-align:right;font-weight:bold;color:#6172F3">${fmt(params.netAmount)}</td></tr>
        </table>
      </div>`,
  });
}
