// src/pages/PostDetail.jsx - Full article view (with scheduled-drop lock state)
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPost } from '../api/posts';

// Seconds to show the "not found" message before bouncing to the blog home.
const REDIRECT_SECONDS = 4;

// Pretty drop label, e.g. "June 30, 2026 at 9:00 AM".
const formatDrop = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

// Friendly "drops in …" countdown phrase.
const dropsIn = (iso) => {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'any moment now';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `in ${mins} min${mins === 1 ? '' : 's'}`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs} hour${hrs === 1 ? '' : 's'}`;
  const days = Math.round(hrs / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
};

function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirectIn, setRedirectIn] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    let active = true;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      setRedirectIn(REDIRECT_SECONDS);
      try {
        const data = await getPost(slug);
        if (active) setPost(data);
      } catch (err) {
        if (active) {
          setError('Post not found.');
          setPost(null);
        }
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPost();
    return () => {
      active = false;
    };
  }, [slug]);

  const notFound = !loading && (error || !post);

  // Count down, then send the visitor to the blog home when a post can't load.
  useEffect(() => {
    if (!notFound) return;
    if (redirectIn <= 0) {
      navigate('/', { replace: true });
      return;
    }
    const t = setTimeout(() => setRedirectIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [notFound, redirectIn, navigate]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24">
        <p className="font-mono text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24">
        <p className="font-mono text-sm text-glow mb-3">Post not found.</p>
        <p className="font-mono text-sm text-muted mb-8">
          Taking you back to the blog in {Math.max(redirectIn, 0)}s…
        </p>
        <Link
          to="/"
          className="font-mono text-sm text-muted hover:text-glow transition-colors"
        >
          ← back to the blog now
        </Link>
      </div>
    );
  }

  const isLocked = post.is_locked;

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      {/* Back link */}
      <Link
        to="/"
        className="inline-block font-mono text-xs text-muted hover:text-glow transition-colors mb-12"
      >
        ← back to writing
      </Link>

      {/* Metadata */}
      <div className="flex items-center gap-3 font-mono text-xs text-muted mb-4">
        <span>{post.read_time} min read</span>
        {!isLocked && (
          <>
            <span className="text-border">/</span>
            <span>{post.views} views</span>
          </>
        )}
        {isLocked ? (
          <span className="rounded-full border border-glow/30 px-2 py-0.5 text-glow">
            🔒 scheduled
          </span>
        ) : (
          post.is_featured && (
            <span className="rounded-full border border-glow/30 px-2 py-0.5 text-glow">
              featured
            </span>
          )
        )}
      </div>

      {/* Title — always sharp */}
      <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-6">
        {post.title}
      </h1>

      {/* Author */}
      <div className="flex items-center gap-3 pb-8 mb-8 border-b border-border">
        <div className="h-9 w-9 rounded-full bg-glow/20 flex items-center justify-center font-display font-semibold text-glow">
          {(post.author.full_name || post.author.username).charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-fg">
            {post.author.full_name || post.author.username}
          </p>
          <p className="font-mono text-xs text-muted">
            {new Date(post.published_at || post.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {isLocked ? (
        /* Locked teaser: blurred paragraph + drop card */
        <div className="relative">
          {/* Blurred teaser text (only the public excerpt ever reaches here) */}
          <div
            aria-hidden="true"
            className="blur-sm select-none pointer-events-none space-y-4"
          >
            <p className="text-lg text-fg/80 leading-relaxed">{post.excerpt}</p>
            <p className="text-lg text-fg/60 leading-relaxed">{post.excerpt}</p>
            <div className="space-y-3 pt-2">
              <div className="h-4 rounded bg-fg/10 w-11/12" />
              <div className="h-4 rounded bg-fg/10 w-full" />
              <div className="h-4 rounded bg-fg/10 w-4/5" />
              <div className="h-4 rounded bg-fg/10 w-10/12" />
            </div>
          </div>

          {/* Drop card overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border border-glow/30 bg-bg/80 backdrop-blur-md px-8 py-7 text-center shadow-xl max-w-sm">
              <div className="text-3xl mb-3">🔒</div>
              <p className="font-display text-xl font-semibold text-fg mb-1">
                This one's still under wraps
              </p>
              <p className="font-mono text-sm text-glow mb-3">
                Drops {formatDrop(post.drop_date)}
              </p>
              <p className="font-mono text-xs text-muted">
                {dropsIn(post.drop_date)} — check back for the full read.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Live post: full content */
        <div className="text-lg text-fg/90 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>
      )}
    </article>
  );
}

export default PostDetail;