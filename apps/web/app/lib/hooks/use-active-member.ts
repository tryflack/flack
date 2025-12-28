import useSWR from "swr";

interface ActiveMember {
  id: string;
  role: string;
  userId: string;
  organizationId: string;
}

interface ActiveMemberResponse {
  member: ActiveMember | null;
}

const fetcher = async (url: string): Promise<ActiveMemberResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    return { member: null };
  }
  return res.json();
};

/**
 * Hook to get the current user's membership in the active organization.
 * Useful for role-based UI guards.
 */
export function useActiveMember() {
  const { data, error, isLoading, mutate } = useSWR<ActiveMemberResponse>(
    "/api/members/me",
    fetcher
  );

  const member = data?.member ?? null;
  const role = member?.role ?? null;

  // Permission checks
  const isOwner = role === "owner";
  const isAdmin = role === "admin";
  const isMember = role === "member";

  // Can manage members (invite, remove, update roles)
  const canManageMembers = isOwner || isAdmin;

  // Can manage organization settings
  const canManageOrganization = isOwner;

  // Can delete the organization
  const canDeleteOrganization = isOwner;

  return {
    member,
    role,
    isLoading,
    error,
    mutate,
    // Role checks
    isOwner,
    isAdmin,
    isMember,
    // Permission checks
    canManageMembers,
    canManageOrganization,
    canDeleteOrganization,
  };
}
