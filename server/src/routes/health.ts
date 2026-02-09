import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/health
 * Simple health-check endpoint.
 */
router.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
  });
});

export default router;
