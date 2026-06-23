// src/components/SubscribeForm.jsx - Newsletter signup (attention-catching)
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
    <div
      className="relative overflow-hidden rounded-3xl px-6 py-10 md:px-12 md:py-14"
      style={{
        background:
          'linear-gradient(135deg, rgba(232,179,57,0.16) 0%, rgba(110,231,183,0.10) 55%, rgba(90,169,230,0.14) 100%)',
        border: '1px solid rgba(232,179,57,0.35)',
      }}
    >
      <style>{`
        @keyframes nlPulse { 0%,100% { opacity: .35; } 50% { opacity: .6; } }
        .nl-blob { animation: nlPulse 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .nl-blob{ animation: none; } }
      `}</style>

      {/* Glow blobs */}
      <div
        className="nl-blob pointer-events-none absolute -top-20 -right-10 h-60 w-60 rounded-full blur-[90px]"
        style={{ background: '#E8B339' }}
      />
      <div
        className="nl-blob pointer-events-none absolute -bottom-24 -left-10 h-60 w-60 rounded-full blur-[90px]"
        style={{ background: '#6EE7B7', animationDelay: '3s' }}
      />

      <div className="relative max-w-2xl">
        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: '#E8B339' }}>
          ✦ stay in the loop
        </p>
        <h3 className="font-display text-3xl md:text-4xl font-bold mb-3 leading-tight">
          New posts, straight to your inbox.
        </h3>
        <p className="text-muted mb-7 leading-relaxed">
          Tech, poems, and health &amp; lifestyle — the moment they drop. No spam, unsubscribe anytime.
        </p>

        {status === 'done' ? (
          <div
            className="rounded-xl px-5 py-4 font-mono text-sm"
            style={{ background: 'rgba(110,231,183,0.14)', border: '1px solid rgba(110,231,183,0.4)', color: '#6EE7B7' }}
          >
            🎉 You're in — check your inbox for a welcome note.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="you@example.com"
              className="flex-1 rounded-xl border border-border bg-ink/70 px-5 py-4 text-fg outline-none focus:border-glow transition-colors backdrop-blur-sm"
            />
            <button
              onClick={handleSubmit}
              disabled={!valid || status === 'sending'}
              className="rounded-xl px-7 py-4 font-display font-bold text-ink transition-all hover:scale-[1.03] hover:shadow-lg disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: '#E8B339', boxShadow: '0 10px 30px -10px #E8B339' }}
            >
              {status === 'sending' ? 'Joining…' : 'Subscribe'}
            </button>
          </div>
        )}

        {status === 'error' && <p className="font-mono text-xs text-red-300 mt-3">{error}</p>}
      </div>
    </div>
  );
}

export default SubscribeForm;