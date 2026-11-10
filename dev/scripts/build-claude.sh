#!/usr/bin/env bash
# Construit la version « artefact Claude » de Cap à partir de la racine du dépôt (source unique).
# Usage : bash dev/scripts/build-claude.sh [dossier_sortie]   (défaut : dist-claude/)
# Différences avec la version GitHub Pages :
#  - index.html : sans l'enveloppe <html><head>…</head><body> (Claude l'ajoute à la publication),
#    avec deux balises meta placées dans la page ;
#  - app.js : texte du bandeau « mode sans compte » ;
#  - ni config.js ni cloud.js (Supabase) : dans Claude, la base et l'IA viennent des capacités de l'artefact.
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT="${1:-dist-claude}"
mkdir -p "$OUT"
sed '1d;$d' index.html | grep -v '<script src="config.js"></script>\|<script src="cloud.js"></script>' | awk 'NR==3{print "<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">"; print "<meta name=\"theme-color\" content=\"#F5F5F7\">"} {print}' > "$OUT/index.html"
cp app.js "$OUT/app.js"
mkdir -p "$OUT/css" && cp css/*.css "$OUT/css/"
cp engine.js logo.js sound.js foods.js sync.js training.js business.js contrats.js matrice.js prompts.js ia.js ai.js journal.js kit.js flammes.js accueil.js photos.js seance.js budget.js finances.js projet-budget.js projet.js coach.js iaui.js donnees.js "$OUT/"
echo "Version Claude construite dans $OUT/ (publier index.html avec les fichiers .js et css/*.css en fichiers joints,"
echo "capacités : db, sample {images:true}, assets, downloads)."
