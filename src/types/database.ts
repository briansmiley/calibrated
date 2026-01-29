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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      guesses: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          prior_visible_guesses: number | null
          question_id: string
          user_id: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          prior_visible_guesses?: number | null
          question_id: string
          user_id?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          prior_visible_guesses?: number | null
          question_id?: string
          user_id?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "guesses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          created_at: string | null
          creator_id: string
          custom_unit: string | null
          description: string | null
          guesses_revealed: boolean | null
          id: string
          is_public: boolean | null
          max_value: number | null
          min_value: number | null
          password: string | null
          revealed: boolean | null
          title: string
          true_answer: number | null
          unit_type: Database["public"]["Enums"]["unit_type"] | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          custom_unit?: string | null
          description?: string | null
          guesses_revealed?: boolean | null
          id?: string
          is_public?: boolean | null
          max_value?: number | null
          min_value?: number | null
          password?: string | null
          revealed?: boolean | null
          title: string
          true_answer?: number | null
          unit_type?: Database["public"]["Enums"]["unit_type"] | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          custom_unit?: string | null
          description?: string | null
          guesses_revealed?: boolean | null
          id?: string
          is_public?: boolean | null
          max_value?: number | null
          min_value?: number | null
          password?: string | null
          revealed?: boolean | null
          title?: string
          true_answer?: number | null
          unit_type?: Database["public"]["Enums"]["unit_type"] | null
        }
        Relationships: []
      }
      simple_guesses: {
        Row: {
          id: string
          question_id: string
          value: number
          name: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          question_id: string
          value: number
          name?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          question_id?: string
          value?: number
          name?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simple_guesses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "simple_questions"
            referencedColumns: ["id"]
          }
        ]
      }
      simple_questions: {
        Row: {
          id: string
          title: string
          description: string | null
          min_value: number
          max_value: number
          true_answer: number
          reveal_pin: string | null
          revealed_at: string | null
          unit: string | null
          is_currency: boolean
          discord_user_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          min_value: number
          max_value: number
          true_answer: number
          reveal_pin?: string | null
          revealed_at?: string | null
          unit?: string | null
          is_currency?: boolean
          discord_user_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          min_value?: number
          max_value?: number
          true_answer?: number
          reveal_pin?: string | null
          revealed_at?: string | null
          unit?: string | null
          is_currency?: boolean
          discord_user_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: { Args: { email_to_check: string }; Returns: boolean }
      get_question_by_prefix: {
        Args: { prefix: string }
        Returns: {
          id: string
          creator_id: string
          title: string
          description: string | null
          true_answer: number | null
          unit_type: Database["public"]["Enums"]["unit_type"] | null
          custom_unit: string | null
          min_value: number | null
          max_value: number | null
          is_public: boolean | null
          password: string | null
          guesses_revealed: boolean | null
          revealed: boolean | null
          created_at: string | null
        }[]
      }
      get_simple_question_by_prefix: {
        Args: { prefix: string }
        Returns: {
          id: string
          title: string
          description: string | null
          min_value: number
          max_value: number
          true_answer: number
          reveal_pin: string | null
          revealed_at: string | null
          unit: string | null
          is_currency: boolean
          discord_user_id: string | null
          created_at: string | null
        }[]
      }
    }
    Enums: {
      unit_type: "none" | "currency" | "percentage" | "custom"
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
      unit_type: ["none", "currency", "percentage", "custom"],
    },
  },
} as const

// Convenience type exports
export type UnitType = Database["public"]["Enums"]["unit_type"]
export type Question = Database["public"]["Tables"]["questions"]["Row"]
export type QuestionInsert = Database["public"]["Tables"]["questions"]["Insert"]
export type Guess = Database["public"]["Tables"]["guesses"]["Row"]
export type GuessInsert = Database["public"]["Tables"]["guesses"]["Insert"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]
export type SimpleQuestion = Database["public"]["Tables"]["simple_questions"]["Row"]
export type SimpleQuestionInsert = Database["public"]["Tables"]["simple_questions"]["Insert"]
export type SimpleGuess = Database["public"]["Tables"]["simple_guesses"]["Row"]
export type SimpleGuessInsert = Database["public"]["Tables"]["simple_guesses"]["Insert"]
