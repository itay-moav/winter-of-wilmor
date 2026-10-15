# Code Map: Turning Lore into Game Content

The game is plain JavaScript loaded with `<script>` tags from `index.html`. There is no build step. Everything hangs off the global `BT`.

| Lore element | File | Data |
|---|---|---|
| Story text, rumors, faith dialogue, Lyra's lines, endings | `js/data.js` | `D.STORY` (`intro`, `rumors[progress]`, `faithTalk[faith][progress]`, `lyra`, `ending`, `endingFaith`, `endingLast`) |
| Faith definitions and blessings | `js/data.js` | `D.FAITHS`. Effects are in `js/combat.js` (`hitMonster`, `hurt`, monster melee) and `js/explore.js` (`EX.tick`). |
| Races, classes, songs | `js/data.js` | `D.RACES`, `D.CLASSES`, `D.SONGS` |
| Items and relics | `js/items.js` | `BT.ITEMS`, `BT.SHOP_STOCK`, `BT.LOOT` tiers |
| Spells | `js/spells.js` | `BT.SPELL_LIST` (effects interpreted in `js/magic.js` and `js/combat.js`) |
| Monsters | `js/monsters.js` | `BT.MONSTERS` (`art` key plus optional `hue`) |
| City layout and buildings | `js/maps.js` | `TOWN_ROWS`, `BT.BUILDINGS` (`temple`, `map`, `faith` fields), `SPECIAL_H` heights |
| Main dungeons | `js/maps.js` | `BT.LEVEL_SPECS` (seeded generator specs and `features`) |
| Houses and floors | `js/maps.js` | `BT.INTERIORS` (block-grid rows plus an `ev` legend) |
| Hidden realms | `js/maps.js` | `BT.POCKET_SPECS` (`upFrom` links back to a portal letter) |
| Map generation | `js/mapgen.js` | `MG.generate`, `MG.fromBlocks` (town), `MG.fromInterior` (houses; `S` = secret passage) |
| Town services and the faith pledge | `js/town.js` | `TW.enter(id)`, `temple`, `paleHall`, `rootBarrow`, `pledge` |
| Events and side-quest logic | `js/explore.js` | `handleEvent` switch, `EX.concordFountain`, `EX.ending` |
| Visuals | `js/textures.js` (procedural walls, facades, sprites, faith symbols), `js/render.js` (raycaster, sprites, automap), `js/art.js` (SVG portraits, figures, NPCs, monsters, scenes, symbols) |
| Audio | `js/audio.js` | `BT.audio.music(track)` and `sfx(name)` |

## Event types (map cell `ev.t`)

| Type | Fields | Behaviour |
|---|---|---|
| `stairs` | `dir` up/down, `to`, `require {flag\|item}`, `locked`, `label` | main dungeon stairs |
| `warp` | `label` up/down/out/portal, `to`, `x,y,d` or `at` (a letter in the target interior), `require`, `locked`, `text` | interiors and portals |
| `msg` | `text`, `repeat`, `grave` (dawn/root sprite) | lore notes |
| `lyra` | `key`, `item` | ghost appearances |
| `fight` | `groups [[id,n]]`, `text`, `items`, `gold` | fixed fight; fires once |
| `boss` | `groups`, `flag`, `npc`, `text`, `after`, `items`, `gold`, `final` | fills the whole room (`at: 'bossroom'`) |
| `chest` | `tier` | once |
| `riddle` | `flag`, `q`, `a[]`, `right` | a magic mouth |
| `trap`, `spinner`, `teleport` | | hazards (teleporters collapse after one use) |
| `fountain` | `kind` heal/sp/town | town = the Concord fountain |
| `shrine` | `faith` | faith-specific heal |
| `statue` | | gargoyle that may wake at night |

Feature placement (`at`) in generated levels: `far`, `deadend`, `mid`, `near`, `room`, `corridor`, `random`, `bossroom`. Zones use `{ t: 'zone', flag: MG.F_DARK | F_ANTI | F_WATER, size }`.

## Recipes

**Add a side quest with a new house**
1. Pick a free `#` cell next to a street in `TOWN_ROWS`, set it to a new letter, and add a `BT.BUILDINGS` entry with `map: '<id>1'` and `faith`.
2. Add its height in `SPECIAL_H`, a facade in `facadeSpecial` (`js/textures.js`) and a sign word.
3. Add floors to `BT.INTERIORS`. Use warps with `at` letters for the stairs and an `e` exit with town coordinates.
4. Optionally add a portal (`warp` with `require`) and a `BT.POCKET_SPECS` realm with `upFrom`.
5. Record the quest in `side-quests.md`, its people in `people.md`, and any monsters or items in their references.

**Add an NPC with art:** add the key to `BT.art.npc`/`npcFigure` in `js/art.js`, or brief the art agent with the looks from `people.md`. Show it with `UI.showNpc(key, caption)`.

**Add a monster:** add an entry to `BT.MONSTERS` (stats, `art`, `hue`), place it in a map's `monsters` table or a fight, tune it with `node tests/sim.js`, and document it in `monsters.md`.

**Custom images:** if `assets/manifest.js` lists a PNG or WebP for a key (portrait, figure, npc or monster), it replaces the generated SVG. See the comments in that file.

## Tests
- `node tests/test-maps.js`: every map is connected and every event is reachable.
- `node tests/test-art.js`, `node tests/test-audio.js`: art and audio sanity checks.
- `node tests/sim.js 30`: combat balance per tier and boss.
- `node tests/playthrough.js 2`: a headless bot plays the whole main story to the ending.
- `node tools/lore-tables.js monsters|items|spells|maps`: regenerate the reference tables.
- `tests/cdp.js`: a headless Chrome driver for screenshots and scripted UI tests.
