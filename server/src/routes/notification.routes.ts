import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await getUserNotifications(req.user!.id);
    res.json({ success: true, data: notifications });
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve notifications' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await markNotificationAsRead(req.params.id, req.user!.id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    await markAllNotificationsAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    console.error('Error marking all notifications read:', err);
    res.status(500).json({ success: false, error: 'Failed to update notifications' });
  }
});

export default router;
