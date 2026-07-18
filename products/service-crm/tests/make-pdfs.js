// Generate PDFs of every buyer/seller guide. Markdown → styled HTML → PDF (Playwright/Chromium);
// the two print-designed HTML guides render directly. Output → guide-pdfs/.
//   node tests/make-pdfs.js
const { chromium } = require('playwright');
const { marked } = require('marked');
const fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'guide-pdfs');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

// Markdown guides (exclude internal session wrap-ups and the dev test README).
const mdGuides = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.md') && !/^SESSION-WRAPUP/.test(f))
  .concat(['variants/README.md']);
// Print-designed HTML guides (their own @page CSS + full-bleed art).
const htmlGuides = ['delivery-template.html', 'deploy-card.html'];

const CSS = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1a1c1f; line-height: 1.5; font-size: 11pt; max-width: 100%; }
  h1 { font-size: 22pt; border-bottom: 3px solid #8f5f22; padding-bottom: 6px; margin: 0 0 14px; color: #1a1c1f; }
  h2 { font-size: 15pt; margin: 22px 0 8px; color: #8f5f22; }
  h3 { font-size: 12.5pt; margin: 16px 0 6px; }
  p, li { font-size: 11pt; }
  ul, ol { padding-left: 22px; }
  li { margin: 3px 0; }
  code { background: #f3f0ea; padding: 1px 5px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 9.5pt; }
  pre { background: #f7f4ee; border: 1px solid #e4dccd; border-radius: 8px; padding: 12px 14px; overflow-x: auto; page-break-inside: avoid; }
  pre code { background: none; padding: 0; font-size: 9pt; line-height: 1.45; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 10pt; }
  th, td { border: 1px solid #e0d8c8; padding: 6px 9px; text-align: left; vertical-align: top; }
  th { background: #efe9dc; }
  blockquote { border-left: 3px solid #b8823a; margin: 10px 0; padding: 2px 14px; background: #fff8ec; color: #52565c; }
  a { color: #8f5f22; }
  hr { border: none; border-top: 1px solid #e4dccd; margin: 18px 0; }
  h1, h2, h3 { page-break-after: avoid; }
`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let n = 0;

  for (const rel of mdGuides) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) continue;
    const html = '<!doctype html><html><head><meta charset="utf-8"><style>' + CSS + '</style></head><body>' +
      marked.parse(fs.readFileSync(src, 'utf8')) + '</body></html>';
    await page.setContent(html, { waitUntil: 'load' });
    const name = rel.replace(/[\/\\]/g, '-').replace(/\.md$/, '') + '.pdf';
    await page.pdf({ path: path.join(OUT, name), format: 'Letter', printBackground: true,
      margin: { top: '0.6in', bottom: '0.6in', left: '0.7in', right: '0.7in' } });
    n++; console.log('  ✓ ' + name);
  }

  for (const rel of htmlGuides) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) continue;
    await page.goto('file://' + src, { waitUntil: 'load' });
    const name = rel.replace(/\.html$/, '') + '.pdf';
    await page.pdf({ path: path.join(OUT, name), printBackground: true, preferCSSPageSize: true });
    n++; console.log('  ✓ ' + name + ' (print-designed)');
  }

  console.log('\nWrote ' + n + ' PDFs to guide-pdfs/');
  await browser.close();
})().catch(e => { console.error('PDF FAIL', e); process.exit(1); });
