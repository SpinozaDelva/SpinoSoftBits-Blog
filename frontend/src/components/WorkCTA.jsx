function WorkCTA() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border px-6 py-12 md:py-14 text-center" style={{ background: 'linear-gradient(135deg, rgba(90,169,230,0.12), rgba(118,75,162,0.14), rgba(232,179,57,0.12))' }}>
      <p className="font-mono text-xs tracking-widest uppercase mb-3 text-glow">work with me</p>
      <h3 className="font-display text-2xl md:text-3xl font-bold mb-3">Have a project? Let us build it.</h3>
      <p className="text-muted mb-7 max-w-lg mx-auto leading-relaxed">Web apps, full-stack systems, and MVPs. See my work and get in touch.</p>
      <a href="https://spinosoftbits.com" target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl bg-glow px-7 py-3.5 font-display font-bold text-ink transition-transform hover:scale-105">View my portfolio</a>
    </div>
  );
}

export default WorkCTA;