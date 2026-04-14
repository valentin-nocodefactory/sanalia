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
      # Utiliser Python pour le remplacement multiline (avec comptage de profondeur div)
      python3 -c "
import re, sys

comp_name = '${comp}'
with open('${comp_file}', 'r') as f:
    comp_html = f.read().strip()

with open('${page}', 'r') as f:
    page_html = f.read()

# Find the opening tag
marker = '<div data-component=\"' + comp_name + '\">'
start = page_html.find(marker)
if start == -1:
    sys.exit(1)

# Find matching closing </div> by counting depth
inner_start = start + len(marker)
depth = 1
pos = inner_start
while pos < len(page_html) and depth > 0:
    next_open = page_html.find('<div', pos)
    next_close = page_html.find('</div>', pos)
    if next_close == -1:
        break
    if next_open != -1 and next_open < next_close:
        depth += 1
        pos = next_open + 4
    else:
        depth -= 1
        if depth == 0:
            end = next_close
        pos = next_close + 6

new_html = page_html[:inner_start] + '\n' + comp_html + '\n' + page_html[end:]

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
