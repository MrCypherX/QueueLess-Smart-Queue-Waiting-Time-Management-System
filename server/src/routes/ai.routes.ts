import { Router, Request, Response } from 'express';
import { query } from '../db';
import {
  predictWaitTime,
  generateStatusAdvisory,
  detectAnomalies,
} from '../ai/gemini';
import { PredictWaitSchema } from '../../../shared/schemas';
import { validateBody } from '../middleware/validate';

const router = Router();

// POST /api/ai/predict-wait
router.post(
  '/predict-wait',
  validateBody(PredictWaitSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { serviceId, waitingCount, activeCounters, avgServiceTime } = req.body;

      // Fetch service details
      const srvRes = await query<{
        name: string;
        average_service_time_minutes: number;
        location_name: string;
      }>(
        `SELECT s.name, s.average_service_time_minutes, l.name as location_name
         FROM services s
         JOIN locations l ON s.location_id = l.id
         WHERE s.id = $1`,
        [serviceId]
      );

      if (srvRes.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Service not found' });
        return;
      }
      const srv = srvRes.rows[0];

      // Auto-compute counts if not provided in body
      let waitCount = waitingCount;
      if (waitCount === undefined) {
        const wRes = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM tokens WHERE service_id = $1 AND status = 'waiting'`,
          [serviceId]
        );
        waitCount = parseInt(wRes.rows[0].count, 10);
      }

      let openCounters = activeCounters;
      if (openCounters === undefined) {
        const cRes = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM counters WHERE service_id = $1 AND is_open = TRUE`,
          [serviceId]
        );
        openCounters = Math.max(1, parseInt(cRes.rows[0].count, 10));
      }

      const prediction = await predictWaitTime({
        serviceName: srv.name,
        locationName: srv.location_name,
        waitingCount: waitCount,
        activeCounters: openCounters,
        avgServiceTime: avgServiceTime || srv.average_service_time_minutes,
      });

      res.json({ success: true, data: prediction });
    } catch (err: any) {
      console.error('Error generating AI prediction:', err);
      res.status(500).json({ success: false, error: 'Failed to predict waiting time' });
    }
  }
);

// POST /api/ai/advisory
router.post('/advisory', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tokenNumber, position, estimatedWait, status, serviceName, counterName } = req.body;

    if (!tokenNumber || position === undefined || estimatedWait === undefined) {
      res.status(400).json({
        success: false,
        error: 'tokenNumber, position, and estimatedWait are required',
      });
      return;
    }

    const advisory = await generateStatusAdvisory({
      tokenNumber,
      position: Number(position),
      estimatedWait: Number(estimatedWait),
      status: status || 'waiting',
      serviceName,
      counterName,
    });

    res.json({ success: true, data: advisory });
  } catch (err: any) {
    console.error('Error generating AI status advisory:', err);
    res.status(500).json({ success: false, error: 'Failed to generate advisory message' });
  }
});

// POST /api/ai/anomalies
router.post('/anomalies', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      serviceName,
      locationName,
      waitingCount,
      activeCounters,
      avgServiceTime,
      avgWaitTime,
      completedLastHour,
    } = req.body;

    const result = await detectAnomalies({
      serviceName: serviceName || 'Service',
      locationName: locationName || 'Facility',
      waitingCount: Number(waitingCount) || 0,
      activeCounters: Math.max(1, Number(activeCounters) || 1),
      avgServiceTime: Number(avgServiceTime) || 8,
      avgWaitTime: Number(avgWaitTime) || 10,
      completedLastHour: Number(completedLastHour) || 0,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Error in AI anomaly detection:', err);
    res.status(500).json({ success: false, error: 'Failed to run anomaly analysis' });
  }
});

export default router;
