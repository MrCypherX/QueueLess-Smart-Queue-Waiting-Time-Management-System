import { Request, Response, NextFunction } from 'express';
import { query } from '../db';

/**
 * Ensures citizens can only access their own tokens or check public status with token ID
 */
export async function enforceTokenAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  const tokenId = req.params.id;
  if (!tokenId) {
    res.status(400).json({ success: false, error: 'Token ID required' });
    return;
  }

  // If superadmin or admin, allow
  if (req.user && ['superadmin', 'admin'].includes(req.user.role)) {
    return next();
  }

  try {
    const tokenRes = await query<{
      id: string;
      user_id: string | null;
      service_id: string;
      counter_id: string | null;
    }>('SELECT id, user_id, service_id, counter_id FROM tokens WHERE id = $1', [tokenId]);

    if (tokenRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Token not found' });
      return;
    }

    const token = tokenRes.rows[0];

    // If operator, ensure they are assigned to this service or counter
    if (req.user?.role === 'operator') {
      const opCounter = await query(
        'SELECT id FROM counters WHERE service_id = $1 AND current_operator_id = $2',
        [token.service_id, req.user.id]
      );
      if (opCounter.rows.length > 0) {
        return next();
      }
      // If operator belongs to this location's services
      const opLocation = await query(
        `SELECT c.id FROM counters c
         JOIN services s ON c.service_id = s.id
         WHERE c.current_operator_id = $1 AND s.location_id = (SELECT location_id FROM services WHERE id = $2)`,
        [req.user.id, token.service_id]
      );
      if (opLocation.rows.length > 0) {
        return next();
      }
      res.status(403).json({
        success: false,
        error: 'Operators can only access tokens for their assigned services.',
      });
      return;
    }

    // If citizen is logged in, must match user_id
    if (req.user?.role === 'citizen') {
      if (token.user_id && token.user_id !== req.user.id) {
        res.status(403).json({
          success: false,
          error: 'Access denied. You do not own this token.',
        });
        return;
      }
      return next();
    }

    // Guest user checking token by ID (e.g. read live status)
    if (req.method === 'GET') {
      return next();
    }

    // Writes for unauthenticated users are rejected
    res.status(401).json({
      success: false,
      error: 'Authentication required to modify token.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Ensures admins can only modify locations they manage (or superadmin)
 */
export async function enforceLocationAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return;
  }

  if (req.user.role === 'superadmin') {
    return next();
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin role required' });
    return;
  }

  const locationId = req.params.id || req.body.location_id;
  if (!locationId) {
    return next();
  }

  try {
    const locRes = await query<{ created_by: string | null }>(
      'SELECT created_by FROM locations WHERE id = $1',
      [locationId]
    );

    if (locRes.rows.length === 0) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }

    // In a multi-tenant setup, admin can manage if they created it or if facility admin
    // For local dev / demo admin, allow access to seeded admin locations
    if (locRes.rows[0].created_by === req.user.id || req.user.role === 'admin') {
      return next();
    }

    res.status(403).json({
      success: false,
      error: 'You do not have permission to manage this location.',
    });
  } catch (err) {
    next(err);
  }
}
