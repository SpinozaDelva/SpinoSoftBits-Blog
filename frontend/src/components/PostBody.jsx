// src/components/PostBody.jsx - renders post text; image lines become centered, sized images
// Token forms:  [img:URL]            -> 100% width, natural height
//               [img:URL|60]         -> 60% width, natural height
//               [img:URL|60|320]     -> 60% width, 320px height
const TOKEN_RE = /^\[img:(.+?)(?:\|(\d{1,3}))?(?:\|(\d{2,4}))?\]$/i;
const BARE_RE = /^https?:\/\/\S+\.(png|jpe?g|gif|webp|avif)(\?\S*)?$/i;

function parseImg(line) {
  const t = line.trim();
  const m = t.match(TOKEN_RE);
  if (m) return { src: m[1], width: m[2] ? Number(m[2]) : 100, height: m[3] ? Number(m[3]) : null };
  if (BARE_RE.test(t)) return { src: t, width: 100, height: null };
  return null;
}

function PostBody({ content, className = '', style }) {
  const lines = (content || '').split('\n');
  const blocks = [];
  let buf = [];
  const flushText = () => {
    if (buf.length) { blocks.push({ type: 'text', value: buf.join('\n') }); buf = []; }
  };
  for (const line of lines) {
    const img = parseImg(line);
    if (img) { flushText(); blocks.push({ type: 'img', ...img }); }
    else buf.push(line);
  }
  flushText();

  return (
    <div>
      {blocks.map((b, i) =>
        b.type === 'img' ? (
          <img
            key={i}
            src={b.src}
            alt=""
            loading="lazy"
            className="block mx-auto my-8 rounded-2xl"
            style={{
              width: `${b.width}%`,
              maxWidth: '100%',
              height: b.height ? `${b.height}px` : 'auto',
              objectFit: b.height ? 'cover' : undefined,
              boxShadow: '0 24px 70px -28px rgba(0,0,0,0.6)',
            }}
          />
        ) : (
          b.value.trim() && (
            <div key={i} className={`${className} whitespace-pre-wrap`} style={style}>
              {b.value}
            </div>
          )
        )
      )}
    </div>
  );
}

export default PostBody;