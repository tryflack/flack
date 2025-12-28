import useSWRInfinite from "swr/infinite";
import useSWR, { useSWRConfig } from "swr";
import { sendMessage } from "@/app/actions/messages/send-message";
import { editMessage } from "@/app/actions/messages/edit-message";
import { deleteMessage } from "@/app/actions/messages/delete-message";
import { addReaction } from "@/app/actions/messages/add-reaction";
import { removeReaction } from "@/app/actions/messages/remove-reaction";
import { markAsRead } from "@/app/actions/messages/mark-as-read";

export interface MessageAuthor {
  id: string;
  name: string;
  image: string | null;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: {
    id: string;
    name: string;
  };
}

export interface MessageAttachment {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface Message {
  id: string;
  content: string;
  type?: "message" | "system"; // Message type: regular message or system notification
  authorId: string;
  author: MessageAuthor;
  channelId: string | null;
  conversationId: string | null;
  parentId: string | null;
  parent: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
    };
  } | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  replyCount: number;
}

interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PAGE_SIZE = 50;

export function useMessages(
  roomId: string | null,
  roomType: "channel" | "conversation"
) {
  const getKey = (
    pageIndex: number,
    previousPageData: MessagesResponse | null
  ) => {
    if (!roomId) return null;
    if (previousPageData && !previousPageData.hasMore) return null;

    const param = roomType === "channel" ? "channelId" : "conversationId";
    const baseUrl = `/api/messages?${param}=${roomId}&limit=${PAGE_SIZE}`;

    if (pageIndex === 0) return baseUrl;
    if (previousPageData?.nextCursor) {
      return `${baseUrl}&cursor=${previousPageData.nextCursor}`;
    }
    return null;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<MessagesResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    });

  // Flatten all pages into a single array
  const messages = data ? data.flatMap((page) => page.messages) : [];
  const hasMore = data ? data[data.length - 1]?.hasMore : false;

  // Load more messages
  const loadMore = () => {
    if (hasMore && !isValidating) {
      setSize(size + 1);
    }
  };

  // Send a new message
  const send = async (content: string, parentId?: string) => {
    if (!roomId) return;

    const result = await sendMessage({
      content,
      ...(roomType === "channel"
        ? { channelId: roomId }
        : { conversationId: roomId }),
      parentId,
    });

    if (result?.data?.message) {
      // Optimistically add the message to the first page
      mutate();
    }

    return result;
  };

  // Edit a message
  const edit = async (messageId: string, content: string) => {
    const result = await editMessage({ messageId, content });
    if (result?.data?.message) {
      mutate();
    }
    return result;
  };

  // Delete a message
  const remove = async (messageId: string) => {
    const result = await deleteMessage({ messageId });
    if (result?.data?.success) {
      mutate();
    }
    return result;
  };

  // Add a new message to the cache (for real-time updates)
  const addMessage = (message: Message) => {
    mutate((currentData) => {
      if (!currentData || currentData.length === 0) {
        return [{ messages: [message], nextCursor: null, hasMore: false }];
      }

      // Check if message already exists (prevent duplicates)
      const allMessages = currentData.flatMap((page) => page.messages);
      if (allMessages.some((m) => m.id === message.id)) {
        return currentData; // Message already exists, don't add again
      }

      // Prepend to the first page (messages display uses flex-col-reverse,
      // so items at the start of the array appear at the bottom visually)
      const newData = [...currentData];
      newData[0] = {
        ...newData[0],
        messages: [message, ...newData[0].messages],
      };
      return newData;
    }, false);
  };

  // Update a message in the cache (for real-time edits)
  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    mutate((currentData) => {
      if (!currentData) return currentData;

      return currentData.map((page) => ({
        ...page,
        messages: page.messages.map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      }));
    }, false);
  };

  // Remove a message from cache (for real-time deletes)
  const removeFromCache = (messageId: string) => {
    mutate((currentData) => {
      if (!currentData) return currentData;

      return currentData.map((page) => ({
        ...page,
        messages: page.messages.filter((msg) => msg.id !== messageId),
      }));
    }, false);
  };

  // Add a reaction to a message
  const react = async (messageId: string, emoji: string) => {
    const result = await addReaction({ messageId, emoji });
    if (result?.data?.reaction) {
      mutate();
    }
    return result;
  };

  // Remove a reaction from a message
  const unreact = async (messageId: string, emoji: string) => {
    const result = await removeReaction({ messageId, emoji });
    if (result?.data?.success) {
      mutate();
    }
    return result;
  };

  // Get the global mutate to update channels/conversations cache
  const { mutate: globalMutate } = useSWRConfig();

  // Mark the current room as read
  const markRead = async () => {
    if (!roomId) return;

    // Optimistically update the cache BEFORE the server action
    // This prevents race conditions with dedupingInterval and revalidateOnFocus
    if (roomType === "channel") {
      globalMutate(
        "/api/channels",
        (
          current:
            | { channels: Array<{ id: string; unreadCount: number }> }
            | undefined
        ) => {
          if (!current) return current;
          return {
            ...current,
            channels: current.channels.map((ch) =>
              ch.id === roomId ? { ...ch, unreadCount: 0 } : ch
            ),
          };
        },
        { revalidate: false } // Don't refetch yet, we'll do it after the server action
      );
    } else {
      globalMutate(
        "/api/conversations",
        (
          current:
            | { conversations: Array<{ id: string; unreadCount: number }> }
            | undefined
        ) => {
          if (!current) return current;
          return {
            ...current,
            conversations: current.conversations.map((conv) =>
              conv.id === roomId ? { ...conv, unreadCount: 0 } : conv
            ),
          };
        },
        { revalidate: false }
      );
    }

    const result = await markAsRead(
      roomType === "channel"
        ? { channelId: roomId }
        : { conversationId: roomId }
    );

    // If the server action failed, revalidate to get the true state
    if (!result?.data?.success) {
      if (roomType === "channel") {
        globalMutate("/api/channels");
      } else {
        globalMutate("/api/conversations");
      }
    }

    return result;
  };

  return {
    messages,
    isLoading,
    isValidating,
    error,
    hasMore,
    loadMore,
    mutate,
    // Mutations
    send,
    edit,
    remove,
    react,
    unreact,
    markRead,
    // Real-time helpers
    addMessage,
    updateMessage,
    removeFromCache,
  };
}

// Hook for thread replies
export function useThread(parentId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<MessagesResponse>(
    parentId ? `/api/messages?parentId=${parentId}&limit=100` : null,
    fetcher
  );

  // Send a reply
  const reply = async (content: string) => {
    if (!parentId) return;

    // We need to know the channel/conversation of the parent
    // This would come from the parent message context
    // For now, we'll handle this at the component level
  };

  return {
    replies: data?.messages ?? [],
    isLoading,
    error,
    mutate,
  };
}
