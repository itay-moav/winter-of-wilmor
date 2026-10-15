# Places & Buildings

## Velmoor city map (`js/maps.js` `TOWN_ROWS`, 21x15 cells)

```
#####################      Legend
#...................#      .  street        #  house (solid)     x  gargoyle statue
#.A#.T#.S#.I#.R#.#W.#      f  Fountain of Concord (plaza)        g  graveyard ground
#.##.##.##.##.##.##.#      A  Adventurers' Guild    T  The Frostbitten Flagon (tavern)
#.........x........x#      S  Brannoc's Outfitters  I  The Warm Hearth Inn
#.##.PP.f..M#.##x##.#      R  Hall of Review        M  Madame Zeyla's Energies
#.##.PP..x.##.#K.#Y.#      P  Temple of the Dawn (2x2)     H  Hall of the Still Mother (2x2)
#...................#      O  Barrow of the Deep Root (2x2)
#.##.##.HH.#Q.##.##.#      C  Crypt of the Old Kings gate  K  The Iron Keep gate
#.##.##.HH.##.##.##.#      W  Malthor's Tower      G  City Gate (frozen)
#x..................#      Q  House of Orrin the Clockmaker (enterable, 3 floors)
#.gg.OO.U#.##.##.##.#      Y  House of the Widow Ysolde (enterable, 2 floors)
#.Cg.OO.##.##.##.##.#      U  Bramwick's Old Mill (enterable, 3 floors)
#............x......#
##########G##########
```

The streets form a grid with 2x2 building blocks between them. The party starts at (2,1) facing east, outside the Guild. At night (20:00-06:00) encounters are tougher and the gargoyles may wake.

## Building types

| Type | Look | Height (wall units) | Code |
|---|---|---|---|
| Plaster house | cream, ochre, sage, rose, pale blue or white plaster | 1-2.05 | `houseTex(v)` in `js/textures.js`; 14 variants, chosen per cell |
| Timber-frame house | plaster with dark oak beams in diagonal patterns | 1-2.05 | same |
| Stone house | grey, tan or blue-grey ashlar | 1-2.05 | same |
| Brick house | red or brown brick | 1-2.05 | same |
| Plank house | painted boards (green, blue, red, ochre, slate) | 1-2.05 | same |
| City wall | snow-capped grey stone | 1.3 | `citywall` |

All houses share these details:
- roof eaves of slate, red tile, thatch-brown or copper green, with snow on top;
- icicles, chimneys, shutters, flower boxes, leaded or arched windows, lit or dark;
- boarded doors, lanterns, frosted ivy and family crests.

The upper storeys repeat as the building gets taller. Heights come from `m.cellH`: houses are pseudo-random in {1, 1.35, 1.7, 2.05}, and special buildings are set in `SPECIAL_H`.

## Named buildings

| Building | Faith or owner | Look | Function |
|---|---|---|---|
| Adventurers' Guild (A) | neutral | grey stone, red banners with crossed swords, arched oak door | party management, saving |
| The Frostbitten Flagon (T) | neutral | timber, warm leaded windows, a hanging mug sign, barrels | drinks (bard voice), rumors, the sewer cellar |
| Brannoc's Outfitters (S) | neutral | brick, red-white striped awning, display windows with sword and shield | buy and sell |
| The Warm Hearth Inn (I) | neutral | cream plaster, red roof, flower boxes, lantern | rest |
| Hall of Review (R) | neutral, scholarly | stone with white columns, blue banners | levels, spells, class change |
| Madame Zeyla's Energies (M) | Zeyla | violet planks, painted stars and moon, crystal-ball glow | SP restore, fortunes, the Concord quest |
| Temple of the Dawn (P, 2x2, height 2.0) | Dawn | white marble, 4 columns, gilded pediment with sun disc, golden doors | heal, cure, resurrect, swear to the Dawn |
| Hall of the Still Mother (H, 2x2, height 2.4) | Pale Hour | ice-blue stone, spires, glowing lancet windows, great snowflake emblem, silver pointed doors, icicles | cure paralysis and stone, heal, swear to the Pale Hour |
| Barrow of the Deep Root (O, 2x2, height 1.25) | Deep Root | earthen mound, turf and snow roof, hanging roots, round carved door, amber lanterns, standing stones | heal and cure poison, ancestor hints, root-water, swear to the Root |
| Crypt gate (C) | Deep Root | iron gate in crypt stone with the Root sigil and a bronze lock | to `crypt1` (needs the bronze key) |
| Iron Keep gate (K, height 2.6) | Dawn (formerly) | dark stone, iron portcullis | to `keep1` (needs the Iron Sigil) |
| Malthor's Tower (W, height 3.6) | Malthor | blue crystal masonry, arched door with a glowing moon-eye | to `tower1` (needs the Moonstone Key) |
| City Gate (G) | the city | wall with a frozen gate | flavour; opens after victory |
| Orrin's House (Q, 2.4) | Dawn | dark timber, great clock face with a sun at its centre | side quest |
| Ysolde's House (Y, 2.05) | Pale Hour | pale-blue stone, arched windows, frost wreath with snowflake | side quest |
| Bramwick's Old Mill (U, 2.4) | Deep Root | dark planks, millstone, roots climbing the wall | side quest |

## Street features
- **Fountain of Concord** (f, 8,5): frozen, with three relic niches. It flows after victory.
- **Gargoyle statues** (x): six of them. They wake at night; when beaten they stay rubble.
- **Graves** (g): Root tree-and-ring stones (older) and Dawn sun-disc stones (newer). Never crosses.

## Interiors (`BT.INTERIORS`, style `interior`)
These are 7x7 block-grid floors with wood-panelled walls (occasionally bookshelves), plank floors and beamed ceilings. The legend letters are:

| Letter | Meaning |
|---|---|
| `e` | exit to the street |
| `u` / `d` | stairs up / down |
| `n` | note |
| `c` | chest |
| `f` | fight |
| `m` | riddle mouth |
| `p` | portal (locked until the riddle is solved) |
| `S` | secret passage, which looks like a wall |

## Dungeons and realms (generated)

Dungeon levels are generated from fixed seeds (`BT.LEVEL_SPECS`, `BT.POCKET_SPECS`), so their layouts are the same every game.

| Style | Walls, floor, ceiling | Mood |
|---|---|---|
| sewer | mossy green brick, slime, wet stone | dank, dripping |
| crypt | grey ashlar, skull niches, dark flagstones | silent, holy, defaced |
| keep | dark masonry, red snowflake banners (Malthor's heraldry), checkered floor | martial, cursed |
| tower | blue crystal, glowing runes, starry ceiling | arcane, time-frozen |
| vault | gold brick, sun reliefs, cream marble | radiant (the Dawn) |
| mirror | crystal halls (tower textures) | reflective, still (the Pale Hour) |
| hollow | earth and stones, glowing roots, root-and-ring carvings | warm, deep (the Root) |

### Map table (generated with `node tools/lore-tables.js maps`)

| Map id | Name | Style | Size | Depth | Entry | Key events |
|---|---|---|---|---|---|---|
| town | Velmoor | town | 21x15 | 0 | - | statue x6, fountain x1, msg x3 |
| sewers1 | Sewers of Velmoor - Upper | sewer | 16x16 | 1 | from town | stairs, msgs, fight, fountain, traps, chests, lyra |
| sewers2 | Sewers of Velmoor - Deep | sewer | 16x16 | 1 | from sewers1 | Rat King boss room, chests, traps, spinners |
| crypt1 | Crypt of the Old Kings | crypt | 18x18 | 2 | from town | riddle (footsteps), lyra, chests, traps, teleport, fountain |
| crypt2 | Crypt - Royal Tombs | crypt | 18x18 | 2 | from crypt1 | Morvane boss room, vampire, lich, Root shrine |
| keep1 | Iron Keep - Barracks | keep | 18x18 | 3 | from town | riddle (tomorrow), lyra, golems, desecrated chapel note |
| keep2 | Iron Keep - Warden's Hall | keep | 18x18 | 3 | from keep1 | Kargath boss room, sirens, Dawn shrine |
| tower1 | Tower - Crystal Halls | tower | 14x14 | 4 | from town | riddle (Lyra), Lyra reveal and locket, frost giants |
| tower2 | Tower - Hall of Frozen Time | tower | 14x14 | 4 | from tower1 | riddle (time), dragon, Pale altar note, Pale shrine |
| tower3 | Tower - The Crystal Chamber | tower | 10x10 | 5 | from tower2 | Malthor boss room, Pale shrine |
| q1-q3, y1-y2, u1-u3 | house floors | interior | 7x7 | 1 | town houses | stairs, notes, chests, fights, secret doors, riddles, portals |
| sunvault | The Sun Vault | vault | 10x10 | 2 | portal in q3 | Sun-Warden, Dawn shrine |
| mirrorhall | Hall of Still Mirrors | mirror | 10x10 | 2 | portal in y2 | Mirror Maiden, teleport |
| roothollow | The Root-Hollow | hollow | 10x10 | 2 | portal in u3 | Root Horror, darkness |
