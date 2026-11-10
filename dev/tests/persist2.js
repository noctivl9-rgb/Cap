const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const pg = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
const errs=[]; pg.on('pageerror', e => errs.push(e.message));
await pg.goto('http://localhost:8765/page.html'); await pg.click('.sk-btn'); await pg.waitForTimeout(450);
const cont = async () => { await pg.click('.ob-bar .btn:not(.text)'); await pg.waitForTimeout(230); };
const type = async v => { await pg.click('.ruler-value'); await pg.fill('.ruler-input', v); await pg.keyboard.press('Enter'); };
await pg.click('.choice:has-text("Mon argent")'); await cont(); await type('15'); await cont(); await type('20'); await cont();
for (const f of ['revenus','fixes','variables','remboursements','epargne']) { await pg.fill('#m-' + f, '0'); await cont(); }
await pg.click('.choice:has-text("Appartement à Dubaï")'); await cont(); await pg.click('.choice:has-text("2036")'); await cont(); await pg.click('.choice:has-text("Code")'); await cont(); await type('7'); await cont(); await pg.click('.ob-bar .btn.text'); await pg.waitForTimeout(230); await cont(); await pg.waitForTimeout(500); await pg.waitForSelector('.rv'); await pg.click('.rv'); await pg.click('.rv-go'); await pg.waitForTimeout(350); await pg.click(".ob-bar .btn:not(.text), .ob-bar .sk-btn, .stage .sk-btn"); await pg.waitForTimeout(600);
await pg.click('.tabbar button:has-text("Argent")'); await pg.waitForTimeout(200);
await pg.click('button:has-text("Mouvement")'); await pg.waitForTimeout(250); await pg.fill('#m-montant', '50'); await pg.click('.sheet .btn:has-text("Enregistrer")'); await pg.waitForTimeout(300);
await pg.reload(); await pg.waitForTimeout(500);
await pg.click('.tabbar button:has-text("Argent")'); await pg.waitForTimeout(200);
const m = await pg.$eval('main', e => e.textContent.replace(/[  ]/g,' '));
console.log('après fermeture/réouverture : profil gardé =', m.includes('Appartement'), '· mouvement 50 € gardé =', m.includes('+50 €'), '· bandeau =', m.includes('Mode sans compte'), '· erreurs', errs);
await b.close(); })();
