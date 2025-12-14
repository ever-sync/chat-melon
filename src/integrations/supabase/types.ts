export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_audit_log: {
        Row: {
          action: string
          company_id: string
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          record_id: string | null
          status: string
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          status: string
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          status?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          badge_url: string | null
          company_id: string | null
          created_at: string | null
          criteria: Json
          description: string | null
          icon: string | null
          id: string
          name: string
          points: number | null
        }
        Insert: {
          badge_url?: string | null
          company_id?: string | null
          created_at?: string | null
          criteria: Json
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points?: number | null
        }
        Update: {
          badge_url?: string | null
          company_id?: string | null
          created_at?: string | null
          criteria?: Json
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "achievements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_status: {
        Row: {
          company_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_status_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          action_data: Json | null
          action_type: string | null
          company_id: string
          created_at: string | null
          data: Json | null
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          is_actionable: boolean | null
          is_read: boolean | null
          priority: string | null
          title: string
        }
        Insert: {
          action_data?: Json | null
          action_type?: string | null
          company_id: string
          created_at?: string | null
          data?: Json | null
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          title: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string | null
          company_id?: string
          created_at?: string | null
          data?: Json | null
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_actionable?: boolean | null
          is_read?: boolean | null
          priority?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_metrics_daily: {
        Row: {
          avg_confidence: number | null
          avg_response_time_ms: number | null
          company_id: string
          conversations_handled: number | null
          created_at: string | null
          deals_created: number | null
          handoffs_automatic: number | null
          handoffs_requested: number | null
          handoffs_sentiment: number | null
          handoffs_total: number | null
          id: string
          intents_detected: Json | null
          leads_qualified: number | null
          messages_received: number | null
          messages_sent: number | null
          metric_date: string
          resolved_with_human: number | null
          resolved_without_human: number | null
          sentiment_negative: number | null
          sentiment_neutral: number | null
          sentiment_positive: number | null
        }
        Insert: {
          avg_confidence?: number | null
          avg_response_time_ms?: number | null
          company_id: string
          conversations_handled?: number | null
          created_at?: string | null
          deals_created?: number | null
          handoffs_automatic?: number | null
          handoffs_requested?: number | null
          handoffs_sentiment?: number | null
          handoffs_total?: number | null
          id?: string
          intents_detected?: Json | null
          leads_qualified?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          metric_date: string
          resolved_with_human?: number | null
          resolved_without_human?: number | null
          sentiment_negative?: number | null
          sentiment_neutral?: number | null
          sentiment_positive?: number | null
        }
        Update: {
          avg_confidence?: number | null
          avg_response_time_ms?: number | null
          company_id?: string
          conversations_handled?: number | null
          created_at?: string | null
          deals_created?: number | null
          handoffs_automatic?: number | null
          handoffs_requested?: number | null
          handoffs_sentiment?: number | null
          handoffs_total?: number | null
          id?: string
          intents_detected?: Json | null
          leads_qualified?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          metric_date?: string
          resolved_with_human?: number | null
          resolved_without_human?: number | null
          sentiment_negative?: number | null
          sentiment_neutral?: number | null
          sentiment_positive?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_metrics_daily_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          active_hours_end: string | null
          active_hours_start: string | null
          active_on_weekends: boolean | null
          company_id: string
          created_at: string | null
          default_mode: string | null
          fallback_message: string | null
          greeting_message: string | null
          handoff_keywords: string[] | null
          handoff_message: string | null
          handoff_on_high_value: boolean | null
          handoff_on_negative_sentiment: boolean | null
          high_value_threshold: number | null
          id: string
          is_enabled: boolean | null
          language: string | null
          max_messages_before_handoff: number | null
          max_response_length: number | null
          n8n_api_key: string | null
          n8n_webhook_url: string | null
          personality: string | null
          response_delay_ms: number | null
          system_prompt: string | null
          typing_indicator: boolean | null
          updated_at: string | null
        }
        Insert: {
          active_hours_end?: string | null
          active_hours_start?: string | null
          active_on_weekends?: boolean | null
          company_id: string
          created_at?: string | null
          default_mode?: string | null
          fallback_message?: string | null
          greeting_message?: string | null
          handoff_keywords?: string[] | null
          handoff_message?: string | null
          handoff_on_high_value?: boolean | null
          handoff_on_negative_sentiment?: boolean | null
          high_value_threshold?: number | null
          id?: string
          is_enabled?: boolean | null
          language?: string | null
          max_messages_before_handoff?: number | null
          max_response_length?: number | null
          n8n_api_key?: string | null
          n8n_webhook_url?: string | null
          personality?: string | null
          response_delay_ms?: number | null
          system_prompt?: string | null
          typing_indicator?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active_hours_end?: string | null
          active_hours_start?: string | null
          active_on_weekends?: boolean | null
          company_id?: string
          created_at?: string | null
          default_mode?: string | null
          fallback_message?: string | null
          greeting_message?: string | null
          handoff_keywords?: string[] | null
          handoff_message?: string | null
          handoff_on_high_value?: boolean | null
          handoff_on_negative_sentiment?: boolean | null
          high_value_threshold?: number | null
          id?: string
          is_enabled?: boolean | null
          language?: string | null
          max_messages_before_handoff?: number | null
          max_response_length?: number | null
          n8n_api_key?: string | null
          n8n_webhook_url?: string | null
          personality?: string | null
          response_delay_ms?: number | null
          system_prompt?: string | null
          typing_indicator?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          company_id: string
          confidence: number | null
          contact_id: string | null
          content: string
          conversation_id: string
          created_at: string | null
          dismissed_reason: string | null
          expires_at: string | null
          id: string
          priority: string | null
          related_product_id: string | null
          status: string | null
          suggestion_type: string
          title: string
          trigger_message_id: string | null
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          company_id: string
          confidence?: number | null
          contact_id?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          dismissed_reason?: string | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          related_product_id?: string | null
          status?: string | null
          suggestion_type: string
          title: string
          trigger_message_id?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          company_id?: string
          confidence?: number | null
          contact_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          dismissed_reason?: string | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          related_product_id?: string | null
          status?: string | null
          suggestion_type?: string
          title?: string
          trigger_message_id?: string | null
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_related_product_id_fkey"
            columns: ["related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_trigger_message_id_fkey"
            columns: ["trigger_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_contacts: {
        Row: {
          blocked_at: string
          blocked_number: string
          company_id: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          blocked_at?: string
          blocked_number: string
          company_id: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          blocked_at?: string
          blocked_number?: string
          company_id?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync: {
        Row: {
          company_id: string | null
          created_at: string | null
          google_event_id: string
          id: string
          last_synced_at: string | null
          sync_direction: string | null
          task_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          google_event_id: string
          id?: string
          last_synced_at?: string | null
          sync_direction?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          google_event_id?: string
          id?: string
          last_synced_at?: string | null
          sync_direction?: string | null
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: true
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_contacts: {
        Row: {
          campaign_id: string
          contact_id: string
          delivered_at: string | null
          error_message: string | null
          id: string
          read_at: string | null
          replied_at: string | null
          reply_message: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          contact_id: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          replied_at?: string | null
          reply_message?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          contact_id?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          read_at?: string | null
          replied_at?: string | null
          reply_message?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          business_hours_end: string | null
          business_hours_only: boolean | null
          business_hours_start: string | null
          company_id: string
          completed_at: string | null
          contact_filter: Json | null
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          description: string | null
          failed_count: number | null
          id: string
          instance_id: string | null
          message_content: string
          message_media_url: string | null
          message_type: string | null
          name: string
          read_count: number | null
          reply_count: number | null
          schedule_at: string | null
          segment_id: string | null
          sending_rate: number | null
          sent_count: number | null
          started_at: string | null
          status: string | null
          total_contacts: number | null
        }
        Insert: {
          business_hours_end?: string | null
          business_hours_only?: boolean | null
          business_hours_start?: string | null
          company_id: string
          completed_at?: string | null
          contact_filter?: Json | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          failed_count?: number | null
          id?: string
          instance_id?: string | null
          message_content: string
          message_media_url?: string | null
          message_type?: string | null
          name: string
          read_count?: number | null
          reply_count?: number | null
          schedule_at?: string | null
          segment_id?: string | null
          sending_rate?: number | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          total_contacts?: number | null
        }
        Update: {
          business_hours_end?: string | null
          business_hours_only?: boolean | null
          business_hours_start?: string | null
          company_id?: string
          completed_at?: string | null
          contact_filter?: Json | null
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          failed_count?: number | null
          id?: string
          instance_id?: string | null
          message_content?: string
          message_media_url?: string | null
          message_type?: string | null
          name?: string
          read_count?: number | null
          reply_count?: number | null
          schedule_at?: string | null
          segment_id?: string | null
          sending_rate?: number | null
          sent_count?: number | null
          started_at?: string | null
          status?: string | null
          total_contacts?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "evolution_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          business_hours: Json | null
          business_status: string | null
          city: string | null
          cnpj: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          state: string | null
          status: string | null
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_hours?: Json | null
          business_status?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_hours?: Json | null
          business_status?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      company_faqs: {
        Row: {
          answer: string
          company_id: string
          created_at: string
          id: string
          question: string
          updated_at: string
          category_id: string | null
        }
        Insert: {
          answer: string
          company_id: string
          created_at?: string
          id?: string
          question: string
          updated_at?: string
          category_id?: string | null
        }
        Update: {
          answer?: string
          company_id?: string
          created_at?: string
          id?: string
          question?: string
          updated_at?: string
          category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_faqs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_faqs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "faq_categories"
            referencedColumns: ["id"]
          },
        ]
      },
      faq_categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "faq_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      },
    },
    document_categories: {
      Row: {
        company_id: string
        created_at: string
        id: string
        name: string
      }
      Insert: {
        company_id: string
        created_at?: string
        id?: string
        name: string
      }
      Update: {
        company_id?: string
        created_at?: string
        id?: string
        name?: string
      }
      Relationships: [
        {
          foreignKeyName: "document_categories_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    },
    company_documents: {
      Row: {
        category_id: string | null
        company_id: string
        created_at: string
        description: string | null
        file_size: string | null
        file_type: string
        file_url: string
        id: string
        title: string
        updated_at: string
      }
      Insert: {
        category_id?: string | null
        company_id: string
        created_at?: string
        description?: string | null
        file_size?: string | null
        file_type: string
        file_url: string
        id?: string
        title: string
        updated_at?: string
      }
      Update: {
        category_id?: string | null
        company_id?: string
        created_at?: string
        description?: string | null
        file_size?: string | null
        file_type?: string
        file_url?: string
        id?: string
        title?: string
        updated_at?: string
      }
      Relationships: [
        {
          foreignKeyName: "company_documents_category_id_fkey"
          columns: ["category_id"]
          isOneToOne: false
          referencedRelation: "document_categories"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "company_documents_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    },
    company_invites: {
      Row: {
        company_id: string
        created_at: string | null
        email: string
        expires_at: string | null
        id: string
        invited_by: string | null
        role: Database["public"]["Enums"]["user_role"]
        status: string | null
        team_id: string | null
      }
      Insert: {
        company_id: string
        created_at?: string | null
        email: string
        expires_at?: string | null
        id?: string
        invited_by?: string | null
        role?: Database["public"]["Enums"]["user_role"]
        status?: string | null
        team_id?: string | null
      }
      Update: {
        company_id?: string
        created_at?: string | null
        email?: string
        expires_at?: string | null
        id?: string
        invited_by?: string | null
        role?: Database["public"]["Enums"]["user_role"]
        status?: string | null
        team_id?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "company_invites_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "company_invites_team_id_fkey"
          columns: ["team_id"]
          isOneToOne: false
          referencedRelation: "teams"
          referencedColumns: ["id"]
        },
      ]
    }
    company_members: {
      Row: {
        avatar_url: string | null
        can_receive_chats: boolean | null
        company_id: string
        created_at: string | null
        current_status: string | null
        display_name: string | null
        email: string | null
        id: string
        is_active: boolean | null
        is_online: boolean | null
        last_seen_at: string | null
        max_concurrent_chats: number | null
        phone: string | null
        reports_to: string | null
        role: Database["public"]["Enums"]["user_role"]
        team_id: string | null
        updated_at: string | null
        user_id: string
        working_hours: Json | null
      }
      Insert: {
        avatar_url?: string | null
        can_receive_chats?: boolean | null
        company_id: string
        created_at?: string | null
        current_status?: string | null
        display_name?: string | null
        email?: string | null
        id?: string
        is_active?: boolean | null
        is_online?: boolean | null
        last_seen_at?: string | null
        max_concurrent_chats?: number | null
        phone?: string | null
        reports_to?: string | null
        role?: Database["public"]["Enums"]["user_role"]
        team_id?: string | null
        updated_at?: string | null
        user_id: string
        working_hours?: Json | null
      }
      Update: {
        avatar_url?: string | null
        can_receive_chats?: boolean | null
        company_id?: string
        created_at?: string | null
        current_status?: string | null
        display_name?: string | null
        email?: string | null
        id?: string
        is_active?: boolean | null
        is_online?: boolean | null
        last_seen_at?: string | null
        max_concurrent_chats?: number | null
        phone?: string | null
        reports_to?: string | null
        role?: Database["public"]["Enums"]["user_role"]
        team_id?: string | null
        updated_at?: string | null
        user_id?: string
        working_hours?: Json | null
      }
      Relationships: [
        {
          foreignKeyName: "company_members_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "company_members_reports_to_fkey"
          columns: ["reports_to"]
          isOneToOne: false
          referencedRelation: "company_members"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "company_members_team_id_fkey"
          columns: ["team_id"]
          isOneToOne: false
          referencedRelation: "teams"
          referencedColumns: ["id"]
        },
      ]
    }
    company_users: {
      Row: {
        company_id: string
        created_at: string
        id: string
        is_default: boolean | null
        user_id: string
      }
      Insert: {
        company_id: string
        created_at?: string
        id?: string
        is_default?: boolean | null
        user_id: string
      }
      Update: {
        company_id?: string
        created_at?: string
        id?: string
        is_default?: boolean | null
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "company_users_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    contact_duplicates: {
      Row: {
        company_id: string
        contact_id_1: string
        contact_id_2: string
        created_at: string
        id: string
        match_reason: string
        merged_at: string | null
        merged_by: string | null
        merged_into: string | null
        similarity_score: number
        status: string
        updated_at: string
      }
      Insert: {
        company_id: string
        contact_id_1: string
        contact_id_2: string
        created_at?: string
        id?: string
        match_reason: string
        merged_at?: string | null
        merged_by?: string | null
        merged_into?: string | null
        similarity_score?: number
        status?: string
        updated_at?: string
      }
      Update: {
        company_id?: string
        contact_id_1?: string
        contact_id_2?: string
        created_at?: string
        id?: string
        match_reason?: string
        merged_at?: string | null
        merged_by?: string | null
        merged_into?: string | null
        similarity_score?: number
        status?: string
        updated_at?: string
      }
      Relationships: [
        {
          foreignKeyName: "contact_duplicates_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "contact_duplicates_contact_id_1_fkey"
          columns: ["contact_id_1"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "contact_duplicates_contact_id_2_fkey"
          columns: ["contact_id_2"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "contact_duplicates_merged_by_fkey"
          columns: ["merged_by"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "contact_duplicates_merged_into_fkey"
          columns: ["merged_into"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
      ]
    }
    contact_notes: {
      Row: {
        company_id: string
        contact_id: string
        created_at: string | null
        id: string
        is_pinned: boolean | null
        note: string
        updated_at: string | null
        user_id: string
      }
      Insert: {
        company_id: string
        contact_id: string
        created_at?: string | null
        id?: string
        is_pinned?: boolean | null
        note: string
        updated_at?: string | null
        user_id: string
      }
      Update: {
        company_id?: string
        contact_id?: string
        created_at?: string | null
        id?: string
        is_pinned?: boolean | null
        note?: string
        updated_at?: string | null
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "contact_notes_contact_id_fkey"
          columns: ["contact_id"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
      ]
    }
    contacts: {
      Row: {
        about_status: string | null
        ai_last_analyzed_at: string | null
        ai_next_best_action: string | null
        ai_qualification_level: string | null
        ai_summary: string | null
        ai_tags: string[] | null
        company_cnpj: string | null
        company_data: Json | null
        company_id: string
        created_at: string
        deleted_at: string | null
        enriched_at: string | null
        enrichment_data: Json | null
        enrichment_status: string | null
        id: string
        is_business: boolean | null
        lead_score: number | null
        linkedin_url: string | null
        merged_into: string | null
        name: string | null
        phone_number: string
        profile_pic_cached_path: string | null
        profile_pic_updated_at: string | null
        profile_pic_url: string | null
        push_name: string | null
        score_breakdown: Json | null
        score_updated_at: string | null
        updated_at: string
        verified_name: string | null
      }
      Insert: {
        about_status?: string | null
        ai_last_analyzed_at?: string | null
        ai_next_best_action?: string | null
        ai_qualification_level?: string | null
        ai_summary?: string | null
        ai_tags?: string[] | null
        company_cnpj?: string | null
        company_data?: Json | null
        company_id: string
        created_at?: string
        deleted_at?: string | null
        enriched_at?: string | null
        enrichment_data?: Json | null
        enrichment_status?: string | null
        id?: string
        is_business?: boolean | null
        lead_score?: number | null
        linkedin_url?: string | null
        merged_into?: string | null
        name?: string | null
        phone_number: string
        profile_pic_cached_path?: string | null
        profile_pic_updated_at?: string | null
        profile_pic_url?: string | null
        push_name?: string | null
        score_breakdown?: Json | null
        score_updated_at?: string | null
        updated_at?: string
        verified_name?: string | null
      }
      Update: {
        about_status?: string | null
        ai_last_analyzed_at?: string | null
        ai_next_best_action?: string | null
        ai_qualification_level?: string | null
        ai_summary?: string | null
        ai_tags?: string[] | null
        company_cnpj?: string | null
        company_data?: Json | null
        company_id?: string
        created_at?: string
        deleted_at?: string | null
        enriched_at?: string | null
        enrichment_data?: Json | null
        enrichment_status?: string | null
        id?: string
        is_business?: boolean | null
        lead_score?: number | null
        linkedin_url?: string | null
        merged_into?: string | null
        name?: string | null
        phone_number?: string
        profile_pic_cached_path?: string | null
        profile_pic_updated_at?: string | null
        profile_pic_url?: string | null
        push_name?: string | null
        score_breakdown?: Json | null
        score_updated_at?: string | null
        updated_at?: string
        verified_name?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "contacts_merged_into_fkey"
          columns: ["merged_into"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
      ]
    }
    conversation_embeddings: {
      Row: {
        content: string
        conversation_id: string | null
        created_at: string | null
        embedding: string | null
        id: string
        metadata: Json | null
      }
      Insert: {
        content: string
        conversation_id?: string | null
        created_at?: string | null
        embedding?: string | null
        id?: string
        metadata?: Json | null
      }
      Update: {
        content?: string
        conversation_id?: string | null
        created_at?: string | null
        embedding?: string | null
        id?: string
        metadata?: Json | null
      }
      Relationships: [
        {
          foreignKeyName: "conversation_embeddings_conversation_id_fkey"
          columns: ["conversation_id"]
          isOneToOne: false
          referencedRelation: "conversations"
          referencedColumns: ["id"]
        },
      ]
    }
    conversation_labels: {
      Row: {
        conversation_id: string
        created_at: string | null
        id: string
        label_id: string
      }
      Insert: {
        conversation_id: string
        created_at?: string | null
        id?: string
        label_id: string
      }
      Update: {
        conversation_id?: string
        created_at?: string | null
        id?: string
        label_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "conversation_labels_conversation_id_fkey"
          columns: ["conversation_id"]
          isOneToOne: false
          referencedRelation: "conversations"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "conversation_labels_label_id_fkey"
          columns: ["label_id"]
          isOneToOne: false
          referencedRelation: "labels"
          referencedColumns: ["id"]
        },
      ]
    }
    conversation_notes: {
      Row: {
        content: string
        conversation_id: string
        created_at: string | null
        id: string
        metadata: Json | null
        note_type: string
        user_id: string | null
      }
      Insert: {
        content: string
        conversation_id: string
        created_at?: string | null
        id?: string
        metadata?: Json | null
        note_type?: string
        user_id?: string | null
      }
      Update: {
        content?: string
        conversation_id?: string
        created_at?: string | null
        id?: string
        metadata?: Json | null
        note_type?: string
        user_id?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "conversation_notes_conversation_id_fkey"
          columns: ["conversation_id"]
          isOneToOne: false
          referencedRelation: "conversations"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "conversation_notes_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
      ]
    }
    conversations: {
      Row: {
        ai_enabled: boolean | null
        ai_handoff_at: string | null
        ai_handoff_reason: string | null
        ai_messages_count: number | null
        ai_mode: string | null
        ai_next_step_suggestion: string | null
        ai_paused_at: string | null
        ai_paused_by: string | null
        ai_paused_reason: string | null
        ai_summary: string | null
        ai_summary_updated_at: string | null
        assigned_to: string | null
        company_id: string | null
        contact_id: string | null
        contact_name: string
        contact_number: string
        created_at: string
        id: string
        is_online: boolean | null
        is_recording: boolean | null
        is_typing: boolean | null
        last_message: string | null
        last_message_time: string | null
        last_seen: string | null
        opted_in: boolean | null
        profile_pic_url: string | null
        queue_id: string | null
        sector_id: string | null
        status: Database["public"]["Enums"]["conversation_status"] | null
        tags: string[] | null
        unread_count: number | null
        updated_at: string
        user_id: string
      }
      Insert: {
        ai_enabled?: boolean | null
        ai_handoff_at?: string | null
        ai_handoff_reason?: string | null
        ai_messages_count?: number | null
        ai_mode?: string | null
        ai_next_step_suggestion?: string | null
        ai_paused_at?: string | null
        ai_paused_by?: string | null
        ai_paused_reason?: string | null
        ai_summary?: string | null
        ai_summary_updated_at?: string | null
        assigned_to?: string | null
        company_id?: string | null
        contact_id?: string | null
        contact_name: string
        contact_number: string
        created_at?: string
        id?: string
        is_online?: boolean | null
        is_recording?: boolean | null
        is_typing?: boolean | null
        last_message?: string | null
        last_message_time?: string | null
        last_seen?: string | null
        opted_in?: boolean | null
        profile_pic_url?: string | null
        queue_id?: string | null
        sector_id?: string | null
        status?: Database["public"]["Enums"]["conversation_status"] | null
        tags?: string[] | null
        unread_count?: number | null
        updated_at?: string
        user_id: string
      }
      Update: {
        ai_enabled?: boolean | null
        ai_handoff_at?: string | null
        ai_handoff_reason?: string | null
        ai_messages_count?: number | null
        ai_mode?: string | null
        ai_next_step_suggestion?: string | null
        ai_paused_at?: string | null
        ai_paused_by?: string | null
        ai_paused_reason?: string | null
        ai_summary?: string | null
        ai_summary_updated_at?: string | null
        assigned_to?: string | null
        company_id?: string | null
        contact_id?: string | null
        contact_name?: string
        contact_number?: string
        created_at?: string
        id?: string
        is_online?: boolean | null
        is_recording?: boolean | null
        is_typing?: boolean | null
        last_message?: string | null
        last_message_time?: string | null
        last_seen?: string | null
        opted_in?: boolean | null
        profile_pic_url?: string | null
        queue_id?: string | null
        sector_id?: string | null
        status?: Database["public"]["Enums"]["conversation_status"] | null
        tags?: string[] | null
        unread_count?: number | null
        updated_at?: string
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "conversations_ai_paused_by_fkey"
          columns: ["ai_paused_by"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "conversations_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "conversations_contact_id_fkey"
          columns: ["contact_id"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "conversations_queue_id_fkey"
          columns: ["queue_id"]
          isOneToOne: false
          referencedRelation: "queues"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "conversations_sector_id_fkey"
          columns: ["sector_id"]
          isOneToOne: false
          referencedRelation: "sectors"
          referencedColumns: ["id"]
        },
      ]
    }
    custom_field_values: {
      Row: {
        created_at: string | null
        custom_field_id: string
        entity_id: string
        id: string
        updated_at: string | null
        value: string | null
      }
      Insert: {
        created_at?: string | null
        custom_field_id: string
        entity_id: string
        id?: string
        updated_at?: string | null
        value?: string | null
      }
      Update: {
        created_at?: string | null
        custom_field_id?: string
        entity_id?: string
        id?: string
        updated_at?: string | null
        value?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "custom_field_values_custom_field_id_fkey"
          columns: ["custom_field_id"]
          isOneToOne: false
          referencedRelation: "custom_fields"
          referencedColumns: ["id"]
        },
      ]
    }
    custom_fields: {
      Row: {
        company_id: string
        created_at: string | null
        default_value: string | null
        display_order: number | null
        entity_type: string
        field_label: string
        field_name: string
        field_type: string
        id: string
        is_active: boolean | null
        is_required: boolean | null
        options: Json | null
        updated_at: string | null
      }
      Insert: {
        company_id: string
        created_at?: string | null
        default_value?: string | null
        display_order?: number | null
        entity_type: string
        field_label: string
        field_name: string
        field_type: string
        id?: string
        is_active?: boolean | null
        is_required?: boolean | null
        options?: Json | null
        updated_at?: string | null
      }
      Update: {
        company_id?: string
        created_at?: string | null
        default_value?: string | null
        display_order?: number | null
        entity_type?: string
        field_label?: string
        field_name?: string
        field_type?: string
        id?: string
        is_active?: boolean | null
        is_required?: boolean | null
        options?: Json | null
        updated_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "custom_fields_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    deal_activities: {
      Row: {
        activity_type: string
        created_at: string | null
        deal_id: string
        description: string | null
        id: string
        metadata: Json | null
        user_id: string | null
      }
      Insert: {
        activity_type: string
        created_at?: string | null
        deal_id: string
        description?: string | null
        id?: string
        metadata?: Json | null
        user_id?: string | null
      }
      Update: {
        activity_type?: string
        created_at?: string | null
        deal_id?: string
        description?: string | null
        id?: string
        metadata?: Json | null
        user_id?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "deal_activities_deal_id_fkey"
          columns: ["deal_id"]
          isOneToOne: false
          referencedRelation: "deals"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "deal_activities_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
      ]
    }
    deals: {
      Row: {
        assigned_to: string | null
        budget_confirmed: boolean | null
        churn_risk_score: number | null
        company_id: string
        competitor: string | null
        competitor_strengths: string | null
        contact_id: string
        created_at: string | null
        custom_fields: Json | null
        decision_maker: string | null
        expected_close_date: string | null
        id: string
        last_activity: string | null
        loss_reason: string | null
        loss_reason_detail: string | null
        lost_at: string | null
        lost_reason: string | null
        need_identified: string | null
        next_step: string | null
        next_step_date: string | null
        our_differentials: string | null
        pipeline_id: string
        priority: string | null
        probability: number | null
        products: Json | null
        stage_id: string
        status: string | null
        temperature: string | null
        temperature_score: number | null
        timeline_confirmed: boolean | null
        title: string
        updated_at: string | null
        value: number | null
        win_reason: string | null
        won_at: string | null
      }
      Insert: {
        assigned_to?: string | null
        budget_confirmed?: boolean | null
        churn_risk_score?: number | null
        company_id: string
        competitor?: string | null
        competitor_strengths?: string | null
        contact_id: string
        created_at?: string | null
        custom_fields?: Json | null
        decision_maker?: string | null
        expected_close_date?: string | null
        id?: string
        last_activity?: string | null
        loss_reason?: string | null
        loss_reason_detail?: string | null
        lost_at?: string | null
        lost_reason?: string | null
        need_identified?: string | null
        next_step?: string | null
        next_step_date?: string | null
        our_differentials?: string | null
        pipeline_id: string
        priority?: string | null
        probability?: number | null
        products?: Json | null
        stage_id: string
        status?: string | null
        temperature?: string | null
        temperature_score?: number | null
        timeline_confirmed?: boolean | null
        title: string
        updated_at?: string | null
        value?: number | null
        win_reason?: string | null
        won_at?: string | null
      }
      Update: {
        assigned_to?: string | null
        budget_confirmed?: boolean | null
        churn_risk_score?: number | null
        company_id?: string
        competitor?: string | null
        competitor_strengths?: string | null
        contact_id?: string
        created_at?: string | null
        custom_fields?: Json | null
        decision_maker?: string | null
        expected_close_date?: string | null
        id?: string
        last_activity?: string | null
        loss_reason?: string | null
        loss_reason_detail?: string | null
        lost_at?: string | null
        lost_reason?: string | null
        need_identified?: string | null
        next_step?: string | null
        next_step_date?: string | null
        our_differentials?: string | null
        pipeline_id?: string
        priority?: string | null
        probability?: number | null
        products?: Json | null
        stage_id?: string
        status?: string | null
        temperature?: string | null
        temperature_score?: number | null
        timeline_confirmed?: boolean | null
        title?: string
        updated_at?: string | null
        value?: number | null
        win_reason?: string | null
        won_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "deals_assigned_to_fkey"
          columns: ["assigned_to"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "deals_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "deals_contact_id_fkey"
          columns: ["contact_id"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "deals_pipeline_id_fkey"
          columns: ["pipeline_id"]
          isOneToOne: false
          referencedRelation: "pipelines"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "deals_stage_id_fkey"
          columns: ["stage_id"]
          isOneToOne: false
          referencedRelation: "pipeline_stages"
          referencedColumns: ["id"]
        },
      ]
    }
    email_logs: {
      Row: {
        body: string
        clicked_at: string | null
        company_id: string
        contact_id: string | null
        deal_id: string | null
        error_message: string | null
        id: string
        metadata: Json | null
        opened_at: string | null
        sent_at: string | null
        status: string | null
        subject: string
        template_id: string | null
        to_email: string
      }
      Insert: {
        body: string
        clicked_at?: string | null
        company_id: string
        contact_id?: string | null
        deal_id?: string | null
        error_message?: string | null
        id?: string
        metadata?: Json | null
        opened_at?: string | null
        sent_at?: string | null
        status?: string | null
        subject: string
        template_id?: string | null
        to_email: string
      }
      Update: {
        body?: string
        clicked_at?: string | null
        company_id?: string
        contact_id?: string | null
        deal_id?: string | null
        error_message?: string | null
        id?: string
        metadata?: Json | null
        opened_at?: string | null
        sent_at?: string | null
        status?: string | null
        subject?: string
        template_id?: string | null
        to_email?: string
      }
      Relationships: [
        {
          foreignKeyName: "email_logs_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "email_logs_contact_id_fkey"
          columns: ["contact_id"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "email_logs_deal_id_fkey"
          columns: ["deal_id"]
          isOneToOne: false
          referencedRelation: "deals"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "email_logs_template_id_fkey"
          columns: ["template_id"]
          isOneToOne: false
          referencedRelation: "email_templates"
          referencedColumns: ["id"]
        },
      ]
    }
    email_templates: {
      Row: {
        body: string
        category: string | null
        company_id: string
        created_at: string | null
        created_by: string | null
        id: string
        name: string
        subject: string
        updated_at: string | null
        variables: string[] | null
      }
      Insert: {
        body: string
        category?: string | null
        company_id: string
        created_at?: string | null
        created_by?: string | null
        id?: string
        name: string
        subject: string
        updated_at?: string | null
        variables?: string[] | null
      }
      Update: {
        body?: string
        category?: string | null
        company_id?: string
        created_at?: string | null
        created_by?: string | null
        id?: string
        name?: string
        subject?: string
        updated_at?: string | null
        variables?: string[] | null
      }
      Relationships: [
        {
          foreignKeyName: "email_templates_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "email_templates_created_by_fkey"
          columns: ["created_by"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
      ]
    }
    evolution_settings: {
      Row: {
        api_key: string | null
        api_url: string | null
        auto_created: boolean | null
        company_id: string | null
        created_at: string
        daily_message_limit: number | null
        delivery_rate: number | null
        id: string
        instance_name: string
        instance_settings: Json | null
        instance_status: string | null
        is_connected: boolean | null
        last_connection_check: string | null
        last_reset_date: string | null
        messages_sent_today: number | null
        qr_code: string | null
        qr_code_updated_at: string | null
        response_rate: number | null
        updated_at: string
        user_id: string
      }
      Insert: {
        api_key?: string | null
        api_url?: string | null
        auto_created?: boolean | null
        company_id?: string | null
        created_at?: string
        daily_message_limit?: number | null
        delivery_rate?: number | null
        id?: string
        instance_name: string
        instance_settings?: Json | null
        instance_status?: string | null
        is_connected?: boolean | null
        last_connection_check?: string | null
        last_reset_date?: string | null
        messages_sent_today?: number | null
        qr_code?: string | null
        qr_code_updated_at?: string | null
        response_rate?: number | null
        updated_at?: string
        user_id: string
      }
      Update: {
        api_key?: string | null
        api_url?: string | null
        auto_created?: boolean | null
        company_id?: string | null
        created_at?: string
        daily_message_limit?: number | null
        delivery_rate?: number | null
        id?: string
        instance_name?: string
        instance_settings?: Json | null
        instance_status?: string | null
        is_connected?: boolean | null
        last_connection_check?: string | null
        last_reset_date?: string | null
        messages_sent_today?: number | null
        qr_code?: string | null
        qr_code_updated_at?: string | null
        response_rate?: number | null
        updated_at?: string
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "evolution_settings_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: true
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    goals: {
      Row: {
        company_id: string | null
        created_at: string | null
        current_value: number | null
        end_date: string
        goal_type: string
        id: string
        period: string
        start_date: string
        status: string | null
        target_value: number
        user_id: string | null
      }
      Insert: {
        company_id?: string | null
        created_at?: string | null
        current_value?: number | null
        end_date: string
        goal_type: string
        id?: string
        period: string
        start_date: string
        status?: string | null
        target_value: number
        user_id?: string | null
      }
      Update: {
        company_id?: string | null
        created_at?: string | null
        current_value?: number | null
        end_date?: string
        goal_type?: string
        id?: string
        period?: string
        start_date?: string
        status?: string | null
        target_value?: number
        user_id?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "goals_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "goals_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
      ]
    }
    group_invites: {
      Row: {
        company_id: string
        created_at: string
        created_by: string
        group_id: string
        id: string
        invite_code: string
        revoked: boolean | null
        revoked_at: string | null
      }
      Insert: {
        company_id: string
        created_at?: string
        created_by: string
        group_id: string
        id?: string
        invite_code: string
        revoked?: boolean | null
        revoked_at?: string | null
      }
      Update: {
        company_id?: string
        created_at?: string
        created_by?: string
        group_id?: string
        id?: string
        invite_code?: string
        revoked?: boolean | null
        revoked_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "group_invites_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "group_invites_group_id_fkey"
          columns: ["group_id"]
          isOneToOne: false
          referencedRelation: "groups"
          referencedColumns: ["id"]
        },
      ]
    }
    group_participants: {
      Row: {
        company_id: string
        group_id: string
        id: string
        is_admin: boolean | null
        is_super_admin: boolean | null
        joined_at: string
        phone_number: string
      }
      Insert: {
        company_id: string
        group_id: string
        id?: string
        is_admin?: boolean | null
        is_super_admin?: boolean | null
        joined_at?: string
        phone_number: string
      }
      Update: {
        company_id?: string
        group_id?: string
        id?: string
        is_admin?: boolean | null
        is_super_admin?: boolean | null
        joined_at?: string
        phone_number?: string
      }
      Relationships: [
        {
          foreignKeyName: "group_participants_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "group_participants_group_id_fkey"
          columns: ["group_id"]
          isOneToOne: false
          referencedRelation: "groups"
          referencedColumns: ["id"]
        },
      ]
    }
    groups: {
      Row: {
        company_id: string
        created_at: string
        description: string | null
        group_id: string
        id: string
        is_announce_only: boolean | null
        name: string
        owner_number: string
        profile_pic_url: string | null
        updated_at: string
        who_can_edit_info: string | null
        who_can_send_messages: string | null
      }
      Insert: {
        company_id: string
        created_at?: string
        description?: string | null
        group_id: string
        id?: string
        is_announce_only?: boolean | null
        name: string
        owner_number: string
        profile_pic_url?: string | null
        updated_at?: string
        who_can_edit_info?: string | null
        who_can_send_messages?: string | null
      }
      Update: {
        company_id?: string
        created_at?: string
        description?: string | null
        group_id?: string
        id?: string
        is_announce_only?: boolean | null
        name?: string
        owner_number?: string
        profile_pic_url?: string | null
        updated_at?: string
        who_can_edit_info?: string | null
        who_can_send_messages?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "groups_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    labels: {
      Row: {
        color: string
        company_id: string
        created_at: string | null
        description: string | null
        icon: string | null
        id: string
        name: string
        updated_at: string | null
      }
      Insert: {
        color: string
        company_id: string
        created_at?: string | null
        description?: string | null
        icon?: string | null
        id?: string
        name: string
        updated_at?: string | null
      }
      Update: {
        color?: string
        company_id?: string
        created_at?: string | null
        description?: string | null
        icon?: string | null
        id?: string
        name?: string
        updated_at?: string | null
      }
      Relationships: []
    }
    lead_insights: {
      Row: {
        company_id: string
        confidence: number | null
        contact_id: string
        conversation_id: string | null
        created_at: string | null
        description: string | null
        expires_at: string | null
        extracted_at: string | null
        id: string
        insight_type: string
        interest_level: number | null
        is_active: boolean | null
        message_id: string | null
        product_id: string | null
        product_name: string | null
        source: string | null
        title: string
        value: string | null
      }
      Insert: {
        company_id: string
        confidence?: number | null
        contact_id: string
        conversation_id?: string | null
        created_at?: string | null
        description?: string | null
        expires_at?: string | null
        extracted_at?: string | null
        id?: string
        insight_type: string
        interest_level?: number | null
        is_active?: boolean | null
        message_id?: string | null
        product_id?: string | null
        product_name?: string | null
        source?: string | null
        title: string
        value?: string | null
      }
      Update: {
        company_id?: string
        confidence?: number | null
        contact_id?: string
        conversation_id?: string | null
        created_at?: string | null
        description?: string | null
        expires_at?: string | null
        extracted_at?: string | null
        id?: string
        insight_type?: string
        interest_level?: number | null
        is_active?: boolean | null
        message_id?: string | null
        product_id?: string | null
        product_name?: string | null
        source?: string | null
        title?: string
        value?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "lead_insights_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "lead_insights_contact_id_fkey"
          columns: ["contact_id"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "lead_insights_conversation_id_fkey"
          columns: ["conversation_id"]
          isOneToOne: false
          referencedRelation: "conversations"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "lead_insights_message_id_fkey"
          columns: ["message_id"]
          isOneToOne: false
          referencedRelation: "messages"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "lead_insights_product_id_fkey"
          columns: ["product_id"]
          isOneToOne: false
          referencedRelation: "products"
          referencedColumns: ["id"]
        },
      ]
    }
    lead_qualification: {
      Row: {
        ai_generated: boolean | null
        authority_notes: string | null
        authority_score: number | null
        best_contact_day: string | null
        best_contact_time: string | null
        budget_notes: string | null
        budget_score: number | null
        communication_style: string | null
        company_id: string
        contact_id: string
        created_at: string | null
        decision_speed: string | null
        id: string
        last_updated_by: string | null
        need_notes: string | null
        need_score: number | null
        preferred_channel: string | null
        price_sensitivity: string | null
        qualification_level: string | null
        timing_notes: string | null
        timing_score: number | null
        total_score: number | null
        updated_at: string | null
      }
      Insert: {
        ai_generated?: boolean | null
        authority_notes?: string | null
        authority_score?: number | null
        best_contact_day?: string | null
        best_contact_time?: string | null
        budget_notes?: string | null
        budget_score?: number | null
        communication_style?: string | null
        company_id: string
        contact_id: string
        created_at?: string | null
        decision_speed?: string | null
        id?: string
        last_updated_by?: string | null
        need_notes?: string | null
        need_score?: number | null
        preferred_channel?: string | null
        price_sensitivity?: string | null
        qualification_level?: string | null
        timing_notes?: string | null
        timing_score?: number | null
        total_score?: number | null
        updated_at?: string | null
      }
      Update: {
        ai_generated?: boolean | null
        authority_notes?: string | null
        authority_score?: number | null
        best_contact_day?: string | null
        best_contact_time?: string | null
        budget_notes?: string | null
        budget_score?: number | null
        communication_style?: string | null
        company_id?: string
        contact_id?: string
        created_at?: string | null
        decision_speed?: string | null
        id?: string
        last_updated_by?: string | null
        need_notes?: string | null
        need_score?: number | null
        preferred_channel?: string | null
        price_sensitivity?: string | null
        qualification_level?: string | null
        timing_notes?: string | null
        timing_score?: number | null
        total_score?: number | null
        updated_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "lead_qualification_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "lead_qualification_contact_id_fkey"
          columns: ["contact_id"]
          isOneToOne: true
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
      ]
    }
    leaderboard_snapshots: {
      Row: {
        company_id: string | null
        created_at: string | null
        id: string
        period: string
        rankings: Json
        snapshot_date: string
      }
      Insert: {
        company_id?: string | null
        created_at?: string | null
        id?: string
        period: string
        rankings: Json
        snapshot_date: string
      }
      Update: {
        company_id?: string | null
        created_at?: string | null
        id?: string
        period?: string
        rankings?: Json
        snapshot_date?: string
      }
      Relationships: [
        {
          foreignKeyName: "leaderboard_snapshots_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    member_permissions: {
      Row: {
        created_at: string | null
        id: string
        is_granted: boolean
        member_id: string
        permission_key: string
      }
      Insert: {
        created_at?: string | null
        id?: string
        is_granted: boolean
        member_id: string
        permission_key: string
      }
      Update: {
        created_at?: string | null
        id?: string
        is_granted?: boolean
        member_id?: string
        permission_key?: string
      }
      Relationships: [
        {
          foreignKeyName: "member_permissions_member_id_fkey"
          columns: ["member_id"]
          isOneToOne: false
          referencedRelation: "company_members"
          referencedColumns: ["id"]
        },
      ]
    }
    message_templates: {
      Row: {
        avg_response_rate: number | null
        category: string | null
        company_id: string
        content: string
        created_at: string | null
        created_by: string | null
        id: string
        is_favorite: boolean | null
        name: string
        usage_count: number | null
        variables: string[] | null
      }
      Insert: {
        avg_response_rate?: number | null
        category?: string | null
        company_id: string
        content: string
        created_at?: string | null
        created_by?: string | null
        id?: string
        is_favorite?: boolean | null
        name: string
        usage_count?: number | null
        variables?: string[] | null
      }
      Update: {
        avg_response_rate?: number | null
        category?: string | null
        company_id?: string
        content?: string
        created_at?: string | null
        created_by?: string | null
        id?: string
        is_favorite?: boolean | null
        name?: string
        usage_count?: number | null
        variables?: string[] | null
      }
      Relationships: [
        {
          foreignKeyName: "message_templates_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "message_templates_created_by_fkey"
          columns: ["created_by"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
      ]
    }
    messages: {
      Row: {
        ai_confidence: number | null
        ai_intent_detected: string | null
        ai_model: string | null
        ai_response_time_ms: number | null
        ai_sentiment: string | null
        ai_suggested_response: string | null
        ai_was_edited: boolean | null
        audio_transcription: string | null
        transcription_status: string | null
        transcription_language: string | null
        transcription_confidence: number | null
        transcription_duration: number | null
        transcription_provider: string | null
        company_id: string | null
        contact_data: Json | null
        content: string
        conversation_id: string
        created_at: string
        deleted_at: string | null
        deleted_for_everyone: boolean | null
        delivered_at: string | null
        edited_at: string | null
        external_id: string | null
        id: string
        is_from_ai: boolean | null
        is_from_me: boolean
        list_data: Json | null
        location_data: Json | null
        media_type: string | null
        media_url: string | null
        message_type: string
        played_at: string | null
        poll_data: Json | null
        reaction: string | null
        read_at: string | null
        status: string | null
        timestamp: string
        user_id: string
      }
      Insert: {
        ai_confidence?: number | null
        ai_intent_detected?: string | null
        ai_model?: string | null
        ai_response_time_ms?: number | null
        ai_sentiment?: string | null
        ai_suggested_response?: string | null
        ai_was_edited?: boolean | null
        audio_transcription?: string | null
        transcription_status?: string | null
        transcription_language?: string | null
        transcription_confidence?: number | null
        transcription_duration?: number | null
        transcription_provider?: string | null
        company_id?: string | null
        contact_data?: Json | null
        content: string
        conversation_id: string
        created_at?: string
        deleted_at?: string | null
        deleted_for_everyone?: boolean | null
        delivered_at?: string | null
        edited_at?: string | null
        external_id?: string | null
        id?: string
        is_from_ai?: boolean | null
        is_from_me?: boolean
        list_data?: Json | null
        location_data?: Json | null
        media_type?: string | null
        media_url?: string | null
        message_type?: string
        played_at?: string | null
        poll_data?: Json | null
        reaction?: string | null
        read_at?: string | null
        status?: string | null
        timestamp?: string
        user_id: string
      }
      Update: {
        ai_confidence?: number | null
        ai_intent_detected?: string | null
        ai_model?: string | null
        ai_response_time_ms?: number | null
        ai_sentiment?: string | null
        ai_suggested_response?: string | null
        ai_was_edited?: boolean | null
        audio_transcription?: string | null
        transcription_status?: string | null
        transcription_language?: string | null
        transcription_confidence?: number | null
        transcription_duration?: number | null
        transcription_provider?: string | null
        company_id?: string | null
        contact_data?: Json | null
        content?: string
        conversation_id?: string
        created_at?: string
        deleted_at?: string | null
        deleted_for_everyone?: boolean | null
        delivered_at?: string | null
        edited_at?: string | null
        external_id?: string | null
        id?: string
        is_from_ai?: boolean | null
        is_from_me?: boolean
        list_data?: Json | null
        location_data?: Json | null
        media_type?: string | null
        media_url?: string | null
        message_type?: string
        played_at?: string | null
        poll_data?: Json | null
        reaction?: string | null
        read_at?: string | null
        status?: string | null
        timestamp?: string
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "messages_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "messages_conversation_id_fkey"
          columns: ["conversation_id"]
          isOneToOne: false
          referencedRelation: "conversations"
          referencedColumns: ["id"]
        },
      ]
    }
    notification_history: {
      Row: {
        body: string
        company_id: string
        conversation_id: string
        created_at: string | null
        deleted_at: string | null
        id: string
        message_type: string | null
        read: boolean | null
        title: string
        user_id: string
      }
      Insert: {
        body: string
        company_id: string
        conversation_id: string
        created_at?: string | null
        deleted_at?: string | null
        id?: string
        message_type?: string | null
        read?: boolean | null
        title: string
        user_id: string
      }
      Update: {
        body?: string
        company_id?: string
        conversation_id?: string
        created_at?: string | null
        deleted_at?: string | null
        id?: string
        message_type?: string | null
        read?: boolean | null
        title?: string
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "notification_history_conversation_id_fkey"
          columns: ["conversation_id"]
          isOneToOne: false
          referencedRelation: "conversations"
          referencedColumns: ["id"]
        },
      ]
    }
    notification_settings: {
      Row: {
        badge_enabled: boolean | null
        company_id: string
        created_at: string | null
        do_not_disturb_enabled: boolean | null
        do_not_disturb_end: string | null
        do_not_disturb_start: string | null
        enabled: boolean | null
        id: string
        muted_contacts: string[] | null
        sound_enabled: boolean | null
        updated_at: string | null
        user_id: string
        volume: number | null
      }
      Insert: {
        badge_enabled?: boolean | null
        company_id: string
        created_at?: string | null
        do_not_disturb_enabled?: boolean | null
        do_not_disturb_end?: string | null
        do_not_disturb_start?: string | null
        enabled?: boolean | null
        id?: string
        muted_contacts?: string[] | null
        sound_enabled?: boolean | null
        updated_at?: string | null
        user_id: string
        volume?: number | null
      }
      Update: {
        badge_enabled?: boolean | null
        company_id?: string
        created_at?: string | null
        do_not_disturb_enabled?: boolean | null
        do_not_disturb_end?: string | null
        do_not_disturb_start?: string | null
        enabled?: boolean | null
        id?: string
        muted_contacts?: string[] | null
        sound_enabled?: boolean | null
        updated_at?: string | null
        user_id?: string
        volume?: number | null
      }
      Relationships: []
    }
    notifications: {
      Row: {
        action_url: string | null
        company_id: string
        created_at: string | null
        entity_id: string | null
        entity_type: string | null
        id: string
        is_read: boolean | null
        message: string
        metadata: Json | null
        read_at: string | null
        title: string
        type: string | null
        user_id: string
      }
      Insert: {
        action_url?: string | null
        company_id: string
        created_at?: string | null
        entity_id?: string | null
        entity_type?: string | null
        id?: string
        is_read?: boolean | null
        message: string
        metadata?: Json | null
        read_at?: string | null
        title: string
        type?: string | null
        user_id: string
      }
      Update: {
        action_url?: string | null
        company_id?: string
        created_at?: string | null
        entity_id?: string | null
        entity_type?: string | null
        id?: string
        is_read?: boolean | null
        message?: string
        metadata?: Json | null
        read_at?: string | null
        title?: string
        type?: string | null
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "notifications_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "notifications_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
      ]
    }
    pipeline_stages: {
      Row: {
        automation_rules: Json | null
        color: string | null
        created_at: string | null
        id: string
        is_closed_lost: boolean | null
        is_closed_won: boolean | null
        name: string
        order_index: number
        pipeline_id: string
        probability_default: number | null
      }
      Insert: {
        automation_rules?: Json | null
        color?: string | null
        created_at?: string | null
        id?: string
        is_closed_lost?: boolean | null
        is_closed_won?: boolean | null
        name: string
        order_index: number
        pipeline_id: string
        probability_default?: number | null
      }
      Update: {
        automation_rules?: Json | null
        color?: string | null
        created_at?: string | null
        id?: string
        is_closed_lost?: boolean | null
        is_closed_won?: boolean | null
        name?: string
        order_index?: number
        pipeline_id?: string
        probability_default?: number | null
      }
      Relationships: [
        {
          foreignKeyName: "pipeline_stages_pipeline_id_fkey"
          columns: ["pipeline_id"]
          isOneToOne: false
          referencedRelation: "pipelines"
          referencedColumns: ["id"]
        },
      ]
    }
    pipelines: {
      Row: {
        company_id: string
        created_at: string | null
        description: string | null
        id: string
        is_default: boolean | null
        name: string
        order_index: number | null
        updated_at: string | null
      }
      Insert: {
        company_id: string
        created_at?: string | null
        description?: string | null
        id?: string
        is_default?: boolean | null
        name: string
        order_index?: number | null
        updated_at?: string | null
      }
      Update: {
        company_id?: string
        created_at?: string | null
        description?: string | null
        id?: string
        is_default?: boolean | null
        name?: string
        order_index?: number | null
        updated_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "pipelines_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    plan_features: {
      Row: {
        config: Json | null
        created_at: string | null
        feature_id: string | null
        id: string
        is_enabled: boolean | null
        plan_id: string | null
      }
      Insert: {
        config?: Json | null
        created_at?: string | null
        feature_id?: string | null
        id?: string
        is_enabled?: boolean | null
        plan_id?: string | null
      }
      Update: {
        config?: Json | null
        created_at?: string | null
        feature_id?: string | null
        id?: string
        is_enabled?: boolean | null
        plan_id?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "plan_features_feature_id_fkey"
          columns: ["feature_id"]
          isOneToOne: false
          referencedRelation: "platform_features"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "plan_features_plan_id_fkey"
          columns: ["plan_id"]
          isOneToOne: false
          referencedRelation: "subscription_plans"
          referencedColumns: ["id"]
        },
      ]
    }
    platform_admins: {
      Row: {
        created_at: string | null
        created_by: string | null
        email: string
        id: string
        is_active: boolean | null
        user_id: string
      }
      Insert: {
        created_at?: string | null
        created_by?: string | null
        email: string
        id?: string
        is_active?: boolean | null
        user_id: string
      }
      Update: {
        created_at?: string | null
        created_by?: string | null
        email?: string
        id?: string
        is_active?: boolean | null
        user_id?: string
      }
      Relationships: []
    }
    platform_features: {
      Row: {
        category: string
        created_at: string | null
        description: string | null
        feature_key: string
        icon: string | null
        id: string
        is_global_enabled: boolean | null
        name: string
        order_index: number | null
        updated_at: string | null
      }
      Insert: {
        category: string
        created_at?: string | null
        description?: string | null
        feature_key: string
        icon?: string | null
        id?: string
        is_global_enabled?: boolean | null
        name: string
        order_index?: number | null
        updated_at?: string | null
      }
      Update: {
        category?: string
        created_at?: string | null
        description?: string | null
        feature_key?: string
        icon?: string | null
        id?: string
        is_global_enabled?: boolean | null
        name?: string
        order_index?: number | null
        updated_at?: string | null
      }
      Relationships: []
    }
    playbook_executions: {
      Row: {
        completed_at: string | null
        conversation_id: string | null
        current_step: number | null
        deal_id: string | null
        error_message: string | null
        id: string
        playbook_id: string
        started_at: string | null
        status: string | null
        steps_log: Json | null
        triggered_by: string | null
      }
      Insert: {
        completed_at?: string | null
        conversation_id?: string | null
        current_step?: number | null
        deal_id?: string | null
        error_message?: string | null
        id?: string
        playbook_id: string
        started_at?: string | null
        status?: string | null
        steps_log?: Json | null
        triggered_by?: string | null
      }
      Update: {
        completed_at?: string | null
        conversation_id?: string | null
        current_step?: number | null
        deal_id?: string | null
        error_message?: string | null
        id?: string
        playbook_id?: string
        started_at?: string | null
        status?: string | null
        steps_log?: Json | null
        triggered_by?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "playbook_executions_conversation_id_fkey"
          columns: ["conversation_id"]
          isOneToOne: false
          referencedRelation: "conversations"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "playbook_executions_deal_id_fkey"
          columns: ["deal_id"]
          isOneToOne: false
          referencedRelation: "deals"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "playbook_executions_playbook_id_fkey"
          columns: ["playbook_id"]
          isOneToOne: false
          referencedRelation: "playbooks"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "playbook_executions_triggered_by_fkey"
          columns: ["triggered_by"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
      ]
    }
    playbooks: {
      Row: {
        company_id: string
        created_at: string | null
        description: string | null
        flow_data: Json | null
        id: string
        is_active: boolean | null
        name: string
        steps: Json
        success_rate: number | null
        trigger_config: Json | null
        trigger_type: string
        updated_at: string | null
        usage_count: number | null
      }
      Insert: {
        company_id: string
        created_at?: string | null
        description?: string | null
        flow_data?: Json | null
        id?: string
        is_active?: boolean | null
        name: string
        steps?: Json
        success_rate?: number | null
        trigger_config?: Json | null
        trigger_type: string
        updated_at?: string | null
        usage_count?: number | null
      }
      Update: {
        company_id?: string
        created_at?: string | null
        description?: string | null
        flow_data?: Json | null
        id?: string
        is_active?: boolean | null
        name?: string
        steps?: Json
        success_rate?: number | null
        trigger_config?: Json | null
        trigger_type?: string
        updated_at?: string | null
        usage_count?: number | null
      }
      Relationships: [
        {
          foreignKeyName: "playbooks_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    privacy_settings: {
      Row: {
        company_id: string
        created_at: string
        id: string
        read_receipts_enabled: boolean
        show_last_seen: string
        show_profile_picture: string
        show_status: string
        updated_at: string
        user_id: string
        who_can_add_to_groups: string
      }
      Insert: {
        company_id: string
        created_at?: string
        id?: string
        read_receipts_enabled?: boolean
        show_last_seen?: string
        show_profile_picture?: string
        show_status?: string
        updated_at?: string
        user_id: string
        who_can_add_to_groups?: string
      }
      Update: {
        company_id?: string
        created_at?: string
        id?: string
        read_receipts_enabled?: boolean
        show_last_seen?: string
        show_profile_picture?: string
        show_status?: string
        updated_at?: string
        user_id?: string
        who_can_add_to_groups?: string
      }
      Relationships: [
        {
          foreignKeyName: "privacy_settings_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    products: {
      Row: {
        category: string | null
        company_id: string
        cost: number | null
        created_at: string | null
        description: string | null
        id: string
        images: string[] | null
        is_active: boolean | null
        metadata: Json | null
        name: string
        price: number
        sku: string | null
        updated_at: string | null
      }
      Insert: {
        category?: string | null
        company_id: string
        cost?: number | null
        created_at?: string | null
        description?: string | null
        id?: string
        images?: string[] | null
        is_active?: boolean | null
        metadata?: Json | null
        name: string
        price: number
        sku?: string | null
        updated_at?: string | null
      }
      Update: {
        category?: string | null
        company_id?: string
        cost?: number | null
        created_at?: string | null
        description?: string | null
        id?: string
        images?: string[] | null
        is_active?: boolean | null
        metadata?: Json | null
        name?: string
        price?: number
        sku?: string | null
        updated_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "products_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    profiles: {
      Row: {
        avatar_url: string | null
        created_at: string
        full_name: string
        google_calendar_connected: boolean | null
        google_calendar_email: string | null
        google_calendar_refresh_token: string | null
        google_calendar_token: Json | null
        id: string
        phone: string | null
        updated_at: string
      }
      Insert: {
        avatar_url?: string | null
        created_at?: string
        full_name: string
        google_calendar_connected?: boolean | null
        google_calendar_email?: string | null
        google_calendar_refresh_token?: string | null
        google_calendar_token?: Json | null
        id: string
        phone?: string | null
        updated_at?: string
      }
      Update: {
        avatar_url?: string | null
        created_at?: string
        full_name?: string
        google_calendar_connected?: boolean | null
        google_calendar_email?: string | null
        google_calendar_refresh_token?: string | null
        google_calendar_token?: Json | null
        id?: string
        phone?: string | null
        updated_at?: string
      }
      Relationships: []
    }
    proposal_templates: {
      Row: {
        category: string | null
        company_id: string
        content: Json
        created_at: string | null
        created_by: string | null
        description: string | null
        id: string
        is_default: boolean | null
        name: string
        thumbnail_url: string | null
        updated_at: string | null
        usage_count: number | null
      }
      Insert: {
        category?: string | null
        company_id: string
        content: Json
        created_at?: string | null
        created_by?: string | null
        description?: string | null
        id?: string
        is_default?: boolean | null
        name: string
        thumbnail_url?: string | null
        updated_at?: string | null
        usage_count?: number | null
      }
      Update: {
        category?: string | null
        company_id?: string
        content?: Json
        created_at?: string | null
        created_by?: string | null
        description?: string | null
        id?: string
        is_default?: boolean | null
        name?: string
        thumbnail_url?: string | null
        updated_at?: string | null
        usage_count?: number | null
      }
      Relationships: [
        {
          foreignKeyName: "proposal_templates_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "proposal_templates_created_by_fkey"
          columns: ["created_by"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
      ]
    }
    proposal_views: {
      Row: {
        id: string
        ip_address: string | null
        proposal_id: string | null
        session_id: string | null
        user_agent: string | null
        viewed_at: string
      }
      Insert: {
        id?: string
        ip_address?: string | null
        proposal_id?: string | null
        session_id?: string | null
        user_agent?: string | null
        viewed_at?: string
      }
      Update: {
        id?: string
        ip_address?: string | null
        proposal_id?: string | null
        session_id?: string | null
        user_agent?: string | null
        viewed_at?: string
      }
      Relationships: [
        {
          foreignKeyName: "proposal_views_proposal_id_fkey"
          columns: ["proposal_id"]
          isOneToOne: false
          referencedRelation: "proposals"
          referencedColumns: ["id"]
        },
      ]
    }
    proposals: {
      Row: {
        accepted_at: string | null
        change_notes: string | null
        client_document: string | null
        client_name: string | null
        created_at: string | null
        created_by: string | null
        deal_id: string
        discount: number | null
        discount_type: string | null
        id: string
        items: Json
        notes: string | null
        parent_proposal_id: string | null
        payment_terms: string | null
        pdf_url: string | null
        public_link: string | null
        rejected_at: string | null
        rejection_reason: string | null
        signature_data: string | null
        status: string | null
        subtotal: number | null
        tax: number | null
        title: string
        total: number
        updated_at: string | null
        validity_days: number | null
        version: number | null
        viewed_at: string | null
      }
      Insert: {
        accepted_at?: string | null
        change_notes?: string | null
        client_document?: string | null
        client_name?: string | null
        created_at?: string | null
        created_by?: string | null
        deal_id: string
        discount?: number | null
        discount_type?: string | null
        id?: string
        items?: Json
        notes?: string | null
        parent_proposal_id?: string | null
        payment_terms?: string | null
        pdf_url?: string | null
        public_link?: string | null
        rejected_at?: string | null
        rejection_reason?: string | null
        signature_data?: string | null
        status?: string | null
        subtotal?: number | null
        tax?: number | null
        title: string
        total?: number
        updated_at?: string | null
        validity_days?: number | null
        version?: number | null
        viewed_at?: string | null
      }
      Update: {
        accepted_at?: string | null
        change_notes?: string | null
        client_document?: string | null
        client_name?: string | null
        created_at?: string | null
        created_by?: string | null
        deal_id?: string
        discount?: number | null
        discount_type?: string | null
        id?: string
        items?: Json
        notes?: string | null
        parent_proposal_id?: string | null
        payment_terms?: string | null
        pdf_url?: string | null
        public_link?: string | null
        rejected_at?: string | null
        rejection_reason?: string | null
        signature_data?: string | null
        status?: string | null
        subtotal?: number | null
        tax?: number | null
        title?: string
        total?: number
        updated_at?: string | null
        validity_days?: number | null
        version?: number | null
        viewed_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "proposals_created_by_fkey"
          columns: ["created_by"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "proposals_deal_id_fkey"
          columns: ["deal_id"]
          isOneToOne: false
          referencedRelation: "deals"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "proposals_parent_proposal_id_fkey"
          columns: ["parent_proposal_id"]
          isOneToOne: false
          referencedRelation: "proposals"
          referencedColumns: ["id"]
        },
      ]
    }
    queue_members: {
      Row: {
        created_at: string | null
        id: string
        is_active: boolean | null
        max_conversations: number | null
        queue_id: string
        user_id: string
      }
      Insert: {
        created_at?: string | null
        id?: string
        is_active?: boolean | null
        max_conversations?: number | null
        queue_id: string
        user_id: string
      }
      Update: {
        created_at?: string | null
        id?: string
        is_active?: boolean | null
        max_conversations?: number | null
        queue_id?: string
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "queue_members_queue_id_fkey"
          columns: ["queue_id"]
          isOneToOne: false
          referencedRelation: "queues"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "queue_members_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
      ]
    }
    queues: {
      Row: {
        assignment_method: string | null
        auto_assign: boolean | null
        color: string | null
        company_id: string
        created_at: string | null
        description: string | null
        display_order: number | null
        id: string
        is_active: boolean | null
        max_conversations_per_agent: number | null
        name: string
        updated_at: string | null
        working_hours: Json | null
      }
      Insert: {
        assignment_method?: string | null
        auto_assign?: boolean | null
        color?: string | null
        company_id: string
        created_at?: string | null
        description?: string | null
        display_order?: number | null
        id?: string
        is_active?: boolean | null
        max_conversations_per_agent?: number | null
        name: string
        updated_at?: string | null
        working_hours?: Json | null
      }
      Update: {
        assignment_method?: string | null
        auto_assign?: boolean | null
        color?: string | null
        company_id?: string
        created_at?: string | null
        description?: string | null
        display_order?: number | null
        id?: string
        is_active?: boolean | null
        max_conversations_per_agent?: number | null
        name?: string
        updated_at?: string | null
        working_hours?: Json | null
      }
      Relationships: [
        {
          foreignKeyName: "queues_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    role_permissions: {
      Row: {
        id: string
        is_granted: boolean
        permission_key: string
        role: Database["public"]["Enums"]["user_role"]
      }
      Insert: {
        id?: string
        is_granted?: boolean
        permission_key: string
        role: Database["public"]["Enums"]["user_role"]
      }
      Update: {
        id?: string
        is_granted?: boolean
        permission_key?: string
        role?: Database["public"]["Enums"]["user_role"]
      }
      Relationships: []
    }
    satisfaction_settings: {
      Row: {
        ask_feedback: boolean
        company_id: string
        created_at: string
        custom_message: string | null
        delay_minutes: number
        enabled: boolean
        feedback_prompt: string | null
        id: string
        survey_type: string
        updated_at: string
      }
      Insert: {
        ask_feedback?: boolean
        company_id: string
        created_at?: string
        custom_message?: string | null
        delay_minutes?: number
        enabled?: boolean
        feedback_prompt?: string | null
        id?: string
        survey_type?: string
        updated_at?: string
      }
      Update: {
        ask_feedback?: boolean
        company_id?: string
        created_at?: string
        custom_message?: string | null
        delay_minutes?: number
        enabled?: boolean
        feedback_prompt?: string | null
        id?: string
        survey_type?: string
        updated_at?: string
      }
      Relationships: [
        {
          foreignKeyName: "satisfaction_settings_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: true
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    satisfaction_surveys: {
      Row: {
        answered_at: string | null
        assigned_to: string | null
        company_id: string
        contact_id: string | null
        conversation_id: string
        created_at: string
        feedback: string | null
        id: string
        score: number | null
        sent_at: string
        status: string
        survey_type: string
        updated_at: string
      }
      Insert: {
        answered_at?: string | null
        assigned_to?: string | null
        company_id: string
        contact_id?: string | null
        conversation_id: string
        created_at?: string
        feedback?: string | null
        id?: string
        score?: number | null
        sent_at?: string
        status?: string
        survey_type: string
        updated_at?: string
      }
      Update: {
        answered_at?: string | null
        assigned_to?: string | null
        company_id?: string
        contact_id?: string | null
        conversation_id?: string
        created_at?: string
        feedback?: string | null
        id?: string
        score?: number | null
        sent_at?: string
        status?: string
        survey_type?: string
        updated_at?: string
      }
      Relationships: [
        {
          foreignKeyName: "satisfaction_surveys_assigned_to_fkey"
          columns: ["assigned_to"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "satisfaction_surveys_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "satisfaction_surveys_contact_id_fkey"
          columns: ["contact_id"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "satisfaction_surveys_conversation_id_fkey"
          columns: ["conversation_id"]
          isOneToOne: false
          referencedRelation: "conversations"
          referencedColumns: ["id"]
        },
      ]
    }
    saved_filters: {
      Row: {
        company_id: string
        created_at: string | null
        filters: Json
        id: string
        is_default: boolean | null
        name: string
        updated_at: string | null
        user_id: string
      }
      Insert: {
        company_id: string
        created_at?: string | null
        filters?: Json
        id?: string
        is_default?: boolean | null
        name: string
        updated_at?: string | null
        user_id: string
      }
      Update: {
        company_id?: string
        created_at?: string | null
        filters?: Json
        id?: string
        is_default?: boolean | null
        name?: string
        updated_at?: string | null
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "saved_filters_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    scoring_rules: {
      Row: {
        company_id: string
        condition_type: string
        condition_value: string | null
        created_at: string | null
        description: string | null
        id: string
        is_active: boolean | null
        name: string
        points: number
        updated_at: string | null
      }
      Insert: {
        company_id: string
        condition_type: string
        condition_value?: string | null
        created_at?: string | null
        description?: string | null
        id?: string
        is_active?: boolean | null
        name: string
        points: number
        updated_at?: string | null
      }
      Update: {
        company_id?: string
        condition_type?: string
        condition_value?: string | null
        created_at?: string | null
        description?: string | null
        id?: string
        is_active?: boolean | null
        name?: string
        points?: number
        updated_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "scoring_rules_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    sectors: {
      Row: {
        color: string | null
        company_id: string
        created_at: string
        id: string
        name: string
        updated_at: string
      }
      Insert: {
        color?: string | null
        company_id: string
        created_at?: string
        id?: string
        name: string
        updated_at?: string
      }
      Update: {
        color?: string | null
        company_id?: string
        created_at?: string
        id?: string
        name?: string
        updated_at?: string
      }
      Relationships: [
        {
          foreignKeyName: "sectors_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    security_alerts: {
      Row: {
        acknowledged: boolean | null
        acknowledged_at: string | null
        acknowledged_by: string | null
        alert_type: string
        company_id: string
        created_at: string
        description: string
        id: string
        metadata: Json | null
        severity: string
        user_id: string | null
      }
      Insert: {
        acknowledged?: boolean | null
        acknowledged_at?: string | null
        acknowledged_by?: string | null
        alert_type: string
        company_id: string
        created_at?: string
        description: string
        id?: string
        metadata?: Json | null
        severity: string
        user_id?: string | null
      }
      Update: {
        acknowledged?: boolean | null
        acknowledged_at?: string | null
        acknowledged_by?: string | null
        alert_type?: string
        company_id?: string
        created_at?: string
        description?: string
        id?: string
        metadata?: Json | null
        severity?: string
        user_id?: string | null
      }
      Relationships: []
    }
    segments: {
      Row: {
        company_id: string
        contact_count: number | null
        created_at: string | null
        created_by: string | null
        description: string | null
        filters: Json
        id: string
        is_dynamic: boolean | null
        name: string
        updated_at: string | null
      }
      Insert: {
        company_id: string
        contact_count?: number | null
        created_at?: string | null
        created_by?: string | null
        description?: string | null
        filters?: Json
        id?: string
        is_dynamic?: boolean | null
        name: string
        updated_at?: string | null
      }
      Update: {
        company_id?: string
        contact_count?: number | null
        created_at?: string | null
        created_by?: string | null
        description?: string | null
        filters?: Json
        id?: string
        is_dynamic?: boolean | null
        name?: string
        updated_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "segments_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "segments_created_by_fkey"
          columns: ["created_by"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
      ]
    }
    status_stories: {
      Row: {
        background_color: string | null
        company_id: string
        content_type: string
        content_url: string | null
        created_at: string
        expires_at: string
        id: string
        phone_number: string
        text_content: string | null
        user_id: string
        view_count: number | null
      }
      Insert: {
        background_color?: string | null
        company_id: string
        content_type: string
        content_url?: string | null
        created_at?: string
        expires_at?: string
        id?: string
        phone_number: string
        text_content?: string | null
        user_id: string
        view_count?: number | null
      }
      Update: {
        background_color?: string | null
        company_id?: string
        content_type?: string
        content_url?: string | null
        created_at?: string
        expires_at?: string
        id?: string
        phone_number?: string
        text_content?: string | null
        user_id?: string
        view_count?: number | null
      }
      Relationships: [
        {
          foreignKeyName: "status_stories_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    status_views: {
      Row: {
        id: string
        status_id: string
        viewed_at: string
        viewer_number: string
      }
      Insert: {
        id?: string
        status_id: string
        viewed_at?: string
        viewer_number: string
      }
      Update: {
        id?: string
        status_id?: string
        viewed_at?: string
        viewer_number?: string
      }
      Relationships: [
        {
          foreignKeyName: "status_views_status_id_fkey"
          columns: ["status_id"]
          isOneToOne: false
          referencedRelation: "status_stories"
          referencedColumns: ["id"]
        },
      ]
    }
    subscription_plans: {
      Row: {
        created_at: string | null
        features: Json | null
        id: string
        max_companies: number | null
        max_conversations: number | null
        max_users: number | null
        name: string
        price_monthly: number
        price_yearly: number
        slug: string
        stripe_price_id_monthly: string | null
        stripe_price_id_yearly: string | null
        updated_at: string | null
      }
      Insert: {
        created_at?: string | null
        features?: Json | null
        id?: string
        max_companies?: number | null
        max_conversations?: number | null
        max_users?: number | null
        name: string
        price_monthly: number
        price_yearly: number
        slug: string
        stripe_price_id_monthly?: string | null
        stripe_price_id_yearly?: string | null
        updated_at?: string | null
      }
      Update: {
        created_at?: string | null
        features?: Json | null
        id?: string
        max_companies?: number | null
        max_conversations?: number | null
        max_users?: number | null
        name?: string
        price_monthly?: number
        price_yearly?: number
        slug?: string
        stripe_price_id_monthly?: string | null
        stripe_price_id_yearly?: string | null
        updated_at?: string | null
      }
      Relationships: []
    }
    tasks: {
      Row: {
        assigned_to: string
        company_id: string
        completed_at: string | null
        contact_id: string | null
        created_at: string | null
        created_by: string | null
        deal_id: string | null
        description: string | null
        due_date: string
        id: string
        priority: string | null
        reminder_sent: boolean | null
        status: string | null
        task_type: string | null
        title: string
      }
      Insert: {
        assigned_to: string
        company_id: string
        completed_at?: string | null
        contact_id?: string | null
        created_at?: string | null
        created_by?: string | null
        deal_id?: string | null
        description?: string | null
        due_date: string
        id?: string
        priority?: string | null
        reminder_sent?: boolean | null
        status?: string | null
        task_type?: string | null
        title: string
      }
      Update: {
        assigned_to?: string
        company_id?: string
        completed_at?: string | null
        contact_id?: string | null
        created_at?: string | null
        created_by?: string | null
        deal_id?: string | null
        description?: string | null
        due_date?: string
        id?: string
        priority?: string | null
        reminder_sent?: boolean | null
        status?: string | null
        task_type?: string | null
        title?: string
      }
      Relationships: [
        {
          foreignKeyName: "tasks_assigned_to_fkey"
          columns: ["assigned_to"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "tasks_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "tasks_contact_id_fkey"
          columns: ["contact_id"]
          isOneToOne: false
          referencedRelation: "contacts"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "tasks_created_by_fkey"
          columns: ["created_by"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "tasks_deal_id_fkey"
          columns: ["deal_id"]
          isOneToOne: false
          referencedRelation: "deals"
          referencedColumns: ["id"]
        },
      ]
    }
    transcription_configs: {
      Row: {
        id: string
        company_id: string
        provider: string
        auto_transcribe: boolean
        language: string
        model: string
        api_key: string | null
        created_at: string
        updated_at: string
      }
      Insert: {
        id?: string
        company_id: string
        provider?: string
        auto_transcribe?: boolean
        language?: string
        model?: string
        api_key?: string | null
        created_at?: string
        updated_at?: string
      }
      Update: {
        id?: string
        company_id?: string
        provider?: string
        auto_transcribe?: boolean
        language?: string
        model?: string
        api_key?: string | null
        created_at?: string
        updated_at?: string
      }
      Relationships: [
        {
          foreignKeyName: "transcription_configs_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: true
          referencedRelation: "companies"
          referencedColumns: ["id"]
        }
      ]
    }
    teams: {
      Row: {
        color: string | null
        company_id: string
        created_at: string | null
        description: string | null
        id: string
        leader_id: string | null
        name: string
        updated_at: string | null
      }
      Insert: {
        color?: string | null
        company_id: string
        created_at?: string | null
        description?: string | null
        id?: string
        leader_id?: string | null
        name: string
        updated_at?: string | null
      }
      Update: {
        color?: string | null
        company_id?: string
        created_at?: string | null
        description?: string | null
        id?: string
        leader_id?: string | null
        name?: string
        updated_at?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "teams_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "teams_leader_id_fkey"
          columns: ["leader_id"]
          isOneToOne: false
          referencedRelation: "company_members"
          referencedColumns: ["id"]
        },
      ]
    }
    user_achievements: {
      Row: {
        achievement_id: string | null
        earned_at: string | null
        id: string
        user_id: string | null
      }
      Insert: {
        achievement_id?: string | null
        earned_at?: string | null
        id?: string
        user_id?: string | null
      }
      Update: {
        achievement_id?: string | null
        earned_at?: string | null
        id?: string
        user_id?: string | null
      }
      Relationships: [
        {
          foreignKeyName: "user_achievements_achievement_id_fkey"
          columns: ["achievement_id"]
          isOneToOne: false
          referencedRelation: "achievements"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "user_achievements_user_id_fkey"
          columns: ["user_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
      ]
    }
    user_roles: {
      Row: {
        company_id: string
        created_at: string
        id: string
        role: Database["public"]["Enums"]["app_role"]
        user_id: string
      }
      Insert: {
        company_id: string
        created_at?: string
        id?: string
        role: Database["public"]["Enums"]["app_role"]
        user_id: string
      }
      Update: {
        company_id?: string
        created_at?: string
        id?: string
        role?: Database["public"]["Enums"]["app_role"]
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "user_roles_company_id_fkey"
          columns: ["company_id"]
          isOneToOne: false
          referencedRelation: "companies"
          referencedColumns: ["id"]
        },
      ]
    }
    user_subscriptions: {
      Row: {
        billing_period: string
        cancel_at_period_end: boolean | null
        created_at: string | null
        current_period_end: string | null
        current_period_start: string | null
        id: string
        plan_id: string
        status: string
        stripe_customer_id: string | null
        stripe_subscription_id: string | null
        updated_at: string | null
        user_id: string
      }
      Insert: {
        billing_period: string
        cancel_at_period_end?: boolean | null
        created_at?: string | null
        current_period_end?: string | null
        current_period_start?: string | null
        id?: string
        plan_id: string
        status?: string
        stripe_customer_id?: string | null
        stripe_subscription_id?: string | null
        updated_at?: string | null
        user_id: string
      }
      Update: {
        billing_period?: string
        cancel_at_period_end?: boolean | null
        created_at?: string | null
        current_period_end?: string | null
        current_period_start?: string | null
        id?: string
        plan_id?: string
        status?: string
        stripe_customer_id?: string | null
        stripe_subscription_id?: string | null
        updated_at?: string | null
        user_id?: string
      }
      Relationships: [
        {
          foreignKeyName: "user_subscriptions_plan_id_fkey"
          columns: ["plan_id"]
          isOneToOne: false
          referencedRelation: "subscription_plans"
          referencedColumns: ["id"]
        },
      ]
    }
  }
  Views: {
    [_ in never]: never
  }
  Functions: {
    check_member_role: {
      Args: {
        _company_id: string
        _required_role: Database["public"]["Enums"]["user_role"]
        _user_id: string
      }
      Returns: boolean
    }
    check_permission: {
      Args: {
        p_company_id: string
        p_permission_key: string
        p_user_id: string
      }
      Returns: boolean
    }
    create_notification: {
      Args: {
        p_action_url?: string
        p_company_id: string
        p_entity_id?: string
        p_entity_type?: string
        p_message: string
        p_metadata?: Json
        p_title: string
        p_type?: string
        p_user_id: string
      }
      Returns: string
    }
    detect_duplicates_all_companies: { Args: never; Returns: undefined }
    get_user_company: { Args: { _user_id: string }; Returns: string }
    get_user_company_ids: { Args: { _user_id: string }; Returns: string[] }
    get_user_permissions: {
      Args: { p_company_id: string; p_user_id: string }
      Returns: Json
    }
    has_role: {
      Args: {
        _company_id: string
        _role: Database["public"]["Enums"]["app_role"]
        _user_id: string
      }
      Returns: boolean
    }
    increment: {
      Args: { column_name: string; row_id: string; table_name: string }
      Returns: undefined
    }
    is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
    log_unauthorized_access: {
      Args: {
        _action: string
        _attempted_company_id: string
        _metadata?: Json
        _table_name: string
        _user_id: string
      }
      Returns: undefined
    }
    match_conversations: {
      Args: {
        match_count?: number
        match_threshold?: number
        query_embedding: string
      }
      Returns: {
        content: string
        conversation_id: string
        id: string
        similarity: number
      }[]
    }
    notify_inactive_deals: { Args: never; Returns: undefined }
    notify_overdue_tasks: { Args: never; Returns: undefined }
    user_has_access_to_company: {
      Args: { _company_id: string; _user_id: string }
      Returns: boolean
    }
  }
  Enums: {
    app_role: "admin" | "manager" | "agent" | "viewer"
    conversation_status:
    | "waiting"
    | "re_entry"
    | "active"
    | "chatbot"
    | "closed"
    user_role:
    | "owner"
    | "admin"
    | "manager"
    | "supervisor"
    | "seller"
    | "viewer"
  }
  CompositeTypes: {
    [_ in never]: never
  }
}
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "agent", "viewer"],
      conversation_status: [
        "waiting",
        "re_entry",
        "active",
        "chatbot",
        "closed",
      ],
      user_role: [
        "owner",
        "admin",
        "manager",
        "supervisor",
        "seller",
        "viewer",
      ],
    },
  },
} as const
