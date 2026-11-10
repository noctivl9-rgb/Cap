#!/usr/bin/env bash
# Copie les modules partagés navigateur/serveur dans supabase/functions/_shared (déploiement de la fonction cap-ai).
set -euo pipefail
cd "$(dirname "$0")/../.."
cp prompts.js supabase/functions/_shared/prompts.js
echo "prompts.js copié dans supabase/functions/_shared/"
