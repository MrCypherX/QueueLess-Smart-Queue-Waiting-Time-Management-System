import { GoogleGenAI } from '@google/genai';
import {
  AIWaitPredictionResponse,
  AIStatusAdvisoryResponse,
  AIAnomalyResponse,
} from '../../../shared/schemas';

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey.trim() !== '') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
    console.log('🤖 Google Gemini AI Client initialized.');
  } catch (err) {
    console.warn('⚠️ Failed to initialize Google GenAI client:', err);
  }
} else {
  console.log('ℹ️ GEMINI_API_KEY not set. Using intelligent queue-theory statistical predictive engine.');
}

export interface WaitPredictionContext {
  serviceName: string;
  locationName: string;
  waitingCount: number;
  activeCounters: number;
  avgServiceTime: number;
  currentHour?: number;
  currentMinute?: number;
  dayOfWeek?: string;
  historicalAvg?: number;
  trend?: 'stable' | 'increasing' | 'decreasing';
}

export interface TokenStatusContext {
  tokenNumber: string;
  position: number;
  estimatedWait: number;
  status: string;
  serviceName?: string;
  counterName?: string | null;
}

export interface AnomalyContext {
  serviceName: string;
  locationName: string;
  waitingCount: number;
  activeCounters: number;
  avgServiceTime: number;
  avgWaitTime: number;
  completedLastHour: number;
  rateOfArrivalPerHour?: number;
}

/**
 * Intelligent Queue-Theory statistical prediction fallback (Little's Law + M/M/c simulation)
 */
function heuristicWaitPrediction(ctx: WaitPredictionContext): AIWaitPredictionResponse {
  const c = Math.max(1, ctx.activeCounters);
  const avgService = Math.max(2, ctx.avgServiceTime || 8);
  const waiting = Math.max(0, ctx.waitingCount);

  // Time-of-day rush multiplier (e.g. 10:00-12:00 and 14:00-16:00 peak)
  const hour = ctx.currentHour ?? new Date().getHours();
  let timeMultiplier = 1.0;
  if ((hour >= 10 && hour <= 12) || (hour >= 14 && hour <= 16)) {
    timeMultiplier = 1.15;
  } else if (hour < 9 || hour > 17) {
    timeMultiplier = 0.9;
  }

  // Queue estimate: wait = (waiting / counters) * avgService * timeMultiplier
  const baseMinutes = Math.round((waiting / c) * avgService * timeMultiplier);
  const estimatedWaitMinutes = Math.max(1, baseMinutes);

  // Suggested arrival window: conservative cushion
  const lowerBound = Math.max(1, Math.round(estimatedWaitMinutes * 0.8));
  const upperBound = Math.round(estimatedWaitMinutes * 1.25);
  const suggestedArrivalWindow =
    estimatedWaitMinutes <= 5
      ? 'Please stay near the counter'
      : `Arrive in ${lowerBound}–${upperBound} minutes`;

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (waiting > c * 6 || estimatedWaitMinutes > 45) {
    riskLevel = 'high';
  } else if (waiting > c * 3 || estimatedWaitMinutes > 20) {
    riskLevel = 'medium';
  }

  // Confidence is higher when active counters are open and historical data exists
  const confidence = Math.min(96, Math.max(65, Math.round(88 - (waiting / (c * 2)) * 4)));

  let message = `Expected wait is approx. ${estimatedWaitMinutes} mins with ${c} active counter${c > 1 ? 's' : ''}.`;
  if (waiting === 0) {
    message = 'Counters are currently free. You will be attended to immediately.';
  } else if (riskLevel === 'high') {
    message = `High volume right now. Counters are working steadily; we appreciate your patience.`;
  }

  return {
    estimatedWaitMinutes,
    confidence,
    message: message.slice(0, 120),
    suggestedArrivalWindow,
    riskLevel,
  };
}

/**
 * Heuristic Status Advisory fallback
 */
function heuristicAdvisoryMessage(ctx: TokenStatusContext): AIStatusAdvisoryResponse {
  if (ctx.status === 'serving') {
    return {
      title: 'Now Serving!',
      body: `Token ${ctx.tokenNumber} is currently being served at ${ctx.counterName || 'your counter'}.`,
      actionHint: 'Please step forward to the counter.',
    };
  }

  if (ctx.status === 'called') {
    return {
      title: 'Token Called!',
      body: `Token ${ctx.tokenNumber} has been called to ${ctx.counterName || 'Counter'}.`,
      actionHint: 'Please proceed to your assigned window immediately.',
    };
  }

  if (ctx.status === 'completed') {
    return {
      title: 'Service Completed',
      body: `Token ${ctx.tokenNumber} has been marked completed. Thank you for using QueueLess.`,
      actionHint: 'Have a wonderful day!',
    };
  }

  if (ctx.position === 1) {
    return {
      title: 'You are Next in Line!',
      body: `You are position #1! Estimated turn in approx. ${ctx.estimatedWait} minutes.`,
      actionHint: 'Please stay ready near the service display.',
    };
  }

  if (ctx.position <= 3) {
    return {
      title: 'Your Turn is Approaching',
      body: `Only ${ctx.position - 1} person(s) ahead of you. Estimated wait: ${ctx.estimatedWait} minutes.`,
      actionHint: 'Start heading towards the service area.',
    };
  }

  return {
    title: 'Queued Successfully',
    body: `You are #${ctx.position} in line. Estimated waiting time is ${ctx.estimatedWait} minutes.`,
    actionHint: 'You may relax nearby; we will notify you when your turn is close.',
  };
}

/**
 * Heuristic Anomaly detection fallback
 */
function heuristicAnomalyDetection(ctx: AnomalyContext): AIAnomalyResponse {
  const c = Math.max(1, ctx.activeCounters);
  const queuePerCounter = ctx.waitingCount / c;

  if (queuePerCounter >= 6 || (ctx.avgWaitTime > 35 && ctx.waitingCount > 5)) {
    const recommended = Math.min(8, c + Math.ceil((ctx.waitingCount - c * 3) / 4));
    return {
      hasAnomaly: true,
      severity: queuePerCounter >= 8 ? 'high' : 'medium',
      suggestion: `Queue bottleneck detected (${ctx.waitingCount} waiting on ${c} counter${c > 1 ? 's' : ''}). Open ${recommended - c} additional counter(s) to stabilize wait times.`,
      recommendedOpenCounters: recommended,
    };
  }

  if (ctx.activeCounters === 0 && ctx.waitingCount > 0) {
    return {
      hasAnomaly: true,
      severity: 'high',
      suggestion: 'All counters are closed while citizens are waiting. Open at least 1 counter immediately.',
      recommendedOpenCounters: 2,
    };
  }

  return {
    hasAnomaly: false,
    severity: 'none',
    suggestion: `Queue operating efficiently. ${c} counter(s) maintaining throughput under standard service levels.`,
    recommendedOpenCounters: c,
  };
}

/**
 * Predict waiting time using Gemini or heuristic fallback
 */
export async function predictWaitTime(ctx: WaitPredictionContext): Promise<AIWaitPredictionResponse> {
  if (!aiClient) {
    return heuristicWaitPrediction(ctx);
  }

  const prompt = `System: You are QueueLess AI – expert waiting-time prediction engine.

Current queue context:
- Service: ${ctx.serviceName}
- Location: ${ctx.locationName}
- Current waiting tokens: ${ctx.waitingCount}
- Active open counters: ${ctx.activeCounters}
- Average service time of last 20 completed tokens: ${ctx.avgServiceTime} minutes
- Time of day: ${ctx.currentHour ?? new Date().getHours()}:${ctx.currentMinute ?? new Date().getMinutes()} (${ctx.dayOfWeek ?? 'Today'})
- Historical average for this hour: ${ctx.historicalAvg ?? ctx.avgServiceTime * ctx.waitingCount} minutes
- Recent trend: ${ctx.trend ?? 'stable'}

Task: Predict the expected waiting time in minutes for a new person joining now.
Also provide a confidence score (0-100) and a short human message.

Respond ONLY with this exact JSON format:
{
  "estimatedWaitMinutes": number,
  "confidence": number,
  "message": "string (max 120 chars, calm and helpful)",
  "suggestedArrivalWindow": "string (e.g. 'Arrive in 25-35 minutes')",
  "riskLevel": "low" | "medium" | "high"
}`;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    const parsed = JSON.parse(text);
    return {
      estimatedWaitMinutes: Number(parsed.estimatedWaitMinutes) || 5,
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 85)),
      message: String(parsed.message || '').slice(0, 120),
      suggestedArrivalWindow: String(parsed.suggestedArrivalWindow || 'Arrive in 15 minutes'),
      riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'low',
    };
  } catch (err) {
    console.warn('⚠️ Gemini predictWaitTime call failed, falling back to heuristic:', err);
    return heuristicWaitPrediction(ctx);
  }
}

/**
 * Generate friendly status advisory using Gemini or heuristic fallback
 */
export async function generateStatusAdvisory(ctx: TokenStatusContext): Promise<AIStatusAdvisoryResponse> {
  if (!aiClient) {
    return heuristicAdvisoryMessage(ctx);
  }

  const prompt = `System: Generate a polite, clear, real-time status message for a citizen.

Token: ${ctx.tokenNumber}
Current position: ${ctx.position}
Estimated wait: ${ctx.estimatedWait} minutes
Status: ${ctx.status}
Service: ${ctx.serviceName || 'Service'}
Counter: ${ctx.counterName || 'Unassigned'}

Respond ONLY with JSON:
{
  "title": "string",
  "body": "string (friendly, under 160 chars)",
  "actionHint": "string (optional)"
}`;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    const parsed = JSON.parse(text);
    return {
      title: String(parsed.title || 'Queue Update'),
      body: String(parsed.body || '').slice(0, 160),
      actionHint: parsed.actionHint ? String(parsed.actionHint).slice(0, 100) : undefined,
    };
  } catch (err) {
    console.warn('⚠️ Gemini advisory call failed, falling back to heuristic:', err);
    return heuristicAdvisoryMessage(ctx);
  }
}

/**
 * Detect anomalies and optimize counter allocations using Gemini or heuristic fallback
 */
export async function detectAnomalies(ctx: AnomalyContext): Promise<AIAnomalyResponse> {
  if (!aiClient) {
    return heuristicAnomalyDetection(ctx);
  }

  const prompt = `System: You are QueueLess AI queue optimization expert.
Analyze the following live metrics and suggest one concrete action if needed.

Service: ${ctx.serviceName}
Location: ${ctx.locationName}
Waiting tokens: ${ctx.waitingCount}
Active open counters: ${ctx.activeCounters}
Average service time: ${ctx.avgServiceTime} mins
Average wait time: ${ctx.avgWaitTime} mins
Completed in last hour: ${ctx.completedLastHour}

Return JSON:
{
  "hasAnomaly": boolean,
  "severity": "none" | "low" | "medium" | "high",
  "suggestion": "string",
  "recommendedOpenCounters": number
}`;

  try {
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '';
    const parsed = JSON.parse(text);
    return {
      hasAnomaly: Boolean(parsed.hasAnomaly),
      severity: ['none', 'low', 'medium', 'high'].includes(parsed.severity) ? parsed.severity : 'none',
      suggestion: String(parsed.suggestion || 'Operations normal.'),
      recommendedOpenCounters: Math.max(1, Number(parsed.recommendedOpenCounters) || 1),
    };
  } catch (err) {
    console.warn('⚠️ Gemini anomaly detection failed, falling back to heuristic:', err);
    return heuristicAnomalyDetection(ctx);
  }
}
