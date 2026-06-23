// src/pages/ManageCategories.jsx - Admin: add / edit / delete writing categories
import { useState, useEffect } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/categories';

const SERIF = '"Fraunces", Georgia, serif';

// Curated two-color combos (one-click presets).
const PRESETS = [
  { name: 'Terracotta & Cream', primary: '#C96F4A', secondary: '#F5EBDC' },
  { name: 'Cacao & Caramel', primary: '#C68E5A', secondary: '#4B3621' },
  { name: 'Mustard & Forest', primary: '#C9A227', secondary: '#2F4A35' },
  { name: 'Peach & Baby Pink', primary: '#F7A072', secondary: '#F4C2C2' },
  { name: 'Baby Blue & Baby Pink', primary: '#A7C7E7', secondary: '#F4C2C2' },
  { name: 'Cherry Red & Off-White', primary: '#C21807', secondary: '#FAF3E0' },
  { name: 'Dark Gray & Bright Yellow', primary: '#FFD300', secondary: '#333333' },
  { name: 'Turquoise & Violet', primary: '#30D5C8', secondary: '#7F00FF' },
  { name: 'Mint Green & White', primary: '#3EB489', secondary: '#FFFFFF' },
  { name: 'Blue & Pastel Pink', primary: '#4A90D9', secondary: '#F7D6DD' },
  { name: 'Sky Blue & Bubblegum Pink', primary: '#87CEEB', secondary: '#FF6FAF' },
];

const EMPTY = {
  slug: null, // null = creating new
  name: '',
  color_primary: '#E8B339',
  color_secondary: '#FFFFFF',
  serif: false,
  position: 0,
};

const hexToRgba = (hex, a) => {
  const h = (hex || '#000000').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(0,0,0,${a})`;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCategories();
        if (on) setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (on) setError('Could not load categories. Are you logged in as admin?');
        console.error(err);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [refreshKey]);

  const reload = () => setRefreshKey((k) => k + 1);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const isEditing = form.slug !== null;

  const startNew = () => setForm({ ...EMPTY, position: categories.length + 1 });
  const startEdit = (c) =>
    setForm({
      slug: c.slug,
      name: c.name,
      color_primary: c.color_primary,
      color_secondary: c.color_secondary,
      serif: c.serif,
      position: c.position,
    });

  const applyPreset = (p) => set({ color_primary: p.primary, color_secondary: p.secondary });

  const save = async () => {
    if (!form.name.trim()) {
      setError('Give the category a name.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      color_primary: form.color_primary,
      color_secondary: form.color_secondary,
      serif: form.serif,
      position: Number(form.position) || 0,
    };
    try {
      if (isEditing) await updateCategory(form.slug, payload);
      else await createCategory(payload);
      setForm(EMPTY);
      reload();
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Could not save the category.';
      setError(msg);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (slug, name) => {
    if (!window.confirm(`Delete "${name}"? Posts using it fall back to a default look.`)) return;
    setBusy(slug);
    try {
      await deleteCategory(slug);
      if (form.slug === slug) setForm(EMPTY);
      reload();
    } catch (err) {
      setError('Delete failed.');
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  const swatch = (c) => (
    <span className="inline-flex overflow-hidden rounded-md border border-border">
      <span className="h-6 w-6" style={{ background: c.color_primary }} />
      <span className="h-6 w-6" style={{ background: c.color_secondary }} />
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <p className="font-mono text-xs text-glow tracking-widest uppercase mb-2">// categories</p>
      <h1 className="font-display text-3xl font-bold mb-10">Manage categories</h1>

      {/* Editor */}
      <div className="rounded-2xl border border-border bg-ink-raised p-6 md:p-8 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-semibold">
            {isEditing ? `Edit "${form.name || form.slug}"` : 'New category'}
          </h2>
          {isEditing && (
            <button
              onClick={startNew}
              className="font-mono text-xs text-muted hover:text-glow transition-colors"
            >
              + new instead
            </button>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: fields */}
          <div className="space-y-5">
            <div>
              <label className="block font-mono text-xs text-muted mb-2">name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="e.g. Travel Notes"
                className="w-full rounded-lg border border-border bg-ink px-4 py-3 text-fg outline-none focus:border-glow/50 transition-colors"
              />
              {isEditing && (
                <p className="font-mono text-[11px] text-muted mt-1">slug: {form.slug} (fixed)</p>
              )}
            </div>

            <div>
              <label className="block font-mono text-xs text-muted mb-2">color combo presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    title={p.name}
                    onClick={() => applyPreset(p)}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5 hover:border-glow/40 transition-colors"
                  >
                    <span className="h-4 w-4 rounded-sm" style={{ background: p.primary }} />
                    <span className="h-4 w-4 rounded-sm" style={{ background: p.secondary }} />
                  </button>
                ))}
              </div>
              <p className="font-mono text-[11px] text-muted mt-2">
                Tap a combo to fill both colors, then fine-tune below.
              </p>
            </div>

            <div className="flex gap-6">
              <div>
                <label className="block font-mono text-xs text-muted mb-2">primary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color_primary}
                    onChange={(e) => set({ color_primary: e.target.value })}
                    className="h-10 w-12 rounded border border-border bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-muted">{form.color_primary}</span>
                </div>
              </div>
              <div>
                <label className="block font-mono text-xs text-muted mb-2">secondary</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color_secondary}
                    onChange={(e) => set({ color_secondary: e.target.value })}
                    className="h-10 w-12 rounded border border-border bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-muted">{form.color_secondary}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.serif}
                  onChange={(e) => set({ serif: e.target.checked })}
                  className="h-4 w-4 accent-glow"
                />
                <span className="font-mono text-sm text-muted">Serif font (like Poems)</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="font-mono text-xs text-muted">order</label>
                <input
                  type="number"
                  value={form.position}
                  onChange={(e) => set({ position: e.target.value })}
                  className="w-16 rounded-lg border border-border bg-ink px-2 py-1.5 text-fg font-mono text-sm outline-none focus:border-glow/50"
                />
              </div>
            </div>
          </div>

          {/* Right: live preview */}
          <div>
            <label className="block font-mono text-xs text-muted mb-2">preview</label>
            <div
              className="rounded-xl border border-border p-5 mb-4"
              style={{ background: `radial-gradient(120% 100% at 25% 0%, ${hexToRgba(form.color_primary, 0.18)}, transparent 60%)` }}
            >
              <p className="font-mono text-[11px] uppercase tracking-widest mb-2" style={{ color: form.color_primary }}>
                // {form.name || 'category'}
              </p>
              <p
                className="text-2xl font-bold text-fg"
                style={form.serif ? { fontFamily: SERIF, fontStyle: 'italic' } : undefined}
              >
                A sample headline
              </p>
            </div>

            <div
              className="relative overflow-hidden rounded-xl p-5 pl-6"
              style={{ background: `linear-gradient(135deg, #ffffff 0%, ${hexToRgba(form.color_primary, 0.22)} 100%)` }}
            >
              <span className="absolute left-0 top-0 h-full w-1.5" style={{ background: form.color_primary }} />
              <span className="font-mono text-[11px] uppercase tracking-widest font-semibold" style={{ color: form.color_primary }}>
                {form.name || 'Category'}
              </span>
              <h3
                className="text-lg font-semibold mt-1"
                style={form.serif ? { color: '#1a1a1a', fontFamily: SERIF } : { color: '#1a1a1a' }}
              >
                A sample post card
              </h3>
              <p className="text-sm mt-1" style={{ color: 'rgba(0,0,0,0.65)' }}>
                This is how a post in this category will look.
              </p>
            </div>
          </div>
        </div>

        {error && <p className="font-mono text-xs text-red-300 mt-5">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            onClick={save}
            disabled={saving || !form.name.trim()}
            className="rounded-lg bg-glow px-6 py-3 font-display font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add category'}
          </button>
          {isEditing && (
            <button
              onClick={startNew}
              className="rounded-lg px-6 py-3 font-mono text-sm text-muted hover:text-glow transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Existing categories */}
      <h2 className="font-mono text-xs text-muted tracking-widest uppercase mb-4">
        Your categories
      </h2>
      {loading && <p className="font-mono text-sm text-muted">Loading…</p>}
      {!loading && categories.length === 0 && (
        <p className="font-mono text-sm text-muted">No categories yet — add one above.</p>
      )}
      <div className="space-y-3">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-4 rounded-xl border border-border bg-ink-raised px-5 py-4"
          >
            {swatch(c)}
            <div className="min-w-0 flex-1">
              <h3
                className="font-display text-lg font-semibold text-fg truncate"
                style={c.serif ? { fontFamily: SERIF } : undefined}
              >
                {c.name}
              </h3>
              <p className="font-mono text-[11px] text-muted">
                {c.slug} · #{c.position}
                {c.serif ? ' · serif' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => startEdit(c)}
                className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-fg hover:border-glow/40 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => remove(c.slug, c.name)}
                disabled={busy === c.slug}
                className="rounded-lg border border-red-500/30 px-3 py-1.5 font-mono text-xs text-red-300 hover:border-red-500/60 disabled:opacity-40 transition-colors"
              >
                {busy === c.slug ? '…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageCategories;