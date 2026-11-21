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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json
          id: string
          lead_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          id?: string
          lead_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          id?: string
          lead_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          property_id: string | null
          reminder_sent_1h: boolean
          reminder_sent_24h: boolean
          scheduled_at: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          property_id?: string | null
          reminder_sent_1h?: boolean
          reminder_sent_24h?: boolean
          scheduled_at: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          property_id?: string | null
          reminder_sent_1h?: boolean
          reminder_sent_24h?: boolean
          scheduled_at?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          ai_language: string
          ai_tone: string
          city: string
          company_name: string
          id: string
          updated_at: string
          working_days: string[]
          working_hours_end: string
          working_hours_start: string
        }
        Insert: {
          ai_language?: string
          ai_tone?: string
          city?: string
          company_name?: string
          id?: string
          updated_at?: string
          working_days?: string[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Update: {
          ai_language?: string
          ai_tone?: string
          city?: string
          company_name?: string
          id?: string
          updated_at?: string
          working_days?: string[]
          working_hours_end?: string
          working_hours_start?: string
        }
        Relationships: []
      }
      followups: {
        Row: {
          channel: string
          created_at: string
          id: string
          lead_id: string
          scheduled_for: string
          sent_at: string | null
          status: string
          step_number: number
          template_key: string | null
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          lead_id: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          step_number?: number
          template_key?: string | null
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          lead_id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          step_number?: number
          template_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_summary: string | null
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          consent_at: string | null
          consent_given: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          ig_handle: string | null
          intent: string | null
          last_contact_at: string | null
          lead_score: string
          next_followup_at: string | null
          notes: string | null
          phone: string
          preferred_location: string | null
          property_type: string | null
          source: string
          status: string
          timeline: string | null
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          ig_handle?: string | null
          intent?: string | null
          last_contact_at?: string | null
          lead_score?: string
          next_followup_at?: string | null
          notes?: string | null
          phone: string
          preferred_location?: string | null
          property_type?: string | null
          source: string
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          consent_at?: string | null
          consent_given?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          ig_handle?: string | null
          intent?: string | null
          last_contact_at?: string | null
          lead_score?: string
          next_followup_at?: string | null
          notes?: string | null
          phone?: string
          preferred_location?: string | null
          property_type?: string | null
          source?: string
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel: string
          content: string
          created_at: string
          direction: string
          id: string
          lead_id: string
          sender: string
        }
        Insert: {
          channel: string
          content: string
          created_at?: string
          direction: string
          id?: string
          lead_id: string
          sender: string
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          legacy_user_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          legacy_user_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          legacy_user_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          bhk: string | null
          brochure_url: string | null
          carpet_area: number | null
          created_at: string
          description: string
          id: string
          location: string
          payment_plan: string | null
          price_max: number
          price_min: number
          project_name: string
          property_type: string
          rera_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bhk?: string | null
          brochure_url?: string | null
          carpet_area?: number | null
          created_at?: string
          description?: string
          id?: string
          location: string
          payment_plan?: string | null
          price_max?: number
          price_min?: number
          project_name: string
          property_type: string
          rera_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bhk?: string | null
          brochure_url?: string | null
          carpet_area?: number | null
          created_at?: string
          description?: string
          id?: string
          location?: string
          payment_plan?: string | null
          price_max?: number
          price_min?: number
          project_name?: string
          property_type?: string
          rera_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      appointment_time_is_valid: {
        Args: { p_scheduled_at: string }
        Returns: boolean
      }
      book_public_appointment: {
        Args: {
          p_consent_given?: boolean
          p_email: string
          p_full_name: string
          p_intent?: string
          p_notes?: string
          p_phone: string
          p_preferred_location?: string
          p_property_id?: string
          p_scheduled_at?: string
          p_timeline?: string
          p_type: string
        }
        Returns: Json
      }
      create_crm_appointment: {
        Args: {
          p_lead_id: string
          p_notes?: string
          p_property_id?: string
          p_scheduled_at?: string
          p_type: string
        }
        Returns: Json
      }
      get_public_booked_slots: {
        Args: { p_date: string; p_property_id?: string }
        Returns: {
          scheduled_at: string
        }[]
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      reschedule_crm_appointment: {
        Args: { p_appointment_id: string; p_scheduled_at: string }
        Returns: Json
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
