export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
          full_name?: string
          avatar_url?: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
          full_name?: string
          avatar_url?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
          full_name?: string
          avatar_url?: string
        }
      }
      recipes: {
        Row: {
          id: string
          title: string
          description?: string
          instructions?: string
          ingredients?: string[]
          prep_time?: number
          cook_time?: number
          servings?: number
          difficulty?: 'easy' | 'medium' | 'hard'
          category?: string
          image_url?: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          instructions?: string
          ingredients?: string[]
          prep_time?: number
          cook_time?: number
          servings?: number
          difficulty?: 'easy' | 'medium' | 'hard'
          category?: string
          image_url?: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          instructions?: string
          ingredients?: string[]
          prep_time?: number
          cook_time?: number
          servings?: number
          difficulty?: 'easy' | 'medium' | 'hard'
          category?: string
          image_url?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      pantry_items: {
        Row: {
          id: string
          name: string
          quantity?: number
          unit?: string
          expiry_date?: string
          category?: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          quantity?: number
          unit?: string
          expiry_date?: string
          category?: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          quantity?: number
          unit?: string
          expiry_date?: string
          category?: string
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      meal_plans: {
        Row: {
          id: string
          date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          recipe_id?: string
          notes?: string
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          recipe_id?: string
          notes?: string
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          date?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          recipe_id?: string
          notes?: string
          created_at?: string
          updated_at?: string
          user_id?: string
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