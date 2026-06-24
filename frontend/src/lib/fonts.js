// src/lib/fonts.js - curated post fonts (label + CSS font-family)
// Keep keys stable; they are stored on the post as `font_style`.
export const POST_FONTS = {
  default:    { label: 'Default (clean sans)', family: null },
  serif:      { label: 'Elegant serif',        family: '"Fraunces", Georgia, serif' },
  typewriter: { label: 'Typewriter',           family: '"JetBrains Mono", ui-monospace, monospace' },
  script:     { label: 'Handwritten (poems)',  family: '"Caveat", "Segoe Script", cursive' },
};

export const fontFamilyFor = (key) =>
  (POST_FONTS[key] && POST_FONTS[key].family) || null;