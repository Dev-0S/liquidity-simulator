import { Router, Request, Response } from 'express';
import { SUPPORTED_PAIRS } from '../config';

const router = Router();

/**
 * GET /api/pairs
 * Returns the full list of supported trading pairs with their configuration.
 */
router.get('/api/pairs', (_req: Request, res: Response) => {
  res.json(SUPPORTED_PAIRS);
});

/**
 * GET /api/venues
 * Returns the unique set of venues across all supported pairs.
 */
router.get('/api/venues', (_req: Request, res: Response) => {
  const venues = [...new Set(SUPPORTED_PAIRS.map((p) => p.venue))];
  res.json(venues);
});

export default router;
