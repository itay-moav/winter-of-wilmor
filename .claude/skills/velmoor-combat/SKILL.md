---
name: velmoor-combat
description: How the hex-board tactical combat of Winter of Velmoor works and how to change it safely - units, turns, movement, the anti-swarm caps, the party and monster AI, the battle screen, and balance tuning with the simulator and the bot. Use when changing combat rules, monsters' behaviour, spells or songs in battle, the battle UI, or balance.
---

# Combat in Velmoor (hex board)

## The model (`js/combat/`, entry `CB.fight(groups, opts)` → `'win'|'lose'|'fled'`)
- **Board:** 11x7 pointy-top hexes, odd rows shifted (`hex.js`, `BT.HX`: `neighbors`, `dist`, `reach`, `path`). Heroes start on the left (front rank = party members 1-3 in column 1, back rank in column 0), the summon at column 2, monster groups on the right by their old distance (10'→col 5, 20'→7, 30'→9, bosses col 6), 2-4 obstacles in no-man's-land.
- **Units** (`state.js`): `{kind: 'pc'|'summon'|'mon', ch | g+m, c, r}`. Only **4 members of a group** stand on the board (`CB.ON_BOARD`); the rest wait and step in at the end of a round. Group spells still hit every member, waiting ones too.
- **Turns** (`battle.js`): initiative per unit each round (heroes: d10 + DX bonus x2 + level/3, haste +5, Swiftness +10; monsters d10 + lvl/2). The acting unit's full figure shows beside the board.
- **A hero's turn** (`commands.js` for the player, `party-ai.js` for Auto/auto-battle/tests): move up to speed (3; monks and rogues 4; haste/Swiftness +1), then one action: attack (melee needs adjacency; bows reach anywhere), cast, sing, use, defend (AC -4, half damage), hide, flee, end turn. Melee "Attack" can move to the best adjacent hex first.
- **A monster's turn** (`monster-ai.js`): breath or spells (max **3 per round**, bosses exempt; casters cast at 100% when no hero is within move+1, else 60%), otherwise close in (`spd` hexes, default 3, fliers 4) and strike an adjacent hero who has not already taken **2 melee attacks this round** (`CB.MELEE_CAP`).
- **Damage and statuses** (`damage.js`), actions (`actions.js`), end of round (songs, regen, sleep/hold, poison, paralysis wearing off, reinforcements), victory and chests (`battle.js`, `chest.js`).
- **The view** (`view.js`, `BT.BV`) is optional: rules call it through `V(...)`, so combat runs headless. Clicks race the menu (`Promise.race`), then `UI.cancelMenu()`.

## Rules that must survive changes (balance depends on them)
- Expected levels: Rat King 4, Morvane 8, Kargath 11, Malthor 13-14; optional realms 6-9, the Folded Cellar 7-10.
- The anti-swarm caps above; monster melee damage x(1 + lvl/14); bosses take 60% from spells (`mres`); front-liners advance and brace when nothing is in reach (or boss fights drag on).
- `CB.auto` (tests), `CB.aiHeals` (the sim turns it off), `CB.delay` (animation pacing; 0 in tests).

## Changing things safely
1. Rules first, view second: keep logic in the rule files, DOM in `view.js`/`css/battle.css`.
2. `node tests/test-combat.js` (adjacency, caps, moves, reinforcements, songs, summons, legal AI orders) and `node tests/test-hex.js`.
3. Balance: `node tests/sim.js 40 [filter]` against the targets in `tests/CLAUDE.md` (normal fights 90-100% wins with 70-95% HP; bosses 50-90%). Change one knob at a time and re-run.
4. `node tests/playthrough.js 2` after anything that touches difficulty; one run ending in a random GAME OVER is variance, most runs failing is not.
5. `node tests/browser/battle.js` and `smoke.js` for the screen, then Read screenshots of a battle (`tests/browser/screenshots.js` `40-combat`).
