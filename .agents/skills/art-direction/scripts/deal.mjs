#!/usr/bin/env node
/**
 * deal.mjs: deal random creative directions so the agent (and the human)
 * cannot fall back on the category default. No dependencies. Node 18+.
 *
 * Why random: asked to rank options, a model puts the most familiar one
 * first, and different models put the same one first. A deal forces a
 * real alternative onto the table. The human still chooses.
 *
 * Usage:
 *   node deal.mjs                       3 directions, random seed (printed)
 *   node deal.mjs --seed 4821           reproducible deal
 *   node deal.mjs --n 4                 deal 4 directions
 *   node deal.mjs --mode any            no web axes (writing, image, video, idea tasks)
 *   node deal.mjs --forms 12            just list 12 random forms to brainstorm from
 *   node deal.mjs --no-regional         leave out region-specific forms
 *   node deal.mjs --list                print the whole catalogue
 *   node deal.mjs --json                machine-readable output
 */

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const val = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };

// ---------- catalogue ----------
// Each form is an artefact, place, system or ritual with a recognisable
// grammar. "r" marks forms tied to a region (here: South Asia), included by
// default because local culture is one of the strongest sources of
// specificity, and easy to exclude with --no-regional.
const FAMILIES = {
  'Print ephemera': [
    ['Ticket stub', 'perforation, serial number, seat and gate, one bold title'],
    ['Till receipt', 'narrow column, monospaced totals, itemised lines, a footer message'],
    ['Seed packet', 'illustrated front, growing instructions on the back, sowing calendar'],
    ['Luggage tag', 'from and to, string hole, handwritten fields'],
    ['Postage stamp sheet', 'repeating frames, denomination, perforated grid'],
    ['Matchbox label', 'tiny bold image, brand name, saturated two-colour print', 'r'],
    ['Wedding invitation card', 'ornate frame, ordered ceremony schedule, family names, gold on deep colour', 'r'],
  ],
  'Wayfinding and public systems': [
    ['Railway departure board', 'rows of destinations, times, platforms, status changes'],
    ['Transit map', 'lines, interchanges, a colour per route, stations as dots'],
    ['Museum wall label', 'object name, date, material, one short paragraph'],
    ['Road and highway signs', 'huge legible type, arrows, distances, colour by meaning'],
    ['Airport split-flap board', 'letters that flip, fixed columns, live updates'],
    ['Railway reservation chart', 'coach, berth, name, age, pasted on the carriage door', 'r'],
  ],
  'Science and reference': [
    ['Field guide plate', 'specimen drawn large, numbered callouts, Latin names, range notes'],
    ['Botanical illustration', 'one subject in detail, cross-sections, precise labels'],
    ['Star chart', 'dark field, points and lines, coordinates, constellation names'],
    ['Specimen drawer', 'grid of compartments, small labels, collected objects'],
    ['Dictionary entry', 'headword, pronunciation, numbered senses, usage examples'],
    ['Patent drawing', 'line art, figure numbers, leader lines, formal claims'],
  ],
  'Documents and records': [
    ['Ledger or account book', 'ruled columns, dates, debits and credits, running balance'],
    ['Passport pages', 'stamps, visas, entries and exits, security patterns'],
    ['School report card', 'subjects, grades, remarks, signature'],
    ['Telegram', 'short capitalised lines, STOP, sender and time'],
    ['Library card catalogue', 'index cards, call numbers, cross-references'],
    ['Panchang almanac', 'day grid with tithi, sunrise, auspicious hours, festivals', 'r'],
  ],
  'Domestic and craft': [
    ['Recipe card', 'ingredients, steps, a stain, the cook\'s note'],
    ['Sewing pattern', 'cut lines, fold marks, sizes, assembly order'],
    ['Knitting chart', 'grid of symbols, row numbers, a legend'],
    ['Glaze test tiles', 'rows of samples, codes, firing notes'],
    ['Block-print textile', 'repeating motif, carved-block edges, two or three dyes', 'r'],
    ['Kolam or rangoli grid', 'dot grid, one continuous line, symmetry', 'r'],
    ['Spice tin label', 'round lid, bold name, small print of origin and weight, a colour per spice'],
  ],
  'Media and broadcast': [
    ['Record sleeve', 'one bold image, track list on the back, catalogue number'],
    ['Cassette J-card', 'narrow spine, side A and side B, handwritten mix titles'],
    ['TV test card', 'colour bars, circles, calibration marks'],
    ['Film opening credits', 'names one at a time, timing, full-screen type'],
    ['Comic strip', 'panels, gutters, speech balloons, a punchline'],
    ['Zine', 'photocopied collage, cut-out type, staples'],
    ['Hand-painted film poster', 'painted portraits, huge title lettering, star names', 'r'],
  ],
  'Play and games': [
    ['Board game', 'a path of squares, rules card, pieces, a start and a finish'],
    ['Playing cards', 'suits, corners, a face, a deck to deal'],
    ['Trading cards', 'portrait, stats block, rarity mark, a set to collect'],
    ['Scoreboard', 'big digits, teams, periods, live changes'],
    ['Crossword', 'grid, numbered clues, across and down'],
    ['Carrom board', 'square field, corner pockets, a striker line', 'r'],
  ],
  'Street and commerce': [
    ['Hand-painted shop sign', 'brush lettering, bright ground, a list of services'],
    ['Market price board', 'items and prices that change daily, chalk or slots'],
    ['Auction catalogue', 'lot numbers, object photos, estimates, provenance'],
    ['Shipping carton', 'stencils, handling icons, barcodes, origin'],
    ['Chai stall menu board', 'short list, prices, painted by hand, one specialty', 'r'],
    ['Truck art', 'dense ornament, mottos, borders, saturated colour', 'r'],
  ],
  'Maps and places': [
    ['Topographic map', 'contour lines, elevation, legend, grid references'],
    ['Nautical chart', 'depths, buoys, compass rose, coastline'],
    ['City plan', 'blocks, street names, numbered landmarks, a key'],
    ['Weather map', 'fronts, pressure lines, symbols, a forecast time'],
    ['Floor plan', 'rooms, doors, dimensions, a north arrow'],
  ],
};

const AXES_WEB = {
  palette: ['Restrained: tinted neutrals from the form, one accent with a job', 'Committed: one saturated colour holds 30 to 60 percent of the surface', 'Full palette: three or four named roles taken from the form', 'Drenched: the surface is the colour, sections change the field'],
  type: ['One family worked hard: weight and size do all the hierarchy', 'Two clearly different voices: display and text', 'Extreme scale: one giant size, one small, nothing between', 'Condensed or extended display face as the main image'],
  layout: ['Fixed stage: one element stays put while content changes', 'Long document: a single column read top to bottom', 'Index first: the list of things is the page', 'Poster per screen: each screen one dominant thing', 'Split: two columns with different jobs', 'Map or diagram: the page is a space to move through', 'Catalogue: a strict grid of real items'],
  imagery: ['The human\'s own photos or material, large', 'The product or subject shown working, built in code', 'Archival or open-licence pictures of the subject\'s world', 'Drawn for this subject in one consistent graphic language', 'Type and colour only'],
  motion: ['Still: no motion except feedback on controls', 'One entrance: a single orchestrated load sequence', 'Scroll-driven: one scene that moves as you scroll', 'Interactive: the one live thing is the motion', 'Ambient: one slow loop that carries meaning'],
  voice: ['Plain-spoken maker talking to a friend', 'Precise, like a field guide or a manual', 'Formal notice or announcement', 'A letter to one person', 'Playful, with one running joke from the subject'],
};
const AXES_ANY = {
  structure: ['Told as the dealt form, strictly', 'A sequence of short scenes', 'A list or index', 'A single dramatic moment', 'A conversation or exchange', 'A before and after'],
  angle: ['From the point of view of an object in the brief', 'From the smallest detail outward', 'From the end backwards', 'From an outsider seeing it for the first time', 'As instructions someone must follow'],
  voice: AXES_WEB.voice,
  constraint: ['Only concrete nouns from the inventory', 'No adjectives in the title', 'Exactly one number, and it must be real', 'Every line under ten words', 'One colour, one shape, one word repeated'],
};

// ---------- seeded random (mulberry32) ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const seedArg = val('--seed');
const seed = seedArg ? parseInt(seedArg, 10) || 0 : Math.floor(Math.random() * 100000);
const rand = rng(seed);
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const noRegional = has('--no-regional');
const allForms = [];
for (const [family, list] of Object.entries(FAMILIES)) for (const [name, grammar, tag] of list) {
  if (noRegional && tag === 'r') continue;
  allForms.push({ family, name, grammar, regional: tag === 'r' });
}

// ---------- outputs ----------
if (has('--list')) {
  for (const [family, list] of Object.entries(FAMILIES)) {
    console.log(`\n${family}`);
    for (const [name, grammar, tag] of list) console.log(`  - ${name}${tag === 'r' ? ' (regional)' : ''}: ${grammar}`);
  }
  process.exit(0);
}

const formsN = val('--forms');
if (formsN) {
  const n = Math.max(1, Math.min(allForms.length, parseInt(formsN, 10) || 12));
  const pick = shuffle(allForms).slice(0, n);
  if (has('--json')) { console.log(JSON.stringify({ seed, forms: pick }, null, 2)); process.exit(0); }
  console.log(`Forms to brainstorm from (seed ${seed}):`);
  pick.forEach((f, i) => console.log(`${String(i + 1).padStart(2)}. ${f.name} [${f.family}]: ${f.grammar}`));
  process.exit(0);
}

const mode = val('--mode', 'web') === 'any' ? 'any' : 'web';
const AXES = mode === 'any' ? AXES_ANY : AXES_WEB;
const n = Math.max(2, Math.min(6, parseInt(val('--n', '3'), 10) || 3));

// one form per direction, each from a different family
const families = shuffle(Object.keys(FAMILIES)).filter((fam) => allForms.some((f) => f.family === fam));
const directions = [];
const axisDecks = Object.fromEntries(Object.entries(AXES).map(([k, v]) => [k, shuffle(v)]));
for (let i = 0; i < n; i++) {
  const fam = families[i % families.length];
  const options = allForms.filter((f) => f.family === fam);
  const form = options[Math.floor(rand() * options.length)];
  const axes = {};
  for (const [k, deck] of Object.entries(axisDecks)) axes[k] = deck[i % deck.length]; // different value per direction while the deck lasts
  directions.push({ id: String.fromCharCode(65 + i), form, axes });
}

if (has('--json')) { console.log(JSON.stringify({ seed, mode, directions }, null, 2)); process.exit(0); }

console.log(`Dealt ${n} directions (seed ${seed}, mode ${mode}). Re-run with --seed ${seed} to repeat this deal.\n`);
for (const d of directions) {
  const art = /^[aeiou]/i.test(d.form.name) ? 'an' : 'a';
  console.log(`Direction ${d.id}: told as ${art} ${d.form.name} [${d.form.family}]`);
  console.log(`  Grammar to borrow: ${d.form.grammar}`);
  for (const [k, v] of Object.entries(d.axes)) console.log(`  ${k.padEnd(10)} ${v}`);
  console.log('');
}
console.log('How to use the deal:');
console.log('  1. Fuse each dealt form with the brief: the form gives structure and grammar, the brief gives every fact.');
console.log('  2. Keep at least one dealt direction in the final three. Drop one only for a named reason (it cannot carry the real content).');
console.log('  3. A dealt axis value can be swapped for a reason from the brief. Write the reason down.');
console.log('  4. The human chooses. The deal only makes sure the choice is real.');
