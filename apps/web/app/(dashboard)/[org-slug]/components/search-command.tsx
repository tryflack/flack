"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Hash,
  Lock,
  MessageSquare,
  User,
  Search,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@flack/ui/components/command";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@flack/ui/components/avatar";
import { Kbd } from "@flack/ui/components/kbd";
import { Badge } from "@flack/ui/components/badge";
import { useSearch } from "@/app/lib/hooks/use-search";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import { useConversations } from "@/app/lib/hooks/use-conversations";
import { cn } from "@flack/ui/lib/utils";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const { navigateToChannel, navigateToDm, organizationSlug } = useChatParams();
  const { startDm, conversations } = useConversations();
  const {
    query,
    setQuery,
    messages,
    channels,
    members,
    isSearching,
    isEmpty,
    hasResults,
    clear,
  } = useSearch();

  // Close and reset on dialog close
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        clear();
      }
      onOpenChange(newOpen);
    },
    [clear, onOpenChange],
  );

  // Navigate to a channel
  const handleSelectChannel = useCallback(
    (slug: string) => {
      navigateToChannel(slug);
      handleOpenChange(false);
    },
    [navigateToChannel, handleOpenChange],
  );

  // Navigate to a message (in its channel/conversation)
  const handleSelectMessage = useCallback(
    (message: {
      channelId: string | null;
      conversationId: string | null;
      channel: { slug: string } | null;
    }) => {
      if (message.channel) {
        navigateToChannel(message.channel.slug);
      } else if (message.conversationId) {
        navigateToDm(message.conversationId);
      }
      handleOpenChange(false);
    },
    [navigateToChannel, navigateToDm, handleOpenChange],
  );

  // Navigate to or start DM with a member
  const handleSelectMember = useCallback(
    async (userId: string) => {
      // Check if we already have a DM with this user
      const existingDm = conversations.find(
        (c) =>
          c.type === "dm" && c.participants.some((p) => p.userId === userId),
      );

      if (existingDm) {
        navigateToDm(existingDm.id);
      } else {
        // Start a new DM
        const result = await startDm(userId);
        if (result?.data?.conversation) {
          navigateToDm(result.data.conversation.id);
        }
      }
      handleOpenChange(false);
    },
    [conversations, navigateToDm, startDm, handleOpenChange],
  );

  // Truncate message content for display
  const truncateContent = (content: string, maxLength = 80) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength).trim() + "…";
  };

  // Format date for message results
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return d.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search"
      description="Search for messages, channels, and people"
      showCloseButton={false}
      className="max-w-2xl"
    >
      <CommandInput
        placeholder="Search messages, channels, people..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[400px]">
        {isEmpty && (
          <div className="py-14 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-4 text-sm text-muted-foreground">
              Start typing to search
            </p>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Channels
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Messages
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> People
              </span>
            </div>
          </div>
        )}

        {!isEmpty && isSearching && (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isEmpty && !isSearching && !hasResults && (
          <CommandEmpty>
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No results found for &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Try a different search term
              </p>
            </div>
          </CommandEmpty>
        )}

        {/* Channels */}
        {!isSearching && channels.length > 0 && (
          <>
            <CommandGroup heading="Channels">
              {channels.map((channel) => (
                <CommandItem
                  key={channel.id}
                  value={`channel:${channel.slug}`}
                  onSelect={() => handleSelectChannel(channel.slug)}
                  className="flex items-center gap-3 py-2.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    {channel.isPrivate ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Hash className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="font-medium">{channel.name}</span>
                    {channel.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {channel.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {channel.isMember && (
                      <Badge variant="secondary" className="text-xs">
                        Joined
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {channel.memberCount} members
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {(members.length > 0 || messages.length > 0) && (
              <CommandSeparator />
            )}
          </>
        )}

        {/* Members */}
        {!isSearching && members.length > 0 && (
          <>
            <CommandGroup heading="People">
              {members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={`member:${member.user.email}`}
                  onSelect={() => handleSelectMember(member.userId)}
                  className="flex items-center gap-3 py-2.5"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user.image ?? undefined} />
                    <AvatarFallback>
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="font-medium">{member.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {member.user.email}
                    </span>
                  </div>
                  {member.role !== "member" && (
                    <Badge
                      variant={
                        member.role === "owner" ? "default" : "secondary"
                      }
                      className="text-xs capitalize"
                    >
                      {member.role}
                    </Badge>
                  )}
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CommandItem>
              ))}
            </CommandGroup>
            {messages.length > 0 && <CommandSeparator />}
          </>
        )}

        {/* Messages */}
        {!isSearching && messages.length > 0 && (
          <CommandGroup heading="Messages">
            {messages.map((message) => (
              <CommandItem
                key={message.id}
                value={`message:${message.id}`}
                onSelect={() => handleSelectMessage(message)}
                className="flex items-start gap-3 py-2.5"
              >
                <Avatar className="h-8 w-8 mt-0.5">
                  <AvatarImage src={message.author.image ?? undefined} />
                  <AvatarFallback>
                    {getInitials(message.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {message.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      in{" "}
                      {message.channel ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Hash className="h-3 w-3" />
                          {message.channel.name}
                        </span>
                      ) : message.conversation?.name ? (
                        message.conversation.name
                      ) : (
                        "Direct Message"
                      )}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {truncateContent(message.content, 120)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground mt-0.5">
                  {formatDate(message.createdAt)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer with keyboard hints */}
      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd>
            to select
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Kbd>esc</Kbd>
          to close
        </span>
      </div>
    </CommandDialog>
  );
}

// Hook for managing search command state with keyboard shortcut
export function useSearchCommand() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to open search
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return {
    open,
    setOpen,
  };
}
