import useSWR from "swr";
import { inviteMember } from "@/app/actions/members/invite-member";
import { removeMember } from "@/app/actions/members/remove-member";
import { updateMemberRole } from "@/app/actions/members/update-role";
import { cancelInvitation } from "@/app/actions/members/cancel-invitation";
import { resendInvitation } from "@/app/actions/members/resend-invitation";

export interface MemberUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: MemberUser;
}

export interface Invitation {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

interface MembersResponse {
  members: Member[];
  invitations: Invitation[];
  currentUserRole: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMembers() {
  const { data, error, isLoading, mutate } = useSWR<MembersResponse>(
    "/api/members",
    fetcher
  );

  // Invite a new member
  const invite = async (input: {
    email: string;
    role?: "member" | "admin";
  }) => {
    const result = await inviteMember(input);
    if (result?.data?.success) {
      mutate(); // Revalidate the members list
    }
    return result;
  };

  // Remove a member
  const remove = async (memberIdOrEmail: string) => {
    const result = await removeMember({ memberIdOrEmail });
    if (result?.data?.success) {
      mutate();
    }
    return result;
  };

  // Update a member's role
  const updateRole = async (
    memberId: string,
    role: "member" | "admin" | "owner"
  ) => {
    const result = await updateMemberRole({ memberId, role });
    if (result?.data?.success) {
      mutate();
    }
    return result;
  };

  // Cancel a pending invitation
  const cancel = async (invitationId: string) => {
    const result = await cancelInvitation({ invitationId });
    if (result?.data?.success) {
      mutate();
    }
    return result;
  };

  // Resend a pending invitation
  const resend = async (invitationId: string) => {
    const result = await resendInvitation({ invitationId });
    if (result?.data?.success) {
      mutate();
    }
    return result;
  };

  return {
    members: data?.members ?? [],
    invitations: data?.invitations ?? [],
    currentUserRole: data?.currentUserRole ?? "member",
    isLoading,
    error,
    mutate,
    // Mutations
    invite,
    remove,
    updateRole,
    cancel,
    resend,
  };
}
