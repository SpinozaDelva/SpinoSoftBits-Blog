// src/pages/Login.jsx - Admin login
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError('Invalid email or password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-24">
         <p className="font-mono text-xs text-glow tracking-widest uppercase mb-6">
        // admin only
      </p>
      <h1 className="font-display text-3xl font-bold mb-3">Sign in</h1>
      <p className="text-muted text-sm mb-8 leading-relaxed">
        This area is for authors. Public accounts are{' '}
        <span className="text-glow">coming soon</span> — access is granted
        per person for now.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block font-mono text-xs text-muted mb-2">email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
            placeholder="you@spinosoftbits.com"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-muted mb-2">password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="font-mono text-xs text-glow">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-lg bg-glow px-4 py-3 font-display font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}

export default Login;