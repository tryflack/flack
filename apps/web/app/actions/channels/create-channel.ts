"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient } from "@/app/lib/safe-action";

const createChannelSchema = z.object({
  name: z
    .string()
    .min(1, "Channel name is required")
    .max(80, "Channel name must be 80 characters or less"),
  description: z.string().max(250).optional(),
  isPrivate: z.boolean().default(false),
});

export const createChannel = orgActionClient
  .metadata({ actionName: "createChannel" })
  .schema(createChannelSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, description, isPrivate } = parsedInput;
    const { userId, organizationId } = ctx;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if slug already exists in this org
    const existingChannel = await db.channel.findUnique({
      where: {
        organizationId_slug: {
          organizationId,
          slug,
        },
      },
    });

    if (existingChannel) {
      throw new Error("A channel with this name already exists");
    }

    // Create the channel
    const channel = await db.channel.create({
      data: {
        name,
        slug,
        description,
        isPrivate,
        organizationId,
        createdById: userId,
        // Add creator as first member
        members: {
          create: {
            userId,
            role: "admin",
          },
        },
      },
      include: {
        members: true,
      },
    });

    return { channel };
  });

