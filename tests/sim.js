// Headless combat balance simulator. node tests/sim.js
const fs = require('fs'), vm = require('vm'), path = require('path');
function boot() {
  const ctx = { console, Math, JSON, setTimeout, clearTimeout, Promise, Date };
  ctx.window = ctx;
  ctx.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
  vm.createContext(ctx);
  const run = (f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
  ['js/util.js', 'js/data.js', 'js/items.js', 'js/spells.js', 'js/monsters.js', 'js/mapgen.js', 'js/maps.js', 'js/state.js'].forEach(run);
  const BT = ctx.BT;
  BT.R = { shake() {}, flash() {}, invalidate() {}, snap() {} };
  BT.MAPS = { sim: { id: 'sim', name: 'sim', style: 'crypt', depth: 2, fl: [[0]], w: 1, h: 1 } };
  const pickAI = (o) => {
    const opts = (o.options || []).filter(Boolean).filter((x) => !x.disabled);
    const vals = opts.map((x) => (x.value !== undefined ? x.value : x));
    if (vals.includes('fight')) { ctx.__rounds = (ctx.__rounds||0)+1; return 'fight'; }
    if (vals.includes('open')) return 'open';
    if (vals.includes('attack') || vals.includes('cast') || vals.includes('sing')) {
      if (vals.includes('sing') && !ctx.__sang) { ctx.__sang = 1; return 'sing'; }
      if (vals.includes('cast')) return 'cast';
      if (vals.includes('attack')) return 'attack';
      return 'parry';
    }
    if (vals.length && vals[0] && vals[0].code) { // spell list: best damage spell
      const dmg = vals.filter((s) => s.dmg).sort((a, b) => b.lvl - a.lvl);
      return dmg[0] || vals[0];
    }
    if (vals.length && vals[0] && vals[0].id && BT.BT_SONGS) return vals[0];
    if (vals.length && vals[0] && vals[0].regen !== undefined) return vals[0];
    if (vals.length && vals[0] && vals[0].desc && vals[0].id) return vals.find((s) => s.id === 'march') || vals[0];
    return vals[0];
  };
  BT.UI = {
    log() {}, sfx() {}, spellFx() {}, renderParty() {}, showMonsters() {}, hideOverlay() {}, floatText() {}, hitMonster() {}, updateHud() {}, showNpc() {},
    menu: async (o) => pickAI(o),
    pickMember: async (t, f) => ctx.BT.G.party.find((c) => !f || f(c)) || null,
    confirm: async () => true, pause: async () => true,
  };
  ['js/magic.js', 'js/combat.js'].forEach(run);
  BT.CB.delay = 0;
  BT.U.sleep = () => Promise.resolve();
  return { BT, ctx };
}

const GEAR = {
  1: { warrior: ['shortsword', 'leather', 'buckler'], paladin: ['mace', 'leather', 'buckler'], monk: ['robes'], bard: ['club', 'leather', 'lute'], conjurer: ['staff', 'robes'], magician: ['staff', 'robes'] },
  4: { warrior: ['longsword', 'chain', 'shield', 'helm'], paladin: ['longsword', 'chain', 'shield', 'helm'], monk: ['robes', 'cap'], bard: ['longsword', 'chain', 'lute', 'cap'], conjurer: ['staff', 'robes', 'cap'], magician: ['staff', 'robes', 'cap'] },
  8: { warrior: ['battleaxe', 'scale', 'shield', 'helm', 'gauntlets', 'ringprot'], paladin: ['silverdagger', 'scale', 'shield', 'helm', 'gauntlets'], monk: ['robes', 'cap', 'ringprot'], bard: ['frostbrand', 'elvenchain', 'silverflute', 'helm'], conjurer: ['emberstaff', 'robes', 'cap', 'ringwarm'], magician: ['staff', 'robes', 'cap'] },
  11: { warrior: ['flamberge', 'plate', 'helm', 'gauntlets', 'ringprot'], paladin: ['holyavenger', 'plate', 'towershield', 'greathelm', 'gauntlets'], monk: ['shadowleather', 'cap', 'ringprot', 'swiftgloves'], bard: ['frostbrand', 'elvenchain', 'silverflute', 'helm', 'buckler'], conjurer: ['emberstaff', 'silkrobes', 'circlet', 'ringwarm'], magician: ['staff', 'silkrobes', 'cap', 'ringmana'] },
  13: { warrior: ['flamberge', 'frostplate', 'greathelm', 'mightgloves', 'ringprot'], paladin: ['holyavenger', 'plate', 'mirrorshield', 'greathelm', 'gauntlets', 'ringwarm'], monk: ['monkwraps', 'shadowleather', 'cap', 'ringprot', 'swiftgloves'], bard: ['vampblade', 'elvenchain', 'frosthorn', 'helm', 'buckler', 'ringwarm'], conjurer: ['archstaff', 'silkrobes', 'circlet', 'ringwarm'], magician: ['staff', 'silkrobes', 'cap', 'ringmana'] },
};

async function trial(level, spec, opts, n) {
  let wins = 0, hpLeft = 0, rounds = 0, deaths = 0;
  for (let i = 0; i < n; i++) {
    const { BT, ctx } = boot();
    const G = BT.ST.newGame();
    G.map = 'sim'; G.x = 0; G.y = 0;
    G.party = BT.ST.defaultParty();
    const tier = [13, 11, 8, 4, 1].find((t) => level >= t);
    for (const c of G.party) {
      while (c.level < level) { c.xp = BT.D.xpFor(c.level + 1); BT.ST.levelUp(c); }
      const sch = BT.D.CLASSES[c.cls].school;
      if (sch) c.spells[sch] = BT.D.maxSpellLevel(c.level);
      c.inv = [];
      for (const it of GEAR[tier][c.cls]) BT.ST.give(c, it, true);
      BT.ST.give(c, 'potion');
      c.hp = c.maxhp; c.sp = BT.ST.maxSp(c);
    }
    const r = await BT.CB.fight(spec, Object.assign({ noChest: true }, opts));
    rounds += ctx.__rounds;
    if (r === 'win') { wins++; hpLeft += G.party.reduce((a, c) => a + c.hp, 0) / G.party.reduce((a, c) => a + c.maxhp, 0); }
    deaths += G.party.filter((c) => c.status === 'dead').length;
  }
  return { winRate: (wins / n * 100).toFixed(0) + '%', hpLeft: wins ? (hpLeft / wins * 100).toFixed(0) + '%' : '-', avgDeaths: (deaths / n).toFixed(1), rounds: (rounds / n).toFixed(1) };
}

(async () => {
  const N = +process.argv[2] || 40;
  const { BT } = boot();
  BT.buildMaps();
  const tests = [
    ['L1 sewer rats', 1, [['rat', 6]]],
    ['L1 footpads x4', 1, [['thief', 4]]],
    ['L1 mixed sewer', 1, [['giant_rat', 4], ['kobold', 4]]],
    ['L3 wererats x3', 3, [['wererat', 3]]],
    ['L3 sewer2 mix', 3, [['wererat', 2], ['spider', 3], ['cutthroat', 2]]],
    ['L3 Rat King', 3, [['ratking', 1], ['wererat', 3], ['giant_rat', 4]], { boss: true, noRun: true }],
    ['L4 Rat King', 4, [['ratking', 1], ['wererat', 3], ['giant_rat', 4]], { boss: true, noRun: true }],
    ['L5 crypt mix', 5, [['ghoul', 4], ['skeleton', 6]]],
    ['L7 vampire', 7, [['vampire', 1], ['ghoul', 4]]],
    ['L8 Morvane', 8, [['morvane', 1], ['skeleton_lord', 3], ['wraith', 1]], { boss: true, noRun: true }],
    ['L9 keep mix', 9, [['dark_knight', 4], ['ogre', 2]]],
    ['L9 golems', 9, [['golem', 2]]],
    ['L11 Kargath', 11, [['kargath', 1], ['dark_knight', 3], ['ice_elemental', 1]], { boss: true, noRun: true }],
    ['L12 dragon', 12, [['dragon', 1]]],
    ['L12 tower mix', 12, [['demon', 2], ['tower_mage', 3]]],
    ['L13 Malthor', 13, [['malthor', 1], ['crystal_golem', 1], ['tower_mage', 2]], { boss: true, noRun: true }],
  ];
  for (const [name, lvl, spec, opts] of tests) {
    const r = await trial(lvl, spec, opts || {}, N);
    console.log(name.padEnd(18), JSON.stringify(r));
  }
})();
