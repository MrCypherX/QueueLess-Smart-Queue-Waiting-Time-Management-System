import { query } from '../db';
import {
  Counter,
  CreateCounterInput,
  UpdateCounterInput,
  Token,
} from '../../../shared/schemas';
import { sseManager } from './sseService';

export async function getCountersByService(serviceId: string): Promise<Counter[]> {
  const res = await query<Counter & { operator_full_name?: string }>(
    `SELECT c.*, u.full_name as operator_name, s.name as service_name
     FROM counters c
     LEFT JOIN users u ON c.current_operator_id = u.id
     JOIN services s ON c.service_id = s.id
     WHERE c.service_id = $1
     ORDER BY c.name ASC`,
    [serviceId]
  );

  const counters: Counter[] = [];
  for (const row of res.rows) {
    // Find currently serving token for this counter
    const tokenRes = await query<Token>(
      `SELECT * FROM tokens
       WHERE counter_id = $1 AND status IN ('called', 'serving')
       ORDER BY called_at DESC LIMIT 1`,
      [row.id]
    );

    counters.push({
      ...row,
      currently_serving_token: tokenRes.rows[0] || null,
    });
  }

  return counters;
}

export async function createCounter(input: CreateCounterInput): Promise<Counter> {
  const res = await query<Counter>(
    `INSERT INTO counters (service_id, name, is_open, current_operator_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.service_id, input.name, input.is_open ?? true, input.current_operator_id || null]
  );
  return res.rows[0];
}

export async function updateCounter(id: string, input: UpdateCounterInput): Promise<Counter> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(input.name);
  }
  if (input.is_open !== undefined) {
    fields.push(`is_open = $${idx++}`);
    values.push(input.is_open);
  }
  if (input.current_operator_id !== undefined) {
    fields.push(`current_operator_id = $${idx++}`);
    values.push(input.current_operator_id);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const res = await query<Counter>(
    `UPDATE counters SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  const updated = res.rows[0];
  if (updated) {
    sseManager.broadcastQueueUpdate(updated.service_id, {
      type: 'COUNTER_STATUS_CHANGED',
      counterId: updated.id,
      isOpen: updated.is_open,
    });
  }
  return updated;
}

export async function getOperatorCounters(operatorId: string): Promise<Counter[]> {
  const res = await query<Counter>(
    `SELECT c.*, s.name as service_name, s.location_id
     FROM counters c
     JOIN services s ON c.service_id = s.id
     WHERE c.current_operator_id = $1
     ORDER BY c.name ASC`,
    [operatorId]
  );

  // If no counter explicitly assigned, return all counters in services that are open
  if (res.rows.length === 0) {
    const allCounters = await query<Counter>(
      `SELECT c.*, s.name as service_name, s.location_id
       FROM counters c
       JOIN services s ON c.service_id = s.id
       ORDER BY s.name ASC, c.name ASC
       LIMIT 10`
    );
    return allCounters.rows;
  }

  return res.rows;
}
