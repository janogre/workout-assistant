// API client for backend communication

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types
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

export type User = {
  id: string;
  email: string;
  [key: string]: any;
};

export type Session = {
  access_token: string;
  refresh_token?: string;
  user: User;
  [key: string]: any;
};

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // Load token from localStorage on init
    this.token = localStorage.getItem('access_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // ==================== AUTH ====================

  async signUp(email: string, password: string): Promise<{ user: User; session: Session }> {
    const data = await this.request<{ user: User; session: Session }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.session?.access_token) {
      this.setToken(data.session.access_token);
    }

    return data;
  }

  async signIn(email: string, password: string): Promise<{ user: User; session: Session }> {
    const data = await this.request<{ user: User; session: Session }>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.session?.access_token) {
      this.setToken(data.session.access_token);
    }

    return data;
  }

  async signOut(): Promise<void> {
    await this.request('/api/auth/signout', {
      method: 'POST',
    });
    this.setToken(null);
  }

  async getSession(): Promise<{ user: User } | null> {
    if (!this.token) {
      return null;
    }

    try {
      return await this.request<{ user: User }>('/api/auth/session');
    } catch (error) {
      // If session is invalid, clear token
      this.setToken(null);
      return null;
    }
  }

  // ==================== PROGRAMS ====================

  async getPrograms(): Promise<WorkoutProgram[]> {
    return this.request<WorkoutProgram[]>('/api/programs');
  }

  async getProgram(id: string): Promise<WorkoutProgram> {
    return this.request<WorkoutProgram>(`/api/programs/${id}`);
  }

  async createProgram(name: string, description: string): Promise<WorkoutProgram> {
    return this.request<WorkoutProgram>('/api/programs', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async updateProgram(id: string, name: string, description: string): Promise<WorkoutProgram> {
    return this.request<WorkoutProgram>(`/api/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteProgram(id: string): Promise<void> {
    await this.request(`/api/programs/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== EXERCISES ====================

  async getExercises(programId: string): Promise<Exercise[]> {
    return this.request<Exercise[]>(`/api/programs/${programId}/exercises`);
  }

  async createExercise(
    programId: string,
    exercise: {
      name: string;
      description: string;
      sets: number;
      reps: string;
      rest_time: string;
      notes?: string;
      order_index: number;
    }
  ): Promise<Exercise> {
    return this.request<Exercise>(`/api/programs/${programId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(exercise),
    });
  }

  async updateExercise(
    id: string,
    exercise: {
      name: string;
      description: string;
      sets: number;
      reps: string;
      rest_time: string;
      notes?: string;
      order_index: number;
    }
  ): Promise<Exercise> {
    return this.request<Exercise>(`/api/exercises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(exercise),
    });
  }

  async deleteExercise(id: string): Promise<void> {
    await this.request(`/api/exercises/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== WORKOUT LOGS ====================

  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    return this.request<WorkoutLog[]>('/api/workout-logs');
  }

  async getProgramLogs(programId: string): Promise<WorkoutLog[]> {
    return this.request<WorkoutLog[]>(`/api/programs/${programId}/logs`);
  }

  async createWorkoutLog(log: {
    program_id: string;
    exercise_id: string;
    sets_completed: number;
    reps_completed: string;
    notes?: string;
  }): Promise<WorkoutLog> {
    return this.request<WorkoutLog>('/api/workout-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  async getStats(): Promise<{
    totalPrograms: number;
    totalWorkouts: number;
    thisWeek: number;
  }> {
    return this.request('/api/stats');
  }

  // ==================== CHAT ====================

  async sendChatMessage(messages: any[], system?: string): Promise<any> {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, system }),
    });
  }
}

export const api = new ApiClient(API_URL);
