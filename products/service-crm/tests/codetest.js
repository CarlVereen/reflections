// Sandbox for Code.gs automations + form intake, over db.gs/setup.gs/Api.gs.
const fs = require('fs'), vm = require('vm'), path = require('path');
function colNum(l){ let n=0; for(const ch of l) n=n*26+(ch.charCodeAt(0)-64); return n; }
class Sheet {
  constructor(n){ this.name=n; this.data=[]; this.frozen=0; this.hidden=false; this.colFmt={}; this.colValid={}; }
  _ensure(r,c){ while(this.data.length<r) this.data.push([]); const row=this.data[r-1]; while(row.length<c) row.push(''); }
  getName(){ return this.name; } clear(){ this.data=[]; return this; }
  setFrozenRows(n){ this.frozen=n; return this; } getFrozenRows(){ return this.frozen; }
  hideSheet(){ this.hidden=true; return this; } isSheetHidden(){ return this.hidden; } setColumnWidth(){ return this; }
  getMaxRows(){ return Math.max(1000,this.data.length); } getMaxColumns(){ return Math.max(26,this.data.reduce((m,r)=>Math.max(m,r.length),0)); }
  getLastRow(){ let last=0; for(let r=0;r<this.data.length;r++){ if((this.data[r]||[]).some(v=>v!=='' && v!=null)) last=r+1; } return last; }
  getLastColumn(){ return this.data.reduce((m,r)=>Math.max(m,r.length),0); }
  appendRow(a){ const r=this.getLastRow()+1; this._ensure(r,a.length); for(let c=0;c<a.length;c++) this.data[r-1][c]=a[c]; return this; }
  getDataRange(){ return this.getRange(1,1,Math.max(1,this.getLastRow()),Math.max(1,this.getLastColumn())); }
  getRange(a,b,c,d){ if(typeof a==='string'){ let m;
      if(m=a.match(/^([A-Z]+)(\d+):([A-Z]+)$/)) return new Range(this,{whole:colNum(m[1])});
      if(m=a.match(/^([A-Z]+)(\d+)$/)) return new Range(this,{r:+m[2],c:colNum(m[1]),nr:1,nc:1}); throw new Error('a1 '+a); }
    return new Range(this,{r:a,c:b,nr:c||1,nc:d||1}); }
}
class Range {
  constructor(sh,s){ this.sh=sh; this.s=s; }
  setValues(v){ const {r,c,nr,nc}=this.s; for(let i=0;i<nr;i++){ this.sh._ensure(r+i,c+nc-1); for(let j=0;j<nc;j++) this.sh.data[r+i-1][c+j-1]=v[i][j]; } return this; }
  getValues(){ const {r,c,nr,nc}=this.s; const o=[]; for(let i=0;i<nr;i++){ const row=[]; for(let j=0;j<nc;j++){ const rr=this.sh.data[r+i-1]||[]; const v=rr[c+j-1]; row.push(v===undefined?'':v); } o.push(row); } return o; }
  setValue(v){ this.s.nr=1; this.s.nc=1; return this.setValues([[v]]); } getValue(){ return this.getValues()[0][0]; }
  setNumberFormat(f){ if(this.s.whole) this.sh.colFmt[this.s.whole]=f; return this; }
  setFontWeight(){ return this; } setBackground(){ return this; } insertCheckboxes(){ return this; }
  setDataValidation(){ return this; } clearDataValidations(){ return this; }
}
class SS0 { constructor(){ this.sheets=[]; this.active=null; }
  getSheetByName(n){ return this.sheets.find(s=>s.name===n)||null; }
  insertSheet(n){ const s=new Sheet(n); this.sheets.push(s); this.active=s; return s; }
  deleteSheet(s){ this.sheets=this.sheets.filter(x=>x!==s); } setActiveSheet(s){ this.active=s; return s; } moveActiveSheet(){} getId(){ return 'F'; } }
const SS = new SS0();
function dv(){ const o={}; const api={ requireValueInList:l=>{o.l=l; return api;}, requireCheckbox:()=>api, setAllowInvalid:()=>api, build:()=>o }; return api; }
const SpreadsheetApp = { getActiveSpreadsheet:()=>SS, newDataValidation:dv, getUi:()=>({ alert:()=>1, ButtonSet:{OK:1,OK_CANCEL:2}, Button:{OK:1}, createMenu:()=>({addItem(){return this;},addSeparator(){return this;},addSubMenu(){return this;},addToUi(){}}) }) };
const LockService = { getScriptLock:()=>({ waitLock:()=>1, releaseLock:()=>1 }) };
const Session = { getScriptTimeZone:()=>'America/New_York', getActiveUser:()=>({ getEmail:()=>'owner@biz.com' }) };
function fmtDate(d,tz,f){ const M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const W=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; const p=n=>String(n).padStart(2,'0');
  if(f==='yyyy-MM-dd') return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate());
  if(f==='M/d/yyyy') return (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
  if(f==='MMM d, yyyy') return M[d.getMonth()]+' '+d.getDate()+', '+d.getFullYear();
  if(f==='EEEE, MMM d') return W[d.getDay()]+', '+M[d.getMonth()]+' '+d.getDate();
  return String(d); }
const Utilities = { formatDate:fmtDate, newBlob:()=>({getAs:()=>({setName:()=>({})})}), base64Decode:s=>Buffer.from(s,'base64') };
const mails=[]; const MailApp = { sendEmail:function(){ mails.push(arguments.length===1?arguments[0]:(arguments[0].to?arguments[0]:{to:arguments[0]})); } };
const ScriptApp = { getProjectTriggers:()=>[], newTrigger:()=>({ timeBased:()=>({ atHour:()=>({ everyDays:()=>({ create:()=>1 }) }) }), forForm:()=>({ onFormSubmit:()=>({ create:()=>1 }) }) }), deleteTrigger:()=>1, getService:()=>({ getUrl:()=>'' }) };
const DriveApp = { Access:{ANYONE_WITH_LINK:1}, Permission:{VIEW:1}, createFile:()=>({ setName(){return this;}, setSharing(){return this;}, getId:()=>'x' }), getFileById:()=>({ setTrashed(){} }) };
const HtmlService = { createHtmlOutputFromFile:()=>({ setTitle(){return this;}, addMetaTag(){return this;} }) };
const FormApp = { create:()=>({ setDescription(){return this;}, addTextItem:()=>({setTitle(){return this;},setRequired(){return this;}}), addParagraphTextItem:()=>({setTitle(){return this;}}), getPublishedUrl:()=>'https://form' }) };

const ctx = { SpreadsheetApp, LockService, Session, Utilities, MailApp, ScriptApp, DriveApp, HtmlService, FormApp, Date, Math, JSON, String, Number, Object, Array, Boolean, parseInt, isNaN, console };
vm.createContext(ctx);
['db.gs','setup.gs','Api.gs','Code.gs'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'), ctx));
const call=(n,...a)=>{ ctx.__a=a; return vm.runInContext(n+'(...__a)', ctx); };
let pass=0,fail=0; const ok=(c,m)=>{ (c?pass++:fail++); console.log((c?'  ✓ ':'  ✗ FAIL ')+m); };
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=new Date(); today.setHours(0,0,0,0);
const addD=(n)=>{ const d=new Date(today); d.setDate(d.getDate()+n); return d; };

call('setupDatabase');
const svc = call('apiListServices',true)[0].id;
call('apiUpdateService', svc, {rate:100});
const c1 = call('apiCreateClient', {name:'Ada Buyer', phone:'(555) 111', email:'ada@x.com', status:'Active'});
call('apiUpdateClient', c1.id, {NextFollowUp: iso(addD(-1))});   // follow-up due yesterday

console.log('\n=== markOverdueInvoices ===');
call('insert','Invoices',{ClientID:c1.id, IssueDate:addD(-30), DueDate:addD(-1), Status:'Sent'});
ok(call('markOverdueInvoices')===1, 'flags 1 Sent invoice past due');
ok(call('getAll','Invoices')[0].Status==='Overdue', 'invoice now Overdue');

console.log('\n=== rollForwardRecurringJobs (idempotent) ===');
call('insert','Jobs',{ClientID:c1.id, ServiceID:svc, JobDate:addD(-14), Status:'Done', Recurring:'Weekly'});
ok(call('rollForwardRecurringJobs')===1, 'creates next occurrence for a finished weekly job');
const rolled = call('getAll','Jobs').filter(j=>j.Status==='Scheduled' && j.Recurring==='Weekly');
ok(rolled.length===1 && iso(rolled[0].JobDate)===iso(addD(-7)), 'next job is 7 days after the finished one');
ok(call('rollForwardRecurringJobs')===0, 'running again creates nothing (idempotent)');

console.log('\n=== remindUpcomingJobs ===');
mails.length=0;
call('insert','Jobs',{ClientID:c1.id, ServiceID:svc, JobDate:addD(1), ScheduledTime:'2pm', Status:'Scheduled', Recurring:'None'});
ok(call('remindUpcomingJobs')===1, 'sends 1 reminder for a job scheduled tomorrow');
ok(mails.length===1 && mails[0].to==='ada@x.com', 'reminder emailed the client');
ok(call('remindUpcomingJobs')===0, 'does not re-send (ReminderSent set)');

console.log('\n=== sendReviewRequests ===');
call('apiSaveSettings', {'Google review link':'https://g.page/r/abc'});
mails.length=0;
call('insert','Jobs',{ClientID:c1.id, ServiceID:svc, JobDate:addD(-2), Status:'Done', Recurring:'None'});
const rr = call('sendReviewRequests');   // two finished jobs exist for this client (the recurring source + this one)
ok(rr.ok && rr.sent===2, 'sends a review request for each finished job (got '+rr.sent+')');
ok(mails.length===2 && /review/i.test(mails[0].htmlBody||''), 'review emails sent to client');
ok(call('sendReviewRequests').sent===0, 'does not re-send (ReviewSent set)');

console.log('\n=== sendFollowUpDigest ===');
mails.length=0;
const dg = call('sendFollowUpDigest');
ok(dg.ok && dg.count>=1, 'digest reports the due follow-up (count '+dg.count+')');
ok(mails.length===1 && mails[0].to==='owner@biz.com', 'digest emailed the owner');

console.log('\n=== onFormSubmit → new Lead ===');
call('onFormSubmit', { namedValues: { Name:['Bob Prospect'], Phone:['(555) 222'], Email:['bob@x.com'], 'What do you need?':['New fence'] } });
const bob = call('getAll','Clients').find(c=>c.Name==='Bob Prospect');
ok(bob && bob.Status==='Lead' && bob.Source==='Web form', 'form submission created a Lead client (by the app, ID-based)');
ok(bob.Email==='bob@x.com' && String(bob.Notes).indexOf('fence')>=0, 'lead captured email + notes');

console.log('\n=== RESULT: '+pass+' passed, '+fail+' failed ===');
process.exit(fail?1:0);
