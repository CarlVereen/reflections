/**
 * setup.gs — builds the entire Service Pro CRM schema on a fresh spreadsheet.
 *
 * setupDatabase() creates the 7 data tabs + hidden _meta from the SCHEMA in db.gs: exact machine
 * headers (frozen row 1), enum dropdowns via Data Validation, real checkbox booleans, currency /
 * date / datetime number formats, plaintext IDs & phones, and seeds _meta counters, Services, and
 * Settings. No cell formulas are ever written — Script owns every value.
 */

function DB_colLetter_(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = (n - m - 1) / 26; } return s; }

/** Build (or rebuild) one tab from its SCHEMA spec: headers, freeze, per-column formats/validation. */
function DB_buildTable_(ss, table) {
  var spec = SCHEMA[table];
  var sh = ss.getSheetByName(spec.sheet) || ss.insertSheet(spec.sheet);
  sh.clear();
  if (sh.getDataValidations) { try { sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).clearDataValidations(); } catch (e) {} }

  var headers = spec.cols.map(function (c) { return c.n; });
  sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#e8e2d4');
  sh.setFrozenRows(1);

  // Format each column whole (A2:A style) so rows added years from now inherit format/validation.
  spec.cols.forEach(function (c, i) {
    var L = DB_colLetter_(i + 1), col = sh.getRange(L + '2:' + L);
    if (c.t === 'id' || c.t === 'phone' || c.t === 'text' || c.t === 'url') col.setNumberFormat('@'); // plaintext: preserve IDs/phones and stop text from being read as a formula
    else if (c.t === 'date') col.setNumberFormat('yyyy-mm-dd');
    else if (c.t === 'datetime') col.setNumberFormat('yyyy-mm-dd hh:mm:ss');
    else if (c.t === 'money') col.setNumberFormat('$#,##0.00');
    else if (c.t === 'number') col.setNumberFormat('0.##');
    else if (c.t === 'bool') col.insertCheckboxes();
    else if (c.t === 'enum') col.setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(c.values, true).setAllowInvalid(false).build());
  });

  for (var w = 0; w < headers.length; w++) sh.setColumnWidth(w + 1, 150);
  if (spec.hidden) sh.hideSheet();
  return sh;
}

function DB_seedMeta_(ss) {
  ss.getSheetByName(SCHEMA._meta.sheet).getRange(2, 1, META_SEED.length, 4).setValues(META_SEED);
  DB_invalidate_('_meta');
}

function DB_seedServices_() {
  ['Consultation', 'Standard service', 'indoor and outdoor service', 'Recurring service', 'Emergency call']
    .forEach(function (name) { insert('Services', { ServiceName: name, DefaultRate: 0, Active: true }); });
}

function DB_seedSettings_(ss) {
  var rows = [
    ['Business name', ''], ['Owner email', ''], ['Business phone', ''], ['Business address', ''],
    ['Currency symbol', '$'], ['Sales tax %', 0], ['Default follow-up (days)', 2],
    ['Google review link', ''], ['Invoice payment instructions', ''], ['Payment link', ''],
    ['Invoice due (days)', 14], ['Estimate starting number', 1001], ['Invoice starting number', 9001],
    ['Company logo (data URL)', ''], ['Accent color', '#8f5f22'],
  ];
  ss.getSheetByName(SCHEMA.Settings.sheet).getRange(2, 1, rows.length, 2).setValues(rows);
  DB_invalidate_('Settings');
}

/** Order the visible tabs left→right for the owner; keep _meta hidden at the end. */
function DB_orderTabs_(ss) {
  var order = ['Clients', 'Jobs', 'Estimates', 'Invoices', 'LineItems', 'Services', 'Settings', '_meta'];
  order.forEach(function (t, i) {
    var sh = ss.getSheetByName(SCHEMA[t].sheet);
    if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(i + 1); }
  });
  ss.setActiveSheet(ss.getSheetByName(SCHEMA.Clients.sheet));
}

/** Build the whole database on the active spreadsheet. Returns a verifySchema() report. */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ['_meta', 'Clients', 'Jobs', 'Estimates', 'Invoices', 'LineItems', 'Services', 'Settings']
    .forEach(function (t) { DB_buildTable_(ss, t); });
  DB_seedMeta_(ss);       // counters must exist before Services are inserted (they draw IDs)
  DB_seedSettings_(ss);
  DB_seedServices_();
  DB_orderTabs_(ss);
  return verifySchema();
}

/** Destructive dev helper: wipe the CRM tabs and rebuild. Keeps a scratch sheet so the file is valid. */
function resetDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var scratch = ss.insertSheet('__scratch__');
  Object.keys(SCHEMA).forEach(function (t) {
    var sh = ss.getSheetByName(SCHEMA[t].sheet); if (sh) ss.deleteSheet(sh);
  });
  _DB_cache = {};
  var report = setupDatabase();
  ss.deleteSheet(scratch);
  return report;
}

/** Confirm the built workbook matches SCHEMA: header names, frozen row, hidden _meta, seeds. */
function verifySchema() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var report = { ok: true, errors: [], tables: {} };
  Object.keys(SCHEMA).forEach(function (t) {
    var spec = SCHEMA[t], sh = ss.getSheetByName(spec.sheet);
    if (!sh) { report.ok = false; report.errors.push('missing tab ' + spec.sheet); return; }
    var hdr = sh.getRange(1, 1, 1, spec.cols.length).getValues()[0].map(String);
    var expect = spec.cols.map(function (c) { return c.n; });
    var headersMatch = JSON.stringify(hdr) === JSON.stringify(expect);
    if (!headersMatch) { report.ok = false; report.errors.push(spec.sheet + ' header mismatch'); }
    report.tables[t] = { headersMatch: headersMatch, frozenRows: sh.getFrozenRows(),
      hidden: sh.isSheetHidden(), dataRows: Math.max(0, sh.getLastRow() - 1) };
  });
  report.seededServices = getAll('Services').length;
  report.metaCounters = getAll('_meta') === undefined ? 0 : DB_values_('_meta').length - 1;
  return report;
}
