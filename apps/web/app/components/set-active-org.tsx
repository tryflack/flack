"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@flack/auth/auth-client"; 

interface SetActiveOrgProps {
  organizationId: string;
  currentActiveOrgId: string | null | undefined;
}

/**
 * Client component that sets the active organization in the session.
 * This ensures the session's activeOrganizationId is updated when
 * a user navigates to an organization page.
 */
export function SetActiveOrg({ organizationId, currentActiveOrgId }: SetActiveOrgProps) {
  const hasSet = useRef(false);

  useEffect(() => {
    // Only set active if it's not already the active org
    if (organizationId !== currentActiveOrgId && !hasSet.current) {
      hasSet.current = true;
      authClient.organization.setActive({
        organizationId,
      });
    }
  }, [organizationId, currentActiveOrgId]);

  return null;
}






