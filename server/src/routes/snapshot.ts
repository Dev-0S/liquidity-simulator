import { Router, Request, Response } from 'express';
import { Book, Venue } from '../types';

/**
 * Create the snapshot router.
 *
 * The book cache is injected at creation time so the router can look up
 * the latest cached order book for a given venue + symbol.
 */
export function createSnapshotRouter(bookCache: Map<string, Book>): Router {
  const router = Router();

  /**
   * GET /api/snapshot?venue=binance&symbol=SOLUSDT
   * Returns the latest cached order book for the specified venue and symbol,
   * or 404 if no data is available yet.
   */
  router.get('/api/snapshot', (req: Request, res: Response) => {
    const venue = req.query.venue as string | undefined;
    const symbol = req.query.symbol as string | undefined;

    if (!venue || !symbol) {
      res.status(400).json({
        error: 'Missing required query parameters: venue, symbol',
      });
      return;
    }

    const validVenues: Venue[] = ['binance', 'openbook'];
    if (!validVenues.includes(venue as Venue)) {
      res.status(400).json({
        error: `Invalid venue "${venue}". Must be one of: ${validVenues.join(', ')}`,
      });
      return;
    }

    const key = `${venue}:${symbol}`;
    const book = bookCache.get(key);

    if (!book) {
      res.status(404).json({
        error: `No snapshot available for ${venue}:${symbol}`,
      });
      return;
    }

    res.json(book);
  });

  return router;
}
