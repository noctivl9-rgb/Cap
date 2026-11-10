const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c ? '' : ' → ' + JSON.stringify(i)));
const ctx = await b.newContext({ ...devices['iPhone 14'] }); const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto('file://' + __dirname + '/out/page.html#mock'); await pg.waitForTimeout(1600);
const act = () => pg.$eval('.sk', e => getComputedStyle(e).getPropertyValue('--active').trim());
T('au repos : inactif', (await act()) === '0', await act());
await pg.screenshot({ path: 'sk-repos.png' });
await pg.dispatchEvent('.sk-btn', 'pointerdown'); await pg.waitForTimeout(200);
T('toucher : actif (particules, halo)', (await act()) === '1');
T('toucher : particules en mouvement', (await pg.$eval('.sk-p', e => getComputedStyle(e).animationPlayState)) === 'running');
await pg.screenshot({ path: 'sk-actif.png' });
await pg.dispatchEvent('.sk-btn', 'pointerup'); await pg.waitForTimeout(900);
T('relâché : revient au repos', (await act()) === '0');
T('aucune autre classe générique ajoutée (.text, .spark, .backdrop)', (await pg.$$('.text, .spark, .backdrop, .particle')).length === 0);
// Désactivé / chargement via l'API
const st = await pg.evaluate(() => { const s = window.CapUI.sparkle('Test', () => { window.__clic = (window.__clic || 0) + 1; }, { disabled: true }); document.body.appendChild(s.el); s.btn.click(); const r1 = window.__clic || 0; s.btn.disabled = false; s.loading(true); s.btn.click(); const r2 = window.__clic || 0; const a = getComputedStyle(s.el).getPropertyValue('--active').trim(); s.loading(false); s.btn.click(); const r3 = window.__clic || 0; s.el.remove(); return [r1, r2, a, r3]; });
T('désactivé : aucun clic', st[0] === 0, st); T('chargement : actif et clic ignoré', st[1] === 0 && st[2] === '1', st); T('après chargement : clic accepté', st[3] === 1, st);
// Réduction des animations
const pg2 = await (await b.newContext({ ...devices['iPhone 14'], reducedMotion: 'reduce' })).newPage(); await pg2.goto('file://' + __dirname + '/out/page.html#mock'); await pg2.waitForTimeout(400);
T('réduire les animations : particules masquées, étincelle figée', (await pg2.$eval('.sk-pen', e => getComputedStyle(e).display)) === 'none' && (await pg2.$eval('.sk-spark', e => getComputedStyle(e).animationName)) === 'none');
console.log(res.join('\n'), '\nerreurs :', errs); await b.close(); })();
