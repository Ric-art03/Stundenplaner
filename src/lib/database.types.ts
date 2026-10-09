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
          needs_completion: boolean
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
          needs_completion?: boolean
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
          needs_completion?: boolean
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
      venues: {
        Row: {
          id: string
          user_id: string
          name: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      venue_materials: {
        Row: {
          id: string
          venue_id: string
          name: string
          quantity: number
          sort_order: number
        }
        Insert: {
          id?: string
          venue_id: string
          name: string
          quantity: number
          sort_order?: number
        }
        Update: {
          id?: string
          venue_id?: string
          name?: string
          quantity?: number
          sort_order?: number
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          user_id: string
          name: string
          sports: Json
          primary_sport: string | null
          age_groups: Json
          participants: number | null
          unit_duration: number
          venue_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          sports?: Json
          primary_sport?: string | null
          age_groups?: Json
          participants?: number | null
          unit_duration: number
          venue_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          sports?: Json
          primary_sport?: string | null
          age_groups?: Json
          participants?: number | null
          unit_duration?: number
          venue_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_schedules: {
        Row: {
          id: string
          group_id: string
          schedule_type: string
          weekday: string | null
          date: string | null
          start_time: string
          end_time: string
          sort_order: number
        }
        Insert: {
          id?: string
          group_id: string
          schedule_type?: string
          weekday?: string | null
          date?: string | null
          start_time: string
          end_time: string
          sort_order?: number
        }
        Update: {
          id?: string
          group_id?: string
          schedule_type?: string
          weekday?: string | null
          date?: string | null
          start_time?: string
          end_time?: string
          sort_order?: number
        }
        Relationships: []
      }
      units: {
        Row: {
          id: string
          user_id: string
          group_id: string
          name: string
          total_minutes: number
          seed: number
          manually_edited: boolean
          relaxed_note: string | null
          saved: boolean
          editor_state: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id: string
          name: string
          total_minutes: number
          seed: number
          manually_edited?: boolean
          relaxed_note?: string | null
          saved?: boolean
          editor_state?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string
          name?: string
          total_minutes?: number
          seed?: number
          manually_edited?: boolean
          relaxed_note?: string | null
          saved?: boolean
          editor_state?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      unit_segments: {
        Row: {
          id: string
          unit_id: string
          name: string
          minutes: number
          fill_mode: string
          sports: Json
          primary_sport: string | null
          difficulties: Json
          organization_forms: Json
          notes: string | null
          planned_gap_minutes: number
          gap_reason: string | null
          gap_detail: Json | null
          position: number
        }
        Insert: {
          id?: string
          unit_id: string
          name: string
          minutes: number
          fill_mode: string
          sports?: Json
          primary_sport?: string | null
          difficulties?: Json
          organization_forms?: Json
          notes?: string | null
          planned_gap_minutes?: number
          gap_reason?: string | null
          gap_detail?: Json | null
          position?: number
        }
        Update: {
          id?: string
          unit_id?: string
          name?: string
          minutes?: number
          fill_mode?: string
          sports?: Json
          primary_sport?: string | null
          difficulties?: Json
          organization_forms?: Json
          notes?: string | null
          planned_gap_minutes?: number
          gap_reason?: string | null
          gap_detail?: Json | null
          position?: number
        }
        Relationships: []
      }
      unit_items: {
        Row: {
          id: string
          segment_id: string
          exercise_id: string | null
          variant_id: string | null
          planned_duration: number
          position: number
        }
        Insert: {
          id?: string
          segment_id: string
          exercise_id?: string | null
          variant_id?: string | null
          planned_duration: number
          position?: number
        }
        Update: {
          id?: string
          segment_id?: string
          exercise_id?: string | null
          variant_id?: string | null
          planned_duration?: number
          position?: number
        }
        Relationships: []
      }
      exercise_usages: {
        Row: {
          id: string
          user_id: string
          exercise_id: string
          group_id: string
          unit_id: string
          used_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_id: string
          group_id: string
          unit_id: string
          used_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_id?: string
          group_id?: string
          unit_id?: string
          used_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      save_unit_plan: {
        Args: {
          p_unit_id: string
          p_segments: Json
          p_expected_updated_at: string
          p_force?: boolean
          p_name?: string
        }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
