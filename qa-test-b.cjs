const puppeteer = require('puppeteer-core');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL_B = 'https://app-git-design-b-jurilegals-projects.vercel.app';
const results = { pass: [], fail: [], warn: [] };

function log(s, t, d) { d=d||''; results[s].push({test:t,detail:d}); console.log((s==='pass'?'✅':s==='fail'?'❌':'⚠️')+' '+t+(d?' — '+d:'')); }

async function run() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const V = 'B';

  // Public pages
  for (const p of ['/','/login','/register','/register/mandant','/register/anwalt','/verify-email','/faq','/so-funktionierts','/anwaelte','/impressum','/datenschutz','/agb','/widerruf']) {
    try { const r = await page.goto(URL_B+p, {waitUntil:'networkidle2',timeout:15000}); log(r.status()===200?'pass':'fail','[B] '+p,'Status: '+r.status()); } catch(e) { log('fail','[B] '+p,e.message); }
  }

  // Mandant
  await page.goto(URL_B+'/login',{waitUntil:'networkidle2',timeout:15000});
  for(const i of await page.$$('input')){await i.click({clickCount:3});await i.press('Backspace');}
  await page.type('input[type="email"]','mandant@juri-legal.com');
  await page.type('input[type="password"]','JuriMandant2026!');
  await page.click('button[type="submit"]');
  await new Promise(r=>setTimeout(r,5000));
  log(page.url().includes('mandant')?'pass':'warn','[B] Mandant Login',page.url());
  for(const p of ['/mandant/dashboard','/mandant/beratungen','/mandant/bewertungen','/mandant/coins','/mandant/zahlungen','/mandant/portal']){
    try{const r=await page.goto(URL_B+p,{waitUntil:'networkidle2',timeout:15000});log(r.status()===200?'pass':'fail','[B] '+p,'Status: '+r.status());}catch(e){log('fail','[B] '+p,e.message);}
  }

  // Anwalt
  await page.goto(URL_B+'/login',{waitUntil:'networkidle2',timeout:15000});
  for(const i of await page.$$('input')){await i.click({clickCount:3});await i.press('Backspace');}
  await page.type('input[type="email"]','anwalt@juri-legal.com');
  await page.type('input[type="password"]','JuriAnwalt2026!');
  await page.click('button[type="submit"]');
  await new Promise(r=>setTimeout(r,5000));
  log(page.url().includes('anwalt')?'pass':'warn','[B] Anwalt Login',page.url());
  const allPages = [
    '/anwalt/dashboard','/anwalt/profil','/anwalt/verfuegbarkeit','/anwalt/beratungen','/anwalt/einnahmen','/anwalt/preise','/anwalt/dokumente','/anwalt/bewertungen','/anwalt/support','/anwalt/abo','/anwalt/migration',
    '/anwalt/kanzlei','/anwalt/kanzlei/mandanten','/anwalt/kanzlei/akten','/anwalt/kanzlei/aktenvorlagen','/anwalt/kanzlei/fristen','/anwalt/kanzlei/zeiterfassung','/anwalt/kanzlei/rechnungen','/anwalt/kanzlei/offene-posten','/anwalt/kanzlei/rvg','/anwalt/kanzlei/kontakte','/anwalt/kanzlei/kollision','/anwalt/kanzlei/vorlagen','/anwalt/kanzlei/mahnwesen','/anwalt/kanzlei/wissen','/anwalt/kanzlei/ki','/anwalt/kanzlei/mandatsannahme','/anwalt/kanzlei/reporting','/anwalt/kanzlei/forderungen','/anwalt/kanzlei/workflows','/anwalt/kanzlei/wiedervorlagen','/anwalt/kanzlei/dokument-viewer','/anwalt/kanzlei/kalender','/anwalt/kanzlei/textbausteine','/anwalt/kanzlei/einstellungen','/anwalt/kanzlei/email','/anwalt/kanzlei/fibu','/anwalt/kanzlei/suche','/anwalt/kanzlei/bea','/anwalt/kanzlei/datev','/anwalt/kanzlei/recherche'
  ];
  for(const p of allPages){
    try{const r=await page.goto(URL_B+p,{waitUntil:'networkidle2',timeout:15000});log(r.status()===200?'pass':'fail','[B] '+p,'Status: '+r.status());}catch(e){log('fail','[B] '+p,e.message);}
  }

  // Admin
  await page.goto(URL_B+'/login',{waitUntil:'networkidle2',timeout:15000});
  for(const i of await page.$$('input')){await i.click({clickCount:3});await i.press('Backspace');}
  await page.type('input[type="email"]','admin@juri-legal.com');
  await page.type('input[type="password"]','JuriAdmin2026!');
  await page.click('button[type="submit"]');
  await new Promise(r=>setTimeout(r,5000));
  for(const p of ['/admin/dashboard','/admin/aufgaben','/admin/konten','/admin/verifizierung','/admin/finanzen','/admin/auszahlungen','/admin/personal','/admin/vertraege','/admin/marketing','/admin/newsletter','/admin/affiliates']){
    try{const r=await page.goto(URL_B+p,{waitUntil:'networkidle2',timeout:15000});log(r.status()===200?'pass':'fail','[B] '+p,'Status: '+r.status());}catch(e){log('fail','[B] '+p,e.message);}
  }

  console.log('\n=== SUMMARY ===');
  console.log('PASS: '+results.pass.length+' | FAIL: '+results.fail.length+' | WARN: '+results.warn.length);
  if(results.fail.length){console.log('\nFAILURES:');results.fail.forEach(f=>console.log('  ❌ '+f.test+': '+f.detail));}
  await browser.close();
}
run().catch(console.error);
