-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workout Programs Table
CREATE TABLE IF NOT EXISTS workout_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises Table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sets INTEGER NOT NULL,
  reps TEXT NOT NULL,
  rest_time TEXT,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout Logs Table
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sets_completed INTEGER NOT NULL,
  reps_completed TEXT NOT NULL,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES workout_programs(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_programs
CREATE POLICY "Users can view their own programs" ON workout_programs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own programs" ON workout_programs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own programs" ON workout_programs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own programs" ON workout_programs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for exercises
CREATE POLICY "Users can view exercises from their programs" ON exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_programs
      WHERE workout_programs.id = exercises.program_id
      AND workout_programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exercises for their programs" ON exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_programs
      WHERE workout_programs.id = exercises.program_id
      AND workout_programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises in their programs" ON exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_programs
      WHERE workout_programs.id = exercises.program_id
      AND workout_programs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises from their programs" ON exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_programs
      WHERE workout_programs.id = exercises.program_id
      AND workout_programs.user_id = auth.uid()
    )
  );

-- RLS Policies for workout_logs
CREATE POLICY "Users can view their own logs" ON workout_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own logs" ON workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs" ON workout_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs" ON workout_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_workout_programs_user_id ON workout_programs(user_id);
CREATE INDEX idx_exercises_program_id ON exercises(program_id);
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_program_id ON workout_logs(program_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_program_id ON chat_messages(program_id);
