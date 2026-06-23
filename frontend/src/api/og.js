
// api/og.js — injects per-post Open Graph tags for crawlers, then serves the SPA.
// Lives at frontend/api/og.js. Every /post/:slug request is rewritten here
// (see vercel.json); real visitors still get the full React app, and link
// scrapers (Slack, X, LinkedIn, iMessage, Facebook) get correct preview tags.


const API_BASE =
  // eslint-disable-next-line no-undef
  process.env.BLOG_API_URL ||
  'https://spinosoftbits-blog-production.up.railway.app/api';

// Fallback preview image for posts without a cover.
// Drop a 1200x630 image at frontend/public/og-default.png (or set an absolute URL).
const DEFAULT_IMAGE = '/og-default.jpg';

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export default async function handler(req, res) {
  const slug = (req.query && req.query.slug) || '';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = `https://${host}`;

  // Pull the built SPA shell so the React app still boots for real visitors.
  let html;
  try {
    const shell = await fetch(`${base}/index.html`);
    html = await shell.text();
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    res.status(502).send('Unable to load page shell.');
    return;
  }

  // Sensible defaults, overwritten when we can load the post.
  let meta = {
    title: 'SpinoSoftBits — Blog',
    description: 'Tech, poems, and health & lifestyle from SpinoSoftBits.',
    image: DEFAULT_IMAGE,
    url: `${base}/post/${slug}`,
  };

  try {
    const r = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`);
    if (r.ok) {
      const p = await r.json();
      meta = {
        title: p.title || meta.title,
        description: (p.excerpt || meta.description).slice(0, 200),
        image: p.cover_image || DEFAULT_IMAGE,
        url: `${base}/post/${slug}`,
      };
    }
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    /* fall back to defaults */
  }

  // OG requires an absolute image URL.
  const img = meta.image.startsWith('http') ? meta.image : `${base}${meta.image}`;

  const tags = `
    <title>${esc(meta.title)} — SpinoSoftBits</title>
    <meta name="description" content="${esc(meta.description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${esc(meta.title)}" />
    <meta property="og:description" content="${esc(meta.description)}" />
    <meta property="og:image" content="${esc(img)}" />
    <meta property="og:url" content="${esc(meta.url)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(meta.title)}" />
    <meta name="twitter:description" content="${esc(meta.description)}" />
    <meta name="twitter:image" content="${esc(img)}" />
  `;

  html = html.replace('</head>', `${tags}\n</head>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(200).send(html);
}