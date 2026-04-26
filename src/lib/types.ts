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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      board_document_views: {
        Row: {
          drive_file_id: string
          id: string
          member_id: string
          viewed_at: string
        }
        Insert: {
          drive_file_id: string
          id?: string
          member_id: string
          viewed_at?: string
        }
        Update: {
          drive_file_id?: string
          id?: string
          member_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_document_views_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
        ]
      }
      board_financial_uploads: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          period_end: string | null
          period_start: string | null
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_financial_uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
        ]
      }
      board_meetings: {
        Row: {
          agenda: string | null
          created_at: string
          created_by: string | null
          drive_folder_id: string | null
          id: string
          location: string | null
          meeting_date: string
          minutes_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          created_at?: string
          created_by?: string | null
          drive_folder_id?: string | null
          id?: string
          location?: string | null
          meeting_date: string
          minutes_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          created_at?: string
          created_by?: string | null
          drive_folder_id?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          minutes_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
        ]
      }
      board_members: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["board_member_role"]
          status: Database["public"]["Enums"]["board_member_status"]
          term_end: string | null
          term_start: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["board_member_role"]
          status?: Database["public"]["Enums"]["board_member_status"]
          term_end?: string | null
          term_start?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["board_member_role"]
          status?: Database["public"]["Enums"]["board_member_status"]
          term_end?: string | null
          term_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      board_poll_options: {
        Row: {
          created_at: string
          id: string
          label: string
          poll_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          poll_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          poll_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "board_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "board_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      board_poll_votes: {
        Row: {
          created_at: string
          id: string
          member_id: string
          option_id: string
          poll_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          option_id: string
          poll_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          option_id?: string
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_poll_votes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "board_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "board_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      board_polls: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          meeting_id: string | null
          opens_at: string | null
          status: Database["public"]["Enums"]["board_poll_status"]
          title: string
          updated_at: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          meeting_id?: string | null
          opens_at?: string | null
          status?: Database["public"]["Enums"]["board_poll_status"]
          title: string
          updated_at?: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          meeting_id?: string | null
          opens_at?: string | null
          status?: Database["public"]["Enums"]["board_poll_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_polls_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "board_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      board_posts: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          parent_post_id: string | null
          thread_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          parent_post_id?: string | null
          thread_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          parent_post_id?: string | null
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "board_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      board_thread_reads: {
        Row: {
          last_read_at: string
          member_id: string
          thread_id: string
        }
        Insert: {
          last_read_at?: string
          member_id: string
          thread_id: string
        }
        Update: {
          last_read_at?: string
          member_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_thread_reads_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_thread_reads_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "board_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      board_threads: {
        Row: {
          created_at: string
          created_by: string | null
          drive_file_id: string | null
          id: string
          is_locked: boolean
          is_pinned: boolean
          last_post_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          drive_file_id?: string | null
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_post_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          drive_file_id?: string | null
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_post_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          pinned: boolean | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          pinned?: boolean | null
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          pinned?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_instances: {
        Row: {
          completed_at: string | null
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          designation: string | null
          frequency: string | null
          id: string
          instance_type: string
          launch_note: string | null
          max_occurrences: number | null
          name: string
          next_run: string | null
          occurrences_count: number | null
          offsets: Json | null
          recurring_active: boolean | null
          status: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          designation?: string | null
          frequency?: string | null
          id?: string
          instance_type: string
          launch_note?: string | null
          max_occurrences?: number | null
          name: string
          next_run?: string | null
          occurrences_count?: number | null
          offsets?: Json | null
          recurring_active?: boolean | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          designation?: string | null
          frequency?: string | null
          id?: string
          instance_type?: string
          launch_note?: string | null
          max_occurrences?: number | null
          name?: string
          next_run?: string | null
          occurrences_count?: number | null
          offsets?: Json | null
          recurring_active?: boolean | null
          status?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          task_id: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          task_id?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          task_id?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          categories: Json | null
          created_at: string | null
          date_mode: string
          id: string
          name: string
          schedule: Json | null
          step_dates: Json | null
          steps: Json
        }
        Insert: {
          categories?: Json | null
          created_at?: string | null
          date_mode?: string
          id?: string
          name: string
          schedule?: Json | null
          step_dates?: Json | null
          steps?: Json
        }
        Update: {
          categories?: Json | null
          created_at?: string | null
          date_mode?: string
          id?: string
          name?: string
          schedule?: Json | null
          step_dates?: Json | null
          steps?: Json
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          role: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string | null
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          position: number
          task_id: string
          title: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          position?: number
          task_id: string
          title: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          position?: number
          task_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_calendar_positions: {
        Row: {
          position: number
          task_id: string
          updated_at: string
          user_email: string
        }
        Insert: {
          position?: number
          task_id: string
          updated_at?: string
          user_email: string
        }
        Update: {
          position?: number
          task_id?: string
          updated_at?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_calendar_positions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          category_id: string
          task_id: string
        }
        Insert: {
          category_id: string
          task_id: string
        }
        Update: {
          category_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_categories_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_note_reads: {
        Row: {
          last_read_at: string | null
          task_id: string
          user_email: string
        }
        Insert: {
          last_read_at?: string | null
          task_id: string
          user_email: string
        }
        Update: {
          last_read_at?: string | null
          task_id?: string
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_note_reads_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_notes: {
        Row: {
          author_email: string
          author_name: string
          body: string
          created_at: string | null
          id: string
          task_id: string
        }
        Insert: {
          author_email: string
          author_name: string
          body: string
          created_at?: string | null
          id?: string
          task_id: string
        }
        Update: {
          author_email?: string
          author_name?: string
          body?: string
          created_at?: string | null
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_read_receipts: {
        Row: {
          created_at: string
          delegator_email: string
          id: string
          reset_at: string | null
          seen: boolean
          seen_at: string | null
          task_id: string
        }
        Insert: {
          created_at?: string
          delegator_email: string
          id?: string
          reset_at?: string | null
          seen?: boolean
          seen_at?: string | null
          task_id: string
        }
        Update: {
          created_at?: string
          delegator_email?: string
          id?: string
          reset_at?: string | null
          seen?: boolean
          seen_at?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_read_receipts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_update_reads: {
        Row: {
          id: string
          read_at: string | null
          task_id: string | null
          user_email: string
        }
        Insert: {
          id?: string
          read_at?: string | null
          task_id?: string | null
          user_email: string
        }
        Update: {
          id?: string
          read_at?: string | null
          task_id?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_update_reads_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived: boolean
          assignee_email: string | null
          assignee_emails: Json | null
          attachments: Json | null
          broadcast_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          due_date: string | null
          email_source: string | null
          email_subject: string | null
          from_email: boolean | null
          id: string
          instance_id: string | null
          launch_designation: string | null
          note_body: string | null
          notes: string | null
          original_due_date: string | null
          priority: string | null
          private: boolean
          process_id: string | null
          status: string | null
          thread_url: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
          urgent: boolean | null
        }
        Insert: {
          archived?: boolean
          assignee_email?: string | null
          assignee_emails?: Json | null
          attachments?: Json | null
          broadcast_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          email_source?: string | null
          email_subject?: string | null
          from_email?: boolean | null
          id?: string
          instance_id?: string | null
          launch_designation?: string | null
          note_body?: string | null
          notes?: string | null
          original_due_date?: string | null
          priority?: string | null
          private?: boolean
          process_id?: string | null
          status?: string | null
          thread_url?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          urgent?: boolean | null
        }
        Update: {
          archived?: boolean
          assignee_email?: string | null
          assignee_emails?: Json | null
          attachments?: Json | null
          broadcast_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          email_source?: string | null
          email_subject?: string | null
          from_email?: boolean | null
          id?: string
          instance_id?: string | null
          launch_designation?: string | null
          note_body?: string | null
          notes?: string | null
          original_due_date?: string | null
          priority?: string | null
          private?: boolean
          process_id?: string | null
          status?: string | null
          thread_url?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          urgent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "checklist_instances"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      board_is_admin: { Args: never; Returns: boolean }
      board_is_member: { Args: never; Returns: boolean }
    }
    Enums: {
      board_member_role: "member" | "admin"
      board_member_status: "active" | "inactive"
      board_poll_status: "draft" | "open" | "closed"
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
      board_member_role: ["member", "admin"],
      board_member_status: ["active", "inactive"],
      board_poll_status: ["draft", "open", "closed"],
    },
  },
} as const
