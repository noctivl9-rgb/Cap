/* Cap — signature sonore. Sons originaux synthétisés en direct (Web Audio API), aucun fichier tiers.
 * Désactivés par défaut, joués uniquement après une action de l'utilisateur.
 * iPhone : navigator.audioSession.type = 'ambient' (Safari 16.4+) pour respecter le mode silencieux
 * et ne pas couper la musique en cours. Le retour haptique web (navigator.vibrate) n'existe pas sur iPhone :
 * il n'est utilisé que là où le navigateur le propose (Android). */
(function () {
  'use strict';
  const KEY = 'cap-sons';
  let ctx = null;
  const actif = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
  function contexte() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) { /* non pris en charge */ }
    ctx = new AC();
    return ctx;
  }
  // Une note douce : sinus + légère harmonique, attaque 6 ms, extinction exponentielle
  function note(c, t, freq, dur, gain, dest) {
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    o2.type = 'sine'; o2.frequency.value = freq * 2; g2.gain.value = 0.12;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
    o.start(t); o2.start(t); o.stop(t + dur + 0.02); o2.stop(t + dur + 0.02);
  }
  // Souffle filtré pour l'ouverture d'une expérience (scan, début du parcours)
  function souffle(c, t, dest) {
    const n = Math.floor(c.sampleRate * 0.28), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.24);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.035, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    src.connect(f); f.connect(g); g.connect(dest); src.start(t); src.stop(t + 0.3);
  }
  // La gamme de Cap : mi majeur, aigu et doux (E5 = 659 Hz)
  const SONS = {
    etape: (c, t, d) => { note(c, t, 1318.5, 0.09, 0.035, d); },                                     // fin d'une étape : un seul tic clair
    valider: (c, t, d) => { note(c, t, 659.3, 0.16, 0.05, d); note(c, t + 0.07, 987.8, 0.22, 0.045, d); }, // validation : quinte montante
    objectif: (c, t, d) => { [659.3, 830.6, 987.8, 1318.5].forEach((f, i) => note(c, t + i * 0.07, f, 0.28, 0.04, d)); }, // objectif : arpège
    ouverture: (c, t, d) => { souffle(c, t, d); note(c, t + 0.12, 987.8, 0.3, 0.03, d); }               // ouverture : souffle + note
  };
  const VIBRATIONS = { etape: 6, valider: [8, 40, 12], objectif: [10, 50, 10, 50, 18], ouverture: 10 };
  const S = {
    actif,
    regler(on) { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* stockage indisponible */ } if (on) S.jouer('valider'); },
    jouer(nom) {
      if (!actif() || !SONS[nom]) return false;
      try { if (navigator.vibrate) navigator.vibrate(VIBRATIONS[nom]); } catch (e) { /* non pris en charge */ }
      const c = contexte(); if (!c) return false;
      const go = () => { const m = c.createGain(); m.gain.value = 1; m.connect(c.destination); SONS[nom](c, c.currentTime + 0.01, m); };
      if (c.state === 'suspended') c.resume().then(go, () => {}); else go();
      return true;
    },
    // Pour les tests : rend un son hors ligne et renvoie durée et crête
    async rendre(nom) {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OAC) return null;
      const c = new OAC(1, 44100 * 1, 44100); SONS[nom](c, 0.01, c.destination);
      const b = await c.startRendering(), d = b.getChannelData(0);
      let crete = 0, fin = 0; for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > crete) crete = a; if (a > 0.001) fin = i; }
      return { crete, duree: fin / 44100 };
    }
  };
  window.CapSon = S;
})();
