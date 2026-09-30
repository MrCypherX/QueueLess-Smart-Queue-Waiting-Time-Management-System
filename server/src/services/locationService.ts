import { query } from '../db';
import {
  Location,
  Service,
  CreateLocationInput,
  UpdateLocationInput,
  CreateServiceInput,
  UpdateServiceInput,
  LocationCategory,
} from '../../../shared/schemas';

export async function getAllLocations(filter?: {
  category?: LocationCategory;
  city?: string;
  search?: string;
}): Promise<Location[]> {
  let sql = `
    SELECT 
      l.*,
      COUNT(DISTINCT s.id) as services_count,
      COUNT(DISTINCT CASE WHEN t.status = 'waiting' THEN t.id END) as total_waiting,
      COALESCE(MIN(CASE WHEN t.status = 'waiting' THEN t.estimated_wait_minutes END), 5) as min_wait_minutes
    FROM locations l
    LEFT JOIN services s ON l.id = s.location_id AND s.is_active = TRUE
    LEFT JOIN tokens t ON s.id = t.service_id AND t.status = 'waiting'
    WHERE l.is_active = TRUE
  `;
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filter?.category) {
    sql += ` AND l.category = $${paramIdx++}`;
    params.push(filter.category);
  }

  if (filter?.city) {
    sql += ` AND LOWER(l.city) = LOWER($${paramIdx++})`;
    params.push(filter.city);
  }

  if (filter?.search) {
    sql += ` AND (LOWER(l.name) LIKE $${paramIdx} OR LOWER(l.description) LIKE $${paramIdx} OR LOWER(l.city) LIKE $${paramIdx})`;
    params.push(`%${filter.search.toLowerCase()}%`);
    paramIdx++;
  }

  sql += `
    GROUP BY l.id
    ORDER BY l.name ASC
  `;

  const res = await query<Location>(sql, params);
  return res.rows.map((row) => ({
    ...row,
    services_count: Number(row.services_count) || 0,
    total_waiting: Number(row.total_waiting) || 0,
    min_wait_minutes: Number(row.min_wait_minutes) || 5,
  }));
}

export async function getLocationById(idOrSlug: string): Promise<{
  location: Location;
  services: Service[];
} | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);

  const locRes = await query<Location>(
    `SELECT * FROM locations WHERE ${isUuid ? 'id' : 'slug'} = $1`,
    [idOrSlug]
  );
  if (locRes.rows.length === 0) return null;
  const location = locRes.rows[0];

  const servicesRes = await query<Service>(
    `SELECT 
      s.*,
      l.name as location_name,
      l.slug as location_slug,
      l.category as location_category,
      COUNT(DISTINCT CASE WHEN c.is_open = TRUE THEN c.id END) as active_counters_count,
      COUNT(DISTINCT CASE WHEN t.status = 'waiting' THEN t.id END) as waiting_tokens_count,
      (
        SELECT t2.token_number FROM tokens t2
        WHERE t2.service_id = s.id AND t2.status = 'serving'
        ORDER BY t2.called_at DESC LIMIT 1
      ) as currently_serving_token
    FROM services s
    JOIN locations l ON s.location_id = l.id
    LEFT JOIN counters c ON s.id = c.service_id
    LEFT JOIN tokens t ON s.id = t.service_id AND t.status = 'waiting'
    WHERE s.location_id = $1 AND s.is_active = TRUE
    GROUP BY s.id, l.name, l.slug, l.category
    ORDER BY s.name ASC`,
    [location.id]
  );

  const services = servicesRes.rows.map((s) => {
    const waiting = Number(s.waiting_tokens_count) || 0;
    const counters = Math.max(1, Number(s.active_counters_count) || 1);
    const estWait = Math.round((waiting / counters) * (s.average_service_time_minutes || 8));
    return {
      ...s,
      active_counters_count: Number(s.active_counters_count) || 0,
      waiting_tokens_count: waiting,
      estimated_wait_minutes: Math.max(1, estWait),
    };
  });

  return { location, services };
}

export async function createLocation(input: CreateLocationInput, userId: string): Promise<Location> {
  const res = await query<Location>(
    `INSERT INTO locations (name, slug, category, address, city, latitude, longitude, description, is_active, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      input.name,
      input.slug,
      input.category,
      input.address || null,
      input.city || null,
      input.latitude || null,
      input.longitude || null,
      input.description || null,
      input.is_active ?? true,
      userId,
    ]
  );
  return res.rows[0];
}

export async function updateLocation(id: string, input: UpdateLocationInput): Promise<Location> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(input.name);
  }
  if (input.slug !== undefined) {
    fields.push(`slug = $${idx++}`);
    values.push(input.slug);
  }
  if (input.category !== undefined) {
    fields.push(`category = $${idx++}`);
    values.push(input.category);
  }
  if (input.address !== undefined) {
    fields.push(`address = $${idx++}`);
    values.push(input.address);
  }
  if (input.city !== undefined) {
    fields.push(`city = $${idx++}`);
    values.push(input.city);
  }
  if (input.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(input.description);
  }
  if (input.is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(input.is_active);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const res = await query<Location>(
    `UPDATE locations SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return res.rows[0];
}

export async function createService(input: CreateServiceInput): Promise<Service> {
  const res = await query<Service>(
    `INSERT INTO services (location_id, name, description, average_service_time_minutes, is_active)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.location_id,
      input.name,
      input.description || null,
      input.average_service_time_minutes ?? 8,
      input.is_active ?? true,
    ]
  );
  return res.rows[0];
}

export async function updateService(id: string, input: UpdateServiceInput): Promise<Service> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(input.description);
  }
  if (input.average_service_time_minutes !== undefined) {
    fields.push(`average_service_time_minutes = $${idx++}`);
    values.push(input.average_service_time_minutes);
  }
  if (input.is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(input.is_active);
  }

  fields.push('updated_at = NOW()');
  values.push(id);

  const res = await query<Service>(
    `UPDATE services SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return res.rows[0];
}
