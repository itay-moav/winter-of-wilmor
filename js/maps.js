// Town layout, dungeon level specs, visual styles and encounter tables.
(function () {
  const MG = BT.MG;

  BT.STYLES = {
    town: { battle: 'combat_city', wall: 'house', floor: 'cobble', ceil: 'sky', fog: [20, 26, 48], ambient: 1, music: 'town', snow: true },
    sewer: { battle: 'combat_underground', wall: 'sewer', floor: 'sewerfloor', ceil: 'sewerceil', fog: [6, 14, 10], ambient: 0.32, music: 'dungeon' },
    crypt: { battle: 'combat_underground', wall: 'crypt', floor: 'cryptfloor', ceil: 'cryptceil', fog: [8, 8, 16], ambient: 0.28, music: 'crypt' },
    keep: { battle: 'combat_underground', wall: 'keep', floor: 'keepfloor', ceil: 'keepceil', fog: [14, 8, 6], ambient: 0.34, music: 'dungeon' },
    tower: { battle: 'combat_wild', wall: 'tower', floor: 'towerfloor', ceil: 'towerceil', fog: [10, 14, 30], ambient: 0.5, music: 'tower' },
    interior: { battle: 'combat_city', wall: 'woodwall', floor: 'planks', ceil: 'beams', door: 'door_interior', fog: [18, 12, 8], ambient: 0.75, music: 'tavern', scene: 'town' },
    vault: { battle: 'combat_wild', wall: 'vault', floor: 'vaultfloor', ceil: 'vaultceil', door: 'door_vault', fog: [30, 22, 6], ambient: 0.6, music: 'temple', scene: 'tower' },
    mirror: { battle: 'combat_wild', wall: 'tower', floor: 'towerfloor', ceil: 'towerceil', door: 'door_tower', fog: [20, 30, 50], ambient: 0.55, music: 'tower', scene: 'tower' },
    hollow: { battle: 'combat_underground', wall: 'hollow', floor: 'hollowfloor', ceil: 'hollowceil', door: 'door_hollow', fog: [8, 10, 4], ambient: 0.3, music: 'crypt', scene: 'crypt' },
  };

  // ---------------- Town ----------------
  const TOWN_ROWS = [
    '#####################',
    '#...................#',
    '#.A#.T#.S#.I#.R#.#W.#',
    '#.##.##.##.##.##.##.#',
    '#.........x........x#',
    '#.##.PP.f..M#.##x##.#',
    '#.##.PP..x.##.#K.#Y.#',
    '#...................#',
    '#.##.##.HH.#Q.##.##.#',
    '#.##.##.HH.##.##.##.#',
    '#x..................#',
    '#.gg.OO.##.##.##.##.#',
    '#.Cg.OO.U#.##.##.##.#',
    '#............x......#',
    '##########G##########',
  ];
  BT.BUILDINGS = {
    A: { id: 'guild', name: "Adventurers' Guild" },
    T: { id: 'tavern', name: 'The Frostbitten Flagon' },
    S: { id: 'shop', name: "Brannoc's Outfitters" },
    I: { id: 'inn', name: 'The Warm Hearth Inn' },
    R: { id: 'review', name: 'Hall of Review' },
    P: { id: 'temple', name: 'Temple of the Dawn', temple: 'dawn' },
    H: { id: 'pale', name: 'Hall of the Still Mother', temple: 'pale' },
    O: { id: 'root', name: 'Barrow of the Deep Root', temple: 'root' },
    M: { id: 'mystic', name: "Madame Zeyla's Energies" },
    C: { id: 'crypt', name: 'Crypt of the Old Kings' },
    K: { id: 'keep', name: 'The Iron Keep' },
    W: { id: 'tower', name: "Malthor's Tower" },
    G: { id: 'gate', name: 'City Gate' },
    Q: { id: 'house', name: 'House of Orrin the Clockmaker', map: 'q1', faith: 'dawn' },
    Y: { id: 'house', name: 'House of the Widow Ysolde', map: 'y1', faith: 'pale' },
    U: { id: 'house', name: 'Bramwick\'s Old Mill', map: 'u1', faith: 'root' },
  };

  function buildTown() {
    const m = MG.fromBlocks(TOWN_ROWS, BT.BUILDINGS);
    m.id = 'town';
    m.name = 'Velmoor';
    m.style = 'town';
    m.depth = 0;
    m.start = { x: 2, y: 1, d: 1 };
    // building heights (in wall units): houses vary, temples and towers loom
    const SPECIAL_H = { A: 1.7, T: 1.35, S: 1.35, I: 1.7, R: 2.05, M: 1.35, P: 2.0, H: 2.4, O: 1.25, C: 1.4, K: 2.6, W: 3.6, G: 1.6, Q: 2.4, Y: 2.05, U: 2.4 };
    m.cellH = [];
    for (let y = 0; y < m.h; y++) {
      m.cellH.push([]);
      for (let x = 0; x < m.w; x++) {
        const c = TOWN_ROWS[y][x];
        let h = 1;
        if (SPECIAL_H[c]) h = SPECIAL_H[c];
        else if (c === '#') {
          if (x === 0 || y === 0 || x === m.w - 1 || y === m.h - 1) h = 1.3;
          else { const r = (x * 31 + y * 17 + x * y * 7) % 10; h = r < 3 ? 1 : r < 6 ? 1.35 : r < 9 ? 1.7 : 2.05; }
        }
        m.cellH[y].push(h);
      }
    }
    m.encounter = 0.025;
    m.monsters = [['rat', 3], ['thief', 3], ['kobold', 2], ['wolf', 2], ['cultist', 2], ['goblin', 2], ['bat', 1]];
    m.nightMonsters = [['thief', 2], ['cutthroat', 2], ['wolf', 3], ['cultist', 3], ['skeleton', 1], ['goblin', 2]];
    m.groupsMax = 2;
    for (let y = 0; y < m.h; y++)
      for (let x = 0; x < m.w; x++) {
        const c = TOWN_ROWS[y][x];
        if (c === 'f') m.ev[y][x] = { t: 'fountain', kind: 'town' };
        if (c === 'g') m.ev[y][x] = { t: 'msg', grave: (x + y) % 2 ? 'root' : 'dawn', text: 'Snow lies thick on the old cemetery. Most stones bear the tree-and-ring of the Deep Root, older than the city itself; a few newer ones carry the Dawn\'s sun. The crypt gate looms to the west, sealed with a bronze lock.', repeat: true };
        if (c === 'x') m.ev[y][x] = { t: 'statue' };
      }
    return m;
  }

  // ---------------- Dungeons ----------------
  BT.LEVEL_SPECS = [
    {
      id: 'sewers1', name: 'Sewers of Velmoor - Upper', style: 'sewer', depth: 1, w: 16, h: 16, seed: 1101,
      rooms: 4, loops: 0.12, secret: 0.15, encounter: 0.045, groupsMax: 2,
      up: { map: 'town', x: 4, y: 2, d: 1, text: 'You climb back up into the tavern cellar and out into the street.' },
      monsters: [['rat', 4], ['giant_rat', 3], ['bat', 2], ['slime', 2], ['kobold', 2], ['gremlin', 2], ['thief', 2]],
      features: [
        { t: 'stairs', dir: 'down', to: 'sewers2', at: 'far' },
        { t: 'lyra', at: 'mid', key: 'sewers' },
        { t: 'msg', at: 'near', text: 'Icy water runs ankle-deep through the tunnels. Someone has scratched a crude crown and a rat on the wall.' },
        { t: 'msg', at: 'random', text: 'Words are painted in red: "THE KING BELOW SEES ALL. PAY YOUR TITHE OR FEED HIS CHILDREN."' },
        { t: 'msg', at: 'random', text: 'A soggy tract is nailed to the wall, stamped with a snowflake around an empty hourglass: "REJOICE! The Still Mother has heard a father\'s prayer. Nothing you love need ever change again. - The Pale Hall"' },
        { t: 'chest', at: 'deadend', count: 2, tier: 1 },
        { t: 'fight', at: 'deadend', groups: [['thief', 4]], text: 'A gang of footpads blocks the tunnel, knives drawn. "Toll for the King!"' },
        { t: 'trap', at: 'corridor', count: 3, dmg: [1, 6], text: 'The floor gives way into a flooded hole!' },
        { t: 'fountain', at: 'room', kind: 'heal' },
        { t: 'zone', flag: MG.F_WATER, size: 6, count: 1 },
        { t: 'zone', flag: MG.F_DARK, size: 6, count: 1 },
      ],
    },
    {
      id: 'sewers2', name: 'Sewers of Velmoor - Deep', style: 'sewer', depth: 1, w: 16, h: 16, seed: 1202,
      rooms: 5, loops: 0.1, secret: 0.2, encounter: 0.05, groupsMax: 3,
      monsters: [['giant_rat', 3], ['wererat', 3], ['spider', 2], ['cutthroat', 2], ['slime', 2], ['gremlin', 1], ['orc', 1]],
      features: [
        { t: 'boss', at: 'bossroom', flag: 'ratking', groups: [['ratking', 1], ['wererat', 3], ['giant_rat', 4]], npc: 'ratking',
          text: 'Atop a throne of stolen junk sits a rat the size of a bear, a tin crown on its head and a bronze key on a chain around its neck. "Who dares enter the court of the Rat King? Children - feast!"',
          after: 'The Rat King collapses onto its throne of junk. Around its neck, on a greasy chain, hangs a bronze key.', items: ['bronzekey', 'shadowfang'], gold: 400 },
        { t: 'msg', at: 'near', text: 'Bones of small animals crunch underfoot. You hear a chorus of squeaking, very close.' },
        { t: 'chest', at: 'deadend', count: 2, tier: 1 },
        { t: 'chest', at: 'deadend', count: 1, tier: 2 },
        { t: 'fight', at: 'mid', groups: [['wererat', 3]], text: 'Three hunched figures - half man, half rat - turn their red eyes on you.' },
        { t: 'trap', at: 'corridor', count: 3, dmg: [2, 6], poison: true, text: 'A rusty needle springs from the wall!' },
        { t: 'spinner', at: 'corridor', count: 2 },
        { t: 'msg', at: 'random', text: 'A rotting letter sealed with a snowflake sigil: "The bronze key stays with you, Majesty. Let no one into the crypt. -M."' },
        { t: 'zone', flag: MG.F_DARK, size: 8, count: 2 },
        { t: 'zone', flag: MG.F_WATER, size: 6, count: 1 },
      ],
    },
    {
      id: 'crypt1', name: 'Crypt of the Old Kings', style: 'crypt', depth: 2, w: 18, h: 18, seed: 2301,
      rooms: 5, loops: 0.1, secret: 0.25, encounter: 0.05, groupsMax: 3,
      up: { map: 'town', x: 1, y: 12, d: 1, text: 'You climb out of the crypt into the snowy graveyard.' },
      monsters: [['skeleton', 3], ['zombie', 3], ['ghoul', 2], ['ghost', 2], ['spider', 1], ['dark_mage', 2], ['bat', 1]],
      features: [
        { t: 'stairs', dir: 'down', to: 'crypt2', at: 'far', require: { flag: 'riddle_crypt' }, locked: 'The stairway down is sealed by a slab of black stone carved with a mouth. It does not move.' },
        { t: 'riddle', at: 'mid', flag: 'riddle_crypt', q: 'The more of me you take, the more of me you leave behind. What am I?', a: ['footsteps', 'steps', 'footstep', 'foot steps'],
          right: 'The mouth laughs dryly. "Then walk on, mortal." Somewhere deep below, stone grinds against stone.' },
        { t: 'lyra', at: 'random', key: 'crypt' },
        { t: 'msg', at: 'near', text: 'Rows of stone kings sleep in their niches, frost in their beards. Above each one is carved a tree whose roots curl into a ring - the sign of the Deep Root. Many have been chiselled over with the Dawn\'s sun. Some niches are empty.' },
        { t: 'msg', at: 'random', text: 'Words cut deep into a pillar: "WE WENT DOWN, SO THAT VAEL-HARROW MIGHT GROW. NOW THE SUN-PRIESTS WALK ON OUR ROOTS."' },
        { t: 'chest', at: 'deadend', count: 3, tier: 2 },
        { t: 'fight', at: 'deadend', groups: [['ghoul', 4], ['skeleton', 4]], text: 'The dead rise from their niches!' },
        { t: 'trap', at: 'corridor', count: 3, dmg: [3, 6], text: 'Blades scythe out from the walls!' },
        { t: 'spinner', at: 'corridor', count: 2 },
        { t: 'teleport', at: 'corridor', count: 1 },
        { t: 'fountain', at: 'room', kind: 'sp' },
        { t: 'zone', flag: MG.F_DARK, size: 10, count: 2 },
        { t: 'zone', flag: MG.F_ANTI, size: 5, count: 1 },
      ],
    },
    {
      id: 'crypt2', name: 'Crypt of the Old Kings - Royal Tombs', style: 'crypt', depth: 2, w: 18, h: 18, seed: 2402,
      rooms: 6, loops: 0.12, secret: 0.25, encounter: 0.055, groupsMax: 3,
      monsters: [['ghoul', 3], ['ghost', 3], ['wraith', 2], ['skeleton_lord', 2], ['gargoyle', 2], ['dark_elf', 2], ['mimic', 1], ['vampire', 1]],
      features: [
        { t: 'boss', at: 'bossroom', flag: 'morvane', groups: [['morvane', 1], ['skeleton_lord', 3], ['wraith', 1]], npc: 'morvane',
          text: 'A crowned corpse rises from a sarcophagus of black ice. Blue fire burns in his eye sockets. "My student bound me here... to guard... his SIGIL. Forgive me. I cannot stop."',
          after: 'The blue fire fades. "At last... thank you," whispers Morvane, and the old king crumbles to dust, leaving the Iron Sigil on the floor of the tomb.', items: ['ironsigil', 'holyavenger'], gold: 900 },
        { t: 'chest', at: 'deadend', count: 3, tier: 3 },
        { t: 'fight', at: 'deadend', groups: [['vampire', 1], ['ghoul', 4]], text: 'A pale woman in a crimson gown rises from a coffin, smiling with very long teeth.' },
        { t: 'fight', at: 'mid', groups: [['lich', 1], ['skeleton', 6]], text: 'A robed skeleton crackling with frost raises a hand. Skeletons climb from the walls.' },
        { t: 'msg', at: 'near', text: 'An inscription beneath a root-and-ring sigil: "MORVANE, LAST KING-PRIEST OF THE DEEP ROOT, WHO TAUGHT THE ART TO MALTHOR. MAY HIS STUDENT HONOR HIM." Fresh frost-runes of the Pale Hour have been scratched across it.' },
        { t: 'trap', at: 'corridor', count: 4, dmg: [4, 6], text: 'A burst of grave-frost erupts from the floor!' },
        { t: 'spinner', at: 'corridor', count: 3 },
        { t: 'teleport', at: 'corridor', count: 2 },
        { t: 'shrine', at: 'room', faith: 'root' },
        { t: 'zone', flag: MG.F_DARK, size: 12, count: 2 },
        { t: 'zone', flag: MG.F_ANTI, size: 6, count: 1 },
      ],
    },
    {
      id: 'keep1', name: 'The Iron Keep - Barracks', style: 'keep', depth: 3, w: 18, h: 18, seed: 3501,
      rooms: 7, loops: 0.14, secret: 0.2, encounter: 0.055, groupsMax: 3,
      up: { map: 'town', x: 16, y: 6, d: 3, text: 'You leave the Keep and step back into the frozen street.' },
      monsters: [['dark_knight', 4], ['ogre', 2], ['troll', 2], ['harpy', 1], ['ice_elemental', 1], ['basilisk', 1], ['wyvern', 1], ['dark_elf', 1]],
      features: [
        { t: 'stairs', dir: 'down', to: 'keep2', at: 'far', require: { flag: 'riddle_keep' }, locked: 'The stairs are barred by a portcullis of solid ice. A stone face somewhere in this keep must hold the answer.' },
        { t: 'riddle', at: 'mid', flag: 'riddle_keep', q: 'I am always coming, but I never arrive. What am I?', a: ['tomorrow', 'the future', 'future', 'tommorow'],
          right: '"Tomorrow," the mouth repeats sadly. "He wants no tomorrow. Go, then." Far away, ice cracks.' },
        { t: 'lyra', at: 'random', key: 'keep' },
        { t: 'msg', at: 'near', text: 'Cots stand in neat rows, blankets frozen stiff. The guardsmen of Velmoor slept here, once.' },
        { t: 'msg', at: 'random', text: 'The Keep\'s little chapel of the Dawn has been desecrated: its golden sun disc is cased in a block of ice, and a Pale Hour hourglass hangs in its place.' },
        { t: 'chest', at: 'deadend', count: 3, tier: 3 },
        { t: 'fight', at: 'deadend', groups: [['dark_knight', 4], ['ogre', 2]], text: 'Cursed guardsmen march out in step, their eyes glowing blue.' },
        { t: 'fight', at: 'deadend', groups: [['golem', 2]], text: 'Two iron golems grind to life beside an armory door.' },
        { t: 'trap', at: 'corridor', count: 4, dmg: [5, 6], text: 'Crossbow bolts fire from murder-holes!' },
        { t: 'spinner', at: 'corridor', count: 2 },
        { t: 'fountain', at: 'room', kind: 'heal' },
        { t: 'zone', flag: MG.F_DARK, size: 10, count: 2 },
        { t: 'zone', flag: MG.F_WATER, size: 6, count: 1 },
      ],
    },
    {
      id: 'keep2', name: 'The Iron Keep - Warden\'s Hall', style: 'keep', depth: 3, w: 18, h: 18, seed: 3602,
      rooms: 7, loops: 0.12, secret: 0.25, encounter: 0.06, groupsMax: 4,
      monsters: [['dark_knight', 3], ['troll', 3], ['golem', 2], ['ice_elemental', 2], ['basilisk', 2], ['wyvern', 2], ['siren', 2]],
      features: [
        { t: 'boss', at: 'bossroom', flag: 'kargath', groups: [['kargath', 1], ['dark_knight', 3], ['ice_elemental', 1]], npc: 'kargath',
          text: 'A giant in black, frost-rimed armor rises from the Warden\'s throne. His voice is a grinding of iron. "None... pass. The Archmage... commands." Behind the visor something weeps.',
          after: 'Kargath falls to one knee and lifts his visor. "Thank you. Tell Lyra... old Kargath is sorry." He presses the Moonstone Key into your hand, and the curse takes him to his rest.', items: ['moonkey', 'frostplate'], gold: 2000 },
        { t: 'chest', at: 'deadend', count: 3, tier: 4 },
        { t: 'fight', at: 'deadend', groups: [['siren', 3]], text: 'Women of living ice sing from a frozen pool. The melody pulls at your mind.' },
        { t: 'fight', at: 'mid', groups: [['wyvern', 2], ['troll', 2]], text: 'Ice trolls and their wyvern hounds feed in the old mess hall.' },
        { t: 'msg', at: 'random', text: 'Carved into a table with a knife: "Kargath carried Lyra on his shoulders at the spring festival. Now he guards her father\'s door."' },
        { t: 'trap', at: 'corridor', count: 4, dmg: [6, 6], text: 'A swinging blade drops from the ceiling!' },
        { t: 'spinner', at: 'corridor', count: 3 },
        { t: 'teleport', at: 'corridor', count: 2 },
        { t: 'shrine', at: 'room', faith: 'dawn' },
        { t: 'zone', flag: MG.F_DARK, size: 12, count: 2 },
        { t: 'zone', flag: MG.F_ANTI, size: 6, count: 1 },
      ],
    },
    {
      id: 'tower1', name: 'Malthor\'s Tower - Crystal Halls', style: 'tower', depth: 4, w: 14, h: 14, seed: 4701,
      rooms: 4, loops: 0.15, secret: 0.2, encounter: 0.06, groupsMax: 3,
      up: { map: 'town', x: 18, y: 1, d: 2, text: 'You step out of the tower into the snow.' },
      monsters: [['imp', 3], ['tower_mage', 3], ['siren', 2], ['crystal_golem', 1], ['ice_elemental', 2], ['frost_giant', 1]],
      features: [
        { t: 'stairs', dir: 'down', label: 'up', to: 'tower2', at: 'far', require: { flag: 'riddle_tower1' }, locked: 'A wall of blue ice seals the stairway upward. Somewhere a mouth of crystal waits for a name.' },
        { t: 'riddle', at: 'mid', flag: 'riddle_tower1', q: 'Speak the name of the one who sleeps in the crystal.', a: ['lyra'],
          right: 'The crystal mouth trembles. "Lyra," it whispers, like a father calling his child to supper. The ice on the stair melts.' },
        { t: 'lyra', at: 'near', key: 'tower', item: 'locket' },
        { t: 'chest', at: 'deadend', count: 2, tier: 4 },
        { t: 'fight', at: 'deadend', groups: [['frost_giant', 2]], text: 'Two frost giants stoop under the crystal ceiling, clubs of ice in hand.' },
        { t: 'trap', at: 'corridor', count: 3, dmg: [6, 8], text: 'Shards of crystal explode from the walls!' },
        { t: 'teleport', at: 'corridor', count: 2 },
        { t: 'spinner', at: 'corridor', count: 2 },
        { t: 'zone', flag: MG.F_ANTI, size: 6, count: 1 },
        { t: 'zone', flag: MG.F_DARK, size: 6, count: 1 },
      ],
    },
    {
      id: 'tower2', name: 'Malthor\'s Tower - Hall of Frozen Time', style: 'tower', depth: 4, w: 14, h: 14, seed: 4802,
      rooms: 4, loops: 0.15, secret: 0.25, encounter: 0.065, groupsMax: 3,
      monsters: [['imp', 2], ['tower_mage', 3], ['demon', 2], ['crystal_golem', 2], ['frost_giant', 2], ['siren', 1], ['dragon', 1]],
      features: [
        { t: 'stairs', dir: 'down', label: 'up', to: 'tower3', at: 'far', require: { flag: 'riddle_tower2' }, locked: 'The stair is frozen in mid-air: every step hangs still, as if time itself has stopped.' },
        { t: 'riddle', at: 'mid', flag: 'riddle_tower2', q: 'Your journey is almost over. Tell me, what did the father try to stop - the one thing no one can?', a: ['time', 'death', 'her death', 'time itself'],
          right: 'The mouth is silent for a long time. "Time," it says at last. "Yes. And it will not be stopped." The frozen steps begin to move.' },
        { t: 'chest', at: 'deadend', count: 3, tier: 5 },
        { t: 'fight', at: 'deadend', groups: [['dragon', 1]], text: 'A frost dragon uncoils from a mound of frozen gold!' },
        { t: 'fight', at: 'deadend', groups: [['demon', 2], ['tower_mage', 3]], text: 'Malthor\'s magi chant around a summoning circle. Something answers.' },
        { t: 'msg', at: 'random', text: 'Hundreds of clocks line the walls. Every one of them has stopped at the same minute.' },
        { t: 'msg', at: 'random', text: 'An altar of the Pale Hour, its hourglass empty. A note in Malthor\'s hand: "Sevrine says the Mother keeps what we love. Then why does Lyra never wake?"' },
        { t: 'trap', at: 'corridor', count: 4, dmg: [8, 8], text: 'Time lurches - you age a moment in an instant!' },
        { t: 'teleport', at: 'corridor', count: 3 },
        { t: 'spinner', at: 'corridor', count: 2 },
        { t: 'shrine', at: 'room', faith: 'pale' },
        { t: 'zone', flag: MG.F_ANTI, size: 6, count: 1 },
      ],
    },
    {
      id: 'tower3', name: 'Malthor\'s Tower - The Crystal Chamber', style: 'tower', depth: 5, w: 10, h: 10, seed: 4903,
      rooms: 2, loops: 0.15, secret: 0.1, encounter: 0.04, groupsMax: 3,
      monsters: [['crystal_golem', 2], ['tower_mage', 2], ['demon', 1], ['imp', 2]],
      features: [
        { t: 'boss', at: 'bossroom', flag: 'malthor', final: true, groups: [['malthor', 1], ['crystal_golem', 1], ['tower_mage', 2]], npc: 'malthor',
          text: 'At the top of the tower a girl sleeps inside a pillar of crystal, silver hair spread as if under water. Before her stands Malthor. "You have come to take her from me. Everyone has tried. Winter is a small price for one more moment with my daughter!"' },
        { t: 'msg', at: 'near', text: 'The air rings like a struck glass. Snowflakes hang motionless in the air around you.' },
        { t: 'shrine', at: 'random', faith: 'pale' },
      ],
    },
  ];


  // ---------------- Enterable houses (side quest: The Concord of Velmoor) ----------------
  // Legend letters: e exit, u/d stairs, n note, c chest, m riddle mouth, p portal, f fight, S secret door.
  BT.INTERIORS = [
    {
      id: 'q1', name: 'Orrin\'s House - Shop', rows: [
        '#######',
        '#e....#',
        '#.##..#',
        '#.#n..#',
        '#...#.#',
        '#.c.#u#',
        '#######'],
      ev: {
        e: { t: 'warp', label: 'out', to: 'town', x: 13, y: 8, d: 1, text: 'You step back out into the snow.' },
        u: { t: 'warp', label: 'up', to: 'q2', at: 'd' },
        n: { t: 'msg', text: 'Dozens of clocks cover the walls, every one stopped at the same minute. A sun disc of the Dawn hangs over the counter. On a slate: "CLOSED - Orrin has gone to the Dawn. Pray for him."' },
        c: { t: 'chest', tier: 1 },
      },
    },
    {
      id: 'q2', name: 'Orrin\'s House - Workshop', rows: [
        '#######',
        '#d...n#',
        '#.###.#',
        '#.#...#',
        '#...#.#',
        '#n..#u#',
        '#######'],
      ev: {
        d: { t: 'warp', label: 'down', to: 'q1', at: 'u' },
        u: { t: 'warp', label: 'up', to: 'q3', at: 'd' },
        n: { t: 'msg', text: 'Orrin\'s journal: "When the Dawn\'s crusade came to Vael-Harrow, my great-grandmother hid the Sun Shard so no zealot could use it to start another war. The way to it is above, behind the clock wall. Only one who knows what a clock is may pass."' },
      },
    },
    {
      id: 'q3', name: 'Orrin\'s House - Attic', rows: [
        '#######',
        '#d..#.#',
        '#...#m#',
        '#.n.S.#',
        '#...#p#',
        '#.f.###',
        '#######'],
      ev: {
        d: { t: 'warp', label: 'down', to: 'q2', at: 'u' },
        n: { t: 'msg', text: 'Under the slanted roof stands a wall made entirely of clock faces. One of them, near the floor, ticks - the only moving clock in the whole city. (Walls are not always what they seem.)' },
        f: { t: 'fight', groups: [['clockwork', 2]], text: 'Two brass clockwork sentinels whirr to life and march at you!' },
        m: { t: 'riddle', flag: 'riddle_clock', q: 'I have a face but no eyes, and hands that cannot hold. I tell you the one thing I cannot keep. What am I?', a: ['clock', 'a clock', 'clocks', 'the clock', 'watch'],
          right: '"A clock," the mouth agrees, and all the clock faces in the attic begin to tick at once. Behind you, a doorway of golden light opens.' },
        p: { t: 'warp', label: 'portal', to: 'sunvault', require: { flag: 'riddle_clock' }, locked: 'An empty brass frame shaped like a sun. It is cold and dark. Perhaps the speaking stone beside it holds the key.' },
      },
    },
    {
      id: 'y1', name: 'Ysolde\'s House - Parlour', rows: [
        '#######',
        '#e..#n#',
        '#.#...#',
        '#.#.#.#',
        '#...#.#',
        '#c#..u#',
        '#######'],
      ev: {
        e: { t: 'warp', label: 'out', to: 'town', x: 19, y: 6, d: 1, text: 'You step back out into the snow.' },
        u: { t: 'warp', label: 'up', to: 'y2', at: 'd' },
        n: { t: 'msg', text: 'A cold, tidy parlour. Nothing has been moved in a long, long time. A small altar of the Pale Hour holds a candle that has never been lit, and a portrait of a stern woman in silver: "Ysolde, Keeper of the Still Hourglass."' },
        c: { t: 'chest', tier: 2 },
      },
    },
    {
      id: 'y2', name: 'Ysolde\'s House - Upper Room', rows: [
        '#######',
        '#m.S..#',
        '#p##.##',
        '####..#',
        '#d....#',
        '#..n..#',
        '#######'],
      ev: {
        d: { t: 'warp', label: 'down', to: 'y1', at: 'u' },
        n: { t: 'msg', text: 'A letter, never sent: "Sevrine, you twist the Mother\'s word. Stillness is for grief to rest in - not a prison for the living. I have hidden the Hourglass where the dark keeps it. Look where the north wall looks back at you." - Ysolde' },
        m: { t: 'riddle', flag: 'riddle_dark', q: 'The more of me there is, the less you see. The Still Mother wraps the world in me each winter night. What am I?', a: ['darkness', 'dark', 'the dark', 'night', 'the night', 'blackness'],
          right: '"Darkness," the mouth breathes. The mirror beside it clouds with frost, then clears - and shows not your faces, but a pale hall beyond.' },
        p: { t: 'warp', label: 'portal', to: 'mirrorhall', require: { flag: 'riddle_dark' }, locked: 'A tall mirror rimed with frost. Your reflection does not move when you do. It waits for something.' },
      },
    },
    {
      id: 'u1', name: 'Bramwick\'s Mill - Grinding Floor', rows: [
        '#######',
        '#e....#',
        '#.###.#',
        '#.#c#.#',
        '#.#.#.#',
        '#n..u.#',
        '#######'],
      ev: {
        e: { t: 'warp', label: 'out', to: 'town', x: 7, y: 12, d: 3, text: 'You step back out into the snow.' },
        u: { t: 'warp', label: 'up', to: 'u2', at: 'd' },
        n: { t: 'msg', text: 'The great millstone is frozen to its bed. Roots have grown up through the floorboards and twined around the axle, carved here and there with the tree-and-ring of the Deep Root.' },
        c: { t: 'chest', tier: 1 },
      },
    },
    {
      id: 'u2', name: 'Bramwick\'s Mill - Sack Loft', rows: [
        '#######',
        '#d...n#',
        '#.#.#.#',
        '#.....#',
        '##.#.##',
        '#u..f.#',
        '#######'],
      ev: {
        d: { t: 'warp', label: 'down', to: 'u1', at: 'u' },
        u: { t: 'warp', label: 'up', to: 'u3', at: 'd' },
        n: { t: 'msg', text: 'Flour sacks, burst and frozen. Scratched into a beam: "The Seed sleeps down in the Hollow. Old Bramwick took the way up to go down. Funny, that."' },
        f: { t: 'fight', groups: [['giant_rat', 4], ['wererat', 1]], text: 'Rats boil out of the frozen grain sacks!' },
      },
    },
    {
      id: 'u3', name: 'Bramwick\'s Mill - Cap Room', rows: [
        '#######',
        '#d....#',
        '#.###S#',
        '#.#p.m#',
        '#.#####',
        '#n....#',
        '#######'],
      ev: {
        d: { t: 'warp', label: 'down', to: 'u2', at: 'u' },
        n: { t: 'msg', text: 'Wind moans through the mill\'s cap. The great sails outside are locked with ice. In the north-east corner, a root has pushed straight through the wall - and the wall around it sounds hollow.' },
        m: { t: 'riddle', flag: 'riddle_root', q: 'I lie beneath every tree. I drink, but I am never thirsty. I hold up the tallest oak, yet no one ever sees me. What am I?', a: ['root', 'roots', 'a root', 'the root', 'the roots'],
          right: '"Root," sighs the mouth, and the floor beside you cracks open. Warm air and the smell of deep earth rise from a hollow lined with glowing roots.' },
        p: { t: 'warp', label: 'portal', to: 'roothollow', require: { flag: 'riddle_root' }, locked: 'A knot of roots covers the floor here, tight as a fist. Something lies beneath.' },
      },
    },
  ];

  // Hidden realms behind the portals.
  BT.POCKET_SPECS = [
    {
      id: 'sunvault', name: 'The Sun Vault', style: 'vault', depth: 2, w: 10, h: 10, seed: 6101,
      rooms: 2, loops: 0.15, secret: 0.1, encounter: 0.05, groupsMax: 2, upFrom: { map: 'q3', at: 'p' },
      monsters: [['clockwork', 3], ['skeleton_lord', 2], ['ghost', 1]],
      features: [
        { t: 'fight', at: 'far', groups: [['sunwarden', 1], ['clockwork', 2]], items: ['sunshard'], gold: 600,
          text: 'In a chamber of gold, a knight made of sunlight rises from a throne. "The Shard stays hidden until the faiths are one again. Prove you seek peace - by besting me!"' },
        { t: 'msg', at: 'near', text: 'Golden walls glow with a light that has no source. Carved everywhere: "ALL THAT SETS WILL RISE." Beneath it, in older letters: "...AND ALL THAT RISES MUST ONE DAY SET."' },
        { t: 'chest', at: 'deadend', count: 2, tier: 3 },
        { t: 'shrine', at: 'room', faith: 'dawn' },
      ],
    },
    {
      id: 'mirrorhall', name: 'The Hall of Still Mirrors', style: 'mirror', depth: 2, w: 10, h: 10, seed: 6202,
      rooms: 2, loops: 0.15, secret: 0.1, encounter: 0.05, groupsMax: 2, upFrom: { map: 'y2', at: 'p' },
      monsters: [['siren', 2], ['ice_elemental', 1], ['ghost', 2]],
      features: [
        { t: 'fight', at: 'far', groups: [['mirror_maiden', 1], ['siren', 2]], items: ['stillglass'], gold: 600,
          text: 'Every mirror shows the same pale woman, and then she steps out of all of them at once. "Ysolde set me to keep the Hourglass still. Nothing leaves this hall. Nothing ever changes."' },
        { t: 'msg', at: 'near', text: 'Mirrors of ice line the halls. In them you see yourselves as you were a year ago - before the winter. Your reflections smile, frozen.' },
        { t: 'chest', at: 'deadend', count: 2, tier: 3 },
        { t: 'teleport', at: 'corridor', count: 1 },
      ],
    },
    {
      id: 'roothollow', name: 'The Root-Hollow', style: 'hollow', depth: 2, w: 10, h: 10, seed: 6303,
      rooms: 2, loops: 0.15, secret: 0.1, encounter: 0.05, groupsMax: 2, upFrom: { map: 'u3', at: 'p' },
      monsters: [['spider', 3], ['wolf', 2], ['zombie', 1]],
      features: [
        { t: 'fight', at: 'far', groups: [['root_horror', 1], ['spider', 3]], items: ['heartseed'], gold: 600,
          text: 'At the heart of the hollow, roots knot around a single glowing seed. They tear free of the earth and rise into a shape of bark and claws. The Hollow will not give up its Seed without a fight.' },
        { t: 'msg', at: 'near', text: 'Roots glow faintly amber in the dark. Bones are tangled among them, very old and very peaceful. Someone has carved: "WE WENT DOWN, SO THAT OTHERS MIGHT GROW."' },
        { t: 'chest', at: 'deadend', count: 2, tier: 3 },
        { t: 'zone', flag: MG.F_DARK, size: 6, count: 1 },
      ],
    },
  ];

  BT.MAPS = {};
  BT.buildMaps = function () {
    BT.MAPS.town = buildTown();
    for (const spec of BT.LEVEL_SPECS) {
      const m = MG.generate(spec);
      Object.assign(m, spec, { features: undefined });
      BT.MAPS[spec.id] = m;
    }
    // Houses
    for (const spec of BT.INTERIORS) {
      const m = MG.fromInterior(spec.rows);
      m.id = spec.id; m.name = spec.name; m.style = 'interior'; m.depth = 1; m.encounter = 0;
      m.rows = spec.rows;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const e = spec.ev[spec.rows[y][x]];
        if (e) m.ev[y][x] = Object.assign({}, e);
      }
      m.start = Object.assign({ d: 0 }, MG.findChar(spec.rows, 'e') || MG.findChar(spec.rows, 'd'));
      BT.MAPS[spec.id] = m;
    }
    // Pocket realms: up-stairs lead back to the portal they were reached from
    for (const spec of BT.POCKET_SPECS) {
      const m = MG.generate(spec);
      Object.assign(m, spec, { features: undefined });
      const src = BT.INTERIORS.find((i) => i.id === spec.upFrom.map);
      const p = MG.findChar(src.rows, spec.upFrom.at);
      m.up = { map: spec.upFrom.map, x: p.x, y: p.y, d: 0, text: 'You step back through the portal.' };
      BT.MAPS[spec.id] = m;
    }
    // Resolve warp targets that reference a letter on another floor
    for (const id in BT.MAPS) {
      const m = BT.MAPS[id];
      if (!m.ev) continue;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const e = m.ev[y][x];
        if (!e || e.t !== 'warp') continue;
        if (e.at) { const t = BT.INTERIORS.find((i) => i.id === e.to); Object.assign(e, MG.findChar(t.rows, e.at)); }
        else if (e.x == null) { const t = BT.MAPS[e.to]; e.x = t.start.x; e.y = t.start.y; e.d = t.start.d; }
      }
    }
    // Link "up" stairs of deeper levels to the previous level's down stairs.
    for (let i = 0; i < BT.LEVEL_SPECS.length; i++) {
      const spec = BT.LEVEL_SPECS[i];
      if (spec.up) continue;
      const prev = BT.MAPS[BT.LEVEL_SPECS[i - 1].id];
      const m = BT.MAPS[spec.id];
      m.up = { map: prev.id, x: prev.downPos.x, y: prev.downPos.y, d: 0 };
    }
  };
})();
