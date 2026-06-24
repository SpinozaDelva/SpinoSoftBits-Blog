// src/components/LatestFeature.jsx - steady full-width feature; auto-slides through top 3 every 5s
import { useState, useEffect, useRef } from 'react';
import PostCard from './PostCard';

const ROTATE_MS = 5000;        // advance every 5 seconds
const SLIDE_MS = 600;          // transition duration

function LatestFeature({ posts = [], catMap }) {
  const top = posts.slice(0, 3);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);       // 1 = next (slide left), -1 = prev (slide right)
  const [anim, setAnim] = useState(false); // briefly true to trigger the slide
  const pausedRef = useRef(false);

  const go = (next) => {
    setDir(next > idx || (idx === top.length - 1 && next === 0) ? 1 : -1);
    setAnim(true);
    // let the incoming card start off-screen, then settle in
    requestAnimationFrame(() => requestAnimationFrame(() => setAnim(false)));
    setIdx(next);
  };

  const advance = () => go((idx + 1) % top.length);

  useEffect(() => {
    if (top.length <= 1) return undefined;
    const t = setInterval(() => { if (!pausedRef.current) advance(); }, ROTATE_MS);
    return () => clearInterval(t);
  }, [idx, top.length]);

  useEffect(() => { if (idx >= top.length) setIdx(0); }, [top.length, idx]);

  if (top.length === 0) return null;
  const post = top[idx] || top[0];

  return (
    <div
      className="my-10"
      style={{ marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)', width: '100vw' }}
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <p className="font-mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--color-glow)' }}>
          {'// latest writing'}
        </p>

        {/* Viewport clips the sliding card */}
        <div className="overflow-hidden">
          <div
            key={post.id}
            style={{
              transform: anim ? `translateX(${dir * 60}px)` : 'translateX(0)',
              opacity: anim ? 0 : 1,
              transition: anim ? 'none' : `transform ${SLIDE_MS}ms cubic-bezier(.22,1,.36,1), opacity ${SLIDE_MS}ms ease`,
            }}
          >
            <PostCard post={post} catMap={catMap} large />
          </div>
        </div>

        {top.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {top.map((p, i) => (
              <button
                key={p.id}
                onClick={() => go(i)}
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