export type Venue = 'binance' | 'openbook';

export type BookLevel = [price: number, size: number];

export type Book = {
  ts: number;
  venue: Venue;
  symbol: string;
  bids: BookLevel[];
  asks: BookLevel[];
};

export type WsMessage =
  | { type: 'book_update'; data: Book }
  | { type: 'snapshot'; data: Book }
  | { type: 'error'; message: string };

export type PairConfig = {
  symbol: string;
  displayName: string;
  venue: Venue;
};

export type ImpactResult = {
  filledBase: number;
  spentQuote: number;
  avgPrice: number;
  slippageBpsVsMid: number;
  levelsConsumed: { price: number; qty: number }[];
  unfilledBase: number;
};

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export const SUPPORTED_PAIRS: PairConfig[] = [
  { symbol: 'SOLUSDT', displayName: 'SOL/USDT', venue: 'binance' },
  { symbol: 'BTCUSDT', displayName: 'BTC/USDT', venue: 'binance' },
  { symbol: 'ETHUSDT', displayName: 'ETH/USDT', venue: 'binance' },
  { symbol: 'SOLUSDC', displayName: 'SOL/USDC', venue: 'openbook' },
];
