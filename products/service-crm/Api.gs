/*************************************************************************
 *  SERVICE PRO CRM — WEB APP API  (Api.gs)
 *
 *  Serves a full web-app UI (WebApp.html) backed by the SAME Google Sheet
 *  tabs as the database. Deploy: Deploy ▸ New deployment ▸ Web app ▸
 *  Execute as "Me", Access "Only myself" ▸ Authorize ▸ copy the URL.
 *
 *  All api* functions are UI-free (no SpreadsheetApp.getUi) so they work
 *  from google.script.run in the web app. They return plain objects.
 *************************************************************************/

function doGet() {
  // Note: no ALLOWALL X-Frame-Options — the default keeps other sites from framing
  // the app (clickjacking protection). The app is opened directly, not embedded.
  return HtmlService.createHtmlOutputFromFile('WebApp')
    .setTitle('Service Pro CRM')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

/* ----------------------------- helpers ---------------------------- */

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function tz_() { return Session.getScriptTimeZone(); }
function fmtd_(d) { return (d instanceof Date) ? Utilities.formatDate(d, tz_(), 'M/d/yyyy') : (d ? String(d) : ''); }
function isoOrEmpty_(d) { return (d instanceof Date) ? Utilities.formatDate(d, tz_(), 'yyyy-MM-dd') : ''; }
function num_(x) { const n = Number(x); return isNaN(n) ? 0 : n; }

/** First empty row (by a key column) in a sheet whose lower rows may hold formulas. */
function firstEmptyRow_(sh, keyCol) {
  const scan = Math.max(sh.getMaxRows() - 1, 1);
  const col = sh.getRange(2, keyCol, scan, 1).getValues();
  for (let i = 0; i < col.length; i++) if (String(col[i][0]).trim() === '') return i + 2;
  return sh.getLastRow() + 1;
}

/** Find a row by matching a value in column A. Returns row index or 0. */
function findRowByNumber_(sh, number) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const col = sh.getRange(2, 1, last - 1, 1).getValues();
  const key = String(number).trim().toLowerCase();
  for (let i = 0; i < col.length; i++) if (String(col[i][0]).trim().toLowerCase() === key) return i + 2;
  return 0;
}

/** Split a doc number into its parts: "INV-001" → {prefix:'INV-', num:1, width:3}.
 *  Pure text with no digits → num 1, width 0. Pure number → prefix '' kept as-is. */
function parseDocNumber_(v) {
  const s = String(v == null ? '' : v).trim();
  const m = s.match(/^(.*?)(\d+)\s*$/);
  if (!m) return { prefix: s, num: 1, width: 0 };
  return { prefix: m[1], num: Number(m[2]), width: m[2].length };
}

/** Rebuild a doc number from parts, zero-padding the numeric run to at least `width`. */
function formatDocNumber_(prefix, num, width) {
  let s = String(num);
  while (s.length < width) s = '0' + s;
  return prefix + s;
}

/** Next doc number for a sheet, honoring a configurable start that may be a plain
 *  number ("1001"), plain text, or a text+number combo ("INV-001"). Continues the
 *  highest existing doc that shares the same prefix, preserving prefix & zero-pad width;
 *  otherwise begins at the configured start. Falls back to `fallback` if start is blank. */
function nextDocNumber_(sh, startSetting, fallback) {
  const raw = (startSetting === '' || startSetting == null) ? fallback : startSetting;
  const start = parseDocNumber_(raw);
  let maxNum = start.num - 1;
  const last = sh.getLastRow();
  if (last >= 2) {
    const col = sh.getRange(2, 1, last - 1, 1).getValues();
    col.forEach(function (r) {
      const v = String(r[0]).trim();
      if (!v) return;
      const p = parseDocNumber_(v);
      if (p.prefix.toLowerCase() === start.prefix.toLowerCase() && p.num > maxNum) maxNum = p.num;
    });
  }
  return formatDocNumber_(start.prefix, maxNum + 1, start.width);
}

/** Write line items (Doc # = number) into the 🧾 Line Items tab at empty rows. */
function appendLineItems_(ss, number, lines) {
  const sh = ss.getSheetByName(TABS.ITEMS);
  if (!sh || !lines || !lines.length) return;
  const scan = Math.max(sh.getMaxRows() - 1, 1);
  const colA = sh.getRange(2, 1, scan, 1).getValues();
  let ptr = 0;
  lines.forEach(function (l) {
    const desc = String((l.service || l.desc || '')).trim();
    if (!desc) return;
    while (ptr < colA.length && String(colA[ptr][0]).trim() !== '') ptr++;
    if (ptr >= colA.length) return;
    const r = ptr + 2;
    sh.getRange(r, 1, 1, 4).setValues([[number, desc, num_(l.qty) || 1, num_(l.rate)]]);
    sh.getRange(r, 5).setFormula('=IF(AND($C' + r + '<>"",$D' + r + '<>""),$C' + r + '*$D' + r + ',"")');
    colA[ptr][0] = number; ptr++;
  });
}

/** Clear all line items rows for a given Doc #. */
function clearLinesForNumber_(ss, number) {
  const sh = ss.getSheetByName(TABS.ITEMS);
  if (!sh) return;
  const last = sh.getLastRow();
  if (last < 2) return;
  const data = sh.getRange(2, 1, last - 1, 1).getValues();
  const key = String(number).trim().toLowerCase();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === key) sh.getRange(i + 2, 1, 1, 4).clearContent();
  }
}

/* --------------------- shared doc (PDF) helpers -------------------- */

function niceKind_(kind) { return kind === 'INVOICE' ? 'Invoice' : 'Estimate'; }

function docClientEmail_(ss, name) {
  const c = ss.getSheetByName(TABS.CLIENTS);
  if (!c) return '';
  const d = c.getDataRange().getValues();
  for (let i = 1; i < d.length; i++) if (String(d[i][0]).trim().toLowerCase() === String(name).trim().toLowerCase()) return String(d[i][2]).trim();
  return '';
}

/** vals = [num, client, dateA, dateB, amount, status]. */
function docComputed_(ss, kind, vals) {
  const taxPct = num_(getSetting_(ss, 'Sales tax % (0 for none)'));
  const items = lineItemsFor_(ss, vals[0]);
  let subtotal = 0, tax = 0;
  if (items.length) { items.forEach(function (it) { subtotal += it.qty * it.rate; }); tax = subtotal * taxPct / 100; }
  else { subtotal = num_(vals[4]); }
  return { items: items, subtotal: subtotal, tax: tax, total: subtotal + tax, taxPct: taxPct };
}

function docHtml_(ss, kind, vals, comp) {
  const isInv = (kind === 'INVOICE');
  const numv = (vals[0] === '' || vals[0] === null) ? 'draft' : vals[0];
  const biz = getSetting_(ss, 'Business name') || 'Your Business';
  const bizPhone = getSetting_(ss, 'Business phone') || '';
  const pay = getSetting_(ss, 'Invoice payment instructions') || '';
  const payLink = String(getSetting_(ss, 'Payment link (Stripe/PayPal/Venmo — optional)') || '').trim();
  const cur = String(getSetting_(ss, 'Currency symbol') || '$').trim() || '$';
  const fmtD = function (d) { return (d instanceof Date) ? Utilities.formatDate(d, tz_(), 'MMM d, yyyy') : ''; };
  const money = function (n) { return cur + num_(n).toFixed(2); };
  const email = docClientEmail_(ss, vals[1]);
  let rowsHtml = '';
  if (comp.items.length) {
    comp.items.forEach(function (it) {
      const lt = it.qty * it.rate;
      rowsHtml += '<tr><td style="padding:9px;border-bottom:1px solid #eee">' + escHtml_(it.desc) + '</td>' +
        '<td style="padding:9px;border-bottom:1px solid #eee;text-align:center">' + it.qty + '</td>' +
        '<td style="padding:9px;border-bottom:1px solid #eee;text-align:right">' + money(it.rate) + '</td>' +
        '<td style="padding:9px;border-bottom:1px solid #eee;text-align:right">' + money(lt) + '</td></tr>';
    });
  } else {
    rowsHtml = '<tr><td style="padding:9px;border-bottom:1px solid #eee">Services rendered — ' + biz + '</td>' +
      '<td style="padding:9px;border-bottom:1px solid #eee;text-align:center">1</td>' +
      '<td style="padding:9px;border-bottom:1px solid #eee;text-align:right">' + money(comp.subtotal) + '</td>' +
      '<td style="padding:9px;border-bottom:1px solid #eee;text-align:right">' + money(comp.subtotal) + '</td></tr>';
  }
  const title = isInv ? 'INVOICE' : 'ESTIMATE';
  const isReceipt = isInv && invoiceTermsDays_(ss) === 0;   // due same day → wording, not a date
  const dateBLabel = isInv ? 'Due' : 'Valid until';
  const dateBValue = isReceipt ? 'Upon receipt' : fmtD(vals[3]);
  const totalsRows =
    (comp.tax > 0 ?
      '<tr><td colspan="3" style="padding:6px 9px;text-align:right">Subtotal</td><td style="padding:6px 9px;text-align:right">' + money(comp.subtotal) + '</td></tr>' +
      '<tr><td colspan="3" style="padding:6px 9px;text-align:right">Tax (' + comp.taxPct + '%)</td><td style="padding:6px 9px;text-align:right">' + money(comp.tax) + '</td></tr>' : '') +
    '<tr><td colspan="3" style="padding:9px;text-align:right;font-weight:bold">' + (isInv ? 'Total Due' : 'Estimated Total') + '</td>' +
    '<td style="padding:9px;text-align:right;font-weight:bold;font-size:18px;color:' + BRAND.accent2 + '">' + money(comp.total) + '</td></tr>';
  const payBtn = (isInv && payLink) ?
    '<p style="text-align:center;margin:22px 0"><a href="' + payLink + '" style="background:' + BRAND.accent2 +
    ';color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:bold">Pay now</a></p>' : '';
  return '<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1a1c1f">' +
    '<table style="width:100%;border-bottom:3px solid ' + BRAND.accent + ';margin-bottom:22px"><tr>' +
    '<td style="padding-bottom:14px;vertical-align:top"><div style="font-size:24px;font-weight:bold">' + biz + '</div>' +
    (bizPhone ? '<div style="color:#52565c">' + bizPhone + '</div>' : '') + '</td>' +
    '<td style="padding-bottom:14px;text-align:right;vertical-align:top">' +
    '<div style="font-size:28px;font-weight:bold;color:' + BRAND.accent + '">' + title + '</div>' +
    '<div style="color:#52565c">#' + numv + '</div></td></tr></table>' +
    '<table style="width:100%;margin-bottom:20px"><tr>' +
    '<td><b>' + (isInv ? 'Bill to' : 'Prepared for') + ':</b><br>' + escHtml_(vals[1]) + (email ? '<br>' + escHtml_(email) : '') + '</td>' +
    '<td style="text-align:right"><b>Issued:</b> ' + fmtD(vals[2]) + '<br><b>' + dateBLabel + ':</b> ' + dateBValue + '</td></tr></table>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:6px">' +
    '<tr style="background:#1a1c1f;color:#fff"><th style="text-align:left;padding:9px">Description</th>' +
    '<th style="padding:9px">Qty</th><th style="text-align:right;padding:9px">Rate</th><th style="text-align:right;padding:9px">Amount</th></tr>' +
    rowsHtml + totalsRows + '</table>' + payBtn +
    (pay && isInv ? '<div style="background:' + BRAND.soft + ';padding:14px;border-radius:8px"><b>Payment:</b> ' + pay + '</div>' : '') +
    '<p style="color:#52565c;margin-top:20px">' + (isInv ? 'Thank you for your business!' :
      'This estimate is for your review — reply to accept and we\'ll get you scheduled.') + '</p></div>';
}

function docPdfBlob_(kind, vals, html) {
  const numv = (vals[0] === '' || vals[0] === null) ? 'draft' : vals[0];
  return Utilities.newBlob(html, 'text/html', 'doc.html').getAs('application/pdf')
    .setName(niceKind_(kind) + '-' + numv + '-' + String(vals[1]).replace(/\s+/g, '') + '.pdf');
}

function docEmail_(ss, kind, vals, pdf, email) {
  const isInv = (kind === 'INVOICE');
  const biz = getSetting_(ss, 'Business name') || 'Your Business';
  const pay = getSetting_(ss, 'Invoice payment instructions') || '';
  const payLink = String(getSetting_(ss, 'Payment link (Stripe/PayPal/Venmo — optional)') || '').trim();
  const numv = (vals[0] === '' || vals[0] === null) ? '' : vals[0];
  MailApp.sendEmail({ to: email, subject: niceKind_(kind) + ' #' + numv + ' from ' + biz,
    htmlBody: 'Hi ' + escHtml_(String(vals[1]).split(' ')[0]) + ',<br><br>Please find your ' + kind.toLowerCase() + ' attached. ' +
      (isInv && payLink ? 'Pay online here: ' + payLink + '<br>' : '') + (isInv && pay ? pay : '') +
      '<br><br>Thank you!<br>' + biz, attachments: [pdf] });
}

/* ============================ BOOTSTRAP =========================== */

function apiBootstrap() {
  const ss = ss_();
  if (!ss.getSheetByName(TABS.LEADS)) return { ready: false };
  return {
    ready: true,
    settings: apiGetSettings(),
    services: getServices_(ss),
    dashboard: apiDashboard(),
    leadStatuses: LEAD_STATUSES,
    jobStatuses: JOB_STATUSES,
    invStatuses: INV_STATUSES,
    estStatuses: EST_STATUSES,
    repeatOpts: REPEAT_OPTS,
  };
}

function apiDashboard() {
  const ss = ss_();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const wkStart = new Date(today); wkStart.setDate(wkStart.getDate() - wkStart.getDay());
  const wkEnd = new Date(wkStart); wkEnd.setDate(wkEnd.getDate() + 7);
  const monStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const leads = valuesOf_(ss, TABS.LEADS);
  const jobs = valuesOf_(ss, TABS.JOBS);
  const invs = valuesOf_(ss, TABS.INVOICES);

  const dead = function (s) { return s === 'Won' || s === 'Lost' || s === 'Declined'; };
  let newLeads = 0, pipeline = 0, lost = 0;
  const followUps = [];
  leads.forEach(function (r) {
    if (!r[1]) return;
    const added = r[0], status = r[7], follow = r[8];
    if (added instanceof Date && added >= new Date(today.getTime() - 7 * 864e5)) newLeads++;
    if (!dead(status) && status !== '') pipeline += num_(r[6]);
    if (status === 'Lost' || status === 'Declined') lost++;   // said no / don't contact
    if (!dead(status) && follow instanceof Date) {
      const f = new Date(follow); f.setHours(0, 0, 0, 0);
      if (f <= today) followUps.push({ name: r[1], phone: r[2] || '', status: status, due: fmtd_(f) });
    }
  });

  // "Won" under the new model = someone who became a client with a logged job.
  const wonClients = {};
  let jobsWeek = 0; const weekJobs = [];
  jobs.forEach(function (r, i) {
    if (r[1]) wonClients[String(r[1]).trim().toLowerCase()] = true;
    if (!(r[0] instanceof Date)) return;
    const d = new Date(r[0]); d.setHours(0, 0, 0, 0);
    if (d >= wkStart && d < wkEnd && r[4] !== 'Cancelled') { jobsWeek++; weekJobs.push({ row: i + 2, date: fmtd_(d), client: r[1], service: r[2] || '', status: r[4] || '' }); }
  });
  const won = Object.keys(wonClients).length;

  let revMonth = 0, revLife = 0, unpaid = 0;
  invs.forEach(function (r) {
    const st = r[5], amt = num_(r[4]);
    if (st === 'Paid') { revLife += amt; if (r[2] instanceof Date && r[2] >= monStart) revMonth += amt; }
    if (st === 'Sent' || st === 'Overdue') unpaid += amt;   // billed and still owed to you
  });

  return {
    newLeads: newLeads, pipeline: pipeline, unpaid: unpaid, jobsWeek: jobsWeek, revMonth: revMonth,
    winRate: (won + lost) ? Math.round(won / (won + lost) * 100) : 0, revLife: revLife,
    followUps: followUps, weekJobs: weekJobs,
  };
}

function valuesOf_(ss, tab) {
  const sh = ss.getSheetByName(tab);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}

/* ========================= CONTACTS (leads + clients) ============= */

/** One combined list of everyone — leads and clients merged & deduped by name —
 *  each with their lead status, last job date, total spent, and edit rows.
 *  The app shows a status tag (New/Quoted/Declined/Lost) until they have a logged
 *  job, then shows their last job date instead. */
function apiListContacts() {
  const ss = ss_();
  const map = {};
  const keyOf = function (name) { return String(name || '').trim().toLowerCase(); };
  const get = function (name) {
    const k = keyOf(name); if (!k) return null;
    if (!map[k]) map[k] = { key: k, name: String(name).trim(), phone: '', email: '', address: '',
      leadRow: 0, clientRow: 0, leadStatus: '', followUp: '', followUpISO: '',
      lastJobISO: '', lastJobDate: '', jobCount: 0, totalSpent: 0 };
    return map[k];
  };

  valuesOf_(ss, TABS.LEADS).forEach(function (r, i) {   // [added,name,phone,email,src,svc,val,status,follow,notes]
    if (!r[1]) return;
    const c = get(r[1]); if (!c) return;
    c.leadRow = i + 2;
    if (!c.phone && r[2]) c.phone = String(r[2]);
    if (!c.email && r[3]) c.email = String(r[3]);
    c.leadStatus = r[7] || 'New';
    c.followUp = fmtd_(r[8]); c.followUpISO = isoOrEmpty_(r[8]);
  });

  valuesOf_(ss, TABS.CLIENTS).forEach(function (r, i) { // [name,phone,email,address,firstJob,totalSpent,notes]
    if (!r[0]) return;
    const c = get(r[0]); if (!c) return;
    c.clientRow = i + 2;
    if (r[1]) c.phone = String(r[1]);
    if (r[2]) c.email = String(r[2]);
    if (r[3]) c.address = String(r[3]);
    c.totalSpent = num_(r[5]);
  });

  valuesOf_(ss, TABS.JOBS).forEach(function (r) {       // last job date per client name
    if (!r[1] || !(r[0] instanceof Date)) return;
    const c = get(r[1]); if (!c) return;
    c.jobCount++;
    const iso = isoOrEmpty_(r[0]);
    if (iso && iso > c.lastJobISO) { c.lastJobISO = iso; c.lastJobDate = fmtd_(r[0]); }
  });

  return Object.keys(map).map(function (k) { return map[k]; });
}

/* ============================== LEADS ============================= */

function apiListLeads() {
  const ss = ss_();
  const rows = valuesOf_(ss, TABS.LEADS);
  const out = [];
  rows.forEach(function (r, i) {
    if (!r[1]) return;
    out.push({ row: i + 2, name: r[1], phone: r[2] || '', email: r[3] || '', service: r[5] || '',
      value: num_(r[6]), status: r[7] || 'New', followUp: fmtd_(r[8]), followUpISO: isoOrEmpty_(r[8]) });
  });
  return out;
}

function apiAddLead(form) {
  const ss = ss_();
  // Warn (don't block) when the email or phone already exists on a lead or client.
  if (!form.force) {
    const dupes = findContactDupes_(ss, form.email, form.phone, 0);
    if (dupes.length) return { ok: false, dup: true, dupes: dupes };
  }
  const msg = addLeadCore_(form.name, form.phone, form.email, form.service, form.value);
  return { ok: msg.indexOf('✅') === 0, msg: msg };
}

/** Digits only; blank unless it looks like a real phone (≥7 digits) to avoid noise matches. */
function normPhone_(s) { const d = String(s || '').replace(/[^0-9]/g, ''); return d.length >= 7 ? d : ''; }

/** Find existing Leads/Clients that share this email or phone (for a warn-not-block prompt).
 *  Returns [{where:'lead'|'client', name, phone, email}] — empty if nothing matches. */
function findContactDupes_(ss, email, phone, excludeLeadRow) {
  const out = [];
  const em = String(email || '').trim().toLowerCase();
  const ph = normPhone_(phone);
  if (!em && !ph) return out;
  const push = function (where, name, p, e) {
    const en = String(e || '').trim().toLowerCase(), pn = normPhone_(p);
    if ((em && en && en === em) || (ph && pn && pn === ph)) {
      out.push({ where: where, name: String(name).trim(), phone: String(p || '').trim(), email: String(e || '').trim() });
    }
  };
  const leads = ss.getSheetByName(TABS.LEADS);   // [added, name, phone(2), email(3), ...]
  if (leads && leads.getLastRow() >= 2) {
    const d = leads.getRange(2, 1, leads.getLastRow() - 1, 4).getValues();
    for (let i = 0; i < d.length; i++) {
      if (excludeLeadRow && (i + 2) === excludeLeadRow) continue;
      if (String(d[i][1]).trim()) push('lead', d[i][1], d[i][2], d[i][3]);
    }
  }
  const clients = ss.getSheetByName(TABS.CLIENTS); // [name, phone(1), email(2), ...]
  if (clients && clients.getLastRow() >= 2) {
    const d = clients.getRange(2, 1, clients.getLastRow() - 1, 3).getValues();
    for (let i = 0; i < d.length; i++) {
      if (String(d[i][0]).trim()) push('client', d[i][0], d[i][1], d[i][2]);
    }
  }
  return out;
}

function apiSetLeadStatus(row, status) {
  const sh = ss_().getSheetByName(TABS.LEADS);
  sh.getRange(row, 8).setValue(status);
  return { ok: true };
}

/** Parse a date from the app: 'yyyy-MM-dd' (interpreted in the script's local time so
 *  the day never shifts) or a typed date. Returns a midnight Date, or null. */
function toLocalDate_(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) { const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])); d.setHours(0, 0, 0, 0); return d; }
  return parseDate_(iso) || null;
}

/** Set a lead's Next Follow-up date (col 9). Accepts an app date; '' clears it. */
function apiSetLeadFollowUp(row, iso) {
  const sh = ss_().getSheetByName(TABS.LEADS);
  const d = toLocalDate_(iso) || '';
  sh.getRange(row, 9).setValue(d);
  return { ok: true, followUp: d ? fmtd_(d) : '', followUpISO: d ? isoOrEmpty_(d) : '' };
}

/** Edit a lead's core fields (name, phone, email, service, est. value). */
function apiUpdateLead(row, f) {
  const sh = ss_().getSheetByName(TABS.LEADS);
  if (!sh) return { ok: false };
  if (f.name !== undefined) sh.getRange(row, 2).setValue(f.name);
  if (f.phone !== undefined) sh.getRange(row, 3).setValue(f.phone);
  if (f.email !== undefined) sh.getRange(row, 4).setValue(f.email);
  if (f.service !== undefined) sh.getRange(row, 6).setValue(f.service);
  if (f.value !== undefined) sh.getRange(row, 7).setValue(f.value === '' ? '' : num_(f.value));
  return { ok: true };
}

/* ============================= CLIENTS =========================== */

/** Edit a client. Renaming cascades to Jobs/Estimates/Invoices/Leads so totals & lookups stay correct. */
function apiUpdateClient(row, f) {
  const ss = ss_();
  const sh = ss.getSheetByName(TABS.CLIENTS);
  if (!sh) return { ok: false };
  const oldName = String(sh.getRange(row, 1).getValue()).trim();
  if (f.name !== undefined) {
    const newName = String(f.name).trim();
    if (newName && newName !== oldName) {
      sh.getRange(row, 1).setValue(newName);
      renameClientEverywhere_(ss, oldName, newName);
    }
  }
  if (f.phone !== undefined) sh.getRange(row, 2).setValue(f.phone);
  if (f.email !== undefined) sh.getRange(row, 3).setValue(f.email);
  if (f.address !== undefined) sh.getRange(row, 4).setValue(f.address);
  return { ok: true };
}

/** Rewrite every reference to oldName (client column) across the data tabs to newName. */
function renameClientEverywhere_(ss, oldName, newName) {
  const key = String(oldName).trim().toLowerCase();
  if (!key) return;
  [[TABS.JOBS, 2], [TABS.ESTIMATES, 2], [TABS.INVOICES, 2], [TABS.LEADS, 2]].forEach(function (t) {
    const sh = ss.getSheetByName(t[0]);
    if (!sh || sh.getLastRow() < 2) return;
    const rng = sh.getRange(2, t[1], sh.getLastRow() - 1, 1);
    const vals = rng.getValues();
    let changed = false;
    for (let i = 0; i < vals.length; i++) {
      if (String(vals[i][0]).trim().toLowerCase() === key) { vals[i][0] = newName; changed = true; }
    }
    if (changed) rng.setValues(vals);
  });
}

function apiListClients() {
  const rows = valuesOf_(ss_(), TABS.CLIENTS);
  const out = [];
  rows.forEach(function (r, i) {
    if (!r[0]) return;
    out.push({ row: i + 2, name: r[0], phone: r[1] || '', email: r[2] || '', address: r[3] || '',
      firstJob: fmtd_(r[4]), totalSpent: num_(r[5]) });
  });
  return out;
}

/* ============================== JOBS ============================= */

function apiListJobs() {
  const rows = valuesOf_(ss_(), TABS.JOBS);
  const out = [];
  rows.forEach(function (r, i) {
    // Show any row that has a client OR a date (matches what the Home screen counts),
    // so a job can never appear on Home but be missing here.
    if (!r[1] && !(r[0] instanceof Date)) return;
    out.push({ row: i + 2, date: fmtd_(r[0]), dateISO: isoOrEmpty_(r[0]), client: r[1] || '(no name)', service: r[2] || '', time: r[3] || '',
      status: r[4] || 'Scheduled', price: num_(r[5]), paid: r[6] || 'No', repeat: r[10] || 'None' });
  });
  return out;
}

function apiAddJob(form) {
  const ss = ss_();
  const sh = ss.getSheetByName(TABS.JOBS);
  const when = parseDate_(form.date) || new Date();
  sh.appendRow([when, form.client, form.service || '', form.time || '', 'Scheduled', num_(form.price),
    'No', 'No', 'No', form.notes || '', form.repeat || 'None', 'No', '']);
  upsertClient_(ss, form.client, form.phone || '', form.email || '', 'From job');
  return { ok: true };
}

function apiSetJob(row, fields) {
  const sh = ss_().getSheetByName(TABS.JOBS);
  if (fields.status) sh.getRange(row, 5).setValue(fields.status);
  if (fields.paid) sh.getRange(row, 7).setValue(fields.paid);
  let d = null;
  if (fields.date !== undefined) { d = toLocalDate_(fields.date); if (d) sh.getRange(row, 1).setValue(d); }
  if (fields.time !== undefined) sh.getRange(row, 4).setValue(fields.time);
  return { ok: true, date: d ? fmtd_(d) : '', dateISO: d ? isoOrEmpty_(d) : '' };  // no re-read
}

/* ====================== ESTIMATES & INVOICES ===================== */

function apiListDocs(kind) {
  const ss = ss_();
  const isInv = (kind === 'INVOICE');
  const rows = valuesOf_(ss, isInv ? TABS.INVOICES : TABS.ESTIMATES);
  const out = [];
  rows.forEach(function (r, i) {
    if (r[0] === '' || r[0] === null) return;
    // NOTE: don't count line items here — that meant re-reading the whole Line Items
    // sheet once per doc (O(docs × items), quadratic). The list doesn't use the count.
    out.push({ row: i + 2, number: r[0], client: r[1] || '', dateA: fmtd_(r[2]), dateB: fmtd_(r[3]),
      amount: num_(r[4]), status: r[5] || 'Draft' });
  });
  return out;
}

/** Both lists in ONE round-trip — the Billing screen used to make two google.script.run
 *  calls (estimates + invoices); this halves the latency. */
function apiListBilling() {
  return { estimates: apiListDocs('ESTIMATE'), invoices: apiListDocs('INVOICE') };
}

function apiGetDocLines(number) {
  return lineItemsFor_(ss_(), number).map(function (it) { return { service: it.desc, qty: it.qty, rate: it.rate }; });
}

/** Create an estimate from the builder: {client, email, phone, validDays, lines:[{service,qty,rate}]}. */
function apiCreateEstimate(p) {
  const ss = ss_();
  const est = ss.getSheetByName(TABS.ESTIMATES);
  if (!p.client || !String(p.client).trim()) return { ok: false, msg: 'A client name is required.' };
  const lines = (p.lines || []).filter(function (l) { return String(l.service || '').trim() && num_(l.rate) > 0; });
  if (!lines.length) return { ok: false, msg: 'Add at least one line item with a price.' };
  const number = nextDocNumber_(est, getSetting_(ss, 'Starting quote/estimate number'), '1001');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const valid = new Date(today); valid.setDate(valid.getDate() + (num_(p.validDays) || 14));
  const taxPct = num_(getSetting_(ss, 'Sales tax % (0 for none)'));
  let subtotal = 0; lines.forEach(function (l) { subtotal += (num_(l.qty) || 1) * num_(l.rate); });
  const total = subtotal + subtotal * taxPct / 100;
  est.appendRow([number, p.client, today, valid, total, 'Draft']);
  appendLineItems_(ss, number, lines);
  upsertClient_(ss, p.client, p.phone || '', p.email || '', 'From estimate ' + number);
  markLeadQuoted_(ss, p.client);
  return { ok: true, number: number };
}

function markLeadQuoted_(ss, client) {
  const sh = ss.getSheetByName(TABS.LEADS);
  if (!sh || sh.getLastRow() < 2) return;
  const names = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < names.length; i++) {
    if (String(names[i][0]).trim().toLowerCase() === String(client).trim().toLowerCase()) {
      const st = sh.getRange(i + 2, 8);
      if (['New', 'Contacted'].indexOf(String(st.getValue())) > -1) st.setValue('Quoted');
      return;
    }
  }
}

/** Replace a doc's line items and re-sync its Amount. kind decides which sheet. */
function apiSetDocLines(kind, number, lines) {
  const ss = ss_();
  clearLinesForNumber_(ss, number);
  const clean = (lines || []).filter(function (l) { return String(l.service || '').trim() && num_(l.rate) > 0; });
  appendLineItems_(ss, number, clean);
  const isInv = (kind === 'INVOICE');
  const sh = ss.getSheetByName(isInv ? TABS.INVOICES : TABS.ESTIMATES);
  const row = findRowByNumber_(sh, number);
  if (row) {
    const vals = sh.getRange(row, 1, 1, 6).getValues()[0];
    sh.getRange(row, 5).setValue(docComputed_(ss, kind, vals).total);
  }
  return { ok: true };
}

/** Update a doc's editable meta (client, dates, amount, status). */
function apiUpdateDoc(kind, number, fields) {
  const ss = ss_();
  const sh = ss.getSheetByName(kind === 'INVOICE' ? TABS.INVOICES : TABS.ESTIMATES);
  const row = findRowByNumber_(sh, number);
  if (!row) return { ok: false };
  if (fields.client !== undefined) sh.getRange(row, 2).setValue(fields.client);
  if (fields.dateA !== undefined) sh.getRange(row, 3).setValue(parseDate_(fields.dateA) || '');
  if (fields.dateB !== undefined) sh.getRange(row, 4).setValue(parseDate_(fields.dateB) || '');
  if (fields.amount !== undefined) sh.getRange(row, 5).setValue(num_(fields.amount));
  if (fields.status !== undefined) sh.getRange(row, 6).setValue(fields.status);
  return { ok: true };
}

/** Generate + email the PDF for a doc, mark it Sent, save a copy to Drive. */
function apiSendDoc(kind, number) {
  const ss = ss_();
  const sh = ss.getSheetByName(kind === 'INVOICE' ? TABS.INVOICES : TABS.ESTIMATES);
  const row = findRowByNumber_(sh, number);
  if (!row) return { ok: false, msg: 'Not found.' };
  const vals = sh.getRange(row, 1, 1, 6).getValues()[0];
  if (!vals[1]) return { ok: false, msg: 'This ' + kind.toLowerCase() + ' needs a client.' };
  // set issue date on send if blank
  if (!(vals[2] instanceof Date)) { const t = new Date(); t.setHours(0, 0, 0, 0); sh.getRange(row, 3).setValue(t); vals[2] = t; }
  // Invoices: (re)set the due date from the send/issue date using the configured terms.
  // 0 days = due upon receipt (same day). Estimates keep their "Valid until" date.
  if (kind === 'INVOICE') {
    const terms = invoiceTermsDays_(ss);
    const due = new Date(vals[2]); due.setHours(0, 0, 0, 0); due.setDate(due.getDate() + Math.max(0, terms));
    sh.getRange(row, 4).setValue(due); vals[3] = due;
  }
  const comp = docComputed_(ss, kind, vals);
  if (!comp.items.length && !comp.subtotal) return { ok: false, msg: 'Add line items or an amount first.' };
  const pdf = docPdfBlob_(kind, vals, docHtml_(ss, kind, vals, comp));
  sh.getRange(row, 5).setValue(comp.total);
  const email = docClientEmail_(ss, vals[1]);
  if (email) docEmail_(ss, kind, vals, pdf, email);
  sh.getRange(row, 6).setValue('Sent');
  DriveApp.createFile(pdf);
  return { ok: true, emailed: !!email, email: email, total: comp.total };
}

/** Approve an estimate: mark Accepted, create an invoice DRAFT (lines copied) + a scheduled Job.
 *  jobDateIso (optional) sets when the job is scheduled — quote today, work it next week. */
function apiApproveEstimate(number, jobDateIso) {
  const ss = ss_();
  const est = ss.getSheetByName(TABS.ESTIMATES);
  const erow = findRowByNumber_(est, number);
  if (!erow) return { ok: false, msg: 'Estimate not found.' };
  const ev = est.getRange(erow, 1, 1, 6).getValues()[0]; // num, client, issue, valid, amount, status
  est.getRange(erow, 6).setValue('Accepted');

  const inv = ss.getSheetByName(TABS.INVOICES);
  const invNum = nextDocNumber_(inv, getSetting_(ss, 'Starting invoice number'), '9001');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  // Provisional due date on the draft; it's re-set from the actual send date when sent.
  const due = new Date(today); due.setDate(due.getDate() + Math.max(0, invoiceTermsDays_(ss)));
  const items = lineItemsFor_(ss, number).map(function (it) { return { service: it.desc, qty: it.qty, rate: it.rate }; });
  inv.appendRow([invNum, ev[1], '', due, num_(ev[4]), 'Draft']); // issue date filled on send
  appendLineItems_(ss, invNum, items);

  const jobDate = toLocalDate_(jobDateIso) || today;
  const jobs = ss.getSheetByName(TABS.JOBS);
  const summary = items.length ? items.slice(0, 2).map(function (i) { return i.service; }).join(', ') + (items.length > 2 ? '…' : '') : '';
  jobs.appendRow([jobDate, ev[1], summary, '', 'Scheduled', num_(ev[4]), 'No', 'No', 'No', 'From estimate ' + number, 'None', 'No', '']);
  upsertClient_(ss, ev[1], '', '', 'From estimate ' + number);
  return { ok: true, invoiceNumber: invNum, jobDate: fmtd_(jobDate) };
}

function apiMarkInvoicePaid(number) {
  const sh = ss_().getSheetByName(TABS.INVOICES);
  const row = findRowByNumber_(sh, number);
  if (!row) return { ok: false };
  sh.getRange(row, 6).setValue('Paid');
  return { ok: true };
}

/** Delete a stuck/duplicate estimate or invoice: clears its row and its line items.
 *  (Any linked job is left alone.) The row is cleared, not shifted, so numbering and
 *  formatting stay intact. */
function apiDeleteDoc(kind, number) {
  const ss = ss_();
  const sh = ss.getSheetByName(kind === 'INVOICE' ? TABS.INVOICES : TABS.ESTIMATES);
  const row = findRowByNumber_(sh, number);
  if (!row) return { ok: false, msg: 'Not found.' };
  clearLinesForNumber_(ss, number);
  sh.getRange(row, 1, 1, 6).clearContent();
  return { ok: true };
}

/* ============================= SETTINGS ========================== */

var SETTING_KEYS = {
  businessName: 'Business name',
  ownerEmail: 'Owner email (for follow-up digest)',
  phone: 'Business phone',
  currency: 'Currency symbol',
  taxPct: 'Sales tax % (0 for none)',
  followDays: 'Default follow-up (days after new lead)',
  reviewLink: 'Google review link (for review requests)',
  payInstructions: 'Invoice payment instructions',
  payLink: 'Payment link (Stripe/PayPal/Venmo — optional)',
  dueDays: 'Invoice due (days to pay; 0 = due upon receipt)',
  startEstimate: 'Starting quote/estimate number',
  startInvoice: 'Starting invoice number',
};

/** Invoice payment terms: number of days to pay after the invoice is sent.
 *  0 means "Due upon receipt" (same day). Accepts a number, "0", or text like
 *  "Due upon receipt". Defaults to 14 when blank. */
function invoiceTermsDays_(ss) {
  const s = String(getSetting_(ss, 'Invoice due (days to pay; 0 = due upon receipt)') || '').trim().toLowerCase();
  if (s === '') return 14;
  if (s.indexOf('receipt') >= 0 || s.indexOf('upon') >= 0) return 0;
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 14 : n;
}

function apiGetSettings() {
  const ss = ss_();
  const out = {};
  Object.keys(SETTING_KEYS).forEach(function (k) { out[k] = getSetting_(ss, SETTING_KEYS[k]); });
  return out;
}

function apiSaveSettings(obj) {
  const ss = ss_();
  Object.keys(SETTING_KEYS).forEach(function (k) {
    if (obj[k] !== undefined) setSetting_(ss, SETTING_KEYS[k], obj[k]);
  });
  return { ok: true };
}

function apiSaveServices(arr) {
  const ss = ss_();
  const sh = ss.getSheetByName(TABS.SETTINGS);
  if (!sh) return { ok: false };
  sh.getRange(3, 5, 30, 1).clearContent();
  const clean = (arr || []).map(function (s) { return String(s).trim(); }).filter(function (s) { return s; });
  if (clean.length) sh.getRange(3, 5, clean.length, 1).setValues(clean.map(function (s) { return [s]; }));
  return { ok: true };
}
