#!/usr/bin/env bash
# Génère via Recraft API les images des fiches nuisibles termites / mites / puces.
# Pré-requis : export RECRAFT_API_KEY="..." avant de lancer.
# Usage : ./scripts/generate-recraft-images.sh

set -u
: "${RECRAFT_API_KEY:?RECRAFT_API_KEY non défini. export RECRAFT_API_KEY=... puis relance.}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANAT="$ROOT/assets/nuisibles/anatomy"
SPEC="$ROOT/assets/nuisibles/species"
SIGN="$ROOT/assets/nuisibles/signs"
mkdir -p "$ANAT" "$SPEC" "$SIGN"

API="https://external.api.recraft.ai/v1/images/generations"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# generate <file_path> <prompt> <style> <substyle> <size>
generate() {
  local out="$1" prompt="$2" style="$3" substyle="$4" size="$5"
  if [[ -f "$out" ]]; then
    echo "  skip (existe) : $out"
    return 0
  fi
  echo "  → $out"
  local payload
  payload=$(jq -n \
    --arg prompt "$prompt" \
    --arg style "$style" \
    --arg substyle "$substyle" \
    --arg size "$size" \
    '{prompt:$prompt, style:$style, substyle:$substyle, size:$size, n:1}')
  local resp
  resp=$(curl -sS -X POST "$API" \
    -H "Authorization: Bearer $RECRAFT_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload")
  local url
  url=$(echo "$resp" | jq -r '.data[0].url // empty')
  if [[ -z "$url" ]]; then
    echo "    ERREUR Recraft : $resp" >&2
    return 1
  fi
  curl -sS -L "$url" -o "$out"
  echo "    ok ($(du -h "$out" | cut -f1))"
}

echo "━━━ Anatomies (photo réaliste) ━━━"
generate "$ANAT/termite-anatomy.jpg" \
  "Macro photograph of a single termite worker (Reticulitermes) on a clean neutral light beige background, side profile, sharp focus on the pale cream body, head with mandibles visible, six legs, two antennae, soft natural studio lighting, scientific reference photograph, no text, no labels, 4k, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$ANAT/mite-alimentaire-anatomy.jpg" \
  "Macro photograph of a single Plodia interpunctella (Indian meal moth) at rest with wings folded on a clean neutral cream background, side profile, sharp focus on the bicolored wings showing the coppery brown distal half and pale grey proximal half, two long antennae, hairy thorax, six legs, soft natural studio lighting, scientific reference photograph, no text, no labels, 4k, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$ANAT/puce-anatomy.jpg" \
  "Extreme macro photograph of a single cat flea Ctenocephalides felis on a clean neutral light background, side profile, sharp focus showing the laterally compressed dark brown shiny body, large hind jumping legs with powerful femurs, head with antennae and piercing mouthparts, no comb visible artefacts, soft natural studio lighting, scientific reference photograph, no text, no labels, 4k, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

echo "━━━ Fiches espèces (croquis crayon noir/blanc) ━━━"
# Termites
generate "$SPEC/termite-souterrain-santonensis.png" \
  "Detailed pencil sketch of a Reticulitermes santonensis termite worker, side profile, white background, scientific illustration style, fine ink and pencil shading, clear anatomy: pale cream body, broad head, six legs, two short antennae, no text" \
  "digital_illustration" "pencil_drawing" "1024x1024"

generate "$SPEC/termite-saintonge-lucifugus.png" \
  "Detailed pencil sketch of a Reticulitermes lucifugus termite soldier, side profile, white background, scientific illustration style, fine ink and pencil shading, large rectangular dark head with long curved mandibles, pale body, six legs, no text" \
  "digital_illustration" "pencil_drawing" "1024x1024"

generate "$SPEC/termite-bois-sec-kalotermes.png" \
  "Detailed pencil sketch of a Kalotermes flavicollis (yellow-necked drywood termite), side profile, white background, scientific illustration style, fine ink and pencil shading, slightly larger body than common termites, yellow-tinted thorax (rendered in tonal shading), six legs, two antennae, no text" \
  "digital_illustration" "pencil_drawing" "1024x1024"

# Mites
generate "$SPEC/mite-pyrale-indienne-plodia.png" \
  "Detailed pencil sketch of Plodia interpunctella (Indian meal moth) at rest with wings folded along body, side profile, white background, scientific illustration style, fine ink and pencil shading, bicolored wings (darker distal half, lighter proximal half), two long antennae, hairy thorax, no text" \
  "digital_illustration" "pencil_drawing" "1024x1024"

generate "$SPEC/mite-pyrale-farine-ephestia.png" \
  "Detailed pencil sketch of Ephestia kuehniella (Mediterranean flour moth) at rest with wings folded, side profile, white background, scientific illustration style, fine ink and pencil shading, uniformly grey mottled wings, fringe of long scales at wing margin, two antennae, no text" \
  "digital_illustration" "pencil_drawing" "1024x1024"

generate "$SPEC/mite-chocolat-elutella.png" \
  "Detailed pencil sketch of Ephestia elutella (cocoa moth) at rest with wings folded, side profile, white background, scientific illustration style, fine ink and pencil shading, small moth with greyish brown wings showing two pale transverse lines, two antennae, no text" \
  "digital_illustration" "pencil_drawing" "1024x1024"

generate "$SPEC/bruche-ble-sitotroga.png" \
  "Detailed pencil sketch of Sitotroga cerealella (Angoumois grain moth) at rest with wings folded, side profile, white background, scientific illustration style, fine ink and pencil shading, slender pale yellowish-brown moth with pointed wing tips and long fringes, two antennae, no text" \
  "digital_illustration" "pencil_drawing" "1024x1024"

# Puces
generate "$SPEC/puce-chat-ctenocephalides-felis.png" \
  "Detailed pencil sketch of Ctenocephalides felis (cat flea), side profile, white background, scientific illustration style, fine ink and pencil shading, laterally compressed body, prominent hind jumping legs, head with rounded forehead, visible genal and pronotal combs, no text" \
  "digital_illustration" "pencil_drawing" "1024x1024"

generate "$SPEC/puce-chien-ctenocephalides-canis.png" \
  "Detailed pencil sketch of Ctenocephalides canis (dog flea), side profile, white background, scientific illustration style, fine ink and pencil shading, laterally compressed body very similar to cat flea but with a more rounded head, large hind jumping legs, visible combs, no text" \
  "digital_illustration" "pencil_drawing" "1024x1024"

generate "$SPEC/puce-homme-pulex-irritans.png" \
  "Detailed pencil sketch of Pulex irritans (human flea), side profile, white background, scientific illustration style, fine ink and pencil shading, laterally compressed body, smooth head without combs, prominent hind jumping legs, no text" \
  "digital_illustration" "pencil_drawing" "1024x1024"

generate "$SPEC/puce-rat-xenopsylla-cheopis.png" \
  "Detailed pencil sketch of Xenopsylla cheopis (oriental rat flea), side profile, white background, scientific illustration style, fine ink and pencil shading, laterally compressed body, smooth head and pronotum without combs, robust hind legs, no text" \
  "digital_illustration" "pencil_drawing" "1024x1024"

echo "━━━ Signes de présence — TERMITES (photo réaliste) ━━━"
generate "$SIGN/termite-cordonnets-terre.jpg" \
  "Realistic photograph of mud tubes (shelter tubes / cordonnets de terre) built by termites running vertically along an interior plaster wall near a wooden baseboard in a French home, close-up, soft natural daylight, slightly grainy texture of the dried earth tubes, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$SIGN/termite-ailes-abandonnees.jpg" \
  "Realistic photograph of dozens of translucent discarded termite alate wings scattered on a wooden window sill after a swarm, close-up, soft window daylight, sharp focus on the delicate wings, no insects visible, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$SIGN/termite-bois-ronge-galeries.jpg" \
  "Realistic photograph of a wooden beam attacked by termites, surface broken open to reveal internal galleries running along the grain, pale wood interior with darker frass residue, close-up, natural lighting, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$SIGN/termite-galeries-poutre.jpg" \
  "Realistic photograph of a cross-section of a structural wooden roof beam riddled with termite galleries, hollowed interior visible, dust and frass, close-up, dim attic lighting with a single torch beam, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$SIGN/termite-plancher-affaisse.jpg" \
  "Realistic photograph of an interior wooden floor visibly sagging and warped due to advanced termite infestation in an old French apartment, parquet boards uneven, slight gap at the wall edge, soft daylight, no insects visible, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$SIGN/termite-sciure-fine.jpg" \
  "Realistic photograph of a small pile of very fine pale wood frass (looking like coarse sand or coffee grounds) on a dark wooden floor below a small exit hole in a wooden beam, close-up, soft natural light, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

echo "━━━ Signes de présence — MITES ALIMENTAIRES (photo réaliste) ━━━"
generate "$SIGN/mite-papillons-cuisine.jpg" \
  "Realistic photograph of small Indian meal moths flying and resting on a modern French kitchen ceiling near a cupboard, soft warm evening light, motion blur on a couple of moths, others resting near the ceiling-wall corner, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$SIGN/mite-fils-soie-farine.jpg" \
  "Realistic photograph of an opened paper flour bag in a kitchen pantry, showing fine white silk webbing strands binding the flour into clumps, a few tiny caterpillar trails visible, close-up, soft natural light, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$SIGN/mite-larves-plafond.jpg" \
  "Realistic photograph of several small white-cream caterpillar larvae crawling on a white ceiling near the corner of a kitchen cupboard, sharp focus, soft natural light, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$SIGN/mite-cocons-placard.jpg" \
  "Realistic photograph of small silk cocoons of pantry moth larvae lodged in the upper corner of a wooden kitchen cupboard, dust and tiny pupal cases visible, close-up, soft natural light, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$SIGN/mite-grumeaux-farine.jpg" \
  "Realistic photograph of clumps and lumps inside an opened bag of wheat flour bound by silk threads from pantry moth larvae infestation, close-up overhead view, soft natural kitchen light, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

generate "$SIGN/mite-trous-emballages.jpg" \
  "Realistic photograph of a cardboard cereal box and a paper rice bag in a French pantry, both showing small irregular holes chewed through by pantry moth larvae, close-up, soft natural light, no text, photorealistic" \
  "realistic_image" "natural_light" "1820x1024"

echo
echo "━━━ Terminé. Vérifie le contenu de :"
echo "  $ANAT"
echo "  $SPEC"
echo "  $SIGN"
