"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@flack/ui/components/dialog";
import { Button } from "@flack/ui/components/button";
import { Input } from "@flack/ui/components/input";
import { Label } from "@flack/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@flack/ui/components/select";
import { Field, FieldError } from "@flack/ui/components/field";
import { Spinner } from "@flack/ui/components/spinner";
import { UserPlus, Shield, User } from "lucide-react";
import { toast } from "sonner";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "admin"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteMemberDialogProps {
  currentUserRole: string;
  onInvite: (input: {
    email: string;
    role: "member" | "admin";
  }) => Promise<unknown>;
}

export function InviteMemberDialog({
  currentUserRole,
  onInvite,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const canInviteAdmin = currentUserRole === "owner";

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const onSubmit = async (values: InviteFormValues) => {
    setIsPending(true);
    try {
      const result = await onInvite(values);
      if (result && typeof result === "object" && "serverError" in result) {
        toast.error(result.serverError as string);
      } else {
        toast.success(`Invitation sent to ${values.email}`);
        form.reset();
        setOpen(false);
      }
    } catch {
      toast.error("Failed to send invitation");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a new member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization. They&apos;ll receive
            an email with instructions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="email">Email address</Label>
                <Input
                  {...field}
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  aria-invalid={fieldState.invalid}
                  disabled={isPending}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="role"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div className="flex flex-col items-start">
                          <span>Member</span>
                          <span className="text-xs text-muted-foreground">
                            Can access channels and send messages
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                    {canInviteAdmin && (
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <div className="flex flex-col items-start">
                            <span>Admin</span>
                            <span className="text-xs text-muted-foreground">
                              Can manage members and channels
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner className="mr-2" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
