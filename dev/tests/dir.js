const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const res = []; const T = (n, c, i) => res.push((c ? 'ok   ' : 'FAIL ') + n + (c ? '' : ' → ' + JSON.stringify(i)));
const errs = [];
const open = async (dev, extra) => { const pg = await (await b.newContext(Object.assign({}, dev, extra || {}))).newPage(); pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); await pg.goto('file:///home/claude/cap/test/page.html#mock'); return pg; };
let pg = await open(devices['iPhone 14']);
await pg.waitForTimeout(500); await pg.screenshot({ path: 'id-intro.png' });
T('intro : affichée au premier lancement', !!(await pg.$('.intro')));
await pg.waitForTimeout(1300);
T('intro : disparaît seule en moins de 1,7 s', !(await pg.$('.intro')));
await pg.reload(); await pg.waitForTimeout(300);
T('intro : pas rejouée à la réouverture (12 h)', !(await pg.$('.intro')));
const pgSkip = await open(devices['iPhone 14']); await pgSkip.waitForTimeout(200); await pgSkip.click('.intro'); await pgSkip.waitForTimeout(400);
T('intro : un toucher la passe', !(await pgSkip.$('.intro')));
// Mesure d'images par seconde pendant la chorégraphie (Chromium sans écran, indicatif)
const fps = await pg.evaluate(() => new Promise(r => { let n = 0, t0 = performance.now(); const f = t => { n++; if (t - t0 < 1500) requestAnimationFrame(f); else r(Math.round(n / ((t - t0) / 1000))); }; requestAnimationFrame(f); }));
T('chorégraphie d\'accueil : images/s mesurées (Chromium sans écran)', fps >= 50, fps); res.push('     → ' + fps + ' i/s');
await pg.screenshot({ path: 'dir-accueil.png' });
T('accueil : titre « Garde le cap. »', (await pg.$eval('.wl-title', e => e.textContent)) === 'Garde le cap.');
T('accueil : pas de débordement horizontal', (await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);
const lb = await pg.$eval('.wl-pils', e => e.getBoundingClientRect().bottom), cta = await pg.$eval('.ob-bar .in', e => e.getBoundingClientRect().top);
T('accueil : rien de caché sous le bouton (iPhone 14)', lb <= cta + 1, [lb, cta]);
await pg.waitForTimeout(400); await pg.click('.wl-hero-mark'); await pg.waitForTimeout(120);
T('toucher le logo : reflet argent rejoué', (await pg.$eval('.wl-hero-mark .lg-sheen', e => e.getAnimations().length)) > 0);
// Sons
T('sons désactivés par défaut', await pg.evaluate(() => window.CapSon.actif() === false));
T('aucun son joué quand désactivé', await pg.evaluate(() => window.CapSon.jouer('valider') === false));
for (const n of ['selection', 'etape', 'valider', 'programme', 'objectif', 'erreur', 'ouverture']) { const r = await pg.evaluate(n => window.CapSon.rendre(n), n); T('son « ' + n + ' » : court (< 0,8 s) et doux (crête < 0,12)', r && r.duree < 0.8 && r.crete < 0.12 && r.crete > 0.004, r); res.push('     → ' + n + ' : ' + r.duree.toFixed(2) + ' s, crête ' + r.crete.toFixed(3)); }
// Petit écran
pg = await open(devices['iPhone SE']); await pg.waitForTimeout(1600); await pg.screenshot({ path: 'dir-se.png' });
const lb2 = await pg.$eval('.wl-pils', e => e.getBoundingClientRect().bottom), cta2 = await pg.$eval('.ob-bar .in', e => e.getBoundingClientRect().top), sh = await pg.evaluate(() => document.documentElement.scrollHeight - innerHeight);
T('iPhone SE : contenu accessible (défilement si besoin, rien de coupé)', lb2 <= cta2 + 1 || sh > 0, [lb2, cta2, sh]);
// Réduction des animations
pg = await open(devices['iPhone 14'], { reducedMotion: 'reduce' }); await pg.waitForTimeout(150);
T('réduire les animations : pas d\'intro, tout visible immédiatement', !(await pg.$('.intro')) && (await pg.$eval('.wl-title', e => getComputedStyle(e).opacity)) === '1');
console.log(res.join('\n'), '\nerreurs :', errs); await b.close(); })();
