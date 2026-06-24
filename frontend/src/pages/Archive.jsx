// src/pages/Archive.jsx - All posts: live search, category dropdown, paging
import { useState, useEffect, useRef } from 'react';
import { searchPosts } from '../api/search';
import useCategories from '../hooks/useCategories';
import PostCard from '../components/PostCard';

function Archive() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { categories } = useCategories();

  // Debounce the typed query so we search as you type without hammering the API.
  const [debouncedQ, setDebouncedQ] = useState('');
  const timer = useRef(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { setDebouncedQ(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer.current);
  }, [q]);

  // Reset to page 1 whenever the category changes.
  useEffect(() => { setPage(1); }, [category]);

  useEffect(() => {
    let on = true;
    setLoading(true);
    setError(null);
    searchPosts({ q: debouncedQ, page, category })
      .then((d) => { if (on) setData(d); })
      .catch((e) => { console.error(e); if (on) setError('Could not load posts.'); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [debouncedQ, page, category]);

  const pages = data?.pages || 1;
  const items = data?.items || [];

  return (
    <div className="min-h-screen">
      <style>{`
        .feed-card { transition: transform .3s ease, box-shadow .3s ease; box-shadow: 0 4px 14px -8px rgba(0,0,0,0.4); }
        .feed-card:hover { transform: translateY(-5px) scale(1.012); box-shadow: 0 26px 52px -18px var(--accent); }
      `}</style>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <p className="font-mono text-xs text-glow tracking-widest uppercase mb-2">{'// archive'}</p>
        <h1 className="font-display text-3xl font-bold mb-8">All posts</h1>

        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles, excerpts, content..."
            className="flex-1 rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {loading && <p className="font-mono text-sm text-muted">Loading...</p>}
        {error && <p className="font-mono text-sm text-red-300">{error}</p>}

        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <p className="font-mono text-sm text-muted">
                {debouncedQ ? `No posts match "${debouncedQ}".` : 'No posts yet.'}
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {items.map((post) => <PostCard key={post.id} post={post} />)}
              </div>
            )}

            <div className="flex items-center justify-center gap-4 mt-12 font-mono text-xs">
              <button
                onClick={() => setPage((n) => Math.max(1, n - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border px-4 py-2 text-muted hover:text-glow hover:border-glow/40 transition-colors disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-muted">Page {page} of {pages}</span>
              <button
                onClick={() => setPage((n) => Math.min(pages, n + 1))}
                disabled={page >= pages}
                className="rounded-lg border border-border px-4 py-2 text-muted hover:text-glow hover:border-glow/40 transition-colors disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Archive;