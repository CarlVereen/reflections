// Record a screencast of the REAL app UI (WebApp.html) driven through the key flows with a rich demo
// dataset. Produces video/walkthrough.webm you can narrate over or use as listing b-roll.
//   node tests/screencast.js
// Reuses the demo dataset from screenshots.js (extracted at runtime, no duplication).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'WebApp.html'), 'utf8');
const SHOTS = fs.readFileSync(path.join(__dirname, 'screenshots.js'), 'utf8');
const STUB = SHOTS.match(/const STUB = `([\s\S]*?)`;/)[1].replace(/\$\{LAT\}/g, '40');   // rich in-memory demo backend (resolve the ${LAT} placeholder to a literal)

const OUT = path.join(ROOT, 'video');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
const W = 400, H = 820;

(async () => {
  const wired = HTML.replace('<script>', () => '<script>\n' + STUB + '\n');
  const tmp = path.join(__dirname, 'webapp-cast.html'); fs.writeFileSync(tmp, wired);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: W, height: H } } });
  const page = await context.newPage();
  const beat = (ms) => page.waitForTimeout(ms);

  await page.goto('file://' + tmp, { waitUntil: 'domcontentloaded' });
  await beat(700);
  // preload data-backed screens so the home dashboard has rich KPIs
  await page.evaluate(() => nav('clients')); await beat(300);
  await page.evaluate(() => nav('jobs')); await beat(300);
  await page.evaluate(() => nav('billing')); await beat(300);

  // 1) Home dashboard
  await page.evaluate(() => { nav('home'); loadHome(); }); await beat(2800);
  // 2) Clients list
  await page.evaluate(() => nav('clients')); await beat(1600);
  // 3) A client card: Call / Text / Directions + activity
  await page.evaluate(() => openClient('CL-0001')); await beat(3000);
  await page.evaluate(() => closeModal()); await beat(500);
  // 4) Schedule a job: show the Date + Time fields (the scheduling feature)
  await page.evaluate(() => { nav('jobs'); setJobTab('upcoming'); }); await beat(1600);
  await page.evaluate(() => openJobForm('CL-0003')); await beat(2600);
  await page.evaluate(() => closeModal()); await beat(400);
  // 5) Billing: quotes + invoices
  await page.evaluate(() => nav('billing')); await beat(2200);
  // 6) Settings: the Scheduling / Google Calendar sync section
  await page.evaluate(() => nav('settings')); await beat(500);
  await page.evaluate(() => { var h=[].slice.call(document.querySelectorAll('#settingsBody h2')).filter(function(e){return /Scheduling/.test(e.textContent);})[0]; if(h)h.scrollIntoView({behavior:'smooth'}); }); await beat(2600);
  // 7) Back home
  await page.evaluate(() => nav('home')); await beat(1600);

  const video = page.video();
  await context.close();   // finalizes the video file
  const src = await video.path();
  const dest = path.join(OUT, 'walkthrough.webm');
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  fs.renameSync(src, dest);
  fs.unlinkSync(tmp);
  await browser.close();
  const kb = Math.round(fs.statSync(dest).size / 1024);
  console.log('Wrote video/walkthrough.webm (' + kb + ' KB, ' + W + 'x' + H + ')');
})().catch(e => { console.error('CAST FAIL', e); process.exit(1); });
