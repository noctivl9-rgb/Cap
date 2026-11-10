/* Audit : chaque bouton visible de chaque écran a-t-il une action ? (écouteurs lus via le protocole Chrome DevTools)
 * Mesure aussi le temps de chargement et la mémoire JS. Usage : bash build.sh && node audit-boutons.js */
const { chromium, devices } = require('playwright');
const aller = require('./nav');
const PROFIL = { v: 2, domaines: ['corps', 'argent', 'entreprise'], sexe: 'H', age: 22, taille: 178, poids: 78, objectif: 'perdre', cible: 73, delaiSem: 20, activite: 'mixte', niveau: 'intermediaire', lieu: 'salle', jours: 3, minutes: 50, autreSport: 0, tempsLibre: 12, prioriteSport: 'muscle', contraintes: ['aucune'], obstacle: 'regularite', regime: 'omnivore', revenus: 1900, fixes: 800, variables: 450, remboursements: 0, epargne: 2500, reve: 'appart', reveMontant: 250000, reveAnnee: 2034, pays: 'france', capital: 250, competences: ['code'], materielPro: ['ordinateur'], heuresProjet: 8, experience: 'projets', aisanceVente: 2, risque: 'moyen', formatPref: 'les_deux' };
const ECRANS = (process.env.ECRANS || 'Aujourd’hui,Programme,Journal,Progrès,Photos,Finances,Business,Profil').split(',');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(devices['iPhone 14']); const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const cdp = await ctx.newCDPSession(pg);
  const t0 = Date.now();
  await pg.goto('file://' + __dirname + '/out/page.html');
  await pg.evaluate(p => { localStorage.setItem('cap-intro', Date.now()); localStorage.setItem('cap-local', JSON.stringify({ profil: { main: p } })); }, PROFIL);
  await pg.reload(); await pg.waitForSelector('.tabbar'); const charge = Date.now() - t0;
  const perf = await pg.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { domContentLoaded: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) }; });
  let morts = [];
  for (const ec of ECRANS) {
    await aller(pg, ec).catch(() => {}); await pg.waitForTimeout(200);
    const ids = await pg.evaluate(() => { const l = [...document.querySelectorAll('main button, nav button, main [role=button], main summary')].filter(e => e.offsetParent && !e.disabled); l.forEach((e, i) => e.setAttribute('data-audit', i)); return l.length; });
    for (let i = 0; i < ids; i++) {
      const { result } = await cdp.send('Runtime.evaluate', { expression: 'document.querySelector(\'[data-audit="' + i + '"]\')' });
      const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId, depth: 0 });
      const tag = await pg.evaluate(i => { const e = document.querySelector('[data-audit="' + i + '"]'); return { t: e.tagName, txt: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 40), lbl: e.tagName === 'LABEL' }; }, i);
      const actif = listeners.some(l => ['click', 'pointerdown', 'keydown'].includes(l.type)) || tag.t === 'SUMMARY';
      if (!actif) morts.push(ec + ' : « ' + tag.txt + ' »');
    }
  }
  const mem = await pg.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + ' Mo' : 'n/d');
  console.log('chargement jusqu’à la barre :', charge, 'ms ; navigation :', JSON.stringify(perf), '; tas JS :', mem);
  console.log('boutons sans action :', morts.length ? '\n - ' + morts.join('\n - ') : 0);
  console.log('erreurs JS :', errs);
  await b.close();
})();
