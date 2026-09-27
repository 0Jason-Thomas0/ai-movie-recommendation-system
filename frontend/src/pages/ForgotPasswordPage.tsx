import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Film className="text-primary w-8 h-8" />
            <span className="text-3xl font-black text-white">Cine<span className="text-primary">AI</span></span>
          </Link>
          {!sent ? (
            <>
              <h1 className="text-2xl font-bold text-white">Forgot password?</h1>
              <p className="text-text-muted mt-1">We'll send you a reset link</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent-green" />
              </div>
              <h1 className="text-2xl font-bold text-white">Check your email</h1>
              <p className="text-text-muted mt-1">Reset link sent to <span className="text-white">{email}</span></p>
            </>
          )}
        </div>

        <div className="glass-card p-8">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm mb-1.5 block" htmlFor="forgot-email">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    autoComplete="email"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3"
                id="forgot-submit"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className="text-text-secondary text-sm mb-4">
                If this email is registered, you'll receive a password reset link shortly. Check your spam folder too.
              </p>
              <button onClick={() => setSent(false)} className="btn-secondary w-full justify-center">
                Try a different email
              </button>
            </div>
          )}

          <div className="mt-4 text-center">
            <Link to="/login" className="text-text-muted hover:text-white text-sm flex items-center justify-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
