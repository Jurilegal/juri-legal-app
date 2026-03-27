const puppeteer = require('puppeteer-core');
(async()=>{
  const b = await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
  const p = await b.newPage();
  await p.setViewport({width:1440,height:900});
  await p.goto('https://app-one-tawny-78.vercel.app/login',{waitUntil:'networkidle2',timeout:15000});
  for(const i of await p.$$('input')){await i.click({clickCount:3});await i.press('Backspace');}
  await p.type('input[type="email"]','anwalt@juri-legal.com');
  await p.type('input[type="password"]','JuriAnwalt2026!');
  await p.click('button[type="submit"]');
  await new Promise(r=>setTimeout(r,5000));
  console.log('URL:',p.url());
  
  await p.goto('https://app-one-tawny-78.vercel.app/anwalt/dashboard',{waitUntil:'networkidle2',timeout:15000});
  
  // Get sidebar role label
  const roleLabel = await p.$eval('aside span', el => el.textContent).catch(()=>'NOT_FOUND');
  console.log('Role label:', roleLabel);
  
  // Get sidebar links
  const links = await p.$$eval('aside a', els => els.map(e=>e.textContent?.trim()).filter(Boolean));
  console.log('Sidebar links count:', links.length);
  console.log('First 10:', links.slice(0,10));
  console.log('Last 10:', links.slice(-10));
  
  // Get welcome name
  const name = await p.$eval('h1', el => el.textContent).catch(()=>'NOT_FOUND');
  console.log('Welcome name:', name);
  
  // Check if sidebar is scrollable
  const sidebarOverflow = await p.$eval('nav', el => getComputedStyle(el).overflowY).catch(()=>'NOT_FOUND');
  console.log('Nav overflow-y:', sidebarOverflow);
  
  await b.close();
})();
