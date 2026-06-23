// src/pages/ManagePosts.jsx - Admin: view drafts, edit, delete, publish
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllPostsAdmin, deletePost, publishPost } from '../api/posts';

const statusOf = (post) => {
  if (!post.is_published) return { label: 'Draft', cls: 'border-amber-400/40 text-amber-300' };
  if (post.drop_date && new Date(post.drop_date) > new Date())
    return { label: 'Scheduled', cls: 'border-glow/40 text-glow' };
  return { label: 'Published', cls: 'border-emerald-400/40 text-emerald-300' };
};

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

function ManagePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null); // slug currently being acted on

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllPostsAdmin();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Could not load posts. Make sure you are logged in as admin.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (slug, title) => {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setBusy(slug);
    try {
      await deletePost(slug);
      await load();
    } catch (err) {
      setError('Delete failed.');
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  const handlePublish = async (slug) => {
    setBusy(slug);
    try {
      await publishPost(slug);
      await load();
    } catch (err) {
      setError('Publish failed.');
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs text-glow tracking-widest uppercase mb-2">// manage</p>
          <h1 className="font-display text-3xl font-bold">Your posts</h1>
        </div>
        <Link
          to="/admin"
          className="rounded-lg bg-glow px-5 py-2.5 font-display font-semibold text-ink hover:opacity-90 transition-opacity"
        >
          + New post
        </Link>
      </div>

      {loading && <p className="font-mono text-sm text-muted">Loading…</p>}
      {error && <p className="font-mono text-sm text-glow mb-6">{error}</p>}
      {!loading && !error && posts.length === 0 && (
        <p className="font-mono text-sm text-muted">No posts yet. Write your first one.</p>
      )}

      <div className="space-y-3">
        {posts.map((post) => {
          const s = statusOf(post);
          const acting = busy === post.slug;
          return (
            <div
              key={post.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-ink-raised px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${s.cls}`}
                  >
                    {s.label}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {post.is_published ? fmt(post.published_at || post.created_at) : fmt(post.created_at)}
                    {s.label === 'Scheduled' && ` · drops ${fmt(post.drop_date)}`}
                  </span>
                </div>
                <h3 className="truncate font-display text-lg font-semibold text-fg">{post.title}</h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!post.is_published && (
                  <button
                    onClick={() => handlePublish(post.slug)}
                    disabled={acting}
                    className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-fg hover:border-glow/40 disabled:opacity-40 transition-colors"
                  >
                    Publish
                  </button>
                )}
                <Link
                  to={`/edit/${post.slug}`}
                  className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-fg hover:border-glow/40 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(post.slug, post.title)}
                  disabled={acting}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 font-mono text-xs text-red-300 hover:border-red-500/60 disabled:opacity-40 transition-colors"
                >
                  {acting ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ManagePosts;