import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 관리자 계정
  const admin = await db.user.upsert({
    where: { email: "admin@challengehub.kr" },
    update: {},
    create: {
      socialProvider: "kakao",
      socialId: "admin-seed-001",
      email: "admin@challengehub.kr",
      nickname: "챌린지허브 관리자",
      role: "ADMIN",
    },
  });

  // 매니저 계정
  const manager = await db.user.upsert({
    where: { email: "manager@challengehub.kr" },
    update: {},
    create: {
      socialProvider: "kakao",
      socialId: "manager-seed-001",
      email: "manager@challengehub.kr",
      nickname: "열정 매니저",
      role: "MANAGER",
    },
  });

  // 일반 사용자
  const users = await Promise.all(
    ["김챌린저", "이블로거", "박유튜버", "최인스타", "정틱톡커"].map((nickname, i) =>
      db.user.upsert({
        where: { email: `user${i + 1}@challengehub.kr` },
        update: {},
        create: {
          socialProvider: "google",
          socialId: `user-seed-00${i + 1}`,
          email: `user${i + 1}@challengehub.kr`,
          nickname,
          role: "USER",
        },
      })
    )
  );

  console.log(`✓ Users: ${users.length + 2} created`);

  // 챌린지 1 — 모집 중
  const challenge1 = await db.challenge.upsert({
    where: { id: "seed-challenge-001" },
    update: {},
    create: {
      id: "seed-challenge-001",
      managerId: manager.id,
      title: "30일 매일 블로그 챌린지",
      description: "30일 동안 매일 블로그 포스팅하고 상금을 받아가세요! 운동, 독서, 요리 등 어떤 주제든 OK.",
      channelType: "BLOG",
      category: "SELF_IMPROVEMENT",
      entryFee: 10000,
      managerFeePct: 10,
      rewardModel: "TOP_N",
      topN: 3,
      certFrequency: "DAILY",
      certDailyDeadline: "23:59",
      certMethod: "URL",
      requiredHashtags: ["#30일챌린지", "#매일블로그"],
      status: "RECRUITING",
      isPublic: true,
      maxParticipants: 50,
      startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000),
      recruitEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  // 챌린지 2 — 진행 중
  const challenge2 = await db.challenge.upsert({
    where: { id: "seed-challenge-002" },
    update: {},
    create: {
      id: "seed-challenge-002",
      managerId: manager.id,
      title: "유튜브 쇼츠 7일 챌린지",
      description: "7일 동안 매일 유튜브 쇼츠 1개 업로드! 시청 시간 늘리고 구독자도 늘려보세요.",
      channelType: "YOUTUBE",
      category: "CONTENT",
      entryFee: 5000,
      managerFeePct: 5,
      rewardModel: "ALL_SUCCESS",
      certFrequency: "DAILY",
      certDailyDeadline: "23:59",
      certMethod: "URL",
      requiredHashtags: ["#쇼츠챌린지"],
      status: "IN_PROGRESS",
      isPublic: true,
      maxParticipants: 100,
      startsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      recruitEndsAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  // 챌린지 3 — 모집 중 (인스타)
  const challenge3 = await db.challenge.upsert({
    where: { id: "seed-challenge-003" },
    update: {},
    create: {
      id: "seed-challenge-003",
      managerId: manager.id,
      title: "인스타 일상 사진 14일 챌린지",
      description: "14일 동안 매일 인스타그램에 일상 사진을 올려보세요. 꾸준함이 습관이 됩니다!",
      channelType: "INSTAGRAM",
      category: "LIFESTYLE",
      entryFee: 8000,
      managerFeePct: 8,
      rewardModel: "ALL_SUCCESS",
      certFrequency: "DAILY",
      certDailyDeadline: "22:00",
      certMethod: "PHOTO",
      requiredHashtags: ["#일상챌린지", "#인스타챌린지"],
      status: "RECRUITING",
      isPublic: true,
      maxParticipants: 30,
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      recruitEndsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("✓ Challenges: 3 created");

  // 참가자 추가 (challenge2는 진행 중)
  for (const user of users.slice(0, 4)) {
    await db.participation.upsert({
      where: { challengeId_userId: { challengeId: challenge2.id, userId: user.id } },
      update: {},
      create: {
        challengeId: challenge2.id,
        userId: user.id,
        status: "ACTIVE",
        paidAmount: 5000,
        pgPaymentKey: `seed-payment-${user.id}`,
        pgOrderId: `seed-order-${user.id}`,
      },
    });
  }

  // challenge1 모집 중 참가자 2명
  for (const user of users.slice(0, 2)) {
    await db.participation.upsert({
      where: { challengeId_userId: { challengeId: challenge1.id, userId: user.id } },
      update: {},
      create: {
        challengeId: challenge1.id,
        userId: user.id,
        status: "ACTIVE",
        paidAmount: 10000,
        pgPaymentKey: `seed-payment2-${user.id}`,
        pgOrderId: `seed-order2-${user.id}`,
      },
    });
  }

  console.log("✓ Participations created");

  // 인증 샘플 (challenge2)
  const part = await db.participation.findFirst({
    where: { challengeId: challenge2.id, userId: users[0].id },
  });

  if (part) {
    await db.certification.upsert({
      where: { id: "seed-cert-001" },
      update: {},
      create: {
        id: "seed-cert-001",
        participationId: part.id,
        challengeId: challenge2.id,
        userId: users[0].id,
        submitType: "URL",
        url: "https://www.youtube.com/shorts/example",
        photoUrls: [],
        status: "APPROVED",
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        reviewedBy: admin.id,
      },
    });
  }

  console.log("✓ Certifications created");
  console.log("\n🎉 Seed complete! You can now log in with any of these accounts:");
  console.log("   Admin:   admin@challengehub.kr");
  console.log("   Manager: manager@challengehub.kr");
  console.log("   Users:   user1~5@challengehub.kr");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
