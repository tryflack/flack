"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@flack/auth/auth-client";
import { Button } from "@flack/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@flack/ui/components/card";
import { Badge } from "@flack/ui/components/badge";
import { Spinner } from "@flack/ui/components/spinner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  UserPlus,
  XCircle,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";
import { joinPublicChannels } from "@/app/actions/members";

interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  inviter: {
    name: string;
    email: string;
  };
}

interface AcceptInvitationFormProps {
  invitation: InvitationDetails;
  isExpired: boolean;
  isProcessed: boolean;
  isAuthenticated: boolean;
  currentUserEmail?: string;
}

export function AcceptInvitationForm({
  invitation,
  isExpired,
  isProcessed,
  isAuthenticated,
  currentUserEmail,
}: AcceptInvitationFormProps) {
  const router = useRouter();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [result, setResult] = useState<"accepted" | "rejected" | null>(null);

  // Check if the current user email matches the invitation email
  const emailMismatch =
    isAuthenticated &&
    currentUserEmail &&
    currentUserEmail.toLowerCase() !== invitation.email.toLowerCase();

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const response = await authClient.organization.acceptInvitation({
        invitationId: invitation.id,
      });

      if (response.error) {
        toast.error(response.error.message || "Failed to accept invitation");
        return;
      }

      // Automatically join all public channels in the organization
      await joinPublicChannels({ organizationId: invitation.organization.id });

      setResult("accepted");
      toast.success(`You've joined ${invitation.organization.name}!`);

      // Redirect to the organization after a brief delay
      setTimeout(() => {
        router.push(`/${invitation.organization.slug}`);
      }, 1500);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const response = await authClient.organization.rejectInvitation({
        invitationId: invitation.id,
      });

      if (response.error) {
        toast.error(response.error.message || "Failed to reject invitation");
        return;
      }

      setResult("rejected");
      toast.success("Invitation declined");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsRejecting(false);
    }
  };

  // Show success state
  if (result === "accepted") {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Welcome to {invitation.organization.name}!</CardTitle>
          <CardDescription>
            You&apos;ve successfully joined the organization. Redirecting you
            now...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  // Show rejected state
  if (result === "rejected") {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Invitation Declined</CardTitle>
          <CardDescription>
            You&apos;ve declined the invitation to join{" "}
            {invitation.organization.name}.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show expired state
  if (isExpired) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle>Invitation Expired</CardTitle>
          <CardDescription>
            This invitation to join {invitation.organization.name} has expired.
            Please ask {invitation.inviter.name} to send a new invitation.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show already processed state
  if (isProcessed) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Invitation Already Used</CardTitle>
          <CardDescription>
            This invitation has already been {invitation.status}.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link href="/">Go to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show login required state
  if (!isAuthenticated) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>You&apos;re Invited!</CardTitle>
          <CardDescription>
            {invitation.inviter.name} has invited you to join{" "}
            <span className="font-medium">{invitation.organization.name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{invitation.organization.name}</p>
                <p className="text-sm text-muted-foreground">
                  You&apos;ll join as:{" "}
                  <Badge variant="secondary">{invitation.role}</Badge>
                </p>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Please sign in or create an account with{" "}
            <span className="font-medium">{invitation.email}</span> to accept
            this invitation.
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button asChild className="w-full">
            <Link
              href={`/login?email=${encodeURIComponent(invitation.email)}&redirect=/accept-invitation/${invitation.id}`}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In to Accept
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link
              href={`/register?email=${encodeURIComponent(invitation.email)}&redirect=/accept-invitation/${invitation.id}`}
            >
              Create Account
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show email mismatch warning
  if (emailMismatch) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle>Email Mismatch</CardTitle>
          <CardDescription>
            This invitation was sent to{" "}
            <span className="font-medium">{invitation.email}</span>, but
            you&apos;re signed in as{" "}
            <span className="font-medium">{currentUserEmail}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Please sign in with the correct email address to accept this
            invitation.
          </p>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link
              href={`/login?email=${encodeURIComponent(invitation.email)}&redirect=/accept-invitation/${invitation.id}`}
            >
              Sign In with {invitation.email}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show main invitation form
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <UserPlus className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Join {invitation.organization.name}</CardTitle>
        <CardDescription>
          {invitation.inviter.name} has invited you to join their organization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">{invitation.organization.name}</p>
              <p className="text-sm text-muted-foreground">
                You&apos;ll join as:{" "}
                <Badge variant="secondary">{invitation.role}</Badge>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button
          onClick={handleAccept}
          disabled={isAccepting || isRejecting}
          className="w-full"
        >
          {isAccepting ? (
            <>
              <Spinner className="mr-2" />
              Joining...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Accept Invitation
            </>
          )}
        </Button>
        <Button
          onClick={handleReject}
          disabled={isAccepting || isRejecting}
          variant="ghost"
          className="w-full text-muted-foreground"
        >
          {isRejecting ? (
            <>
              <Spinner className="mr-2" />
              Declining...
            </>
          ) : (
            "Decline"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
