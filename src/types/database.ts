export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UnitType = 'none' | 'currency' | 'percentage' | 'custom'

export interface Database {
  public: {
    Tables: {
      questions: {
        Row: {
          id: string
          creator_id: string
          slug: string
          title: string
          description: string | null
          true_answer: number | null
          unit_type: UnitType
          custom_unit: string | null
          guesses_revealed: boolean
          revealed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          slug: string
          title: string
          description?: string | null
          true_answer?: number | null
          unit_type?: UnitType
          custom_unit?: string | null
          guesses_revealed?: boolean
          revealed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          creator_id?: string
          slug?: string
          title?: string
          description?: string | null
          true_answer?: number | null
          unit_type?: UnitType
          custom_unit?: string | null
          guesses_revealed?: boolean
          revealed?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_creator_id_fkey"
            columns: ["creator_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      guesses: {
        Row: {
          id: string
          question_id: string
          user_id: string | null
          display_name: string | null
          value: number
          prior_visible_guesses: number | null
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          user_id?: string | null
          display_name?: string | null
          value: number
          prior_visible_guesses?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          user_id?: string | null
          display_name?: string | null
          value?: number
          prior_visible_guesses?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guesses_question_id_fkey"
            columns: ["question_id"]
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guesses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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

export type Question = Database['public']['Tables']['questions']['Row']
export type QuestionInsert = Database['public']['Tables']['questions']['Insert']
export type Guess = Database['public']['Tables']['guesses']['Row']
export type GuessInsert = Database['public']['Tables']['guesses']['Insert']
