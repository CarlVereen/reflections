/*************************************************************************
 *  SERVICE PRO CRM  —  Google Sheets + Apps Script CRM   (v2)
 *  A complete customer, job, invoice & review manager for service
 *  businesses. Runs entirely inside the buyer's OWN Google account —
 *  no servers, no subscriptions, no data leaves their Drive.
 *
 *  WHAT MAKES v2 "awesome":
 *    • ⚡ Quick Actions panel (real branded sidebar — feels like an app)
 *    • 🧾 One-click PDF invoices, emailed to the client
 *    • 🔔 Auto follow-up emails + ⭐ auto Google-review requests
 *    • 📅 Appointment reminders emailed to clients the day before
 *    • 🚩 Auto-flag overdue invoices
 *    • 📈 Revenue-trend chart on the dashboard
 *    • 🚀 Guided "Start Here" onboarding tab
 *
 *  FIRST-TIME SETUP (buyer):
 *    Extensions ▸ Apps Script → paste Code.gs + Sidebar.html → Save.
 *    Reload the sheet → ⚡ CRM ▸ Set up / rebuild CRM.
 *************************************************************************/

const TABS = {
  START:    '🚀 Start Here',
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

/** Brand — change these to re-skin the entire CRM in seconds. */
const BRAND = {
  header:    '#1a1c1f',
  headerTxt: '#ffffff',
  accent:    '#b8823a',
  accent2:   '#8f5f22',
  good:      '#3f7d55',
  warn:      '#c0492b',
  soft:      '#f3f0ea',
  line:      '#d9d3c7',
  blue:      '#2a4d80',
};

/* ============================== MENU ============================== */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚡ CRM')
    .addItem('⚡  Open Quick Actions panel', 'showSidebar')
    .addSeparator()
    .addItem('▶  Set up / rebuild CRM', 'buildCRM')
    .addSubMenu(SpreadsheetApp.getUi().createMenu('Add & convert')
      .addItem('➕  Add a lead', 'addLead')
      .addItem('📅  Schedule a job from selected lead', 'scheduleJobFromLead')
      .addItem('✅  Convert selected lead → client', 'convertLeadToClient'))
    .addSubMenu(SpreadsheetApp.getUi().createMenu('Invoices')
      .addItem('🧾  Create & email invoice (selected row)', 'createInvoicePdf')
      .addItem('🚩  Flag overdue invoices now', 'markOverdueInvoices'))
    .addSubMenu(SpreadsheetApp.getUi().createMenu('Automations')
      .addItem('📧  Email me today\'s follow-ups', 'sendFollowUpDigest')
      .addItem('⭐  Send review requests for finished jobs', 'sendReviewRequests')
      .addItem('📅  Send tomorrow\'s appointment reminders', 'remindUpcomingJobs')
      .addSeparator()
      .addItem('⏰  Turn ON daily automations', 'installDailyTriggers')
      .addItem('⏹️  Turn OFF daily automations', 'removeDailyTriggers'))
    .addSeparator()
    .addItem('ℹ️  About / help', 'showAbout')
    .addToUi();
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('⚡ Quick Actions');
  SpreadsheetApp.getUi().showSidebar(html);
}

/* ============================ BUILD ============================== */

function buildCRM() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  buildLeads_(ss);
  buildJobs_(ss);
  buildClients_(ss);
  buildInvoices_(ss);
  buildDashboard_(ss);
  buildSettings_(ss);
  buildStartHere_(ss);
  reorderTabs_(ss, [TABS.START, TABS.DASH, TABS.LEADS, TABS.JOBS, TABS.CLIENTS, TABS.INVOICES, TABS.SETTINGS]);
  ss.setActiveSheet(ss.getSheetByName(TABS.START));
  SpreadsheetApp.getUi().alert('⚡ Service Pro CRM is ready!',
    'Open the 🚀 Start Here tab for a 3-minute setup, then click ⚡ CRM ▸ Open Quick Actions panel to run your day from one place.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function getOrCreate_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function header_(sh, headers) {
  sh.clear();
  const existingCharts = sh.getCharts();
  existingCharts.forEach(c => sh.removeChart(c));
  sh.getRange(1, 1, 1, headers.length)
    .setValues([headers]).setBackground(BRAND.header).setFontColor(BRAND.headerTxt)
    .setFontWeight('bold').setVerticalAlignment('middle').setWrap(true);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, sh.getMaxRows(), headers.length).setFontFamily('Arial');
}

function dropdown_(sh, col, values, firstRow, numRows) {
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  sh.getRange(firstRow, col, numRows, 1).setDataValidation(rule);
}

function buildLeads_(ss) {
  const sh = getOrCreate_(ss, TABS.LEADS);
  const headers = ['Date Added', 'Name', 'Phone', 'Email', 'Source', 'Service', 'Est. Value', 'Status', 'Next Follow-up', 'Notes'];
  header_(sh, headers);
  sh.setColumnWidths(1, headers.length, 130);
  sh.setColumnWidth(2, 160); sh.setColumnWidth(10, 260);
  const rows = 500;
  dropdown_(sh, 8, LEAD_STATUSES, 2, rows);
  dropdown_(sh, 5, ['Referral', 'Google', 'Facebook', 'Instagram', 'Flyer', 'Repeat', 'Other'], 2, rows);
  sh.getRange(2, 1, rows, 1).setNumberFormat('m/d/yyyy');
  sh.getRange(2, 9, rows, 1).setNumberFormat('m/d/yyyy');
  sh.getRange(2, 7, rows, 1).setNumberFormat('$#,##0');
  const statusRange = sh.getRange(2, 8, rows, 1);
  const rules = [];
  const c = (t, bg) => SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(t).setBackground(bg).setRanges([statusRange]).build();
  rules.push(c('New', '#e8eef7'), c('Contacted', '#fff3d6'), c('Quoted', '#ffe4c4'), c('Won', '#d8efdf'), c('Lost', '#f5d9d3'));
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($I2<>"",$I2<TODAY(),$H2<>"Won",$H2<>"Lost")')
    .setBackground('#f5d9d3').setFontColor(BRAND.warn).setRanges([sh.getRange(2, 9, rows, 1)]).build());
  sh.setConditionalFormatRules(rules);
  sh.getRange(2, 1).setValue(new Date());
  sh.getRange(2, 8).setValue('New');
}

function buildJobs_(ss) {
  const sh = getOrCreate_(ss, TABS.JOBS);
  const headers = ['Job Date', 'Client', 'Service', 'Scheduled Time', 'Status', 'Price', 'Paid?', 'Review Sent?', 'Reminder Sent?', 'Notes'];
  header_(sh, headers);
  sh.setColumnWidths(1, headers.length, 125);
  sh.setColumnWidth(2, 160); sh.setColumnWidth(10, 240);
  const rows = 500;
  dropdown_(sh, 5, JOB_STATUSES, 2, rows);
  dropdown_(sh, 7, ['Yes', 'No'], 2, rows);
  dropdown_(sh, 8, ['Yes', 'No'], 2, rows);
  dropdown_(sh, 9, ['Yes', 'No'], 2, rows);
  sh.getRange(2, 1, rows, 1).setNumberFormat('m/d/yyyy');
  sh.getRange(2, 6, rows, 1).setNumberFormat('$#,##0.00');
  const statusRange = sh.getRange(2, 5, rows, 1);
  const rules = [];
  const c = (t, bg) => SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(t).setBackground(bg).setRanges([statusRange]).build();
  rules.push(c('Scheduled', '#e8eef7'), c('In Progress', '#fff3d6'), c('Done', '#d8efdf'), c('Cancelled', '#f5d9d3'));
  sh.setConditionalFormatRules(rules);
}

function buildClients_(ss) {
  const sh = getOrCreate_(ss, TABS.CLIENTS);
  const headers = ['Name', 'Phone', 'Email', 'Address', 'First Job', 'Total Spent', 'Notes'];
  header_(sh, headers);
  sh.setColumnWidths(1, headers.length, 140);
  sh.setColumnWidth(4, 220); sh.setColumnWidth(7, 260);
  const rows = 500;
  sh.getRange(2, 5, rows, 1).setNumberFormat('m/d/yyyy');
  const arr = [];
  for (let i = 0; i < rows; i++) {
    const r = i + 2;
    arr.push(['=IF($A' + r + '="","",SUMIFS(\'' + TABS.JOBS + '\'!F:F,\'' + TABS.JOBS + '\'!B:B,$A' + r + ',\'' + TABS.JOBS + '\'!G:G,"Yes"))']);
  }
  sh.getRange(2, 6, rows, 1).setFormulas(arr).setNumberFormat('$#,##0.00');
}

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
  const c = (t, bg, fc) => SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(t).setBackground(bg).setFontColor(fc || BRAND.header).setRanges([statusRange]).build();
  rules.push(c('Draft', '#eeeeee'), c('Sent', '#fff3d6'), c('Paid', '#d8efdf'), c('Overdue', '#f5d9d3', BRAND.warn));
  sh.setConditionalFormatRules(rules);
}

function buildDashboard_(ss) {
  const sh = getOrCreate_(ss, TABS.DASH);
  sh.clear();
  sh.getCharts().forEach(ch => sh.removeChart(ch));
  sh.setHiddenGridlines(true);
  const L = "'" + TABS.LEADS + "'", J = "'" + TABS.JOBS + "'", I = "'" + TABS.INVOICES + "'";
  sh.getRange('B2').setValue('⚡ SERVICE PRO CRM').setFontSize(20).setFontWeight('bold').setFontColor(BRAND.header);
  sh.getRange('B3').setValue('Your business at a glance — updates automatically.').setFontColor('#52565c');

  const tiles = [
    ['New leads (7 days)', '=COUNTIFS(' + L + '!A:A,">="&(TODAY()-7))'],
    ['Open pipeline value', '=SUMIFS(' + L + '!G:G,' + L + '!H:H,"<>Won",' + L + '!H:H,"<>Lost",' + L + '!H:H,"<>")'],
    ['Jobs this week', '=COUNTIFS(' + J + '!A:A,">="&(TODAY()-WEEKDAY(TODAY())+1),' + J + '!A:A,"<="&(TODAY()-WEEKDAY(TODAY())+7))'],
    ['Revenue this month', '=SUMIFS(' + I + '!E:E,' + I + '!F:F,"Paid",' + I + '!C:C,">="&EOMONTH(TODAY(),-1)+1)'],
  ];
  const cols = [2, 4, 6, 8];
  tiles.forEach((t, idx) => {
    const cc = cols[idx];
    sh.getRange(5, cc).setValue(t[0]).setFontColor('#52565c').setFontWeight('bold').setFontSize(10);
    const v = sh.getRange(6, cc).setFormula(t[1]).setFontSize(24).setFontWeight('bold').setFontColor(BRAND.accent);
    if (idx === 1 || idx === 3) v.setNumberFormat('$#,##0');
    sh.getRange(5, cc, 2, 1).setBackground(BRAND.soft);
    sh.setColumnWidth(cc, 150);
    if (cc + 1 <= 9) sh.setColumnWidth(cc + 1, 24);
  });

  sh.getRange('B9').setValue('Win rate').setFontWeight('bold').setFontColor('#52565c');
  sh.getRange('B10').setFormula('=IFERROR(COUNTIF(' + L + '!H:H,"Won")/(COUNTIF(' + L + '!H:H,"Won")+COUNTIF(' + L + '!H:H,"Lost")),0)')
    .setNumberFormat('0%').setFontSize(18).setFontWeight('bold').setFontColor(BRAND.good);
  sh.getRange('D9').setValue('Lifetime revenue').setFontWeight('bold').setFontColor('#52565c');
  sh.getRange('D10').setFormula('=SUMIFS(' + I + '!E:E,' + I + '!F:F,"Paid")')
    .setNumberFormat('$#,##0').setFontSize(18).setFontWeight('bold').setFontColor(BRAND.good);

  sh.getRange('B12').setValue('🔔 Follow-ups due (today or overdue)').setFontWeight('bold').setFontSize(12).setFontColor(BRAND.header);
  sh.getRange('B12:E12').setBackground(BRAND.soft);
  sh.getRange('B13').setFormula(
    '=IFERROR(QUERY(' + L + '!A2:J,"select B, C, I, H where I is not null and I <= date \'"&TEXT(TODAY(),"yyyy-mm-dd")&"\' and H <> \'Won\' and H <> \'Lost\' order by I asc label B \'Name\', C \'Phone\', I \'Follow-up\', H \'Status\'",0),"Nothing due — you\'re all caught up. 🎉")');

  // 6-month revenue helper (hidden columns R:S) + chart.
  const monthsFormula = [];
  for (let m = 5; m >= 0; m--) {
    const r = 2 + (5 - m);
    sh.getRange(r, 18).setFormula('=TEXT(EOMONTH(TODAY(),-' + m + '),"mmm")');           // R: month label
    sh.getRange(r, 19).setFormula('=SUMIFS(' + I + '!E:E,' + I + '!F:F,"Paid",' + I +
      '!C:C,">="&EOMONTH(TODAY(),-' + (m + 1) + ')+1,' + I + '!C:C,"<="&EOMONTH(TODAY(),-' + m + '))'); // S: revenue
  }
  sh.getRange(2, 19, 6, 1).setNumberFormat('$#,##0');
  sh.hideColumns(18, 2);
  const chart = sh.newChart()
    .asColumnChart()
    .addRange(sh.getRange(2, 18, 6, 2))
    .setNumHeaders(0)
    .setOption('title', 'Revenue — last 6 months')
    .setOption('legend', { position: 'none' })
    .setOption('colors', [BRAND.accent])
    .setOption('backgroundColor', '#ffffff')
    .setOption('width', 460).setOption('height', 260)
    .setPosition(9, 7, 0, 0)   // anchor near G9, clear of the follow-up query in B:E
    .build();
  sh.insertChart(chart);
  sh.setColumnWidth(1, 24);
}

function buildSettings_(ss) {
  const sh = getOrCreate_(ss, TABS.SETTINGS);
  sh.clear();
  sh.getRange('B2').setValue('⚙️ Settings').setFontSize(16).setFontWeight('bold');
  const rowsData = [
    ['Business name', 'Your Business LLC'],
    ['Owner email (for follow-up digest)', Session.getActiveUser().getEmail() || 'you@example.com'],
    ['Business phone', '(555) 000-0000'],
    ['Currency symbol', '$'],
    ['Default follow-up (days after new lead)', 2],
    ['Google review link (for review requests)', 'https://g.page/r/your-review-link/review'],
    ['Invoice payment instructions', 'Pay via Zelle to you@email.com, or cash/check on completion.'],
  ];
  sh.getRange(4, 2, rowsData.length, 2).setValues(rowsData);
  sh.getRange(4, 2, rowsData.length, 1).setFontWeight('bold').setFontColor('#52565c');
  sh.setColumnWidth(2, 320); sh.setColumnWidth(3, 320);
  sh.getRange(4, 3, rowsData.length, 1).setBackground('#ffffff').setBorder(true, true, true, true, false, false, BRAND.line, null);
  sh.getRange('B13').setValue('Tip: change any value above, then just keep working — the CRM reads these live.').setFontColor('#52565c').setFontStyle('italic');
}

function buildStartHere_(ss) {
  const sh = getOrCreate_(ss, TABS.START);
  sh.clear();
  sh.getCharts().forEach(ch => sh.removeChart(ch));
  sh.setHiddenGridlines(true);
  sh.setColumnWidth(1, 24); sh.setColumnWidth(2, 40); sh.setColumnWidth(3, 640);
  sh.getRange('B2').setValue('🚀 Welcome to Service Pro CRM').setFontSize(22).setFontWeight('bold').setFontColor(BRAND.header);
  sh.getRange('B3').setValue('Everything runs from one sheet. Follow these 5 steps once and you\'re live (about 3 minutes).').setFontColor('#52565c');
  const steps = [
    'Open ⚙️ Settings and fill in your business name, email, phone, Google review link, and payment instructions.',
    'Click  ⚡ CRM ▸ Open Quick Actions panel  — that\'s your daily command center.',
    'Add your first few leads (Quick Actions panel → Add Lead, or the 🎯 Leads tab).',
    'Log a job in the 🗓️ Jobs tab. When it\'s Done + Paid, use ⚡ CRM ▸ Send review requests.',
    'Turn on autopilot:  ⚡ CRM ▸ Automations ▸ Turn ON daily automations.  You\'ll get morning follow-ups, appointment reminders, and overdue-invoice flags automatically.',
  ];
  let r = 5;
  steps.forEach((s, i) => {
    sh.getRange(r, 2).insertCheckboxes();
    sh.getRange(r, 3).setValue((i + 1) + '.  ' + s).setWrap(true).setVerticalAlignment('top').setFontSize(11);
    sh.setRowHeight(r, 46);
    r += 1;
  });
  sh.getRange(r + 1, 3).setValue('Need help? ⚡ CRM ▸ About / help — or reply to your purchase receipt anytime.')
    .setFontColor(BRAND.accent2).setFontWeight('bold');
}

function reorderTabs_(ss, order) {
  order.forEach((name, idx) => {
    const sh = ss.getSheetByName(name);
    if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(idx + 1); }
  });
}

/* ============================ ACTIONS ============================= */

function addLead() {
  const ui = SpreadsheetApp.getUi();
  const name = promptOrCancel_(ui, 'New lead — name?');
  if (name === null) return;
  const phone = promptOrCancel_(ui, 'Phone? (optional)') || '';
  const service = promptOrCancel_(ui, 'Service they want? (optional)') || '';
  const valueStr = promptOrCancel_(ui, 'Estimated value in dollars? (optional)') || '';
  addLeadCore_(name, phone, '', service, valueStr);
}

/** Shared by menu + sidebar. Returns a status string. */
function addLeadCore_(name, phone, email, service, valueStr) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(TABS.LEADS);
  if (!sh) return 'Run setup first (⚡ CRM ▸ Set up / rebuild CRM).';
  if (!name || !String(name).trim()) return 'A name is required.';
  const value = valueStr ? Number(String(valueStr).replace(/[^0-9.]/g, '')) : '';
  const days = Number(getSetting_(ss, 'Default follow-up (days after new lead)')) || 2;
  const follow = new Date(); follow.setDate(follow.getDate() + days);
  sh.appendRow([new Date(), name, phone || '', email || '', 'Other', service || '', value, 'New', follow, '']);
  return '✅ Added "' + name + '" — follow-up set for ' + Utilities.formatDate(follow, Session.getScriptTimeZone(), 'M/d') + '.';
}

/** Called from the sidebar. */
function sidebarAddLead(form) {
  const msg = addLeadCore_(form.name, form.phone, form.email, form.service, form.value);
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TABS.LEADS));
  return msg;
}

/** Called from the sidebar — today's follow-up list as data. */
function sidebarFollowUps() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(TABS.LEADS);
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const [, name, phone, , , , , status, follow] = data[i];
    if (!name || status === 'Won' || status === 'Lost' || !(follow instanceof Date)) continue;
    const f = new Date(follow); f.setHours(0, 0, 0, 0);
    if (f <= today) out.push({ name: name, phone: phone || '', status: status,
      due: Utilities.formatDate(f, Session.getScriptTimeZone(), 'M/d') });
  }
  return out;
}

function scheduleJobFromLead() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leads = ss.getSheetByName(TABS.LEADS), jobs = ss.getSheetByName(TABS.JOBS);
  if (!leads || !jobs) { ui.alert('Run setup first.'); return; }
  if (ss.getActiveSheet().getName() !== TABS.LEADS) { ui.alert('Go to the 🎯 Leads tab, click the lead\'s row, then run this again.'); return; }
  const row = ss.getActiveRange().getRow();
  if (row < 2) { ui.alert('Click a lead row first.'); return; }
  const v = leads.getRange(row, 1, 1, 10).getValues()[0];
  const whenStr = promptOrCancel_(ui, 'Job date for "' + v[1] + '"? (e.g. 7/22)');
  if (whenStr === null) return;
  const when = new Date(whenStr); if (isNaN(when)) { ui.alert('Could not read that date.'); return; }
  jobs.appendRow([when, v[1], v[5], '', 'Scheduled', v[6] || '', 'No', 'No', 'No', 'From lead']);
  leads.getRange(row, 8).setValue('Won');
  ui.alert('📅 Job scheduled for ' + v[1] + ' on ' + Utilities.formatDate(when, Session.getScriptTimeZone(), 'M/d') + '. Lead marked Won.');
}

function convertLeadToClient() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const leads = ss.getSheetByName(TABS.LEADS), clients = ss.getSheetByName(TABS.CLIENTS);
  if (!leads || !clients) { ui.alert('Run setup first.'); return; }
  if (ss.getActiveSheet().getName() !== TABS.LEADS) { ui.alert('Go to the 🎯 Leads tab, click the won lead\'s row, then run this again.'); return; }
  const row = ss.getActiveRange().getRow();
  if (row < 2) { ui.alert('Click a lead row first.'); return; }
  const v = leads.getRange(row, 1, 1, 10).getValues()[0];
  clients.appendRow([v[1], v[2], v[3], '', new Date(), '', v[9]]);
  leads.getRange(row, 8).setValue('Won'); leads.getRange(row, 9).setValue('');
  ui.alert('🎉 "' + v[1] + '" is now a client.');
}

/* ========================= INVOICE PDF ============================ */

function createInvoicePdf() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inv = ss.getSheetByName(TABS.INVOICES), clients = ss.getSheetByName(TABS.CLIENTS);
  if (!inv) { ui.alert('Run setup first.'); return; }
  if (ss.getActiveSheet().getName() !== TABS.INVOICES) { ui.alert('Go to the 💵 Invoices tab, click the invoice row, then run this again.'); return; }
  const row = ss.getActiveRange().getRow();
  if (row < 2) { ui.alert('Click an invoice row first.'); return; }
  const v = inv.getRange(row, 1, 1, 6).getValues()[0]; // #, client, issue, due, amount, status
  if (!v[1] || !v[4]) { ui.alert('This invoice needs at least a Client and an Amount.'); return; }

  const biz = getSetting_(ss, 'Business name') || 'Your Business';
  const bizPhone = getSetting_(ss, 'Business phone') || '';
  const pay = getSetting_(ss, 'Invoice payment instructions') || '';
  const tz = Session.getScriptTimeZone();
  const fmtD = d => (d instanceof Date) ? Utilities.formatDate(d, tz, 'MMM d, yyyy') : '';
  const amount = Number(v[4]) || 0;

  // client email
  let email = '';
  if (clients) {
    const cData = clients.getDataRange().getValues();
    for (let i = 1; i < cData.length; i++) if (String(cData[i][0]).trim().toLowerCase() === String(v[1]).trim().toLowerCase()) email = String(cData[i][2]).trim();
  }

  const html =
    '<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1a1c1f">' +
    '<div style="border-bottom:3px solid ' + BRAND.accent + ';padding-bottom:14px;margin-bottom:22px;display:flex;justify-content:space-between">' +
    '<div><div style="font-size:24px;font-weight:bold">' + biz + '</div>' +
    (bizPhone ? '<div style="color:#52565c">' + bizPhone + '</div>' : '') + '</div>' +
    '<div style="text-align:right"><div style="font-size:28px;font-weight:bold;color:' + BRAND.accent + '">INVOICE</div>' +
    '<div style="color:#52565c">#' + (v[0] || '—') + '</div></div></div>' +
    '<table style="width:100%;margin-bottom:20px"><tr>' +
    '<td><b>Bill to:</b><br>' + v[1] + (email ? '<br>' + email : '') + '</td>' +
    '<td style="text-align:right"><b>Issued:</b> ' + fmtD(v[2]) + '<br><b>Due:</b> ' + fmtD(v[3]) + '</td></tr></table>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
    '<tr style="background:#1a1c1f;color:#fff"><th style="text-align:left;padding:10px">Description</th><th style="text-align:right;padding:10px">Amount</th></tr>' +
    '<tr><td style="padding:10px;border-bottom:1px solid #eee">Services rendered — ' + biz + '</td>' +
    '<td style="padding:10px;border-bottom:1px solid #eee;text-align:right">$' + amount.toFixed(2) + '</td></tr>' +
    '<tr><td style="padding:10px;text-align:right;font-weight:bold">Total Due</td>' +
    '<td style="padding:10px;text-align:right;font-weight:bold;font-size:18px;color:' + BRAND.accent + '">$' + amount.toFixed(2) + '</td></tr></table>' +
    (pay ? '<div style="background:' + BRAND.soft + ';padding:14px;border-radius:8px"><b>Payment:</b> ' + pay + '</div>' : '') +
    '<p style="color:#52565c;margin-top:24px">Thank you for your business!</p></div>';

  const pdf = Utilities.newBlob(html, 'text/html', 'Invoice-' + (v[0] || 'draft') + '.html').getAs('application/pdf')
    .setName('Invoice-' + (v[0] || 'draft') + '-' + String(v[1]).replace(/\s+/g, '') + '.pdf');

  if (email) {
    const resp = ui.alert('Email invoice?', 'Email this invoice PDF to ' + v[1] + ' at ' + email + '?', ui.ButtonSet.YES_NO);
    if (resp === ui.Button.YES) {
      MailApp.sendEmail({ to: email, subject: 'Invoice #' + (v[0] || '') + ' from ' + biz,
        htmlBody: 'Hi ' + String(v[1]).split(' ')[0] + ',<br><br>Please find your invoice attached. ' +
        (pay ? pay : '') + '<br><br>Thank you!<br>' + biz, attachments: [pdf] });
      inv.getRange(row, 6).setValue('Sent');
      ui.alert('🧾 Invoice emailed to ' + v[1] + ' and marked Sent. A copy is saved in your Drive.');
    }
  } else {
    ui.alert('No email on file for ' + v[1] + ' (add it in 👥 Clients to email directly). Saving the PDF to your Drive instead.');
  }
  DriveApp.createFile(pdf); // keep a copy in Drive either way
}

/* ========================= AUTOMATIONS ============================ */

function sendFollowUpDigest() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const email = getSetting_(ss, 'Owner email (for follow-up digest)') || Session.getActiveUser().getEmail();
  const biz = getSetting_(ss, 'Business name') || 'Your Business';
  const due = sidebarFollowUps();
  if (!email) return;
  if (!due.length) { MailApp.sendEmail(email, '⚡ ' + biz + ' — no follow-ups due today 🎉', 'All caught up. Nice work.'); return; }
  let html = '<div style="font-family:Arial,sans-serif;max-width:560px"><h2 style="color:#1a1c1f">🔔 ' + due.length +
    ' follow-up' + (due.length > 1 ? 's' : '') + ' due — ' + biz + '</h2>' +
    '<table style="border-collapse:collapse;width:100%"><tr style="background:#1a1c1f;color:#fff">' +
    '<th style="padding:8px;text-align:left">Name</th><th style="padding:8px;text-align:left">Phone</th>' +
    '<th style="padding:8px;text-align:left">Due</th><th style="padding:8px;text-align:left">Status</th></tr>';
  due.forEach((d, i) => { html += '<tr style="background:' + (i % 2 ? BRAND.soft : '#fff') + '">' +
    '<td style="padding:8px">' + d.name + '</td><td style="padding:8px">' + (d.phone || '—') + '</td>' +
    '<td style="padding:8px">' + d.due + '</td><td style="padding:8px">' + d.status + '</td></tr>'; });
  html += '</table><p style="color:#52565c;font-size:13px">Open your CRM to update these after you reach out.</p></div>';
  MailApp.sendEmail({ to: email, subject: '🔔 ' + due.length + ' follow-up(s) due — ' + biz, htmlBody: html });
}

function sendReviewRequests() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const jobs = ss.getSheetByName(TABS.JOBS), clients = ss.getSheetByName(TABS.CLIENTS);
  if (!jobs || !clients) { ui.alert('Run setup first.'); return; }
  const link = String(getSetting_(ss, 'Google review link (for review requests)') || '').trim();
  const biz = getSetting_(ss, 'Business name') || 'our business';
  if (!link || link.indexOf('your-review-link') > -1 || link.indexOf('http') !== 0) {
    ui.alert('Add your Google review link first', 'Open ⚙️ Settings and paste your Google review link, then run this again.', ui.ButtonSet.OK); return;
  }
  const emailByName = clientEmailMap_(clients);
  const jData = jobs.getDataRange().getValues();
  let sent = 0, noEmail = 0;
  for (let r = 1; r < jData.length; r++) {
    const row = jData[r];
    const client = String(row[1]).trim();
    if (!client || row[4] !== 'Done' || row[6] !== 'Yes' || row[7] === 'Yes') continue;
    const email = emailByName[client.toLowerCase()];
    if (!email) { noEmail++; continue; }
    const svc = String(row[2] || 'your recent service').trim();
    const html = '<div style="font-family:Arial,sans-serif;max-width:520px;color:#1a1c1f">' +
      '<p>Hi ' + client.split(' ')[0] + ',</p><p>Thank you for choosing <b>' + biz + '</b> for ' + svc +
      '. It was a pleasure!</p><p>If you were happy, a quick Google review helps other local folks find us (30 seconds):</p>' +
      '<p style="text-align:center;margin:26px 0"><a href="' + link + '" style="background:' + BRAND.accent +
      ';color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:bold">⭐ Leave a review</a></p>' +
      '<p>Thanks again,<br>' + biz + '</p></div>';
    MailApp.sendEmail({ to: email, subject: 'Quick favor? ⭐ ' + biz, htmlBody: html });
    jobs.getRange(r + 1, 8).setValue('Yes'); sent++; Utilities.sleep(250);
  }
  let msg = '⭐ Sent ' + sent + ' review request' + (sent === 1 ? '' : 's') + '.';
  if (noEmail) msg += '\n\n' + noEmail + ' finished job(s) skipped — no client email. Add it in 👥 Clients.';
  if (!sent && !noEmail) msg += '\n\nNo new finished-and-paid jobs were waiting.';
  ui.alert(msg);
}

function remindUpcomingJobs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const jobs = ss.getSheetByName(TABS.JOBS), clients = ss.getSheetByName(TABS.CLIENTS);
  if (!jobs || !clients) return;
  const biz = getSetting_(ss, 'Business name') || 'Your Business';
  const bizPhone = getSetting_(ss, 'Business phone') || '';
  const emailByName = clientEmailMap_(clients);
  const tz = Session.getScriptTimeZone();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0, 0, 0, 0);
  const jData = jobs.getDataRange().getValues();
  let sent = 0;
  for (let r = 1; r < jData.length; r++) {
    const row = jData[r];
    if (!(row[0] instanceof Date) || row[4] === 'Cancelled' || row[4] === 'Done' || row[8] === 'Yes') continue;
    const d = new Date(row[0]); d.setHours(0, 0, 0, 0);
    if (d.getTime() !== tomorrow.getTime()) continue;
    const email = emailByName[String(row[1]).trim().toLowerCase()];
    if (!email) continue;
    const when = Utilities.formatDate(new Date(row[0]), tz, 'EEEE, MMM d') + (row[3] ? ' at ' + row[3] : '');
    MailApp.sendEmail({ to: email, subject: '📅 Reminder: your appointment with ' + biz,
      htmlBody: '<div style="font-family:Arial,sans-serif;color:#1a1c1f"><p>Hi ' + String(row[1]).split(' ')[0] + ',</p>' +
      '<p>Just a friendly reminder of your upcoming appointment with <b>' + biz + '</b>:</p>' +
      '<p style="font-size:16px"><b>' + when + '</b>' + (row[2] ? '<br>' + row[2] : '') + '</p>' +
      '<p>Questions or need to reschedule? ' + (bizPhone ? 'Call us at ' + bizPhone + '.' : 'Just reply to this email.') +
      '</p><p>See you then!<br>' + biz + '</p></div>' });
    jobs.getRange(r + 1, 9).setValue('Yes'); sent++; Utilities.sleep(250);
  }
  return sent;
}

function markOverdueInvoices() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const inv = ss.getSheetByName(TABS.INVOICES);
  if (!inv) return;
  const data = inv.getDataRange().getValues();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let n = 0;
  for (let r = 1; r < data.length; r++) {
    const status = data[r][5], due = data[r][3];
    if (status === 'Sent' && due instanceof Date) {
      const d = new Date(due); d.setHours(0, 0, 0, 0);
      if (d < today) { inv.getRange(r + 1, 6).setValue('Overdue'); n++; }
    }
  }
  return n;
}

function installDailyTriggers() {
  const ui = SpreadsheetApp.getUi();
  removeDailyTriggers_();
  ScriptApp.newTrigger('sendFollowUpDigest').timeBased().atHour(8).everyDays(1).create();
  ScriptApp.newTrigger('remindUpcomingJobs').timeBased().atHour(8).everyDays(1).create();
  ScriptApp.newTrigger('markOverdueInvoices').timeBased().atHour(7).everyDays(1).create();
  ui.alert('⏰ Autopilot is ON.', 'Every morning you\'ll get: your follow-up list (8am), appointment reminders sent to tomorrow\'s clients, and overdue invoices flagged automatically. You may be asked to authorize email once.', ui.ButtonSet.OK);
}

function removeDailyTriggers() { removeDailyTriggers_(); SpreadsheetApp.getUi().alert('⏹️ Daily automations turned off.'); }
function removeDailyTriggers_() {
  ScriptApp.getProjectTriggers().forEach(t => {
    const f = t.getHandlerFunction();
    if (f === 'sendFollowUpDigest' || f === 'remindUpcomingJobs' || f === 'markOverdueInvoices') ScriptApp.deleteTrigger(t);
  });
}

/* =========================== HELPERS ============================= */

function clientEmailMap_(clients) {
  const cData = clients.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < cData.length; i++) {
    const nm = String(cData[i][0]).trim(), em = String(cData[i][2]).trim();
    if (nm && em) map[nm.toLowerCase()] = em;
  }
  return map;
}

function promptOrCancel_(ui, msg) {
  const r = ui.prompt(msg, ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return null;
  return r.getResponseText().trim();
}

function getSetting_(ss, key) {
  const sh = ss.getSheetByName(TABS.SETTINGS);
  if (!sh) return '';
  const data = sh.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) if (String(data[i][1]).trim() === key) return data[i][2];
  return '';
}

function showAbout() {
  SpreadsheetApp.getUi().alert('⚡ Service Pro CRM',
    'A complete CRM inside your own Google account — no subscriptions, no data leaving your Drive.\n\n' +
    'Tabs: Start Here, Dashboard, Leads, Jobs, Clients, Invoices, Settings.\n\n' +
    'Highlights:\n• ⚡ Quick Actions side panel\n• 🧾 One-click PDF invoices, emailed to clients\n' +
    '• 🔔 Daily follow-up emails\n• ⭐ Automatic Google-review requests\n• 📅 Appointment reminders\n' +
    '• 🚩 Auto-flag overdue invoices\n• 📈 Revenue chart\n\n' +
    'Turn on autopilot: ⚡ CRM ▸ Automations ▸ Turn ON daily automations.\n\n' +
    'Support: reply to your purchase receipt.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}
