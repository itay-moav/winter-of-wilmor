// End-to-end bot: walks every dungeon, fights, solves riddles, kills all bosses, clears the Folded House side quest
// and reaches the ending.
// node tests/playthrough.js [seed-runs]
const fs = require('fs'), vm = require('vm'), path = require('path');
const quiet = !process.argv.includes('-v');
function boot() {
  const dummy = () => ({ innerHTML: '', className: '', style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {}, children: [], querySelectorAll: () => [] });
  const ctx = { console, Math, JSON, setTimeout, clearTimeout, Promise, Date };
  ctx.window = ctx;
  ctx.document = { getElementById: dummy, querySelectorAll: () => [], querySelector: () => null, createElement: dummy, addEventListener() {}, body: dummy() };
  ctx.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
  vm.createContext(ctx);
  const run = (f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
  const load = require('./load');
  load.select(load.WORLD).forEach(run);
  const BT = ctx.BT;
  BT.R = { shake() {}, flash() {}, invalidate() {}, snap() {}, animate: async () => {}, bump: async () => {}, drawMap() {} };
  const logs = [];
  const answerFor = { 'The more of me you take': 'footsteps', 'always coming': 'tomorrow', 'Speak the name': 'Lyra', 'what did the father': 'time' };
  BT.UI = {
    log: (h) => { logs.push(h.replace(/<[^>]+>/g, '')); if (!quiet) console.log('   ', h.replace(/<[^>]+>/g, '')); },
    sfx() {}, syncSong() {}, cancelMenu() {}, spellFx() {}, renderParty() {}, showMonsters() {}, hideOverlay() {}, floatText() {}, hitMonster() {}, updateHud() {}, showNpc() {}, art: () => '', toast() {},
    pause: async (t) => { logs.push('[pause] ' + t.replace(/<[^>]+>/g, '')); ctx.__lastPause = t; return true; },
    confirm: async () => true,
    input: async () => { const q = ctx.__lastPause || ''; for (const k in answerFor) if (q.includes(k)) return answerFor[k]; return 'x'; },
    pickMember: async (t, f) => (ctx.__heal && (!f || f(ctx.__heal)) ? ctx.__heal : null) || ctx.BT.G.party.find((c) => !f || f(c)) || null,
    menu: async (o) => {
      const opts = (o.options || []).filter(Boolean).filter((x) => !x.disabled);
      const vals = opts.map((x) => (x.value !== undefined ? x.value : x));
      if (vals.includes('fight')) {
        const P = ctx.BT.G.party, hp = P.reduce((a, c) => a + c.hp, 0) / P.reduce((a, c) => a + c.maxhp, 0);
        if (vals.includes('run') && hp < 0.4) return 'run';
        return 'fight';
      }
      if (vals.includes('open')) return 'open';
      if (vals.includes('attack') || vals.includes('cast') || vals.includes('sing')) {
        if (vals.includes('sing') && !ctx.__sang) { ctx.__sang = 1; return 'sing'; }
        if (vals.includes('cast')) { ctx.__heal = ctx.BT.G.party.find((c) => c.status !== 'dead' && c.hp < c.maxhp * 0.4); return 'cast'; }
        if (vals.includes('attack')) return 'attack';
        return 'parry';
      }
      if (vals.length && vals[0] && vals[0].code) {
        const heal = vals.filter((s) => s.heal && s.target !== 'party').sort((a, b) => b.lvl - a.lvl);
        if (ctx.__heal && heal.length) return heal[0];
        const dmg = vals.filter((s) => s.dmg).sort((a, b) => b.lvl - a.lvl); return dmg[0] || vals[0];
      }
      if (vals.length && vals[0] && vals[0].desc && vals[0].id) return vals.find((s) => s.id === 'march') || vals[0];
      return vals[0];
    },
  };
  load.select(load.COMBAT, load.NO_VIEW).forEach(run);
  load.select(['js/world/services.js', 'js/world/explore.js', 'js/world/events.js', 'js/world/quests.js', 'js/world/endings.js']).forEach(run);
  BT.EX.transition = async () => {};
  BT.CB.delay = 0;
  BT.CB.auto = true;
  BT.U.sleep = () => Promise.resolve();
  BT.main = { titleMenu: async () => { throw new Error('GAME OVER in ' + BT.G.map + ' levels ' + BT.G.party.map((c) => c.level).join('/') + ' last: ' + logs.slice(-12).join(' / ')); }, playing: true };
  return { BT, ctx, logs };
}

const GEAR = {
  1: { warrior: ['shortsword', 'leather', 'buckler'], paladin: ['mace', 'leather', 'buckler'], monk: ['robes'], bard: ['club', 'leather', 'lute'], conjurer: ['staff', 'robes'], magician: ['staff', 'robes'] },
  4: { warrior: ['longsword', 'chain', 'shield', 'helm'], paladin: ['longsword', 'chain', 'shield', 'helm'], monk: ['robes', 'cap'], bard: ['longsword', 'chain', 'lute', 'cap'], conjurer: ['staff', 'robes', 'cap'], magician: ['staff', 'robes', 'cap'] },
  8: { warrior: ['battleaxe', 'scale', 'shield', 'helm', 'gauntlets'], paladin: ['silverdagger', 'scale', 'shield', 'helm', 'gauntlets'], monk: ['robes', 'cap', 'ringprot'], bard: ['frostbrand', 'chain', 'silverflute', 'helm'], conjurer: ['emberstaff', 'robes', 'cap'], magician: ['staff', 'robes', 'cap'] },
  11: { warrior: ['flamberge', 'plate', 'helm', 'gauntlets', 'ringprot'], paladin: ['holyavenger', 'plate', 'towershield', 'helm', 'gauntlets'], monk: ['shadowleather', 'cap', 'ringprot'], bard: ['frostbrand', 'elvenchain', 'silverflute', 'helm', 'buckler'], conjurer: ['emberstaff', 'silkrobes', 'cap'], magician: ['staff', 'silkrobes', 'cap'] },
};

async function play() {
  const { BT, ctx, logs } = boot();
  BT.buildMaps();
  const G = BT.ST.newGame();
  G.party = BT.ST.defaultParty();
  const ST = BT.ST, MG = BT.MG, U = BT.U;
  const report = [];
  let restsUsed = 0;

  function town() {
    if (process.env.DBG) console.log('town', G.map, G.party.map((c) => c.level + ':' + c.xp).join(' '));
    // simulate a visit to the Review Board, shop, temple and inn
    for (const c of G.party) {
      if (c.status !== 'ok') c.status = 'ok';
      while (ST.canLevel(c)) ST.levelUp(c);
      const sch = BT.D.CLASSES[c.cls].school;
      if (sch) c.spells[sch] = BT.D.maxSpellLevel(c.level);
      const tier = [11, 8, 4, 1].find((t) => c.level >= t);
      const quest = c.inv.filter((it) => BT.ITEMS[it.id].quest);
      c.inv = quest;
      for (const it of GEAR[tier][c.cls]) ST.give(c, it, true);
      ST.give(c, 'potion');
      c.hp = c.maxhp; c.sp = ST.maxSp(c); if (c.cls === 'bard') c.voice = ST.maxVoice(c);
    }
    ctx.__sang = 0;
  }
  function needRest() {
    const P = G.party;
    const hp = P.reduce((a, c) => a + c.hp, 0) / P.reduce((a, c) => a + c.maxhp, 0);
    return hp < 0.6 || P.some((c) => c.status !== 'ok') || P.slice(0, 3).some((c) => c.hp < c.maxhp * 0.4);
  }
  function bfsPath(m, sx, sy, tx, ty) {
    const prev = {}, q = [[sx, sy]], seen = { [sx + ',' + sy]: 1 };
    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) break;
      for (let d = 0; d < 4; d++) {
        if (!MG.passable(MG.edge(m, x, y, d))) continue;
        const nx = x + U.DX[d], ny = y + U.DY[d];
        if (!MG.inside(m, nx, ny) || seen[nx + ',' + ny]) continue;
        // avoid boss rooms unless it is the target
        const ev = m.ev[ny][nx];
        if (ev && ev.t === 'boss' && !G.flags[ev.flag] && m.ev[ty][tx] !== ev) continue;
        if (ev && ev.t === 'stairs' && !(nx === tx && ny === ty)) continue;
        if (ev && ev.t === 'teleport' && !G.flags[G.map + ':' + nx + ':' + ny] && !(nx === tx && ny === ty) && !ctx.__allowTele) continue;
        seen[nx + ',' + ny] = 1; prev[nx + ',' + ny] = [x, y, d]; q.push([nx, ny]);
      }
    }
    if (!prev[tx + ',' + ty] && !(sx === tx && sy === ty) && !ctx.__allowTele) { ctx.__allowTele = 1; const r = bfsPath(m, sx, sy, tx, ty); ctx.__allowTele = 0; return r; }
    const dirs = [];
    let k = tx + ',' + ty;
    while (prev[k]) { const [x, y, d] = prev[k]; dirs.unshift(d); k = x + ',' + y; }
    return dirs;
  }
  async function walkTo(tx, ty) {
    const m = BT.MAPS[G.map];
    const dirs = bfsPath(m, G.x, G.y, tx, ty);
    for (const d of dirs) {
      const startMap = G.map;
      if (G.map !== m.id) return;
      while (G.d !== d) await BT.EX.turn(1);
      const bx = G.x, by = G.y;
      await BT.EX.forward();
      if (G.map !== startMap) return;
      if (G.x === bx && G.y === by) { /* blocked */ }
      if (needRest()) {
        // potion / town trip simulated as a rest
        restsUsed++;
        town();
      }
      // spinners/teleports: re-path
      if (G.x !== bx + U.DX[d] || G.y !== by + U.DY[d]) return walkTo(tx, ty);
    }
  }
  function find(m, pred) {
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.ev[y][x] && pred(m.ev[y][x])) return [x, y];
    return null;
  }
  async function exploreSome(m, frac) {
    // visit a fraction of cells to gain XP the way a player would
    // greedy nearest-unexplored walk, like a player mapping the level
    const total = m.w * m.h;
    let guard = 0;
    while (guard++ < 400) {
      if (G.map !== m.id) await BT.EX.changeMap(m.id);
      let seen = 0;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (ST.isExplored(m.id, x, y)) seen++;
      if (seen >= total * frac) break;
      const d = MG.bfs(m, G.x, G.y);
      let best = null, bd = 1e9;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const e = m.ev[y][x];
        if (ST.isExplored(m.id, x, y) || d[y][x] < 0 || (e && (e.t === 'boss' || e.t === 'stairs'))) continue;
        if (d[y][x] < bd) { bd = d[y][x]; best = [x, y]; }
      }
      if (!best) break;
      await walkTo(best[0], best[1]);
    }
    // also every chest/fight/riddle/lyra
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const e = m.ev[y][x];
      if (e && ['chest', 'fight', 'riddle', 'lyra'].includes(e.t)) { if (G.map !== m.id) await BT.EX.changeMap(m.id); await walkTo(x, y); }
    }
  }
  const lvl = () => G.party.map((c) => c.level).join('/');

  // Malthor's house -> the cellar stair -> the Folded Cellar -> the Echo of Irena.
  async function foldedHouse() {
    await BT.EX.changeMap('l1');
    const l1 = BT.MAPS.l1, cellar = find(l1, (e) => e.to === 'folded1');
    await walkTo(cellar[0], cellar[1]);
    if (G.map !== 'folded1') throw new Error('the cellar stair did not lead into the Folded Cellar');
    const f1 = BT.MAPS.folded1;
    await exploreSome(f1, 0.5);
    town();
    if (G.map !== 'folded1') await BT.EX.changeMap('folded1');
    await walkTo(f1.downPos.x, f1.downPos.y);
    if (G.map !== 'folded2') throw new Error('no way down to the Still Room');
    const f2 = BT.MAPS.folded2, heart = find(f2, (e) => e.setFlag === 'irena');
    for (let tries = 0; !G.flags.irena && tries < 6; tries++) {
      try { await walkTo(heart[0], heart[1]); }
      catch (e) { if (!/GAME OVER/.test(e.message)) throw e; for (const c of G.party) c.status = 'ok'; }
      town();
      if (G.map !== 'folded2') await BT.EX.changeMap('folded2');
    }
    report.push('folded2: the Echo of Irena ' + (G.flags.irena ? 'freed' : 'NOT freed') + ' at levels ' + lvl() + ', still-lily ' + ST.hasItem('stilllily'));
    if (!G.flags.irena || !ST.hasItem('stilllily')) throw new Error('the Folded House side quest was not completed');
  }

  town();
  const plan = [
    ['sewers1', null], ['sewers2', 'ratking'], ['crypt1', null], ['crypt2', 'morvane'],
    ['keep1', null], ['keep2', 'kargath'], ['tower1', null], ['tower2', null], ['tower3', 'malthor'],
  ];
  for (const [id, boss] of plan) {
    const m = BT.MAPS[id];
    if (G.map !== id) await BT.EX.changeMap(id);
    await exploreSome(m, 0.8);
    town();
    if (G.map !== id) await BT.EX.changeMap(id);
    if (boss) {
      const target = { ratking: 4, morvane: 8, kargath: 11, malthor: 13 }[boss];
      let g = 0;
      while (Math.min.apply(null, G.party.map((c) => c.level)) < target && g++ < 60) {
        const d = MG.bfs(m, G.x, G.y), cells = [];
        for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (d[y][x] > 0 && !m.ev[y][x]) cells.push([x, y]);
        const [x, y] = U.pick(cells);
        await walkTo(x, y);
        town();
        if (G.map !== id) await BT.EX.changeMap(id);
      }
      const room = m.bossRoom.cells[0];
      const before = lvl();
      let tries = 0;
      for (;;) {
        try { await walkTo(room[0], room[1]); break; }
        catch (e) {
          if (!/GAME OVER/.test(e.message) || ++tries > 6) throw e;
          report.push('  wiped (' + e.message.slice(0, 40) + '...), retry ' + tries);
          for (const c of G.party) c.status = 'ok';
          town();
          await BT.EX.changeMap(id);
          // grind one more level before retrying, like a player would
          const t2 = Math.min.apply(null, G.party.map((c) => c.level)) + 1;
          let gg = 0;
          while (Math.min.apply(null, G.party.map((c) => c.level)) < t2 && gg++ < 60) {
            const d = MG.bfs(m, G.x, G.y), cells = [];
            for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (d[y][x] > 0 && !m.ev[y][x]) cells.push([x, y]);
            const [x, y] = U.pick(cells);
            try { await walkTo(x, y); } catch (e2) { for (const c of G.party) c.status = 'ok'; }
            town();
            if (G.map !== id) await BT.EX.changeMap(id);
          }
        }
      }
      report.push(id + ': boss ' + boss + (G.flags[boss] ? ' DEFEATED' : ' NOT defeated') + ' at levels ' + before);
      if (!G.flags[boss]) throw new Error('boss not defeated: ' + boss);
      town();
    } else {
      const [sx, sy] = [m.downPos.x, m.downPos.y];
      await walkTo(sx, sy);
      report.push(id + ': took stairs at levels ' + lvl() + ' -> now in ' + G.map);
      if (G.map === id) throw new Error('could not take stairs on ' + id);
    }
    // side quest: the Folded House, between the Keep and the tower (recommended level 7-10)
    if (boss === 'kargath') await foldedHouse();
    // after a boss, the next area is entered from town via gate (requires key)
    if (boss && boss !== 'malthor') {
      const nextGate = { ratking: 'crypt', morvane: 'keep', kargath: 'tower' }[boss];
      const key = { crypt: 'bronzekey', keep: 'ironsigil', tower: 'moonkey' }[nextGate];
      if (!ST.hasItem(key)) throw new Error('missing key ' + key);
      await BT.EX.changeMap('town');
      await BT.TW.enter(nextGate);
      report.push('  town gate ' + nextGate + ' -> ' + G.map);
    }
  }
  report.push('ending reached: ' + !!G.flags.malthor + ', town snow: ' + BT.STYLES.town.snow + ', rests: ' + restsUsed + ', battles: ' + G.stats.battles);
  return report;
}

(async () => {
  const runs = +process.argv[2] || 1;
  for (let i = 0; i < runs; i++) {
    try {
      const r = await play();
      console.log('RUN ' + (i + 1) + '\n  ' + r.join('\n  '));
    } catch (e) { console.log('RUN ' + (i + 1) + ' FAILED: ' + e.stack); process.exitCode = 1; }
  }
})();
