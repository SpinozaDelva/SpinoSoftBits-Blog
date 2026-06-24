// src/components/LatestFeature.jsx - steady, full-width featured card; rotates top 3 every 5 min
import { useState, useEffect } from 'react';
import PostCard from './PostCard';

const ROTATE_MS = 5 * 60 * 1000; // 5 minutes

function LatestFeature({ posts = [], catMap }) {
  const top = posts.slice(0, 3);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (top.length <= 1) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % top.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [top.length]);

  useEffect(() => { if (idx >= top.length) setIdx(0); }, [top.length, idx]);

  if (top.length === 0) return null;
  const post = top[idx] || top[0];

  return (
    <div className="my-10" style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)', width: '100vw' }}>
      <style>{`
        @keyframes latestDrop {
          0%   { opacity: 0; transform: translateY(-34px) scale(0.985); filter: blur(2px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        .latest-drop { animation: latestDrop .7s cubic-bezier(.22, 1, .36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .latest-drop { animation: none; } }
      `}</style>

      <div className="max-w-6xl mx-auto px-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--color-glow)' }}>
          {'// latest writing'}
        </p>

        {/* key={idx} remounts on each swap so the drop animation replays */}
        <div key={idx} className="latest-drop">
          <PostCard post={post} catMap={catMap} large />
        </div>

        {top.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {top.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setIdx(i)}
                aria-label={`Show latest post ${i + 1}`}
                className="h-2 rounded-full transition-all"
                style={{
                  width: i === idx ? 22 : 8,
                  background: i === idx ? 'var(--color-glow)' : 'var(--color-border)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LatestFeature;