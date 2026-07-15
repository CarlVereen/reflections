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
  START:     '🚀 Start Here',
  DASH:      '📊 Dashboard',
  LEADS:     '🎯 Leads',
  JOBS:      '🗓️ Jobs',
  CLIENTS:   '👥 Clients',
  ESTIMATES: '📄 Estimates',
  INVOICES:  '💵 Invoices',
  ITEMS:     '🧾 Line Items',
  SETTINGS:  '⚙️ Settings',
};

const LEAD_STATUSES = ['New', 'Contacted', 'Quoted', 'Won', 'Lost'];
const JOB_STATUSES  = ['Scheduled', 'In Progress', 'Done', 'Cancelled'];
const INV_STATUSES  = ['Draft', 'Sent', 'Paid', 'Overdue'];
const EST_STATUSES  = ['Draft', 'Sent', 'Accepted', 'Declined'];
const REPEAT_OPTS   = ['None', 'Weekly', 'Biweekly', 'Monthly'];

/* ─────────────────────────────────────────────────────────────────────
 *  VARIANT CONFIG — this is the ONLY block that changes between niche
 *  editions (Universal / Cleaning / Lawn Care / …). Swap these ~8 lines
 *  and re-run setup to re-skin the entire product. See variants/ folder.
 * ───────────────────────────────────────────────────────────────────── */
const CONFIG = {
  productName: 'Service Pro CRM',
  accent:  '#b8823a',   // primary brand color (amber)
  accent2: '#8f5f22',   // darker shade
  // Suggested services shown as a dropdown (users can still type their own):
  services: ['Consultation', 'Standard service', 'Premium service', 'Recurring service', 'Emergency call'],
};

/** Brand palette — accent is driven by CONFIG so variants re-skin cleanly. */
const BRAND = {
  header:    '#1a1c1f',
  headerTxt: '#ffffff',
  accent:    CONFIG.accent,
  accent2:   CONFIG.accent2,
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
    .addSubMenu(SpreadsheetApp.getUi().createMenu('Invoices & estimates')
      .addItem('📄  Create & email estimate (selected row)', 'createEstimatePdf')
      .addItem('🧾  Create & email invoice (selected row)', 'createInvoicePdf')
      .addItem('🚩  Flag overdue invoices now', 'markOverdueInvoices'))
    .addSubMenu(SpreadsheetApp.getUi().createMenu('Automations')
      .addItem('📧  Email me today\'s follow-ups', 'sendFollowUpDigest')
      .addItem('⭐  Send review requests for finished jobs', 'sendReviewRequests')
      .addItem('📅  Send tomorrow\'s appointment reminders', 'remindUpcomingJobs')
      .addItem('🔁  Roll forward finished recurring jobs', 'rollForwardRecurringJobs')
      .addSeparator()
      .addItem('⏰  Turn ON daily automations', 'installDailyTriggers')
      .addItem('⏹️  Turn OFF daily automations', 'removeDailyTriggers'))
    .addSeparator()
    .addItem('📱  Create mobile lead-capture form', 'createLeadForm')
    .addItem('ℹ️  About / help', 'showAbout')
    .addToUi();
}

function showSidebar() {
  try {
    const html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('⚡ Quick Actions');
    SpreadsheetApp.getUi().showSidebar(html);
  } catch (e) {
    SpreadsheetApp.getUi().alert('Quick Actions panel not found',
      'Add the file "Sidebar.html" in Extensions ▸ Apps Script (alongside the code), then reload the sheet.',
      SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/* ============================ BUILD ============================== */

function buildCRM() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  // Guard: rebuilding clears the data tabs. Never wipe a buyer's real data silently.
  if (hasExistingData_(ss)) {
    const resp = ui.alert('Rebuild CRM?',
      'You already have data in this CRM. Rebuilding resets the Leads, Jobs, Clients, and Invoices ' +
      'tabs and will ERASE those rows. Only do this on a fresh copy.\n\nContinue and erase?',
      ui.ButtonSet.YES_NO);
    if (resp !== ui.Button.YES) return;
  }

  buildLeads_(ss);
  buildJobs_(ss);
  buildClients_(ss);
  buildEstimates_(ss);
  buildInvoices_(ss);
  buildLineItems_(ss);
  buildDashboard_(ss);
  buildSettings_(ss);
  buildStartHere_(ss);
  reorderTabs_(ss, [TABS.START, TABS.DASH, TABS.LEADS, TABS.JOBS, TABS.CLIENTS,
                    TABS.ESTIMATES, TABS.INVOICES, TABS.ITEMS, TABS.SETTINGS]);
  // Remove the leftover default sheet created with a new spreadsheet.
  const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
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

/** Like dropdown_ but lets the user type a custom value too (suggestions only). */
function suggestList_(sh, col, values, firstRow, numRows) {
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(true).build();
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
  suggestList_(sh, 6, CONFIG.services, 2, rows);   // Service — niche suggestions, custom allowed
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
}

function buildJobs_(ss) {
  const sh = getOrCreate_(ss, TABS.JOBS);
  const headers = ['Job Date', 'Client', 'Service', 'Scheduled Time', 'Status', 'Price', 'Paid?',
                   'Review Sent?', 'Reminder Sent?', 'Notes', 'Repeat', 'Rolled?'];
  header_(sh, headers);
  sh.setColumnWidths(1, headers.length, 118);
  sh.setColumnWidth(2, 160); sh.setColumnWidth(10, 220);
  const rows = 500;
  dropdown_(sh, 5, JOB_STATUSES, 2, rows);
  suggestList_(sh, 3, CONFIG.services, 2, rows);   // Service — niche suggestions, custom allowed
  dropdown_(sh, 7, ['Yes', 'No'], 2, rows);
  dropdown_(sh, 8, ['Yes', 'No'], 2, rows);
  dropdown_(sh, 9, ['Yes', 'No'], 2, rows);
  dropdown_(sh, 11, REPEAT_OPTS, 2, rows);         // Repeat (recurring)
  dropdown_(sh, 12, ['Yes', 'No'], 2, rows);       // Rolled? (internal — next visit already created)
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

function buildEstimates_(ss) {
  const sh = getOrCreate_(ss, TABS.ESTIMATES);
  const headers = ['Estimate #', 'Client', 'Issue Date', 'Valid Until', 'Amount', 'Status'];
  header_(sh, headers);
  sh.setColumnWidths(1, headers.length, 140);
  const rows = 500;
  dropdown_(sh, 6, EST_STATUSES, 2, rows);
  sh.getRange(2, 3, rows, 2).setNumberFormat('m/d/yyyy');
  sh.getRange(2, 5, rows, 1).setNumberFormat('$#,##0.00');
  const statusRange = sh.getRange(2, 6, rows, 1);
  const rules = [];
  const c = (t, bg, fc) => SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(t).setBackground(bg).setFontColor(fc || BRAND.header).setRanges([statusRange]).build();
  rules.push(c('Draft', '#eeeeee'), c('Sent', '#fff3d6'), c('Accepted', '#d8efdf'), c('Declined', '#f5d9d3', BRAND.warn));
  sh.setConditionalFormatRules(rules);
  sh.getRange('H1').setValue('Add line items for an estimate/invoice in the 🧾 Line Items tab (match the number).').setFontColor('#6b6459').setFontSize(9);
}

function buildLineItems_(ss) {
  const sh = getOrCreate_(ss, TABS.ITEMS);
  const headers = ['Doc # (Invoice or Estimate)', 'Description', 'Qty', 'Rate', 'Line Total'];
  header_(sh, headers);
  sh.setColumnWidth(1, 200); sh.setColumnWidth(2, 300); sh.setColumnWidth(3, 70);
  sh.setColumnWidth(4, 110); sh.setColumnWidth(5, 120);
  const rows = 500;
  sh.getRange(2, 3, rows, 1).setNumberFormat('0.##');
  sh.getRange(2, 4, rows, 1).setNumberFormat('$#,##0.00');
  const arr = [];
  for (let i = 0; i < rows; i++) {
    const r = i + 2;
    arr.push(['=IF(AND($C' + r + '<>"",$D' + r + '<>""),$C' + r + '*$D' + r + ',"")']);
  }
  sh.getRange(2, 5, rows, 1).setFormulas(arr).setNumberFormat('$#,##0.00');
  sh.getRange('G1').setValue('Optional: itemize a doc here. Leave blank to just use a single Amount on the invoice/estimate.').setFontColor('#6b6459').setFontSize(9);
}

function buildDashboard_(ss) {
  const sh = getOrCreate_(ss, TABS.DASH);
  sh.clear();
  sh.getCharts().forEach(ch => sh.removeChart(ch));
  sh.setHiddenGridlines(true);
  const L = "'" + TABS.LEADS + "'", J = "'" + TABS.JOBS + "'", I = "'" + TABS.INVOICES + "'";
  sh.getRange('B2').setValue('⚡ ' + CONFIG.productName.toUpperCase()).setFontSize(20).setFontWeight('bold').setFontColor(BRAND.header);
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
    const v = sh.getRange(6, cc).setFormula(t[1]).setFontSize(20).setFontWeight('bold').setFontColor(BRAND.header);
    if (idx === 1 || idx === 3) v.setNumberFormat('$#,##0');
    sh.getRange(5, cc, 2, 1).setBackground(BRAND.soft);
    sh.setColumnWidth(cc, 168);
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

  // 6-month revenue helper in columns R:S (off to the right; NOT hidden —
  // Google Sheets charts do not plot data in hidden columns).
  sh.getRange(1, 18).setValue('Chart data ↓').setFontColor('#6b6459').setFontSize(9);
  for (let m = 5; m >= 0; m--) {
    const r = 2 + (5 - m);
    sh.getRange(r, 18).setFormula('=TEXT(EOMONTH(TODAY(),-' + m + '),"mmm")');           // R: month label
    sh.getRange(r, 19).setFormula('=SUMIFS(' + I + '!E:E,' + I + '!F:F,"Paid",' + I +
      '!C:C,">="&EOMONTH(TODAY(),-' + (m + 1) + ')+1,' + I + '!C:C,"<="&EOMONTH(TODAY(),-' + m + '))'); // S: revenue
  }
  sh.getRange(2, 19, 6, 1).setNumberFormat('$#,##0');
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
    ['Sales tax % (0 for none)', 0],
    ['Default follow-up (days after new lead)', 2],
    ['Google review link (for review requests)', 'https://g.page/r/your-review-link/review'],
    ['Invoice payment instructions', 'Pay via Zelle to you@email.com, or cash/check on completion.'],
    ['Payment link (Stripe/PayPal/Venmo — optional)', ''],
    ['Mobile lead-capture form URL (auto-filled)', ''],
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
  sh.getRange('B2').setValue('🚀 Welcome to ' + CONFIG.productName).setFontSize(22).setFontWeight('bold').setFontColor(BRAND.header);
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
  const whenStr = promptOrCancel_(ui, 'Job date for "' + v[1] + '"? (e.g. 7/22/2026)');
  if (whenStr === null) return;
  const when = parseDate_(whenStr);
  if (!when) { ui.alert('Could not read that date. Try month/day/year, like 7/22/2026.'); return; }
  jobs.appendRow([when, v[1], v[5], '', 'Scheduled', v[6] || '', 'No', 'No', 'No', 'From lead']);
  upsertClient_(ss, v[1], v[2], v[3]);   // ensure client exists (carries email so reminders/reviews work)
  leads.getRange(row, 8).setValue('Won');
  ui.alert('📅 Job scheduled for ' + v[1] + ' on ' + Utilities.formatDate(when, Session.getScriptTimeZone(), 'M/d') + '. Lead marked Won and added to Clients.');
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
  upsertClient_(ss, v[1], v[2], v[3], v[9]);   // dedupes if the client already exists
  leads.getRange(row, 8).setValue('Won'); leads.getRange(row, 9).setValue('');
  ui.alert('🎉 "' + v[1] + '" is now a client.');
}

/* ==================== ESTIMATES & INVOICES ======================= */

function createInvoicePdf()  { generateDoc_('INVOICE'); }
function createEstimatePdf() { generateDoc_('ESTIMATE'); }

/**
 * Shared PDF generator for invoices and estimates. Pulls optional line items from
 * the 🧾 Line Items tab (matched by number), applies sales tax to itemized docs,
 * adds a Pay-now button (invoices), emails the client, and saves a copy to Drive.
 */
function generateDoc_(kind) {
  const isInv = (kind === 'INVOICE');
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = isInv ? TABS.INVOICES : TABS.ESTIMATES;
  const sh = ss.getSheetByName(sheetName);
  const clients = ss.getSheetByName(TABS.CLIENTS);
  if (!sh) { ui.alert('Run setup first.'); return; }
  if (ss.getActiveSheet().getName() !== sheetName) {
    ui.alert('Go to the ' + sheetName + ' tab, click the row you want, then run this again.'); return;
  }
  const row = ss.getActiveRange().getRow();
  if (row < 2) { ui.alert('Click a row first.'); return; }
  const v = sh.getRange(row, 1, 1, 6).getValues()[0]; // num, client, dateA, dateB(due/valid), amount, status
  if (!v[1]) { ui.alert('This ' + kind.toLowerCase() + ' needs a Client.'); return; }

  const num = (v[0] === '' || v[0] === null) ? 'draft' : v[0];
  const biz = getSetting_(ss, 'Business name') || 'Your Business';
  const bizPhone = getSetting_(ss, 'Business phone') || '';
  const pay = getSetting_(ss, 'Invoice payment instructions') || '';
  const payLink = String(getSetting_(ss, 'Payment link (Stripe/PayPal/Venmo — optional)') || '').trim();
  const cur = String(getSetting_(ss, 'Currency symbol') || '$').trim() || '$';
  const taxPct = Number(getSetting_(ss, 'Sales tax % (0 for none)')) || 0;
  const tz = Session.getScriptTimeZone();
  const fmtD = d => (d instanceof Date) ? Utilities.formatDate(d, tz, 'MMM d, yyyy') : '';
  const money = n => cur + (Number(n) || 0).toFixed(2);

  // Optional line items matched by number. Itemized docs get tax; a single typed
  // Amount is treated as the final total (no tax applied) to avoid double-taxing on re-run.
  const items = lineItemsFor_(ss, v[0]);
  let subtotal = 0, tax = 0, rowsHtml = '';
  if (items.length) {
    items.forEach(function (it) {
      const lt = it.qty * it.rate; subtotal += lt;
      rowsHtml += '<tr><td style="padding:9px;border-bottom:1px solid #eee">' + it.desc + '</td>' +
        '<td style="padding:9px;border-bottom:1px solid #eee;text-align:center">' + it.qty + '</td>' +
        '<td style="padding:9px;border-bottom:1px solid #eee;text-align:right">' + money(it.rate) + '</td>' +
        '<td style="padding:9px;border-bottom:1px solid #eee;text-align:right">' + money(lt) + '</td></tr>';
    });
    tax = subtotal * taxPct / 100;
  } else {
    subtotal = Number(v[4]) || 0;
    if (!subtotal) { ui.alert('Add an Amount on this row, or add line items in the 🧾 Line Items tab (match #' + num + ').'); return; }
    rowsHtml = '<tr><td style="padding:9px;border-bottom:1px solid #eee">Services rendered — ' + biz + '</td>' +
      '<td style="padding:9px;border-bottom:1px solid #eee;text-align:center">1</td>' +
      '<td style="padding:9px;border-bottom:1px solid #eee;text-align:right">' + money(subtotal) + '</td>' +
      '<td style="padding:9px;border-bottom:1px solid #eee;text-align:right">' + money(subtotal) + '</td></tr>';
  }
  const total = subtotal + tax;

  // client email
  let email = '';
  const cData = clients ? clients.getDataRange().getValues() : [];
  for (let i = 1; i < cData.length; i++) if (String(cData[i][0]).trim().toLowerCase() === String(v[1]).trim().toLowerCase()) email = String(cData[i][2]).trim();

  const title = isInv ? 'INVOICE' : 'ESTIMATE';
  const dateBLabel = isInv ? 'Due' : 'Valid until';
  const totalsRows =
    (tax > 0 ?
      '<tr><td colspan="3" style="padding:6px 9px;text-align:right">Subtotal</td><td style="padding:6px 9px;text-align:right">' + money(subtotal) + '</td></tr>' +
      '<tr><td colspan="3" style="padding:6px 9px;text-align:right">Tax (' + taxPct + '%)</td><td style="padding:6px 9px;text-align:right">' + money(tax) + '</td></tr>' : '') +
    '<tr><td colspan="3" style="padding:9px;text-align:right;font-weight:bold">' + (isInv ? 'Total Due' : 'Estimated Total') + '</td>' +
    '<td style="padding:9px;text-align:right;font-weight:bold;font-size:18px;color:' + BRAND.accent2 + '">' + money(total) + '</td></tr>';

  const payBtn = (isInv && payLink) ?
    '<p style="text-align:center;margin:22px 0"><a href="' + payLink + '" style="background:' + BRAND.accent2 +
    ';color:#fff;text-decoration:none;padding:12px 26px;border-radius:999px;font-weight:bold">Pay now</a></p>' : '';

  const html =
    '<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1a1c1f">' +
    '<table style="width:100%;border-bottom:3px solid ' + BRAND.accent + ';margin-bottom:22px"><tr>' +
    '<td style="padding-bottom:14px;vertical-align:top"><div style="font-size:24px;font-weight:bold">' + biz + '</div>' +
    (bizPhone ? '<div style="color:#52565c">' + bizPhone + '</div>' : '') + '</td>' +
    '<td style="padding-bottom:14px;text-align:right;vertical-align:top">' +
    '<div style="font-size:28px;font-weight:bold;color:' + BRAND.accent + '">' + title + '</div>' +
    '<div style="color:#52565c">#' + num + '</div></td></tr></table>' +
    '<table style="width:100%;margin-bottom:20px"><tr>' +
    '<td><b>' + (isInv ? 'Bill to' : 'Prepared for') + ':</b><br>' + v[1] + (email ? '<br>' + email : '') + '</td>' +
    '<td style="text-align:right"><b>Issued:</b> ' + fmtD(v[2]) + '<br><b>' + dateBLabel + ':</b> ' + fmtD(v[3]) + '</td></tr></table>' +
    '<table style="width:100%;border-collapse:collapse;margin-bottom:6px">' +
    '<tr style="background:#1a1c1f;color:#fff"><th style="text-align:left;padding:9px">Description</th>' +
    '<th style="padding:9px">Qty</th><th style="text-align:right;padding:9px">Rate</th><th style="text-align:right;padding:9px">Amount</th></tr>' +
    rowsHtml + totalsRows + '</table>' + payBtn +
    (pay && isInv ? '<div style="background:' + BRAND.soft + ';padding:14px;border-radius:8px"><b>Payment:</b> ' + pay + '</div>' : '') +
    '<p style="color:#52565c;margin-top:20px">' + (isInv ? 'Thank you for your business!' :
      'This estimate is for your review — reply to accept and we\'ll get you scheduled.') + '</p></div>';

  const fname = (isInv ? 'Invoice' : 'Estimate') + '-' + num + '-' + String(v[1]).replace(/\s+/g, '') + '.pdf';
  const pdf = Utilities.newBlob(html, 'text/html', 'doc.html').getAs('application/pdf').setName(fname);

  // Keep the Amount column in sync with the computed total so dashboards stay accurate.
  sh.getRange(row, 5).setValue(total);

  if (email) {
    const resp = ui.alert('Email ' + kind.toLowerCase() + '?', 'Email this ' + kind.toLowerCase() + ' PDF to ' + v[1] + ' at ' + email + '?', ui.ButtonSet.YES_NO);
    if (resp === ui.Button.YES) {
      MailApp.sendEmail({ to: email, subject: title.charAt(0) + title.slice(1).toLowerCase() + ' #' + num + ' from ' + biz,
        htmlBody: 'Hi ' + String(v[1]).split(' ')[0] + ',<br><br>Please find your ' + kind.toLowerCase() + ' attached. ' +
          (isInv && payLink ? 'Pay online here: ' + payLink + '<br>' : '') + (isInv && pay ? pay : '') +
          '<br><br>Thank you!<br>' + biz, attachments: [pdf] });
      sh.getRange(row, 6).setValue('Sent');
      DriveApp.createFile(pdf);
      ui.alert('✅ ' + title.charAt(0) + title.slice(1).toLowerCase() + ' emailed to ' + v[1] + ' and marked Sent. A copy is saved in your Drive.');
    } else {
      DriveApp.createFile(pdf);
      ui.alert('Saved the ' + kind.toLowerCase() + ' PDF to your Drive (not emailed).');
    }
  } else {
    DriveApp.createFile(pdf);
    ui.alert('No email on file for ' + v[1] + ' (add one in 👥 Clients to email directly). Saved the PDF to your Drive instead.');
  }
}

/** Returns line items [{desc,qty,rate}] whose Doc # matches (string compare). */
function lineItemsFor_(ss, docNum) {
  const sh = ss.getSheetByName(TABS.ITEMS);
  if (!sh || docNum === '' || docNum === null || docNum === undefined) return [];
  const key = String(docNum).trim().toLowerCase();
  const data = sh.getDataRange().getValues();
  const out = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() !== key) continue;
    const desc = String(data[i][1]).trim(), qty = Number(data[i][2]) || 0, rate = Number(data[i][3]) || 0;
    if (desc && qty && rate) out.push({ desc: desc, qty: qty, rate: rate });
  }
  return out;
}

/* ========================= AUTOMATIONS ============================ */

function sendFollowUpDigest() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const email = getSetting_(ss, 'Owner email (for follow-up digest)') || Session.getActiveUser().getEmail();
  const biz = getSetting_(ss, 'Business name') || 'Your Business';
  const due = sidebarFollowUps();
  if (!email) return '⚠ No owner email set in ⚙️ Settings.';
  if (!due.length) { MailApp.sendEmail(email, '⚡ ' + biz + ' — no follow-ups due today 🎉', 'All caught up. Nice work.'); return '📧 Emailed you — nothing due, all caught up 🎉'; }
  let html = '<div style="font-family:Arial,sans-serif;max-width:600px"><h2 style="color:#1a1c1f">🔔 ' + due.length +
    ' follow-up' + (due.length > 1 ? 's' : '') + ' due — ' + biz + '</h2>' +
    '<table style="border-collapse:collapse;width:100%"><tr style="background:#1a1c1f;color:#fff">' +
    '<th style="padding:8px;text-align:left">Name</th><th style="padding:8px;text-align:left">Phone</th>' +
    '<th style="padding:8px;text-align:left">Due</th><th style="padding:8px;text-align:left">Status</th>' +
    '<th style="padding:8px;text-align:left">Text</th></tr>';
  due.forEach(function (d, i) {
    const digits = String(d.phone || '').replace(/[^0-9+]/g, '');
    const smsCell = digits
      ? '<a href="sms:' + digits + '?&body=' + encodeURIComponent('Hi ' + String(d.name).split(' ')[0] + ", it's " + biz + ' following up — ') + '" style="color:' + BRAND.accent2 + ';font-weight:bold">Text ›</a>'
      : '—';
    html += '<tr style="background:' + (i % 2 ? BRAND.soft : '#fff') + '">' +
      '<td style="padding:8px">' + d.name + '</td><td style="padding:8px">' + (d.phone || '—') + '</td>' +
      '<td style="padding:8px">' + d.due + '</td><td style="padding:8px">' + d.status + '</td>' +
      '<td style="padding:8px">' + smsCell + '</td></tr>';
  });
  html += '</table><p style="color:#52565c;font-size:13px">On your phone, tap "Text ›" to message a lead. Update their status in the CRM after you reach out.</p></div>';
  MailApp.sendEmail({ to: email, subject: '🔔 ' + due.length + ' follow-up(s) due — ' + biz, htmlBody: html });
  return '📧 Emailed you ' + due.length + ' follow-up(s) to make today.';
}

function sendReviewRequests() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const jobs = ss.getSheetByName(TABS.JOBS), clients = ss.getSheetByName(TABS.CLIENTS);
  if (!jobs || !clients) { ui.alert('Run setup first.'); return 'Run setup first.'; }
  const link = String(getSetting_(ss, 'Google review link (for review requests)') || '').trim();
  const biz = getSetting_(ss, 'Business name') || 'our business';
  if (!link || link.indexOf('your-review-link') > -1 || link.indexOf('http') !== 0) {
    ui.alert('Add your Google review link first', 'Open ⚙️ Settings and paste your Google review link, then run this again.', ui.ButtonSet.OK);
    return '⚠ Add your Google review link in ⚙️ Settings first.';
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
      '<p style="text-align:center;margin:26px 0"><a href="' + link + '" style="background:' + BRAND.accent2 +
      ';color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:bold">⭐ Leave a review</a></p>' +
      '<p>Thanks again,<br>' + biz + '</p></div>';
    MailApp.sendEmail({ to: email, subject: 'Quick favor? ⭐ ' + biz, htmlBody: html });
    jobs.getRange(r + 1, 8).setValue('Yes'); sent++; Utilities.sleep(250);
  }
  let msg = '⭐ Sent ' + sent + ' review request' + (sent === 1 ? '' : 's') + '.';
  if (noEmail) msg += '\n\n' + noEmail + ' finished job(s) skipped — no client email. Add it in 👥 Clients.';
  if (!sent && !noEmail) msg += '\n\nNo new finished-and-paid jobs were waiting.';
  ui.alert(msg);
  return msg;
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
  ScriptApp.newTrigger('rollForwardRecurringJobs').timeBased().atHour(6).everyDays(1).create();
  ScriptApp.newTrigger('markOverdueInvoices').timeBased().atHour(7).everyDays(1).create();
  ScriptApp.newTrigger('sendFollowUpDigest').timeBased().atHour(8).everyDays(1).create();
  ScriptApp.newTrigger('remindUpcomingJobs').timeBased().atHour(8).everyDays(1).create();
  ui.alert('⏰ Autopilot is ON.', 'Every morning, automatically: recurring jobs roll forward, overdue invoices get flagged, your follow-up list is emailed to you (8am), and appointment reminders go to tomorrow\'s clients. You may be asked to authorize email once.', ui.ButtonSet.OK);
}

function removeDailyTriggers() { removeDailyTriggers_(); SpreadsheetApp.getUi().alert('⏹️ Daily automations turned off.'); }
function removeDailyTriggers_() {
  const handlers = ['sendFollowUpDigest', 'remindUpcomingJobs', 'markOverdueInvoices', 'rollForwardRecurringJobs'];
  ScriptApp.getProjectTriggers().forEach(t => {
    if (handlers.indexOf(t.getHandlerFunction()) > -1) ScriptApp.deleteTrigger(t);
  });
}

/**
 * For every finished recurring job that hasn't spawned its next visit yet, create
 * the next occurrence (Scheduled) at the right interval. Idempotent via the
 * "Rolled?" column (col 12) so a job never spawns twice.
 * Jobs columns: 1 Date,2 Client,3 Service,4 Time,5 Status,6 Price,7 Paid,
 *               8 ReviewSent,9 ReminderSent,10 Notes,11 Repeat,12 Rolled?
 */
function rollForwardRecurringJobs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(TABS.JOBS);
  if (!sh) return 0;
  const data = sh.getDataRange().getValues();
  const toAppend = [];
  let made = 0;
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const repeat = String(row[10] || 'None').trim();
    if (!(row[0] instanceof Date)) continue;
    if (row[4] !== 'Done') continue;                 // only finished jobs spawn the next visit
    if (repeat === '' || repeat === 'None') continue;
    if (String(row[11]).trim() === 'Yes') continue;  // already rolled
    const next = new Date(row[0]);
    if (repeat === 'Weekly') next.setDate(next.getDate() + 7);
    else if (repeat === 'Biweekly') next.setDate(next.getDate() + 14);
    else if (repeat === 'Monthly') next.setMonth(next.getMonth() + 1);
    else continue;
    toAppend.push([next, row[1], row[2], row[3], 'Scheduled', row[5], 'No', 'No', 'No',
                   'Recurring visit', repeat, 'No']);
    sh.getRange(r + 1, 12).setValue('Yes');          // mark source rolled
    made++;
  }
  toAppend.forEach(function (rowVals) { sh.appendRow(rowVals); });
  return made;
}

/* =========================== HELPERS ============================= */

/** Add a client if they don't exist yet; if they do, fill in a missing email. */
function upsertClient_(ss, name, phone, email, note) {
  const sh = ss.getSheetByName(TABS.CLIENTS);
  if (!sh || !name) return;
  const last = sh.getLastRow();
  if (last >= 2) {
    const names = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < names.length; i++) {
      if (String(names[i][0]).trim().toLowerCase() === String(name).trim().toLowerCase()) {
        if (email) {
          const cell = sh.getRange(i + 2, 3);
          if (!String(cell.getValue()).trim()) cell.setValue(email);
        }
        return;
      }
    }
  }
  sh.appendRow([name, phone || '', email || '', '', new Date(), '', note || '']);
}

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

/** True if any of the four data tabs already contain real rows (not just headers/formulas). */
function hasExistingData_(ss) {
  const checks = [[TABS.LEADS, 2], [TABS.JOBS, 2], [TABS.CLIENTS, 1], [TABS.INVOICES, 1]];
  return checks.some(function (pair) {
    const sh = ss.getSheetByName(pair[0]);
    if (!sh) return false;
    const last = sh.getLastRow();
    if (last < 2) return false;
    return sh.getRange(2, pair[1], last - 1, 1).getValues().some(function (r) { return String(r[0]).trim() !== ''; });
  });
}

/** Parse a user-typed date. Accepts M/D (assumes current year) or full M/D/YYYY. Null if invalid. */
function parseDate_(s) {
  s = String(s || '').trim();
  if (!s) return null;
  if (/^\d{1,2}\/\d{1,2}$/.test(s)) s = s + '/' + (new Date()).getFullYear();
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function getSetting_(ss, key) {
  const sh = ss.getSheetByName(TABS.SETTINGS);
  if (!sh) return '';
  const data = sh.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) if (String(data[i][1]).trim() === key) return data[i][2];
  return '';
}

function setSetting_(ss, key, value) {
  const sh = ss.getSheetByName(TABS.SETTINGS);
  if (!sh) return;
  const data = sh.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][1]).trim() === key) { sh.getRange(i + 1, 3).setValue(value); return; }
  }
}

/* ===================== MOBILE LEAD FORM =========================== */
/**
 * Creates a Google Form (great on phones — unlike the desktop-only sidebar) whose
 * submissions flow straight into the 🎯 Leads tab via an onFormSubmit trigger.
 */
function createLeadForm() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existing = String(getSetting_(ss, 'Mobile lead-capture form URL (auto-filled)') || '').trim();
  if (existing.indexOf('http') === 0) {
    ui.alert('Lead form already exists', 'Your mobile lead form:\n\n' + existing +
      '\n\nBookmark it on your phone. To make a new one, clear that value in ⚙️ Settings and run this again.', ui.ButtonSet.OK);
    return;
  }
  const biz = getSetting_(ss, 'Business name') || 'New';
  const form = FormApp.create(biz + ' — New Lead');
  form.setDescription('Quick lead capture — submissions flow straight into the CRM.');
  form.addTextItem().setTitle('Name').setRequired(true);
  form.addTextItem().setTitle('Phone');
  form.addTextItem().setTitle('Email');
  form.addTextItem().setTitle('Service');
  form.addTextItem().setTitle('Estimated value ($)');
  form.addParagraphTextItem().setTitle('Notes');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onLeadFormSubmit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onLeadFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
  const url = form.getPublishedUrl();
  setSetting_(ss, 'Mobile lead-capture form URL (auto-filled)', url);
  ui.alert('📱 Mobile lead form created', 'Bookmark this on your phone to capture leads anywhere:\n\n' + url +
    '\n\nSubmissions drop straight into your 🎯 Leads tab. (A "Form Responses" tab also appears — that\'s the raw log; you can ignore it.)', ui.ButtonSet.OK);
}

/** Trigger: a form submission → append to Leads with an auto follow-up date. */
function onLeadFormSubmit(e) {
  if (!e || !e.namedValues) return;
  const fv = function (k) { const a = e.namedValues[k]; return (a && a[0]) ? String(a[0]).trim() : ''; };
  const name = fv('Name');
  if (!name) return;
  addLeadCore_(name, fv('Phone'), fv('Email'), fv('Service'), fv('Estimated value ($)'));
}

function showAbout() {
  SpreadsheetApp.getUi().alert('⚡ Service Pro CRM',
    'A complete CRM inside your own Google account — no subscriptions, no data leaving your Drive.\n\n' +
    'Tabs: Start Here, Dashboard, Leads, Jobs, Clients, Estimates, Invoices, Line Items, Settings.\n\n' +
    'Highlights:\n• ⚡ Quick Actions side panel\n• 🧾 One-click PDF invoices, emailed to clients\n' +
    '• 🔔 Daily follow-up emails\n• ⭐ Automatic Google-review requests\n• 📅 Appointment reminders\n' +
    '• 🚩 Auto-flag overdue invoices\n• 📈 Revenue chart\n\n' +
    'Turn on autopilot: ⚡ CRM ▸ Automations ▸ Turn ON daily automations.\n\n' +
    'Support: reply to your purchase receipt.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}
