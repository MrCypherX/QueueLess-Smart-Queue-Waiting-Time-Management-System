import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getLocationAnalytics } from '../services/analyticsService';
import { query } from '../db';

const router = Router();

// GET /api/admin/analytics/:locationId
router.get(
  '/:locationId',
  requireAuth,
  requireRole('admin', 'superadmin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const analytics = await getLocationAnalytics(req.params.locationId);
      res.json({ success: true, data: analytics });
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to retrieve analytics' });
    }
  }
);

// GET /api/admin/system-stats (superadmin overview)
router.get(
  '/system/overview',
  requireAuth,
  requireRole('superadmin'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const locationsCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM locations WHERE is_active = TRUE');
      const servicesCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM services WHERE is_active = TRUE');
      const countersCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM counters WHERE is_open = TRUE');
      const usersCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
      const waitingTokensCount = await query<{ count: string }>('SELECT COUNT(*) as count FROM tokens WHERE status = \'waiting\'');
      const completedToday = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM tokens WHERE status = \'completed\' AND completed_at >= CURRENT_DATE'
      );

      res.json({
        success: true,
        data: {
          totalLocations: parseInt(locationsCount.rows[0].count, 10),
          totalServices: parseInt(servicesCount.rows[0].count, 10),
          totalOpenCounters: parseInt(countersCount.rows[0].count, 10),
          totalUsers: parseInt(usersCount.rows[0].count, 10),
          currentWaitingTokens: parseInt(waitingTokensCount.rows[0].count, 10),
          tokensCompletedToday: parseInt(completedToday.rows[0].count, 10),
        },
      });
    } catch (err: any) {
      console.error('Error fetching superadmin system overview:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve system overview' });
    }
  }
);

export default router;
