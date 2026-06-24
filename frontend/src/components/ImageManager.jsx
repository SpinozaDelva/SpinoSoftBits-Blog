// src/components/ImageManager.jsx - upload images; set as cover or insert into body at any size
import { useState } from 'react';
import { uploadImage } from '../api/uploads';

function ImageManager({ onInsert, onSetCover, coverUrl }) {
  const [images, setImages] = useState([]); // [{ url, width, height }]  height 0 = natural
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setErr('');
    try {
      const { url } = await uploadImage(file);
      setImages((l) => [...l, { url, width: 100, height: 0 }]);
    } catch (e2) {
      console.error(e2);
      setErr('Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const patch = (i, fields) => setImages((l) => l.map((im, idx) => (idx === i ? { ...im, ...fields } : im)));

  const tokenFor = (im) => (im.height ? `[img:${im.url}|${im.width}|${im.height}]` : `[img:${im.url}|${im.width}]`);

  const btn = 'flex-1 rounded border border-border px-2 py-1 font-mono text-[11px] text-muted hover:text-glow hover:border-glow/40 transition-colors';

  return (
    <div className="rounded-xl border border-border p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-muted uppercase tracking-widest">Images</span>
        <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-muted hover:text-glow hover:border-glow/40 transition-colors">
          {busy ? 'Uploading…' : '+ Upload'}
          <input type="file" accept="image/*" onChange={handleFile} disabled={busy} className="hidden" />
        </label>
      </div>

      {err && <p className="font-mono text-xs text-glow mb-2">{err}</p>}

      {images.length === 0 ? (
        <p className="font-mono text-xs text-muted">
          Upload images, then set one as the cover (cards &amp; social), or insert into the body at any size. Nothing is added automatically.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {images.map((im, i) => (
            <div key={im.url} className="rounded-lg border border-border overflow-hidden">
              <img src={im.url} alt="" className="w-full h-24 object-cover" />
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted w-10">width</span>
                  <input type="range" min="25" max="100" value={im.width}
                    onChange={(e) => patch(i, { width: Number(e.target.value) })}
                    className="flex-1 accent-glow" />
                  <span className="font-mono text-[11px] text-muted w-12 text-right">{im.width}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted w-10">height</span>
                  <input type="range" min="0" max="700" step="20" value={im.height}
                    onChange={(e) => patch(i, { height: Number(e.target.value) })}
                    className="flex-1 accent-glow" />
                  <span className="font-mono text-[11px] text-muted w-12 text-right">{im.height ? `${im.height}px` : 'auto'}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" className={btn} onClick={() => onInsert(tokenFor(im))}>Insert</button>
                  <button type="button"
                    className={`${btn} ${coverUrl === im.url ? 'text-glow border-glow/60' : ''}`}
                    onClick={() => onSetCover(im.url)}>
                    {coverUrl === im.url ? 'Cover ✓' : 'Cover'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageManager;