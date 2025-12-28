"use client";

import { useState } from "react";
import { Hash, Lock, Users, Search } from "lucide-react";
import { Button } from "@flack/ui/components/button";
import { Input } from "@flack/ui/components/input";
import { Badge } from "@flack/ui/components/badge";
import { ScrollArea } from "@flack/ui/components/scroll-area";
import { Spinner } from "@flack/ui/components/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@flack/ui/components/dialog";
import { toast } from "sonner";
import {
  useChannels,
  type ChannelListItem,
} from "@/app/lib/hooks/use-channels";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import { cn } from "@flack/ui/lib/utils";

interface BrowseChannelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrowseChannelsDialog({
  open,
  onOpenChange,
}: BrowseChannelsDialogProps) {
  const { channels, isLoading, join } = useChannels();
  const { navigateToChannel } = useChatParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningChannelId, setJoiningChannelId] = useState<string | null>(null);

  // Filter channels by search query
  const filteredChannels = channels.filter((channel) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      channel.name.toLowerCase().includes(query) ||
      channel.description?.toLowerCase().includes(query)
    );
  });

  // Separate joined and not-joined channels
  const joinedChannels = filteredChannels.filter((c) => c.isMember);
  const availableChannels = filteredChannels.filter(
    (c) => !c.isMember && !c.isPrivate,
  );

  const handleJoin = async (channel: ChannelListItem) => {
    setJoiningChannelId(channel.id);
    try {
      const result = await join(channel.id);
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(`Joined #${channel.name}`);
      onOpenChange(false);
      navigateToChannel(channel.slug);
    } finally {
      setJoiningChannelId(null);
    }
  };

  const handleOpen = (channel: ChannelListItem) => {
    onOpenChange(false);
    navigateToChannel(channel.slug);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Browse channels</DialogTitle>
          <DialogDescription>
            Discover and join channels in this workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-5 w-5" />
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No channels match your search"
                    : "No channels in this workspace"}
                </p>
              </div>
            ) : (
              <div className="space-y-6 pr-4">
                {/* Joined Channels */}
                {joinedChannels.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Your Channels
                    </h3>
                    <div className="space-y-1">
                      {joinedChannels.map((channel) => (
                        <ChannelRow
                          key={channel.id}
                          channel={channel}
                          onAction={() => handleOpen(channel)}
                          actionLabel="Open"
                          isJoined
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Channels */}
                {availableChannels.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Available Channels
                    </h3>
                    <div className="space-y-1">
                      {availableChannels.map((channel) => (
                        <ChannelRow
                          key={channel.id}
                          channel={channel}
                          onAction={() => handleJoin(channel)}
                          actionLabel="Join"
                          isLoading={joiningChannelId === channel.id}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* No available channels message */}
                {availableChannels.length === 0 &&
                  joinedChannels.length > 0 &&
                  !searchQuery && (
                    <p className="text-center text-sm text-muted-foreground">
                      You've joined all available channels!
                    </p>
                  )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ChannelRowProps {
  channel: ChannelListItem;
  onAction: () => void;
  actionLabel: string;
  isJoined?: boolean;
  isLoading?: boolean;
}

function ChannelRow({
  channel,
  onAction,
  actionLabel,
  isJoined,
  isLoading,
}: ChannelRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md p-3 transition-colors",
        isJoined ? "bg-muted/50" : "hover:bg-muted/50",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
          {channel.isPrivate ? (
            <Lock className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Hash className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{channel.name}</span>
            {channel.isPrivate && (
              <Badge variant="secondary" className="text-[10px]">
                Private
              </Badge>
            )}
          </div>
          {channel.description && (
            <p className="truncate text-sm text-muted-foreground">
              {channel.description}
            </p>
          )}
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{channel.memberCount} members</span>
          </div>
        </div>
      </div>
      <Button
        size="sm"
        variant={isJoined ? "ghost" : "default"}
        onClick={onAction}
        disabled={isLoading}
        className="shrink-0"
      >
        {isLoading ? <Spinner className="h-4 w-4" /> : actionLabel}
      </Button>
    </div>
  );
}
