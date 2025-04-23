

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'moderator' | 'user'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'moderator' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'moderator' | 'user'
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          receipt_id: string
          user_id: string | null
          total_amount: number
          details: string | null
          payment_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          receipt_id: string
          user_id?: string | null
          total_amount: number
          details?: string | null
          payment_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          receipt_id?: string
          user_id?: string | null
          total_amount?: number
          details?: string | null
          payment_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          main_dish: string
          price: number
          day: string
          meal_option_id: string | null
          side_dish: string | null
          dessert: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          main_dish: string
          price: number
          day: string
          meal_option_id?: string | null
          side_dish?: string | null
          dessert?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          main_dish?: string
          price?: number
          day?: string
          meal_option_id?: string | null
          side_dish?: string | null
          dessert?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: 'admin' | 'moderator' | 'user'
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: 'admin' | 'moderator' | 'user'
    }
  }
}

