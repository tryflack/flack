"use client";

import { useMembers } from "@/app/lib/hooks/use-members";
import { MemberList } from "./member-list";
import { InviteMemberDialog } from "./invite-member-dialog";
import { PendingInvitations } from "./pending-invitations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@flack/ui/components/card";
import { Skeleton } from "@flack/ui/components/skeleton";
import { Users } from "lucide-react";

interface TeamManagementProps {
  organizationName: string;
  currentUserId: string;
}

export function TeamManagement({
  organizationName,
  currentUserId,
}: TeamManagementProps) {
  const {
    members,
    invitations,
    currentUserRole,
    isLoading,
    invite,
    remove,
    updateRole,
    cancel,
    resend,
  } = useMembers();

  const canManageMembers =
    currentUserRole === "owner" || currentUserRole === "admin";

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-auto p-6">
      <div className="flex items-center justify-between">
        {canManageMembers && (
          <InviteMemberDialog
            currentUserRole={currentUserRole}
            onInvite={invite}
          />
        )}
      </div>

      {canManageMembers && invitations.length > 0 && (
        <PendingInvitations
          invitations={invitations}
          onCancel={cancel}
          onResend={resend}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members
            <span className="text-muted-foreground font-normal">
              ({members.length})
            </span>
          </CardTitle>
          <CardDescription>
            People who have access to this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberList
            members={members}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            onRemove={remove}
            onUpdateRole={updateRole}
          />
        </CardContent>
      </Card>
    </div>
  );
}
