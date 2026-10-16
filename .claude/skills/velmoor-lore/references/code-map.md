# Code Map: Turning Lore into Game Content

The game is plain JavaScript loaded with `<script>` tags from `index.html` (no build). Code lives in packages under `js/`; see the layout in the project `CLAUDE.md`. Everything hangs off the global `BT`.

| Lore element | File | Data |
|---|---|---|
| Story text, rumors, faith dialogue, Lyra's lines, endings | `js/data/story.js` | `D.STORY` (`intro`, `rumors[progress]`, `faithTalk[faith][progress]`, `lyra`, `ending`, `endingFaith`, `endingLast`) |
| Races, classes, bard songs, faiths and blessings | `js/data/rules.js` | `D.RACES`, `D.CLASSES`, `D.SONGS`, `D.FAITHS`. Blessing effects: `js/combat/damage.js`, `js/combat/monster-ai.js`, `js/world/explore.js` (`EX.tick`) |
| Items and relics | `js/data/items.js` | `BT.ITEMS`, `BT.SHOP_STOCK`, `BT.LOOT` tiers |
| Spells | `js/data/spells.js` | `BT.SPELL_LIST` (effects in `js/world/magic.js` and `js/combat/actions.js`) |
| Monsters | `js/data/monsters.js` | `BT.MONSTERS` (`art` key, optional `hue`, `spd` hexes per turn) |
| City layout and buildings | `js/maps/town.js` | `TOWN_ROWS`, `BT.BUILDINGS` (`temple`, `map`, `faith`), `SPECIAL_H` heights |
| Place styles (textures, fog, music, battle music) | `js/maps/styles.js` | `BT.STYLES` |
| Main dungeons | `js/maps/dungeons.js` | `BT.LEVEL_SPECS` (seeded specs and `features`, each may carry a `deco`) |
| Houses and floors | `js/maps/houses.js` | `BT.INTERIORS` (room plans: `plan`, `marks`, `rooms`, `doors`, `decals`, `props`, `ev`) |
| Hidden realms and the Folded Cellar | `js/maps/realms.js` | `BT.POCKET_SPECS` (`upFrom: {map, at}` or `{level}`) |
| Set dressing (decals, floors, props, lights) | `js/maps/dressing.js` | `DR.STYLES`, `DR.LIGHTS`, `dressLevel`, `dressHouse` |
| Map building | `js/maps/build.js`, `grid.js`, `generator.js`, `builders.js` | `BT.buildMaps`, `MG.generate`, `MG.fromBlocks`, `MG.fromRooms` |
| Town services and the faith pledge | `js/world/services.js` | `TW.enter(id)`, `temple`, `paleHall`, `rootBarrow`, `pledge` |
| Events and side-quest logic | `js/world/events.js`, `quests.js`, `endings.js` | `EX.handleEvent`, `EX.concordFountain`, `EX.gameOver`, `EX.ending` |
| Combat | `js/combat/*` | `CB.fight(groups, opts)`; rules in `damage`, `movement`, `monster-ai`, `party-ai`, `actions`, `battle` |
| Visuals | `js/render/textures/` (procedural walls, facades, sprites, dressing packs), `js/render/raycaster.js`, `js/art/` (SVG portraits, figures, NPCs, monsters, scenes, symbols), `js/combat/view.js` (the battle screen) |
| Audio | `js/audio/` | `BT.audio.music(track)`, `song(id)`, `sfx(name)`; tracks in `tracks-*.js` |

## Event types (map cell `ev.t`)

| Type | Fields | Behaviour |
|---|---|---|
| `stairs` | `dir` up/down, `to`, `require {flag\|item}`, `locked`, `label` | main dungeon stairs |
| `warp` | `label` up/down/out/portal, `to`, `x,y,d` or `at` (a letter in the target house), `require`, `locked`, `text` | houses, portals, the cellar stair |
| `msg` | `text`, `repeat`, `grave` (dawn/root sprite), `deco` | lore notes |
| `lyra` | `key`, `item` | ghost appearances |
| `fight` | `groups [[id,n]]`, `text`, `items`, `gold`, `after` (text on a win), `setFlag`, `deco` | fixed fight; fires once |
| `boss` | `groups`, `flag`, `npc`, `text`, `after`, `items`, `gold`, `final`, `deco` | fills the whole room (`at: 'bossroom'`) |
| `chest` | `tier` | once |
| `riddle` | `flag`, `q`, `a[]`, `right` | a magic mouth |
| `trap`, `spinner`, `teleport` | | hazards (teleporters collapse after one use) |
| `fountain` | `kind` heal/sp/town | town = the Concord fountain |
| `shrine` | `faith` | faith-specific heal |
| `statue` | | gargoyle that may wake at night |

Feature placement (`at`) in generated levels: `far`, `deadend`, `mid`, `near`, `room`, `corridor`, `random`, `bossroom`. Zones use `{ t: 'zone', flag: MG.F_DARK | F_ANTI | F_WATER, size }`. `deco: { walls, wallsAll, near, props, propCount, floor }` dresses the feature's surroundings (see `set-dressing.md`).

## Recipes
For maps, houses and dressing see the **`velmoor-maps`** skill; for art and textures **`velmoor-graphics`**; for music **`velmoor-music`**; for fights and balance **`velmoor-combat`**.

**Add an NPC with art:** add the key to `BT.art.npc`/`npcFigure` in `js/art/npcs.js` (the `velmoor-graphics` skill), record the looks in `people.md`, show it with `UI.showNpc(key, caption)`.

**Add a monster:** add an entry to `BT.MONSTERS` (stats, `art`, `hue`, `spd`), place it in a map's `monsters` table or a fight, tune it with `node tests/sim.js 40 <name>`, and document it in `monsters.md` (regenerate the table with `node tools/lore-tables.js monsters`).

**Custom images:** if `assets/manifest.js` lists a PNG or WebP (in `assets/images/<kind>/`) for a key, it replaces the generated SVG.

## Tests
- `node tests/test-maps.js`, `test-dressing.js`: maps connected, events reachable, dressing and house plans consistent.
- `node tests/test-hex.js`, `test-combat.js`: board maths and combat rules.
- `node tests/test-art.js`, `test-audio.js`: art and audio sanity checks.
- `node tests/sim.js 30 [filter]`: combat balance per tier and boss.
- `node tests/playthrough.js 2`: a headless bot plays the whole main story to the ending.
- `node tools/lore-tables.js monsters|items|spells|maps`: regenerate the reference tables.
- `tests/browser/*.js` and `tests/cdp.js`: headless Chrome play-tests and screenshots.
