#!/bin/bash

# ============================================================
# memory.sh — Injection de contexte git au démarrage
# ============================================================
# Ce script tourne automatiquement quand tu lances Claude Code.
# Il génère un snapshot de l'état du projet et le colle dans
# context/PRIMER.md pour que Claude soit immédiatement à jour.
#
# Pour l'activer automatiquement, ajoute cette ligne dans
# ton ~/.bashrc ou ~/.zshrc :
#   alias claude='bash context/memory.sh && claude'
#
# Ou lance-le manuellement avant une session :
#   bash context/memory.sh
# ============================================================

set -e

PRIMER_FILE="context/PRIMER.md"
OUTPUT_FILE="context/.git_snapshot.md"
DATE=$(date "+%A %d %B %Y — %H:%M")

echo ""
echo "🧠 Party Platform — Injection du contexte git..."
echo ""

# ─── Vérifications ───────────────────────────────────────────

if [ ! -d ".git" ]; then
  echo "⚠️  Pas de repo git trouvé. Lance 'git init' d'abord."
  exit 1
fi

if [ ! -f "$PRIMER_FILE" ]; then
  echo "⚠️  context/PRIMER.md introuvable. Vérifie la structure du projet."
  exit 1
fi

# ─── Génération du snapshot ──────────────────────────────────

cat > "$OUTPUT_FILE" << EOF
<!-- GIT SNAPSHOT — Généré automatiquement le $DATE -->
<!-- Ne pas modifier à la main — sera écrasé au prochain démarrage -->

## 📸 Snapshot Git — $DATE

### Branche active
\`\`\`
$(git branch --show-current 2>/dev/null || echo "Impossible de détecter la branche")
\`\`\`

### 5 derniers commits
\`\`\`
$(git log --oneline -5 --format="%h %ad %s" --date=short 2>/dev/null || echo "Aucun commit trouvé")
\`\`\`

### Fichiers modifiés (non commités)
\`\`\`
$(git status --short 2>/dev/null || echo "Rien à signaler")
\`\`\`

### Fichiers modifiés depuis le dernier commit
\`\`\`
$(git diff --name-only HEAD 2>/dev/null || echo "Aucune modification")
\`\`\`

### Stats du repo
\`\`\`
Nombre total de commits : $(git rev-list --count HEAD 2>/dev/null || echo "?")
Dernier commit          : $(git log -1 --format="%ar" 2>/dev/null || echo "?")
Auteur dernier commit   : $(git log -1 --format="%an" 2>/dev/null || echo "?")
\`\`\`
EOF

# ─── Injection dans PRIMER.md ────────────────────────────────

# Supprime l'ancien snapshot s'il existe
if grep -q "<!-- GIT SNAPSHOT" "$PRIMER_FILE"; then
  # Supprime tout entre <!-- GIT SNAPSHOT et le prochain --- ou fin de fichier
  sed -i '/<!-- GIT SNAPSHOT/,/^---/{/^---/!d}' "$PRIMER_FILE" 2>/dev/null || \
  python3 -c "
import re
with open('$PRIMER_FILE', 'r') as f:
    content = f.read()
# Supprime l'ancien snapshot
content = re.sub(r'<!-- GIT SNAPSHOT.*?(?=\n## |\Z)', '', content, flags=re.DOTALL)
with open('$PRIMER_FILE', 'w') as f:
    f.write(content)
"
fi

# Ajoute le nouveau snapshot à la fin de PRIMER.md
echo "" >> "$PRIMER_FILE"
cat "$OUTPUT_FILE" >> "$PRIMER_FILE"

# ─── Résumé affiché dans le terminal ─────────────────────────

echo "✅ Contexte injecté dans context/PRIMER.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📌 Branche : $(git branch --show-current 2>/dev/null)"
echo ""
echo "📝 5 derniers commits :"
git log --oneline -5 --format="   %h %s (%ad)" --date=short 2>/dev/null || echo "   Aucun commit"
echo ""

# Fichiers non commités
DIRTY=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
if [ "$DIRTY" -gt "0" ]; then
  echo "⚠️  $DIRTY fichier(s) non commité(s) :"
  git status --short 2>/dev/null | head -10 | sed 's/^/   /'
  echo ""
  echo "💡 Pense à commiter avant de commencer si c'est du travail de la session précédente."
else
  echo "✅ Repo propre — rien en attente de commit."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 Claude Code est prêt. Bonne session !"
echo ""

# Nettoyage
rm -f "$OUTPUT_FILE"