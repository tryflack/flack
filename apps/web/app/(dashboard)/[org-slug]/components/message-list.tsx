"use client";

import { useEffect, useRef, useCallback } from "react";
import { MessageItem } from "./message-item";
import { Skeleton } from "@flack/ui/components/skeleton";
import type { Message } from "@/app/lib/hooks/use-messages";

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  currentUserId?: string;
  onEditMessage?: (
    messageId: string,
    content: string
  ) => Promise<{ serverError?: string } | undefined>;
  onDeleteMessage?: (
    messageId: string
  ) => Promise<{ serverError?: string } | undefined>;
  onReact?: (messageId: string, emoji: string) => Promise<void>;
  onAuthorClick?: (userId: string) => void;
}

export function MessageList({
  messages,
  isLoading,
  hasMore,
  onLoadMore,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
  onReact,
  onAuthorClick,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer for loading older messages
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <MessageSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-1 flex-col-reverse gap-1 overflow-y-auto px-4 py-2"
    >
      {/* Messages in reverse chronological order (newest at bottom) */}
      {groupedMessages.map(({ date, messages: dateMessages }) => (
        <div key={date} className="flex flex-col-reverse gap-1">
          {dateMessages.map((message, index) => {
            const prevMessage = dateMessages[index + 1];
            // Always show avatar for first message, different authors, time gaps,
            // or when either message is a system message (join/leave notifications)
            const showAvatar =
              !prevMessage ||
              prevMessage.authorId !== message.authorId ||
              isMoreThan5MinutesApart(
                prevMessage.createdAt,
                message.createdAt
              ) ||
              message.type === "system" ||
              prevMessage.type === "system";

            return (
              <MessageItem
                key={message.id}
                message={message}
                showAvatar={showAvatar}
                currentUserId={currentUserId}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onReact={onReact}
                onAuthorClick={onAuthorClick}
              />
            );
          })}
          {/* Date separator */}
          <div className="relative my-4 flex items-center">
            <div className="flex-1 border-t border-border" />
            <span className="mx-4 text-xs font-medium text-muted-foreground">
              {formatDateHeader(date)}
            </span>
            <div className="flex-1 border-t border-border" />
          </div>
        </div>
      ))}

      {/* Load more sentinel */}
      {hasMore && (
        <div ref={topSentinelRef} className="h-1">
          {isLoading && (
            <div className="flex flex-col gap-4 py-4">
              {[1, 2, 3].map((i) => (
                <MessageSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    </div>
  );
}

function groupMessagesByDate(messages: Message[]) {
  const groups: Map<string, Message[]> = new Map();

  for (const message of messages) {
    const date = new Date(message.createdAt).toDateString();
    const group = groups.get(date) || [];
    group.push(message);
    groups.set(date, group);
  }

  return Array.from(groups.entries())
    .map(([date, messages]) => ({ date, messages }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function isMoreThan5MinutesApart(date1: string, date2: string): boolean {
  const diff = Math.abs(new Date(date1).getTime() - new Date(date2).getTime());
  return diff > 5 * 60 * 1000;
}
