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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      bot_activity_log: {
        Row: {
          action_detail: string
          action_type: string
          created_at: string
          id: string
          platform: string
          status: string
          token_submission_id: string | null
          token_symbol: string
        }
        Insert: {
          action_detail: string
          action_type: string
          created_at?: string
          id?: string
          platform: string
          status?: string
          token_submission_id?: string | null
          token_symbol: string
        }
        Update: {
          action_detail?: string
          action_type?: string
          created_at?: string
          id?: string
          platform?: string
          status?: string
          token_submission_id?: string | null
          token_symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_activity_log_token_submission_id_fkey"
            columns: ["token_submission_id"]
            isOneToOne: false
            referencedRelation: "token_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_type: string
          created_at: string
          current_participants: number | null
          description: string | null
          end_time: string | null
          id: string
          name: string
          reward_pool: number | null
          start_time: string
          status: string
          target_participants: number | null
          token_address: string | null
          token_symbol: string | null
        }
        Insert: {
          campaign_type: string
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          id?: string
          name: string
          reward_pool?: number | null
          start_time?: string
          status?: string
          target_participants?: number | null
          token_address?: string | null
          token_symbol?: string | null
        }
        Update: {
          campaign_type?: string
          created_at?: string
          current_participants?: number | null
          description?: string | null
          end_time?: string | null
          id?: string
          name?: string
          reward_pool?: number | null
          start_time?: string
          status?: string
          target_participants?: number | null
          token_address?: string | null
          token_symbol?: string | null
        }
        Relationships: []
      }
      community_missions: {
        Row: {
          completions_count: number | null
          created_at: string
          description: string
          expires_at: string | null
          id: string
          mission_type: string
          required_amount: number | null
          reward_points: number
          status: string
          title: string
          token_address: string | null
          token_symbol: string | null
        }
        Insert: {
          completions_count?: number | null
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          mission_type: string
          required_amount?: number | null
          reward_points?: number
          status?: string
          title: string
          token_address?: string | null
          token_symbol?: string | null
        }
        Update: {
          completions_count?: number | null
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          mission_type?: string
          required_amount?: number | null
          reward_points?: number
          status?: string
          title?: string
          token_address?: string | null
          token_symbol?: string | null
        }
        Relationships: []
      }
      mission_completions: {
        Row: {
          created_at: string
          id: string
          mission_id: string | null
          points_earned: number
          proof_data: Json | null
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          mission_id?: string | null
          points_earned?: number
          proof_data?: Json | null
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_id?: string | null
          points_earned?: number
          proof_data?: Json | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_completions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "community_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          total_points_earned: number
          uses_count: number
          wallet_address: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          total_points_earned?: number
          uses_count?: number
          wallet_address: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          total_points_earned?: number
          uses_count?: number
          wallet_address?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          created_at: string
          id: string
          likes: number | null
          platform: string
          post_text: string
          reactions: number | null
          shares: number | null
          token_submission_id: string | null
          views: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          likes?: number | null
          platform: string
          post_text: string
          reactions?: number | null
          shares?: number | null
          token_submission_id?: string | null
          views?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          likes?: number | null
          platform?: string
          post_text?: string
          reactions?: number | null
          shares?: number | null
          token_submission_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_token_submission_id_fkey"
            columns: ["token_submission_id"]
            isOneToOne: false
            referencedRelation: "token_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      token_risk_scores: {
        Row: {
          checked_at: string | null
          contract_renounced: boolean | null
          created_at: string
          honeypot_detected: boolean | null
          id: string
          liquidity_locked: boolean | null
          liquidity_sol: number | null
          risk_level: string
          risk_notes: string[] | null
          token_address: string
          top_holder_pct: number | null
        }
        Insert: {
          checked_at?: string | null
          contract_renounced?: boolean | null
          created_at?: string
          honeypot_detected?: boolean | null
          id?: string
          liquidity_locked?: boolean | null
          liquidity_sol?: number | null
          risk_level?: string
          risk_notes?: string[] | null
          token_address: string
          top_holder_pct?: number | null
        }
        Update: {
          checked_at?: string | null
          contract_renounced?: boolean | null
          created_at?: string
          honeypot_detected?: boolean | null
          id?: string
          liquidity_locked?: boolean | null
          liquidity_sol?: number | null
          risk_level?: string
          risk_notes?: string[] | null
          token_address?: string
          top_holder_pct?: number | null
        }
        Relationships: []
      }
      token_submissions: {
        Row: {
          created_at: string
          engagement_score: number | null
          expires_at: string | null
          id: string
          price_sol: number
          promotion_type: string
          services_delivered: Json | null
          status: string
          token_address: string
          token_name: string | null
          token_symbol: string | null
          tx_signature: string | null
          views: number | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          engagement_score?: number | null
          expires_at?: string | null
          id?: string
          price_sol?: number
          promotion_type: string
          services_delivered?: Json | null
          status?: string
          token_address: string
          token_name?: string | null
          token_symbol?: string | null
          tx_signature?: string | null
          views?: number | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          engagement_score?: number | null
          expires_at?: string | null
          id?: string
          price_sol?: number
          promotion_type?: string
          services_delivered?: Json | null
          status?: string
          token_address?: string
          token_name?: string | null
          token_symbol?: string | null
          tx_signature?: string | null
          views?: number | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      wallet_labels: {
        Row: {
          created_at: string
          id: string
          label: string
          last_activity: string | null
          metadata: Json | null
          score: number | null
          tokens_tracked: number | null
          total_volume_sol: number | null
          wallet_address: string
          win_rate: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          last_activity?: string | null
          metadata?: Json | null
          score?: number | null
          tokens_tracked?: number | null
          total_volume_sol?: number | null
          wallet_address: string
          win_rate?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          last_activity?: string | null
          metadata?: Json | null
          score?: number | null
          tokens_tracked?: number | null
          total_volume_sol?: number | null
          wallet_address?: string
          win_rate?: number | null
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
