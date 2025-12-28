import { auth } from "@flack/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Generate a bearer token for the authenticated user.
 * This is used by PartyKit for WebSocket authentication.
 *
 * Better Auth's bearer plugin returns the token in the set-auth-token header,
 * so we make a request that triggers that header and return it.
 */
export async function GET() {
  try {
    const reqHeaders = await headers();

    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session?.user || !session.session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // The session token IS the bearer token with Better Auth's bearer plugin
    // Return the session token which can be used for bearer authentication
    const token = session.session.token;

    if (!token) {
      return NextResponse.json({ error: "No session token" }, { status: 401 });
    }

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Failed to get token" }, { status: 500 });
  }
}
