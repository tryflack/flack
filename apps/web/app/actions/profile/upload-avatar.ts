"use server";

import { z } from "zod";
import { db } from "@flack/db";
import { put, del } from "@vercel/blob";
import { authActionClient, ActionError } from "@/app/lib/safe-action";
import { broadcastUserUpdated } from "@/app/lib/partykit";

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const uploadAvatarSchema = z.object({
  file: z.instanceof(File),
});

export const uploadAvatar = authActionClient
  .metadata({ actionName: "uploadAvatar" })
  .schema(uploadAvatarSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { file } = parsedInput;
    const { userId } = ctx;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ActionError("File size must be less than 4MB");
    }

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      throw new ActionError("File must be a JPEG, PNG, or WebP image");
    }

    // Get current user to check for existing avatar
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { image: true },
    });

    // Delete old avatar from Vercel Blob if it exists and is a blob URL
    if (currentUser?.image?.includes("blob.vercel-storage.com")) {
      try {
        await del(currentUser.image);
      } catch (error) {
        // Ignore errors deleting old avatar
        console.error("Failed to delete old avatar:", error);
      }
    }

    // Generate unique filename
    const extension = file.type.split("/")[1];
    const filename = `avatars/${userId}-${Date.now()}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Update user's image URL in database
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { image: blob.url },
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

    // Broadcast update to all organizations the user is a member of
    const memberships = await db.member.findMany({
      where: { userId },
      select: { organizationId: true },
    });

    await Promise.all(
      memberships.map((m) =>
        broadcastUserUpdated(m.organizationId, userId, { image: blob.url })
      )
    );

    return { user: updatedUser, url: blob.url };
  });
