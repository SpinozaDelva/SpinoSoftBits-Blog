function WorkCTA() {
  return (
    <div className="max-w-sm mx-auto">
      <div className="relative overflow-hidden rounded-2xl border border-border px-6 py-7 text-center" style={{ background: 'linear-gradient(135deg, rgba(90,169,230,0.12), rgba(118,75,162,0.14), rgba(232,179,57,0.12))' }}>
        <p className="font-mono text-[11px] tracking-widest uppercase mb-2 text-glow">work with me</p>
        <h3 className="font-display text-lg font-bold mb-2">Have a project?</h3>
        <p className="text-muted text-sm mb-5 leading-relaxed">Web apps, full-stack systems, and MVPs.</p>
        <a href="https://spinosoftbits.com" target="_blank" rel="noopener noreferrer" className="inline-block rounded-lg bg-glow px-5 py-2.5 font-display font-bold text-sm text-ink transition-transform hover:scale-105">View my portfolio</a>
      </div>
    </div>
  );
}

export default WorkCTA;
