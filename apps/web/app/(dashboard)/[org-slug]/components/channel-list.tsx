"use client";

import { Hash, Lock, Plus } from "lucide-react";
import { Button } from "@flack/ui/components/button";
import { Badge } from "@flack/ui/components/badge";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import { useChannels } from "@/app/lib/hooks/use-channels";
import { CreateChannelDialog } from "./create-channel-dialog";
import { cn } from "@flack/ui/lib/utils";
import { useState } from "react";

export function ChannelList() {
  const { activeChannel, navigateToChannel } = useChatParams();
  const { channels, isLoading } = useChannels();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Channels
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-1 px-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : channels.length === 0 ? (
        <p className="px-2 py-1 text-sm text-muted-foreground">
          No channels yet
        </p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {channels.map((channel) => {
            const hasUnread = channel.isMember && channel.unreadCount > 0;
            const isActive = activeChannel === channel.slug;

            return (
              <button
                key={channel.id}
                onClick={() => navigateToChannel(channel.slug)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                  isActive && "bg-accent text-accent-foreground",
                  hasUnread && !isActive && "font-semibold"
                )}
              >
                {channel.isPrivate ? (
                  <Lock
                    className={cn(
                      "h-4 w-4 shrink-0",
                      hasUnread && !isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  />
                ) : (
                  <Hash
                    className={cn(
                      "h-4 w-4 shrink-0",
                      hasUnread && !isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  />
                )}
                <span className="flex-1 truncate text-left">
                  {channel.name}
                </span>
                {hasUnread && !isActive && (
                  <Badge
                    variant="default"
                    className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px] font-bold"
                  >
                    {channel.unreadCount > 99 ? "99+" : channel.unreadCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      )}

      <CreateChannelDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
