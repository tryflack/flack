import { auth } from "@flack/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Validate a Bearer token for PartyKit authentication.
 * PartyKit calls this endpoint to verify the user's session.
 */
export async function GET(req: NextRequest) {
  try {
    // Pass the request headers directly - Better Auth will extract the Bearer token
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      userId: session.user.id,
      userName: session.user.name ?? "Unknown",
      userImage: session.user.image ?? null,
    });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}

