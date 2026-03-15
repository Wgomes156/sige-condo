const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const logs = [];

  page.on('response', async (response) => {
    if (response.url().includes('supabase.co/rest/v1/') && response.status() === 400) {
      try {
        const body = await response.text();
        logs.push(`[SUPABASE_400] URL: ${response.url()} response: ${body}`);
      } catch (e) {}
    }
  });

  try {
    await page.goto('http://localhost:8080/auth', { waitUntil: 'networkidle2' });
    
    // Login
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'teste@teste.com');
    await page.type('input[type="password"]', '123456');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log("Logged in. Testing Atendimentos...");
    await page.goto('http://localhost:8080/atendimentos', { waitUntil: 'networkidle2' });
    
    // Open modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const novoBtn = buttons.find(b => b.textContent && b.textContent.includes('Novo Atendimento'));
      if (novoBtn) novoBtn.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Add Nome Condominio, Nome Cliente, Telefone so it passes frontend validation
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const nomeInput = inputs.find(i => i.placeholder === 'Nome do cliente');
      if (nomeInput) { nomeInput.value = 'Cliente Teste'; nomeInput.dispatchEvent(new Event('input', { bubbles: true })); }
      
      const condInput = inputs.find(i => i.placeholder === 'Nome do condomínio');
      if (condInput) { condInput.value = 'Condo Teste'; condInput.dispatchEvent(new Event('input', { bubbles: true })); }

      const telInput = inputs.find(i => i.placeholder === '(00) 00000-0000');
      if (telInput) { telInput.value = '11999999999'; telInput.dispatchEvent(new Event('input', { bubbles: true })); }

      const buttons = Array.from(document.querySelectorAll('button'));
      const salvarBtn = buttons.find(b => b.textContent && b.textContent.includes('Salvar Atendimento'));
      if (salvarBtn) salvarBtn.click();
    });

    await new Promise(r => setTimeout(r, 3000));

  } catch (e) {
    console.error(e);
    logs.push(`[SCRIPT_ERROR] ${e.toString()}`);
  } finally {
    fs.writeFileSync('puppeteer_responses.txt', logs.join('\n'));
    await browser.close();
  }
})();
