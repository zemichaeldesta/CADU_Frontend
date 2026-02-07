import apiClient from './client';

export interface AuditLog {
  id: number;
  user: number | null;
  username: string;
  action: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  action_description: string;
  endpoint: string;
  method: string;
  ip_address: string | null;
  user_agent: string;
  request_data: any;
  response_status: number;
  response_data: any;
  timestamp: string;
  duration_ms: number;
  error_message: string;
}

export interface AuditLogSearchParams {
  search?: string;
  action?: string;
  method?: string;
  response_status?: number;
  user?: number;
  username?: string;
  endpoint?: string;
  date_from?: string;
  date_to?: string;
  ordering?: string;
  page?: number;
}

export interface AuditLogListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
}

export const auditLogsAPI = {
  /**
   * Get list of audit logs with optional filtering
   */
  getLogs: async (params?: AuditLogSearchParams): Promise<AuditLogListResponse> => {
    const response = await apiClient.get<AuditLogListResponse>('/admin/logs/', { params });
    return response.data;
  },

  /**
   * Get a single audit log by ID
   */
  getLog: async (id: number): Promise<AuditLog> => {
    const response = await apiClient.get<AuditLog>(`/admin/logs/${id}/`);
    return response.data;
  },

  /**
   * Export logs to JSON (client-side export from API response)
   */
  exportLogs: async (params?: AuditLogSearchParams): Promise<AuditLog[]> => {
    // Fetch all logs (no pagination) for export
    const allLogs: AuditLog[] = [];
    let nextUrl: string | null = '/admin/logs/';
    let page = 1;

    while (nextUrl) {
      const response: { data: AuditLogListResponse } = await apiClient.get<AuditLogListResponse>(nextUrl, {
        params: { ...params, page, page_size: 100 }, // Large page size for export
      });
      allLogs.push(...response.data.results);
      nextUrl = response.data.next;
      page++;
      
      // Safety limit to prevent infinite loops
      if (page > 1000) break;
    }

    return allLogs;
  },

  /**
   * Get web statistics from audit logs
   */
  getStatistics: async (days?: number): Promise<LogStatistics> => {
    const response = await apiClient.get<LogStatistics>('/admin/logs/statistics/', {
      params: days ? { days } : {},
    });
    return response.data;
  },

  /**
   * Get list of deleted users from audit logs
   */
  getDeletedUsers: async (days?: number): Promise<DeletedUsersResponse> => {
    const response = await apiClient.get<DeletedUsersResponse>('/admin/logs/deleted-users/', {
      params: days ? { days } : {},
    });
    return response.data;
  },
};

export interface LogStatistics {
  total_visits: number;  // Human visits only
  total_bot_visits: number;
  total_all_visits: number;
  visits_today: number;
  visits_this_week: number;
  visits_this_month: number;
  bot_visits_today: number;
  bot_visits_this_week: number;
  bot_visits_this_month: number;
  most_visited_pages: Array<{ page: string; visits: number }>;
  most_visited_endpoints: Array<{ endpoint: string; visits: number }>;
  visits_by_method: Record<string, number>;
  visits_by_status: Record<string, number>;
  top_users: Array<{ username: string; visits: number }>;
  period_days: number;
}

export interface DeletedUser {
  id: number;
  endpoint: string;
  user_id: number | null;
  deleted_username: string;
  deleted_email: string | null;
  deleted_name: string | null;
  deleted_by: string;
  deleted_by_user_id: number | null;
  timestamp: string;
  ip_address: string | null;
  action_description: string;
}

export interface DeletedUsersResponse {
  count: number;
  results: DeletedUser[];
}
