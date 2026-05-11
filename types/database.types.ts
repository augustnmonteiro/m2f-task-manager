// Placeholder — replace with:
//   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
// after applying database/schema.sql to your Supabase project.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          email_summary_interval_seconds: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          email_summary_interval_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          email_summary_interval_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          status: 'pending' | 'completed';
          created_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          status?: 'pending' | 'completed';
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          status?: 'pending' | 'completed';
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      emails: {
        Row: {
          id: string;
          user_id: string;
          kind: 'immediate_task' | 'summary';
          task_id: string | null;
          subject: string;
          body: string | null;
          scheduled_at: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: 'immediate_task' | 'summary';
          task_id?: string | null;
          subject: string;
          body?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: 'immediate_task' | 'summary';
          task_id?: string | null;
          subject?: string;
          body?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sms_messages: {
        Row: {
          id: string;
          user_id: string;
          kind: 'fibonacci_summary';
          body: string | null;
          fibonacci_index: number;
          scheduled_at: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind?: 'fibonacci_summary';
          body?: string | null;
          fibonacci_index: number;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: 'fibonacci_summary';
          body?: string | null;
          fibonacci_index?: number;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_actions: {
        Row: {
          id: string;
          user_id: string;
          email_id: string;
          task_id: string;
          action_type: 'complete_task';
          token_hash: string;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_id: string;
          task_id: string;
          action_type?: 'complete_task';
          token_hash: string;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_id?: string;
          task_id?: string;
          action_type?: 'complete_task';
          token_hash?: string;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      scheduler_state: {
        Row: {
          user_id: string;
          email_summary_last_sent_at: string | null;
          sms_fibonacci_index: number;
          sms_last_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_summary_last_sent_at?: string | null;
          sms_fibonacci_index?: number;
          sms_last_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          email_summary_last_sent_at?: string | null;
          sms_fibonacci_index?: number;
          sms_last_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_runs: {
        Row: {
          id: string;
          user_id: string;
          kind: 'email_summary' | 'sms_fibonacci';
          schedule_bucket: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: 'email_summary' | 'sms_fibonacci';
          schedule_bucket: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: 'email_summary' | 'sms_fibonacci';
          schedule_bucket?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      task_status: 'pending' | 'completed';
      email_kind: 'immediate_task' | 'summary';
      sms_kind: 'fibonacci_summary';
      notification_action_type: 'complete_task';
      notification_run_kind: 'email_summary' | 'sms_fibonacci';
    };
    CompositeTypes: Record<string, never>;
  };
};
