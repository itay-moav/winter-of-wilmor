# Winter of Velmoor

A Bard's Tale-style first-person party RPG that runs in the browser. Open `index.html` directly (`file://`) or run `php -S localhost:8000`. See `README.md` for features and controls.

## Ground rules (user preferences)

- **Work autonomously.** The user asked not to be asked questions. Make sensible decisions, verify them, and report.
- **Story and lore must stay coherent.** Before writing any story text, quest, NPC, monster, item, building, object or art brief, use the **`velmoor-lore` skill**, and record new canon there in the same change (including objects, set dressing and music).
- **Invented religions only:** the Dawn, the Pale Hour and the Deep Root. Never use real-world religious symbols, **especially crosses** (graves, armour, emblems, window bars, crates, sword hilts, anywhere; avoid "+"-shaped joints).
- **Art direction:** anime/JRPG style. Females in revealing fantasy outfits, tasteful and non-explicit, clearly adults. Males heroic and muscular. Full-body figures are wanted, and monsters should be dramatic.
- **Places must look like their descriptions.** If a text says torches, water, lichen or algae, show them (see `velmoor-maps`). Houses are homes made of rooms, never dungeon corridors, unless they hide a pocket dimension behind an obvious threshold.
- **Music:** battle music is heavy folk metal or bagpipes, in three variants (underground, city, wilderness). Bard songs take over the music while they last: metal for battle songs, classical/Irish for gentle songs, Arabic/oriental for mystical ones. Classical sources (Beethoven, Grieg, Prokofiev...) are welcome but **must be public domain** (Prokofiev: pre-1929 works only). The user wants to *hear* audio: render WAVs (`tests/render-music.js`).
- **Verify visually.** Take screenshots (`tests/browser/screenshots.js`, `tests/browser/places.js`, then Read the PNGs) before saying a visual change is done.
- **Git and GitHub:** the remote is `origin` = https://github.com/itay-moav/winter-of-wilmor (a **public** repo; note the spelling "wilmor"). The `gh` CLI is installed and authenticated as `itay-moav`. Commit or push only when the user asks: pushing publishes to a public repo.

## Hard constraints

- **No build step, no npm dependencies, no network.** Plain `<script>` tags with globals hung off `window.BT`. No ES modules (they break on `file://`) and no web fonts (offline).
- **`index.html` is the single source of truth for script order.** Tests read it (`tests/load.js`), so a new file is added in exactly one place.
- **All art and audio are generated in code:** SVG in `js/art/`, canvas textures in `js/render/textures/`, Web Audio in `js/audio/`. Image overrides go in `assets/images/<kind>/` and are listed in `assets/manifest.js`.

## Architecture: packages

Everything is modular: one concern per file, files grouped in package folders, names that say what the thing is. Every file starts with a 1-2 line header comment saying what it holds.

```
index.html            the page and the ordered <script>/<link> list
css/                  base (variables, frames, animations) | explore | screens | battle | responsive (last)
js/core/              util.js (BT.U: rng, dice, helpers), state.js (BT.ST: game state, characters, saves)
js/data/              rules.js (BT.D: races, classes, songs, faiths), story.js (D.STORY), items, spells, monsters
js/art/               SVG art: core, symbols, portraits, figures, keepsakes, npcs, monsters-*, scenes, api.js (BT.art, last)
js/audio/             Web Audio: core, notation, instruments, tracks-ambient|battle|songs, sfx, player.js (BT.audio, last)
js/maps/              grid (BT.MG model), generator (seeded dungeons), builders (city blocks, house room plans),
                      styles, town, dungeons, houses, realms (data), dressing (BT.DRESS), build.js (BT.buildMaps)
js/render/            textures/ (core + packs: city, dungeon-dressing, home-dressing), raycaster.js (BT.R), automap.js
js/ui/                core (log, menus, input, keys), art (cached art, overlays), party (party bar, HUD), sheet (modals)
js/combat/            hex (BT.HX), view (BT.BV, the battle screen), state (BT.CB + shared kernel BT.CB.K), damage,
                      movement, commands (player orders), party-ai, actions, monster-ai, battle (CB.fight), chest
js/world/             magic (BT.MA), services (BT.TW: guild, shop, temples...), explore (BT.EX: lock, movement, keys),
                      events (cell events, encounters), quests (Concord fountain), endings (game over, ending)
js/app/               main.js (BT.main: boot, title, new game, load), options.js (settings, help)
assets/               manifest.js, images/<portraits|figures|npcs|monsters|scenes>/, audio/previews/ (gitignored WAVs)
tests/                node tests (test-*.js, sim.js, playthrough.js), browser/ (headless Chrome), load.js, cdp.js
tools/                lore-tables.js, preview/ (art.html, audio.html, textures.html galleries)
.claude/skills/       velmoor-lore (canon), velmoor-maps, velmoor-graphics, velmoor-music, velmoor-combat (how-tos)
```

**Package conventions**
- A package owns one global (`BT.CB`, `BT.MG`, `BT.TX`...). Files after the first add to it. Helpers shared *inside* a package go on an internal object (`BT.CB.K`, `BT.ART_INTERNAL`, `BT.AUDIO_INTERNAL`), never as new globals. The file that publishes the public API loads last in its package (`art/api.js`, `audio/player.js`).
- Data files hold data, not logic (`js/data/`, `js/maps/dungeons.js|houses.js|realms.js|styles.js`). New content is usually a data change plus lore.
- Pure logic stays DOM-free so Node tests can run it (`hex.js`, `dressing.js`, `generator.js`, combat rules). The DOM lives in `ui/`, `combat/view.js`, `render/`.
- Optional views are called defensively: combat calls `BT.BV` through `V(...)` and runs headless without it.
- When a file passes ~800 lines or mixes two concerns, split it the same way (a script that cuts at section markers, then byte-compare the output; see "Lessons").

## Lessons learned (non-obvious, learned the hard way)

**Rendering**
- The raycaster indexes every texture as **128x128** (`TX.size`). Anything wider (the 2x2 temple facades) is drawn wide and split into `_L` and `_R` halves (see `texFor`).
- Town buildings have heights (`m.cellH`, `SPECIAL_H`). The town ray continues past short walls and paints far to near. A hit is recorded only when the ray is in an *open* cell. Tall walls map textures by `tex.mode`: default `house` repeats the middle storey band, `stretch` for temples, `tile` for walls and towers.
- In `MG.fromBlocks` (the town), edges are set **from the street side only**. Setting them from building cells overwrote door edges with walls, and doors silently stopped working.
- Sprite textures need alpha. Statue art is loaded asynchronously from SVG into a canvas, with a procedural fallback if the canvas is tainted.
- **Faces, not cells, carry wall pictures:** `m.faceTex[(y*w+x)*4+d]` is `'base|decal'`, composited lazily by `TX.get`. A name whose texture is missing must fall back (`texNamed`) or the frame throws on every draw.
- **Lights** are per map (`m.lights`, `m.cellLights`): they spread through open edges only (walls and closed doors block them) and never into magical darkness. The per-pixel cost is a few lights per cell; keep `lightEvery` around 8-12.
- Anything standing in the player's own cell is skipped (closer than 0.45): otherwise the entrance stairs fill the whole screen.
- Texture packs register with `BT.TX.addPack(fn)` and run in script order at `TX.init`, so a pack may draw over textures from earlier packs.

**Maps and dressing**
- Dungeon layouts come from **seeded generation**. Changing a level spec's features (count, `at`, order) changes the layout, which invalidates old saves' positions and `map:x:y`-keyed flags. **Adding fields** (like `deco`) is safe. `tests/test-maps.js` fingerprints every layout (`tests/fixtures/layouts.json`) and fails on drift; refresh with `--update` only for an intended change.
- **Dressing never touches the layout RNG:** it uses its own seed after generation. Wall variants per style are declared (`STYLES[s].wall2`), because Node cannot check which textures exist.
- A feature's `deco.walls` puts each picture **once** (nearest walls first); `deco.wallsAll` repeats a pattern on every wall nearby. Using `walls` for a fireplace once produced three fireplaces.
- Saves contain only `BT.G`; maps are rebuilt on load, so runtime map edits (Phase Door) don't persist. `ST.repairPosition()` moves a loaded party to the entrance if a redesigned map no longer has its spot.
- Arriving on a cell via `changeMap` does **not** trigger its event; only stepping onto it does. Portals and stairs rely on this.

**Combat (hex board)**
- Expected party level: **4** at the Rat King, **8** at Morvane, **11** at Kargath, **13-14** at Malthor. The XP curve (`D.xpFor`) and monster XP (`45·lvl^1.7`) were tuned together.
- Anti-swarm rules survive on the board: only **4 of a group** stand on it (the rest wait and step in), at most **2 monster melee attacks per hero per round** (`CB.MELEE_CAP`), at most **3 monster spells or breaths per round** (bosses exempt). Without them, rat packs and caster mobs wiped parties.
- Monster casters choose spells as if "out of melee" only when no hero is within their move + 1; otherwise 60%. Gating on strict adjacency made Malthor far deadlier (27% vs 60%).
- The party AI's front-liners advance and brace when nothing is in reach; the back rank holds. Without that, boss fights dragged on.
- Monster melee damage scales by `1 + lvl/14`, and bosses take 60% from spells (`mres`).
- Paralysis can wear off during combat and always clears after it. Teleport traps collapse after one use. Starting HP has a floor of 8.

**State and flow**
- The UI is promise-based (`await UI.menu(...)`). Every player action runs inside `EX.guard`, a lock, and **a nested `guard` call is silently ignored**. Code that may already be inside an action must call its target directly (see `main.newGame`).
- Loading or starting a game bumps `BT.main.gen`. Code that continues after an `await` must bail out if `gen` changed.
- Racing a menu against a board click (`Promise.race([UI.menu(...), BV.waitClick()])`) needs `UI.cancelMenu()` when the click wins, or the menu stays open.
- `UI.syncSong()` is idempotent and called from `updateHud` and combat: the song is the battle's song in combat, otherwise the one carried from exploration.

**Tooling and agents**
- Headless Node tests: a stub that never resolves a promise makes Node **exit silently with code 0**.
- Combat randomises start distances and obstacles. Pin `BT.U.rand` while the board is set up in scripted tests; give scripted heroes extra HP when the script wastes turns.
- Background commands have lost output. Redirect long runs to a file.
- **Delegating big art, texture or music jobs works well** when the agent owns its own files (one pack file, one package) and gets an exact spec: names, conventions (128x128, alpha rules), the API, and how to verify (preview pages + screenshots). Never let two agents edit the same file. Ask them to report canon details so the lore can be updated.
- **Splitting a big file:** cut it with a script at section markers into package files sharing an internal object, then prove nothing changed (byte-identical SVG dumps for art, peak/RMS for audio, all tests for logic). Hand-moving code invites typos.

**Fonts and UI** (design system in `css/base.css`)
- System fonts only. **Luminari** is illegible at small sizes, so it is for large display text only. Cochin for headings and names, Optima for body, Avenir Next Condensed for numbers.
- Palette: cold rime chrome, with **hearth amber as the only warm accent** (selection, focus). Faith colours appear only where a faith matters. `body.thawed` (after Malthor) melts the frost frames.
- `UI.art` caches SVG strings by key. Include every parameter that changes the output in the cache key.

## Testing

See `tests/CLAUDE.md`. Minimum before reporting work done: `./tests/run-all.sh --quick`. Run the full suite after balance, map or story-flow changes.
