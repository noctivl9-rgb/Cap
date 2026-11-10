# Cap — choix du fournisseur d’IA

Prix vérifiés le 10/11/2026 (sources en bas). Aucun service n’a été souscrit.

| Option | Modèles | Coût | Recherche web | Où ça marche | Limites |
|---|---|---|---|---|---|
| **A. IA de ton compte Claude** (capacité `sample` de l’artefact) | Claude, palier choisi par la plateforme | **0 € en plus** de ton abonnement Claude | Non (l’artefact ne peut pas accéder au web) | Version Claude de Cap uniquement | Barre de Claude en haut ; limites d’usage de ton offre Claude ; pas de recherche de marché sourcée |
| **B. API Claude via Supabase** (fonction `cap-ai`, recommandé pour la version officielle) | Haiku 5.5 : 0,10 $ / 0,50 $ par million de jetons ; Sonnet 5.5 : 2 $ / 10 $ | À l’usage, limite de dépense réglable | Oui : 10 $ / 1 000 recherches + jetons | Version GitHub (officielle), plein écran | Compte API au nom d’un majeur, carte bancaire ; quotas Cap par jour |
| C. API Gemini | 2.5 Flash-Lite : 0,10 $ / 0,40 $ ; offre gratuite limitée | Gratuit possible | Grounding Google : 1 500 req./jour gratuites (2.5 Flash), puis payant | Nécessiterait d’adapter `cap-ai` | **Offre gratuite : contenus utilisés pour améliorer les produits Google.** Inadapté à des données de santé et de budget |
| D. API OpenAI | gpt-6-luna : 0,10 $ / 0,50 $ | À l’usage | 10 $ / 1 000 appels | Nécessiterait d’adapter `cap-ai` | Même coût que B ; pas d’avantage ici |

## Recommandation

1. **Maintenant, gratuitement** : option A pour tester et utiliser l’IA (version Claude de Cap). C’est elle qui a servi aux essais réels.
2. **Version officielle** : option B. Haiku 5.5 pour programmes, questions et explications ; Sonnet 5.5 + recherche web pour les activités (raisonnement plus solide, faits sourcés).

## Estimation de coût de l’option B (confiance moyenne)

| Usage | Jetons estimés | Coût unitaire |
|---|---|---|
| Programme (Haiku) | ≈ 8 000 entrée + 3 000 sortie | ≈ 0,002 $ |
| Explication / questions (Haiku) | ≈ 4 000 + 500 | ≈ 0,0007 $ |
| Recherche d’activités (Sonnet + 5 recherches) | ≈ 40 000 + 5 000, 5 recherches | ≈ 0,18 $ |

Un mois avec 8 programmes, 30 explications et 4 recherches d’activités ≈ **0,8 $**. Le coût peut doubler si les recherches web renvoient de longues pages. Fixer une limite de dépense de 5 $ par mois dans la console Anthropic.

## Activation de l’option B

Voir DEPLOYMENT_GUIDE.md, partie « IA côté serveur ». Variables : `ANTHROPIC_API_KEY` (secret), `CAP_MODELE` (Haiku par défaut), `CAP_MODELE_BUSINESS` (Sonnet par défaut), `CAP_WEB=1` pour la recherche web, `CAP_WEB_MAX` (5), `CAP_GENERATIONS_JOUR` (10). Migrations 1 et 2 à exécuter.

Sources : [Tarifs API Claude et recherche web](https://platform.claude.com/docs/en/about-claude/pricing) · [Outil de recherche web Claude](https://platform.claude.com/en/docs/agents-and-tools/tool-use/web-search-tool) · [Tarifs Gemini (synthèse MorphLLM, oct. 2026)](https://www.morphllm.com/gemini-api-pricing) · [Tarifs OpenAI](https://developers.openai.com/api/docs/pricing)
