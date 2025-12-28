import { createAuthClient } from "better-auth/react";
import {
  emailOTPClient,
  adminClient,
  organizationClient,
} from "better-auth/client/plugins";
import { createAccessControl } from "better-auth/plugins/access";

const BEARER_TOKEN_KEY = "flack_bearer_token";

/**
 * Access Control Configuration (must match server)
 */
const statement = {
  channel: ["create", "update", "delete", "manage-members"],
  message: ["send", "edit", "delete", "moderate"],
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
} as const;

export const ac = createAccessControl(statement);

export const memberRole = ac.newRole({
  channel: ["create"],
  message: ["send", "edit", "delete"],
});

export const adminRole = ac.newRole({
  channel: ["create", "update", "delete", "manage-members"],
  message: ["send", "edit", "delete", "moderate"],
  member: ["create", "update"],
  invitation: ["create", "cancel"],
});

export const ownerRole = ac.newRole({
  channel: ["create", "update", "delete", "manage-members"],
  message: ["send", "edit", "delete", "moderate"],
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
});

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  plugins: [
    emailOTPClient(),
    adminClient(),
    organizationClient({
      ac,
      roles: {
        member: memberRole,
        admin: adminRole,
        owner: ownerRole,
      },
    }),
  ],
  fetchOptions: {
    onSuccess: (ctx) => {
      const authToken = ctx.response.headers.get("set-auth-token");
      if (authToken && typeof window !== "undefined") {
        localStorage.setItem(BEARER_TOKEN_KEY, authToken);
      }
    },
  },
});

/**
 * Fetch a bearer token for PartyKit authentication.
 * This calls the token endpoint to get the session token.
 */
export async function fetchBearerToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    // Use relative URL since we're on the same origin
    const response = await fetch("/api/auth/token", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.token) {
      localStorage.setItem(BEARER_TOKEN_KEY, data.token);
      return data.token;
    }
    return null;
  } catch {
    return null;
  }
}

// Helper to get the stored bearer token for PartyKit authentication
export function getBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(BEARER_TOKEN_KEY);
}

// Helper to clear the bearer token on logout
export function clearBearerToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(BEARER_TOKEN_KEY);
  }
}
