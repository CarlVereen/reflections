// Generate current listing screenshots of the REAL app UI (WebApp.html) driven by a rich in-memory
// demo dataset. Runs headless via Playwright. Output → assets/app-*.png (phone-framed).
//   node tests/screenshots.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const HTML = fs.readFileSync(path.join(__dirname, '..', 'WebApp.html'), 'utf8');
const OUT = path.join(__dirname, '..', 'assets');
const LAT = 40;

// Dates are computed relative to the real clock at run time so demo data always lands in the right
// "this week / this month / last 7 days" buckets no matter when it runs.
const STUB = `
window.__served=[];
function D(off){var d=new Date();d.setDate(d.getDate()+off);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function MD(off){var d=new Date();d.setDate(d.getDate()+off);return (d.getMonth()+1)+'/'+d.getDate();}
var Q = {
  clients:[
    {id:'CL-0001',name:'Marcus Bell',phone:'(520) 203-8871',email:'marcus@example.com',address:'482 Willow Creek Dr, Tucson AZ 85718',status:'Active',source:'Referral',followUp:MD(0),followUpISO:D(0),notes:'',createdISO:D(-40)},
    {id:'CL-0002',name:'Priya Shah',phone:'(520) 661-2049',email:'priya@example.com',address:'1170 E Speedway Blvd, Tucson AZ 85719',status:'Lead',source:'Web form',followUp:MD(0),followUpISO:D(0),notes:'',createdISO:D(-2)},
    {id:'CL-0003',name:'Dana Ruiz',phone:'(520) 448-1120',email:'dana@example.com',address:'6002 N Oracle Rd, Tucson AZ 85704',status:'Active',source:'Google',followUp:'',followUpISO:'',notes:'',createdISO:D(-60)},
    {id:'CL-0004',name:'Alex Kim',phone:'(520) 771-3390',email:'alex@example.com',address:'350 S Craycroft Rd, Tucson AZ 85711',status:'Lead',source:'Instagram',followUp:MD(1),followUpISO:D(1),notes:'',createdISO:D(-4)},
    {id:'CL-0005',name:'Sofia Marino',phone:'(520) 512-8807',email:'sofia@example.com',address:'88 W Ina Rd, Tucson AZ 85704',status:'Active',source:'Referral',followUp:'',followUpISO:'',notes:'',createdISO:D(-90)},
    {id:'CL-0006',name:'Terrence Wolfe',phone:'(520) 337-0064',email:'terrence@example.com',address:'910 N Swan Rd, Tucson AZ 85711',status:'Inactive',source:'Google',followUp:'',followUpISO:'',notes:'',createdISO:D(-200)},
    {id:'CL-0007',name:'Jenna Ford',phone:'(520) 209-4415',email:'jenna@example.com',address:'25 W Grant Rd, Tucson AZ 85705',status:'Lost',source:'Web form',followUp:'',followUpISO:'',notes:'',createdISO:D(-120)},
    {id:'CL-0008',name:'Omar Haddad',phone:'(520) 884-7712',email:'omar@example.com',address:'4400 E Broadway Blvd, Tucson AZ 85711',status:'Lead',source:'Referral',followUp:MD(2),followUpISO:D(2),notes:'',createdISO:D(-1)}
  ],
  jobs:[
    {id:'JOB-00001',clientId:'CL-0001',serviceId:'SVC-03',service:'Full detail',dateISO:D(1),date:MD(1),time:'9am',status:'Scheduled',recurring:'Monthly'},
    {id:'JOB-00002',clientId:'CL-0003',serviceId:'SVC-02',service:'Standard detail',dateISO:D(2),date:MD(2),time:'1pm',status:'Scheduled',recurring:'None'},
    {id:'JOB-00003',clientId:'CL-0005',serviceId:'SVC-04',service:'Ceramic coating',dateISO:D(3),date:MD(3),time:'8am',status:'Scheduled',recurring:'None'},
    {id:'JOB-00004',clientId:'CL-0002',serviceId:'SVC-01',service:'Consultation',dateISO:D(0),date:MD(0),time:'4pm',status:'Scheduled',recurring:'None'},
    {id:'JOB-00005',clientId:'CL-0006',serviceId:'SVC-02',service:'Standard detail',dateISO:D(-6),date:MD(-6),time:'10am',status:'Done',recurring:'None'}
  ],
  estimates:[
    {id:'EST-1042',clientId:'CL-0004',status:'Sent',issueISO:D(-2)},
    {id:'EST-1043',clientId:'CL-0008',status:'Draft',issueISO:D(-1)}
  ],
  invoices:[
    {id:'INV-9012',clientId:'CL-0001',jobId:'JOB-00005',status:'Paid',issueISO:D(-5)},
    {id:'INV-9013',clientId:'CL-0003',jobId:'',status:'Paid',issueISO:D(-3)},
    {id:'INV-9014',clientId:'CL-0005',jobId:'',status:'Sent',issueISO:D(-1)},
    {id:'INV-9010',clientId:'CL-0006',jobId:'',status:'Paid',issueISO:D(-40)}
  ],
  lineItems:[
    {id:'LI-1',DocType:'Estimate',DocID:'EST-1042',serviceId:'SVC-03',description:'Full detail',qty:1,rate:320},
    {id:'LI-2',DocType:'Estimate',DocID:'EST-1043',serviceId:'SVC-04',description:'Ceramic coating',qty:1,rate:650},
    {id:'LI-3',DocType:'Invoice',DocID:'INV-9012',serviceId:'SVC-02',description:'Standard detail',qty:1,rate:180},
    {id:'LI-4',DocType:'Invoice',DocID:'INV-9013',serviceId:'SVC-03',description:'Full detail',qty:1,rate:320},
    {id:'LI-5',DocType:'Invoice',DocID:'INV-9014',serviceId:'SVC-04',description:'Ceramic coating',qty:1,rate:650},
    {id:'LI-6',DocType:'Invoice',DocID:'INV-9010',serviceId:'SVC-03',description:'Full detail',qty:1,rate:320}
  ],
  services:[
    {id:'SVC-01',name:'Consultation',rate:0,active:true},
    {id:'SVC-02',name:'Standard detail',rate:180,active:true},
    {id:'SVC-03',name:'Full detail',rate:320,active:true},
    {id:'SVC-04',name:'Ceramic coating',rate:650,active:true},
    {id:'SVC-05',name:'Maintenance wash',rate:60,active:true}
  ],
  settings:{'Business name':'Summit Detailing Co.','Currency symbol':'$','Accent color':'#8f5f22','Sales tax %':8,'Invoice due (days)':14,'Sync jobs to Google Calendar':'yes','Default job duration (hours)':2,'Google review link':'https://g.page/r/example','Payment link':'paypal.me/summitdetailing'},
  seq:{CL:9,JOB:6,EST:1044,INV:9015,LI:7} };
function r2(n){return Math.round(n*100)/100;}
function docTotals(dt,id){var li=Q.lineItems.filter(function(l){return l.DocType===dt&&l.DocID===id;});var sub=r2(li.reduce(function(s,l){return s+l.qty*l.rate;},0));var tax=r2(sub*(Number(Q.settings['Sales tax %'])||0)/100);return {subtotal:sub,tax:tax,total:r2(sub+tax)};}
function nameOf(id){var c=Q.clients.filter(function(x){return x.id===id;})[0];return c?c.name:'';}
function clientView(c){var t=docTotals;var up=Q.jobs.filter(function(j){return j.clientId===c.id&&j.status==='Scheduled';})[0];
  var oe=Q.estimates.filter(function(e){return e.clientId===c.id&&(e.status==='Draft'||e.status==='Sent');})[0];
  var ui=Q.invoices.filter(function(i){return i.clientId===c.id&&i.status!=='Paid'&&i.status!=='Draft';})[0];
  var life=Q.invoices.filter(function(i){return i.clientId===c.id&&i.status==='Paid';}).reduce(function(s,i){return s+t('Invoice',i.id).total;},0);
  return {id:c.id,name:c.name,phone:c.phone,email:c.email,address:c.address,status:c.status,source:c.source,notes:c.notes,followUp:c.followUp,followUpISO:c.followUpISO,createdISO:c.createdISO,lifetime:life,
    nextJob:up?{id:up.id,date:up.date,service:up.service}:null,openEstimate:oe?{id:oe.id,total:t('Estimate',oe.id).total}:null,unpaidInvoice:ui?{id:ui.id,total:t('Invoice',ui.id).total,status:ui.status}:null};}
function docView(kind,d){var dt=docTotals(kind==='INVOICE'?'Invoice':'Estimate',d.id);return {kind:kind,id:d.id,clientId:d.clientId,client:nameOf(d.clientId),jobId:d.jobId||'',subtotal:dt.subtotal,tax:dt.tax,total:dt.total,status:d.status,issueDate:d.issueISO||'',issueISO:d.issueISO||''};}
var SERVER = {
  apiBootstrap:function(){return {ready:true,settings:Q.settings,services:Q.services,servicesAll:Q.services,enums:{clientStatus:['Lead','Active','Inactive','Lost'],jobStatus:['Scheduled','Done','Cancelled'],estStatus:['Draft','Sent','Accepted','Declined'],invStatus:['Draft','Sent','Paid','Overdue'],recurring:['None','Weekly','Monthly','Quarterly','Annual']},dashboard:null};},
  apiListClients:function(){return Q.clients.map(clientView);},
  apiGetClient:function(id){var c=Q.clients.filter(function(x){return x.id===id;})[0];return c?clientView(c):null;},
  apiListServices:function(){return Q.services;},
  apiListJobs:function(){return Q.jobs.map(function(j){return {id:j.id,clientId:j.clientId,client:nameOf(j.clientId),serviceId:j.serviceId,service:j.service,date:j.date,dateISO:j.dateISO,time:j.time,status:j.status,recurring:j.recurring};});},
  apiListBilling:function(){return {estimates:Q.estimates.map(function(e){return docView('ESTIMATE',e);}),invoices:Q.invoices.map(function(i){return docView('INVOICE',i);})};},
  apiGetDocLines:function(kind,id){var dt=kind==='INVOICE'?'Invoice':'Estimate';return Q.lineItems.filter(function(l){return l.DocType===dt&&l.DocID===id;}).map(function(l){return {id:l.id,serviceId:l.serviceId,description:l.description,qty:l.qty,rate:l.rate,lineTotal:r2(l.qty*l.rate)};});},
  apiGetSettings:function(){return Q.settings;},
  apiGetLogo:function(){return {logo:''};}
};
window.google={script:{run:(function(){function make(){var s=null,f=null;var r={withSuccessHandler:function(fn){s=fn;return r;},withFailureHandler:function(fn){f=fn;return r;}};
 Object.keys(SERVER).forEach(function(fn){r[fn]=function(){var a=[].slice.call(arguments);setTimeout(function(){try{s&&s(SERVER[fn].apply(null,a));}catch(e){f&&f(e);}},${LAT});return r;};});return r;}
 return new Proxy({},{get:function(_,p){return make()[p];}});})()}};
`;

(async () => {
  const wired = HTML.replace('<script>', () => '<script>\n' + STUB + '\n');
  const tmp = path.join(__dirname, 'webapp-shots.html'); fs.writeFileSync(tmp, wired);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 430, height: 920 }, deviceScaleFactor: 2 });
  const wait = (ms) => page.waitForTimeout(ms);
  await page.goto('file://' + tmp, { waitUntil: 'domcontentloaded' });
  await wait(LAT + 500);
  const shot = (name) => page.screenshot({ path: path.join(OUT, name) });

  // preload the data-backed screens so the home dashboard can compute rich KPIs
  await page.evaluate(() => nav('clients')); await wait(LAT + 250);
  await page.evaluate(() => nav('jobs')); await wait(LAT + 250);
  await page.evaluate(() => nav('billing')); await wait(LAT + 250);

  await page.evaluate(() => nav('clients')); await wait(300); await shot('app-clients.png');
  await page.evaluate(() => openClient('CL-0001')); await wait(300); await shot('app-client.png');
  await page.evaluate(() => closeModal());
  await page.evaluate(() => { nav('jobs'); setJobTab('upcoming'); }); await wait(300); await shot('app-jobs.png');
  await page.evaluate(() => nav('billing')); await wait(300); await shot('app-billing.png');
  await page.evaluate(() => nav('settings')); await wait(400);
  await page.evaluate(() => { var h=[].slice.call(document.querySelectorAll('#settingsBody h2')).filter(function(e){return /Scheduling/.test(e.textContent);})[0]; if(h)h.scrollIntoView(); });
  await wait(200); await shot('app-settings.png');
  await page.evaluate(() => { nav('home'); loadHome(); }); await wait(400); await shot('app-home.png');

  console.log('Wrote app-home/clients/client/jobs/billing/settings.png to assets/');
  fs.unlinkSync(tmp);
  await browser.close();
})().catch(e => { console.error('SHOTS FAIL', e); process.exit(1); });
