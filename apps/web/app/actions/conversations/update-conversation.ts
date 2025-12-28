"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { orgActionClient, ActionError } from "@/app/lib/safe-action";

const updateConversationSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  name: z.string().max(80).optional(),
});

export const updateConversation = orgActionClient
  .metadata({ actionName: "updateConversation" })
  .schema(updateConversationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { conversationId, name } = parsedInput;
    const { userId, organizationId } = ctx;

    // Get the conversation
    const conversation = await db.conversation.findFirst({
      where: {
        id: conversationId,
        organizationId,
        participants: {
          some: { userId }, // Current user must be a participant
        },
      },
    });

    if (!conversation) {
      throw new ActionError("Conversation not found");
    }

    // Only group DMs can be renamed
    if (conversation.type === "dm") {
      throw new ActionError("Cannot rename a direct message");
    }

    const updatedConversation = await db.conversation.update({
      where: { id: conversationId },
      data: {
        name: name || null,
      },
    });

    return { conversation: updatedConversation };
  });

