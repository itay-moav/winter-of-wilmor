# Side Quests

## 1. The Concord of Velmoor (implemented)

**Theme:** before the Dawn's crusade, the three faiths swore a peace at the great plaza fountain, the **Fountain of Concord**. Each left a relic in its basin. When the crusade came, three families hid the relics so no zealot could break them. Restoring them is a small reconciliation that mirrors the main story's ending.

**Giver:** **Madame Zeyla** (the Mystic, M): "Ask about the Concord of Velmoor". The Tavern also has a rumor about it. Reading the fountain plaque also starts it, with no explicit acceptance needed.

### Steps

Each relic is hidden in an enterable, climbable house in the city. The attic of each holds a **secret door** (an `S` cell), then a **riddle mouth**, then a **portal** that only opens after the riddle is answered. The portal leads to a small hidden realm (10x10, generated), where the relic is held by a guardian.

**1. Orrin the Clockmaker's House (Q, at x12,y8)**
- **Faith:** Dawn
- **Floors:**
  - `q1`: the shop, with stopped clocks and a chest;
  - `q2`: the workshop, with Orrin's journal;
  - `q3`: the attic, with two clockwork sentinels.
- **Secret door:** the clock-face wall.
- **Riddle:** "I have a face but no eyes, and hands that cannot hold. I tell you the one thing I cannot keep." Answer: **clock**.
- **Realm:** `sunvault`, the Sun Vault: golden halls, "ALL THAT SETS WILL RISE... AND ALL THAT RISES MUST ONE DAY SET."
- **Guardian:** the **Sun-Warden**, a knight of living sunlight.
- **Relic:** the **Sun Shard** (`sunshard`).

**2. The Widow Ysolde's House (Y, at x18,y6)**
- **Faith:** Pale Hour (she was a dissenter: "Stillness is for grief to rest in - not a prison for the living").
- **Floors:**
  - `y1`: the parlour, with an unlit altar and Ysolde's portrait;
  - `y2`: the upper room, with her unsent letter to Sevrine.
- **Secret door:** at the north wall.
- **Riddle:** "The more of me there is, the less you see. The Still Mother wraps the world in me each winter night." Answer: **darkness** (also: dark, night).
- **Realm:** `mirrorhall`, the Hall of Still Mirrors, where reflections show you as you were a year ago.
- **Guardian:** the **Mirror Maiden**.
- **Relic:** the **Still Hourglass** (`stillglass`).

**3. Bramwick's Old Mill (U, at x8,y12)**
- **Faith:** Deep Root
- **Floors:**
  - `u1`: the grinding floor, where roots grip the axle;
  - `u2`: the sack loft, with rats;
  - `u3`: the cap room.
- **Secret door:** a hollow wall where a root pushes through.
- **Riddle:** "I lie beneath every tree. I drink, but I am never thirsty. I hold up the tallest oak, yet no one ever sees me." Answer: **root(s)**.
- **Realm:** `roothollow`, the Root-Hollow: amber-glowing roots and peaceful old bones.
- **Guardian:** the **Root Horror**.
- **Relic:** the **Heartwood Seed** (`heartseed`).

### Completion and reward

Set all three relics in the fountain's niches (the plaza fountain, f at x8,y5). This happens:
- warm water wells up;
- priests of all three faiths step out and stare at each other;
- Zeyla appears.

The reward is the **Ring of Concord** (AC 3, magic resistance, +1 ST/IQ/DX/CN and +2 LK), 4000 XP per hero and 1500 gold. It sets flag `concord`, adds an extra line to the ending, and changes the fountain's description.

**Recommended level:** 6-9. The hidden realms are optional and moderately dangerous.

## 2. Swearing to a Faith (implemented, a persistent choice)

At the Temple of the Dawn (P), the Hall of the Still Mother (H) or the Barrow of the Deep Root (O), the party can swear itself to one faith (flag `G.faith`). Switching is allowed, and priests comment on broken oaths.

| Faith | Blessing | Social consequence |
|---|---|---|
| Dawn | +50% damage vs undead; sunlight restores SP twice as fast; Dawn temple half price | Pale Hall acolytes refuse their rites |
| Pale Hour | Half damage from ice and frost (strong against Malthor) | Dawn temple charges double; Brother Caddoc greets you with hostility |
| Deep Root | Slow HP regeneration below ground; undead hit 25% softer | None; "all are welcome under the Root" |

Shrines in dungeons belong to a faith. Praying at another faith's shrine while sworn gives only half the blessing. The faith also changes one line of the ending.

## 3. The Waking Gargoyles (implemented, ambient)

Six gargoyle statues stand on Velmoor's streets (`x` cells). At night, if the party averages level 3 or more, a statue may tear itself free (a Living Gargoyle fight). Once beaten it stays rubble. The lore is that Malthor's rite gave a half-life to old stone. Possible future hook: what is the stone remembering?

## Quest seeds (not implemented; candidates for growth)

- **Caddoc's Torches:** Brother Caddoc plans to burn the Pale Hall the night the winter breaks. Stop him, help him, or warn Sevrine. This would be the first branching-faction quest.
- **The Isenmark Envoy:** a Pale Hour envoy arrives through the thawing gates demanding Sevrine's return. A diplomatic quest about extradition versus asylum.
- **Irena's Grave:** Lyra's mother's grave, which bears both a sun and a snowflake. Who made it? Malthor's private grief, explored post-game.
- **The Rest of Vael-Harrow:** below `crypt2` lie older halls of the Root kingdom. A new dungeon tier with Root ancestor spirits and a lost Root high-temple.
- **The Bard's Song:** collect verses (one per boss) for a bard in the Frostbitten Flagon. At the end the bard sings the party's ballad and gives a legendary instrument.
- **Kargath's Squire:** a young Dawn squire still guards the Keep's outer gate, loyal to a cursed master. Persuade them, or fight them.
- **Zeyla's Real Name:** the mystic is evasive about her faith. Hints suggest she is an exile from Isenmark who left the Pale Hour.

When implementing a seed, move it to a numbered section above and record its maps, flags, items and rewards.
