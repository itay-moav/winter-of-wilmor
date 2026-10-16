// The city of Velmoor: its block plan, named buildings, building heights and street events.
(function () {
  const MG = BT.MG;

  // ---------------- Town ----------------
  const TOWN_ROWS = [
    '#####################',
    '#...................#',
    '#.A#.T#.S#.I#.R#.LW.#',
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
    L: { id: 'house', name: 'House of Malthor the Archmage', map: 'l1', faith: 'pale' },
  };

  BT.buildTown = function () {
    const m = MG.fromBlocks(TOWN_ROWS, BT.BUILDINGS);
    m.id = 'town';
    m.name = 'Velmoor';
    m.style = 'town';
    m.depth = 0;
    m.start = { x: 2, y: 1, d: 1 };
    // building heights (in wall units): houses vary, temples and towers loom
    const SPECIAL_H = { A: 1.7, T: 1.35, S: 1.35, I: 1.7, R: 2.05, M: 1.35, P: 2.0, H: 2.4, O: 1.25, C: 1.4, K: 2.6, W: 3.6, G: 1.6, Q: 2.4, Y: 2.05, U: 2.4, L: 2.4 };
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
  };
})();
