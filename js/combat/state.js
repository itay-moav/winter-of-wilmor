// The battle state and its units: board setup, who stands where, reinforcements, shared helpers.
// Creates BT.CB; the other combat files add to it and share helpers through BT.CB.K.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, HX = BT.HX;
  const CB = BT.CB = { K: {} }, K = CB.K;

  CB.delay = 420;
  CB.auto = false;      // the AI plays every hero (headless tests)
  CB.aiHeals = true;    // the party AI may heal (the balance sim turns this off)
  CB.MELEE_CAP = 2;     // at most this many monster melee attacks on one hero per round
  CB.ON_BOARD = 4;      // only the front of a monster group fits on the board at once
  CB.SPELL_SLOTS = 3;   // monster spells or breaths per round (bosses are exempt)
  const nm = (ch) => '<b>' + U.esc(ch.name) + '</b>';
  const gname = (g, n) => U.esc(n > 1 ? g.def.pl : g.def.name);
  const liveMembers = (g) => g.members.filter((m) => m.hp > 0);
  const theName = (def) => (def.boss ? U.esc(def.name.split(',')[0]) : 'the ' + U.esc(def.name));
  const groupAlive = (g) => g.members.some((m) => m.hp > 0);

  // battle view calls are optional
  const V = function (fn) {
    const bv = BT.BV;
    if (!bv || !bv[fn] || !CB.S) return undefined;
    return bv[fn].apply(bv, [CB.S].concat([].slice.call(arguments, 1)));
  };

  const wait = (ms) => (CB.delay ? U.sleep(ms) : Promise.resolve());
  CB.S = null; // the battle in progress, or null
  CB.active = () => !!CB.S;
  CB.state = () => CB.S;
  CB.songId = () => (CB.S && CB.S.song ? CB.S.song.id : null);

  // ---------- groups and units ----------
  function makeGroups(spec) {
    return spec.map(([id, n]) => {
      const def = BT.MONSTERS[id];
      const members = [];
      for (let i = 0; i < n; i++) {
        const hp = Math.max(1, U.rollD(def.hp));
        members.push({ hp, maxhp: hp });
      }
      return { def, members, dist: def.boss ? 10 : 10 * (1 + U.rand(3)), sleep: 0, held: 0 };
    });
  }

  let nextUid = 1;
  const isMon = (u) => u.kind === 'mon';

  function alive(u) {
    if (u.kind === 'mon') return u.m.hp > 0;
    if (u.kind === 'summon') return BT.G.summon === u.ch && u.ch.hp > 0;
    return ST.alive(u.ch);
  }

  // occupies its hex (the dead lie down and can be stepped over; statues and the paralysed block)
  function blocks(u) {
    if (u.kind === 'pc') return u.ch.status !== 'dead';
    return alive(u);
  }

  const unitAt = (c, r) => CB.S.units.find((u) => u.c === c && u.r === r && blocks(u));
  const free = (c, r) => HX.inside(c, r) && !CB.S.obstacles.has(HX.key(c, r)) && !unitAt(c, r);
  const heroes = () => CB.S.units.filter((u) => !isMon(u) && alive(u));
  const foes = () => CB.S.units.filter((u) => isMon(u) && alive(u));
  const onBoard = (g) => CB.S.units.filter((u) => isMon(u) && u.g === g && u.m.hp > 0);
  const reserves = (g) => g.members.filter((m) => m.hp > 0 && !m.unit);
  const adjFoes = (u) => foes().filter((f) => HX.adjacent(u, f));
  const adjHeroes = (u) => heroes().filter((h) => HX.adjacent(u, h));
  CB.unitFor = (ch) => CB.S && CB.S.units.find((u) => u.ch === ch);

  // nearest free hex to (c, r), optionally within a column range
  function freeNear(c, r, minC, maxC) {
    let best = null, bd = 1e9;
    for (let y = 0; y < HX.ROWS; y++) for (let x = minC || 0; x <= (maxC == null ? HX.COLS - 1 : maxC); x++) {
      if (!free(x, y)) continue;
      const d = HX.dist({ c, r }, { c: x, r: y }) * 10 + Math.abs(x - c);
      if (d < bd) { bd = d; best = { c: x, r: y }; }
    }
    return best;
  }

  function addHero(ch, c, r) {
    const p = free(c, r) ? { c, r } : freeNear(c, r, 0, 4);
    if (!p) return null;
    const u = { id: nextUid++, kind: ch.summon ? 'summon' : 'pc', ch, c: p.c, r: p.r };
    CB.S.units.push(u);
    return u;
  }

  const ANCHOR_ROWS = [4, 2, 6, 3, 5, 1, 0];

  function anchorOf(g) {
    const gi = CB.S.groups.indexOf(g);
    return { c: g.def.boss ? 6 : g.dist <= 10 ? 5 : g.dist <= 20 ? 7 : 9, r: ANCHOR_ROWS[gi % ANCHOR_ROWS.length] };
  }

  function addMonster(g, m) {
    const a = anchorOf(g);
    const p = freeNear(a.c, a.r, 4, HX.COLS - 1) || freeNear(a.c, a.r, 2, HX.COLS - 1);
    if (!p) return null;
    const u = { id: nextUid++, kind: 'mon', g, m, c: p.c, r: p.r };
    m.unit = u;
    CB.S.units.push(u);
    return u;
  }

  // fill each group's places on the board from its reserves
  function reinforce() {
    let n = 0;
    for (const g of CB.S.groups) {
      let room = CB.ON_BOARD - onBoard(g).length;
      for (const m of reserves(g)) {
        if (room-- <= 0) break;
        if (addMonster(g, m)) n++;
      }
    }
    return n;
  }

  function removeDead() {
    for (const u of CB.S.units) if (isMon(u) && u.m.hp <= 0 && !u.gone) { u.gone = true; V('kill', u); }
    CB.S.units = CB.S.units.filter((u) => !(isMon(u) && u.gone));
  }

  function setup(spec, opts) {
    const G = BT.G;
    CB.S.units = [];
    CB.S.obstacles = new Set();
    const rows = [4, 3, 5]; // the nearer, larger rows of the board
    G.party.forEach((ch, i) => addHero(ch, i < 3 ? 1 : 0, rows[i % 3]));
    if (G.summon) addHero(G.summon, 2, 4);
    // a few obstacles in no-man's-land
    const nObs = opts.boss ? 1 : 2 + U.rand(3);
    for (let i = 0, tries = 0; i < nObs && tries < 30; tries++) {
      const c = 3 + U.rand(4), r = U.rand(HX.ROWS);
      if (!free(c, r) || (r === 4 && c === 3)) continue;
      CB.S.obstacles.add(HX.key(c, r));
      i++;
    }
    for (const g of CB.S.groups) for (const m of liveMembers(g).slice(0, CB.ON_BOARD)) addMonster(g, m);
  }

  function songPower(ch) {
    const inst = ST.equipped(ch, 'instrument');
    const p = inst ? BT.ITEMS[inst.id].songPower || 1 : 1;
    return p * (1 + ch.level / 12);
  }

  function speed(u) {
    let s = 3;
    if (u.kind === 'pc' && (u.ch.cls === 'monk' || u.ch.cls === 'rogue')) s = 4;
    if (u.kind === 'summon') s = 4;
    if (CB.S.buff.haste) s++;
    if (CB.S.song && CB.S.song.swift) s++;
    return s;
  }

  function monSpeed(def) { return def.spd || (def.fly ? 4 : 3); }

  function partyAC(ch) {
    let ac = ST.ac(ch, CB.S ? CB.S.buff : null);
    if (CB.S && CB.S.song && CB.S.song.ac) ac += Math.round(CB.S.song.ac * CB.S.song.power);
    if (ch._parry) ac -= 4;
    return ac;
  }

  function summary() {
    return CB.S.groups.filter(groupAlive).map((g) => {
      const n = liveMembers(g).length;
      return (g.def.boss ? '' : n + ' ') + gname(g, n);
    }).join(', ');
  }

  function partyList() {
    const P = BT.G.party.slice();
    if (BT.G.summon) P.push(BT.G.summon);
    return P;
  }

  function partyDefeated() { return !BT.G.party.some(ST.canAct); }
  function monstersDefeated() { return !CB.S.groups.some(groupAlive); }

  Object.assign(K, { nm, gname, liveMembers, theName, groupAlive, V, wait, makeGroups, isMon, alive, blocks, unitAt, free, heroes, foes, onBoard, reserves, adjFoes, adjHeroes, freeNear, addHero, ANCHOR_ROWS, anchorOf, addMonster, reinforce, removeDead, setup, songPower, speed, monSpeed, partyAC, summary, partyList, partyDefeated, monstersDefeated });
})();
