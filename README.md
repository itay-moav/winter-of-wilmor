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

Three old houses (the clockmaker's, the widow Ysolde's and the mill) can be entered and climbed. Their attics hide secret doors, riddles and portals to hidden realms. The relics found there make up the side quest **The Concord of Velmoor**; Madame Zeyla knows more.

## Custom art

All art is generated in code. To use your own images, put PNG or WebP files in `assets/` and list them in `assets/manifest.js`; they replace the generated art for portraits, full-body figures, NPCs, monsters and scenes.

## Lore skill

`.claude/skills/velmoor-lore/` is a Claude Code skill: the canon bible of story, side quests, history, religions, people, monsters, botanicals, places and buildings, items, style, and the code map. Claude uses it automatically when writing new content for the game.

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

## Features

- 10 maps: the city plus 9 dungeon levels. Each level is generated with a fixed seed and has rooms, doors, secret doors, darkness, anti-magic zones, icy water, spinners, teleporters, traps, chests, riddles, shrines and fountains.
- Character creation: 7 races, 8 starting classes (plus Sorcerer and Wizard via class change), and customizable portraits.
- 60 spells in 4 schools, 7 bard songs, more than 70 items, and more than 40 monsters including 4 bosses.
- Turn-based group combat with distances, front and back ranks, status effects and summoned allies.
- Town services: Guild, Tavern, Shop, Inn, Temple, Hall of Review (levelling and spells) and Mystic.
- Save slots and an autosave, stored in the browser's localStorage.

## Development

Run `./tests/run-all.sh` (or `--quick`); see `tests/CLAUDE.md` for details. Contributor notes are in `CLAUDE.md`.


- `tests/test-maps.js`: checks that every map is connected and every event is reachable.
- `tests/sim.js`: combat balance simulator (`node tests/sim.js 40`).
- `tests/playthrough.js`: a headless bot that plays the whole game to the ending.
- `tests/cdp.js`: a small Chrome DevTools driver for scripted browser testing.
- `art-preview.html` / `audio-preview.html`: galleries for the generated art and audio.
