/* slop-ok:multiple-h1 each route renders exactly one <h1>; the file holds every screen.
   slop-ok:dead-link nav links are built as '#' + route path, never a bare '#'.
   slop-ok:reveal-everything "reveal" is the single un-blur moment on a correct answer, not scroll reveals. */
/* Kho-Paya views. Hash routes, one render function per screen (PRD: six screens plus lost report,
   alerts and privacy). Events are delegated from <main> through data-action and data-form. */
(function () {
  'use strict';

  const S = window.KP;
  const D = window.KPDraw;
  const view = document.getElementById('view');
  const toastEl = document.getElementById('toast');

  /* ---------- helpers ---------- */

  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const en = (o) => esc(o.en);
  const go = (path) => { location.hash = '#' + path; };
  const hourLabel = (h) => (h % 12 || 12) + ':00 ' + (h < 12 ? 'am' : 'pm');
  const tilt = (serial) => ((Number(serial) % 7) - 3) * 0.45;

  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4800);
  }

  let after = [];
  const later = (fn) => after.push(fn);
  let timers = [];

  function requireUser(next) {
    const u = S.me();
    if (!u) {
      go('/signin?next=' + encodeURIComponent(next));
      return null;
    }
    return u;
  }

  /* ---------- tag parts ---------- */

  function photo(it, reveal) {
    const name = S.itemName(it).toLowerCase();
    if (it.photoBlurred) {
      const src = reveal && it.photoOriginal ? it.photoOriginal : it.photoBlurred;
      const alt = 'Photo of the found ' + name + (reveal ? '' : ', with the identifying mark blurred by the finder');
      return '<img src="' + src + '" alt="' + esc(alt) + '" width="' + (it.photoW || 640) + '" height="' + (it.photoH || 480) + '">';
    }
    const kind = it.drawing ? it.drawing.kind : it.category;
    const label = 'Drawing of the found ' + name + (reveal ? '' : ', with the identifying mark hidden');
    return D.svg(kind, { reveal, mark: reveal && it.drawing ? it.drawing.mark : '', label });
  }

  function hiddenNote(it, reveal) {
    if (reveal) return '';
    if (it.noMark) return '<span class="hidden-note">No unique mark: the desk checks claims</span>';
    if (it.photoBlurred || D.hasMark(it.drawing ? it.drawing.kind : it.category)) return '<span class="hidden-note">Mark hidden by the finder</span>';
    return '';
  }

  function dayLine(it) {
    const d = S.fmtDay(it.foundOn);
    return esc(d);
  }

  function fields(it) {
    const c = S.cat(it.category), z = S.zone(it.zone), col = S.colour(it.colour);
    return '<dl class="tag-fields">' +
      '<div><dt>Category</dt><dd>' + en(c) + (it.otherLabel ? ': ' + esc(it.otherLabel) : '') + '</dd></div>' +
      '<div><dt>Zone</dt><dd>' + en(z) + (it.route ? ', route ' + esc(it.route) : '') + '</dd></div>' +
      (col ? '<div><dt>Colour</dt><dd>' + en(col) + '</dd></div>' : '') +
      '</dl>';
  }

  function statusStamp(it, cls) {
    if (it.status === 'posted') return '';
    const st = S.STATUS[it.status];
    const ok = it.status === 'returned' ? ' stamp-ok' : '';
    return '<p class="stamp stamp-status' + ok + ' ' + (cls || '') + '">' + esc(st.en) + '</p>';
  }

  function tag(it, opts) {
    opts = opts || {};
    const reveal = !!opts.reveal;
    return '<article class="tag' + (opts.cls ? ' ' + opts.cls : '') + '" style="--tilt:' + (opts.flat ? 0 : tilt(it.serial)) + 'deg"' + (opts.id ? ' id="' + opts.id + '"' : '') + '>' +
      '<div class="tag-edge"><div class="tag-body">' +
      '<span class="tag-hole" aria-hidden="true"></span>' +
      '<div class="tag-top"><p class="tag-serial">#' + esc(it.serial) + '</p><p class="tag-day">' + dayLine(it) + '</p></div>' +
      (opts.photoHTML || '<figure class="tag-photo">' + photo(it, reveal) + hiddenNote(it, reveal) + '</figure>') +
      fields(it) +
      (it.note ? '<p class="tag-note">' + esc(it.note) + '</p>' : '') +
      (it.sample ? '<p class="tag-sample">Sample post for the demo</p>' : '') +
      (opts.noStamp ? '' : statusStamp(it, 'stamp-overlay')) +
      (opts.stub ? '<div class="tag-stub">' + opts.stub + '</div>' : '') +
      '</div></div></article>';
  }

  // Picking "Other" asks for the person's own short name for the thing.
  function otherField(value, show, question, placeholder) {
    return '<div class="field" id="other-field"' + (show ? '' : ' hidden') + '><label for="other-label">' + question + '</label>' +
      '<input id="other-label" name="otherLabel" maxlength="40" autocomplete="off" value="' + esc(value) + '" placeholder="' + esc(placeholder) + '">' +
      '<p class="help">A short name, like you would say it to a friend. Not the mark you will hide.</p></div>';
  }

  function chipGroup(name, list, checked, o) {
    o = o || {};
    const type = o.type || 'radio';
    return '<div class="chips">' + list.map((x) =>
      '<label class="chip"><input type="' + type + '" name="' + name + '" value="' + esc(x.id) + '"' +
      (x.id === checked ? ' checked' : '') + (o.required ? ' required' : '') + '><span>' +
      (o.swatch && x.sw ? '<span class="swatch" style="background:' + x.sw + '"></span>' : '') +
      esc(x.en) + '</span></label>').join('') + '</div>';
  }

  /* ---------- header ---------- */

  function renderHeader(path) {
    const u = S.me();
    const links = [['/feed', 'Found feed'], ['/found/new', 'Post found'], ['/lost/new', 'Report lost']];
    if (u) links.push(['/mine', 'My tags'], ['/alerts', 'Alerts']);
    if (u && u.role === 'desk') links.push(['/desk', 'Desk']);
    const n = S.unread(u);
    let html = links.map(([p, label]) => {
      const cur = path === p || (p !== '/' && path.indexOf(p) === 0) ? ' aria-current="page"' : '';
      const badge = p === '/alerts' && n ? ' <span class="count" aria-label="' + n + ' unread">' + n + '</span>' : '';
      return '<li><a href="#' + p + '"' + cur + '>' + label + badge + '</a></li>';
    }).join('');
    html += u
      ? '<li><button type="button" data-global="signout">Sign out <span class="muted">' + esc(S.aliasOf(u)) + '</span></button></li>'
      : '<li><a href="#/signin"' + (path === '/signin' ? ' aria-current="page"' : '') + '>Sign in</a></li>';
    document.getElementById('nav-list').innerHTML = html;

    const sel = document.getElementById('demo-user');
    sel.innerHTML = '<option value="">Not signed in</option>' + S.state.users.map((x) =>
      '<option value="' + x.id + '"' + (u && u.id === x.id ? ' selected' : '') + '>' + esc(x.demoName || S.aliasOf(x)) + '</option>').join('');
  }

  /* ---------- home (screen 1) ---------- */

  const filters = { cat: 'all', zone: 'all', days: 'all', q: '' };

  function feedItems() {
    const t = S.today();
    return S.publicItems().filter((it) => {
      if (filters.cat !== 'all' && it.category !== filters.cat) return false;
      if (filters.zone !== 'all' && it.zone !== filters.zone) return false;
      const age = S.daysBetween(it.foundOn, t);
      if (filters.days === 'today' && age !== 0) return false;
      if (filters.days === 'week' && age > 6) return false;
      if (filters.q) {
        const hay = (it.note + ' ' + S.itemName(it) + ' ' + S.zone(it.zone).en + ' ' + it.colour + ' ' + it.serial).toLowerCase();
        if (hay.indexOf(filters.q.toLowerCase()) === -1) return false;
      }
      return true;
    }).sort((a, b) => (a.foundOn < b.foundOn ? 1 : a.foundOn > b.foundOn ? -1 : b.createdAt - a.createdAt));
  }

  function feedResults() {
    const items = feedItems();
    if (!items.length) {
      return '<div class="empty"><p>No found tags match these filters.</p>' +
        '<p>Found something here yourself? <a href="#/found/new">Post it</a>. Lost something? <a href="#/lost/new">File a private report</a> and you get an alert when it turns up.</p></div>';
    }
    const empty = [];
    const html = S.ZONES.map((z) => {
      const list = items.filter((i) => i.zone === z.id);
      if (!list.length) { empty.push(z.en); return ''; }
      return '<section class="zone" aria-labelledby="z-' + z.id + '">' +
        '<div class="zone-head"><h3 id="z-' + z.id + '">' + esc(z.en) + '</h3>' +
        '<span class="zone-count">' + list.length + (list.length === 1 ? ' tag' : ' tags') + '</span></div>' +
        '<ul class="rail" style="--n:' + list.length + '">' + list.map((it) =>
          '<li style="--tilt:' + tilt(it.serial) + 'deg"><a class="tag-link" href="#/item/' + it.serial + '">' + tag(it) + '</a></li>').join('') +
        '</ul></section>';
    }).join('');
    return '<div class="zones">' + html + '</div>' + (empty.length && filters.zone === 'all' ? '<p class="empty-zones">Nothing on the rail yet from ' + esc(empty.join(', ')) + '.</p>' : '');
  }

  /* Feed (screen 1): the two actions, then the tags grouped by zone. */
  function home() {
    const count = S.publicItems().length;
    const opt = (v, label, cur) => '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(label) + '</option>';
    return '<div class="page-head"><h1>Found on campus</h1><p>' + count + ' tags on the rail, grouped by where they were found. Details that prove ownership stay hidden.</p></div>' +
      '<div class="actions actions-row">' +
      '<a class="action" href="#/found/new"><span class="action-en">I found something</span><span class="action-sub">Post it in under a minute. Your number stays with you.</span></a>' +
      '<a class="action action-lost" href="#/lost/new"><span class="action-en">I lost something</span><span class="action-sub">File a private report. You get an alert when a matching tag goes up.</span></a>' +
      '</div>' +
      '<section class="feed" aria-label="Found tags">' +
      '<form class="filters" data-form="filters" role="search" aria-label="Filter found tags">' +
      '<label>Search the notes<input type="search" name="q" value="' + esc(filters.q) + '" placeholder="steel, navy, bench…"></label>' +
      '<label>Category<select name="cat">' + opt('all', 'All categories', filters.cat) + S.CATEGORIES.filter((c) => !c.sensitive).map((c) => opt(c.id, c.en, filters.cat)).join('') + '</select></label>' +
      '<label>Zone<select name="zone">' + opt('all', 'All zones', filters.zone) + S.ZONES.map((z) => opt(z.id, z.en, filters.zone)).join('') + '</select></label>' +
      '<label>Found<select name="days">' + opt('all', 'Any day', filters.days) + opt('today', 'Today', filters.days) + opt('week', 'In the last 7 days', filters.days) + '</select></label>' +
      '</form>' +
      '<div id="feed-results" aria-live="polite">' + feedResults() + '</div>' +
      '</section>';
  }

  /* ---------- landing: the whole page is one lost-property tag ---------- */

  // The PRD's sample story (scenario 1). The page compares hashes, like the real claim does.
  const TRY = { answer: 'R.S. CSE-B', salt: 'landing-4821', hash: '', left: 3, done: false };
  S.sha256(TRY.salt + ':' + S.normalise(TRY.answer)).then((h) => { TRY.hash = h; });

  const LEDGER = [
    ['The finder’s number goes to every member.', 'Posts have no contact fields. You talk as Finder #4821 and Owner #1170, and the chat locks when the case closes.'],
    ['The post says exactly what to describe, so anyone can claim it.', 'The finder blurs the mark and asks about it. The answer is stored hashed and never shown.'],
    ['Strangers meet in hostel corridors.', 'Handovers happen only at the Security desk or the Library counter, during open hours.'],
    ['ID cards and wallets are posted for everyone to see.', 'ID cards, wallets, phones and keys never reach the feed. Only the student whose roll number matches gets an alert.'],
    ['Nobody knows who took what.', 'The owner shows a 4-digit code and the finder or the desk types it in. The register keeps who, what, when and where.'],
    ['A post is buried within hours.', 'A private lost report waits for you, and alerts you when a matching tag goes up.']
  ];

  function tryPips() {
    let p = '<span id="try-left">' + TRY.left + ' of 3 tries left</span>';
    for (let i = 0; i < 3; i++) p += '<span class="attempt-pip' + (i >= TRY.left ? ' used' : '') + '" aria-hidden="true"></span>';
    return p;
  }

  function landing() {
    TRY.left = 3;
    TRY.done = false;
    const count = S.publicItems().length;
    const rules = [
      ['Contact', 'Messages travel. Contact never does.', 'You talk as Finder #4821 and Owner #1170. Phone numbers, emails, links and room numbers are refused before they send, and the chat locks when the case closes.'],
      ['Photo', 'Enough to recognise, never enough to fake.', 'The feed shows the category, the zone, the day and a blurred photo. The telling detail stays hidden, and its answer is kept only as a hash.'],
      ['Handover', 'A verified event, not a meeting.', 'Only at the Security desk or the Library counter, during open hours. The owner shows a 4-digit code, and the finder or the desk types it in.']
    ];
    const steps = [
      ['Posted', 'The finder photographs it, blurs the mark and writes one question about it. Under a minute, from a phone.'],
      ['Verified', 'The owner names the hidden detail. Three tries a day, and a wrong answer only ever says “Not a match”.'],
      ['Chat', 'Finder and owner agree a safe spot as aliases. Text only, no numbers.'],
      ['Returned', 'At the spot, the owner’s 4-digit code closes the case and writes it to the desk register.']
    ];
    const roles = [
      ['Owner', 'Never seeing it again, or someone else claiming it.', 'An alert when a matching tag goes up, and a question only you can answer.'],
      ['Finder', 'Their number going to strangers, or being blamed if it goes wrong.', 'A post in under a minute, an alias, and a code that proves the handover happened.'],
      ['Desk', 'Disputes, and handing an ID card to the wrong person.', 'A register of every claim, code and collection. ID cards never reach the feed.']
    ];
    return '<div class="landing">' +
      '<article class="lt" aria-labelledby="h1"><div class="lt-body">' +
      '<span class="lt-hole" aria-hidden="true"></span>' +
      '<div class="lt-top"><p class="lt-serial">#4821</p><p class="lt-name">Kho-Paya<span>Campus lost and found</span></p></div>' +

      '<section class="lt-hero">' +
      '<div class="lt-hero-copy"><h1 id="h1">The mark you hide is the key.</h1>' +
      '<p class="lead">A lost-and-found for campus where nobody’s phone number travels. The finder blurs the one detail that proves whose it is. The owner gets it back by naming that detail.</p>' +
      '<p class="btn-row"><a class="btn" href="#/found/new">I found something</a><a class="btn btn-line" href="#/lost/new">I lost something</a></p>' +
      '</div>' +

      '<form class="lt-try" data-form="try" aria-labelledby="try-h">' +
      '<h2 id="try-h">Is this calculator yours?</h2>' +
      '<figure class="tag-photo claim-photo" id="try-photo">' + D.svg('calculator', { label: 'Drawing of a found calculator, with the sticker on the back blurred' }) +
      '<div class="reveal-layer" id="try-layer"></div><span class="hidden-note">Mark hidden by the finder</span></figure>' +
      '<p class="question" id="try-q">What is written on the back?</p>' +
      '<div class="composer-row"><label class="visually-hidden" for="try-answer">Your answer</label>' +
      '<input id="try-answer" name="answer" autocomplete="off" maxlength="60" aria-describedby="try-q try-left" placeholder="Name the hidden detail">' +
      '<button class="btn" type="submit" id="try-btn">Check</button></div>' +
      '<div class="attempts" id="try-attempts">' + tryPips() + '</div>' +
      '<div class="verdict" id="try-verdict" aria-live="assertive"></div>' +
      '<p class="help" id="try-hint">Sample story: left in Lab 3 after the 2 pm practical. <button class="link-btn" type="button" data-action="try-hint">Play the owner</button></p>' +
      '</form></section>' +

      '<section class="lt-sec" aria-labelledby="rules-h"><h2 id="rules-h">Three rules on every tag</h2>' +
      '<dl class="lt-rules">' + rules.map(([k, a, b]) => '<div><dt>' + esc(k) + '</dt><dd><p class="lt-rule">' + esc(a) + '</p><p>' + esc(b) + '</p></dd></div>').join('') + '</dl></section>' +

      '<section class="lt-sec" aria-labelledby="route-h"><h2 id="route-h">How a tag gets home</h2>' +
      '<ol class="lt-steps">' + steps.map(([en, t], i) => '<li style="--tilt:' + [-1.2, 0.8, -0.6, 1.1][i] + 'deg"><p class="stamp' + (i === 3 ? ' stamp-ok' : '') + '">' + esc(en) + '</p><p>' + esc(t) + '</p></li>').join('') + '</ol></section>' +

      '<section class="lt-sec" aria-labelledby="old-h"><h2 id="old-h">Your number, 500 strangers</h2><p class="lead lt-sec-lead">Today a lost calculator means your number in a 500-member WhatsApp group.</p>' +
      '<div class="lt-compare">' +
      '<figure class="lt-post"><figcaption>How it is done today (illustration)</figcaption>' +
      '<blockquote><p>Found a calculator in Lab 3. Name on the back says <span class="lt-leak">R.S. CSE-B</span>. Whoever’s it is, call me on <span class="lt-leak">98XXX XXXXX</span></p></blockquote>' +
      '<p class="stamp lt-post-stamp">Not here</p></figure>' +
      '<table class="lt-ledger"><thead><tr><th scope="col">In the group</th><th scope="col">On Kho-Paya</th></tr></thead><tbody>' +
      LEDGER.map(([a, b]) => '<tr><td data-h="In the group">' + esc(a) + '</td><td data-h="On Kho-Paya">' + esc(b) + '</td></tr>').join('') +
      '</tbody></table></div></section>' +

      '<section class="lt-sec" aria-labelledby="roles-h"><h2 id="roles-h">Who it is for</h2>' +
      '<table class="lt-roles"><thead><tr><th scope="col"><span class="visually-hidden">Role</span></th><th scope="col">What they fear</th><th scope="col">What they get here</th></tr></thead><tbody>' +
      roles.map(([r, f, g]) => '<tr><th scope="row">' + esc(r) + '</th><td data-h="What they fear">' + esc(f) + '</td><td data-h="What they get here">' + esc(g) + '</td></tr>').join('') +
      '</tbody></table></section>' +

      '<a class="lt-stub" href="#/feed"><span class="lt-tear">Tear along the line</span>' +
      '<span class="lt-stub-main">Open Kho-Paya</span>' +
      '<span class="lt-stub-sub">' + count + ' found tags are on the rail right now</span></a>' +
      '</div></article></div>';
  }

  async function submitTry(f) {
    const input = f.answer;
    const verdict = document.getElementById('try-verdict');
    const answer = input.value.trim();
    if (TRY.done || TRY.left <= 0) return;
    if (!answer) { verdict.innerHTML = '<p class="error">Type an answer first.</p>'; input.focus(); return; }
    const ok = (await S.sha256(TRY.salt + ':' + S.normalise(answer))) === TRY.hash;
    if (!ok) {
      TRY.left--;
      document.getElementById('try-attempts').innerHTML = tryPips();
      verdict.innerHTML = '<p class="stamp">Not a match</p>';
      input.value = '';
      if (TRY.left > 0) { input.focus(); return; }
      input.disabled = true;
      document.getElementById('try-btn').disabled = true;
      verdict.insertAdjacentHTML('beforeend', '<p>Out of tries. In the app you would come back tomorrow, or verify at the desk. <button class="link-btn" type="button" data-action="try-reset">Start again</button></p>');
      return;
    }
    TRY.done = true;
    document.getElementById('try-layer').innerHTML = D.svg('calculator', { reveal: true, mark: TRY.answer, label: 'The calculator, sticker visible: R.S. CSE-B' });
    const fig = document.getElementById('try-photo');
    requestAnimationFrame(() => requestAnimationFrame(() => fig.classList.add('revealed')));
    input.disabled = true;
    document.getElementById('try-btn').hidden = true;
    verdict.innerHTML = '<p class="stamp stamp-ok">Verified</p>' +
      '<p>In the app, this opens a masked chat with Finder #4821. <a href="#/feed">See the real tags</a></p>';
  }

  /* ---------- sign in (F1, simulated) ---------- */

  let otp = null;
  function signin(q) {
    const next = q.get('next') || '/';
    const u = S.me();
    if (u) {
      return '<div class="page-head"><h1>You are signed in</h1><p>As ' + esc(S.aliasOf(u)) + '. Nobody else ever sees your college email.</p></div>' +
        '<p class="btn-row"><a class="btn" href="#' + esc(next) + '">Continue</a><button class="btn btn-line" type="button" data-global="signout">Sign out</button></p>';
    }
    const step2 = otp
      ? '<form class="panel" data-form="otp" data-next="' + esc(next) + '">' +
        '<div class="notice"><p><b>Simulated email.</b> In the pilot this code arrives at ' + esc(otp.email) + '. Here it is: <b>' + esc(otp.code) + '</b></p></div>' +
        '<div class="field"><label for="otp-code">6-digit code</label><input id="otp-code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required></div>' +
        '<p class="error" id="otp-err" role="alert"></p>' +
        '<p class="btn-row"><button class="btn" type="submit">Sign in</button><button class="link-btn" type="button" data-action="otp-restart">Use a different email</button></p></form>'
      : '<form class="panel" data-form="email">' +
        '<div class="field"><label for="email">College email</label><input id="email" name="email" type="email" autocomplete="email" required placeholder="name@' + esc(S.COLLEGE_DOMAIN) + '">' +
        '<p class="help">Only @' + esc(S.COLLEGE_DOMAIN) + ' addresses. Your email is used to sign in and is never shown to another student.</p></div>' +
        '<p class="error" id="email-err" role="alert"></p>' +
        '<p><button class="btn" type="submit">Send me a code</button></p></form>';
    return '<div class="page-head"><h1>Sign in with your college email</h1><p>You get an alias like Student #1170. That is all anyone else sees.</p></div>' +
      '<div class="split">' + step2 +
      '<div class="panel panel-tag"><h2>Demo accounts</h2><p>For the 90-second demo, sign in as one of the people from the PRD scenarios.</p><div class="btn-row">' +
      S.state.users.map((x) => '<button class="btn btn-line btn-small" type="button" data-action="demo-signin" data-id="' + x.id + '" data-next="' + esc(next) + '">' + esc(x.demoName) + '</button>').join('') +
      '</div></div></div>';
  }

  /* ---------- post found (screen 2, F2, F3, F10) ---------- */

  let pf = null;
  const ed = { orig: null, blur: null, mask: null, tmp: null, view: null, strokes: [], size: 'm', whole: false, active: null, raf: 0 };

  function freshPost() {
    pf = { step: 1, startedAt: Date.now(), hasPhoto: false, warned: false, f: { category: '', otherLabel: '', zone: '', foundOn: S.today(), colour: '', note: '', route: '', question: '', answer: '', noMark: false, rollOnItem: '' }, done: null };
    ed.orig = null; ed.strokes = []; ed.whole = false;
  }

  function elapsed() {
    const s = Math.round((Date.now() - pf.startedAt) / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function postFound() {
    const u = requireUser('/found/new');
    if (!u) return null;
    if (u.suspended) return suspended();
    if (!pf || pf.done) {
      if (pf && pf.done && pf.keepDone) { pf.keepDone = false; return postDone(); }
      freshPost();
    }
    const names = ['Photo', 'Details', 'Secret question'];
    const steps = '<ol class="steps" aria-label="Progress">' + names.map((n, i) =>
      '<li' + (pf.step === i + 1 ? ' aria-current="step"' : pf.step > i + 1 ? ' class="done"' : '') + '>Step ' + (i + 1) + ' of 3: ' + n + '</li>').join('') + '</ol>';
    const head = '<div class="page-head"><h1>I found something</h1>' +
      '<p>Three steps. No contact details are asked for, ever. <span class="timer" id="timer" aria-hidden="true">' + elapsed() + '</span></p></div>';
    later(() => {
      const t = setInterval(() => { const el = document.getElementById('timer'); if (el) el.textContent = elapsed(); }, 1000);
      timers.push(t);
    });
    let body = '';
    if (pf.step === 1) body = postStep1();
    if (pf.step === 2) body = postStep2();
    if (pf.step === 3) body = postStep3();
    return head + steps + body;
  }

  function postStep1() {
    if (!ed.orig && cam.on) {
      later(attachCamera);
      return '<div class="split"><div class="camera">' +
        '<video id="cam-video" autoplay playsinline muted aria-label="Camera viewfinder"></video>' +
        '<div class="btn-row"><button class="btn" type="button" data-action="camera-shoot">Take the photo</button>' +
        '<button class="btn btn-line" type="button" data-action="camera-flip">Switch camera</button>' +
        '<button class="link-btn" type="button" data-action="camera-close">Cancel</button></div>' +
        '<p class="error" id="photo-err" role="alert"></p></div>' +
        '<div class="panel panel-tag"><h2>Frame it plainly</h2><p>Fill the frame with the item, on a plain surface. Keep the mark in view: you blur it on the next screen, and the owner names it to claim.</p>' +
        '<p class="help">The camera turns off as soon as you take the photo or leave this step. Nothing is recorded.</p></div></div>';
    }
    if (!ed.orig) {
      return '<div class="split"><div class="drop">' +
        '<h2>Add a photo</h2><p>Take it so the item is clear. On the next screen you paint over the name, sticker or mark that proves whose it is.</p>' +
        '<div class="btn-row"><button class="btn" type="button" data-action="camera-open">Open the camera</button>' +
        '<label class="file-label"><span class="btn btn-line">Choose a photo</span><input type="file" accept="image/*" capture="environment" data-change="photo" aria-label="Choose a photo"></label>' +
        '<button class="btn btn-line" type="button" data-action="demo-photo">Use the demo calculator photo</button></div>' +
        '<button class="link-btn" type="button" data-action="skip-photo">No photo, post a drawing of the category instead</button>' +
        '<p class="error" id="photo-err" role="alert"></p></div>' +
        '<div class="panel panel-tag"><h2>What to hide</h2><ul class="prose"><li>Names, initials, roll numbers.</li><li>Stickers, doodles, scratches, dents.</li><li>Faces and anything printed on an ID.</li></ul><p>Whatever you hide becomes the question the owner must answer.</p></div></div>';
    }
    later(bindEditor);
    return '<div class="split"><div class="editor">' +
      '<canvas id="ed-canvas" width="' + ed.orig.width + '" height="' + ed.orig.height + '" aria-label="Photo editor. Paint over the identifying mark to blur it. Keyboard users can use Blur the whole photo."></canvas>' +
      '<div class="editor-bar" role="group" aria-label="Blur brush">' +
      '<span>Brush</span>' + chipGroup('brush', [{ id: 's', en: 'Small' }, { id: 'm', en: 'Medium' }, { id: 'l', en: 'Large' }], ed.size) +
      '<button class="btn btn-line btn-small" type="button" data-action="ed-undo">Undo</button>' +
      '<button class="btn btn-line btn-small" type="button" data-action="ed-clear">Clear blur</button>' +
      '<button class="btn btn-line btn-small" type="button" data-action="ed-whole" aria-pressed="' + ed.whole + '">' + (ed.whole ? 'Unblur the whole photo' : 'Blur the whole photo') + '</button>' +
      '</div></div>' +
      '<div class="panel"><h2>Paint over the mark</h2><p>Drag a finger or the mouse over anything only the owner would know. You can see the result as you go.</p>' +
      '<p class="help" id="blur-state" aria-live="polite">' + blurState() + '</p>' +
      '<div id="warn-blur"></div>' +
      '<p class="btn-row"><button class="btn" type="button" data-action="step1-next">Next: details</button><button class="link-btn" type="button" data-action="ed-remove">Choose another photo</button></p></div></div>';
  }

  /* Live camera: getUserMedia needs https, localhost or a file:// page in Chromium. */
  const cam = { on: false, stream: null, facing: 'environment' };

  function stopCamera() {
    if (cam.stream) cam.stream.getTracks().forEach((t) => t.stop());
    cam.stream = null;
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cam.on = false;
      rerender();
      err('photo-err', 'This browser cannot open the camera here. Use “Choose a photo” instead.');
      return;
    }
    stopCamera();
    try {
      cam.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: cam.facing }, width: { ideal: 1280 } }, audio: false });
      cam.on = true;
      rerender();
    } catch (e) {
      cam.on = false;
      rerender();
      err('photo-err', e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')
        ? 'Camera permission was refused. Allow it in the browser’s address bar, or use “Choose a photo”.'
        : 'No camera could be opened. Use “Choose a photo” instead.');
    }
  }

  function attachCamera() {
    const v = document.getElementById('cam-video');
    if (v && cam.stream) v.srcObject = cam.stream;
    // Bring the shutter into thumb reach and give keyboard users the next step.
    const shoot = document.querySelector('[data-action="camera-shoot"]');
    if (shoot) shoot.focus();
  }

  function shootCamera() {
    const v = document.getElementById('cam-video');
    if (!v || !v.videoWidth) { err('photo-err', 'The camera is still starting. Try again in a second.'); return; }
    const c = canvas(v.videoWidth, v.videoHeight);
    c.getContext('2d').drawImage(v, 0, 0);
    cam.on = false;
    stopCamera();
    loadEditor(c);
    rerender();
  }

  function blurState() {
    if (ed.whole) return 'The whole photo is blurred.';
    return ed.strokes.length ? ed.strokes.length + (ed.strokes.length === 1 ? ' area blurred.' : ' areas blurred.') : 'Nothing blurred yet.';
  }

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function loadEditor(img) {
    const max = 960;
    const k = Math.min(1, max / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const w = Math.round((img.naturalWidth || img.width) * k), h = Math.round((img.naturalHeight || img.height) * k);
    ed.orig = canvas(w, h);
    ed.orig.getContext('2d').drawImage(img, 0, 0, w, h);
    ed.blur = canvas(w, h);
    const bctx = ed.blur.getContext('2d');
    if ('filter' in bctx) {
      bctx.filter = 'blur(' + Math.round(w / 40) + 'px)';
      bctx.drawImage(ed.orig, 0, 0);
      bctx.filter = 'none';
    } else {
      // Older Safari: blur by shrinking and stretching back.
      const small = canvas(Math.max(1, Math.round(w / 24)), Math.max(1, Math.round(h / 24)));
      small.getContext('2d').drawImage(ed.orig, 0, 0, small.width, small.height);
      bctx.imageSmoothingEnabled = true;
      bctx.drawImage(small, 0, 0, w, h);
    }
    ed.mask = canvas(w, h);
    ed.tmp = canvas(w, h);
    ed.strokes = [];
    ed.whole = false;
    pf.hasPhoto = true;
  }

  function compose() {
    if (!ed.view || !ed.orig) return;
    const v = ed.view.getContext('2d');
    v.drawImage(ed.orig, 0, 0);
    if (ed.whole) { v.drawImage(ed.blur, 0, 0); return; }
    const m = ed.mask.getContext('2d');
    m.clearRect(0, 0, ed.mask.width, ed.mask.height);
    m.lineCap = 'round'; m.lineJoin = 'round'; m.strokeStyle = '#000'; m.fillStyle = '#000';
    for (const s of ed.strokes) {
      m.lineWidth = s.r * 2;
      m.beginPath();
      m.moveTo(s.pts[0][0], s.pts[0][1]);
      if (s.pts.length === 1) { m.arc(s.pts[0][0], s.pts[0][1], s.r, 0, Math.PI * 2); m.fill(); continue; }
      for (const p of s.pts) m.lineTo(p[0], p[1]);
      m.stroke();
    }
    const t = ed.tmp.getContext('2d');
    t.globalCompositeOperation = 'source-over';
    t.clearRect(0, 0, ed.tmp.width, ed.tmp.height);
    t.drawImage(ed.blur, 0, 0);
    t.globalCompositeOperation = 'destination-in';
    t.drawImage(ed.mask, 0, 0);
    t.globalCompositeOperation = 'source-over';
    v.drawImage(ed.tmp, 0, 0);
  }

  function bindEditor() {
    const c = document.getElementById('ed-canvas');
    if (!c) return;
    ed.view = c;
    compose();
    const pt = (e) => {
      const r = c.getBoundingClientRect();
      return [(e.clientX - r.left) * (c.width / r.width), (e.clientY - r.top) * (c.height / r.height)];
    };
    const radius = () => c.width * ({ s: 0.025, m: 0.045, l: 0.08 }[ed.size]);
    c.addEventListener('pointerdown', (e) => {
      if (ed.whole) return;
      c.setPointerCapture(e.pointerId);
      ed.active = { r: radius(), pts: [pt(e)] };
      ed.strokes.push(ed.active);
      compose();
    });
    c.addEventListener('pointermove', (e) => {
      if (!ed.active) return;
      ed.active.pts.push(pt(e));
      if (!ed.raf) ed.raf = requestAnimationFrame(() => { ed.raf = 0; compose(); });
    });
    const end = () => {
      if (!ed.active) return;
      ed.active = null;
      const s = document.getElementById('blur-state');
      if (s) s.textContent = blurState();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
  }

  function exportJpeg(src) {
    let c = src, q = 0.8, url = c.toDataURL('image/jpeg', q);
    // NFR: photos compressed to under 300 KB before upload.
    while (url.length * 0.75 > 300 * 1024) {
      if (q > 0.45) q -= 0.1;
      else {
        const s = canvas(Math.round(c.width * 0.75), Math.round(c.height * 0.75));
        s.getContext('2d').drawImage(c, 0, 0, s.width, s.height);
        c = s;
      }
      url = c.toDataURL('image/jpeg', q);
    }
    return { url, w: c.width, h: c.height };
  }

  function postStep2() {
    const f = pf.f;
    return '<form class="stack" data-form="step2" novalidate>' +
      '<fieldset><legend>What is it?</legend>' + chipGroup('category', S.CATEGORIES, f.category, { required: true }) +
      '<p class="help">ID cards, wallets, phones and keys never go on the feed. They go to the Security desk.</p></fieldset>' +
      otherField(f.otherLabel, f.category === 'other', 'What did you find?', 'Phone charger, cricket ball, steel tiffin') +
      '<fieldset><legend>Where did you find it?</legend>' + chipGroup('zone', S.ZONES, f.zone, { required: true }) + '</fieldset>' +
      '<div class="field" id="route-field"' + (f.zone === 'transport' ? '' : ' hidden') + '><label for="route">Bus route number</label><input id="route" name="route" value="' + esc(f.route) + '" maxlength="12" inputmode="numeric"></div>' +
      '<div class="split"><div class="field"><label for="found-on">Found on</label><input id="found-on" type="date" name="foundOn" value="' + esc(f.foundOn) + '" max="' + S.today() + '" required></div>' +
      '<div class="field"><label for="note">Short public note</label><input id="note" name="note" value="' + esc(f.note) + '" maxlength="140" placeholder="Left on the bench by the bus shelter.">' +
      '<p class="help">Where exactly, and what it looks like. Not the mark you hid.</p></div></div>' +
      '<fieldset><legend>Colour <span class="help">(optional, helps matching)</span></legend>' + chipGroup('colour', S.COLOURS, f.colour, { swatch: true }) + '</fieldset>' +
      '<p class="error" id="step2-err" role="alert"></p>' +
      '<p class="btn-row"><button class="btn" type="submit">Next: secret question</button><button class="link-btn" type="button" data-action="step-back">Back to the photo</button></p>' +
      '</form>';
  }

  function postStep3() {
    const f = pf.f, c = S.cat(f.category);
    if (c.sensitive) {
      return '<form class="split" data-form="step3">' +
        '<div class="panel panel-tag"><h2>Take it to the Security desk, main gate</h2>' +
        '<p>' + esc(c.en) + 's never appear on the feed. The desk keeps it, and only the student whose name or roll number matches gets a private alert.</p>' +
        '<div class="field"><label for="roll">Name or roll number printed on it <span class="help">(optional, only the desk sees this)</span></label><input id="roll" name="rollOnItem" maxlength="40" autocomplete="off" value="' + esc(f.rollOnItem) + '"></div>' +
        '<p class="error" id="step3-err" role="alert"></p>' +
        '<p class="btn-row"><button class="btn" type="submit">Log it for the desk</button><button class="link-btn" type="button" data-action="step-back">Back to details</button></p></div>' +
        '<div class="panel"><h2>Why the desk?</h2><p>An ID card in a public post is a gift to anyone who wants to misuse it. At the desk the owner is checked in person before it is handed over.</p></div></form>';
    }
    const q = f.question || c.q;
    return '<form class="split" data-form="step3">' +
      '<div class="panel">' +
      '<div class="field"><label for="question">Question for the owner</label><input id="question" name="question" value="' + esc(q) + '" maxlength="120" required' + (f.noMark ? ' disabled' : '') + '>' +
      '<p class="help">The default for ' + esc(c.id === 'other' ? 'other items' : c.en.toLowerCase() + 's') + ' is filled in. Change it to fit what you hid.</p></div>' +
      '<div class="field"><label for="answer">The answer, as you see it on the item</label><input id="answer" name="answer" value="' + esc(f.answer) + '" maxlength="80" autocomplete="off" required' + (f.noMark ? ' disabled' : '') + '>' +
      '<p class="help">Stored as a hash, never shown to anyone, including you. Capitals, spaces and dots are ignored when checking.</p></div>' +
      '<label class="chip"><input type="checkbox" name="noMark" value="1"' + (f.noMark ? ' checked' : '') + ' data-change="nomark"><span>It has no unique mark</span></label>' +
      '<p class="help">A plain black umbrella, say. Claims then go through the desk, which asks the owner when and where they lost it.</p>' +
      '<p class="error" id="step3-err" role="alert"></p>' +
      '<p class="btn-row"><button class="btn" type="submit">Post the tag</button><button class="link-btn" type="button" data-action="step-back">Back to details</button></p></div>' +
      '<div class="panel panel-tag"><h2>What makes a good question</h2><p>Ask about the thing you blurred. “What is written on the back?” works. “What colour is it?” does not: the photo already shows that.</p></div></form>';
  }

  function postDone() {
    const r = pf.done;
    const it = r.item;
    const desk = it.sensitive;
    return '<div class="page-head"><h1>' + (desk ? 'Logged for the desk' : 'Your tag is up') + '</h1>' +
      '<p>' + (it.postSeconds ? 'Posted in ' + Math.floor(it.postSeconds / 60) + ':' + String(it.postSeconds % 60).padStart(2, '0') + '. ' : '') +
      (desk ? 'Take the ' + esc(S.itemName(it).toLowerCase()) + ' to the Security desk, main gate. It stays off the feed.' : 'Keep the item with you until a handover is booked. You will get an alert when someone answers.') + '</p></div>' +
      '<div class="split split-flip"><div>' + tag(it, { flat: true, reveal: true, stub: '<p class="stub-label">Stub stays on until the handover. The owner’s code goes here.</p>' }) + '</div>' +
      '<div class="panel"><h2>Next</h2>' +
      (r.matched ? '<p class="ok-text">It matched ' + r.matched + ' private lost report' + (r.matched > 1 ? 's' : '') + '. Their owner' + (r.matched > 1 ? 's have' : ' has') + ' been alerted.</p>' : '') +
      '<p class="btn-row">' + (desk ? '<a class="btn" href="#/desk-info">Desk hours</a>' : '<a class="btn" href="#/item/' + it.serial + '">See the public tag</a>') +
      '<button class="btn btn-line" type="button" data-action="post-again">Post another</button></p></div></div>';
  }

  /* ---------- item page (screen 3) ---------- */

  function item(serial) {
    const it = S.itemBySerial(serial);
    const u = S.me();
    if (!it) return notFound('There is no tag #' + serial + '. It may have been removed.');
    const isDesk = u && u.role === 'desk';
    const isFinder = u && u.id === it.finderId;
    if (it.sensitive && !isDesk && !isFinder) {
      return '<div class="page-head"><h1>Held privately at the desk</h1><p>This item is in a sensitive category, so its details are never shown. If you got an alert about it, go to the Security desk, main gate.</p><p><a class="btn" href="#/desk-info">Desk hours</a></p></div>';
    }
    const c = S.cat(it.category);
    const claim = S.claimOf(it, u);
    let side = '';
    if (S.isClosed(it)) {
      side = '<div class="panel"><p class="stamp stamp-ok">' + esc(S.STATUS[it.status].en) + '</p><p>This tag is closed. Nothing more can be claimed.</p></div>';
    } else if (isFinder) {
      side = '<div class="panel"><h2>This is your post</h2>' +
        (it.question ? '<p>Your question: <b>' + esc(it.question) + '</b></p>' : '<p>No unique mark, so the desk checks claims.</p>') +
        (it.claimId ? '<p><a class="btn" href="#/case/' + it.serial + '">Open the chat</a></p>' : '<p>Nobody has answered yet. You get an alert when someone does.</p>') +
        '<p class="btn-row"><button class="btn btn-line" type="button" data-action="share" data-serial="' + it.serial + '">Share the link</button></p>' +
        '<p class="help">The link carries no contact details, so it is safe to paste into a group.</p></div>';
    } else if (isDesk) {
      side = '<div class="panel"><h2>Desk view</h2><p>Finder: ' + esc(S.caseAlias(it, it.finderId)) + '.</p>' +
        (it.claimId ? '<p><a class="btn" href="#/case/' + it.serial + '">Open the case</a></p>' : '') +
        '<p><button class="btn btn-line" type="button" data-action="desk-remove" data-serial="' + it.serial + '">Remove this post</button></p></div>';
    } else if (claim && claim.status === 'verified') {
      side = '<div class="panel"><p class="stamp stamp-ok">Verified</p><p><a class="btn" href="#/case/' + it.serial + '">Open the masked chat</a></p></div>';
    } else if (claim && claim.status === 'queued') {
      side = '<div class="panel"><h2>You are in the queue</h2><p>Someone else answered first. If the finder doubts that claim, the desk checks both of you and asks for a second detail.</p></div>';
    } else if (claim && (claim.status === 'desk' || claim.status === 'dispute')) {
      side = '<div class="panel"><h2>With the desk</h2><p>Your claim is waiting for the Security desk. Go there with your college ID during open hours.</p><p><a class="btn btn-line" href="#/desk-info">Desk hours</a></p></div>';
    } else if (['expired', 'at-desk'].includes(it.status)) {
      side = '<div class="panel"><h2>Now at the desk</h2><p>This tag passed ' + S.POST_DAYS + ' days, so the item is with the Security desk. Claim it there in person.</p></div>';
    } else if (it.noMark) {
      side = '<form class="panel" data-form="desk-claim" data-serial="' + it.serial + '"><h2>Is it yours?</h2>' +
        '<p>This item has no unique mark, so the desk checks claims. Tell the desk when and where you lost it.</p>' +
        '<div class="field"><label for="desk-note">When and where you lost it</label><textarea id="desk-note" name="note" maxlength="300" required></textarea></div>' +
        '<p class="error" id="desk-claim-err" role="alert"></p>' +
        '<p><button class="btn" type="submit">This is mine</button></p></form>';
    } else {
      side = '<div class="panel"><h2>Is it yours?</h2><p>You will be asked one question about a detail the photo hides. Answer it and the photo un-blurs and a chat with the finder opens.</p>' +
        '<p><a class="btn" href="#/item/' + it.serial + '/claim">This is mine</a></p>' +
        '<p class="help">No finder name, no contact. Three tries a day.</p>' +
        '<p><button class="link-btn" type="button" data-action="share" data-serial="' + it.serial + '">Share the link with the owner</button></p></div>';
    }
    return '<div class="page-head"><h1>Found: ' + esc(S.itemName(it).toLowerCase()) + '</h1><p>' + esc(S.zone(it.zone).en) + ', ' + esc(S.fmtDay(it.foundOn).toLowerCase()) + '.</p></div>' +
      '<div class="split split-flip"><div>' + tag(it, { flat: true, reveal: isFinder || isDesk, stub: '<p class="stub-label">Stub stays on until the handover.</p>' }) + '</div>' + side + '</div>';
  }

  /* ---------- claim (screen 4, F5): the one live thing ---------- */

  function claimPage(serial) {
    const it = S.itemBySerial(serial);
    if (!it || it.sensitive) return notFound('There is no public tag #' + serial + '.');
    const u = requireUser('/item/' + serial + '/claim');
    if (!u) return null;
    if (u.suspended) return suspended();
    if (u.id === it.finderId) { go('/item/' + serial); return null; }
    if (it.noMark || it.status !== 'posted' && it.status !== 'claimed' && it.status !== 'scheduled') { go('/item/' + serial); return null; }
    const claim = S.claimOf(it, u);
    if (claim && claim.status === 'verified') { go('/case/' + serial); return null; }
    const left = S.attemptsLeft(it, u);
    const pips = pipHTML(left);
    const photoHTML = '<figure class="tag-photo claim-photo" id="claim-photo">' + photo(it, false) + '<div class="reveal-layer" id="reveal-layer"></div>' + hiddenNote(it, false) + '</figure>';
    return '<div class="page-head"><h1>Prove it’s yours</h1><p>The finder hid one detail. Name it and the photo un-blurs.</p></div>' +
      '<div class="split split-flip"><div>' + tag(it, { flat: true, photoHTML, noStamp: true }) + '</div>' +
      '<form class="panel" data-form="claim" data-serial="' + it.serial + '" id="claim-form">' +
      '<p class="question" id="q">' + esc(it.question) + '</p>' +
      '<div class="field"><label for="answer">Your answer</label><input id="answer" name="answer" autocomplete="off" maxlength="80" required aria-describedby="q attempts-text"' + (left ? '' : ' disabled') + '></div>' +
      '<div class="attempts" id="attempts">' + pips + '</div>' +
      '<div class="verdict" id="verdict" aria-live="assertive"></div>' +
      '<p class="btn-row"><button class="btn" type="submit" id="claim-btn"' + (left ? '' : ' disabled') + '>Check my answer</button></p>' +
      (left ? '' : '<p class="error">No tries left today. Come back tomorrow, or verify at the desk.</p>') +
      '<details><summary>Forgot the detail?</summary><div class="stack" style="margin-top:var(--s3)"><p>Verify at the desk instead, with your college ID card, in person.</p>' +
      '<button class="btn btn-line btn-small" type="button" data-action="verify-at-desk" data-serial="' + it.serial + '">Verify at the desk instead</button></div></details>' +
      '</form></div>';
  }

  function pipHTML(left) {
    let p = '<span id="attempts-text">' + left + ' of ' + S.ATTEMPTS_PER_DAY + ' tries left today</span>';
    for (let i = 0; i < S.ATTEMPTS_PER_DAY; i++) p += '<span class="attempt-pip' + (i >= left ? ' used' : '') + '" aria-hidden="true"></span>';
    return p;
  }

  async function submitClaim(form) {
    const it = S.itemBySerial(form.dataset.serial);
    const u = S.me();
    const input = form.answer;
    const answer = input.value.trim();
    const verdict = document.getElementById('verdict');
    if (!answer) { verdict.innerHTML = '<p class="error">Type an answer first.</p>'; input.focus(); return; }
    const btn = document.getElementById('claim-btn');
    btn.disabled = true;
    const r = await S.tryClaim(it, u, answer);
    if (r.error === 'none-left') {
      verdict.innerHTML = '<p class="error">No tries left today. Come back tomorrow, or verify at the desk.</p>';
      return;
    }
    if (!r.ok) {
      verdict.innerHTML = '<p class="stamp">Not a match</p>';
      document.getElementById('attempts').innerHTML = pipHTML(r.left);
      input.value = '';
      if (r.left > 0) { btn.disabled = false; input.focus(); }
      else { input.disabled = true; verdict.insertAdjacentHTML('beforeend', '<p class="error">No tries left today.</p>'); }
      renderHeader(currentPath());
      return;
    }
    // The right answer: the original arrives only now, and un-blurs in place.
    const layer = document.getElementById('reveal-layer');
    layer.innerHTML = photo(it, true);
    const fig = document.getElementById('claim-photo');
    requestAnimationFrame(() => requestAnimationFrame(() => fig.classList.add('revealed')));
    input.disabled = true;
    btn.hidden = true;
    verdict.innerHTML = '<p class="stamp stamp-ok">Verified</p>' +
      (r.queued
        ? '<p>Someone else answered first, so you are queued. If the finder doubts their claim, the desk checks both of you.</p>'
        : '<a class="btn" href="#/case/' + it.serial + '">Open the masked chat</a>');
    const a = verdict.querySelector('a');
    if (a) a.focus();
    renderHeader(currentPath());
  }

  /* ---------- case: chat and handover (screen 5, F6, F7, F12, F14) ---------- */

  const QUICK = ['Library counter, 10 am?', 'Security desk after 5 pm?', 'Tomorrow morning works for me.', 'Thank you!'];

  function casePage(serial) {
    const it = S.itemBySerial(serial);
    if (!it) return notFound('There is no tag #' + serial + '.');
    const u = requireUser('/case/' + serial);
    if (!u) return null;
    if (!S.canSeeCase(it, u)) {
      return '<div class="page-head"><h1>This chat is private</h1><p>Only the finder and the verified owner can open it. If this is yours, answer the question on the tag first.</p><p><a class="btn" href="#/item/' + serial + '">Go to tag #' + esc(serial) + '</a></p></div>';
    }
    const c = S.caseClaim(it);
    const isFinder = u.id === it.finderId, isOwner = c.claimantId === u.id, isDesk = u.role === 'desk';
    const meAlias = S.caseAlias(it, u.id);
    const other = isFinder ? c.claimantId : it.finderId;
    const otherAlias = isDesk ? S.caseAlias(it, it.finderId) + ' and ' + S.caseAlias(it, c.claimantId) : S.caseAlias(it, other);
    const msgs = S.caseMessages(it);
    const closed = S.isClosed(it), blocked = S.isBlocked(it);
    const h = S.handoverFor(it);

    const log = msgs.map((m) => {
      if (m.kind === 'system') return '<li class="msg system"><p class="msg-body">' + esc(m.text) + '</p></li>';
      const mine = m.fromId === u.id;
      return '<li class="msg' + (mine ? ' mine' : '') + '"><p class="msg-body">' + esc(m.text) + '</p><p class="msg-meta">' + esc(mine ? 'You' : S.caseAlias(it, m.fromId)) + ', ' + esc(S.fmtTime(m.at)) + '</p></li>';
    }).join('');

    const lockedText = closed ? 'Case closed. This chat is locked and will be deleted 30 days after the return.'
      : blocked ? 'This chat is blocked. The Security desk will finish the handover.' : '';
    const composer = lockedText
      ? '<div class="composer"><p class="help">' + esc(lockedText) + '</p></div>'
      : '<form class="composer" data-form="msg" data-serial="' + it.serial + '">' +
        '<div class="quick" role="group" aria-label="Quick replies">' + QUICK.map((q) => '<button type="button" data-action="quick" data-text="' + esc(q) + '">' + esc(q) + '</button>').join('') + '</div>' +
        '<div class="composer-row"><label class="visually-hidden" for="msg">Message</label><textarea id="msg" name="text" maxlength="400" placeholder="Text only. Numbers, emails and links are refused." required></textarea>' +
        '<button class="btn" type="submit">Send</button></div>' +
        '<p class="error" id="msg-err" role="alert"></p></form>';

    const chat = '<section class="chat" aria-labelledby="chat-h">' +
      '<div class="chat-head"><p class="chat-who" id="chat-h">You are ' + esc(meAlias) + '. Talking to ' + esc(otherAlias) + '.</p>' +
      (isDesk || closed ? '' : '<div class="btn-row"><button class="btn btn-line btn-small" type="button" data-action="report" data-serial="' + it.serial + '">Report</button>' +
        (blocked ? '' : '<button class="btn btn-line btn-small" type="button" data-action="block" data-serial="' + it.serial + '">Block</button>') + '</div>') +
      '</div>' +
      '<ol class="chat-log" id="chat-log" aria-live="polite" aria-label="Messages">' + log + '</ol>' + composer + '</section>';

    // The stub: the owner's code, or the place the finder enters it.
    let stub = '<p class="stub-label">The code appears here once a handover is booked.</p>';
    if (closed) stub = '<p class="stamp stamp-ok">Returned</p>';
    else if (h && h.accepted) {
      if (isOwner) {
        const code = S.state.ownerCodes[h.id] || '????';
        stub = '<p class="stub-label">Your handover code. Show it at ' + esc(S.spot(h.spot).en) + '. Valid until ' + esc(S.fmtWhen(h.validUntil)) + '.</p>' +
          '<p class="stub-code" aria-label="Code ' + esc(code.split('').join(' ')) + '">' + esc(code) + '</p>';
      } else {
        stub = '<form data-form="code" data-serial="' + it.serial + '" class="stack"><div class="field"><label for="code">Owner’s 4-digit code</label>' +
          '<input id="code" name="code" inputmode="numeric" maxlength="4" autocomplete="off" required></div>' +
          '<p class="error" id="code-err" role="alert"></p><p><button class="btn" type="submit">Confirm the return</button></p></form>';
      }
    }

    let panel = '';
    if (closed) {
      const th = S.state.thanks.find((t) => t.itemId === it.id);
      panel = '<div class="panel"><h2>Returned</h2>' + (h && h.confirmedAt ? '<p>At ' + esc(S.spot(h.spot).en) + ', ' + esc(S.fmtWhen(h.confirmedAt)) + '. Written to the desk register.</p>' : '') +
        (th ? '<p>Thank-you note: “' + esc(th.text) + '”</p>'
          : isOwner ? '<form class="stack" data-form="thanks" data-serial="' + it.serial + '"><div class="field"><label for="thanks">Leave the finder a thank-you note</label><textarea id="thanks" name="text" maxlength="200" required></textarea></div><p class="error" id="thanks-err" role="alert"></p><p><button class="btn" type="submit">Send the note</button></p></form>' : '') +
        '</div>';
    } else if (blocked) {
      panel = '<div class="panel"><h2>The desk takes over</h2><p>Bring the item to the Security desk, main gate. The owner collects it there with their college ID.</p></div>';
    } else if (h && h.accepted) {
      const overdue = Date.now() > h.scheduledAt + S.NO_SHOW_H * S.HOUR;
      panel = '<div class="panel"><h2>Handover booked</h2><p><b>' + esc(S.spot(h.spot).en) + '</b>, ' + esc(S.fmtWhen(h.scheduledAt)) + '.</p>' +
        (isOwner ? '<p>Show the code on the stub. The finder or the desk types it in to close the case.</p>' : '<p>Ask the owner for the 4 digits on their screen and type them on the stub.</p>') +
        (overdue && isFinder ? '<p class="notice">It has been 48 hours. Please drop the item at the Security desk, main gate.</p>' : '') +
        '<button class="link-btn" type="button" data-action="rebook">Book a different time</button></div>';
    } else {
      const pending = h && !h.accepted ? h : null;
      const pendingHTML = pending
        ? '<div class="notice"><p>' + esc(S.caseAlias(it, pending.proposedBy)) + ' proposed <b>' + esc(S.spot(pending.spot).en) + '</b>, ' + esc(S.fmtWhen(pending.scheduledAt)) + '.</p>' +
          (pending.proposedBy !== u.id ? '<p class="btn-row" style="margin-top:var(--s3)"><button class="btn btn-line btn-small" style="background:var(--surface)" type="button" data-action="accept" data-serial="' + it.serial + '">Accept this time</button></p>' : '<p>Waiting for the other side to accept.</p>') + '</div>'
        : '';
      const days = [0, 1, 2].map((d) => S.addDays(S.today(), d));
      const hours = []; for (let x = 8; x < 20; x++) hours.push(x);
      panel = '<form class="panel" data-form="propose" data-serial="' + it.serial + '"><h2>Pick a safe spot</h2>' + pendingHTML +
        '<fieldset><legend>Where</legend>' + chipGroup('spot', S.SPOTS.map((s) => ({ id: s.id, en: s.en + ' (' + hourLabel(s.open) + ' to ' + hourLabel(s.close) + ')', hi: s.hi })), pending ? pending.spot : 'library', { required: true }) + '</fieldset>' +
        '<div class="split"><div class="field"><label for="hday">Day</label><select id="hday" name="day">' + days.map((d, i) => '<option value="' + d + '">' + esc(['Today', 'Tomorrow', 'Day after'][i]) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label for="hhour">Time</label><select id="hhour" name="hour">' + hours.map((x) => '<option value="' + x + '"' + (x === 10 ? ' selected' : '') + '>' + hourLabel(x) + '</option>').join('') + '</select></div></div>' +
        '<p class="help">Meeting anywhere else is not offered, and the app never asks for a room number.</p>' +
        '<p class="error" id="propose-err" role="alert"></p>' +
        '<p><button class="btn" type="submit">' + (pending ? 'Suggest this instead' : 'Propose this handover') + '</button></p></form>';
    }

    const demoSwitch = !isDesk ? '<p class="help">Demo: <button class="link-btn" type="button" data-action="switch-side" data-id="' + other + '">see this case as ' + esc(S.caseAlias(it, other)) + '</button></p>' : '';
    const doubt = isFinder && !closed && c.status === 'verified' && !blocked ? '<p><button class="link-btn" type="button" data-action="ask-desk" data-serial="' + it.serial + '">Not sure it is theirs? Ask the desk to check.</button></p>' : '';
    const dispute = c.status === 'dispute' ? '<p class="notice">The desk has been asked to check this claim.</p>' : '';

    later(() => { const l = document.getElementById('chat-log'); if (l) l.scrollTop = l.scrollHeight; });
    return '<div class="page-head"><h1>Case #' + esc(it.serial) + ': ' + esc(S.itemName(it).toLowerCase()) + '</h1>' + demoSwitch + '</div>' +
      '<div class="split split-case">' + chat +
      '<div class="stack">' + tag(it, { flat: true, reveal: true, stub, cls: closed ? 'torn' : '' }) + dispute + panel + doubt + '</div></div>';
  }

  /* ---------- lost report (F8) ---------- */

  function lostNew() {
    const u = requireUser('/lost/new');
    if (!u) return null;
    const t = S.today();
    return '<div class="page-head"><h1>I lost something</h1>' +
      '<p>This report is private. Only you can see it. When a found tag matches it, you get an alert, and then you prove it’s yours like anyone else.</p></div>' +
      '<form class="stack" data-form="lost" novalidate>' +
      '<fieldset><legend>What did you lose?</legend>' + chipGroup('category', S.CATEGORIES, '', { required: true }) + '</fieldset>' +
      otherField('', false, 'What did you lose?', 'Phone charger, cricket ball, steel tiffin') +
      '<fieldset><legend>Where were you?</legend>' + chipGroup('zone', S.ZONES, '', { required: true }) + '</fieldset>' +
      '<div class="split"><div class="field"><label for="from">Lost between</label><input id="from" type="date" name="dateFrom" value="' + S.addDays(t, -1) + '" max="' + t + '" required></div>' +
      '<div class="field"><label for="to">and</label><input id="to" type="date" name="dateTo" value="' + t + '" max="' + t + '" required></div></div>' +
      '<fieldset><legend>Colour <span class="help">(optional)</span></legend>' + chipGroup('colour', S.COLOURS, '', { swatch: true }) + '</fieldset>' +
      '<div class="field"><label for="notes">Private notes</label><textarea id="notes" name="notes" maxlength="300" placeholder="Anything that helps you, or the desk, recognise it later."></textarea>' +
      '<p class="help">Never shown to anyone. Do not put the secret detail of your item here.</p></div>' +
      '<p class="error" id="lost-err" role="alert"></p>' +
      '<p><button class="btn" type="submit">File the private report</button></p></form>';
  }

  /* ---------- my tags ---------- */

  function mine() {
    const u = requireUser('/mine');
    if (!u) return null;
    const st = S.state;
    const posts = st.items.filter((i) => i.finderId === u.id);
    const claims = st.claims.filter((c) => c.claimantId === u.id);
    const lost = st.lost.filter((l) => l.ownerId === u.id);
    const thanks = st.thanks.filter((t) => t.toId === u.id);
    const statusOf = (it) => S.STATUS[it.status] ? S.STATUS[it.status].en : it.status;
    const claimStatus = { open: 'Answer not yet right', verified: 'Verified, chat open', queued: 'Queued behind another claim', desk: 'Waiting for the desk', dispute: 'Desk is checking', rejected: 'Not confirmed by the desk', returned: 'Returned to you' };
    const row = (top, rest) => '<li class="row"><div class="row-top">' + top + '</div>' + (rest || '') + '</li>';
    return '<div class="page-head"><h1>My tags</h1><p>You are <b>' + esc(S.aliasOf(u)) + '</b>. Your college email is never shown to anyone.' +
      (u.strikes ? ' Strikes: ' + u.strikes + ' of 3.' : '') + '</p>' + (u.suspended ? '<p class="notice">Your account is suspended. Talk to the Security desk.</p>' : '') + '</div>' +
      '<div class="desk-grid">' +
      '<section class="panel"><h2>Things I found</h2>' + (posts.length ? '<ul class="rows">' + posts.map((it) => row(
        '<span class="row-serial">#' + it.serial + '</span><span>' + esc(S.itemName(it)) + ', ' + esc(S.zone(it.zone).en) + '</span><span class="row-muted">' + esc(statusOf(it)) + '</span>',
        '<div class="row-actions">' + (it.claimId ? '<a href="#/case/' + it.serial + '">Open the chat</a>' : it.sensitive ? '<span class="row-muted">Held at the desk</span>' : '<a href="#/item/' + it.serial + '">View tag</a>') + '</div>')).join('') + '</ul>'
        : '<p>Nothing yet. <a href="#/found/new">Post something you found</a>.</p>') + '</section>' +
      '<section class="panel"><h2>Things I claimed</h2>' + (claims.length ? '<ul class="rows">' + claims.map((c) => {
        const it = S.itemById(c.itemId);
        if (!it) return '';
        return row('<span class="row-serial">#' + it.serial + '</span><span>' + esc(S.itemName(it)) + '</span><span class="row-muted">' + esc(claimStatus[c.status] || c.status) + '</span>',
          '<div class="row-actions">' + (it.claimId === c.id ? '<a href="#/case/' + it.serial + '">Open the chat</a>' : '<a href="#/item/' + it.serial + '">View tag</a>') + '</div>');
      }).join('') + '</ul>' : '<p>No claims yet.</p>') + '</section>' +
      '<section class="panel"><h2>My private lost reports</h2>' + (lost.length ? '<ul class="rows">' + lost.map((l) => row(
        '<b>' + esc(S.itemName(l)) + '</b><span>' + esc(S.zone(l.zone).en) + ', ' + esc(S.fmtDay(l.dateFrom)) + (l.dateTo !== l.dateFrom ? ' to ' + esc(S.fmtDay(l.dateTo)) : '') + '</span><span class="row-muted">' + (l.status === 'open' ? 'Watching for matches' : 'Closed') + '</span>',
        (l.notes ? '<p class="row-muted">' + esc(l.notes) + '</p>' : '') +
        (l.status === 'open' ? '<div class="row-actions"><button class="btn btn-line btn-small" type="button" data-action="close-lost" data-id="' + l.id + '">I got it back, close it</button></div>' : ''))).join('') + '</ul>'
        : '<p>None. <a href="#/lost/new">File a private report</a>.</p>') + '</section>' +
      '<section class="panel panel-tag"><h2>Thank-you notes</h2>' + (thanks.length ? '<ul class="rows">' + thanks.map((t) => row('“' + esc(t.text) + '”', '<p class="row-muted">For #' + esc((S.itemById(t.itemId) || {}).serial) + ', ' + esc(S.fmtWhen(t.at)) + '</p>')).join('') + '</ul>' : '<p>When an owner thanks you for a return, the note shows up here.</p>') + '</section>' +
      '</div>';
  }

  /* ---------- alerts (F9, F10) ---------- */

  function alertsPage() {
    const u = requireUser('/alerts');
    if (!u) return null;
    const list = S.alertsFor(u);
    later(() => { S.markAlertsRead(u); renderHeader('/alerts'); });
    return '<div class="page-head"><h1>Alerts</h1><p>Matches for your lost reports, answers to your posts, and private notices from the desk.</p></div>' +
      (list.length ? '<ul class="rows panel">' + list.map((a) => {
        const it = S.itemById(a.itemId);
        let link = '';
        if (it) {
          if (it.sensitive || a.kind === 'sensitive') link = '<a href="#/desk-info">Desk hours</a>';
          else if (S.canSeeCase(it, u)) link = '<a href="#/case/' + it.serial + '">Open case #' + it.serial + '</a>';
          else link = '<a href="#/item/' + it.serial + '">Open tag #' + it.serial + '</a>';
        }
        return '<li class="row"><div class="row-top">' + (a.read ? '' : '<b>New</b>') + '<span class="row-muted">' + esc(S.fmtWhen(a.at)) + '</span></div><p>' + esc(a.text) + '</p><div class="row-actions">' + link + '</div></li>';
      }).join('') + '</ul>' : '<div class="empty"><p>No alerts yet. File a <a href="#/lost/new">private lost report</a> and you will hear here when a matching tag goes up.</p></div>');
  }

  /* ---------- desk dashboard (screen 6, F11 to F13) ---------- */

  function desk() {
    const u = requireUser('/desk');
    if (!u) return null;
    if (u.role !== 'desk') {
      return '<div class="page-head"><h1>For the Security desk</h1><p>This dashboard is only for desk staff. In the demo, pick “Security desk, main gate” in the bar at the top.</p></div>';
    }
    const st = S.state, t = S.today();
    const held = st.items.filter((i) => i.status === 'at-desk');
    const expired = st.items.filter((i) => i.status === 'expired');
    const deskClaims = st.claims.filter((c) => ['desk', 'dispute', 'queued'].includes(c.status));
    const todays = st.handovers.filter((h) => h.accepted && !h.confirmedAt && (S.dayKey(h.scheduledAt) <= t)).filter((h) => {
      const it = S.itemById(h.itemId);
      return it && it.claimId === h.claimId && !S.isClosed(it);
    });
    const reports = st.reports.filter((r) => r.status === 'open');
    const name = (it) => '<span class="row-serial">#' + it.serial + '</span><span>' + esc(S.itemName(it)) + ', ' + esc(S.zone(it.zone).en) + '</span>';
    const opt = (list) => list.map((x) => '<option value="' + x.id + '">' + esc(x.en) + '</option>').join('');

    return '<div class="page-head"><h1>Security desk</h1><p>Today’s work first. Every action here is written to the log with your name and the time.</p></div>' +
      '<div class="tally panel" style="margin-bottom:var(--s5)">' +
      [[todays.length, 'Handovers due'], [deskClaims.length, 'Claims to check'], [held.length, 'Held at the desk'], [expired.length, 'Expiry queue'], [reports.length, 'Chat reports']]
        .map(([n, l]) => '<div><b>' + n + '</b><span>' + l + '</span></div>').join('') + '</div>' +
      '<div class="desk-grid">' +

      '<section class="panel"><h2>Handovers due</h2>' + (todays.length ? '<ul class="rows">' + todays.map((h) => {
        const it = S.itemById(h.itemId), c = S.claimById(h.claimId);
        const late = Date.now() > h.scheduledAt + S.NO_SHOW_H * S.HOUR;
        return '<li class="row"><div class="row-top">' + name(it) + '</div>' +
          '<p>' + esc(S.spot(h.spot).en) + ', ' + esc(S.fmtWhen(h.scheduledAt)) + '. ' + esc(S.caseAlias(it, it.finderId)) + ' to ' + esc(S.caseAlias(it, c.claimantId)) + '.' + (late ? ' <b>Over 48 hours: ask the finder to drop it here.</b>' : '') + '</p>' +
          '<form class="row-actions" data-form="desk-code" data-serial="' + it.serial + '"><label class="visually-hidden" for="dc-' + it.serial + '">Owner’s code for #' + it.serial + '</label>' +
          '<input id="dc-' + it.serial + '" name="code" inputmode="numeric" maxlength="4" placeholder="Code" required><button class="btn btn-small" type="submit">Confirm return</button>' +
          '<a href="#/case/' + it.serial + '">Case</a></form><p class="error" id="dc-err-' + it.serial + '" role="alert"></p></li>';
      }).join('') + '</ul>' : '<p>No handovers due today.</p>') + '</section>' +

      '<section class="panel"><h2>Claims to check</h2>' + (deskClaims.length ? '<ul class="rows">' + deskClaims.map((c) => {
        const it = S.itemById(c.itemId);
        const why = c.status === 'dispute' ? 'Finder doubts this claim. Ask for a second detail.' : c.status === 'queued' ? 'Second correct answer, queued.' : c.reason || 'Needs an in-person check.';
        return '<li class="row"><div class="row-top">' + name(it) + '<span class="row-muted">' + esc(S.caseAlias(it, c.claimantId)) + '</span></div>' +
          '<p>' + esc(why) + '</p>' + (c.note ? '<p class="row-muted">Owner says: “' + esc(c.note) + '”</p>' : '') +
          '<div class="row-actions"><button class="btn btn-small" type="button" data-action="desk-approve" data-id="' + c.id + '">ID checked, approve</button>' +
          '<button class="btn btn-line btn-small" type="button" data-action="desk-reject" data-id="' + c.id + '">Reject</button></div></li>';
      }).join('') + '</ul>' : '<p>No claims waiting.</p>') + '</section>' +

      '<section class="panel"><h2>Held at the desk</h2>' + (held.length ? '<ul class="rows">' + held.map((it) =>
        '<li class="row"><div class="row-top">' + name(it) + '<span class="row-muted">' + esc(S.fmtDay(it.foundOn)) + '</span></div>' +
        (it.rollOnItem ? '<p>Printed on it: <b>' + esc(it.rollOnItem) + '</b> (desk only)</p>' : '') + (it.note ? '<p class="row-muted">' + esc(it.note) + '</p>' : '') +
        '<form class="row-actions" data-form="desk-collect" data-serial="' + it.serial + '"><label class="visually-hidden" for="roll-' + it.serial + '">Roll number on the ID you checked</label>' +
        '<input id="roll-' + it.serial + '" name="roll" placeholder="Roll no. checked" required><button class="btn btn-small" type="submit">Hand over</button></form>' +
        '<p class="error" id="collect-err-' + it.serial + '" role="alert"></p></li>').join('') + '</ul>' : '<p>Nothing held.</p>') + '</section>' +

      '<section class="panel"><h2>Expiry queue</h2><p class="help">Posts older than ' + S.POST_DAYS + ' days. Decide what happens to each.</p>' + (expired.length ? '<ul class="rows">' + expired.map((it) =>
        '<li class="row"><div class="row-top">' + name(it) + '<span class="row-muted">Found ' + esc(S.fmtDay(it.foundOn)) + '</span></div>' +
        '<div class="row-actions"><button class="btn btn-small" type="button" data-action="desk-expire" data-serial="' + it.serial + '" data-to="at-desk">Keep at the desk</button>' +
        '<button class="btn btn-line btn-small" type="button" data-action="desk-expire" data-serial="' + it.serial + '" data-to="donated">Donate</button>' +
        '<button class="btn btn-line btn-small" type="button" data-action="desk-expire" data-serial="' + it.serial + '" data-to="disposed">Dispose</button></div></li>').join('') + '</ul>' : '<p>Nothing has expired.</p>') + '</section>' +

      '<section class="panel"><h2>Chat reports</h2>' + (reports.length ? '<ul class="rows">' + reports.map((r) => {
        const it = S.itemById(r.itemId);
        return '<li class="row"><div class="row-top">' + name(it) + '<span class="row-muted">' + esc(S.fmtWhen(r.at)) + '</span></div>' +
          '<p>' + esc(S.caseAlias(it, r.byId)) + ' reported ' + esc(S.caseAlias(it, r.againstId)) + (r.reason ? ': ' + esc(r.reason) : '') + '</p>' +
          (r.excerpt ? '<p class="row-muted">Last message: “' + esc(r.excerpt) + '”</p>' : '') +
          '<p id="email-' + r.id + '" class="row-muted"></p>' +
          '<div class="row-actions"><button class="btn btn-small" type="button" data-action="desk-report" data-id="' + r.id + '" data-to="strike">Uphold, add a strike</button>' +
          '<button class="btn btn-line btn-small" type="button" data-action="desk-report" data-id="' + r.id + '" data-to="dismissed">Dismiss</button>' +
          '<button class="link-btn" type="button" data-action="desk-email" data-id="' + r.id + '">Show college email (logged)</button></div></li>';
      }).join('') + '</ul>' : '<p>No open reports.</p>') + '</section>' +

      '<form class="panel" data-form="intake"><h2>Log a walk-in item</h2><p class="help">Someone handed something in at the counter. Sensitive items stay off the feed; others go up with “no unique mark”, so claims come through you.</p>' +
      '<div class="split"><div class="field"><label for="in-cat">Category</label><select id="in-cat" name="category">' + opt(S.CATEGORIES) + '</select></div>' +
      '<div class="field"><label for="in-zone">Found at</label><select id="in-zone" name="zone">' + opt(S.ZONES) + '</select></div></div>' +
      otherField('', false, 'What was handed in?', 'Phone charger, cricket ball, steel tiffin') +
      '<div class="split"><div class="field"><label for="in-roll">Name or roll number on it</label><input id="in-roll" name="rollOnItem" maxlength="40" autocomplete="off"></div>' +
      '<div class="field"><label for="in-note">Note</label><input id="in-note" name="note" maxlength="140" placeholder="Handed in by housekeeping."></div></div>' +
      '<p class="error" id="intake-err" role="alert"></p><p><button class="btn" type="submit">Log the item</button></p></form>' +

      '<section class="panel desk-wide"><h2>Register</h2><p class="help">Every claim, code and desk action, newest first. Kept for one academic year.</p><div class="log-wrap"><table class="log"><thead><tr><th scope="col">When</th><th scope="col">Who</th><th scope="col">What</th><th scope="col">Item</th></tr></thead><tbody>' +
      st.log.slice(0, 40).map((l) => {
        const it = l.itemId ? S.itemById(l.itemId) : null;
        const who = l.actorId === 'system' ? 'System' : S.aliasOf(S.user(l.actorId));
        return '<tr><td>' + esc(S.fmtWhen(l.at)) + '</td><td>' + esc(who) + '</td><td>' + esc(l.action) + (l.detail ? '. ' + esc(l.detail) : '') + '</td><td>' + (it ? '#' + esc(it.serial) : '') + '</td></tr>';
      }).join('') + '</tbody></table></div></section>' +
      '</div>';
  }

  /* ---------- static pages ---------- */

  function privacy() {
    return '<div class="page-head"><h1>Privacy notice</h1><p>Privacy is the product here, not a setting. This page says what is kept, for how long, and what is never collected.</p></div>' +
      '<div class="prose">' +
      '<h2>What we keep</h2><ul><li>Your college email, to sign you in. Never shown to another student. The desk sees it only during a dispute, and that view is logged.</li>' +
      '<li>Your alias, like Student #1170.</li><li>Found posts, with the secret answer stored only as a hash.</li><li>Your private lost reports, visible to you alone.</li>' +
      '<li>Chat messages, deleted 30 days after the case closes.</li><li>The handover log (who, what, when, where), kept for one academic year.</li></ul>' +
      '<h2>What we never collect</h2><ul><li>Phone numbers.</li><li>Room numbers.</li><li>Social media handles.</li><li>Location tracking.</li></ul>' +
      '<h2>Rules that protect you</h2><ul><li>Messages with a phone number, email, link or room number are refused before they are sent.</li>' +
      '<li>Handovers only at the Security desk or the Library counter, during open hours.</li>' +
      '<li>ID cards, wallets, phones and keys never appear on the feed.</li><li>Block and report are on every chat. Reports go to the desk.</li></ul>' +
      '<h2>In this demo</h2><p>There is no server. Everything, including photos, stays in this browser’s storage, and the sign-in code is shown on screen instead of emailed. The pilot will follow the DPDP Act 2023 notice and consent rules, to be confirmed with the college.</p>' +
      '</div>';
  }

  function deskInfo() {
    return '<div class="page-head"><h1>Safe spots and hours</h1><p>Every handover happens at one of these, during open hours. Nowhere else is offered.</p></div>' +
      '<div class="desk-grid">' + S.SPOTS.map((s) => '<section class="panel panel-tag"><h2>' + esc(s.en) + '</h2><p>Open ' + hourLabel(s.open) + ' to ' + hourLabel(s.close) + ' (sample hours, to confirm).</p>' +
        (s.id === 'desk' ? '<p>Sensitive items (ID cards, wallets, phones, keys) are held here and handed over only after an in-person check.</p>' : '<p>Good for quick handovers between classes.</p>') + '</section>').join('') + '</div>';
  }

  function suspended() {
    return '<div class="page-head"><h1>Account suspended</h1><p>Repeated reports or wrong answers added three strikes. Talk to the Security desk, main gate.</p></div>';
  }

  function notFound(msg) {
    return '<div class="page-head"><h1>Nothing here</h1><p>' + esc(msg || 'This page does not exist.') + '</p><p><a class="btn" href="#/feed">Back to the feed</a></p></div>';
  }

  /* ---------- router ---------- */

  const routes = [
    [/^\/$/, landing],
    [/^\/feed$/, home],
    [/^\/signin$/, (q) => signin(q)],
    [/^\/found\/new$/, postFound],
    [/^\/lost\/new$/, lostNew],
    [/^\/item\/(\d{4})$/, item],
    [/^\/item\/(\d{4})\/claim$/, claimPage],
    [/^\/case\/(\d{4})$/, casePage],
    [/^\/mine$/, mine],
    [/^\/alerts$/, alertsPage],
    [/^\/desk$/, desk],
    [/^\/privacy$/, privacy],
    [/^\/desk-info$/, deskInfo]
  ];

  function currentPath() {
    return (location.hash.slice(1) || '/').split('?')[0];
  }

  let first = true;
  function render(opts) {
    opts = opts || {};
    timers.forEach(clearInterval);
    timers = [];
    after = [];
    const raw = location.hash.slice(1) || '/';
    const [path, qs] = raw.split('?');
    const q = new URLSearchParams(qs || '');
    let html;
    for (const [re, fn] of routes) {
      const m = path.match(re);
      if (m) {
        html = m.length > 1 ? fn(...m.slice(1), q) : fn(q);
        break;
      }
    }
    if (html === undefined) html = notFound();
    if (html === null) return; // redirected
    view.innerHTML = html;
    renderHeader(path);
    after.forEach((f) => f());
    // Leaving the viewfinder (any route or step change) always turns the camera off.
    if (!document.getElementById('cam-video')) { cam.on = false; stopCamera(); }
    if (!opts.keep) {
      window.scrollTo(0, 0);
      if (!first) {
        const h = view.querySelector('h1');
        if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
      }
    }
    if (opts.focus) { const el = document.getElementById(opts.focus); if (el) el.focus(); }
    first = false;
    if (!S.storageOk) toast('This browser is blocking storage, so changes last only until you close the tab.');
  }
  const rerender = (focus) => render({ keep: true, focus });

  /* ---------- actions ---------- */

  const err = (id, msg) => { const el = document.getElementById(id); if (el) el.textContent = msg || ''; };

  const actions = {
    'demo-signin': (b) => { S.signInAs(b.dataset.id); go(b.dataset.next || '/'); toast('Signed in as ' + S.aliasOf(S.me()) + '.'); },
    'otp-restart': () => { otp = null; rerender('email'); },
    'demo-photo': async () => {
      try {
        const img = await D.toImage('calculator', 'R.S. CSE-B');
        loadEditor(img);
        pf.f.category = 'calculator';
        rerender();
      } catch (e) { err('photo-err', 'Could not load the demo photo in this browser. Try your own photo.'); }
    },
    'camera-open': () => { cam.facing = 'environment'; startCamera(); },
    'camera-flip': () => { cam.facing = cam.facing === 'environment' ? 'user' : 'environment'; startCamera(); },
    'camera-shoot': () => shootCamera(),
    'camera-close': () => { cam.on = false; stopCamera(); rerender(); },
    'try-hint': () => {
      const el = document.getElementById('try-hint');
      el.innerHTML = 'You are Riya. You wrote <b>R.S. CSE-B</b> on the sticker. Capitals, dots and spaces do not matter.';
      const i = document.getElementById('try-answer');
      if (i && !i.disabled) i.focus();
    },
    'try-reset': () => rerender('try-answer'),
    'skip-photo': () => { pf.hasPhoto = false; ed.orig = null; pf.step = 2; rerender(); },
    'ed-undo': () => { ed.strokes.pop(); compose(); err('blur-state', blurState()); },
    'ed-clear': () => { ed.strokes = []; ed.whole = false; rerender(); },
    'ed-whole': () => { ed.whole = !ed.whole; rerender(); },
    'ed-remove': () => { ed.orig = null; pf.hasPhoto = false; rerender(); },
    'step1-next': () => {
      if (!ed.whole && !ed.strokes.length && !pf.warned) {
        pf.warned = true;
        document.getElementById('warn-blur').innerHTML = '<p class="notice">You have not hidden anything yet. Blur the name, sticker or mark the owner will describe. Or tap Next again to go on without blurring.</p>';
        return;
      }
      pf.step = 2;
      rerender();
    },
    'step-back': () => { pf.step = Math.max(1, pf.step - 1); rerender(); },
    'post-again': () => { freshPost(); rerender(); },
    'share': async (b) => {
      const url = location.href.split('#')[0] + '#/item/' + b.dataset.serial;
      const it = S.itemBySerial(b.dataset.serial);
      const text = 'Found: ' + S.itemName(it).toLowerCase() + ' at ' + S.zone(it.zone).en + '. Is it yours? Answer the question on the tag to claim it.';
      if (navigator.share) { try { await navigator.share({ title: 'Kho-Paya #' + it.serial, text, url }); } catch (e) { /* cancelled */ } return; }
      try { await navigator.clipboard.writeText(text + ' ' + url); toast('Link copied. It carries no contact details.'); }
      catch (e) { toast('Copy this link: ' + url); }
    },
    'verify-at-desk': (b) => {
      const it = S.itemBySerial(b.dataset.serial);
      S.deskClaim(it, S.me(), '', 'Owner forgot the detail; check college ID in person');
      go('/item/' + it.serial);
      toast('Sent to the desk. Go there with your college ID during open hours.');
    },
    'quick': (b) => { const ta = document.getElementById('msg'); ta.value = b.dataset.text; ta.form.requestSubmit(); },
    'report': (b) => {
      const it = S.itemBySerial(b.dataset.serial);
      const reason = window.prompt('What happened? The desk will read this.');
      if (reason === null) return;
      S.reportChat(it, S.me(), reason);
      toast('Reported to the desk. Thank you for telling us.');
    },
    'block': (b) => {
      if (!window.confirm('Block this chat? Neither of you can send more messages, and the desk finishes the handover.')) return;
      S.blockChat(S.itemBySerial(b.dataset.serial), S.me());
      rerender();
    },
    'accept': async (b) => { await S.acceptHandover(S.itemBySerial(b.dataset.serial), S.me()); rerender(); toast('Handover booked. The owner now holds a 4-digit code.'); },
    'rebook': () => {
      const it = S.itemBySerial(currentPath().split('/')[2]);
      const h = S.handoverFor(it);
      if (h) { delete S.state.ownerCodes[h.id]; S.state.handovers = S.state.handovers.filter((x) => x !== h); it.status = 'claimed'; S.save(); }
      rerender();
    },
    'switch-side': (b) => { S.signInAs(b.dataset.id); rerender(); toast('Now viewing as ' + S.caseAlias(S.itemBySerial(currentPath().split('/')[2]), b.dataset.id) + '.'); },
    'ask-desk': (b) => { S.askDesk(S.itemBySerial(b.dataset.serial), S.me()); rerender(); toast('The desk will check this claim.'); },
    'close-lost': (b) => { S.closeLost(b.dataset.id, S.me()); rerender(); },
    'desk-approve': (b) => { S.deskApproveClaim(S.claimById(b.dataset.id), S.me()); rerender(); toast('Approved. The chat is open for that owner.'); },
    'desk-reject': (b) => { S.deskRejectClaim(S.claimById(b.dataset.id), S.me()); rerender(); toast('Claim rejected.'); },
    'desk-expire': (b) => { S.deskDecideExpired(S.itemBySerial(b.dataset.serial), S.me(), b.dataset.to); rerender(); },
    'desk-report': (b) => { S.deskReport(S.state.reports.find((r) => r.id === b.dataset.id), S.me(), b.dataset.to); rerender(); },
    'desk-email': (b) => {
      const email = S.deskRevealEmail(S.state.reports.find((r) => r.id === b.dataset.id), S.me());
      const el = document.getElementById('email-' + b.dataset.id);
      if (el) el.textContent = 'College email: ' + email + ' (this view is in the register)';
    },
    'desk-remove': (b) => {
      if (!window.confirm('Remove this post from the feed?')) return;
      S.deskRemove(S.itemBySerial(b.dataset.serial), S.me());
      go('/desk');
    }
  };

  const forms = {
    filters: (f) => {
      filters.q = f.q.value.trim();
      filters.cat = f.cat.value;
      filters.zone = f.zone.value;
      filters.days = f.days.value;
      document.getElementById('feed-results').innerHTML = feedResults();
    },
    email: (f) => {
      const r = S.requestOtp(f.email.value);
      if (r.error) { err('email-err', r.error); f.email.focus(); return; }
      otp = r;
      rerender('otp-code');
    },
    otp: (f) => {
      const r = S.verifyOtp(otp.email, f.code.value);
      if (r.error) { err('otp-err', r.error); f.code.focus(); return; }
      otp = null;
      go(f.dataset.next || '/');
      toast('Signed in. Your alias is ' + S.aliasOf(r.user) + '.');
    },
    step2: (f) => {
      const fd = new FormData(f);
      const v = (k) => String(fd.get(k) || '').trim();
      if (!v('category')) return err('step2-err', 'Pick what it is.');
      if (v('category') === 'other' && !v('otherLabel')) { err('step2-err', 'Say what you found, in a few words.'); f.otherLabel.focus(); return; }
      if (S.contactLeak(v('otherLabel'))) return err('step2-err', 'The name looks like it has contact details. Just say what the thing is.');
      if (!v('zone')) return err('step2-err', 'Pick where you found it.');
      if (!v('foundOn') || v('foundOn') > S.today()) return err('step2-err', 'Pick the day you found it (today or earlier).');
      const leak = S.contactLeak(v('note'));
      if (leak) return err('step2-err', 'The note looks like it has ' + leak + '. Leave contact details out: the chat handles that.');
      Object.assign(pf.f, { category: v('category'), otherLabel: v('category') === 'other' ? v('otherLabel') : '', zone: v('zone'), route: v('route'), foundOn: v('foundOn'), colour: v('colour'), note: v('note') });
      if (pf.f.question && S.CATEGORIES.some((c) => c.q === pf.f.question)) pf.f.question = '';
      pf.step = 3;
      rerender();
    },
    step3: async (f) => {
      const c = S.cat(pf.f.category);
      const u = S.me();
      if (c.sensitive) {
        if (pf.hasPhoto && !ed.whole && !ed.strokes.length) return err('step3-err', 'For ' + c.en.toLowerCase() + 's the blur is required. Go back to the photo and blur it.');
        pf.f.rollOnItem = f.rollOnItem.value.trim();
      } else {
        pf.f.noMark = !!(f.noMark && f.noMark.checked);
        if (!pf.f.noMark) {
          pf.f.question = f.question.value.trim();
          pf.f.answer = f.answer.value.trim();
          if (!pf.f.question) return err('step3-err', 'Write a question for the owner.');
          if (S.normalise(pf.f.answer).length < 1) return err('step3-err', 'Write the answer, as you see it on the item.');
          if (S.contactLeak(pf.f.question)) return err('step3-err', 'The question looks like it has contact details. Leave them out.');
        }
      }
      let photoData = {};
      if (pf.hasPhoto && ed.orig) {
        compose();
        const blurred = exportJpeg(ed.view || ed.orig);
        const original = exportJpeg(ed.orig);
        photoData = { photoBlurred: blurred.url, photoOriginal: original.url, photoW: blurred.w, photoH: blurred.h };
      }
      const r = await S.postFound(Object.assign({}, pf.f, photoData, { postSeconds: Math.round((Date.now() - pf.startedAt) / 1000) }), u);
      if (r.error) return err('step3-err', r.error);
      pf.done = r;
      pf.keepDone = true;
      render();
    },
    'desk-claim': (f) => {
      const it = S.itemBySerial(f.dataset.serial);
      const u = requireUser('/item/' + it.serial);
      if (!u) return;
      if (!f.note.value.trim()) return err('desk-claim-err', 'Tell the desk when and where you lost it.');
      S.deskClaim(it, u, f.note.value.trim(), 'No unique mark; owner described when and where');
      rerender();
      toast('Sent to the desk. Go there with your college ID during open hours.');
    },
    claim: (f) => submitClaim(f),
    try: (f) => submitTry(f),
    msg: (f) => {
      const it = S.itemBySerial(f.dataset.serial);
      const r = S.sendMessage(it, S.me(), f.text.value);
      if (r.error) { err('msg-err', r.error); f.text.focus(); return; }
      rerender('msg');
    },
    propose: (f) => {
      const it = S.itemBySerial(f.dataset.serial);
      const fd = new FormData(f);
      const r = S.proposeHandover(it, S.me(), fd.get('spot'), fd.get('day'), fd.get('hour'));
      if (r.error) return err('propose-err', r.error);
      rerender();
      toast('Proposed. The other side can accept it.');
    },
    code: async (f) => {
      const it = S.itemBySerial(f.dataset.serial);
      const r = await S.confirmCode(it, S.me(), f.code.value);
      if (r.error) { err('code-err', r.error); f.code.select(); return; }
      rerender();
      toast('Returned. The case is closed and logged.');
    },
    thanks: (f) => {
      const r = S.thank(S.itemBySerial(f.dataset.serial), S.me(), f.text.value);
      if (r.error) return err('thanks-err', r.error);
      rerender();
      toast('Thank-you note sent, anonymously.');
    },
    lost: (f) => {
      const fd = new FormData(f);
      const v = (k) => String(fd.get(k) || '').trim();
      if (!v('category')) return err('lost-err', 'Pick what you lost.');
      if (v('category') === 'other' && !v('otherLabel')) { err('lost-err', 'Say what you lost, in a few words.'); f.otherLabel.focus(); return; }
      if (!v('zone')) return err('lost-err', 'Pick where you were.');
      if (!v('dateFrom') || !v('dateTo')) return err('lost-err', 'Pick the days.');
      const r = S.fileLost({ category: v('category'), otherLabel: v('otherLabel'), zone: v('zone'), dateFrom: v('dateFrom'), dateTo: v('dateTo'), colour: v('colour'), notes: v('notes') }, S.me());
      go(r.matched ? '/alerts' : '/mine');
      toast(r.matched ? r.matched + ' found tag' + (r.matched > 1 ? 's match' : ' matches') + ' your report.' : 'Filed. You get an alert when a matching tag goes up.');
    },
    'desk-code': async (f) => {
      const it = S.itemBySerial(f.dataset.serial);
      const r = await S.confirmCode(it, S.me(), f.code.value);
      if (r.error) return err('dc-err-' + it.serial, r.error);
      rerender();
      toast('#' + it.serial + ' returned and logged.');
    },
    'desk-collect': (f) => {
      const it = S.itemBySerial(f.dataset.serial);
      const r = S.deskHandOver(it, S.me(), f.roll.value);
      if (r.error) return err('collect-err-' + it.serial, r.error);
      rerender();
      toast('#' + it.serial + ' handed over and logged.');
    },
    intake: async (f) => {
      const fd = new FormData(f);
      if (fd.get('category') === 'other' && !String(fd.get('otherLabel') || '').trim()) return err('intake-err', 'Say what was handed in.');
      const r = await S.deskIntake({ category: fd.get('category'), otherLabel: String(fd.get('otherLabel') || ''), zone: fd.get('zone'), foundOn: S.today(), rollOnItem: String(fd.get('rollOnItem') || ''), note: String(fd.get('note') || '') }, S.me());
      if (r.error) return err('intake-err', r.error);
      rerender();
      toast('Logged as #' + r.item.serial + '.');
    }
  };

  const changes = {
    photo: (el) => {
      const file = el.files && el.files[0];
      if (!file) return;
      if (!/^image\//.test(file.type)) return err('photo-err', 'That file is not a photo.');
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { loadEditor(img); URL.revokeObjectURL(url); rerender(); };
      img.onerror = () => err('photo-err', 'Could not open that photo. Try another one.');
      img.src = url;
    },
    nomark: (el) => {
      const f = el.form;
      f.question.disabled = el.checked;
      f.answer.disabled = el.checked;
    }
  };

  view.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (b && actions[b.dataset.action]) { e.preventDefault(); actions[b.dataset.action](b, e); }
  });
  view.addEventListener('submit', (e) => {
    const f = e.target.closest('form[data-form]');
    if (f && forms[f.dataset.form]) { e.preventDefault(); forms[f.dataset.form](f, e); }
  });
  view.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset && el.dataset.change && changes[el.dataset.change]) changes[el.dataset.change](el);
    if (el.name === 'brush') { ed.size = el.value; }
    if (el.name === 'category' && el.closest('form[data-form="step2"], form[data-form="lost"], form[data-form="intake"]')) {
      const of = document.getElementById('other-field');
      if (of) { of.hidden = el.value !== 'other'; if (!of.hidden) of.querySelector('input').focus(); }
    }
    if (el.name === 'zone' && el.closest('form[data-form="step2"]')) {
      const rf = document.getElementById('route-field');
      if (rf) rf.hidden = el.value !== 'transport';
    }
    const ff = el.closest('form[data-form="filters"]');
    if (ff) forms.filters(ff);
  });
  view.addEventListener('input', (e) => {
    const ff = e.target.closest('form[data-form="filters"]');
    if (ff && e.target.name === 'q') forms.filters(ff);
  });

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-global="signout"]');
    if (b) { S.signOut(); go('/'); render(); toast('Signed out.'); }
  });
  document.getElementById('demo-user').addEventListener('change', (e) => {
    if (e.target.value) S.signInAs(e.target.value); else S.signOut();
    pf = null;
    render({ keep: true });
    toast(e.target.value ? 'Now viewing as ' + S.aliasOf(S.me()) + '.' : 'Signed out.');
  });
  document.getElementById('demo-reset').addEventListener('click', async () => {
    if (!window.confirm('Reset the demo? Every post, claim and chat made in this browser is deleted and the sample data comes back.')) return;
    await S.reset();
    pf = null; otp = null;
    Object.assign(filters, { cat: 'all', zone: 'all', days: 'all', q: '' });
    go('/');
    render();
    toast('Demo reset.');
  });

  window.addEventListener('hashchange', () => render());

  S.init().then(() => render());

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
