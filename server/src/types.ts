export type Venue = 'binance' | 'openbook';

export type PairConfig = {
  symbol: string;
  displayName: string;
  venue: Venue;
  binanceSymbol?: string;
  openbookMarket?: string;
};

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
