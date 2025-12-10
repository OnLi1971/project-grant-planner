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
      api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          service_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          service_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          service_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          ai_summary_generated: boolean
          auto_tag_version: number | null
          auto_tags: string[] | null
          canonical_url: string | null
          clicks: number | null
          created_at: string
          html_content: string | null
          id: string
          importance: number | null
          is_selected: boolean
          keywords: string[]
          manual_tags: string[] | null
          original_url: string
          publish_at: string | null
          published_at: string | null
          published_date: string | null
          status: string | null
          summary: string
          tags: string[] | null
          title: string
          updated_at: string
          url_hash: string | null
        }
        Insert: {
          ai_summary_generated?: boolean
          auto_tag_version?: number | null
          auto_tags?: string[] | null
          canonical_url?: string | null
          clicks?: number | null
          created_at?: string
          html_content?: string | null
          id?: string
          importance?: number | null
          is_selected?: boolean
          keywords?: string[]
          manual_tags?: string[] | null
          original_url: string
          publish_at?: string | null
          published_at?: string | null
          published_date?: string | null
          status?: string | null
          summary: string
          tags?: string[] | null
          title: string
          updated_at?: string
          url_hash?: string | null
        }
        Update: {
          ai_summary_generated?: boolean
          auto_tag_version?: number | null
          auto_tags?: string[] | null
          canonical_url?: string | null
          clicks?: number | null
          created_at?: string
          html_content?: string | null
          id?: string
          importance?: number | null
          is_selected?: boolean
          keywords?: string[]
          manual_tags?: string[] | null
          original_url?: string
          publish_at?: string | null
          published_at?: string | null
          published_date?: string | null
          status?: string | null
          summary?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          url_hash?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          company: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          organizational_leader: string
          program: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organizational_leader: string
          program?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organizational_leader?: string
          program?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      engineers: {
        Row: {
          company: string
          created_at: string
          currency: string | null
          department_id: string | null
          display_name: string
          email: string | null
          end_date: string | null
          fte_percent: number
          handle: string | null
          hourly_rate: number | null
          id: string
          manager_id: string | null
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["engineer_status"]
          updated_at: string
        }
        Insert: {
          company?: string
          created_at?: string
          currency?: string | null
          department_id?: string | null
          display_name: string
          email?: string | null
          end_date?: string | null
          fte_percent?: number
          handle?: string | null
          hourly_rate?: number | null
          id?: string
          manager_id?: string | null
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["engineer_status"]
          updated_at?: string
        }
        Update: {
          company?: string
          created_at?: string
          currency?: string | null
          department_id?: string | null
          display_name?: string
          email?: string | null
          end_date?: string | null
          fte_percent?: number
          handle?: string | null
          hourly_rate?: number | null
          id?: string
          manager_id?: string | null
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["engineer_status"]
          updated_at?: string
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          key: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          cost: number
          created_at: string
          created_by: string | null
          expiration_date: string
          id: string
          name: string
          provider: string
          status: string
          total_seats: number
          type: string
          updated_at: string
          updated_by: string | null
          used_seats: number
        }
        Insert: {
          cost?: number
          created_at?: string
          created_by?: string | null
          expiration_date: string
          id?: string
          name: string
          provider: string
          status?: string
          total_seats?: number
          type: string
          updated_at?: string
          updated_by?: string | null
          used_seats?: number
        }
        Update: {
          cost?: number
          created_at?: string
          created_by?: string | null
          expiration_date?: string
          id?: string
          name?: string
          provider?: string
          status?: string
          total_seats?: number
          type?: string
          updated_at?: string
          updated_by?: string | null
          used_seats?: number
        }
        Relationships: []
      }
      planning_changes: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          created_at: string
          cw: string
          engineer_id: string | null
          id: string
          konstrukter: string
          new_value: string | null
          old_value: string | null
          planning_entry_id: string
          year: number
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          cw: string
          engineer_id?: string | null
          id?: string
          konstrukter: string
          new_value?: string | null
          old_value?: string | null
          planning_entry_id: string
          year: number
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          created_at?: string
          cw?: string
          engineer_id?: string | null
          id?: string
          konstrukter?: string
          new_value?: string | null
          old_value?: string | null
          planning_entry_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "planning_changes_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_entries: {
        Row: {
          created_at: string | null
          created_by: string | null
          cw: string
          engineer_id: string | null
          id: string
          is_tentative: boolean
          konstrukter: string
          mesic: string
          mh_tyden: number | null
          projekt: string | null
          updated_at: string | null
          updated_by: string | null
          week_monday: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          cw: string
          engineer_id?: string | null
          id?: string
          is_tentative?: boolean
          konstrukter: string
          mesic: string
          mh_tyden?: number | null
          projekt?: string | null
          updated_at?: string | null
          updated_by?: string | null
          week_monday?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          cw?: string
          engineer_id?: string | null
          id?: string
          is_tentative?: boolean
          konstrukter?: string
          mesic?: string
          mh_tyden?: number | null
          projekt?: string | null
          updated_at?: string | null
          updated_by?: string | null
          week_monday?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "planning_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_entries_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      programs: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_licenses: {
        Row: {
          created_at: string
          id: string
          license_id: string
          percentage: number
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          license_id: string
          percentage?: number
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          license_id?: string
          percentage?: number
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_licenses_license_id"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_project_licenses_project_id"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_managers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          average_hourly_rate: number | null
          budget: number | null
          code: string
          created_at: string
          created_by: string | null
          customer_id: string
          end_date: string | null
          hourly_rate: number | null
          id: string
          name: string
          parent_opportunity: string | null
          presales_end_date: string | null
          presales_phase: string | null
          presales_start_date: string | null
          probability: number | null
          program_id: string
          project_manager_id: string
          project_status: string | null
          project_type: string
          start_date: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          average_hourly_rate?: number | null
          budget?: number | null
          code: string
          created_at?: string
          created_by?: string | null
          customer_id: string
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          name: string
          parent_opportunity?: string | null
          presales_end_date?: string | null
          presales_phase?: string | null
          presales_start_date?: string | null
          probability?: number | null
          program_id: string
          project_manager_id: string
          project_status?: string | null
          project_type?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          average_hourly_rate?: number | null
          budget?: number | null
          code?: string
          created_at?: string
          created_by?: string | null
          customer_id?: string
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          name?: string
          parent_opportunity?: string | null
          presales_end_date?: string | null
          presales_phase?: string | null
          presales_start_date?: string | null
          probability?: number | null
          program_id?: string
          project_manager_id?: string
          project_status?: string | null
          project_type?: string
          start_date?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_projects_customer_id"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_program_id"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_projects_project_manager_id"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "project_managers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      planning_matrix: {
        Row: {
          cw: string | null
          cw_full: string | null
          engineer_id: string | null
          is_tentative: boolean | null
          konstrukter: string | null
          mesic: string | null
          mh_tyden: number | null
          normalized_name: string | null
          planning_entry_id: string | null
          projekt: string | null
          updated_at: string | null
          year: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_week_monday_from_cw: {
        Args: { p_cw: string; p_year: number }
        Returns: string
      }
      cleanup_expired_idempotency_keys: { Args: never; Returns: undefined }
      engineers_create:
        | {
            Args: {
              p_department?: string
              p_display_name: string
              p_email?: string
              p_fte?: number
              p_manager?: string
              p_status?: Database["public"]["Enums"]["engineer_status"]
            }
            Returns: {
              company: string
              created_at: string
              currency: string | null
              department_id: string | null
              display_name: string
              email: string | null
              end_date: string | null
              fte_percent: number
              handle: string | null
              hourly_rate: number | null
              id: string
              manager_id: string | null
              slug: string
              start_date: string | null
              status: Database["public"]["Enums"]["engineer_status"]
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "engineers"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_company?: string
              p_currency?: string
              p_department?: string
              p_display_name: string
              p_email?: string
              p_fte?: number
              p_hourly_rate?: number
              p_manager?: string
              p_status?: Database["public"]["Enums"]["engineer_status"]
            }
            Returns: {
              company: string
              created_at: string
              currency: string | null
              department_id: string | null
              display_name: string
              email: string | null
              end_date: string | null
              fte_percent: number
              handle: string | null
              hourly_rate: number | null
              id: string
              manager_id: string | null
              slug: string
              start_date: string | null
              status: Database["public"]["Enums"]["engineer_status"]
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "engineers"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      engineers_update:
        | {
            Args: {
              p_department?: string
              p_display_name?: string
              p_email?: string
              p_fte?: number
              p_id: string
              p_manager?: string
              p_status?: Database["public"]["Enums"]["engineer_status"]
            }
            Returns: {
              company: string
              created_at: string
              currency: string | null
              department_id: string | null
              display_name: string
              email: string | null
              end_date: string | null
              fte_percent: number
              handle: string | null
              hourly_rate: number | null
              id: string
              manager_id: string | null
              slug: string
              start_date: string | null
              status: Database["public"]["Enums"]["engineer_status"]
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "engineers"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_company?: string
              p_currency?: string
              p_department?: string
              p_display_name?: string
              p_email?: string
              p_fte?: number
              p_hourly_rate?: number
              p_id: string
              p_manager?: string
              p_status?: Database["public"]["Enums"]["engineer_status"]
            }
            Returns: {
              company: string
              created_at: string
              currency: string | null
              department_id: string | null
              display_name: string
              email: string | null
              end_date: string | null
              fte_percent: number
              handle: string | null
              hourly_rate: number | null
              id: string
              manager_id: string | null
              slug: string
              start_date: string | null
              status: Database["public"]["Enums"]["engineer_status"]
              updated_at: string
            }
            SetofOptions: {
              from: "*"
              to: "engineers"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      is_admin: { Args: never; Returns: boolean }
      normalize_name: { Args: { name: string }; Returns: string }
      normalize_slug: { Args: { p_name: string }; Returns: string }
    }
    Enums: {
      engineer_status: "active" | "inactive" | "contractor" | "on_leave"
      user_role: "admin" | "editor" | "viewer"
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
      engineer_status: ["active", "inactive", "contractor", "on_leave"],
      user_role: ["admin", "editor", "viewer"],
    },
  },
} as const
