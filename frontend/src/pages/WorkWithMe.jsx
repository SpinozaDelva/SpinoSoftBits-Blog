// src/pages/WorkWithMe.jsx - Lead funnel: pitch + contact form
import { useState } from 'react';
import { submitInquiry } from '../api/contact';

const SERVICES = [
  {
    title: 'Web apps & sites',
    body: 'Fast, modern front-ends in React — dashboards, web apps, and marketing sites that actually convert.',
  },
  {
    title: 'Full-stack builds',
    body: 'The whole system: APIs, databases, auth, payments, email — designed, wired together, and deployed.',
  },
  {
    title: 'MVPs, shipped',
    body: 'Got an idea? I take it from zero to a live product you can put in front of real users — fast.',
  },
];

const PROJECT_TYPES = ['Web app', 'Website', 'Full-stack build', 'MVP / product', 'Something else'];
const BUDGETS = ['Under $1k', '$1k – $5k', '$5k – $15k', '$15k+', 'Not sure yet'];

function WorkWithMe() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [budget, setBudget] = useState(BUDGETS[0]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSend = name.trim() && validEmail && message.trim().length >= 5;

  const handleSubmit = async () => {
    if (!canSend || status === 'sending') {
      if (!canSend) setError('Add your name, a valid email, and a short message.');
      return;
    }
    setStatus('sending');
    setError('');
    try {
      await submitInquiry({
        name: name.trim(),
        email: email.trim(),
        project_type: projectType,
        budget,
        message: message.trim(),
      });
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setError('Something went wrong. Try again, or email hello@spinosoftbits.com directly.');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        <div
          className="absolute -top-40 left-1/3 h-96 w-96 rounded-full opacity-20 blur-[120px]"
          style={{ backgroundColor: 'var(--color-glow)' }}
        />
        <div className="relative max-w-4xl mx-auto px-6 py-20">
          <p className="font-mono text-xs text-glow tracking-widest uppercase mb-5">// work with me</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight tracking-tight max-w-2xl">
            Need something built? Let's talk.
          </h1>
          <p className="mt-5 text-lg text-muted max-w-xl leading-relaxed">
            I'm Spinoza Delva — a full-stack engineer in Brooklyn. I design, build, and ship
            real software end to end. This blog (CMS, Stripe pay-to-unlock, newsletter, SEO) is
            something I built myself — I can build yours too.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Services */}
        <div className="grid gap-5 sm:grid-cols-3 mb-16">
          {SERVICES.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-ink-raised p-6">
              <h3 className="font-display text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl font-bold mb-2">Tell me about your project</h2>
          <p className="text-muted mb-8 leading-relaxed">
            A few details and I'll get back to you. No obligation — let's see if it's a fit.
          </p>

          {status === 'done' ? (
            <div
              className="rounded-2xl px-6 py-8 text-center"
              style={{ background: 'rgba(110,231,183,0.12)', border: '1px solid rgba(110,231,183,0.4)' }}
            >
              <div className="text-3xl mb-3">✅</div>
              <p className="font-display text-xl font-semibold text-fg mb-1">Got it, {name.split(' ')[0]}!</p>
              <p className="font-mono text-sm" style={{ color: '#6EE7B7' }}>
                I'll get back to you at {email} soon.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-xs text-muted mb-2">your name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted mb-2">email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-xs text-muted mb-2">project type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
                  >
                    {PROJECT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-xs text-muted mb-2">budget</label>
                  <select
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
                  >
                    {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-muted mb-2">what are you building?</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg leading-relaxed outline-none focus:border-glow/50 transition-colors resize-y"
                  placeholder="A few sentences about your idea, timeline, and what you need…"
                />
              </div>

              {(status === 'error' || error) && (
                <p className="font-mono text-xs text-red-300">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSend || status === 'sending'}
                className="rounded-lg bg-glow px-7 py-3.5 font-display font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {status === 'sending' ? 'Sending…' : 'Send inquiry'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default WorkWithMe;