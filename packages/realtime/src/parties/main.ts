import type { PartyKitServer, Connection, Room } from "partykit/server";

// Main party - handles general routing and health checks
export default class MainParty implements PartyKitServer {
  constructor(public room: Room) {}

  onConnect(conn: Connection) {
    conn.send(JSON.stringify({ type: "connected", room: this.room.id }));
  }

  onMessage(
    message: string | ArrayBuffer | ArrayBufferView,
    sender: Connection
  ) {
    // Echo back for health checks
    if (typeof message === "string") {
      sender.send(message);
    }
  }

  // Debug endpoint - GET /parties/main/debug
  async onRequest(req: Request): Promise<Response> {
    // TODO: Remove hardcoded URL after fixing env vars
    const authUrl =
      process.env.BETTER_AUTH_URL || "https://flack-web.vercel.app";

    // Test the connection
    const baseUrl = authUrl.endsWith("/") ? authUrl.slice(0, -1) : authUrl;
    const testUrl = `${baseUrl}/api/auth/validate-session`;

    let testResult = "not tested";
    try {
      const response = await fetch(testUrl, {
        method: "GET",
        headers: { Authorization: "Bearer test-invalid-token" },
      });
      testResult = `status: ${response.status}, reachable: true`;
    } catch (error) {
      testResult = `error: ${error}`;
    }

    return new Response(
      JSON.stringify(
        {
          BETTER_AUTH_URL: authUrl,
          testUrl: testUrl,
          testResult: testResult,
        },
        null,
        2
      ),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
