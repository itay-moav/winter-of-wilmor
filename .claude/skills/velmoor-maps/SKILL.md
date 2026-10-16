---
name: velmoor-maps
description: How to create or change maps in Winter of Velmoor - dungeon levels (seeded generator specs), houses (room plans with furniture), hidden realms and pocket dimensions, the city plan, and set dressing (wall decals, water, moss, torches and coloured lights, props) so places look like their descriptions. Use when adding or editing any level, house, floor, building, realm, map event, or when a place should show torches, water, lichen, furniture or other objects.
---

# Making Maps in Velmoor

Read the `velmoor-lore` skill first (places, set dressing, the story of the place). Record every new place, object and event in its references in the same change.

## Where things live
| What | File |
|---|---|
| Map model (cells, thin-wall edges, flags, BFS) | `js/maps/grid.js` (`BT.MG`) |
| Seeded dungeon generator | `js/maps/generator.js` (`MG.generate(spec)`) |
| City blocks and house room plans | `js/maps/builders.js` (`MG.fromBlocks`, `MG.fromRooms`) |
| Place styles (textures, fog, light, music, battle music, `wall2` variant) | `js/maps/styles.js` |
| City, dungeons, houses, realms (data) | `js/maps/town.js`, `dungeons.js`, `houses.js`, `realms.js` |
| Dressing (decals, floors, props, lights) | `js/maps/dressing.js` (`BT.DRESS`) |
| Building every map at boot, linking stairs/portals | `js/maps/build.js` |
| Event behaviour (what stepping on a cell does) | `js/world/events.js` |

Edges: 0 open, 1 wall, 2 door, 3 secret door. Flags: `F_DARK` (magical darkness), `F_ANTI` (anti-magic), `F_WATER` (icy water, hurts), `F_SOLID`.

## A dungeon level (`js/maps/dungeons.js` or `realms.js`)
```js
{ id: 'crypt1', name: 'Crypt of the Old Kings', style: 'crypt', depth: 2, w: 18, h: 18, seed: 2301,
  rooms: 5, loops: 0.1, secret: 0.25, encounter: 0.05, groupsMax: 3,
  up: { map: 'town', x: 1, y: 12, d: 1, text: '...' },          // first level only; deeper levels link automatically
  monsters: [['skeleton', 3], ['zombie', 3]],                   // [id, weight] for random encounters
  features: [
    { t: 'stairs', dir: 'down', to: 'crypt2', at: 'far', require: { flag: 'riddle_crypt' }, locked: '...' },
    { t: 'msg', at: 'near', text: 'Rows of stone kings sleep in their niches...', deco: { wallsAll: ['dc_king_niche'], near: 2 } },
    { t: 'boss', at: 'bossroom', flag: 'morvane', groups: [...], deco: { props: ['pr_sarcophagus'], propCount: 4, walls: ['dc_candles'] } },
    { t: 'zone', flag: MG.F_DARK, size: 10, count: 2 },
  ] }
```
- `at`: `far`, `deadend`, `mid`, `near`, `room`, `corridor`, `random`, `bossroom`.
- **Seeds are sacred.** Changing a feature's `count`, `at`, order, or the level's size/rooms changes the layout and breaks old saves (positions, `map:x:y` flags). Adding fields (`deco`, `text`) is safe. `node tests/test-maps.js` compares every map's layout with the fingerprints in `tests/fixtures/layouts.json` and fails on drift; after an intentional change (or a new map) run `node tests/test-maps.js --update` and say so in the commit.
- A new level needs: a style (or an existing one), music, a battle-music terrain, a scene for the transition (`styles.js` `scene`), and an entry (stairs, a gate in the city, or a warp in a house).

## A house (`js/maps/houses.js`): homes, not mazes
Each floor is a room plan, ~6x4 cells; rooms of 4-16 cells joined by doors.
```js
{ id: 'l1', name: 'Malthor\'s House - Ground Floor',
  plan:  ['PPPKKK', 'PPPKKK', 'HHHHCC', 'HHHHCC'],   // room letters; walls stand between different letters
  marks: ['.n....', '....o.', '...u..', '.e...d'],   // event letters (e exit, u/d stairs, n/o/q notes, c chest, f fight, m mouth, p portal)
  rooms: { P: ROOM.parlour, K: ROOM.kitchen, H: ROOM.hallRose, C: inner(ROOM.kitchen) },  // inner(): no windows
  doors: ['1,2,n', '3,2,n', '3,3,e,cellar'],         // 'x,y,dir[,secret|cellar]' opens the wall on that side of the cell
  decals: ['1,3,s,dc_door', '1,0,n,dc_portrait_family', '0,1,w,dc_fireplace_cold'],  // the front door is a decal on the outer wall
  props: ['2,0,pr_harp,n', '4,1,pr_dining,c'],      // 'x,y,pr_name,side[,scale]'; side pushes it against that wall, c = centre
  ev: { e: { t: 'warp', label: 'out', to: 'town', x: 16, y: 2, d: 2 }, u: { t: 'warp', label: 'up', to: 'l2', at: 'd' }, ... } }
```
- Windows appear automatically on outer walls of rooms with windows (every third face); doors get `dc_door` on both sides.
- Each room needs a believable purpose and furniture that matches it (see the room table in `velmoor-lore` `places-and-buildings.md`). Abandoned homes stay unlit (cold hearths).
- Secret doors (`',secret'`) look like the wall; put the hint picture on that face (the clock wall, the frosted mirror, the root). Keep the puzzle reachable and hinted by a nearby note.
- **Pocket dimensions:** only a house that hides one may lead into dungeon space, through an obvious threshold (`',cellar'` door, portal, mirror). Add the realm in `realms.js` with `upFrom: { map: 'l1', at: 'd' }` (or `{ level: 'folded1' }` for its deeper floors).
- City entrance: change a `#` next to a street in `TOWN_ROWS` to a new letter, add `BT.BUILDINGS[letter] = { id: 'house', name, map, faith }`, a height in `SPECIAL_H`, and a facade + sign word in `js/render/textures/city.js` (`facadeSpecial`, `signBoard`).

## Dressing: make it look like the text
- **Per style** (`DR.STYLES` in `dressing.js`): weighted wall decals, light sources (`lights`, one every `lightEvery` cells), corridor/room floors, ceilings, random props (`propRate`). Water features: `F_WATER` cells get `water_deep`; sewer corridors get `sewer_channel` (rotated with `@r` for east-west tunnels).
- **Per feature** `deco`: `walls` (each picture once, nearest walls first), `wallsAll` (repeated on every wall within `near`), `props` + `propCount`, `floor`. Boss rooms dress the whole room.
- Every texture name must exist in a pack (`tests/browser/places.js` checks); the object catalogue is in `velmoor-lore` `set-dressing.md`. Missing objects: ask for them via the `velmoor-graphics` skill.
- Lights come from `DR.LIGHTS` (by decal/prop name): fire flickers warm, crystals glow cold, magical darkness stays dark.

## Verify (always)
1. `node tests/test-maps.js` (connected, events reachable), `node tests/test-dressing.js` (dressing and house plans consistent; add a check for the new place's key dressing).
2. Layout unchanged for existing levels (see above).
3. `node tests/browser/places.js` (all textures exist) - add the new place to its list, then **Read the screenshots** (`/tmp/velmoor-shots/p-*.png`).
4. `node tests/playthrough.js 1` if the main path changed; `node tests/sim.js 40 <fight>` for new fixed fights.
