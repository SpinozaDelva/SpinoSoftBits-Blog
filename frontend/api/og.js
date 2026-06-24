// api/og.js — injects per-post Open Graph + JSON-LD author tags for crawlers,
// then serves the SPA. Lives at frontend/api/og.js. Every /post/:slug request is
// rewritten here (see vercel.json); real visitors still get the full React app,
// and link scrapers (Slack, X, LinkedIn, iMessage, Facebook) + Google get correct
// preview tags and author attribution.

const API_BASE =
  // eslint-disable-next-line no-undef
  process.env.BLOG_API_URL ||
  'https://spinosoftbits-blog-production.up.railway.app/api';

// Fallback preview image for posts without a cover (1200x630 in frontend/public).
const DEFAULT_IMAGE = '/og-default.jpg';

// Author identity used for byline + structured data.
const AUTHOR = {
  name: 'Spinoza Delva',
  url: 'https://spinosoftbits.com',
  sameAs: [
    'https://github.com/SpinozaDelva',
    'https://linkedin.com/in/spinozadelva',
  ],
};
const SITE_NAME = 'SpinoSoftBits';

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Safe to embed inside <script type="application/ld+json"> — neutralises any
// "</script>" or "<" coming from post content.
const jsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

export default async function handler(req, res) {
  const slug = (req.query && req.query.slug) || '';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const base = `https://${host}`;

  // Defaults, overwritten when we can load the post.
  let meta = {
    title: 'SpinoSoftBits — Blog',
    description: 'Tech, poems, and health & lifestyle from SpinoSoftBits.',
    image: DEFAULT_IMAGE,
    url: `${base}/post/${slug}`,
    published: null,
    modified: null,
  };

  try {
    const r = await fetch(`${API_BASE}/posts/${encodeURIComponent(slug)}`);
    if (r.ok) {
      const p = await r.json();
      meta = {
        title: p.title || meta.title,
        description: (p.excerpt || meta.description).slice(0, 200),
        image: p.share_cover !== false && p.cover_image ? p.cover_image : DEFAULT_IMAGE,
        url: `${base}/post/${slug}`,
        published: p.published_at || p.created_at || null,
        modified: p.published_at || p.created_at || null,
      };
    }
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    /* fall back to defaults */
  }

  // OG requires an absolute image URL.
  const img = meta.image.startsWith('http') ? meta.image : `${base}${meta.image}`;

  // Structured data: an Article authored by a named Person, published by the site.
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: meta.title,
    description: meta.description,
    image: [img],
    author: {
      '@type': 'Person',
      name: AUTHOR.name,
      url: AUTHOR.url,
      sameAs: AUTHOR.sameAs,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: AUTHOR.url,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': meta.url },
    ...(meta.published ? { datePublished: meta.published } : {}),
    ...(meta.modified ? { dateModified: meta.modified } : {}),
  };

  const tags = `
    <title>${esc(meta.title)} — ${SITE_NAME}</title>
    <meta name="description" content="${esc(meta.description)}" />
    <meta name="author" content="${esc(AUTHOR.name)}" />
    <link rel="canonical" href="${esc(meta.url)}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${esc(meta.title)}" />
    <meta property="og:description" content="${esc(meta.description)}" />
    <meta property="og:image" content="${esc(img)}" />
    <meta property="og:url" content="${esc(meta.url)}" />
    <meta property="article:author" content="${esc(AUTHOR.name)}" />
    ${meta.published ? `<meta property="article:published_time" content="${esc(meta.published)}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(meta.title)}" />
    <meta name="twitter:description" content="${esc(meta.description)}" />
    <meta name="twitter:image" content="${esc(img)}" />
    <meta name="twitter:label1" content="Written by" />
    <meta name="twitter:data1" content="${esc(AUTHOR.name)}" />
    <script type="application/ld+json">${jsonLd(ld)}</script>
  `;

  // Pull the built SPA shell so the React app still boots for real visitors.
  // If that fails for any reason, fall back to a minimal valid document that
  // still carries all tags (crawlers/Google), and bounces humans to the app.
  let html;
  try {
    const shell = await fetch(`${base}/index.html`);
    if (!shell.ok) throw new Error(`shell ${shell.status}`);
    html = await shell.text();
    html = html.replace('</head>', `${tags}\n</head>`);
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />${tags}<meta http-equiv="refresh" content="0; url=${esc(meta.url)}" /></head><body></body></html>`;
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(200).send(html);
}