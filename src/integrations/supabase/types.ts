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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          target_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      consents: {
        Row: {
          accepted_at: string
          id: string
          policy_version: string
          scope: Database["public"]["Enums"]["consent_scope"]
          user_id: string
          withdrawn_at: string | null
        }
        Insert: {
          accepted_at?: string
          id?: string
          policy_version: string
          scope: Database["public"]["Enums"]["consent_scope"]
          user_id: string
          withdrawn_at?: string | null
        }
        Update: {
          accepted_at?: string
          id?: string
          policy_version?: string
          scope?: Database["public"]["Enums"]["consent_scope"]
          user_id?: string
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      guard_locations: {
        Row: {
          accuracy: number | null
          battery_level: number | null
          created_at: string
          device_timestamp: string
          guard_id: string
          heading: number | null
          id: number
          latitude: number
          longitude: number
          shift_id: string
          signal_strength: string
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          device_timestamp: string
          guard_id: string
          heading?: number | null
          id?: number
          latitude: number
          longitude: number
          shift_id: string
          signal_strength?: string
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          battery_level?: number | null
          created_at?: string
          device_timestamp?: string
          guard_id?: string
          heading?: number | null
          id?: number
          latitude?: number
          longitude?: number
          shift_id?: string
          signal_strength?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guard_locations_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "guard_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      guard_shifts: {
        Row: {
          battery_level: number | null
          created_at: string
          ended_at: string | null
          guard_id: string
          guard_name: string
          id: string
          last_seen_at: string | null
          movement_status: string
          signal_strength: string
          started_at: string | null
          status: string
          updated_at: string
          zone_center_lat: number
          zone_center_lng: number
          zone_name: string
          zone_radius_m: number
        }
        Insert: {
          battery_level?: number | null
          created_at?: string
          ended_at?: string | null
          guard_id: string
          guard_name?: string
          id?: string
          last_seen_at?: string | null
          movement_status?: string
          signal_strength?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          zone_center_lat?: number
          zone_center_lng?: number
          zone_name?: string
          zone_radius_m?: number
        }
        Update: {
          battery_level?: number | null
          created_at?: string
          ended_at?: string | null
          guard_id?: string
          guard_name?: string
          id?: string
          last_seen_at?: string | null
          movement_status?: string
          signal_strength?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          zone_center_lat?: number
          zone_center_lng?: number
          zone_name?: string
          zone_radius_m?: number
        }
        Relationships: []
      }
      location_sessions: {
        Row: {
          anonymised: boolean
          ended_at: string | null
          id: string
          owner_id: string
          planned_end_at: string
          purpose: string
          retention_category: string
          scope: Database["public"]["Enums"]["consent_scope"]
          started_at: string
        }
        Insert: {
          anonymised?: boolean
          ended_at?: string | null
          id?: string
          owner_id: string
          planned_end_at: string
          purpose: string
          retention_category?: string
          scope: Database["public"]["Enums"]["consent_scope"]
          started_at?: string
        }
        Update: {
          anonymised?: boolean
          ended_at?: string | null
          id?: string
          owner_id?: string
          planned_end_at?: string
          purpose?: string
          retention_category?: string
          scope?: Database["public"]["Enums"]["consent_scope"]
          started_at?: string
        }
        Relationships: []
      }
      location_updates: {
        Row: {
          accuracy: number | null
          id: number
          lat: number
          lng: number
          recorded_at: string
          session_id: string
          speed: number | null
        }
        Insert: {
          accuracy?: number | null
          id?: never
          lat: number
          lng: number
          recorded_at?: string
          session_id: string
          speed?: number | null
        }
        Update: {
          accuracy?: number | null
          id?: never
          lat?: number
          lng?: number
          recorded_at?: string
          session_id?: string
          speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "location_updates_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "location_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      session_viewers: {
        Row: {
          added_at: string
          session_id: string
          viewer_id: string
        }
        Insert: {
          added_at?: string
          session_id: string
          viewer_id: string
        }
        Update: {
          added_at?: string
          session_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_viewers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "location_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["role_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["role_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["role_status"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_session_viewer: {
        Args: { _email: string; _sid: string }
        Returns: boolean
      }
      admin_remove_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user: string }
        Returns: undefined
      }
      admin_set_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _status: Database["public"]["Enums"]["role_status"]
          _user: string
        }
        Returns: undefined
      }
      can_view_session: {
        Args: { _sid: string; _uid: string }
        Returns: boolean
      }
      delete_my_session: { Args: { _sid: string }; Returns: undefined }
      drop_my_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_session_owner: {
        Args: { _sid: string; _uid: string }
        Returns: boolean
      }
      log_location_view: { Args: { _sid: string }; Returns: undefined }
      purge_expired_location_data: { Args: never; Returns: number }
      request_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: Database["public"]["Enums"]["role_status"]
      }
      session_is_live: { Args: { _sid: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "civilian"
        | "guardian"
        | "family_member"
        | "employee"
        | "patroller"
        | "dispatcher"
        | "official"
        | "admin"
        | "security_company"
      consent_scope:
        | "track_me"
        | "suspicious_ride"
        | "escort"
        | "family"
        | "company"
        | "official_protection"
      role_status: "approved" | "pending" | "rejected"
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
    Enums: {
      app_role: [
        "civilian",
        "guardian",
        "family_member",
        "employee",
        "patroller",
        "dispatcher",
        "official",
        "admin",
        "security_company",
      ],
      consent_scope: [
        "track_me",
        "suspicious_ride",
        "escort",
        "family",
        "company",
        "official_protection",
      ],
      role_status: ["approved", "pending", "rejected"],
    },
  },
} as const
