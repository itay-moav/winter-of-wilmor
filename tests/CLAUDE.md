# Tests

Run everything from the project root:

```
./tests/run-all.sh            # full suite (~6-10 min: includes balance sim + 2 bot playthroughs)
./tests/run-all.sh --quick    # ~2 min: unit + browser tests only
```

| Test | What it proves | Time |
|---|---|---|
| `node tests/test-maps.js` | every map (town, 9 dungeon levels, 8 house floors, 3 hidden realms) is fully connected and every event cell is reachable; monster/spell/summon references resolve | 1 s |
| `node tests/test-art.js` | every `BT.art` function/key returns well-formed SVG (no `NaN`/`undefined`, balanced tags, unique ids, resolvable `url(#id)`), and is fast enough | 5 s |
| `node tests/test-audio.js` | the audio API is a safe no-op without Web Audio, every required track/sfx name exists, volume settings persist | 1 s |
| `node tests/browser/smoke.js` | title → new game → walk → enter the tavern → sheet → map → combat with spells and a bard song | 25 s |
| `node tests/browser/services.js` | shop buy/equip, temple heal/resurrect, review level-up, inn, mystic, swearing to a faith, saving | 25 s |
| `node tests/browser/side-quest.js` | house → attic → secret wall → riddle → portal → Sun Vault; fountain ceremony with all relics | 30 s |
| `node tests/browser/gameover-ending.js` | game over → new game still works (guard lock edge case); full ending → thawed city | 25 s |
| `node tests/browser/screenshots.js` | not a test - renders ~20 key screens to `$SHOTS` (default `/tmp/velmoor-shots`) for visual review with the Read tool | 60 s |
| `node tests/sim.js [N]` | combat balance: N fights per scenario at the expected party level per area; prints win rate, HP left, deaths, rounds | 1-3 min |
| `node tests/playthrough.js [runs] [-v]` | a bot plays the whole main story (explores, fights, rests in town, solves riddles, uses gates, kills all bosses, reaches the ending) | 1-3 min/run |

All browser tests print `ok`/`FAIL` lines, fail on any JS exception or console error, and exit non-zero on failure.

## Reading the results

- **sim.js targets** (simple AI that never heals or buffs; real players do better): normal fights at the area's level should be won 90-100% with 70-95% HP left. Bosses: Rat King at L4, Morvane at L8, Kargath at L11, Malthor at L13 should land at roughly **50-90%** win rate. Below ~40%, the boss is too hard. Above ~95%, it is a pushover.
- **playthrough.js**: a run sometimes ends in `GAME OVER` from an unlucky random fight; that is variance. The bot also retries bosses after a wipe (as a player reloading a save). Investigate only if most runs fail, or if they always fail in the same place. The bot is a completability check, not a balance oracle: it over-grinds, because it rests for free whenever it is hurt.

## Harness notes and gotchas

- `tests/load.js` loads game scripts into a Node `vm` context with a fake `window`/`localStorage`. `sim.js` and `playthrough.js` replace `BT.UI` and `BT.R` with stubs **before** loading `magic.js`/`combat.js`/`explore.js`, because those files capture `UI` at load time.
- **A stub that returns a promise that never resolves makes Node exit silently with code 0 and no output.** If a headless test prints nothing, look for a missing or unresolved stub (for example a `UI.*` function the code now awaits).
- `tests/cdp.js` is a tiny Chrome DevTools Protocol driver (no npm deps; Node's built-in `WebSocket`). It drives the installed Google Chrome at `/Applications/Google Chrome.app` headless. The API is `eval(expr)`, `key(k, waitMs)`, `type(text)`, `click(x, y)`, `shot(path)`, `sleep(ms)`, `logs`, `close()`.
- **Determinism:** combat randomises how far away monster groups start, so a scripted key sequence can find "Attack" disabled. Pin it by stubbing `BT.U.rand = () => 0` around `CB.fight(...)` (see `smoke.js`).
- **Single-option menus are selected by Space**, so don't spam Space through dialogue. Loop until the expected menu text appears.
- To reach game states quickly, eval directly. For example: `BT.EX.guard(() => BT.EX.changeMap('crypt2'))`, `BT.G.flags.malthor = true`, `BT.ST.giveParty('moonkey')`, or set `BT.G.x/y/d` then `BT.R.snap()`.
- Long runs: redirect output to a file. Output from commands that move to the background has been lost before.
- Browser tests use the real `index.html` over `file://`, exactly as a player opens it.

## Adding a test

Browser test: copy a script in `tests/browser/`, use `open()`, `check(cond, msg)` and `finish(T)` from `_common.js`, then add it to the loop in `run-all.sh`. Node test: load the game files with `require('./load')([...files])` and exit non-zero on failure.
