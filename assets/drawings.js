/* Drawings of found things, made for this app (no stock photos exist for these sample items).
   The identifying mark is drawn only when `reveal` is true. Otherwise a smudge sits in its
   place, so the hidden detail never reaches the page of someone who has not proved ownership.
   slop-ok:untokenised-colour the drawings are also rasterised into a canvas, where CSS variables do not apply. */
(function () {
  'use strict';

  const INK = '#17202B';
  const PEN = '#1C3FA0';
  let n = 0;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Each kind: table surface, the object, and where its telling mark sits.
  const KINDS = {
    calculator: {
      bg: '#9C8B74',
      body: '<rect x="95" y="18" width="130" height="206" rx="14" fill="#2E3238"/>' +
        '<rect x="104" y="28" width="112" height="186" rx="9" fill="none" stroke="#3B4047" stroke-width="2"/>' +
        '<rect x="120" y="150" width="80" height="54" rx="4" fill="#3A3F46" stroke="#24282D" stroke-width="2"/>' +
        '<circle cx="160" cy="160" r="3" fill="#1F2226"/>' +
        '<rect x="104" y="196" width="14" height="10" rx="3" fill="#1A1C1F"/><rect x="202" y="196" width="14" height="10" rx="3" fill="#1A1C1F"/>' +
        '<rect x="104" y="34" width="14" height="10" rx="3" fill="#1A1C1F"/><rect x="202" y="34" width="14" height="10" rx="3" fill="#1A1C1F"/>',
      box: { x: 112, y: 56, w: 96, h: 60 },
      mark: (m) => '<g transform="rotate(-3 160 86)"><rect x="114" y="58" width="92" height="56" fill="#F1EEE6"/>' +
        '<text x="160" y="94" text-anchor="middle" font-family="Segoe Print, Bradley Hand, Comic Sans MS, cursive" font-size="17" textLength="78" lengthAdjust="spacingAndGlyphs" fill="' + PEN + '">' + esc(m) + '</text></g>',
      smudgeFill: '#CFC9BC'
    },
    bottle: {
      bg: '#B3BCC4',
      body: '<rect x="132" y="20" width="56" height="36" rx="7" fill="#2C3036"/>' +
        '<rect x="122" y="52" width="76" height="172" rx="24" fill="#C3C8CD"/>' +
        '<rect x="134" y="66" width="10" height="146" rx="5" fill="#E7EAED"/>' +
        '<path d="M176 196 q8 6 14 0" fill="none" stroke="#8E959C" stroke-width="3"/>',
      box: { x: 134, y: 104, w: 52, h: 52 },
      mark: () => '<circle cx="160" cy="130" r="24" fill="#F4F4F1"/>' +
        '<path d="M142 142 l11 -18 l7 9 l6 -12 l12 21 z" fill="#2E5B9A"/><circle cx="170" cy="117" r="3" fill="#E2B928"/>',
      smudgeFill: '#D5D9DD'
    },
    bag: {
      bg: '#A79B8A',
      body: '<path d="M140 30 q20 -18 40 0" fill="none" stroke="#1A2747" stroke-width="7"/>' +
        '<rect x="92" y="34" width="136" height="190" rx="34" fill="#1F2F55"/>' +
        '<rect x="110" y="120" width="100" height="78" rx="14" fill="#2A3D6E"/>' +
        '<path d="M116 128 h88" stroke="#AAB2BC" stroke-width="3" stroke-dasharray="3 3"/>' +
        '<rect x="200" y="122" width="6" height="12" rx="2" fill="#AAB2BC"/>',
      box: { x: 140, y: 104, w: 40, h: 40 },
      mark: () => '<rect x="152" y="104" width="16" height="30" rx="3" fill="#2F63B5"/><rect x="155" y="98" width="10" height="8" fill="#C3C8CD"/>',
      smudgeFill: '#2B3B66'
    },
    earphones: {
      bg: '#8C9399',
      body: '<rect x="100" y="66" width="120" height="104" rx="44" fill="#F4F4F1" stroke="#CFCFCB" stroke-width="2"/>' +
        '<path d="M104 104 h112" stroke="#D6D6D1" stroke-width="2"/><circle cx="160" cy="118" r="3" fill="#7FBF6A"/>',
      box: { x: 132, y: 126, w: 56, h: 36 },
      mark: (m) => '<text x="160" y="154" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="none" stroke="#9C9C96" stroke-width="1.6">' + esc(m) + '</text>',
      smudgeFill: '#E6E6E1'
    },
    book: {
      bg: '#B7AE9C',
      body: '<rect x="80" y="28" width="164" height="194" fill="#9B7A55"/><rect x="80" y="28" width="14" height="194" fill="#7E6142"/>' +
        '<rect x="116" y="58" width="100" height="36" fill="#F1EEE6"/><path d="M124 70 h84 M124 82 h60" stroke="#B9B2A3" stroke-width="2"/>',
      box: { x: 170, y: 152, w: 56, h: 52 },
      mark: () => '<g fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round">' +
        '<circle cx="198" cy="182" r="15"/><path d="M186 172 l-3 -12 l10 7 M210 172 l3 -12 l-10 7"/>' +
        '<path d="M192 186 q6 5 12 0"/></g><circle cx="193" cy="179" r="1.8" fill="' + INK + '"/><circle cx="203" cy="179" r="1.8" fill="' + INK + '"/>',
      smudgeFill: '#A6865F'
    },
    clothing: {
      bg: '#8C9670',
      body: '<path d="M120 40 q40 -26 80 0 l52 30 l-18 50 l-22 -12 v104 h-104 v-104 l-22 12 l-18 -50 z" fill="#8A8F96"/>' +
        '<path d="M132 42 q28 32 56 0" fill="none" stroke="#6F747B" stroke-width="4"/>' +
        '<path d="M150 56 v26 M170 56 v26" stroke="#E6E6E1" stroke-width="2.4"/>' +
        '<rect x="128" y="160" width="64" height="36" rx="4" fill="#7D828A"/>',
      box: null
    },
    other: {
      bg: '#A69A86',
      body: '<ellipse cx="160" cy="150" rx="98" ry="60" fill="#9EA4AA"/><ellipse cx="160" cy="124" rx="98" ry="60" fill="#C3C8CD"/>' +
        '<ellipse cx="160" cy="124" rx="74" ry="42" fill="none" stroke="#AEB4BA" stroke-width="3"/>' +
        '<rect x="54" y="112" width="12" height="28" rx="3" fill="#7F858C"/><rect x="254" y="112" width="12" height="28" rx="3" fill="#7F858C"/>',
      box: { x: 136, y: 100, w: 48, h: 46 },
      mark: (m) => '<text x="160" y="138" text-anchor="middle" font-family="Georgia, serif" font-size="36" fill="none" stroke="#7F858C" stroke-width="1.8">' + esc(m) + '</text>',
      smudgeFill: '#B7BCC1'
    },
    umbrella: {
      bg: '#B4ABA0',
      body: '<path d="M70 196 L214 52 L236 74 L92 218 z" fill="#2F63B5"/>' +
        '<path d="M214 52 l22 -22" stroke="#3A3F46" stroke-width="5"/>' +
        '<path d="M92 218 l-16 16 q-14 14 -26 2" fill="none" stroke="#6B4A2E" stroke-width="9" stroke-linecap="round"/>',
      box: { x: 128, y: 112, w: 52, h: 52 },
      mark: () => '<path d="M136 152 L168 120 L176 128 L144 160 z" fill="#E2B928"/>',
      smudgeFill: '#3D6DB8'
    },
    idcard: {
      bg: '#A69A86',
      body: '<rect x="70" y="50" width="180" height="120" rx="8" fill="#F1EEE6"/><rect x="70" y="50" width="180" height="24" rx="8" fill="#2F63B5"/>',
      box: { x: 82, y: 82, w: 156, h: 78 },
      mark: () => '',
      smudgeFill: '#C9C2B4'
    },
    wallet: {
      bg: '#A69A86',
      body: '<rect x="80" y="70" width="160" height="110" rx="10" fill="#6B4A2E"/><path d="M80 98 h160" stroke="#58391F" stroke-width="3"/>',
      box: null
    },
    phone: {
      bg: '#A69A86',
      body: '<rect x="120" y="26" width="80" height="188" rx="14" fill="#1F2124"/><rect x="128" y="40" width="64" height="160" rx="4" fill="#3A3F46"/>',
      box: null
    },
    keys: {
      bg: '#A69A86',
      body: '<circle cx="130" cy="90" r="26" fill="none" stroke="#9EA4AA" stroke-width="6"/>' +
        '<path d="M148 108 l60 60 l12 -6 l6 10 l-10 6 l8 8" fill="none" stroke="#C3C8CD" stroke-width="9" stroke-linejoin="round"/>' +
        '<path d="M120 114 l-10 76 l12 2 l-2 12 l12 2" fill="none" stroke="#C9A64A" stroke-width="9" stroke-linejoin="round"/>',
      box: null
    }
  };

  function svg(kind, opts) {
    opts = opts || {};
    const k = KINDS[kind] || KINDS.other;
    const id = 'smudge' + (++n);
    let mark = '';
    if (k.box) {
      if (opts.reveal && k.mark && kind !== 'idcard') {
        mark = k.mark(opts.mark || '');
      } else {
        const b = k.box;
        mark = '<g filter="url(#' + id + ')"><rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="10" fill="' + k.smudgeFill + '"/>' +
          '<ellipse cx="' + (b.x + b.w * 0.4) + '" cy="' + (b.y + b.h * 0.55) + '" rx="' + b.w * 0.3 + '" ry="' + b.h * 0.2 + '" fill="' + k.bg + '" opacity="0.5"/></g>';
      }
    }
    const label = opts.label ? ' role="img" aria-label="' + esc(opts.label) + '"' : ' aria-hidden="true"';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240"' + label + '>' +
      '<defs><filter id="' + id + '" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter></defs>' +
      '<rect width="320" height="240" fill="' + k.bg + '"/>' + k.body + mark + '</svg>';
  }

  // Rasterise a drawing so the finder's blur brush can work on it like on a photo.
  function toImage(kind, mark) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      const s = svg(kind, { reveal: true, mark }).replace('width="320" height="240"', 'width="960" height="720"');
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    });
  }

  window.KPDraw = { svg, toImage, hasMark: (kind) => !!(KINDS[kind] && KINDS[kind].box) };
})();
