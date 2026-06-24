import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchPosts } from '../api/search';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

function Archive() {
  const [q, setQ] = useState('');
  const [submittedQ, setSubmittedQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let on = true;
    setLoading(true);
    setError(null);
    searchPosts({ q: submittedQ, page })
      .then((d) => { if (on) setData(d); })
      .catch((e) => { console.error(e); if (on) setError('Could not load posts.'); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [submittedQ, page]);

  const runSearch = () => { setPage(1); setSubmittedQ(q.trim()); };
  const onKeyDown = (e) => { if (e.key === 'Enter') runSearch(); };

  const pages = data?.pages || 1;
  const items = data?.items || [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <p className="font-mono text-xs text-glow tracking-widest uppercase mb-2">{'// archive'}</p>
      <h1 className="font-display text-3xl font-bold mb-8">All posts</h1>

      <div className="flex gap-3 mb-10">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search titles, excerpts, content..."
          className="flex-1 rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
        />
        <button
          onClick={runSearch}
          className="rounded-lg bg-glow px-6 py-3 font-display font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Search
        </button>
      </div>

      {loading && <p className="font-mono text-sm text-muted">Loading...</p>}
      {error && <p className="font-mono text-sm text-red-300">{error}</p>}

      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <p className="font-mono text-sm text-muted">
              {submittedQ ? `No posts match "${submittedQ}".` : 'No posts yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <Link
                  key={p.id}
                  to={`/post/${p.slug}`}
                  className="block rounded-xl border border-border bg-ink-raised px-5 py-4 hover:border-glow/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="font-display font-semibold text-fg">{p.title}</h3>
                    <span className="font-mono text-[11px] text-muted uppercase tracking-widest">
                      {p.category}{p.is_premium ? ' \u00b7 premium' : ''} \u00b7 {fmtDate(p.created_at)}
                    </span>
                  </div>
                  {p.excerpt && <p className="text-sm text-muted leading-relaxed mt-2 line-clamp-2">{p.excerpt}</p>}
                </Link>
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-10 font-mono text-xs">
              <button
                onClick={() => setPage((n) => Math.max(1, n - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-border px-4 py-2 text-muted hover:text-glow hover:border-glow/40 transition-colors disabled:opacity-30 disabled:hover:text-muted disabled:hover:border-border"
              >
                Prev
              </button>
              <span className="text-muted">Page {page} of {pages}</span>
              <button
                onClick={() => setPage((n) => Math.min(pages, n + 1))}
                disabled={page >= pages}
                className="rounded-lg border border-border px-4 py-2 text-muted hover:text-glow hover:border-glow/40 transition-colors disabled:opacity-30 disabled:hover:text-muted disabled:hover:border-border"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Archive;