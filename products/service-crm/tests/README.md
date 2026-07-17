# Test harnesses (fake-Sheets / headless sandbox)

There is no live Google Sheet in the build environment, so the server layer is exercised in a
Node `vm` sandbox that stubs the Apps Script services (SpreadsheetApp, LockService, Utilities,
MailApp, DriveApp, FormApp, …), and the front-end is driven in headless Chromium against an
in-memory mock of the API.

Run (from products/service-crm/):
    node tests/dbtest.js     # db.gs + setup.gs: schema build, ORM, FK/enum, caches, review fixes
    node tests/apitest.js    # Api.gs over db.gs: bootstrap, client→estimate→approve→paid, tax, numbering
    node tests/codetest.js   # Code.gs automations + Google-Form intake
    node tests/webtest.js    # WebApp.html flows in headless Chromium (needs /opt/pw-browsers chromium)

Totals at last run: db 38 · api 39 · code 15 · web 19 = 111 assertions, all passing.

NOTE: paths to /opt/node22 playwright and /opt/pw-browsers chromium are specific to this
environment; adjust for another machine. These prove logic/flow, NOT live Apps Script behavior —
run setupDatabase() on a real sheet to confirm parity.
