#!/bin/bash
# ══════════════════════════════════════════
# SANALIA — Build script
# Synchronise les composants (header, footer, certifications, mobile-sticky-cta)
# depuis components/ vers toutes les pages HTML.
#
# Usage : ./build.sh
# ══════════════════════════════════════════

set -e
cd "$(dirname "$0")"

COMPONENTS=("header" "footer" "certifications" "mobile-sticky-cta")

# Trouver toutes les pages HTML (exclure components/ et backups)
PAGES=$(find . -name "index.html" -not -path "./components/*" -not -path "*backup*")

count=0

for page in $PAGES; do
  modified=false
  content=$(cat "$page")

  for comp in "${COMPONENTS[@]}"; do
    comp_file="components/${comp}.html"
    if [ ! -f "$comp_file" ]; then
      echo "⚠ Composant manquant : $comp_file"
      continue
    fi

    # Pattern : <div data-component="NAME"> ... </div>
    # On remplace tout le contenu entre les balises
    if grep -q "data-component=\"${comp}\"" "$page" 2>/dev/null; then
      # Utiliser Python pour le remplacement multiline (sed ne gère pas bien)
      python3 -c "
import re, sys

comp_name = '${comp}'
with open('${comp_file}', 'r') as f:
    comp_html = f.read().strip()

with open('${page}', 'r') as f:
    page_html = f.read()

# Match <div data-component=\"NAME\">...anything...</div>
pattern = r'(<div data-component=\"' + re.escape(comp_name) + r'\">).*?(</div>)'
replacement = r'\1\n' + comp_html + r'\n\2'

new_html = re.sub(pattern, replacement, page_html, count=1, flags=re.DOTALL)

if new_html != page_html:
    with open('${page}', 'w') as f:
        f.write(new_html)
    print(f'  ✓ {comp_name}', end=' ')
    sys.exit(0)
else:
    sys.exit(1)
" 2>/dev/null && modified=true
    fi
  done

  if [ "$modified" = true ]; then
    echo "← $page"
    count=$((count + 1))
  fi
done

echo ""
echo "══════════════════════════════════════"
echo "✅ $count pages synchronisées"
echo "══════════════════════════════════════"
