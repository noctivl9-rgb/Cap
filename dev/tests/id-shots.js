const { chromium, devices } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch(); const pg = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
await pg.goto('file://' + __dirname + '/out/page.html#mock'); await pg.waitForTimeout(2600); await pg.screenshot({ path: 'id-accueil.png' });
fs.mkdirSync(__dirname + '/../../brand/sons', { recursive: true });
for (const n of ['selection','etape','valider','programme','objectif','erreur','ouverture']) { const a = await pg.evaluate(n => window.CapSon.wav(n), n); fs.writeFileSync(__dirname + '/../../brand/sons/cap-' + n + '.wav', Buffer.from(a)); }
await pg.click('.sk-btn'); await pg.waitForTimeout(400); await pg.click('.choice:has-text("Les deux")'); await pg.waitForTimeout(300); await pg.screenshot({ path: 'id-choix.png' });
await b.close(); console.log(fs.readdirSync(__dirname + '/../../brand/sons').join(' ')); })();
