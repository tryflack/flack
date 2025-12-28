"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@flack/ui/components/button";
import { Spinner } from "@flack/ui/components/spinner";
import { Logo } from "@flack/ui/components/logo";
import Balancer from "react-wrap-balancer";
import { useOnboarding } from "../context";

export default function WelcomePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { isLoading } = useOnboarding();

  const handleGetStarted = () => {
    startTransition(() => {
      router.push("/setup/workspace");
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-center">
      <Logo className="h-10 w-auto my-8" />

      <div className="space-y-2.5">
        <h1 className="font-bold tracking-tight">Welcome to Flack</h1>

        <p className="text-muted-foreground text-sm">
          <Balancer>
            The modern, open source Slack alternative.
          </Balancer>
        </p>
      </div>

      <div className="mt-4">
        <Button className="w-full" onClick={handleGetStarted} disabled={isPending}>
          {isPending ? (
            <span className="flex items-center gap-2">
              <Spinner /> Loading...
            </span>
          ) : (
            "Get started"
          )}
        </Button>
      </div>
    </div>
  );
}
