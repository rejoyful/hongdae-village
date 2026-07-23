# Isometric source assets

## `cafe_hero_v1`

- Generator: Codex built-in image generation
- Source: `cafe_hero_v1_chroma.png`
- Runtime asset: `../../public/assets/isometric/cafe_hero_v1.png`
- Processing: flat magenta chroma key removal, soft matte/despill, alpha-bounds crop with 12px padding, 256-color runtime palette
- Runtime anchor: bottom-center at the south footprint corner
- Runtime scale: `0.265`

Final prompt:

> Create one original two-story Hongdae corner café and artist-studio building as a production game sprite. Use polished high-detail pixel art with deliberate crisp square pixel clusters and a strict 2:1 isometric three-quarter view. Show warm café windows, a blank awning and signboards, a small studio balcony, rooftop parapet, water tank, air conditioners, antenna, utility pipes, clothesline, potted plants and worn brick patches. Use warm cream, faded terracotta, muted teal, walnut brown and amber light. Isolate the complete building on a perfectly flat solid magenta chroma-key background with no ground, shadow, people, text, logos or watermark.

The design is original and does not reproduce an existing game's building or branded storefront.

## `village_buildings_v1`

Five additional authored buildings use `cafe_hero_v1` as a rendering-density reference while keeping original silhouettes and functions.

| Runtime asset | Source chroma image | Footprint | Runtime scale |
| --- | --- | --- | --- |
| `home_hero_v1.png` | `home_hero_v1_chroma.png` | 5×4 | `0.33` |
| `atelier_hero_v1.png` | `atelier_hero_v1_chroma.png` | 5×4 | `0.285` |
| `petshop_hero_v1.png` | `petshop_hero_v1_chroma.png` | 4×4 | `0.284` |
| `studio_hero_v1.png` | `studio_hero_v1_chroma.png` | 4×3 | `0.27` |
| `record_hero_v1.png` | `record_hero_v1_chroma.png` | 4×3 | `0.306` |

- Generator: Codex built-in image generation, one request per distinct asset
- Processing: flat magenta chroma key removal, soft matte/despill, alpha-bounds crop with 12px padding, nearest-neighbor runtime normalization to 846px height, 256-color runtime palette
- Runtime anchor: bottom-center at the south footprint corner
- Shared constraints: strict 2:1 isometric view, highly detailed crisp pixel art, blank signs, no ground/shadow/people/readable text/logos/watermark
- Subject prompts: a lived-in three-story Korean home; a two-story sewing and customization atelier; a two-story pet shop with rooftop play terrace; a two-story four-cut photo and portrait workshop; a three-story vinyl shop and rehearsal studio

All five designs are original and use the first café only as a local style and pixel-density reference.

## `diy_workbench_v1`

- Generator: Codex built-in image generation
- Source: `diy_workbench_v1_chroma.png`
- Runtime asset: `../../public/assets/isometric/diy_workbench_v1.png`
- Processing: flat magenta chroma key removal, soft matte/despill, alpha crop, 128×128 nearest-neighbor normalization, 40-color runtime palette
- Runtime anchor: bottom-center on the activity tile
- Runtime scale: `0.72`

Final prompt:

> Create one compact mobile DIY furniture workbench for a cozy Korean alley lifestyle game: a sturdy warm-oak table, muted-sage tool cabinet, folded cream fabric, small wooden stool, neatly arranged hand tools and one unfinished miniature chair part. Render it as highly detailed hand-crafted pixel art in a strict 2:1 isometric three-quarter view with chunky clean pixel clusters and a warm muted oak, cream, terracotta and sage palette. Center the full silhouette on a perfectly flat solid magenta chroma-key background with no ground, cast shadow, people, animals, text, logo or watermark.

The workbench is an original production prop created for this project. The built-in image generation path was used, followed by the repository pixel-art pipeline.

## `taste_showcase_booth_v1`

- Generator: Codex built-in image generation
- Source: `taste_showcase_booth_v1_chroma.png`
- Runtime asset: `../../public/assets/isometric/taste_showcase_booth_v1.png`
- Processing: flat magenta chroma key removal, soft matte/despill, 192×192 runtime normalization with alpha preserved
- Runtime anchor: bottom-center, one tile north of the interaction spot
- Runtime scale: `0.78`

Final prompt:

> Create a cozy community taste exhibition booth for a detailed pixel-art life simulation game, displaying residents' fashion, home decorating, and pet companion memories. Make one compact freestanding wooden folding exhibition kiosk with a small canopy, cork display panels, abstract outfit swatches, a tiny room diorama, a paw-shaped charm, handmade zines, fabric samples and two clip lamps. Render it as high-detail hand-authored pixel art in a three-quarter 2:1 isometric view with crisp pixel clusters and a muted sage, terracotta, oat cream and walnut palette. Center the complete silhouette on a perfectly flat solid magenta chroma-key background with generous padding. No characters, ground, shadow, text, letters, numbers, logos, trademarks or watermark.

The booth is an original production prop for the noncompetitive alley taste exhibition. Its visual sections mirror the three live data sources used by the activity: current outfit, latest home arrangement, and active companion profile.

## `hobby_club_board_v1`

- Generator: Codex built-in image generation
- Source: `hobby_club_board_v1_chroma.png`
- Runtime asset: `../../public/assets/isometric/hobby_club_board_v1.png`
- Processing: flat magenta chroma key removal, soft matte/despill, 192×192 runtime normalization with alpha preserved
- Runtime anchor: bottom-center, one tile north of the interaction spot
- Runtime scale: `0.78`

Final prompt:

> Create one welcoming neighborhood hobby-club bulletin station for a detailed cozy pixel-art life simulation. Build a freestanding warm-walnut board with a muted-sage striped rain canopy, zine shelf, brass pushpins, and six distinct image-only clusters: fabric and thread, a chair and floor plan, a paw tag and leash, seeds and a recipe, fish and ripple sketches, and a concert flyer with cassette. Render it as high-detail hand-authored pixel art in a strict 2:1 isometric view, using muted sage, terracotta, oat, walnut and dusty mustard. Isolate the full prop on a perfectly flat solid magenta chroma-key background with no ground, shadow, characters, readable text, logos or watermark.

The board is an original production prop. Its six visual clusters map directly to the six simultaneous, non-exclusive lifestyle societies in the game.

## `community_project_pavilion_v1`

- Generator: Codex built-in image generation
- Source: `community_project_pavilion_v1_chroma.png`
- Runtime asset: `../../public/assets/isometric/community_project_pavilion_v1.png`
- Processing: flat magenta chroma key removal, soft matte/despill, aspect-preserving 256px runtime normalization with alpha preserved
- Runtime anchor: bottom-center beside the project interaction tile
- Runtime scale: `0.82`

Final prompt:

> Create one welcoming neighborhood community-project planning pavilion for a high-detail cozy pixel-art life simulation. Build a compact warm-wood pavilion with a muted-sage canvas roof, angled drafting table, image-only blueprints, brass lamp, rolled plans, tools, and five miniature material samples: a bench with planter, ripple-and-reed garden, long supper table, paw trail marker, and low fabric-backed stage. Render it as hand-authored pixel art in a strict 2:1 isometric view using muted sage, oat, walnut, dusty terracotta, aged brass and faded blue-gray. Isolate the complete prop on a perfectly flat solid magenta chroma-key background with no ground, shadow, characters, readable text, logos or watermark.

The five miniature samples mirror the five permanent community projects. The runtime adds milestone flags after 4, 8, 12, 16 and 20 completed phases so progression remains visible in the world.

## `neighborhood_guide_kiosk_v1`

- Generator: Codex built-in image generation
- Source: `neighborhood_guide_kiosk_v1_chroma.png`
- Runtime asset: `../../public/assets/isometric/neighborhood_guide_kiosk_v1.png`
- Processing: flat magenta chroma key removal, soft matte/despill, 256×128 nearest-neighbor normalization, 96-color runtime palette
- Runtime anchor: bottom-center, one tile north of the interaction spot
- Runtime scale: `0.82`

Final prompt:

> Use case: stylized-concept. Asset type: isolated isometric game environment prop for a cozy 2.5D pixel-art village. Create one detailed neighborhood walking-tour information kiosk and postcard desk: compact warm wood kiosk, muted sage-green fabric awning, parchment route map board, several small postcard pockets, brass route pins, a tiny stamp tray, subtle brick-red and dusty-blue accents. High-detail 32-bit pixel art, crisp deliberate pixel clusters, readable silhouette at small game scale, charming Korean urban-neighborhood atmosphere without copying any existing game or franchise. Isometric three-quarter view consistent with a 2:1 diamond-tile world, centered, full prop visible, base roughly one tile wide, generous padding. No people, no animals, no readable text, no letters, no logos, no watermark. Background must be a perfectly uniform flat chroma key color #ff00ff edge to edge, with absolutely no gradient, texture, shadow, reflection, horizon, floor plane, or cast/contact shadow. Do not use #ff00ff anywhere in the kiosk itself. The subject must have clean high-contrast boundaries suitable for chroma-key transparency removal.

The kiosk is an original production prop. Its route map, postcard racks and stamp tray correspond to the twelve permanent four-stop tours, six mood filters and claimable completion postcards in the live panel.

## `village_finder_kiosk_v1`

- Generator: Codex built-in image generation
- Source: `village_finder_kiosk_v1_chroma.png`
- Runtime asset: `../../public/assets/isometric/village_finder_kiosk_v1.png`
- Processing: flat magenta chroma key removal, soft matte/despill, 192×192 bottom-anchored nearest-neighbor normalization, 112-color runtime palette
- Runtime anchor: bottom-center, one tile north of the interaction spot
- Runtime scale: `0.78`

Final prompt:

> Use case: stylized-concept. Asset type: production game environment prop sprite. Create one highly detailed cozy 2.5D isometric pixel-art neighborhood finder kiosk for a Korean urban village game: a compact freestanding aged-walnut cabinet with cream map cards, brass fittings, muted-sage tiled awning, warm amber lantern, abstract colored drawer tabs, and a brass magnifying-glass emblem without letters. Render it in a strict 2:1 isometric three-quarter view with crisp intentional pixel clusters, a one-tile footprint and a complete centered silhouette. Use a perfectly flat uniform `#ff00ff` chroma-key background. No people, animals, ground, floor, cast shadow, reflection, readable text, logos or watermark, and no magenta in the subject.

The finder kiosk is an original production prop. Its map, drawers and magnifying-glass emblem ground the global resident, activity, district and quest search in the central square instead of leaving it as a HUD-only feature.

## `neighborhood_museum_cabinet_v1`

- Generator: Codex built-in image generation
- Source: `neighborhood_museum_cabinet_v1_chroma.png`
- Runtime asset: `../../public/assets/isometric/neighborhood_museum_cabinet_v1.png`
- Processing: flat magenta chroma key removal, soft matte/despill, 256×128 nearest-neighbor normalization, 112-color runtime palette
- Runtime anchor: bottom-center, one tile north of the interaction spot
- Runtime scale: `0.86`

Final prompt:

> Use case: stylized-concept. Asset type: isolated isometric game environment prop for a cozy 2.5D pixel-art village. Create one original outdoor neighborhood micro-museum display pavilion: a compact warm-walnut glass-front curiosity cabinet under a muted sage canvas canopy, with eight clearly separated small exhibit compartments and a lower row of six brass-edged display pedestals. Inside the eight compartments, show tiny image-only objects suggesting clothing thread, a miniature room, a paw tag, pressed leaves, a plate, water ripples, a neighborhood zine, and a forest specimen. Add small museum lamps, brass hinges, drawer labels with no writing, and restrained terracotta and dusty blue accents. High-detail 32-bit pixel art with crisp deliberate pixel clusters, strong readable silhouette at small game scale, charming Korean urban-neighborhood atmosphere, original design without copying any existing game or franchise. Strict 2:1 isometric three-quarter view, centered, full prop visible, roughly one-and-a-half tiles wide, generous padding. Render the glass as opaque blue-gray pixel highlights rather than true transparency. No people, animals, readable text, letters, numbers, logos, or watermark. Background must be perfectly uniform flat #ff00ff edge to edge with absolutely no gradient, texture, shadow, reflection, horizon, floor plane, cast shadow, or contact shadow. Do not use #ff00ff in the pavilion. Clean high-contrast boundaries suitable for chroma-key removal.

The cabinet is an original production prop. Its eight compartments and six lower pedestals map directly to the eight lifestyle wings, 24 permanent keepsakes and six user-selected featured objects in the live museum panel.
