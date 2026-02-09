import { useCallback, useEffect, useRef, useState } from 'react';
import { Book, ConnectionStatus, Venue, WsMessage } from '../lib/types';

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30_000;
const MAX_PRICE_HISTORY = 300;

export interface PricePoint {
  time: number;
  mid: number;
}

export interface OrderBookState {
  books: Record<string, Book>;
  connectionStatus: ConnectionStatus;
  lastUpdate: number;
  getBook: (venue: Venue, symbol: string) => Book | undefined;
  priceHistory: Record<string, PricePoint[]>;
  getPriceHistory: (venue: Venue, symbol: string) => PricePoint[];
}

function bookKey(venue: string, symbol: string): string {
  return `${venue}:${symbol}`;
}

export function useOrderBook(): OrderBookState {
  const [books, setBooks] = useState<Record<string, Book>>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Use a ref for price history to avoid re-renders on every tick
  const priceHistoryRef = useRef<Record<string, PricePoint[]>>({});
  const [priceHistory, setPriceHistory] = useState<Record<string, PricePoint[]>>({});

  // Throttle price history state updates to avoid excessive re-renders
  const lastHistoryUpdateRef = useRef(0);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Clean up any existing connection
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
    }

    setConnectionStatus('connecting');

    // In production, use VITE_WS_URL env var pointing to the deployed backend.
    // In dev, the Vite proxy handles it via the relative path.
    const envWsUrl = import.meta.env.VITE_WS_URL;
    let wsUrl: string;
    if (envWsUrl) {
      wsUrl = envWsUrl;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnectionStatus('connected');
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.type === 'book_update' || msg.type === 'snapshot') {
          const { data } = msg;
          const key = bookKey(data.venue, data.symbol);
          setBooks((prev) => ({
            ...prev,
            [key]: data,
          }));
          setLastUpdate(Date.now());

          // Track price history
          if (data.bids.length > 0 && data.asks.length > 0) {
            const bestBid = data.bids[0][0];
            const bestAsk = data.asks[0][0];
            const mid = (bestBid + bestAsk) / 2;
            const now = Date.now();

            const existing = priceHistoryRef.current[key] || [];
            const updated = [...existing, { time: now, mid }];
            if (updated.length > MAX_PRICE_HISTORY) {
              updated.splice(0, updated.length - MAX_PRICE_HISTORY);
            }
            priceHistoryRef.current = {
              ...priceHistoryRef.current,
              [key]: updated,
            };

            // Throttle React state update to ~4 times per second
            if (now - lastHistoryUpdateRef.current > 250) {
              lastHistoryUpdateRef.current = now;
              setPriceHistory({ ...priceHistoryRef.current });
            }
          }
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnectionStatus('disconnected');
      scheduleReconnect();
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setConnectionStatus('error');
      // onclose will fire after onerror, which triggers reconnect
    };
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    const attempt = reconnectAttemptRef.current;
    const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, attempt), RECONNECT_MAX_MS);
    reconnectAttemptRef.current = attempt + 1;

    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.onmessage = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const getBook = useCallback(
    (venue: Venue, symbol: string): Book | undefined => {
      return books[bookKey(venue, symbol)];
    },
    [books]
  );

  const getPriceHistory = useCallback(
    (venue: Venue, symbol: string): PricePoint[] => {
      return priceHistory[bookKey(venue, symbol)] || [];
    },
    [priceHistory]
  );

  return { books, connectionStatus, lastUpdate, getBook, priceHistory, getPriceHistory };
}
