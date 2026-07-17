/**
 * db.gs — Service Pro CRM data-access layer (ORM-lite) over Google Sheets.
 *
 * Design rules (see the rebuild spec):
 *  - Join by ID, never by name. FK existence is validated in Script on every write.
 *  - No cell formulas. Script computes and writes every value (see recalc* functions).
 *  - Read-once / write-batch: a whole tab is read once per execution into objects keyed by ID
 *    (never getRange() inside a per-row loop); writes go out as a single setValues/appendRow.
 *  - Every write is wrapped in LockService.getScriptLock() (reentrant within one execution).
 *  - Snapshot pricing: a LineItem copies Description + Rate from its Service at write time.
 *  - Soft-delete only: rows are flagged Archived, never removed.
 *
 * SCHEMA is the single source of truth for both setup.gs (which builds the tabs) and this file.
 */

var SCHEMA = {
  Clients: { sheet: 'Clients', entity: 'Clients', cols: [
    { n: 'ClientID',      t: 'id' },
    { n: 'Name',          t: 'text' },
    { n: 'Phone',         t: 'phone' },
    { n: 'Email',         t: 'text' },
    { n: 'Address',       t: 'text' },
    { n: 'Status',        t: 'enum', values: ['Lead', 'Active', 'Inactive', 'Lost'], default: 'Lead' },
    { n: 'Source',        t: 'text' },
    { n: 'NextFollowUp',  t: 'date' },
    { n: 'LifetimeSpent', t: 'money', cache: true, default: 0 },
    { n: 'Notes',         t: 'text' },
    { n: 'Archived',      t: 'bool', default: false },
    { n: 'CreatedAt',     t: 'datetime', auto: 'create' },
    { n: 'UpdatedAt',     t: 'datetime', auto: 'update' },
  ]},
  Jobs: { sheet: 'Jobs', entity: 'Jobs', cols: [
    { n: 'JobID',         t: 'id' },
    { n: 'ClientID',      t: 'id', fk: 'Clients' },
    { n: 'ServiceID',     t: 'id', fk: 'Services' },
    { n: 'ServiceName',   t: 'text', snapshot: { from: 'ServiceID', field: 'ServiceName' } },
    { n: 'JobDate',       t: 'date' },
    { n: 'ScheduledTime', t: 'text' },
    { n: 'Status',        t: 'enum', values: ['Scheduled', 'Done', 'Cancelled'], default: 'Scheduled' },
    { n: 'ReviewSent',    t: 'bool', default: false },
    { n: 'ReminderSent',  t: 'bool', default: false },
    { n: 'Recurring',     t: 'enum', values: ['None', 'Weekly', 'Monthly', 'Quarterly', 'Annual'], default: 'None' },
    { n: 'Notes',         t: 'text' },
    { n: 'PhotosLink',    t: 'url' },
    { n: 'Archived',      t: 'bool', default: false },
    { n: 'CreatedAt',     t: 'datetime', auto: 'create' },
    { n: 'UpdatedAt',     t: 'datetime', auto: 'update' },
  ]},
  Estimates: { sheet: 'Estimates', entity: 'Estimates', cols: [
    { n: 'EstimateID',    t: 'id' },
    { n: 'ClientID',      t: 'id', fk: 'Clients' },
    { n: 'IssueDate',     t: 'date' },
    { n: 'ValidUntil',    t: 'date' },
    { n: 'Status',        t: 'enum', values: ['Draft', 'Sent', 'Accepted', 'Declined'], default: 'Draft' },
    { n: 'Total',         t: 'money', cache: true, default: 0 },
    { n: 'Archived',      t: 'bool', default: false },
    { n: 'CreatedAt',     t: 'datetime', auto: 'create' },
    { n: 'UpdatedAt',     t: 'datetime', auto: 'update' },
  ]},
  Invoices: { sheet: 'Invoices', entity: 'Invoices', cols: [
    { n: 'InvoiceID',     t: 'id' },
    { n: 'ClientID',      t: 'id', fk: 'Clients' },
    { n: 'JobID',         t: 'id', fk: 'Jobs', optional: true },
    { n: 'IssueDate',     t: 'date' },
    { n: 'DueDate',       t: 'date' },
    { n: 'Status',        t: 'enum', values: ['Draft', 'Sent', 'Paid', 'Overdue'], default: 'Draft' },
    { n: 'Total',         t: 'money', cache: true, default: 0 },
    { n: 'Archived',      t: 'bool', default: false },
    { n: 'CreatedAt',     t: 'datetime', auto: 'create' },
    { n: 'UpdatedAt',     t: 'datetime', auto: 'update' },
  ]},
  LineItems: { sheet: 'LineItems', entity: 'LineItems', cols: [
    { n: 'LineItemID',    t: 'id' },
    { n: 'DocType',       t: 'enum', values: ['Estimate', 'Invoice'] },
    { n: 'DocID',         t: 'id', fkDoc: true },   // FK to Estimates OR Invoices, per DocType
    { n: 'ServiceID',     t: 'id', fk: 'Services' },
    { n: 'Description',   t: 'text', snapshot: { from: 'ServiceID', field: 'ServiceName' } },
    { n: 'Qty',           t: 'number', default: 1 },
    { n: 'Rate',          t: 'money', snapshot: { from: 'ServiceID', field: 'DefaultRate' } },
    { n: 'LineTotal',     t: 'money', cache: true, default: 0 },
    { n: 'Archived',      t: 'bool', default: false },
    { n: 'CreatedAt',     t: 'datetime', auto: 'create' },
    { n: 'UpdatedAt',     t: 'datetime', auto: 'update' },
  ]},
  Services: { sheet: 'Services', entity: 'Services', cols: [
    { n: 'ServiceID',     t: 'id' },
    { n: 'ServiceName',   t: 'text' },
    { n: 'DefaultRate',   t: 'money', default: 0 },
    { n: 'Active',        t: 'bool', default: true },
    { n: 'CreatedAt',     t: 'datetime', auto: 'create' },
    { n: 'UpdatedAt',     t: 'datetime', auto: 'update' },
  ]},
  Settings: { sheet: 'Settings', keyValue: true, cols: [
    { n: 'Key',   t: 'text' },
    { n: 'Value', t: 'text' },
  ]},
  _meta: { sheet: '_meta', hidden: true, cols: [
    { n: 'Entity',     t: 'text' },
    { n: 'Prefix',     t: 'text' },
    { n: 'NextNumber', t: 'number' },
    { n: 'Padding',    t: 'number' },
  ]},
};

// _meta seed: [Entity, Prefix, NextNumber, Padding]. Estimates/Invoices start high by convention.
var META_SEED = [
  ['Clients',   'CL',  1,    4],
  ['Jobs',      'JOB', 1,    5],
  ['Estimates', 'EST', 1001, 4],
  ['Invoices',  'INV', 9001, 4],
  ['LineItems', 'LI',  1,    6],
  ['Services',  'SVC', 1,    2],
];

/* ============================ infrastructure ============================ */

function DB_ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function DB_sheet_(table) {
  var sh = DB_ss_().getSheetByName(SCHEMA[table].sheet);
  if (!sh) throw new Error('Missing tab "' + SCHEMA[table].sheet + '" — run setupDatabase() first.');
  return sh;
}
function DB_colNames_(table) { return SCHEMA[table].cols.map(function (c) { return c.n; }); }
function DB_pad_(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }

// Reentrant script lock: acquire once for the outermost write, release when it unwinds.
var _DB_lock = null, _DB_depth = 0;
function DB_withLock_(fn) {
  var acquired = false;
  if (_DB_depth === 0) { _DB_lock = LockService.getScriptLock(); _DB_lock.waitLock(30000); acquired = true; }
  _DB_depth++;
  try { return fn(); }
  finally { _DB_depth--; if (_DB_depth === 0 && acquired) { _DB_lock.releaseLock(); _DB_lock = null; } }
}

// Read-once cache: sheetName -> 2D value array (incl. header). Dropped when that table is written.
var _DB_cache = {};
function DB_invalidate_(table) { delete _DB_cache[SCHEMA[table].sheet]; }
function DB_values_(table) {
  var key = SCHEMA[table].sheet;
  if (!_DB_cache[key]) _DB_cache[key] = DB_sheet_(table).getDataRange().getValues();
  return _DB_cache[key];
}

/* ============================ type coercion ============================ */

// Sheet value -> JS object field.
function DB_readCell_(t, v) {
  if (v === '' || v === null || v === undefined) {
    return (t === 'bool') ? false : (t === 'money' || t === 'number') ? 0 : (t === 'date' || t === 'datetime') ? null : '';
  }
  if (t === 'money' || t === 'number') return Number(v) || 0;
  if (t === 'bool') return v === true || v === 'TRUE' || v === 'true';
  if (t === 'date' || t === 'datetime') return (v instanceof Date) ? v : new Date(v);
  return String(v);
}
// JS object field -> sheet cell.
function DB_writeCell_(t, v) {
  if (v === null || v === undefined || v === '') return (t === 'bool') ? false : (t === 'money' || t === 'number') ? 0 : '';
  if (t === 'money' || t === 'number') return Number(v) || 0;
  if (t === 'bool') return v === true || v === 'TRUE' || v === 'true';
  if (t === 'date' || t === 'datetime') return (v instanceof Date) ? v : new Date(v);
  return String(v);
}
function DB_rowToObj_(table, row) {
  var cols = SCHEMA[table].cols, o = {};
  for (var i = 0; i < cols.length; i++) o[cols[i].n] = DB_readCell_(cols[i].t, row[i]);
  return o;
}
function DB_objToRow_(table, obj) {
  return SCHEMA[table].cols.map(function (c) { return DB_writeCell_(c.t, obj[c.n]); });
}

/* ============================ ID counters ============================ */

/** Reserve `count` sequential IDs for an entity in ONE _meta write; returns the id strings. */
function DB_reserveIds_(entity, count) {
  return DB_withLock_(function () {
    var sh = DB_sheet_('_meta');
    var data = sh.getDataRange().getValues();   // [Entity, Prefix, NextNumber, Padding]
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === entity) {
        var prefix = String(data[i][1]), start = Number(data[i][2]), pad = Number(data[i][3]);
        var ids = [];
        for (var k = 0; k < count; k++) ids.push(prefix + '-' + DB_pad_(start + k, pad));
        sh.getRange(i + 1, 3).setValue(start + count);
        DB_invalidate_('_meta');
        return ids;
      }
    }
    throw new Error('No _meta counter for entity "' + entity + '".');
  });
}
function nextId(entity) { return DB_reserveIds_(entity, 1)[0]; }

/* ============================ validation ============================ */

function DB_assertFk_(table, obj) {
  SCHEMA[table].cols.forEach(function (c) {
    var v = obj[c.n];
    if (c.fk) {
      if (v === '' || v == null) { if (!c.optional) throw new Error(table + '.' + c.n + ' (FK) is required.'); return; }
      if (!getById(c.fk, v)) throw new Error(table + '.' + c.n + '="' + v + '" has no matching ' + c.fk + ' row.');
    }
    if (c.fkDoc) {   // LineItems.DocID -> Estimates OR Invoices depending on DocType
      var target = obj.DocType === 'Invoice' ? 'Invoices' : 'Estimates';
      if (!getById(target, v)) throw new Error('LineItems.DocID="' + v + '" has no matching ' + target + ' row.');
    }
    if (c.t === 'enum' && v !== '' && v != null && c.values.indexOf(String(v)) < 0)
      throw new Error(table + '.' + c.n + '="' + v + '" is not one of ' + c.values.join('|') + '.');
  });
}

/* ============================ writes ============================ */

function DB_prepareInsert_(table, input, id, now) {
  var cols = SCHEMA[table].cols, rec = {};
  cols.forEach(function (c) {
    if (c.t === 'id' && !c.fk && !c.fkDoc && c.n === cols[0].n) { rec[c.n] = id; return; }  // PK
    if (c.auto) { rec[c.n] = now; return; }
    if (input[c.n] !== undefined && input[c.n] !== null && input[c.n] !== '') { rec[c.n] = input[c.n]; return; }
    if (c.snapshot) {                                    // snapshot Description/Rate/ServiceName from a Service
      var src = getById('Services', input[c.snapshot.from]);
      rec[c.n] = src ? src[c.snapshot.field] : (c.default !== undefined ? c.default : '');
      return;
    }
    rec[c.n] = (c.default !== undefined) ? c.default : '';
  });
  if (table === 'LineItems') rec.LineTotal = (Number(rec.Qty) || 0) * (Number(rec.Rate) || 0);
  DB_assertFk_(table, rec);
  return rec;
}

/** Insert many rows in one setValues; reserves all IDs in one _meta bump. Returns inserted objects. */
function insertMany(table, inputs) {
  if (!inputs.length) return [];
  return DB_withLock_(function () {
    var ids = DB_reserveIds_(SCHEMA[table].entity, inputs.length);
    var now = new Date();
    var recs = inputs.map(function (inp, i) { return DB_prepareInsert_(table, inp, ids[i], now); });
    var rows = recs.map(function (r) { return DB_objToRow_(table, r); });
    var sh = DB_sheet_(table);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    DB_invalidate_(table);
    return recs;
  });
}
function insert(table, input) { return insertMany(table, [input])[0]; }

/** Patch a row by ID (whole-row batch write). Revalidates FK/enum; refreshes UpdatedAt + LineTotal. */
function update(table, id, patch) {
  return DB_withLock_(function () {
    var vals = DB_values_(table), pk = SCHEMA[table].cols[0].n;
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0]) === String(id)) {
        var obj = DB_rowToObj_(table, vals[i]);
        Object.keys(patch).forEach(function (k) { obj[k] = patch[k]; });
        obj.UpdatedAt = new Date();
        if (table === 'LineItems') obj.LineTotal = (Number(obj.Qty) || 0) * (Number(obj.Rate) || 0);
        DB_assertFk_(table, obj);
        var row = DB_objToRow_(table, obj);
        DB_sheet_(table).getRange(i + 1, 1, 1, row.length).setValues([row]);
        DB_invalidate_(table);
        return obj;
      }
    }
    throw new Error(table + ' has no row with ' + pk + '="' + id + '".');
  });
}
function softDelete(table, id) { return update(table, id, { Archived: true }); }

/* ============================ reads ============================ */

function getById(table, id) {
  var vals = DB_values_(table);
  for (var i = 1; i < vals.length; i++) if (String(vals[i][0]) === String(id)) return DB_rowToObj_(table, vals[i]);
  return null;
}
/** All live (non-archived) rows as objects. */
function getAll(table) {
  var vals = DB_values_(table), out = [];
  for (var i = 1; i < vals.length; i++) {
    if (vals[i][0] === '' || vals[i][0] == null) continue;
    var o = DB_rowToObj_(table, vals[i]);
    if (!o.Archived) out.push(o);
  }
  return out;
}
/** Filter live rows by a criteria object ({field:value,...}) or a predicate function. */
function query(table, criteria) {
  var fn = (typeof criteria === 'function') ? criteria : function (o) {
    return Object.keys(criteria).every(function (k) { return String(o[k]) === String(criteria[k]); });
  };
  return getAll(table).filter(fn);
}

/* ============================ Script-owned caches ============================ */

/** Estimates.Total / Invoices.Total = sum of live LineItem.LineTotal for that doc. */
function recalcDocTotal(docType, docId) {
  var items = query('LineItems', function (li) { return li.DocType === docType && String(li.DocID) === String(docId); });
  var total = items.reduce(function (s, li) { return s + (Number(li.LineTotal) || 0); }, 0);
  update(docType === 'Invoice' ? 'Invoices' : 'Estimates', docId, { Total: total });
  return total;
}
/** Clients.LifetimeSpent = sum of Total across that client's PAID, live invoices. */
function recalcClientLifetime(clientId) {
  var paid = query('Invoices', function (iv) { return String(iv.ClientID) === String(clientId) && iv.Status === 'Paid'; });
  var total = paid.reduce(function (s, iv) { return s + (Number(iv.Total) || 0); }, 0);
  update('Clients', clientId, { LifetimeSpent: total });
  return total;
}

/* ============================ Settings (key/value) ============================ */

function settingGet(key) {
  var vals = DB_values_('Settings');
  for (var i = 1; i < vals.length; i++) if (String(vals[i][0]) === key) return vals[i][1];
  return '';
}
function settingSet(key, value) {
  return DB_withLock_(function () {
    var sh = DB_sheet_('Settings'), vals = sh.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (String(vals[i][0]) === key) { sh.getRange(i + 1, 2).setValue(value); DB_invalidate_('Settings'); return; }
    }
    sh.appendRow([key, value]); DB_invalidate_('Settings');
  });
}
function settingsAll() {
  var vals = DB_values_('Settings'), o = {};
  for (var i = 1; i < vals.length; i++) if (vals[i][0] !== '') o[String(vals[i][0])] = vals[i][1];
  return o;
}
