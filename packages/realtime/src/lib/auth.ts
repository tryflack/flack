import type { ConnectionState } from "./types.js";

/**
 * Validate Bearer token via HTTP request to Next.js.
 * This approach avoids importing Node.js dependencies in the PartyKit edge runtime.
 */
export async function validateToken(
  token: string,
  authUrl: string
): Promise<ConnectionState | null> {
  try {
    const response = await fetch(`${authUrl}/api/auth/validate-session`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      valid: boolean;
      userId: string;
      userName: string;
      userImage: string | null;
    };

    if (!data.valid) return null;

    return {
      userId: data.userId,
      userName: data.userName,
      userImage: data.userImage,
      authenticated: true,
    };
  } catch {
    return null;
  }
}
