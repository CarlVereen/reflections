# Test harnesses (fake-Sheets / headless sandbox)

There is no live Google Sheet in the build environment, so the server layer is exercised in a
Node `vm` sandbox that stubs the Apps Script services (SpreadsheetApp, LockService, Utilities,
MailApp, DriveApp, FormApp, …), and the front-end is driven in headless Chromium against an
in-memory mock of the API.

One-time setup for the browser suite (webtest.js):
    npm install                        # installs playwright (devDependency)
    npx playwright install chromium    # downloads the managed headless browser (~115MB)

Run (from products/service-crm/):
    npm test                 # all four suites in sequence
    node tests/dbtest.js     # db.gs + setup.gs: schema build, ORM, FK/enum, caches, review fixes
    node tests/apitest.js    # Api.gs over db.gs: bootstrap, client→estimate→approve→paid, tax, numbering
    node tests/codetest.js   # Code.gs automations + Google-Form intake
    node tests/webtest.js    # WebApp.html flows in headless Chromium (Playwright-managed browser)

Totals at last run: db 38 · api 40 · code 15 · web 36 = 129 assertions, all passing.

webtest.js now uses the portable `require('playwright')` + `chromium.launch()` (Playwright's
managed browser), so it runs anywhere `npx playwright install chromium` has been run — no more
hardcoded /opt paths. The browser suite covers: boot/home, client add, estimate build + per-line
price override, billing/tax, approve→invoice→paid (incl. the job Time field + jobTime threading),
mark paid, jobs render, settings (incl. the Google-Calendar-sync toggle), price book, the
pick-client → job-create flow, client Maps directions link, reschedule-keeps-time, and job archive.

NOTE: these prove front-end logic/flow against an in-memory mock of the API, NOT live Apps Script,
Sheets, or Calendar behavior — run setupDatabase() on a real sheet + a manual smoke test to confirm
Google-integration parity (real calendar writes, OAuth, sheet reads).
