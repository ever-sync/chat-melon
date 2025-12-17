import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

// Types
export interface AuditLog {
  id: string;
  company_id: string | null;
  company_name?: string;
  user_id: string | null;
  user_email: string | null;
  user_name?: string;
  user_ip: string | null;
  user_agent: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  metadata: Record<string, any>;
  severity: 'debug' | 'info' | 'warning' | 'critical';
  category: string | null;
  created_at: string;
  action_label?: string;
  resource_type_label?: string;
}

export interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  userId?: string;
  severity?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
}

// Hook for fetching audit logs
export function useAuditLogs(filters: AuditLogFilters = {}) {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ['audit-logs', currentCompany?.id, filters],
    queryFn: async () => {
      if (!currentCompany?.id) return [];

      let query = supabase
        .from('audit_logs')
        .select(
          `
          *,
          profiles:user_id (full_name)
        `
        )
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })
        .limit(500);

      // Apply filters
      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters.searchTerm) {
        query = query.or(
          `resource_name.ilike.%${filters.searchTerm}%,user_email.ilike.%${filters.searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }

      // Transform data
      return (data || []).map((log: any) => ({
        ...log,
        user_name: log.profiles?.full_name || log.user_email,
        action_label: getActionLabel(log.action),
        resource_type_label: getResourceTypeLabel(log.resource_type),
      })) as AuditLog[];
    },
    enabled: !!currentCompany?.id,
  });
}

// Hook for creating audit log manually
export function useCreateAuditLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      resourceType,
      resourceId,
      resourceName,
      oldValues,
      newValues,
      metadata,
      severity = 'info',
      category,
    }: {
      action: string;
      resourceType: string;
      resourceId?: string;
      resourceName?: string;
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      metadata?: Record<string, any>;
      severity?: 'debug' | 'info' | 'warning' | 'critical';
      category?: string;
    }) => {
      // Use the database function
      const { data, error } = await supabase.rpc('create_audit_log', {
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId || null,
        p_resource_name: resourceName || null,
        p_old_values: oldValues || null,
        p_new_values: newValues || null,
        p_metadata: metadata || {},
      });

      if (error) {
        console.error('Error creating audit log:', error);
        // Don't throw - audit logs shouldn't break the app
        return null;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}

// Hook for logging authentication events
export function useLogAuthEvent() {
  return useMutation({
    mutationFn: async ({
      eventType,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      metadata,
    }: {
      eventType:
        | 'login'
        | 'logout'
        | 'failed_login'
        | 'password_reset'
        | '2fa_enabled'
        | '2fa_disabled';
      userId?: string;
      userEmail?: string;
      ipAddress?: string;
      userAgent?: string;
      metadata?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc('log_auth_event', {
        p_event_type: eventType,
        p_user_id: userId || null,
        p_user_email: userEmail || null,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null,
        p_metadata: metadata || {},
      });

      if (error) {
        console.error('Error logging auth event:', error);
        return null;
      }

      return data;
    },
  });
}

// Hook for logging data exports
export function useLogDataExport() {
  return useMutation({
    mutationFn: async ({
      resourceType,
      recordCount,
      exportFormat,
      filters,
    }: {
      resourceType: string;
      recordCount: number;
      exportFormat: 'csv' | 'xlsx' | 'pdf';
      filters?: Record<string, any>;
    }) => {
      const { data, error } = await supabase.rpc('log_data_export', {
        p_resource_type: resourceType,
        p_record_count: recordCount,
        p_export_format: exportFormat,
        p_filters: filters || {},
      });

      if (error) {
        console.error('Error logging data export:', error);
        return null;
      }

      return data;
    },
  });
}

// Hook for audit log statistics
export function useAuditLogStats() {
  const { currentCompany } = useCompany();

  return useQuery({
    queryKey: ['audit-log-stats', currentCompany?.id],
    queryFn: async () => {
      if (!currentCompany?.id) return null;

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get counts by action
      const { data: actionStats } = await supabase
        .from('audit_logs')
        .select('action')
        .eq('company_id', currentCompany.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get counts by severity
      const { data: severityStats } = await supabase
        .from('audit_logs')
        .select('severity')
        .eq('company_id', currentCompany.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get unique users count
      const { data: userStats } = await supabase
        .from('audit_logs')
        .select('user_id')
        .eq('company_id', currentCompany.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('user_id', 'is', null);

      const actionCounts: Record<string, number> = {};
      actionStats?.forEach((log) => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      const severityCounts: Record<string, number> = {};
      severityStats?.forEach((log) => {
        severityCounts[log.severity] = (severityCounts[log.severity] || 0) + 1;
      });

      const uniqueUsers = new Set(userStats?.map((log) => log.user_id)).size;

      return {
        totalEvents: actionStats?.length || 0,
        actionCounts,
        severityCounts,
        uniqueUsers,
        warningCount: severityCounts.warning || 0,
        criticalCount: severityCounts.critical || 0,
      };
    },
    enabled: !!currentCompany?.id,
  });
}

// Helper functions
function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    create: 'Criação',
    update: 'Atualização',
    delete: 'Exclusão',
    login: 'Login',
    logout: 'Logout',
    export: 'Exportação',
    failed_login: 'Login Falhou',
    password_reset: 'Reset de Senha',
    '2fa_enabled': '2FA Ativado',
    '2fa_disabled': '2FA Desativado',
  };
  return labels[action] || action;
}

function getResourceTypeLabel(resourceType: string): string {
  const labels: Record<string, string> = {
    contacts: 'Contato',
    deals: 'Negociação',
    conversations: 'Conversa',
    profiles: 'Usuário',
    company_members: 'Membro da Equipe',
    orders: 'Pedido',
    auth: 'Autenticação',
    campaigns: 'Campanha',
    chatbots: 'Chatbot',
    cadences: 'Cadência',
    products: 'Produto',
    api_keys: 'Chave de API',
    webhooks: 'Webhook',
    settings: 'Configurações',
  };
  return labels[resourceType] || resourceType;
}

export default useAuditLogs;
