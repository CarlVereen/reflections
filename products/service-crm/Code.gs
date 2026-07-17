/**
 * Code.gs — Service Pro CRM menu, automations, triggers, and Google-Form intake (clean rebuild).
 *
 * Everything runs through db.gs and references IDs. Automation "cores" (rollForwardRecurringJobs,
 * markOverdueInvoices, sendFollowUpDigest, remindUpcomingJobs, sendReviewRequests) return plain
 * data and touch no UI, so they run safely as time-based triggers; thin menu wrappers add the
 * owner-facing alerts. Shared display helpers live in Api.gs (API_*); data helpers in db.gs.
 */

/* ============================ menu ============================ */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ CRM')
    .addItem('⚡  Open Quick Actions panel', 'showSidebar')
    .addSeparator()
    .addItem('▶  Set up / rebuild database', 'menuSetup')
    .addItem('📲  Open the app (get link)', 'showWebAppLink')
    .addItem('📱  Create mobile lead-capture form', 'createLeadForm')
    .addSubMenu(ui.createMenu('Automations')
      .addItem('📧  Email me today\'s follow-ups', 'menuFollowUpDigest')
      .addItem('⭐  Send review requests (finished jobs)', 'menuReviewRequests')
      .addItem('📅  Send tomorrow\'s appointment reminders', 'menuRemindJobs')
      .addItem('🚩  Flag overdue invoices now', 'menuMarkOverdue')
      .addItem('🔁  Roll forward finished recurring jobs', 'menuRollForward')
      .addSeparator()
      .addItem('⏰  Turn ON daily autopilot', 'installAutomations')
      .addItem('⏹️  Turn OFF daily autopilot', 'removeAutomations'))
    .addSeparator()
    .addItem('ℹ️  About / help', 'showAbout')
    .addToUi();
}

function menuSetup() {
  var ui = SpreadsheetApp.getUi();
  var built = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SCHEMA.Clients.sheet);
  var msg = built ? 'This REBUILDS the database tabs from scratch. On a fresh sheet this is safe; if you already have data it will be wiped. Continue?'
                  : 'This builds all CRM tabs (Clients, Jobs, Estimates, Invoices, LineItems, Services, Business Settings). Continue?';
  if (ui.alert('Set up / rebuild database', msg, ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  var rep = built ? resetDatabase() : setupDatabase();
  ui.alert(rep.ok ? '✅ Database ready' : '⚠ Problems: ' + rep.errors.join('; '),
    'Tabs: Clients, Jobs, Estimates, Invoices, LineItems, Services, Business Settings (+ hidden _meta).\nSeeded ' + rep.seededServices + ' services.', ui.ButtonSet.OK);
}

function showWebAppLink() {
  var ui = SpreadsheetApp.getUi(), url = '';
  try { url = ScriptApp.getService().getUrl(); } catch (e) {}
  if (url) ui.alert('📲 Your CRM app', 'Open on any device and add it to your home screen:\n\n' + url, ui.ButtonSet.OK);
  else ui.alert('Deploy the app first (one time)', 'Apps Script editor ▸ Deploy ▸ New deployment ▸ Web app ▸ Execute as "Me", Access as you prefer ▸ Deploy ▸ Authorize. Then this menu shows your link.', ui.ButtonSet.OK);
}

function showAbout() {
  SpreadsheetApp.getUi().alert('Service Pro CRM',
    'A single-owner CRM backed by this spreadsheet. Everything joins by ID; the Script owns all totals (no formulas). Use the app for daily work and the ⚡ CRM menu to set up, wire automations, and create your lead-capture form.', SpreadsheetApp.getUi().ButtonSet.OK);
}

function showSidebar() {
  try { SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('⚡ Quick Actions')); }
  catch (e) { SpreadsheetApp.getUi().alert('Quick Actions panel unavailable', String(e), SpreadsheetApp.getUi().ButtonSet.OK); }
}

/* ============================ shared helpers ============================ */

function CODE_biz_() { return settingGet('Business name') || 'Your Business'; }
function CODE_accent_() { return String(settingGet('Accent color') || '#8f5f22').trim() || '#8f5f22'; }
function CODE_bizPhone_() { return settingGet('Business phone') || ''; }
function CODE_ownerEmail_() {
  var e = String(settingGet('Owner email') || '').trim();
  if (!e || e.toLowerCase().indexOf('example@') === 0) { try { e = Session.getActiveUser().getEmail(); } catch (x) {} }
  return e;
}
function CODE_clientEmailMap_() { var m = {}; getAll('Clients').forEach(function (c) { if (c.Email) m[c.ClientID] = String(c.Email).trim(); }); return m; }
function CODE_clientNameMap_() { var m = {}; getAll('Clients').forEach(function (c) { m[c.ClientID] = c.Name; }); return m; }
function CODE_nextRecur_(date, recur) {
  var d = new Date(date);
  if (recur === 'Weekly') d.setDate(d.getDate() + 7);
  else if (recur === 'Monthly') d.setMonth(d.getMonth() + 1);
  else if (recur === 'Quarterly') d.setMonth(d.getMonth() + 3);
  else if (recur === 'Annual') d.setFullYear(d.getFullYear() + 1);
  else return null;
  d.setHours(0, 0, 0, 0); return d;
}

/* ============================ automation cores (trigger-safe, return data) ============================ */

/** Flag Sent invoices whose DueDate has passed as Overdue. Returns count. */
function markOverdueInvoices() {
  var today = API_today_(), n = 0;
  query('Invoices', { Status: 'Sent' }).forEach(function (iv) {
    if (iv.DueDate instanceof Date && iv.DueDate < today) { update('Invoices', iv.InvoiceID, { Status: 'Overdue' }); n++; }
  });
  if (n) DATA_markStale_();   // data changed outside the app → next open rebuilds the JSON
  return n;
}

/** For each finished recurring job, create its next occurrence (idempotent by client+service+date). */
function rollForwardRecurringJobs() {
  var made = 0;
  getAll('Jobs').forEach(function (j) {
    if (j.Status !== 'Done' || !j.Recurring || j.Recurring === 'None' || !(j.JobDate instanceof Date)) return;
    var next = CODE_nextRecur_(j.JobDate, j.Recurring); if (!next) return;
    var nextISO = API_iso_(next);
    var dup = query('Jobs', function (x) {
      return x.ClientID === j.ClientID && x.ServiceID === j.ServiceID && x.Recurring === j.Recurring &&
        x.Status === 'Scheduled' && API_iso_(x.JobDate) === nextISO;
    }).length > 0;
    if (dup) return;
    insert('Jobs', { ClientID: j.ClientID, ServiceID: j.ServiceID, JobDate: next, Status: 'Scheduled', Recurring: j.Recurring, Notes: 'Recurring visit' });
    made++;
  });
  if (made) DATA_markStale_();
  return made;
}

/** Email the owner the clients whose follow-up is due today or earlier. Returns {ok,count}. */
function sendFollowUpDigest() {
  var email = CODE_ownerEmail_(); if (!email) return { ok: false, msg: 'No owner email set.' };
  var biz = CODE_biz_(), accent = CODE_accent_(), today = API_today_();
  var due = getAll('Clients').filter(function (c) {
    return (c.Status === 'Lead' || c.Status === 'Active') && c.NextFollowUp instanceof Date && c.NextFollowUp <= today;
  }).sort(function (a, b) { return a.NextFollowUp - b.NextFollowUp; });
  if (!due.length) { MailApp.sendEmail(email, '⚡ ' + biz + ' — no follow-ups due 🎉', 'All caught up. Nice work.'); return { ok: true, count: 0 }; }
  var rows = due.map(function (c, i) {
    var digits = String(c.Phone || '').replace(/[^0-9+]/g, '');
    var sms = digits ? '<a href="sms:' + digits + '" style="color:' + accent + ';font-weight:bold">Text ›</a>' : '—';
    return '<tr style="background:' + (i % 2 ? '#f3f0ea' : '#fff') + '"><td style="padding:8px">' + API_esc_(c.Name) +
      '</td><td style="padding:8px">' + (API_esc_(c.Phone) || '—') + '</td><td style="padding:8px">' + API_fmtD_(c.NextFollowUp) +
      '</td><td style="padding:8px">' + API_esc_(c.Status) + '</td><td style="padding:8px">' + sms + '</td></tr>';
  }).join('');
  var html = '<div style="font-family:Arial,sans-serif;max-width:600px"><h2>🔔 ' + due.length + ' follow-up' + (due.length > 1 ? 's' : '') + ' due — ' + API_esc_(biz) + '</h2>' +
    '<table style="border-collapse:collapse;width:100%"><tr style="background:#1a1c1f;color:#fff"><th style="padding:8px;text-align:left">Name</th><th style="padding:8px;text-align:left">Phone</th><th style="padding:8px;text-align:left">Due</th><th style="padding:8px;text-align:left">Status</th><th style="padding:8px;text-align:left">Text</th></tr>' +
    rows + '</table></div>';
  MailApp.sendEmail({ to: email, subject: '🔔 ' + due.length + ' follow-up(s) due — ' + biz, htmlBody: html });
  return { ok: true, count: due.length };
}

/** Email tomorrow's Scheduled clients a reminder (once). Returns count sent. */
function remindUpcomingJobs() {
  var tomISO = API_iso_(API_addDays_(API_today_(), 1));
  var emailOf = CODE_clientEmailMap_(), nameOf = CODE_clientNameMap_(), biz = CODE_biz_(), phone = CODE_bizPhone_(), tz = Session.getScriptTimeZone(), sent = 0;
  query('Jobs', function (j) { return j.Status === 'Scheduled' && !j.ReminderSent && j.JobDate instanceof Date && API_iso_(j.JobDate) === tomISO; }).forEach(function (j) {
    var email = emailOf[j.ClientID]; if (!email) return;
    var when = Utilities.formatDate(j.JobDate, tz, 'EEEE, MMM d') + (j.ScheduledTime ? ' at ' + API_esc_(j.ScheduledTime) : '');
    MailApp.sendEmail({ to: email, subject: '📅 Reminder: your appointment with ' + biz,
      htmlBody: '<div style="font-family:Arial,sans-serif;color:#1a1c1f"><p>Hi ' + API_esc_(String(nameOf[j.ClientID] || '').split(' ')[0]) + ',</p>' +
        '<p>A friendly reminder of your upcoming appointment with <b>' + API_esc_(biz) + '</b>:</p>' +
        '<p style="font-size:16px"><b>' + when + '</b>' + (j.ServiceName ? '<br>' + API_esc_(j.ServiceName) : '') + '</p>' +
        '<p>Questions or need to reschedule? ' + (phone ? 'Call us at ' + API_esc_(phone) + '.' : 'Just reply to this email.') + '</p>' +
        '<p>See you then!<br>' + API_esc_(biz) + '</p></div>' });
    update('Jobs', j.JobID, { ReminderSent: true }); sent++;
  });
  if (sent) DATA_markStale_();
  return sent;
}

/** Email a Google-review request for finished jobs (once each). Returns {ok,sent,noEmail}. */
function sendReviewRequests() {
  var link = String(settingGet('Google review link') || '').trim();
  if (!link || link.indexOf('http') !== 0) return { ok: false, msg: 'Add your Google review link in Business Settings first.' };
  var biz = CODE_biz_(), accent = CODE_accent_(), emailOf = CODE_clientEmailMap_(), nameOf = CODE_clientNameMap_(), sent = 0, noEmail = 0;
  query('Jobs', function (j) { return j.Status === 'Done' && !j.ReviewSent; }).forEach(function (j) {
    var email = emailOf[j.ClientID]; if (!email) { noEmail++; return; }
    var first = API_esc_(String(nameOf[j.ClientID] || '').split(' ')[0]);
    MailApp.sendEmail({ to: email, subject: 'Quick favor? ⭐ ' + biz,
      htmlBody: '<div style="font-family:Arial,sans-serif;max-width:520px;color:#1a1c1f"><p>Hi ' + first + ',</p>' +
        '<p>Thank you for choosing <b>' + API_esc_(biz) + '</b> for ' + API_esc_(j.ServiceName || 'your recent service') + '. It was a pleasure!</p>' +
        '<p>If you were happy, a quick Google review helps other local folks find us (30 seconds):</p>' +
        '<p style="text-align:center;margin:26px 0"><a href="' + link + '" style="background:' + accent + ';color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:bold">⭐ Leave a review</a></p>' +
        '<p>Thanks again,<br>' + API_esc_(biz) + '</p></div>' });
    update('Jobs', j.JobID, { ReviewSent: true }); sent++;
  });
  if (sent) DATA_markStale_();
  return { ok: true, sent: sent, noEmail: noEmail };
}

/* ============================ menu wrappers (UI) ============================ */

function menuFollowUpDigest() { var r = sendFollowUpDigest(); SpreadsheetApp.getUi().alert(r.ok ? (r.count ? '📧 Emailed you ' + r.count + ' follow-up(s).' : '📧 Emailed you — all caught up 🎉') : r.msg); }
function menuReviewRequests() { var r = sendReviewRequests(); SpreadsheetApp.getUi().alert(r.ok ? ('⭐ Sent ' + r.sent + ' review request(s).' + (r.noEmail ? ' ' + r.noEmail + ' skipped (no client email).' : '')) : r.msg); }
function menuRemindJobs() { SpreadsheetApp.getUi().alert('📅 Sent ' + remindUpcomingJobs() + " reminder(s) for tomorrow's jobs."); }
function menuMarkOverdue() { SpreadsheetApp.getUi().alert('🚩 Flagged ' + markOverdueInvoices() + ' invoice(s) overdue.'); }
function menuRollForward() { SpreadsheetApp.getUi().alert('🔁 Rolled forward ' + rollForwardRecurringJobs() + ' recurring job(s).'); }

/* ============================ triggers ============================ */

function installAutomations() {
  removeAutomations_();
  ScriptApp.newTrigger('rollForwardRecurringJobs').timeBased().atHour(6).everyDays(1).create();
  ScriptApp.newTrigger('markOverdueInvoices').timeBased().atHour(7).everyDays(1).create();
  ScriptApp.newTrigger('sendFollowUpDigest').timeBased().atHour(8).everyDays(1).create();
  ScriptApp.newTrigger('remindUpcomingJobs').timeBased().atHour(8).everyDays(1).create();
  SpreadsheetApp.getUi().alert('⏰ Autopilot ON', 'Each morning: recurring jobs roll forward, overdue invoices are flagged, your follow-up list is emailed (8am), and tomorrow\'s clients get reminders. You may be asked to authorize email once.', SpreadsheetApp.getUi().ButtonSet.OK);
}
function removeAutomations() { removeAutomations_(); SpreadsheetApp.getUi().alert('⏹️ Daily autopilot OFF.'); }
function removeAutomations_() {
  var handlers = ['sendFollowUpDigest', 'remindUpcomingJobs', 'markOverdueInvoices', 'rollForwardRecurringJobs'];
  ScriptApp.getProjectTriggers().forEach(function (t) { if (handlers.indexOf(t.getHandlerFunction()) > -1) ScriptApp.deleteTrigger(t); });
}

/* ============================ Google-Form lead intake ============================ */

/** Create a mobile lead-capture Form, wire its submit trigger, and save its URL to Business Settings. */
function createLeadForm() {
  var ui = SpreadsheetApp.getUi();
  var form = FormApp.create(CODE_biz_() + ' — Request a quote');
  form.setDescription('Tell us what you need and we\'ll get right back to you.');
  form.addTextItem().setTitle('Name').setRequired(true);
  form.addTextItem().setTitle('Phone');
  form.addTextItem().setTitle('Email');
  form.addTextItem().setTitle('Address');
  form.addParagraphTextItem().setTitle('What do you need?');
  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
  settingSet('Mobile lead form URL', form.getPublishedUrl());
  ui.alert('📱 Lead form ready', 'Share this link (add it to your phone / bio / flyers):\n\n' + form.getPublishedUrl() + '\n\nSubmissions land in Clients as new Leads automatically.', ui.ButtonSet.OK);
}

/** Form submission → new Client with Status=Lead. Wired by createLeadForm(). */
function onFormSubmit(e) {
  var vals = {};
  if (e && e.namedValues) Object.keys(e.namedValues).forEach(function (k) { vals[String(k).trim().toLowerCase()] = String(e.namedValues[k]).trim(); });
  var pick = function () { for (var i = 0; i < arguments.length; i++) { var v = vals[arguments[i]]; if (v) return v; } return ''; };
  var name = pick('name', 'full name', 'your name'); if (!name) return;
  var days = Number(settingGet('Default follow-up (days)')) || 2;
  insert('Clients', {
    Name: name, Phone: pick('phone', 'phone number'), Email: pick('email', 'email address'), Address: pick('address'),
    Status: 'Lead', Source: 'Web form', Notes: pick('what do you need?', 'notes', 'message', 'details'),
    NextFollowUp: API_addDays_(API_today_(), days),
  });
  DATA_markStale_();   // lead came in outside the app → next open rebuilds the JSON
}

/** Manual sheet edits (NOT the app's own programmatic writes, which never fire this) mark the JSON
 *  stale so the next app open rebuilds it from Sheets. Simple trigger — installs automatically on save. */
function onEdit(e) { try { DATA_markStale_(); } catch (err) {} }

/* ============================ sidebar server helpers ============================ */
// The Quick Actions sidebar (Sidebar.html) reuses the app API for reads/writes.

function sidebarData() { return { services: apiListServices(true), followUps: apiDashboard().followUps }; }
function sidebarAddClient(form) { return apiCreateClient(form); }
function sidebarAddJob(form) { return apiCreateJob(form); }
