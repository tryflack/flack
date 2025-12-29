"use client";

import { useState } from "react";
import { Badge } from "@flack/ui/components/badge";
import { Button } from "@flack/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@flack/ui/components/card";
import { Spinner } from "@flack/ui/components/spinner";
import { Mail, X, RefreshCw, Clock, Shield, User } from "lucide-react";
import { toast } from "sonner";
import type { Invitation } from "@/app/lib/hooks/use-members";

interface PendingInvitationsProps {
  invitations: Invitation[];
  onCancel: (invitationId: string) => Promise<unknown>;
  onResend: (invitationId: string) => Promise<unknown>;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isExpired(expiresAt: string) {
  return new Date(expiresAt) < new Date();
}

export function PendingInvitations({
  invitations,
  onCancel,
  onResend,
}: PendingInvitationsProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const handleCancel = async (invitation: Invitation) => {
    setCancellingId(invitation.id);
    try {
      const result = await onCancel(invitation.id);
      if (result && typeof result === "object" && "serverError" in result) {
        toast.error(result.serverError as string);
      } else {
        toast.success(`Invitation to ${invitation.email} has been cancelled`);
      }
    } catch {
      toast.error("Failed to cancel invitation");
    } finally {
      setCancellingId(null);
    }
  };

  const handleResend = async (invitation: Invitation) => {
    setResendingId(invitation.id);
    try {
      const result = await onResend(invitation.id);
      if (result && typeof result === "object" && "serverError" in result) {
        toast.error(result.serverError as string);
      } else {
        toast.success(`Invitation resent to ${invitation.email}`);
      }
    } catch {
      toast.error("Failed to resend invitation");
    } finally {
      setResendingId(null);
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pending Invitations
        </CardTitle>
        <CardDescription>
          Invitations that haven&apos;t been accepted yet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border rounded-lg border border-border">
          {invitations.map((invitation) => {
            const expired = isExpired(invitation.expiresAt);
            const RoleIcon = invitation.role === "admin" ? Shield : User;

            return (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{invitation.email}</span>
                    <Badge
                      variant={
                        invitation.role === "admin" ? "secondary" : "outline"
                      }
                      className="gap-1"
                    >
                      <RoleIcon className="h-3 w-3" />
                      {invitation.role || "member"}
                    </Badge>
                    {expired && (
                      <Badge variant="destructive" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Expired
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Invited by {invitation.inviter.name} on{" "}
                    {formatDate(invitation.createdAt)}
                    {!expired && (
                      <> · Expires {formatDate(invitation.expiresAt)}</>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResend(invitation)}
                    disabled={
                      resendingId === invitation.id ||
                      cancellingId === invitation.id
                    }
                  >
                    {resendingId === invitation.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Resend
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(invitation)}
                    disabled={
                      resendingId === invitation.id ||
                      cancellingId === invitation.id
                    }
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {cancellingId === invitation.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <X className="mr-1 h-3 w-3" />
                        Cancel
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
