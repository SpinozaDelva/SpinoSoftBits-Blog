// src/pages/Admin.jsx - Write, edit & publish posts (also handles /edit/:slug)
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, updatePost, publishPost, getAllPostsAdmin } from '../api/posts';

// Smallest selectable drop time = now, in the local format datetime-local wants.
const nowLocalInput = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

// UTC ISO -> local datetime-local string (for prefilling when editing).
const isoToLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

function Admin() {
  const navigate = useNavigate();
  const { slug } = useParams();       // present => edit mode
  const isEdit = Boolean(slug);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('tech');
  const [dropDate, setDropDate] = useState(''); // local datetime-local string, '' = live now
  const [isPublished, setIsPublished] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEdit);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load the post when editing.
  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      try {
        const all = await getAllPostsAdmin();
        const post = (all || []).find((p) => p.slug === slug);
        if (!active) return;
        if (!post) {
          setError('Post not found.');
          return;
        }
        setTitle(post.title || '');
        setExcerpt(post.excerpt || '');
        setContent(post.content || '');
        setTags((post.tags || []).map((t) => t.name).join(', '));
        setIsFeatured(Boolean(post.is_featured));
        setCoverImage(post.cover_image || '');
        setCategory(post.category || 'tech');
        setDropDate(isoToLocalInput(post.drop_date));
        setIsPublished(Boolean(post.is_published));
      } catch (err) {
        if (active) setError('Could not load the post. Are you logged in as admin?');
        console.error(err);
      } finally {
        if (active) setLoadingPost(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isEdit, slug]);

  const canSaveDraft = title.trim() && content.trim();
  const canPublish =
    title.trim() && excerpt.trim() && content.trim() && tags.trim();

  const buildPayload = () => ({
    title,
    excerpt,
    content,
    is_featured: isFeatured,
    category,
    cover_image: coverImage.trim() || null,
    // datetime-local is local & naive; convert to UTC ISO. Empty = no drop.
    drop_date: dropDate ? new Date(dropDate).toISOString() : null,
    tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
  });

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
      if (isEdit) {
        const body = buildPayload();
        if (publish) body.is_published = true;
        await updatePost(slug, body);
      } else {
        const post = await createPost(buildPayload());
        if (publish) await publishPost(post.slug);
      }
      navigate('/manage');
    } catch (err) {
      setError('Could not save. Make sure you are logged in as admin.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24">
        <p className="font-mono text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <p className="font-mono text-xs text-glow tracking-widest uppercase mb-6">
        // {isEdit ? 'edit entry' : 'new entry'}
      </p>
      <h1 className="font-display text-3xl font-bold mb-10">
        {isEdit ? 'Edit post' : 'Write a post'}
      </h1>

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
          <label className="block font-mono text-xs text-muted mb-2">
            cover image URL (optional)
          </label>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg font-mono text-sm outline-none focus:border-glow/50 transition-colors"
            placeholder="https://…/image.jpg"
          />
          <p className="font-mono text-xs text-muted mt-2">
            Shown on the post and in social / email previews. Paste a hosted image URL.
          </p>
          {coverImage && (
            <img
              src={coverImage}
              alt=""
              className="mt-3 rounded-lg max-h-40 object-cover border border-border"
            />
          )}
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
          <label className="block font-mono text-xs text-muted mb-2">writing type</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'tech', label: 'Tech' },
              { value: 'poem', label: 'Poems' },
              { value: 'health', label: 'Health & Lifestyle' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`rounded-lg border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                  category === opt.value
                    ? 'border-glow/60 bg-glow/10 text-glow'
                    : 'border-border text-muted hover:border-glow/30'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="font-mono text-xs text-muted mt-2">
            Sets the mood of the post page — each type gets its own look.
          </p>
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
              ? 'Goes live as a locked teaser (title + blurred excerpt) and unlocks fully at the time above.'
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

        <div className="flex flex-wrap gap-3 pt-2">
          {isEdit ? (
            <>
              <button
                onClick={() => handleSave(false)}
                disabled={saving || !canSaveDraft}
                className="rounded-lg bg-glow px-6 py-3 font-display font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              {!isPublished && (
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving || !canPublish}
                  className="rounded-lg border border-border px-6 py-3 font-display font-medium text-fg transition-colors hover:border-glow/40 disabled:opacity-40"
                >
                  Save & publish
                </button>
              )}
            </>
          ) : (
            <>
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
            </>
          )}
          <button
            type="button"
            onClick={() => navigate('/manage')}
            className="rounded-lg px-6 py-3 font-mono text-sm text-muted hover:text-glow transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default Admin;