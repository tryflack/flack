import { auth } from "@flack/auth";
import { headers, cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Generate a bearer token for the authenticated user.
 * This is used by PartyKit for WebSocket authentication.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || !session.session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use the session token as the bearer token
    // Better Auth stores this in a cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "No session token" }, { status: 401 });
    }

    return NextResponse.json({ token: sessionToken });
  } catch {
    return NextResponse.json({ error: "Failed to get token" }, { status: 500 });
  }
}
