/* Affiche le texte réellement visible d'un ou plusieurs écrans et en fait une capture. Usage : node texte-visible.js Finances Profil */
const { chromium, devices } = require('playwright'); const aller = require('./nav'); const { MEM } = require('./densite');
(async () => { const b = await chromium.launch(), pg = await (await b.newContext(devices['iPhone 14'])).newPage();
  await pg.clock.setFixedTime(new Date('2026-11-10T09:30:00')); await pg.goto('file://' + __dirname + '/out/page.html');
  await pg.evaluate(m => { localStorage.setItem('cap-intro', Date.now()); localStorage.setItem('cap-local', JSON.stringify(m)); }, MEM);
  await pg.reload(); await pg.waitForTimeout(500);
  for (const ec of process.argv.slice(2)) { await aller(pg, ec); await pg.waitForTimeout(300);
    const t = await pg.evaluate(() => { const m = document.querySelector('main'), w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT); let n, o = []; while ((n = w.nextNode())) { const el = n.parentElement; if (!el || !el.offsetParent || el.closest('.sr')) continue; const det = el.closest('details:not([open])'); if (det && !el.closest('summary')) continue; const s = n.textContent.trim(); if (s) o.push(s); } return o.join(' | '); });
    console.log('== ' + ec + '\n' + t);
    await pg.screenshot({ path: __dirname + '/out/v-' + ec.replace(/\W/g, '') + '.png', fullPage: true }); }
  await b.close(); })();
