import { z } from 'zod';

// Roles & Enums
export const UserRoleEnum = z.enum(['citizen', 'operator', 'admin', 'superadmin']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const LocationCategoryEnum = z.enum([
  'healthcare',
  'banking',
  'government',
  'education',
  'utility',
  'other',
]);
export type LocationCategory = z.infer<typeof LocationCategoryEnum>;

export const TokenStatusEnum = z.enum([
  'waiting',
  'called',
  'serving',
  'completed',
  'skipped',
  'cancelled',
]);
export type TokenStatus = z.infer<typeof TokenStatusEnum>;

export const TokenEventTypeEnum = z.enum([
  'joined',
  'called',
  'serving',
  'completed',
  'skipped',
  'cancelled',
]);
export type TokenEventType = z.infer<typeof TokenEventTypeEnum>;

// Auth Schemas
export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters long'),
  phone: z.string().optional(),
  role: UserRoleEnum.default('citizen'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// Location Schemas
export const CreateLocationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
  category: LocationCategoryEnum,
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  description: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});
export type CreateLocationInput = z.input<typeof CreateLocationSchema>;

export const UpdateLocationSchema = CreateLocationSchema.partial();
export type UpdateLocationInput = z.input<typeof UpdateLocationSchema>;

// Service Schemas
export const CreateServiceSchema = z.object({
  location_id: z.string().uuid('Valid location ID required'),
  name: z.string().min(2, 'Service name must be at least 2 characters long'),
  description: z.string().optional().nullable(),
  average_service_time_minutes: z.coerce.number().int().min(1).max(180).default(8),
  is_active: z.boolean().optional().default(true),
});
export type CreateServiceInput = z.input<typeof CreateServiceSchema>;

export const UpdateServiceSchema = CreateServiceSchema.partial();
export type UpdateServiceInput = z.input<typeof UpdateServiceSchema>;

// Counter Schemas
export const CreateCounterSchema = z.object({
  service_id: z.string().uuid('Valid service ID required'),
  name: z.string().min(1, 'Counter name is required'),
  is_open: z.boolean().optional().default(true),
  current_operator_id: z.string().uuid().optional().nullable(),
});
export type CreateCounterInput = z.input<typeof CreateCounterSchema>;

export const UpdateCounterSchema = z.object({
  name: z.string().min(1).optional(),
  is_open: z.boolean().optional(),
  current_operator_id: z.string().uuid().optional().nullable(),
});
export type UpdateCounterInput = z.input<typeof UpdateCounterSchema>;

// Token Schemas
export const JoinQueueSchema = z.object({
  service_id: z.string().uuid('Valid service ID required'),
  counter_id: z.string().uuid().optional().nullable(),
  citizen_name: z.string().min(2, 'Name must be at least 2 characters long'),
  citizen_phone: z.string().min(5, 'Phone number is required for notifications').optional().nullable(),
  citizen_email: z.string().email('Valid email required for notifications').optional().nullable(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
});
export type JoinQueueInput = z.input<typeof JoinQueueSchema>;

export const UpdateTokenStatusSchema = z.object({
  status: TokenStatusEnum,
  counter_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});
export type UpdateTokenStatusInput = z.input<typeof UpdateTokenStatusSchema>;

// AI Prediction Schemas
export const PredictWaitSchema = z.object({
  serviceId: z.string().uuid(),
  waitingCount: z.coerce.number().int().min(0).optional(),
  activeCounters: z.coerce.number().int().min(0).optional(),
  avgServiceTime: z.coerce.number().min(1).optional(),
});
export type PredictWaitInput = z.infer<typeof PredictWaitSchema>;

export const AIWaitPredictionResponseSchema = z.object({
  estimatedWaitMinutes: z.number(),
  confidence: z.number().min(0).max(100),
  message: z.string().max(160),
  suggestedArrivalWindow: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
});
export type AIWaitPredictionResponse = z.infer<typeof AIWaitPredictionResponseSchema>;

export const AIStatusAdvisoryResponseSchema = z.object({
  title: z.string(),
  body: z.string().max(200),
  actionHint: z.string().optional().nullable(),
});
export type AIStatusAdvisoryResponse = z.infer<typeof AIStatusAdvisoryResponseSchema>;

export const AIAnomalyResponseSchema = z.object({
  hasAnomaly: z.boolean(),
  severity: z.enum(['none', 'low', 'medium', 'high']),
  suggestion: z.string(),
  recommendedOpenCounters: z.number().int().min(0),
});
export type AIAnomalyResponse = z.infer<typeof AIAnomalyResponseSchema>;

// Entity Data Models
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  category: LocationCategory;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Computed / Aggregated properties
  services_count?: number;
  total_waiting?: number;
  min_wait_minutes?: number;
}

export interface Service {
  id: string;
  location_id: string;
  name: string;
  description?: string | null;
  average_service_time_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed / Aggregated properties
  location_name?: string;
  location_slug?: string;
  location_category?: LocationCategory;
  active_counters_count?: number;
  waiting_tokens_count?: number;
  currently_serving_token?: string | null;
  estimated_wait_minutes?: number;
}

export interface Counter {
  id: string;
  service_id: string;
  name: string;
  is_open: boolean;
  current_operator_id?: string | null;
  operator_name?: string | null;
  created_at: string;
  updated_at: string;
  // Computed
  service_name?: string;
  currently_serving_token?: Token | null;
}

export interface Token {
  id: string;
  token_number: string;
  service_id: string;
  counter_id?: string | null;
  user_id?: string | null;
  citizen_name: string;
  citizen_phone?: string | null;
  citizen_email?: string | null;
  status: TokenStatus;
  position_in_queue: number;
  estimated_wait_minutes: number;
  joined_at: string;
  called_at?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Enriched
  service_name?: string;
  location_name?: string;
  location_id?: string;
  counter_name?: string | null;
  ai_advisory?: AIStatusAdvisoryResponse | null;
}

export interface TokenEvent {
  id: string;
  token_id: string;
  event_type: TokenEventType;
  operator_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id?: string | null;
  token_id?: string | null;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface QueueAnalytics {
  locationId: string;
  locationName: string;
  totalWaiting: number;
  totalServedToday: number;
  averageWaitMinutes: number;
  averageServiceMinutes: number;
  activeCounters: number;
  peakHour: string;
  hourlyStats: {
    hour: string;
    servedCount: number;
    avgWaitMinutes: number;
  }[];
  serviceBreakdown: {
    serviceId: string;
    serviceName: string;
    waitingCount: number;
    servedCount: number;
    avgWaitMinutes: number;
    activeCounters: number;
  }[];
  aiAnomaly?: AIAnomalyResponse;
}

// Standard API Response envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}
