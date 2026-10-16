# Monster Compendium

Monsters are defined in `js/data/monsters.js`, and their art keys map to `BT.art.monster(key, {hue})`. The stat table at the bottom is generated: refresh it with `node tools/lore-tables.js monsters`.

## Lore by tier

### Streets and sewers (levels 1-3)
- **Sewer Rats, Giant Rats, Wererats:** the Rat King's "children". Wererats are thieves who swore themselves to him and changed.
- **Footpads and Cutthroats:** the thieves' guild, now serving the Rat King and through him Malthor. They shout "Toll for the King!"
- **Frost Bats:** bats the winter woke and never let sleep again.
- **Kobolds and Goblins:** scavengers who came down from the Teeth when the gates froze.
- **Green Slime:** sewer muck that the stillness failed to freeze.
- **Sewer Gremlins:** imp-kin that live in the drains. Art: `imp` with a green hue.
- **Frost Wolves:** packs that hunt the frozen streets at night.
- **Zealots of the Pale Hour:** human fanatics who dance in the snow, cast frost darts and see heroes as enemies of the miracle.
- **Living Gargoyles:** city statues half-woken by the rite. They wake at night.

### The crypt (levels 3-8)
- **Skeletons, Zombies, Ghouls:** the restless dead of Vael-Harrow, who cannot "go down" while Morvane is chained.
- **Ghosts and Wraiths:** the souls of Old Kings' courtiers. They drain life.
- **Skeletal Knights:** Morvane's royal guard. Art: `skeleton` with a blue hue.
- **Gargoyles:** tomb wardens.
- **Mimics:** opportunists among the grave goods.
- **Dark Elf Witches:** Isenmark-trained hexers drawn to the crypt's power.
- **Vampire Countess:** an old noble of Vael-Harrow who rose with the winter.
- **Lesser Liches:** Morvane's undying court mages.
- **Apprentices of Malthor:** his student-mages, loyal or terrified.

### The Iron Keep (levels 7-9)
- **Cursed Guardsmen:** Velmoor's city guard under Malthor's curse, with blue-glowing eyes. They are victims, not villains.
- **Ogres and Ice Trolls:** brought down from the Teeth as Keep muscle. Ice trolls regenerate.
- **Iron Golems:** the Keep's armoury constructs.
- **Basilisks:** a gift from Isenmark's bestiaries. Their gaze turns to stone.
- **Ice Elementals:** living hail that the rite spawned.
- **Wyverns:** the trolls' hunting beasts.
- **Ice Sirens:** women of living ice who sing a paralysing song from frozen pools.

### The tower (levels 8-13)
- **Frost Imps:** spawned in the tower's cold.
- **Bound Demons:** summoned by Malthor's magi.
- **Frost Giants:** from beyond the Teeth.
- **Pale Hour Magi:** Sevrine's war-mages lent to Malthor.
- **Crystal Sentinels:** constructs of the Rite of Stillness itself.
- **Frost Dragon:** sleeps on a hoard of frozen gold in `tower2`.

### Bosses
- **The Rat King** (`sewers2`)
- **Morvane, the Hollow King** (`crypt2`)
- **Kargath, the Iron Warden** (`keep2`)
- **Malthor** (`tower3`)

See `people.md` for their looks.

### Side-quest guardians
- **Clockwork Sentinels:** Orrin's brass automatons. Art: `golem` with a bronze hue.
- **The Sun-Warden:** a knight of living sunlight who guards the Sun Shard.
- **The Mirror Maiden:** steps out of every mirror at once to guard the Still Hourglass.
- **The Root Horror:** roots that rise into bark and claws around the Heartwood Seed.

### The Folded Cellar (levels 6-9)
Things made of Malthor's grief, folded into the pocket under his house.
- **Lingering Memory:** a wisp of drifting snow, torn floral wallpaper and frozen picture fragments, with a faint sad face. Memories of a wedding, a birthday, a sickbed. Art: `memory`.
- **Porcelain Sentinel:** one of Lyra's toy soldiers grown huge in the stillness: cracked glossy porcelain, painted rosy cheeks, a tin-blue tunic, a toy halberd, a wind-up key in its back and a painted green base. Slow (moves 2 hexes). Art: `porcelain`.
- **The Echo of Irena** (guardian of `folded2`): a translucent frozen memory of Irena in her silver gown and frost veil, arms spread to protect her daughter's things, picture frames and a child's drawing orbiting her. She is not evil: defeated, she asks the party to tell Malthor to let Lyra go. Art: `irena_echo`.

### Summoned allies
The Spirit Wolf, Phantasm, Pact Imp, Salamander, Pact Demon and Gold Dragon fight for the party when summoned by spells or items.

## Design rules for new monsters

- Every new monster needs a **lore line** here, a faith or story tie, an art key (an existing key with a `hue` variant is fine), and a place in a map's `monsters` table or a fixed fight.
- Tune with `node tests/sim.js` so that level-appropriate parties win normal fights with 70-95% HP left, and bosses at 50-90% win rate for the simple AI.
- Expected party levels by area: sewers 1-4, crypt 4-8, keep 8-11, tower 11-14. Optional realms: the Concord realms 6-9, the Folded Cellar 7-10.
- **Battle board:** a monster's `spd` is how many hexes it moves per turn (default 3; `fly` monsters 4). Give slow, heavy things `spd: 2` and fast beasts `spd: 4`. Only 4 of a group stand on the board at once; the rest wait and step in.

## Stat table (generated)

| id | Name | Lvl | HP | AC | Attacks | Traits | Art key | Found in |
|---|---|---|---|---|---|---|---|---|
| rat | Sewer Rat | 1 | 1d5 | 9 | 1x 1d3 |  | rat | town, sewers1 |
| bat | Frost Bat | 1 | 1d6 | 7 | 1x 1d3 |  | bat | town, sewers1, crypt1 |
| thief | Footpad | 1 | 1d8+1 | 8 | 1x 1d6 |  | thief | town, sewers1, sewers1 (fixed) |
| kobold | Kobold | 1 | 1d8 | 8 | 1x 1d6 |  | kobold | town, sewers1 |
| slime | Green Slime | 2 | 2d8 | 10 | 1x 1d6 | poison; resist ice x0.5 | slime | sewers1, sewers2 |
| giant_rat | Giant Rat | 2 | 2d6+1 | 8 | 1x 1d6 | poison | giant_rat | sewers1, sewers2, sewers2 (boss), u2 (fixed) |
| goblin | Goblin | 2 | 2d6+1 | 7 | 1x 1d8 |  | goblin | town |
| wolf | Frost Wolf | 2 | 2d8+2 | 7 | 1x 1d8 | resist ice x0 | wolf | town, roothollow |
| cultist | Zealot of the Pale Hour | 2 | 2d6 | 9 | 1x 1d4 | casts: a frost dart | cultist | town |
| cutthroat | Cutthroat | 3 | 3d8 | 6 | 1x 1d10 |  | cutthroat | town, sewers2 |
| wererat | Wererat | 3 | 3d8+2 | 6 | 2x 1d6 | poison; regen 1 | wererat | sewers2, sewers2 (fixed), sewers2 (boss), u2 (fixed) |
| spider | Giant Spider | 3 | 3d8 | 6 | 1x 1d8 | poison | spider | sewers2, crypt1, roothollow, roothollow (fixed) |
| orc | Orc | 3 | 3d8+2 | 6 | 1x 1d10 |  | orc | sewers2 |
| skeleton | Skeleton | 3 | 3d6+2 | 7 | 1x 1d8 | undead | skeleton | town, crypt1, crypt1 (fixed), crypt2 (fixed) |
| zombie | Zombie | 3 | 4d8 | 9 | 1x 1d10 | undead | zombie | crypt1, roothollow |
| dark_mage | Apprentice of Malthor | 4 | 3d6+2 | 7 | 1x 1d4 | casts: a frost dart, a sleet storm | dark_mage | crypt1 |
| harpy | Harpy | 4 | 4d8 | 6 | 2x 1d6 | paralyze | harpy | keep1 |
| statue_gargoyle | Living Gargoyle | 4 | 5d8+4 | 2 | 2x 1d6 | resist mind x0 | statue | - |
| clockwork | Clockwork Sentinel | 4 | 4d8+4 | 3 | 1x 1d10 | resist mind x0 lightning x1.5 | golem (hue 30) | q3 (fixed), sunvault, sunvault (fixed) |
| sunwarden | The Sun-Warden | 8 | 1d1+200 | 0 | 2x 2d6+2 | casts: a flash of searing dawn; resist fire x0 holy x0 | dark_knight (hue 200) | sunvault (fixed) |
| mirror_maiden | The Mirror Maiden | 8 | 1d1+170 | 1 | 1x 1d10 | casts: a shattering of mirrors, a frozen reflection; resist ice x0 | siren (hue 200) | mirrorhall (fixed) |
| root_horror | The Root Horror | 8 | 1d1+230 | 2 | 3x 1d10+1 | poison; regen 4; resist fire x2 | troll (hue 70) | roothollow (fixed) |
| memory | Lingering Memory | 6 | 5d8+4 | 3 | 1x 2d6 | casts: a cold remembrance; resist ice x0 mind x0.5 | memory | folded1, folded2, folded2 (fixed) |
| porcelain | Porcelain Sentinel | 7 | 7d8+8 | 1 | 2x 1d8+1 | resist mind x0 ice x0.5 lightning x1.5 | porcelain | folded1, folded1 (fixed), folded2, folded2 (fixed) |
| irena_echo | The Echo of Irena | 10 | 1d1+420 | -1 | 2x 2d8 | regen 3; casts: a lullaby of stillness, a breath of frozen time, a mother's grief; resist ice x0 | irena_echo | folded2 (fixed) |
| gremlin | Sewer Gremlin | 2 | 2d6 | 6 | 1x 1d6 |  | imp (hue 90) | sewers1, sewers2 |
| ghoul | Ghoul | 5 | 5d8 | 5 | 2x 1d8 | undead; paralyze | ghoul | crypt1, crypt1 (fixed), crypt2, crypt2 (fixed) |
| ghost | Ghost | 5 | 4d8+4 | 3 | 1x 2d6 | undead; drain | ghost | crypt1, crypt2, sunvault, mirrorhall, folded1 |
| wraith | Wraith | 6 | 6d8 | 3 | 1x 2d6 | undead; drain; casts: a grave chill | wraith | crypt2, crypt2 (boss), folded2 |
| gargoyle | Gargoyle | 6 | 6d8+4 | 2 | 3x 1d6 |  | gargoyle | crypt2 |
| mimic | Mimic | 5 | 7d8 | 4 | 1x 3d6 |  | mimic | crypt2 |
| dark_elf | Dark Elf Witch | 6 | 5d6+4 | 4 | 1x 1d8 | casts: shadow bolts, a sleep hex | dark_elf | crypt2, keep1 |
| skeleton_lord | Skeletal Knight | 6 | 6d8+6 | 2 | 2x 1d10 | undead | skeleton (hue 200) | crypt2, crypt2 (boss), sunvault |
| vampire | Vampire Countess | 8 | 8d8+8 | 1 | 2x 1d10 | undead; paralyze; drain; regen 3 | vampire | crypt2, crypt2 (fixed) |
| lich | Lesser Lich | 8 | 7d8 | 2 | 1x 1d10 | undead; casts: a frost storm, a death touch | lich | crypt2 (fixed) |
| dark_knight | Cursed Guardsman | 7 | 7d10 | 0 | 2x 2d6 |  | dark_knight | keep1, keep1 (fixed), keep2, keep2 (boss) |
| ogre | Ogre | 7 | 8d10 | 4 | 1x 3d8 |  | ogre | keep1, keep1 (fixed) |
| troll | Ice Troll | 8 | 8d10 | 3 | 3x 2d6 | regen 5; resist ice x0 fire x2 | troll | keep1, keep2, keep2 (fixed) |
| golem | Iron Golem | 9 | 12d10+10 | -2 | 1x 4d6 | resist fire x0.5 ice x0.5 lightning x1.5 mind x0 dark x0.5 | golem | keep1 (fixed), keep2 |
| basilisk | Basilisk | 8 | 8d8 | 3 | 1x 2d8 | petrify; breath: its petrifying gaze | basilisk | keep1, keep2 |
| ice_elemental | Ice Elemental | 8 | 8d8+8 | 2 | 2x 2d6 | breath: a blast of hail; resist ice x0 fire x2 | ice_elemental | keep1, keep2, keep2 (boss), tower1, mirrorhall |
| wyvern | Wyvern | 9 | 9d10 | 2 | 2x 2d8 | poison | wyvern | keep1, keep2, keep2 (fixed) |
| siren | Ice Siren | 8 | 6d8+6 | 3 | 1x 1d8 | casts: a bewitching song, a shard of ice | siren | keep2, keep2 (fixed), tower1, tower2, mirrorhall, mirrorhall (fixed), folded2 |
| imp | Frost Imp | 8 | 6d8 | 1 | 2x 1d8 | casts: an ice spike | imp | tower1, tower2, tower3 |
| demon | Bound Demon | 11 | 14d10+20 | -3 | 2x 3d8 | casts: hellfire | demon | tower2, tower2 (fixed), tower3 |
| frost_giant | Frost Giant | 11 | 16d10+20 | 0 | 2x 4d8 | resist ice x0 fire x1.5 | frost_giant | tower1, tower1 (fixed), tower2 |
| tower_mage | Pale Hour Magus | 10 | 8d8 | 1 | 1x 1d6 | casts: a blizzard, a lightning bolt | dark_mage (hue 180) | tower1, tower2, tower2 (fixed), tower3, tower3 (boss) |
| dragon | Frost Dragon | 13 | 20d12+40 | -4 | 3x 2d10 | breath: a torrent of frost; resist ice x0 fire x1.5 | dragon | tower2, tower2 (fixed) |
| crystal_golem | Crystal Sentinel | 12 | 14d10+20 | -5 | 2x 3d8 | resist ice x0 mind x0 lightning x0.5 | golem (hue 170) | tower1, tower2, tower3, tower3 (boss) |
| ratking | The Rat King | 6 | 1d1+150 | 4 | 2x 1d8+1 | BOSS; poison; regen 2 | ratking | sewers2 (boss) |
| morvane | Morvane, the Hollow King | 10 | 1d1+450 | -2 | 2x 2d8 | BOSS; undead; drain; casts: a wave of grave-frost, a soul-rending touch | morvane | crypt2 (boss) |
| kargath | Kargath, the Iron Warden | 13 | 1d1+800 | -5 | 2x 2d10+2 | BOSS; regen 4; breath: a cleaving sweep | kargath | keep2 (boss) |
| malthor | Malthor, Archmage of Winter | 18 | 1d1+1800 | -7 | 2x 2d10 | BOSS; regen 5; casts: the Eternal Winter, a lance of frozen time, a stilling glance, a spell of mending; resist ice x0 | malthor | tower3 (boss) |
| wolf_ally | Spirit Wolf | 5 | 5d8+5 | 4 | 2x 1d8+2 |  | wolf (hue 40) | summoned ally |
| phantasm | Phantasm | 6 | 6d8 | 2 | 2x 2d6 |  | ghost (hue 260) | summoned ally |
| imp_ally | Pact Imp | 6 | 5d8 | 2 | 2x 1d8+2 |  | imp (hue 300) | summoned ally |
| salamander | Salamander | 9 | 9d8+9 | 0 | 2x 3d6 |  | ice_elemental (hue 180) | summoned ally |
| demon_ally | Pact Demon | 12 | 12d10 | -3 | 2x 3d8+3 |  | demon (hue 120) | summoned ally |
| dragon_ally | Gold Dragon | 16 | 16d12+30 | -5 | 3x 3d10 |  | dragon (hue 170) | summoned ally |
