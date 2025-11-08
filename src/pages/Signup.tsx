import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passordene matcher ikke');
      return;
    }

    if (password.length < 6) {
      setError('Passordet må være minst 6 tegn');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Noe gikk galt. Prøv igjen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="neo-card">
          <div className="flex items-center justify-center mb-8">
            <div className="neo-card p-4 inline-block">
              <Dumbbell className="w-12 h-12 text-primary-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            Opprett konto
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Start din reise med AI-drevet trening
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-2xl mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Konto opprettet! Sjekk e-posten din for bekreftelse.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E-post
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="neo-input pl-12"
                  placeholder="din@epost.no"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Passord
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="neo-input pl-12"
                  placeholder="Minst 6 tegn"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bekreft passord
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="neo-input pl-12"
                  placeholder="Gjenta passord"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neo-button-primary w-full"
            >
              {loading ? 'Oppretter konto...' : 'Opprett konto'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Har du allerede konto?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
                Logg inn
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
