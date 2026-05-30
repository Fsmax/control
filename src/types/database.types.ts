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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      activities: {
        Row: {
          body: string | null
          client_id: string
          created_at: string
          deal_id: string | null
          id: string
          occurred_at: string
          subject: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          client_id: string
          created_at?: string
          deal_id?: string | null
          id?: string
          occurred_at?: string
          subject: string
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string
        }
        Update: {
          body?: string | null
          client_id?: string
          created_at?: string
          deal_id?: string | null
          id?: string
          occurred_at?: string
          subject?: string
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_valuations: {
        Row: {
          as_of: string
          asset_id: string
          created_at: string
          id: string
          user_id: string
          value: number
        }
        Insert: {
          as_of?: string
          asset_id: string
          created_at?: string
          id?: string
          user_id?: string
          value: number
        }
        Update: {
          as_of?: string
          asset_id?: string
          created_at?: string
          id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_valuations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          created_at: string
          currency: string
          current_value: number
          id: string
          kind: Database["public"]["Enums"]["asset_kind"]
          name: string
          note: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          current_value?: number
          id?: string
          kind?: Database["public"]["Enums"]["asset_kind"]
          name: string
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          currency?: string
          current_value?: number
          id?: string
          kind?: Database["public"]["Enums"]["asset_kind"]
          name?: string
          note?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          kind: Database["public"]["Enums"]["client_kind"]
          name: string
          note: string | null
          phone: string | null
          site_address: string | null
          status: Database["public"]["Enums"]["client_status"]
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["client_kind"]
          name: string
          note?: string | null
          phone?: string | null
          site_address?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["client_kind"]
          name?: string
          note?: string | null
          phone?: string | null
          site_address?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          tax_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          note: string | null
          phone: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          note?: string | null
          phone?: string | null
          role?: string | null
          user_id?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          note?: string | null
          phone?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          currency: string
          expected_close_date: string | null
          id: string
          lost_at: string | null
          lost_reason: string | null
          note: string | null
          position: number
          stage: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at: string
          user_id: string
          won_at: string | null
        }
        Insert: {
          amount?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          expected_close_date?: string | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          note?: string | null
          position?: number
          stage?: Database["public"]["Enums"]["deal_stage"]
          title: string
          updated_at?: string
          user_id?: string
          won_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          expected_close_date?: string | null
          id?: string
          lost_at?: string | null
          lost_reason?: string | null
          note?: string | null
          position?: number
          stage?: Database["public"]["Enums"]["deal_stage"]
          title?: string
          updated_at?: string
          user_id?: string
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          debt_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          debt_id: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          debt_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          amount: number
          counterparty: string
          created_at: string
          currency: string
          direction: Database["public"]["Enums"]["debt_direction"]
          due_date: string | null
          id: string
          note: string | null
          status: Database["public"]["Enums"]["debt_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          counterparty: string
          created_at?: string
          currency?: string
          direction: Database["public"]["Enums"]["debt_direction"]
          due_date?: string | null
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["debt_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          counterparty?: string
          created_at?: string
          currency?: string
          direction?: Database["public"]["Enums"]["debt_direction"]
          due_date?: string | null
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["debt_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          note: string | null
          project_id: string | null
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          note?: string | null
          project_id?: string | null
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          note?: string | null
          project_id?: string | null
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          currency: string
          deal_id: string | null
          due_date: string | null
          id: string
          issue_date: string
          note: string | null
          number: string
          paid_at: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          currency?: string
          deal_id?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          note?: string | null
          number: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          deal_id?: string | null
          due_date?: string | null
          id?: string
          issue_date?: string
          note?: string | null
          number?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          base_currency: string
          created_at: string
          day_goal: number
          focus_goal_min: number
          id: string
          name: string | null
          timezone: string
        }
        Insert: {
          avatar_url?: string | null
          base_currency?: string
          created_at?: string
          day_goal?: number
          focus_goal_min?: number
          id: string
          name?: string | null
          timezone?: string
        }
        Update: {
          avatar_url?: string | null
          base_currency?: string
          created_at?: string
          day_goal?: number
          focus_goal_min?: number
          id?: string
          name?: string | null
          timezone?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          area: Database["public"]["Enums"]["area"]
          client_id: string | null
          color: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["project_status"]
          user_id: string
        }
        Insert: {
          area?: Database["public"]["Enums"]["area"]
          client_id?: string | null
          color?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["project_status"]
          user_id?: string
        }
        Update: {
          area?: Database["public"]["Enums"]["area"]
          client_id?: string | null
          color?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["project_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          currency: string
          id: string
          kind: Database["public"]["Enums"]["recurring_kind"]
          name: string
          next_date: string
          note: string | null
          period: Database["public"]["Enums"]["recurring_period"]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount: number
          created_at?: string
          currency?: string
          id?: string
          kind: Database["public"]["Enums"]["recurring_kind"]
          name: string
          next_date: string
          note?: string | null
          period?: Database["public"]["Enums"]["recurring_period"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          kind?: Database["public"]["Enums"]["recurring_kind"]
          name?: string
          next_date?: string
          note?: string | null
          period?: Database["public"]["Enums"]["recurring_period"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          area: Database["public"]["Enums"]["area"]
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          end_at: string | null
          id: string
          is_meeting: boolean
          payout_amount: number | null
          payout_currency: string | null
          position: number
          priority: Database["public"]["Enums"]["priority"]
          project_id: string | null
          remind_at: string | null
          reminded_at: string | null
          scheduled_for: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: Database["public"]["Enums"]["area"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          end_at?: string | null
          id?: string
          is_meeting?: boolean
          payout_amount?: number | null
          payout_currency?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["priority"]
          project_id?: string | null
          remind_at?: string | null
          reminded_at?: string | null
          scheduled_for?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          area?: Database["public"]["Enums"]["area"]
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          end_at?: string | null
          id?: string
          is_meeting?: boolean
          payout_amount?: number | null
          payout_currency?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["priority"]
          project_id?: string | null
          remind_at?: string | null
          reminded_at?: string | null
          scheduled_for?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      daily_done: {
        Args: {
          area_filter?: Database["public"]["Enums"]["area"]
          since: string
          tz: string
          uid: string
        }
        Returns: {
          day: string
          done: number
        }[]
      }
    }
    Enums: {
      activity_type: "CALL" | "MEETING" | "EMAIL" | "NOTE"
      area: "WORK" | "PERSONAL"
      asset_kind:
        | "CASH"
        | "BANK"
        | "DEPOSIT"
        | "STOCK"
        | "CRYPTO"
        | "REAL_ESTATE"
        | "OTHER"
      client_kind: "COMPANY" | "INDIVIDUAL"
      client_status: "LEAD" | "ACTIVE" | "INACTIVE"
      deal_stage:
        | "LEAD"
        | "QUALIFIED"
        | "PROPOSAL"
        | "NEGOTIATION"
        | "WON"
        | "LOST"
      debt_direction: "I_OWE" | "OWED_TO_ME"
      debt_status: "OPEN" | "CLOSED"
      invoice_status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"
      priority: "LOW" | "MEDIUM" | "HIGH"
      project_status: "ACTIVE" | "ARCHIVED"
      recurring_kind: "INCOME" | "EXPENSE"
      recurring_period: "WEEKLY" | "MONTHLY" | "YEARLY"
      task_status: "TODO" | "IN_PROGRESS" | "DONE"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: ["CALL", "MEETING", "EMAIL", "NOTE"],
      area: ["WORK", "PERSONAL"],
      asset_kind: [
        "CASH",
        "BANK",
        "DEPOSIT",
        "STOCK",
        "CRYPTO",
        "REAL_ESTATE",
        "OTHER",
      ],
      client_kind: ["COMPANY", "INDIVIDUAL"],
      client_status: ["LEAD", "ACTIVE", "INACTIVE"],
      deal_stage: [
        "LEAD",
        "QUALIFIED",
        "PROPOSAL",
        "NEGOTIATION",
        "WON",
        "LOST",
      ],
      debt_direction: ["I_OWE", "OWED_TO_ME"],
      debt_status: ["OPEN", "CLOSED"],
      invoice_status: ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"],
      priority: ["LOW", "MEDIUM", "HIGH"],
      project_status: ["ACTIVE", "ARCHIVED"],
      recurring_kind: ["INCOME", "EXPENSE"],
      recurring_period: ["WEEKLY", "MONTHLY", "YEARLY"],
      task_status: ["TODO", "IN_PROGRESS", "DONE"],
    },
  },
} as const
