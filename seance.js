/* Cap — séance guidée, lisible pendant l'effort.
 * Un exercice à la fois : séries × répétitions en très grand, repos, consigne, alternative, raison.
 * Le minuteur de repos ne démarre que si la personne le lance. Rien n'est enregistré avant « Enregistrer la séance ».
 * Arrêter en cours de route n'est pas un échec : on peut enregistrer une séance partielle ou simplement fermer. */
(function () {
  'use strict';
  const U = () => window.CapUI;
  let verrou = null;

  function ouvrir(se, opts) {
    const { h, icon, put, dayId, toast, reduced } = U();
    opts = opts || {};
    const p = U().S.profil || {};
    const douleur = (p.contraintes || []).indexOf('douleur') >= 0;
    const ex = se.exercices || [];
    const st = { i: -1, series: ex.map(() => 0), repos: null, fin: null };
    const prec = document.activeElement;
    const titre = h('h1', { class: 'sg-titre', tabindex: '-1' });
    const corps = h('div', { class: 'sg-corps' });
    const barre = h('div', { class: 'sg-barre' });
    const prog = h('div', { class: 'sg-prog', role: 'progressbar', 'aria-label': 'Exercices terminés', 'aria-valuemin': '0', 'aria-valuemax': String(ex.length) });
    const ferme = h('button', { class: 'sg-x', type: 'button', 'aria-label': 'Quitter la séance' }, icon('back'));
    const ov = h('div', { class: 'sg', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Séance ' + se.nom }, h('header', { class: 'sg-top' }, ferme, h('span', { class: 'sg-nom' }, se.nom), h('span', { class: 'sg-n' })), prog, titre, corps, barre);
    const nEl = ov.querySelector('.sg-n');
    document.body.appendChild(ov); document.body.classList.add('sg-ouvert');
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { verrou = l; }, () => {}); } catch (e) { /* facultatif */ }
    function fermer() { stopRepos(); ov.remove(); document.body.classList.remove('sg-ouvert'); if (verrou) { verrou.release().catch(() => {}); verrou = null; } if (prec && prec.focus) prec.focus(); }
    ferme.addEventListener('click', () => { if (st.i < 0 || st.i >= ex.length) { fermer(); return; } quitter(); });
    ov.addEventListener('keydown', e => { if (e.key === 'Escape') ferme.click(); });
    function stopRepos() { if (st.repos) { clearInterval(st.repos.iv); st.repos = null; } }
    function majProg() { const faits = st.series.filter((n, k) => n >= (ex[k].series || 1)).length; prog.style.setProperty('--p', ex.length ? faits / ex.length : 0); prog.setAttribute('aria-valuenow', String(faits)); nEl.textContent = st.i >= 0 && st.i < ex.length ? (st.i + 1) + ' / ' + ex.length : ''; }
    function poser(t, kids, actions) { titre.textContent = t; corps.textContent = ''; barre.textContent = ''; U().add(corps, kids); U().add(barre, actions); majProg(); titre.focus({ preventScroll: true }); ov.scrollTop = 0; }

    function accueil() {
      st.i = -1;
      poser(se.nom, [
        h('p', { class: 'sg-lead' }, se.duree + ' min · ' + ex.length + ' exercice' + (ex.length > 1 ? 's' : '') + ' · ' + se.objectif),
        se.echauffement && se.echauffement !== 'Aucun' ? h('div', { class: 'sg-bloc' }, h('h2', null, 'Échauffement'), h('p', null, se.echauffement)) : null,
        douleur ? h('div', { class: 'sg-limite', role: 'note' }, h('b', null, 'Limite appliquée'), h('p', null, 'Tu as signalé une douleur : si un mouvement la réveille, arrête-le et prends l’alternative. Une douleur vive ou qui dure se montre à un médecin.')) : null,
        h('ol', { class: 'sg-plan' }, ex.map(e => h('li', null, h('span', null, e.nom), h('b', null, e.type === 'cardio' ? e.reps : e.series + ' × ' + e.reps))))
      ], [h('button', { class: 'btn sg-go', type: 'button', onclick: () => exercice(0) }, 'Commencer')]);
    }
    function exercice(i) {
      stopRepos(); st.i = i; const e = ex[i], cardio = e.type === 'cardio', total = e.series || 1;
      const compteur = h('p', { class: 'sg-compte', 'aria-live': 'polite' });
      const reposZone = h('div', { class: 'sg-repos' });
      const majC = () => { compteur.textContent = cardio ? (st.series[i] ? 'Fait' : 'À faire') : 'Série ' + Math.min(st.series[i] + (st.series[i] < total ? 1 : 0), total) + ' sur ' + total + (st.series[i] >= total ? ' · terminé' : ''); serieBtn.disabled = st.series[i] >= total; };
      const serieBtn = h('button', { class: 'btn sg-serie', type: 'button', onclick: () => { st.series[i] = Math.min(total, st.series[i] + 1); majC(); majProg(); if (window.CapSon) window.CapSon.jouer('selection'); if (st.series[i] < total && e.repos) proposerRepos(); else if (st.series[i] >= total) suivantBtn.focus(); } }, cardio ? 'C’est fait' : 'Série faite');
      function proposerRepos() {
        reposZone.textContent = '';
        reposZone.appendChild(h('button', { class: 'btn secondary', type: 'button', onclick: () => lancerRepos(e.repos) }, 'Lancer le repos · ' + e.repos + ' s'));
      }
      function lancerRepos(sec) {
        stopRepos(); const t0 = Date.now(); const aff = h('b', { class: 'sg-chrono', role: 'timer', 'aria-live': 'off' });
        const ann = h('span', { class: 'sr', 'aria-live': 'polite' });
        reposZone.textContent = ''; U().add(reposZone, h('div', { class: 'sg-chrono-l' }, h('span', null, 'Repos'), aff), ann, h('button', { class: 'btn text', type: 'button', onclick: () => { stopRepos(); reposZone.textContent = ''; } }, 'Passer le repos'));
        const tick = () => { const r = Math.max(0, sec - Math.floor((Date.now() - t0) / 1000)); aff.textContent = Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0'); if (r === 0) { stopRepos(); ann.textContent = 'Repos terminé'; aff.textContent = 'À toi'; if (window.CapSon) window.CapSon.jouer('etape'); } };
        tick(); st.repos = { iv: setInterval(tick, 500) };
      }
      const dernier = i === ex.length - 1;
      const suivantBtn = h('button', { class: 'btn ' + (dernier ? '' : 'secondary'), type: 'button', onclick: () => dernier ? terminer() : exercice(i + 1) }, dernier ? 'Terminer la séance' : 'Exercice suivant');
      poser(e.nom, [
        h('p', { class: 'sg-cible' + (String(e.reps).length > 5 ? ' long' : '') }, cardio ? e.reps : h('span', null, h('b', null, String(e.series)), ' × ', h('b', null, String(e.reps)))),
        h('p', { class: 'sg-sous' }, cardio ? 'Cardio' : 'séries × répétitions' + (e.repos ? ' · repos ' + e.repos + ' s' : '')),
        compteur, reposZone,
        e.consigne ? h('div', { class: 'sg-bloc' }, h('h2', null, 'Consigne'), h('p', null, e.consigne)) : null,
        h('div', { class: 'sg-bloc' }, h('h2', null, 'Alternative'), h('p', null, e.alternative || 'Pas d’alternative avec ton matériel.')),
        e.raison ? h('details', { class: 'sg-pourquoi' }, h('summary', null, 'Pourquoi cet exercice'), h('p', null, e.raison)) : null,
        e.horsBibliotheque ? h('p', { class: 'foot', style: 'color:var(--warn)' }, 'Exercice proposé hors bibliothèque : non vérifié par Cap.') : null
      ], [i > 0 ? h('button', { class: 'btn text', type: 'button', onclick: () => exercice(i - 1) }, 'Précédent') : h('button', { class: 'btn text', type: 'button', onclick: accueil }, 'Aperçu'), serieBtn, suivantBtn]);
      majC();
    }
    function terminer(partielle) {
      stopRepos(); st.i = ex.length;
      const A = { ressenti: null };
      const faits = st.series.filter((n, k) => n >= (ex[k].series || 1)).length;
      const save = h('button', { class: 'btn', type: 'button', disabled: true }, 'Enregistrer la séance');
      const ctx = { A, onChange: [], changed() { save.disabled = !A.ressenti; } };
      const err = h('div', { class: 'err', role: 'alert' });
      save.addEventListener('click', async () => {
        save.disabled = true;
        const doc = { date: dayId(), cle: se.cle, nom: se.nom, ressenti: A.ressenti, exercicesFaits: faits, exercicesPrevus: ex.length };
        if (partielle || faits < ex.length) doc.partielle = true;
        try { await put('seances', 's' + Date.now().toString(36), doc); fermer(); toast('Séance enregistrée'); if (window.CapSon) window.CapSon.jouer('objectif'); }
        catch (e2) { err.textContent = 'Échec de l’enregistrement. Ta séance n’est pas perdue : réessaie.'; save.disabled = false; }
      });
      poser(partielle ? 'Séance arrêtée' : 'Séance terminée', [
        h('p', { class: 'sg-lead' }, faits + ' exercice' + (faits > 1 ? 's' : '') + ' sur ' + ex.length + ' terminé' + (faits > 1 ? 's' : '') + '.' + (faits < ex.length ? ' Une séance partielle compte aussi : elle est enregistrée comme telle.' : '')),
        h('div', { class: 'field' }, 'Comment c’était ?', U().choices(ctx, 'ressenti', [{ v: 'facile', t: 'Facile', s: 'J’aurais pu en faire plus' }, { v: 'ok', t: 'Correct', s: 'Difficile mais maîtrisé' }, { v: 'dur', t: 'Très dur', s: 'Je n’ai pas fini ou j’ai forcé' }])),
        h('p', { class: 'foot muted' }, 'Ton ressenti sert à ajuster la suite : plusieurs séances « très dur » allègent le programme.'), err
      ], [h('button', { class: 'btn text', type: 'button', onclick: fermer }, 'Fermer sans enregistrer'), save]);
    }
    function quitter() {
      stopRepos();
      poser('Quitter la séance ?', [h('p', { class: 'sg-lead' }, 'Rien n’est perdu : tu peux enregistrer ce que tu as fait, ou fermer sans rien noter.')],
        [h('button', { class: 'btn text', type: 'button', onclick: () => exercice(Math.max(0, st.i)) }, 'Reprendre'), h('button', { class: 'btn secondary', type: 'button', onclick: () => terminer(true) }, 'Enregistrer ce que j’ai fait'), h('button', { class: 'btn text', type: 'button', onclick: fermer }, 'Fermer')]);
    }
    if (!reduced()) ov.classList.add('in');
    accueil();
    return { fermer };
  }
  window.CapSeance = { ouvrir };
})();
