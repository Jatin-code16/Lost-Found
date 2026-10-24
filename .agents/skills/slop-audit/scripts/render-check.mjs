#!/usr/bin/env node
/**
 * render-check.mjs: open the real page in a browser at 1440, 768 and 390 px,
 * measure what a source scan cannot see, and save screenshots for the
 * critique. Needs Playwright (npm i -D playwright && npx playwright install chromium).
 *
 * Usage:
 *   node render-check.mjs <url | path/to/index.html> [--out .slop-check/render] [--json] [--strict] [--widths 1440,768,390]
 *
 * Measures per width: horizontal overflow (and the elements causing it),
 * headline line counts, fonts declared but not loaded, text contrast against
 * the real background, tiny text, tracked-caps labels, number of font sizes,
 * share of centred text, broken images, missing alt, focus visibility,
 * small touch targets, whether the H1 and a primary action sit in the first
 * screen, and console errors.
 *
 * FAIL = fix it. WARN = fix it or defend it in one sentence. The numbers are
 * evidence for a human or a fresh-context reviewer, not a verdict on quality.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const positional = argv.filter((a, i) => !a.startsWith('--') && !['--out', '--widths'].includes(argv[i - 1]));
const target = positional[0];
const outDir = path.resolve(val('--out', '.slop-check/render'));
const widths = val('--widths', '1440,768,390').split(',').map((w) => parseInt(w, 10)).filter(Boolean);
const asJson = flags.has('--json');
const strict = flags.has('--strict');

if (!target) { console.error('Usage: node render-check.mjs <url | file.html> [--out dir] [--json] [--strict]'); process.exit(2); }

// ---------- load playwright from the project, the global install, or NODE_PATH ----------
async function loadPlaywright() {
  const tries = [path.join(process.cwd(), 'noop.js'), import.meta.url];
  for (const base of tries) { try { const req = createRequire(base); return req('playwright'); } catch {} }
  for (const dir of (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)) { try { return createRequire(path.join(dir, 'noop.js'))('playwright'); } catch {} }
  try { const { execSync } = await import('node:child_process'); const g = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); return createRequire(path.join(g, 'noop.js'))('playwright'); } catch {}
  return null;
}
const pw = await loadPlaywright();
if (!pw) {
  console.error('render-check: Playwright not found. Install it with:\n  npm i -D playwright && npx playwright install chromium\nOr take screenshots at 1440, 768 and 390 px with any browser tool and critique those. Say in your report that render-check did not run.');
  process.exit(3);
}

const url = /^https?:\/\//i.test(target) ? target : pathToFileURL(path.resolve(target)).href;
fs.mkdirSync(outDir, { recursive: true });

// ---------- the in-page measurement ----------
function measure() {
  const vw = innerWidth, vh = innerHeight;
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05; };
  const sel = (el) => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; else if (el.classList.length) s += '.' + [...el.classList].slice(0, 2).join('.'); return s; };
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();

  // colour
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const blend = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
  function bgOf(el) {
    let layers = []; let node = el;
    while (node && node.nodeType === 1) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return { unknown: true };
      const c = parse(cs.backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
      node = node.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) base = blend(layers[i], base);
    return base;
  }

  const res = { width: vw };
  // overflow
  const docW = document.documentElement.scrollWidth;
  res.overflowX = docW > vw + 1 ? docW - vw : 0;
  if (res.overflowX) res.overflowEls = [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.right > vw + 1 && r.width > 0 && getComputedStyle(el).position !== 'fixed'; }).slice(0, 6).map(sel);

  // headings
  const lines = (el) => { const cs = getComputedStyle(el); let lh = parseFloat(cs.lineHeight); if (isNaN(lh)) lh = parseFloat(cs.fontSize) * 1.2; const range = document.createRange(); range.selectNodeContents(el); const rects = [...range.getClientRects()]; const tops = new Set(rects.filter((r) => r.width > 1).map((r) => Math.round(r.top / (lh * 0.5)))); return Math.max(1, Math.round(el.getBoundingClientRect().height / lh)) && Math.max(1, Math.min(tops.size || 1, Math.round(el.getBoundingClientRect().height / lh + 0.3))); };
  const h1s = [...document.querySelectorAll('h1')].filter(vis);
  res.h1Count = h1s.length;
  res.h1 = h1s.slice(0, 1).map((h) => ({ text: h.textContent.trim().slice(0, 80), lines: lines(h), fontSize: parseFloat(getComputedStyle(h).fontSize), top: h.getBoundingClientRect().top + scrollY }));
  res.longHeadings = [...document.querySelectorAll('h2,h3')].filter(vis).map((h) => ({ text: h.textContent.trim().slice(0, 60), lines: lines(h) })).filter((h) => h.lines > 2).slice(0, 6);

  // fonts
  const generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-[a-z-]+|-apple-system|blinkmacsystemfont|arial|helvetica|times new roman|georgia|courier new|segoe ui|roboto)$/i;
  const families = new Set();
  for (const el of [document.body, ...h1s, ...document.querySelectorAll('h2,p,button,a')].slice(0, 60)) { if (!el) continue; const f = getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/^['"]|['"]$/g, ''); if (f) families.add(f); }
  res.fontsDeclared = [...families];
  // A family counts as rendering if a loaded FontFace has that name, or if it is installed locally
  // (canvas width differs from both fallbacks). document.fonts.check() alone returns true for unknown names.
  const loadedFaces = new Set([...document.fonts].filter((ff) => ff.status === 'loaded').map((ff) => ff.family.replace(/^['"]|['"]$/g, '').toLowerCase()));
  const cv = document.createElement('canvas').getContext('2d'); const probe = 'mmmmmmmmmlliWW@#ab 0123';
  const width = (font) => { cv.font = font; return cv.measureText(probe).width; };
  const installed = (f) => ['monospace', 'serif', 'sans-serif'].some((fb) => width(`40px "${f}", ${fb}`) !== width(`40px ${fb}`));
  res.fontsMissing = [...families].filter((f) => !generic.test(f) && !loadedFaces.has(f.toLowerCase()) && !installed(f));

  // text scan
  const textEls = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,a,button,label,span,small,figcaption,blockquote,td,th,dd,dt,strong,em')].filter((el) => vis(el) && ownText(el).length >= 2);
  const sizes = new Set(); let centred = 0, blocks = 0; const lowContrast = []; let tiny = 0; let caps = 0; let unknownBg = 0;
  for (const el of textEls) {
    const cs = getComputedStyle(el); const fs = parseFloat(cs.fontSize); sizes.add(Math.round(fs));
    if (/^(P|H[1-6]|LI|BLOCKQUOTE)$/.test(el.tagName)) { blocks++; if (cs.textAlign === 'center') centred++; }
    if (fs < 12) tiny++;
    const ls = parseFloat(cs.letterSpacing) || 0;
    if (cs.textTransform === 'uppercase' && fs <= 15 && ls / fs >= 0.05) caps++;
    const fg = parse(cs.color); const bg = bgOf(el);
    if (!fg) continue; if (bg.unknown) { unknownBg++; continue; }
    const r = ratio(blend(fg, bg), bg); const large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight, 10) >= 700); const need = large ? 3 : 4.5;
    if (r < need) lowContrast.push({ el: sel(el), text: ownText(el).slice(0, 40), ratio: Math.round(r * 100) / 100, need });
  }
  res.distinctSizes = sizes.size; res.centredShare = blocks ? Math.round((centred / blocks) * 100) : 0; res.tinyText = tiny; res.trackedCaps = caps; res.textOnImages = unknownBg;
  res.lowContrast = lowContrast.slice(0, 8); res.lowContrastCount = lowContrast.length;

  // images
  const imgs = [...document.images];
  res.images = imgs.length; res.brokenImages = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')).slice(0, 6);
  res.imgNoAlt = imgs.filter((i) => !i.hasAttribute('alt')).length;

  // first screen: h1 and an action
  const actions = [...document.querySelectorAll('a[href],button')].filter(vis);
  res.actionInFirstScreen = actions.some((a) => { const r = a.getBoundingClientRect(); return r.top + scrollY < vh && r.bottom > 0; });
  res.smallTargets = vw <= 500 ? actions.filter((a) => { const r = a.getBoundingClientRect(); return r.height < 32 || r.width < 32; }).length : 0;
  res.deadLinks = [...document.querySelectorAll('a')].filter((a) => { const h = a.getAttribute('href'); return h === null || h === '#' || h === '' || /^javascript:/i.test(h); }).length;
  return res;
}

async function focusCheck(page) {
  return page.evaluate(() => {
    const els = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].slice(0, 8);
    let invisible = 0; const bad = [];
    for (const el of els) {
      const before = getComputedStyle(el); const b = [before.outlineStyle, before.outlineWidth, before.boxShadow, before.borderColor, before.backgroundColor, before.textDecorationLine].join('|');
      el.focus({ focusVisible: true }); const after = getComputedStyle(el);
      const a = [after.outlineStyle, after.outlineWidth, after.boxShadow, after.borderColor, after.backgroundColor, after.textDecorationLine].join('|');
      const outlineOn = after.outlineStyle !== 'none' && parseFloat(after.outlineWidth) > 0;
      if (a === b && !outlineOn) { invisible++; bad.push(el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')); }
      el.blur();
    }
    return { tested: els.length, invisible, bad: bad.slice(0, 5) };
  });
}

// ---------- run ----------
const browser = await pw.chromium.launch();
const report = { url, widths: [], consoleErrors: [], fails: 0, warns: 0 };
const errs = new Set();
for (const w of widths) {
  const h = w >= 1200 ? 900 : w >= 700 ? 1024 : 844;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errs.add(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errs.add(String(e.message || e).slice(0, 200)));
  try { await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); } catch { try { await page.goto(url, { waitUntil: 'load', timeout: 30000 }); } catch (e) { errs.add('navigation: ' + e.message); } }
  await page.evaluate(async () => { await document.fonts.ready; const step = innerHeight * 0.8; for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 600)); });
  const m = await page.evaluate(measure);
  m.focus = await focusCheck(page);
  const fold = path.join(outDir, `${w}-fold.png`), full = path.join(outDir, `${w}-full.png`);
  await page.screenshot({ path: fold });
  await page.screenshot({ path: full, fullPage: true });
  const show = (p) => { const r = path.relative(process.cwd(), p); return r.startsWith('..') ? p : r; };
  m.screenshots = [show(fold), show(full)];

  // verdicts
  const v = [];
  const F = (msg) => v.push(['FAIL', msg]); const W = (msg) => v.push(['WARN', msg]); const P = (msg) => v.push(['PASS', msg]);
  m.overflowX ? F(`horizontal scroll: page is ${m.overflowX}px wider than the viewport (${(m.overflowEls || []).join(', ')})`) : P('no horizontal scroll');
  if (m.h1Count === 0) F('no visible <h1>'); else if (m.h1Count > 1) W(`${m.h1Count} visible <h1> elements`);
  if (m.h1[0]) { m.h1[0].lines > 2 ? F(`H1 runs to ${m.h1[0].lines} lines ("${m.h1[0].text}"); cut words, aim for 2 or fewer`) : P(`H1 ${m.h1[0].lines} line(s) at ${m.h1[0].fontSize}px`); if (m.h1[0].top > h) W('H1 starts below the first screen'); }
  if (m.longHeadings.length) W(`headings over 2 lines: ${m.longHeadings.map((x) => `"${x.text}" (${x.lines})`).join('; ')}`);
  m.fontsMissing.length ? F(`fonts declared but not loaded: ${m.fontsMissing.join(', ')}`) : P(`fonts render: ${m.fontsDeclared.join(', ') || 'none detected'}`);
  m.lowContrastCount ? F(`${m.lowContrastCount} text elements below contrast minimum, e.g. ${m.lowContrast.slice(0, 3).map((c) => `${c.el} "${c.text}" ${c.ratio}:1 (needs ${c.need})`).join('; ')}`) : P('text contrast meets 4.5:1 / 3:1 where measurable');
  if (m.textOnImages) W(`${m.textOnImages} text elements sit on images or gradients; check their contrast by eye`);
  if (m.tinyText) W(`${m.tinyText} text elements under 12px`);
  if (m.trackedCaps >= 3) W(`${m.trackedCaps} small tracked-caps labels (eyebrow pattern)`);
  if (m.distinctSizes > 9) W(`${m.distinctSizes} distinct font sizes; five far apart reads as designed`);
  if (m.centredShare > 70) W(`${m.centredShare}% of text blocks are centred`);
  if (m.brokenImages.length) F(`broken images: ${m.brokenImages.join(', ')}`);
  if (m.imgNoAlt) F(`${m.imgNoAlt} images without alt`);
  if (!m.actionInFirstScreen) W('no link or button visible in the first screen');
  if (m.smallTargets) W(`${m.smallTargets} touch targets under 32px`);
  if (m.deadLinks) W(`${m.deadLinks} links without a real href`);
  if (m.focus.invisible) F(`${m.focus.invisible}/${m.focus.tested} focusable elements show no visible focus change (${m.focus.bad.join(', ')})`);
  m.verdicts = v;
  report.fails += v.filter((x) => x[0] === 'FAIL').length; report.warns += v.filter((x) => x[0] === 'WARN').length;
  report.widths.push(m);
  await ctx.close();
}
await browser.close();
report.consoleErrors = [...errs];
if (report.consoleErrors.length) report.fails += 1;

if (asJson) { console.log(JSON.stringify(report, null, 2)); }
else {
  console.log(`render-check: ${url}`);
  for (const m of report.widths) {
    console.log(`\n${m.width}px   screenshots: ${m.screenshots.join(', ')}`);
    for (const [k, msg] of m.verdicts) console.log(`  ${k.padEnd(4)} ${msg}`);
  }
  console.log(`\nConsole errors: ${report.consoleErrors.length ? report.consoleErrors.join(' | ') : 'none'}`);
  console.log(`\nTotal: ${report.fails} FAIL, ${report.warns} WARN. Now open every screenshot and critique what you see; passing checks does not make a page good.`);
}
process.exit(strict && report.fails ? 1 : 0);
