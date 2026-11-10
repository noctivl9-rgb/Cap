/* Cap — sauvegarde, import, compte et migration (interface). La logique de comparaison est dans sync.js.
 * Garanties : aucune suppression lors d'un import ; copie de secours avant toute écriture qui remplace ;
 * confirmation explicite avant un remplacement ; les données locales ne sont jamais effacées par une connexion. */
(function () {
  'use strict';
  const U = () => window.CapUI, Y = window.CapSync, K = () => window.CapCloud;
  const BACKUP = 'cap-backup', BACKUP_PREV = 'cap-backup-prev';
  const fmt = iso => { try { return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } };
  const nomFichier = () => 'cap-sauvegarde-' + U().dayId() + '.json';
  const source = () => ({ claude: 'claude', cloud: 'compte', local: 'appareil' })[U().modeDonnees()];

  async function sauvegardeAuto() {
    const data = await U().snapshotData();
    if (!Y.total(data)) return null;
    const prev = U().store.get(BACKUP); if (prev) U().store.set(BACKUP_PREV, prev);
    const ex = Y.creerExport(data, 'secours-' + source()); U().store.set(BACKUP, ex);
    return ex;
  }

  // ---------------------------------------------------------------- Export
  async function telecharger(texte) {
    if (window.claude && window.claude.use) {
      const dl = await window.claude.use('downloads').catch(() => null);
      if (dl) { await dl.save({ filename: nomFichier(), data: texte }); return 'enregistré'; }
    }
    const blob = new Blob([texte], { type: 'application/json' });
    const f = typeof File === 'function' ? new File([blob], nomFichier(), { type: 'application/json' }) : null;
    // iPhone (écran d'accueil) : la feuille de partage propose « Enregistrer dans Fichiers »
    if (f && navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Sauvegarde Cap' }); return 'partagé'; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nomFichier(); document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return 'téléchargé';
  }
  async function exporter() {
    const { h, sheet, toast } = U();
    let data;
    try { data = await U().snapshotData(); } catch (e) { toast('Échec de la lecture des données. Réessaie.'); return; }
    const ex = Y.creerExport(data, source()), texte = JSON.stringify(ex, null, 1);
    const lignes = Y.COLLS.filter(c => ex.comptes[c]).map(c => h('li', { class: 'foot' }, Y.libelle(c, ex.comptes[c])));
    const close = sheet('Exporter mes données', [
      h('p', { class: 'sub' }, Y.total(data) ? 'Un fichier contenant toutes tes données Cap. Garde-le dans Fichiers ou iCloud : il permet de tout restaurer.' : 'Aucune donnée à exporter pour l’instant.'),
      h('ul', { class: 'calc' }, lignes),
      h('p', { class: 'foot muted' }, 'Empreinte de contrôle : ' + ex.empreinte + '. Elle permet de vérifier, à l’import, que le fichier est complet et intact.'),
      Y.total(data) ? h('button', { class: 'btn', type: 'button', onclick: async () => { try { const r = await telecharger(texte); toast('Sauvegarde ' + r); close(); } catch (e) { if (e && (e.name === 'AbortError' || e.code === 'declined')) return; toast('Échec du téléchargement. Utilise « Copier ».'); } } }, 'Enregistrer le fichier') : null,
      Y.total(data) ? h('button', { class: 'btn secondary', type: 'button', onclick: async () => { try { await navigator.clipboard.writeText(texte); toast('Copié : colle-le dans Notes ou dans l’autre version de Cap'); } catch (e) { toast('Échec de la copie'); } } }, 'Copier le texte') : null
    ], { focus: false });
  }

  // ---------------------------------------------------------------- Import
  function importer() {
    const { h, sheet, toast } = U();
    const err = h('div', { class: 'err', role: 'alert' });
    const zone = h('div', { style: 'display:flex;flex-direction:column;gap:12px' });
    const fichier = h('input', { type: 'file', accept: '.json,application/json,text/plain', id: 'imp-f' });
    const texte = h('textarea', { id: 'imp-t', rows: '4', placeholder: 'Ou colle ici le texte copié depuis l’autre version de Cap' });
    const secours = U().store.get(BACKUP);
    fichier.addEventListener('change', () => { const f = fichier.files && fichier.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { texte.value = String(r.result || ''); analyser(); }; r.readAsText(f); });
    let close;
    async function analyser() {
      err.textContent = ''; zone.textContent = '';
      const lu = Y.lireExport(texte.value.trim());
      if (!lu.ok) { err.textContent = lu.erreurs.join(' '); return; }
      let actuel; try { actuel = await U().snapshotData(); } catch (e) { err.textContent = 'Lecture de tes données actuelles impossible. Réessaie.'; return; }
      const plan = Y.planifier(actuel, lu.data), lignes = Y.resume(plan), t = plan.total;
      zone.appendChild(h('p', { class: 'sub' }, 'Fichier du ' + fmt(lu.exporte_le) + ' (' + (lu.source || 'source inconnue') + '). ' + t.identiques + ' élément(s) déjà présents, ignorés.'));
      if (lu.avertissements.length) zone.appendChild(h('p', { class: 'foot muted' }, lu.avertissements.join(' ')));
      if (!t.nouveaux && !t.conflits) { zone.appendChild(h('p', { class: 'sub' }, 'Rien à importer : tout est déjà là.')); return; }
      zone.appendChild(h('ul', { class: 'calc' }, lignes.map(l => h('li', { class: 'foot' }, l.nom + ' : ' + l.nouveaux + ' nouveau(x)' + (l.conflits ? ', ' + l.conflits + ' différent(s) de tes données' : '')))));
      if (plan.profilsDifferents) zone.appendChild(h('p', { class: 'foot', style: 'color:var(--warn,#B25000)' }, 'Le profil du fichier est différent du tien. Par défaut, ton profil actuel est gardé.'));
      zone.appendChild(h('button', { class: 'btn', type: 'button', onclick: () => ecrire(actuel, lu.data, 'garder') }, t.nouveaux ? 'Ajouter les ' + t.nouveaux + ' nouveaux éléments' : 'Ne rien modifier'));
      if (t.conflits) zone.appendChild(h('button', { class: 'btn secondary', type: 'button', onclick: () => confirmerRemplacement(actuel, lu.data, t.conflits, plan.profilsDifferents) }, 'Remplacer les ' + t.conflits + ' éléments différents par ceux du fichier'));
    }
    function confirmerRemplacement(actuel, entrant, n, profil) {
      const c2 = sheet('Confirmer le remplacement', [
        h('p', { class: 'sub' }, n + ' élément(s) de tes données actuelles seront remplacés par la version du fichier' + (profil ? ', profil compris (l’ancien profil sera gardé dans l’historique)' : '') + '. Rien ne sera supprimé.'),
        h('p', { class: 'foot muted' }, 'Une copie de secours de tes données actuelles est faite juste avant, sur cet appareil.'),
        h('button', { class: 'btn', type: 'button', onclick: () => { c2(); ecrire(actuel, entrant, 'remplacer'); } }, 'Remplacer'),
        h('button', { class: 'btn secondary', type: 'button', onclick: () => c2() }, 'Annuler')
      ], { focus: false });
    }
    async function ecrire(actuel, entrant, mode) {
      const liste = Y.ecritures(actuel, entrant, mode);
      if (!liste.length) { close(); toast('Rien à modifier'); return; }
      try {
        await sauvegardeAuto();
        for (const w of liste) await U().put(w.coll, w.id, w.data);
        close(); toast('Import terminé : ' + liste.length + ' élément(s) enregistrés'); if (window.CapSon) window.CapSon.jouer('valider'); U().refresh();
      } catch (e) { toast('Échec de l’import. Tes données n’ont été que partiellement mises à jour ; relance l’import, les doublons seront ignorés.'); }
    }
    close = sheet('Importer une sauvegarde', [
      h('p', { class: 'sub' }, 'Choisis un fichier exporté depuis Cap. Tu verras ce qui sera ajouté avant que quoi que ce soit change.'),
      h('label', { class: 'field', for: 'imp-f' }, 'Fichier', fichier),
      h('label', { class: 'field', for: 'imp-t' }, 'Texte copié', texte),
      secours ? h('button', { class: 'btn text', type: 'button', onclick: () => { texte.value = JSON.stringify(secours); analyser(); } }, 'Utiliser la copie de secours du ' + fmt(secours.exporte_le)) : null,
      h('button', { class: 'btn secondary', type: 'button', onclick: () => analyser() }, 'Analyser'),
      err, zone
    ], { focus: false });
  }

  // ---------------------------------------------------------------- Compte (Supabase)
  function compte() {
    const { h, sheet, toast } = U(), C = K();
    if (C.connecte()) {
      const close = sheet('Compte Cap', [
        h('p', { class: 'sub' }, 'Connecté : ' + C.email() + '. Tes données sont synchronisées entre tes appareils connectés à ce compte.'),
        h('button', { class: 'btn secondary', type: 'button', onclick: async () => { await C.deconnexion(); close(); location.reload(); } }, 'Se déconnecter'),
        h('p', { class: 'foot muted' }, 'Après déconnexion, tes données restent dans ton compte. Cet appareil revient aux données qu’il avait avant ta connexion.')
      ], { focus: false });
      return;
    }
    const err = h('div', { class: 'err', role: 'alert' });
    const mail = h('input', { id: 'cpt-mail', type: 'email', autocomplete: 'email', inputmode: 'email', placeholder: 'ton@email.fr' });
    const code = h('input', { id: 'cpt-code', inputmode: 'numeric', autocomplete: 'one-time-code', maxlength: '10', placeholder: '123456' });
    const etape2 = h('div', { style: 'display:flex;flex-direction:column;gap:12px', hidden: true });
    const envoyer = h('button', { class: 'btn', type: 'button' }, 'Recevoir un code');
    const valider = h('button', { class: 'btn', type: 'button' }, 'Se connecter');
    let close;
    envoyer.onclick = async () => {
      err.textContent = ''; const m = mail.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)) { err.textContent = 'Adresse e-mail invalide.'; return; }
      envoyer.disabled = true;
      try { await C.envoyerCode(m); etape2.hidden = false; code.focus(); toast('Code envoyé à ' + m); } catch (e) { err.textContent = C.erreur(e); }
      envoyer.disabled = false;
    };
    valider.onclick = async () => {
      err.textContent = ''; valider.disabled = true;
      try { await C.verifierCode(mail.value.trim(), code.value.replace(/\s/g, '')); close(); await migrer(); }
      catch (e) { err.textContent = C.erreur(e); valider.disabled = false; }
    };
    close = sheet('Compte Cap', [
      h('p', { class: 'sub' }, 'Connecte-toi pour sauvegarder tes données en ligne et les retrouver sur tous tes appareils. Tu reçois un code à 6 chiffres par e-mail, pas de mot de passe.'),
      h('label', { class: 'field', for: 'cpt-mail' }, 'E-mail', mail), envoyer,
      add(etape2, h('label', { class: 'field', for: 'cpt-code' }, 'Code reçu', code), valider), err
    ], { focus: false });
  }
  const add = (el, ...cs) => { U().add(el, ...cs); return el; };

  // Première connexion sur cet appareil : on compare l'appareil et le compte, l'utilisateur décide.
  async function migrer() {
    const { h, sheet, toast } = U(), C = K();
    const cloud = C.db();
    const lire = async () => { const out = {}; await Promise.all(Y.COLLS.map(async c => { out[c] = {}; const q = await cloud.collection(c).get(); q.docs.forEach(d => { out[c][d.id] = d.data(); }); })); return out; };
    let distant, local;
    try { distant = await lire(); local = await U().snapshotData(); } catch (e) { toast('Connecté, mais lecture du compte impossible. Réessaie plus tard.'); location.reload(); return; }
    if (!Y.total(local)) { location.reload(); return; }
    const plan = Y.planifier(distant, local), t = plan.total;
    if (!t.nouveaux && !t.conflits) { location.reload(); return; }
    const envoyer = async mode => {
      try {
        const liste = Y.ecritures(distant, local, mode);
        for (const w of liste) await cloud.collection(w.coll).doc(w.id).set(w.data);
        toast(liste.length + ' élément(s) envoyés vers ton compte'); setTimeout(() => location.reload(), 900);
      } catch (e) { toast('Échec de l’envoi. Tes données restent sur cet appareil ; réessaie depuis Réglages.'); }
    };
    const vide = plan.actuelVide;
    const lignes = Y.resume(plan).map(l => h('li', { class: 'foot' }, l.nom + ' : ' + l.nouveaux + ' à envoyer' + (l.conflits ? ', ' + l.conflits + ' différent(s) du compte' : '')));
    const close = sheet(vide ? 'Envoyer tes données ?' : 'Ton compte contient déjà des données', [
      h('p', { class: 'sub' }, vide ? 'Ton compte est vide. Envoyer les données de cet appareil vers ton compte ?' : 'Cet appareil a des données que le compte n’a pas. Choisis quoi faire ; rien ne sera supprimé, ni ici ni dans le compte.'),
      h('ul', { class: 'calc' }, lignes),
      plan.profilsDifferents ? h('p', { class: 'foot' }, 'Le profil de cet appareil est différent de celui du compte. Par défaut, le profil du compte est gardé.') : null,
      h('button', { class: 'btn', type: 'button', onclick: () => { close(); envoyer('garder'); } }, vide ? 'Envoyer' : 'Ajouter ce qui manque au compte'),
      t.conflits && !vide ? h('button', { class: 'btn secondary', type: 'button', onclick: () => { const c2 = sheet('Confirmer le remplacement', [h('p', { class: 'sub' }, t.conflits + ' élément(s) du compte seront remplacés par la version de cet appareil' + (plan.profilsDifferents ? ' (l’ancien profil du compte part dans l’historique)' : '') + '.'), h('button', { class: 'btn', type: 'button', onclick: () => { c2(); close(); envoyer('remplacer'); } }, 'Remplacer'), h('button', { class: 'btn secondary', type: 'button', onclick: () => c2() }, 'Annuler')], { focus: false }); } }, 'Remplacer par cet appareil en cas de différence') : null,
      h('button', { class: 'btn text', type: 'button', onclick: () => { close(); location.reload(); } }, 'Ne rien envoyer')
    ], { focus: false, onClose: () => {} });
  }

  // ---------------------------------------------------------------- Section des Réglages
  function section() {
    const { h, icon } = U(), C = K(), mode = U().modeDonnees();
    const cell = (t, sous, fn) => h('button', { class: 'cell', type: 'button', onclick: fn }, h('span', { class: 'lbl' }, t, sous ? h('small', null, sous) : null), icon('chev', 'chev'));
    const sec = U().store.get(BACKUP);
    const lignes = [
      C && C.configure() && mode !== 'claude' ? cell('Compte Cap', C.connecte() ? 'Connecté : ' + C.email() : 'Non connecté. Connecte-toi pour synchroniser tes appareils.', compte) : null,
      cell('Exporter mes données', 'Fichier de sauvegarde complet, à garder dans Fichiers ou iCloud.', exporter),
      cell('Importer une sauvegarde', sec ? 'Copie de secours disponible : ' + fmt(sec.exporte_le) : 'Depuis un fichier ou un texte copié. Aperçu avant tout changement.', importer)
    ];
    return U().section(null, null, h('div', { class: 'cap' }, 'Sauvegarde et synchronisation'), h('div', { class: 'panel flush' }, lignes));
  }

  window.CapDonnees = { section, exporter, importer, compte, migrer, sauvegardeAuto };
})();
