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
      accounts: {
        Row: {
          created_at: string
          id: string
          interest_rate: number | null
          is_archived: boolean
          name: string
          party: string | null
          section: Database["public"]["Enums"]["book_section"]
          subtype: Database["public"]["Enums"]["account_subtype"]
          type: Database["public"]["Enums"]["account_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_rate?: number | null
          is_archived?: boolean
          name: string
          party?: string | null
          section?: Database["public"]["Enums"]["book_section"]
          subtype: Database["public"]["Enums"]["account_subtype"]
          type: Database["public"]["Enums"]["account_type"]
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_rate?: number | null
          is_archived?: boolean
          name?: string
          party?: string | null
          section?: Database["public"]["Enums"]["book_section"]
          subtype?: Database["public"]["Enums"]["account_subtype"]
          type?: Database["public"]["Enums"]["account_type"]
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity: string
          entity_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          entry_date: string
          id: string
          idempotency_key: string | null
          kind: string
          party: string | null
          reversal_of: string | null
          reversed_by: string | null
          section: Database["public"]["Enums"]["book_section"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          entry_date: string
          id?: string
          idempotency_key?: string | null
          kind: string
          party?: string | null
          reversal_of?: string | null
          reversed_by?: string | null
          section?: Database["public"]["Enums"]["book_section"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          entry_date?: string
          id?: string
          idempotency_key?: string | null
          kind?: string
          party?: string | null
          reversal_of?: string | null
          reversed_by?: string | null
          section?: Database["public"]["Enums"]["book_section"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversed_by_fkey"
            columns: ["reversed_by"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          credit: number
          debit: number
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          account_id: string
          credit?: number
          debit?: number
          entry_id: string
          id?: string
          user_id: string
        }
        Update: {
          account_id?: string
          credit?: number
          debit?: number
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      account_summary: {
        Args: { p_from: string; p_to: string }
        Returns: {
          account_id: string
          closing_credit: number
          closing_debit: number
          period_credit: number
          period_debit: number
        }[]
      }
      edit_transaction: {
        Args: {
          p_amount: number
          p_credit: string
          p_date: string
          p_debit: string
          p_description?: string
          p_entry: string
          p_extra_account?: string
          p_extra_amount?: number
          p_idempotency_key?: string
          p_kind: string
          p_party?: string
          p_section?: Database["public"]["Enums"]["book_section"]
        }
        Returns: string
      }
      ensure_default_accounts: { Args: never; Returns: undefined }
      kind_rule: { Args: { p_kind: string }; Returns: Record<string, unknown> }
      record_transaction: {
        Args: {
          p_amount: number
          p_credit: string
          p_date: string
          p_debit: string
          p_description?: string
          p_extra_account?: string
          p_extra_amount?: number
          p_idempotency_key?: string
          p_kind: string
          p_party?: string
          p_section?: Database["public"]["Enums"]["book_section"]
        }
        Returns: string
      }
      reverse_transaction: {
        Args: { p_entry: string; p_reason?: string }
        Returns: string
      }
      subtype_type: {
        Args: { s: Database["public"]["Enums"]["account_subtype"] }
        Returns: Database["public"]["Enums"]["account_type"]
      }
    }
    Enums: {
      account_subtype:
        | "cash"
        | "bank"
        | "upi"
        | "receivable"
        | "investment"
        | "fixed_asset"
        | "loan_payable"
        | "other_liability"
        | "equity"
        | "income"
        | "expense"
      account_type: "asset" | "liability" | "equity" | "income" | "expense"
      book_section: "personal" | "household" | "ghar" | "dairy" | "business"
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
      account_subtype: [
        "cash",
        "bank",
        "upi",
        "receivable",
        "investment",
        "fixed_asset",
        "loan_payable",
        "other_liability",
        "equity",
        "income",
        "expense",
      ],
      account_type: ["asset", "liability", "equity", "income", "expense"],
      book_section: ["personal", "household", "ghar", "dairy", "business"],
    },
  },
} as const
