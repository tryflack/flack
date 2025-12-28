"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { authActionClient } from "@/app/lib/safe-action";
import { broadcastUserUpdated } from "@/app/lib/partykit";

const updateProfileSchema = z.object({
  displayName: z.string().max(50).optional().nullable(),
  firstName: z.string().max(50).optional().nullable(),
  lastName: z.string().max(50).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
});

export const updateProfile = authActionClient
  .metadata({ actionName: "updateProfile" })
  .schema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { displayName, firstName, lastName, bio } = parsedInput;
    const { userId } = ctx;

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        displayName: displayName ?? null,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        bio: bio ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        displayName: true,
        firstName: true,
        lastName: true,
        bio: true,
      },
    });

    // Broadcast display name update to all organizations the user is in
    // The displayed name is either displayName or name
    const displayedName = updatedUser.displayName || updatedUser.name;

    const memberships = await db.member.findMany({
      where: { userId },
      select: { organizationId: true },
    });

    await Promise.all(
      memberships.map((m) =>
        broadcastUserUpdated(m.organizationId, userId, { name: displayedName }),
      ),
    );

    return { user: updatedUser };
  });
