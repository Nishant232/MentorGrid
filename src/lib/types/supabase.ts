export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          full_name: string | null
          role: 'mentor' | 'mentee' | 'admin'
          avatar_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          full_name?: string | null
          role: 'mentor' | 'mentee' | 'admin'
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          full_name?: string | null
          role?: 'mentor' | 'mentee' | 'admin'
          avatar_url?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          bio: string | null
          expertise: string[]
          hourly_rate: number | null
          availability: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bio?: string | null
          expertise?: string[]
          hourly_rate?: number | null
          availability?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bio?: string | null
          expertise?: string[]
          hourly_rate?: number | null
          availability?: Json | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
