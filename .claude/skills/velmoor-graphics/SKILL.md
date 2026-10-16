---
name: velmoor-graphics
description: How to create graphics for Winter of Velmoor - SVG art (hero portraits and full figures, NPCs, monsters, scenes, faith symbols) in js/art/, and procedural canvas textures for the 3D view (walls, wall decals, floors, ceilings, props, facades) in js/render/textures/, plus custom image overrides. Use when adding or changing any picture, sprite, texture, decal, furniture, monster art, portrait or scene, or when delegating art work to an agent.
---

# Making Graphics in Velmoor

Read `velmoor-lore` first: `people.md` / `monsters.md` for looks, `set-dressing.md` for objects, `style-guide.md` for content rules. Record new visual canon there.

## Rules that always apply
- Anime/JRPG style. Women in revealing fantasy outfits, tasteful and non-explicit, clearly adult; men heroic, often muscular; monsters dramatic.
- **No crosses or any real-world religious symbol**, anywhere: not in windows (no "+" mullions), doors, timber framing, crates (one diagonal, not an X), sword hilts (down-swept guards), stick figures, gears with 4 spokes in a "+" (use 5-6), "eye in a triangle", stars. Faith marks use only the three symbols (`A.symbol.dawn|pale|root` on canvas, `faithAt` in SVG).
- Everything is generated in code; no image files unless the user supplies them (then `assets/images/<kind>/` + `assets/manifest.js`).

## SVG art (`js/art/`, public API `BT.art` in `api.js`)
| Need | File | API |
|---|---|---|
| hero busts / full bodies | `portraits.js`, `figures.js` | `portrait(opts)`, `figure(opts)` |
| NPC bust / full body | `npcs.js` | `npc(key)`, `npcFigure(key)` |
| monster sprite | `monsters-beasts|undead|humanoids|bosses|folded.js` | `monster(key, {hue})` |
| transition / title scenes | `scenes.js` | `scene(key)` |
| shared props of a story (keepsakes) | `keepsakes.js` | internal |
- Shared helpers live on `BT.ART_INTERNAL` (`core.js`); each file reads what it needs at its top and publishes at its bottom. `api.js` loads last and builds the `*Keys` lists.
- Every SVG needs **unique ids** (use the id factory), balanced tags, resolvable `url(#id)`, no `NaN`/`undefined`: `node tests/test-art.js` checks all keys.
- `UI.art` caches by key + options: include everything that changes the output in the options.
- A monster may reuse another's art with a `hue` shift (`BT.MONSTERS[id].art/hue`), but story-important creatures deserve their own.
- Preview: `tools/preview/art.html?s=monsters|npcs|figures|scenes|portraits` in headless Chrome (`tests/cdp.js`), then Read the screenshot.

## Canvas textures (`js/render/textures/`, `BT.TX`)
- `core.js`: helpers, the base stone set, event billboards, `TX.addPack(fn)`, `TX.get(name)` (lazy `'base|decal'` compositing), `TX.init`. Packs: `city.js` (houses, facades, temples), `dungeon-dressing.js`, `home-dressing.js`. A new themed set = a new pack file added to `index.html` after `core.js`.
- Pack API `A`: `TS` (128), `canvas()`, `shade(hex,f)`, `noise(ctx,amt)`, `bricks(ctx,{...})`, `grab(name, canvas)`, `plankDoor(...)`, `symbol.{dawn,pale,root}`, `rng()`, `seed(n)` (seed first: deterministic output).
- **Everything is 128x128** (the raycaster indexes `TS`). Wider art is split into `_L`/`_R` halves.
- Kinds and conventions:
  - full walls: opaque, tile horizontally; row 0 = ceiling line, row 127 = floor line; `mode` = `house` (repeat middle storey), `stretch`, `tile` for tall town walls.
  - decals `dc_*`: transparent overlays, must read on any base wall; leave the wall visible around them.
  - floors/ceilings: opaque, tile both ways (check a 2x2 layout for seams).
  - props `pr_*`: transparent billboards standing on the bottom edge (or hanging from row 0); alpha < 40 is cut, > 220 is opaque, in between blends.
  - light sources: draw them bright; real light comes from `DR.LIGHTS` (add the name there).
- Preview: `tools/preview/textures.html?f=pr_` (prefix filter) or `?on=sewer` (every decal over a wall). Then `node tests/browser/places.js` and Read the in-game screenshots.
- Init budget: keep a pack under ~200 ms.

## Delegating art to an agent (works well)
Give the agent: its **own file(s) only** (one pack or one art file), the exact list of names with a one-line brief each, the conventions above, the lore files to read, the verification steps (preview page + screenshots + tests), and "report any new canon details". Never let two agents edit one file. Afterwards: run the tests, look at the screenshots yourself, and record the canon in `velmoor-lore`.
