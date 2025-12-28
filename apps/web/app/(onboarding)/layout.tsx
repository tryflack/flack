import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@flack/auth";
import { db } from "@flack/db";
import { OnboardingProvider } from "./setup/context";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // Check if the user has a pending invitation
  const pendingInvitation = await db.invitation.findFirst({
    where: {
      email: session.user.email,
      status: "pending",
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // If they have a pending invitation, redirect to accept it
  if (pendingInvitation) {
    redirect(`/accept-invitation/${pendingInvitation.id}`);
  }

  return (
    <OnboardingProvider>
      <main className="flex min-h-dvh items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </OnboardingProvider>
  );
}
