// src/pages/Home.jsx - Blog home: live category tabs, per-category bright cards, vertical auto-scroll
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../api/posts';
import useCategories from '../hooks/useCategories';
import SubscribeForm from '../components/SubscribeForm';
import WorkCTA from '../components/WorkCTA';

const SERIF = '"Fraunces", Georgia, serif';
const ALL_ACCENT = '#E8B339';
const FALLBACK_ACCENT = '#5AA9E6';

// Curated hero copy for the original categories; new ones get generic copy.
const HERO_KNOWN = {
  all:    { eyebrow: '// the blog',        heading: 'Field notes, verses, and everything in between.', sub: 'Tech, poems, and health & lifestyle — building real things and writing about it.' },
  tech:   { eyebrow: '// engineering log', heading: 'Building software for the businesses that build Brooklyn.', sub: 'Python, React, and the messy decisions in between.' },
  poem:   { eyebrow: '// verses',          heading: 'Lines worth slowing down for.', sub: 'Small poems on code, the city, and being human.' },
  health: { eyebrow: '// field notes',     heading: 'Build a life that holds up.', sub: 'Notes on energy, focus, and living well while you build.' },
};

const hexToRgba = (hex, a) => {
  const h = (hex || '#000000').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(0,0,0,${a})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState('all');
  const { categories } = useCategories();

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const data = await getPosts();
        if (on) setPosts(Array.isArray(data) ? data : []);
      } catch (err) {
        if (on) setError('Could not load posts. Is the backend running?');
        console.error(err);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  // slug -> theme meta, built from the live categories table
  const catMap = useMemo(() => {
    const m = {};
    for (const c of categories) {
      m[c.slug] = { label: c.name, accent: c.color_primary, serif: c.serif };
    }
    return m;
  }, [categories]);

  const metaFor = (slug) =>
    catMap[slug] || { label: slug || 'Writing', accent: FALLBACK_ACCENT, serif: false };

  const tabs = ['all', ...categories.map((c) => c.slug)];
  const cat = active === 'all' ? { label: 'All', accent: ALL_ACCENT, serif: false } : metaFor(active);
  const accent = cat.accent;
  const hero =
    HERO_KNOWN[active] || { eyebrow: `// ${cat.label.toLowerCase()}`, heading: `${cat.label}.`, sub: '' };

  const visible = useMemo(
    () => (active === 'all' ? posts : posts.filter((p) => (p.category || 'tech') === active)),
    [posts, active]
  );

  const animate = visible.length > 3;
  const duration = Math.max(20, visible.length * 5);

  const renderCard = (post, key) => {
    const pc = metaFor(post.category);
    return (
      <Link to={`/post/${post.slug}`} key={key} className="block">
        <article
          className="feed-card relative overflow-hidden rounded-2xl p-6 cursor-pointer"
          style={{
            '--accent': pc.accent,
            background: `linear-gradient(135deg, #ffffff 0%, ${hexToRgba(pc.accent, 0.42)} 100%)`,
          }}
        >
          <div className="flex items-center gap-3 font-mono text-xs mb-3" style={{ color: 'rgba(0,0,0,0.5)' }}>
            <span className="uppercase tracking-widest font-semibold" style={{ color: pc.accent }}>{pc.label}</span>
            <span style={{ color: 'rgba(0,0,0,0.22)' }}>/</span>
            <span>{post.read_time} min</span>
            <span style={{ color: 'rgba(0,0,0,0.22)' }}>/</span>
            <span>{post.views} views</span>
            {post.is_featured && (
              <span className="ml-auto rounded-full px-2 py-0.5" style={{ border: '1px solid rgba(0,0,0,0.15)', color: 'rgba(0,0,0,0.6)' }}>
                featured
              </span>
            )}
          </div>
          <h3
            className="font-display text-2xl font-semibold leading-snug mb-2"
            style={pc.serif ? { color: '#1a1a1a', fontFamily: SERIF } : { color: '#1a1a1a' }}
          >
            {post.title}
          </h3>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(0,0,0,0.7)' }}>{post.excerpt}</p>
          <div className="font-mono text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
            {post.author.full_name || post.author.username}
          </div>
        </article>
      </Link>
    );
  };

  return (
    <div className="min-h-screen">
      <style>{`
        @keyframes feedScroll { from { transform: translateY(0); } to { transform: translateY(-50%); } }
        .feed-track { animation: feedScroll var(--feed-dur, 40s) linear infinite; will-change: transform; }
        .feed-viewport:hover .feed-track { animation-play-state: paused; }
        .feed-mask {
          -webkit-mask-image: linear-gradient(to bottom, transparent, #000 7%, #000 85%, transparent);
          mask-image: linear-gradient(to bottom, transparent, #000 7%, #000 85%, transparent);
        }
        .feed-card { transition: transform .3s ease, box-shadow .3s ease; box-shadow: 0 4px 14px -8px rgba(0,0,0,0.4); }
        .feed-card:hover { transform: translateY(-5px) scale(1.012); box-shadow: 0 26px 52px -18px var(--accent); }
        @media (prefers-reduced-motion: reduce) { .feed-track { animation: none; } }
      `}</style>

      {/* Hero — re-themes per category */}
      <header
        className="relative overflow-hidden border-b border-border transition-all duration-500"
        style={{ background: `radial-gradient(120% 100% at 25% 0%, ${hexToRgba(accent, 0.10)}, transparent 60%)` }}
      >
        <div
          className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-25 blur-[120px] transition-all duration-500"
          style={{ backgroundColor: accent }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-24">
          <p className="font-mono text-xs tracking-widest uppercase mb-6 transition-colors duration-500" style={{ color: accent }}>
            {hero.eyebrow}
          </p>
          <h1
            className="font-display text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight max-w-3xl"
            style={cat.serif ? { fontFamily: SERIF, fontStyle: 'italic' } : undefined}
          >
            {hero.heading}
          </h1>
          {hero.sub && (
            <p className="mt-6 text-lg text-muted max-w-xl leading-relaxed" style={cat.serif ? { fontFamily: SERIF } : undefined}>
              {hero.sub}
            </p>
          )}
        </div>
      </header>

      {/* Posts */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="font-mono text-xs text-muted tracking-widest uppercase">Latest writing</h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              {tabs.map((key) => {
                const meta = key === 'all' ? { label: 'All', accent: ALL_ACCENT } : metaFor(key);
                const on = active === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActive(key)}
                    className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                      on ? '' : 'border-border text-muted hover:text-fg hover:border-glow/40'
                    }`}
                    style={on ? { background: meta.accent, borderColor: meta.accent, color: '#0b0b0f' } : undefined}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          <span className="font-mono text-xs text-muted">
            {visible.length} {visible.length === 1 ? 'post' : 'posts'}
          </span>
        </div>

        {loading && <p className="font-mono text-sm text-muted">Loading…</p>}
        {error && <p className="font-mono text-sm text-glow">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="font-mono text-sm text-muted">Nothing here yet in this category.</p>
        )}

        {animate ? (
          <div className="feed-viewport feed-mask relative h-[72vh] max-h-[760px] overflow-hidden">
            <div className="feed-track space-y-4" style={{ '--feed-dur': `${duration}s` }}>
              {[...visible, ...visible].map((post, i) => renderCard(post, `${post.id}-${i}`))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((post) => renderCard(post, post.id))}
          </div>
        )}

        {animate && (
          <p className="mt-4 text-center font-mono text-[11px] text-muted tracking-widest uppercase">
            ↑ scrolling · hover to pause
          </p>
        )}

        <div className="mt-16">
          <WorkCTA />
        </div>

        <div className="mt-8">
          <SubscribeForm />
        </div>
      </main>
    </div>
  );
}

export default Home;