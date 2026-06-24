import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { searchPosts } from '../api/search';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

function Archive() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [cats, setCats] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // categories for the dropdown
  useEffect(() => {
    let on = true;
    client.get('/categories')
      .then((r) => { if (on) setCats(Array.isArray(r.data) ? r.data : []); })
      .catch(() => {});
    return () => { on = false; };
  }, []);

  // debounce the search text -> live search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  // fetch results whenever query / category / page changes
  useEffect(() => {
    let on = true;
    setLoading(true);
    setError(null);
    searchPosts({ q: debouncedQ, category, page })
      .then((d) => { if (on) setData(d); })
      .catch((e) => { console.error(e); if (on) setError('Could not load posts.'); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [debouncedQ, category, page]);

  const pages = data?.pages || 1;
  const items = data?.items || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
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
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors sm:w-48"
        >
          <option value="all">All categories</option>
          {cats.map((c) => (
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
              {debouncedQ ? `No posts match "${debouncedQ}".` : 'No posts here yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <Link
                  key={p.id}
                  to={`/post/${p.slug}`}
                  className="block rounded-xl border border-border bg-ink-raised px-5 py-4 hover:border-glow/40 transition-colors"
                  style={{ borderLeft: `3px solid ${p.category_color}` }}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="font-display font-semibold text-fg">{p.title}</h3>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
                      <span style={{ color: p.category_color }}>{p.category}</span>
                      {p.read_time ? ` / ${p.read_time} min` : ''}
                      {' / '}{fmtDate(p.created_at)}
                      {p.is_premium ? ' / premium' : ''}
                    </span>
                  </div>
                  {p.excerpt && <p className="text-sm text-muted leading-relaxed mt-2 line-clamp-2">{p.excerpt}</p>}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-5 mt-10 font-mono text-xs">
            <button
              onClick={() => setPage((n) => Math.max(1, n - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-border px-3 py-2 text-muted hover:text-glow hover:border-glow/40 transition-colors disabled:opacity-30"
            >
              {'<'}
            </button>
            <span className="text-muted">Page {page} of {pages}</span>
            <button
              onClick={() => setPage((n) => Math.min(pages, n + 1))}
              disabled={page >= pages}
              className="rounded-lg border border-border px-3 py-2 text-muted hover:text-glow hover:border-glow/40 transition-colors disabled:opacity-30"
            >
              {'>'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Archive;