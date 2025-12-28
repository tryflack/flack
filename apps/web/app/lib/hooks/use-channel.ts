import useSWR from "swr";

export interface ChannelMember {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

export interface ChannelDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPrivate: boolean;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: string;
  members: ChannelMember[];
  messageCount: number;
  isMember: boolean;
  userRole: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useChannel(channelId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    channel: ChannelDetails;
  }>(channelId ? `/api/channels/${channelId}` : null, fetcher);

  return {
    channel: data?.channel ?? null,
    isLoading,
    error,
    mutate,
  };
}

