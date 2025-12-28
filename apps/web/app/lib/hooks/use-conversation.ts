import useSWR from "swr";

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  joinedAt: string;
  lastReadAt: string | null;
}

export interface ConversationDetails {
  id: string;
  type: "dm" | "group_dm";
  name: string;
  participants: ConversationParticipant[];
  messageCount: number;
  lastReadAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useConversation(conversationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    conversation: ConversationDetails;
  }>(conversationId ? `/api/conversations/${conversationId}` : null, fetcher);

  return {
    conversation: data?.conversation ?? null,
    isLoading,
    error,
    mutate,
  };
}

