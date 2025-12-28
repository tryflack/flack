import { auth } from "@flack/auth";
import { db } from "@flack/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ member: null }, { status: 401 });
  }

  const organizationId = session.session.activeOrganizationId;

  if (!organizationId) {
    return NextResponse.json({ member: null }, { status: 200 });
  }

  // Get current user's membership
  const membership = await db.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
    select: {
      id: true,
      role: true,
      userId: true,
      organizationId: true,
    },
  });

  return NextResponse.json({
    member: membership,
  });
}

