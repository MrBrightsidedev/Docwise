import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_usage: {
        Row: {
          id: string;
          user_id: string;
          ai_generations_used: number;
          plan: 'free' | 'pro' | 'business';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ai_generations_used?: number;
          plan?: 'free' | 'pro' | 'business';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ai_generations_used?: number;
          plan?: 'free' | 'pro' | 'business';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};