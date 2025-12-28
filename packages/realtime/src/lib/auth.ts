import type { ConnectionState } from "./types.js";

/**
 * Validate Bearer token via HTTP request to Next.js.
 * This approach avoids importing Node.js dependencies in the PartyKit edge runtime.
 */
export async function validateToken(
  token: string,
  authUrl: string
): Promise<ConnectionState | null> {
  // Remove trailing slash if present
  const baseUrl = authUrl.endsWith("/") ? authUrl.slice(0, -1) : authUrl;
  const url = `${baseUrl}/api/auth/validate-session`;

  console.log("[PartyKit Auth] BETTER_AUTH_URL:", authUrl);
  console.log("[PartyKit Auth] Validating against:", url);
  console.log("[PartyKit Auth] Token prefix:", token?.substring(0, 20));

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[PartyKit Auth] Response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.log("[PartyKit Auth] Error body:", text);
      return null;
    }

    const data = (await response.json()) as {
      valid: boolean;
      userId: string;
      userName: string;
      userImage: string | null;
    };

    console.log("[PartyKit Auth] Valid:", data.valid);

    if (!data.valid) return null;

    return {
      userId: data.userId,
      userName: data.userName,
      userImage: data.userImage,
      authenticated: true,
    };
  } catch (error) {
    console.error("[PartyKit Auth] Fetch error:", error);
    return null;
  }
}
