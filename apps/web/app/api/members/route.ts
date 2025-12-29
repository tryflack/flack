import { auth } from "@flack/auth";
import { db } from "@flack/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return NextResponse.json(
      { error: "No active organization" },
      { status: 400 },
    );
  }

  // Verify membership
  const membership = await db.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this organization" },
      { status: 403 },
    );
  }

  // Get all members of this organization
  const members = await db.member.findMany({
    where: {
      organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: [
      { role: "asc" }, // owners first, then admins, then members
      { createdAt: "asc" },
    ],
  });

  // Get pending invitations (only for admins/owners)
  let invitations: {
    id: string;
    email: string;
    role: string | null;
    status: string;
    expiresAt: Date;
    createdAt: Date;
    inviter: {
      id: string;
      name: string;
      email: string;
    };
  }[] = [];

  if (membership.role === "owner" || membership.role === "admin") {
    const rawInvitations = await db.invitation.findMany({
      where: {
        organizationId,
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    invitations = rawInvitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt,
      inviter: {
        id: inv.user.id,
        name: inv.user.name,
        email: inv.user.email,
      },
    }));
  }

  // Transform members
  const transformedMembers = members.map((member) => ({
    id: member.id,
    userId: member.userId,
    role: member.role,
    createdAt: member.createdAt,
    user: member.user,
  }));

  // Sort members: owner first, then admin, then member
  const roleOrder = { owner: 0, admin: 1, member: 2 };
  transformedMembers.sort((a, b) => {
    const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
    const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
    return aOrder - bOrder;
  });

  return NextResponse.json({
    members: transformedMembers,
    invitations,
    currentUserRole: membership.role,
  });
}


