const puppeteer = require('puppeteer-core');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL_A = 'https://app-one-tawny-78.vercel.app';
const URL_B = 'https://app-44pfec74g-jurilegals-projects.vercel.app';

const results = { pass: [], fail: [], warn: [] };

function log(status, test, detail) {
  detail = detail || '';
  results[status].push({ test, detail });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(icon + ' ' + test + (detail ? ' — ' + detail : ''));
}

async function testPage(page, version, BASE, path, checks) {
  try {
    const res = await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 15000 });
    const status = res.status();
    if (status !== 200) { log('fail', '[' + version + '] ' + path, 'Status: ' + status); return false; }
    if (checks) {
      const text = await page.$eval('body', function(el) { return el.textContent; });
      const found = checks.filter(function(c) { return text.indexOf(c) !== -1; });
      if (found.length < Math.min(2, checks.length)) {
        log('warn', '[' + version + '] ' + path, 'Keywords: ' + found.join(', '));
        return true;
      }
    }
    log('pass', '[' + version + '] ' + path, 'OK');
    return true;
  } catch (e) { log('fail', '[' + version + '] ' + path, e.message); return false; }
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const entry of [['A', URL_A], ['B', URL_B]]) {
    const version = entry[0], BASE = entry[1];
    console.log('\n' + '='.repeat(60));
    console.log('  TESTING VERSION ' + version + ': ' + BASE);
    console.log('='.repeat(60) + '\n');
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Public pages
    await testPage(page, version, BASE, '/', ['Juri', 'Anwalt']);
    await testPage(page, version, BASE, '/login');
    await testPage(page, version, BASE, '/register');
    await testPage(page, version, BASE, '/register/mandant');
    await testPage(page, version, BASE, '/register/anwalt');
    await testPage(page, version, BASE, '/verify-email');
    await testPage(page, version, BASE, '/faq', ['FAQ', 'Frage']);
    await testPage(page, version, BASE, '/so-funktionierts', ['funktioniert']);
    await testPage(page, version, BASE, '/anwaelte');
    await testPage(page, version, BASE, '/impressum', ['Impressum', 'TMG']);
    await testPage(page, version, BASE, '/datenschutz', ['Datenschutz', 'DSGVO']);
    await testPage(page, version, BASE, '/agb', ['Allgemein', 'Geschäftsbedingungen']);
    await testPage(page, version, BASE, '/widerruf', ['Widerruf']);

    // Check footer links
    try {
      await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 15000 });
      const footerLinks = await page.$$eval('footer a', function(els) { return els.map(function(e) { return e.getAttribute('href'); }); });
      log(footerLinks.some(function(h) { return h && h.indexOf('impressum') !== -1; }) ? 'pass' : 'fail', '[' + version + '] Footer: Impressum-Link');
      log(footerLinks.some(function(h) { return h && h.indexOf('datenschutz') !== -1; }) ? 'pass' : 'fail', '[' + version + '] Footer: Datenschutz-Link');
      log(footerLinks.some(function(h) { return h && h.indexOf('agb') !== -1; }) ? 'pass' : 'fail', '[' + version + '] Footer: AGB-Link');
    } catch(e) { log('warn', '[' + version + '] Footer check', e.message); }

    // Login Mandant
    console.log('\n--- Mandant Login ---');
    try {
      await page.goto(BASE + '/login', { waitUntil: 'networkidle2', timeout: 15000 });
      const inputs = await page.$$('input');
      for (const inp of inputs) { await inp.click({clickCount: 3}); await inp.press('Backspace'); }
      await page.type('input[type="email"]', 'mandant@juri-legal.com');
      await page.type('input[type="password"]', 'JuriMandant2026!');
      await page.click('button[type="submit"]');
      await new Promise(function(r) { setTimeout(r, 5000); });
      const url = page.url();
      log(url.indexOf('mandant') !== -1 ? 'pass' : 'warn', '[' + version + '] Mandant Login', url);

      const mandantPages = ['/mandant/dashboard', '/mandant/beratungen', '/mandant/bewertungen', '/mandant/coins', '/mandant/zahlungen', '/mandant/portal'];
      for (const p of mandantPages) { await testPage(page, version, BASE, p); }
    } catch(e) { log('fail', '[' + version + '] Mandant Login Flow', e.message); }

    // Login Anwalt
    console.log('\n--- Anwalt Login ---');
    try {
      await page.goto(BASE + '/login', { waitUntil: 'networkidle2', timeout: 15000 });
      const inputs2 = await page.$$('input');
      for (const inp of inputs2) { await inp.click({clickCount: 3}); await inp.press('Backspace'); }
      await page.type('input[type="email"]', 'anwalt@juri-legal.com');
      await page.type('input[type="password"]', 'JuriAnwalt2026!');
      await page.click('button[type="submit"]');
      await new Promise(function(r) { setTimeout(r, 5000); });
      log(page.url().indexOf('anwalt') !== -1 ? 'pass' : 'warn', '[' + version + '] Anwalt Login', page.url());

      const anwaltPages = [
        '/anwalt/dashboard', '/anwalt/profil', '/anwalt/verfuegbarkeit', '/anwalt/beratungen',
        '/anwalt/einnahmen', '/anwalt/preise', '/anwalt/dokumente', '/anwalt/bewertungen',
        '/anwalt/support', '/anwalt/abo', '/anwalt/migration'
      ];
      for (const p of anwaltPages) { await testPage(page, version, BASE, p); }

      console.log('\n--- Kanzlei Suite ---');
      const kanzleiPages = [
        '/anwalt/kanzlei', '/anwalt/kanzlei/mandanten', '/anwalt/kanzlei/akten',
        '/anwalt/kanzlei/aktenvorlagen', '/anwalt/kanzlei/fristen', '/anwalt/kanzlei/zeiterfassung',
        '/anwalt/kanzlei/rechnungen', '/anwalt/kanzlei/offene-posten', '/anwalt/kanzlei/rvg',
        '/anwalt/kanzlei/kontakte', '/anwalt/kanzlei/kollision', '/anwalt/kanzlei/vorlagen',
        '/anwalt/kanzlei/mahnwesen', '/anwalt/kanzlei/wissen', '/anwalt/kanzlei/ki',
        '/anwalt/kanzlei/mandatsannahme', '/anwalt/kanzlei/reporting', '/anwalt/kanzlei/forderungen',
        '/anwalt/kanzlei/workflows', '/anwalt/kanzlei/wiedervorlagen', '/anwalt/kanzlei/dokument-viewer',
        '/anwalt/kanzlei/kalender', '/anwalt/kanzlei/textbausteine', '/anwalt/kanzlei/einstellungen',
        '/anwalt/kanzlei/email', '/anwalt/kanzlei/fibu', '/anwalt/kanzlei/suche',
        '/anwalt/kanzlei/bea', '/anwalt/kanzlei/datev', '/anwalt/kanzlei/recherche'
      ];
      for (const p of kanzleiPages) { await testPage(page, version, BASE, p); }

      // Sidebar count
      const sidebarLinks = await page.$$eval('a', function(els) { return els.filter(function(e) { return e.getAttribute('href') && e.getAttribute('href').indexOf('/anwalt') !== -1; }).length; });
      log(sidebarLinks > 25 ? 'pass' : 'warn', '[' + version + '] Sidebar Anwalt Links', sidebarLinks + ' links');
    } catch(e) { log('fail', '[' + version + '] Anwalt Login Flow', e.message); }

    // Login Admin
    console.log('\n--- Admin Login ---');
    try {
      await page.goto(BASE + '/login', { waitUntil: 'networkidle2', timeout: 15000 });
      const inputs3 = await page.$$('input');
      for (const inp of inputs3) { await inp.click({clickCount: 3}); await inp.press('Backspace'); }
      await page.type('input[type="email"]', 'admin@juri-legal.com');
      await page.type('input[type="password"]', 'JuriAdmin2026!');
      await page.click('button[type="submit"]');
      await new Promise(function(r) { setTimeout(r, 5000); });
      log(page.url().indexOf('admin') !== -1 ? 'pass' : 'warn', '[' + version + '] Admin Login', page.url());

      const adminPages = [
        '/admin/dashboard', '/admin/aufgaben', '/admin/konten', '/admin/verifizierung',
        '/admin/finanzen', '/admin/auszahlungen', '/admin/personal', '/admin/vertraege',
        '/admin/marketing', '/admin/newsletter', '/admin/affiliates'
      ];
      for (const p of adminPages) { await testPage(page, version, BASE, p); }
    } catch(e) { log('fail', '[' + version + '] Admin Login Flow', e.message); }

    await page.close();
  }

  console.log('\n' + '='.repeat(60));
  console.log('  QA SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ PASS: ' + results.pass.length);
  console.log('❌ FAIL: ' + results.fail.length);
  console.log('⚠️  WARN: ' + results.warn.length);
  
  if (results.fail.length > 0) {
    console.log('\n--- FAILURES ---');
    results.fail.forEach(function(f) { console.log('  ❌ ' + f.test + ': ' + f.detail); });
  }
  if (results.warn.length > 0) {
    console.log('\n--- WARNINGS ---');
    results.warn.forEach(function(w) { console.log('  ⚠️  ' + w.test + ': ' + w.detail); });
  }

  await browser.close();
}

run().catch(console.error);
