import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Supabase client (using service role key for backend operations)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const MODEL = 'claude-sonnet-4-5-20250929';

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware to extract user from JWT
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== AUTH ENDPOINTS ====================

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ user: data.user, session: data.session });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Sign in
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ user: data.user, session: data.session });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Signin failed' });
  }
});

// Sign out
app.post('/api/auth/signout', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Signout failed' });
  }
});

// Get current session
app.get('/api/auth/session', authMiddleware, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// ==================== WORKOUT PROGRAMS ENDPOINTS ====================

// Get all programs for user
app.get('/api/programs', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Get programs error:', error);
    res.status(500).json({ error: 'Failed to get programs' });
  }
});

// Get single program
app.get('/api/programs/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get program error:', error);
    res.status(500).json({ error: 'Failed to get program' });
  }
});

// Create program
app.post('/api/programs', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const { data, error } = await supabase
      .from('workout_programs')
      .insert({
        user_id: req.user.id,
        name,
        description: description || '',
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Create program error:', error);
    res.status(500).json({ error: 'Failed to create program' });
  }
});

// Update program
app.put('/api/programs/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    const { data, error } = await supabase
      .from('workout_programs')
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Update program error:', error);
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// Delete program
app.delete('/api/programs/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('workout_programs')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Delete program error:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

// ==================== EXERCISES ENDPOINTS ====================

// Get exercises for a program
app.get('/api/programs/:programId/exercises', authMiddleware, async (req, res) => {
  try {
    // First verify the program belongs to the user
    const { data: program } = await supabase
      .from('workout_programs')
      .select('id')
      .eq('id', req.params.programId)
      .eq('user_id', req.user.id)
      .single();

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('program_id', req.params.programId)
      .order('order_index', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Failed to get exercises' });
  }
});

// Create exercise
app.post('/api/programs/:programId/exercises', authMiddleware, async (req, res) => {
  try {
    // First verify the program belongs to the user
    const { data: program } = await supabase
      .from('workout_programs')
      .select('id')
      .eq('id', req.params.programId)
      .eq('user_id', req.user.id)
      .single();

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const { name, description, sets, reps, rest_time, notes, order_index } = req.body;

    if (!name || !sets || !reps) {
      return res.status(400).json({ error: 'Name, sets, and reps are required' });
    }

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        program_id: req.params.programId,
        name,
        description: description || '',
        sets,
        reps,
        rest_time: rest_time || '60s',
        notes: notes || '',
        order_index: order_index || 0,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// Update exercise
app.put('/api/exercises/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, sets, reps, rest_time, notes, order_index } = req.body;

    // Verify ownership through program
    const { data: exercise } = await supabase
      .from('exercises')
      .select('program_id')
      .eq('id', req.params.id)
      .single();

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const { data: program } = await supabase
      .from('workout_programs')
      .select('id')
      .eq('id', exercise.program_id)
      .eq('user_id', req.user.id)
      .single();

    if (!program) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('exercises')
      .update({
        name,
        description,
        sets,
        reps,
        rest_time,
        notes,
        order_index,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Failed to update exercise' });
  }
});

// Delete exercise
app.delete('/api/exercises/:id', authMiddleware, async (req, res) => {
  try {
    // Verify ownership through program
    const { data: exercise } = await supabase
      .from('exercises')
      .select('program_id')
      .eq('id', req.params.id)
      .single();

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const { data: program } = await supabase
      .from('workout_programs')
      .select('id')
      .eq('id', exercise.program_id)
      .eq('user_id', req.user.id)
      .single();

    if (!program) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
});

// ==================== WORKOUT LOGS ENDPOINTS ====================

// Get workout logs for user
app.get('/api/workout-logs', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Get workout logs error:', error);
    res.status(500).json({ error: 'Failed to get workout logs' });
  }
});

// Get workout logs for a program
app.get('/api/programs/:programId/logs', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('program_id', req.params.programId)
      .eq('user_id', req.user.id)
      .order('completed_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Get program logs error:', error);
    res.status(500).json({ error: 'Failed to get program logs' });
  }
});

// Create workout log
app.post('/api/workout-logs', authMiddleware, async (req, res) => {
  try {
    const { program_id, exercise_id, sets_completed, reps_completed, notes } = req.body;

    if (!program_id || !exercise_id || sets_completed === undefined || !reps_completed) {
      return res.status(400).json({
        error: 'program_id, exercise_id, sets_completed, and reps_completed are required'
      });
    }

    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: req.user.id,
        program_id,
        exercise_id,
        sets_completed,
        reps_completed,
        notes: notes || '',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Create workout log error:', error);
    res.status(500).json({ error: 'Failed to create workout log' });
  }
});

// Get statistics
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const { count: programCount } = await supabase
      .from('workout_programs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    const { count: workoutCount } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { count: weekCount } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('completed_at', oneWeekAgo.toISOString());

    res.json({
      totalPrograms: programCount || 0,
      totalWorkouts: workoutCount || 0,
      thisWeek: weekCount || 0,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// ==================== ANTHROPIC CHAT ENDPOINT ====================

// Anthropic proxy endpoint
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: system || '',
      messages: messages,
    });

    res.json(response);
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    res.status(500).json({
      error: 'Failed to process chat request',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth endpoints: /api/auth/*`);
  console.log(`💪 Workout endpoints: /api/programs, /api/exercises, /api/workout-logs`);
  console.log(`🤖 AI Chat endpoint: /api/chat`);
});
