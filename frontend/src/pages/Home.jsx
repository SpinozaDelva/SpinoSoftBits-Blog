// src/pages/Home.jsx - Blog home page
import { useState, useEffect } from 'react';
import { getPosts } from '../api/posts';

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch posts when the page loads
    const fetchPosts = async () => {
      try {
        const data = await getPosts();
        setPosts(data);
      } catch (err) {
        setError('Failed to load posts');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">SpinozaSoftBits Blog</h1>
          <p className="text-indigo-100 text-lg">
            Web development, tutorials, and business insights
          </p>
        </div>
      </header>

      {/* Posts */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <p className="text-gray-500 text-center">No posts yet. Check back soon!</p>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span>{post.read_time} min read</span>
                  <span>•</span>
                  <span>{post.views} views</span>
                  {post.is_featured && (
                    <>
                      <span>•</span>
                      <span className="text-indigo-600 font-medium">Featured</span>
                    </>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>By {post.author.full_name || post.author.username}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;