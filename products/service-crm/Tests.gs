/**
 * Tests.gs — in-editor INTEGRATION smoke test (dev/QA only).
 *
 * Unlike the Node mock suites in tests/*.js (which stub Google), this runs INSIDE Apps Script and
 * exercises the REAL Google Sheet, Calendar, PDF converter, email, and Form-intake code in the
 * account that owns this file. It is the automated version of SMOKE-TEST.md Sections I + O + parts
 * of E/G.
 *
 * HOW TO RUN:
 *   Extensions ▸ Apps Script ▸ pick `runIntegrationSmoke` in the function dropdown ▸ Run.
 *   Approve permissions (Calendar, Gmail/Send, Drive) the first time. Read the result in the
 *   Execution log (or the popup). It creates tagged __SMOKE__ rows, drives each integration, then
 *   HARD-DELETES its own rows and DELETES its calendar event — it leaves no residue.
 *
 * WHAT IT DOES **NOT** DO (on purpose):
 *   sendReviewRequests() and remindUpcomingJobs() email your REAL clients (they act on ALL matching
 *   jobs, not just test rows), so auto-running them could message real customers. They stay MANUAL —
 *   test them from the ⚡ CRM menu with a single controlled client (SMOKE-TEST G1 / G3).
 *
 * SIDE EFFECTS you should expect from one run:
 *   • one test event briefly appears then is deleted on your default Google Calendar
 *   • ONE real email to the OWNER address (the follow-up digest) — nothing goes to clients
 *   • markOverdueInvoices / rollForwardRecurringJobs run their real (idempotent) daily action, which
 *     also processes any genuinely-qualifying real rows — this is the same thing the daily trigger does.
 *
 * This file is inert unless explicitly run and is not wired into any menu. You may leave it out of
 * the buyer-facing master if you prefer a leaner copy.
 */

function runIntegrationSmoke() {
  var log = [], pass = 0, fail = 0;
  function check(cond, msg) { if (cond) { pass++; log.push('  ✓ ' + msg); } else { fail++; log.push('  ✗ FAIL ' + msg); } }
  function head(t) { log.push('— ' + t + ' —'); }

  var made = { Invoices: [], Estimates: [], Jobs: [], Clients: [] };   // hard-deleted in this order at the end
  function track(table, id) { made[table].push(id); return id; }
  var prevToggle = settingGet('Sync jobs to Google Calendar');
  var prevReview = settingGet('Google review link');
  var owner = '';
  try { owner = CODE_ownerEmail_(); } catch (e0) {}

  var TAG = '__SMOKE__ Test Client';

  try {
    if (typeof CalendarApp === 'undefined') { log.push('Calendar service unavailable — cannot run.'); return log.join('\n'); }
    log.push('Timezone: ' + Session.getScriptTimeZone() + '   Owner: ' + (owner || '(none)'));
    settingSet('Sync jobs to Google Calendar', 'yes');

    var svc = getAll('Services')[0];
    check(!!svc, 'a service exists to attach to jobs/invoices');
    if (!svc) throw new Error('no services seeded — run Set up / rebuild database first');

    // one reusable test client (address for the calendar location + PDF; email = owner so any test
    // email lands on YOU, never a stranger; due follow-up so the digest has something to report)
    var addr = '123 Smoke Test Way, Tucson AZ 85701';
    var c = insert('Clients', { Name: TAG, Address: addr, Email: owner, Status: 'Lead', NextFollowUp: API_today_() });
    track('Clients', c.ClientID);
    check(!!getById('Clients', c.ClientID), 'test client created (' + c.ClientID + ')');

    /* ===================== 1) Calendar sync ===================== */
    head('Calendar sync');
    var cal = CalendarApp.getDefaultCalendar();
    check(!!cal, 'default Google Calendar is reachable');
    var jd = API_addDays_(API_today_(), 3);
    var j = insert('Jobs', { ClientID: c.ClientID, ServiceID: svc.ServiceID, JobDate: jd, ScheduledTime: '2pm', Status: 'Scheduled' });
    track('Jobs', j.JobID);
    API_syncJobCalendar_(j.JobID);
    var eventId = (getById('Jobs', j.JobID) || {}).CalendarEventID;
    check(!!eventId, 'job got a CalendarEventID after sync');
    var ev = eventId ? cal.getEventById(eventId) : null;
    check(!!ev, 'the event exists on your Google Calendar');
    if (ev) {
      check(ev.getLocation() === addr, 'event location = client address');
      check(ev.getTitle().indexOf(TAG) > -1, 'event title includes the client name');
      check(ev.getStartTime().getHours() === 14, 'event starts at 2pm (14:00) in ' + Session.getScriptTimeZone());
    }
    update('Jobs', j.JobID, { JobDate: API_addDays_(jd, 1), ScheduledTime: '9am' });
    API_syncJobCalendar_(j.JobID);
    check((getById('Jobs', j.JobID) || {}).CalendarEventID === eventId, 'reschedule kept the SAME event (no duplicate)');
    var ev2 = cal.getEventById(eventId);
    check(!!ev2 && ev2.getStartTime().getHours() === 9, 'event moved to 9am after reschedule');
    update('Jobs', j.JobID, { Status: 'Cancelled' });
    API_syncJobCalendar_(j.JobID);
    check(!(getById('Jobs', j.JobID) || {}).CalendarEventID, 'cancel cleared the CalendarEventID');
    var stillListed = cal.getEvents(API_addDays_(jd, -1), API_addDays_(jd, 4)).some(function (e) { return e.getTitle().indexOf(TAG) > -1; });
    check(!stillListed, 'cancel removed the event from the calendar (fresh getEvents check)');

    /* ===================== 2) Invoice PDF (HTML → PDF converter) ===================== */
    // In-memory: renders the real invoice HTML and asks Google to convert to PDF. No sheet write,
    // no Drive file, no email — just proves the environment-sensitive PDF step works.
    head('Invoice PDF');
    var fakeInv = { InvoiceID: 'INV-SMOKE', ClientID: c.ClientID, IssueDate: API_today_(), DueDate: API_addDays_(API_today_(), 14),
      TaxRate: 0, Subtotal: 150, Tax: 0, Total: 150, Status: 'Draft' };
    var pdfHtml = API_docHtml_('INVOICE', fakeInv, getById('Clients', c.ClientID), [{ description: 'Smoke service', qty: 1, rate: 150, lineTotal: 150 }]);
    var pdf = Utilities.newBlob(pdfHtml, 'text/html', 't.html').getAs('application/pdf');
    check(pdf.getContentType() === 'application/pdf', 'invoice HTML converts to a PDF blob');
    check(pdf.getBytes().length > 1000, 'PDF has real content (' + pdf.getBytes().length + ' bytes)');

    /* ===================== 3) Email pipeline — follow-up digest (owner only) ===================== */
    head('Email — follow-up digest (to owner only)');
    var dig = sendFollowUpDigest();
    check(!!dig && dig.ok, 'sendFollowUpDigest ran without error (emailed ' + owner + ')');
    check(dig && dig.count >= 1, 'digest counted the due test client (count=' + (dig ? dig.count : '?') + ')');

    /* ===================== 4) Recurring roll-forward ===================== */
    head('Recurring roll-forward');
    var pastDate = API_addDays_(API_today_(), -7);
    var rj = insert('Jobs', { ClientID: c.ClientID, ServiceID: svc.ServiceID, JobDate: pastDate, Status: 'Done', Recurring: 'Weekly' });
    track('Jobs', rj.JobID);
    var beforeRoll = query('Jobs', function (x) { return x.ClientID === c.ClientID && x.Status === 'Scheduled' && x.Recurring === 'Weekly'; }).length;
    rollForwardRecurringJobs();
    var rolled = query('Jobs', function (x) {
      return x.ClientID === c.ClientID && x.Status === 'Scheduled' && x.Recurring === 'Weekly' && API_iso_(x.JobDate) === API_iso_(API_today_());
    });
    check(rolled.length >= 1, 'a finished Weekly job rolled forward to its next occurrence');
    if (rolled.length) track('Jobs', rolled[0].JobID);
    var beforeAgain = query('Jobs', function (x) { return x.ClientID === c.ClientID && x.Status === 'Scheduled' && x.Recurring === 'Weekly'; }).length;
    rollForwardRecurringJobs();
    var afterAgain = query('Jobs', function (x) { return x.ClientID === c.ClientID && x.Status === 'Scheduled' && x.Recurring === 'Weekly'; }).length;
    check(afterAgain === beforeAgain, 'roll-forward is idempotent (no duplicate on a second run)');

    /* ===================== 5) Overdue flagging ===================== */
    head('Overdue invoice flagging');
    var iv = insert('Invoices', { ClientID: c.ClientID, IssueDate: API_addDays_(API_today_(), -30), DueDate: API_addDays_(API_today_(), -1), Status: 'Sent', Total: 150 });
    track('Invoices', iv.InvoiceID);
    markOverdueInvoices();
    check((getById('Invoices', iv.InvoiceID) || {}).Status === 'Overdue', 'a past-due Sent invoice was flagged Overdue');

    /* ===================== 6) Web-form lead intake ===================== */
    head('Web-form lead intake');
    var formLeadName = '__SMOKE__ Form Lead';
    onFormSubmit({ namedValues: { 'Name': [formLeadName], 'Phone': ['5550000000'], 'Email': ['smoke@example.com'], 'Address': ['1 Test St'], 'What do you need?': ['smoke test'] } });
    var lead = query('Clients', function (x) { return x.Name === formLeadName && x.Status === 'Lead'; })[0];
    check(!!lead, 'a form submission created a new Lead client');
    if (lead) { track('Clients', lead.ClientID); check(lead.Source === 'Web form', 'the new lead is tagged Source = Web form'); }

  } catch (e) {
    fail++; log.push('  ✗ EXCEPTION ' + e);
  } finally {
    // restore owner settings
    settingSet('Sync jobs to Google Calendar', prevToggle || 'yes');
    settingSet('Google review link', prevReview || '');
    // sweep any leftover __SMOKE__ calendar events so the test never litters the calendar
    try {
      var cc = CalendarApp.getDefaultCalendar(), sweep = cc.getEvents(API_addDays_(API_today_(), -3), API_addDays_(API_today_(), 12));
      for (var si = 0; si < sweep.length; si++) { if (sweep[si].getTitle().indexOf('__SMOKE__') > -1) sweep[si].deleteEvent(); }
    } catch (e4) {}
    // hard-remove the test rows (Invoices/Estimates before Jobs/Clients they reference)
    ['Invoices', 'Estimates', 'Jobs', 'Clients'].forEach(function (t) { made[t].forEach(function (id) { TEST_hardDelete_(t, id); }); });
  }

  var summary = pass + ' passed, ' + fail + ' failed';
  var out = 'Integration smoke — real Sheet + Calendar + PDF + email + form\n' + log.join('\n') + '\n=== ' + summary + ' ===';
  Logger.log(out);
  try { SpreadsheetApp.getUi().alert('Integration smoke: ' + summary, out, SpreadsheetApp.getUi().ButtonSet.OK); } catch (e3) {}
  return out;
}

/** Physically remove a row by its PK so the smoke test leaves no residue (bypasses the soft-delete
 *  ORM on purpose — this is test-only cleanup). Scans bottom-up so the just-appended rows go first. */
function TEST_hardDelete_(table, id) {
  try {
    var sh = DB_sheet_(table), vals = sh.getDataRange().getValues();
    for (var i = vals.length - 1; i >= 1; i--) {
      if (String(vals[i][0]) === String(id)) { sh.deleteRow(i + 1); DB_invalidate_(table); return true; }
    }
  } catch (e) {}
  return false;
}
