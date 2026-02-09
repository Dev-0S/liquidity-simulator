import { Book, BookLevel } from '../types';

/**
 * Normalize a Binance depth20 WebSocket message into the internal Book format.
 *
 * Binance sends bids and asks as arrays of [price: string, qty: string].
 * We parse them to numbers, then ensure bids are sorted descending by price
 * and asks are sorted ascending by price.
 */
export function normalizeBinance(
  symbol: string,
  data: { bids: string[][]; asks: string[][] },
): Book {
  const bids: BookLevel[] = data.bids
    .map<BookLevel>(([price, size]) => [parseFloat(price), parseFloat(size)])
    .filter(([price, size]) => price > 0 && size > 0)
    .sort((a, b) => b[0] - a[0]);

  const asks: BookLevel[] = data.asks
    .map<BookLevel>(([price, size]) => [parseFloat(price), parseFloat(size)])
    .filter(([price, size]) => price > 0 && size > 0)
    .sort((a, b) => a[0] - b[0]);

  return {
    ts: Date.now(),
    venue: 'binance',
    symbol,
    bids,
    asks,
  };
}

/**
 * Normalize decoded OpenBook order book data into the internal Book format.
 *
 * Expects pre-parsed BookLevel arrays. Ensures bids are sorted descending
 * and asks are sorted ascending by price.
 */
export function normalizeOpenBook(
  symbol: string,
  bids: BookLevel[],
  asks: BookLevel[],
): Book {
  const sortedBids: BookLevel[] = [...bids]
    .filter(([price, size]) => price > 0 && size > 0)
    .sort((a, b) => b[0] - a[0]);

  const sortedAsks: BookLevel[] = [...asks]
    .filter(([price, size]) => price > 0 && size > 0)
    .sort((a, b) => a[0] - b[0]);

  return {
    ts: Date.now(),
    venue: 'openbook',
    symbol,
    bids: sortedBids,
    asks: sortedAsks,
  };
}
