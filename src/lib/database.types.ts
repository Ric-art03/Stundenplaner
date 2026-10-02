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
      profiles: {
        Row: {
          id: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string
          notes: string | null
          work_notes: string | null
          sports: Json
          age_groups: Json
          phases: Json
          difficulty: string
          organization_forms: Json
          duration: number
          participants_min: number | null
          participants_max: number | null
          music_required: boolean
          music_link: string | null
          image_url: string | null
          images: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description: string
          notes?: string | null
          work_notes?: string | null
          sports?: Json
          age_groups?: Json
          phases?: Json
          difficulty?: string
          organization_forms?: Json
          duration: number
          participants_min?: number | null
          participants_max?: number | null
          music_required?: boolean
          music_link?: string | null
          image_url?: string | null
          images?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string
          notes?: string | null
          work_notes?: string | null
          sports?: Json
          age_groups?: Json
          phases?: Json
          difficulty?: string
          organization_forms?: Json
          duration?: number
          participants_min?: number | null
          participants_max?: number | null
          music_required?: boolean
          music_link?: string | null
          image_url?: string | null
          images?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      exercise_materials: {
        Row: {
          id: string
          exercise_id: string
          name: string
          quantity: number
          mode: string
          sort_order: number
        }
        Insert: {
          id?: string
          exercise_id: string
          name: string
          quantity: number
          mode: string
          sort_order?: number
        }
        Update: {
          id?: string
          exercise_id?: string
          name?: string
          quantity?: number
          mode?: string
          sort_order?: number
        }
        Relationships: []
      }
      exercise_variants: {
        Row: {
          id: string
          exercise_id: string
          title: string
          description: string
          materials: Json
          participants_min: number | null
          participants_max: number | null
          duration: number | null
          age_groups: Json
          organization_forms: Json
          sort_order: number
        }
        Insert: {
          id?: string
          exercise_id: string
          title: string
          description: string
          materials?: Json
          participants_min?: number | null
          participants_max?: number | null
          duration?: number | null
          age_groups?: Json
          organization_forms?: Json
          sort_order?: number
        }
        Update: {
          id?: string
          exercise_id?: string
          title?: string
          description?: string
          materials?: Json
          participants_min?: number | null
          participants_max?: number | null
          duration?: number | null
          age_groups?: Json
          organization_forms?: Json
          sort_order?: number
        }
        Relationships: []
      }
      exercise_links: {
        Row: {
          id: string
          exercise_id: string
          url: string
          title: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          exercise_id: string
          url: string
          title?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          exercise_id?: string
          url?: string
          title?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      custom_categories: {
        Row: {
          id: string
          user_id: string
          category_type: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_type: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_type?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
