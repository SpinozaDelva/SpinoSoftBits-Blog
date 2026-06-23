// src/components/WorkCTA.jsx - links out to the main portfolio site
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
        Web apps, full-stack systems, MVPs — from idea to live. See my work and get in touch.
      </p>
      <a
        href="https://spinosoftbits.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-xl bg-glow px-7 py-3.5 font-display font-bold text-ink transition-transform hover:scale-[1.03]"
      >
        View my portfolio →
      </a>
    </div>
  );
}

export default WorkCTA;