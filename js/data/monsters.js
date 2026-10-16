// Monster definitions. hp dice [n,s,plus]; ac is descending (lower = harder to hit).
// spells: [{name, kind: one|party|several|heal, dmg, el, chance, fx}]
// breath: {name, dmg, el, chance, fx, targets}
(function () {
  const M = {
    // ---------- tier 1: streets & sewers ----------
    rat: { name: 'Sewer Rat', pl: 'Sewer Rats', art: 'rat', lvl: 1, hp: [1, 5], ac: 9, atk: 1, dmg: [1, 3], grp: [2, 6] },
    bat: { name: 'Frost Bat', pl: 'Frost Bats', art: 'bat', lvl: 1, hp: [1, 6], ac: 7, atk: 1, dmg: [1, 3], grp: [2, 6], fly: true },
    thief: { name: 'Footpad', pl: 'Footpads', art: 'thief', lvl: 1, hp: [1, 8, 1], ac: 8, atk: 1, dmg: [1, 6], grp: [1, 4], gold: 3 },
    kobold: { name: 'Kobold', pl: 'Kobolds', art: 'kobold', lvl: 1, hp: [1, 8], ac: 8, atk: 1, dmg: [1, 6], grp: [2, 6] },
    slime: { spd: 2, name: 'Green Slime', pl: 'Green Slimes', art: 'slime', lvl: 2, hp: [2, 8], ac: 10, atk: 1, dmg: [1, 6], grp: [1, 3], poison: 0.25, resist: { ice: 0.5 } },
    giant_rat: { name: 'Giant Rat', pl: 'Giant Rats', art: 'giant_rat', lvl: 2, hp: [2, 6, 1], ac: 8, atk: 1, dmg: [1, 6], grp: [1, 6], poison: 0.1 },
    goblin: { name: 'Goblin', pl: 'Goblins', art: 'goblin', lvl: 2, hp: [2, 6, 1], ac: 7, atk: 1, dmg: [1, 8], grp: [2, 6], gold: 2 },
    wolf: { spd: 4, name: 'Frost Wolf', pl: 'Frost Wolves', art: 'wolf', lvl: 2, hp: [2, 8, 2], ac: 7, atk: 1, dmg: [1, 8], grp: [1, 4], resist: { ice: 0 } },
    cultist: { name: 'Zealot of the Pale Hour', pl: 'Zealots of the Pale Hour', art: 'cultist', lvl: 2, hp: [2, 6], ac: 9, atk: 1, dmg: [1, 4], grp: [1, 4], gold: 3,
      spells: [{ name: 'a frost dart', kind: 'one', dmg: [2, 6], el: 'ice', chance: 0.4, fx: 'ice' }] },

    // ---------- tier 2 ----------
    cutthroat: { name: 'Cutthroat', pl: 'Cutthroats', art: 'cutthroat', lvl: 3, hp: [3, 8], ac: 6, atk: 1, dmg: [1, 10], grp: [1, 4], gold: 4 },
    wererat: { name: 'Wererat', pl: 'Wererats', art: 'wererat', lvl: 3, hp: [3, 8, 2], ac: 6, atk: 2, dmg: [1, 6], grp: [1, 3], poison: 0.15, regen: 1 },
    spider: { name: 'Giant Spider', pl: 'Giant Spiders', art: 'spider', lvl: 3, hp: [3, 8], ac: 6, atk: 1, dmg: [1, 8], grp: [1, 4], poison: 0.3 },
    orc: { name: 'Orc', pl: 'Orcs', art: 'orc', lvl: 3, hp: [3, 8, 2], ac: 6, atk: 1, dmg: [1, 10], grp: [2, 6], gold: 2 },
    skeleton: { name: 'Skeleton', pl: 'Skeletons', art: 'skeleton', lvl: 3, hp: [3, 6, 2], ac: 7, atk: 1, dmg: [1, 8], grp: [2, 8], undead: true },
    zombie: { spd: 2, name: 'Zombie', pl: 'Zombies', art: 'zombie', lvl: 3, hp: [4, 8], ac: 9, atk: 1, dmg: [1, 10], grp: [2, 6], undead: true },
    dark_mage: { name: 'Apprentice of Malthor', pl: 'Apprentices of Malthor', art: 'dark_mage', lvl: 4, hp: [3, 6, 2], ac: 7, atk: 1, dmg: [1, 4], grp: [1, 3], gold: 6,
      spells: [{ name: 'a frost dart', kind: 'one', dmg: [3, 6], el: 'ice', chance: 0.5, fx: 'ice' }, { name: 'a sleet storm', kind: 'several', dmg: [2, 6], el: 'ice', chance: 0.2, fx: 'ice' }] },
    harpy: { name: 'Harpy', pl: 'Harpies', art: 'harpy', lvl: 4, hp: [4, 8], ac: 6, atk: 2, dmg: [1, 6], grp: [1, 4], fly: true, para: 0.05 },
    statue_gargoyle: { name: 'Living Gargoyle', pl: 'Living Gargoyles', art: 'statue', lvl: 4, hp: [5, 8, 4], ac: 2, atk: 2, dmg: [1, 6], grp: [1, 2], nosleep: true, resist: { mind: 0 } },
    clockwork: { name: 'Clockwork Sentinel', pl: 'Clockwork Sentinels', art: 'golem', hue: 30, lvl: 4, hp: [4, 8, 4], ac: 3, atk: 1, dmg: [1, 10], grp: [1, 3], nosleep: true, resist: { mind: 0, lightning: 1.5 } },
    sunwarden: { name: 'The Sun-Warden', pl: 'Sun-Wardens', art: 'dark_knight', hue: 200, lvl: 8, hp: [1, 1, 200], ac: 0, atk: 2, dmg: [2, 6, 2], grp: [1, 1], gold: 100, nosleep: true, resist: { fire: 0, holy: 0 },
      spells: [{ name: 'a flash of searing dawn', kind: 'party', dmg: [3, 8], el: 'fire', chance: 0.3, fx: 'holy' }] },
    mirror_maiden: { name: 'The Mirror Maiden', pl: 'Mirror Maidens', art: 'siren', hue: 200, lvl: 8, hp: [1, 1, 170], ac: 1, atk: 1, dmg: [1, 10], grp: [1, 1], gold: 100, nosleep: true, resist: { ice: 0 },
      spells: [{ name: 'a shattering of mirrors', kind: 'several', dmg: [5, 6], el: 'ice', chance: 0.35, fx: 'ice' }, { name: 'a frozen reflection', kind: 'para', chance: 0.15, fx: 'ice' }] },
    root_horror: { name: 'The Root Horror', pl: 'Root Horrors', art: 'troll', hue: 70, lvl: 8, hp: [1, 1, 230], ac: 2, atk: 3, dmg: [1, 10, 1], grp: [1, 1], gold: 100, regen: 4, poison: 0.2, resist: { fire: 2 } },
    // ---------- the Folded Cellar (Malthor's grief) ----------
    memory: { name: 'Lingering Memory', pl: 'Lingering Memories', art: 'memory', lvl: 6, hp: [5, 8, 4], ac: 3, atk: 1, dmg: [2, 6], grp: [1, 4], fly: true, nosleep: true, resist: { ice: 0, mind: 0.5 },
      spells: [{ name: 'a cold remembrance', kind: 'one', dmg: [3, 6], el: 'ice', chance: 0.3, fx: 'ice' }] },
    porcelain: { name: 'Porcelain Sentinel', pl: 'Porcelain Sentinels', art: 'porcelain', lvl: 7, hp: [7, 8, 8], ac: 1, atk: 2, dmg: [1, 8, 1], grp: [1, 3], spd: 2, gold: 8, nosleep: true, resist: { mind: 0, ice: 0.5, lightning: 1.5 } },
    irena_echo: { name: 'The Echo of Irena', pl: 'Echoes of Irena', art: 'irena_echo', lvl: 10, hp: [1, 1, 420], ac: -1, atk: 2, dmg: [2, 8], grp: [1, 1], gold: 100, nosleep: true, mres: 0.7, regen: 3, resist: { ice: 0 },
      spells: [{ name: 'a lullaby of stillness', kind: 'para', chance: 0.15, fx: 'ice' }, { name: 'a breath of frozen time', kind: 'several', dmg: [6, 8], el: 'ice', chance: 0.4, fx: 'ice' },
        { name: 'a mother\'s grief', kind: 'party', dmg: [4, 8], el: 'ice', chance: 0.25, fx: 'dark' }] },
    gremlin: { name: 'Sewer Gremlin', pl: 'Sewer Gremlins', art: 'imp', hue: 90, lvl: 2, hp: [2, 6], ac: 6, atk: 1, dmg: [1, 6], grp: [2, 5], gold: 1 },

    // ---------- tier 3: crypt ----------
    ghoul: { name: 'Ghoul', pl: 'Ghouls', art: 'ghoul', lvl: 5, hp: [5, 8], ac: 5, atk: 2, dmg: [1, 8], grp: [1, 6], undead: true, para: 0.15 },
    ghost: { name: 'Ghost', pl: 'Ghosts', art: 'ghost', lvl: 5, hp: [4, 8, 4], ac: 3, atk: 1, dmg: [2, 6], grp: [1, 4], undead: true, drain: 0.3, fly: true },
    wraith: { name: 'Wraith', pl: 'Wraiths', art: 'wraith', lvl: 6, hp: [6, 8], ac: 3, atk: 1, dmg: [2, 6], grp: [1, 4], undead: true, drain: 0.3,
      spells: [{ name: 'a grave chill', kind: 'one', dmg: [4, 6], el: 'ice', chance: 0.3, fx: 'dark' }] },
    gargoyle: { name: 'Gargoyle', pl: 'Gargoyles', art: 'gargoyle', lvl: 6, hp: [6, 8, 4], ac: 2, atk: 3, dmg: [1, 6], grp: [1, 4], fly: true, nosleep: true },
    mimic: { name: 'Mimic', pl: 'Mimics', art: 'mimic', lvl: 5, hp: [7, 8], ac: 4, atk: 1, dmg: [3, 6], grp: [1, 1], gold: 20 },
    dark_elf: { name: 'Dark Elf Witch', pl: 'Dark Elf Witches', art: 'dark_elf', lvl: 6, hp: [5, 6, 4], ac: 4, atk: 1, dmg: [1, 8], grp: [1, 3], gold: 10,
      spells: [{ name: 'shadow bolts', kind: 'several', dmg: [3, 6], el: 'dark', chance: 0.4, fx: 'dark' }, { name: 'a sleep hex', kind: 'para', chance: 0.15, fx: 'dark' }] },
    skeleton_lord: { name: 'Skeletal Knight', pl: 'Skeletal Knights', art: 'skeleton', hue: 200, lvl: 6, hp: [6, 8, 6], ac: 2, atk: 2, dmg: [1, 10], grp: [1, 4], undead: true },
    vampire: { name: 'Vampire Countess', pl: 'Vampire Countesses', art: 'vampire', lvl: 8, hp: [8, 8, 8], ac: 1, atk: 2, dmg: [1, 10], grp: [1, 2], undead: true, drain: 0.4, para: 0.1, regen: 3, gold: 30 },
    lich: { name: 'Lesser Lich', pl: 'Lesser Liches', art: 'lich', lvl: 8, hp: [7, 8], ac: 2, atk: 1, dmg: [1, 10], grp: [1, 2], undead: true, gold: 25,
      spells: [{ name: 'a frost storm', kind: 'party', dmg: [4, 6], el: 'ice', chance: 0.4, fx: 'ice' }, { name: 'a death touch', kind: 'one', dmg: [6, 8], el: 'dark', chance: 0.2, fx: 'dark' }] },

    // ---------- tier 4: iron keep ----------
    dark_knight: { name: 'Cursed Guardsman', pl: 'Cursed Guardsmen', art: 'dark_knight', lvl: 7, hp: [7, 10], ac: 0, atk: 2, dmg: [2, 6], grp: [1, 4], gold: 15 },
    ogre: { name: 'Ogre', pl: 'Ogres', art: 'ogre', lvl: 7, hp: [8, 10], ac: 4, atk: 1, dmg: [3, 8], grp: [1, 3], gold: 12 },
    troll: { name: 'Ice Troll', pl: 'Ice Trolls', art: 'troll', lvl: 8, hp: [8, 10], ac: 3, atk: 3, dmg: [2, 6], grp: [1, 3], regen: 5, resist: { ice: 0, fire: 2 } },
    golem: { spd: 2, name: 'Iron Golem', pl: 'Iron Golems', art: 'golem', lvl: 9, hp: [12, 10, 10], ac: -2, atk: 1, dmg: [4, 6], grp: [1, 2], nosleep: true, resist: { fire: 0.5, ice: 0.5, lightning: 1.5, mind: 0, dark: 0.5 } },
    basilisk: { name: 'Basilisk', pl: 'Basilisks', art: 'basilisk', lvl: 8, hp: [8, 8], ac: 3, atk: 1, dmg: [2, 8], grp: [1, 2], stone: 0.12,
      breath: { name: 'its petrifying gaze', dmg: [0, 0], stone: 0.25, chance: 0.25, fx: 'dark', targets: 2 } },
    ice_elemental: { name: 'Ice Elemental', pl: 'Ice Elementals', art: 'ice_elemental', lvl: 8, hp: [8, 8, 8], ac: 2, atk: 2, dmg: [2, 6], grp: [1, 3], nosleep: true, resist: { ice: 0, fire: 2 },
      breath: { name: 'a blast of hail', dmg: [5, 6], el: 'ice', chance: 0.3, fx: 'ice', targets: 3 } },
    wyvern: { name: 'Wyvern', pl: 'Wyverns', art: 'wyvern', lvl: 9, hp: [9, 10], ac: 2, atk: 2, dmg: [2, 8], grp: [1, 2], poison: 0.3, fly: true },
    siren: { name: 'Ice Siren', pl: 'Ice Sirens', art: 'siren', lvl: 8, hp: [6, 8, 6], ac: 3, atk: 1, dmg: [1, 8], grp: [1, 3], gold: 20,
      spells: [{ name: 'a bewitching song', kind: 'para', chance: 0.3, fx: 'generic' }, { name: 'a shard of ice', kind: 'one', dmg: [5, 6], el: 'ice', chance: 0.3, fx: 'ice' }] },

    // ---------- tier 5: tower ----------
    imp: { name: 'Frost Imp', pl: 'Frost Imps', art: 'imp', lvl: 8, hp: [6, 8], ac: 1, atk: 2, dmg: [1, 8], grp: [2, 6], fly: true,
      spells: [{ name: 'an ice spike', kind: 'one', dmg: [4, 8], el: 'ice', chance: 0.35, fx: 'ice' }] },
    demon: { name: 'Bound Demon', pl: 'Bound Demons', art: 'demon', lvl: 11, hp: [14, 10, 20], ac: -3, atk: 2, dmg: [3, 8], grp: [1, 2], gold: 40, nosleep: true,
      spells: [{ name: 'hellfire', kind: 'party', dmg: [6, 8], el: 'fire', chance: 0.3, fx: 'fire' }] },
    frost_giant: { name: 'Frost Giant', pl: 'Frost Giants', art: 'frost_giant', lvl: 11, hp: [16, 10, 20], ac: 0, atk: 2, dmg: [4, 8], grp: [1, 2], gold: 50, resist: { ice: 0, fire: 1.5 } },
    tower_mage: { name: 'Pale Hour Magus', pl: 'Pale Hour Magi', art: 'dark_mage', hue: 180, lvl: 10, hp: [8, 8], ac: 1, atk: 1, dmg: [1, 6], grp: [1, 3], gold: 30,
      spells: [{ name: 'a blizzard', kind: 'party', dmg: [5, 6], el: 'ice', chance: 0.3, fx: 'ice' }, { name: 'a lightning bolt', kind: 'several', dmg: [6, 8], el: 'lightning', chance: 0.25, fx: 'lightning' }] },
    dragon: { name: 'Frost Dragon', pl: 'Frost Dragons', art: 'dragon', lvl: 13, hp: [20, 12, 40], ac: -4, atk: 3, dmg: [2, 10], grp: [1, 1], gold: 200, nosleep: true, resist: { ice: 0, fire: 1.5 },
      breath: { name: 'a torrent of frost', dmg: [10, 8], el: 'ice', chance: 0.35, fx: 'ice', targets: 6 } },
    crystal_golem: { name: 'Crystal Sentinel', pl: 'Crystal Sentinels', art: 'golem', hue: 170, lvl: 12, hp: [14, 10, 20], ac: -5, atk: 2, dmg: [3, 8], grp: [1, 2], nosleep: true, resist: { ice: 0, mind: 0, lightning: 0.5 } },

    // ---------- bosses ----------
    ratking: { name: 'The Rat King', pl: 'Rat Kings', art: 'ratking', lvl: 6, hp: [1, 1, 150], ac: 4, atk: 2, dmg: [1, 8, 1], grp: [1, 1], boss: true, regen: 2, poison: 0.25, gold: 300, xp: 4000 },
    morvane: { name: 'Morvane, the Hollow King', pl: 'Hollow Kings', art: 'morvane', lvl: 10, hp: [1, 1, 450], ac: -2, atk: 2, dmg: [2, 8], grp: [1, 1], boss: true, undead: true, drain: 0.3, gold: 800, xp: 16000,
      spells: [{ name: 'a wave of grave-frost', kind: 'party', dmg: [6, 6], el: 'ice', chance: 0.35, fx: 'ice' }, { name: 'a soul-rending touch', kind: 'one', dmg: [8, 8], el: 'dark', chance: 0.2, fx: 'dark' }] },
    kargath: { name: 'Kargath, the Iron Warden', pl: 'Iron Wardens', art: 'kargath', lvl: 13, hp: [1, 1, 800], ac: -5, atk: 2, dmg: [2, 10, 2], grp: [1, 1], boss: true, regen: 4, gold: 1500, xp: 40000,
      breath: { name: 'a cleaving sweep', dmg: [6, 10], el: 'force', chance: 0.25, fx: 'generic', targets: 3, melee: true } },
    malthor: { name: 'Malthor, Archmage of Winter', pl: 'Archmages', art: 'malthor', lvl: 18, hp: [1, 1, 1800], ac: -7, atk: 2, dmg: [2, 10], grp: [1, 1], boss: true, regen: 5, gold: 0, xp: 100000,
      resist: { ice: 0 },
      spells: [{ name: 'the Eternal Winter', kind: 'party', dmg: [10, 8], el: 'ice', chance: 0.3, fx: 'ice' },
        { name: 'a lance of frozen time', kind: 'one', dmg: [16, 8], el: 'ice', chance: 0.25, fx: 'ice' },
        { name: 'a stilling glance', kind: 'para', chance: 0.12, fx: 'dark' },
        { name: 'a spell of mending', kind: 'heal', dmg: [10, 10], chance: 0.08, fx: 'heal' }] },

    // ---------- summoned allies (stats used for party summons) ----------
    wolf_ally: { name: 'Spirit Wolf', art: 'wolf', hue: 40, lvl: 5, hp: [5, 8, 5], ac: 4, atk: 2, dmg: [1, 8, 2] },
    phantasm: { name: 'Phantasm', art: 'ghost', hue: 260, lvl: 6, hp: [6, 8], ac: 2, atk: 2, dmg: [2, 6] },
    imp_ally: { name: 'Pact Imp', art: 'imp', hue: 300, lvl: 6, hp: [5, 8], ac: 2, atk: 2, dmg: [1, 8, 2] },
    salamander: { name: 'Salamander', art: 'ice_elemental', hue: 180, lvl: 9, hp: [9, 8, 9], ac: 0, atk: 2, dmg: [3, 6], el: 'fire' },
    demon_ally: { name: 'Pact Demon', art: 'demon', hue: 120, lvl: 12, hp: [12, 10], ac: -3, atk: 2, dmg: [3, 8, 3] },
    dragon_ally: { name: 'Gold Dragon', art: 'dragon', hue: 170, lvl: 16, hp: [16, 12, 30], ac: -5, atk: 3, dmg: [3, 10], el: 'fire' },
  };

  for (const k in M) {
    const m = M[k];
    m.id = k;
    if (!m.pl) m.pl = m.name + 's';
    if (m.xp == null) m.xp = Math.round(45 * Math.pow(m.lvl, 1.7));
    if (m.boss) { m.nosleep = true; if (m.mres == null) m.mres = 0.6; }
    if (m.undead) m.nosleep = true;
  }
  BT.MONSTERS = M;
})();
