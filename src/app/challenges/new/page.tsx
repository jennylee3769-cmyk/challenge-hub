import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { getCurrentUser } from "@/lib/auth";
import { ChallengeWizard } from "@/components/challenge/ChallengeWizard";

export default async function NewChallengePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/challenges/new");
  if (user.role === "USER") redirect("/my");

  return (
    <>
      <Header title="챌린지 만들기" variant="back" />
      <main className="pb-10">
        <ChallengeWizard managerId={user.id} />
      </main>
    </>
  );
}
