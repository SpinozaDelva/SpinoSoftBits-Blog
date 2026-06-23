// src/pages/Home.jsx - Blog home with category tabs + per-category theming
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../api/posts';
import SubscribeForm from '../components/SubscribeForm';

const SERIF = '"Fraunces", Georgia, serif';

// Per-category identity — used by the tabs, the hero, and the cards.
const CATEGORIES = {
  all:    { label: 'All',                accent: '#E8B339', serif: false },
  tech:   { label: 'Tech',               accent: '#5AA9E6', serif: false },
  poem:   { label: 'Poems',              accent: '#C9925E', serif: true  },
  health: { label: 'Health & Lifestyle', accent: '#3CA88E', serif: false },
};
const TABS = ['all', 'tech', 'poem', 'health'];

// Hero copy + mood per selected tab. (Edit these strings freely.)
const HERO = {
  all: {
    eyebrow: '// the blog',
    heading: 'Field notes, verses, and everything in between.',
    sub: 'Tech, poems, and health & lifestyle — building real things and writing about it.',
  },
  tech: {
    eyebrow: '// engineering log',
    heading: 'Building software for the businesses that build Brooklyn.',
    sub: 'Python, React, and the messy decisions in between.',
  },
  poem: {
    eyebrow: '// verses',
    heading: 'Lines worth slowing down for.',
    sub: 'Small poems on code, the city, and being human.',
  },
  health: {
    eyebrow: '// field notes',
    heading: 'Build a life that holds up.',
    sub: 'Notes on energy, focus, and living well while you build.',
  },
};

const hexToRgba = (hex, a) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState('all');

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
    return () => {
      on = false;
    };
  }, []);

  const cat = CATEGORIES[active];
  const hero = HERO[active];
  const accent = cat.accent;

  const visible = useMemo(
    () => (active === 'all' ? posts : posts.filter((p) => (p.category || 'tech') === active)),
    [posts, active]
  );

  return (
    <div className="min-h-screen">
      {/* Hero — re-themes per category */}
      <header
        className="relative overflow-hidden border-b border-border transition-all duration-500"
        style={{
          background: `radial-gradient(120% 100% at 25% 0%, ${hexToRgba(accent, 0.10)}, transparent 60%)`,
        }}
      >
        <div
          className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-25 blur-[120px] transition-all duration-500"
          style={{ backgroundColor: accent }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-24">
          <p
            className="font-mono text-xs tracking-widest uppercase mb-6 transition-colors duration-500"
            style={{ color: accent }}
          >
            {hero.eyebrow}
          </p>
          <h1
            className="font-display text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight max-w-3xl"
            style={cat.serif ? { fontFamily: SERIF, fontStyle: 'italic' } : undefined}
          >
            {hero.heading}
          </h1>
          <p
            className="mt-6 text-lg text-muted max-w-xl leading-relaxed"
            style={cat.serif ? { fontFamily: SERIF } : undefined}
          >
            {hero.sub}
          </p>
        </div>
      </header>

      {/* Posts */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="font-mono text-xs text-muted tracking-widest uppercase">Latest writing</h2>
            <div className="flex items-center gap-1.5 flex-wrap">
              {TABS.map((key) => {
                const c = CATEGORIES[key];
                const on = active === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActive(key)}
                    className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                      on ? '' : 'border-border text-muted hover:text-fg hover:border-glow/40'
                    }`}
                    style={on ? { background: c.accent, borderColor: c.accent, color: '#0b0b0f' } : undefined}
                  >
                    {c.label}
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

        <div className="space-y-4">
          {visible.map((post) => {
            const pc = CATEGORIES[post.category] || CATEGORIES.tech;
            return (
              <Link to={`/post/${post.slug}`} key={post.id} className="block group">
                <article
                  className="relative overflow-hidden rounded-xl p-6 pl-7 cursor-pointer transition-all duration-200 hover:shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, #ffffff 0%, ${hexToRgba(pc.accent, 0.22)} 100%)`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-full w-1.5"
                    style={{ background: pc.accent }}
                  />
                  <div className="flex items-center gap-3 font-mono text-xs mb-3" style={{ color: 'rgba(0,0,0,0.5)' }}>
                    <span className="uppercase tracking-widest font-semibold" style={{ color: pc.accent }}>
                      {pc.label}
                    </span>
                    <span style={{ color: 'rgba(0,0,0,0.22)' }}>/</span>
                    <span>{post.read_time} min</span>
                    <span style={{ color: 'rgba(0,0,0,0.22)' }}>/</span>
                    <span>{post.views} views</span>
                    {post.is_featured && (
                      <span
                        className="ml-auto rounded-full px-2 py-0.5"
                        style={{ border: '1px solid rgba(0,0,0,0.15)', color: 'rgba(0,0,0,0.6)' }}
                      >
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
                  <p className="leading-relaxed mb-4" style={{ color: 'rgba(0,0,0,0.7)' }}>
                    {post.excerpt}
                  </p>
                  <div className="font-mono text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
                    {post.author.full_name || post.author.username}
                  </div>
                </article>
              </Link>
            );
          })}
        </div>

        {/* Newsletter signup */}
        <div className="mt-16">
          <SubscribeForm />
        </div>
      </main>
    </div>
  );
}

export default Home;