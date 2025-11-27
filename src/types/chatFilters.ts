export interface ChatFilters {
  status: string[];
  assignedTo: string; // 'me' | 'unassigned' | 'all' | userId
  labels: string[];
  hasUnread: boolean;
  dateRange: { start: Date; end: Date } | null;
  search: string;
  // Advanced filters
  lastMessageDate?: 'today' | 'yesterday' | 'week' | 'month' | 'custom';
  noResponseTime?: '1h' | '4h' | '24h' | '48h';
  hasMedia?: boolean;
  sector?: string | null;
}

export interface SavedFilter {
  id: string;
  user_id: string;
  company_id: string;
  name: string;
  filters: ChatFilters;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const getDefaultFilters = (): ChatFilters => ({
  status: [],
  assignedTo: 'all',
  labels: [],
  hasUnread: false,
  dateRange: null,
  search: '',
  sector: null,
});
