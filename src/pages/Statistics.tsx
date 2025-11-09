import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api, type WorkoutLog } from '../lib/api';
import { ArrowLeft, Calendar, Dumbbell, TrendingUp, Activity } from 'lucide-react';

type DayStats = {
  date: string;
  exerciseCount: number;
  logs: WorkoutLog[];
};

type MonthlyStats = {
  [month: string]: DayStats[];
};

const Statistics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({});
  const [totalStats, setTotalStats] = useState({
    totalWorkouts: 0,
    totalExercises: 0,
    uniqueDays: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    loadStatistics();
  }, [user]);

  const loadStatistics = async () => {
    if (!user) return;

    try {
      const data = await api.getWorkoutLogs();
      processStatistics(data || []);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
    setLoading(false);
  };

  const processStatistics = (workoutLogs: WorkoutLog[]) => {
    if (workoutLogs.length === 0) {
      setLoading(false);
      return;
    }

    // Group by date
    const dayMap: { [key: string]: WorkoutLog[] } = {};
    workoutLogs.forEach((log) => {
      const date = new Date(log.completed_at).toLocaleDateString('nb-NO');
      if (!dayMap[date]) {
        dayMap[date] = [];
      }
      dayMap[date].push(log);
    });

    // Group by month
    const monthMap: MonthlyStats = {};
    Object.keys(dayMap).forEach((date) => {
      const [, month, year] = date.split('.');
      const monthKey = `${month}.${year}`;
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = [];
      }
      monthMap[monthKey].push({
        date,
        exerciseCount: dayMap[date].length,
        logs: dayMap[date],
      });
    });

    // Sort days within each month
    Object.keys(monthMap).forEach((month) => {
      monthMap[month].sort((a, b) => {
        const dateA = new Date(a.date.split('.').reverse().join('-'));
        const dateB = new Date(b.date.split('.').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
      });
    });

    setMonthlyStats(monthMap);

    // Calculate total stats
    const uniqueDays = Object.keys(dayMap).length;
    const totalExercises = workoutLogs.length;

    // Calculate current streak
    const sortedDates = Object.keys(dayMap).sort((a, b) => {
      const dateA = new Date(a.split('.').reverse().join('-'));
      const dateB = new Date(b.split('.').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedDates.length; i++) {
      const logDate = new Date(sortedDates[i].split('.').reverse().join('-'));
      logDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak || daysDiff === streak + 1) {
        streak = daysDiff + 1;
      } else {
        break;
      }
    }

    setTotalStats({
      totalWorkouts: uniqueDays,
      totalExercises,
      uniqueDays,
      currentStreak: streak,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neo-card p-8">
          <div className="animate-pulse text-center">
            <div className="text-xl font-semibold text-gray-700">Laster statistikk...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="neo-button p-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-8 h-8 text-primary-600" />
              Treningsstatistikk
            </h1>
            <p className="text-gray-600">Oversikt over din treningsaktivitet</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="neo-card">
            <div className="flex items-center gap-3">
              <div className="neo-card p-3">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Totalt treningsdager</p>
                <p className="text-3xl font-bold text-gray-800">{totalStats.totalWorkouts}</p>
              </div>
            </div>
          </div>

          <div className="neo-card">
            <div className="flex items-center gap-3">
              <div className="neo-card p-3">
                <Dumbbell className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Totalt øvelser</p>
                <p className="text-3xl font-bold text-gray-800">{totalStats.totalExercises}</p>
              </div>
            </div>
          </div>

          <div className="neo-card">
            <div className="flex items-center gap-3">
              <div className="neo-card p-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Gjennomsnitt per dag</p>
                <p className="text-3xl font-bold text-gray-800">
                  {totalStats.totalWorkouts > 0
                    ? Math.round(totalStats.totalExercises / totalStats.totalWorkouts)
                    : 0}
                </p>
              </div>
            </div>
          </div>

          <div className="neo-card">
            <div className="flex items-center gap-3">
              <div className="neo-card p-3">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Nåværende streak</p>
                <p className="text-3xl font-bold text-gray-800">{totalStats.currentStreak} dager</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown */}
        {Object.keys(monthlyStats).length === 0 ? (
          <div className="neo-card p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ingen treningsdata ennå</h2>
            <p className="text-gray-600 mb-6">Start å logge økter for å se statistikk her</p>
            <button
              onClick={() => navigate('/programs')}
              className="neo-button-primary inline-flex items-center gap-2"
            >
              <Dumbbell className="w-5 h-5" />
              Gå til programmer
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(monthlyStats)
              .sort((a, b) => {
                const [monthA, yearA] = a.split('.');
                const [monthB, yearB] = b.split('.');
                return yearB.localeCompare(yearA) || monthB.localeCompare(monthA);
              })
              .map((month) => (
                <div key={month} className="neo-card">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-primary-600" />
                    {month}
                  </h2>
                  <div className="space-y-3">
                    {monthlyStats[month].map((day) => (
                      <div
                        key={day.date}
                        className="neo-card hover:shadow-neo-hover transition-all p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="neo-card p-2">
                                <Calendar className="w-5 h-5 text-primary-600" />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800 text-lg">{day.date}</h3>
                                <p className="text-sm text-gray-600">
                                  {day.exerciseCount} øvelse{day.exerciseCount !== 1 ? 'r' : ''} fullført
                                </p>
                              </div>
                            </div>
                            <div className="ml-12 space-y-1">
                              {day.logs.slice(0, 5).map((log, idx) => (
                                <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                  <Dumbbell className="w-4 h-4 text-gray-400" />
                                  <span>
                                    {log.sets_completed} sett × {log.reps_completed} reps
                                  </span>
                                </div>
                              ))}
                              {day.logs.length > 5 && (
                                <p className="text-sm text-gray-500 italic ml-6">
                                  +{day.logs.length - 5} flere...
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="neo-card p-3">
                              <p className="text-3xl font-bold text-primary-600">
                                {day.exerciseCount}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
