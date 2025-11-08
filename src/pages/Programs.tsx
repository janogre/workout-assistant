import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, type WorkoutProgram } from '../lib/supabase';
import { ArrowLeft, Dumbbell, Eye, Plus, Trash2 } from 'lucide-react';

const Programs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrograms();
  }, [user]);

  const loadPrograms = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('workout_programs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading programs:', error);
    } else {
      setPrograms(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Er du sikker på at du vil slette "${name}"?`)) return;

    const { error } = await supabase.from('workout_programs').delete().eq('id', id);

    if (error) {
      console.error('Error deleting program:', error);
      alert('Feil ved sletting av program');
    } else {
      loadPrograms();
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="neo-button p-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">Mine programmer</h1>
            <p className="text-gray-600">Oversikt over alle dine treningsprogrammer</p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="neo-button-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nytt program
          </button>
        </div>

        {/* Programs List */}
        {loading ? (
          <div className="neo-card p-8">
            <div className="text-center text-gray-600 animate-pulse">Laster...</div>
          </div>
        ) : programs.length === 0 ? (
          <div className="neo-card p-12 text-center">
            <Dumbbell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ingen programmer ennå</h2>
            <p className="text-gray-600 mb-6">Opprett ditt første treningsprogram med AI-assistenten</p>
            <button
              onClick={() => navigate('/chat')}
              className="neo-button-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Opprett program
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {programs.map((program) => (
              <div key={program.id} className="neo-card hover:shadow-neo-hover transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{program.name}</h3>
                    <p className="text-gray-600 mb-3">{program.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Opprettet {new Date(program.created_at).toLocaleDateString('nb-NO')}</span>
                      <span>•</span>
                      <span>Sist endret {new Date(program.updated_at).toLocaleDateString('nb-NO')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/program/${program.id}`)}
                      className="neo-button p-3"
                      title="Vis program"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(program.id, program.name)}
                      className="neo-button p-3 hover:bg-red-50"
                      title="Slett program"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Programs;
