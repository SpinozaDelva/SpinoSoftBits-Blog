// src/pages/PostDetail.jsx - Full article view
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPost } from '../api/posts';

// Seconds to show the "not found" message before bouncing to the blog home.
const REDIRECT_SECONDS = 4;

function PostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirectIn, setRedirectIn] = useState(REDIRECT_SECONDS);

  // Fetch the post by slug. A 404 (or any failure) drops us into the
  // "not found" state below.
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

  // When a post can't be loaded, count down and send the visitor to the blog home.
  const notFound = !loading && (error || !post);

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
        <span className="text-border">/</span>
        <span>{post.views} views</span>
        {post.is_featured && (
          <span className="rounded-full border border-glow/30 px-2 py-0.5 text-glow">
            featured
          </span>
        )}
      </div>

      {/* Title */}
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

      {/* Content */}
      <div className="text-lg text-fg/90 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>
    </article>
  );
}

export default PostDetail;