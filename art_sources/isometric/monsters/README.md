# Isometric monster source assets

## Tier 1 set

| Species | Source | Runtime | Scale |
| --- | --- | --- | --- |
| `slime_g` | `slime_g_v1_chroma.png` | `../../../public/assets/isometric/monsters/slime_g_v1.png` | `0.82` |
| `acornbug` | `acornbug_v1_chroma.png` | `../../../public/assets/isometric/monsters/acornbug_v1.png` | `0.82` |
| `molelet` | `molelet_v1_chroma.png` | `../../../public/assets/isometric/monsters/molelet_v1.png` | `0.82` |
| `glowmoth` | `glowmoth_v1_chroma.png` | `../../../public/assets/isometric/monsters/glowmoth_v1.png` | `0.82` |
| `nutsquirrel` | `nutsquirrel_v1_chroma.png` | `../../../public/assets/isometric/monsters/nutsquirrel_v1.png` | `0.82` |

- Generator: Codex built-in image generation, one request per creature
- Processing: border-sampled magenta chroma removal, soft matte/despill, alpha crop, nearest-neighbour 48×48 bottom-center normalization, 64-color palette
- Runtime anchor: bottom-center with a two-pixel safe margin
- Fallback: each authored image preloads under the existing `mon-<speciesId>` key; if it is absent, `ensureMonster` creates the original 16×16 procedural sprite

Shared prompt contract:

> Create exactly one production 48×48 game monster sprite for an original cozy 2.5D isometric pixel-art life sim. Use handcrafted crisp pixel clusters, a limited palette, dark-brown outline, a compact silhouette readable at 48×48, strict 2:1 isometric three-quarter view facing down-left, and warm top-left late-afternoon light. Center the creature on a flat solid #ff00ff background with its feet on a common bottom baseline. No floor, shadow, aura, particles, extra creatures, text, logo, watermark, or magenta on the creature.

Subject prompts: an opaque moss-green leaf slime with an amber core; an acorn-shell beetle with six legs and curled feelers; a round charcoal baby mole with pink digging paws; a golden firefly moth with an opaque pale abdomen and no glow aura; a copper squirrel with a curled tail, leaf satchel, and acorn.

All designs are original. The target game is used only as a quality and atmosphere benchmark, never as a source to reproduce specific characters.
