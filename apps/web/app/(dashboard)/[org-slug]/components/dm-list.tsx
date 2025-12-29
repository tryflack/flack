"use client";

import { MessageSquare } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@flack/ui/components/avatar";
import { Badge } from "@flack/ui/components/badge";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import { useConversations } from "@/app/lib/hooks/use-conversations";
import { cn } from "@flack/ui/lib/utils";

export function DmList() {
  const { activeDm, navigateToDm } = useChatParams();
  const { conversations, isLoading } = useConversations();

  // Get display name for conversation (other participant's name for DMs)
  const getDisplayName = (conversation: (typeof conversations)[0]) => {
    if (conversation.type === "group_dm") {
      return conversation.name || "Group DM";
    }
    // For 1:1 DMs, show the other person's name
    const otherParticipant = conversation.participants[0];
    return otherParticipant?.user.name || "Unknown";
  };

  // Check if the other participant in a DM is deactivated
  const isDeactivated = (conversation: (typeof conversations)[0]) => {
    if (conversation.type !== "dm") return false;
    return conversation.participants[0]?.user.isDeactivated ?? false;
  };

  const getAvatarUrl = (conversation: (typeof conversations)[0]) => {
    if (conversation.type === "dm") {
      return conversation.participants[0]?.user.image;
    }
    return null;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Direct Messages
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-1 px-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <p className="px-2 py-1 text-sm text-muted-foreground">
          No conversations yet
        </p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {conversations.map((conversation) => {
            const displayName = getDisplayName(conversation);
            const avatarUrl = getAvatarUrl(conversation);
            const hasUnread = conversation.unreadCount > 0;
            const isActive = activeDm === conversation.id;
            const deactivated = isDeactivated(conversation);

            return (
              <button
                key={conversation.id}
                onClick={() => navigateToDm(conversation.id)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                  isActive && "bg-accent text-accent-foreground",
                  hasUnread && !isActive && "font-semibold",
                )}
              >
                {conversation.type === "dm" ? (
                  <Avatar className={cn("h-5 w-5", deactivated && "opacity-50")}>
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <MessageSquare
                    className={cn(
                      "h-4 w-4 shrink-0",
                      hasUnread && !isActive
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  />
                )}
                <span className={cn(
                  "flex-1 truncate text-left",
                  deactivated && "text-muted-foreground"
                )}>
                  {displayName}
                  {deactivated && " (Deactivated)"}
                </span>
                {hasUnread && !isActive && (
                  <Badge
                    variant="default"
                    className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px] font-bold"
                  >
                    {conversation.unreadCount > 99
                      ? "99+"
                      : conversation.unreadCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
