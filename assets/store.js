/* Kho-Paya data layer.
   The arena build has no server: all state lives in this browser's localStorage.
   Each rule names the PRD requirement it implements (F1 to F15). */
(function () {
  'use strict';

  const KEY = 'khopaya.v1';
  const HOUR = 3600000;
  const DAY = 24 * HOUR;

  // Sample domain. Replace with the college's own before the pilot (PRD open question).
  const COLLEGE_DOMAIN = 'college.edu.in';
  const ATTEMPTS_PER_DAY = 3;      // F5
  const POST_DAYS = 30;            // F13
  const CHAT_KEEP_DAYS = 30;       // privacy model: chat deleted 30 days after close
  const CODE_VALID_H = 24;         // NFR: one-time codes valid 24 h
  const NO_SHOW_H = 48;            // edge case: finder never shows up
  const STRIKES_TO_SUSPEND = 3;

  // Sample zones from the PRD. Replace with your campus's real zones (PRD open question).
  const ZONES = [
    { id: 'library', en: 'Library' },
    { id: 'canteen', en: 'Canteen' },
    { id: 'lab', en: 'Lab block' },
    { id: 'hostel', en: 'Hostel gate' },
    { id: 'busstop', en: 'Bus stop' },
    { id: 'ground', en: 'Ground' },
    { id: 'transport', en: 'Transport' }
  ];
  // Which zones sit next to each other (assumed; F9 matches "same or neighbouring zone").
  const NEIGHBOURS = {
    library: ['lab', 'canteen'],
    canteen: ['library', 'hostel'],
    lab: ['library', 'ground'],
    hostel: ['canteen', 'busstop', 'ground'],
    busstop: ['hostel', 'transport'],
    ground: ['hostel', 'lab'],
    transport: ['busstop']
  };

  // Default secret questions per category (PRD screen 2). Sensitive ones skip the feed (F10).
  const CATEGORIES = [
    { id: 'calculator', en: 'Calculator', q: 'What is written or stuck on the back?' },
    { id: 'bottle', en: 'Bottle', q: 'What sticker or dent does it have?' },
    { id: 'bag', en: 'Bag', q: 'What is inside the front pocket?' },
    { id: 'umbrella', en: 'Umbrella', q: 'What is on the handle or the strap?' },
    { id: 'earphones', en: 'Earphones', q: 'What is scratched or written on the case?' },
    { id: 'book', en: 'Book or notes', q: 'What is drawn or written inside the cover?' },
    { id: 'clothing', en: 'Clothing', q: 'What is printed or stitched on it?' },
    { id: 'other', en: 'Other', q: 'What mark would only the owner know?' },
    { id: 'idcard', en: 'ID card', sensitive: true },
    { id: 'wallet', en: 'Wallet', sensitive: true },
    { id: 'phone', en: 'Phone', sensitive: true },
    { id: 'keys', en: 'Keys', sensitive: true }
  ];

  // slop-ok:untokenised-colour these swatches are item data (the colour of a found thing), not UI roles.
  const COLOURS = [
    { id: 'black', en: 'Black', sw: '#1f2124' },
    { id: 'white', en: 'White', sw: '#f4f4f1' },
    { id: 'grey', en: 'Grey', sw: '#8a8f96' },
    { id: 'silver', en: 'Silver', sw: '#c3c8cd' },
    { id: 'blue', en: 'Blue', sw: '#2f63b5' },
    { id: 'navy', en: 'Navy', sw: '#1f2f55' },
    { id: 'red', en: 'Red', sw: '#c0282d' },
    { id: 'green', en: 'Green', sw: '#3d7a3a' },
    { id: 'brown', en: 'Brown', sw: '#7a5333' },
    { id: 'yellow', en: 'Yellow', sw: '#e2b928' },
    { id: 'pink', en: 'Pink', sw: '#e08aa8' }
  ];

  // Safe spots and open hours (hours assumed; confirm with the security office).
  const SPOTS = [
    { id: 'desk', en: 'Security desk, main gate', open: 8, close: 20 },
    { id: 'library', en: 'Library counter', open: 9, close: 18 }
  ];

  const STATUS = {
    posted: { en: 'Posted' },
    claimed: { en: 'Owner verified' },
    scheduled: { en: 'Handover booked' },
    returned: { en: 'Returned' },
    'at-desk': { en: 'At the desk' },
    expired: { en: 'Expired, desk to decide' },
    donated: { en: 'Donated' },
    disposed: { en: 'Disposed' },
    removed: { en: 'Removed by moderation' }
  };

  /* ---------- small helpers ---------- */

  const pad = (n) => String(n).padStart(2, '0');
  function dayKey(d) {
    d = d instanceof Date ? d : new Date(d);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  const today = () => dayKey(new Date());
  function addDays(key, n) {
    const [y, m, d] = key.split('-').map(Number);
    return dayKey(new Date(y, m - 1, d + n));
  }
  function keyToDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function daysBetween(a, b) {
    return Math.round((keyToDate(b) - keyToDate(a)) / DAY);
  }
  function randomInt(max) {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % max;
  }
  function digits(n) {
    let s = '';
    for (let i = 0; i < n; i++) s += randomInt(10);
    return s;
  }
  const uid = (p) => p + '-' + Date.now().toString(36) + digits(4);

  /* ---------- hashing (F3, NFR: answers never stored in clear) ----------
     The pilot should use bcrypt or argon2 on a server. The arena build uses
     salted SHA-256 through Web Crypto, with a pure-JS fallback for old browsers. */

  function sha256Fallback(text) {
    const K = [], H = [];
    const frac = (x) => ((x - Math.floor(x)) * 4294967296) | 0;
    for (let n = 2, c = 0; c < 64; n++) {
      let prime = true;
      for (let i = 2; i * i <= n; i++) if (n % i === 0) { prime = false; break; }
      if (!prime) continue;
      if (c < 8) H[c] = frac(Math.pow(n, 1 / 2));
      K[c] = frac(Math.pow(n, 1 / 3));
      c++;
    }
    const bytes = new TextEncoder().encode(text);
    const len = ((bytes.length + 9 + 63) >> 6) << 6;
    const m = new Uint8Array(len);
    m.set(bytes);
    m[bytes.length] = 0x80;
    const dv = new DataView(m.buffer);
    const bits = bytes.length * 8;
    dv.setUint32(len - 4, bits >>> 0);
    dv.setUint32(len - 8, Math.floor(bits / 4294967296));
    let h = H.slice();
    const w = new Int32Array(64);
    const rot = (x, r) => (x >>> r) | (x << (32 - r));
    for (let off = 0; off < len; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getInt32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) {
        const t1 = (hh + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      h = [a, b, c, d, e, f, g, hh].map((v, i) => (h[i] + v) | 0);
    }
    return h.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
  }

  async function sha256(text) {
    if (window.crypto && crypto.subtle) {
      try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
      } catch (e) { /* fall through to the JS version */ }
    }
    return sha256Fallback(text);
  }

  // "R.S. CSE-B", "r s cse b" and "RS CSEB" are the same answer. Nothing else is "close".
  function normalise(s) {
    return String(s || '')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/\b(a|an|the)\b/g, ' ')
      .replace(/[^\p{L}\p{N}]+/gu, '');
  }
  const hashSecret = (salt, secret) => sha256(salt + ':' + normalise(secret));

  /* ---------- contact filter (principle 1: contact never travels) ---------- */

  function contactLeak(text) {
    const t = String(text || '');
    if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(t)) return 'an email address';
    if (/(https?:\/\/|www\.|wa\.me|t\.me|\b[\w-]+\.(com|in|org|net|me|io|co|ly)\b)/i.test(t)) return 'a link';
    if (/\d{7,}/.test(t.replace(/[\s().+-]/g, ''))) return 'a phone number';
    if (/(^|\s)@[a-z0-9_.]{3,}/i.test(t)) return 'a social handle';
    if (/\b(insta(gram)?|whats ?app|snap(chat)?|telegram|signal)\b/i.test(t)) return 'a social handle';
    if (/\broom\s*(no\.?|number|#)?\s*\d+/i.test(t) || /कमरा\s*\d+/.test(t)) return 'a room number';
    return null;
  }

  /* ---------- state ---------- */

  let state = null;
  let storageOk = true;

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      storageOk = true;
      return true;
    } catch (e) {
      storageOk = false;
      return false;
    }
  }

  function log(actorId, action, itemId, detail) {
    state.log.unshift({ at: Date.now(), actorId, action, itemId: itemId || null, detail: detail || '' });
    if (state.log.length > 400) state.log.length = 400;
  }

  function alertUser(userId, itemId, text, kind) {
    if (state.alerts.some((a) => a.userId === userId && a.itemId === itemId && a.kind === kind)) return;
    state.alerts.unshift({ id: uid('al'), userId, itemId, text, kind: kind || 'info', at: Date.now(), read: false });
  }

  function newSerial() {
    let s;
    do s = String(1000 + randomInt(9000));
    while (state && state.items.some((i) => i.serial === s));
    return s;
  }

  function newAliasNumber() {
    let n;
    do n = String(1000 + randomInt(9000));
    while (state && state.users.some((u) => u.aliasNo === n));
    return n;
  }

  /* ---------- seed (all marked sample; listed in README for the human to confirm) ---------- */

  async function seed() {
    const t = today();
    const users = [
      { id: 'u-aman', demoName: 'Aman (finder in scenario 1)', email: 'aman.k@' + COLLEGE_DOMAIN, aliasNo: '4410', role: 'student', roll: '22CSE017' },
      { id: 'u-riya', demoName: 'Riya (owner in scenario 1)', email: 'riya.s@' + COLLEGE_DOMAIN, aliasNo: '1170', role: 'student', roll: '22CSE041' },
      { id: 'u-stranger', demoName: 'A stranger trying to claim', email: 'guess.who@' + COLLEGE_DOMAIN, aliasNo: '2290', role: 'student', roll: '23ECE102' },
      { id: 'u-kabir', demoName: 'Kabir (lost umbrella, scenario 3)', email: 'kabir.m@' + COLLEGE_DOMAIN, aliasNo: '3306', role: 'student', roll: '22ME118' },
      { id: 'u-ishaan', demoName: 'Ishaan (owner of the steel bottle)', email: 'ishaan.r@' + COLLEGE_DOMAIN, aliasNo: '5530', role: 'student', roll: '21CIV009' },
      { id: 'u-desk', demoName: 'Security desk, main gate', email: 'security@' + COLLEGE_DOMAIN, aliasNo: '0001', role: 'desk', roll: '' }
    ].map((u) => Object.assign({ strikes: 0, suspended: false, failDays: {}, createdAt: Date.now() }, u));

    // [serial, category, zone, day offset, colour, note, drawing mark (private), answer, finder, extra]
    const rows = [
      ['3172', 'bottle', 'library', 0, 'silver', 'Steel bottle left on a reading-room table, second floor.', 'mountain', 'mountain sticker', 'u-aman'],
      ['5604', 'bag', 'canteen', -1, 'navy', 'Navy backpack under the corner table after lunch.', 'pendrive', 'blue pen drive', 'u-kabir'],
      ['2918', 'earphones', 'busstop', 0, 'white', 'White earbuds case on the bench by the bus shelter.', 'AK', 'AK', 'u-riya'],
      ['7745', 'book', 'lab', -2, 'brown', 'Lab record in a brown-paper cover, left in the physics lab.', 'cat', 'a cat', 'u-ishaan'],
      ['6031', 'clothing', 'ground', -3, 'grey', 'Plain grey hoodie on the steps after evening football.', '', '', 'u-riya', { noMark: true }],
      ['8810', 'other', 'hostel', -1, 'silver', 'Steel lunch box with a clip lid, on the hostel gate ledge.', 'M', 'M', 'u-ishaan', { otherLabel: 'Steel lunch box' }],
      ['4402', 'idcard', 'canteen', 0, 'blue', 'Handed in by canteen staff.', '', '', 'u-desk', { sensitive: true, status: 'at-desk', rollOnItem: '22ME118' }],
      ['1209', 'umbrella', 'library', -31, 'blue', 'Blue folding umbrella from the library entrance stand.', 'strap', 'yellow strap', 'u-kabir', { expire: true }]
    ];

    const items = [];
    for (const r of rows) {
      const [serial, category, zone, off, colour, note, mark, answer, finderId, extra = {}] = r;
      const salt = digits(12);
      const foundOn = addDays(t, off);
      const cat = CATEGORIES.find((c) => c.id === category);
      items.push({
        id: 'it-' + serial, serial, finderId, category, zone, route: '', foundOn, colour,
        otherLabel: extra.otherLabel || '',
        note, photoBlurred: null, photoOriginal: null, photoW: 0, photoH: 0,
        drawing: { kind: category, mark },
        question: extra.noMark || extra.sensitive ? '' : cat.q,
        salt, answerHash: answer ? await hashSecret(salt, answer) : '',
        noMark: !!extra.noMark, sensitive: !!extra.sensitive, rollOnItem: extra.rollOnItem || '',
        status: extra.status || 'posted',
        expiresOn: addDays(foundOn, POST_DAYS),
        claimId: null, createdAt: Date.now() + off * DAY, closedAt: null, sample: true, postSeconds: null
      });
    }

    state = {
      version: 1, seededOn: t, session: { userId: null },
      users, items, lost: [], claims: [], handovers: [], ownerCodes: {}, messages: [],
      alerts: [], reports: [], blocks: [], thanks: [], log: []
    };

    // Scenario 3: Kabir lost a black umbrella on the college bus three days ago.
    state.lost.push({
      id: 'lr-kabir', ownerId: 'u-kabir', category: 'umbrella', zone: 'transport',
      dateFrom: addDays(t, -3), dateTo: addDays(t, -2), colour: 'black',
      notes: 'Left it on route 4 in the evening. Wooden handle.', status: 'open', createdAt: Date.now() - 3 * DAY, sample: true
    });

    // Scenario 2: the ID card goes straight to the desk; only the matching roll number is alerted.
    alertUser('u-kabir', 'it-4402',
      'An ID card that may be yours was handed in at the Security desk, main gate. The desk checks who you are in person before handing it over.', 'sensitive');
    log('u-desk', 'Walk-in intake: ID card (sensitive, kept off the feed)', 'it-4402', 'Handed in by canteen staff');

    // A case already in progress so the desk has a handover today.
    const bottle = items.find((i) => i.serial === '3172');
    const claim = { id: 'cl-3172', itemId: bottle.id, claimantId: 'u-ishaan', attempts: { [t]: 1 }, verifiedAt: Date.now() - 5 * HOUR, status: 'verified', note: '' };
    state.claims.push(claim);
    bottle.claimId = claim.id;
    bottle.status = 'scheduled';
    const at = keyToDate(t);
    at.setHours(16, 0, 0, 0);
    const code = digits(4);
    const codeSalt = digits(12);
    const h = {
      id: 'ho-3172', itemId: bottle.id, claimId: claim.id, spot: 'library', scheduledAt: at.getTime(),
      proposedBy: 'u-ishaan', accepted: true, codeSalt, codeHash: await hashSecret(codeSalt, code),
      validUntil: at.getTime() + CODE_VALID_H * HOUR, codeTries: 0, confirmedBy: null, confirmedAt: null
    };
    state.handovers.push(h);
    state.ownerCodes[h.id] = code;
    const m0 = Date.now() - 5 * HOUR;
    state.messages.push(
      { id: uid('m'), itemId: bottle.id, claimId: claim.id, fromId: null, kind: 'system', at: m0, text: 'Owner #5530 answered the secret question. This chat is open to the two of you only.' },
      { id: uid('m'), itemId: bottle.id, claimId: claim.id, fromId: 'u-ishaan', kind: 'text', at: m0 + 4 * 60000, text: 'That is mine, thank you! Library counter at 4 pm today?' },
      { id: uid('m'), itemId: bottle.id, claimId: claim.id, fromId: 'u-aman', kind: 'text', at: m0 + 9 * 60000, text: 'Works for me. I have a class till 3:45.' },
      { id: uid('m'), itemId: bottle.id, claimId: claim.id, fromId: null, kind: 'system', at: m0 + 10 * 60000, text: 'Handover booked: Library counter, today at 4:00 pm. The owner holds the code.' }
    );
    log('u-ishaan', 'Claim verified by secret question', bottle.id);
    log('u-aman', 'Handover booked: Library counter', bottle.id);
  }

  /* ---------- housekeeping on every load ---------- */

  function housekeeping() {
    const t = today();
    for (const it of state.items) {
      // F13: a found post stays 30 days, then the desk decides.
      if (it.status === 'posted' && it.expiresOn < t) {
        it.status = 'expired';
        log('system', 'Post expired after ' + POST_DAYS + ' days; moved to the desk queue', it.id);
      }
    }
    // Privacy model: chat deleted 30 days after the case closes.
    const closedLong = new Set(state.items.filter((i) => i.closedAt && Date.now() - i.closedAt > CHAT_KEEP_DAYS * DAY).map((i) => i.id));
    if (closedLong.size) state.messages = state.messages.filter((m) => !closedLong.has(m.itemId));
  }

  /* ---------- lookups ---------- */

  const user = (id) => state.users.find((u) => u.id === id) || null;
  const me = () => (state.session.userId ? user(state.session.userId) : null);
  const cat = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 5];
  const zone = (id) => ZONES.find((z) => z.id === id) || ZONES[0];
  const colour = (id) => COLOURS.find((c) => c.id === id) || null;
  const spot = (id) => SPOTS.find((s) => s.id === id) || SPOTS[0];
  const itemBySerial = (s) => state.items.find((i) => i.serial === s) || null;
  const itemById = (id) => state.items.find((i) => i.id === id) || null;
  const claimById = (id) => state.claims.find((c) => c.id === id) || null;
  // "Other" items and reports carry the person's own words for what it is.
  const itemName = (x) => (x && x.category === 'other' && x.otherLabel ? x.otherLabel : cat(x.category).en);
  const caseClaim = (it) => (it && it.claimId ? claimById(it.claimId) : null);
  const handoverFor = (it) => state.handovers.filter((h) => h.itemId === it.id && h.claimId === it.claimId).slice(-1)[0] || null;

  function publicItems() {
    return state.items.filter((i) => !i.sensitive && ['posted', 'claimed', 'scheduled'].includes(i.status));
  }

  function aliasOf(u) {
    if (!u) return 'Unknown';
    return u.role === 'desk' ? 'Security desk' : 'Student #' + u.aliasNo;
  }
  // Inside a case: "Finder #<serial>" and "Owner #<alias>" (privacy model table).
  function caseAlias(it, userId) {
    if (!userId) return 'Kho-Paya';
    const u = user(userId);
    if (u && u.role === 'desk') return 'Security desk';
    if (userId === it.finderId) return 'Finder #' + it.serial;
    return 'Owner #' + (u ? u.aliasNo : '????');
  }

  function canSeeCase(it, u) {
    if (!u || !it.claimId) return false;
    const c = caseClaim(it);
    return u.role === 'desk' || u.id === it.finderId || (c && c.claimantId === u.id);
  }

  /* ---------- F1 sign-in (simulated OTP) ---------- */

  const pendingOtp = {};
  function requestOtp(email) {
    email = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) return { error: 'Type your full college email, like name@' + COLLEGE_DOMAIN + '.' };
    if (!email.endsWith('@' + COLLEGE_DOMAIN)) return { error: 'Only @' + COLLEGE_DOMAIN + ' addresses can sign in.' };
    const code = digits(6);
    pendingOtp[email] = { code, until: Date.now() + 10 * 60000 };
    return { code, email };
  }
  function verifyOtp(email, code) {
    email = String(email || '').trim().toLowerCase();
    const p = pendingOtp[email];
    if (!p || Date.now() > p.until) return { error: 'That code has expired. Send a new one.' };
    if (String(code).trim() !== p.code) return { error: 'That code is not right. Check the email and try again.' };
    delete pendingOtp[email];
    let u = state.users.find((x) => x.email === email);
    if (!u) {
      u = { id: uid('u'), email, aliasNo: newAliasNumber(), role: 'student', roll: '', strikes: 0, suspended: false, failDays: {}, createdAt: Date.now() };
      state.users.push(u);
      log(u.id, 'Signed up; alias given', null);
    }
    state.session.userId = u.id;
    save();
    return { user: u };
  }
  function signInAs(id) {
    if (!user(id)) return;
    state.session.userId = id;
    save();
  }
  function signOut() {
    state.session.userId = null;
    save();
  }

  /* ---------- F9 matching ---------- */

  function sharesWord(a, b) {
    if (!a || !b) return true;
    const words = (t) => String(t).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2);
    const wb = words(b);
    return words(a).some((w) => wb.includes(w));
  }
  function matchScore(lr, it) {
    let s = 0;
    if (lr.category === it.category && (lr.category !== 'other' || sharesWord(lr.otherLabel, it.otherLabel))) s++;
    if (lr.zone === it.zone || (NEIGHBOURS[lr.zone] || []).includes(it.zone)) s++;
    if (it.foundOn >= lr.dateFrom && it.foundOn <= addDays(lr.dateTo, 2)) s++;
    if (lr.colour && it.colour && lr.colour === it.colour) s++;
    return s;
  }
  function matchItem(it) {
    let n = 0;
    for (const lr of state.lost) {
      if (lr.status !== 'open' || lr.ownerId === it.finderId) continue;
      if (matchScore(lr, it) >= 3) {
        const where = it.sensitive ? 'It is being held at the Security desk, main gate.' : 'Open the tag and answer its question to claim it.';
        alertUser(lr.ownerId, it.id, 'A found ' + itemName(it).toLowerCase() + ' from ' + zone(it.zone).en + ' matches your lost report. ' + where, 'match');
        n++;
      }
    }
    return n;
  }
  function matchLost(lr) {
    let n = 0;
    for (const it of state.items) {
      if (it.finderId === lr.ownerId) continue;
      if (!['posted', 'at-desk', 'expired'].includes(it.status)) continue;
      if (matchScore(lr, it) >= 3) {
        const where = it.sensitive || it.status !== 'posted' ? 'It is being held at the Security desk, main gate.' : 'Open the tag and answer its question to claim it.';
        alertUser(lr.ownerId, it.id, 'A found ' + itemName(it).toLowerCase() + ' from ' + zone(it.zone).en + ' matches your lost report. ' + where, 'match');
        n++;
      }
    }
    return n;
  }

  // F10: a sensitive item alerts only the student whose roll number is printed on it.
  function alertRoll(it) {
    const roll = String(it.rollOnItem || '').toUpperCase().replace(/\s+/g, '');
    if (!roll) return 0;
    const u = state.users.find((x) => x.roll && x.roll.toUpperCase() === roll);
    if (!u) return 0;
    alertUser(u.id, it.id, 'A ' + itemName(it).toLowerCase() + ' that may be yours was handed in at the Security desk, main gate. The desk checks who you are in person before handing it over.', 'sensitive');
    return 1;
  }

  /* ---------- F2, F3 post found ---------- */

  async function postFound(f, u) {
    const c = cat(f.category);
    const salt = digits(12);
    const it = {
      id: uid('it'), serial: newSerial(), finderId: u.id, category: c.id, zone: f.zone,
      otherLabel: c.id === 'other' ? String(f.otherLabel || '').trim().slice(0, 40) : '',
      route: f.zone === 'transport' ? String(f.route || '').slice(0, 12) : '',
      foundOn: f.foundOn || today(), colour: f.colour || '', note: String(f.note || '').slice(0, 140),
      photoBlurred: f.photoBlurred || null, photoOriginal: f.photoOriginal || null, photoW: f.photoW || 0, photoH: f.photoH || 0,
      drawing: f.photoBlurred ? null : { kind: c.id, mark: '' },
      question: '', salt, answerHash: '', noMark: false, sensitive: !!c.sensitive, rollOnItem: '',
      status: 'posted', expiresOn: '', claimId: null, createdAt: Date.now(), closedAt: null, sample: false,
      postSeconds: f.postSeconds || null
    };
    it.expiresOn = addDays(it.foundOn, POST_DAYS);
    if (c.sensitive) {
      it.status = 'at-desk';
      it.rollOnItem = String(f.rollOnItem || '').slice(0, 40);
    } else if (f.noMark) {
      it.noMark = true;
    } else {
      it.question = String(f.question || c.q).slice(0, 120);
      it.answerHash = await hashSecret(salt, f.answer);
    }
    state.items.unshift(it);
    log(u.id, c.sensitive ? 'Sensitive item logged for the desk (kept off the feed)' : 'Found post published' + (it.noMark ? ' (no unique mark: desk checks claims)' : ''), it.id,
      it.postSeconds ? 'Posted in ' + it.postSeconds + ' s' : '');
    const matched = matchItem(it) + (c.sensitive ? alertRoll(it) : 0);
    if (!save()) {
      state.items.shift();
      return { error: 'This browser is out of storage space. Try a smaller photo, or reset the demo.' };
    }
    return { item: it, matched };
  }

  /* ---------- F8 lost report ---------- */

  function fileLost(f, u) {
    const lr = {
      id: uid('lr'), ownerId: u.id, category: f.category, zone: f.zone,
      otherLabel: f.category === 'other' ? String(f.otherLabel || '').trim().slice(0, 40) : '',
      dateFrom: f.dateFrom, dateTo: f.dateTo < f.dateFrom ? f.dateFrom : f.dateTo,
      colour: f.colour || '', notes: String(f.notes || '').slice(0, 300), status: 'open', createdAt: Date.now()
    };
    state.lost.unshift(lr);
    log(u.id, 'Private lost report filed', null, itemName(lr));
    const matched = matchLost(lr);
    save();
    return { report: lr, matched };
  }
  function closeLost(id, u) {
    const lr = state.lost.find((l) => l.id === id && l.ownerId === u.id);
    if (lr) { lr.status = 'closed'; save(); }
  }

  /* ---------- F5 claim ---------- */

  function attemptsLeft(it, u) {
    const c = state.claims.find((x) => x.itemId === it.id && x.claimantId === u.id);
    const used = c ? c.attempts[today()] || 0 : 0;
    return Math.max(0, ATTEMPTS_PER_DAY - used);
  }
  function claimOf(it, u) {
    return u ? state.claims.find((x) => x.itemId === it.id && x.claimantId === u.id) || null : null;
  }
  function ensureClaim(it, u) {
    let c = claimOf(it, u);
    if (!c) {
      c = { id: uid('cl'), itemId: it.id, claimantId: u.id, attempts: {}, verifiedAt: null, status: 'open', note: '' };
      state.claims.push(c);
    }
    return c;
  }

  function strikeCheck(u) {
    // Guessing across items: failures on three different items in one day add a strike.
    const t = today();
    const list = u.failDays[t] || [];
    if (list.length >= 3 && !list.includes('strike')) {
      list.push('strike');
      u.strikes++;
      log(u.id, 'Strike added: failed answers on three items in one day', null);
      if (u.strikes >= STRIKES_TO_SUSPEND) { u.suspended = true; log('system', 'Account suspended after repeated strikes', null, aliasOf(u)); }
    }
    u.failDays = { [t]: list };
  }

  async function tryClaim(it, u, answer) {
    if (attemptsLeft(it, u) <= 0) return { error: 'none-left' };
    const c = ensureClaim(it, u);
    const t = today();
    c.attempts[t] = (c.attempts[t] || 0) + 1;
    const ok = (await hashSecret(it.salt, answer)) === it.answerHash;
    if (!ok) {
      const list = u.failDays[t] || [];
      if (!list.includes(it.id)) list.push(it.id);
      u.failDays[t] = list;
      strikeCheck(u);
      log(u.id, 'Claim attempt: not a match', it.id);
      save();
      return { ok: false, left: attemptsLeft(it, u) };
    }
    c.verifiedAt = Date.now();
    const first = !it.claimId;
    c.status = first ? 'verified' : 'queued';
    if (first) {
      it.claimId = c.id;
      it.status = 'claimed';
      sysMessage(it, caseAlias(it, u.id) + ' answered the secret question. This chat is open to the two of you only.');
      alertUser(it.finderId, it.id, 'Someone answered the question on #' + it.serial + '. The masked chat is open.', 'claim');
    } else {
      alertUser(it.finderId, it.id, 'A second person also answered #' + it.serial + ' correctly. They are queued. If you doubt the first claim, ask the desk to check.', 'queued');
    }
    log(u.id, first ? 'Claim verified by secret question' : 'Second correct answer; claimant queued', it.id);
    save();
    return { ok: true, queued: !first };
  }

  // No unique mark, or "I forgot the detail": the desk checks in person (edge cases).
  function deskClaim(it, u, note, reason) {
    const c = ensureClaim(it, u);
    if (c.status === 'verified') return c;
    c.status = 'desk';
    c.note = String(note || '').slice(0, 300);
    c.reason = reason;
    log(u.id, 'Claim sent to the desk: ' + reason, it.id);
    save();
    return c;
  }

  /* ---------- F6 masked chat ---------- */

  function sysMessage(it, text) {
    state.messages.push({ id: uid('m'), itemId: it.id, claimId: it.claimId, fromId: null, kind: 'system', at: Date.now(), text });
  }
  const caseMessages = (it) => state.messages.filter((m) => m.itemId === it.id && m.claimId === it.claimId);
  const isBlocked = (it) => state.blocks.some((b) => b.claimId === it.claimId);
  const isClosed = (it) => ['returned', 'donated', 'disposed', 'removed'].includes(it.status);

  function sendMessage(it, u, text) {
    text = String(text || '').trim();
    if (!text) return { error: 'Type a message first.' };
    if (text.length > 400) return { error: 'Keep it under 400 characters.' };
    if (u.suspended) return { error: 'Your account is suspended. Talk to the security desk.' };
    if (isClosed(it)) return { error: 'This case is closed, so the chat is locked.' };
    if (isBlocked(it)) return { error: 'This chat is blocked. The desk will finish the handover.' };
    const leak = contactLeak(text);
    if (leak) return { error: 'Not sent. It looks like ' + leak + '. Contact stays inside this chat; pick a safe spot below instead.' };
    state.messages.push({ id: uid('m'), itemId: it.id, claimId: it.claimId, fromId: u.id, kind: 'text', at: Date.now(), text });
    save();
    return { ok: true };
  }

  function reportChat(it, u, reason) {
    const c = caseClaim(it);
    const against = u.id === it.finderId ? c.claimantId : it.finderId;
    const last = caseMessages(it).filter((m) => m.fromId === against).slice(-1)[0];
    state.reports.unshift({ id: uid('rp'), itemId: it.id, claimId: it.claimId, byId: u.id, againstId: against, reason: String(reason || '').slice(0, 200), excerpt: last ? last.text : '', at: Date.now(), status: 'open' });
    log(u.id, 'Chat reported to the desk', it.id);
    save();
  }
  function blockChat(it, u) {
    if (!isBlocked(it)) state.blocks.push({ claimId: it.claimId, byId: u.id, at: Date.now() });
    sysMessage(it, 'This chat was blocked. The security desk will finish the handover.');
    reportChat(it, u, 'Blocked from the chat');
  }

  function askDesk(it, u) {
    const c = caseClaim(it);
    c.status = 'dispute';
    sysMessage(it, 'The finder asked the desk to check this claim. The desk may ask the owner for a second detail.');
    log(u.id, 'Finder asked the desk to check the claim', it.id);
    save();
  }

  /* ---------- F7 handover ---------- */

  function proposeHandover(it, u, spotId, day, hour) {
    const s = spot(spotId);
    hour = Number(hour);
    if (hour < s.open || hour >= s.close) return { error: s.en + ' is open ' + s.open + ':00 to ' + s.close + ':00.' };
    const at = keyToDate(day);
    at.setHours(hour, 0, 0, 0);
    if (at.getTime() < Date.now() - HOUR) return { error: 'Pick a time that has not passed.' };
    state.handovers = state.handovers.filter((h) => !(h.itemId === it.id && h.claimId === it.claimId && !h.accepted));
    const h = { id: uid('ho'), itemId: it.id, claimId: it.claimId, spot: s.id, scheduledAt: at.getTime(), proposedBy: u.id, accepted: false, codeSalt: '', codeHash: '', validUntil: 0, codeTries: 0, confirmedBy: null, confirmedAt: null };
    state.handovers.push(h);
    sysMessage(it, caseAlias(it, u.id) + ' proposed ' + s.en + ', ' + fmtWhen(h.scheduledAt) + '.');
    log(u.id, 'Handover proposed: ' + s.en, it.id);
    save();
    return { handover: h };
  }

  async function acceptHandover(it, u) {
    const h = handoverFor(it);
    if (!h || h.accepted) return;
    const code = digits(4);
    h.codeSalt = digits(12);
    h.codeHash = await hashSecret(h.codeSalt, code);
    h.accepted = true;
    h.validUntil = h.scheduledAt + CODE_VALID_H * HOUR;
    // In the pilot the plain code exists only on the owner's phone; the server keeps the hash.
    state.ownerCodes[h.id] = code;
    it.status = 'scheduled';
    sysMessage(it, 'Handover booked: ' + spot(h.spot).en + ', ' + fmtWhen(h.scheduledAt) + '. The owner holds the code.');
    log(u.id, 'Handover booked: ' + spot(h.spot).en, it.id);
    save();
  }

  async function confirmCode(it, u, code) {
    const h = handoverFor(it);
    if (!h || !h.accepted) return { error: 'Book a handover first.' };
    if (Date.now() > h.validUntil) return { error: 'This code has expired (valid 24 hours). Book a new time.' };
    if (h.codeTries >= 5) return { error: 'Too many wrong codes. Bring the item to the security desk.' };
    if (!/^\d{4}$/.test(String(code).trim())) return { error: 'The code is 4 digits.' };
    if ((await hashSecret(h.codeSalt, code)) !== h.codeHash) {
      h.codeTries++;
      log(u.id, 'Wrong handover code entered', it.id);
      save();
      return { error: 'That code does not match. Ask the owner to read it from their screen.' };
    }
    h.confirmedBy = u.id;
    h.confirmedAt = Date.now();
    it.status = 'returned';
    it.closedAt = Date.now();
    delete state.ownerCodes[h.id];
    const c = caseClaim(it);
    if (c) c.status = 'returned';
    sysMessage(it, 'Returned at ' + spot(h.spot).en + '. Code checked by ' + caseAlias(it, u.id) + '. This chat is now locked and will be deleted after 30 days.');
    log(u.id, 'Handover confirmed with one-time code at ' + spot(h.spot).en, it.id, 'Collected by ' + aliasOf(user(c.claimantId)));
    alertUser(c.claimantId, it.id, '#' + it.serial + ' is marked returned. You can leave the finder a thank-you note.', 'returned');
    save();
    return { ok: true };
  }

  function thank(it, u, text) {
    text = String(text || '').trim();
    if (!text) return { error: 'Write a line first.' };
    const leak = contactLeak(text);
    if (leak) return { error: 'Not sent. It looks like ' + leak + '. Thank-you notes stay anonymous too.' };
    state.thanks.push({ itemId: it.id, fromId: u.id, toId: it.finderId, text: text.slice(0, 200), at: Date.now() });
    alertUser(it.finderId, it.id, 'The owner of #' + it.serial + ' left you a thank-you note.', 'thanks');
    log(u.id, 'Thank-you note sent to the finder', it.id);
    save();
    return { ok: true };
  }

  /* ---------- F11, F12, F13 desk ---------- */

  function deskApproveClaim(c, desk) {
    const it = itemById(c.itemId);
    const prev = it.claimId && it.claimId !== c.id ? claimById(it.claimId) : null;
    if (prev && prev.status !== 'rejected') prev.status = 'rejected';
    c.status = 'verified';
    c.verifiedAt = Date.now();
    it.claimId = c.id;
    if (it.status === 'posted' || it.status === 'claimed') it.status = 'claimed';
    sysMessage(it, 'The security desk checked this claim in person and opened this chat for ' + caseAlias(it, c.claimantId) + '.');
    alertUser(c.claimantId, it.id, 'The desk approved your claim on #' + it.serial + '. The masked chat is open.', 'desk-approved');
    log(desk.id, 'Desk approved claim after an in-person check', it.id);
    save();
  }
  function deskRejectClaim(c, desk) {
    const it = itemById(c.itemId);
    c.status = 'rejected';
    log(desk.id, 'Desk rejected claim', it.id);
    if (it.claimId === c.id) {
      it.claimId = null;
      it.status = 'posted';
      const next = state.claims.find((x) => x.itemId === it.id && x.status === 'queued');
      if (next) {
        next.status = 'verified';
        it.claimId = next.id;
        it.status = 'claimed';
        sysMessage(it, caseAlias(it, next.claimantId) + ' was next in the queue. This chat is open to the two of you only.');
        alertUser(next.claimantId, it.id, 'Your queued claim on #' + it.serial + ' is now active. The masked chat is open.', 'promoted');
      }
    }
    alertUser(c.claimantId, it.id, 'The desk could not confirm your claim on #' + it.serial + '.', 'desk-rejected');
    save();
  }
  function deskDecideExpired(it, desk, decision) {
    it.status = decision; // 'at-desk' | 'donated' | 'disposed'
    if (decision !== 'at-desk') it.closedAt = Date.now();
    log(desk.id, 'Expiry decision: ' + STATUS[decision].en, it.id);
    save();
  }
  function deskHandOver(it, desk, roll) {
    roll = String(roll || '').trim().toUpperCase();
    if (!roll) return { error: 'Type the roll number from the ID you checked.' };
    it.status = 'returned';
    it.closedAt = Date.now();
    log(desk.id, 'Collected at the desk after an in-person ID check', it.id, 'Roll ' + roll);
    save();
    return { ok: true };
  }
  async function deskIntake(f, desk) {
    return postFound(Object.assign({}, f, { noMark: true }), desk);
  }
  function deskReport(rp, desk, action) {
    rp.status = action;
    if (action === 'strike') {
      const u = user(rp.againstId);
      if (u) {
        u.strikes++;
        if (u.strikes >= STRIKES_TO_SUSPEND) { u.suspended = true; log('system', 'Account suspended after repeated strikes', null, aliasOf(u)); }
      }
      log(desk.id, 'Report upheld; strike added', rp.itemId);
    } else {
      log(desk.id, 'Report dismissed', rp.itemId);
    }
    save();
  }
  function deskRevealEmail(rp, desk) {
    const u = user(rp.againstId);
    log(desk.id, 'College email viewed for a dispute (audited)', rp.itemId, aliasOf(u));
    save();
    return u ? u.email : '';
  }
  function deskRemove(it, desk) {
    it.status = 'removed';
    it.closedAt = Date.now();
    log(desk.id, 'Post removed by moderation', it.id);
    save();
  }

  /* ---------- alerts ---------- */

  const alertsFor = (u) => (u ? state.alerts.filter((a) => a.userId === u.id) : []);
  const unread = (u) => alertsFor(u).filter((a) => !a.read).length;
  function markAlertsRead(u) {
    alertsFor(u).forEach((a) => (a.read = true));
    save();
  }

  /* ---------- formatting ---------- */

  function fmtDay(key) {
    const d = daysBetween(key, today());
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d > 1 && d < 7) return keyToDate(key).toLocaleDateString('en-IN', { weekday: 'long' });
    return keyToDate(key).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
  function fmtTime(ms) {
    return new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }
  function fmtWhen(ms) {
    return fmtDay(dayKey(ms)).replace(/^T/, 't').replace(/^Y/, 'y') + ' at ' + fmtTime(ms);
  }

  async function init() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { storageOk = false; }
    if (raw) {
      try { state = JSON.parse(raw); } catch (e) { state = null; }
    }
    if (!state || state.version !== 1) await seed();
    housekeeping();
    save();
  }
  async function reset() {
    try { localStorage.removeItem(KEY); } catch (e) { /* storage blocked: memory only */ }
    state = null;
    await seed();
    housekeeping();
    save();
  }

  window.KP = {
    get state() { return state; }, get storageOk() { return storageOk; },
    COLLEGE_DOMAIN, ATTEMPTS_PER_DAY, POST_DAYS, NO_SHOW_H, HOUR, DAY,
    ZONES, NEIGHBOURS, CATEGORIES, COLOURS, SPOTS, STATUS,
    init, reset, save, today, addDays, dayKey, daysBetween, fmtDay, fmtTime, fmtWhen,
    sha256, sha256Fallback, normalise, contactLeak,
    user, me, cat, itemName, zone, colour, spot, itemBySerial, itemById, claimById, caseClaim, handoverFor,
    publicItems, aliasOf, caseAlias, canSeeCase, claimOf, attemptsLeft,
    requestOtp, verifyOtp, signInAs, signOut,
    postFound, fileLost, closeLost, matchScore,
    tryClaim, deskClaim, caseMessages, isBlocked, isClosed, sendMessage, reportChat, blockChat, askDesk,
    proposeHandover, acceptHandover, confirmCode, thank,
    deskApproveClaim, deskRejectClaim, deskDecideExpired, deskHandOver, deskIntake, deskReport, deskRevealEmail, deskRemove,
    alertsFor, unread, markAlertsRead
  };
})();
