import { query } from '../db';
import {
  Token,
  TokenStatus,
  JoinQueueInput,
  TokenEvent,
} from '../../../shared/schemas';
import { predictWaitTime, generateStatusAdvisory } from '../ai/gemini';
import { sseManager } from './sseService';
import { createNotification } from './notificationService';

/**
 * Generate a concise prefix for a service (e.g., OPD, LAB, BNK, RTO, or initials)
 */
function getServicePrefix(serviceName: string): string {
  const upper = serviceName.toUpperCase();
  if (upper.includes('OPD')) return 'OPD';
  if (upper.includes('BLOOD') || upper.includes('PATHOLOGY') || upper.includes('LAB')) return 'LAB';
  if (upper.includes('PHARMACY')) return 'RX';
  if (upper.includes('TELLER') || upper.includes('CASH')) return 'BNK';
  if (upper.includes('LOAN') || upper.includes('MORTGAGE')) return 'MOR';
  if (upper.includes('LICENSE') || upper.includes('RTO')) return 'RTO';
  if (upper.includes('TUITION') || upper.includes('STUDENT')) return 'STU';
  if (upper.includes('TRANSCRIPT')) return 'DOC';
  if (upper.includes('BILL') || upper.includes('UTILITY')) return 'UTL';

  // Fallback to initials
  const initials = serviceName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (initials.slice(0, 3) || 'TOK');
}

/**
 * Join queue and issue digital token
 */
export async function joinQueue(
  input: JoinQueueInput,
  userId?: string | null
): Promise<Token> {
  // 1. Fetch service and location context
  const serviceRes = await query<{
    id: string;
    name: string;
    average_service_time_minutes: number;
    location_id: string;
    location_name: string;
  }>(
    `SELECT s.id, s.name, s.average_service_time_minutes, s.location_id, l.name as location_name
     FROM services s
     JOIN locations l ON s.location_id = l.id
     WHERE s.id = $1`,
    [input.service_id]
  );

  if (serviceRes.rows.length === 0) {
    throw new Error('Service not found');
  }
  const srv = serviceRes.rows[0];

  // 2. Count active open counters
  const countersRes = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM counters WHERE service_id = $1 AND is_open = TRUE`,
    [srv.id]
  );
  const activeCounters = Math.max(1, parseInt(countersRes.rows[0].count, 10));

  // 3. Count currently waiting tokens
  const waitingRes = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM tokens WHERE service_id = $1 AND status = 'waiting'`,
    [srv.id]
  );
  const waitingCount = parseInt(waitingRes.rows[0].count, 10);
  const positionInQueue = waitingCount + 1;

  // 4. Generate unique sequential token number for today
  const prefix = getServicePrefix(srv.name);
  const countTodayRes = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM tokens
     WHERE service_id = $1 AND joined_at >= CURRENT_DATE`,
    [srv.id]
  );
  const nextNum = parseInt(countTodayRes.rows[0].count, 10) + 1;
  const tokenNumber = `${prefix}-${String(nextNum).padStart(3, '0')}`;

  // 5. Predict wait time using Gemini AI
  const aiPrediction = await predictWaitTime({
    serviceName: srv.name,
    locationName: srv.location_name,
    waitingCount,
    activeCounters,
    avgServiceTime: srv.average_service_time_minutes,
  });

  const estimatedWaitMinutes = aiPrediction.estimatedWaitMinutes;

  // 6. Insert new token
  const tokenInsertRes = await query<Token>(
    `INSERT INTO tokens (
      token_number, service_id, counter_id, user_id,
      citizen_name, citizen_phone, citizen_email,
      status, position_in_queue, estimated_wait_minutes,
      joined_at, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'waiting', $8, $9, NOW(), $10)
    RETURNING *`,
    [
      tokenNumber,
      srv.id,
      input.counter_id || null,
      userId || null,
      input.citizen_name,
      input.citizen_phone || null,
      input.citizen_email || null,
      positionInQueue,
      estimatedWaitMinutes,
      input.notes || null,
    ]
  );
  const token = tokenInsertRes.rows[0];

  // 7. Record 'joined' event
  await query(
    `INSERT INTO token_events (token_id, event_type, metadata)
     VALUES ($1, 'joined', $2)`,
    [
      token.id,
      JSON.stringify({
        position: positionInQueue,
        estimatedWait: estimatedWaitMinutes,
        activeCounters,
      }),
    ]
  );

  // 8. Generate initial AI status advisory
  const advisory = await generateStatusAdvisory({
    tokenNumber: token.token_number,
    position: positionInQueue,
    estimatedWait: estimatedWaitMinutes,
    status: 'waiting',
    serviceName: srv.name,
  });

  // 9. If user is registered, create confirmation notification
  if (userId) {
    await createNotification(
      userId,
      token.id,
      `Token Issued: ${token.token_number}`,
      `You are #${positionInQueue} in queue for ${srv.name}. Estimated wait: ${estimatedWaitMinutes} minutes.`
    );
  }

  // 10. Broadcast updates via SSE
  sseManager.broadcastQueueUpdate(srv.id, {
    type: 'TOKEN_JOINED',
    serviceId: srv.id,
    tokenNumber: token.token_number,
    waitingCount: waitingCount + 1,
  });

  return {
    ...token,
    service_name: srv.name,
    location_name: srv.location_name,
    location_id: srv.location_id,
    ai_advisory: advisory,
  };
}

/**
 * Get single token with rich details
 */
export async function getTokenById(id: string): Promise<Token | null> {
  const res = await query<Token>(
    `SELECT t.*, s.name as service_name, s.location_id,
            l.name as location_name, c.name as counter_name
     FROM tokens t
     JOIN services s ON t.service_id = s.id
     JOIN locations l ON s.location_id = l.id
     LEFT JOIN counters c ON t.counter_id = c.id
     WHERE t.id = $1`,
    [id]
  );

  if (res.rows.length === 0) return null;
  const token = res.rows[0];

  // Enrich with AI Status Advisory
  const advisory = await generateStatusAdvisory({
    tokenNumber: token.token_number,
    position: token.position_in_queue,
    estimatedWait: token.estimated_wait_minutes,
    status: token.status,
    serviceName: token.service_name,
    counterName: token.counter_name,
  });

  return {
    ...token,
    ai_advisory: advisory,
  };
}

/**
 * Get active tokens for a specific citizen
 */
export async function getCitizenTokens(userId: string): Promise<Token[]> {
  const res = await query<Token>(
    `SELECT t.*, s.name as service_name, s.location_id,
            l.name as location_name, c.name as counter_name
     FROM tokens t
     JOIN services s ON t.service_id = s.id
     JOIN locations l ON s.location_id = l.id
     LEFT JOIN counters c ON t.counter_id = c.id
     WHERE t.user_id = $1
     ORDER BY 
       CASE 
         WHEN t.status = 'called' THEN 1
         WHEN t.status = 'serving' THEN 2
         WHEN t.status = 'waiting' THEN 3
         ELSE 4
       END,
       t.joined_at DESC
     LIMIT 30`,
    [userId]
  );
  return res.rows;
}

/**
 * Get full live queue for a service (for operators)
 */
export async function getServiceQueue(serviceId: string): Promise<{
  service: any;
  serving: Token[];
  waiting: Token[];
  completedToday: Token[];
}> {
  const srvRes = await query(
    `SELECT s.*, l.name as location_name FROM services s
     JOIN locations l ON s.location_id = l.id
     WHERE s.id = $1`,
    [serviceId]
  );

  if (srvRes.rows.length === 0) {
    throw new Error('Service not found');
  }

  const tokensRes = await query<Token>(
    `SELECT t.*, c.name as counter_name
     FROM tokens t
     LEFT JOIN counters c ON t.counter_id = c.id
     WHERE t.service_id = $1
       AND (t.status IN ('waiting', 'called', 'serving') OR (t.status = 'completed' AND t.completed_at >= CURRENT_DATE))
     ORDER BY 
       CASE WHEN t.status = 'waiting' THEN t.position_in_queue ELSE 0 END ASC,
       t.joined_at ASC`,
    [serviceId]
  );

  const serving = tokensRes.rows.filter((t) => ['called', 'serving'].includes(t.status));
  const waiting = tokensRes.rows.filter((t) => t.status === 'waiting');
  const completedToday = tokensRes.rows.filter((t) => t.status === 'completed');

  return {
    service: srvRes.rows[0],
    serving,
    waiting,
    completedToday,
  };
}

/**
 * Re-calculate queue positions and estimated wait times for all waiting tokens in a service
 */
export async function recalculateQueue(serviceId: string): Promise<void> {
  const srvRes = await query<{
    average_service_time_minutes: number;
    location_id: string;
    location_name: string;
    name: string;
  }>(
    `SELECT s.average_service_time_minutes, s.location_id, s.name, l.name as location_name
     FROM services s
     JOIN locations l ON s.location_id = l.id
     WHERE s.id = $1`,
    [serviceId]
  );
  if (srvRes.rows.length === 0) return;
  const srv = srvRes.rows[0];

  const countersRes = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM counters WHERE service_id = $1 AND is_open = TRUE`,
    [serviceId]
  );
  const activeCounters = Math.max(1, parseInt(countersRes.rows[0].count, 10));

  const waitingTokensRes = await query<Token>(
    `SELECT * FROM tokens
     WHERE service_id = $1 AND status = 'waiting'
     ORDER BY joined_at ASC`,
    [serviceId]
  );

  let pos = 1;
  for (const token of waitingTokensRes.rows) {
    // Dynamic estimate calculation based on remaining tokens ahead
    const remainingAhead = pos - 1;
    const estWait = Math.max(1, Math.round((remainingAhead / activeCounters) * srv.average_service_time_minutes));

    await query(
      `UPDATE tokens
       SET position_in_queue = $1, estimated_wait_minutes = $2, updated_at = NOW()
       WHERE id = $3`,
      [pos, estWait, token.id]
    );

    // Broadcast individual token update
    sseManager.broadcastTokenUpdate(token.id, {
      tokenId: token.id,
      position: pos,
      estimatedWait: estWait,
      status: 'waiting',
    });

    // Notify user if approaching: position <= 3 or estWait <= 10 min
    if (pos <= 3 && token.user_id) {
      const recentNotif = await query(
        `SELECT id FROM notifications
         WHERE user_id = $1 AND token_id = $2 AND created_at > NOW() - INTERVAL '15 minutes'`,
        [token.user_id, token.id]
      );
      if (recentNotif.rows.length === 0) {
        await createNotification(
          token.user_id,
          token.id,
          pos === 1 ? 'Your Turn is Next!' : `Position Update: #${pos} in line`,
          pos === 1
            ? `Token ${token.token_number} is next in line! Please prepare to step up.`
            : `Only ${pos - 1} person(s) ahead for ${srv.name}. Estimated wait: ${estWait} minutes.`
        );
      }
    }

    pos++;
  }

  // Broadcast overall queue update
  sseManager.broadcastQueueUpdate(serviceId, {
    type: 'QUEUE_RECALCULATED',
    serviceId,
    waitingCount: waitingTokensRes.rows.length,
    activeCounters,
  });
}

/**
 * Update token status (called, serving, completed, skipped, cancelled)
 */
export async function updateTokenStatus(
  tokenId: string,
  newStatus: TokenStatus,
  operatorId?: string | null,
  counterId?: string | null,
  notes?: string | null
): Promise<Token> {
  const currentRes = await query<Token>(
    `SELECT t.*, s.name as service_name, s.location_id
     FROM tokens t
     JOIN services s ON t.service_id = s.id
     WHERE t.id = $1`,
    [tokenId]
  );
  if (currentRes.rows.length === 0) {
    throw new Error('Token not found');
  }
  const current = currentRes.rows[0];

  let calledAtSql = 'called_at';
  let completedAtSql = 'completed_at';

  if (newStatus === 'called') {
    calledAtSql = 'NOW()';
  } else if (['completed', 'skipped', 'cancelled'].includes(newStatus)) {
    completedAtSql = 'NOW()';
  }

  const updateRes = await query<Token>(
    `UPDATE tokens
     SET status = $1,
         counter_id = COALESCE($2, counter_id),
         called_at = ${calledAtSql},
         completed_at = ${completedAtSql},
         position_in_queue = CASE WHEN $1 = 'waiting' THEN position_in_queue ELSE 0 END,
         estimated_wait_minutes = CASE WHEN $1 IN ('called', 'serving', 'completed', 'skipped', 'cancelled') THEN 0 ELSE estimated_wait_minutes END,
         notes = COALESCE($3, notes),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [newStatus, counterId || null, notes || null, tokenId]
  );
  const updatedToken = updateRes.rows[0];

  // Record audit event
  await query(
    `INSERT INTO token_events (token_id, event_type, operator_id, metadata)
     VALUES ($1, $2, $3, $4)`,
    [
      tokenId,
      newStatus,
      operatorId || null,
      JSON.stringify({ counterId, notes, previousStatus: current.status }),
    ]
  );

  // If token is now called, create alert notification for the user
  if (newStatus === 'called' && updatedToken.user_id) {
    let counterName = 'Counter';
    if (counterId) {
      const cRes = await query<{ name: string }>('SELECT name FROM counters WHERE id = $1', [counterId]);
      if (cRes.rows.length > 0) counterName = cRes.rows[0].name;
    }

    await createNotification(
      updatedToken.user_id,
      updatedToken.id,
      `Token Called: ${updatedToken.token_number}!`,
      `Please proceed to ${counterName} immediately for your turn.`
    );
  }

  // Re-calculate the remaining waiting queue
  await recalculateQueue(current.service_id);

  // Broadcast single token update
  sseManager.broadcastTokenUpdate(tokenId, {
    tokenId,
    status: newStatus,
    counterId: counterId || updatedToken.counter_id,
    calledAt: updatedToken.called_at,
    completedAt: updatedToken.completed_at,
  });

  return updatedToken;
}

/**
 * Call the next waiting token for a counter
 */
export async function callNextToken(
  serviceId: string,
  counterId: string,
  operatorId: string
): Promise<Token | null> {
  // Find first waiting token
  const nextRes = await query<Token>(
    `SELECT * FROM tokens
     WHERE service_id = $1 AND status = 'waiting'
     ORDER BY position_in_queue ASC, joined_at ASC
     LIMIT 1`,
    [serviceId]
  );

  if (nextRes.rows.length === 0) {
    return null;
  }

  const nextToken = nextRes.rows[0];
  return await updateTokenStatus(nextToken.id, 'called', operatorId, counterId);
}
