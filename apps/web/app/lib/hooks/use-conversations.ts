import useSWR from "swr";
import { createDm } from "@/app/actions/conversations/create-dm";

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  joinedAt: string;
  lastReadAt: string | null;
}

export interface ConversationListItem {
  id: string;
  type: "dm" | "group_dm";
  name: string;
  participants: ConversationParticipant[];
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
    };
  } | null;
  messageCount: number;
  unreadCount: number;
  lastReadAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useConversations(type?: "dm" | "group_dm") {
  const url = type ? `/api/conversations?type=${type}` : "/api/conversations";

  const { data, error, isLoading, mutate } = useSWR<{
    conversations: ConversationListItem[];
  }>(url, fetcher, {
    // Keep showing previous data while revalidating (prevents flash)
    keepPreviousData: true,
    // Also refresh when window regains focus
    revalidateOnFocus: true,
    // Dedupe requests within 2 seconds
    dedupingInterval: 2000,
  });

  // Start a new DM conversation
  const startDm = async (targetUserId: string) => {
    const result = await createDm({ targetUserId });
    if (result?.data?.conversation) {
      mutate(); // Revalidate conversation list
    }
    return result;
  };

  return {
    conversations: data?.conversations ?? [],
    isLoading,
    error,
    mutate,
    // Mutations
    startDm,
  };
}
