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
  return (
    <Link to={`/post/${post.slug}`} className="block">
      <article
        className={`feed-card relative overflow-hidden rounded-2xl cursor-pointer ${large ? 'p-9 md:p-12' : 'p-6'}`}
        style={{
          '--accent': pc.accent,
          background: `linear-gradient(135deg, #ffffff 0%, ${hexToRgba(pc.accent, 0.42)} 100%)`,
        }}
      >
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
      </article>
    </Link>
  );
}

export default PostCard;