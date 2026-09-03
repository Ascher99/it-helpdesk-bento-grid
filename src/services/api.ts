import { User, Ticket, StatsData, DecodedJwt } from '../types';

const TOKEN_KEY = 'it_helpdesk_jwt_token';

export const authStorage = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
  decodeToken: (token: string): DecodedJwt | null => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as DecodedJwt;
    } catch (e) {
      return null;
    }
  },
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Auth
  login: async (email: string, password: string): Promise<{ access_token: string; user: User }> => {
    const data = await apiRequest<{ access_token: string; user: User }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    authStorage.setToken(data.access_token);
    return data;
  },

  register: async (data: { email: string; password: string; full_name: string; department: string }): Promise<{ access_token: string; user: User }> => {
    const res = await apiRequest<{ access_token: string; user: User }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    authStorage.setToken(res.access_token);
    return res;
  },

  getMe: async (): Promise<User> => {
    return apiRequest<User>('/api/v1/auth/me');
  },

  getUsers: async (): Promise<User[]> => {
    return apiRequest<User[]>('/api/v1/users');
  },

  // Tickets
  getTickets: async (filters: {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    scope?: string;
  } = {}): Promise<Ticket[]> => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
    if (filters.category && filters.category !== 'ALL') params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.scope) params.append('scope', filters.scope);

    const qs = params.toString();
    return apiRequest<Ticket[]>(`/api/v1/tickets${qs ? `?${qs}` : ''}`);
  },

  getTicketById: async (id: number): Promise<Ticket> => {
    return apiRequest<Ticket>(`/api/v1/tickets/${id}`);
  },

  createTicket: async (data: {
    title: string;
    description: string;
    category: string;
    priority: string;
  }): Promise<Ticket> => {
    return apiRequest<Ticket>('/api/v1/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateTicket: async (
    id: number,
    data: {
      status?: string;
      priority?: string;
      category?: string;
      assigned_agent_id?: number | null;
    }
  ): Promise<Ticket> => {
    return apiRequest<Ticket>(`/api/v1/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  addComment: async (
    ticketId: number,
    message: string,
    isInternalNote: boolean = false
  ): Promise<any> => {
    return apiRequest(`/api/v1/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message, is_internal_note: isInternalNote }),
    });
  },

  deleteTicket: async (id: number): Promise<any> => {
    return apiRequest(`/api/v1/tickets/${id}`, {
      method: 'DELETE',
    });
  },

  // Stats
  getStats: async (): Promise<StatsData> => {
    return apiRequest<StatsData>('/api/v1/stats');
  },
};
