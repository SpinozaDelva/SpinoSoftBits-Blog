// src/components/PostBody.jsx - renders post text, turning image-URL lines into centered images
const IMG_RE = /^https?:\/\/\S+\.(png|jpe?g|gif|webp|avif)(\?\S*)?$/i;

function PostBody({ content, className = '', style }) {
  const lines = (content || '').split('\n');

  // Group into blocks: runs of text, and standalone image lines.
  const blocks = [];
  let buf = [];
  const flushText = () => {
    if (buf.length) { blocks.push({ type: 'text', value: buf.join('\n') }); buf = []; }
  };
  for (const line of lines) {
    if (IMG_RE.test(line.trim())) { flushText(); blocks.push({ type: 'img', value: line.trim() }); }
    else buf.push(line);
  }
  flushText();

  return (
    <div>
      {blocks.map((b, i) =>
        b.type === 'img' ? (
          <img
            key={i}
            src={b.value}
            alt=""
            loading="lazy"
            className="block mx-auto my-10 max-w-full h-auto rounded-2xl"
            style={{ boxShadow: '0 24px 70px -28px rgba(0,0,0,0.65)' }}
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