// src/components/WorkCTA.jsx - "Work with me" call-to-action band
import { Link } from 'react-router-dom';

function WorkCTA() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-border px-6 py-10 md:px-12 md:py-12 text-center"
      style={{
        background:
          'linear-gradient(135deg, rgba(90,169,230,0.12) 0%, rgba(118,75,162,0.14) 60%, rgba(232,179,57,0.12) 100%)',
      }}
    >
      <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--color-glow)' }}>
        // work with me
      </p>
      <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">Have a project? Let's build it.</h3>
      <p className="text-muted mb-7 max-w-lg mx-auto leading-relaxed">
        Web apps, full-stack systems, MVPs — from idea to live. I'm taking on freelance work.
      </p>
      <Link
        to="/work"
        className="inline-block rounded-xl bg-glow px-7 py-3.5 font-display font-bold text-ink transition-transform hover:scale-[1.03]"
      >
        Work with me →
      </Link>
    </div>
  );
}

export default WorkCTA;