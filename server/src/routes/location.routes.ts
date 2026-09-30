import { Router, Request, Response } from 'express';
import {
  CreateLocationSchema,
  UpdateLocationSchema,
  CreateServiceSchema,
  UpdateServiceSchema,
  LocationCategory,
} from '../../../shared/schemas';
import { validateBody } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { enforceLocationAdmin } from '../middleware/rls';
import {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  createService,
  updateService,
} from '../services/locationService';
import { query } from '../db';

const router = Router();

// GET /api/locations (public)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const category = req.query.category as LocationCategory | undefined;
    const city = req.query.city as string | undefined;
    const search = req.query.search as string | undefined;

    const locations = await getAllLocations({ category, city, search });
    res.json({ success: true, data: locations });
  } catch (err: any) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve locations' });
  }
});

// GET /api/locations/:id (public)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getLocationById(req.params.id);
    if (!result) {
      res.status(404).json({ success: false, error: 'Location not found' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Error fetching location detail:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve location details' });
  }
});

// POST /api/locations (admin/superadmin)
router.post(
  '/',
  requireAuth,
  requireRole('admin', 'superadmin'),
  validateBody(CreateLocationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const location = await createLocation(req.body, req.user!.id);
      res.status(201).json({ success: true, data: location });
    } catch (err: any) {
      console.error('Error creating location:', err);
      if (err.code === '23505') {
        res.status(409).json({ success: false, error: 'A location with this slug already exists' });
        return;
      }
      res.status(500).json({ success: false, error: 'Failed to create location' });
    }
  }
);

// PUT /api/locations/:id (admin/superadmin)
router.put(
  '/:id',
  requireAuth,
  requireRole('admin', 'superadmin'),
  enforceLocationAdmin,
  validateBody(UpdateLocationSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const updated = await updateLocation(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Error updating location:', err);
      res.status(500).json({ success: false, error: 'Failed to update location' });
    }
  }
);

// GET /api/locations/:id/services (public)
router.get('/:id/services', async (req: Request, res: Response): Promise<void> => {
  try {
    const srvRes = await query(
      `SELECT * FROM services WHERE location_id = $1 AND is_active = TRUE ORDER BY name ASC`,
      [req.params.id]
    );
    res.json({ success: true, data: srvRes.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch services' });
  }
});

// POST /api/services (admin/superadmin)
router.post(
  '/services',
  requireAuth,
  requireRole('admin', 'superadmin'),
  validateBody(CreateServiceSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const service = await createService(req.body);
      res.status(201).json({ success: true, data: service });
    } catch (err: any) {
      console.error('Error creating service:', err);
      res.status(500).json({ success: false, error: 'Failed to create service' });
    }
  }
);

// PUT /api/services/:id (admin/superadmin)
router.put(
  '/services/:id',
  requireAuth,
  requireRole('admin', 'superadmin'),
  validateBody(UpdateServiceSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const updated = await updateService(req.params.id, req.body);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Error updating service:', err);
      res.status(500).json({ success: false, error: 'Failed to update service' });
    }
  }
);

export default router;
