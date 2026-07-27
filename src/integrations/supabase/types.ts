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
      analytics_events: {
        Row: {
          country: string | null
          created_at: string
          event_type: string
          id: string
          path: string | null
          referrer: string | null
          screen: string | null
          session_id: string | null
          site_id: string
          tracking_id: string
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          event_type?: string
          id?: string
          path?: string | null
          referrer?: string | null
          screen?: string | null
          session_id?: string | null
          site_id: string
          tracking_id: string
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          event_type?: string
          id?: string
          path?: string | null
          referrer?: string | null
          screen?: string | null
          session_id?: string | null
          site_id?: string
          tracking_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "analytics_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sites: {
        Row: {
          created_at: string
          domain: string
          id: string
          name: string
          tracking_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          name: string
          tracking_id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          name?: string
          tracking_id?: string
          user_id?: string
        }
        Relationships: []
      }
      checks: {
        Row: {
          created_at: string | null
          duration: number | null
          error_message: string | null
          id: string
          node_id: string | null
          operator_id: string | null
          response_time: number | null
          screenshot_url: string | null
          status: string
          status_code: number | null
          url: string
        }
        Insert: {
          created_at?: string | null
          duration?: number | null
          error_message?: string | null
          id?: string
          node_id?: string | null
          operator_id?: string | null
          response_time?: number | null
          screenshot_url?: string | null
          status: string
          status_code?: number | null
          url: string
        }
        Update: {
          created_at?: string | null
          duration?: number | null
          error_message?: string | null
          id?: string
          node_id?: string | null
          operator_id?: string | null
          response_time?: number | null
          screenshot_url?: string | null
          status?: string
          status_code?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "checks_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_credentials: {
        Row: {
          api_key: string
          config: Json | null
          connector_id: string
          created_at: string
          id: string
          last_tested_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          config?: Json | null
          connector_id: string
          created_at?: string
          id?: string
          last_tested_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          config?: Json | null
          connector_id?: string
          created_at?: string
          id?: string
          last_tested_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_projects: {
        Row: {
          created_at: string
          database_schema: Json | null
          description: string | null
          env_vars: Json
          files: Json
          id: string
          name: string
          pr_url: string | null
          prompt: string | null
          repo_full_name: string | null
          stack: string | null
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          database_schema?: Json | null
          description?: string | null
          env_vars?: Json
          files?: Json
          id?: string
          name: string
          pr_url?: string | null
          prompt?: string | null
          repo_full_name?: string | null
          stack?: string | null
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          database_schema?: Json | null
          description?: string | null
          env_vars?: Json
          files?: Json
          id?: string
          name?: string
          pr_url?: string | null
          prompt?: string | null
          repo_full_name?: string | null
          stack?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nodes: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          name: string
          operator_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          name: string
          operator_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          name?: string
          operator_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nodes_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          is_verified: boolean | null
          location: string | null
          name: string | null
          npub: string
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          name?: string | null
          npub: string
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          location?: string | null
          name?: string | null
          npub?: string
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_inr_paise: number
          amount_usd: number
          created_at: string
          credits: number
          currency: string
          id: string
          plan: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          storage_gb: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_inr_paise: number
          amount_usd: number
          created_at?: string
          credits?: number
          currency?: string
          id?: string
          plan: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          storage_gb?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_inr_paise?: number
          amount_usd?: number
          created_at?: string
          credits?: number
          currency?: string
          id?: string
          plan?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          storage_gb?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_runs: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          logs: string
          pipeline_id: string
          started_at: string | null
          status: string
          steps: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          logs?: string
          pipeline_id: string
          started_at?: string | null
          status?: string
          steps?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          logs?: string
          pipeline_id?: string
          started_at?: string | null
          status?: string
          steps?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_runs_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          env: Json
          id: string
          name: string
          repo_full_name: string | null
          steps: Json
          trigger: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          env?: Json
          id?: string
          name: string
          repo_full_name?: string | null
          steps?: Json
          trigger?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          env?: Json
          id?: string
          name?: string
          repo_full_name?: string | null
          steps?: Json
          trigger?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          npub: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
          npub?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          npub?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_envs: {
        Row: {
          created_at: string
          id: string
          key: string
          project_id: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          project_id: string
          user_id: string
          value?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          project_id?: string
          user_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_envs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "generated_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      security_scans: {
        Row: {
          ai_analysis: string | null
          created_at: string
          findings: Json | null
          grade: string | null
          headers: Json | null
          id: string
          score: number | null
          ssl: Json | null
          status: string
          summary: string | null
          url: string
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          created_at?: string
          findings?: Json | null
          grade?: string | null
          headers?: Json | null
          id?: string
          score?: number | null
          ssl?: Json | null
          status?: string
          summary?: string | null
          url: string
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          created_at?: string
          findings?: Json | null
          grade?: string | null
          headers?: Json | null
          id?: string
          score?: number | null
          ssl?: Json | null
          status?: string
          summary?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          kind: string
          priority: string
          project_id: string | null
          prompt: string | null
          recurrence: string | null
          repo_full_name: string | null
          result: string | null
          scheduled_at: string | null
          status: string
          target_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          kind?: string
          priority?: string
          project_id?: string | null
          prompt?: string | null
          recurrence?: string | null
          repo_full_name?: string | null
          result?: string | null
          scheduled_at?: string | null
          status?: string
          target_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          kind?: string
          priority?: string
          project_id?: string | null
          prompt?: string | null
          recurrence?: string | null
          repo_full_name?: string | null
          result?: string | null
          scheduled_at?: string | null
          status?: string
          target_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          owner_id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          owner_id: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          owner_id?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
