// src/components/SubscribeForm.jsx - Newsletter signup
import { useState } from 'react';
import { subscribe } from '../api/newsletter';

function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async () => {
    if (!valid || status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      await subscribe({ email: email.trim() });
      setStatus('done');
      setEmail('');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Try again in a moment.');
      setStatus('error');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="rounded-2xl border border-border bg-ink-raised px-6 py-8 md:px-10 md:py-10">
      <p className="font-mono text-xs text-glow tracking-widest uppercase mb-3">// stay in the loop</p>
      <h3 className="font-display text-2xl font-bold mb-2">New posts, straight to your inbox</h3>
      <p className="text-muted mb-6 leading-relaxed">
        Tech, poems, and health &amp; lifestyle. No spam, unsubscribe anytime.
      </p>

      {status === 'done' ? (
        <p className="font-mono text-sm text-glow">
          You're in — check your inbox for a welcome note. 🎉
        </p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="you@example.com"
            className="flex-1 rounded-lg border border-border bg-ink px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={!valid || status === 'sending'}
            className="rounded-lg bg-glow px-6 py-3 font-display font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {status === 'sending' ? 'Joining…' : 'Subscribe'}
          </button>
        </div>
      )}

      {status === 'error' && (
        <p className="font-mono text-xs text-red-300 mt-3">{error}</p>
      )}
    </div>
  );
}

export default SubscribeForm;