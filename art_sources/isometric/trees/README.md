# Isometric tree source assets

| Variant | Source | Runtime | Canvas | Scale |
| --- | --- | --- | --- | --- |
| `zelkova` | `zelkova_v1_chroma.png` | `../../../public/assets/isometric/trees/zelkova_v1.png` | 96×128 | `0.72` |
| `ginkgo` | `ginkgo_v1_chroma.png` | `../../../public/assets/isometric/trees/ginkgo_v1.png` | 96×128 | `0.68` |
| `redpine` | `redpine_v1_chroma.png` | `../../../public/assets/isometric/trees/redpine_v1.png` | 96×128 | `0.68` |

- Generator: Codex built-in image generation, one request per tree
- Processing: border-sampled magenta chroma removal, soft matte/despill, alpha crop, nearest-neighbour bottom-center normalization, 96-color palette
- Runtime anchor: bottom-center; Phaser shadow is separate so the sprite remains reusable
- Fallback: when an authored texture is unavailable, `drawIsoTree` renders the original procedural tree

Shared prompt contract:

> Create exactly one complete production 96×128 environment sprite for an original cozy 2.5D isometric pixel-art life sim. Use handcrafted crisp square pixel clusters, a limited palette, dark warm-brown outline, strict 2:1 isometric three-quarter view, substantial visible trunk, opaque foliage clusters, and warm top-left late-afternoon light. Center the tree with its trunk foot on a common bottom baseline over a perfectly flat solid #ff00ff background. No ground, shadow, gradient, texture, scenery, particles, loose leaves, text, logo, watermark, or magenta in the tree.

Subject prompts: a broad asymmetrical Korean zelkova with moss-green and deep-teal layers; a tall tiered urban ginkgo with muted chartreuse and restrained gold fan leaves; an irregular windswept Korean red pine with deep green needle masses and a crooked reddish trunk.

All designs are original. The target game is used only as an atmosphere and production-quality benchmark.
