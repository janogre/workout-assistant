import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api, type WorkoutProgram } from '../lib/api';
import { MessageSquare, Dumbbell, TrendingUp, LogOut, Plus, Eye, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPrograms: 0,
    totalWorkouts: 0,
    thisWeek: 0,
  });

  useEffect(() => {
    loadPrograms();
    loadStats();
  }, [user]);

  const loadPrograms = async () => {
    if (!user) return;

    try {
      const data = await api.getPrograms();
      setPrograms(data || []);
    } catch (error) {
      console.error('Error loading programs:', error);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
              Hei, {user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-sm sm:text-base text-gray-600">Klar for dagens økt?</p>
          </div>
          <button onClick={handleSignOut} className="neo-button flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2">
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Logg ut</span>
            <span className="sm:hidden">Ut</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="neo-card p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:gap-4 text-center sm:text-left">
              <div className="neo-card p-2 sm:p-3 mb-2 sm:mb-0">
                <Dumbbell className="w-4 h-4 sm:w-6 sm:h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-semibold">Programmer</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{stats.totalPrograms}</p>
              </div>
            </div>
          </div>

          <div className="neo-card p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:gap-4 text-center sm:text-left">
              <div className="neo-card p-2 sm:p-3 mb-2 sm:mb-0">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-semibold">Økter</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{stats.totalWorkouts}</p>
              </div>
            </div>
          </div>

          <div className="neo-card p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:gap-4 text-center sm:text-left">
              <div className="neo-card p-2 sm:p-3 mb-2 sm:mb-0">
                <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600 font-semibold">Uke</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{stats.thisWeek}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/chat')}
            className="neo-card hover:shadow-neo-hover transition-all p-4 sm:p-6 md:p-8 text-left active:scale-95"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="neo-card p-2 sm:p-3 md:p-4 flex-shrink-0">
                <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-2xl font-bold text-gray-800">Nytt program</h3>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Chat med AI</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/programs')}
            className="neo-card hover:shadow-neo-hover transition-all p-4 sm:p-6 md:p-8 text-left active:scale-95"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="neo-card p-2 sm:p-3 md:p-4 flex-shrink-0">
                <Dumbbell className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-2xl font-bold text-gray-800">Programmer</h3>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Se og logg</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/statistics')}
            className="neo-card hover:shadow-neo-hover transition-all p-4 sm:p-6 md:p-8 text-left active:scale-95 sm:col-span-2 md:col-span-1"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="neo-card p-2 sm:p-3 md:p-4 flex-shrink-0">
                <Activity className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-2xl font-bold text-gray-800">Statistikk</h3>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Se fremgang</p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Programs */}
        <div className="neo-card">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Siste programmer</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-gray-600">Laster...</div>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Du har ingen programmer ennå</p>
              <button
                onClick={() => navigate('/chat')}
                className="neo-button-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Opprett ditt første program
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {programs.slice(0, 5).map((program) => (
                <div
                  key={program.id}
                  className="neo-card flex items-center justify-between p-3 sm:p-4 hover:shadow-neo-hover transition-all cursor-pointer active:scale-95"
                  onClick={() => navigate(`/program/${program.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base md:text-lg truncate">{program.name}</h3>
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">{program.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(program.created_at).toLocaleDateString('nb-NO')}
                    </p>
                  </div>
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
