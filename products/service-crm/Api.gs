/**
 * Api.gs — Service Pro CRM web-app server API (clean rebuild).
 *
 * Every handler goes through db.gs and references IDs, never names. The dashboard is computed
 * in Script from cached totals (no cell formulas). Line items snapshot price at write time.
 * This file is self-contained (its own small helpers) so it does not depend on the legacy code.
 */

function doGet() {
  return HtmlService.createHtmlOutputFromFile('WebApp')
    .setTitle('Service Pro CRM')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1');
}

/* ============================ small helpers ============================ */

function API_tz_() { return Session.getScriptTimeZone(); }
function API_num_(x) { var n = Number(x); return isNaN(n) ? 0 : n; }
function API_esc_(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function API_today_() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function API_addDays_(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
function API_fmtD_(d) { return (d instanceof Date) ? Utilities.formatDate(d, API_tz_(), 'M/d/yyyy') : ''; }
function API_iso_(d) { return (d instanceof Date) ? Utilities.formatDate(d, API_tz_(), 'yyyy-MM-dd') : ''; }
/** Parse 'yyyy-MM-dd' (or 'M/d/yyyy') into a local midnight Date, or null. */
function API_parseDate_(s) {
  if (s instanceof Date) return s;
  var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = String(s || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) { var y = +m[3]; if (y < 100) y += 2000; return new Date(y, +m[1] - 1, +m[2]); }
  return null;
}
function API_cur_() { return String(settingGet('Currency symbol') || '$').trim() || '$'; }
function API_money_(n) { return API_cur_() + API_num_(n).toFixed(2); }
/** Minutes-past-midnight for a free-text time ("2pm","10:30am"); blank sorts last. */
function API_timeMin_(s) {
  s = String(s || '').trim().toLowerCase();
  var m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!m) return 1441;
  var h = +m[1], mi = m[2] ? +m[2] : 0;
  if (m[3] === 'pm' && h < 12) h += 12;
  if (m[3] === 'am' && h === 12) h = 0;
  return h * 60 + mi;
}
function API_invoiceTermsDays_() {
  var s = String(settingGet('Invoice due (days)') || '').trim().toLowerCase();
  if (s === '') return 14;
  if (s.indexOf('receipt') >= 0) return 0;
  var n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? 14 : n;
}

/* ============================ bootstrap + dashboard ============================ */

function API_enums_() {
  return {
    clientStatus: SCHEMA.Clients.cols.filter(function (c) { return c.n === 'Status'; })[0].values,
    jobStatus: SCHEMA.Jobs.cols.filter(function (c) { return c.n === 'Status'; })[0].values,
    estStatus: SCHEMA.Estimates.cols.filter(function (c) { return c.n === 'Status'; })[0].values,
    invStatus: SCHEMA.Invoices.cols.filter(function (c) { return c.n === 'Status'; })[0].values,
    recurring: SCHEMA.Jobs.cols.filter(function (c) { return c.n === 'Recurring'; })[0].values,
  };
}

function apiBootstrap() {
  if (!SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SCHEMA.Clients.sheet)) return { ready: false };
  return {
    ready: true,
    settings: apiGetSettings(),
    services: apiListServices(true),
    enums: API_enums_(),
    dashboard: apiDashboard(),
  };
}

function apiDashboard() {
  var today = API_today_();
  var wkStart = new Date(today); wkStart.setDate(wkStart.getDate() - wkStart.getDay());
  var wkEnd = new Date(wkStart); wkEnd.setDate(wkEnd.getDate() + 7);
  var monStart = new Date(today.getFullYear(), today.getMonth(), 1);
  var weekAgo = API_addDays_(today, -7);

  var clients = getAll('Clients'), jobs = getAll('Jobs'), ests = getAll('Estimates'), invs = getAll('Invoices');
  var nameOf = API_clientNameMap_(clients);

  var newLeads = clients.filter(function (c) { return c.Status === 'Lead' && c.CreatedAt instanceof Date && c.CreatedAt >= weekAgo; }).length;
  var pipeline = ests.filter(function (e) { return e.Status === 'Draft' || e.Status === 'Sent'; }).reduce(function (s, e) { return s + API_num_(e.Total); }, 0);
  var unpaid = invs.filter(function (i) { return i.Status === 'Sent' || i.Status === 'Overdue'; }).reduce(function (s, i) { return s + API_num_(i.Total); }, 0);
  var revMonth = invs.filter(function (i) { return i.Status === 'Paid' && i.IssueDate instanceof Date && i.IssueDate >= monStart; }).reduce(function (s, i) { return s + API_num_(i.Total); }, 0);
  var revLife = invs.filter(function (i) { return i.Status === 'Paid'; }).reduce(function (s, i) { return s + API_num_(i.Total); }, 0);

  var won = clients.filter(function (c) { return c.Status === 'Active' || c.Status === 'Inactive'; }).length;
  var lost = clients.filter(function (c) { return c.Status === 'Lost'; }).length;

  var followUps = clients.filter(function (c) {
    return (c.Status === 'Lead' || c.Status === 'Active') && c.NextFollowUp instanceof Date && c.NextFollowUp <= today;
  }).sort(function (a, b) { return a.NextFollowUp - b.NextFollowUp; })
    .map(function (c) { return { id: c.ClientID, name: c.Name, phone: c.Phone, status: c.Status, due: API_fmtD_(c.NextFollowUp) }; });

  var weekJobs = jobs.filter(function (j) {
    return j.Status === 'Scheduled' && j.JobDate instanceof Date && j.JobDate >= wkStart && j.JobDate < wkEnd;
  }).map(function (j) { return { id: j.JobID, client: nameOf[j.ClientID] || '', date: API_fmtD_(j.JobDate), time: j.ScheduledTime, service: j.ServiceName, status: j.Status, _d: j.JobDate.getTime(), _t: API_timeMin_(j.ScheduledTime) }; })
    .sort(function (a, b) { return a._d - b._d || a._t - b._t; })
    .map(function (j) { delete j._d; delete j._t; return j; });

  return {
    newLeads: newLeads, pipeline: pipeline, unpaid: unpaid, jobsWeek: weekJobs.length, revMonth: revMonth,
    winRate: (won + lost) ? Math.round(won / (won + lost) * 100) : 0, revLife: revLife,
    followUps: followUps, weekJobs: weekJobs,
  };
}

function API_clientNameMap_(clients) {
  var m = {}; (clients || getAll('Clients')).forEach(function (c) { m[c.ClientID] = c.Name; }); return m;
}

/* ============================ Clients ============================ */

function API_clientView_(c, ctx) {
  ctx = ctx || {};
  var jobs = ctx.jobs || query('Jobs', { ClientID: c.ClientID });
  var ests = ctx.ests || query('Estimates', { ClientID: c.ClientID });
  var invs = ctx.invs || query('Invoices', { ClientID: c.ClientID });
  var today = ctx.today || API_today_();
  var upcoming = jobs.filter(function (j) { return j.Status === 'Scheduled' && j.JobDate instanceof Date && j.JobDate >= today; })
    .sort(function (a, b) { return a.JobDate - b.JobDate; })[0];
  var openEst = ests.filter(function (e) { return e.Status === 'Draft' || e.Status === 'Sent'; })
    .sort(function (a, b) { return API_num_(b.Total) - API_num_(a.Total); })[0];
  var unpaidInv = invs.filter(function (i) { return i.Status !== 'Paid' && i.Status !== 'Draft'; })
    .sort(function (a, b) { return API_num_(b.Total) - API_num_(a.Total); })[0];
  return {
    id: c.ClientID, name: c.Name, phone: c.Phone, email: c.Email, address: c.Address,
    status: c.Status, source: c.Source, notes: c.Notes,
    followUp: API_fmtD_(c.NextFollowUp), followUpISO: API_iso_(c.NextFollowUp),
    lifetime: API_num_(c.LifetimeSpent),
    nextJob: upcoming ? { id: upcoming.JobID, date: API_fmtD_(upcoming.JobDate), service: upcoming.ServiceName } : null,
    openEstimate: openEst ? { id: openEst.EstimateID, total: API_num_(openEst.Total) } : null,
    unpaidInvoice: unpaidInv ? { id: unpaidInv.InvoiceID, total: API_num_(unpaidInv.Total), status: unpaidInv.Status } : null,
  };
}

// Group a table's rows by ClientID ONCE so the per-client view is an O(1) lookup, not an O(n)
// re-filter — keeps apiListClients linear instead of O(clients × jobs+estimates+invoices).
function API_groupByClient_(arr) {
  var m = {}; arr.forEach(function (x) { (m[x.ClientID] || (m[x.ClientID] = [])).push(x); }); return m;
}
function apiListClients() {
  var today = API_today_();
  var jobsBy = API_groupByClient_(getAll('Jobs')), estsBy = API_groupByClient_(getAll('Estimates')), invsBy = API_groupByClient_(getAll('Invoices'));
  return getAll('Clients').map(function (c) {
    return API_clientView_(c, { today: today, jobs: jobsBy[c.ClientID] || [], ests: estsBy[c.ClientID] || [], invs: invsBy[c.ClientID] || [] });
  });
}
function apiGetClient(id) { var c = getById('Clients', id); return c ? API_clientView_(c) : null; }

function apiCreateClient(form) {
  // Local (front-end) dup check is preferred; server still guards required fields.
  if (!form || !String(form.name || '').trim()) return { ok: false, msg: 'A name is required.' };
  var days = API_num_(settingGet('Default follow-up (days)')) || 2;
  var c = insert('Clients', {
    Name: form.name, Phone: form.phone || '', Email: form.email || '', Address: form.address || '',
    Status: form.status || 'Lead', Source: form.source || '', Notes: form.notes || '',
    NextFollowUp: API_addDays_(API_today_(), days),
  });
  return { ok: true, id: c.ClientID, client: API_clientView_(c) };
}
function apiUpdateClient(id, patch) {
  var allowed = {}; ['Name', 'Phone', 'Email', 'Address', 'Status', 'Source', 'Notes', 'NextFollowUp'].forEach(function (k) {
    if (patch[k] !== undefined) allowed[k] = (k === 'NextFollowUp') ? API_parseDate_(patch[k]) : patch[k];
  });
  update('Clients', id, allowed);
  return { ok: true };
}
function apiSetClientStatus(id, status) { update('Clients', id, { Status: status }); return { ok: true }; }
function apiSetClientFollowUp(id, iso) { update('Clients', id, { NextFollowUp: iso ? API_parseDate_(iso) : '' }); return { ok: true }; }
function apiArchiveClient(id) {
  var refs = DB_countRefs_('Jobs', 'ClientID', id) + DB_countRefs_('Estimates', 'ClientID', id) + DB_countRefs_('Invoices', 'ClientID', id);
  if (refs) return { ok: false, msg: 'This client still has ' + refs + ' active job(s)/quote(s)/invoice(s). Archive or close those first.' };
  softDelete('Clients', id); return { ok: true };
}

/* ============================ Services ============================ */

function apiListServices(activeOnly) {
  return getAll('Services').filter(function (s) { return !activeOnly || s.Active; })
    .map(function (s) { return { id: s.ServiceID, name: s.ServiceName, rate: API_num_(s.DefaultRate), active: !!s.Active }; });
}
function apiCreateService(form) {
  var s = insert('Services', { ServiceName: form.name, DefaultRate: API_num_(form.rate), Active: form.active !== false });
  return { ok: true, id: s.ServiceID };
}
function apiUpdateService(id, patch) {
  var a = {}; if (patch.name !== undefined) a.ServiceName = patch.name; if (patch.rate !== undefined) a.DefaultRate = API_num_(patch.rate); if (patch.active !== undefined) a.Active = !!patch.active;
  update('Services', id, a); return { ok: true };
}
function apiArchiveService(id) { softDelete('Services', id); return { ok: true }; }

/* ============================ Jobs ============================ */

function API_jobView_(j, nameOf) {
  return { id: j.JobID, clientId: j.ClientID, client: (nameOf || API_clientNameMap_())[j.ClientID] || '',
    serviceId: j.ServiceID, service: j.ServiceName, date: API_fmtD_(j.JobDate), dateISO: API_iso_(j.JobDate),
    time: j.ScheduledTime, status: j.Status, recurring: j.Recurring, reviewSent: !!j.ReviewSent,
    reminderSent: !!j.ReminderSent, notes: j.Notes, photosLink: j.PhotosLink };
}
function apiListJobs() {
  var nameOf = API_clientNameMap_();
  return getAll('Jobs').map(function (j) { return API_jobView_(j, nameOf); });
}
function apiCreateJob(form) {
  if (!form.clientId) return { ok: false, msg: 'Pick a client.' };
  if (!form.serviceId) return { ok: false, msg: 'Pick a service.' };
  var j = insert('Jobs', {
    ClientID: form.clientId, ServiceID: form.serviceId,
    JobDate: API_parseDate_(form.date) || API_today_(), ScheduledTime: form.time || '',
    Status: form.status || 'Scheduled', Recurring: form.recurring || 'None', Notes: form.notes || '',
  });
  return { ok: true, id: j.JobID, job: API_jobView_(j) };
}
function apiUpdateJob(id, patch) {
  var a = {};
  if (patch.date !== undefined) a.JobDate = API_parseDate_(patch.date) || '';
  ['ServiceID', 'ScheduledTime', 'Status', 'Recurring', 'Notes', 'PhotosLink', 'ReviewSent', 'ReminderSent'].forEach(function (k) {
    if (patch[k] !== undefined) a[k] = patch[k];
  });
  if (patch.serviceId !== undefined) a.ServiceID = patch.serviceId;
  if (patch.time !== undefined) a.ScheduledTime = patch.time;
  var j = update('Jobs', id, a);
  return { ok: true, job: API_jobView_(j) };
}
function apiArchiveJob(id) {
  var refs = DB_countRefs_('Invoices', 'JobID', id);
  if (refs) return { ok: false, msg: 'This job is linked to ' + refs + ' active invoice(s). Archive the invoice first.' };
  softDelete('Jobs', id); return { ok: true };
}

/* ============================ Estimates / Invoices + line items ============================ */

var DOC = {
  ESTIMATE: { table: 'Estimates', pk: 'EstimateID', docType: 'Estimate', dateB: 'ValidUntil' },
  INVOICE:  { table: 'Invoices',  pk: 'InvoiceID',  docType: 'Invoice',  dateB: 'DueDate' },
};
function API_doc_(kind) { return DOC[kind] || DOC.ESTIMATE; }

function API_docView_(kind, d, nameOf) {
  var D = API_doc_(kind);
  return { kind: kind, id: d[D.pk], clientId: d.ClientID, client: (nameOf || API_clientNameMap_())[d.ClientID] || '',
    jobId: d.JobID || '', estimateId: d.EstimateID || '', taxRate: API_num_(d.TaxRate),
    subtotal: API_num_(d.Subtotal), tax: API_num_(d.Tax), total: API_num_(d.Total), status: d.Status,
    issueDate: API_fmtD_(d.IssueDate), issueISO: API_iso_(d.IssueDate),
    dateB: API_fmtD_(d[D.dateB]), dateBISO: API_iso_(d[D.dateB]) };
}
function apiListBilling() {
  var nameOf = API_clientNameMap_();
  return {
    estimates: getAll('Estimates').map(function (e) { return API_docView_('ESTIMATE', e, nameOf); }),
    invoices: getAll('Invoices').map(function (i) { return API_docView_('INVOICE', i, nameOf); }),
  };
}
function apiGetDocLines(kind, id) {
  var D = API_doc_(kind);
  return query('LineItems', function (li) { return li.DocType === D.docType && String(li.DocID) === String(id); })
    .map(function (li) { return { id: li.LineItemID, serviceId: li.ServiceID, description: li.Description, qty: API_num_(li.Qty), rate: API_num_(li.Rate), lineTotal: API_num_(li.LineTotal) }; });
}

// lines: [{serviceId, qty, rate?, description?}] — rate/description snapshot from the Service unless overridden.
function API_insertLines_(docType, docId, lines) {
  var rows = (lines || []).filter(function (l) { return l.serviceId; }).map(function (l) {
    var row = { DocType: docType, DocID: docId, ServiceID: l.serviceId, Qty: API_num_(l.qty) || 1 };
    if (l.rate !== undefined && l.rate !== '') row.Rate = API_num_(l.rate);
    if (l.description) row.Description = l.description;
    return row;
  });
  if (rows.length) insertMany('LineItems', rows);
}

function apiCreateEstimate(form) {
  if (!form.clientId || !getById('Clients', form.clientId)) return { ok: false, msg: 'Pick a valid client.' };
  var lines = (form.lines || []).filter(function (l) { return l.serviceId; });
  if (!lines.length) return { ok: false, msg: 'Add at least one line item.' };
  var today = API_today_();
  var e = insert('Estimates', {
    ClientID: form.clientId, IssueDate: today,
    ValidUntil: API_addDays_(today, API_num_(form.validDays) || 14), Status: 'Draft',
    TaxRate: API_num_(settingGet('Sales tax %')),   // snapshot the tax rate at creation
  });
  API_insertLines_('Estimate', e.EstimateID, lines);
  recalcDocTotal('Estimate', e.EstimateID);
  if (form.markQuoted !== false) { var c = getById('Clients', form.clientId); if (c && c.Status === 'Lead') update('Clients', form.clientId, { Status: 'Active' }); }
  return { ok: true, id: e.EstimateID };
}

/** Replace a doc's line items (soft-delete old, insert new) and refresh its cached Total. */
function apiSetDocLines(kind, id, lines) {
  var D = API_doc_(kind);
  query('LineItems', function (li) { return li.DocType === D.docType && String(li.DocID) === String(id); })
    .forEach(function (li) { softDelete('LineItems', li.LineItemID); });
  API_insertLines_(D.docType, id, lines);
  var total = recalcDocTotal(D.docType, id);
  if (kind === 'INVOICE') { var iv = getById('Invoices', id); if (iv && iv.Status === 'Paid') recalcClientLifetime(iv.ClientID); }
  return { ok: true, total: total };
}
function apiUpdateDoc(kind, id, fields) {
  var D = API_doc_(kind), a = {};
  if (fields.status !== undefined) a.Status = fields.status;
  if (fields.issueDate !== undefined) a.IssueDate = API_parseDate_(fields.issueDate) || '';
  if (fields.dateB !== undefined) a[D.dateB] = API_parseDate_(fields.dateB) || '';
  var d = update(D.table, id, a);
  if (kind === 'INVOICE' && fields.status !== undefined) recalcClientLifetime(d.ClientID);
  return { ok: true };
}

/** Accept an estimate → create a Job + a draft Invoice (dated now), copying the quoted lines. */
function apiApproveEstimate(estimateId, jobDateIso, jobServiceId) {
  var est = getById('Estimates', estimateId);
  if (!est) return { ok: false, msg: 'Estimate not found.' };
  var estLines = query('LineItems', function (li) { return li.DocType === 'Estimate' && String(li.DocID) === String(estimateId); });
  if (!estLines.length) return { ok: false, msg: 'This estimate has no line items.' };

  update('Estimates', estimateId, { Status: 'Accepted' });
  var today = API_today_();
  var svcForJob = jobServiceId || estLines[0].ServiceID;   // one job for the primary service
  var job = insert('Jobs', {
    ClientID: est.ClientID, ServiceID: svcForJob,
    JobDate: API_parseDate_(jobDateIso) || today, Status: 'Scheduled', Recurring: 'None',
  });
  var inv = insert('Invoices', {
    ClientID: est.ClientID, JobID: job.JobID, EstimateID: estimateId, IssueDate: today,
    DueDate: API_addDays_(today, API_invoiceTermsDays_()), Status: 'Draft',
    TaxRate: API_num_(est.TaxRate),   // bill at the tax rate that was quoted
  });
  // Copy the QUOTED lines verbatim (preserve snapshot price; don't re-derive from Services).
  API_insertLines_('Invoice', inv.InvoiceID, estLines.map(function (li) {
    return { serviceId: li.ServiceID, qty: li.Qty, rate: li.Rate, description: li.Description };
  }));
  recalcDocTotal('Invoice', inv.InvoiceID);
  var c = getById('Clients', est.ClientID); if (c && c.Status === 'Lead') update('Clients', est.ClientID, { Status: 'Active' });
  return { ok: true, invoiceId: inv.InvoiceID, jobId: job.JobID, jobDate: API_fmtD_(job.JobDate) };
}

function apiMarkInvoicePaid(id) {
  var iv = update('Invoices', id, { Status: 'Paid' });
  var life = recalcClientLifetime(iv.ClientID);
  return { ok: true, lifetime: life };
}
function apiDeleteDoc(kind, id) {
  var D = API_doc_(kind), d = getById(D.table, id);
  if (!d) return { ok: false, msg: 'Not found.' };
  query('LineItems', function (li) { return li.DocType === D.docType && String(li.DocID) === String(id); })
    .forEach(function (li) { softDelete('LineItems', li.LineItemID); });
  softDelete(D.table, id);
  if (kind === 'INVOICE' && d.Status === 'Paid') recalcClientLifetime(d.ClientID);
  return { ok: true };
}

/* ============================ Send (PDF + email) ============================ */

function apiSendDoc(kind, id) {
  var D = API_doc_(kind), d = getById(D.table, id);
  if (!d) return { ok: false, msg: 'Not found.' };
  var client = getById('Clients', d.ClientID);
  if (!client) return { ok: false, msg: 'This document has no valid client.' };
  var items = apiGetDocLines(kind, id);
  if (!items.length && !API_num_(d.Total)) return { ok: false, msg: 'Add line items first.' };
  if (!(d.IssueDate instanceof Date)) update(D.table, id, { IssueDate: API_today_() });

  var html = API_docHtml_(kind, getById(D.table, id), client, items);
  var pdf = Utilities.newBlob(html, 'text/html', 'doc.html').getAs('application/pdf')
    .setName((kind === 'INVOICE' ? 'Invoice' : 'Estimate') + '-' + id + '-' + String(client.Name).replace(/\s+/g, '') + '.pdf');
  var email = String(client.Email || '').trim();
  if (email) API_docEmail_(kind, id, client, pdf, email); else DriveApp.createFile(pdf);
  if (d.Status === 'Draft') update(D.table, id, { Status: 'Sent' });
  return { ok: true, emailed: !!email, email: email };
}

function API_docHtml_(kind, d, client, items) {
  var isInv = (kind === 'INVOICE');
  var biz = settingGet('Business name') || 'Your Business';
  var bizPhone = settingGet('Business phone') || '';
  var accent = String(settingGet('Accent color') || '#8f5f22').trim() || '#8f5f22';
  var logoId = String(settingGet('Company logo (Drive file id)') || '').trim();
  var logo = logoId ? ('https://drive.google.com/uc?export=view&id=' + logoId) : String(settingGet('Company logo (data URL)') || '').trim();
  var pay = settingGet('Invoice payment instructions') || '';
  var payLink = String(settingGet('Payment link') || '').trim();
  var fmtD = function (d2) { return (d2 instanceof Date) ? Utilities.formatDate(d2, API_tz_(), 'MMM d, yyyy') : ''; };
  var rows = items.map(function (it) {
    return '<tr><td style="padding:9px;border-bottom:1px solid #eee">' + API_esc_(it.description) + '</td>' +
      '<td style="padding:9px;border-bottom:1px solid #eee;text-align:center">' + it.qty + '</td>' +
      '<td style="padding:9px;border-bottom:1px solid #eee;text-align:right">' + API_money_(it.rate) + '</td>' +
      '<td style="padding:9px;border-bottom:1px solid #eee;text-align:right">' + API_money_(it.lineTotal) + '</td></tr>';
  }).join('');
  var isReceipt = isInv && API_invoiceTermsDays_() === 0;
  var dateBLabel = isInv ? 'Due' : 'Valid until';
  var dateBVal = isReceipt ? 'Upon receipt' : fmtD(isInv ? d.DueDate : d.ValidUntil);
  var taxCell = function (label, val) { return '<tr><td colspan="3" style="padding:6px 9px;text-align:right">' + label + '</td><td style="padding:6px 9px;text-align:right">' + API_money_(val) + '</td></tr>'; };
  var taxRows = (API_num_(d.Tax) > 0) ? (taxCell('Subtotal', d.Subtotal) + taxCell('Tax', d.Tax)) : '';
  var totalRow = taxRows + '<tr><td colspan="3" style="padding:9px;text-align:right;font-weight:bold">' + (isInv ? 'Total Due' : 'Estimated Total') +
    '</td><td style="padding:9px;text-align:right;font-weight:bold;font-size:18px;color:' + accent + '">' + API_money_(d.Total) + '</td></tr>';
  var payBtn = (isInv && payLink) ? '<p style="text-align:center;margin:22px 0"><a href="' + API_esc_(payLink) + '" style="background:' + accent + ';color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:bold">Pay now</a></p>' : '';
  return '<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1a1c1f">' +
    '<table style="width:100%;border-bottom:3px solid ' + accent + ';margin-bottom:22px"><tr>' +
    '<td style="padding-bottom:14px;vertical-align:top">' + (logo ? '<img src="' + API_esc_(logo) + '" style="max-height:64px;max-width:220px;margin-bottom:8px;display:block">' : '') +
    '<div style="font-size:24px;font-weight:bold">' + API_esc_(biz) + '</div>' + (bizPhone ? '<div style="color:#52565c">' + API_esc_(bizPhone) + '</div>' : '') + '</td>' +
    '<td style="padding-bottom:14px;text-align:right;vertical-align:top"><div style="font-size:28px;font-weight:bold;color:' + accent + '">' + (isInv ? 'INVOICE' : 'ESTIMATE') + '</div>' +
    '<div style="color:#52565c">#' + API_esc_(d[API_doc_(kind).pk]) + '</div></td></tr></table>' +
    '<table style="width:100%;margin-bottom:20px"><tr>' +
    '<td><b>' + (isInv ? 'Bill to' : 'Prepared for') + ':</b><br>' + API_esc_(client.Name) + (client.Email ? '<br>' + API_esc_(client.Email) : '') + '</td>' +
    '<td style="text-align:right"><b>Issued:</b> ' + fmtD(d.IssueDate) + '<br><b>' + dateBLabel + ':</b> ' + dateBVal + '</td></tr></table>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:6px"><tr style="background:#1a1c1f;color:#fff">' +
    '<th style="text-align:left;padding:9px">Description</th><th style="padding:9px">Qty</th><th style="text-align:right;padding:9px">Rate</th><th style="text-align:right;padding:9px">Amount</th></tr>' +
    rows + totalRow + '</table>' + payBtn +
    (pay && isInv ? '<div style="background:#f3f0ea;padding:14px;border-radius:8px"><b>Payment:</b> ' + API_esc_(pay) + '</div>' : '') +
    '<p style="color:#52565c;margin-top:20px">' + (isInv ? 'Thank you for your business!' : 'This estimate is for your review — reply to accept and we\'ll get you scheduled.') + '</p></div>';
}

function API_docEmail_(kind, id, client, pdf, email) {
  var isInv = (kind === 'INVOICE');
  var biz = settingGet('Business name') || 'Your Business';
  var pay = settingGet('Invoice payment instructions') || '';
  var payLink = String(settingGet('Payment link') || '').trim();
  MailApp.sendEmail({ to: email, subject: (isInv ? 'Invoice' : 'Estimate') + ' #' + id + ' from ' + biz,
    htmlBody: 'Hi ' + API_esc_(String(client.Name).split(' ')[0]) + ',<br><br>Please find your ' + (isInv ? 'invoice' : 'estimate') + ' attached. ' +
      (isInv && payLink ? 'Pay online here: ' + API_esc_(payLink) + '<br>' : '') + (isInv && pay ? API_esc_(pay) : '') +
      '<br><br>Thank you!<br>' + API_esc_(biz), attachments: [pdf] });
}

/* ============================ Settings + logo ============================ */

var SETTINGS_KEYS = ['Business name', 'Owner email', 'Business phone', 'Business address', 'Currency symbol',
  'Sales tax %', 'Default follow-up (days)', 'Google review link', 'Invoice payment instructions',
  'Payment link', 'Invoice due (days)', 'Accent color'];
// Numbering is owner-facing config, but the live counter lives in _meta (Script-owned, collision-safe).
var NUMBER_KEYS = { 'Estimate starting number': 'Estimates', 'Invoice starting number': 'Invoices' };
var NUMERIC_SETTINGS = { 'Sales tax %': 1, 'Invoice due (days)': 1, 'Default follow-up (days)': 1 };
var LOGO_DATA_KEY = 'Company logo (data URL)';
var LOGO_FILE_KEY = 'Company logo (Drive file id)';

function apiGetSettings() {
  var o = {};
  SETTINGS_KEYS.forEach(function (k) { o[k] = settingGet(k); });
  Object.keys(NUMBER_KEYS).forEach(function (k) { o[k] = DB_getCounter_(NUMBER_KEYS[k]); });   // live next number
  return o;
}
function apiSaveSettings(obj) {
  SETTINGS_KEYS.forEach(function (k) {
    if (obj[k] === undefined) return;
    var v = obj[k];
    if (NUMERIC_SETTINGS[k]) { var n = Number(String(v).replace(/[^0-9.\-]/g, '')); v = isFinite(n) ? n : 0; }  // sanitize numerics
    settingSet(k, v);
  });
  Object.keys(NUMBER_KEYS).forEach(function (k) {
    if (obj[k] !== undefined) { var n = DB_setCounter_(NUMBER_KEYS[k], parseInt(obj[k], 10)); settingSet(k, n); }
  });
  return { ok: true };
}
function apiGetLogo() { return { logo: String(settingGet(LOGO_DATA_KEY) || '') }; }
function apiSaveLogo(dataUrl) {
  var v = String(dataUrl || '');
  if (!v) { API_deleteLogoFile_(); settingSet(LOGO_DATA_KEY, ''); settingSet(LOGO_FILE_KEY, ''); return { ok: true }; }
  if (v.length > 49000) return { ok: false, msg: 'Logo is too large — use a smaller image.' };  // sheet-cell + payload cap
  var m = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(v);
  if (!m) return { ok: false, msg: 'Not a PNG or JPEG image' };
  settingSet(LOGO_DATA_KEY, v);
  try { var blob = Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], 'logo'); settingSet(LOGO_FILE_KEY, API_writeLogoFile_(blob)); }
  catch (e) { settingSet(LOGO_FILE_KEY, ''); }
  return { ok: true };
}
function API_writeLogoFile_(blob) {
  API_deleteLogoFile_();
  var file = DriveApp.createFile(blob).setName('ServiceProCRM-logo');
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) {}
  return file.getId();
}
function API_deleteLogoFile_() {
  var id = String(settingGet(LOGO_FILE_KEY) || '').trim();
  if (id) { try { DriveApp.getFileById(id).setTrashed(true); } catch (e) {} }
}
