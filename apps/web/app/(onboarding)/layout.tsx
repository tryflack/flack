import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@flack/auth";
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

  return (
    <OnboardingProvider>
      <main className="flex min-h-dvh items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </main>
    </OnboardingProvider>
  );
}
