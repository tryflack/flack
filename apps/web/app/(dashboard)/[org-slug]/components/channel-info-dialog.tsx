"use client";

import { useState } from "react";
import { Hash, Users, Settings, LogOut, Lock, Calendar } from "lucide-react";
import { Button } from "@flack/ui/components/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@flack/ui/components/avatar";
import { ScrollArea } from "@flack/ui/components/scroll-area";
import { Separator } from "@flack/ui/components/separator";
import { Spinner } from "@flack/ui/components/spinner";
import { Badge } from "@flack/ui/components/badge";
import {
  Dialog,
  DialogContent,
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
import { toast } from "sonner";
import { useChannel } from "@/app/lib/hooks/use-channel";
import {
  useChannels,
  type ChannelListItem,
} from "@/app/lib/hooks/use-channels";
import { useActiveMember } from "@/app/lib/hooks/use-active-member";
import { useRouter } from "next/navigation";
import { ChannelSettingsDialog } from "./channel-settings-dialog";
import { AvatarWithPresence } from "./presence-indicator";

interface ChannelInfoDialogProps {
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ChannelInfoDialog({
  open,
  onOpenChange,
  channel,
}: ChannelInfoDialogProps) {
  const router = useRouter();
  const { channel: channelDetails, isLoading } = useChannel(channel.id);
  const { leave } = useChannels();
  const { member, isOwner, isAdmin } = useActiveMember();

  const [showSettings, setShowSettings] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const canEdit = channel.membership?.role === "admin" || isOwner || isAdmin;

  const handleOpenSettings = () => {
    onOpenChange(false);
    setShowSettings(true);
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
      router.push(`/${window.location.pathname.split("/")[1]}`);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                {channel.isPrivate ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Hash className="h-4 w-4" />
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-lg">{channel.name}</span>
                {channel.isPrivate && (
                  <Badge variant="secondary" className="mt-0.5 text-[10px]">
                    Private
                  </Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="h-5 w-5" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Description */}
              {channel.description && (
                <div className="space-y-1">
                  <h4 className="text-xs font-medium uppercase text-muted-foreground">
                    Description
                  </h4>
                  <p className="text-sm">{channel.description}</p>
                </div>
              )}

              {/* Created info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Created on {formatDate(channel.createdAt)}</span>
              </div>

              <Separator />

              {/* Members section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-medium">
                      {channelDetails?.members.length || 0} members
                    </h4>
                  </div>
                </div>

                <ScrollArea className="h-[160px]">
                  <div className="space-y-1">
                    {channelDetails?.members.map((m) => {
                      const isCreator =
                        channelDetails.createdBy.id === m.user.id;
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                        >
                          <AvatarWithPresence
                            userId={m.user.id}
                            src={m.user.image ?? undefined}
                            fallback={getInitials(m.user.name)}
                            size="sm"
                          />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">
                              {m.user.name}
                              {m.user.id === member?.userId && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  (you)
                                </span>
                              )}
                            </span>
                            <span className="text-xs capitalize text-muted-foreground">
                              {isCreator ? "Creator" : m.role}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleOpenSettings}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                )}

                {channel.membership && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowLeaveDialog(true)}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Leave
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Channel Settings Dialog */}
      <ChannelSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        channel={channel}
      />

      {/* Leave confirmation */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave #{channel.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer receive messages from this channel.
              {!channel.isPrivate && " You can rejoin anytime."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeave} disabled={isLeaving}>
              {isLeaving ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" /> Leaving...
                </span>
              ) : (
                "Leave channel"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
