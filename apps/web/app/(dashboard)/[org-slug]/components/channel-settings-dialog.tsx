"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Settings,
  Trash2,
  LogOut,
  Users,
  UserPlus,
  X,
  Search,
} from "lucide-react";
import { Button } from "@flack/ui/components/button";
import { Input } from "@flack/ui/components/input";
import { Textarea } from "@flack/ui/components/textarea";
import { Switch } from "@flack/ui/components/switch";
import { Spinner } from "@flack/ui/components/spinner";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@flack/ui/components/avatar";
import { ScrollArea } from "@flack/ui/components/scroll-area";
import { Separator } from "@flack/ui/components/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@flack/ui/components/dialog";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@flack/ui/components/tabs";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@flack/ui/components/field";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flack/ui/components/tooltip";
import { toast } from "sonner";
import {
  useChannels,
  type ChannelListItem,
} from "@/app/lib/hooks/use-channels";
import { useChannel } from "@/app/lib/hooks/use-channel";
import { useMembers } from "@/app/lib/hooks/use-members";
import { useActiveMember } from "@/app/lib/hooks/use-active-member";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import { cn } from "@flack/ui/lib/utils";

const channelSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(80, "Channel name must be 80 characters or less"),
  description: z
    .string()
    .max(250, "Description must be 250 characters or less")
    .optional(),
  isPrivate: z.boolean(),
});

type ChannelSettingsValues = z.infer<typeof channelSettingsSchema>;

interface ChannelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: ChannelListItem;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ChannelSettingsDialog({
  open,
  onOpenChange,
  channel,
}: ChannelSettingsDialogProps) {
  const router = useRouter();
  const { update, remove, leave, invite, removeMember } = useChannels();
  const {
    channel: channelDetails,
    isLoading: isLoadingDetails,
    mutate: mutateChannel,
  } = useChannel(channel.id);
  const { members: orgMembers, isLoading: isLoadingMembers } = useMembers();
  const { member, isOwner, isAdmin } = useActiveMember();
  const { navigateToChannel } = useChatParams();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isInviting, setIsInviting] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  const canEdit = channel.membership?.role === "admin" || isOwner || isAdmin;
  const canDelete = isOwner || isAdmin || channel.membership?.role === "admin";
  const canManageMembers = canEdit;

  const form = useForm<ChannelSettingsValues>({
    resolver: zodResolver(channelSettingsSchema),
    defaultValues: {
      name: channel.name,
      description: channel.description || "",
      isPrivate: channel.isPrivate,
    },
  });

  const { isSubmitting } = form.formState;

  // Reset form when channel changes
  useEffect(() => {
    form.reset({
      name: channel.name,
      description: channel.description || "",
      isPrivate: channel.isPrivate,
    });
  }, [channel, form]);

  const onSubmit = async (data: ChannelSettingsValues) => {
    const result = await update(channel.id, {
      name: data.name,
      description: data.description,
      isPrivate: data.isPrivate,
    });

    if (result?.serverError) {
      toast.error(result.serverError);
      return;
    }

    toast.success("Channel updated");
    onOpenChange(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await remove(channel.id);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Channel deleted");
      onOpenChange(false);
      setShowDeleteDialog(false);
      // Navigate away from deleted channel
      router.push(`/${window.location.pathname.split("/")[1]}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      const result = await leave(channel.id);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Left channel");
      onOpenChange(false);
      setShowLeaveDialog(false);
      // Navigate away from the channel
      router.push(`/${window.location.pathname.split("/")[1]}`);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleInvite = async (userId: string) => {
    setIsInviting(userId);
    try {
      const result = await invite(channel.id, userId);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Member added to channel");
      mutateChannel();
      setShowInvitePanel(false);
      setMemberSearch("");
    } finally {
      setIsInviting(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!showRemoveDialog) return;
    setIsRemoving(true);
    try {
      const result = await removeMember(channel.id, showRemoveDialog.userId);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Member removed from channel");
      mutateChannel();
      setShowRemoveDialog(null);
    } finally {
      setIsRemoving(false);
    }
  };

  // Get members not already in the channel
  const channelMemberIds = new Set(
    channelDetails?.members.map((m) => m.user.id) ?? [],
  );
  const availableMembers = orgMembers.filter(
    (m) =>
      !channelMemberIds.has(m.userId) &&
      (memberSearch === "" ||
        m.user.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.user.email.toLowerCase().includes(memberSearch.toLowerCase())),
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Channel Settings
            </DialogTitle>
            <DialogDescription>
              Manage settings for #{channel.name}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 pt-4">
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <FieldGroup>
                  <Controller
                    name="name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          Channel name
                        </FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          disabled={!canEdit || isSubmitting}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="description"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          Description
                        </FieldLabel>
                        <Textarea
                          {...field}
                          id={field.name}
                          placeholder="What's this channel about?"
                          disabled={!canEdit || isSubmitting}
                          resize="none"
                          rows={3}
                        />
                        <FieldDescription>
                          {field.value?.length || 0}/250 characters
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="isPrivate"
                    control={form.control}
                    render={({ field }) => (
                      <Field>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FieldLabel>Private channel</FieldLabel>
                            <FieldDescription>
                              Only invited members can see and join
                            </FieldDescription>
                          </div>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!canEdit || isSubmitting}
                          />
                        </div>
                      </Field>
                    )}
                  />

                  {canEdit && (
                    <Field className="pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <Spinner size="sm" /> Saving...
                          </span>
                        ) : (
                          "Save changes"
                        )}
                      </Button>
                    </Field>
                  )}
                </FieldGroup>
              </form>

              <Separator />

              {/* Danger zone */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Danger zone
                </h4>

                {channel.membership && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowLeaveDialog(true)}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave channel
                  </Button>
                )}

                {canDelete && (
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete channel
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="members" className="pt-4">
              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="md" />
                </div>
              ) : showInvitePanel ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Add members</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowInvitePanel(false);
                        setMemberSearch("");
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>

                  <ScrollArea className="h-[200px]">
                    {isLoadingMembers ? (
                      <div className="flex items-center justify-center py-8">
                        <Spinner size="md" />
                      </div>
                    ) : availableMembers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          {memberSearch
                            ? "No members found"
                            : "All members are already in this channel"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {availableMembers.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleInvite(m.userId)}
                            disabled={isInviting === m.userId}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent",
                              isInviting === m.userId && "opacity-50",
                            )}
                          >
                            <Avatar size="md">
                              <AvatarImage src={m.user.image ?? undefined} />
                              <AvatarFallback>
                                {getInitials(m.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <span className="truncate text-sm font-medium">
                                {m.user.name}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {m.user.email}
                              </span>
                            </div>
                            {isInviting === m.userId ? (
                              <Spinner size="sm" />
                            ) : (
                              <UserPlus className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {channelDetails?.members.length || 0} members
                    </div>
                    {canManageMembers && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInvitePanel(true)}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add member
                      </Button>
                    )}
                  </div>

                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {channelDetails?.members.map((m) => {
                        const isChannelCreator =
                          channelDetails.createdBy.id === m.user.id;
                        const isCurrentUser = m.user.id === member?.userId;
                        const canRemove =
                          canManageMembers &&
                          !isChannelCreator &&
                          !isCurrentUser;

                        return (
                          <div
                            key={m.id}
                            className="group flex items-center justify-between rounded-md p-2 hover:bg-muted"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar size="md">
                                <AvatarImage src={m.user.image ?? undefined} />
                                <AvatarFallback>
                                  {getInitials(m.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {m.user.name}
                                  {isCurrentUser && (
                                    <span className="ml-1.5 text-xs text-muted-foreground">
                                      (you)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {isChannelCreator ? "creator" : m.role}
                                </p>
                              </div>
                            </div>
                            {canRemove && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                      onClick={() =>
                                        setShowRemoveDialog({
                                          userId: m.user.id,
                                          userName: m.user.name,
                                        })
                                      }
                                    >
                                      <X className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Remove from channel
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete #{channel.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the channel and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Deleting...
                </span>
              ) : (
                "Delete channel"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave confirmation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave #{channel.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer receive messages from this channel. You can
              rejoin anytime if it's a public channel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} disabled={isLeaving}>
              {isLeaving ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Leaving...
                </span>
              ) : (
                "Leave channel"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove member confirmation */}
      <AlertDialog
        open={!!showRemoveDialog}
        onOpenChange={(open) => !open && setShowRemoveDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {showRemoveDialog?.userName}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This member will be removed from #{channel.name} and will no
              longer receive messages from this channel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Removing...
                </span>
              ) : (
                "Remove member"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
