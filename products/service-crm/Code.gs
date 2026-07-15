/*************************************************************************
 *  SERVICE PRO CRM  —  Google Sheets + Apps Script CRM
 *  For service businesses: cleaners, landscapers, detailers, contractors,
 *  trainers, handymen, HVAC, pool techs, movers, etc.
 *
 *  HOW IT WORKS (for the buyer):
 *    1. Open the Google Sheet you received.
 *    2. Extensions ▸ Apps Script  →  this code is already here.
 *    3. Back in the sheet, reload. A "⚡ CRM" menu appears.
 *    4. Click  ⚡ CRM ▸ Set up / rebuild CRM.  Done.
 *
 *  Everything runs inside the buyer's OWN Google account.
 *  No servers, no subscriptions, no data leaves their Drive.
 *************************************************************************/

/** Tab names — emoji make them easy to spot. */
const TABS = {
  DASH:     '📊 Dashboard',
  LEADS:    '🎯 Leads',
  JOBS:     '🗓️ Jobs',
  CLIENTS:  '👥 Clients',
  INVOICES: '💵 Invoices',
  SETTINGS: '⚙️ Settings',
};

const LEAD_STATUSES = ['New', 'Contacted', 'Quoted', 'Won', 'Lost'];
const JOB_STATUSES  = ['Scheduled', 'In Progress', 'Done', 'Cancelled'];
const INV_STATUSES  = ['Draft', 'Sent', 'Paid', 'Overdue'];

/** Brand colors — swap these to re-skin the whole CRM for a client. */
const BRAND = {
  header:    '#1a1c1f',  // near-black header row
  headerTxt: '#ffffff',
  accent:    '#b8823a',  // amber
  good:      '#3f7d55',
  warn:      '#c0492b',
  soft:      '#f3f0ea',
  line:      '#d9d3c7',
};

/* ============================ MENU ================================= */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚡ CRM')
    .addItem('▶  Set up / rebuild CRM', 'buildCRM')
    .addSeparator()
    .addItem('➕  Add a lead', 'addLead')
    .addItem('✅  Convert selected lead → client', 'convertLeadToClient')
    .addSeparator()
    .addItem('📧  Email me today\'s follow-ups', 'sendFollowUpDigest')
    .addItem('⏰  Turn on daily 8am follow-up email', 'installDailyTrigger')
    .addSeparator()
    .addItem('ℹ️  About / help', 'showAbout')
    .addToUi();
}

/* ========================= BUILD / SETUP =========================== */

function buildCRM() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  buildLeads_(ss);
  buildJobs_(ss);
  buildClients_(ss);
  buildInvoices_(ss);
  buildDashboard_(ss);
  buildSettings_(ss);

  // Order the tabs and land on the dashboard.
  reorderTabs_(ss, [TABS.DASH, TABS.LEADS, TABS.JOBS, TABS.CLIENTS, TABS.INVOICES, TABS.SETTINGS]);
  ss.setActiveSheet(ss.getSheetByName(TABS.DASH));

  SpreadsheetApp.getUi().alert(
    '⚡ Service Pro CRM is ready.',
    'Six tabs are set up. Start by adding leads in the 🎯 Leads tab (or use ⚡ CRM ▸ Add a lead). ' +
    'The 📊 Dashboard updates automatically.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function getOrCreate_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function header_(sh, headers) {
  sh.clear();
  sh.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground(BRAND.header)
    .setFontColor(BRAND.headerTxt)
    .setFontWeight('bold')
    .setVerticalAlignment('middle');
  sh.setFrozenRows(1);
  sh.getRange(1, 1, sh.getMaxRows(), headers.length).setFontFamily('Arial');
}

function dropdown_(sh, col, values, firstRow, numRows) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sh.getRange(firstRow, col, numRows, 1).setDataValidation(rule);
}

/* ----- Leads ----- */
function buildLeads_(ss) {
  const sh = getOrCreate_(ss, TABS.LEADS);
  const headers = ['Date Added', 'Name', 'Phone', 'Email', 'Source', 'Service',
                   'Est. Value', 'Status', 'Next Follow-up', 'Notes'];
  header_(sh, headers);
  sh.setColumnWidths(1, headers.length, 130);
  sh.setColumnWidth(2, 160); sh.setColumnWidth(10, 260);

  const rows = 500;
  dropdown_(sh, 8, LEAD_STATUSES, 2, rows);            // Status
  dropdown_(sh, 5, ['Referral', 'Google', 'Facebook', 'Instagram', 'Flyer', 'Repeat', 'Other'], 2, rows);
  sh.getRange(2, 1, rows, 1).setNumberFormat('m/d/yyyy');   // Date Added
  sh.getRange(2, 9, rows, 1).setNumberFormat('m/d/yyyy');   // Next Follow-up
  sh.getRange(2, 7, rows, 1).setNumberFormat('$#,##0');     // Est. Value

  // Color-code status.
  const statusRange = sh.getRange(2, 8, rows, 1);
  const rules = [];
  const colorRule = (txt, bg) => SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(txt).setBackground(bg).setRanges([statusRange]).build();
  rules.push(colorRule('New', '#e8eef7'));
  rules.push(colorRule('Contacted', '#fff3d6'));
  rules.push(colorRule('Quoted', '#ffe4c4'));
  rules.push(colorRule('Won', '#d8efdf'));
  rules.push(colorRule('Lost', '#f5d9d3'));

  // Highlight overdue follow-ups (date in the past, not Won/Lost).
  const fuRange = sh.getRange(2, 9, rows, 1);
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($I2<>"",$I2<TODAY(),$H2<>"Won",$H2<>"Lost")')
    .setBackground('#f5d9d3').setFontColor(BRAND.warn)
    .setRanges([fuRange]).build());
  sh.setConditionalFormatRules(rules);

  sh.getRange(2, 1).setValue(new Date());
  sh.getRange(2, 8).setValue('New');
}

/* ----- Jobs ----- */
function buildJobs_(ss) {
  const sh = getOrCreate_(ss, TABS.JOBS);
  const headers = ['Job Date', 'Client', 'Service', 'Scheduled Time', 'Status', 'Price', 'Paid?', 'Notes'];
  header_(sh, headers);
  sh.setColumnWidths(1, headers.length, 130);
  sh.setColumnWidth(2, 160); sh.setColumnWidth(8, 260);

  const rows = 500;
  dropdown_(sh, 5, JOB_STATUSES, 2, rows);
  dropdown_(sh, 7, ['Yes', 'No'], 2, rows);
  sh.getRange(2, 1, rows, 1).setNumberFormat('m/d/yyyy');
  sh.getRange(2, 6, rows, 1).setNumberFormat('$#,##0.00');

  const statusRange = sh.getRange(2, 5, rows, 1);
  const rules = [];
  const c = (t, bg) => SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(t).setBackground(bg).setRanges([statusRange]).build();
  rules.push(c('Scheduled', '#e8eef7'));
  rules.push(c('In Progress', '#fff3d6'));
  rules.push(c('Done', '#d8efdf'));
  rules.push(c('Cancelled', '#f5d9d3'));
  sh.setConditionalFormatRules(rules);
}

/* ----- Clients ----- */
function buildClients_(ss) {
  const sh = getOrCreate_(ss, TABS.CLIENTS);
  const headers = ['Name', 'Phone', 'Email', 'Address', 'First Job', 'Total Spent', 'Notes'];
  header_(sh, headers);
  sh.setColumnWidths(1, headers.length, 140);
  sh.setColumnWidth(4, 220); sh.setColumnWidth(7, 260);

  const rows = 500;
  sh.getRange(2, 5, rows, 1).setNumberFormat('m/d/yyyy');
  // Total Spent auto-sums paid jobs for this client.
  const totalFormula = '=IF($A2="","",SUMIFS(\'' + TABS.JOBS + '\'!F:F,\'' +
                       TABS.JOBS + '\'!B:B,$A2,\'' + TABS.JOBS + '\'!G:G,"Yes"))';
  const arr = [];
  for (let i = 0; i < rows; i++) arr.push([totalFormula.replace(/\$A2/g, '$A' + (i + 2))]);
  sh.getRange(2, 6, rows, 1).setFormulas(arr);
  sh.getRange(2, 6, rows, 1).setNumberFormat('$#,##0.00');
}

/* ----- Invoices ----- */
function buildInvoices_(ss) {
  const sh = getOrCreate_(ss, TABS.INVOICES);
  const headers = ['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Amount', 'Status'];
  header_(sh, headers);
  sh.setColumnWidths(1, headers.length, 140);

  const rows = 500;
  dropdown_(sh, 6, INV_STATUSES, 2, rows);
  sh.getRange(2, 3, rows, 2).setNumberFormat('m/d/yyyy');
  sh.getRange(2, 5, rows, 1).setNumberFormat('$#,##0.00');

  const statusRange = sh.getRange(2, 6, rows, 1);
  const rules = [];
  const c = (t, bg, fc) => SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo(t).setBackground(bg).setFontColor(fc || '#1a1c1f').setRanges([statusRange]).build();
  rules.push(c('Draft', '#eeeeee'));
  rules.push(c('Sent', '#fff3d6'));
  rules.push(c('Paid', '#d8efdf'));
  rules.push(c('Overdue', '#f5d9d3', BRAND.warn));
  sh.setConditionalFormatRules(rules);
}

/* ----- Dashboard ----- */
function buildDashboard_(ss) {
  const sh = getOrCreate_(ss, TABS.DASH);
  sh.clear();
  sh.setHiddenGridlines(true);
  const L = "'" + TABS.LEADS + "'";
  const J = "'" + TABS.JOBS + "'";
  const I = "'" + TABS.INVOICES + "'";

  // Title
  sh.getRange('B2').setValue('⚡ SERVICE PRO CRM').setFontSize(20).setFontWeight('bold').setFontColor(BRAND.header);
  sh.getRange('B3').setValue('Your business at a glance — updates automatically.').setFontColor('#52565c');

  // KPI tiles: label row 5, value row 6.
  const tiles = [
    ['New leads (7 days)', '=COUNTIFS(' + L + '!A:A,">="&(TODAY()-7))'],
    ['Open pipeline value', '=SUMIFS(' + L + '!G:G,' + L + '!H:H,"<>Won",' + L + '!H:H,"<>Lost",' + L + '!H:H,"<>")'],
    ['Jobs this week', '=COUNTIFS(' + J + '!A:A,">="&(TODAY()-WEEKDAY(TODAY())+1),' + J + '!A:A,"<="&(TODAY()-WEEKDAY(TODAY())+7))'],
    ['Revenue this month', '=SUMIFS(' + I + '!E:E,' + I + '!F:F,"Paid",' + I + '!C:C,">="&EOMONTH(TODAY(),-1)+1)'],
  ];
  const cols = [2, 4, 6, 8]; // B, D, F, H
  tiles.forEach((t, idx) => {
    const c = cols[idx];
    sh.getRange(5, c).setValue(t[0]).setFontColor('#52565c').setFontWeight('bold').setFontSize(10);
    const v = sh.getRange(6, c).setFormula(t[1]).setFontSize(24).setFontWeight('bold').setFontColor(BRAND.accent);
    if (idx === 1 || idx === 3) v.setNumberFormat('$#,##0');
    sh.getRange(5, c, 2, 1).setBackground(BRAND.soft);
    sh.setColumnWidth(c, 150);
    if (c + 1 <= 9) sh.setColumnWidth(c + 1, 24);
  });

  // Won rate + lifetime revenue
  sh.getRange('B9').setValue('Win rate').setFontWeight('bold').setFontColor('#52565c');
  sh.getRange('B10').setFormula('=IFERROR(COUNTIF(' + L + '!H:H,"Won")/(COUNTIF(' + L + '!H:H,"Won")+COUNTIF(' + L + '!H:H,"Lost")),0)')
    .setNumberFormat('0%').setFontSize(18).setFontWeight('bold').setFontColor(BRAND.good);
  sh.getRange('D9').setValue('Lifetime revenue').setFontWeight('bold').setFontColor('#52565c');
  sh.getRange('D10').setFormula('=SUMIFS(' + I + '!E:E,' + I + '!F:F,"Paid")')
    .setNumberFormat('$#,##0').setFontSize(18).setFontWeight('bold').setFontColor(BRAND.good);

  // Follow-ups due — live query
  sh.getRange('B12').setValue('🔔 Follow-ups due (today or overdue)').setFontWeight('bold').setFontSize(12).setFontColor(BRAND.header);
  sh.getRange('B13').setFormula(
    '=IFERROR(QUERY(' + L + '!A2:J,"select B, C, I, H where I is not null and I <= date \'"&TEXT(TODAY(),"yyyy-mm-dd")&"\' and H <> \'Won\' and H <> \'Lost\' order by I asc label B \'Name\', C \'Phone\', I \'Follow-up\', H \'Status\'",0),"Nothing due — you\'re all caught up. 🎉")'
  );
  sh.getRange('B12:E12').setBackground(BRAND.soft);
  sh.setColumnWidth(1, 24);
}

/* ----- Settings ----- */
function buildSettings_(ss) {
  const sh = getOrCreate_(ss, TABS.SETTINGS);
  sh.clear();
  sh.getRange('B2').setValue('⚙️ Settings').setFontSize(16).setFontWeight('bold');
  const rowsData = [
    ['Business name', 'Your Business LLC'],
    ['Owner email (for follow-up digest)', Session.getActiveUser().getEmail() || 'you@example.com'],
    ['Currency symbol', '$'],
    ['Default follow-up (days after new lead)', 2],
  ];
  sh.getRange(4, 2, rowsData.length, 2).setValues(rowsData);
  sh.getRange(4, 2, rowsData.length, 1).setFontWeight('bold').setFontColor('#52565c');
  sh.setColumnWidth(2, 300); sh.setColumnWidth(3, 240);
  sh.getRange(4, 3, rowsData.length, 1).setBackground('#ffffff').setBorder(true, true, true, true, false, false, BRAND.line, null);
  sh.getRange('B10').setValue('Tip: change these, then re-run ⚡ CRM ▸ Set up / rebuild CRM if needed.').setFontColor('#52565c').setFontStyle('italic');
}

function reorderTabs_(ss, order) {
  order.forEach((name, idx) => {
    const sh = ss.getSheetByName(name);
    if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(idx + 1); }
  });
}

/* ========================= ACTIONS ================================= */

function addLead() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(TABS.LEADS);
  if (!sh) { ui.alert('Run ⚡ CRM ▸ Set up / rebuild CRM first.'); return; }

  const name = promptOrCancel_(ui, 'New lead — name?');
  if (name === null) return;
  const phone = promptOrCancel_(ui, 'Phone? (optional, leave blank to skip)') || '';
  const service = promptOrCancel_(ui, 'What service do they want? (optional)') || '';
  const valueStr = promptOrCancel_(ui, 'Estimated job value in dollars? (optional)') || '';
  const value = valueStr ? Number(valueStr.replace(/[^0-9.]/g, '')) : '';

  const followDays = Number(getSetting_(ss, 'Default follow-up (days after new lead)')) || 2;
  const follow = new Date(); follow.setDate(follow.getDate() + followDays);

  sh.appendRow([new Date(), name, phone, '', 'Other', service, value, 'New', follow, '']);
  ss.setActiveSheet(sh);
  ui.alert('✅ Added "' + name + '". Follow-up set for ' + Utilities.formatDate(follow, Session.getScriptTimeZone(), 'M/d/yyyy') + '.');
}

function convertLeadToClient() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leads = ss.getSheetByName(TABS.LEADS);
  const clients = ss.getSheetByName(TABS.CLIENTS);
  if (!leads || !clients) { ui.alert('Run setup first.'); return; }
  if (ss.getActiveSheet().getName() !== TABS.LEADS) {
    ui.alert('Go to the 🎯 Leads tab and click the row of the lead you won, then run this again.');
    return;
  }
  const row = ss.getActiveRange().getRow();
  if (row < 2) { ui.alert('Click a lead row first.'); return; }
  const v = leads.getRange(row, 1, 1, 10).getValues()[0];
  // v: [date,name,phone,email,source,service,value,status,follow,notes]
  clients.appendRow([v[1], v[2], v[3], '', new Date(), '', v[9]]);
  leads.getRange(row, 8).setValue('Won');
  leads.getRange(row, 9).setValue('');
  ui.alert('🎉 "' + v[1] + '" is now a client and the lead is marked Won.');
}

/* ===================== FOLLOW-UP DIGEST ============================ */

function sendFollowUpDigest() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(TABS.LEADS);
  if (!sh) return;
  const email = getSetting_(ss, 'Owner email (for follow-up digest)') || Session.getActiveUser().getEmail();
  const biz = getSetting_(ss, 'Business name') || 'Your Business';
  const data = sh.getDataRange().getValues();
  const tz = Session.getScriptTimeZone();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const due = [];
  for (let i = 1; i < data.length; i++) {
    const [ , name, phone, , , service, , status, follow] = data[i];
    if (!name) continue;
    if (status === 'Won' || status === 'Lost') continue;
    if (!(follow instanceof Date)) continue;
    const f = new Date(follow); f.setHours(0, 0, 0, 0);
    if (f <= today) due.push({ name, phone, service, status, follow: f });
  }
  due.sort((a, b) => a.follow - b.follow);

  if (!email) return;
  if (!due.length) {
    MailApp.sendEmail(email, '⚡ ' + biz + ' — no follow-ups due today 🎉',
      'Nothing on the follow-up list today. Nice work staying on top of it.');
    return;
  }
  let html = '<div style="font-family:Arial,sans-serif;max-width:560px">' +
    '<h2 style="color:#1a1c1f">🔔 ' + due.length + ' follow-up' + (due.length > 1 ? 's' : '') + ' due — ' + biz + '</h2>' +
    '<table style="border-collapse:collapse;width:100%">' +
    '<tr style="background:#1a1c1f;color:#fff"><th style="padding:8px;text-align:left">Name</th>' +
    '<th style="padding:8px;text-align:left">Phone</th><th style="padding:8px;text-align:left">Service</th>' +
    '<th style="padding:8px;text-align:left">Was due</th><th style="padding:8px;text-align:left">Status</th></tr>';
  due.forEach((d, i) => {
    const bg = i % 2 ? '#f3f0ea' : '#ffffff';
    html += '<tr style="background:' + bg + '"><td style="padding:8px">' + d.name + '</td>' +
      '<td style="padding:8px">' + (d.phone || '—') + '</td><td style="padding:8px">' + (d.service || '—') + '</td>' +
      '<td style="padding:8px">' + Utilities.formatDate(d.follow, tz, 'M/d') + '</td>' +
      '<td style="padding:8px">' + d.status + '</td></tr>';
  });
  html += '</table><p style="color:#52565c;font-size:13px">Open your CRM to update these after you reach out.</p></div>';
  MailApp.sendEmail({ to: email, subject: '🔔 ' + due.length + ' follow-up(s) due — ' + biz, htmlBody: html });
}

function installDailyTrigger() {
  const ui = SpreadsheetApp.getUi();
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'sendFollowUpDigest') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendFollowUpDigest').timeBased().atHour(8).everyDays(1).create();
  ui.alert('⏰ Done. You\'ll get a follow-up email every morning around 8am. (You may be asked to authorize email sending once.)');
}

/* ========================= HELPERS ================================ */

function promptOrCancel_(ui, msg) {
  const r = ui.prompt(msg, ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return null;
  return r.getResponseText().trim();
}

function getSetting_(ss, key) {
  const sh = ss.getSheetByName(TABS.SETTINGS);
  if (!sh) return '';
  const data = sh.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][1]).trim() === key) return data[i][2];
  }
  return '';
}

function showAbout() {
  SpreadsheetApp.getUi().alert(
    '⚡ Service Pro CRM',
    'A complete CRM that lives in your own Google account — no subscriptions, no data leaving your Drive.\n\n' +
    'Tabs: Dashboard, Leads, Jobs, Clients, Invoices, Settings.\n\n' +
    'Menu actions:\n' +
    '• Add a lead\n• Convert a won lead to a client\n• Email yourself today\'s follow-ups\n• Turn on a daily 8am follow-up email\n\n' +
    'Need setup help or customization? Reply to your purchase receipt.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
