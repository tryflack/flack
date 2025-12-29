import { auth } from "@flack/auth";
import { db } from "@flack/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 },
    );
  }

  // Verify the requesting user is a member of the organization
  const requestingMembership = await db.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
  });

  if (!requestingMembership) {
    return NextResponse.json(
      { error: "Not a member of this organization" },
      { status: 403 },
    );
  }

  // Check if the target user is a member of the organization
  const targetMembership = await db.member.findFirst({
    where: {
      userId,
      organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          displayName: true,
          firstName: true,
          lastName: true,
          bio: true,
          createdAt: true,
        },
      },
    },
  });

  if (targetMembership) {
    return NextResponse.json({
      user: {
        ...targetMembership.user,
        role: targetMembership.role,
        memberSince: targetMembership.createdAt,
        isDeactivated: false,
      },
      isOwnProfile: session.user.id === userId,
    });
  }

  // User is not a member - check if they have messages in this organization
  // (they may be a deactivated former member)
  const hasMessagesInOrg = await db.message.findFirst({
    where: {
      organizationId,
      authorId: userId,
    },
    select: { id: true },
  });

  if (!hasMessagesInOrg) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get the user data for the deactivated member
  const deactivatedUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      displayName: true,
      firstName: true,
      lastName: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!deactivatedUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...deactivatedUser,
      role: null,
      memberSince: null,
      isDeactivated: true,
    },
    isOwnProfile: false, // Deactivated users cannot be the current user viewing
  });
}
