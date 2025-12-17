export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      access_audit_log: {
        Row: {
          action: string;
          company_id: string;
          created_at: string;
          error_message: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          record_id: string | null;
          status: string;
          table_name: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          action: string;
          company_id: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          record_id?: string | null;
          status: string;
          table_name: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          company_id?: string;
          created_at?: string;
          error_message?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          record_id?: string | null;
          status?: string;
          table_name?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'access_audit_log_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      achievements: {
        Row: {
          badge_url: string | null;
          company_id: string | null;
          created_at: string | null;
          criteria: Json;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          points: number | null;
        };
        Insert: {
          badge_url?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          criteria: Json;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          points?: number | null;
        };
        Update: {
          badge_url?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          criteria?: Json;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          points?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'achievements_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      agent_status: {
        Row: {
          company_id: string;
          id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          company_id: string;
          id?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agent_status_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'agent_status_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_insights: {
        Row: {
          action_data: Json | null;
          action_type: string | null;
          company_id: string;
          created_at: string | null;
          data: Json | null;
          description: string;
          expires_at: string | null;
          id: string;
          insight_type: string;
          is_actionable: boolean | null;
          is_read: boolean | null;
          priority: string | null;
          title: string;
        };
        Insert: {
          action_data?: Json | null;
          action_type?: string | null;
          company_id: string;
          created_at?: string | null;
          data?: Json | null;
          description: string;
          expires_at?: string | null;
          id?: string;
          insight_type: string;
          is_actionable?: boolean | null;
          is_read?: boolean | null;
          priority?: string | null;
          title: string;
        };
        Update: {
          action_data?: Json | null;
          action_type?: string | null;
          company_id?: string;
          created_at?: string | null;
          data?: Json | null;
          description?: string;
          expires_at?: string | null;
          id?: string;
          insight_type?: string;
          is_actionable?: boolean | null;
          is_read?: boolean | null;
          priority?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_insights_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_metrics_daily: {
        Row: {
          avg_confidence: number | null;
          avg_response_time_ms: number | null;
          company_id: string;
          conversations_handled: number | null;
          created_at: string | null;
          deals_created: number | null;
          handoffs_automatic: number | null;
          handoffs_requested: number | null;
          handoffs_sentiment: number | null;
          handoffs_total: number | null;
          id: string;
          intents_detected: Json | null;
          leads_qualified: number | null;
          messages_received: number | null;
          messages_sent: number | null;
          metric_date: string;
          resolved_with_human: number | null;
          resolved_without_human: number | null;
          sentiment_negative: number | null;
          sentiment_neutral: number | null;
          sentiment_positive: number | null;
        };
        Insert: {
          avg_confidence?: number | null;
          avg_response_time_ms?: number | null;
          company_id: string;
          conversations_handled?: number | null;
          created_at?: string | null;
          deals_created?: number | null;
          handoffs_automatic?: number | null;
          handoffs_requested?: number | null;
          handoffs_sentiment?: number | null;
          handoffs_total?: number | null;
          id?: string;
          intents_detected?: Json | null;
          leads_qualified?: number | null;
          messages_received?: number | null;
          messages_sent?: number | null;
          metric_date: string;
          resolved_with_human?: number | null;
          resolved_without_human?: number | null;
          sentiment_negative?: number | null;
          sentiment_neutral?: number | null;
          sentiment_positive?: number | null;
        };
        Update: {
          avg_confidence?: number | null;
          avg_response_time_ms?: number | null;
          company_id?: string;
          conversations_handled?: number | null;
          created_at?: string | null;
          deals_created?: number | null;
          handoffs_automatic?: number | null;
          handoffs_requested?: number | null;
          handoffs_sentiment?: number | null;
          handoffs_total?: number | null;
          id?: string;
          intents_detected?: Json | null;
          leads_qualified?: number | null;
          messages_received?: number | null;
          messages_sent?: number | null;
          metric_date?: string;
          resolved_with_human?: number | null;
          resolved_without_human?: number | null;
          sentiment_negative?: number | null;
          sentiment_neutral?: number | null;
          sentiment_positive?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_metrics_daily_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_settings: {
        Row: {
          active_hours_end: string | null;
          active_hours_start: string | null;
          active_on_weekends: boolean | null;
          agent_name: string | null;
          company_id: string;
          copilot_script: string | null;
          created_at: string | null;
          default_mode: string | null;
          fallback_message: string | null;
          gemini_api_key: string | null;
          greeting_message: string | null;
          groq_api_key: string | null;
          handoff_keywords: string[] | null;
          handoff_message: string | null;
          handoff_on_high_value: boolean | null;
          handoff_on_negative_sentiment: boolean | null;
          high_value_threshold: number | null;
          id: string;
          is_enabled: boolean | null;
          language: string | null;
          max_messages_before_handoff: number | null;
          max_response_length: number | null;
          n8n_api_key: string | null;
          n8n_webhook_url: string | null;
          openai_api_key: string | null;
          personality: string | null;
          response_delay_ms: number | null;
          system_prompt: string | null;
          typing_indicator: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          active_hours_end?: string | null;
          active_hours_start?: string | null;
          active_on_weekends?: boolean | null;
          agent_name?: string | null;
          company_id: string;
          copilot_script?: string | null;
          created_at?: string | null;
          default_mode?: string | null;
          fallback_message?: string | null;
          gemini_api_key?: string | null;
          greeting_message?: string | null;
          groq_api_key?: string | null;
          handoff_keywords?: string[] | null;
          handoff_message?: string | null;
          handoff_on_high_value?: boolean | null;
          handoff_on_negative_sentiment?: boolean | null;
          high_value_threshold?: number | null;
          id?: string;
          is_enabled?: boolean | null;
          language?: string | null;
          max_messages_before_handoff?: number | null;
          max_response_length?: number | null;
          n8n_api_key?: string | null;
          n8n_webhook_url?: string | null;
          openai_api_key?: string | null;
          personality?: string | null;
          response_delay_ms?: number | null;
          system_prompt?: string | null;
          typing_indicator?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          active_hours_end?: string | null;
          active_hours_start?: string | null;
          active_on_weekends?: boolean | null;
          agent_name?: string | null;
          company_id?: string;
          copilot_script?: string | null;
          created_at?: string | null;
          default_mode?: string | null;
          fallback_message?: string | null;
          gemini_api_key?: string | null;
          greeting_message?: string | null;
          groq_api_key?: string | null;
          handoff_keywords?: string[] | null;
          handoff_message?: string | null;
          handoff_on_high_value?: boolean | null;
          handoff_on_negative_sentiment?: boolean | null;
          high_value_threshold?: number | null;
          id?: string;
          is_enabled?: boolean | null;
          language?: string | null;
          max_messages_before_handoff?: number | null;
          max_response_length?: number | null;
          n8n_api_key?: string | null;
          n8n_webhook_url?: string | null;
          openai_api_key?: string | null;
          personality?: string | null;
          response_delay_ms?: number | null;
          system_prompt?: string | null;
          typing_indicator?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_settings_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_suggestions: {
        Row: {
          company_id: string;
          confidence: number | null;
          contact_id: string | null;
          content: string;
          conversation_id: string;
          created_at: string | null;
          dismissed_reason: string | null;
          expires_at: string | null;
          id: string;
          priority: string | null;
          related_product_id: string | null;
          status: string | null;
          suggestion_type: string;
          title: string;
          trigger_message_id: string | null;
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          company_id: string;
          confidence?: number | null;
          contact_id?: string | null;
          content: string;
          conversation_id: string;
          created_at?: string | null;
          dismissed_reason?: string | null;
          expires_at?: string | null;
          id?: string;
          priority?: string | null;
          related_product_id?: string | null;
          status?: string | null;
          suggestion_type: string;
          title: string;
          trigger_message_id?: string | null;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          company_id?: string;
          confidence?: number | null;
          contact_id?: string | null;
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          dismissed_reason?: string | null;
          expires_at?: string | null;
          id?: string;
          priority?: string | null;
          related_product_id?: string | null;
          status?: string | null;
          suggestion_type?: string;
          title?: string;
          trigger_message_id?: string | null;
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_suggestions_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_suggestions_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_suggestions_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_suggestions_related_product_id_fkey';
            columns: ['related_product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_suggestions_trigger_message_id_fkey';
            columns: ['trigger_message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ai_suggestions_used_by_fkey';
            columns: ['used_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      api_keys: {
        Row: {
          company_id: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          last_used_ip: string | null;
          name: string;
          permissions: string[] | null;
          rate_limit_per_day: number | null;
          rate_limit_per_minute: number | null;
          revoked_at: string | null;
          revoked_by: string | null;
          revoked_reason: string | null;
          scopes: string[] | null;
          total_requests: number | null;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          last_used_ip?: string | null;
          name: string;
          permissions?: string[] | null;
          rate_limit_per_day?: number | null;
          rate_limit_per_minute?: number | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoked_reason?: string | null;
          scopes?: string[] | null;
          total_requests?: number | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          last_used_ip?: string | null;
          name?: string;
          permissions?: string[] | null;
          rate_limit_per_day?: number | null;
          rate_limit_per_minute?: number | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          revoked_reason?: string | null;
          scopes?: string[] | null;
          total_requests?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'api_keys_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'api_keys_revoked_by_fkey';
            columns: ['revoked_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      api_rate_limits: {
        Row: {
          api_key_id: string;
          created_at: string | null;
          id: string;
          last_request_at: string | null;
          max_requests: number;
          request_count: number | null;
          window_duration: unknown;
          window_start: string;
        };
        Insert: {
          api_key_id: string;
          created_at?: string | null;
          id?: string;
          last_request_at?: string | null;
          max_requests: number;
          request_count?: number | null;
          window_duration?: unknown;
          window_start: string;
        };
        Update: {
          api_key_id?: string;
          created_at?: string | null;
          id?: string;
          last_request_at?: string | null;
          max_requests?: number;
          request_count?: number | null;
          window_duration?: unknown;
          window_start?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'api_rate_limits_api_key_id_fkey';
            columns: ['api_key_id'];
            isOneToOne: false;
            referencedRelation: 'api_keys';
            referencedColumns: ['id'];
          },
        ];
      };
      api_request_logs: {
        Row: {
          api_key_id: string | null;
          company_id: string;
          created_at: string | null;
          duration_ms: number | null;
          error_message: string | null;
          headers: Json | null;
          id: string;
          ip_address: string | null;
          method: string;
          path: string;
          query_params: Json | null;
          request_body: Json | null;
          response_body: Json | null;
          status_code: number | null;
          user_agent: string | null;
        };
        Insert: {
          api_key_id?: string | null;
          company_id: string;
          created_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          headers?: Json | null;
          id?: string;
          ip_address?: string | null;
          method: string;
          path: string;
          query_params?: Json | null;
          request_body?: Json | null;
          response_body?: Json | null;
          status_code?: number | null;
          user_agent?: string | null;
        };
        Update: {
          api_key_id?: string | null;
          company_id?: string;
          created_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          headers?: Json | null;
          id?: string;
          ip_address?: string | null;
          method?: string;
          path?: string;
          query_params?: Json | null;
          request_body?: Json | null;
          response_body?: Json | null;
          status_code?: number | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'api_request_logs_api_key_id_fkey';
            columns: ['api_key_id'];
            isOneToOne: false;
            referencedRelation: 'api_keys';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'api_request_logs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      attribution_sources: {
        Row: {
          company_id: string;
          created_at: string | null;
          id: string;
          name: string;
          total_contacts: number | null;
          total_deals: number | null;
          total_revenue: number | null;
          tracking_params: Json | null;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          id?: string;
          name: string;
          total_contacts?: number | null;
          total_deals?: number | null;
          total_revenue?: number | null;
          tracking_params?: Json | null;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
          total_contacts?: number | null;
          total_deals?: number | null;
          total_revenue?: number | null;
          tracking_params?: Json | null;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'attribution_sources_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          category: string | null;
          changes: Json | null;
          company_id: string | null;
          created_at: string | null;
          id: string;
          ip_address: unknown;
          metadata: Json | null;
          new_values: Json | null;
          old_values: Json | null;
          resource_id: string | null;
          resource_name: string | null;
          resource_type: string;
          session_id: string | null;
          severity: string | null;
          user_agent: string | null;
          user_email: string | null;
          user_id: string | null;
          user_ip: unknown;
        };
        Insert: {
          action: string;
          category?: string | null;
          changes?: Json | null;
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          metadata?: Json | null;
          new_values?: Json | null;
          old_values?: Json | null;
          resource_id?: string | null;
          resource_name?: string | null;
          resource_type: string;
          session_id?: string | null;
          severity?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_ip?: unknown;
        };
        Update: {
          action?: string;
          category?: string | null;
          changes?: Json | null;
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          ip_address?: unknown;
          metadata?: Json | null;
          new_values?: Json | null;
          old_values?: Json | null;
          resource_id?: string | null;
          resource_name?: string | null;
          resource_type?: string;
          session_id?: string | null;
          severity?: string | null;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_ip?: unknown;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      backup_configurations: {
        Row: {
          auto_backup_enabled: boolean | null;
          backup_frequency: string | null;
          backup_retention_days: number | null;
          backup_time: string | null;
          company_id: string;
          created_at: string | null;
          id: string;
          include_contacts: boolean | null;
          include_conversations: boolean | null;
          include_deals: boolean | null;
          include_files: boolean | null;
          include_settings: boolean | null;
          notification_emails: string[] | null;
          notify_on_failure: boolean | null;
          notify_on_success: boolean | null;
          storage_config: Json | null;
          storage_provider: string | null;
          updated_at: string | null;
        };
        Insert: {
          auto_backup_enabled?: boolean | null;
          backup_frequency?: string | null;
          backup_retention_days?: number | null;
          backup_time?: string | null;
          company_id: string;
          created_at?: string | null;
          id?: string;
          include_contacts?: boolean | null;
          include_conversations?: boolean | null;
          include_deals?: boolean | null;
          include_files?: boolean | null;
          include_settings?: boolean | null;
          notification_emails?: string[] | null;
          notify_on_failure?: boolean | null;
          notify_on_success?: boolean | null;
          storage_config?: Json | null;
          storage_provider?: string | null;
          updated_at?: string | null;
        };
        Update: {
          auto_backup_enabled?: boolean | null;
          backup_frequency?: string | null;
          backup_retention_days?: number | null;
          backup_time?: string | null;
          company_id?: string;
          created_at?: string | null;
          id?: string;
          include_contacts?: boolean | null;
          include_conversations?: boolean | null;
          include_deals?: boolean | null;
          include_files?: boolean | null;
          include_settings?: boolean | null;
          notification_emails?: string[] | null;
          notify_on_failure?: boolean | null;
          notify_on_success?: boolean | null;
          storage_config?: Json | null;
          storage_provider?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'backup_configurations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      backup_history: {
        Row: {
          backup_config_id: string | null;
          backup_name: string;
          backup_type: string | null;
          checksum: string | null;
          company_id: string;
          completed_at: string | null;
          created_at: string | null;
          duration_seconds: number | null;
          error_message: string | null;
          expires_at: string | null;
          id: string;
          included_tables: string[] | null;
          is_verified: boolean | null;
          progress: number | null;
          started_at: string | null;
          status: string | null;
          storage_path: string | null;
          storage_url: string | null;
          total_records: number | null;
          total_size_bytes: number | null;
          verified_at: string | null;
        };
        Insert: {
          backup_config_id?: string | null;
          backup_name: string;
          backup_type?: string | null;
          checksum?: string | null;
          company_id: string;
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          error_message?: string | null;
          expires_at?: string | null;
          id?: string;
          included_tables?: string[] | null;
          is_verified?: boolean | null;
          progress?: number | null;
          started_at?: string | null;
          status?: string | null;
          storage_path?: string | null;
          storage_url?: string | null;
          total_records?: number | null;
          total_size_bytes?: number | null;
          verified_at?: string | null;
        };
        Update: {
          backup_config_id?: string | null;
          backup_name?: string;
          backup_type?: string | null;
          checksum?: string | null;
          company_id?: string;
          completed_at?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          error_message?: string | null;
          expires_at?: string | null;
          id?: string;
          included_tables?: string[] | null;
          is_verified?: boolean | null;
          progress?: number | null;
          started_at?: string | null;
          status?: string | null;
          storage_path?: string | null;
          storage_url?: string | null;
          total_records?: number | null;
          total_size_bytes?: number | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'backup_history_backup_config_id_fkey';
            columns: ['backup_config_id'];
            isOneToOne: false;
            referencedRelation: 'backup_configurations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'backup_history_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      blocked_contacts: {
        Row: {
          blocked_at: string;
          blocked_number: string;
          company_id: string;
          id: string;
          reason: string | null;
          user_id: string;
        };
        Insert: {
          blocked_at?: string;
          blocked_number: string;
          company_id: string;
          id?: string;
          reason?: string | null;
          user_id: string;
        };
        Update: {
          blocked_at?: string;
          blocked_number?: string;
          company_id?: string;
          id?: string;
          reason?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blocked_contacts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'blocked_contacts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      cadence_enrollments: {
        Row: {
          cadence_id: string | null;
          completed_at: string | null;
          contact_id: string | null;
          converted_at: string | null;
          created_at: string | null;
          current_step: number | null;
          deal_id: string | null;
          enrolled_by: string | null;
          exit_reason: string | null;
          id: string;
          next_step_at: string | null;
          replied_at: string | null;
          status: string | null;
          step_history: Json | null;
          updated_at: string | null;
        };
        Insert: {
          cadence_id?: string | null;
          completed_at?: string | null;
          contact_id?: string | null;
          converted_at?: string | null;
          created_at?: string | null;
          current_step?: number | null;
          deal_id?: string | null;
          enrolled_by?: string | null;
          exit_reason?: string | null;
          id?: string;
          next_step_at?: string | null;
          replied_at?: string | null;
          status?: string | null;
          step_history?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          cadence_id?: string | null;
          completed_at?: string | null;
          contact_id?: string | null;
          converted_at?: string | null;
          created_at?: string | null;
          current_step?: number | null;
          deal_id?: string | null;
          enrolled_by?: string | null;
          exit_reason?: string | null;
          id?: string;
          next_step_at?: string | null;
          replied_at?: string | null;
          status?: string | null;
          step_history?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cadence_enrollments_cadence_id_fkey';
            columns: ['cadence_id'];
            isOneToOne: false;
            referencedRelation: 'cadences';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cadence_enrollments_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cadence_enrollments_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cadence_enrollments_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals_with_activity_count';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cadence_enrollments_enrolled_by_fkey';
            columns: ['enrolled_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      cadences: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          settings: Json | null;
          status: string | null;
          steps: Json;
          total_completed: number | null;
          total_converted: number | null;
          total_enrolled: number | null;
          total_replied: number | null;
          updated_at: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          settings?: Json | null;
          status?: string | null;
          steps?: Json;
          total_completed?: number | null;
          total_converted?: number | null;
          total_enrolled?: number | null;
          total_replied?: number | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          settings?: Json | null;
          status?: string | null;
          steps?: Json;
          total_completed?: number | null;
          total_converted?: number | null;
          total_enrolled?: number | null;
          total_replied?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'cadences_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cadences_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      calendar_sync: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          google_event_id: string;
          id: string;
          last_synced_at: string | null;
          sync_direction: string | null;
          task_id: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          google_event_id: string;
          id?: string;
          last_synced_at?: string | null;
          sync_direction?: string | null;
          task_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          google_event_id?: string;
          id?: string;
          last_synced_at?: string | null;
          sync_direction?: string | null;
          task_id?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'calendar_sync_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calendar_sync_task_id_fkey';
            columns: ['task_id'];
            isOneToOne: true;
            referencedRelation: 'tasks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'calendar_sync_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      campaign_contacts: {
        Row: {
          campaign_id: string;
          contact_id: string;
          delivered_at: string | null;
          error_message: string | null;
          id: string;
          read_at: string | null;
          replied_at: string | null;
          reply_message: string | null;
          sent_at: string | null;
          status: string | null;
          variant_id: string | null;
        };
        Insert: {
          campaign_id: string;
          contact_id: string;
          delivered_at?: string | null;
          error_message?: string | null;
          id?: string;
          read_at?: string | null;
          replied_at?: string | null;
          reply_message?: string | null;
          sent_at?: string | null;
          status?: string | null;
          variant_id?: string | null;
        };
        Update: {
          campaign_id?: string;
          contact_id?: string;
          delivered_at?: string | null;
          error_message?: string | null;
          id?: string;
          read_at?: string | null;
          replied_at?: string | null;
          reply_message?: string | null;
          sent_at?: string | null;
          status?: string | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'campaign_contacts_campaign_id_fkey';
            columns: ['campaign_id'];
            isOneToOne: false;
            referencedRelation: 'campaigns';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campaign_contacts_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };
      campaigns: {
        Row: {
          ab_test_enabled: boolean | null;
          business_hours_end: string | null;
          business_hours_only: boolean | null;
          business_hours_start: string | null;
          company_id: string;
          completed_at: string | null;
          contact_filter: Json | null;
          created_at: string | null;
          created_by: string | null;
          delivered_count: number | null;
          description: string | null;
          failed_count: number | null;
          id: string;
          instance_id: string | null;
          message_content: string;
          message_media_url: string | null;
          message_type: string | null;
          name: string;
          read_count: number | null;
          reply_count: number | null;
          schedule_at: string | null;
          segment_id: string | null;
          sending_rate: number | null;
          sent_count: number | null;
          started_at: string | null;
          status: string | null;
          total_contacts: number | null;
          variants: Json | null;
        };
        Insert: {
          ab_test_enabled?: boolean | null;
          business_hours_end?: string | null;
          business_hours_only?: boolean | null;
          business_hours_start?: string | null;
          company_id: string;
          completed_at?: string | null;
          contact_filter?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          delivered_count?: number | null;
          description?: string | null;
          failed_count?: number | null;
          id?: string;
          instance_id?: string | null;
          message_content: string;
          message_media_url?: string | null;
          message_type?: string | null;
          name: string;
          read_count?: number | null;
          reply_count?: number | null;
          schedule_at?: string | null;
          segment_id?: string | null;
          sending_rate?: number | null;
          sent_count?: number | null;
          started_at?: string | null;
          status?: string | null;
          total_contacts?: number | null;
          variants?: Json | null;
        };
        Update: {
          ab_test_enabled?: boolean | null;
          business_hours_end?: string | null;
          business_hours_only?: boolean | null;
          business_hours_start?: string | null;
          company_id?: string;
          completed_at?: string | null;
          contact_filter?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          delivered_count?: number | null;
          description?: string | null;
          failed_count?: number | null;
          id?: string;
          instance_id?: string | null;
          message_content?: string;
          message_media_url?: string | null;
          message_type?: string | null;
          name?: string;
          read_count?: number | null;
          reply_count?: number | null;
          schedule_at?: string | null;
          segment_id?: string | null;
          sending_rate?: number | null;
          sent_count?: number | null;
          started_at?: string | null;
          status?: string | null;
          total_contacts?: number | null;
          variants?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'campaigns_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campaigns_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campaigns_instance_id_fkey';
            columns: ['instance_id'];
            isOneToOne: false;
            referencedRelation: 'evolution_settings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campaigns_segment_id_fkey';
            columns: ['segment_id'];
            isOneToOne: false;
            referencedRelation: 'segments';
            referencedColumns: ['id'];
          },
        ];
      };
      channel_health_logs: {
        Row: {
          channel_id: string;
          check_type: string | null;
          created_at: string | null;
          details: Json | null;
          error_message: string | null;
          id: string;
          response_time_ms: number | null;
          status: string;
        };
        Insert: {
          channel_id: string;
          check_type?: string | null;
          created_at?: string | null;
          details?: Json | null;
          error_message?: string | null;
          id?: string;
          response_time_ms?: number | null;
          status: string;
        };
        Update: {
          channel_id?: string;
          check_type?: string | null;
          created_at?: string | null;
          details?: Json | null;
          error_message?: string | null;
          id?: string;
          response_time_ms?: number | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'channel_health_logs_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'channels';
            referencedColumns: ['id'];
          },
        ];
      };
      channels: {
        Row: {
          company_id: string;
          created_at: string | null;
          created_by: string | null;
          credentials: Json | null;
          id: string;
          is_active: boolean | null;
          last_activity_at: string | null;
          meta_app_id: string | null;
          meta_app_secret: string | null;
          name: string;
          settings: Json | null;
          status: string | null;
          total_conversations: number | null;
          total_messages_in: number | null;
          total_messages_out: number | null;
          type: string;
          updated_at: string | null;
          webhook_secret: string | null;
          webhook_url: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          created_by?: string | null;
          credentials?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_activity_at?: string | null;
          meta_app_id?: string | null;
          meta_app_secret?: string | null;
          name: string;
          settings?: Json | null;
          status?: string | null;
          total_conversations?: number | null;
          total_messages_in?: number | null;
          total_messages_out?: number | null;
          type: string;
          updated_at?: string | null;
          webhook_secret?: string | null;
          webhook_url?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          credentials?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_activity_at?: string | null;
          meta_app_id?: string | null;
          meta_app_secret?: string | null;
          name?: string;
          settings?: Json | null;
          status?: string | null;
          total_conversations?: number | null;
          total_messages_in?: number | null;
          total_messages_out?: number | null;
          type?: string;
          updated_at?: string | null;
          webhook_secret?: string | null;
          webhook_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'channels_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'channels_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      chatbot_executions: {
        Row: {
          channel_type: string | null;
          chatbot_id: string;
          chatbot_version: number;
          completed_at: string | null;
          contact_id: string | null;
          conversation_id: string | null;
          current_node_id: string | null;
          execution_log: Json | null;
          handoff_at: string | null;
          handoff_reason: string | null;
          id: string;
          last_interaction_at: string | null;
          messages_received: number | null;
          messages_sent: number | null;
          retry_count: number | null;
          session_variables: Json | null;
          started_at: string | null;
          status: string | null;
          trigger_type: string | null;
          trigger_value: string | null;
        };
        Insert: {
          channel_type?: string | null;
          chatbot_id: string;
          chatbot_version: number;
          completed_at?: string | null;
          contact_id?: string | null;
          conversation_id?: string | null;
          current_node_id?: string | null;
          execution_log?: Json | null;
          handoff_at?: string | null;
          handoff_reason?: string | null;
          id?: string;
          last_interaction_at?: string | null;
          messages_received?: number | null;
          messages_sent?: number | null;
          retry_count?: number | null;
          session_variables?: Json | null;
          started_at?: string | null;
          status?: string | null;
          trigger_type?: string | null;
          trigger_value?: string | null;
        };
        Update: {
          channel_type?: string | null;
          chatbot_id?: string;
          chatbot_version?: number;
          completed_at?: string | null;
          contact_id?: string | null;
          conversation_id?: string | null;
          current_node_id?: string | null;
          execution_log?: Json | null;
          handoff_at?: string | null;
          handoff_reason?: string | null;
          id?: string;
          last_interaction_at?: string | null;
          messages_received?: number | null;
          messages_sent?: number | null;
          retry_count?: number | null;
          session_variables?: Json | null;
          started_at?: string | null;
          status?: string | null;
          trigger_type?: string | null;
          trigger_value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chatbot_executions_chatbot_id_fkey';
            columns: ['chatbot_id'];
            isOneToOne: false;
            referencedRelation: 'chatbots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chatbot_executions_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chatbot_executions_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      chatbot_templates: {
        Row: {
          category: string | null;
          company_id: string | null;
          created_at: string | null;
          description: string | null;
          edges: Json;
          id: string;
          is_system: boolean | null;
          name: string;
          nodes: Json;
          preview_image_url: string | null;
          usage_count: number | null;
          variables: Json | null;
        };
        Insert: {
          category?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          edges?: Json;
          id?: string;
          is_system?: boolean | null;
          name: string;
          nodes?: Json;
          preview_image_url?: string | null;
          usage_count?: number | null;
          variables?: Json | null;
        };
        Update: {
          category?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          edges?: Json;
          id?: string;
          is_system?: boolean | null;
          name?: string;
          nodes?: Json;
          preview_image_url?: string | null;
          usage_count?: number | null;
          variables?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chatbot_templates_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      chatbot_versions: {
        Row: {
          chatbot_id: string;
          edges: Json;
          id: string;
          nodes: Json;
          published_at: string | null;
          published_by: string | null;
          release_notes: string | null;
          settings: Json | null;
          triggers: Json | null;
          variables: Json | null;
          version: number;
        };
        Insert: {
          chatbot_id: string;
          edges: Json;
          id?: string;
          nodes: Json;
          published_at?: string | null;
          published_by?: string | null;
          release_notes?: string | null;
          settings?: Json | null;
          triggers?: Json | null;
          variables?: Json | null;
          version: number;
        };
        Update: {
          chatbot_id?: string;
          edges?: Json;
          id?: string;
          nodes?: Json;
          published_at?: string | null;
          published_by?: string | null;
          release_notes?: string | null;
          settings?: Json | null;
          triggers?: Json | null;
          variables?: Json | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'chatbot_versions_chatbot_id_fkey';
            columns: ['chatbot_id'];
            isOneToOne: false;
            referencedRelation: 'chatbots';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chatbot_versions_published_by_fkey';
            columns: ['published_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      chatbots: {
        Row: {
          active_channels: string[] | null;
          avg_session_duration_seconds: number | null;
          company_id: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          edges: Json;
          handoffs_count: number | null;
          id: string;
          name: string;
          nodes: Json;
          published_at: string | null;
          published_by: string | null;
          settings: Json | null;
          status: string | null;
          successful_completions: number | null;
          total_executions: number | null;
          triggers: Json | null;
          updated_at: string | null;
          variables: Json | null;
          version: number | null;
        };
        Insert: {
          active_channels?: string[] | null;
          avg_session_duration_seconds?: number | null;
          company_id: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          edges?: Json;
          handoffs_count?: number | null;
          id?: string;
          name: string;
          nodes?: Json;
          published_at?: string | null;
          published_by?: string | null;
          settings?: Json | null;
          status?: string | null;
          successful_completions?: number | null;
          total_executions?: number | null;
          triggers?: Json | null;
          updated_at?: string | null;
          variables?: Json | null;
          version?: number | null;
        };
        Update: {
          active_channels?: string[] | null;
          avg_session_duration_seconds?: number | null;
          company_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          edges?: Json;
          handoffs_count?: number | null;
          id?: string;
          name?: string;
          nodes?: Json;
          published_at?: string | null;
          published_by?: string | null;
          settings?: Json | null;
          status?: string | null;
          successful_completions?: number | null;
          total_executions?: number | null;
          triggers?: Json | null;
          updated_at?: string | null;
          variables?: Json | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'chatbots_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chatbots_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chatbots_published_by_fkey';
            columns: ['published_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      companies: {
        Row: {
          address: string | null;
          business_hours: Json | null;
          business_status: string | null;
          city: string | null;
          cnpj: string | null;
          complement: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          email: string | null;
          evolution_api_key: string | null;
          evolution_api_url: string | null;
          evolution_connected: boolean | null;
          evolution_instance_name: string | null;
          evolution_last_sync: string | null;
          evolution_qr_code: string | null;
          id: string;
          is_active: boolean | null;
          is_primary_company: boolean | null;
          legal_name: string | null;
          logo_url: string | null;
          name: string;
          neighborhood: string | null;
          number: string | null;
          parent_company_id: string | null;
          phone: string | null;
          plan_id: string | null;
          postal_code: string | null;
          responsible_name: string | null;
          responsible_phone: string | null;
          state: string | null;
          status: string | null;
          street: string | null;
          subscription_id: string | null;
          subscription_started_at: string | null;
          subscription_status: string | null;
          trial_ends_at: string | null;
          trial_started_at: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          business_hours?: Json | null;
          business_status?: string | null;
          city?: string | null;
          cnpj?: string | null;
          complement?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          evolution_api_key?: string | null;
          evolution_api_url?: string | null;
          evolution_connected?: boolean | null;
          evolution_instance_name?: string | null;
          evolution_last_sync?: string | null;
          evolution_qr_code?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_primary_company?: boolean | null;
          legal_name?: string | null;
          logo_url?: string | null;
          name: string;
          neighborhood?: string | null;
          number?: string | null;
          parent_company_id?: string | null;
          phone?: string | null;
          plan_id?: string | null;
          postal_code?: string | null;
          responsible_name?: string | null;
          responsible_phone?: string | null;
          state?: string | null;
          status?: string | null;
          street?: string | null;
          subscription_id?: string | null;
          subscription_started_at?: string | null;
          subscription_status?: string | null;
          trial_ends_at?: string | null;
          trial_started_at?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          business_hours?: Json | null;
          business_status?: string | null;
          city?: string | null;
          cnpj?: string | null;
          complement?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          email?: string | null;
          evolution_api_key?: string | null;
          evolution_api_url?: string | null;
          evolution_connected?: boolean | null;
          evolution_instance_name?: string | null;
          evolution_last_sync?: string | null;
          evolution_qr_code?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_primary_company?: boolean | null;
          legal_name?: string | null;
          logo_url?: string | null;
          name?: string;
          neighborhood?: string | null;
          number?: string | null;
          parent_company_id?: string | null;
          phone?: string | null;
          plan_id?: string | null;
          postal_code?: string | null;
          responsible_name?: string | null;
          responsible_phone?: string | null;
          state?: string | null;
          status?: string | null;
          street?: string | null;
          subscription_id?: string | null;
          subscription_started_at?: string | null;
          subscription_status?: string | null;
          trial_ends_at?: string | null;
          trial_started_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'companies_parent_company_id_fkey';
            columns: ['parent_company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'companies_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_plans';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'companies_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'user_subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };
      company_documents: {
        Row: {
          category_id: string | null;
          company_id: string;
          created_at: string;
          description: string | null;
          file_size: string | null;
          file_type: string;
          file_url: string;
          id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          category_id?: string | null;
          company_id: string;
          created_at?: string;
          description?: string | null;
          file_size?: string | null;
          file_type: string;
          file_url: string;
          id?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          company_id?: string;
          created_at?: string;
          description?: string | null;
          file_size?: string | null;
          file_type?: string;
          file_url?: string;
          id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'company_documents_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'document_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_documents_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      company_faqs: {
        Row: {
          answer: string;
          category_id: string | null;
          company_id: string;
          created_at: string;
          id: string;
          question: string;
          updated_at: string;
        };
        Insert: {
          answer: string;
          category_id?: string | null;
          company_id: string;
          created_at?: string;
          id?: string;
          question: string;
          updated_at?: string;
        };
        Update: {
          answer?: string;
          category_id?: string | null;
          company_id?: string;
          created_at?: string;
          id?: string;
          question?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'company_faqs_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'faq_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_faqs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      company_invites: {
        Row: {
          company_id: string;
          created_at: string | null;
          email: string;
          expires_at: string | null;
          id: string;
          invited_by: string | null;
          role: Database['public']['Enums']['user_role'];
          status: string | null;
          team_id: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          email: string;
          expires_at?: string | null;
          id?: string;
          invited_by?: string | null;
          role?: Database['public']['Enums']['user_role'];
          status?: string | null;
          team_id?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          email?: string;
          expires_at?: string | null;
          id?: string;
          invited_by?: string | null;
          role?: Database['public']['Enums']['user_role'];
          status?: string | null;
          team_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'company_invites_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_invites_invited_by_fkey';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_invites_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
      company_members: {
        Row: {
          avatar_url: string | null;
          can_receive_chats: boolean | null;
          company_id: string;
          created_at: string | null;
          current_status: string | null;
          display_name: string | null;
          email: string | null;
          id: string;
          is_active: boolean | null;
          is_online: boolean | null;
          last_seen_at: string | null;
          max_concurrent_chats: number | null;
          phone: string | null;
          reports_to: string | null;
          role: Database['public']['Enums']['user_role'];
          team_id: string | null;
          updated_at: string | null;
          user_id: string;
          working_hours: Json | null;
        };
        Insert: {
          avatar_url?: string | null;
          can_receive_chats?: boolean | null;
          company_id: string;
          created_at?: string | null;
          current_status?: string | null;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_online?: boolean | null;
          last_seen_at?: string | null;
          max_concurrent_chats?: number | null;
          phone?: string | null;
          reports_to?: string | null;
          role?: Database['public']['Enums']['user_role'];
          team_id?: string | null;
          updated_at?: string | null;
          user_id: string;
          working_hours?: Json | null;
        };
        Update: {
          avatar_url?: string | null;
          can_receive_chats?: boolean | null;
          company_id?: string;
          created_at?: string | null;
          current_status?: string | null;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_online?: boolean | null;
          last_seen_at?: string | null;
          max_concurrent_chats?: number | null;
          phone?: string | null;
          reports_to?: string | null;
          role?: Database['public']['Enums']['user_role'];
          team_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
          working_hours?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'company_members_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_members_reports_to_fkey';
            columns: ['reports_to'];
            isOneToOne: false;
            referencedRelation: 'company_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_members_team_id_fkey';
            columns: ['team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      company_users: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          is_default: boolean | null;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          is_default?: boolean | null;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          is_default?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'company_users_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'company_users_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      contact_categories: {
        Row: {
          color: string | null;
          company_id: string | null;
          created_at: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_categories_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      contact_cohorts: {
        Row: {
          calculated_at: string | null;
          cohort_date: string;
          cohort_type: string | null;
          company_id: string;
          id: string;
          initial_count: number | null;
          retention_data: Json | null;
          segment: string | null;
        };
        Insert: {
          calculated_at?: string | null;
          cohort_date: string;
          cohort_type?: string | null;
          company_id: string;
          id?: string;
          initial_count?: number | null;
          retention_data?: Json | null;
          segment?: string | null;
        };
        Update: {
          calculated_at?: string | null;
          cohort_date?: string;
          cohort_type?: string | null;
          company_id?: string;
          id?: string;
          initial_count?: number | null;
          retention_data?: Json | null;
          segment?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_cohorts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      contact_duplicates: {
        Row: {
          company_id: string;
          contact_id_1: string;
          contact_id_2: string;
          created_at: string;
          id: string;
          match_reason: string;
          merged_at: string | null;
          merged_by: string | null;
          merged_into: string | null;
          similarity_score: number;
          status: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          contact_id_1: string;
          contact_id_2: string;
          created_at?: string;
          id?: string;
          match_reason: string;
          merged_at?: string | null;
          merged_by?: string | null;
          merged_into?: string | null;
          similarity_score?: number;
          status?: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          contact_id_1?: string;
          contact_id_2?: string;
          created_at?: string;
          id?: string;
          match_reason?: string;
          merged_at?: string | null;
          merged_by?: string | null;
          merged_into?: string | null;
          similarity_score?: number;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_duplicates_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contact_duplicates_contact_id_1_fkey';
            columns: ['contact_id_1'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contact_duplicates_contact_id_2_fkey';
            columns: ['contact_id_2'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contact_duplicates_merged_by_fkey';
            columns: ['merged_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contact_duplicates_merged_into_fkey';
            columns: ['merged_into'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };
      contact_notes: {
        Row: {
          company_id: string;
          contact_id: string;
          created_at: string | null;
          id: string;
          is_pinned: boolean | null;
          note: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          company_id: string;
          contact_id: string;
          created_at?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          note: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          company_id?: string;
          contact_id?: string;
          created_at?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          note?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_notes_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contact_notes_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contact_notes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      contact_settings: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          entity_icon: string | null;
          entity_name: string | null;
          entity_name_plural: string | null;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          entity_icon?: string | null;
          entity_name?: string | null;
          entity_name_plural?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          entity_icon?: string | null;
          entity_name?: string | null;
          entity_name_plural?: string | null;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contact_settings_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      contacts: {
        Row: {
          about_status: string | null;
          ai_last_analyzed_at: string | null;
          ai_next_best_action: string | null;
          ai_qualification_level: string | null;
          ai_summary: string | null;
          ai_tags: string[] | null;
          attribution_data: Json | null;
          attribution_source_id: string | null;
          birthday: string | null;
          category_id: string | null;
          channel_type: string | null;
          company_cnpj: string | null;
          company_data: Json | null;
          company_id: string;
          created_at: string;
          deleted_at: string | null;
          enriched_at: string | null;
          enrichment_data: Json | null;
          enrichment_status: string | null;
          external_id: string | null;
          id: string;
          is_business: boolean | null;
          lead_score: number | null;
          linkedin_url: string | null;
          merged_into: string | null;
          name: string | null;
          phone_number: string;
          profile_pic_cached_path: string | null;
          profile_pic_updated_at: string | null;
          profile_pic_url: string | null;
          profile_picture_url: string | null;
          push_name: string | null;
          renewal_date: string | null;
          score_breakdown: Json | null;
          score_updated_at: string | null;
          updated_at: string;
          verified_name: string | null;
        };
        Insert: {
          about_status?: string | null;
          ai_last_analyzed_at?: string | null;
          ai_next_best_action?: string | null;
          ai_qualification_level?: string | null;
          ai_summary?: string | null;
          ai_tags?: string[] | null;
          attribution_data?: Json | null;
          attribution_source_id?: string | null;
          birthday?: string | null;
          category_id?: string | null;
          channel_type?: string | null;
          company_cnpj?: string | null;
          company_data?: Json | null;
          company_id: string;
          created_at?: string;
          deleted_at?: string | null;
          enriched_at?: string | null;
          enrichment_data?: Json | null;
          enrichment_status?: string | null;
          external_id?: string | null;
          id?: string;
          is_business?: boolean | null;
          lead_score?: number | null;
          linkedin_url?: string | null;
          merged_into?: string | null;
          name?: string | null;
          phone_number: string;
          profile_pic_cached_path?: string | null;
          profile_pic_updated_at?: string | null;
          profile_pic_url?: string | null;
          profile_picture_url?: string | null;
          push_name?: string | null;
          renewal_date?: string | null;
          score_breakdown?: Json | null;
          score_updated_at?: string | null;
          updated_at?: string;
          verified_name?: string | null;
        };
        Update: {
          about_status?: string | null;
          ai_last_analyzed_at?: string | null;
          ai_next_best_action?: string | null;
          ai_qualification_level?: string | null;
          ai_summary?: string | null;
          ai_tags?: string[] | null;
          attribution_data?: Json | null;
          attribution_source_id?: string | null;
          birthday?: string | null;
          category_id?: string | null;
          channel_type?: string | null;
          company_cnpj?: string | null;
          company_data?: Json | null;
          company_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          enriched_at?: string | null;
          enrichment_data?: Json | null;
          enrichment_status?: string | null;
          external_id?: string | null;
          id?: string;
          is_business?: boolean | null;
          lead_score?: number | null;
          linkedin_url?: string | null;
          merged_into?: string | null;
          name?: string | null;
          phone_number?: string;
          profile_pic_cached_path?: string | null;
          profile_pic_updated_at?: string | null;
          profile_pic_url?: string | null;
          profile_picture_url?: string | null;
          push_name?: string | null;
          renewal_date?: string | null;
          score_breakdown?: Json | null;
          score_updated_at?: string | null;
          updated_at?: string;
          verified_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'contacts_attribution_source_id_fkey';
            columns: ['attribution_source_id'];
            isOneToOne: false;
            referencedRelation: 'attribution_sources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contacts_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'contact_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contacts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'contacts_merged_into_fkey';
            columns: ['merged_into'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };
      conversation_embeddings: {
        Row: {
          content: string;
          conversation_id: string | null;
          created_at: string | null;
          embedding: string | null;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          content: string;
          conversation_id?: string | null;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          content?: string;
          conversation_id?: string | null;
          created_at?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_embeddings_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      conversation_labels: {
        Row: {
          conversation_id: string;
          created_at: string | null;
          id: string;
          label_id: string;
        };
        Insert: {
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          label_id: string;
        };
        Update: {
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          label_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_labels_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_labels_label_id_fkey';
            columns: ['label_id'];
            isOneToOne: false;
            referencedRelation: 'labels';
            referencedColumns: ['id'];
          },
        ];
      };
      conversation_notes: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          note_type: string;
          user_id: string | null;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          note_type?: string;
          user_id?: string | null;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          note_type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_notes_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_notes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      conversation_snooze_history: {
        Row: {
          cancelled_at: string | null;
          cancelled_by: string | null;
          company_id: string;
          conversation_id: string;
          created_at: string | null;
          expired_at: string | null;
          id: string;
          reason: string | null;
          snoozed_by: string | null;
          snoozed_until: string;
        };
        Insert: {
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          company_id: string;
          conversation_id: string;
          created_at?: string | null;
          expired_at?: string | null;
          id?: string;
          reason?: string | null;
          snoozed_by?: string | null;
          snoozed_until: string;
        };
        Update: {
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          company_id?: string;
          conversation_id?: string;
          created_at?: string | null;
          expired_at?: string | null;
          id?: string;
          reason?: string | null;
          snoozed_by?: string | null;
          snoozed_until?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_snooze_history_cancelled_by_fkey';
            columns: ['cancelled_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_snooze_history_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_snooze_history_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversation_snooze_history_snoozed_by_fkey';
            columns: ['snoozed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      conversations: {
        Row: {
          ai_enabled: boolean | null;
          ai_handoff_at: string | null;
          ai_handoff_reason: string | null;
          ai_messages_count: number | null;
          ai_mode: string | null;
          ai_next_step_suggestion: string | null;
          ai_paused_at: string | null;
          ai_paused_by: string | null;
          ai_paused_reason: string | null;
          ai_summary: string | null;
          ai_summary_updated_at: string | null;
          assigned_to: string | null;
          channel_id: string | null;
          channel_type: Database['public']['Enums']['channel_type'] | null;
          company_id: string | null;
          contact_id: string | null;
          contact_name: string;
          contact_number: string;
          created_at: string;
          external_conversation_id: string | null;
          first_response_at: string | null;
          id: string;
          is_online: boolean | null;
          is_recording: boolean | null;
          is_typing: boolean | null;
          last_message: string | null;
          last_message_time: string | null;
          last_seen: string | null;
          opted_in: boolean | null;
          priority: string | null;
          profile_pic_url: string | null;
          queue_id: string | null;
          resolved_at: string | null;
          sector_id: string | null;
          sla_first_response_at: string | null;
          sla_first_response_met: boolean | null;
          sla_resolution_at: string | null;
          sla_resolution_met: boolean | null;
          snooze_reason: string | null;
          snoozed_at: string | null;
          snoozed_by: string | null;
          snoozed_until: string | null;
          status: Database['public']['Enums']['conversation_status'] | null;
          tags: string[] | null;
          unread_count: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_enabled?: boolean | null;
          ai_handoff_at?: string | null;
          ai_handoff_reason?: string | null;
          ai_messages_count?: number | null;
          ai_mode?: string | null;
          ai_next_step_suggestion?: string | null;
          ai_paused_at?: string | null;
          ai_paused_by?: string | null;
          ai_paused_reason?: string | null;
          ai_summary?: string | null;
          ai_summary_updated_at?: string | null;
          assigned_to?: string | null;
          channel_id?: string | null;
          channel_type?: Database['public']['Enums']['channel_type'] | null;
          company_id?: string | null;
          contact_id?: string | null;
          contact_name: string;
          contact_number: string;
          created_at?: string;
          external_conversation_id?: string | null;
          first_response_at?: string | null;
          id?: string;
          is_online?: boolean | null;
          is_recording?: boolean | null;
          is_typing?: boolean | null;
          last_message?: string | null;
          last_message_time?: string | null;
          last_seen?: string | null;
          opted_in?: boolean | null;
          priority?: string | null;
          profile_pic_url?: string | null;
          queue_id?: string | null;
          resolved_at?: string | null;
          sector_id?: string | null;
          sla_first_response_at?: string | null;
          sla_first_response_met?: boolean | null;
          sla_resolution_at?: string | null;
          sla_resolution_met?: boolean | null;
          snooze_reason?: string | null;
          snoozed_at?: string | null;
          snoozed_by?: string | null;
          snoozed_until?: string | null;
          status?: Database['public']['Enums']['conversation_status'] | null;
          tags?: string[] | null;
          unread_count?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ai_enabled?: boolean | null;
          ai_handoff_at?: string | null;
          ai_handoff_reason?: string | null;
          ai_messages_count?: number | null;
          ai_mode?: string | null;
          ai_next_step_suggestion?: string | null;
          ai_paused_at?: string | null;
          ai_paused_by?: string | null;
          ai_paused_reason?: string | null;
          ai_summary?: string | null;
          ai_summary_updated_at?: string | null;
          assigned_to?: string | null;
          channel_id?: string | null;
          channel_type?: Database['public']['Enums']['channel_type'] | null;
          company_id?: string | null;
          contact_id?: string | null;
          contact_name?: string;
          contact_number?: string;
          created_at?: string;
          external_conversation_id?: string | null;
          first_response_at?: string | null;
          id?: string;
          is_online?: boolean | null;
          is_recording?: boolean | null;
          is_typing?: boolean | null;
          last_message?: string | null;
          last_message_time?: string | null;
          last_seen?: string | null;
          opted_in?: boolean | null;
          priority?: string | null;
          profile_pic_url?: string | null;
          queue_id?: string | null;
          resolved_at?: string | null;
          sector_id?: string | null;
          sla_first_response_at?: string | null;
          sla_first_response_met?: boolean | null;
          sla_resolution_at?: string | null;
          sla_resolution_met?: boolean | null;
          snooze_reason?: string | null;
          snoozed_at?: string | null;
          snoozed_by?: string | null;
          snoozed_until?: string | null;
          status?: Database['public']['Enums']['conversation_status'] | null;
          tags?: string[] | null;
          unread_count?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_ai_paused_by_fkey';
            columns: ['ai_paused_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_queue_id_fkey';
            columns: ['queue_id'];
            isOneToOne: false;
            referencedRelation: 'queues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_queue_id_fkey';
            columns: ['queue_id'];
            isOneToOne: false;
            referencedRelation: 'sla_metrics_view';
            referencedColumns: ['queue_id'];
          },
          {
            foreignKeyName: 'conversations_sector_id_fkey';
            columns: ['sector_id'];
            isOneToOne: false;
            referencedRelation: 'sectors';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_snoozed_by_fkey';
            columns: ['snoozed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      custom_dashboards: {
        Row: {
          company_id: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_default: boolean | null;
          layout: Json | null;
          name: string;
          updated_at: string | null;
          visibility: string | null;
          widgets: Json;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          layout?: Json | null;
          name: string;
          updated_at?: string | null;
          visibility?: string | null;
          widgets?: Json;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          layout?: Json | null;
          name?: string;
          updated_at?: string | null;
          visibility?: string | null;
          widgets?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'custom_dashboards_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'custom_dashboards_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      custom_domains: {
        Row: {
          auto_renew_ssl: boolean | null;
          company_id: string;
          created_at: string | null;
          domain: string;
          error_message: string | null;
          id: string;
          is_verified: boolean | null;
          last_check_at: string | null;
          required_dns_records: Json | null;
          ssl_certificate: string | null;
          ssl_certificate_expires_at: string | null;
          ssl_enabled: boolean | null;
          status: string | null;
          subdomain: string | null;
          updated_at: string | null;
          verification_method: string | null;
          verification_token: string | null;
          verified_at: string | null;
          white_label_id: string | null;
        };
        Insert: {
          auto_renew_ssl?: boolean | null;
          company_id: string;
          created_at?: string | null;
          domain: string;
          error_message?: string | null;
          id?: string;
          is_verified?: boolean | null;
          last_check_at?: string | null;
          required_dns_records?: Json | null;
          ssl_certificate?: string | null;
          ssl_certificate_expires_at?: string | null;
          ssl_enabled?: boolean | null;
          status?: string | null;
          subdomain?: string | null;
          updated_at?: string | null;
          verification_method?: string | null;
          verification_token?: string | null;
          verified_at?: string | null;
          white_label_id?: string | null;
        };
        Update: {
          auto_renew_ssl?: boolean | null;
          company_id?: string;
          created_at?: string | null;
          domain?: string;
          error_message?: string | null;
          id?: string;
          is_verified?: boolean | null;
          last_check_at?: string | null;
          required_dns_records?: Json | null;
          ssl_certificate?: string | null;
          ssl_certificate_expires_at?: string | null;
          ssl_enabled?: boolean | null;
          status?: string | null;
          subdomain?: string | null;
          updated_at?: string | null;
          verification_method?: string | null;
          verification_token?: string | null;
          verified_at?: string | null;
          white_label_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'custom_domains_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'custom_domains_white_label_id_fkey';
            columns: ['white_label_id'];
            isOneToOne: false;
            referencedRelation: 'white_label_settings';
            referencedColumns: ['id'];
          },
        ];
      };
      custom_field_values: {
        Row: {
          created_at: string | null;
          custom_field_id: string;
          entity_id: string;
          id: string;
          updated_at: string | null;
          value: string | null;
        };
        Insert: {
          created_at?: string | null;
          custom_field_id: string;
          entity_id: string;
          id?: string;
          updated_at?: string | null;
          value?: string | null;
        };
        Update: {
          created_at?: string | null;
          custom_field_id?: string;
          entity_id?: string;
          id?: string;
          updated_at?: string | null;
          value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'custom_field_values_custom_field_id_fkey';
            columns: ['custom_field_id'];
            isOneToOne: false;
            referencedRelation: 'custom_fields';
            referencedColumns: ['id'];
          },
        ];
      };
      custom_fields: {
        Row: {
          company_id: string;
          created_at: string | null;
          default_value: string | null;
          display_order: number | null;
          entity_type: string;
          field_label: string;
          field_name: string;
          field_type: string;
          id: string;
          is_active: boolean | null;
          is_required: boolean | null;
          options: Json | null;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          default_value?: string | null;
          display_order?: number | null;
          entity_type: string;
          field_label: string;
          field_name: string;
          field_type: string;
          id?: string;
          is_active?: boolean | null;
          is_required?: boolean | null;
          options?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          default_value?: string | null;
          display_order?: number | null;
          entity_type?: string;
          field_label?: string;
          field_name?: string;
          field_type?: string;
          id?: string;
          is_active?: boolean | null;
          is_required?: boolean | null;
          options?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'custom_fields_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      custom_roles: {
        Row: {
          color: string | null;
          company_id: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_default: boolean | null;
          is_system: boolean | null;
          name: string;
          parent_role_id: string | null;
          priority: number | null;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          company_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          is_system?: boolean | null;
          name: string;
          parent_role_id?: string | null;
          priority?: number | null;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          company_id?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          is_system?: boolean | null;
          name?: string;
          parent_role_id?: string | null;
          priority?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'custom_roles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'custom_roles_parent_role_id_fkey';
            columns: ['parent_role_id'];
            isOneToOne: false;
            referencedRelation: 'custom_roles';
            referencedColumns: ['id'];
          },
        ];
      };
      dashboard_widget_templates: {
        Row: {
          category: string | null;
          created_at: string | null;
          default_config: Json;
          description: string | null;
          id: string;
          is_system: boolean | null;
          name: string;
          preview_image_url: string | null;
          type: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          default_config: Json;
          description?: string | null;
          id?: string;
          is_system?: boolean | null;
          name: string;
          preview_image_url?: string | null;
          type: string;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          default_config?: Json;
          description?: string | null;
          id?: string;
          is_system?: boolean | null;
          name?: string;
          preview_image_url?: string | null;
          type?: string;
        };
        Relationships: [];
      };
      data_consents: {
        Row: {
          company_id: string;
          consent_source: string | null;
          consent_text: string | null;
          consent_type: string;
          contact_id: string;
          created_at: string | null;
          granted_at: string | null;
          id: string;
          ip_address: unknown;
          is_granted: boolean;
          metadata: Json | null;
          revoked_at: string | null;
          updated_at: string | null;
          user_agent: string | null;
        };
        Insert: {
          company_id: string;
          consent_source?: string | null;
          consent_text?: string | null;
          consent_type: string;
          contact_id: string;
          created_at?: string | null;
          granted_at?: string | null;
          id?: string;
          ip_address?: unknown;
          is_granted: boolean;
          metadata?: Json | null;
          revoked_at?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
        };
        Update: {
          company_id?: string;
          consent_source?: string | null;
          consent_text?: string | null;
          consent_type?: string;
          contact_id?: string;
          created_at?: string | null;
          granted_at?: string | null;
          id?: string;
          ip_address?: unknown;
          is_granted?: boolean;
          metadata?: Json | null;
          revoked_at?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'data_consents_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'data_consents_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };
      data_deletion_logs: {
        Row: {
          action_type: string;
          company_id: string;
          data_hash: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          deletion_reason: string;
          entity_id: string;
          entity_identifier: string | null;
          entity_type: string;
          id: string;
          metadata: Json | null;
          request_id: string | null;
        };
        Insert: {
          action_type: string;
          company_id: string;
          data_hash?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deletion_reason: string;
          entity_id: string;
          entity_identifier?: string | null;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
          request_id?: string | null;
        };
        Update: {
          action_type?: string;
          company_id?: string;
          data_hash?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          deletion_reason?: string;
          entity_id?: string;
          entity_identifier?: string | null;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
          request_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'data_deletion_logs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'data_deletion_logs_deleted_by_fkey';
            columns: ['deleted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'data_deletion_logs_request_id_fkey';
            columns: ['request_id'];
            isOneToOne: false;
            referencedRelation: 'data_subject_requests';
            referencedColumns: ['id'];
          },
        ];
      };
      data_retention_policies: {
        Row: {
          action_after_retention: string | null;
          company_id: string;
          conditions: Json | null;
          created_at: string | null;
          data_type: string;
          id: string;
          is_active: boolean | null;
          last_run_at: string | null;
          next_run_at: string | null;
          retention_days: number;
          updated_at: string | null;
        };
        Insert: {
          action_after_retention?: string | null;
          company_id: string;
          conditions?: Json | null;
          created_at?: string | null;
          data_type: string;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          next_run_at?: string | null;
          retention_days: number;
          updated_at?: string | null;
        };
        Update: {
          action_after_retention?: string | null;
          company_id?: string;
          conditions?: Json | null;
          created_at?: string | null;
          data_type?: string;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          next_run_at?: string | null;
          retention_days?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'data_retention_policies_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      data_subject_requests: {
        Row: {
          assigned_to: string | null;
          company_id: string;
          completed_at: string | null;
          contact_id: string | null;
          created_at: string | null;
          description: string | null;
          due_date: string | null;
          export_expires_at: string | null;
          export_file_url: string | null;
          id: string;
          identity_verification_method: string | null;
          identity_verified: boolean | null;
          notes: string | null;
          request_type: string;
          requested_data: string[] | null;
          requester_email: string;
          requester_name: string;
          requester_phone: string | null;
          response_sent_at: string | null;
          response_text: string | null;
          status: string | null;
          updated_at: string | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          company_id: string;
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          export_expires_at?: string | null;
          export_file_url?: string | null;
          id?: string;
          identity_verification_method?: string | null;
          identity_verified?: boolean | null;
          notes?: string | null;
          request_type: string;
          requested_data?: string[] | null;
          requester_email: string;
          requester_name: string;
          requester_phone?: string | null;
          response_sent_at?: string | null;
          response_text?: string | null;
          status?: string | null;
          updated_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          company_id?: string;
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          due_date?: string | null;
          export_expires_at?: string | null;
          export_file_url?: string | null;
          id?: string;
          identity_verification_method?: string | null;
          identity_verified?: boolean | null;
          notes?: string | null;
          request_type?: string;
          requested_data?: string[] | null;
          requester_email?: string;
          requester_name?: string;
          requester_phone?: string | null;
          response_sent_at?: string | null;
          response_text?: string | null;
          status?: string | null;
          updated_at?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'data_subject_requests_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'data_subject_requests_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'data_subject_requests_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'data_subject_requests_verified_by_fkey';
            columns: ['verified_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      deal_activities: {
        Row: {
          activity_type: string;
          created_at: string | null;
          deal_id: string;
          description: string | null;
          id: string;
          metadata: Json | null;
          user_id: string | null;
        };
        Insert: {
          activity_type: string;
          created_at?: string | null;
          deal_id: string;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Update: {
          activity_type?: string;
          created_at?: string | null;
          deal_id?: string;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'deal_activities_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_activities_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals_with_activity_count';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      deal_files: {
        Row: {
          company_id: string;
          created_at: string | null;
          deal_id: string;
          description: string | null;
          file_name: string;
          file_size: number | null;
          file_type: string | null;
          file_url: string;
          id: string;
          is_public: boolean | null;
          mime_type: string | null;
          storage_path: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          deal_id: string;
          description?: string | null;
          file_name: string;
          file_size?: number | null;
          file_type?: string | null;
          file_url: string;
          id?: string;
          is_public?: boolean | null;
          mime_type?: string | null;
          storage_path?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          deal_id?: string;
          description?: string | null;
          file_name?: string;
          file_size?: number | null;
          file_type?: string | null;
          file_url?: string;
          id?: string;
          is_public?: boolean | null;
          mime_type?: string | null;
          storage_path?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'deal_files_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_files_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_files_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals_with_activity_count';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_files_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      deal_notes: {
        Row: {
          company_id: string;
          created_at: string | null;
          deal_id: string;
          id: string;
          is_pinned: boolean | null;
          note: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          deal_id: string;
          id?: string;
          is_pinned?: boolean | null;
          note: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          deal_id?: string;
          id?: string;
          is_pinned?: boolean | null;
          note?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'deal_notes_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_notes_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_notes_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals_with_activity_count';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_notes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      deal_tasks: {
        Row: {
          assigned_to: string | null;
          company_id: string;
          completed_at: string | null;
          completed_by: string | null;
          created_at: string | null;
          created_by: string | null;
          deal_id: string;
          description: string | null;
          due_date: string | null;
          id: string;
          priority: string | null;
          reminder_at: string | null;
          reminder_sent: boolean | null;
          status: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          company_id: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deal_id: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: string | null;
          reminder_at?: string | null;
          reminder_sent?: boolean | null;
          status?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          company_id?: string;
          completed_at?: string | null;
          completed_by?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deal_id?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          priority?: string | null;
          reminder_at?: string | null;
          reminder_sent?: boolean | null;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'deal_tasks_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_tasks_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_tasks_completed_by_fkey';
            columns: ['completed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_tasks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_tasks_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deal_tasks_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals_with_activity_count';
            referencedColumns: ['id'];
          },
        ];
      };
      deals: {
        Row: {
          assigned_to: string | null;
          attribution_source_id: string | null;
          budget_confirmed: boolean | null;
          churn_risk_score: number | null;
          company_id: string;
          competitor: string | null;
          competitor_strengths: string | null;
          contact_id: string;
          created_at: string | null;
          custom_fields: Json | null;
          decision_maker: string | null;
          expected_close_date: string | null;
          id: string;
          last_activity: string | null;
          loss_reason: string | null;
          loss_reason_detail: string | null;
          lost_at: string | null;
          lost_reason: string | null;
          need_identified: string | null;
          next_step: string | null;
          next_step_date: string | null;
          our_differentials: string | null;
          pipeline_id: string;
          priority: string | null;
          probability: number | null;
          products: Json | null;
          source: string | null;
          stage_id: string;
          status: string | null;
          tags: string[] | null;
          temperature: string | null;
          temperature_score: number | null;
          timeline_confirmed: boolean | null;
          title: string;
          updated_at: string | null;
          value: number | null;
          win_reason: string | null;
          won_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          attribution_source_id?: string | null;
          budget_confirmed?: boolean | null;
          churn_risk_score?: number | null;
          company_id: string;
          competitor?: string | null;
          competitor_strengths?: string | null;
          contact_id: string;
          created_at?: string | null;
          custom_fields?: Json | null;
          decision_maker?: string | null;
          expected_close_date?: string | null;
          id?: string;
          last_activity?: string | null;
          loss_reason?: string | null;
          loss_reason_detail?: string | null;
          lost_at?: string | null;
          lost_reason?: string | null;
          need_identified?: string | null;
          next_step?: string | null;
          next_step_date?: string | null;
          our_differentials?: string | null;
          pipeline_id: string;
          priority?: string | null;
          probability?: number | null;
          products?: Json | null;
          source?: string | null;
          stage_id: string;
          status?: string | null;
          tags?: string[] | null;
          temperature?: string | null;
          temperature_score?: number | null;
          timeline_confirmed?: boolean | null;
          title: string;
          updated_at?: string | null;
          value?: number | null;
          win_reason?: string | null;
          won_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          attribution_source_id?: string | null;
          budget_confirmed?: boolean | null;
          churn_risk_score?: number | null;
          company_id?: string;
          competitor?: string | null;
          competitor_strengths?: string | null;
          contact_id?: string;
          created_at?: string | null;
          custom_fields?: Json | null;
          decision_maker?: string | null;
          expected_close_date?: string | null;
          id?: string;
          last_activity?: string | null;
          loss_reason?: string | null;
          loss_reason_detail?: string | null;
          lost_at?: string | null;
          lost_reason?: string | null;
          need_identified?: string | null;
          next_step?: string | null;
          next_step_date?: string | null;
          our_differentials?: string | null;
          pipeline_id?: string;
          priority?: string | null;
          probability?: number | null;
          products?: Json | null;
          source?: string | null;
          stage_id?: string;
          status?: string | null;
          tags?: string[] | null;
          temperature?: string | null;
          temperature_score?: number | null;
          timeline_confirmed?: boolean | null;
          title?: string;
          updated_at?: string | null;
          value?: number | null;
          win_reason?: string | null;
          won_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'deals_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deals_attribution_source_id_fkey';
            columns: ['attribution_source_id'];
            isOneToOne: false;
            referencedRelation: 'attribution_sources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deals_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deals_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deals_pipeline_id_fkey';
            columns: ['pipeline_id'];
            isOneToOne: false;
            referencedRelation: 'pipelines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deals_stage_id_fkey';
            columns: ['stage_id'];
            isOneToOne: false;
            referencedRelation: 'deal_stats_by_stage';
            referencedColumns: ['stage_id'];
          },
          {
            foreignKeyName: 'deals_stage_id_fkey';
            columns: ['stage_id'];
            isOneToOne: false;
            referencedRelation: 'pipeline_stages';
            referencedColumns: ['id'];
          },
        ];
      };
      document_categories: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'document_categories_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      documents: {
        Row: {
          category: string | null;
          company_id: string;
          created_at: string | null;
          description: string | null;
          file_name: string;
          file_size: number | null;
          file_type: string | null;
          file_url: string;
          id: string;
          is_active: boolean | null;
          name: string;
          tags: string[] | null;
          updated_at: string | null;
          uploaded_by: string | null;
        };
        Insert: {
          category?: string | null;
          company_id: string;
          created_at?: string | null;
          description?: string | null;
          file_name: string;
          file_size?: number | null;
          file_type?: string | null;
          file_url: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          tags?: string[] | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          category?: string | null;
          company_id?: string;
          created_at?: string | null;
          description?: string | null;
          file_name?: string;
          file_size?: number | null;
          file_type?: string | null;
          file_url?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          tags?: string[] | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'documents_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'documents_uploaded_by_fkey';
            columns: ['uploaded_by'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      email_logs: {
        Row: {
          body: string;
          clicked_at: string | null;
          company_id: string;
          contact_id: string | null;
          deal_id: string | null;
          error_message: string | null;
          id: string;
          metadata: Json | null;
          opened_at: string | null;
          sent_at: string | null;
          status: string | null;
          subject: string;
          template_id: string | null;
          to_email: string;
        };
        Insert: {
          body: string;
          clicked_at?: string | null;
          company_id: string;
          contact_id?: string | null;
          deal_id?: string | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          opened_at?: string | null;
          sent_at?: string | null;
          status?: string | null;
          subject: string;
          template_id?: string | null;
          to_email: string;
        };
        Update: {
          body?: string;
          clicked_at?: string | null;
          company_id?: string;
          contact_id?: string | null;
          deal_id?: string | null;
          error_message?: string | null;
          id?: string;
          metadata?: Json | null;
          opened_at?: string | null;
          sent_at?: string | null;
          status?: string | null;
          subject?: string;
          template_id?: string | null;
          to_email?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'email_logs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_logs_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_logs_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_logs_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals_with_activity_count';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_logs_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'email_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      email_templates: {
        Row: {
          body: string;
          category: string | null;
          company_id: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          name: string;
          subject: string;
          updated_at: string | null;
          variables: string[] | null;
        };
        Insert: {
          body: string;
          category?: string | null;
          company_id: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          name: string;
          subject: string;
          updated_at?: string | null;
          variables?: string[] | null;
        };
        Update: {
          body?: string;
          category?: string | null;
          company_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          name?: string;
          subject?: string;
          updated_at?: string | null;
          variables?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'email_templates_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'email_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      error_fix_log: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          error_name: string;
          error_number: number;
          id: string;
          status: string;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          error_name: string;
          error_number: number;
          id?: string;
          status: string;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          error_name?: string;
          error_number?: number;
          id?: string;
          status?: string;
        };
        Relationships: [];
      };
      evolution_settings: {
        Row: {
          api_key: string | null;
          api_url: string | null;
          auto_created: boolean | null;
          company_id: string | null;
          created_at: string;
          daily_message_limit: number | null;
          delivery_rate: number | null;
          id: string;
          instance_name: string;
          instance_settings: Json | null;
          instance_status: string | null;
          is_connected: boolean | null;
          last_connection_check: string | null;
          last_reset_date: string | null;
          messages_sent_today: number | null;
          qr_code: string | null;
          qr_code_updated_at: string | null;
          response_rate: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          api_key?: string | null;
          api_url?: string | null;
          auto_created?: boolean | null;
          company_id?: string | null;
          created_at?: string;
          daily_message_limit?: number | null;
          delivery_rate?: number | null;
          id?: string;
          instance_name: string;
          instance_settings?: Json | null;
          instance_status?: string | null;
          is_connected?: boolean | null;
          last_connection_check?: string | null;
          last_reset_date?: string | null;
          messages_sent_today?: number | null;
          qr_code?: string | null;
          qr_code_updated_at?: string | null;
          response_rate?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          api_key?: string | null;
          api_url?: string | null;
          auto_created?: boolean | null;
          company_id?: string | null;
          created_at?: string;
          daily_message_limit?: number | null;
          delivery_rate?: number | null;
          id?: string;
          instance_name?: string;
          instance_settings?: Json | null;
          instance_status?: string | null;
          is_connected?: boolean | null;
          last_connection_check?: string | null;
          last_reset_date?: string | null;
          messages_sent_today?: number | null;
          qr_code?: string | null;
          qr_code_updated_at?: string | null;
          response_rate?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'evolution_settings_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      export_jobs: {
        Row: {
          company_id: string;
          completed_at: string | null;
          created_at: string | null;
          error_message: string | null;
          expires_at: string | null;
          export_type: string;
          file_size_bytes: number | null;
          file_url: string | null;
          filters: Json | null;
          format: string | null;
          id: string;
          progress: number | null;
          started_at: string | null;
          status: string | null;
          total_records: number | null;
          user_id: string | null;
        };
        Insert: {
          company_id: string;
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          expires_at?: string | null;
          export_type: string;
          file_size_bytes?: number | null;
          file_url?: string | null;
          filters?: Json | null;
          format?: string | null;
          id?: string;
          progress?: number | null;
          started_at?: string | null;
          status?: string | null;
          total_records?: number | null;
          user_id?: string | null;
        };
        Update: {
          company_id?: string;
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          expires_at?: string | null;
          export_type?: string;
          file_size_bytes?: number | null;
          file_url?: string | null;
          filters?: Json | null;
          format?: string | null;
          id?: string;
          progress?: number | null;
          started_at?: string | null;
          status?: string | null;
          total_records?: number | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'export_jobs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'export_jobs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      faq_categories: {
        Row: {
          company_id: string;
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'faq_categories_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      faq_items: {
        Row: {
          answer: string;
          category_id: string | null;
          company_id: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          keywords: string[] | null;
          question: string;
          sort_order: number | null;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          answer: string;
          category_id?: string | null;
          company_id: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          keywords?: string[] | null;
          question: string;
          sort_order?: number | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          answer?: string;
          category_id?: string | null;
          company_id?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          keywords?: string[] | null;
          question?: string;
          sort_order?: number | null;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'faq_items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'faq_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'faq_items_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      goals: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          current_value: number | null;
          end_date: string;
          goal_type: string;
          id: string;
          period: string;
          start_date: string;
          status: string | null;
          target_value: number;
          user_id: string | null;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          current_value?: number | null;
          end_date: string;
          goal_type: string;
          id?: string;
          period: string;
          start_date: string;
          status?: string | null;
          target_value: number;
          user_id?: string | null;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          current_value?: number | null;
          end_date?: string;
          goal_type?: string;
          id?: string;
          period?: string;
          start_date?: string;
          status?: string | null;
          target_value?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'goals_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'goals_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      group_invites: {
        Row: {
          company_id: string;
          created_at: string;
          created_by: string;
          group_id: string;
          id: string;
          invite_code: string;
          revoked: boolean | null;
          revoked_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          created_by: string;
          group_id: string;
          id?: string;
          invite_code: string;
          revoked?: boolean | null;
          revoked_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          created_by?: string;
          group_id?: string;
          id?: string;
          invite_code?: string;
          revoked?: boolean | null;
          revoked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'group_invites_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_invites_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      group_participants: {
        Row: {
          company_id: string;
          group_id: string;
          id: string;
          is_admin: boolean | null;
          is_super_admin: boolean | null;
          joined_at: string;
          phone_number: string;
        };
        Insert: {
          company_id: string;
          group_id: string;
          id?: string;
          is_admin?: boolean | null;
          is_super_admin?: boolean | null;
          joined_at?: string;
          phone_number: string;
        };
        Update: {
          company_id?: string;
          group_id?: string;
          id?: string;
          is_admin?: boolean | null;
          is_super_admin?: boolean | null;
          joined_at?: string;
          phone_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_participants_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_participants_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          company_id: string;
          created_at: string;
          description: string | null;
          group_id: string;
          id: string;
          is_announce_only: boolean | null;
          name: string;
          owner_number: string;
          profile_pic_url: string | null;
          updated_at: string;
          who_can_edit_info: string | null;
          who_can_send_messages: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          description?: string | null;
          group_id: string;
          id?: string;
          is_announce_only?: boolean | null;
          name: string;
          owner_number: string;
          profile_pic_url?: string | null;
          updated_at?: string;
          who_can_edit_info?: string | null;
          who_can_send_messages?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          description?: string | null;
          group_id?: string;
          id?: string;
          is_announce_only?: boolean | null;
          name?: string;
          owner_number?: string;
          profile_pic_url?: string | null;
          updated_at?: string;
          who_can_edit_info?: string | null;
          who_can_send_messages?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      instagram_messages_metadata: {
        Row: {
          created_at: string | null;
          id: string;
          instagram_message_type: string | null;
          message_id: string | null;
          metadata: Json | null;
          reaction_emoji: string | null;
          reply_to_message_id: string | null;
          story_id: string | null;
          story_url: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          instagram_message_type?: string | null;
          message_id?: string | null;
          metadata?: Json | null;
          reaction_emoji?: string | null;
          reply_to_message_id?: string | null;
          story_id?: string | null;
          story_url?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          instagram_message_type?: string | null;
          message_id?: string | null;
          metadata?: Json | null;
          reaction_emoji?: string | null;
          reply_to_message_id?: string | null;
          story_id?: string | null;
          story_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'instagram_messages_metadata_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
      };
      integration_sync_logs: {
        Row: {
          completed_at: string | null;
          direction: string;
          duration_ms: number | null;
          error_message: string | null;
          event_type: string;
          id: string;
          integration_id: string;
          payload: Json | null;
          response: Json | null;
          started_at: string | null;
          status: string;
        };
        Insert: {
          completed_at?: string | null;
          direction: string;
          duration_ms?: number | null;
          error_message?: string | null;
          event_type: string;
          id?: string;
          integration_id: string;
          payload?: Json | null;
          response?: Json | null;
          started_at?: string | null;
          status: string;
        };
        Update: {
          completed_at?: string | null;
          direction?: string;
          duration_ms?: number | null;
          error_message?: string | null;
          event_type?: string;
          id?: string;
          integration_id?: string;
          payload?: Json | null;
          response?: Json | null;
          started_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'integration_sync_logs_integration_id_fkey';
            columns: ['integration_id'];
            isOneToOne: false;
            referencedRelation: 'integrations';
            referencedColumns: ['id'];
          },
        ];
      };
      integrations: {
        Row: {
          company_id: string;
          created_at: string | null;
          credentials: Json | null;
          error_message: string | null;
          failed_syncs: number | null;
          id: string;
          last_sync_at: string | null;
          name: string;
          provider: string;
          settings: Json | null;
          status: string | null;
          successful_syncs: number | null;
          total_syncs: number | null;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          credentials?: Json | null;
          error_message?: string | null;
          failed_syncs?: number | null;
          id?: string;
          last_sync_at?: string | null;
          name: string;
          provider: string;
          settings?: Json | null;
          status?: string | null;
          successful_syncs?: number | null;
          total_syncs?: number | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          credentials?: Json | null;
          error_message?: string | null;
          failed_syncs?: number | null;
          id?: string;
          last_sync_at?: string | null;
          name?: string;
          provider?: string;
          settings?: Json | null;
          status?: string | null;
          successful_syncs?: number | null;
          total_syncs?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'integrations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      internal_messages: {
        Row: {
          company_id: string;
          content: string;
          created_at: string | null;
          id: string;
          media_type: string | null;
          media_url: string | null;
          message_type: string | null;
          read_at: string | null;
          recipient_id: string;
          sender_id: string;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          content: string;
          created_at?: string | null;
          id?: string;
          media_type?: string | null;
          media_url?: string | null;
          message_type?: string | null;
          read_at?: string | null;
          recipient_id: string;
          sender_id: string;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          content?: string;
          created_at?: string | null;
          id?: string;
          media_type?: string | null;
          media_url?: string | null;
          message_type?: string | null;
          read_at?: string | null;
          recipient_id?: string;
          sender_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'internal_messages_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'internal_messages_recipient_id_fkey';
            columns: ['recipient_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'internal_messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      kb_answer_cache: {
        Row: {
          answer: string;
          company_id: string | null;
          confidence_score: number | null;
          created_at: string | null;
          expires_at: string | null;
          hit_count: number | null;
          id: string;
          query_hash: string;
          source_chunks: string[];
        };
        Insert: {
          answer: string;
          company_id?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          expires_at?: string | null;
          hit_count?: number | null;
          id?: string;
          query_hash: string;
          source_chunks: string[];
        };
        Update: {
          answer?: string;
          company_id?: string | null;
          confidence_score?: number | null;
          created_at?: string | null;
          expires_at?: string | null;
          hit_count?: number | null;
          id?: string;
          query_hash?: string;
          source_chunks?: string[];
        };
        Relationships: [
          {
            foreignKeyName: 'kb_answer_cache_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      kb_chunks: {
        Row: {
          content: string;
          created_at: string | null;
          document_id: string | null;
          embedding: string | null;
          id: string;
          metadata: Json | null;
          position: number;
          token_count: number | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          document_id?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
          position?: number;
          token_count?: number | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          document_id?: string | null;
          embedding?: string | null;
          id?: string;
          metadata?: Json | null;
          position?: number;
          token_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'kb_chunks_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'kb_documents';
            referencedColumns: ['id'];
          },
        ];
      };
      kb_configs: {
        Row: {
          auto_sync_faqs: boolean | null;
          chunk_overlap: number | null;
          chunk_size: number | null;
          company_id: string | null;
          created_at: string | null;
          embedding_model: string | null;
          embedding_provider: string | null;
          id: string;
          is_enabled: boolean | null;
          similarity_threshold: number | null;
          top_k: number | null;
          updated_at: string | null;
          use_cache: boolean | null;
        };
        Insert: {
          auto_sync_faqs?: boolean | null;
          chunk_overlap?: number | null;
          chunk_size?: number | null;
          company_id?: string | null;
          created_at?: string | null;
          embedding_model?: string | null;
          embedding_provider?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          similarity_threshold?: number | null;
          top_k?: number | null;
          updated_at?: string | null;
          use_cache?: boolean | null;
        };
        Update: {
          auto_sync_faqs?: boolean | null;
          chunk_overlap?: number | null;
          chunk_size?: number | null;
          company_id?: string | null;
          created_at?: string | null;
          embedding_model?: string | null;
          embedding_provider?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          similarity_threshold?: number | null;
          top_k?: number | null;
          updated_at?: string | null;
          use_cache?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'kb_configs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      kb_documents: {
        Row: {
          category_id: string | null;
          company_id: string | null;
          content: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_active: boolean | null;
          metadata: Json | null;
          source_type: string | null;
          source_url: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          category_id?: string | null;
          company_id?: string | null;
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          source_type?: string | null;
          source_url?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string | null;
          company_id?: string | null;
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          metadata?: Json | null;
          source_type?: string | null;
          source_url?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'kb_documents_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'faq_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'kb_documents_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'kb_documents_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      kb_queries: {
        Row: {
          company_id: string | null;
          confidence_score: number | null;
          conversation_id: string | null;
          created_at: string | null;
          id: string;
          query: string;
          response_generated: string | null;
          results: Json | null;
        };
        Insert: {
          company_id?: string | null;
          confidence_score?: number | null;
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          query: string;
          response_generated?: string | null;
          results?: Json | null;
        };
        Update: {
          company_id?: string | null;
          confidence_score?: number | null;
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          query?: string;
          response_generated?: string | null;
          results?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'kb_queries_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'kb_queries_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      labels: {
        Row: {
          color: string;
          company_id: string;
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          color: string;
          company_id: string;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string;
          company_id?: string;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'labels_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      lead_insights: {
        Row: {
          company_id: string;
          confidence: number | null;
          contact_id: string;
          conversation_id: string | null;
          created_at: string | null;
          description: string | null;
          expires_at: string | null;
          extracted_at: string | null;
          id: string;
          insight_type: string;
          interest_level: number | null;
          is_active: boolean | null;
          message_id: string | null;
          product_id: string | null;
          product_name: string | null;
          source: string | null;
          title: string;
          value: string | null;
        };
        Insert: {
          company_id: string;
          confidence?: number | null;
          contact_id: string;
          conversation_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          expires_at?: string | null;
          extracted_at?: string | null;
          id?: string;
          insight_type: string;
          interest_level?: number | null;
          is_active?: boolean | null;
          message_id?: string | null;
          product_id?: string | null;
          product_name?: string | null;
          source?: string | null;
          title: string;
          value?: string | null;
        };
        Update: {
          company_id?: string;
          confidence?: number | null;
          contact_id?: string;
          conversation_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          expires_at?: string | null;
          extracted_at?: string | null;
          id?: string;
          insight_type?: string;
          interest_level?: number | null;
          is_active?: boolean | null;
          message_id?: string | null;
          product_id?: string | null;
          product_name?: string | null;
          source?: string | null;
          title?: string;
          value?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_insights_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_insights_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_insights_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_insights_message_id_fkey';
            columns: ['message_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_insights_product_id_fkey';
            columns: ['product_id'];
            isOneToOne: false;
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
        ];
      };
      lead_qualification: {
        Row: {
          ai_generated: boolean | null;
          authority_notes: string | null;
          authority_score: number | null;
          best_contact_day: string | null;
          best_contact_time: string | null;
          budget_notes: string | null;
          budget_score: number | null;
          communication_style: string | null;
          company_id: string;
          contact_id: string;
          created_at: string | null;
          decision_speed: string | null;
          id: string;
          last_updated_by: string | null;
          need_notes: string | null;
          need_score: number | null;
          preferred_channel: string | null;
          price_sensitivity: string | null;
          qualification_level: string | null;
          timing_notes: string | null;
          timing_score: number | null;
          total_score: number | null;
          updated_at: string | null;
        };
        Insert: {
          ai_generated?: boolean | null;
          authority_notes?: string | null;
          authority_score?: number | null;
          best_contact_day?: string | null;
          best_contact_time?: string | null;
          budget_notes?: string | null;
          budget_score?: number | null;
          communication_style?: string | null;
          company_id: string;
          contact_id: string;
          created_at?: string | null;
          decision_speed?: string | null;
          id?: string;
          last_updated_by?: string | null;
          need_notes?: string | null;
          need_score?: number | null;
          preferred_channel?: string | null;
          price_sensitivity?: string | null;
          qualification_level?: string | null;
          timing_notes?: string | null;
          timing_score?: number | null;
          total_score?: number | null;
          updated_at?: string | null;
        };
        Update: {
          ai_generated?: boolean | null;
          authority_notes?: string | null;
          authority_score?: number | null;
          best_contact_day?: string | null;
          best_contact_time?: string | null;
          budget_notes?: string | null;
          budget_score?: number | null;
          communication_style?: string | null;
          company_id?: string;
          contact_id?: string;
          created_at?: string | null;
          decision_speed?: string | null;
          id?: string;
          last_updated_by?: string | null;
          need_notes?: string | null;
          need_score?: number | null;
          preferred_channel?: string | null;
          price_sensitivity?: string | null;
          qualification_level?: string | null;
          timing_notes?: string | null;
          timing_score?: number | null;
          total_score?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lead_qualification_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'lead_qualification_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: true;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };
      leaderboard_snapshots: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          id: string;
          period: string;
          rankings: Json;
          snapshot_date: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          period: string;
          rankings: Json;
          snapshot_date: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          period?: string;
          rankings?: Json;
          snapshot_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'leaderboard_snapshots_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      loss_reasons: {
        Row: {
          category: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          order_index: number | null;
          reason: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          order_index?: number | null;
          reason: string;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          order_index?: number | null;
          reason?: string;
        };
        Relationships: [];
      };
      member_permissions: {
        Row: {
          created_at: string | null;
          id: string;
          is_granted: boolean;
          member_id: string;
          permission_key: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_granted: boolean;
          member_id: string;
          permission_key: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_granted?: boolean;
          member_id?: string;
          permission_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'member_permissions_member_id_fkey';
            columns: ['member_id'];
            isOneToOne: false;
            referencedRelation: 'company_members';
            referencedColumns: ['id'];
          },
        ];
      };
      message_templates: {
        Row: {
          avg_response_rate: number | null;
          category: string | null;
          company_id: string;
          content: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_favorite: boolean | null;
          is_personal: boolean | null;
          last_used_at: string | null;
          name: string;
          shortcut: string | null;
          tags: string[] | null;
          usage_count: number | null;
          variables: string[] | null;
        };
        Insert: {
          avg_response_rate?: number | null;
          category?: string | null;
          company_id: string;
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          is_personal?: boolean | null;
          last_used_at?: string | null;
          name: string;
          shortcut?: string | null;
          tags?: string[] | null;
          usage_count?: number | null;
          variables?: string[] | null;
        };
        Update: {
          avg_response_rate?: number | null;
          category?: string | null;
          company_id?: string;
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          is_personal?: boolean | null;
          last_used_at?: string | null;
          name?: string;
          shortcut?: string | null;
          tags?: string[] | null;
          usage_count?: number | null;
          variables?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'message_templates_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          ai_confidence: number | null;
          ai_intent_detected: string | null;
          ai_metadata: Json | null;
          ai_model: string | null;
          ai_response_time_ms: number | null;
          ai_sentiment: string | null;
          ai_suggested_response: string | null;
          ai_was_edited: boolean | null;
          audio_transcription: string | null;
          company_id: string | null;
          contact_data: Json | null;
          content: string;
          conversation_id: string;
          created_at: string;
          deleted_at: string | null;
          deleted_for_everyone: boolean | null;
          delivered_at: string | null;
          edited_at: string | null;
          external_id: string | null;
          id: string;
          is_from_ai: boolean | null;
          is_from_me: boolean;
          list_data: Json | null;
          location_data: Json | null;
          media_mime_type: string | null;
          media_type: string | null;
          media_url: string | null;
          message_type: string;
          metadata: Json | null;
          played_at: string | null;
          poll_data: Json | null;
          quoted_message_id: string | null;
          reaction: string | null;
          read_at: string | null;
          sender_id: string | null;
          status: string | null;
          timestamp: string;
          transcription_confidence: number | null;
          transcription_duration: number | null;
          transcription_language: string | null;
          transcription_provider: string | null;
          transcription_status: string | null;
          user_id: string;
        };
        Insert: {
          ai_confidence?: number | null;
          ai_intent_detected?: string | null;
          ai_metadata?: Json | null;
          ai_model?: string | null;
          ai_response_time_ms?: number | null;
          ai_sentiment?: string | null;
          ai_suggested_response?: string | null;
          ai_was_edited?: boolean | null;
          audio_transcription?: string | null;
          company_id?: string | null;
          contact_data?: Json | null;
          content: string;
          conversation_id: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_for_everyone?: boolean | null;
          delivered_at?: string | null;
          edited_at?: string | null;
          external_id?: string | null;
          id?: string;
          is_from_ai?: boolean | null;
          is_from_me?: boolean;
          list_data?: Json | null;
          location_data?: Json | null;
          media_mime_type?: string | null;
          media_type?: string | null;
          media_url?: string | null;
          message_type?: string;
          metadata?: Json | null;
          played_at?: string | null;
          poll_data?: Json | null;
          quoted_message_id?: string | null;
          reaction?: string | null;
          read_at?: string | null;
          sender_id?: string | null;
          status?: string | null;
          timestamp?: string;
          transcription_confidence?: number | null;
          transcription_duration?: number | null;
          transcription_language?: string | null;
          transcription_provider?: string | null;
          transcription_status?: string | null;
          user_id: string;
        };
        Update: {
          ai_confidence?: number | null;
          ai_intent_detected?: string | null;
          ai_metadata?: Json | null;
          ai_model?: string | null;
          ai_response_time_ms?: number | null;
          ai_sentiment?: string | null;
          ai_suggested_response?: string | null;
          ai_was_edited?: boolean | null;
          audio_transcription?: string | null;
          company_id?: string | null;
          contact_data?: Json | null;
          content?: string;
          conversation_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_for_everyone?: boolean | null;
          delivered_at?: string | null;
          edited_at?: string | null;
          external_id?: string | null;
          id?: string;
          is_from_ai?: boolean | null;
          is_from_me?: boolean;
          list_data?: Json | null;
          location_data?: Json | null;
          media_mime_type?: string | null;
          media_type?: string | null;
          media_url?: string | null;
          message_type?: string;
          metadata?: Json | null;
          played_at?: string | null;
          poll_data?: Json | null;
          quoted_message_id?: string | null;
          reaction?: string | null;
          read_at?: string | null;
          sender_id?: string | null;
          status?: string | null;
          timestamp?: string;
          transcription_confidence?: number | null;
          transcription_duration?: number | null;
          transcription_language?: string | null;
          transcription_provider?: string | null;
          transcription_status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      messenger_templates: {
        Row: {
          channel_id: string | null;
          company_id: string;
          created_at: string | null;
          id: string;
          name: string;
          payload: Json;
          type: string;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          channel_id?: string | null;
          company_id: string;
          created_at?: string | null;
          id?: string;
          name: string;
          payload: Json;
          type: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          channel_id?: string | null;
          company_id?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
          payload?: Json;
          type?: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messenger_templates_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'channels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messenger_templates_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      n8n_chat_histories: {
        Row: {
          id: number;
          message: Json;
          session_id: string;
        };
        Insert: {
          id?: number;
          message: Json;
          session_id: string;
        };
        Update: {
          id?: number;
          message?: Json;
          session_id?: string;
        };
        Relationships: [];
      };
      notification_history: {
        Row: {
          body: string;
          company_id: string;
          conversation_id: string;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          message_type: string | null;
          read: boolean | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body: string;
          company_id: string;
          conversation_id: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          message_type?: string | null;
          read?: boolean | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          company_id?: string;
          conversation_id?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          message_type?: string | null;
          read?: boolean | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_history_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_history_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_logs: {
        Row: {
          body: string | null;
          company_id: string | null;
          conversation_id: string | null;
          created_at: string | null;
          data: Json | null;
          delivered_at: string | null;
          error: string | null;
          icon: string | null;
          id: string;
          message_id: string | null;
          read_at: string | null;
          sent_at: string | null;
          status: string | null;
          title: string;
          type: string;
          url: string | null;
          user_id: string | null;
        };
        Insert: {
          body?: string | null;
          company_id?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          data?: Json | null;
          delivered_at?: string | null;
          error?: string | null;
          icon?: string | null;
          id?: string;
          message_id?: string | null;
          read_at?: string | null;
          sent_at?: string | null;
          status?: string | null;
          title: string;
          type: string;
          url?: string | null;
          user_id?: string | null;
        };
        Update: {
          body?: string | null;
          company_id?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          data?: Json | null;
          delivered_at?: string | null;
          error?: string | null;
          icon?: string | null;
          id?: string;
          message_id?: string | null;
          read_at?: string | null;
          sent_at?: string | null;
          status?: string | null;
          title?: string;
          type?: string;
          url?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_logs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_logs_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notification_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_settings: {
        Row: {
          badge_enabled: boolean | null;
          company_id: string;
          created_at: string | null;
          do_not_disturb_enabled: boolean | null;
          do_not_disturb_end: string | null;
          do_not_disturb_start: string | null;
          enabled: boolean | null;
          id: string;
          muted_contacts: string[] | null;
          sound_enabled: boolean | null;
          updated_at: string | null;
          user_id: string;
          volume: number | null;
        };
        Insert: {
          badge_enabled?: boolean | null;
          company_id: string;
          created_at?: string | null;
          do_not_disturb_enabled?: boolean | null;
          do_not_disturb_end?: string | null;
          do_not_disturb_start?: string | null;
          enabled?: boolean | null;
          id?: string;
          muted_contacts?: string[] | null;
          sound_enabled?: boolean | null;
          updated_at?: string | null;
          user_id: string;
          volume?: number | null;
        };
        Update: {
          badge_enabled?: boolean | null;
          company_id?: string;
          created_at?: string | null;
          do_not_disturb_enabled?: boolean | null;
          do_not_disturb_end?: string | null;
          do_not_disturb_start?: string | null;
          enabled?: boolean | null;
          id?: string;
          muted_contacts?: string[] | null;
          sound_enabled?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
          volume?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'notification_settings_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          action_url: string | null;
          company_id: string;
          created_at: string | null;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          is_read: boolean | null;
          message: string;
          metadata: Json | null;
          read_at: string | null;
          title: string;
          type: string | null;
          user_id: string;
        };
        Insert: {
          action_url?: string | null;
          company_id: string;
          created_at?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          metadata?: Json | null;
          read_at?: string | null;
          title: string;
          type?: string | null;
          user_id: string;
        };
        Update: {
          action_url?: string | null;
          company_id?: string;
          created_at?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          metadata?: Json | null;
          read_at?: string | null;
          title?: string;
          type?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'notifications_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      order_status_history: {
        Row: {
          changed_by: string | null;
          created_at: string | null;
          id: string;
          notes: string | null;
          order_id: string | null;
          status: string;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          status: string;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string | null;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'order_status_history_changed_by_fkey';
            columns: ['changed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_status_history_order_id_fkey';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          company_id: string | null;
          contact_id: string | null;
          conversation_id: string | null;
          created_at: string | null;
          created_by: string | null;
          customer_notes: string | null;
          deal_id: string | null;
          delivered_at: string | null;
          discount: number | null;
          discount_type: string | null;
          id: string;
          internal_notes: string | null;
          items: Json;
          order_number: number;
          paid_at: string | null;
          payment_id: string | null;
          payment_method: string | null;
          payment_provider: string | null;
          payment_status: string | null;
          pix_code: string | null;
          pix_expiration: string | null;
          pix_qrcode_url: string | null;
          shipped_at: string | null;
          shipping: number | null;
          shipping_address: Json | null;
          status: string | null;
          subtotal: number;
          tax: number | null;
          total: number;
          tracking_code: string | null;
          updated_at: string | null;
        };
        Insert: {
          company_id?: string | null;
          contact_id?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          customer_notes?: string | null;
          deal_id?: string | null;
          delivered_at?: string | null;
          discount?: number | null;
          discount_type?: string | null;
          id?: string;
          internal_notes?: string | null;
          items?: Json;
          order_number?: number;
          paid_at?: string | null;
          payment_id?: string | null;
          payment_method?: string | null;
          payment_provider?: string | null;
          payment_status?: string | null;
          pix_code?: string | null;
          pix_expiration?: string | null;
          pix_qrcode_url?: string | null;
          shipped_at?: string | null;
          shipping?: number | null;
          shipping_address?: Json | null;
          status?: string | null;
          subtotal?: number;
          tax?: number | null;
          total?: number;
          tracking_code?: string | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          contact_id?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          customer_notes?: string | null;
          deal_id?: string | null;
          delivered_at?: string | null;
          discount?: number | null;
          discount_type?: string | null;
          id?: string;
          internal_notes?: string | null;
          items?: Json;
          order_number?: number;
          paid_at?: string | null;
          payment_id?: string | null;
          payment_method?: string | null;
          payment_provider?: string | null;
          payment_status?: string | null;
          pix_code?: string | null;
          pix_expiration?: string | null;
          pix_qrcode_url?: string | null;
          shipped_at?: string | null;
          shipping?: number | null;
          shipping_address?: Json | null;
          status?: string | null;
          subtotal?: number;
          tax?: number | null;
          total?: number;
          tracking_code?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals_with_activity_count';
            referencedColumns: ['id'];
          },
        ];
      };
      permissions: {
        Row: {
          action: string;
          category: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_system: boolean | null;
          key: string;
          name: string;
          resource: string;
        };
        Insert: {
          action: string;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean | null;
          key: string;
          name: string;
          resource: string;
        };
        Update: {
          action?: string;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean | null;
          key?: string;
          name?: string;
          resource?: string;
        };
        Relationships: [];
      };
      pipeline_stages: {
        Row: {
          automation_rules: Json | null;
          color: string | null;
          created_at: string | null;
          id: string;
          is_closed_lost: boolean | null;
          is_closed_won: boolean | null;
          name: string;
          order_index: number;
          pipeline_id: string;
          probability_default: number | null;
        };
        Insert: {
          automation_rules?: Json | null;
          color?: string | null;
          created_at?: string | null;
          id?: string;
          is_closed_lost?: boolean | null;
          is_closed_won?: boolean | null;
          name: string;
          order_index: number;
          pipeline_id: string;
          probability_default?: number | null;
        };
        Update: {
          automation_rules?: Json | null;
          color?: string | null;
          created_at?: string | null;
          id?: string;
          is_closed_lost?: boolean | null;
          is_closed_won?: boolean | null;
          name?: string;
          order_index?: number;
          pipeline_id?: string;
          probability_default?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pipeline_stages_pipeline_id_fkey';
            columns: ['pipeline_id'];
            isOneToOne: false;
            referencedRelation: 'pipelines';
            referencedColumns: ['id'];
          },
        ];
      };
      pipelines: {
        Row: {
          company_id: string;
          created_at: string | null;
          description: string | null;
          id: string;
          is_default: boolean | null;
          name: string;
          order_index: number | null;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          name: string;
          order_index?: number | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          name?: string;
          order_index?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pipelines_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      plan_features: {
        Row: {
          config: Json | null;
          created_at: string | null;
          feature_id: string | null;
          id: string;
          is_enabled: boolean | null;
          plan_id: string | null;
        };
        Insert: {
          config?: Json | null;
          created_at?: string | null;
          feature_id?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          plan_id?: string | null;
        };
        Update: {
          config?: Json | null;
          created_at?: string | null;
          feature_id?: string | null;
          id?: string;
          is_enabled?: boolean | null;
          plan_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'plan_features_feature_id_fkey';
            columns: ['feature_id'];
            isOneToOne: false;
            referencedRelation: 'platform_features';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'plan_features_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_plans';
            referencedColumns: ['id'];
          },
        ];
      };
      platform_admins: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          email: string;
          id: string;
          is_active: boolean | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          email: string;
          id?: string;
          is_active?: boolean | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          email?: string;
          id?: string;
          is_active?: boolean | null;
          user_id?: string;
        };
        Relationships: [];
      };
      platform_features: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          feature_key: string;
          icon: string | null;
          id: string;
          is_global_enabled: boolean | null;
          name: string;
          order_index: number | null;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          feature_key: string;
          icon?: string | null;
          id?: string;
          is_global_enabled?: boolean | null;
          name: string;
          order_index?: number | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          feature_key?: string;
          icon?: string | null;
          id?: string;
          is_global_enabled?: boolean | null;
          name?: string;
          order_index?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      playbook_executions: {
        Row: {
          completed_at: string | null;
          conversation_id: string | null;
          current_step: number | null;
          deal_id: string | null;
          error_message: string | null;
          id: string;
          playbook_id: string;
          started_at: string | null;
          status: string | null;
          steps_log: Json | null;
          triggered_by: string | null;
        };
        Insert: {
          completed_at?: string | null;
          conversation_id?: string | null;
          current_step?: number | null;
          deal_id?: string | null;
          error_message?: string | null;
          id?: string;
          playbook_id: string;
          started_at?: string | null;
          status?: string | null;
          steps_log?: Json | null;
          triggered_by?: string | null;
        };
        Update: {
          completed_at?: string | null;
          conversation_id?: string | null;
          current_step?: number | null;
          deal_id?: string | null;
          error_message?: string | null;
          id?: string;
          playbook_id?: string;
          started_at?: string | null;
          status?: string | null;
          steps_log?: Json | null;
          triggered_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'playbook_executions_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playbook_executions_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playbook_executions_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals_with_activity_count';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playbook_executions_playbook_id_fkey';
            columns: ['playbook_id'];
            isOneToOne: false;
            referencedRelation: 'playbooks';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'playbook_executions_triggered_by_fkey';
            columns: ['triggered_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      playbooks: {
        Row: {
          company_id: string;
          created_at: string | null;
          description: string | null;
          flow_data: Json | null;
          id: string;
          is_active: boolean | null;
          name: string;
          steps: Json;
          success_rate: number | null;
          trigger_config: Json | null;
          trigger_type: string;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          description?: string | null;
          flow_data?: Json | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          steps?: Json;
          success_rate?: number | null;
          trigger_config?: Json | null;
          trigger_type: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          description?: string | null;
          flow_data?: Json | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          steps?: Json;
          success_rate?: number | null;
          trigger_config?: Json | null;
          trigger_type?: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'playbooks_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      privacy_settings: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          read_receipts_enabled: boolean;
          show_last_seen: string;
          show_profile_picture: string;
          show_status: string;
          updated_at: string;
          user_id: string;
          who_can_add_to_groups: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          read_receipts_enabled?: boolean;
          show_last_seen?: string;
          show_profile_picture?: string;
          show_status?: string;
          updated_at?: string;
          user_id: string;
          who_can_add_to_groups?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          read_receipts_enabled?: boolean;
          show_last_seen?: string;
          show_profile_picture?: string;
          show_status?: string;
          updated_at?: string;
          user_id?: string;
          who_can_add_to_groups?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'privacy_settings_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'privacy_settings_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      product_categories: {
        Row: {
          color: string | null;
          company_id: string;
          created_at: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          company_id: string;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          company_id?: string;
          created_at?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_categories_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      product_custom_fields: {
        Row: {
          company_id: string;
          created_at: string | null;
          default_value: string | null;
          field_type: string;
          id: string;
          is_active: boolean | null;
          is_required: boolean | null;
          label: string;
          name: string;
          options: Json | null;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          default_value?: string | null;
          field_type: string;
          id?: string;
          is_active?: boolean | null;
          is_required?: boolean | null;
          label: string;
          name: string;
          options?: Json | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          default_value?: string | null;
          field_type?: string;
          id?: string;
          is_active?: boolean | null;
          is_required?: boolean | null;
          label?: string;
          name?: string;
          options?: Json | null;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_custom_fields_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      product_settings: {
        Row: {
          company_id: string;
          created_at: string | null;
          display_name: string;
          display_name_singular: string;
          icon: string;
          id: string;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          display_name?: string;
          display_name_singular?: string;
          icon?: string;
          id?: string;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          display_name?: string;
          display_name_singular?: string;
          icon?: string;
          id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'product_settings_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          category: string | null;
          category_id: string | null;
          company_id: string;
          cost: number | null;
          created_at: string | null;
          custom_field_values: Json | null;
          description: string | null;
          id: string;
          images: string[] | null;
          is_active: boolean | null;
          metadata: Json | null;
          name: string;
          price: number | null;
          sku: string | null;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          category_id?: string | null;
          company_id: string;
          cost?: number | null;
          created_at?: string | null;
          custom_field_values?: Json | null;
          description?: string | null;
          id?: string;
          images?: string[] | null;
          is_active?: boolean | null;
          metadata?: Json | null;
          name: string;
          price?: number | null;
          sku?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          category_id?: string | null;
          company_id?: string;
          cost?: number | null;
          created_at?: string | null;
          custom_field_values?: Json | null;
          description?: string | null;
          id?: string;
          images?: string[] | null;
          is_active?: boolean | null;
          metadata?: Json | null;
          name?: string;
          price?: number | null;
          sku?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'product_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          company_id: string | null;
          created_at: string;
          email: string | null;
          first_name: string | null;
          full_name: string;
          google_calendar_connected: boolean | null;
          google_calendar_email: string | null;
          google_calendar_refresh_token: string | null;
          google_calendar_token: Json | null;
          id: string;
          last_name: string | null;
          nickname: string | null;
          phone: string | null;
          piloto_pro_activated_at: string | null;
          piloto_pro_subscriber: boolean | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          company_id?: string | null;
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          full_name: string;
          google_calendar_connected?: boolean | null;
          google_calendar_email?: string | null;
          google_calendar_refresh_token?: string | null;
          google_calendar_token?: Json | null;
          id: string;
          last_name?: string | null;
          nickname?: string | null;
          phone?: string | null;
          piloto_pro_activated_at?: string | null;
          piloto_pro_subscriber?: boolean | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          company_id?: string | null;
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          full_name?: string;
          google_calendar_connected?: boolean | null;
          google_calendar_email?: string | null;
          google_calendar_refresh_token?: string | null;
          google_calendar_token?: Json | null;
          id?: string;
          last_name?: string | null;
          nickname?: string | null;
          phone?: string | null;
          piloto_pro_activated_at?: string | null;
          piloto_pro_subscriber?: boolean | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      proposal_templates: {
        Row: {
          category: string | null;
          company_id: string;
          content: Json;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_default: boolean | null;
          name: string;
          thumbnail_url: string | null;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          category?: string | null;
          company_id: string;
          content: Json;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          name: string;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          category?: string | null;
          company_id?: string;
          content?: Json;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean | null;
          name?: string;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'proposal_templates_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'proposal_templates_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      proposal_views: {
        Row: {
          id: string;
          ip_address: string | null;
          proposal_id: string | null;
          session_id: string | null;
          user_agent: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          ip_address?: string | null;
          proposal_id?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          ip_address?: string | null;
          proposal_id?: string | null;
          session_id?: string | null;
          user_agent?: string | null;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'proposal_views_proposal_id_fkey';
            columns: ['proposal_id'];
            isOneToOne: false;
            referencedRelation: 'proposals';
            referencedColumns: ['id'];
          },
        ];
      };
      proposals: {
        Row: {
          accepted_at: string | null;
          change_notes: string | null;
          client_document: string | null;
          client_name: string | null;
          created_at: string | null;
          created_by: string | null;
          deal_id: string;
          discount: number | null;
          discount_type: string | null;
          id: string;
          items: Json;
          notes: string | null;
          parent_proposal_id: string | null;
          payment_terms: string | null;
          pdf_url: string | null;
          public_link: string | null;
          rejected_at: string | null;
          rejection_reason: string | null;
          signature_data: string | null;
          status: string | null;
          subtotal: number | null;
          tax: number | null;
          title: string;
          total: number;
          updated_at: string | null;
          validity_days: number | null;
          version: number | null;
          viewed_at: string | null;
        };
        Insert: {
          accepted_at?: string | null;
          change_notes?: string | null;
          client_document?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deal_id: string;
          discount?: number | null;
          discount_type?: string | null;
          id?: string;
          items?: Json;
          notes?: string | null;
          parent_proposal_id?: string | null;
          payment_terms?: string | null;
          pdf_url?: string | null;
          public_link?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          signature_data?: string | null;
          status?: string | null;
          subtotal?: number | null;
          tax?: number | null;
          title: string;
          total?: number;
          updated_at?: string | null;
          validity_days?: number | null;
          version?: number | null;
          viewed_at?: string | null;
        };
        Update: {
          accepted_at?: string | null;
          change_notes?: string | null;
          client_document?: string | null;
          client_name?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deal_id?: string;
          discount?: number | null;
          discount_type?: string | null;
          id?: string;
          items?: Json;
          notes?: string | null;
          parent_proposal_id?: string | null;
          payment_terms?: string | null;
          pdf_url?: string | null;
          public_link?: string | null;
          rejected_at?: string | null;
          rejection_reason?: string | null;
          signature_data?: string | null;
          status?: string | null;
          subtotal?: number | null;
          tax?: number | null;
          title?: string;
          total?: number;
          updated_at?: string | null;
          validity_days?: number | null;
          version?: number | null;
          viewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'proposals_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'proposals_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'proposals_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals_with_activity_count';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'proposals_parent_proposal_id_fkey';
            columns: ['parent_proposal_id'];
            isOneToOne: false;
            referencedRelation: 'proposals';
            referencedColumns: ['id'];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          company_id: string | null;
          created_at: string | null;
          device_name: string | null;
          endpoint: string;
          error_count: number | null;
          id: string;
          is_active: boolean | null;
          keys: Json;
          last_used_at: string | null;
          platform: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          company_id?: string | null;
          created_at?: string | null;
          device_name?: string | null;
          endpoint: string;
          error_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          keys: Json;
          last_used_at?: string | null;
          platform?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          company_id?: string | null;
          created_at?: string | null;
          device_name?: string | null;
          endpoint?: string;
          error_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          keys?: Json;
          last_used_at?: string | null;
          platform?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'push_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      queue_members: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          last_assigned_at: string | null;
          max_conversations: number | null;
          queue_id: string;
          skills: string[] | null;
          status: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_assigned_at?: string | null;
          max_conversations?: number | null;
          queue_id: string;
          skills?: string[] | null;
          status?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_assigned_at?: string | null;
          max_conversations?: number | null;
          queue_id?: string;
          skills?: string[] | null;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'queue_members_queue_id_fkey';
            columns: ['queue_id'];
            isOneToOne: false;
            referencedRelation: 'queues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'queue_members_queue_id_fkey';
            columns: ['queue_id'];
            isOneToOne: false;
            referencedRelation: 'sla_metrics_view';
            referencedColumns: ['queue_id'];
          },
          {
            foreignKeyName: 'queue_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      queues: {
        Row: {
          assignment_method: string | null;
          auto_assign: boolean | null;
          color: string | null;
          company_id: string;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          max_conversations_per_agent: number | null;
          name: string;
          sla_first_response_minutes: number | null;
          sla_resolution_hours: number | null;
          updated_at: string | null;
          working_hours: Json | null;
        };
        Insert: {
          assignment_method?: string | null;
          auto_assign?: boolean | null;
          color?: string | null;
          company_id: string;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          max_conversations_per_agent?: number | null;
          name: string;
          sla_first_response_minutes?: number | null;
          sla_resolution_hours?: number | null;
          updated_at?: string | null;
          working_hours?: Json | null;
        };
        Update: {
          assignment_method?: string | null;
          auto_assign?: boolean | null;
          color?: string | null;
          company_id?: string;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          max_conversations_per_agent?: number | null;
          name?: string;
          sla_first_response_minutes?: number | null;
          sla_resolution_hours?: number | null;
          updated_at?: string | null;
          working_hours?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'queues_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      restore_jobs: {
        Row: {
          backup_id: string;
          company_id: string;
          completed_at: string | null;
          conflicts_found: number | null;
          create_restore_point: boolean | null;
          created_at: string | null;
          error_message: string | null;
          id: string;
          overwrite_existing: boolean | null;
          progress: number | null;
          records_restored: number | null;
          requested_by: string | null;
          restore_to_point_in_time: string | null;
          restore_type: string | null;
          started_at: string | null;
          status: string | null;
          tables_to_restore: string[] | null;
        };
        Insert: {
          backup_id: string;
          company_id: string;
          completed_at?: string | null;
          conflicts_found?: number | null;
          create_restore_point?: boolean | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          overwrite_existing?: boolean | null;
          progress?: number | null;
          records_restored?: number | null;
          requested_by?: string | null;
          restore_to_point_in_time?: string | null;
          restore_type?: string | null;
          started_at?: string | null;
          status?: string | null;
          tables_to_restore?: string[] | null;
        };
        Update: {
          backup_id?: string;
          company_id?: string;
          completed_at?: string | null;
          conflicts_found?: number | null;
          create_restore_point?: boolean | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          overwrite_existing?: boolean | null;
          progress?: number | null;
          records_restored?: number | null;
          requested_by?: string | null;
          restore_to_point_in_time?: string | null;
          restore_type?: string | null;
          started_at?: string | null;
          status?: string | null;
          tables_to_restore?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'restore_jobs_backup_id_fkey';
            columns: ['backup_id'];
            isOneToOne: false;
            referencedRelation: 'backup_history';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'restore_jobs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'restore_jobs_requested_by_fkey';
            columns: ['requested_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      role_permissions: {
        Row: {
          id: string;
          is_granted: boolean;
          permission_key: string;
          role: Database['public']['Enums']['user_role'];
        };
        Insert: {
          id?: string;
          is_granted?: boolean;
          permission_key: string;
          role: Database['public']['Enums']['user_role'];
        };
        Update: {
          id?: string;
          is_granted?: boolean;
          permission_key?: string;
          role?: Database['public']['Enums']['user_role'];
        };
        Relationships: [];
      };
      routing_rules: {
        Row: {
          actions: Json;
          company_id: string;
          conditions: Json;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          last_triggered_at: string | null;
          name: string;
          priority: number | null;
          times_triggered: number | null;
          updated_at: string | null;
        };
        Insert: {
          actions?: Json;
          company_id: string;
          conditions?: Json;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_triggered_at?: string | null;
          name: string;
          priority?: number | null;
          times_triggered?: number | null;
          updated_at?: string | null;
        };
        Update: {
          actions?: Json;
          company_id?: string;
          conditions?: Json;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_triggered_at?: string | null;
          name?: string;
          priority?: number | null;
          times_triggered?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'routing_rules_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'routing_rules_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      satisfaction_settings: {
        Row: {
          ask_feedback: boolean;
          company_id: string;
          created_at: string;
          custom_message: string | null;
          delay_minutes: number;
          enabled: boolean;
          feedback_prompt: string | null;
          id: string;
          survey_type: string;
          updated_at: string;
        };
        Insert: {
          ask_feedback?: boolean;
          company_id: string;
          created_at?: string;
          custom_message?: string | null;
          delay_minutes?: number;
          enabled?: boolean;
          feedback_prompt?: string | null;
          id?: string;
          survey_type?: string;
          updated_at?: string;
        };
        Update: {
          ask_feedback?: boolean;
          company_id?: string;
          created_at?: string;
          custom_message?: string | null;
          delay_minutes?: number;
          enabled?: boolean;
          feedback_prompt?: string | null;
          id?: string;
          survey_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'satisfaction_settings_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      satisfaction_surveys: {
        Row: {
          answered_at: string | null;
          assigned_to: string | null;
          company_id: string;
          contact_id: string | null;
          conversation_id: string;
          created_at: string;
          feedback: string | null;
          id: string;
          score: number | null;
          sent_at: string;
          status: string;
          survey_type: string;
          updated_at: string;
        };
        Insert: {
          answered_at?: string | null;
          assigned_to?: string | null;
          company_id: string;
          contact_id?: string | null;
          conversation_id: string;
          created_at?: string;
          feedback?: string | null;
          id?: string;
          score?: number | null;
          sent_at?: string;
          status?: string;
          survey_type: string;
          updated_at?: string;
        };
        Update: {
          answered_at?: string | null;
          assigned_to?: string | null;
          company_id?: string;
          contact_id?: string | null;
          conversation_id?: string;
          created_at?: string;
          feedback?: string | null;
          id?: string;
          score?: number | null;
          sent_at?: string;
          status?: string;
          survey_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'satisfaction_surveys_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'satisfaction_surveys_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'satisfaction_surveys_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'satisfaction_surveys_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_filters: {
        Row: {
          company_id: string;
          created_at: string | null;
          filters: Json;
          id: string;
          is_default: boolean | null;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string | null;
          filters?: Json;
          id?: string;
          is_default?: boolean | null;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string | null;
          filters?: Json;
          id?: string;
          is_default?: boolean | null;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_filters_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_filters_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      scoring_rules: {
        Row: {
          company_id: string;
          condition_type: string;
          condition_value: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          points: number;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          condition_type: string;
          condition_value?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          points: number;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          condition_type?: string;
          condition_value?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          points?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scoring_rules_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      sectors: {
        Row: {
          color: string | null;
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          color?: string | null;
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          color?: string | null;
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sectors_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      security_alerts: {
        Row: {
          acknowledged: boolean | null;
          acknowledged_at: string | null;
          acknowledged_by: string | null;
          alert_type: string;
          company_id: string;
          created_at: string;
          description: string;
          id: string;
          metadata: Json | null;
          severity: string;
          user_id: string | null;
        };
        Insert: {
          acknowledged?: boolean | null;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          alert_type: string;
          company_id: string;
          created_at?: string;
          description: string;
          id?: string;
          metadata?: Json | null;
          severity: string;
          user_id?: string | null;
        };
        Update: {
          acknowledged?: boolean | null;
          acknowledged_at?: string | null;
          acknowledged_by?: string | null;
          alert_type?: string;
          company_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          metadata?: Json | null;
          severity?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'security_alerts_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      segments: {
        Row: {
          company_id: string;
          contact_count: number | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          filters: Json;
          id: string;
          is_dynamic: boolean | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          company_id: string;
          contact_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          filters?: Json;
          id?: string;
          is_dynamic?: boolean | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string;
          contact_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          filters?: Json;
          id?: string;
          is_dynamic?: boolean | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'segments_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'segments_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      sso_configurations: {
        Row: {
          attribute_mapping: Json | null;
          auto_provision_users: boolean | null;
          company_id: string;
          created_at: string | null;
          default_role: string | null;
          enforce_sso: boolean | null;
          id: string;
          is_active: boolean | null;
          last_login_at: string | null;
          oauth_authorize_url: string | null;
          oauth_client_id: string | null;
          oauth_client_secret: string | null;
          oauth_scopes: string[] | null;
          oauth_token_url: string | null;
          oauth_userinfo_url: string | null;
          provider: string;
          saml_certificate: string | null;
          saml_entity_id: string | null;
          saml_name_id_format: string | null;
          saml_sso_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          attribute_mapping?: Json | null;
          auto_provision_users?: boolean | null;
          company_id: string;
          created_at?: string | null;
          default_role?: string | null;
          enforce_sso?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          last_login_at?: string | null;
          oauth_authorize_url?: string | null;
          oauth_client_id?: string | null;
          oauth_client_secret?: string | null;
          oauth_scopes?: string[] | null;
          oauth_token_url?: string | null;
          oauth_userinfo_url?: string | null;
          provider: string;
          saml_certificate?: string | null;
          saml_entity_id?: string | null;
          saml_name_id_format?: string | null;
          saml_sso_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          attribute_mapping?: Json | null;
          auto_provision_users?: boolean | null;
          company_id?: string;
          created_at?: string | null;
          default_role?: string | null;
          enforce_sso?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          last_login_at?: string | null;
          oauth_authorize_url?: string | null;
          oauth_client_id?: string | null;
          oauth_client_secret?: string | null;
          oauth_scopes?: string[] | null;
          oauth_token_url?: string | null;
          oauth_userinfo_url?: string | null;
          provider?: string;
          saml_certificate?: string | null;
          saml_entity_id?: string | null;
          saml_name_id_format?: string | null;
          saml_sso_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sso_configurations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      status_stories: {
        Row: {
          background_color: string | null;
          company_id: string;
          content_type: string;
          content_url: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          phone_number: string;
          text_content: string | null;
          user_id: string;
          view_count: number | null;
        };
        Insert: {
          background_color?: string | null;
          company_id: string;
          content_type: string;
          content_url?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          phone_number: string;
          text_content?: string | null;
          user_id: string;
          view_count?: number | null;
        };
        Update: {
          background_color?: string | null;
          company_id?: string;
          content_type?: string;
          content_url?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          phone_number?: string;
          text_content?: string | null;
          user_id?: string;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'status_stories_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      status_views: {
        Row: {
          id: string;
          status_id: string;
          viewed_at: string;
          viewer_number: string;
        };
        Insert: {
          id?: string;
          status_id: string;
          viewed_at?: string;
          viewer_number: string;
        };
        Update: {
          id?: string;
          status_id?: string;
          viewed_at?: string;
          viewer_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'status_views_status_id_fkey';
            columns: ['status_id'];
            isOneToOne: false;
            referencedRelation: 'status_stories';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_plans: {
        Row: {
          created_at: string | null;
          description: string | null;
          features: Json | null;
          id: string;
          is_active: boolean | null;
          is_free_plan: boolean | null;
          max_companies: number | null;
          max_conversations: number | null;
          max_users: number | null;
          name: string;
          order_index: number | null;
          price_monthly: number;
          price_yearly: number;
          slug: string;
          stripe_price_id_monthly: string | null;
          stripe_price_id_yearly: string | null;
          trial_days: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_free_plan?: boolean | null;
          max_companies?: number | null;
          max_conversations?: number | null;
          max_users?: number | null;
          name: string;
          order_index?: number | null;
          price_monthly: number;
          price_yearly: number;
          slug: string;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_free_plan?: boolean | null;
          max_companies?: number | null;
          max_conversations?: number | null;
          max_users?: number | null;
          name?: string;
          order_index?: number | null;
          price_monthly?: number;
          price_yearly?: number;
          slug?: string;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          trial_days?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          assigned_to: string;
          company_id: string;
          completed_at: string | null;
          contact_id: string | null;
          created_at: string | null;
          created_by: string | null;
          deal_id: string | null;
          description: string | null;
          due_date: string;
          id: string;
          priority: string | null;
          reminder_sent: boolean | null;
          status: string | null;
          task_type: string | null;
          title: string;
        };
        Insert: {
          assigned_to: string;
          company_id: string;
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deal_id?: string | null;
          description?: string | null;
          due_date: string;
          id?: string;
          priority?: string | null;
          reminder_sent?: boolean | null;
          status?: string | null;
          task_type?: string | null;
          title: string;
        };
        Update: {
          assigned_to?: string;
          company_id?: string;
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deal_id?: string | null;
          description?: string | null;
          due_date?: string;
          id?: string;
          priority?: string | null;
          reminder_sent?: boolean | null;
          status?: string | null;
          task_type?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_deal_id_fkey';
            columns: ['deal_id'];
            isOneToOne: false;
            referencedRelation: 'deals_with_activity_count';
            referencedColumns: ['id'];
          },
        ];
      };
      teams: {
        Row: {
          color: string | null;
          company_id: string;
          created_at: string | null;
          description: string | null;
          id: string;
          leader_id: string | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          company_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          leader_id?: string | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          company_id?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          leader_id?: string | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'teams_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'teams_leader_id_fkey';
            columns: ['leader_id'];
            isOneToOne: false;
            referencedRelation: 'company_members';
            referencedColumns: ['id'];
          },
        ];
      };
      telegram_bot_commands: {
        Row: {
          action: string | null;
          channel_id: string;
          command: string;
          created_at: string | null;
          description: string;
          id: string;
          is_active: boolean | null;
          response: string | null;
        };
        Insert: {
          action?: string | null;
          channel_id: string;
          command: string;
          created_at?: string | null;
          description: string;
          id?: string;
          is_active?: boolean | null;
          response?: string | null;
        };
        Update: {
          action?: string | null;
          channel_id?: string;
          command?: string;
          created_at?: string | null;
          description?: string;
          id?: string;
          is_active?: boolean | null;
          response?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'telegram_bot_commands_channel_id_fkey';
            columns: ['channel_id'];
            isOneToOne: false;
            referencedRelation: 'channels';
            referencedColumns: ['id'];
          },
        ];
      };
      template_usage_analytics: {
        Row: {
          company_id: string | null;
          conversation_id: string | null;
          created_at: string | null;
          id: string;
          response_received: boolean | null;
          response_time_seconds: number | null;
          template_id: string | null;
          used_at: string | null;
          user_id: string | null;
        };
        Insert: {
          company_id?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          response_received?: boolean | null;
          response_time_seconds?: number | null;
          template_id?: string | null;
          used_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          company_id?: string | null;
          conversation_id?: string | null;
          created_at?: string | null;
          id?: string;
          response_received?: boolean | null;
          response_time_seconds?: number | null;
          template_id?: string | null;
          used_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'template_usage_analytics_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'template_usage_analytics_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'conversations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'template_usage_analytics_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'message_templates';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'template_usage_analytics_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      transcription_configs: {
        Row: {
          api_key: string | null;
          auto_transcribe: boolean | null;
          company_id: string | null;
          created_at: string | null;
          id: string;
          language: string | null;
          model: string | null;
          provider: string | null;
          updated_at: string | null;
        };
        Insert: {
          api_key?: string | null;
          auto_transcribe?: boolean | null;
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          language?: string | null;
          model?: string | null;
          provider?: string | null;
          updated_at?: string | null;
        };
        Update: {
          api_key?: string | null;
          auto_transcribe?: boolean | null;
          company_id?: string | null;
          created_at?: string | null;
          id?: string;
          language?: string | null;
          model?: string | null;
          provider?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'transcription_configs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      two_factor_settings: {
        Row: {
          allowed_methods: string[] | null;
          company_id: string;
          created_at: string | null;
          grace_period_days: number | null;
          id: string;
          require_2fa: boolean | null;
          require_2fa_for_roles: string[] | null;
          totp_issuer: string | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_methods?: string[] | null;
          company_id: string;
          created_at?: string | null;
          grace_period_days?: number | null;
          id?: string;
          require_2fa?: boolean | null;
          require_2fa_for_roles?: string[] | null;
          totp_issuer?: string | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_methods?: string[] | null;
          company_id?: string;
          created_at?: string | null;
          grace_period_days?: number | null;
          id?: string;
          require_2fa?: boolean | null;
          require_2fa_for_roles?: string[] | null;
          totp_issuer?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'two_factor_settings_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      used_recovery_codes: {
        Row: {
          code_hash: string;
          id: string;
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          code_hash: string;
          id?: string;
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          code_hash?: string;
          id?: string;
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'used_recovery_codes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_2fa_status: {
        Row: {
          created_at: string | null;
          email_enabled: boolean | null;
          id: string;
          is_2fa_enabled: boolean | null;
          last_verified_at: string | null;
          sms_enabled: boolean | null;
          sms_phone: string | null;
          totp_backup_codes: string[] | null;
          totp_enabled: boolean | null;
          totp_secret: string | null;
          updated_at: string | null;
          user_id: string;
          webauthn_credentials: Json | null;
          webauthn_enabled: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          is_2fa_enabled?: boolean | null;
          last_verified_at?: string | null;
          sms_enabled?: boolean | null;
          sms_phone?: string | null;
          totp_backup_codes?: string[] | null;
          totp_enabled?: boolean | null;
          totp_secret?: string | null;
          updated_at?: string | null;
          user_id: string;
          webauthn_credentials?: Json | null;
          webauthn_enabled?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          email_enabled?: boolean | null;
          id?: string;
          is_2fa_enabled?: boolean | null;
          last_verified_at?: string | null;
          sms_enabled?: boolean | null;
          sms_phone?: string | null;
          totp_backup_codes?: string[] | null;
          totp_enabled?: boolean | null;
          totp_secret?: string | null;
          updated_at?: string | null;
          user_id?: string;
          webauthn_credentials?: Json | null;
          webauthn_enabled?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_2fa_status_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_achievements: {
        Row: {
          achievement_id: string | null;
          earned_at: string | null;
          id: string;
          user_id: string | null;
        };
        Insert: {
          achievement_id?: string | null;
          earned_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          achievement_id?: string | null;
          earned_at?: string | null;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_achievements_achievement_id_fkey';
            columns: ['achievement_id'];
            isOneToOne: false;
            referencedRelation: 'achievements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_achievements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_roles: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_roles_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_roles_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_subscriptions: {
        Row: {
          billing_period: string;
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          plan_id: string;
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          billing_period: string;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_id: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          billing_period?: string;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          plan_id?: string;
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_subscriptions_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'subscription_plans';
            referencedColumns: ['id'];
          },
        ];
      };
      webhook_deliveries: {
        Row: {
          attempt_count: number | null;
          completed_at: string | null;
          created_at: string | null;
          error_message: string | null;
          event_type: string;
          id: string;
          last_attempt_at: string | null;
          max_attempts: number | null;
          next_retry_at: string | null;
          payload: Json;
          request_body: string | null;
          request_headers: Json | null;
          request_url: string;
          response_body: string | null;
          response_headers: Json | null;
          response_status: number | null;
          status: string | null;
          webhook_id: string;
        };
        Insert: {
          attempt_count?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          event_type: string;
          id?: string;
          last_attempt_at?: string | null;
          max_attempts?: number | null;
          next_retry_at?: string | null;
          payload: Json;
          request_body?: string | null;
          request_headers?: Json | null;
          request_url: string;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status?: number | null;
          status?: string | null;
          webhook_id: string;
        };
        Update: {
          attempt_count?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          event_type?: string;
          id?: string;
          last_attempt_at?: string | null;
          max_attempts?: number | null;
          next_retry_at?: string | null;
          payload?: Json;
          request_body?: string | null;
          request_headers?: Json | null;
          request_url?: string;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status?: number | null;
          status?: string | null;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_deliveries_webhook_id_fkey';
            columns: ['webhook_id'];
            isOneToOne: false;
            referencedRelation: 'webhooks';
            referencedColumns: ['id'];
          },
        ];
      };
      webhook_endpoints: {
        Row: {
          avg_response_time_ms: number | null;
          company_id: string;
          consecutive_failures: number | null;
          created_at: string | null;
          created_by: string | null;
          custom_headers: Json | null;
          disabled_at: string | null;
          enabled: boolean | null;
          events: string[];
          failure_count: number | null;
          id: string;
          last_failure_at: string | null;
          last_failure_reason: string | null;
          last_triggered_at: string | null;
          name: string;
          retry_count: number | null;
          retry_delay_seconds: number | null;
          secret: string;
          successful_deliveries: number | null;
          total_deliveries: number | null;
          updated_at: string | null;
          url: string;
          verified: boolean | null;
          verified_at: string | null;
        };
        Insert: {
          avg_response_time_ms?: number | null;
          company_id: string;
          consecutive_failures?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          custom_headers?: Json | null;
          disabled_at?: string | null;
          enabled?: boolean | null;
          events: string[];
          failure_count?: number | null;
          id?: string;
          last_failure_at?: string | null;
          last_failure_reason?: string | null;
          last_triggered_at?: string | null;
          name: string;
          retry_count?: number | null;
          retry_delay_seconds?: number | null;
          secret: string;
          successful_deliveries?: number | null;
          total_deliveries?: number | null;
          updated_at?: string | null;
          url: string;
          verified?: boolean | null;
          verified_at?: string | null;
        };
        Update: {
          avg_response_time_ms?: number | null;
          company_id?: string;
          consecutive_failures?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          custom_headers?: Json | null;
          disabled_at?: string | null;
          enabled?: boolean | null;
          events?: string[];
          failure_count?: number | null;
          id?: string;
          last_failure_at?: string | null;
          last_failure_reason?: string | null;
          last_triggered_at?: string | null;
          name?: string;
          retry_count?: number | null;
          retry_delay_seconds?: number | null;
          secret?: string;
          successful_deliveries?: number | null;
          total_deliveries?: number | null;
          updated_at?: string | null;
          url?: string;
          verified?: boolean | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_endpoints_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'webhook_endpoints_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      webhook_logs: {
        Row: {
          attempt_number: number | null;
          company_id: string;
          created_at: string | null;
          duration_ms: number | null;
          endpoint_id: string;
          error_message: string | null;
          event_id: string;
          event_type: string;
          id: string;
          next_retry_at: string | null;
          payload: Json;
          responded_at: string | null;
          response_body: string | null;
          response_headers: Json | null;
          response_status: number | null;
          sent_at: string | null;
          status: string | null;
        };
        Insert: {
          attempt_number?: number | null;
          company_id: string;
          created_at?: string | null;
          duration_ms?: number | null;
          endpoint_id: string;
          error_message?: string | null;
          event_id: string;
          event_type: string;
          id?: string;
          next_retry_at?: string | null;
          payload: Json;
          responded_at?: string | null;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status?: number | null;
          sent_at?: string | null;
          status?: string | null;
        };
        Update: {
          attempt_number?: number | null;
          company_id?: string;
          created_at?: string | null;
          duration_ms?: number | null;
          endpoint_id?: string;
          error_message?: string | null;
          event_id?: string;
          event_type?: string;
          id?: string;
          next_retry_at?: string | null;
          payload?: Json;
          responded_at?: string | null;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status?: number | null;
          sent_at?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'webhook_logs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'webhook_logs_endpoint_id_fkey';
            columns: ['endpoint_id'];
            isOneToOne: false;
            referencedRelation: 'webhook_endpoints';
            referencedColumns: ['id'];
          },
        ];
      };
      webhooks: {
        Row: {
          company_id: string;
          created_at: string;
          events: string[];
          failure_count: number;
          id: string;
          is_active: boolean;
          last_response_status: number | null;
          last_triggered_at: string | null;
          name: string;
          retry_count: number | null;
          secret: string;
          secret_key: string | null;
          timeout_seconds: number | null;
          updated_at: string;
          url: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          events?: string[];
          failure_count?: number;
          id?: string;
          is_active?: boolean;
          last_response_status?: number | null;
          last_triggered_at?: string | null;
          name: string;
          retry_count?: number | null;
          secret: string;
          secret_key?: string | null;
          timeout_seconds?: number | null;
          updated_at?: string;
          url: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          events?: string[];
          failure_count?: number;
          id?: string;
          is_active?: boolean;
          last_response_status?: number | null;
          last_triggered_at?: string | null;
          name?: string;
          retry_count?: number | null;
          secret?: string;
          secret_key?: string | null;
          timeout_seconds?: number | null;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'webhooks_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      white_label_settings: {
        Row: {
          brand_accent_color: string | null;
          brand_favicon_url: string | null;
          brand_logo_url: string | null;
          brand_name: string | null;
          brand_primary_color: string | null;
          brand_secondary_color: string | null;
          company_id: string;
          created_at: string | null;
          custom_css: string | null;
          custom_domain: string | null;
          custom_domain_verified: boolean | null;
          custom_domain_verified_at: string | null;
          custom_javascript: string | null;
          custom_privacy_url: string | null;
          custom_terms_url: string | null;
          email_footer_text: string | null;
          email_from_address: string | null;
          email_from_name: string | null;
          email_header_logo_url: string | null;
          email_reply_to: string | null;
          hide_powered_by: boolean | null;
          id: string;
          is_active: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          brand_accent_color?: string | null;
          brand_favicon_url?: string | null;
          brand_logo_url?: string | null;
          brand_name?: string | null;
          brand_primary_color?: string | null;
          brand_secondary_color?: string | null;
          company_id: string;
          created_at?: string | null;
          custom_css?: string | null;
          custom_domain?: string | null;
          custom_domain_verified?: boolean | null;
          custom_domain_verified_at?: string | null;
          custom_javascript?: string | null;
          custom_privacy_url?: string | null;
          custom_terms_url?: string | null;
          email_footer_text?: string | null;
          email_from_address?: string | null;
          email_from_name?: string | null;
          email_header_logo_url?: string | null;
          email_reply_to?: string | null;
          hide_powered_by?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          brand_accent_color?: string | null;
          brand_favicon_url?: string | null;
          brand_logo_url?: string | null;
          brand_name?: string | null;
          brand_primary_color?: string | null;
          brand_secondary_color?: string | null;
          company_id?: string;
          created_at?: string | null;
          custom_css?: string | null;
          custom_domain?: string | null;
          custom_domain_verified?: boolean | null;
          custom_domain_verified_at?: string | null;
          custom_javascript?: string | null;
          custom_privacy_url?: string | null;
          custom_terms_url?: string | null;
          email_footer_text?: string | null;
          email_from_address?: string | null;
          email_from_name?: string | null;
          email_header_logo_url?: string | null;
          email_reply_to?: string | null;
          hide_powered_by?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'white_label_settings_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      widget_conversations: {
        Row: {
          assigned_to: string | null;
          closed_at: string | null;
          company_id: string;
          created_at: string | null;
          feedback: string | null;
          first_message_at: string | null;
          id: string;
          last_message_at: string | null;
          queue_id: string | null;
          rating: number | null;
          resolved_at: string | null;
          status: string | null;
          subject: string | null;
          tags: string[] | null;
          updated_at: string | null;
          visitor_id: string;
        };
        Insert: {
          assigned_to?: string | null;
          closed_at?: string | null;
          company_id: string;
          created_at?: string | null;
          feedback?: string | null;
          first_message_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          queue_id?: string | null;
          rating?: number | null;
          resolved_at?: string | null;
          status?: string | null;
          subject?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          visitor_id: string;
        };
        Update: {
          assigned_to?: string | null;
          closed_at?: string | null;
          company_id?: string;
          created_at?: string | null;
          feedback?: string | null;
          first_message_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          queue_id?: string | null;
          rating?: number | null;
          resolved_at?: string | null;
          status?: string | null;
          subject?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          visitor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'widget_conversations_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'widget_conversations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'widget_conversations_visitor_id_fkey';
            columns: ['visitor_id'];
            isOneToOne: false;
            referencedRelation: 'widget_visitors';
            referencedColumns: ['id'];
          },
        ];
      };
      widget_messages: {
        Row: {
          ai_confidence: number | null;
          company_id: string;
          content: string;
          conversation_id: string;
          created_at: string | null;
          delivered_at: string | null;
          id: string;
          is_from_ai: boolean | null;
          media_type: string | null;
          media_url: string | null;
          message_type: string | null;
          read_at: string | null;
          sender_id: string | null;
          sender_type: string;
          status: string | null;
        };
        Insert: {
          ai_confidence?: number | null;
          company_id: string;
          content: string;
          conversation_id: string;
          created_at?: string | null;
          delivered_at?: string | null;
          id?: string;
          is_from_ai?: boolean | null;
          media_type?: string | null;
          media_url?: string | null;
          message_type?: string | null;
          read_at?: string | null;
          sender_id?: string | null;
          sender_type: string;
          status?: string | null;
        };
        Update: {
          ai_confidence?: number | null;
          company_id?: string;
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          delivered_at?: string | null;
          id?: string;
          is_from_ai?: boolean | null;
          media_type?: string | null;
          media_url?: string | null;
          message_type?: string | null;
          read_at?: string | null;
          sender_id?: string | null;
          sender_type?: string;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'widget_messages_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'widget_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'widget_conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      widget_settings: {
        Row: {
          allowed_domains: string[] | null;
          auto_open_delay: number | null;
          border_radius: number | null;
          business_hours: Json | null;
          business_hours_only: boolean | null;
          button_icon: string | null;
          button_size: string | null;
          company_id: string;
          company_name: string | null;
          created_at: string | null;
          custom_fields: Json | null;
          enabled: boolean | null;
          greeting_message: string | null;
          greeting_title: string | null;
          id: string;
          input_placeholder: string | null;
          logo_url: string | null;
          offline_message: string | null;
          play_sound: boolean | null;
          position: string | null;
          primary_color: string | null;
          require_email: boolean | null;
          require_name: boolean | null;
          require_phone: boolean | null;
          secondary_color: string | null;
          show_agent_name: boolean | null;
          show_agent_photo: boolean | null;
          show_branding: boolean | null;
          show_typing_indicator: boolean | null;
          timezone: string | null;
          total_conversations: number | null;
          total_messages: number | null;
          triggers: Json | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_domains?: string[] | null;
          auto_open_delay?: number | null;
          border_radius?: number | null;
          business_hours?: Json | null;
          business_hours_only?: boolean | null;
          button_icon?: string | null;
          button_size?: string | null;
          company_id: string;
          company_name?: string | null;
          created_at?: string | null;
          custom_fields?: Json | null;
          enabled?: boolean | null;
          greeting_message?: string | null;
          greeting_title?: string | null;
          id?: string;
          input_placeholder?: string | null;
          logo_url?: string | null;
          offline_message?: string | null;
          play_sound?: boolean | null;
          position?: string | null;
          primary_color?: string | null;
          require_email?: boolean | null;
          require_name?: boolean | null;
          require_phone?: boolean | null;
          secondary_color?: string | null;
          show_agent_name?: boolean | null;
          show_agent_photo?: boolean | null;
          show_branding?: boolean | null;
          show_typing_indicator?: boolean | null;
          timezone?: string | null;
          total_conversations?: number | null;
          total_messages?: number | null;
          triggers?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_domains?: string[] | null;
          auto_open_delay?: number | null;
          border_radius?: number | null;
          business_hours?: Json | null;
          business_hours_only?: boolean | null;
          button_icon?: string | null;
          button_size?: string | null;
          company_id?: string;
          company_name?: string | null;
          created_at?: string | null;
          custom_fields?: Json | null;
          enabled?: boolean | null;
          greeting_message?: string | null;
          greeting_title?: string | null;
          id?: string;
          input_placeholder?: string | null;
          logo_url?: string | null;
          offline_message?: string | null;
          play_sound?: boolean | null;
          position?: string | null;
          primary_color?: string | null;
          require_email?: boolean | null;
          require_name?: boolean | null;
          require_phone?: boolean | null;
          secondary_color?: string | null;
          show_agent_name?: boolean | null;
          show_agent_photo?: boolean | null;
          show_branding?: boolean | null;
          show_typing_indicator?: boolean | null;
          timezone?: string | null;
          total_conversations?: number | null;
          total_messages?: number | null;
          triggers?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'widget_settings_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: true;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      widget_visitors: {
        Row: {
          city: string | null;
          company_id: string;
          contact_id: string | null;
          country: string | null;
          created_at: string | null;
          email: string | null;
          fingerprint: string | null;
          first_seen_at: string | null;
          id: string;
          ip_address: string | null;
          landing_page: string | null;
          last_seen_at: string | null;
          metadata: Json | null;
          name: string | null;
          page_views: number | null;
          phone: string | null;
          referrer: string | null;
          session_id: string;
          total_messages: number | null;
          updated_at: string | null;
          user_agent: string | null;
        };
        Insert: {
          city?: string | null;
          company_id: string;
          contact_id?: string | null;
          country?: string | null;
          created_at?: string | null;
          email?: string | null;
          fingerprint?: string | null;
          first_seen_at?: string | null;
          id?: string;
          ip_address?: string | null;
          landing_page?: string | null;
          last_seen_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          page_views?: number | null;
          phone?: string | null;
          referrer?: string | null;
          session_id: string;
          total_messages?: number | null;
          updated_at?: string | null;
          user_agent?: string | null;
        };
        Update: {
          city?: string | null;
          company_id?: string;
          contact_id?: string | null;
          country?: string | null;
          created_at?: string | null;
          email?: string | null;
          fingerprint?: string | null;
          first_seen_at?: string | null;
          id?: string;
          ip_address?: string | null;
          landing_page?: string | null;
          last_seen_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          page_views?: number | null;
          phone?: string | null;
          referrer?: string | null;
          session_id?: string;
          total_messages?: number | null;
          updated_at?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'widget_visitors_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'widget_visitors_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      agent_performance_metrics: {
        Row: {
          agent_id: string | null;
          agent_name: string | null;
          avg_first_response_minutes: number | null;
          company_id: string | null;
          date: string | null;
          max_first_response_minutes: number | null;
          min_first_response_minutes: number | null;
          open_conversations: number | null;
          resolved_conversations: number | null;
          sla_compliance_rate: number | null;
          sla_first_response_breached_count: number | null;
          sla_first_response_met_count: number | null;
          total_conversations: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_assigned_to_fkey';
            columns: ['agent_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'conversations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      audit_logs_view: {
        Row: {
          action: string | null;
          action_label: string | null;
          category: string | null;
          company_id: string | null;
          company_name: string | null;
          created_at: string | null;
          id: string | null;
          metadata: Json | null;
          new_values: Json | null;
          old_values: Json | null;
          resource_id: string | null;
          resource_name: string | null;
          resource_type: string | null;
          resource_type_label: string | null;
          severity: string | null;
          user_agent: string | null;
          user_email: string | null;
          user_id: string | null;
          user_ip: unknown;
          user_name: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_logs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'audit_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'online_users';
            referencedColumns: ['id'];
          },
        ];
      };
      deal_stats_by_stage: {
        Row: {
          average_probability: number | null;
          average_value: number | null;
          color: string | null;
          deal_count: number | null;
          order_index: number | null;
          pipeline_id: string | null;
          stage_id: string | null;
          stage_name: string | null;
          total_value: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'pipeline_stages_pipeline_id_fkey';
            columns: ['pipeline_id'];
            isOneToOne: false;
            referencedRelation: 'pipelines';
            referencedColumns: ['id'];
          },
        ];
      };
      deals_with_activity_count: {
        Row: {
          activity_count: number | null;
          assigned_to: string | null;
          attribution_source_id: string | null;
          budget_confirmed: boolean | null;
          churn_risk_score: number | null;
          company_id: string | null;
          competitor: string | null;
          competitor_strengths: string | null;
          completed_tasks_count: number | null;
          contact_id: string | null;
          created_at: string | null;
          custom_fields: Json | null;
          decision_maker: string | null;
          expected_close_date: string | null;
          files_count: number | null;
          id: string | null;
          last_activity: string | null;
          loss_reason: string | null;
          loss_reason_detail: string | null;
          lost_at: string | null;
          lost_reason: string | null;
          need_identified: string | null;
          next_step: string | null;
          next_step_date: string | null;
          notes_count: number | null;
          our_differentials: string | null;
          pipeline_id: string | null;
          priority: string | null;
          probability: number | null;
          products: Json | null;
          source: string | null;
          stage_id: string | null;
          status: string | null;
          tags: string[] | null;
          tasks_count: number | null;
          temperature: string | null;
          temperature_score: number | null;
          timeline_confirmed: boolean | null;
          title: string | null;
          updated_at: string | null;
          value: number | null;
          win_reason: string | null;
          won_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'deals_assigned_to_fkey';
            columns: ['assigned_to'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deals_attribution_source_id_fkey';
            columns: ['attribution_source_id'];
            isOneToOne: false;
            referencedRelation: 'attribution_sources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deals_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deals_contact_id_fkey';
            columns: ['contact_id'];
            isOneToOne: false;
            referencedRelation: 'contacts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deals_pipeline_id_fkey';
            columns: ['pipeline_id'];
            isOneToOne: false;
            referencedRelation: 'pipelines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'deals_stage_id_fkey';
            columns: ['stage_id'];
            isOneToOne: false;
            referencedRelation: 'deal_stats_by_stage';
            referencedColumns: ['stage_id'];
          },
          {
            foreignKeyName: 'deals_stage_id_fkey';
            columns: ['stage_id'];
            isOneToOne: false;
            referencedRelation: 'pipeline_stages';
            referencedColumns: ['id'];
          },
        ];
      };
      online_users: {
        Row: {
          avatar_url: string | null;
          company_id: string | null;
          display_name: string | null;
          email: string | null;
          full_name: string | null;
          id: string | null;
          is_online: boolean | null;
          last_sign_in_at: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'company_members_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      sla_metrics_view: {
        Row: {
          avg_first_response_minutes: number | null;
          avg_resolution_hours: number | null;
          company_id: string | null;
          date: string | null;
          first_response_breached: number | null;
          first_response_met: number | null;
          first_response_rate: number | null;
          queue_id: string | null;
          queue_name: string | null;
          resolution_breached: number | null;
          resolution_met: number | null;
          resolution_rate: number | null;
          total_conversations: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'conversations_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      anonymize_contact: {
        Args: { p_contact_id: string; p_reason?: string; p_request_id?: string };
        Returns: undefined;
      };
      apply_routing_rules: {
        Args: {
          p_conversation_id: string;
          p_first_message?: string;
          p_is_new_contact?: boolean;
        };
        Returns: Json;
      };
      assign_conversation_to_agent: {
        Args: { p_conversation_id: string; p_queue_id?: string };
        Returns: string;
      };
      bulk_archive_conversations: {
        Args: { p_conversation_ids: string[] };
        Returns: Json;
      };
      bulk_tag_contacts: {
        Args: { p_contact_ids: string[]; p_tag: string };
        Returns: Json;
      };
      bulk_update_conversations: {
        Args: { p_conversation_ids: string[]; p_updates: Json };
        Returns: Json;
      };
      calculate_avg_response_time: {
        Args: {
          p_agent_id?: string;
          p_company_id: string;
          p_end_date?: string;
          p_start_date?: string;
        };
        Returns: {
          avg_response_formatted: string;
          avg_response_seconds: number;
          fastest_response_seconds: number;
          responses_over_30min: number;
          responses_under_30min: number;
          responses_under_5min: number;
          slowest_response_seconds: number;
          total_responses: number;
        }[];
      };
      calculate_deal_temperature_score: {
        Args: { deal_id: string };
        Returns: number;
      };
      calculate_first_response_time: {
        Args: {
          p_company_id: string;
          p_end_date?: string;
          p_start_date?: string;
        };
        Returns: {
          avg_frt_formatted: string;
          avg_frt_seconds: number;
          frt_over_1hour: number;
          frt_under_15min: number;
          frt_under_1hour: number;
          frt_under_5min: number;
          total_conversations: number;
        }[];
      };
      calculate_response_time_by_agent: {
        Args: {
          p_company_id: string;
          p_end_date?: string;
          p_start_date?: string;
        };
        Returns: {
          agent_email: string;
          agent_id: string;
          agent_name: string;
          avg_response_formatted: string;
          avg_response_seconds: number;
          fastest_response_seconds: number;
          total_responses: number;
        }[];
      };
      calculate_response_time_by_hour: {
        Args: {
          p_company_id: string;
          p_end_date?: string;
          p_start_date?: string;
        };
        Returns: {
          avg_response_seconds: number;
          hour_of_day: number;
          total_responses: number;
        }[];
      };
      calculate_response_time_trend: {
        Args: { p_company_id: string };
        Returns: {
          current_period_avg: number;
          previous_period_avg: number;
          trend_direction: string;
          trend_percentage: number;
        }[];
      };
      can_access_platform: { Args: { company_id: string }; Returns: boolean };
      can_create_company: { Args: { parent_id: string }; Returns: boolean };
      can_manage_company_trial: {
        Args: { company_id: string };
        Returns: boolean;
      };
      check_api_rate_limit: {
        Args: { p_api_key_id: string; p_max_requests?: number };
        Returns: Json;
      };
      check_company_access: { Args: { _company_id: string }; Returns: boolean };
      check_member_role: {
        Args: {
          _company_id: string;
          _required_role: Database['public']['Enums']['user_role'];
          _user_id: string;
        };
        Returns: boolean;
      };
      check_permission: {
        Args: {
          p_company_id: string;
          p_permission_key: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      clean_expired_kb_cache: { Args: never; Returns: undefined };
      cleanup_api_logs: { Args: { p_days?: number }; Returns: number };
      cleanup_channel_health_logs: { Args: never; Returns: undefined };
      cleanup_old_audit_logs: {
        Args: { days_to_keep?: number };
        Returns: number;
      };
      count_companies_in_group: { Args: { parent_id: string }; Returns: number };
      create_audit_log: {
        Args: {
          p_action: string;
          p_metadata?: Json;
          p_new_values?: Json;
          p_old_values?: Json;
          p_resource_id?: string;
          p_resource_name?: string;
          p_resource_type: string;
        };
        Returns: string;
      };
      create_company_with_trial: {
        Args: {
          p_cnpj: string;
          p_email: string;
          p_legal_name: string;
          p_name: string;
          p_phone: string;
          p_user_id: string;
        };
        Returns: {
          cnpj: string;
          created_at: string;
          email: string;
          id: string;
          is_active: boolean;
          legal_name: string;
          name: string;
          phone: string;
          subscription_status: string;
          trial_ends_at: string;
          trial_started_at: string;
        }[];
      };
      create_deal_from_conversation: {
        Args: {
          p_conversation_id: string;
          p_deal_title: string;
          p_deal_value?: number;
          p_notes?: string;
          p_pipeline_id?: string;
        };
        Returns: string;
      };
      create_export_job: {
        Args: {
          p_company_id: string;
          p_export_type: string;
          p_filters?: Json;
          p_format?: string;
          p_user_id: string;
        };
        Returns: string;
      };
      create_notification:
        | {
            Args: {
              p_action_url?: string;
              p_company_id: string;
              p_entity_id?: string;
              p_entity_type?: string;
              p_message: string;
              p_metadata?: Json;
              p_title: string;
              p_type?: string;
              p_user_id: string;
            };
            Returns: string;
          }
        | {
            Args: {
              p_body?: string;
              p_conversation_id?: string;
              p_data?: Json;
              p_title: string;
              p_type: string;
              p_url?: string;
              p_user_id: string;
            };
            Returns: string;
          };
      create_webhook_delivery: {
        Args: { p_event_type: string; p_payload: Json; p_webhook_id: string };
        Returns: string;
      };
      detect_duplicates_all_companies: { Args: never; Returns: undefined };
      enroll_contact_in_cadence: {
        Args: {
          p_cadence_id: string;
          p_contact_id: string;
          p_deal_id?: string;
          p_enrolled_by?: string;
        };
        Returns: Json;
      };
      get_active_chatbot: {
        Args: {
          p_channel_type: string;
          p_company_id: string;
          p_trigger_type: string;
          p_trigger_value?: string;
        };
        Returns: string;
      };
      get_agent_performance: {
        Args: {
          p_agent_id: string;
          p_company_id: string;
          p_end_date?: string;
          p_start_date?: string;
        };
        Returns: Json;
      };
      get_agents_ranking: {
        Args: {
          p_company_id: string;
          p_end_date?: string;
          p_limit?: number;
          p_metric?: string;
          p_start_date?: string;
        };
        Returns: Json;
      };
      get_contact_metrics: { Args: { p_contact_id: string }; Returns: Json };
      get_conversations_chart: {
        Args: {
          p_company_id: string;
          p_end_date?: string;
          p_interval?: string;
          p_start_date?: string;
        };
        Returns: Json;
      };
      get_dashboard_metrics: {
        Args: {
          p_company_id: string;
          p_end_date?: string;
          p_start_date?: string;
        };
        Returns: Json;
      };
      get_default_whatsapp_channel: {
        Args: { p_company_id: string };
        Returns: string;
      };
      get_trial_info: {
        Args: { _company_id: string };
        Returns: {
          can_access: boolean;
          days_remaining: number;
          is_trial_active: boolean;
          trial_ends_at: string;
        }[];
      };
      get_user_company:
        | { Args: never; Returns: string }
        | { Args: { _user_id: string }; Returns: string };
      get_user_company_ids: { Args: { _user_id: string }; Returns: string[] };
      get_user_permissions: {
        Args: { p_company_id: string; p_user_id: string };
        Returns: Json;
      };
      handle_cadence_reply: {
        Args: { p_company_id: string; p_contact_id: string };
        Returns: Json;
      };
      handle_snooze_expiration: { Args: never; Returns: undefined };
      has_role: {
        Args: {
          _company_id: string;
          _role: Database['public']['Enums']['app_role'];
          _user_id: string;
        };
        Returns: boolean;
      };
      increment_channel_stats: {
        Args: { p_amount?: number; p_channel_id: string; p_stat: string };
        Returns: undefined;
      };
      increment_chatbot_stats: {
        Args: { p_amount?: number; p_chatbot_id: string; p_stat: string };
        Returns: undefined;
      };
      increment_unread: { Args: { conv_id: string }; Returns: number };
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean };
      is_trial_expired: { Args: { company_id: string }; Returns: boolean };
      log_auth_event: {
        Args: {
          p_event_type: string;
          p_ip_address?: unknown;
          p_metadata?: Json;
          p_user_agent?: string;
          p_user_email?: string;
          p_user_id?: string;
        };
        Returns: string;
      };
      log_data_export: {
        Args: {
          p_export_format: string;
          p_filters?: Json;
          p_record_count: number;
          p_resource_type: string;
        };
        Returns: string;
      };
      log_settings_change: {
        Args: {
          p_new_values: Json;
          p_old_values: Json;
          p_settings_type: string;
        };
        Returns: string;
      };
      log_unauthorized_access: {
        Args: {
          _action: string;
          _attempted_company_id: string;
          _metadata?: Json;
          _table_name: string;
          _user_id: string;
        };
        Returns: undefined;
      };
      match_conversations: {
        Args: {
          match_count?: number;
          match_threshold?: number;
          query_embedding: string;
        };
        Returns: {
          content: string;
          conversation_id: string;
          id: string;
          similarity: number;
        }[];
      };
      notify_inactive_deals: { Args: never; Returns: undefined };
      notify_overdue_tasks: { Args: never; Returns: undefined };
      process_pending_cadence_steps: { Args: never; Returns: Json };
      refresh_agent_performance_metrics: { Args: never; Returns: undefined };
      search_audit_logs: {
        Args: {
          p_action?: string;
          p_company_id: string;
          p_end_date?: string;
          p_limit?: number;
          p_offset?: number;
          p_resource_type?: string;
          p_start_date?: string;
          p_user_id?: string;
        };
        Returns: Json;
      };
      search_kb_chunks: {
        Args: {
          filter_company_id?: string;
          match_count?: number;
          query_embedding: string;
          similarity_threshold?: number;
        };
        Returns: {
          chunk_id: string;
          content: string;
          document_id: string;
          document_source: string;
          document_title: string;
          metadata: Json;
          similarity: number;
        }[];
      };
      snooze_conversation: {
        Args: { p_conversation_id: string; p_reason?: string; p_until: string };
        Returns: Json;
      };
      trigger_webhooks: {
        Args: { p_company_id: string; p_event_type: string; p_payload: Json };
        Returns: number;
      };
      unsnooze_conversation: {
        Args: { p_conversation_id: string };
        Returns: Json;
      };
      update_enrollment_status: {
        Args: { p_enrollment_id: string; p_reason?: string; p_status: string };
        Returns: Json;
      };
      update_webhook_delivery: {
        Args: {
          p_delivery_id: string;
          p_error_message?: string;
          p_response_body?: string;
          p_status_code: number;
        };
        Returns: undefined;
      };
      user_has_access_to_company: {
        Args: { _company_id: string; _user_id: string };
        Returns: boolean;
      };
      user_has_permission: {
        Args: {
          p_company_id: string;
          p_permission_key: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      validate_api_key: {
        Args: { p_key_hash: string };
        Returns: {
          api_key_id: string;
          company_id: string;
          permissions: string[];
          rate_limit_per_minute: number;
          scopes: string[];
        }[];
      };
    };
    Enums: {
      app_role: 'admin' | 'manager' | 'agent' | 'viewer';
      channel_type:
        | 'whatsapp'
        | 'instagram'
        | 'messenger'
        | 'telegram'
        | 'widget'
        | 'email'
        | 'sms'
        | 'voice_call';
      conversation_status: 'waiting' | 're_entry' | 'active' | 'chatbot' | 'closed';
      user_role: 'owner' | 'admin' | 'manager' | 'supervisor' | 'seller' | 'viewer';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ['admin', 'manager', 'agent', 'viewer'],
      channel_type: [
        'whatsapp',
        'instagram',
        'messenger',
        'telegram',
        'widget',
        'email',
        'sms',
        'voice_call',
      ],
      conversation_status: ['waiting', 're_entry', 'active', 'chatbot', 'closed'],
      user_role: ['owner', 'admin', 'manager', 'supervisor', 'seller', 'viewer'],
    },
  },
} as const;
