import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type WorkoutProgram, type Exercise, type WorkoutLog } from '../lib/supabase';
import { ArrowLeft, Dumbbell, Clock, CheckCircle, Plus, TrendingUp } from 'lucide-react';

const ProgramView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const [logData, setLogData] = useState<{ [key: string]: { sets: number; reps: string; notes: string } }>({});

  useEffect(() => {
    loadProgramData();
  }, [id, user]);

  const loadProgramData = async () => {
    if (!id || !user) return;

    // Load program
    const { data: programData, error: programError } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('id', id)
      .single();

    if (programError) {
      console.error('Error loading program:', programError);
      return;
    }

    setProgram(programData);

    // Load exercises
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .eq('program_id', id)
      .order('order_index', { ascending: true });

    if (exercisesError) {
      console.error('Error loading exercises:', exercisesError);
    } else {
      setExercises(exercisesData || []);
    }

    // Load logs
    const { data: logsData, error: logsError } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('program_id', id)
      .order('completed_at', { ascending: false });

    if (logsError) {
      console.error('Error loading logs:', logsError);
    } else {
      setLogs(logsData || []);
    }

    setLoading(false);
  };

  const handleLogWorkout = async (exerciseId: string) => {
    if (!user || !id) return;

    const data = logData[exerciseId];
    if (!data || !data.sets || !data.reps) {
      alert('Vennligst fyll inn sett og repetisjoner');
      return;
    }

    const { error } = await supabase.from('workout_logs').insert({
      program_id: id,
      user_id: user.id,
      exercise_id: exerciseId,
      sets_completed: data.sets,
      reps_completed: data.reps,
      notes: data.notes || '',
    });

    if (error) {
      console.error('Error logging workout:', error);
      alert('Feil ved lagring av økt');
    } else {
      setActiveExercise(null);
      setLogData({});
      loadProgramData();
      alert('Økt lagret! 🎉');
    }
  };

  const getExerciseLogs = (exerciseId: string) => {
    return logs.filter((log) => log.exercise_id === exerciseId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neo-card p-8">
          <div className="animate-pulse text-center">
            <div className="text-xl font-semibold text-gray-700">Laster...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neo-card p-8">
          <p className="text-gray-700">Program ikke funnet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="neo-button p-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">{program.name}</h1>
            <p className="text-gray-600">{program.description}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="neo-card">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-6 h-6 text-primary-600" />
              <div>
                <p className="text-sm text-gray-600 font-semibold">Øvelser</p>
                <p className="text-2xl font-bold text-gray-800">{exercises.length}</p>
              </div>
            </div>
          </div>
          <div className="neo-card">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-gray-600 font-semibold">Fullførte økter</p>
                <p className="text-2xl font-bold text-gray-800">{logs.length}</p>
              </div>
            </div>
          </div>
          <div className="neo-card">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600 font-semibold">Siste økt</p>
                <p className="text-sm font-bold text-gray-800">
                  {logs[0] ? new Date(logs[0].completed_at).toLocaleDateString('nb-NO') : 'Ingen'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Øvelser</h2>
          {exercises.map((exercise) => {
            const exerciseLogs = getExerciseLogs(exercise.id);
            const isActive = activeExercise === exercise.id;

            return (
              <div key={exercise.id} className="neo-card">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{exercise.name}</h3>
                  <p className="text-gray-600 mb-3">{exercise.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 font-semibold">
                        {exercise.sets} sett × {exercise.reps} reps
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 font-semibold">Hvile: {exercise.rest_time}</span>
                    </div>
                  </div>
                  {exercise.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">💡 {exercise.notes}</p>
                  )}
                </div>

                {/* Log Form */}
                {isActive ? (
                  <div className="border-t border-gray-300 pt-4 mt-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Logg økten</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Sett fullført
                        </label>
                        <input
                          type="number"
                          className="neo-input"
                          placeholder="3"
                          onChange={(e) =>
                            setLogData({
                              ...logData,
                              [exercise.id]: {
                                ...logData[exercise.id],
                                sets: parseInt(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Repetisjoner
                        </label>
                        <input
                          type="text"
                          className="neo-input"
                          placeholder="8-12"
                          onChange={(e) =>
                            setLogData({
                              ...logData,
                              [exercise.id]: {
                                ...logData[exercise.id],
                                reps: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notater (valgfritt)
                      </label>
                      <textarea
                        className="neo-input"
                        rows={2}
                        placeholder="Føltes tungt, øk vekt neste gang..."
                        onChange={(e) =>
                          setLogData({
                            ...logData,
                            [exercise.id]: {
                              ...logData[exercise.id],
                              notes: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleLogWorkout(exercise.id)}
                        className="neo-button-primary flex-1"
                      >
                        <CheckCircle className="w-5 h-5 inline mr-2" />
                        Lagre økt
                      </button>
                      <button onClick={() => setActiveExercise(null)} className="neo-button">
                        Avbryt
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveExercise(exercise.id)}
                    className="neo-button w-full flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Logg økt
                  </button>
                )}

                {/* Exercise History */}
                {exerciseLogs.length > 0 && (
                  <div className="border-t border-gray-300 pt-4 mt-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Historikk ({exerciseLogs.length} økter)
                    </h4>
                    <div className="space-y-2">
                      {exerciseLogs.slice(0, 3).map((log) => (
                        <div key={log.id} className="text-sm text-gray-600 flex justify-between">
                          <span>
                            {log.sets_completed} sett × {log.reps_completed} reps
                          </span>
                          <span>{new Date(log.completed_at).toLocaleDateString('nb-NO')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgramView;
