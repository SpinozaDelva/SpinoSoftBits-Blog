// src/components/LatestFeature.jsx - steady full-width feature; auto-slides through top 5 every 5s
import { useState, useEffect, useRef } from 'react';
import PostCard from './PostCard';

const ROTATE_MS = 5000;        // advance every 5 seconds
const SLIDE_MS = 600;          // transition duration

function LatestFeature({ posts = [], catMap }) {
  const top = posts.slice(0, 5);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);       // 1 = next (slide left), -1 = prev (slide right)
  const [anim, setAnim] = useState(false); // briefly true to trigger the slide
  const pausedRef = useRef(false);

  const go = (next, direction) => {
    const len = top.length;
    const target = ((next % len) + len) % len;
    setDir(direction);
    setAnim(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnim(false)));
    setIdx(target);
  };

  const goNext = () => go(idx + 1, 1);
  const goPrev = () => go(idx - 1, -1);

  useEffect(() => {
    if (top.length <= 1) return undefined;
    const t = setInterval(() => { if (!pausedRef.current) goNext(); }, ROTATE_MS);
    return () => clearInterval(t);
  }, [idx, top.length]);

  useEffect(() => { if (idx >= top.length) setIdx(0); }, [top.length, idx]);

  if (top.length === 0) return null;
  const post = top[idx] || top[0];
  const many = top.length > 1;

  const arrowBtn =
    'pointer-events-auto absolute top-1/2 -translate-y-1/2 z-20 grid place-items-center ' +
    'h-12 w-12 rounded-full border border-border bg-ink/70 backdrop-blur text-fg ' +
    'opacity-0 group-hover:opacity-100 transition-all duration-300 hover:border-glow/60 hover:text-glow';

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

        {/* group: hovering anywhere over this reveals the arrows */}
        <div className="group relative">
          {/* viewport clips the sliding card */}
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

          {many && (
            <>
              <button onClick={goPrev} aria-label="Previous" className={`${arrowBtn} left-3 -translate-x-1`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <button onClick={goNext} aria-label="Next" className={`${arrowBtn} right-3 translate-x-1`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
              </button>
            </>
          )}
        </div>

        {many && (
          <div className="flex justify-center gap-2 mt-4">
            {top.map((p, i) => (
              <button
                key={p.id}
                onClick={() => go(i, i > idx ? 1 : -1)}
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