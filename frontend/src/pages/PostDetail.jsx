// src/pages/PostDetail.jsx - Full article view (per-category theming + scheduled-drop lock)
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPost } from '../api/posts';

const REDIRECT_SECONDS = 4;
const SERIF = '"Fraunces", Georgia, "Times New Roman", serif';

// Each writing type gets its own mood on the reading page.
const THEMES = {
  tech: {
    label: 'Tech',
    accent: 'var(--color-glow)',
    wrap: 'max-w-3xl',
    align: 'text-left',
    centerMeta: false,
    titleClass: 'font-display text-4xl md:text-5xl font-bold tracking-tight',
    titleStyle: {},
    bodyClass: 'text-lg leading-relaxed',
    bodyStyle: {},
  },
  poem: {
    label: 'Poems',
    accent: '#c08a5e',
    wrap: 'max-w-xl',
    align: 'text-center',
    centerMeta: true,
    titleClass: 'text-4xl md:text-5xl font-semibold italic',
    titleStyle: { fontFamily: SERIF },
    bodyClass: 'text-xl leading-loose',
    bodyStyle: { fontFamily: SERIF },
  },
  health: {
    label: 'Health & Lifestyle',
    accent: '#3CA88E',
    wrap: 'max-w-2xl',
    align: 'text-left',
    centerMeta: false,
    titleClass: 'font-display text-4xl md:text-5xl font-semibold tracking-tight',
    titleStyle: {},
    bodyClass: 'text-lg leading-loose',
    bodyStyle: {},
  },
};

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

const SHARE_ICONS = {
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z',
  facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
};

const ShareIcon = ({ d }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d={d} />
  </svg>
);

function ShareBar({ url, title }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  const open = (href) =>
    window.open(href, '_blank', 'noopener,noreferrer,width=600,height=600');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.error(e);
    }
  };

  const native = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* user cancelled — ignore */
      }
    } else {
      copy();
    }
  };

  const btn =
    'flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted hover:text-glow hover:border-glow/40 transition-colors';

  return (
    <div className="mt-12 pt-8 border-t border-border">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-xs uppercase tracking-widest text-muted mr-1">
          Share
        </span>
        <button
          className={btn}
          aria-label="Share on X"
          onClick={() => open(`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`)}
        >
          <ShareIcon d={SHARE_ICONS.x} />
        </button>
        <button
          className={btn}
          aria-label="Share on LinkedIn"
          onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`)}
        >
          <ShareIcon d={SHARE_ICONS.linkedin} />
        </button>
        <button
          className={btn}
          aria-label="Share on Facebook"
          onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`)}
        >
          <ShareIcon d={SHARE_ICONS.facebook} />
        </button>
        <button className={btn} aria-label="Copy link" onClick={copy}>
          <ShareIcon d={SHARE_ICONS.link} />
        </button>
        <button
          onClick={native}
          className="ml-1 flex h-10 items-center rounded-full border border-border px-4 font-mono text-xs text-muted hover:text-glow hover:border-glow/40 transition-colors"
        >
          {copied ? 'Copied!' : 'Share…'}
        </button>
      </div>
    </div>
  );
}

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
  const theme = THEMES[post.category] || THEMES.tech;

  return (
    <article className={`${theme.wrap} mx-auto px-6 py-16`}>
      {/* Back link */}
      <Link
        to="/"
        className="inline-block font-mono text-xs text-muted hover:text-glow transition-colors mb-12"
      >
        ← back to writing
      </Link>

      {/* Category + metadata */}
      <div
        className={`flex items-center gap-3 font-mono text-xs text-muted mb-4 ${
          theme.centerMeta ? 'justify-center' : ''
        }`}
      >
        <span className="uppercase tracking-widest" style={{ color: theme.accent }}>
          {theme.label}
        </span>
        <span className="text-border">/</span>
        <span>{post.read_time} min read</span>
        {!isLocked && (
          <>
            <span className="text-border">/</span>
            <span>{post.views} views</span>
          </>
        )}
        {isLocked && (
          <span className="rounded-full border border-glow/30 px-2 py-0.5 text-glow">
            🔒 scheduled
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className={`${theme.titleClass} ${theme.align} leading-tight mb-6`} style={theme.titleStyle}>
        {post.title}
      </h1>

      {/* Author */}
      <div
        className={`flex items-center gap-3 pb-8 mb-8 border-b border-border ${
          theme.centerMeta ? 'justify-center' : ''
        }`}
      >
        <div className="h-9 w-9 rounded-full bg-glow/20 flex items-center justify-center font-display font-semibold text-glow">
          {(post.author.full_name || post.author.username).charAt(0).toUpperCase()}
        </div>
        <div className={theme.centerMeta ? 'text-center' : ''}>
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
          <div aria-hidden="true" className="blur-sm select-none pointer-events-none space-y-4">
            <p className="text-lg text-fg/80 leading-relaxed">{post.excerpt}</p>
            <p className="text-lg text-fg/60 leading-relaxed">{post.excerpt}</p>
            <div className="space-y-3 pt-2">
              <div className="h-4 rounded bg-fg/10 w-11/12" />
              <div className="h-4 rounded bg-fg/10 w-full" />
              <div className="h-4 rounded bg-fg/10 w-4/5" />
              <div className="h-4 rounded bg-fg/10 w-10/12" />
            </div>
          </div>
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
        /* Live post: themed content + share */
        <>
          <div
            className={`${theme.bodyClass} ${theme.align} text-fg/90 whitespace-pre-wrap`}
            style={theme.bodyStyle}
          >
            {post.content}
          </div>
          <ShareBar
            url={typeof window !== 'undefined'
              ? window.location.href
              : `https://blog.spinosoftbits.com/post/${slug}`}
            title={post.title}
          />
        </>
      )}
    </article>
  );
}

export default PostDetail;