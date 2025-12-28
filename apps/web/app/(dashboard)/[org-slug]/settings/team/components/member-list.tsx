"use client";

import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@flack/ui/components/avatar";
import { Badge } from "@flack/ui/components/badge";
import { Button } from "@flack/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@flack/ui/components/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@flack/ui/components/alert-dialog";
import { Spinner } from "@flack/ui/components/spinner";
import { MoreHorizontal, Shield, Crown, User, UserMinus } from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@/app/lib/hooks/use-members";

interface MemberListProps {
  members: Member[];
  currentUserRole: string;
  currentUserId: string;
  onRemove: (memberIdOrEmail: string) => Promise<unknown>;
  onUpdateRole: (memberId: string, role: "member" | "admin" | "owner") => Promise<unknown>;
}

const roleConfig = {
  owner: {
    label: "Owner",
    icon: Crown,
    variant: "default" as const,
  },
  admin: {
    label: "Admin",
    icon: Shield,
    variant: "secondary" as const,
  },
  member: {
    label: "Member",
    icon: User,
    variant: "outline" as const,
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MemberList({
  members,
  currentUserRole,
  currentUserId,
  onRemove,
  onUpdateRole,
}: MemberListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";
  const isOwner = currentUserRole === "owner";

  const handleRemove = async (member: Member) => {
    setRemovingId(member.id);
    try {
      const result = await onRemove(member.id);
      if (result && typeof result === 'object' && 'serverError' in result) {
        toast.error(result.serverError as string);
      } else {
        toast.success(`${member.user.name} has been removed from the organization`);
      }
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemovingId(null);
      setConfirmRemove(null);
    }
  };

  const handleUpdateRole = async (member: Member, newRole: "member" | "admin" | "owner") => {
    if (member.role === newRole) return;
    
    setUpdatingRoleId(member.id);
    try {
      const result = await onUpdateRole(member.id, newRole);
      if (result && typeof result === 'object' && 'serverError' in result) {
        toast.error(result.serverError as string);
      } else {
        toast.success(`${member.user.name}'s role has been updated to ${newRole}`);
      }
    } catch {
      toast.error("Failed to update role");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  return (
    <>
      <div className="divide-y divide-border rounded-lg border">
        {members.map((member) => {
          const role = roleConfig[member.role as keyof typeof roleConfig] ?? roleConfig.member;
          const RoleIcon = role.icon;
          const isCurrentUser = member.userId === currentUserId;
          const isMemberOwner = member.role === "owner";
          const canModify = canManageMembers && !isCurrentUser && !isMemberOwner;
          const canChangeRole = isOwner && !isCurrentUser;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.user.image || undefined} />
                  <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{member.user.name}</span>
                    {isCurrentUser && (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {member.user.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant={role.variant} className="gap-1">
                  <RoleIcon className="h-3 w-3" />
                  {role.label}
                </Badge>

                {(canModify || canChangeRole) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={removingId === member.id || updatingRoleId === member.id}
                      >
                        {removingId === member.id || updatingRoleId === member.id ? (
                          <Spinner className="h-4 w-4" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canChangeRole && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleUpdateRole(member, "member")}
                            disabled={member.role === "member"}
                          >
                            <User className="mr-2 h-4 w-4" />
                            Set as Member
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateRole(member, "admin")}
                            disabled={member.role === "admin"}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Set as Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateRole(member, "owner")}
                            disabled={member.role === "owner"}
                          >
                            <Crown className="mr-2 h-4 w-4" />
                            Transfer Ownership
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      {canModify && (
                        <DropdownMenuItem
                          onClick={() => setConfirmRemove(member)}
                          className="text-destructive focus:text-destructive"
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Remove from Organization
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">{confirmRemove?.user.name}</span> from
              this organization? They will lose access to all channels and
              conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemove && handleRemove(confirmRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

