// Sandbox for the rewritten Api.gs: load db.gs + setup.gs + Api.gs, run the API surface a buyer
// would hit, and assert IDs / caches / dashboard / snapshots. Reuses the fake Sheets from dbtest.
const fs = require('fs'), vm = require('vm'), path = require('path');

function colNum(letters){ let n=0; for(const ch of letters) n=n*26+(ch.charCodeAt(0)-64); return n; }
class Sheet {
  constructor(name){ this.name=name; this.data=[]; this.frozen=0; this.hidden=false; this.colFmt={}; this.colValid={}; }
  _ensure(r,c){ while(this.data.length<r) this.data.push([]); const row=this.data[r-1]; while(row.length<c) row.push(''); }
  getName(){ return this.name; } clear(){ this.data=[]; return this; }
  setFrozenRows(n){ this.frozen=n; return this; } getFrozenRows(){ return this.frozen; }
  hideSheet(){ this.hidden=true; return this; } isSheetHidden(){ return this.hidden; } setColumnWidth(){ return this; }
  getMaxRows(){ return Math.max(1000,this.data.length); } getMaxColumns(){ return Math.max(26,this.data.reduce((m,r)=>Math.max(m,r.length),0)); }
  getLastRow(){ let last=0; for(let r=0;r<this.data.length;r++){ if((this.data[r]||[]).some(v=>v!=='' && v!=null)) last=r+1; } return last; }
  getLastColumn(){ return this.data.reduce((m,r)=>Math.max(m,r.length),0); }
  appendRow(arr){ const r=this.getLastRow()+1; this._ensure(r,arr.length); for(let c=0;c<arr.length;c++) this.data[r-1][c]=arr[c]; return this; }
  getDataRange(){ return this.getRange(1,1,Math.max(1,this.getLastRow()),Math.max(1,this.getLastColumn())); }
  getRange(a,b,c,d){
    if(typeof a==='string'){ let m;
      if(m=a.match(/^([A-Z]+)(\d+):([A-Z]+)$/)) return new Range(this,{whole:colNum(m[1])});
      if(m=a.match(/^([A-Z]+)(\d+)$/)) return new Range(this,{r:+m[2],c:colNum(m[1]),nr:1,nc:1});
      throw new Error('a1 '+a); }
    return new Range(this,{r:a,c:b,nr:c||1,nc:d||1});
  }
}
class Range {
  constructor(sh,s){ this.sh=sh; this.s=s; }
  setValues(v){ const {r,c,nr,nc}=this.s; for(let i=0;i<nr;i++){ this.sh._ensure(r+i,c+nc-1); for(let j=0;j<nc;j++) this.sh.data[r+i-1][c+j-1]=v[i][j]; } return this; }
  getValues(){ const {r,c,nr,nc}=this.s; const o=[]; for(let i=0;i<nr;i++){ const row=[]; for(let j=0;j<nc;j++){ const rr=this.sh.data[r+i-1]||[]; const v=rr[c+j-1]; row.push(v===undefined?'':v); } o.push(row); } return o; }
  setValue(v){ this.s.nr=1; this.s.nc=1; return this.setValues([[v]]); } getValue(){ return this.getValues()[0][0]; }
  setNumberFormat(f){ if(this.s.whole) this.sh.colFmt[this.s.whole]=f; return this; }
  setFontWeight(){ return this; } setBackground(){ return this; }
  insertCheckboxes(){ if(this.s.whole) this.sh.colFmt[this.s.whole]='checkbox'; return this; }
  setDataValidation(dv){ if(this.s.whole) this.sh.colValid[this.s.whole]=dv; return this; } clearDataValidations(){ return this; }
}
class Spreadsheet {
  constructor(){ this.sheets=[]; this.active=null; }
  getSheetByName(n){ return this.sheets.find(s=>s.name===n)||null; }
  insertSheet(n){ const s=new Sheet(n); this.sheets.push(s); this.active=s; return s; }
  deleteSheet(s){ this.sheets=this.sheets.filter(x=>x!==s); }
  setActiveSheet(s){ this.active=s; return s; } moveActiveSheet(){}
  getId(){ return 'FAKE'; }
}
const SS = new Spreadsheet();
function dvBuilder(){ const dv={_list:null}; const api={ requireValueInList:l=>{dv._list=l; return api;}, setAllowInvalid:()=>api, build:()=>({list:dv._list}) }; return api; }
const SpreadsheetApp = { getActiveSpreadsheet:()=>SS, newDataValidation:dvBuilder };
const LockService = { getScriptLock:()=>({ waitLock:()=>true, releaseLock:()=>true, tryLock:()=>true }) };
const Session = { getScriptTimeZone:()=>'America/New_York' };
function fmtDate(d, tz, fmt){ const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const p2=n=>String(n).padStart(2,'0');
  if(fmt==='yyyy-MM-dd') return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate());
  if(fmt==='M/d/yyyy') return (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
  if(fmt==='MMM d, yyyy') return M[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear();
  return String(d); }
const sent=[];
const Utilities = { formatDate:fmtDate, newBlob:(h,t,n)=>({ getAs:()=>({ setName:()=>({_pdf:true}) }) }), base64Decode:s=>Buffer.from(s,'base64') };
const MailApp = { sendEmail:o=>sent.push(o) };
const DriveApp = { Access:{ANYONE_WITH_LINK:'a'}, Permission:{VIEW:'v'}, createFile:()=>({ setName:function(){return this;}, setSharing:function(){return this;}, getId:()=>'logofile' }), getFileById:()=>({ setTrashed:()=>{} }) };
const HtmlService = { createHtmlOutputFromFile:()=>({ setTitle:function(){return this;}, addMetaTag:function(){return this;} }) };

const ctx = { SpreadsheetApp, LockService, Session, Utilities, MailApp, DriveApp, HtmlService, Date, Math, JSON, String, Number, Object, Array, Boolean, parseInt, isNaN, console };
vm.createContext(ctx);
['db.gs','setup.gs','Api.gs'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'), ctx));
const call=(name,...args)=>{ ctx.__a=args; return vm.runInContext(name+'(...__a)', ctx); };

let pass=0,fail=0; const ok=(c,m)=>{ (c?pass++:fail++); console.log((c?'  ✓ ':'  ✗ FAIL ')+m); };

console.log('\n=== setup + bootstrap ===');
call('setupDatabase');
const boot = call('apiBootstrap');
ok(boot.ready===true, 'apiBootstrap ready');
ok(boot.services.length===5, 'bootstrap returns 5 services');
ok(boot.enums.clientStatus.join('|')==='Lead|Active|Inactive|Lost', 'enums surfaced for the UI');
ok(boot.dashboard && boot.dashboard.revLife===0, 'dashboard computed (revLife 0 initially)');

console.log('\n=== give two services a rate ===');
const svc = call('apiListServices', true);
const consult = svc.find(s=>s.name==='Consultation').id;
const standard = svc.find(s=>s.name==='Standard service').id;
call('apiUpdateService', consult, {rate:90});
call('apiUpdateService', standard, {rate:150});

console.log('\n=== client (Lead) → estimate → approve → invoice → paid, all by ID ===');
const cr = call('apiCreateClient', {name:'Ada Buyer', phone:'(555) 111-2222', email:'ada@x.com', status:'Lead', source:'Web'});
ok(cr.ok && cr.id==='CL-0001', 'apiCreateClient → CL-0001');
const list1 = call('apiListClients');
ok(list1.length===1 && list1[0].status==='Lead', 'apiListClients shows the lead');

const ce = call('apiCreateEstimate', {clientId:cr.id, validDays:14, lines:[{serviceId:consult, qty:1},{serviceId:standard, qty:2}]});
ok(ce.ok && ce.id==='EST-1001', 'apiCreateEstimate → EST-1001');
const billing1 = call('apiListBilling');
ok(billing1.estimates[0].total===390, 'estimate Total cached = 390 (90 + 2*150)');
ok(billing1.estimates[0].client==='Ada Buyer', 'billing row resolves client NAME from ID for display');
const elines = call('apiGetDocLines','ESTIMATE', ce.id);
ok(elines[0].description==='Consultation' && elines[0].rate===90, 'line items snapshot description + rate');
ok(call('apiGetClient', cr.id).status==='Active', 'creating an estimate promoted Lead → Active');

const appr = call('apiApproveEstimate', ce.id, '2026-07-25');
ok(appr.ok && appr.invoiceId==='INV-9001' && appr.jobId==='JOB-00001', 'approve → INV-9001 + JOB-00001');
const billing2 = call('apiListBilling');
const inv = billing2.invoices[0];
ok(inv.total===390, 'invoice copied the quoted lines → Total 390');
ok(inv.jobId==='JOB-00001', 'invoice references the job by ID');
ok(call('apiListJobs')[0].service==='Consultation', 'job snapshotted the primary service name');

ok(call('apiGetClient', cr.id).lifetime===0, 'LifetimeSpent 0 while invoice Draft');
const paid = call('apiMarkInvoicePaid', inv.id);
ok(paid.ok && paid.lifetime===390, 'mark paid → recalc lifetime 390');
ok(call('apiGetClient', cr.id).lifetime===390, 'client LifetimeSpent cached = 390');

console.log('\n=== dashboard reflects the paid invoice (script-computed) ===');
const dash = call('apiDashboard');
ok(dash.revLife===390, 'dashboard revLife = 390');
ok(dash.unpaid===0, 'dashboard unpaid = 0 (invoice is Paid)');
ok(dash.jobsWeek===0, 'jobsWeek 0 (job is 7/25, outside this test week unless run then) — value='+dash.jobsWeek);

console.log('\n=== client detail surfaces upcoming job + open/unpaid docs ===');
const cv = call('apiGetClient', cr.id);
ok(cv.nextJob && cv.nextJob.id==='JOB-00001', 'client view shows upcoming job');
ok(cv.unpaidInvoice===null, 'no unpaid invoice after payment');

console.log('\n=== integrity ===');
let threw=false; try{ call('apiCreateJob',{clientId:'CL-404', serviceId:standard, date:'2026-07-20'}); }catch(e){ threw=true; }
ok(threw, 'apiCreateJob with a bogus clientId is rejected by FK validation');
const del = call('apiDeleteDoc','INVOICE', inv.id);
ok(del.ok && call('apiGetClient',cr.id).lifetime===0, 'deleting the paid invoice recalculated lifetime to 0');

console.log('\n=== business settings: tab, tax, numbering ===');
ok(SS.getSheetByName('Business Settings')!==null, 'settings tab is named "Business Settings"');
ok(SS.getSheetByName('Settings')===null, 'old "Settings" tab name is gone');

// tax now applies to totals
call('apiSaveSettings', {'Sales tax %': 8});
const ce2 = call('apiCreateEstimate', {clientId:'CL-0001', lines:[{serviceId:standard, qty:1}]});
const est2 = call('apiListBilling').estimates.find(e=>e.id===ce2.id);
ok(est2.subtotal===150 && est2.tax===12 && est2.total===162, 'tax applied: subtotal 150, tax 12, total 162 (8%)');

// numbering lives in Business Settings, shows the live next number, and jumps forward safely
const st = call('apiGetSettings');
ok(st['Estimate starting number']===1003, 'settings expose live next estimate number (1003) — got '+st['Estimate starting number']);
call('apiSaveSettings', {'Invoice starting number': 9500});
const appr2 = call('apiApproveEstimate', ce2.id, '2026-08-01');
ok(appr2.invoiceId==='INV-9500', 'invoice numbering jumped to 9500 from Business Settings — got '+appr2.invoiceId);
const inv2 = call('apiListBilling').invoices.find(i=>i.id===appr2.invoiceId);
ok(inv2.total===162 && inv2.tax===12, 'approved invoice carries tax (total 162)');
call('apiSaveSettings', {'Invoice starting number': 100});
ok(call('apiGetSettings')['Invoice starting number']>=9501, 'counter refuses to move below already-issued numbers');

console.log('\n=== review fixes (api) ===');
// H2: cannot archive a client that still has active work
const cg=call('apiCreateClient',{name:'Guarded',status:'Active'});
call('apiCreateEstimate',{clientId:cg.id,lines:[{serviceId:standard,qty:1}]});
ok(call('apiArchiveClient',cg.id).ok===false,'H2: archiving a client with an active estimate is blocked');
// H3: an estimate keeps its snapshotted tax rate even after the global setting changes
call('apiSaveSettings',{'Sales tax %':10});
const ce3=call('apiCreateEstimate',{clientId:'CL-0001',lines:[{serviceId:standard,qty:1}]});   // stamps 10%
call('apiSaveSettings',{'Sales tax %':0});                                                       // change setting AFTER
call('apiSetDocLines','ESTIMATE',ce3.id,[{serviceId:standard,qty:1}]);                           // recompute
const est3=call('apiListBilling').estimates.find(e=>e.id===ce3.id);
ok(est3.tax===15 && est3.total===165,'H3: estimate keeps stamped 10% after setting→0 (150→165, tax 15)');
// M4: the invoice links back to its originating estimate and inherits its tax rate
const appr3=call('apiApproveEstimate',ce3.id,'2026-08-01');
const inv3=call('apiListBilling').invoices.find(i=>i.id===appr3.invoiceId);
ok(inv3.estimateId===ce3.id,'M4: invoice.estimateId links to the originating estimate');
ok(inv3.taxRate===10 && inv3.total===165,'M4/H3: approved invoice inherits the quoted 10% (total 165)');
// L1: numeric settings are sanitized on save
call('apiSaveSettings',{'Sales tax %':'8%'});
ok(Number(call('apiGetSettings')['Sales tax %'])===8,'L1: "8%" sanitized to numeric 8');

console.log('\n=== code-review fixes ===');
// B2: per-client grouping isolates each client's activity (O(n), no cross-contamination)
const cA=call('apiCreateClient',{name:'Alpha',status:'Active'});
const cB=call('apiCreateClient',{name:'Beta',status:'Active'});
call('apiCreateEstimate',{clientId:cA.id,lines:[{serviceId:standard,qty:1}]});
call('apiCreateJob',{clientId:cB.id,serviceId:standard,date:'2026-12-01'});
const lc=call('apiListClients');
const va=lc.find(c=>c.id===cA.id), vb=lc.find(c=>c.id===cB.id);
ok(va.openEstimate && !va.nextJob, 'B2: client A sees only its own estimate (grouping isolates)');
ok(vb.nextJob && !vb.openEstimate, 'B2: client B sees only its own job');

console.log('\n=== RESULT: '+pass+' passed, '+fail+' failed ===');
process.exit(fail?1:0);
