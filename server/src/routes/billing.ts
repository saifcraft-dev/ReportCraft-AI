import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/db';

const router = Router();

const TIER_CLIENT_LIMITS: Record<string, number> = {
  FREE_TRIAL: Infinity,
  STARTER: 5,
  AGENCY: 15,
  AGENCY_PRO: Infinity,
};

// GET /api/billing/ls-status — check if Lemon Squeezy API is reachable
router.get('/ls-status', async (_req: Request, res: Response) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch('https://api.lemonsqueezy.com/v1/me', {
      headers: {
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY || 'test'}`,
        Accept: 'application/vnd.api+json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    // 401 means we reached LS but key is missing/wrong — still "available"
    res.json({ available: response.status < 500 });
  } catch {
    res.json({ available: false });
  }
});

// POST /api/billing/check-downgrade — validate client count before plan downgrade
router.post('/check-downgrade', async (req: Request, res: Response) => {
  try {
    const { newTier } = z.object({ newTier: z.string() }).parse(req.body);

    const newLimit = TIER_CLIENT_LIMITS[newTier] ?? Infinity;

    if (!isFinite(newLimit)) {
      return res.json({ ok: true, newLimit: null });
    }

    const activeCount = await prisma.client.count({
      where: { agencyId: req.agencyId, archivedAt: null },
    });

    if (activeCount <= newLimit) {
      return res.json({ ok: true, newLimit, activeClients: activeCount });
    }

    // Over limit — return the excess clients so the frontend can show the archive modal
    const excessClients = await prisma.client.findMany({
      where: { agencyId: req.agencyId, archivedAt: null },
      orderBy: { createdAt: 'asc' },
      skip: newLimit,
      select: { id: true, name: true, industry: true, contactEmail: true, lastReportAt: true, createdAt: true },
    });

    res.status(400).json({
      error: 'CLIENT_LIMIT_EXCEEDED',
      activeClients: activeCount,
      newLimit,
      excessClients,
    });
  } catch (e: any) {
    if (e.name === 'ZodError') return res.status(400).json({ error: e.errors });
    throw e;
  }
});

export default router;
