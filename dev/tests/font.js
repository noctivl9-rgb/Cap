const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await (await b.newContext({ ...devices['iPhone 14'] })).newPage(); const errs = []; pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await pg.goto('file://' + __dirname + '/out/page.html#mock'); await pg.waitForTimeout(2600);
const ok = await pg.evaluate(async () => { await document.fonts.ready; return [document.fonts.check('700 40px "Archivo Cap"'), getComputedStyle(document.querySelector('.wl-title')).fontFamily.split(',')[0], [...document.fonts].filter(f => f.family.includes('Archivo')).map(f => f.status)]; });
console.log(ok, errs); await pg.screenshot({ path: 'font-accueil.png' });
await pg.click('.sk-btn'); await pg.waitForTimeout(400); await pg.click('.choice:has-text("Les deux")'); await pg.waitForTimeout(200); await pg.screenshot({ path: 'font-choix.png' }); await b.close(); })();
