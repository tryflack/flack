"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const createGroupDmSchema = z.object({
  participantIds: z
    .array(z.string())
    .min(2, "Group DM requires at least 2 other participants"),
  name: z.string().max(80).optional(),
});

export const createGroupDm = orgActionClient
  .metadata({ actionName: "createGroupDm" })
  .schema(createGroupDmSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { participantIds, name } = parsedInput;
    const { userId, organizationId } = ctx;

    // Remove duplicates and self from participant list
    const uniqueParticipants = [...new Set(participantIds)].filter(
      (id) => id !== userId,
    );

    if (uniqueParticipants.length < 2) {
      throw new ActionError("Group DM requires at least 2 other participants");
    }

    // Verify all participants are members of the org
    const memberships = await db.member.findMany({
      where: {
        organizationId,
        userId: { in: uniqueParticipants },
      },
    });

    if (memberships.length !== uniqueParticipants.length) {
      throw new ActionError(
        "Some participants are not members of this organization",
      );
    }

    // Create group DM conversation
    const conversation = await db.conversation.create({
      data: {
        organizationId,
        type: "group_dm",
        name: name || null,
        participants: {
          create: [
            { userId }, // Include the creator
            ...uniqueParticipants.map((id) => ({ userId: id })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return { conversation };
  });
