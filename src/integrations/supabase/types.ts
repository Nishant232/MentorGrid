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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          currency: string | null
          end_time: string
          id: string
          meeting_url: string | null
          mentee_feedback_submitted: boolean | null
          mentee_user_id: string
          mentor_feedback_submitted: boolean | null
          mentor_user_id: string
          notes: string | null
          price_cents: number | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          end_time: string
          id?: string
          meeting_url?: string | null
          mentee_feedback_submitted?: boolean | null
          mentee_user_id: string
          mentor_feedback_submitted?: boolean | null
          mentor_user_id: string
          notes?: string | null
          price_cents?: number | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          end_time?: string
          id?: string
          meeting_url?: string | null
          mentee_feedback_submitted?: boolean | null
          mentee_user_id?: string
          mentor_feedback_submitted?: boolean | null
          mentor_user_id?: string
          notes?: string | null
          price_cents?: number | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendar_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          email: string
          id: string
          provider: string
          refresh_token: string | null
          sync_enabled: boolean
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          email: string
          id?: string
          provider: string
          refresh_token?: string | null
          sync_enabled?: boolean
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          email?: string
          id?: string
          provider?: string
          refresh_token?: string | null
          sync_enabled?: boolean
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          mentor_count: number | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          mentor_count?: number | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          mentor_count?: number | null
          name?: string
        }
        Relationships: []
      }
      external_busy_events: {
        Row: {
          calendar_account_id: string
          created_at: string
          end_time: string
          external_id: string
          id: string
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          calendar_account_id: string
          created_at?: string
          end_time: string
          external_id: string
          id?: string
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          calendar_account_id?: string
          created_at?: string
          end_time?: string
          external_id?: string
          id?: string
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_busy_events_calendar_account_id_fkey"
            columns: ["calendar_account_id"]
            isOneToOne: false
            referencedRelation: "calendar_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak_days: number | null
          full_name: string
          id: string
          role: string
          updated_at: string
          user_id: string
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak_days?: number | null
          full_name: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak_days?: number | null
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
          xp?: number | null
        }
        Relationships: []
      }
      mentee_profiles: {
        Row: {
          bio: string | null
          budget_range: string | null
          created_at: string
          current_level: string | null
          goals: string[] | null
          id: string
          interests: string[] | null
          learning_style: string | null
          preferred_meeting_frequency: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          budget_range?: string | null
          created_at?: string
          current_level?: string | null
          goals?: string[] | null
          id?: string
          interests?: string[] | null
          learning_style?: string | null
          preferred_meeting_frequency?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          budget_range?: string | null
          created_at?: string
          current_level?: string | null
          goals?: string[] | null
          id?: string
          interests?: string[] | null
          learning_style?: string | null
          preferred_meeting_frequency?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_availability_exceptions: {
        Row: {
          created_at: string
          date: string
          end_minute: number | null
          id: string
          is_available: boolean
          mentor_user_id: string
          notes: string | null
          start_minute: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_minute?: number | null
          id?: string
          is_available?: boolean
          mentor_user_id: string
          notes?: string | null
          start_minute?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_minute?: number | null
          id?: string
          is_available?: boolean
          mentor_user_id?: string
          notes?: string | null
          start_minute?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      mentor_availability_rules: {
        Row: {
          created_at: string
          end_minute: number
          id: string
          is_active: boolean
          mentor_user_id: string
          start_minute: number
          timezone: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_minute: number
          id?: string
          is_active?: boolean
          mentor_user_id: string
          start_minute: number
          timezone?: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_minute?: number
          id?: string
          is_active?: boolean
          mentor_user_id?: string
          start_minute?: number
          timezone?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      mentor_profiles: {
        Row: {
          availability: Json | null
          bio: string | null
          certifications: string[] | null
          created_at: string
          currency: string | null
          education: string | null
          expertise_areas: string[] | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          languages: string[] | null
          skills: string[] | null
          timezone: string | null
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability?: Json | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          currency?: string | null
          education?: string | null
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          skills?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability?: Json | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          currency?: string | null
          education?: string | null
          expertise_areas?: string[] | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          skills?: string[] | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          onboarding_completed: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          onboarding_completed?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          onboarding_completed?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          feedback: string | null
          id: string
          is_public: boolean | null
          rating: number
          reviewee_user_id: string
          reviewer_user_id: string
          status: string | null
          tags: string[] | null
          type: string | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          is_public?: boolean | null
          rating: number
          reviewee_user_id: string
          reviewer_user_id: string
          status?: string | null
          tags?: string[] | null
          type?: string | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          is_public?: boolean | null
          rating?: number
          reviewee_user_id?: string
          reviewer_user_id?: string
          status?: string | null
          tags?: string[] | null
          type?: string | null
        }
        Relationships: []
      }
      session_messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          message: string
          sender_user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          message: string
          sender_user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          content: string
          created_at: string
          id: string
          rating: number | null
          user_name: string
          user_role: string
        }
        Insert: {
          avatar_url?: string | null
          content: string
          created_at?: string
          id?: string
          rating?: number | null
          user_name: string
          user_role: string
        }
        Update: {
          avatar_url?: string | null
          content?: string
          created_at?: string
          id?: string
          rating?: number | null
          user_name?: string
          user_role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_booking: {
        Args: {
          p_currency?: string
          p_end: string
          p_mentee_user_id: string
          p_mentor_user_id: string
          p_notes?: string
          p_price_cents: number
          p_start: string
        }
        Returns: string
      }
      get_safe_profile_info: {
        Args: { target_user_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          user_id: string
        }[]
      }
      is_super_admin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      update_user_role_secure: {
        Args: {
          admin_user_id: string
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "mentor" | "mentee" | "admin"
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
      app_role: ["mentor", "mentee", "admin"],
    },
  },
} as const
