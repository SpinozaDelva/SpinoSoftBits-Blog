// src/pages/Newsletter.jsx - Admin: subscribers + send posts / custom emails
import { useState, useEffect, useRef } from 'react';
import { getSubscribers, broadcast, sendPost } from '../api/newsletter';
import { getPosts } from '../api/posts';

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

function Newsletter() {
  const [subs, setSubs] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState('all');          // 'all' | 'selected'
  const [selected, setSelected] = useState(() => new Set());
  const [tab, setTab] = useState('post');           // 'post' | 'compose'
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  // Send-a-post state
  const [postSlug, setPostSlug] = useState('');
  const [includeCover, setIncludeCover] = useState(false);

  // Compose state
  const [subject, setSubject] = useState('');
  const [heading, setHeading] = useState('');
  const [template, setTemplate] = useState('update');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const editorRef = useRef(null);

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      try {
        const [s, p] = await Promise.all([getSubscribers(), getPosts()]);
        if (!on) return;
        setSubs(Array.isArray(s) ? s : []);
        setPosts(Array.isArray(p) ? p : []);
        if (Array.isArray(p) && p.length) setPostSlug(p[0].slug);
      } catch (err) {
        if (on) setError('Could not load. Are you logged in as admin?');
        console.error(err);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, []);

  const active = subs.filter((s) => s.is_active);
  const allActiveEmails = active.map((s) => s.email);

  const toggle = (email) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });

  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === active.length ? new Set() : new Set(allActiveEmails)
    );

  // Recipients payload: null => everyone; array => chosen
  const recipients = () => (mode === 'all' ? null : Array.from(selected));
  const recipientCount = mode === 'all' ? active.length : selected.size;

  const exec = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const addLink = () => {
    const url = window.prompt('Link URL (https://…)');
    if (url) exec('createLink', url);
  };

  const confirmSend = () => {
    if (recipientCount === 0) {
      setError('No recipients selected.');
      return false;
    }
    return window.confirm(`Send to ${recipientCount} ${recipientCount === 1 ? 'person' : 'people'}?`);
  };

  const doSendPost = async () => {
    setError(null);
    setResult(null);
    if (!postSlug) { setError('Pick a post.'); return; }
    if (!confirmSend()) return;
    setSending(true);
    try {
      const res = await sendPost({ slug: postSlug, emails: recipients(), include_cover: includeCover });
      setResult(`Sent to ${res.sent} ${res.sent === 1 ? 'person' : 'people'}.`);
    } catch (err) {
      setError('Send failed.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const doBroadcast = async () => {
    setError(null);
    setResult(null);
    const bodyHtml = editorRef.current?.innerHTML?.trim() || '';
    if (!subject.trim()) { setError('Add a subject.'); return; }
    if (!bodyHtml || bodyHtml === '<br>') { setError('Write some body content.'); return; }
    if (!confirmSend()) return;
    setSending(true);
    try {
      const res = await broadcast({
        subject: subject.trim(),
        heading: heading.trim() || null,
        body_html: bodyHtml,
        cta_text: ctaText.trim() || null,
        cta_url: ctaUrl.trim() || null,
        template,
        emails: recipients(),
      });
      setResult(`Sent to ${res.sent} ${res.sent === 1 ? 'person' : 'people'}.`);
    } catch (err) {
      setError('Send failed.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const toolBtn = 'rounded border border-border px-2.5 py-1 font-mono text-xs text-fg hover:border-glow/40 transition-colors';

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <p className="font-mono text-xs text-glow tracking-widest uppercase mb-2">// newsletter</p>
      <h1 className="font-display text-3xl font-bold mb-2">Newsletter</h1>
      <p className="font-mono text-sm text-muted mb-10">
        {active.length} active subscriber{active.length === 1 ? '' : 's'}
      </p>

      {error && <p className="font-mono text-sm text-red-300 mb-4">{error}</p>}
      {result && <p className="font-mono text-sm text-emerald-300 mb-4">{result}</p>}

      {loading ? (
        <p className="font-mono text-sm text-muted">Loading…</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* Subscribers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-mono text-xs text-muted tracking-widest uppercase">Subscribers</h2>
              <label className="flex items-center gap-2 font-mono text-[11px] text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={active.length > 0 && selected.size === active.length}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 accent-glow"
                />
                select all
              </label>
            </div>
            <div className="rounded-xl border border-border divide-y divide-border max-h-[520px] overflow-auto">
              {active.length === 0 && (
                <p className="font-mono text-xs text-muted p-4">No active subscribers yet.</p>
              )}
              {active.map((s) => (
                <label key={s.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-ink-raised/50">
                  <input
                    type="checkbox"
                    checked={selected.has(s.email)}
                    onChange={() => toggle(s.email)}
                    className="h-4 w-4 accent-glow shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-fg truncate">{s.email}</span>
                    <span className="block font-mono text-[11px] text-muted">
                      {s.name ? `${s.name} · ` : ''}{fmt(s.subscribed_at)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sender */}
          <div>
            {/* Recipient mode */}
            <div className="flex items-center gap-2 mb-6 font-mono text-xs">
              <span className="text-muted uppercase tracking-widest mr-1">Send to:</span>
              {[
                { v: 'all', label: `All active (${active.length})` },
                { v: 'selected', label: `Selected (${selected.size})` },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setMode(o.v)}
                  className={`rounded-full border px-3 py-1 transition-colors ${
                    mode === o.v ? 'border-glow bg-glow/10 text-glow' : 'border-border text-muted hover:text-fg'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {[
                { v: 'post', label: 'Send a post' },
                { v: 'compose', label: 'Compose' },
              ].map((t) => (
                <button
                  key={t.v}
                  onClick={() => { setTab(t.v); setResult(null); setError(null); }}
                  className={`rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                    tab === t.v ? 'bg-ink-raised text-fg border border-border' : 'text-muted hover:text-fg'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'post' ? (
              <div className="space-y-4">
                <label className="block font-mono text-xs text-muted">choose a published post</label>
                <select
                  value={postSlug}
                  onChange={(e) => setPostSlug(e.target.value)}
                  className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50"
                >
                  {posts.length === 0 && <option value="">No published posts</option>}
                  {posts.map((p) => (
                    <option key={p.id} value={p.slug}>{p.title}</option>
                  ))}
                </select>
                <p className="font-mono text-xs text-muted">
                  Sends the standard “new post” email with a preview and a link to read it.
                </p>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeCover}
                    onChange={(e) => setIncludeCover(e.target.checked)}
                    className="accent-glow h-4 w-4"
                  />
                  <span className="font-mono text-xs text-muted">Include the cover image at the top of the email (off by default)</span>
                </label>
                <button
                  onClick={doSendPost}
                  disabled={sending || recipientCount === 0}
                  className="rounded-lg bg-glow px-6 py-3 font-display font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {sending ? 'Sending…' : `Send post to ${recipientCount}`}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-muted mb-2">subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50"
                    placeholder="What's new at SpinoSoftBits"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-xs text-muted mb-2">heading (optional)</label>
                    <input
                      type="text"
                      value={heading}
                      onChange={(e) => setHeading(e.target.value)}
                      className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-muted mb-2">template</label>
                    <select
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50"
                    >
                      <option value="update">Update</option>
                      <option value="announcement">Announcement</option>
                      <option value="plain">Plain</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs text-muted mb-2">body</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <button type="button" className={toolBtn} onClick={() => exec('bold')}><b>B</b></button>
                    <button type="button" className={toolBtn} onClick={() => exec('italic')}><i>i</i></button>
                    <button type="button" className={toolBtn} onClick={() => exec('insertUnorderedList')}>• list</button>
                    <button type="button" className={toolBtn} onClick={() => exec('formatBlock', 'H3')}>H</button>
                    <button type="button" className={toolBtn} onClick={addLink}>link</button>
                    <button type="button" className={toolBtn} onClick={() => exec('removeFormat')}>clear</button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    className="min-h-[180px] rounded-lg border border-border bg-white text-black px-4 py-3 outline-none focus:border-glow/50 leading-relaxed [&_a]:text-blue-600 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6"
                  />
                  <p className="font-mono text-[11px] text-muted mt-2">
                    This is what subscribers will read. Use the buttons above to format.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-mono text-xs text-muted mb-2">button text (optional)</label>
                    <input
                      type="text"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg outline-none focus:border-glow/50"
                      placeholder="Read more"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs text-muted mb-2">button link (optional)</label>
                    <input
                      type="url"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      className="w-full rounded-lg border border-border bg-ink-raised px-4 py-3 text-fg font-mono text-sm outline-none focus:border-glow/50"
                      placeholder="https://spinosoftbits.com"
                    />
                  </div>
                </div>

                <button
                  onClick={doBroadcast}
                  disabled={sending || recipientCount === 0}
                  className="rounded-lg bg-glow px-6 py-3 font-display font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {sending ? 'Sending…' : `Send email to ${recipientCount}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Newsletter;