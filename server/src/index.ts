import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';

import { PORT } from './config';
import { Book, WsMessage } from './types';

import healthRouter from './routes/health';
import pairsRouter from './routes/pairs';
import { createSnapshotRouter } from './routes/snapshot';

import { setupWebSocket } from './ws/server';
import broadcaster from './ws/broadcast';

import { startBinance, stopBinance } from './venues/binance';
import { startOpenBook, stopOpenBook } from './venues/openbook';

const PREFIX = '[server]';

// ---------------------------------------------------------------------------
// Book cache: keyed by "venue:symbol" -> latest Book
// ---------------------------------------------------------------------------
const bookCache = new Map<string, Book>();

// ---------------------------------------------------------------------------
// Throttled broadcast: max 1 broadcast per pair every THROTTLE_MS
// Keeps the full book in cache but only sends trimmed updates to clients
// ---------------------------------------------------------------------------
const THROTTLE_MS = parseInt(process.env.BROADCAST_THROTTLE_MS || '250', 10);
const MAX_LEVELS = parseInt(process.env.MAX_BOOK_LEVELS || '10', 10);
const lastBroadcast = new Map<string, number>();

function trimBook(book: Book): Book {
  return {
    ...book,
    bids: book.bids.slice(0, MAX_LEVELS),
    asks: book.asks.slice(0, MAX_LEVELS),
  };
}

/**
 * Shared handler invoked by both Binance and OpenBook venue adapters
 * whenever a new order book update arrives.
 */
function handleBookUpdate(book: Book): void {
  const key = `${book.venue}:${book.symbol}`;
  bookCache.set(key, book);

  // Throttle: only broadcast if enough time has passed since last send
  const now = Date.now();
  const last = lastBroadcast.get(key) || 0;
  if (now - last < THROTTLE_MS) return;
  lastBroadcast.set(key, now);

  const msg: WsMessage = { type: 'book_update', data: trimBook(book) };
  broadcaster.broadcast(msg);
}

// ---------------------------------------------------------------------------
// Express application
// ---------------------------------------------------------------------------
const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
}));
app.use(express.json());

// Mount route handlers
app.use(healthRouter);
app.use(pairsRouter);
app.use(createSnapshotRouter(bookCache));

// ---------------------------------------------------------------------------
// HTTP + WebSocket server
// ---------------------------------------------------------------------------
const server = http.createServer(app);

setupWebSocket(server, bookCache);

// ---------------------------------------------------------------------------
// Start venue ingestion (wrapped so a failure doesn't crash the server)
// ---------------------------------------------------------------------------
try {
  startBinance(handleBookUpdate);
} catch (err) {
  console.error(`${PREFIX} Failed to start Binance ingestion:`, err);
}

try {
  startOpenBook(handleBookUpdate);
} catch (err) {
  console.error(`${PREFIX} Failed to start OpenBook ingestion:`, err);
}

// ---------------------------------------------------------------------------
// Listen
// ---------------------------------------------------------------------------
server.listen(PORT, '0.0.0.0', () => {
  console.log(`${PREFIX} Listening on http://localhost:${PORT}`);
  console.log(`${PREFIX} WebSocket available at ws://localhost:${PORT}/ws`);
  console.log(`${PREFIX} Health check: http://localhost:${PORT}/api/health`);
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
function shutdown(signal: string): void {
  console.log(`\n${PREFIX} Received ${signal}, shutting down gracefully...`);

  stopBinance();
  stopOpenBook();

  server.close((err) => {
    if (err) {
      console.error(`${PREFIX} Error closing HTTP server:`, err);
      process.exit(1);
    }
    console.log(`${PREFIX} HTTP server closed`);
    process.exit(0);
  });

  // Force exit after 5 seconds if graceful shutdown stalls
  setTimeout(() => {
    console.error(`${PREFIX} Forced exit after timeout`);
    process.exit(1);
  }, 5_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
