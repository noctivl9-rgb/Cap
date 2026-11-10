const { chromium } = require('playwright');
const out = __dirname + '/out/v3-';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  const errs = []; pg.on('pageerror', e => errs.push('pageerror: ' + e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto('file://' + __dirname + '/out/page.html#mock'); await pg.waitForTimeout(500);
  let n = 0; const shot = async name => pg.screenshot({ path: out + String(++n).padStart(2, '0') + '-' + name + '.png' });
  const res = []; const T = (name, c, info) => res.push((c ? 'ok   ' : 'FAIL ') + name + (info !== undefined && !c ? ' → ' + JSON.stringify(info).slice(0, 300) : ''));
  const cont = async () => { await pg.click('.ob-bar .btn:not(.text), .ob-bar .sk-btn'); await pg.waitForTimeout(260); };
  const pick = async t => { await pg.click('.choice:has-text("' + t + '")'); await pg.waitForTimeout(60); };
  const type = async v => { await pg.click('.ruler-value'); await pg.fill('.ruler-input', v); await pg.keyboard.press('Enter'); await pg.waitForTimeout(60); };
  const main = async () => pg.$eval('main', e => e.textContent.replace(/[\u202f\u00a0]/g, ' '));
  const sheetTxt = async () => pg.$$eval('.sheet', els => els[els.length - 1].textContent.replace(/[\u202f\u00a0]/g, ' ')).catch(() => '');
  const lastSheet = '.scrim:last-child .sheet';
  // Accueil animé puis onboarding (corps + argent)
  await pg.waitForTimeout(1500); await shot('bienvenue');
  T('écran d\'accueil avec bouton Sparkle', !!(await pg.$('.wl')) && !!(await pg.$('.ob-bar .sk .sk-btn')));
  await pg.focus('.sk-btn'); await pg.keyboard.press('Tab'); await pg.keyboard.press('Shift+Tab'); await pg.waitForTimeout(350);
  T('Sparkle : actif au focus clavier', (await pg.$eval('.sk', e => getComputedStyle(e).getPropertyValue('--active').trim())) === '1');
  T('Sparkle : n\'active pas le reste de la page', (await pg.$eval('body', e => getComputedStyle(e).getPropertyValue('--active').trim())) === '');
  await pg.keyboard.press('Enter'); await pg.waitForTimeout(300);
  await pick('Mon corps'); await pick('Mon argent'); await cont(); await type('15'); await cont(); await type('20'); await cont();
  await pick('Formule masculine'); await cont(); await type('170'); await cont();
  // unités lb
  await pg.click('.seg-simple button:has-text("lb")'); await pg.waitForTimeout(250);
  T('poids : bascule en livres', (await pg.$eval('.ruler-value', e => e.textContent)).includes('lb'));
  await type('156,5'); await pg.waitForTimeout(50);
  await pg.click('.seg-simple button:has-text("kg")'); await pg.waitForTimeout(250);
  const kgv = await pg.$eval('.ruler-value .num', e => e.textContent);
  T('156,5 lb = 71,0 kg (conversion)', kgv === '71,0', kgv);
  await cont();
  await pg.click('.ob-bar .btn.text'); await pg.waitForTimeout(220);
  await pick('Perdre du gras'); await cont(); await type('66'); await cont(); await pick('6 mois'); await cont();
  await pick('Assise'); await cont(); await pick('2 séances'); await cont(); await pick('Débutant'); await cont(); await pick('3'); await cont(); await pick('45 min'); await cont(); await pick('En salle'); await cont(); await pick('Laisser Cap choisir'); await cont(); await pick('Rien de particulier'); await cont();
  let t = await pg.$eval('.stage h1', e => e.textContent);
  T('nouvelle étape : régime alimentaire', t === 'Ton alimentation', t);
  await pick('Halal'); await cont();
  T('nouvelle étape : expérience du suivi', (await pg.$eval('.stage h1', e => e.textContent)).includes('compté'));
  await pick('Non, c’est nouveau'); await cont();
  await pg.click('.choice >> nth=0'); await cont();
  await pg.click('.ob-bar .btn.text'); await pg.waitForTimeout(220);
  await pg.fill('#m-revenus', '0'); await cont(); await pg.fill('#m-fixes', '0'); await cont(); await pg.fill('#m-variables', '0'); await cont(); await pg.fill('#m-remboursements', '0'); await cont(); await pg.fill('#m-epargne', '0'); await cont();
  await pick('Appartement + Urus'); await cont(); await pick('2036'); await cont(); await pick('Code'); await cont(); await type('7'); await cont(); await pg.click('.ob-bar .btn.text'); await pg.waitForTimeout(220);
  T('bilan affiché', (await pg.$eval('.stage h1', e => e.textContent)).includes('Vérification'));
  await cont();
  // Révélation : seulement des calculs réellement exécutés, puis la page du plan
  await pg.waitForSelector('.rv-item'); await pg.click('.rv'); await pg.waitForTimeout(100);
  const rv = await pg.$$eval('.rv-item', l => l.map(e => e.textContent));
  T('révélation : étapes réelles avec leurs résultats', rv.length >= 4 && rv[0].startsWith('Comprendre') && rv.some(x => x.includes('kcal par jour')) && rv[rv.length - 1].startsWith('Révéler') && !(await pg.$('.loader, progress')), rv);
  await pg.waitForTimeout(500); await pg.screenshot({ path: 'rv.png' });
  await pg.click('.rv-go'); await pg.waitForTimeout(300);
  // Aperçu du plan
  t = await pg.$eval('.stage', e => e.textContent);
  T('aperçu du plan calculé avant enregistrement (pas d\'animation factice)', t.includes('Ton plan') && t.includes('kcal / jour') && !(await pg.$('.loader')));
  await shot('plan');
  const kcalPlan = await pg.$eval('.stage .hero b', e => e.textContent.replace(/[\u202f\u00a0]/g, ' '));
  await pg.click('button:has-text("Modifier mes objectifs")'); await pg.waitForTimeout(250);
  await pg.fill('#obj-kcal', '1500'); await pg.waitForTimeout(50);
  T('objectif perso sous le minimum refusé', await pg.$eval(lastSheet + ' .btn:has-text("Utiliser")', e => e.disabled) && (await sheetTxt()).includes('Minimum de sécurité'));
  await pg.fill('#obj-kcal', '2500'); await pg.fill('#obj-p', '140'); await pg.fill('#obj-c', '300'); await pg.fill('#obj-f', '78'); await pg.waitForTimeout(50);
  await pg.click(lastSheet + ' .btn:has-text("Utiliser")'); await pg.waitForTimeout(300);
  const kcalPlan2 = await pg.$eval('.stage .hero b', e => e.textContent.replace(/[\u202f\u00a0]/g, ' '));
  T('objectif perso appliqué dans l\'aperçu', kcalPlan2 === '2 500' && (await pg.$eval('.stage', e => e.textContent)).includes('Personnalisé'), [kcalPlan, kcalPlan2]);
  await cont(); await pg.waitForTimeout(400);
  await shot('aujourdhui');
  const nav = async t => { await pg.click('.tabbar .nav-d:has-text("' + t + '")'); await pg.waitForTimeout(300); };
  const parcours = async (mod, sous) => { await nav('Parcours'); if (await pg.$('.segs.mods')) { await pg.click('.segs.mods button:has-text("' + mod + '")'); await pg.waitForTimeout(250); } if (sous) { await pg.click('.segs.sous button:has-text("' + sous + '")'); await pg.waitForTimeout(250); } };
  const plus = async t => { await pg.click('.nav-plus'); await pg.waitForTimeout(250); await pg.click(lastSheet + ' .tile:has-text("' + t + '")'); await pg.waitForTimeout(300); };
  const navs = await pg.$$eval('.tabbar .nav-d', l => l.map(e => e.textContent));
  T('navigation : 4 destinations + action centrale (≤ 5)', navs.join('|') === 'Aujourd’hui|Parcours|Journal|Profil' && !!(await pg.$('.nav-plus')), navs);
  const prio = await pg.$eval('.td-prio', e => e.textContent).catch(() => '');
  T('aujourd\'hui : une seule priorité avec une action', (await pg.$$('.td-prio')).length === 1 && (await pg.$$('.td-prio button')).length === 1, prio);
  const etats = await pg.$$eval('.td-etat', l => l.map(e => e.textContent.replace(/[\u202f\u00a0]/g, ' ')));
  T('aujourd\'hui : état mesuré par module, sans score inventé', etats.length === 2 && etats[0].includes('71,0 kg') && etats[1].includes('Argent') && !/score|\/100/.test(etats.join(' ')), etats);
  await nav('Journal');
  await shot('accueil-vide');
  let m = await main();
  T('accueil : 2 500 kcal restantes, mode simple', m.includes('2 500') && m.includes('Mode simple'), m.slice(0, 200));
  T('accueil : jour vide signalé sans estimation', m.includes('Rien de noté pour ce jour'));
  // Recherche + ajout
  await pg.click('.nav-plus'); await pg.waitForTimeout(250); await shot('menu');
  await pg.click(lastSheet + ' .tile:has-text("Repas")'); await pg.waitForTimeout(300);
  await pg.fill('#q-food', 'jambon'); await pg.waitForTimeout(100);
  let st = await sheetTxt();
  T('régime halal : « jambon » ne propose pas le jambon de porc', !st.includes('Jambon blanc'), st.slice(0, 200));
  await pg.fill('#q-food', 'dinde'); await pg.waitForTimeout(100); st = await sheetTxt();
  T('régime halal : la dinde reste proposée', st.includes('Blanc de dinde'), st.slice(0, 200));
  await pg.fill('#q-food', 'poulet cru'); await pg.waitForTimeout(100);
  await pg.click('.sheet .cell:has-text("Blanc de poulet (cru)")'); await pg.waitForTimeout(300);
  await pg.fill('#q-qte', '200'); await pg.waitForTimeout(50);
  st = await sheetTxt();
  T('détail : 200 g de poulet cru = 220 kcal', st.includes('220') , st.slice(0, 300));
  await pg.click(lastSheet + ' .seg button:has-text("Poêlé")'); await pg.waitForTimeout(50);
  st = await sheetTxt();
  T('cuisson poêlée : +6 g d\'huile = 274 kcal', st.includes('274') && st.includes('+6'), st.slice(0, 400));
  await pg.click(lastSheet + ' .seg button:has-text("Midi")');
  await pg.click(lastSheet + ' .btn:has-text("Ajouter au journal")'); await pg.waitForTimeout(400);
  m = await main();
  T('ajout → compteur recalculé (2 500 − 274 = 2 226)', m.includes('2 226'), m.slice(0, 300));
  // Modifier la quantité
  await pg.click('.cell:has-text("Blanc de poulet")'); await pg.waitForTimeout(300);
  await pg.fill('#e-qte', '100'); await pg.waitForTimeout(50);
  await pg.click(lastSheet + ' .btn:has-text("Enregistrer")'); await pg.waitForTimeout(400);
  m = await main();
  T('modification 200 → 100 g : 137 kcal, reste 2 363', m.includes('2 363'), m.slice(0, 300));
  // Dupliquer vers aujourd'hui
  await pg.click('.cell:has-text("Blanc de poulet")'); await pg.waitForTimeout(300);
  await pg.click(lastSheet + ' .btn:has-text("Dupliquer")'); await pg.waitForTimeout(400);
  T('duplication : 2 entrées', (await pg.$$('.cell:has-text("Blanc de poulet")')).length === 2);
  // Supprimer
  await pg.click('.cell:has-text("Blanc de poulet") >> nth=1'); await pg.waitForTimeout(300);
  await pg.click(lastSheet + ' .btn:has-text("Supprimer")'); await pg.waitForTimeout(400);
  m = await main();
  T('suppression → totaux corrigés (reste 2 363)', (await pg.$$('.cell:has-text("Blanc de poulet")')).length === 1 && m.includes('2 363'));
  // Eau
  await pg.click('button[aria-label="Ajouter 250 ml"]'); await pg.waitForTimeout(250); await pg.click('button[aria-label="Ajouter 250 ml"]'); await pg.waitForTimeout(250);
  T('eau : 500 ml', (await main()).includes('500 ml'));
  // Activité sans option
  await pg.click('button[aria-label="Ajouter une activité"]'); await pg.waitForTimeout(300);
  await pg.click(lastSheet + ' .choice:has-text("Course")'); await pg.waitForTimeout(80);
  st = await sheetTxt();
  T('activité : 30 min de course à 71 kg ≈ 284 kcal', st.includes('284'), st.slice(0, 400));
  await pg.click(lastSheet + ' .btn:has-text("Enregistrer")'); await pg.waitForTimeout(400);
  m = await main();
  T('option désactivée : budget inchangé', m.includes('2 363') && m.includes('284 kcal'));
  // Activer l'option dans Réglages
  await nav('Profil');
  await pg.click('button[role="switch"]:has-text("Ajouter les calories")'); await pg.waitForTimeout(300);
  await pg.click('button[role="switch"]:has-text("Mode simple")'); await pg.waitForTimeout(300);
  await shot('reglages');
  await nav('Journal'); await pg.waitForTimeout(500);
  m = await main();
  T('option activée : +142 kcal (50 % de 284) → reste 2 505', m.includes('+142 activité') && m.includes('2 505'), m.slice(0, 300));
  T('mode simple désactivé : glucides et lipides affichés', m.includes('Glucides') && m.includes('Lipides'));
  await shot('accueil');
  // Scan photo (IA simulée)
  await plus('Scanner un plat');
  await pg.setInputFiles('#scan-lib', __dirname + '/fixtures/repas.jpg'); await pg.waitForTimeout(500);
  st = await sheetTxt();
  T('scan : avant envoi, explication (quoi, à qui, ce qui n’est pas analysé)', st.includes('Ce qui est envoyé') && st.includes('Claude (Anthropic)') && st.includes('Ce qui n’est pas analysé'));
  T('scan : analyse impossible sans consentement coché', await pg.$eval(lastSheet + ' .sk-btn', e => e.disabled));
  await pg.check(lastSheet + ' #scan-ok'); await pg.waitForTimeout(50);
  await pg.click(lastSheet + ' .sk-btn'); await pg.waitForTimeout(600);
  st = await sheetTxt();
  T('scan : aliment reconnu dans la base → valeurs de la base', st.includes('Riz blanc (cuit)') && st.includes('Valeurs de la base'));
  T('scan : aliment hors base → « estimé par l\'IA » + confiance faible', st.includes('poulet grillé mariné') && st.includes('estimées par l’IA') && st.includes('Confiance faible'));
  T('scan : incertitude et remarque affichées', st.includes('±20 %') && st.includes('Sauce possible'));
  // 180 g riz = 234 ; poulet 120 g poêlé : 198 + 3,6 g huile (32) = 230 → 464
  T('scan : total recalculé par le moteur (234 + 230 = 464 kcal)', st.includes('464'), st.slice(0, 600));
  await pg.fill('#sg-0', '100'); await pg.waitForTimeout(80);
  st = await sheetTxt();
  T('scan : correction de la portion → recalcul (130 + 230 = 360)', st.includes('360'));
  T('scan : estimé par l’IA / corrigé par toi distingués', st.includes('Corrigé par toi') && st.includes('Estimé par l’IA') && st.includes('Total calculé par Cap'));
  await pg.click(lastSheet + ' .link:has-text("Supprimer") >> nth=1'); await pg.waitForTimeout(80);
  await shot('scan');
  await pg.click(lastSheet + ' .btn:has-text("Enregistrer le repas")'); await pg.waitForTimeout(400);
  m = await main();
  T('scan enregistré dans le journal (jamais automatiquement)', m.includes('estimé par photo'));
  // Créer un aliment + favori + recette
  await plus('Repas');
  await pg.click(lastSheet + ' .btn:has-text("Créer un aliment")'); await pg.waitForTimeout(250);
  await pg.fill('#c-n', 'Barre protéinée test'); await pg.fill('#c-k', '380'); await pg.fill('#c-p', '30'); await pg.fill('#c-c', '35'); await pg.fill('#c-f', '12'); await pg.fill('#c-g', '50'); await pg.waitForTimeout(50);
  await pg.click(lastSheet + ' .btn:has-text("Enregistrer")'); await pg.waitForTimeout(300);
  await plus('Repas');
  st = await sheetTxt();
  T('aliment perso visible dans « Mes aliments »', st.includes('Barre protéinée test') && st.includes('Mes aliments'));
  await pg.click(lastSheet + ' .cell:has-text("Barre protéinée test")'); await pg.waitForTimeout(250);
  await pg.click(lastSheet + ' button[aria-label="Ajouter aux favoris"]'); await pg.waitForTimeout(300);
  await pg.click(lastSheet + ' button[aria-label="Fermer"]'); await pg.waitForTimeout(200);
  await plus('Repas');
  T('favori visible', (await sheetTxt()).includes('Favoris'));
  await pg.click(lastSheet + ' .btn:has-text("Recette")'); await pg.waitForTimeout(250);
  await pg.fill('#rc-n', 'Bowl test'); await pg.fill('#rc-p', '2');
  await pg.click(lastSheet + ' .btn:has-text("Ajouter un ingrédient")'); await pg.waitForTimeout(250);
  await pg.fill('#q-food', 'riz cru'); await pg.waitForTimeout(80); await pg.click(lastSheet + ' .cell:has-text("Riz blanc (cru)")'); await pg.waitForTimeout(250);
  await pg.fill('#q-qte', '160'); await pg.click(lastSheet + ' .btn:has-text("Ajouter")'); await pg.waitForTimeout(250);
  st = await sheetTxt();
  T('recette : 160 g de riz cru = 570 kcal, 285 par portion', st.includes('570') && st.includes('285'), st.slice(0, 400));
  await pg.click(lastSheet + ' .btn:has-text("Enregistrer la recette")'); await pg.waitForTimeout(300);
  // Hier via la bande de jours
  await pg.click('.daybtn >> nth=5'); await pg.waitForTimeout(300);
  m = await main();
  T('navigation vers hier : journal vide distinct', m.includes('Hier') && m.includes('Rien de noté pour ce jour'));
  await pg.click('.slot-h button >> nth=0'); await pg.waitForTimeout(250);
  await pg.fill('#q-food', 'bowl'); await pg.waitForTimeout(80); await pg.click(lastSheet + ' .cell:has-text("Bowl test")'); await pg.waitForTimeout(250);
  await pg.click(lastSheet + ' .btn:has-text("Ajouter au journal")'); await pg.waitForTimeout(300);
  T('recette ajoutée à hier', (await main()).includes('Bowl test'));
  await pg.click('.link:has-text("Revenir")'); await pg.waitForTimeout(300);
  // Calendrier
  await pg.click('button[aria-label="Calendrier"]'); await pg.waitForTimeout(250);
  T('calendrier : jours avec données marqués', (await pg.$$(lastSheet + ' .calday.has')).length >= 2);
  await pg.click(lastSheet + ' button[aria-label="Fermer"]'); await pg.waitForTimeout(200);
  // Progrès
  await parcours('Corps', 'Progression');
  m = await main();
  T('progrès : bilan semaine sur jours notés uniquement', m.includes('2 jours renseignés sur 7'), m.slice(0, 500));
  T('progrès : série 2 jours', m.includes('2 jours'));
  T('progrès : poids affiché en kg', m.includes('71,0 kg'));
  await shot('progres');
  // Progression visuelle : consentement, ajout, comparaison, suppression
  await parcours('Corps', 'Photos');
  T('photos : état vide non culpabilisant', (await main()).includes('Observer une évolution prend des semaines'));
  await pg.click('main .btn:has-text("Ajouter ma première photo")'); await pg.waitForTimeout(300);
  st = await sheetTxt();
  T('photos : consentement explicite (stockage, aucune IA, suppression)', st.includes('Aucune photo n’est envoyée à une IA') && st.includes('supprimer définitivement'), st.slice(0, 300));
  await pg.click(lastSheet + ' .btn:has-text("J’ai compris")'); await pg.waitForTimeout(350);
  const ajoutPhoto = async (cat, date) => {
    await pg.setInputFiles(lastSheet + ' #phc-lib', __dirname + '/fixtures/repas.jpg'); await pg.waitForTimeout(150);
    await pg.click(lastSheet + ' .choice:has-text("' + cat + '")'); await pg.fill(lastSheet + ' #ph-date', date);
    await pg.click(lastSheet + ' .btn:has-text("Enregistrer la photo")'); await pg.waitForTimeout(700);
  };
  T('photos : enregistrement impossible sans angle', await pg.$eval(lastSheet + ' .btn:has-text("Enregistrer la photo")', e => e.disabled));
  await ajoutPhoto('Face', '2026-09-01');
  await pg.click('main .btn:has-text("Photo")'); await pg.waitForTimeout(300);
  await ajoutPhoto('Face', '2026-11-01');
  T('photos : chronologie par mois (2 photos)', (await pg.$$('.ph-vign')).length === 2 && (await pg.$$('.ph-mois')).length === 2);
  const doc = await pg.evaluate(() => Object.values(JSON.parse(localStorage.getItem('cap-local')).photos || {})[0] || window.CapUI.S.photos[0]);
  T('photos : métadonnées v2 (catégorie, dimensions, empreinte), pas de base64', doc && doc.v === 2 && doc.categorie === 'face' && doc.largeur === 800 && /^[0-9a-f]{64}$/.test(doc.empreinte || '') && !JSON.stringify(doc).includes('base64'), doc);
  await pg.click('main .btn:has-text("Comparer deux dates")'); await pg.waitForTimeout(350);
  T('photos : comparateur avant / après avec glissière accessible', !!(await pg.$(lastSheet + ' input[type=range][aria-label]')) && (await sheetTxt()).includes('Avant'));
  await shot('photos-comparer');
  await pg.click(lastSheet + ' button[aria-label="Fermer"]'); await pg.waitForTimeout(200);
  await pg.click('.ph-vign >> nth=0'); await pg.waitForTimeout(300);
  await pg.click(lastSheet + ' .btn:has-text("Supprimer…")'); await pg.waitForTimeout(100);
  await pg.click(lastSheet + ' .btn:has-text("Supprimer définitivement")'); await pg.waitForTimeout(500);
  T('photos : suppression définitive après confirmation', (await pg.$$('.ph-vign')).length === 1);
  await shot('photos');
  // Coach
  await nav('Journal');
  await pg.click('button[aria-label="Coach"]'); await pg.waitForTimeout(300);
  await pg.click(lastSheet + ' button[role="switch"]:has-text("corps")'); await pg.waitForTimeout(300);
  await pg.fill('#coach-q', 'Pourquoi 2 500 ?'); await pg.click(lastSheet + ' .btn:has-text("Envoyer")'); await pg.waitForTimeout(400);
  T('coach : réponse affichée', (await sheetTxt()).includes('Selon ton contexte'));
  await shot('coach');
  await pg.click(lastSheet + ' button[aria-label="Fermer"]'); await pg.waitForTimeout(200);
  // Unités lb dans réglages
  await nav('Profil');
  await pg.click('button[role="switch"]:has-text("livres")'); await pg.waitForTimeout(300);
  await parcours('Corps', 'Progression');
  T('unités lb : 71 kg affichés 156,5 lb', (await main()).includes('156,5 lb'));
  // Réduction des animations + petit écran
  await pg.emulateMedia({ reducedMotion: 'reduce' }); await pg.setViewportSize({ width: 320, height: 640 }); await pg.waitForTimeout(200);
  await nav('Journal');
  const ov = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const bad = await pg.evaluate(() => { const W = document.documentElement.clientWidth; const out = []; document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.right > W + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed') out.push(e.tagName + '.' + e.className + ':' + Math.round(r.right)); }); return out.slice(0, 8); });
  T('320 px : pas de défilement horizontal', ov <= 0, [ov, bad]);
  for (const tb of [['Corps', 'Progression'], ['Corps', 'Séance'], ['Corps', 'Photos'], ['Argent'], ['Profil'], ['Aujourd’hui']]) { if (tb[0] === 'Profil' || tb[0] === 'Aujourd’hui') await nav(tb[0]); else await parcours(tb[0], tb[1]); const o2 = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); T('320 px ' + tb.join(' › ') + ' : pas de débordement', o2 <= 0, o2); }
  await shot('320');
  console.log(res.join('\n')); console.log('\nerreurs console :', errs);
  // Sans IA : modes manuels
  const pg2 = await ctx.newPage(); await pg2.goto('file://' + __dirname + '/out/page.html'); await pg2.waitForSelector('.wl-title, .stage h1, .tabbar', { timeout: 6000 });
  console.log('sans IA (aperçu) chargé :', (await pg2.$eval('.wl-title, .stage h1, .tabbar', e => e.textContent)));
  await b.close();
})();
