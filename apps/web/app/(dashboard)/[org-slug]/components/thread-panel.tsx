"use client";

import { X, MessageSquare } from "lucide-react";
import { Button } from "@flack/ui/components/button";
import { ScrollArea } from "@flack/ui/components/scroll-area";
import { Skeleton } from "@flack/ui/components/skeleton";
import { MessageItem } from "./message-item";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import { useThread, useMessages } from "@/app/lib/hooks/use-messages";
import { usePartyKit } from "@/app/lib/hooks/use-partykit";

interface ThreadPanelProps {
  threadId: string;
  roomId: string | null;
  roomType: "channel" | "conversation" | null;
}

export function ThreadPanel({ threadId, roomId, roomType }: ThreadPanelProps) {
  const { closeThread } = useChatParams();
  const { replies, isLoading, mutate } = useThread(threadId);
  const { send } = useMessages(roomId, roomType ?? "channel");

  const { typingUsers, sendTyping } = usePartyKit({
    roomId: roomId ?? "",
    roomType: roomType ?? "channel",
    onMessage: (message) => {
      if (message.parentId === threadId) {
        mutate();
      }
    },
  });

  // Find parent message from replies (first message should be the parent)
  const parentMessage = replies.find((r) => r.id === threadId);

  const handleSendReply = async (content: string) => {
    await send(content, threadId);
    mutate();
  };

  return (
    <aside className="flex w-[400px] flex-col border-l bg-background">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Thread</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeThread}>
          <X className="h-4 w-4" />
        </Button>
      </header>

      {/* Thread content */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
          {isLoading ? (
            <>
              <ThreadMessageSkeleton />
              <div className="my-2 border-t" />
              <ThreadMessageSkeleton />
              <ThreadMessageSkeleton />
            </>
          ) : (
            <>
              {/* Parent message */}
              {parentMessage && (
                <>
                  <MessageItem message={parentMessage} showAvatar />
                  <div className="my-2 flex items-center gap-2">
                    <div className="flex-1 border-t" />
                    <span className="text-xs text-muted-foreground">
                      {replies.length - 1}{" "}
                      {replies.length - 1 === 1 ? "reply" : "replies"}
                    </span>
                    <div className="flex-1 border-t" />
                  </div>
                </>
              )}

              {/* Replies */}
              {replies
                .filter((r) => r.id !== threadId)
                .map((reply) => (
                  <MessageItem key={reply.id} message={reply} showAvatar />
                ))}

              {replies.length === 0 && !isLoading && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No replies yet. Start the conversation!
                </p>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Typing indicator */}
      <TypingIndicator users={typingUsers} />

      {/* Reply input */}
      <MessageInput
        onSend={handleSendReply}
        onTyping={sendTyping}
        placeholder="Reply in thread..."
      />
    </aside>
  );
}

function ThreadMessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

