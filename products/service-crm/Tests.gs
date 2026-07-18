/**
 * Tests.gs — in-editor INTEGRATION smoke test (dev/QA only).
 *
 * Unlike the Node mock suites in tests/*.js (which stub Google), this runs INSIDE Apps Script and
 * exercises the REAL Google Sheet + REAL Google Calendar in the account that owns this file. It is
 * the automated version of SMOKE-TEST.md Section O.
 *
 * HOW TO RUN:
 *   Extensions ▸ Apps Script ▸ pick `runIntegrationSmoke` in the function dropdown ▸ Run.
 *   Approve permissions (incl. Calendar) the first time. Read the result in the Execution log
 *   (or the popup). It creates tagged __SMOKE__ test data + one calendar event, verifies the whole
 *   create → reschedule → cancel lifecycle, then DELETES the event and HARD-DELETES its own test
 *   rows — it leaves no residue. Safe to run on your live master.
 *
 * This file is inert unless explicitly run and is not wired into any menu. You may leave it out of
 * the buyer-facing master if you prefer a leaner copy.
 */

function runIntegrationSmoke() {
  var log = [], pass = 0, fail = 0;
  function check(cond, msg) { if (cond) { pass++; log.push('  ✓ ' + msg); } else { fail++; log.push('  ✗ FAIL ' + msg); } }

  var createdClientId = null, createdJobId = null, eventId = null;
  var prevToggle = settingGet('Sync jobs to Google Calendar');

  try {
    if (typeof CalendarApp === 'undefined') { log.push('Calendar service unavailable — cannot run.'); return log.join('\n'); }
    settingSet('Sync jobs to Google Calendar', 'yes');   // ensure sync on for the test
    var cal = CalendarApp.getDefaultCalendar();
    check(!!cal, 'default Google Calendar is reachable');

    // 1) test client with a real address (so the event gets a location)
    var addr = '123 Smoke Test Way, Tucson AZ 85701';
    var c = insert('Clients', { Name: '__SMOKE__ Test Client', Address: addr, Status: 'Lead' });
    createdClientId = c.ClientID;
    check(!!getById('Clients', c.ClientID), 'test client created (' + c.ClientID + ')');

    var svc = getAll('Services')[0];
    check(!!svc, 'at least one service exists to attach to the job');
    if (!svc) throw new Error('no services seeded — run Set up / rebuild database first');

    // 2) timed job → should create a calendar event and store its id back on the job
    var jd = API_addDays_(API_today_(), 3);
    var j = insert('Jobs', { ClientID: c.ClientID, ServiceID: svc.ServiceID, JobDate: jd, ScheduledTime: '2pm', Status: 'Scheduled' });
    createdJobId = j.JobID;
    API_syncJobCalendar_(j.JobID);
    eventId = (getById('Jobs', j.JobID) || {}).CalendarEventID;
    check(!!eventId, 'job got a CalendarEventID after sync (' + eventId + ')');

    // 3) verify the real event
    var ev = eventId ? cal.getEventById(eventId) : null;
    check(!!ev, 'the event exists on your Google Calendar');
    if (ev) {
      check(ev.getLocation() === addr, 'event location = client address');
      check(ev.getTitle().indexOf('__SMOKE__ Test Client') > -1, 'event title includes the client name');
      check(ev.getStartTime().getHours() === 14, 'event starts at 2pm (14:00)');
    }

    // 4) reschedule → SAME event, moved to 9am
    update('Jobs', j.JobID, { JobDate: API_addDays_(jd, 1), ScheduledTime: '9am' });
    API_syncJobCalendar_(j.JobID);
    check((getById('Jobs', j.JobID) || {}).CalendarEventID === eventId, 'reschedule kept the SAME event (no duplicate)');
    var ev2 = cal.getEventById(eventId);
    check(!!ev2 && ev2.getStartTime().getHours() === 9, 'event moved to 9am after reschedule');

    // 5) cancel → event deleted, id cleared
    update('Jobs', j.JobID, { Status: 'Cancelled' });
    API_syncJobCalendar_(j.JobID);
    check(!(getById('Jobs', j.JobID) || {}).CalendarEventID, 'cancel cleared the CalendarEventID');
    check(!cal.getEventById(eventId), 'cancel deleted the calendar event');
    eventId = null;   // already gone — nothing for finally to clean

    // 6) toggle OFF is respected → a new job creates no event
    settingSet('Sync jobs to Google Calendar', 'no');
    var j2 = insert('Jobs', { ClientID: c.ClientID, ServiceID: svc.ServiceID, JobDate: jd, ScheduledTime: '3pm', Status: 'Scheduled' });
    API_syncJobCalendar_(j2.JobID);
    check(!(getById('Jobs', j2.JobID) || {}).CalendarEventID, 'toggle OFF → no calendar event created');
    TEST_hardDelete_('Jobs', j2.JobID);   // clean up the second job immediately

  } catch (e) {
    fail++; log.push('  ✗ EXCEPTION ' + e);
  } finally {
    // cleanup: delete any lingering event + hard-remove the test rows, then restore the toggle
    try { if (eventId) { var lo = CalendarApp.getDefaultCalendar().getEventById(eventId); if (lo) lo.deleteEvent(); } } catch (e2) {}
    if (createdJobId) TEST_hardDelete_('Jobs', createdJobId);
    if (createdClientId) TEST_hardDelete_('Clients', createdClientId);
    settingSet('Sync jobs to Google Calendar', prevToggle || 'yes');
  }

  var summary = pass + ' passed, ' + fail + ' failed';
  var out = 'Integration smoke — real Sheet + Calendar\n' + log.join('\n') + '\n=== ' + summary + ' ===';
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
