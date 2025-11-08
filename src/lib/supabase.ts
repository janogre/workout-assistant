import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export type WorkoutProgram = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type Exercise = {
  id: string;
  program_id: string;
  name: string;
  description: string;
  sets: number;
  reps: string;
  rest_time: string;
  notes?: string;
  order_index: number;
  created_at: string;
};

export type WorkoutLog = {
  id: string;
  program_id: string;
  user_id: string;
  exercise_id: string;
  sets_completed: number;
  reps_completed: string;
  notes?: string;
  completed_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  program_id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};
