import useSWR from "swr";
import { createChannel } from "@/app/actions/channels/create-channel";
import { updateChannel } from "@/app/actions/channels/update-channel";
import { deleteChannel } from "@/app/actions/channels/delete-channel";
import { joinChannel } from "@/app/actions/channels/join-channel";
import { leaveChannel } from "@/app/actions/channels/leave-channel";
import { inviteToChannel } from "@/app/actions/channels/invite-to-channel";
import { removeFromChannel } from "@/app/actions/channels/remove-from-channel";

export interface ChannelListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPrivate: boolean;
  memberCount: number;
  isMember: boolean;
  membership: {
    role: string;
    joinedAt: string;
  } | null;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useChannels() {
  const { data, error, isLoading, mutate } = useSWR<{
    channels: ChannelListItem[];
  }>("/api/channels", fetcher);

  // Create a new channel
  const create = async (input: {
    name: string;
    description?: string;
    isPrivate?: boolean;
  }) => {
    const result = await createChannel(input);
    if (result?.data?.channel) {
      mutate(); // Revalidate the channel list
    }
    return result;
  };

  // Update a channel
  const update = async (
    channelId: string,
    input: {
      name?: string;
      description?: string;
      isPrivate?: boolean;
    }
  ) => {
    const result = await updateChannel({ channelId, ...input });
    if (result?.data?.channel) {
      mutate();
    }
    return result;
  };

  // Delete a channel
  const remove = async (channelId: string) => {
    const result = await deleteChannel({ channelId });
    if (result?.data?.success) {
      mutate();
    }
    return result;
  };

  // Join a public channel
  const join = async (channelId: string) => {
    const result = await joinChannel({ channelId });
    if (result?.data?.membership) {
      mutate();
    }
    return result;
  };

  // Leave a channel
  const leave = async (channelId: string) => {
    const result = await leaveChannel({ channelId });
    if (result?.data?.success) {
      mutate();
    }
    return result;
  };

  // Invite a user to a channel
  const invite = async (channelId: string, userId: string) => {
    const result = await inviteToChannel({ channelId, userId });
    if (result?.data?.success) {
      mutate();
    }
    return result;
  };

  // Remove a user from a channel
  const removeMember = async (channelId: string, userId: string) => {
    const result = await removeFromChannel({ channelId, userId });
    if (result?.data?.success) {
      mutate();
    }
    return result;
  };

  return {
    channels: data?.channels ?? [],
    isLoading,
    error,
    mutate,
    // Mutations
    create,
    update,
    remove,
    join,
    leave,
    invite,
    removeMember,
  };
}

