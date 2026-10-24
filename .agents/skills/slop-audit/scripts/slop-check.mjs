#!/usr/bin/env node
/**
 * slop-check.mjs (v3): deterministic source scan for AI-default design and
 * copy tells, plus accessibility and robustness gaps. No dependencies. Node 18+.
 *
 * Usage:
 *   node slop-check.mjs [path] [--json] [--strict] [--quiet]
 *
 *   --strict   exit 1 when the tier is High (use as a gate)
 *   --quiet    print only the summary lines
 *
 * Opt out of one rule in a file with a comment containing  slop-ok:<rule-id>
 * (only for a deliberate decision; say why next to it).
 * Skip a whole file with a comment containing  slop-check:ignore-file
 *
 * Pattern matching has false positives and misses. It cannot see the
 * rendered page. It is a floor, not a verdict: a page can pass and still be
 * generic. Pair it with render-check.mjs and a screenshot critique.
 */
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const root = path.resolve(argv.find((a) => !a.startsWith('--')) || '.');
const asJson = flags.has('--json');
const strict = flags.has('--strict');
const quiet = flags.has('--quiet');

const EXT = new Set(['.html', '.htm', '.css', '.scss', '.sass', '.less', '.js', '.jsx', '.ts', '.tsx', '.mjs', '.vue', '.svelte', '.astro', '.md', '.mdx']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.agents', '.claude', '.cursor', '.next', '.nuxt', '.svelte-kit', '.vercel', '.output', 'coverage', '.cache', 'out', 'vendor', '.slop-check']);
const MAX_BYTES = 1_500_000;

// ---------- helpers ----------
function walk(p, out = []) {
  let st; try { st = fs.statSync(p); } catch { return out; }
  if (st.isFile()) { if (EXT.has(path.extname(p).toLowerCase())) out.push(p); return out; }
  for (const name of fs.readdirSync(p)) { if (SKIP_DIRS.has(name)) continue; walk(path.join(p, name), out); }
  return out;
}
function lineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return (idx) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= idx) lo = mid; else hi = mid - 1; } return lo + 1; };
}
function allMatches(re, text) {
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  const out = []; let m;
  while ((m = r.exec(text)) !== null) { out.push(m); if (m[0].length === 0) r.lastIndex++; }
  return out;
}
const clean = (s) => s.trim().replace(/^['"`]|['"`]$/g, '').toLowerCase();
const firstFamily = (decl) => clean(decl.split(',')[0] || '');
const FONT_DECL = /font-family\s*:\s*([^;}{]+)|--[\w-]*font[\w-]*\s*:\s*([^;}{]+)|fontFamily\s*:\s*['"`]([^'"`]+)/i;

// colour helpers
function hexToHsl(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  let s = 0, hue = 0;
  if (max !== min) {
    const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0); else if (max === g) hue = (b - r) / d + 2; else hue = (r - g) / d + 4;
    hue *= 60;
  }
  return { h: hue, s: s * 100, l: l * 100 };
}
const HEX_RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
function hexesIn(text) { return allMatches(HEX_RE, text).map((m) => ({ index: m.index, hex: m[0].toLowerCase(), hsl: hexToHsl(m[0]) })).filter((x) => x.hsl); }
const isCream = ({ h, s, l }) => h >= 28 && h <= 58 && s >= 20 && s <= 75 && l >= 86 && l <= 97;
const isTerracotta = ({ h, s, l }) => h >= 6 && h <= 28 && s >= 40 && s <= 85 && l >= 42 && l <= 68;
const isNearBlack = ({ l }) => l <= 9;
const isNeon = ({ h, s, l }) => s >= 75 && l >= 42 && l <= 70 && ((h >= 65 && h <= 160) || h <= 14 || h >= 350);

// CSS rule blocks (good enough for plain CSS and <style> blocks)
function cssBlocks(text) { return allMatches(/([^{}@;]+)\{([^{}]*)\}/, text).map((m) => ({ index: m.index, selector: m[1].trim(), body: m[2] })); }

// visible text approximation: drop <style>/<script> blocks and tags (for HTML-ish files)
function visibleText(text, ext) {
  if (ext === '.md' || ext === '.mdx') return text.replace(/```[\s\S]*?```/g, '');
  if (!/[<>]/.test(text)) return '';
  return text.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ');
}

const OVERUSED = new Set(['inter', 'roboto', 'arial', 'helvetica', 'open sans', 'lato', 'system-ui', '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'montserrat', 'poppins']);
const SECOND_WAVE = new Set(['space grotesk', 'instrument serif', 'instrument sans', 'geist', 'geist sans', 'fraunces', 'syne', 'sora', 'playfair display', 'cormorant', 'cormorant garamond', 'dm sans', 'dm serif display', 'outfit', 'plus jakarta sans', 'ibm plex sans', 'ibm plex mono', 'space mono', 'newsreader', 'lora', 'cal sans', 'manrope', 'satoshi', 'general sans']);
const PURPLE_HEX = ['#6366f1', '#8b5cf6', '#a855f7', '#7c3aed', '#667eea', '#764ba2', '#4f46e5', '#9333ea', '#6d28d9', '#818cf8', '#a78bfa', '#c084fc', '#5b21b6', '#4338ca', '#7e22ce'];
const EMERALD_HEX = ['#10b981', '#059669', '#34d399', '#047857', '#14b8a6', '#0d9488', '#2dd4bf'];
const FILLER = [
  'revolutionize', 'revolutionise', 'supercharge', 'seamless', 'unlock the power', 'unlock your', 'elevate your', 'streamline your', 'cutting-edge', 'next-generation', 'next-gen',
  'all-in-one', 'game-chang', 'to the next level', 'simple, powerful', 'harness the power', 'empower', 'effortless', 'robust', 'leverage', 'delve', 'tapestry', 'testament to',
  "in today's", 'whether you\'re', 'unparalleled', 'world-class', 'best-in-class', 'state-of-the-art', 'transformative', 'nestled', 'bustling', 'vibrant community',
];
const STOCK_MOVES = [
  /\b(?:it'?s|is|isn'?t|aren'?t)\s+not\s+just\b/i, /\bnot\s+just\s+(?:a|an|another)\b/i, /\bmore\s+than\s+just\b/i, /\breimagined\b/i, /\bredefined\b/i,
  /\bwelcome\s+to\b/i, />\s*get\s+started\s*</i, />\s*learn\s+more\s*</i, /\bthe\s+future\s+of\b/i, /\bquietly\s+trusted\b/i, /\bfield\s+notes\b/i,
];

// ---------- rules ----------
// kind: tell (AI-default pattern) | copy (generated-prose pattern) | check (a11y / robustness) | note (look, then decide)
const rules = [
  // ===== Wave 1 tells
  { id: 'overused-font', kind: 'tell', name: 'Overused default font as a main face', why: 'Inter, Roboto, Arial, Poppins, Montserrat and bare system stacks are what models reach for by default.',
    find: (t) => {
      const out = [];
      for (const m of allMatches(FONT_DECL, t)) { const d = m[1] || m[2] || m[3] || ''; if (/^\s*var\(/.test(d)) continue; const f = firstFamily(d); if (OVERUSED.has(f)) out.push({ index: m.index, detail: f }); }
      for (const m of allMatches(/fonts\.googleapis\.com\/css2?\?[^"')\s]*family=(Inter|Roboto|Open\+Sans|Lato|Poppins|Montserrat)\b/i, t)) out.push({ index: m.index, detail: m[1] });
      for (const m of allMatches(/import\s*\{[^}]*\b(Inter|Roboto|Poppins)\b[^}]*\}\s*from\s*['"]next\/font\/google['"]/, t)) out.push({ index: m.index, detail: m[1] });
      return out;
    } },
  { id: 'ai-purple', kind: 'tell', name: 'Default indigo/violet palette', why: 'Purple-to-blue is the most common unchosen brand colour in generated pages.',
    find: (t) => { const lower = t.toLowerCase(); const out = []; for (const hex of PURPLE_HEX) { const i = lower.indexOf(hex); if (i >= 0) out.push({ index: i, detail: hex }); }
      for (const m of allMatches(/\b(?:from|to|via|bg|text|border|ring|shadow)-(?:indigo|violet|purple|fuchsia)-\d{2,3}\b/, t)) out.push({ index: m.index, detail: m[0] }); return out; } },
  { id: 'gradient-text', kind: 'tell', name: 'Gradient text', why: 'Decorative, hurts legibility, a stock move on headings and metrics.',
    find: (t) => allMatches(/background-clip\s*:\s*text|text-fill-color\s*:\s*transparent|\bbg-clip-text\b/i, t).map((m) => ({ index: m.index })) },
  { id: 'gradient-everything', kind: 'tell', name: 'Gradients in three or more places', why: 'Stacked gradient backgrounds, buttons and borders are a generated signature.',
    find: (t) => { const ms = allMatches(/(?:linear|radial|conic)-gradient\(|\bbg-gradient-to-/i, t); return ms.length >= 3 ? [{ index: ms[0].index, detail: `${ms.length} uses` }] : []; } },
  { id: 'glow-shadow', kind: 'tell', name: 'Zero-offset glowing shadow', why: 'Big blurred halos are decoration, not depth.',
    find: (t) => [...allMatches(/box-shadow\s*:[^;}]*\b0(?:px)?\s+0(?:px)?\s+(?:[2-9]\d|\d{3})px/i, t), ...allMatches(/\bshadow-(?:indigo|violet|purple|cyan|emerald|blue)-\d{3}\/\d+/, t)].map((m) => ({ index: m.index })) },
  { id: 'glassmorphism', kind: 'tell', name: 'Backdrop blur / glass panels', why: 'Blur plus a translucent panel is decorative unless it solves a real layering problem.',
    find: (t) => allMatches(/backdrop-filter\s*:\s*blur|\bbackdrop-blur(?:-[\w\[\]\.]+)?\b/i, t).map((m) => ({ index: m.index })) },
  { id: 'side-stripe', kind: 'tell', name: 'Thick coloured stripe on one card edge', why: 'Left/right accent stripes are a highly recognisable generated card style.',
    find: (t) => [...allMatches(/border-(?:left|right|inline-start|inline-end)\s*:\s*(?:[2-9]|\d{2,})px\s+solid/i, t), ...allMatches(/\bborder-[lrse]-(?:[2-9]|\d{2,})\b/, t)].map((m) => ({ index: m.index })) },
  { id: 'overshoot-easing', kind: 'tell', name: 'Bounce, elastic or overshoot easing', why: 'Springy overshoot reads as dated and decorative for interface motion.',
    find: (t) => { const out = []; for (const m of allMatches(/cubic-bezier\(\s*([^)]*)\)/i, t)) { const n = m[1].split(',').map(parseFloat); if (n.length === 4 && n.every((x) => !Number.isNaN(x)) && (n[1] < 0 || n[1] > 1 || n[3] < 0 || n[3] > 1)) out.push({ index: m.index }); }
      for (const m of allMatches(/\banimate-bounce\b|animation[^;{}]*\b(?:bounce|elastic)\b|@keyframes\s+(?:bounce|elastic)/i, t)) out.push({ index: m.index }); return out; } },
  { id: 'emoji-ui', kind: 'tell', name: 'Emoji as interface icons', why: 'Emoji in buttons, nav and headings read as placeholder iconography.',
    find: (t) => allMatches(/<(?:button|a|li|h[1-4]|summary|th|label|span)\b[^>]*>\s*(?:\p{Extended_Pictographic}️?)/u, t).map((m) => ({ index: m.index })) },
  { id: 'icon-card-row', kind: 'tell', name: 'Rows of identical icon-topped cards', why: 'Three or more feature cards each with an icon tile are the weakest-site signature (28% of weak vs 1% of top sites, Taste Skill study).',
    find: (t) => { const ms = allMatches(/class(?:Name)?=["'][^"']*\b(?:feature-card|feature|card)\b[^"']*["'][^>]*>\s*<(?:div|span|svg|i)\b[^>]*(?:icon|lucide|feather|heroicon)/i, t); return ms.length >= 3 ? [{ index: ms[0].index, detail: `${ms.length} cards` }] : []; } },

  // ===== Wave 2 tells
  { id: 'hero-badge', kind: 'tell', name: 'Pill badge or label directly above the H1', why: 'A badge or eyebrow immediately above the hero headline is a template move.',
    find: (t) => allMatches(/<(?:span|div|p|a)\b[^>]*class(?:Name)?=["'][^"']*(?:badge|pill|eyebrow|chip|kicker|tag|overline)[^"']*["'][^>]*>[\s\S]{0,120}?<\/(?:span|div|p|a)>\s*<h1\b/i, t).map((m) => ({ index: m.index })) },
  { id: 'eyebrow', kind: 'tell', name: 'Eyebrow / kicker labels', why: 'Small tracked uppercase labels above headings are among the commonest tells (57% of weak vs 16% of top sites, Taste Skill study).',
    find: (t) => {
      const out = allMatches(/class(?:Name)?=["'][^"']*\b(?:eyebrow|kicker|overline|pre-?title|section-label|supertitle)\b/i, t).map((m) => ({ index: m.index }));
      for (const b of cssBlocks(t)) {
        if (/text-transform\s*:\s*uppercase/i.test(b.body) && /letter-spacing\s*:\s*(?:0?\.(?:0[6-9]|[1-9])\d*|[1-9]\d*(?:\.\d+)?)(?:em|rem)|letter-spacing\s*:\s*(?:[2-9]|\d{2,})px/i.test(b.body)) out.push({ index: b.index, detail: b.selector.slice(0, 40) });
      }
      const tw = allMatches(/\buppercase\b[^"'`]*\btracking-(?:wide|wider|widest|\[)/, t); if (tw.length >= 2) out.push({ index: tw[0].index, detail: `${tw.length} tailwind labels` });
      return out;
    } },
  { id: 'accent-word', kind: 'tell', name: 'One word styled differently inside a headline', why: 'An italic, coloured or highlighted word in a headline is the instant-emphasis move of a page with no real hierarchy.',
    find: (t) => allMatches(/<h[1-2]\b[^>]*>[^<]{1,100}<(?:em|i|mark|span)\b[^>]*>[^<]{1,30}<\/(?:em|i|mark|span)>/i, t).map((m) => ({ index: m.index })) },
  { id: 'fake-window', kind: 'tell', name: 'Fake window chrome (traffic-light dots)', why: 'macOS dots around a mock panel are the stock product shot when there is no product shot.',
    find: (t) => { const ms = allMatches(/#ff5f5[67]|#febc2e|#ffbd2e|#28c840|#27c93f|traffic-?light/i, t); return ms.length >= 2 ? [{ index: ms[0].index }] : []; } },
  { id: 'status-dot', kind: 'tell', name: 'Decorative pulsing status dot', why: '"Available for work" or "live" dots with a ping animation are template decoration.',
    find: (t) => allMatches(/\banimate-ping\b|class(?:Name)?=["'][^"']*\b(?:status-dot|pulse-dot|live-dot)\b/i, t).map((m) => ({ index: m.index })) },
  { id: 'near-black-neon', kind: 'tell', name: 'Near-black ground with a neon accent', why: 'The dark "technical" cluster: near-black plus one acid-green, lime or vermilion signal.',
    find: (t) => { const hs = hexesIn(t); const nb = hs.find((x) => isNearBlack(x.hsl)); const ne = hs.find((x) => isNeon(x.hsl)); return nb && ne ? [{ index: Math.min(nb.index, ne.index), detail: `${nb.hex} + ${ne.hex}` }] : []; } },

  // ===== Wave 3 tells
  { id: 'cream-terracotta', kind: 'tell', name: 'Cream ground with a terracotta/clay accent', why: 'The "tasteful AI" look (near #F4F1EA with #D97757, Claude\'s own interface accent).',
    find: (t) => { const hs = hexesIn(t); const c = hs.find((x) => isCream(x.hsl)); const r = hs.find((x) => isTerracotta(x.hsl)); return c && r ? [{ index: Math.min(c.index, r.index), detail: `${c.hex} + ${r.hex}` }] : []; } },
  { id: 'middle-dot-meta', kind: 'tell', name: 'Meta strings joined with middle dots', why: '"A · B · C" strings are template chrome that appears whatever the subject.',
    find: (t, c) => { const v = c.visible; const ms = allMatches(/\S[  ]+(?:·|&middot;|&#183;)[  ]+\S[^\n·]{0,60}(?:·|&middot;)/, v); return ms.length ? [{ index: Math.max(0, t.search(/[ \u00a0](?:·|&middot;|&#183;)[ \u00a0]/)), detail: ms.length > 1 ? `${ms.length} strings` : '' }] : []; } },
  { id: 'word-dash-label', kind: 'tell', name: 'Labels shaped "WORD — fragment"', why: 'Capitalised word, spaced dash, fragment: a recognisable generated label pattern.',
    find: (t, c) => { const ms = allMatches(/\b[A-Z]{3,}[  ]+(?:—|–|&mdash;)[  ]+[A-Za-z]/, c.visible || t); return ms.length ? [{ index: Math.max(0, t.search(/\b[A-Z]{3,}[ \u00a0]+(?:—|–|&mdash;)/)), detail: ms.length > 1 ? `${ms.length} labels` : '' }] : []; } },
  { id: 'arrow-glued', kind: 'tell', name: 'Arrow glued to link and button text', why: 'A "→" on every link reads as template chrome. Keep it only where it means "go".',
    find: (t) => { const ms = allMatches(/(?:→|&rarr;|&#8594;|-&gt;)\s*<\/(?:a|button|Link)>|[A-Za-z]\s*(?:→|&rarr;)\s*["'`]?\s*<\/(?:a|button|Link)>/, t); return ms.length >= 2 ? [{ index: ms[0].index, detail: `x${ms.length}` }] : []; } },
  { id: 'index-numbers', kind: 'tell', name: 'Decorative 01 / 02 / 03 markers', why: 'Two-digit numbering on content that is not a sequence imitates rigour.',
    find: (t) => { const ms = allMatches(/>\s*(?:\()?0[1-9](?:\))?\s*(?:[.\/—–-]\s*)?</, t); return ms.length >= 3 ? [{ index: ms[0].index, detail: `${ms.length} markers` }] : []; } },
  { id: 'emerald-fallback', kind: 'tell', name: 'Emerald/teal accent as the purple escape', why: 'With purple ruled out, emerald is the next reflex. Fine only when the brief asks for green.',
    find: (t) => { const lower = t.toLowerCase(); const out = []; for (const hex of EMERALD_HEX) { const i = lower.indexOf(hex); if (i >= 0) out.push({ index: i, detail: hex }); }
      for (const m of allMatches(/\b(?:bg|text|border|ring|from|to)-(?:emerald|teal)-\d{3}\b/, t)) out.push({ index: m.index, detail: m[0] }); return out.length >= 2 ? out : []; } },

  // ===== Copy tells
  { id: 'filler-copy', kind: 'copy', name: 'Generic marketing filler words', why: 'Abstract hype words say nothing specific about this subject.',
    find: (t, c) => { const v = c.visible; if (!v) return []; const hits = FILLER.filter((p) => new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(v)); return hits.length ? [{ index: Math.max(0, t.toLowerCase().indexOf(hits[0])), detail: hits.slice(0, 5).join(', ') }] : []; } },
  { id: 'stock-moves', kind: 'copy', name: 'Stock copy moves', why: '"Not just X", "Welcome to", "reimagined", "Get started", "Learn more": the average of every landing page.',
    find: (t, c) => { const src = /[<>]/.test(t) ? t : c.visible; const hits = STOCK_MOVES.map((re) => re.exec(src)).filter(Boolean); return hits.length ? [{ index: hits[0].index, detail: hits.slice(0, 4).map((h) => h[0].replace(/[<>]/g, '').trim()).join(', ') }] : []; } },
  { id: 'tricolon-headline', kind: 'copy', name: 'Tricolon headline ("Fast. Simple. Secure.")', why: 'Three one-word beats is the stock headline shape.',
    find: (t) => allMatches(/<h[1-3]\b[^>]*>\s*\w+\.\s+\w+\.\s+\w+\.\s*</i, t).map((m) => ({ index: m.index })) },
  { id: 'em-dash-glue', kind: 'copy', name: 'Many em dashes in visible copy', why: 'Em dashes as all-purpose glue are a strong generated-prose signal.',
    find: (t, c) => { const n = (c.visible.match(/—|&mdash;/g) || []).length; return n >= 6 ? [{ index: Math.max(0, t.search(/—|&mdash;/)), detail: `${n} dashes` }] : []; } },
  { id: 'fake-proof', kind: 'copy', name: 'Possible invented social proof', why: 'Logos, quotes, names and numbers must be real and supplied by the human.',
    find: (t) => allMatches(/trusted by|loved by|\b\d{1,3}(?:,\d{3})*\+?\s*k?\+?\s+(?:happy\s+)?(?:customers|users|teams|companies|developers|creators)\b|\bJohn Doe\b|\bJane (?:Doe|Smith)\b|\bAcme\b|★{4,}|★★★★/i, t).map((m) => ({ index: m.index, detail: m[0].slice(0, 30) })) },

  // ===== Notes (context-dependent)
  { id: 'second-wave-font', kind: 'note', name: 'Second-wave "not Inter" font', why: 'Common escape fonts. Keep only with a reason no other face could satisfy.',
    find: (t) => { const out = []; for (const m of allMatches(FONT_DECL, t)) { const d = m[1] || m[2] || m[3] || ''; const f = firstFamily(d); if (SECOND_WAVE.has(f)) out.push({ index: m.index, detail: f }); }
      for (const m of allMatches(/family=(Space\+Grotesk|Instrument\+Serif|Instrument\+Sans|Geist|Fraunces|Syne|Sora|Playfair\+Display|Cormorant(?:\+Garamond)?|DM\+Sans|DM\+Serif\+Display|Outfit|Plus\+Jakarta\+Sans|IBM\+Plex\+(?:Sans|Mono)|Space\+Mono|Newsreader|Lora|Manrope)\b/i, t)) out.push({ index: m.index, detail: m[1].replace(/\+/g, ' ') });
      return out; } },
  { id: 'mono-labels', kind: 'note', name: 'Monospace outside code', why: 'Mono as a "technical" costume for labels. Fine for code, data and measurement.',
    find: (t) => { const out = []; for (const b of cssBlocks(t)) { if (/font-family\s*:[^;]*\b(?:mono|monospace|courier|consolas|menlo)\b/i.test(b.body) && !/\b(?:code|pre|kbd|samp|tt)\b/i.test(b.selector) && !/^:root|^html$/i.test(b.selector)) out.push({ index: b.index, detail: b.selector.slice(0, 40) }); } return out.length >= 2 ? out : []; } },
  { id: 'one-radius', kind: 'note', name: 'One medium radius on everything', why: 'A single 10 to 16 px radius everywhere is the SaaS-card-kit default. Decide square or fully round, once.',
    find: (t) => { const vals = allMatches(/border-radius\s*:\s*([^;}{]+)/i, t).map((m) => m[1].trim()); const tw = allMatches(/\brounded-(?:lg|xl|2xl)\b/, t).length; const mid = vals.filter((v) => /^(?:1[0-6]|[89])px$|^0?\.(?:[5-9]\d*)rem$|^1rem$/.test(v)).length; return (vals.length >= 6 && mid / vals.length >= 0.7) || tw >= 8 ? [{ index: 0, detail: tw >= 8 ? `${tw} rounded-lg/xl/2xl` : `${mid}/${vals.length} declarations` }] : []; } },
  { id: 'many-cards', kind: 'note', name: 'Many card elements', why: 'Six or more cards often means everything is boxed. Which ones are real, separable objects?',
    find: (t) => { const ms = allMatches(/class(?:Name)?=["'][^"']*\b(?:card|feature-card|tile)\b/i, t); return ms.length >= 6 ? [{ index: ms[0].index, detail: `${ms.length} cards` }] : []; } },
  { id: 'centred-everything', kind: 'note', name: 'Lots of centred text', why: 'Weak sites centre 52% of heroes (Taste Skill study). Left-anchor by default, centre one moment.',
    find: (t) => { const n = allMatches(/text-align\s*:\s*center|\btext-center\b/i, t).length; return n >= 6 ? [{ index: 0, detail: `${n} uses` }] : []; } },
  { id: 'reveal-everything', kind: 'note', name: 'Scroll reveal on many elements', why: 'Identical fade-up on every block is the generic motion default. One authored moment beats twenty.',
    find: (t) => { const ms = allMatches(/\b(?:fade-?up|fade-?in-?up|reveal|animate-on-scroll|data-aos|scroll-reveal|motion\.div)\b/i, t); return ms.length >= 5 ? [{ index: ms[0].index, detail: `${ms.length} uses` }] : []; } },
  { id: 'hairlines', kind: 'note', name: 'Many 1px hairline rules', why: 'Hairlines everywhere is broadsheet cosplay unless the content is editorial or tabular.',
    find: (t) => { const n = allMatches(/border(?:-(?:top|bottom|left|right))?\s*:\s*1px\s+solid|\bborder-[tbxy]?\b(?![-\w])|\bdivide-[xy]\b/i, t).length; return n >= 8 ? [{ index: 0, detail: `${n} rules` }] : []; } },
  { id: 'pure-black-white', kind: 'note', name: 'Pure black or white large surfaces', why: 'Tinted neutrals usually look more considered than #000 or #fff grounds.',
    find: (t) => allMatches(/background(?:-color)?\s*:\s*(?:#000(?:000)?|#fff(?:fff)?|black|white)\b/i, t).map((m) => ({ index: m.index })) },
  { id: 'untokenised-colour', kind: 'note', name: 'Many literal colours outside tokens', why: 'Colours scattered as literals drift. Declare roles once at :root and use var().',
    find: (t) => { const blocks = cssBlocks(t).filter((b) => !/^:root|\[data-theme|^html\b|@theme/i.test(b.selector)); const n = blocks.reduce((a, b) => a + (b.body.match(HEX_RE) || []).length, 0); return n >= 15 ? [{ index: 0, detail: `${n} literal colours` }] : []; } },
  { id: 'top-stripe', kind: 'note', name: 'Thick coloured top border', why: 'The sibling of the side stripe. Fine for real section dividers.',
    find: (t) => allMatches(/border-top\s*:\s*(?:[3-9]|\d{2,})px\s+solid/i, t).map((m) => ({ index: m.index })) },

  // ===== Checks (accessibility and robustness)
  { id: 'img-no-alt', kind: 'check', name: 'Image without alt', why: 'Informative images need alt text; decorative ones alt="".',
    find: (t) => allMatches(/<img\b(?![^>]*\balt\s*=)[^>]*>/i, t).map((m) => ({ index: m.index })) },
  { id: 'img-no-size', kind: 'check', name: 'Image without width/height', why: 'Missing dimensions cause layout shift.',
    find: (t) => allMatches(/<img\b(?![^>]*\b(?:width|height)\s*=)(?![^>]*\bfill\b)[^>]*>/i, t).map((m) => ({ index: m.index })) },
  { id: 'outline-removed', kind: 'check', name: 'Focus outline removed without a replacement', why: 'Keyboard users need a visible focus indicator.',
    find: (t) => { const off = allMatches(/outline\s*:\s*(?:none|0)\b|\boutline-none\b/i, t); if (!off.length) return []; if (/focus-visible|focus:ring|focus:outline|focus:border|:focus\b[^{]*\{[^}]*(?:box-shadow|border(?!-radius)|outline\s*:(?!\s*(?:none|0\b)))/i.test(t)) return []; return [{ index: off[0].index }]; } },
  { id: 'clickable-div', kind: 'check', name: 'Click handler on a div or span', why: 'Use a button or link so keyboard and assistive tech work.',
    find: (t) => allMatches(/<(?:div|span)\b[^>]*\b(?:onClick|onclick|@click|v-on:click)\b/i, t).map((m) => ({ index: m.index })) },
  { id: 'dead-link', kind: 'check', name: 'href="#" or empty link', why: 'Visible links must go somewhere or be removed.',
    find: (t) => allMatches(/href=["'](?:#|javascript:void\(0\);?)?["']/i, t).map((m) => ({ index: m.index })) },
  { id: 'placeholder-text', kind: 'check', name: 'Lorem ipsum or TODO copy', why: 'Placeholder text must not ship.',
    find: (t) => allMatches(/lorem ipsum|dolor sit amet|\bTODO:? ?(?:copy|text|content)\b|\[(?:your|insert) [^\]]{1,30}\]/i, t).map((m) => ({ index: m.index })) },
  { id: 'placeholder-image', kind: 'check', name: 'Placeholder image service', why: 'Remote placeholders break, load slowly and look unfinished.',
    find: (t) => allMatches(/via\.placeholder\.com|placehold\.(?:co|it)|picsum\.photos|placekitten|dummyimage\.com|source\.unsplash\.com|loremflickr/i, t).map((m) => ({ index: m.index })) },
  { id: 'tiny-text', kind: 'check', name: 'Font size under 12px', why: 'Very small text is hard to read on phones.',
    find: (t) => allMatches(/font-size\s*:\s*(?:[0-9]|1[01])(?:\.\d+)?px|\btext-\[(?:[0-9]|1[01])px\]/i, t).map((m) => ({ index: m.index })) },
  { id: 'transition-all', kind: 'check', name: 'transition: all, or animated layout properties', why: 'Animate transform and opacity only; list properties explicitly.',
    find: (t) => allMatches(/transition\s*:\s*all\b|\btransition-all\b|transition(?:-property)?\s*:[^;}]*\b(?:width|height|top|left|margin|padding)\b/i, t).map((m) => ({ index: m.index })) },
  { id: 'vw-overflow', kind: 'check', name: 'width: 100vw', why: '100vw includes the scrollbar and causes horizontal scroll. Use 100% with overflow-x: clip.',
    find: (t) => allMatches(/\bwidth\s*:\s*100vw|\bw-screen\b/i, t).map((m) => ({ index: m.index })) },
  { id: 'possible-secret', kind: 'check', name: 'Possible hard-coded secret', why: 'Keys and tokens must not appear in client code.',
    find: (t) => allMatches(/(?:api[_-]?key|secret|token|bearer)\s*[:=]\s*["'][A-Za-z0-9_\-\.]{20,}["']|\bsk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_\-]{30,}/i, t).map((m) => ({ index: m.index })) },
  { id: 'html-lang', kind: 'check', name: '<html> without lang', why: 'Set the page language for screen readers and translation.',
    find: (t) => { const m = /<html\b(?![^>]*\blang\s*=)[^>]*>/i.exec(t); return m ? [{ index: m.index }] : []; } },
  { id: 'viewport-meta', kind: 'check', name: 'Document missing viewport meta', why: 'Without it, mobile layouts do not respond.',
    find: (t) => { const m = /<html\b/i.exec(t); return m && !/name=["']viewport["']/i.test(t) ? [{ index: m.index }] : []; } },
  { id: 'page-title', kind: 'check', name: 'Document missing <title>', why: 'A clear page title is basic accessibility and navigation.',
    find: (t) => { const m = /<html\b/i.exec(t); return m && !/<title\b[^>]*>[^<]+<\/title>/i.test(t) ? [{ index: m.index }] : []; } },
  { id: 'multiple-h1', kind: 'check', name: 'More than one <h1> in a file', why: 'One H1 per page and a logical heading order.',
    find: (t) => { const ms = allMatches(/<h1\b/i, t); return ms.length > 1 ? [{ index: ms[1].index, detail: `${ms.length} h1` }] : []; } },
  { id: 'input-no-label', kind: 'check', name: 'Input without an accessible name', why: 'Every input needs a label or aria-label.',
    find: (t) => { if (/<label\b/i.test(t)) return []; return allMatches(/<(?:input|textarea|select)\b(?![^>]*\b(?:aria-label|aria-labelledby|type=["'](?:hidden|submit|button)["'])\b)[^>]*>/i, t).map((m) => ({ index: m.index })); } },
];

// ---------- scan ----------
if (!fs.existsSync(root)) { console.error(`Path not found: ${root}`); process.exit(2); }
const files = walk(root);
const findings = [];
const project = { motion: false, reduceMotion: false, html: false, selection: false, caretOrAccent: false };

for (const file of files) {
  let stat; try { stat = fs.statSync(file); } catch { continue; }
  if (stat.size > MAX_BYTES) continue;
  const text = fs.readFileSync(file, 'utf8');
  if (/slop-check:ignore-file/.test(text)) continue;
  const ext = path.extname(file).toLowerCase();
  if (/@keyframes|\banimation\s*:|\banimate-[a-z]|transition\s*:/.test(text)) project.motion = true;
  if (/prefers-reduced-motion|motion-reduce|motion-safe|useReducedMotion/.test(text)) project.reduceMotion = true;
  if (/<html\b|<body\b|<main\b|<section\b/i.test(text)) project.html = true;
  if (/::selection|selection:/.test(text)) project.selection = true;
  if (/caret-color|accent-color|\baccent-\w+-\d{3}\b|\bcaret-/.test(text)) project.caretOrAccent = true;
  const ctx = { visible: visibleText(text, ext), ext };
  const lineOf = lineIndex(text);
  const optOut = new Set(allMatches(/slop-ok:([\w-]+)/, text).map((m) => m[1]));
  const isMarkdown = ext === '.md' || ext === '.mdx';
  for (const rule of rules) {
    if (optOut.has(rule.id)) continue;
    if (isMarkdown && rule.kind !== 'copy') continue; // docs: copy-level checks only
    let hits = [];
    try { hits = rule.find(text, ctx) || []; } catch { hits = []; }
    if (!hits.length) continue;
    hits.sort((a, b) => a.index - b.index);
    findings.push({ rule: rule.id, kind: rule.kind, name: rule.name, why: rule.why, file: path.relative(process.cwd(), file) || file, line: lineOf(hits[0].index), count: hits.length, detail: hits.find((h) => h.detail)?.detail || '' });
  }
}

if (project.motion && !project.reduceMotion) findings.push({ rule: 'reduced-motion', kind: 'check', name: 'Motion present but no prefers-reduced-motion handling', why: 'Honour reduced-motion for non-essential animation.', file: '(project)', line: 0, count: 1, detail: '' });
if (project.html && !project.selection && !project.caretOrAccent) findings.push({ rule: 'browser-surfaces', kind: 'note', name: 'Browser surfaces left at defaults', why: 'Theme ::selection, caret-color, accent-color and focus rings: the cheapest signal a page was built, not assembled.', file: '(project)', line: 0, count: 1, detail: '' });

// ---------- report ----------
const distinct = (k) => new Set(findings.filter((f) => f.kind === k).map((f) => f.rule)).size;
const tells = distinct('tell'), copy = distinct('copy'), checks = distinct('check');
const score = tells + copy;
const tier = score >= 4 ? 'High' : score >= 2 ? 'Medium' : 'Low';

if (asJson) {
  console.log(JSON.stringify({ scanned: files.length, distinctTells: tells, distinctCopyTells: copy, distinctChecks: checks, tier, findings }, null, 2));
} else {
  const titles = { tell: 'Design tells (AI-default patterns)', copy: 'Copy tells (generated-prose patterns)', check: 'Accessibility and robustness checks', note: 'Notes (context-dependent: look at the page, then decide)' };
  console.log(`slop-check v3: scanned ${files.length} file(s) under ${path.relative(process.cwd(), root) || '.'}`);
  if (!quiet) for (const kind of ['tell', 'copy', 'check', 'note']) {
    const list = findings.filter((f) => f.kind === kind);
    if (!list.length) continue;
    console.log(`\n${titles[kind]}`);
    for (const f of list) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      const extra = [f.detail, f.count > 1 && !String(f.detail).includes(String(f.count)) ? `x${f.count}` : ''].filter(Boolean).join(', ');
      console.log(`  [${f.rule}] ${f.name}${extra ? ` (${extra})` : ''}\n      ${loc}\n      ${f.why}`);
    }
  }
  console.log(`\nDistinct tells: design ${tells}, copy ${copy}  ->  Tier: ${tier}  (Low 0-1, Medium 2-3, High 4+)   Checks failing: ${checks}`);
  console.log('Low does not mean distinctive. It only means these patterns were not found. Look at the render.');
}
process.exit(strict && tier === 'High' ? 1 : 0);
