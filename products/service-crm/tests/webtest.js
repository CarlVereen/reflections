// Drive the rebuilt WebApp.html against an in-memory mock of the NEW (ID-based) API and assert
// the core buyer flows: boot → add client → build estimate → approve → invoice → mark paid.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const HTML = fs.readFileSync(path.join(__dirname, '..', 'WebApp.html'), 'utf8');
const LAT = 120;

const STUB = `
window.__served = [];
var Q = { clients:[{id:'CL-0001',name:'Ada Buyer',phone:'(555) 111',email:'ada@x.com',address:'12 Oak',status:'Active',source:'Web',followUp:'',followUpISO:'',notes:''}],
  jobs:[{id:'JOB-00001',clientId:'CL-0001',serviceId:'SVC-02',service:'Standard service',dateISO:'2026-07-17',date:'7/17',time:'2pm',status:'Scheduled',recurring:'None',reviewSent:false,reminderSent:false}],
  estimates:[{id:'EST-1001',clientId:'CL-0001',status:'Draft',issueISO:'2026-07-16'}],
  invoices:[], lineItems:[{id:'LI-1',DocType:'Estimate',DocID:'EST-1001',serviceId:'SVC-01',description:'Consultation',qty:1,rate:90},{id:'LI-2',DocType:'Estimate',DocID:'EST-1001',serviceId:'SVC-02',description:'Standard service',qty:2,rate:150}],
  services:[{id:'SVC-01',name:'Consultation',rate:90,active:true},{id:'SVC-02',name:'Standard service',rate:150,active:true}],
  settings:{'Business name':'Meridian Detailing','Currency symbol':'$','Accent color':'#8f5f22','Sales tax %':8,'Invoice due (days)':14},
  seq:{CL:2,JOB:2,EST:1002,INV:9001,LI:3} };
function r2(n){ return Math.round(n*100)/100; }
function docTotals(docType,docId){ var li=Q.lineItems.filter(function(l){return l.DocType===docType&&l.DocID===docId;}); var sub=r2(li.reduce(function(s,l){return s+l.qty*l.rate;},0)); var tax=r2(sub*(Number(Q.settings['Sales tax %'])||0)/100); return {subtotal:sub,tax:tax,total:r2(sub+tax)}; }
function nameOf(id){ var c=Q.clients.filter(function(x){return x.id===id;})[0]; return c?c.name:''; }
function clientView(c){ var t=docTotals; var up=Q.jobs.filter(function(j){return j.clientId===c.id&&j.status==='Scheduled';})[0];
  var oe=Q.estimates.filter(function(e){return e.clientId===c.id&&(e.status==='Draft'||e.status==='Sent');})[0];
  var ui=Q.invoices.filter(function(i){return i.clientId===c.id&&i.status!=='Paid'&&i.status!=='Draft';})[0];
  var life=Q.invoices.filter(function(i){return i.clientId===c.id&&i.status==='Paid';}).reduce(function(s,i){return s+t('Invoice',i.id).total;},0);
  return {id:c.id,name:c.name,phone:c.phone,email:c.email,address:c.address,status:c.status,source:c.source,notes:c.notes,followUp:c.followUp,followUpISO:c.followUpISO,lifetime:life,
    nextJob:up?{id:up.id,date:up.date,service:up.service}:null, openEstimate:oe?{id:oe.id,total:t('Estimate',oe.id).total}:null, unpaidInvoice:ui?{id:ui.id,total:t('Invoice',ui.id).total,status:ui.status}:null}; }
function docView(kind,d){ var dt=docTotals(kind==='INVOICE'?'Invoice':'Estimate',d.id); return {kind:kind,id:d.id,clientId:d.clientId,client:nameOf(d.clientId),jobId:d.jobId||'',subtotal:dt.subtotal,tax:dt.tax,total:dt.total,status:d.status,issueDate:d.issueISO||'',issueISO:d.issueISO||''}; }
var SERVER = {
  apiBootstrap:function(){ return {ready:true,settings:Q.settings,services:Q.services,enums:{clientStatus:['Lead','Active','Inactive','Lost'],jobStatus:['Scheduled','Done','Cancelled'],estStatus:['Draft','Sent','Accepted','Declined'],invStatus:['Draft','Sent','Paid','Overdue'],recurring:['None','Weekly','Monthly','Quarterly','Annual']},dashboard:SERVER.apiDashboard()}; },
  apiDashboard:function(){ return {newLeads:0,unpaid:Q.invoices.filter(function(i){return i.status==='Sent'||i.status==='Overdue';}).reduce(function(s,i){return s+docTotals('Invoice',i.id).total;},0),jobsWeek:Q.jobs.filter(function(j){return j.status==='Scheduled';}).length,revMonth:0,winRate:100,revLife:0,
    followUps:[{id:'CL-0001',name:'Ada Buyer',phone:'(555) 111',status:'Active',due:'7/16'}],
    weekJobs:Q.jobs.filter(function(j){return j.status==='Scheduled';}).map(function(j){return {id:j.id,client:nameOf(j.clientId),date:j.date,time:j.time,service:j.service,status:j.status};})}; },
  apiListClients:function(){ return Q.clients.map(clientView); },
  apiGetClient:function(id){ var c=Q.clients.filter(function(x){return x.id===id;})[0]; return c?clientView(c):null; },
  apiCreateClient:function(f){ var id='CL-'+String(Q.seq.CL++).padStart(4,'0'); var c={id:id,name:f.name,phone:f.phone||'',email:f.email||'',address:f.address||'',status:f.status||'Lead',source:f.source||'',notes:'',followUp:'',followUpISO:''}; Q.clients.push(c); return {ok:true,id:id,client:clientView(c)}; },
  apiSetClientStatus:function(id,st){ var c=Q.clients.filter(function(x){return x.id===id;})[0]; if(c)c.status=st; return {ok:true}; },
  apiSetClientFollowUp:function(id,iso){ var c=Q.clients.filter(function(x){return x.id===id;})[0]; if(c){c.followUpISO=iso;c.followUp=iso;} return {ok:true}; },
  apiUpdateClient:function(id,p){ var c=Q.clients.filter(function(x){return x.id===id;})[0]; if(c)Object.keys(p).forEach(function(k){c[k.toLowerCase()]=p[k];}); return {ok:true}; },
  apiArchiveClient:function(id){ Q.clients=Q.clients.filter(function(x){return x.id!==id;}); return {ok:true}; },
  apiListServices:function(){ return Q.services; },
  apiListJobs:function(){ return Q.jobs.map(function(j){return {id:j.id,clientId:j.clientId,client:nameOf(j.clientId),serviceId:j.serviceId,service:j.service,date:j.date,dateISO:j.dateISO,time:j.time,status:j.status,recurring:j.recurring};}); },
  apiCreateJob:function(f){ var id='JOB-'+String(Q.seq.JOB++).padStart(5,'0'); var svc=Q.services.filter(function(s){return s.id===f.serviceId;})[0]; var j={id:id,clientId:f.clientId,serviceId:f.serviceId,service:svc?svc.name:'',date:f.date,dateISO:f.date,time:f.time||'',status:'Scheduled',recurring:f.recurring||'None'}; Q.jobs.push(j); return {ok:true,id:id,job:j}; },
  apiUpdateJob:function(id,p){ var j=Q.jobs.filter(function(x){return x.id===id;})[0]; if(j){ if(p.Status)j.status=p.Status; if(p.date){j.dateISO=p.date;j.date=p.date;} if(p.time!==undefined)j.time=p.time; } return {ok:true}; },
  apiArchiveJob:function(id){ Q.jobs=Q.jobs.filter(function(x){return x.id!==id;}); return {ok:true}; },
  apiListBilling:function(){ return {estimates:Q.estimates.map(function(e){return docView('ESTIMATE',e);}),invoices:Q.invoices.map(function(i){return docView('INVOICE',i);})}; },
  apiGetDocLines:function(kind,id){ var dt=kind==='INVOICE'?'Invoice':'Estimate'; return Q.lineItems.filter(function(l){return l.DocType===dt&&l.DocID===id;}).map(function(l){return {id:l.id,serviceId:l.serviceId,description:l.description,qty:l.qty,rate:l.rate,lineTotal:r2(l.qty*l.rate)};}); },
  apiCreateEstimate:function(f){ var id='EST-'+String(Q.seq.EST++); var e={id:id,clientId:f.clientId,status:'Draft',issueISO:'2026-07-17'}; Q.estimates.push(e);
    (f.lines||[]).forEach(function(l){ var svc=Q.services.filter(function(s){return s.id===l.serviceId;})[0]; Q.lineItems.push({id:'LI-'+(Q.seq.LI++),DocType:'Estimate',DocID:id,serviceId:l.serviceId,description:svc?svc.name:'',qty:l.qty,rate:svc?svc.rate:0}); });
    var c=Q.clients.filter(function(x){return x.id===f.clientId;})[0]; if(c&&c.status==='Lead')c.status='Active'; return {ok:true,id:id}; },
  apiSetDocLines:function(kind,id,lines){ var dt=kind==='INVOICE'?'Invoice':'Estimate'; Q.lineItems=Q.lineItems.filter(function(l){return !(l.DocType===dt&&l.DocID===id);}); (lines||[]).forEach(function(l){ var svc=Q.services.filter(function(s){return s.id===l.serviceId;})[0]; Q.lineItems.push({id:'LI-'+(Q.seq.LI++),DocType:dt,DocID:id,serviceId:l.serviceId,description:svc?svc.name:'',qty:l.qty,rate:svc?svc.rate:0}); }); return {ok:true}; },
  apiUpdateDoc:function(kind,id,f){ var arr=kind==='INVOICE'?Q.invoices:Q.estimates; var d=arr.filter(function(x){return x.id===id;})[0]; if(d&&f.status)d.status=f.status; return {ok:true}; },
  apiApproveEstimate:function(id,iso){ var e=Q.estimates.filter(function(x){return x.id===id;})[0]; if(!e)return {ok:false,msg:'nf'}; e.status='Accepted';
    var jid='JOB-'+String(Q.seq.JOB++).padStart(5,'0'); var eli=Q.lineItems.filter(function(l){return l.DocType==='Estimate'&&l.DocID===id;}); var svc=eli[0]?eli[0].serviceId:'SVC-01';
    var sv=Q.services.filter(function(s){return s.id===svc;})[0]; Q.jobs.push({id:jid,clientId:e.clientId,serviceId:svc,service:sv?sv.name:'',date:iso,dateISO:iso,time:'',status:'Scheduled',recurring:'None'});
    var inv='INV-'+String(Q.seq.INV++); Q.invoices.push({id:inv,clientId:e.clientId,jobId:jid,status:'Draft',issueISO:'2026-07-17'});
    eli.forEach(function(l){ Q.lineItems.push({id:'LI-'+(Q.seq.LI++),DocType:'Invoice',DocID:inv,serviceId:l.serviceId,description:l.description,qty:l.qty,rate:l.rate}); });
    return {ok:true,invoiceId:inv,jobId:jid}; },
  apiMarkInvoicePaid:function(id){ var i=Q.invoices.filter(function(x){return x.id===id;})[0]; if(i)i.status='Paid'; return {ok:true,lifetime:docTotals('Invoice',id).total}; },
  apiDeleteDoc:function(kind,id){ if(kind==='INVOICE')Q.invoices=Q.invoices.filter(function(x){return x.id!==id;}); else Q.estimates=Q.estimates.filter(function(x){return x.id!==id;}); return {ok:true}; },
  apiSendDoc:function(kind,id){ var arr=kind==='INVOICE'?Q.invoices:Q.estimates; var d=arr.filter(function(x){return x.id===id;})[0]; if(d&&d.status==='Draft')d.status='Sent'; return {ok:true,emailed:true,email:'ada@x.com'}; },
  apiGetSettings:function(){ return Q.settings; },
  apiSaveSettings:function(o){ Object.assign(Q.settings,o); return {ok:true}; },
  apiGetLogo:function(){ return {logo:''}; },
  apiSaveLogo:function(){ return {ok:true}; }
};
window.google={script:{run:(function(){function make(){var s=null,f=null;var r={withSuccessHandler:function(fn){s=fn;return r;},withFailureHandler:function(fn){f=fn;return r;}};
 Object.keys(SERVER).forEach(function(fn){r[fn]=function(){var a=[].slice.call(arguments);window.__served.push({fn:fn,args:a});setTimeout(function(){try{s&&s(SERVER[fn].apply(null,a));}catch(e){f&&f(e);}},${LAT});return r;};});return r;}
 return new Proxy({},{get:function(_,p){return make()[p];}});})()}};
`;

(async () => {
  const wired = HTML.replace('<script>', () => '<script>\n' + STUB + '\n');
  const tmp = path.join(__dirname, 'webapp-wired.html'); fs.writeFileSync(tmp, wired);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 780 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + tmp, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(LAT + 250);
  const served = () => page.evaluate(() => window.__served.map(s => s.fn + '(' + JSON.stringify(s.args) + ')'));
  let pass=0, fail=0; const ok=(c,m)=>{ (c?pass++:fail++); console.log((c?'  ✓ ':'  ✗ FAIL ')+m); };
  const T = (sel)=>page.evaluate(s=>document.querySelector(s)?document.querySelector(s).textContent:'', sel);
  const txt = (sel)=>page.evaluate(s=>(document.querySelector(s)||{}).textContent||'', sel);

  console.log('=== boot / home ===');
  ok(/Meridian Detailing/.test(await txt('#bizName')), 'business name from settings on the topbar');
  ok(/New leads/.test(await txt('#homeBody')) && /Lifetime/.test(await txt('#homeBody')), 'home dashboard tiles render');
  ok(/Ada Buyer/.test(await txt('#homeBody')), 'follow-up + week job show the client name');

  console.log('=== clients ===');
  await page.evaluate(()=>nav('clients')); await page.waitForTimeout(LAT+120);
  ok(/Ada Buyer/.test(await txt('#clientsBody')), 'client list renders');
  await page.evaluate(()=>{ openClientForm(); });
  await page.waitForTimeout(80);
  await page.evaluate(()=>{ document.getElementById('nc_name').value='Bob New'; document.getElementById('nc_email').value='bob@x.com'; window.__served=[]; saveClient(); });
  await page.waitForTimeout(LAT+150);
  const s1 = await served();
  ok(s1.some(x=>x.indexOf('apiCreateClient')===0 && x.indexOf('Bob New')>-1), 'saveClient calls apiCreateClient with the form');
  ok(/Bob New/.test(await txt('#clientsBody')), 'new client appears optimistically');

  console.log('=== build an estimate (client + service line, all IDs) ===');
  await page.evaluate(()=>{ estimateBuilder('CL-0001'); });
  await page.waitForTimeout(80);
  await page.evaluate(()=>{ QLINES=[{serviceId:'SVC-02',qty:2}]; renderQLines(); window.__served=[]; saveEstimate('CL-0001'); });
  await page.waitForTimeout(LAT+200);
  const s2 = await served();
  const est = s2.find(x=>x.indexOf('apiCreateEstimate')===0);
  ok(!!est && /"clientId":"CL-0001"/.test(est) && /"serviceId":"SVC-02"/.test(est), 'apiCreateEstimate sent clientId + serviceId (IDs, not names): '+ (est||'—'));

  console.log('=== billing: totals + tax on doc detail ===');
  await page.evaluate(()=>nav('billing')); await page.waitForTimeout(LAT+150);
  ok(/EST-1001/.test(await txt('#billingBody')), 'billing lists the estimate by ID');
  await page.evaluate(()=>openDoc('ESTIMATE','EST-1001')); await page.waitForTimeout(LAT+200);
  const sheet = await txt('#sheet');
  ok(/Subtotal/.test(sheet) && /Tax/.test(sheet), 'doc detail shows Subtotal + Tax lines');
  ok(/\$421\.20|\$421\.2/.test(sheet.replace(/\s/g,'')) || /421\.20/.test(sheet), 'total is tax-inclusive 421.20 (390 + 8%) — sheet: '+/Total/.test(sheet));

  console.log('=== approve → invoice + job ===');
  await page.evaluate(()=>{ approveEstimate('EST-1001'); });
  await page.waitForTimeout(80);
  await page.evaluate(()=>{ window.__served=[]; doApprove('EST-1001'); });
  await page.waitForTimeout(LAT+250);
  const s3 = await served();
  ok(s3.some(x=>x.indexOf('apiApproveEstimate')===0 && x.indexOf('EST-1001')>-1), 'doApprove calls apiApproveEstimate with the estimate ID');
  await page.waitForTimeout(LAT+150);
  await page.evaluate(()=>{ setBillTab('outstanding'); });
  await page.waitForTimeout(120);
  ok(/INV-9001/.test(await txt('#billingBody')), 'new invoice appears in Outstanding');

  console.log('=== mark invoice paid ===');
  await page.evaluate(()=>openDoc('INVOICE','INV-9001')); await page.waitForTimeout(LAT+200);
  await page.evaluate(()=>{ window.__served=[]; markPaid('INV-9001'); });
  await page.waitForTimeout(LAT+150);
  ok((await served()).some(x=>x.indexOf('apiMarkInvoicePaid')===0 && x.indexOf('INV-9001')>-1), 'markPaid calls apiMarkInvoicePaid with invoice ID');

  console.log('=== jobs + settings render ===');
  await page.evaluate(()=>nav('jobs')); await page.waitForTimeout(LAT+150);
  ok(/Today|Upcoming|Completed/.test(await txt('#jobsBody')), 'jobs tabs render');
  await page.evaluate(()=>nav('settings')); await page.waitForTimeout(LAT+200);
  ok(await page.evaluate(()=>!!document.getElementById('set_accent')), 'settings shows the color picker');
  ok(/Company logo/.test(await txt('#settingsBody')) && /Numbering/.test(await txt('#settingsBody')), 'settings shows logo + numbering sections');

  console.log('=== code-review fixes ===');
  // B1: opening a missing doc must not loop — at most one refetch, then a toast
  await page.evaluate(()=>{ window.__served=[]; openDoc('ESTIMATE','EST-GONE'); });
  await page.waitForTimeout(LAT+300);
  const billCalls = await page.evaluate(()=> window.__served.filter(s=>s.fn==='apiListBilling').length);
  ok(billCalls<=1, 'B1: a missing doc triggers ≤1 refetch, no infinite loop (calls='+billCalls+')');

  // B3: an optimistic create rolls back when the server rejects it (no stuck _saving ghost)
  await page.evaluate(()=>{ window.SERVER.apiCreateJob=function(){ return {ok:false,msg:'server rejected'}; }; });
  await page.evaluate(()=>nav('jobs')); await page.waitForTimeout(LAT+150);
  const jobsBefore = await page.evaluate(()=> (S.jobs||[]).length);
  await page.evaluate(()=>{ openJobForm('CL-0001'); });
  await page.waitForTimeout(80);
  await page.evaluate(()=>{ document.getElementById('nj_service').value='SVC-02'; document.getElementById('nj_date').value='2026-12-05'; saveJob(); });
  const midCount = await page.evaluate(()=> (S.jobs||[]).length);
  await page.waitForTimeout(LAT+350);
  const afterCount = await page.evaluate(()=> (S.jobs||[]).length);
  const ghosts = await page.evaluate(()=> (S.jobs||[]).filter(j=>j._saving).length);
  ok(midCount===jobsBefore+1, 'B3: temp job appears optimistically');
  ok(afterCount===jobsBefore && ghosts===0, 'B3: temp job rolled back after server rejection (no stuck _saving)');

  console.log('\nJS ERRORS: '+(errs.length?JSON.stringify(errs):'none'));
  console.log('=== RESULT: '+pass+' passed, '+fail+' failed'+(errs.length?' (+JS errors!)':'')+' ===');
  await browser.close();
  process.exit((fail||errs.length)?1:0);
})().catch(e=>{ console.error('HARNESS FAIL', e); process.exit(1); });
