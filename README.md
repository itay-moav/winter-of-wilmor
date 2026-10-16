# Winter of Velmoor

A first-person, party-based dungeon crawler in the spirit of *The Bard's Tale*. It runs entirely in the browser with no build step and no dependencies. All art (anime-style SVG portraits, monsters, scenes), wall textures, music and sound effects are generated in code.

## Play

Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari). Or serve the folder:

```
php -S localhost:8000      # then open http://localhost:8000
```

Click or press a key once so the browser allows audio.

## Story

The archmage Malthor froze his dying daughter Lyra in a single moment of time, and the spell froze the whole city of Velmoor in an endless winter. To reach his tower you need three keys, and each one is held by a cursed guardian in the next dungeon:

1. **Sewers** (through the Tavern cellar): the Rat King holds the bronze key to the crypt.
2. **Crypt of the Old Kings** (graveyard): King Morvane guards the Iron Sigil.
3. **The Iron Keep**: Kargath the Iron Warden holds the Moonstone Key.
4. **Malthor's Tower**: three floors to the Crystal Chamber.

A pale ghost girl appears along the way. Listen to her, and to the Tavern's rumors. Stone mouths ask riddles, and the answers come from the story.

## Faiths and the side quest

Velmoor is torn between three invented religions: **the Dawn**, **the Pale Hour** and **the Deep Root**. Each has its own temple in the city. You can swear the party to one of them for a lasting blessing, and the priests react to your choice.

Three old houses (the clockmaker's, the widow Ysolde's and the mill) can be entered and climbed. They are real homes, room by room, but their upper floors hide secret doors, riddles and portals to hidden realms. The relics found there make up the side quest **The Concord of Velmoor**; Madame Zeyla knows more.

Next to the tower stands **Malthor's own house**, empty for eight years: Lyra's room is kept as it was the winter her mother died. Its cellar stair does not end. Below lies **the Folded Cellar**, a pocket of frozen time where an echo of Lyra's mother keeps her memory (side quest **The Folded House**).

## Custom art

All art is generated in code. To use your own images, put PNG or WebP files in `assets/images/<portraits|figures|npcs|monsters|scenes>/` and list them in `assets/manifest.js`; they replace the generated art.

## Lore skill

`.claude/skills/` holds Claude Code skills for this project: `velmoor-lore` (the canon bible: story, side quests, history, religions, people, monsters, places, set dressing, items, music, style, code map) and the how-to skills `velmoor-maps`, `velmoor-graphics`, `velmoor-music` and `velmoor-combat`. Claude uses them automatically when working on the game.

## Controls

| Key | Action |
| --- | --- |
| W / ↑ | Step forward (walk into doors to open them / enter buildings) |
| A D / ← → | Turn |
| S / ↓ | Turn around |
| X | Step back |
| 1-6 | Character sheet: equip, use, give items |
| C | Cast a spell |
| B | Bard song (needs an instrument; a drink at the Tavern restores voice) |
| U | Use an item |
| O | Reorder the party |
| M | Map |
| Esc / P | Party menu: save, load, settings, help |

In menus, use the number or letter keys, the arrow keys plus Enter, or the mouse.

**In battle** every hero takes their own turn on the hex board: **A** attack (then the foe's number), **M** move (arrow keys and Enter), **C** cast, **S** sing, **U** use an item, **P** defend, **H** hide (rogues), **E** end the turn after moving, **T** let the AI play this turn, **Z** auto-battle (**Esc** takes control back), **R** flee. You can also click a foe to attack it or a blue hex to move there.

## Features

- The city, 9 dungeon levels, 5 hidden realms and 4 enterable houses (10 floors). Dungeon levels are generated with fixed seeds and have rooms, doors, secret doors, darkness, anti-magic zones, icy water, spinners, teleporters, traps, chests, riddles, shrines and fountains.
- Places look like their descriptions: torches and braziers cast flickering coloured light, water runs through the sewer tunnels, walls grow moss, lichen and algae, crypts hold sleeping stone kings, the keep has cots and banners, the tower stopped clocks, and houses have wallpaper, windows, hearths and furniture.
- Character creation: 7 races, 8 starting classes (plus Sorcerer and Wizard via class change), and customizable portraits.
- 60 spells in 4 schools, 7 bard songs, more than 70 items, and more than 45 monsters including 4 bosses.
- Tactical combat on a hex board: each hero, summon and monster acts in initiative order, moves and strikes; the acting character's full figure is shown beside the board; auto-battle; status effects and summoned allies.
- Bard songs take over the music while they last: metal for battle songs, classical and Irish airs for gentle ones, Arabic and oriental themes for mystical ones (arrangements of Beethoven, Grieg, Prokofiev, Rimsky-Korsakov and traditional tunes).
- Town services: Guild, Tavern, Shop, Inn, Temple, Hall of Review (levelling and spells) and Mystic.
- Save slots and an autosave, stored in the browser's localStorage.

## Development

Plain JavaScript loaded with `<script>` tags (no build, no modules, works from `file://`). Code is organised in packages under `js/` (`core`, `data`, `art`, `audio`, `maps`, `render`, `ui`, `combat`, `world`, `app`); see `CLAUDE.md` for the layout and conventions.

Run `./tests/run-all.sh` (or `--quick`); see `tests/CLAUDE.md` for details.

- `tests/test-*.js`: headless checks (maps, hex maths, combat rules, set dressing, art, audio).
- `tests/browser/*.js`: scripted play in headless Chrome (`tests/cdp.js`, no npm needed).
- `tests/sim.js`: combat balance simulator (`node tests/sim.js 40 [filter]`).
- `tests/playthrough.js`: a headless bot that plays the whole game to the ending.
- `tests/render-music.js`: renders music and songs to WAV in `assets/audio/previews/`.
- `tools/preview/art.html`, `audio.html`, `textures.html`: galleries of the generated art, music and textures.
