/* Cap — compte et synchronisation (Supabase). Inactif tant que config.js ne contient pas d'adresse de projet.
 * Expose la même interface que la base de l'artefact Claude (collection/doc, set, delete, get, onSnapshot),
 * pour que app.js n'ait qu'un seul code de lecture/écriture.
 * Sécurité : seule la clé publique (« anon » / « publishable ») est dans le navigateur ; chaque ligne est
 * protégée par une règle RLS user_id = auth.uid(). Aucune clé IA ici : l'IA passe par la fonction serveur cap-ai. */
(function () {
  'use strict';
  const CFG = window.CAP_CONFIG || {};
  const TABLE = 'cap_docs', CACHE = 'cap-cloud-cache', LIB = 'vendor/supabase-2.118.0.js';
  let client = null, session = null, chargement = null;
  const configure = () => !!(CFG.supabaseUrl && CFG.supabaseAnonKey);

  function charger() {
    if (chargement) return chargement;
    chargement = new Promise((ok, ko) => {
      if (window.supabase && window.supabase.createClient) return ok();
      const s = document.createElement('script'); s.src = LIB; s.onload = () => ok(); s.onerror = () => ko(new Error('lib'));
      document.head.appendChild(s);
    }).then(() => {
      client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'cap-auth' } });
      return client.auth.getSession().then(r => { session = r.data.session; return client; });
    });
    return chargement;
  }

  // ---------------------------------------------------------------- Base de documents
  function creerDb(userId) {
    const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* plein ou bloqué */ } } };
    const saved = store.get(CACHE);
    const cache = saved && saved.user === userId ? saved.colls : {}; // coll -> { id: data }
    const charge = {}; // coll -> true quand lu depuis le serveur
    const ecoutes = []; // { coll, id|null, fn }
    const persister = () => store.set(CACHE, { user: userId, colls: cache });
    const docSnap = (c, id) => { const d = cache[c] && cache[c][id]; return { id, exists: !!d, data: () => (d ? JSON.parse(JSON.stringify(d)) : undefined), metadata: { fromCache: !charge[c] } }; };
    const querySnap = c => { const m = cache[c] || {}; return { docs: Object.keys(m).map(id => ({ id, exists: true, data: () => JSON.parse(JSON.stringify(m[id])) })), metadata: { fromCache: !charge[c] } }; };
    const notifier = c => ecoutes.filter(e => e.coll === c).forEach(e => { try { e.fn(e.id ? docSnap(c, e.id) : querySnap(c)); } catch (err) { /* écouteur fautif */ } });
    async function lire(c) {
      const r = await client.from(TABLE).select('doc_id,data').eq('coll', c);
      if (r.error) throw r.error;
      cache[c] = {}; r.data.forEach(row => { cache[c][row.doc_id] = row.data; });
      charge[c] = true; persister(); notifier(c);
    }
    const lectures = {};
    const assurer = c => (lectures[c] = lectures[c] || lire(c).catch(e => { delete lectures[c]; throw e; }));
    // Temps réel : une seule chaîne pour toutes les collections de l'utilisateur
    client.channel('cap-' + userId).on('postgres_changes', { event: '*', schema: 'public', table: TABLE, filter: 'user_id=eq.' + userId }, p => {
      const row = p.eventType === 'DELETE' ? p.old : p.new; if (!row || !row.coll) return;
      cache[row.coll] = cache[row.coll] || {};
      if (p.eventType === 'DELETE') delete cache[row.coll][row.doc_id]; else cache[row.coll][row.doc_id] = row.data;
      persister(); notifier(row.coll);
    }).subscribe();
    function ref(c, id) {
      return {
        id,
        async set(data) {
          const clean = JSON.parse(JSON.stringify(data));
          const r = await client.from(TABLE).upsert({ user_id: userId, coll: c, doc_id: id, data: clean });
          if (r.error) throw r.error;
          cache[c] = cache[c] || {}; cache[c][id] = clean; persister(); notifier(c);
        },
        async delete() {
          const r = await client.from(TABLE).delete().eq('coll', c).eq('doc_id', id);
          if (r.error) throw r.error;
          if (cache[c]) delete cache[c][id]; persister(); notifier(c);
        },
        async get() { await assurer(c); return docSnap(c, id); },
        onSnapshot(fn, err) {
          const e = { coll: c, id, fn }; ecoutes.push(e);
          if (cache[c]) fn(docSnap(c, id));
          assurer(c).catch(x => err && err(x));
          return () => { const i = ecoutes.indexOf(e); if (i >= 0) ecoutes.splice(i, 1); };
        }
      };
    }
    const collection = c => ({
      doc: id => ref(c, id),
      async get() { await assurer(c); return querySnap(c); },
      onSnapshot(fn, err) {
        const e = { coll: c, id: null, fn }; ecoutes.push(e);
        if (cache[c]) fn(querySnap(c));
        assurer(c).catch(x => err && err(x));
        return () => { const i = ecoutes.indexOf(e); if (i >= 0) ecoutes.splice(i, 1); };
      }
    });
    return { collection, doc: path => { const [c, id] = path.split('/'); return ref(c, id); }, cloud: true };
  }

  // ---------------------------------------------------------------- Compte (code à 6 chiffres reçu par e-mail)
  const C = {
    configure,
    iaActivee: () => configure() && CFG.ia === true,
    async init() { if (!configure()) return null; try { await charger(); } catch (e) { return null; } return session; },
    connecte: () => !!session,
    email: () => (session && session.user && session.user.email) || null,
    async envoyerCode(email) {
      await charger();
      // shouldCreateUser:false : seuls les comptes créés dans le tableau de bord Supabase peuvent se connecter
      const r = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: CFG.inscriptionOuverte === true } });
      if (r.error) throw r.error;
    },
    async verifierCode(email, code) {
      await charger();
      const r = await client.auth.verifyOtp({ email, token: code, type: 'email' });
      if (r.error) throw r.error;
      session = r.data.session; return session;
    },
    async deconnexion() { if (!client) return; await client.auth.signOut(); session = null; try { localStorage.removeItem(CACHE); } catch (e) { /* bloqué */ } },
    db() { return session ? creerDb(session.user.id) : null; },
    // IA : la clé reste sur le serveur. Le navigateur envoie seulement la demande et le jeton de session.
    async ia(corps) {
      if (!C.iaActivee() || !session) { const e = new Error('ia'); e.code = 'ia_indisponible'; throw e; }
      const r = await client.functions.invoke('cap-ai', { body: corps });
      if (r.error) {
        let code = 'ia_echec';
        try { const j = await r.error.context.json(); if (j && j.error) code = j.error; } catch (x) { /* pas de corps */ }
        const e = new Error(code); e.code = code; throw e;
      }
      return r.data;
    },
    erreur(e) {
      const m = String((e && (e.code || e.message)) || '');
      if (/expired|invalid.*otp|token/i.test(m)) return 'Code incorrect ou expiré. Demande un nouveau code.';
      if (/rate|too many|security purposes/i.test(m)) return 'Trop de demandes. Attends une minute avant de redemander un code.';
      if (/signups not allowed|not allowed|user not found/i.test(m)) return 'Cette adresse n’a pas de compte Cap. Le compte doit d’abord être créé dans Supabase.';
      if (/fetch|network|lib/i.test(m)) return 'Connexion impossible. Vérifie ton réseau.';
      return 'Échec de la connexion. Réessaie.';
    }
  };
  window.CapCloud = C;
})();
