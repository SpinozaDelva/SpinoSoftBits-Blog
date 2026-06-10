// src/pages/Home.jsx - Blog home page
import { useState, useEffect } from 'react';
import { getPosts } from '../api/posts';

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getPosts();
        setPosts(data);
      } catch (err) {
        setError('Could not load posts. Is the backend running?');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border">
        {/* Amber glow accent */}
        <div
          className="absolute -top-40 left-1/4 h-96 w-96 rounded-full opacity-20 blur-[120px]"
          style={{ backgroundColor: 'var(--color-glow)' }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-24">
          <p className="font-mono text-xs text-glow tracking-widest uppercase mb-6">
            // engineering log
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight max-w-3xl">
            Building software for the businesses that build Brooklyn.
          </h1>
          <p className="mt-6 text-lg text-muted max-w-xl leading-relaxed">
            Field notes on shipping real products — Python, React, and the
            messy decisions in between.
          </p>
        </div>
      </header>

      {/* Posts */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-mono text-xs text-muted tracking-widest uppercase">
            Latest writing
          </h2>
          <span className="font-mono text-xs text-muted">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </span>
        </div>

        {loading && (
          <p className="font-mono text-sm text-muted">Loading…</p>
        )}

        {error && (
          <p className="font-mono text-sm text-glow">{error}</p>
        )}

        {!loading && !error && posts.length === 0 && (
          <p className="font-mono text-sm text-muted">
            No posts yet. The first one's coming.
          </p>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
           <article
              key={post.id}
              className="group relative overflow-hidden rounded-xl p-6 cursor-pointer bg-white bg-gradient-to-br from-transparent to-brand/40 transition-all duration-200 hover:to-brand/60 hover:shadow-lg hover:shadow-brand/20"
            >
              <div className="flex items-center gap-3 font-mono text-xs text-ink/50 mb-3">
                <span>{post.read_time} min</span>
                <span className="text-ink/20">/</span>
                <span>{post.views} views</span>
                {post.is_featured && (
                  <span className="ml-auto rounded-full border border-ink/20 px-2 py-0.5 text-ink/70">
                    featured
                  </span>
                )}
              </div>
              <h3 className="font-display text-2xl font-semibold leading-snug mb-2 text-ink">
                {post.title}
              </h3>
              <p className="text-ink/70 leading-relaxed mb-4">
                {post.excerpt}
              </p>
              <div className="font-mono text-xs text-ink/50">
                {post.author.full_name || post.author.username}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Home;