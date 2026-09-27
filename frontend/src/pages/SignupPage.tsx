import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const GENRES = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Science Fiction', 'Thriller'];

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', username: '', password: '', full_name: '' });
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await signup(form);
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    try {
      // Update favorite genres in profile
      const { userService } = await import('../services/userService');
      await userService.updateProfile({ favorite_genres: selectedGenres });
      await refreshUser();
      toast.success('Welcome to CineAI! 🎬');
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&q=60')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface/95 to-surface" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Film className="text-primary w-8 h-8" />
            <span className="text-3xl font-black text-white">Cine<span className="text-primary">AI</span></span>
          </Link>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2].map((s) => (
              <div key={s} className={`flex items-center gap-2 ${s < 2 ? 'flex-1 max-w-[120px]' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= s ? 'bg-primary text-white' : 'bg-surface-elevated text-text-muted'}`}>
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 2 && <div className={`flex-1 h-0.5 transition-all ${step > s ? 'bg-primary' : 'bg-surface-border'}`} />}
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-white">
            {step === 1 ? 'Create your account' : 'Pick your favorite genres'}
          </h1>
          <p className="text-text-muted mt-1 text-sm">
            {step === 1 ? 'Start discovering AI-powered recommendations' : 'We\'ll personalize your experience'}
          </p>
        </div>

        <div className="glass-card p-8">
          {step === 1 && (
            <>
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-6 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <form onSubmit={handleStep1} className="space-y-4">
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block" htmlFor="signup-name">Full Name (optional)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block" htmlFor="signup-username">Username *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
                    <input
                      id="signup-username"
                      type="text"
                      required
                      placeholder="johndoe"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      className="input-field pl-8"
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block" htmlFor="signup-email">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      id="signup-email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-field pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-text-secondary text-sm mb-1.5 block" htmlFor="signup-password">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 8 characters"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="input-field pl-10 pr-10"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  <div className="flex gap-1 mt-1.5">
                    {[1, 2, 3].map((level) => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-all ${form.password.length >= level * 4 ? level === 3 ? 'bg-accent-green' : level === 2 ? 'bg-yellow-400' : 'bg-red-400' : 'bg-surface-border'}`} />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3 text-base mt-2"
                  id="signup-submit"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Continue →'}
                </button>
              </form>
              <p className="text-center text-text-muted text-sm mt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary-light font-medium">Sign in</Link>
              </p>
            </>
          )}

          {step === 2 && (
            <div>
              <p className="text-text-secondary text-sm mb-4">
                Select genres you enjoy (optional – helps us personalize your recommendations):
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={selectedGenres.includes(g) ? 'genre-pill-active' : 'genre-pill'}
                  >
                    {selectedGenres.includes(g) && <Check className="w-3 h-3 inline mr-1" />}{g}
                  </button>
                ))}
              </div>
              <button onClick={handleStep2} className="btn-primary w-full justify-center py-3 text-base" id="finish-signup">
                {selectedGenres.length > 0 ? `Start Exploring (${selectedGenres.length} selected)` : 'Skip & Start Exploring'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
