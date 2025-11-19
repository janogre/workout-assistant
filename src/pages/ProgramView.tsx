import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api, type WorkoutProgram, type Exercise, type WorkoutLog } from '../lib/api';
import { ArrowLeft, Clock, CheckCircle, ChevronDown, ChevronUp, X } from 'lucide-react';

const ProgramView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [loggingExercise, setLoggingExercise] = useState<string | null>(null);
  const [logData, setLogData] = useState<{ sets: number; reps: string; notes: string }>({
    sets: 0,
    reps: '',
    notes: '',
  });
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    loadProgramData();
  }, [id, user]);

  const loadProgramData = async () => {
    if (!id || !user) return;

    try {
      const programData = await api.getProgram(id);
      setProgram(programData);

      const exercisesData = await api.getExercises(id);
      setExercises(exercisesData || []);

      const logsData = await api.getProgramLogs(id);
      setLogs(logsData || []);
    } catch (error) {
      console.error('Error loading program data:', error);
    }

    setLoading(false);
  };

  const handleLogWorkout = async () => {
    if (!user || !id || !loggingExercise) return;

    if (!logData.sets || !logData.reps) {
      alert('Vennligst fyll inn sett og repetisjoner');
      return;
    }

    try {
      await api.createWorkoutLog({
        program_id: id,
        exercise_id: loggingExercise,
        sets_completed: logData.sets,
        reps_completed: logData.reps,
        notes: logData.notes || '',
      });

      setLoggingExercise(null);
      setLogData({ sets: 0, reps: '', notes: '' });
      loadProgramData();
      setSuccessMessage('Økt lagret!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error logging workout:', error);
    }
  };

  const getExerciseLogs = (exerciseId: string) => {
    return logs.filter((log) => log.exercise_id === exerciseId);
  };

  const getTotalEstimatedTime = () => {
    const totalMinutes = exercises.reduce((acc, ex) => {
      const restSeconds = parseInt(ex.rest_time) || 60;
      // Time per exercise: (sets * 30 sec) + (pauses between sets * rest_time)
      const exerciseTimeSeconds = (ex.sets * 30) + ((ex.sets - 1) * restSeconds);
      return acc + (exerciseTimeSeconds / 60); // Convert to minutes
    }, 0);
    return Math.round(totalMinutes);
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
    <div className="min-h-screen p-3 sm:p-4 md:p-8 pb-24">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="neo-button p-2 mb-3 sm:mb-4 inline-flex items-center gap-2 text-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tilbake</span>
          </button>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">{program.name}</h1>
          <p className="text-gray-600 text-xs sm:text-sm">{program.description}</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">{successMessage}</span>
          </div>
        )}

        {/* Compact Stats Bar */}
        <div className="neo-card mb-4 sm:mb-6 p-4 sm:p-6">
          <div className="flex items-center justify-around sm:justify-start sm:gap-8">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{exercises.length}</p>
              <p className="text-xs text-gray-600">øvelser</p>
            </div>
            <div className="h-8 sm:h-10 w-px bg-gray-300"></div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{getTotalEstimatedTime()}</p>
              <p className="text-xs text-gray-600">min</p>
            </div>
            <div className="h-8 sm:h-10 w-px bg-gray-300"></div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-800">{logs.length}</p>
              <p className="text-xs text-gray-600">økter</p>
            </div>
          </div>
        </div>

        {/* Exercises List - Compact View */}
        <div className="space-y-2">
          {exercises.map((exercise, index) => {
            const exerciseLogs = getExerciseLogs(exercise.id);
            const isExpanded = expandedExercise === exercise.id;
            const lastLog = exerciseLogs[0];

            return (
              <div key={exercise.id} className="neo-card hover:shadow-lg transition-all">
                {/* Compact Header - Always Visible */}
                <div
                  className="flex items-center gap-2 sm:gap-3 cursor-pointer"
                  onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                >
                  <div className="neo-card w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold text-primary-600 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">{exercise.name}</h3>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-600 mt-0.5 flex-wrap">
                      <span className="font-semibold">
                        {exercise.sets} × {exercise.reps}
                      </span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exercise.rest_time}
                      </span>
                      {lastLog && (
                        <>
                          <span className="hidden md:inline">•</span>
                          <span className="text-green-600 hidden md:inline">
                            Sist: {lastLog.sets_completed} × {lastLog.reps_completed}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLoggingExercise(exercise.id);
                        setLogData({ sets: exercise.sets, reps: exercise.reps, notes: '' });
                      }}
                      className="neo-button-primary px-2 sm:px-3 py-1 sm:py-1.5 text-xs flex items-center gap-1 active:scale-95"
                    >
                      <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Logg</span>
                    </button>
                    <button className="text-gray-400 p-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <div>
                      <p className="text-sm text-gray-700">{exercise.description}</p>
                      {exercise.notes && (
                        <p className="text-xs text-gray-600 mt-2 bg-amber-50 px-3 py-2 rounded-lg">
                          💡 {exercise.notes}
                        </p>
                      )}
                    </div>

                    {/* Exercise History */}
                    {exerciseLogs.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">
                          Historikk ({exerciseLogs.length})
                        </h4>
                        <div className="space-y-1.5">
                          {exerciseLogs.slice(0, 5).map((log) => (
                            <div
                              key={log.id}
                              className="text-xs text-gray-600 flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg"
                            >
                              <span className="font-semibold">
                                {log.sets_completed} sett × {log.reps_completed} reps
                              </span>
                              <span>{new Date(log.completed_at).toLocaleDateString('nb-NO')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Logging Modal */}
      {loggingExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="neo-card max-w-md w-full animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Logg økt</h3>
              <button
                onClick={() => setLoggingExercise(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-gray-700">
                {exercises.find((e) => e.id === loggingExercise)?.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Sett</label>
                <input
                  type="number"
                  className="neo-input text-center text-lg font-bold"
                  value={logData.sets || ''}
                  onChange={(e) =>
                    setLogData({ ...logData, sets: parseInt(e.target.value) || 0 })
                  }
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reps</label>
                <input
                  type="text"
                  className="neo-input text-center text-lg font-bold"
                  value={logData.reps}
                  onChange={(e) => setLogData({ ...logData, reps: e.target.value })}
                  placeholder="8-12"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Notater (valgfritt)
              </label>
              <textarea
                className="neo-input text-sm"
                rows={2}
                value={logData.notes}
                onChange={(e) => setLogData({ ...logData, notes: e.target.value })}
                placeholder="Føltes tungt, øk vekt neste gang..."
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setLoggingExercise(null)} className="neo-button flex-1">
                Avbryt
              </button>
              <button onClick={handleLogWorkout} className="neo-button-primary flex-1">
                Lagre
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ProgramView;
