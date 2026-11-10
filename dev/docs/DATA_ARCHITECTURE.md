# Cap — architecture des données

Dernière mise à jour : 10/11/2026. Décision : **GitHub Pages (interface) + Supabase (compte, synchronisation, IA serveur)**,
choisie par l'utilisateur le 10/11/2026.

## 1. Vue d'ensemble

```
iPhone / ordinateur (navigateur)                      Supabase (projet gratuit)                 Anthropic
┌───────────────────────────────┐   HTTPS + jeton   ┌──────────────────────────────┐  clé secrète ┌──────────┐
│ index.html + modules JS       │ ────────────────▶ │ Auth (code à 6 chiffres)     │              │ API      │
│  engine.js  calculs (A)       │                   │ Postgres : cap_docs (RLS)    │              │ Claude   │
│  sync.js    export/fusion     │ ◀──── temps réel ─│ Realtime (cap_docs)          │              │ Haiku 5.5│
│  cloud.js   compte + base     │                   │ Edge Function cap-ai ────────┼─────────────▶│          │
│  ai.js      IA (B) → validée  │ ── fonction ────▶ │   quotas : cap_ai_usage      │              └──────────┘
│             par engine (C)    │                   └──────────────────────────────┘
│ localStorage : mode sans      │
│ compte, cache, secours        │
└───────────────────────────────┘
```

Trois moteurs, comme demandé :
- **A — déterministe** (`engine.js`) : tous les chiffres critiques (calories, rythme, budget, épargne, faisabilité). Testé : 80 tests.
- **B — IA générative** (`ai.js` → `cap-ai` ou capacité Claude) : identifie des aliments, rédige les réponses du coach.
- **C — validation** (`CapEngine.validerScan`, règles du coach) : tout chiffre issu de l'IA est recalculé ou rejeté avant affichage ; le coach n'a le droit d'utiliser que les chiffres du moteur A.

## 2. Une seule source, trois stockages

`app.js` lit et écrit toujours par la même interface (`collection(c).doc(id).set / delete / get / onSnapshot`).
Au démarrage, le premier stockage disponible gagne :

| Ordre | Stockage | Quand | Synchronisé | IA |
|---|---|---|---|---|
| 1 | Base de l'artefact Claude | page ouverte dans Claude | oui (compte Claude) | capacité `sample` |
| 2 | Supabase (`cloud.js`) | version GitHub, `config.js` rempli, utilisateur connecté | oui (temps réel) | fonction `cap-ai` |
| 3 | Appareil (`localStorage`, clé `cap-local`) | sinon | non | aucune |

Version officielle : **la version GitHub connectée à Supabase**. La version Claude reste l'environnement de développement
et d'essai ; ses données se transfèrent par export/import.

## 3. Modèle de données

Une table de documents, même modèle que la base Claude, pour garder un seul code et un export trivial :

```sql
cap_docs (user_id uuid, coll text, doc_id text, data jsonb, updated_at timestamptz)  -- clé : (user_id, coll, doc_id)
```

| Collection | Identifiant | Contenu |
|---|---|---|
| `profil` | `main` | réponses au questionnaire, objectifs (un seul profil par compte) |
| `historique` | `p-<horodatage>` | chaque version remplacée du profil, avec la raison (modification, questionnaire, import) |
| `pesees` | date `AAAA-MM-JJ` | poids, tour de taille |
| `repas` | date | journal alimentaire du jour |
| `epargne` | identifiant | mouvements d'argent |
| `seances` | identifiant | séances de sport |
| `actions` | lundi de la semaine | actions cochées |
| `prefs` | `main` | favoris, réglages nutrition |
| `aliments`, `recettes` | identifiant | créations de l'utilisateur |
| `photos` | identifiant | fiches des photos de progression (fichiers dans Claude, non transférables) |

Compromis assumé : un document JSON par entrée plutôt que des tables relationnelles. Pour un seul utilisateur et
quelques milliers de lignes, c'est plus simple et suffisant ; on perd les requêtes SQL d'analyse croisées
(acceptable : les calculs sont faits dans `engine.js`). À revoir si Cap devient multi-utilisateur public.

## 4. Sécurité

- **RLS** sur `cap_docs` : lecture, ajout, modification, suppression seulement si `user_id = auth.uid()`.
  Vérifié dans un Postgres embarqué (`supabase/tests/rls-test.mjs`, 15 tests : un utilisateur ne voit ni ne modifie les lignes d'un autre, l'anonyme ne voit rien).
- **Clés** : le navigateur n'a que la clé publique (`anon` / `publishable`), prévue pour être visible.
  La clé `service_role` et la clé Anthropic restent des secrets Supabase, jamais dans le dépôt (contrôle : `git grep`, voir guide).
- **Inscriptions fermées** : `shouldCreateUser: false` ; seuls les comptes créés dans le tableau de bord peuvent se connecter.
- **IA** : consignes fixées côté serveur (le navigateur ne peut pas en faire un assistant générique), entrées validées
  avant toute dépense, quotas par jour (20 scans, 40 messages par défaut), origine limitée à GitHub Pages (CORS).
  Vérifié avec services simulés (`supabase/tests/cap-ai-test.ts`, 13 tests).
- **Données de santé** : Supabase héberge les données (région à choisir à la création, Europe recommandée).
  Ce sont des données sensibles : compte protégé par e-mail, pas de partage, export possible à tout moment.

## 5. Migration sans perte

Règles appliquées par `sync.js` (29 tests) et `donnees.js` (27 tests d'interface) :

1. **Export** : fichier JSON complet avec comptes par rubrique et empreinte de contrôle (détecte un fichier tronqué ou modifié).
2. **Import** : aperçu avant tout changement — nouveaux éléments, doublons ignorés, conflits (même identifiant, contenu différent), profil différent signalé.
3. **Par défaut, rien d'existant n'est modifié** : seuls les nouveaux éléments sont ajoutés.
4. **Remplacement** seulement après une confirmation explicite ; l'ancien profil part dans `historique`.
5. **Aucune suppression** : un élément absent du fichier importé n'est jamais effacé.
6. **Copie de secours** automatique sur l'appareil avant chaque import et avant « Tout effacer » (`cap-backup`, plus la précédente `cap-backup-prev`).
7. **Connexion au compte** : comparaison appareil / compte ; compte vide → proposition d'envoi ; compte rempli → ajout de ce qui manque ou remplacement confirmé. Les données locales restent intactes.

Procédure pour réunir les versions existantes :
1. Dans la version Claude : Réglages → Exporter mes données → Enregistrer le fichier (ou Copier).
2. Dans la version GitHub (écran d'accueil) : Réglages → Importer une sauvegarde → choisir le fichier → vérifier l'aperçu → Ajouter.
3. Réglages → Compte Cap → se connecter → Envoyer. Faire de même sur chaque autre appareil : les doublons sont ignorés.

## 6. Coûts et limites (vérifiés le 10/11/2026, à revérifier avant création)

| Service | Offre | Prix | Limites utiles |
|---|---|---|---|
| GitHub Pages | dépôt public | 0 € | site statique |
| Supabase Free | 2 projets | 0 € | 500 Mo de base, 50 000 utilisateurs actifs/mois, 500 000 appels de fonctions/mois, 5 Go de transfert ; **pause après 7 jours sans activité** (réactivable depuis le tableau de bord) |
| Supabase Pro | si besoin | 25 $/mois | 8 Go, pas de pause |
| API Claude (Haiku 5.5) | à l'usage | 0,10 $ / million de jetons en entrée, 0,50 $ en sortie (requêtes < 100 000 jetons) | — |

Estimation IA (confiance moyenne, dépend de la taille réelle des photos) : un scan ≈ 2 000 jetons en entrée et 300 en sortie,
soit environ 0,0004 $ ; 10 scans et 20 messages par jour ≈ 0,20 à 0,50 $ par mois. Une limite de dépense mensuelle
doit être fixée dans la console Anthropic (par exemple 5 $).

**Conditions d'âge** : l'API Anthropic est réservée aux personnes majeures ; les conditions de Supabase exigent d'avoir
la capacité de s'engager contractuellement. Les deux comptes doivent donc être ouverts et payés par un parent.

Sources : [Tarifs Claude API](https://platform.claude.com/docs/en/about-claude/pricing),
[Limites Supabase Free 2026](https://automationatlas.io/answers/supabase-free-tier-limits-2026/),
[Conditions Supabase](https://supabase.com/terms).
