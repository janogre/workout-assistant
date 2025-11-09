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
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Hei, {user?.email?.split('@')[0]}! 👋
            </h1>
            <p className="text-gray-600">Klar for dagens økt?</p>
          </div>
          <button onClick={handleSignOut} className="neo-button flex items-center gap-2">
            <LogOut className="w-5 h-5" />
            Logg ut
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="neo-card">
            <div className="flex items-center gap-4">
              <div className="neo-card p-3">
                <Dumbbell className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Totalt programmer</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalPrograms}</p>
              </div>
            </div>
          </div>

          <div className="neo-card">
            <div className="flex items-center gap-4">
              <div className="neo-card p-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Totalt økter</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalWorkouts}</p>
              </div>
            </div>
          </div>

          <div className="neo-card">
            <div className="flex items-center gap-4">
              <div className="neo-card p-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600 font-semibold">Denne uken</p>
                <p className="text-3xl font-bold text-gray-800">{stats.thisWeek}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate('/chat')}
            className="neo-card hover:shadow-neo-hover transition-all p-8 text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="neo-card p-4">
                <MessageSquare className="w-8 h-8 text-primary-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Opprett nytt program</h3>
                <p className="text-gray-600">Chat med AI for skreddersydd treningsplan</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/programs')}
            className="neo-card hover:shadow-neo-hover transition-all p-8 text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="neo-card p-4">
                <Dumbbell className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Mine programmer</h3>
                <p className="text-gray-600">Se og logg dine treningsprogrammer</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/statistics')}
            className="neo-card hover:shadow-neo-hover transition-all p-8 text-left"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="neo-card p-4">
                <Activity className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Statistikk</h3>
                <p className="text-gray-600">Se din treningsaktivitet og fremgang</p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Programs */}
        <div className="neo-card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Siste programmer</h2>
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
            <div className="space-y-4">
              {programs.slice(0, 5).map((program) => (
                <div
                  key={program.id}
                  className="neo-card flex items-center justify-between p-4 hover:shadow-neo-hover transition-all cursor-pointer"
                  onClick={() => navigate(`/program/${program.id}`)}
                >
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{program.name}</h3>
                    <p className="text-gray-600 text-sm">{program.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Opprettet {new Date(program.created_at).toLocaleDateString('nb-NO')}
                    </p>
                  </div>
                  <Eye className="w-5 h-5 text-gray-400" />
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
