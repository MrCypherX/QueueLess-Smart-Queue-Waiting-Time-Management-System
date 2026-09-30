import {
  ApiResponse,
  User,
  Location,
  Service,
  Counter,
  Token,
  NotificationItem,
  QueueAnalytics,
  LoginInput,
  RegisterInput,
  CreateLocationInput,
  UpdateLocationInput,
  CreateServiceInput,
  UpdateServiceInput,
  CreateCounterInput,
  UpdateCounterInput,
  JoinQueueInput,
  TokenStatus,
  AIWaitPredictionResponse,
  AIStatusAdvisoryResponse,
  AIAnomalyResponse,
} from '../../../shared/schemas';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('queueless_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    error: `HTTP error ${res.status}: ${res.statusText}`,
  }));

  if (!res.ok || !json.success) {
    throw new Error(json.error || 'A network error occurred. Please try again.');
  }

  return json.data as T;
}

export const api = {
  // Auth
  auth: {
    login: (data: LoginInput) =>
      request<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    register: (data: RegisterInput) =>
      request<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<User>('/api/auth/me'),
  },

  // Locations & Services
  locations: {
    list: (params?: { category?: string; city?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set('category', params.category);
      if (params?.city) q.set('city', params.city);
      if (params?.search) q.set('search', params.search);
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return request<Location[]>(`/api/locations${queryStr}`);
    },
    get: (idOrSlug: string) =>
      request<{ location: Location; services: Service[] }>(`/api/locations/${idOrSlug}`),
    create: (data: CreateLocationInput) =>
      request<Location>('/api/locations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateLocationInput) =>
      request<Location>(`/api/locations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  services: {
    create: (data: CreateServiceInput) =>
      request<Service>('/api/locations/services', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateServiceInput) =>
      request<Service>(`/api/locations/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getByLocation: (locationId: string) =>
      request<Service[]>(`/api/locations/${locationId}/services`),
  },

  // Counters
  counters: {
    getByService: (serviceId: string) =>
      request<Counter[]>(`/api/counters/services/${serviceId}/counters`),
    my: () => request<Counter[]>('/api/counters/my'),
    create: (data: CreateCounterInput) =>
      request<Counter>('/api/counters', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: UpdateCounterInput) =>
      request<Counter>(`/api/counters/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Tokens (Core Queue)
  tokens: {
    join: (data: JoinQueueInput) =>
      request<Token>('/api/tokens', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    get: (id: string) => request<Token>(`/api/tokens/${id}`),
    my: () => request<Token[]>('/api/tokens/my'),
    updateStatus: (
      id: string,
      status: TokenStatus,
      counterId?: string | null,
      notes?: string | null
    ) =>
      request<Token>(`/api/tokens/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, counter_id: counterId, notes }),
      }),
    callNext: (serviceId: string, counterId: string) =>
      request<Token | null>('/api/tokens/call-next', {
        method: 'POST',
        body: JSON.stringify({ service_id: serviceId, counter_id: counterId }),
      }),
    getQueue: (serviceId: string) =>
      request<{
        service: Service;
        serving: Token[];
        waiting: Token[];
        completedToday: Token[];
      }>(`/api/tokens/services/${serviceId}/queue`),
  },

  // AI Prediction & Advisory
  ai: {
    predictWait: (serviceId: string) =>
      request<AIWaitPredictionResponse>('/api/ai/predict-wait', {
        method: 'POST',
        body: JSON.stringify({ serviceId }),
      }),
    getAdvisory: (context: {
      tokenNumber: string;
      position: number;
      estimatedWait: number;
      status?: string;
      serviceName?: string;
      counterName?: string | null;
    }) =>
      request<AIStatusAdvisoryResponse>('/api/ai/advisory', {
        method: 'POST',
        body: JSON.stringify(context),
      }),
    getAnomalies: (metrics: any) =>
      request<AIAnomalyResponse>('/api/ai/anomalies', {
        method: 'POST',
        body: JSON.stringify(metrics),
      }),
  },

  // Notifications
  notifications: {
    list: () => request<NotificationItem[]>('/api/notifications'),
    markRead: (id: string) =>
      request<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      }),
    markAllRead: () =>
      request<{ success: boolean }>('/api/notifications/read-all', {
        method: 'POST',
      }),
  },

  // Analytics
  analytics: {
    getLocation: (locationId: string) =>
      request<QueueAnalytics>(`/api/admin/analytics/${locationId}`),
    getSystemOverview: () =>
      request<{
        totalLocations: number;
        totalServices: number;
        totalOpenCounters: number;
        totalUsers: number;
        currentWaitingTokens: number;
        tokensCompletedToday: number;
      }>('/api/admin/analytics/system/overview'),
  },
};
