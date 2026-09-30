import { Router, Request, Response } from 'express';
import { CreateCounterSchema, UpdateCounterSchema } from '../../../shared/schemas';
import { validateBody } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  getCountersByService,
  createCounter,
  updateCounter,
  getOperatorCounters,
} from '../services/counterService';

const router = Router();

// GET /api/counters/my (operator)
router.get('/my', requireAuth, requireRole('operator', 'admin', 'superadmin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const counters = await getOperatorCounters(req.user!.id);
    res.json({ success: true, data: counters });
  } catch (err: any) {
    console.error('Error fetching operator counters:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve operator counters' });
  }
});

// GET /api/services/:serviceId/counters
router.get('/services/:serviceId/counters', async (req: Request, res: Response): Promise<void> => {
  try {
    const counters = await getCountersByService(req.params.serviceId);
    res.json({ success: true, data: counters });
  } catch (err: any) {
    console.error('Error fetching counters:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve counters' });
  }
});

// POST /api/counters (admin/superadmin)
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'superadmin'),
  validateBody(CreateCounterSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const counter = await createCounter(req.body);
      res.status(201).json({ success: true, data: counter });
    } catch (err: any) {
      console.error('Error creating counter:', err);
      res.status(500).json({ success: false, error: 'Failed to create counter' });
    }
  }
);

// PATCH /api/counters/:id (operator/admin/superadmin)
router.patch(
  '/:id',
  requireAuth,
  requireRole('operator', 'admin', 'superadmin'),
  validateBody(UpdateCounterSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const updated = await updateCounter(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Error updating counter:', err);
      res.status(500).json({ success: false, error: 'Failed to update counter' });
    }
  }
);

export default router;
