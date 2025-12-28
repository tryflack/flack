"use server";

import { db } from "@flack/db";
import { authActionClient, ActionError } from "@/app/lib/safe-action";
import { z } from "zod";

const createDefaultChannelsSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
});

/**
 * Creates default channels (general and announcements) for a newly created organization.
 * This should be called immediately after organization creation.
 */
export const createDefaultChannels = authActionClient
  .metadata({ actionName: "createDefaultChannels" })
  .schema(createDefaultChannelsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { organizationId } = parsedInput;
    const { userId } = ctx;

    // Verify the user is a member (owner) of this organization
    const membership = await db.member.findFirst({
      where: {
        userId,
        organizationId,
      },
    });

    if (!membership) {
      throw new ActionError("You are not a member of this organization");
    }

    // Check if default channels already exist (idempotency)
    const existingChannels = await db.channel.findMany({
      where: {
        organizationId,
        slug: { in: ["general", "announcements"] },
      },
    });

    if (existingChannels.length > 0) {
      // Default channels already exist, return them
      return { channels: existingChannels, created: false };
    }

    // Create default channels with the creator as admin
    const generalId = crypto.randomUUID();
    const announcementsId = crypto.randomUUID();

    const channels = await db.$transaction(async (tx) => {
      // Create general channel
      const general = await tx.channel.create({
        data: {
          id: generalId,
          name: "general",
          slug: "general",
          description: "General discussion for the team",
          organizationId,
          createdById: userId,
          isPrivate: false,
          members: {
            create: {
              userId,
              role: "admin",
            },
          },
        },
      });

      // Create announcements channel
      const announcements = await tx.channel.create({
        data: {
          id: announcementsId,
          name: "announcements",
          slug: "announcements",
          description: "Important team announcements",
          organizationId,
          createdById: userId,
          isPrivate: false,
          members: {
            create: {
              userId,
              role: "admin",
            },
          },
        },
      });

      return [general, announcements];
    });

    return { channels, created: true };
  });
