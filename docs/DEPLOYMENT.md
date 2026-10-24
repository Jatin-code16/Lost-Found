# Deploying Kho-Paya for free

Kho-Paya is a static web app: HTML, CSS and JavaScript files with no build step, no server code and no database. Any static host can serve it, and the four below do it for free with HTTPS.

HTTPS matters here. Browsers allow the **camera** and the **offline mode** only on HTTPS pages (or `localhost`). Every host in this guide gives you HTTPS automatically.

| Host | Cost | Setup time | Best for |
|---|---|---|---|
| **GitHub Pages** (recommended) | Free for public repositories | About 5 minutes | Keeping the code and the demo in one place |
| Netlify | Free tier | About 2 minutes | The fastest drag-and-drop demo |
| Cloudflare Pages | Free tier | About 5 minutes | Fast loading worldwide |
| Vercel | Free hobby tier | About 5 minutes | If you already use Vercel |

You never need a paid plan, a credit card, a custom domain or a backend to show the full demo. Free-tier limits change from time to time, so check each host's pricing page if you plan heavy traffic. A class demo is far below any of them.

---

## Contents

1. [Before you deploy](#1-before-you-deploy)
2. [GitHub Pages (recommended)](#2-github-pages-recommended)
3. [Netlify](#3-netlify)
4. [Cloudflare Pages](#4-cloudflare-pages)
5. [Vercel](#5-vercel)
6. [Check the deployed site](#6-check-the-deployed-site)
7. [Demo-day checklist](#7-demo-day-checklist)
8. [Updating the site](#8-updating-the-site)
9. [Troubleshooting](#9-troubleshooting)
10. [What a static deploy does not do](#10-what-a-static-deploy-does-not-do)

---

## 1. Before you deploy

You need:

- a free [GitHub](https://github.com) account;
- [Git](https://git-scm.com/downloads) on your computer;
- optionally, Node.js 18 or later to run the local server and checks.

Test locally first:

```bash
npm start
# open http://localhost:5173 and click through the demo
npm run check     # source scan: expect "Tier: Low" and "Checks failing: 0"
```

### Which files go online

The app itself is these files:

```text
index.html
manifest.webmanifest
sw.js
assets/   (store.js, app.js, drawings.js, app.css, icon.svg)
```

The included GitHub Pages workflow publishes **only these**. The PRD, the docs, `AGENTS.md` and the `.agents/` kit stay in the repository but are not served on the website. The other hosts publish the whole folder unless you point them at a subfolder; nothing in this repository is secret, so either way is safe.

---

## 2. GitHub Pages (recommended)

The repository already contains the workflow `.github/workflows/deploy-pages.yml`. On every push to `main` or `master` it:

1. checks the JavaScript files for syntax errors;
2. copies the app files into a `_site` folder;
3. publishes that folder to GitHub Pages.

### Step 1: create the repository on GitHub

1. Go to [github.com/new](https://github.com/new).
2. Name it, for example `kho-paya`.
3. Choose **Public**. GitHub Pages is free for public repositories; for a private repository it needs a paid plan.
4. Do **not** add a README, `.gitignore` or license there; this project already has a README and `.gitignore`.
5. Click **Create repository**.

### Step 2: push the code

From the project folder (it is already a Git repository):

```bash
git add .
git commit -m "Kho-Paya: campus lost and found with private recovery"
git branch -M main
git remote add origin https://github.com/<your-username>/kho-paya.git
git push -u origin main
```

Replace `<your-username>` with your GitHub username. If you keep the `master` branch name, the workflow runs on it too; skip the `git branch -M main` line.

### Step 3: turn on Pages

1. On GitHub, open the repository → **Settings** → **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.

### Step 4: watch it deploy

1. Open the **Actions** tab. The run "Deploy to GitHub Pages" starts on its own after the push. If it ran before you turned on Pages and failed, click it and choose **Re-run all jobs**.
2. When it shows a green tick (usually within a minute or two), your site is live at:

```text
https://<your-username>.github.io/kho-paya/
```

3. Paste that link into the **Live demo** line at the top of `README.md`, then commit and push.

### Optional: run the deploy by hand

**Actions** → **Deploy to GitHub Pages** → **Run workflow**.

---

## 3. Netlify

### Fastest: drag and drop (no Git needed)

1. Sign up free at [netlify.com](https://www.netlify.com).
2. Open [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag the whole project folder onto the page.
4. You get a link like `https://random-name.netlify.app`. Rename it under **Site configuration** → **Change site name**.

### From GitHub (redeploys on every push)

1. **Add new site** → **Import an existing project** → **GitHub** → pick the repository.
2. Leave **Build command** empty.
3. Set **Publish directory** to `.` (the repository root).
4. Click **Deploy**.

---

## 4. Cloudflare Pages

1. Sign up free at [dash.cloudflare.com](https://dash.cloudflare.com).
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick the repository.
3. Set **Framework preset** to **None**, leave **Build command** empty, and set **Build output directory** to `/`.
4. Click **Save and Deploy**. You get a link like `https://kho-paya.pages.dev`.

---

## 5. Vercel

1. Sign up free at [vercel.com](https://vercel.com) with your GitHub account.
2. **Add New** → **Project** → import the repository.
3. Set **Framework Preset** to **Other**, leave the build command empty, and keep the output directory as the root.
4. Click **Deploy**. You get a link like `https://kho-paya.vercel.app`.

---

## 6. Check the deployed site

Open the live link and go through this list once.

| Check | What you should see |
|---|---|
| Landing page loads | One big manila tag with "The mark you hide is the key." |
| Fonts | Condensed headlines (Teko), not a plain system font |
| Try-it demo | A wrong answer gives *Not a match*; *Play the owner*, then `R.S. CSE-B`, un-blurs the calculator |
| Feed | *Open Kho-Paya* at the bottom shows tags hanging under zones |
| Camera | **Viewing as: Aman** → *Post found* → *Open the camera*. The browser asks for permission and a live preview appears. |
| Full journey | Run the 90-second demo from the README |
| Install | On a phone, the browser menu offers *Add to Home screen* or *Install app* |
| Offline | After one visit, turn on airplane mode and reload; the app still opens |
| Console | Browser developer tools show no red errors |

---

## 7. Demo-day checklist

**The day before**
- [ ] Open the live link on the exact phone and laptop you will present with.
- [ ] Allow camera permission once, so it does not ask on stage.
- [ ] Visit once on each device, so the offline copy is cached.
- [ ] Also keep a local copy: the project folder on the laptop. Opening `index.html` works without internet.

**Just before presenting**
- [ ] Click **Reset demo** in the top bar so the sample data is fresh.
- [ ] Close other tabs; turn on Do Not Disturb.
- [ ] Zoom the browser to 110 to 125 percent if presenting on a projector.

**Good to know while presenting**
- Data lives in each browser separately. Two people on two phones do **not** see each other's posts; switch accounts with **Viewing as** to show both sides on one device.
- The sign-in code is shown on screen on purpose; say that sign-in is simulated in this build.
- If the camera is refused, use *Use the demo calculator photo*; the rest of the demo is identical.

---

## 8. Updating the site

Make the change, then:

```bash
git add .
git commit -m "Describe the change"
git push
```

GitHub Pages, Netlify, Cloudflare Pages and Vercel all redeploy on their own after a push (Netlify Drop needs a new drag and drop).

The service worker loads the network version first, so visitors get the new version on their next visit. If a browser keeps showing an old version, do a hard refresh (`Ctrl+Shift+R`, or `Cmd+Shift+R` on a Mac). For a bigger release, change `const CACHE = 'khopaya-v1';` in `sw.js` to `khopaya-v2` so old cached files are removed.

If you change the sample data in `assets/store.js`, visitors who already have data must click **Reset demo** to see it.

---

## 9. Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| GitHub Actions run fails at "Deploy" | Pages source not set to GitHub Actions | **Settings** → **Pages** → **Source: GitHub Actions**, then re-run the job |
| 404 at the Pages link | First deploy still running, or the repository is private | Wait for the green tick; make the repository public (free Pages) |
| Page loads without styles | Files moved or renamed | Keep `index.html` and the `assets/` folder at the root, side by side |
| "This browser cannot open the camera here" | The page is not on HTTPS or localhost, or the browser is old | Use the HTTPS link; the file picker still works anywhere |
| "Camera permission was refused" | Permission denied earlier | Click the lock or camera icon in the address bar and allow the camera |
| Old version keeps showing | Service-worker cache | Hard refresh; bump `CACHE` in `sw.js` (section 8) |
| Plain fonts | Google Fonts blocked (school network or offline on first visit) | The app still works with system fonts; visit once on an open network |
| Posts disappear | Browser storage cleared, or a private window | Expected in this demo build; **Reset demo** restores the samples |
| "Out of storage space" when posting | Too many large photos in `localStorage` | **Reset demo**, or post with *No photo* |

---

## 10. What a static deploy does not do

The live site is the same demo build as the local one:

- no real emails: the sign-in code is shown on screen;
- no shared data between devices: each browser has its own copy;
- no server-side hashing or protected photo storage.

Turning it into a real campus pilot needs a backend. [ROADMAP.md](ROADMAP.md) lists those add-ons and the free tiers that can run them.
