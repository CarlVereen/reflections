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

/** Next numeric doc number in column A, at or above startAt. */
function nextNumber_(sh, startAt) {
  const last = sh.getLastRow();
  let max = startAt - 1;
  if (last >= 2) {
    const col = sh.getRange(2, 1, last - 1, 1).getValues();
    col.forEach(function (r) { const n = Number(r[0]); if (!isNaN(n) && n > max) max = n; });
  }
  return max + 1;
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
  const dateBLabel = isInv ? 'Due' : 'Valid until';
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
    '<td style="text-align:right"><b>Issued:</b> ' + fmtD(vals[2]) + '<br><b>' + dateBLabel + ':</b> ' + fmtD(vals[3]) + '</td></tr></table>' +
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

  let newLeads = 0, pipeline = 0, won = 0, lost = 0;
  const followUps = [];
  leads.forEach(function (r) {
    if (!r[1]) return;
    const added = r[0], status = r[7], follow = r[8];
    if (added instanceof Date && added >= new Date(today.getTime() - 7 * 864e5)) newLeads++;
    if (status !== 'Won' && status !== 'Lost' && status !== '') pipeline += num_(r[6]);
    if (status === 'Won') won++;
    if (status === 'Lost') lost++;
    if (status !== 'Won' && status !== 'Lost' && follow instanceof Date) {
      const f = new Date(follow); f.setHours(0, 0, 0, 0);
      if (f <= today) followUps.push({ name: r[1], phone: r[2] || '', status: status, due: fmtd_(f) });
    }
  });

  let jobsWeek = 0; const weekJobs = [];
  jobs.forEach(function (r, i) {
    if (!(r[0] instanceof Date)) return;
    const d = new Date(r[0]); d.setHours(0, 0, 0, 0);
    if (d >= wkStart && d < wkEnd && r[4] !== 'Cancelled') { jobsWeek++; weekJobs.push({ row: i + 2, date: fmtd_(d), client: r[1], service: r[2] || '', status: r[4] || '' }); }
  });

  let revMonth = 0, revLife = 0;
  invs.forEach(function (r) {
    if (r[5] === 'Paid') { revLife += num_(r[4]); if (r[2] instanceof Date && r[2] >= monStart) revMonth += num_(r[4]); }
  });

  return {
    newLeads: newLeads, pipeline: pipeline, jobsWeek: jobsWeek, revMonth: revMonth,
    winRate: (won + lost) ? Math.round(won / (won + lost) * 100) : 0, revLife: revLife,
    followUps: followUps, weekJobs: weekJobs,
  };
}

function valuesOf_(ss, tab) {
  const sh = ss.getSheetByName(tab);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
}

/* ============================== LEADS ============================= */

function apiListLeads() {
  const ss = ss_();
  const rows = valuesOf_(ss, TABS.LEADS);
  const out = [];
  rows.forEach(function (r, i) {
    if (!r[1]) return;
    out.push({ row: i + 2, name: r[1], phone: r[2] || '', email: r[3] || '', service: r[5] || '',
      value: num_(r[6]), status: r[7] || 'New', followUp: fmtd_(r[8]) });
  });
  return out;
}

function apiAddLead(form) {
  const msg = addLeadCore_(form.name, form.phone, form.email, form.service, form.value);
  return { ok: msg.indexOf('✅') === 0, msg: msg };
}

function apiSetLeadStatus(row, status) {
  const sh = ss_().getSheetByName(TABS.LEADS);
  sh.getRange(row, 8).setValue(status);
  return { ok: true };
}

/* ============================= CLIENTS =========================== */

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
    if (!r[1]) return;
    out.push({ row: i + 2, date: fmtd_(r[0]), client: r[1], service: r[2] || '', time: r[3] || '',
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
  return { ok: true };
}

/* ====================== ESTIMATES & INVOICES ===================== */

function apiListDocs(kind) {
  const ss = ss_();
  const isInv = (kind === 'INVOICE');
  const rows = valuesOf_(ss, isInv ? TABS.INVOICES : TABS.ESTIMATES);
  const out = [];
  rows.forEach(function (r, i) {
    if (r[0] === '' || r[0] === null) return;
    out.push({ row: i + 2, number: r[0], client: r[1] || '', dateA: fmtd_(r[2]), dateB: fmtd_(r[3]),
      amount: num_(r[4]), status: r[5] || 'Draft', items: lineItemsFor_(ss, r[0]).length });
  });
  return out;
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
  const number = nextNumber_(est, 1001);
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

/** Approve an estimate: mark Accepted, create an invoice DRAFT (lines copied) + a scheduled Job. */
function apiApproveEstimate(number) {
  const ss = ss_();
  const est = ss.getSheetByName(TABS.ESTIMATES);
  const erow = findRowByNumber_(est, number);
  if (!erow) return { ok: false, msg: 'Estimate not found.' };
  const ev = est.getRange(erow, 1, 1, 6).getValues()[0]; // num, client, issue, valid, amount, status
  est.getRange(erow, 6).setValue('Accepted');

  const inv = ss.getSheetByName(TABS.INVOICES);
  const invNum = nextNumber_(inv, 9001);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(today); due.setDate(due.getDate() + 14);
  const items = lineItemsFor_(ss, number).map(function (it) { return { service: it.desc, qty: it.qty, rate: it.rate }; });
  inv.appendRow([invNum, ev[1], '', due, num_(ev[4]), 'Draft']); // issue date filled on send
  appendLineItems_(ss, invNum, items);

  const jobs = ss.getSheetByName(TABS.JOBS);
  const summary = items.length ? items.slice(0, 2).map(function (i) { return i.service; }).join(', ') + (items.length > 2 ? '…' : '') : '';
  jobs.appendRow([today, ev[1], summary, '', 'Scheduled', num_(ev[4]), 'No', 'No', 'No', 'From estimate ' + number, 'None', 'No', '']);
  upsertClient_(ss, ev[1], '', '', 'From estimate ' + number);
  return { ok: true, invoiceNumber: invNum };
}

function apiMarkInvoicePaid(number) {
  const sh = ss_().getSheetByName(TABS.INVOICES);
  const row = findRowByNumber_(sh, number);
  if (!row) return { ok: false };
  sh.getRange(row, 6).setValue('Paid');
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
};

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
