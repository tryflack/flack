"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { Hash, MessageSquare, Settings, ChevronDown, Lock } from "lucide-react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { ChannelSettingsDialog } from "./channel-settings-dialog";
import { ChannelInfoDialog } from "./channel-info-dialog";
import { useUserProfile } from "./user-profile-provider";
import { useMessages, type Message } from "@/app/lib/hooks/use-messages";
import { usePartyKit } from "@/app/lib/hooks/use-partykit";
import { useActiveMember } from "@/app/lib/hooks/use-active-member";
import { Button } from "@flack/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@flack/ui/components/tooltip";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@flack/ui/components/empty";
import type { ChatMessage, Reaction } from "@flack/realtime";
import type { ChannelListItem } from "@/app/lib/hooks/use-channels";

interface MessageAreaProps {
  roomId: string | null;
  roomType: "channel" | "conversation" | null;
  roomName?: string;
  channel?: ChannelListItem;
}

// Convert ChatMessage from PartyKit to our Message type
function chatMessageToMessage(chatMessage: ChatMessage): Message {
  return {
    ...chatMessage,
    parent: null,
    updatedAt: chatMessage.createdAt,
    deletedAt: null,
    attachments: [],
    reactions: chatMessage.reactions.map((r) => ({
      id: r.id,
      emoji: r.emoji,
      userId: r.userId,
      user: {
        id: r.userId,
        name: r.userName,
      },
    })),
  };
}

// Convert Reaction from PartyKit to our MessageReaction type
function reactionToMessageReaction(reaction: Reaction) {
  return {
    id: reaction.id,
    emoji: reaction.emoji,
    userId: reaction.userId,
    user: {
      id: reaction.userId,
      name: reaction.userName,
    },
  };
}

export function MessageArea({
  roomId,
  roomType,
  roomName,
  channel,
}: MessageAreaProps) {
  const { member } = useActiveMember();
  const { openProfile } = useUserProfile();
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const lastMarkedRoomRef = useRef<string | null>(null);

  const {
    messages,
    isLoading,
    hasMore,
    loadMore,
    send,
    edit,
    remove,
    react,
    unreact,
    markRead,
    addMessage,
    updateMessage,
    removeFromCache,
  } = useMessages(roomId, roomType ?? "channel");

  // Mark as read when entering a room
  useEffect(() => {
    if (!roomId || !roomType || isLoading) return;

    // Only mark as read if we haven't already for this room
    if (lastMarkedRoomRef.current !== roomId) {
      lastMarkedRoomRef.current = roomId;
      markRead();
    }
  }, [roomId, roomType, isLoading, markRead]);

  const handleNewMessage = useCallback(
    (chatMessage: ChatMessage) => {
      addMessage(chatMessageToMessage(chatMessage));
    },
    [addMessage],
  );

  const handleMessageEdit = useCallback(
    (messageId: string, content: string, updatedAt: string) => {
      updateMessage(messageId, { content, updatedAt, isEdited: true });
    },
    [updateMessage],
  );

  const handleReactionAdd = useCallback(
    (messageId: string, reaction: Reaction) => {
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        updateMessage(messageId, {
          reactions: [
            ...message.reactions,
            reactionToMessageReaction(reaction),
          ],
        });
      }
    },
    [messages, updateMessage],
  );

  const handleReactionRemove = useCallback(
    (messageId: string, reactionId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        updateMessage(messageId, {
          reactions: message.reactions.filter((r) => r.id !== reactionId),
        });
      }
    },
    [messages, updateMessage],
  );

  const { isConnected, typingUsers, sendTyping } = usePartyKit({
    roomId: roomId ?? "",
    roomType: roomType ?? "channel",
    onMessage: handleNewMessage,
    onMessageEdit: handleMessageEdit,
    onMessageDelete: removeFromCache,
    onReactionAdd: handleReactionAdd,
    onReactionRemove: handleReactionRemove,
  });

  if (!roomId || !roomType) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquare className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Select a channel or conversation</EmptyTitle>
            <EmptyDescription>
              Choose from the sidebar to start chatting
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const handleSend = async (content: string) => {
    await send(content);
  };

  const handleEdit = async (messageId: string, content: string) => {
    return edit(messageId, content);
  };

  const handleDelete = async (messageId: string) => {
    return remove(messageId);
  };

  const handleReact = async (messageId: string, emoji: string) => {
    // Check if user already reacted with this emoji
    const message = messages.find((m) => m.id === messageId);
    const existingReaction = message?.reactions.find(
      (r) => r.emoji === emoji && r.userId === member?.userId,
    );

    if (existingReaction) {
      await unreact(messageId, emoji);
    } else {
      await react(messageId, emoji);
    }
  };

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          {roomType === "channel" && channel ? (
            <button
              onClick={() => setShowChannelInfo(true)}
              className="group flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-muted"
            >
              {channel.isPrivate ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Hash className="h-5 w-5 text-muted-foreground" />
              )}
              <h1 className="font-semibold">{roomName || "Channel"}</h1>
              <ChevronDown className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          ) : roomType === "channel" ? (
            <>
              <Hash className="h-5 w-5 text-muted-foreground" />
              <h1 className="font-semibold">{roomName || "Channel"}</h1>
            </>
          ) : (
            <>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h1 className="font-semibold">Direct Message</h1>
            </>
          )}

          <div className="ml-auto flex items-center gap-2">
            {!isConnected && (
              <span className="text-xs text-muted-foreground">
                Reconnecting...
              </span>
            )}

            {roomType === "channel" && channel && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowChannelSettings(true)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Channel settings</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </header>

        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          currentUserId={member?.userId}
          onEditMessage={handleEdit}
          onDeleteMessage={handleDelete}
          onReact={handleReact}
          onAuthorClick={openProfile}
        />

        {/* Typing Indicator */}
        <TypingIndicator users={typingUsers} />

        {/* Input */}
        <MessageInput onSend={handleSend} onTyping={sendTyping} />
      </div>

      {/* Channel Settings Dialog */}
      {channel && (
        <ChannelSettingsDialog
          open={showChannelSettings}
          onOpenChange={setShowChannelSettings}
          channel={channel}
        />
      )}

      {/* Channel Info Dialog */}
      {channel && (
        <ChannelInfoDialog
          open={showChannelInfo}
          onOpenChange={setShowChannelInfo}
          channel={channel}
        />
      )}
    </>
  );
}
