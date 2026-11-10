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
sed "s/'Tes données sont enregistrées sur ce téléphone uniquement. Le scan photo et le coach ne sont disponibles que dans l’appli Claude.'/'Mode sans compte : tes données sont enregistrées sur cet appareil uniquement. Scan photo et coach indisponibles.'/" app.js > "$OUT/app.js"
cp engine.js logo.js sound.js foods.js sync.js training.js business.js contrats.js matrice.js prompts.js ia.js ai.js journal.js projet.js iaui.js donnees.js "$OUT/"
echo "Version Claude construite dans $OUT/ (publier index.html avec les 16 fichiers .js en fichiers joints,"
echo "capacités : db, sample {images:true}, assets, downloads)."
