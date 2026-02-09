import WebSocket from 'ws';
import { WsMessage } from '../types';

const PREFIX = '[ws]';

/**
 * Manages connected WebSocket clients and provides broadcast / unicast helpers.
 */
class BroadcastManager {
  private clients: Set<WebSocket> = new Set();

  /** Register a new WebSocket client. */
  addClient(ws: WebSocket): void {
    this.clients.add(ws);
    console.log(
      `${PREFIX} Client connected (total: ${this.clients.size})`,
    );
  }

  /** Remove a WebSocket client. */
  removeClient(ws: WebSocket): void {
    this.clients.delete(ws);
    console.log(
      `${PREFIX} Client disconnected (total: ${this.clients.size})`,
    );
  }

  /** Broadcast a message to every connected client. */
  broadcast(msg: WsMessage): void {
    const payload = JSON.stringify(msg);

    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`${PREFIX} Send error during broadcast: ${message}`);
        }
      }
    }
  }

  /** Send a message to a single client. */
  sendTo(ws: WebSocket, msg: WsMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(msg));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`${PREFIX} Send error (unicast): ${message}`);
      }
    }
  }

  /** Return current connected client count (useful for health checks). */
  get clientCount(): number {
    return this.clients.size;
  }
}

/** Singleton broadcast manager instance. */
const broadcaster = new BroadcastManager();
export default broadcaster;
