// src/pages/PostDetail.jsx - Full article view
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPost } from '../api/posts';

function PostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPost(slug);
        setPost(data);
      } catch (err) {
        setError('Post not found.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24">
        <p className="font-mono text-sm text-muted">Loading…</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24">
        <p className="font-mono text-sm text-glow mb-6">{error}</p>
        <Link to="/" className="font-mono text-sm text-muted hover:text-glow transition-colors">
          ← back to writing
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