const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const logs = [];

  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    logs.push(`[PAGE_ERROR] ${err.toString()}`);
    console.log(`[PAGE_ERROR] ${err.toString()}`);
  });

  try {
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle0' });
    
    // Login
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'teste@teste.com');
    await page.type('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    console.log("Logged in. Testing Atendimentos...");
    await page.goto('http://localhost:8080/atendimentos', { waitUntil: 'networkidle0' });
    
    // Open modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const novoBtn = buttons.find(b => b.textContent && b.textContent.includes('Novo Atendimento'));
      if (novoBtn) novoBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Fill required fields
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      const textAreas = document.querySelectorAll('textarea');
      // Just try to click Salvar to see validation errors or crash
      const buttons = Array.from(document.querySelectorAll('button'));
      const salvarBtn = buttons.find(b => b.textContent && b.textContent.includes('Salvar Atendimento'));
      if (salvarBtn) salvarBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    // Test Unidades
    console.log("Testing Unidades...");
    await page.goto('http://localhost:8080/unidades', { waitUntil: 'networkidle0' });
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const novoBtn = buttons.find(b => b.textContent && b.textContent.includes('Nova Unidade'));
      if (novoBtn) novoBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const salvarBtn = buttons.find(b => b.textContent && b.textContent.includes('Salvar Unidade'));
      if (salvarBtn) salvarBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

  } catch (e) {
    console.error(e);
    logs.push(`[SCRIPT_ERROR] ${e.toString()}`);
  } finally {
    fs.writeFileSync('puppeteer_logs.txt', logs.join('\n'));
    await browser.close();
  }
})();
