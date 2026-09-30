import { Router, Request, Response } from 'express';
import { JoinQueueSchema, UpdateTokenStatusSchema } from '../../../shared/schemas';
import { validateBody } from '../middleware/validate';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth';
import { enforceTokenAccess } from '../middleware/rls';
import {
  joinQueue,
  getTokenById,
  getCitizenTokens,
  updateTokenStatus,
  getServiceQueue,
  callNextToken,
} from '../services/tokenService';

const router = Router();

// POST /api/tokens (Join queue - Guest or Authenticated)
router.post(
  '/',
  optionalAuth,
  validateBody(JoinQueueSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id || null;
      const token = await joinQueue(req.body, userId);
      res.status(201).json({ success: true, data: token });
    } catch (err: any) {
      console.error('Error joining queue:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to join queue' });
    }
  }
);

// GET /api/tokens/my (Citizen active tokens)
router.get('/my', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const tokens = await getCitizenTokens(req.user!.id);
    res.json({ success: true, data: tokens });
  } catch (err: any) {
    console.error('Error fetching citizen tokens:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve your tokens' });
  }
});

// GET /api/tokens/:id (Live status & tracking)
router.get('/:id', enforceTokenAccess, async (req: Request, res: Response): Promise<void> => {
  try {
    const token = await getTokenById(req.params.id);
    if (!token) {
      res.status(404).json({ success: false, error: 'Token not found' });
      return;
    }
    res.json({ success: true, data: token });
  } catch (err: any) {
    console.error('Error fetching token:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve token details' });
  }
});

// PATCH /api/tokens/:id/status (Operator actions)
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('operator', 'admin', 'superadmin'),
  validateBody(UpdateTokenStatusSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, counter_id, notes } = req.body;
      const updated = await updateTokenStatus(
        req.params.id,
        status,
        req.user!.id,
        counter_id,
        notes
      );
      res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Error updating token status:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to update token status' });
    }
  }
);

// POST /api/tokens/call-next (Operator calls next token)
router.post(
  '/call-next',
  requireAuth,
  requireRole('operator', 'admin', 'superadmin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { service_id, counter_id } = req.body;
      if (!service_id || !counter_id) {
        res.status(400).json({
          success: false,
          error: 'service_id and counter_id are required to call next token',
        });
        return;
      }

      const calledToken = await callNextToken(service_id, counter_id, req.user!.id);
      if (!calledToken) {
        res.json({
          success: true,
          data: null,
          message: 'No waiting tokens in queue for this service.',
        });
        return;
      }

      res.json({ success: true, data: calledToken });
    } catch (err: any) {
      console.error('Error calling next token:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to call next token' });
    }
  }
);

// GET /api/services/:serviceId/queue (Operator live queue view)
router.get(
  '/services/:serviceId/queue',
  requireAuth,
  requireRole('operator', 'admin', 'superadmin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const queue = await getServiceQueue(req.params.serviceId);
      res.json({ success: true, data: queue });
    } catch (err: any) {
      console.error('Error fetching service queue:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve service queue' });
    }
  }
);

export default router;
