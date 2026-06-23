// src/pages/Admin.jsx - Write & publish posts
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, publishPost } from '../api/posts';

// Smallest selectable drop time = now, in the local format datetime-local wants.
const nowLocalInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function Admin() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [dropDate, setDropDate] = useState(''); // local datetime-local string, '' = live now
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSaveDraft = title.trim() && content.trim();
  const canPublish =
    title.trim() && excerpt.trim() && content.trim() && tags.trim();

  const handleSave = async (publish) => {
    setError(null);

    if (publish && !canPublish) {
      setError('Publishing requires title, excerpt, content, and at least one tag.');
      return;
    }
    if (!publish && !canSaveDraft) {
      setError('A draft needs at least a title and content.');
      return;
    }

    setSaving(true);
    try {
      const post = await createPost({
        title,
        excerpt,
        content,
        is_featured: isFeatured,
        // datetime-local is local & naive; convert to UTC ISO so the server
        // compares it correctly. Empty = no drop date = live immediately.
        drop_date: dropDate ? new Date(dropDate).toISOString() : null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });

      if (publish) {
        await publishPost(post.slug);
      }

      navigate('/');
    } catch (err) {
      setError('Could not save. Make sure you are logged in as admin.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-xs text-glow tracking-widest uppercase mb-6">
        // new entry
      </p>
      <h1 className="font-display text-3xl font-bold mb-10">Write a post</h1>

      <div className="space-y-6">
        <div>
          <label className="block font-mono text-xs text-muted mb-2">title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg text-xl font-display outline-none focus:border-glow/50 transition-colors"
            placeholder="A great title"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-muted mb-2">excerpt</label>
          <input
            type="text"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
            placeholder="One-line summary (this is the teaser readers see while a post is locked)"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-muted mb-2">content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg leading-relaxed outline-none focus:border-glow/50 transition-colors resize-y"
            placeholder="Write your post here…"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-muted mb-2">
            tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg font-mono text-sm outline-none focus:border-glow/50 transition-colors"
            placeholder="Python, React, WebDev"
          />
        </div>

        <div>
          <label className="block font-mono text-xs text-muted mb-2">
            schedule drop (optional)
          </label>
          <input
            type="datetime-local"
            value={dropDate}
            min={nowLocalInput()}
            onChange={(e) => setDropDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg font-mono text-sm outline-none focus:border-glow/50 transition-colors"
          />
          <p className="font-mono text-xs text-muted mt-2">
            {dropDate
              ? 'On Publish, this goes live now as a locked teaser (title + blurred excerpt) and unlocks fully at the time above.'
              : 'Leave empty to publish the full post immediately.'}
          </p>
          {dropDate && (
            <button
              type="button"
              onClick={() => setDropDate('')}
              className="mt-2 font-mono text-xs text-glow hover:opacity-80 transition-opacity"
            >
              clear schedule
            </button>
          )}
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-4 w-4 accent-glow"
          />
          <span className="font-mono text-sm text-muted">Feature this post</span>
        </label>

        {error && <p className="font-mono text-xs text-glow">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !canPublish}
            className="rounded-lg bg-glow px-6 py-3 font-display font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {saving ? 'Saving…' : dropDate ? 'Schedule & publish' : 'Publish'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !canSaveDraft}
            className="rounded-lg border border-border px-6 py-3 font-display font-medium text-fg transition-colors hover:border-glow/40 disabled:opacity-40"
          >
            Save as draft
          </button>
        </div>
      </div>
    </div>
  );
}

export default Admin;