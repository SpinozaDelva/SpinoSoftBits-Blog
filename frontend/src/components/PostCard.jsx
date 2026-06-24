// src/components/PostCard.jsx - the bright gradient post card (shared by Home + Archive)
import { Link } from 'react-router-dom';

const SERIF = '"Fraunces", Georgia, serif';
const FALLBACK_ACCENT = '#5AA9E6';

const hexToRgba = (hex, a) => {
  const h = (hex || '#000000').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(0,0,0,${a})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export function paletteFor(post, catMap) {
  const slug = post.category || 'tech';
  if (catMap && catMap[slug]) return catMap[slug];
  return {
    label: post.category || 'Writing',
    accent: post.category_color || FALLBACK_ACCENT,
    serif: false,
  };
}

function PostCard({ post, catMap, large = false }) {
  const pc = paletteFor(post, catMap);
  // Soft vignette: image is fully visible in the middle and fades to nothing
  // before reaching any edge, so it melts into the card (no "stamped" look).
  const fade =
    'radial-gradient(125% 115% at 68% 42%, #000 0%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.32) 55%, rgba(0,0,0,0.08) 72%, transparent 84%)';
  return (
    <Link to={`/post/${post.slug}`} className="block">
      <article
        className={`feed-card relative overflow-hidden rounded-2xl cursor-pointer ${large ? 'p-9 md:p-12' : 'p-6'}`}
        style={{
          '--accent': pc.accent,
          background: `linear-gradient(135deg, #ffffff 0%, ${hexToRgba(pc.accent, 0.42)} 100%)`,
        }}
      >
        {post.cover_image && (
          large ? (
            <>
              {/* Featured: photo reads clearly on the right */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: `url(${post.cover_image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center right',
                  backgroundRepeat: 'no-repeat',
                  opacity: 0.85,
                }}
              />
              {/* Left-to-right light scrim keeps the title/text legible */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.82) 28%, rgba(255,255,255,0.45) 52%, rgba(255,255,255,0.12) 78%, rgba(255,255,255,0) 100%)',
                }}
              />
              {/* Faint accent tint just to tie it to the category */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: `linear-gradient(135deg, transparent 40%, ${hexToRgba(pc.accent, 0.18)} 100%)` }}
              />
            </>
          ) : (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `url(${post.cover_image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.2,
                WebkitMaskImage: fade,
                maskImage: fade,
              }}
            />
          )
        )}
        <div className="relative z-10">
        <div className="flex items-center gap-3 font-mono text-xs mb-3" style={{ color: 'rgba(0,0,0,0.5)' }}>
          <span className="uppercase tracking-widest font-semibold" style={{ color: pc.accent }}>{pc.label}</span>
          <span style={{ color: 'rgba(0,0,0,0.22)' }}>/</span>
          <span>{post.read_time} min</span>
          <span style={{ color: 'rgba(0,0,0,0.22)' }}>/</span>
          <span>{post.views} views</span>
          {post.is_featured && (
            <span className="ml-auto rounded-full px-2 py-0.5" style={{ border: '1px solid rgba(0,0,0,0.15)', color: 'rgba(0,0,0,0.6)' }}>
              featured
            </span>
          )}
        </div>
        <h3
          className={`font-display font-semibold leading-snug mb-2 ${large ? 'text-3xl md:text-5xl' : 'text-2xl'}`}
          style={pc.serif ? { color: '#1a1a1a', fontFamily: SERIF } : { color: '#1a1a1a' }}
        >
          {post.title}
        </h3>
        <p className={`leading-relaxed mb-4 ${large ? 'text-lg md:text-xl max-w-2xl' : ''}`} style={{ color: 'rgba(0,0,0,0.7)' }}>
          {post.excerpt}
        </p>
        <div className="font-mono text-xs" style={{ color: 'rgba(0,0,0,0.5)' }}>
          {post.author?.full_name || post.author?.username || 'Spinoza Delva'}
        </div>
        </div>
      </article>
    </Link>
  );
}

export default PostCard;