# Winter of Velmoor

A Bard's Tale-style first-person party RPG that runs in the browser. Open `index.html` directly (`file://`) or run `php -S localhost:8000`. See `README.md` for features and controls.

## Ground rules (user preferences)

- **Work autonomously.** The user asked not to be asked questions. Make sensible decisions, verify them, and report.
- **Story and lore must stay coherent.** Before writing any story text, quest, NPC, monster, item, building or art brief, use the **`velmoor-lore` skill** (`.claude/skills/velmoor-lore/`), and record new canon there in the same change.
- **Invented religions only:** the Dawn, the Pale Hour and the Deep Root. Never use real-world religious symbols, **especially crosses** (graves, armour, emblems, anywhere).
- **Art direction:** anime/JRPG style. Females in revealing fantasy outfits, tasteful and non-explicit, clearly adults. Males heroic and muscular. Full-body figures are wanted, and monsters should be dramatic.
- **Music:** battle music should be heavy folk metal or bagpipes, in three variants (underground, city, wilderness). The user wants to *hear* audio, so render WAVs (`tests/render-music.js`) for listening outside the game.
- **Verify visually.** Take screenshots (`tests/browser/screenshots.js`, then Read the PNGs) before saying a visual change is done.
- **Git and GitHub:** the remote is `origin` = https://github.com/itay-moav/winter-of-wilmor (a **public** repo; note the spelling "wilmor"). The `gh` CLI is installed and authenticated as `itay-moav`; use it for GitHub work (issues, PRs, releases, repo settings). Commit or push only when the user asks: pushing publishes to a public repo.

## Hard constraints

- **No build step, no npm dependencies, no network.** Plain `<script>` tags with globals hung off `window.BT`. No ES modules (they break on `file://`) and no web fonts (offline).
- Script order in `index.html` matters: data, then art and audio, then maps, state, textures, render, ui, magic, combat, town, explore, main.
- **All art and audio are generated in code:** SVG in `js/art.js`, canvas textures in `js/textures.js`, Web Audio in `js/audio.js`. Image overrides go in `assets/manifest.js`.

## Lessons learned (non-obvious, learned the hard way)

**Rendering**
- The raycaster indexes every texture as **128×128** (`TX.size`). Anything wider (the 2×2 temple facades) is drawn wide and split into `_L` and `_R` halves. Which half shows depends on the face direction (see `texFor`).
- Town buildings have heights (`m.cellH`, `SPECIAL_H`). The town ray continues past short walls and paints far to near. A hit is recorded only when the ray is in an *open* cell, so building interiors are skipped. Tall walls map textures by `tex.mode`: default `house` repeats the middle storey band, `stretch` is for temples, `tile` for walls and towers.
- In `MG.fromBlocks` (the town), edges are set **from the street side only**. Setting them from building cells overwrote door edges with walls, and doors silently stopped working.
- Sprite textures need alpha. Statue art is loaded asynchronously from SVG into a canvas, with a procedural fallback if the canvas is tainted.

**State and flow**
- The UI is promise-based (`await UI.menu(...)`). Every player action runs inside `EX.guard`, a lock, and **a nested `guard` call is silently ignored**. Code that may already be inside an action must call its target directly (see the game-over → New Game path in `main.newGame`).
- Loading or starting a game bumps `BT.main.gen`. Code that continues after an `await` (movement, then tick, then arrive) must bail out if `gen` changed.
- Dungeon layouts come from **seeded generation**. Changing a level spec's features or their order changes the layout, which invalidates old saves' positions and `map:x:y`-keyed event flags. Saves contain only `BT.G`; maps are regenerated on load, so runtime map edits (Phase Door) don't persist.
- Arriving on a cell via `changeMap` does **not** trigger its event; only stepping onto it does. Portals and stairs rely on this.

**Game design and balance** (tuned with `tests/sim.js` and the bot, so don't casually undo)
- Expected party level: **4** at the Rat King, **8** at Morvane, **11** at Kargath, **13-14** at Malthor. The XP curve (`D.xpFor`) and monster XP (`45·lvl^1.7`) were tuned together.
- Anti-swarm rules in combat:
  - only the front 4 members of each monster group act;
  - at most **2 melee attackers per front-rank target** each round;
  - at most **3 monster spells or breaths** per round (bosses are exempt).
  Without these rules, rat packs and caster mobs wiped parties.
- Monster melee damage scales by `1 + lvl/14`, and bosses take 60% from spells (`mres`).
- Teleport traps collapse after one use, so an area can't become unreachable. Paralysis can wear off during combat and always clears after it.
- Starting HP has a floor of 8, because level-1 mages died in one hit.

**Tooling**
- Headless Node tests: a stub that never resolves a promise makes Node **exit silently with code 0**.
- Combat starts monster groups at random distances. Pin `BT.U.rand` in scripted tests.
- Background commands have lost output. Redirect long runs to a file.

**Fonts and UI** (design system in `css/style.css`)
- Use system fonts only. **Luminari** is illegible at small sizes, so it is for large display text only (title, area banners, drop cap). Cochin for headings and names, Optima for body, Avenir Next Condensed for numbers.
- Palette: cold rime chrome, with **hearth amber as the only warm accent** (selection, focus). Faith colours appear only where a faith matters. `body.thawed` (after Malthor) melts the frost frames.

**Art and audio**
- `js/art.js` (very large) and `js/audio.js` were written by sub-agents. Their working copies in `/tmp` are gone, so edit those files directly and surgically. Keep the public APIs stable: `BT.art.{portrait, figure, npc, npcFigure, monster, scene, symbol, lookOptions, *Keys}` and `BT.audio.{init, music, sfx, volume/mute functions}`. For big art or music jobs, delegate to an agent with an exact API spec, then verify with the tests and screenshots.
- `UI.art` caches SVG strings by key. Include every parameter that changes the output in the cache key.

## Testing

See `tests/CLAUDE.md`. Minimum before reporting work done: `./tests/run-all.sh --quick`. Run the full suite after balance, map or story-flow changes.
