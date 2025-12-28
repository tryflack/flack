"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const updateChannelSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(80, "Channel name must be 80 characters or less")
    .optional(),
  description: z.string().max(250).optional(),
  isPrivate: z.boolean().optional(),
});

export const updateChannel = orgActionClient
  .metadata({ actionName: "updateChannel" })
  .schema(updateChannelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { channelId, name, description, isPrivate } = parsedInput;
    const { userId, organizationId } = ctx;

    // Check if channel exists and user has permission
    const channel = await db.channel.findFirst({
      where: {
        id: channelId,
        organizationId,
      },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!channel) {
      throw new ActionError("Channel not found");
    }

    // Only channel admins or the creator can update
    const membership = channel.members[0];
    const isAdmin = membership?.role === "admin";
    const isCreator = channel.createdById === userId;

    if (!isAdmin && !isCreator) {
      throw new ActionError("You don't have permission to update this channel");
    }

    // Build update data
    const updateData: {
      name?: string;
      slug?: string;
      description?: string;
      isPrivate?: boolean;
    } = {};

    if (name) {
      updateData.name = name;
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Check slug uniqueness
      const existingChannel = await db.channel.findFirst({
        where: {
          organizationId,
          slug: updateData.slug,
          id: { not: channelId },
        },
      });

      if (existingChannel) {
        throw new ActionError("A channel with this name already exists");
      }
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (isPrivate !== undefined) {
      updateData.isPrivate = isPrivate;
    }

    const updatedChannel = await db.channel.update({
      where: { id: channelId },
      data: updateData,
    });

    return { channel: updatedChannel };
  });
