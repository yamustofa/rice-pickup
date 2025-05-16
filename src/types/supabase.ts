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
      profiles: {
        Row: {
          id: string
          name: string | null
          division_id: string | null
          quota: number
          created_at: string
          updated_at: string
          avatar_config: Json | null
        }
        Insert: {
          id: string
          name?: string | null
          division_id?: string | null
          quota?: number
          created_at?: string
          updated_at?: string
          avatar_config?: Json | null
        }
        Update: {
          id?: string
          name?: string | null
          division_id?: string | null
          quota?: number
          created_at?: string
          updated_at?: string
          avatar_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_division_id_fkey"
            columns: ["division_id"]
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          }
        ]
      }
      divisions: {
        Row: {
          id: string
          name: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "divisions_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      months: {
        Row: {
          id: string
          year: number
          month: number
          created_at: string
        }
        Insert: {
          id?: string
          year: number
          month: number
          created_at?: string
        }
        Update: {
          id?: string
          year?: number
          month?: number
          created_at?: string
        }
        Relationships: []
      }
      pickups: {
        Row: {
          id: string
          user_id: string
          month_id: string
          quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_id: string
          quantity: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month_id?: string
          quantity?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickups_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickups_month_id_fkey"
            columns: ["month_id"]
            referencedRelation: "months"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      user_monthly_pickups: {
        Row: {
          user_id: string
          month_id: string
          year: number
          month: number
          total_quantity: number
          quota: number
          is_completed: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pickups_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickups_month_id_fkey"
            columns: ["month_id"]
            referencedRelation: "months"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      create_month_if_not_exists: {
        Args: {
          year_val: number
          month_val: number
        }
        Returns: string
      }
      handle_new_user: {
        Args: Record<string, never>
        Returns: unknown
      }
      validate_pickup_quota: {
        Args: Record<string, never>
        Returns: unknown
      }
    }
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updateables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

export type Profile = Tables<'profiles'>
export type Division = Tables<'divisions'>
export type Month = Tables<'months'>
export type Pickup = Tables<'pickups'>
export type UserMonthlyPickup = Views<'user_monthly_pickups'> 