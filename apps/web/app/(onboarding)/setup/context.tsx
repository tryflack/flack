"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@flack/auth/auth-client";
import type { OnboardingStep } from "@/app/components/onboarding-steps";

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome",
    description: "Get started with Trust",
  },
  {
    id: "workspace",
    title: "Create Workspace",
    description: "Set up your organization",
  },
];

const STEP_PATHS = [
  "/setup/welcome",
  "/setup/workspace",
];

interface WorkspaceData {
  name: string;
  slug: string;
  organizationId: string;
}

interface OnboardingContextValue {
  steps: OnboardingStep[];
  currentStep: number;
  completedStep: number;
  workspaceData: WorkspaceData | null;
  isLoading: boolean;
  refetchOrganizations: () => void;
}

const OnboardingContext = React.createContext<OnboardingContextValue | null>(
  null
);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Fetch user's organizations from Better Auth
  const {
    data: organizations,
    isPending,
    refetch,
  } = authClient.useListOrganizations();

  // Derive workspace data from the first organization (if exists)
  const workspaceData = React.useMemo<WorkspaceData | null>(() => {
    if (!organizations || organizations.length === 0) {
      return null;
    }
    const org = organizations[0];
    return {
      name: org.name,
      slug: org.slug,
      organizationId: org.id,
    };
  }, [organizations]);

  // Determine current step from pathname
  const currentStep = React.useMemo(() => {
    const index = STEP_PATHS.findIndex((path) => pathname.startsWith(path));
    return index >= 0 ? index + 1 : 1;
  }, [pathname]);

  // Loading state
  const isLoading = isPending;

  // Determine the highest step the user has completed
  // Step 1 (welcome) = always accessible
  // Step 2 (workspace) = accessible after welcome
  // Step 3 (connect) = accessible after workspace created (final step)
  const completedStep = React.useMemo(() => {
    if (workspaceData) {
      return 2; // Has org, can access connect
    }
    return 1; // No org yet, can only access welcome and workspace
  }, [workspaceData]);

  // Handle step enforcement
  React.useEffect(() => {
    if (isLoading) return;

    // If user is trying to access a step they haven't reached yet
    // Allow going forward by 1 step (e.g., welcome -> workspace)
    const maxAllowedStep = completedStep + 1;

    if (currentStep > maxAllowedStep) {
      // Redirect to the highest allowed step
      const targetPath = STEP_PATHS[maxAllowedStep - 1];
      router.replace(targetPath);
      return;
    }

    // If user is trying to go back to a completed step, redirect forward
    // Exception: welcome page is always accessible
    if (currentStep < completedStep && currentStep > 1) {
      const targetPath = STEP_PATHS[completedStep];
      router.replace(targetPath);
    }
  }, [isLoading, currentStep, completedStep, router]);

  const value = React.useMemo(
    () => ({
      steps: ONBOARDING_STEPS,
      currentStep,
      completedStep,
      workspaceData,
      isLoading: !!isLoading,
      refetchOrganizations: refetch,
    }),
    [currentStep, completedStep, workspaceData, isLoading, refetch]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = React.useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

/**
 * Hook to guard a step - returns true if the user can access this step.
 * Use this to conditionally render content.
 */
export function useStepGuard(requiredStep: number): boolean {
  const { completedStep, isLoading } = useOnboarding();

  if (isLoading) return false;

  // Can access if:
  // 1. This is the next step after completed (completedStep + 1)
  // 2. Or this step is already completed
  const maxAllowedStep = completedStep + 1;
  return requiredStep <= maxAllowedStep;
}
