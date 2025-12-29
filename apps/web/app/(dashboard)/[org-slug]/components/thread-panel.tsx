"use client";

import { useLayoutEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { Skeleton } from "@flack/ui/components/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@flack/ui/components/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@flack/ui/components/sheet";
import { useIsMobile } from "@flack/ui/hooks/use-mobile";
import { MessageItem } from "./message-item";
import { MessageInput } from "./message-input";
import { TypingIndicator } from "./typing-indicator";
import { useChatParams } from "@/app/lib/hooks/use-chat-params";
import { useThread, useMessages } from "@/app/lib/hooks/use-messages";
import { usePartyKit } from "@/app/lib/hooks/use-partykit";
import { useUserProfile } from "./user-profile-provider";

interface ThreadPanelProps {
  threadId: string;
  roomId: string | null;
  roomType: "channel" | "conversation" | null;
}

export function ThreadPanel({ threadId, roomId, roomType }: ThreadPanelProps) {
  const isMobile = useIsMobile();
  const { closeThread } = useChatParams();
  const { openProfile } = useUserProfile();
  const { replies, isLoading, mutate } = useThread(threadId);
  const { send } = useMessages(roomId, roomType ?? "channel");

  const { typingUsers, sendTyping } = usePartyKit({
    roomId: roomId ?? "",
    roomType: roomType ?? "channel",
    threadId, // Scope typing indicators to this thread
    onMessage: (message) => {
      if (message.parentId === threadId) {
        mutate();
      }
    },
  });

  // Find parent message from replies (first message should be the parent)
  const parentMessage = replies.find((r) => r.id === threadId);

  // Use a callback ref to scroll to bottom when the container mounts
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const setScrollRef = (node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
    // Scroll to bottom when container is attached
    if (node && !isLoading && replies.length > 0) {
      node.scrollTop = node.scrollHeight;
    }
  };

  // Also scroll when new replies come in
  useLayoutEffect(() => {
    if (!isLoading && replies.length > 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [replies.length, isLoading]);

  const handleSendReply = async (content: string) => {
    await send(content, threadId);
    mutate();
  };

  const threadContent = (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Thread content - native scrollable div */}
      <div ref={setScrollRef} className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-2">
          {isLoading ? (
            <>
              <ThreadMessageSkeleton />
              <div className="my-2 border-t border-border" />
              <ThreadMessageSkeleton />
              <ThreadMessageSkeleton />
            </>
          ) : (
            <>
              {/* Parent message */}
              {parentMessage && (
                <>
                  <MessageItem
                    message={parentMessage}
                    showAvatar
                    onAuthorClick={openProfile}
                  />
                  <div className="my-2 flex items-center gap-2">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-muted-foreground">
                      {replies.length - 1}{" "}
                      {replies.length - 1 === 1 ? "reply" : "replies"}
                    </span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                </>
              )}

              {/* Replies */}
              {replies
                .filter((r) => r.id !== threadId)
                .map((reply) => (
                  <MessageItem
                    key={reply.id}
                    message={reply}
                    showAvatar
                    onAuthorClick={openProfile}
                  />
                ))}

              {replies.length === 0 && !isLoading && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No replies yet. Start the conversation!
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Typing indicator */}
      <TypingIndicator users={typingUsers} />

      {/* Reply input */}
      <MessageInput
        onSend={handleSendReply}
        onTyping={sendTyping}
        placeholder="Reply in thread..."
      />
    </div>
  );

  // Mobile: render as a Drawer
  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => !open && closeThread()}>
        <DrawerContent className="flex h-[85vh] max-h-[85vh] flex-col overflow-hidden">
          <DrawerHeader className="flex shrink-0 flex-row items-center gap-2 border-b border-border pb-4">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <DrawerTitle className="text-sm">Thread</DrawerTitle>
          </DrawerHeader>
          {threadContent}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: render as a Sheet
  return (
    <Sheet open onOpenChange={(open) => !open && closeThread()}>
      <SheetContent
        size="lg"
        className="flex flex-col gap-0 overflow-hidden p-0"
      >
        <SheetHeader className="flex h-12 shrink-0 flex-row items-center gap-2 border-b border-border p-0 px-4">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <SheetTitle className="text-sm">Thread</SheetTitle>
        </SheetHeader>
        {threadContent}
      </SheetContent>
    </Sheet>
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
