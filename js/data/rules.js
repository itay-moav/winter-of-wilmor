// Game rules data: races, classes, progression, statuses, bard songs and the three faiths.
(function () {
  const D = {};

  D.STATS = ['st', 'iq', 'dx', 'cn', 'lk'];
  D.STATNAME = { st: 'Strength', iq: 'Intellect', dx: 'Dexterity', cn: 'Constitution', lk: 'Luck' };

  D.RACES = {
    human: { name: 'Human', mod: { st: 1, iq: 0, dx: 0, cn: 1, lk: 0 } },
    elf: { name: 'Elf', mod: { st: -1, iq: 2, dx: 1, cn: -1, lk: 0 } },
    dwarf: { name: 'Dwarf', mod: { st: 2, iq: -1, dx: -1, cn: 2, lk: 0 } },
    hobbit: { name: 'Hobbit', mod: { st: -2, iq: 0, dx: 3, cn: 0, lk: 2 } },
    halfelf: { name: 'Half-Elf', mod: { st: 0, iq: 1, dx: 1, cn: 0, lk: 0 } },
    halforc: { name: 'Half-Orc', mod: { st: 3, iq: -2, dx: 0, cn: 2, lk: -1 } },
    gnome: { name: 'Gnome', mod: { st: -1, iq: 2, dx: 0, cn: 1, lk: 1 } },
  };

  // hd: hit die. melee: to-hit progression per level. extra: levels that grant an extra attack.
  // school: spell school for mages. start: available at creation.
  D.CLASSES = {
    warrior: { name: 'Warrior', abbr: 'Wa', hd: 10, melee: 1.0, extra: 4, start: true,
      desc: 'Master of arms. Best hit points and extra attacks as they rise in level.' },
    paladin: { name: 'Paladin', abbr: 'Pa', hd: 10, melee: 1.0, extra: 4, start: true,
      desc: 'Holy knight. Resists curses and poison, smites the undead.' },
    rogue: { name: 'Rogue', abbr: 'Ro', hd: 6, melee: 0.75, extra: 8, start: true,
      desc: 'Disarms traps on chests, hides in combat to strike from the shadows.' },
    bard: { name: 'Bard', abbr: 'Ba', hd: 8, melee: 0.75, extra: 8, start: true,
      desc: 'Sings magical songs that aid the whole party. Needs an instrument.' },
    hunter: { name: 'Hunter', abbr: 'Hu', hd: 8, melee: 0.9, extra: 5, start: true,
      desc: 'Deadly with a bow; may slay a foe outright with a critical strike.' },
    monk: { name: 'Monk', abbr: 'Mo', hd: 8, melee: 1.0, extra: 4, start: true,
      desc: 'Fights barehanded and unarmored, growing ever more lethal.' },
    conjurer: { name: 'Conjurer', abbr: 'Co', hd: 4, melee: 0.5, extra: 0, school: 'con', start: true,
      desc: 'Elemental magic: fire, frost and healing.' },
    magician: { name: 'Magician', abbr: 'Ma', hd: 4, melee: 0.5, extra: 0, school: 'mag', start: true,
      desc: 'Enchantments, wards, and arcane force.' },
    sorcerer: { name: 'Sorcerer', abbr: 'So', hd: 4, melee: 0.5, extra: 0, school: 'sor', start: false,
      desc: 'Shadow, illusion and fear. Requires 3 spell levels of Conjurer or Magician.' },
    wizard: { name: 'Wizard', abbr: 'Wi', hd: 4, melee: 0.5, extra: 0, school: 'wiz', start: false,
      desc: 'Summoning and the highest magic. Requires 3 spell levels of Sorcerer and one other school.' },
  };
  D.MAGES = ['conjurer', 'magician', 'sorcerer', 'wizard'];
  D.SCHOOLS = { con: 'Conjurer', mag: 'Magician', sor: 'Sorcerer', wiz: 'Wizard' };

  // Total XP required to *be* level L.
  D.xpFor = (L) => (L <= 1 ? 0 : Math.floor(150 * Math.pow(L - 1, 2.6)));
  D.statBonus = (v) => (v >= 18 ? 3 : v >= 16 ? 2 : v >= 14 ? 1 : v <= 6 ? -1 : 0);
  D.maxSpellLevel = (charLevel) => Math.min(7, Math.ceil(charLevel / 2));
  D.spellLevelCost = (n) => 200 * n * n;

  D.STATUS = {
    ok: { name: 'OK', color: '#9fe39f' },
    poisoned: { name: 'Poisoned', color: '#9be05a' },
    paralyzed: { name: 'Paralyzed', color: '#f0c050' },
    stoned: { name: 'Stoned', color: '#aaaaaa' },
    dead: { name: 'Dead', color: '#ff5050' },
  };

  // Bard songs. combat: applied for the rest of the fight. explore: lasts some steps.
  D.SONGS = [
    { id: 'ward', name: "Warding Hymn", desc: 'Party AC improves by 3.', ac: -3 },
    { id: 'march', name: 'March of Iron', desc: 'Party strikes harder: +2 to hit, +3 damage.', hit: 2, dmg: 3 },
    { id: 'hearth', name: 'Hearthfire Lay', desc: 'Warmth that heals 2 HP each round (and every few steps).', regen: 2 },
    { id: 'lantern', name: 'Lantern Song', desc: 'Magical light while exploring (radius 4).', light: 4 },
    { id: 'lull', name: 'Lullaby of Frost', desc: 'Each round, the nearest foes may fall asleep.', lull: true },
    { id: 'requiem', name: 'Requiem', desc: 'Each round, the undead are wracked with pain.', requiem: true },
    { id: 'swift', name: 'Song of Swiftness', desc: 'Party acts first and can always escape.', swift: true },
  ];

  // The three faiths of the realm.
  D.FAITHS = {
    dawn: {
      name: 'The Dawn', god: 'Solenne, the Kindled Sun', city: 'Velmoor',
      creed: 'All that sets will rise again.',
      blessing: 'Blessing of the Kindled Sun',
      bdesc: 'Holy fire burns brighter: +50% damage against the undead, sunlight restores magic twice as fast, and the Temple of the Dawn heals at half price.',
      color: '#ffd76a',
    },
    pale: {
      name: 'The Pale Hour', god: 'Ysra, the Still Mother', city: 'Isenmark',
      creed: 'What is loved should never change.',
      blessing: 'The Still Mother\'s Hush',
      bdesc: 'The cold no longer bites: the party takes half damage from ice and frost. (The Dawn\'s priests will charge you double.)',
      color: '#bfe4ff',
    },
    root: {
      name: 'The Deep Root', god: 'Vaelor, the Root-Below', city: 'old Vael-Harrow',
      creed: 'We go down, so that others may grow.',
      blessing: 'Embrace of the Deep Root',
      bdesc: 'The earth feeds you: below ground the party slowly heals as it walks, and the undead strike you with less fury.',
      color: '#b8d27a',
    },
  };

  BT.D = D;
})();
