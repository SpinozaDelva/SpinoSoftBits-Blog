// src/pages/Home.jsx - Blog home: live category tabs, featured slider, horizontal auto-scroll feed
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../api/posts';
import useCategories from '../hooks/useCategories';
import SubscribeForm from '../components/SubscribeForm';
import WorkCTA from '../components/WorkCTA';
import LatestFeature from '../components/LatestFeature';
import PostCard from '../components/PostCard';

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

  // 3 most recent posts (overall) — featured up top, and removed from the feed below.
  const latest3 = useMemo(
    () => [...posts].sort((a, b) =>
      new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at)
    ).slice(0, 3),
    [posts]
  );
  const latestIds = useMemo(() => new Set(latest3.map((p) => p.id)), [latest3]);

  const visible = useMemo(() => {
    const base = active === 'all' ? posts : posts.filter((p) => (p.category || 'tech') === active);
    return base.filter((p) => !latestIds.has(p.id));
  }, [posts, active, latestIds]);

  const animate = visible.length > 2;
  const duration = Math.max(20, visible.length * 6);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <style>{`
        @keyframes feedScrollX { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .feed-track-x { animation: feedScrollX var(--feed-dur, 40s) linear infinite; will-change: transform; width: max-content; }
        .feed-viewport:hover .feed-track-x { animation-play-state: paused; }
        .feed-mask-x {
          -webkit-mask-image: linear-gradient(to right, transparent, #000 5%, #000 95%, transparent);
          mask-image: linear-gradient(to right, transparent, #000 5%, #000 95%, transparent);
        }
        .feed-card { transition: transform .3s ease, box-shadow .3s ease; box-shadow: 0 4px 14px -8px rgba(0,0,0,0.4); }
        .feed-card:hover { transform: translateY(-5px) scale(1.012); box-shadow: 0 26px 52px -18px var(--accent); }
        @media (prefers-reduced-motion: reduce) { .feed-track-x { animation: none; } }
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

        {/* Featured: steady, full-width, slides through the 3 newest every 5s */}
        <LatestFeature posts={latest3} catMap={catMap} />

        {loading && <p className="font-mono text-sm text-muted">Loading…</p>}
        {error && <p className="font-mono text-sm text-glow">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="font-mono text-sm text-muted">Nothing here yet in this category.</p>
        )}

        {/* Horizontal auto-scroll feed */}
        {animate ? (
          <div className="feed-viewport feed-mask-x relative overflow-hidden">
            <div className="feed-track-x flex gap-4" style={{ '--feed-dur': `${duration}s` }}>
              {[...visible, ...visible].map((post, i) => (
                <div key={`${post.id}-${i}`} className="w-[340px] md:w-[440px] shrink-0">
                  <PostCard post={post} catMap={catMap} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3">
            {visible.map((post) => (
              <div key={post.id} className="w-[340px] md:w-[440px] shrink-0">
                <PostCard post={post} catMap={catMap} />
              </div>
            ))}
          </div>
        )}

        {animate && (
          <p className="mt-4 text-center font-mono text-[11px] text-muted tracking-widest uppercase">
            ← scrolling · hover to pause
          </p>
        )}

        <div className="text-center mt-8">
          <Link to="/archive" className="inline-block rounded-lg border border-border px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-muted hover:text-glow hover:border-glow/40 transition-colors">
            View all posts
          </Link>
        </div>

        <div className="mt-16">
          <SubscribeForm />
        </div>

        <div className="mt-10">
          <WorkCTA />
        </div>
      </main>
    </div>
  );
}

export default Home;