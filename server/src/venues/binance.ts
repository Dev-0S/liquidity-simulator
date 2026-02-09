import WebSocket from 'ws';
import { SUPPORTED_PAIRS } from '../config';
import { normalizeBinance } from '../lib/normalize';
import { Book, PairConfig } from '../types';

const PREFIX = '[binance]';
const MAX_BACKOFF_MS = 30_000;

type BinanceConnection = {
  ws: WebSocket | null;
  pair: PairConfig;
  backoff: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  intentionallyClosed: boolean;
};

const connections: BinanceConnection[] = [];

/**
 * Connect a single Binance WebSocket stream for the given pair.
 * Uses the depth20@100ms endpoint which delivers a full top-20 refresh
 * every 100 ms, so no separate snapshot management is needed.
 */
function connectPair(
  conn: BinanceConnection,
  onBook: (book: Book) => void,
): void {
  const { pair } = conn;
  const streamName = `${pair.binanceSymbol}@depth20@100ms`;
  // Use BINANCE_WS_BASE env var to allow switching between global and US endpoints.
  // Binance global (stream.binance.com) blocks US IPs; use binance.us for US deployments.
  const wsBase = process.env.BINANCE_WS_BASE || 'wss://stream.binance.us:9443/ws';
  const url = `${wsBase}/${streamName}`;

  console.log(`${PREFIX} Connecting to ${url}`);

  const ws = new WebSocket(url);
  conn.ws = ws;

  ws.on('open', () => {
    console.log(`${PREFIX} Connected: ${pair.symbol}`);
    conn.backoff = 1_000; // reset backoff on successful connection
  });

  ws.on('message', (raw: WebSocket.RawData) => {
    try {
      const data = JSON.parse(raw.toString());

      // Binance depth20 messages contain { lastUpdateId, bids, asks }
      if (data.bids && data.asks) {
        const book = normalizeBinance(pair.symbol, {
          bids: data.bids,
          asks: data.asks,
        });
        onBook(book);
      }
    } catch (err) {
      console.error(`${PREFIX} Parse error for ${pair.symbol}:`, err);
    }
  });

  ws.on('error', (err: Error) => {
    console.error(`${PREFIX} WebSocket error for ${pair.symbol}:`, err.message);
  });

  ws.on('close', (code: number, reason: Buffer) => {
    console.log(
      `${PREFIX} Disconnected: ${pair.symbol} (code=${code}, reason=${reason.toString()})`,
    );
    conn.ws = null;

    if (!conn.intentionallyClosed) {
      scheduleReconnect(conn, onBook);
    }
  });
}

/**
 * Schedule a reconnection attempt with exponential backoff.
 */
function scheduleReconnect(
  conn: BinanceConnection,
  onBook: (book: Book) => void,
): void {
  const delay = conn.backoff;
  console.log(
    `${PREFIX} Reconnecting ${conn.pair.symbol} in ${delay}ms...`,
  );

  conn.reconnectTimer = setTimeout(() => {
    conn.reconnectTimer = null;
    connectPair(conn, onBook);
  }, delay);

  // Exponential backoff: 1s -> 2s -> 4s -> 8s -> ... -> max 30s
  conn.backoff = Math.min(conn.backoff * 2, MAX_BACKOFF_MS);
}

/**
 * Start WebSocket ingestion for all Binance pairs defined in config.
 */
export function startBinance(onBook: (book: Book) => void): void {
  const binancePairs = SUPPORTED_PAIRS.filter(
    (p) => p.venue === 'binance' && p.binanceSymbol,
  );

  console.log(
    `${PREFIX} Starting ingestion for ${binancePairs.length} pair(s)`,
  );

  for (const pair of binancePairs) {
    const conn: BinanceConnection = {
      ws: null,
      pair,
      backoff: 1_000,
      reconnectTimer: null,
      intentionallyClosed: false,
    };
    connections.push(conn);
    connectPair(conn, onBook);
  }
}

/**
 * Gracefully close all Binance WebSocket connections and cancel pending reconnects.
 */
export function stopBinance(): void {
  console.log(`${PREFIX} Stopping all connections`);

  for (const conn of connections) {
    conn.intentionallyClosed = true;

    if (conn.reconnectTimer) {
      clearTimeout(conn.reconnectTimer);
      conn.reconnectTimer = null;
    }

    if (conn.ws) {
      conn.ws.close(1000, 'shutdown');
      conn.ws = null;
    }
  }

  connections.length = 0;
}
