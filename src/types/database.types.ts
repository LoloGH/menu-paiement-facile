
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
          role: 'admin' | 'moderator' | 'user' | 'order_manager' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'moderator' | 'user' | 'order_manager' | 'viewer' 
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'moderator' | 'user' | 'order_manager' | 'viewer'
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
      admin_audit_log: {
        Row: {
          id: string
          user_id: string
          action: string
          resource: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource?: string
          details?: Json | null
          created_at?: string
        }
      }
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: 'admin' | 'moderator' | 'user' | 'order_manager' | 'viewer'
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: 'admin' | 'moderator' | 'user' | 'order_manager' | 'viewer'
    }
  }
}

// Type for the Admin Audit Log
export interface AdminAuditLog {
  id: string;
  user_id: string;
  user_email?: string;
  action: string;
  resource: string;
  details: any;
  created_at: string;
}

// Type for user role information
export interface UserRoleInfo {
  id: string;
  email: string;
  name?: string | null;
  created_at: string;
}
