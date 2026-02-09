import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import broadcaster from './broadcast';
import { Book, WsMessage } from '../types';

const PREFIX = '[ws]';

/** Reference to the latest book cache, injected at setup time. */
let bookCacheRef: Map<string, Book> | null = null;

/**
 * Attach a WebSocket server to the given HTTP server.
 *
 * Clients connect at ws://<host>:<port>/ws and immediately receive
 * snapshot messages for every pair currently in the book cache.
 *
 * @param server  The Node.js HTTP server to upgrade on.
 * @param bookCache  The shared Map of latest Book snapshots keyed by "venue:symbol".
 */
export function setupWebSocket(
  server: http.Server,
  bookCache: Map<string, Book>,
): void {
  bookCacheRef = bookCache;

  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('listening', () => {
    console.log(`${PREFIX} WebSocket server listening on path /ws`);
  });

  wss.on('connection', (ws: WebSocket) => {
    broadcaster.addClient(ws);

    // Send current snapshots for every tracked pair.
    sendSnapshots(ws);

    ws.on('close', (code: number, reason: Buffer) => {
      console.log(
        `${PREFIX} Client closed (code=${code}, reason=${reason.toString()})`,
      );
      broadcaster.removeClient(ws);
    });

    ws.on('error', (err: Error) => {
      console.error(`${PREFIX} Client error: ${err.message}`);
      broadcaster.removeClient(ws);
    });
  });

  wss.on('error', (err: Error) => {
    console.error(`${PREFIX} Server error: ${err.message}`);
  });
}

/**
 * Send the latest cached book snapshot for every pair to a single client.
 */
function sendSnapshots(ws: WebSocket): void {
  if (!bookCacheRef) return;

  for (const book of bookCacheRef.values()) {
    const msg: WsMessage = { type: 'snapshot', data: book };
    broadcaster.sendTo(ws, msg);
  }
}
