# Tests

Run everything from the project root:

```
./tests/run-all.sh            # full suite (~6-10 min: includes balance sim + 2 bot playthroughs)
./tests/run-all.sh --quick    # ~2 min: unit + browser tests only
```

| Test | What it proves | Time |
|---|---|---|
| `node tests/test-maps.js` | every map (town, 9 dungeon levels, 10 house floors, 5 hidden realms) is fully connected and every event cell is reachable; monster/spell/summon references resolve | 1 s |
| `node tests/test-hex.js` | hex-board maths: neighbours, distance, reach around blocked hexes, paths | <1 s |
| `node tests/test-combat.js` | combat rules headless: placement, hex-by-hex moves, melee only between adjacent units, the 4-on-board and 2-attackers caps, reinforcements, fleeing, song music sync, summons, legal AI orders | 2 s |
| `node tests/test-dressing.js` | set dressing: every wall face dressed, lights never in magical darkness, props off event cells, described dressing present (graffiti, stone kings, cots, clocks...), every house plan consistent (rooms, doors, decals, props) | 1 s |
| `node tests/test-art.js` | every `BT.art` function/key returns well-formed SVG (no `NaN`/`undefined`, balanced tags, unique ids, resolvable `url(#id)`), and is fast enough | 5 s |
| `node tests/test-audio.js` | the audio API is a safe no-op without Web Audio, every required track/sfx name exists, volume settings persist | 1 s |
| `node tests/browser/smoke.js` | title → new game → walk → enter the tavern → sheet → map → a hex battle with spells and a bard song | 25 s |
| `node tests/browser/battle.js` | the battle screen: 11x7 board, turn order, the acting hero's full figure, moving with the keyboard, numbered targets, clicking a foe, auto-battle and Esc, the battle closing; singing starts the song's music and it stops when the song fades | 40 s |
| `node tests/browser/places.js` | every texture any map uses exists in the packs; photographs 18 dressed places (dungeons, realms, house rooms) to `$SHOTS/p-*.png` for review | 60 s |
| `node tests/browser/services.js` | shop buy/equip, temple heal/resurrect, review level-up, inn, mystic, swearing to a faith, saving | 25 s |
| `node tests/browser/side-quest.js` | Orrin's house → attic → the clock wall's secret door → riddle → portal → Sun Vault; fountain ceremony with all relics | 30 s |
| `node tests/browser/gameover-ending.js` | game over → new game still works (guard lock edge case); full ending → thawed city | 25 s |
| `node tests/browser/screenshots.js` | not a test - renders ~20 key screens to `$SHOTS` (default `/tmp/velmoor-shots`) for visual review with the Read tool | 60 s |
| `node tests/render-music.js [track ...]` | not a test - renders music tracks and bard songs to `assets/audio/previews/<track>.wav` (gitignored) so the user can listen outside the game, e.g. `afplay -t 25 assets/audio/previews/song_ward.wav`; `duck` renders a song over battle music | ~1 min |
| `node tests/sim.js [N] [filter]` | combat balance: N fights per scenario at the expected party level per area (the party AI plays); prints win rate, HP left, deaths, rounds. `filter` is a regexp on scenario names, e.g. `node tests/sim.js 40 Malthor` | 1-3 min |
| `node tests/playthrough.js [runs] [-v]` | a bot plays the whole main story (explores, fights, rests in town, solves riddles, uses gates, kills all bosses, reaches the ending) | 1-3 min/run |

All browser tests print `ok`/`FAIL` lines, fail on any JS exception or console error, and exit non-zero on failure.

## Reading the results

- **sim.js targets** (simple AI that never heals or buffs; real players do better): normal fights at the area's level should be won 90-100% with 70-95% HP left. Bosses: Rat King at L4, Morvane at L8, Kargath at L11, Malthor at L13 should land at roughly **50-90%** win rate. Below ~40%, the boss is too hard. Above ~95%, it is a pushover.
- **playthrough.js**: a run sometimes ends in `GAME OVER` from an unlucky random fight; that is variance. The bot also retries bosses after a wipe (as a player reloading a save). Investigate only if most runs fail, or if they always fail in the same place. The bot is a completability check, not a balance oracle: it over-grinds, because it rests for free whenever it is hurt.

## Harness notes and gotchas

- `tests/load.js` loads game scripts into a Node `vm` context with a fake `window`/`localStorage`. **Script lists come from `index.html`**: `load.select(load.WORLD)` (core, data, maps, state), `load.select(load.COMBAT, load.NO_VIEW)` (combat without the battle view). Never hard-code file lists in a test.
- `sim.js`, `playthrough.js` and `test-combat.js` replace `BT.UI` and `BT.R` with stubs **before** loading the combat and world files, because those capture `UI` at load time. They set `BT.CB.auto = true`, so the party AI plays every hero; `sim.js` also sets `CB.aiHeals = false` (the balance targets assume a party that never heals).
- **A stub that returns a promise that never resolves makes Node exit silently with code 0 and no output.** If a headless test prints nothing, look for a missing or unresolved stub (for example a `UI.*` function the code now awaits).
- `tests/cdp.js` is a tiny Chrome DevTools Protocol driver (no npm deps; Node's built-in `WebSocket`). It drives the installed Google Chrome at `/Applications/Google Chrome.app` headless. The API is `eval(expr)`, `key(k, waitMs)`, `type(text)`, `click(x, y)`, `shot(path)`, `sleep(ms)`, `logs`, `close()`.
- **Determinism:** combat randomises where monster groups start and where obstacles stand. Pin it by stubbing `BT.U.rand = () => 0` around `CB.fight(...)` (see `smoke.js`, `battle.js`). With rand pinned to 0 every d20 roll is a 1, so restore it right after setup. Give scripted heroes extra HP when the script wastes turns (defending, wandering), or the fight can be lost.
- **Hex battles from keys:** a hero's turn shows a menu whose title is the hero's name and which always has "Defend": wait for that. `a` then a number attacks, `m` then arrows + Enter moves, `z` auto-battles (Esc stops). Board clicks: get a token's `getBoundingClientRect()` and `T.click(x, y)`.
- **Random encounters are disabled** by `T.newGame()` (`_common.js`), because a surprise fight mid-walk derailed scripted keys about 1 run in 15. Start fights explicitly with `BT.CB.fight(...)`.
- **Single-option menus are selected by Space**, so don't spam Space through dialogue. Loop until the expected menu text appears.
- To reach game states quickly, eval directly. For example: `BT.EX.guard(() => BT.EX.changeMap('crypt2'))`, `BT.G.flags.malthor = true`, `BT.ST.giveParty('moonkey')`, or set `BT.G.x/y/d` then `BT.R.snap()`.
- **Test browsers are muted** (`--mute-audio`) and killed when the test process exits. Before that, crashed or interrupted tests left headless Chromes playing the game's music in the background for hours. If the user hears music, run `pkill -9 -f 'user-data-dir=/tmp/cdp-'`.
- Long runs: redirect output to a file. Output from commands that move to the background has been lost before.
- Browser tests use the real `index.html` over `file://`, exactly as a player opens it.

## Adding a test

Browser test: copy a script in `tests/browser/`, use `open()`, `check(cond, msg)` and `finish(T)` from `_common.js`, then add it to the loop in `run-all.sh`. Node test: `const load = require('./load'); const BT = load(load.select(load.WORLD)).BT;` (add the files you need with `load.select([...])`, never a hard-coded list), add it to `run-all.sh`, and exit non-zero on failure.
