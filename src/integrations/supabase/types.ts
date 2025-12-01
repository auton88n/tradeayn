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
      access_grants: {
        Row: {
          auth_method: string | null
          created_at: string
          current_month_usage: number | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean
          monthly_limit: number | null
          notes: string | null
          requires_approval: boolean | null
          updated_at: string
          usage_reset_date: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          auth_method?: string | null
          created_at?: string
          current_month_usage?: number | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          monthly_limit?: number | null
          notes?: string | null
          requires_approval?: boolean | null
          updated_at?: string
          usage_reset_date?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          auth_method?: string | null
          created_at?: string
          current_month_usage?: number | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean
          monthly_limit?: number | null
          notes?: string | null
          requires_approval?: boolean | null
          updated_at?: string
          usage_reset_date?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      ai_mode_configs: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          mode_name: string
          updated_at: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          mode_name: string
          updated_at?: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          mode_name?: string
          updated_at?: string
          webhook_url?: string
        }
        Relationships: []
      }
      alert_history: {
        Row: {
          alert_type: string
          content: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email_encrypted: string | null
          sent_at: string | null
          status: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          content: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email_encrypted?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          content?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email_encrypted?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      device_fingerprints: {
        Row: {
          created_at: string
          device_info: Json
          fingerprint_hash: string
          first_seen: string
          id: string
          is_trusted: boolean | null
          last_seen: string
          location_info: Json | null
          login_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json
          fingerprint_hash: string
          first_seen?: string
          id?: string
          is_trusted?: boolean | null
          last_seen?: string
          location_info?: Json | null
          login_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json
          fingerprint_hash?: string
          first_seen?: string
          id?: string
          is_trusted?: boolean | null
          last_seen?: string
          location_info?: Json | null
          login_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emergency_alerts: {
        Row: {
          alert_level: string
          alert_type: string
          auto_triggered: boolean | null
          created_at: string
          id: string
          is_active: boolean | null
          mitigation_actions: Json | null
          resolved_at: string | null
          resolved_by: string | null
          threat_assessment: Json | null
          trigger_reason: string
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          alert_level: string
          alert_type: string
          auto_triggered?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          mitigation_actions?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          threat_assessment?: Json | null
          trigger_reason: string
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          alert_level?: string
          alert_type?: string
          auto_triggered?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          mitigation_actions?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          threat_assessment?: Json | null
          trigger_reason?: string
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      favorite_chats: {
        Row: {
          chat_data: Json
          chat_title: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_data?: Json
          chat_title: string
          created_at?: string
          id?: string
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_data?: Json
          chat_title?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ip_blocks: {
        Row: {
          block_reason: string
          block_type: string
          blocked_at: string
          blocked_until: string | null
          created_at: string
          created_by: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          metadata: Json | null
          threat_level: string
          updated_at: string
        }
        Insert: {
          block_reason: string
          block_type?: string
          blocked_at?: string
          blocked_until?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ip_address: unknown
          is_active?: boolean | null
          metadata?: Json | null
          threat_level?: string
          updated_at?: string
        }
        Update: {
          block_reason?: string
          block_type?: string
          blocked_at?: string
          blocked_until?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          metadata?: Json | null
          threat_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          mode_used: string | null
          sender: string
          session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          mode_used?: string | null
          sender?: string
          session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          mode_used?: string | null
          sender?: string
          session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          measurement_time: string
          metric_type: string
          metric_value: number
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          measurement_time?: string
          metric_type: string
          metric_value: number
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          measurement_time?: string
          metric_type?: string
          metric_value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          avatar_url: string | null
          business_context: string | null
          business_type: string | null
          company_name: string | null
          contact_person: string | null
          created_at: string
          id: string
          last_login: string | null
          total_sessions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string | null
          avatar_url?: string | null
          business_context?: string | null
          business_type?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          last_login?: string | null
          total_sessions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string | null
          avatar_url?: string | null
          business_context?: string | null
          business_type?: string | null
          company_name?: string | null
          contact_person?: string | null
          created_at?: string
          id?: string
          last_login?: string | null
          total_sessions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          last_attempt: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_attempt?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      saved_insights: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          insight_text: string
          tags: string[] | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          insight_text: string
          tags?: string[] | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          insight_text?: string
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_config: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_reports: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          issues: Json | null
          issues_fixed: number
          issues_requiring_attention: number
          performance_metrics: Json | null
          recommendations: string[] | null
          report_data: Json | null
          report_id: string
          system_status: string
          total_issues: number
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          issues?: Json | null
          issues_fixed?: number
          issues_requiring_attention?: number
          performance_metrics?: Json | null
          recommendations?: string[] | null
          report_data?: Json | null
          report_id: string
          system_status: string
          total_issues?: number
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          issues?: Json | null
          issues_fixed?: number
          issues_requiring_attention?: number
          performance_metrics?: Json | null
          recommendations?: string[] | null
          report_data?: Json | null
          report_id?: string
          system_status?: string
          total_issues?: number
        }
        Relationships: []
      }
      system_status: {
        Row: {
          created_at: string
          id: string
          is_emergency_shutdown: boolean
          last_updated_at: string
          shutdown_initiated_at: string | null
          shutdown_initiated_by: string | null
          shutdown_reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_emergency_shutdown?: boolean
          last_updated_at?: string
          shutdown_initiated_at?: string | null
          shutdown_initiated_by?: string | null
          shutdown_reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_emergency_shutdown?: boolean
          last_updated_at?: string
          shutdown_initiated_at?: string | null
          shutdown_initiated_by?: string | null
          shutdown_reason?: string | null
        }
        Relationships: []
      }
      threat_detection: {
        Row: {
          blocked_until: string | null
          created_at: string
          details: Json
          detected_at: string
          endpoint: string | null
          id: string
          is_blocked: boolean | null
          request_count: number | null
          severity: string
          source_ip: unknown
          threat_type: string
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          details?: Json
          detected_at?: string
          endpoint?: string | null
          id?: string
          is_blocked?: boolean | null
          request_count?: number | null
          severity?: string
          source_ip: unknown
          threat_type: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          details?: Json
          detected_at?: string
          endpoint?: string | null
          id?: string
          is_blocked?: boolean | null
          request_count?: number | null
          severity?: string
          source_ip?: unknown
          threat_type?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          allow_personalization: boolean | null
          created_at: string | null
          desktop_notifications: boolean | null
          email_marketing: boolean | null
          email_system_alerts: boolean | null
          email_usage_warnings: boolean | null
          email_weekly_summary: boolean | null
          id: string
          in_app_sounds: boolean | null
          share_anonymous_data: boolean | null
          store_chat_history: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_personalization?: boolean | null
          created_at?: string | null
          desktop_notifications?: boolean | null
          email_marketing?: boolean | null
          email_system_alerts?: boolean | null
          email_usage_warnings?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          in_app_sounds?: boolean | null
          share_anonymous_data?: boolean | null
          store_chat_history?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_personalization?: boolean | null
          created_at?: string | null
          desktop_notifications?: boolean | null
          email_marketing?: boolean | null
          email_system_alerts?: boolean | null
          email_usage_warnings?: boolean | null
          email_weekly_summary?: boolean | null
          id?: string
          in_app_sounds?: boolean | null
          share_anonymous_data?: boolean | null
          store_chat_history?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallet_addresses: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          updated_at: string
          user_id: string
          verified: boolean | null
          wallet_address: string
          wallet_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string
          user_id: string
          verified?: boolean | null
          wallet_address: string
          wallet_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string
          user_id?: string
          verified?: boolean | null
          wallet_address?: string
          wallet_type?: string
        }
        Relationships: []
      }
      webhook_rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          updated_at: string
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          updated_at?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_or_create_solana_user: {
        Args: { _user_metadata?: Json; _wallet_address: string }
        Returns: string
      }
      check_emergency_shutdown: { Args: never; Returns: boolean }
      check_rate_limit: {
        Args: {
          _action_type: string
          _max_attempts?: number
          _window_minutes?: number
        }
        Returns: boolean
      }
      check_usage_limit: { Args: { _user_id: string }; Returns: boolean }
      check_webhook_rate_limit: {
        Args: { p_endpoint: string; p_user_id: string }
        Returns: boolean
      }
      cleanup_old_security_logs: { Args: never; Returns: undefined }
      cleanup_old_system_reports: { Args: never; Returns: undefined }
      cleanup_security_data: { Args: never; Returns: undefined }
      cleanup_security_tables: { Args: never; Returns: undefined }
      cleanup_webhook_logs: { Args: never; Returns: undefined }
      create_system_alert: {
        Args: {
          p_alert_type: string
          p_content: string
          p_metadata?: Json
          p_recipient_email: string
          p_subject: string
          p_user_id?: string
        }
        Returns: string
      }
      decrypt_email: {
        Args: { encrypted_email: string; encryption_key: string }
        Returns: string
      }
      delete_user_chat_sessions: {
        Args: { _session_ids: string[]; _user_id: string }
        Returns: boolean
      }
      detect_suspicious_ip: {
        Args: {
          _details?: Json
          _ip_address: unknown
          _severity?: string
          _threat_type: string
        }
        Returns: boolean
      }
      encrypt_email: {
        Args: { email: string; encryption_key: string }
        Returns: string
      }
      enhanced_rate_limit_check: {
        Args: {
          _action_type: string
          _max_attempts?: number
          _user_identifier?: string
          _window_minutes?: number
        }
        Returns: boolean
      }
      get_alert_history_with_emails: {
        Args: { p_alert_id?: string; p_encryption_key?: string }
        Returns: {
          alert_type: string
          content: string
          created_at: string
          error_message: string
          id: string
          metadata: Json
          recipient_email_decrypted: string
          sent_at: string
          status: string
          subject: string
          user_id: string
        }[]
      }
      get_extension_security_status: {
        Args: never
        Returns: {
          extension_name: string
          recommendation: string
          schema_name: string
          security_risk: string
        }[]
      }
      get_security_extension_audit: {
        Args: never
        Returns: {
          extension_name: string
          schema_name: string
          security_note: string
          version: string
        }[]
      }
      get_security_headers: { Args: never; Returns: Json }
      get_usage_stats: {
        Args: { _user_id?: string }
        Returns: {
          company_name: string
          current_usage: number
          monthly_limit: number
          reset_date: string
          usage_percentage: number
          user_email: string
          user_id: string
        }[]
      }
      get_user_profile_secure: {
        Args: { _user_id: string }
        Returns: {
          business_context: string
          business_type: string
          company_name: string
          contact_person: string
          created_at: string
          id: string
          phone: string
          updated_at: string
          user_id: string
        }[]
      }
      has_active_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_template_usage: {
        Args: { template_id: string }
        Returns: undefined
      }
      increment_usage: {
        Args: { _action_type?: string; _count?: number; _user_id: string }
        Returns: boolean
      }
      is_ip_blocked: { Args: { _ip_address: unknown }; Returns: boolean }
      log_admin_action: {
        Args: {
          _action: string
          _details?: Json
          _target_id?: string
          _target_table?: string
        }
        Returns: undefined
      }
      log_chat_security_event: {
        Args: { _action: string; _details?: Json; _session_id?: string }
        Returns: undefined
      }
      log_profiles_sensitive_access: {
        Args: {
          _accessed_fields?: string[]
          _additional_context?: Json
          _operation: string
          _user_id: string
        }
        Returns: undefined
      }
      log_security_event:
        | {
            Args: {
              _action: string
              _details?: Json
              _severity?: string
              _user_agent?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              _action: string
              _details?: Json
              _ip_address?: unknown
              _severity?: string
              _user_agent?: string
            }
            Returns: undefined
          }
      log_sensitive_data_audit: {
        Args: { _details?: Json; _operation: string; _table_name: string }
        Returns: undefined
      }
      log_webhook_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_endpoint: string
          p_severity?: string
          p_user_id?: string
        }
        Returns: undefined
      }
      record_device_fingerprint: {
        Args: {
          _device_info: Json
          _fingerprint_hash: string
          _user_id: string
        }
        Returns: string
      }
      trigger_emergency_alert: {
        Args: {
          _alert_level: string
          _alert_type: string
          _threat_assessment?: Json
          _trigger_reason: string
        }
        Returns: string
      }
      validate_input_sanitization: {
        Args: { input_text: string }
        Returns: boolean
      }
      validate_session_ownership: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      validate_session_security: { Args: never; Returns: boolean }
      validate_system_security: { Args: never; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
