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
}
