import { Router, Request, Response } from 'express';
import { sseManager } from '../services/sseService';

const router = Router();

// GET /api/events/queue/:serviceId
router.get('/queue/:serviceId', (req: Request, res: Response): void => {
  const { serviceId } = req.params;
  sseManager.addClient(`queue_${serviceId}`, res);
});

// GET /api/events/token/:tokenId
router.get('/token/:tokenId', (req: Request, res: Response): void => {
  const { tokenId } = req.params;
  sseManager.addClient(`token_${tokenId}`, res);
});

// GET /api/events/user/:userId
router.get('/user/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params;
  sseManager.addClient(`user_${userId}`, res);
});

// GET /api/events/all-queues
router.get('/all-queues', (_req: Request, res: Response): void => {
  sseManager.addClient('all_queues', res);
});

export default router;
