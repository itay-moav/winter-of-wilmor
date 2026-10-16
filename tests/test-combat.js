// Headless combat rules on the hex board: placement, movement, adjacency, the anti-swarm caps,
// reinforcements, fleeing, songs and summons. The party is played by the built-in AI.
const fs = require('fs'), vm = require('vm'), path = require('path');
let fail = 0, checks = 0;
const check = (c, m) => { checks++; if (!c) { console.log('FAIL', m); fail++; } };

function boot() {
  const ctx = { console, Math, JSON, setTimeout, clearTimeout, Promise, Date };
  ctx.window = ctx;
  ctx.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
  vm.createContext(ctx);
  const run = (f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
  const load = require('./load');
  load.select(load.WORLD).forEach(run);
  const BT = ctx.BT;
  BT.R = { shake() {}, flash() {}, invalidate() {}, snap() {} };
  BT.MAPS = { sim: { id: 'sim', name: 'sim', style: 'crypt', depth: 2, fl: [[0]], w: 1, h: 1 } };
  ctx.songs = [];
  BT.UI = {
    log() {}, sfx() {}, spellFx() {}, renderParty() {}, hideOverlay() {}, floatText() {}, updateHud() {}, showNpc() {}, cancelMenu() {},
    syncSong() { ctx.songs.push(BT.CB.active() ? BT.CB.songId() : (BT.G.fx.song ? BT.G.fx.song.id : null)); },
    menu: async (o) => (ctx.menu ? ctx.menu(o) : (o.options || []).filter(Boolean).filter((x) => !x.disabled)[0].value),
    pickMember: async (t, f) => BT.G.party.find((c) => !f || f(c)) || null,
    confirm: async () => true, pause: async () => true,
  };
  load.select(load.COMBAT, load.NO_VIEW).forEach(run);
  BT.CB.delay = 0;
  BT.CB.auto = true;
  BT.U.sleep = () => Promise.resolve();
  return { BT, ctx };
}

function party(BT, level) {
  const G = BT.ST.newGame();
  G.map = 'sim'; G.x = 0; G.y = 0;
  G.party = BT.ST.defaultParty();
  for (const c of G.party) {
    while (c.level < level) { c.xp = BT.D.xpFor(c.level + 1); BT.ST.levelUp(c); }
    const sch = BT.D.CLASSES[c.cls].school;
    if (sch) c.spells[sch] = BT.D.maxSpellLevel(c.level);
    c.hp = c.maxhp; c.sp = BT.ST.maxSp(c);
  }
  return G;
}

// A fake battle view that checks every move and strike as it happens.
function spyView(BT, HX, ctx) {
  const st = { moves: 0, strikes: 0, maxEngaged: 0, maxOnBoard: 0, badMove: 0, badStrike: 0, opened: 0, closed: 0 };
  BT.BV = {
    open(cb) {
      st.opened++;
      for (const u of cb.units) {
        if (u.kind === 'pc') check(u.c <= 2, 'heroes start on the left');
        if (u.kind === 'mon') check(u.c >= 4, 'monsters start on the right');
        check(!cb.obstacles.has(HX.key(u.c, u.r)), 'nobody starts on an obstacle');
      }
      const keys = cb.units.map((u) => HX.key(u.c, u.r));
      check(new Set(keys).size === keys.length, 'one unit per hex at the start');
    },
    close() { st.closed++; },
    move(cb, u, p) {
      st.moves++;
      let prev = u;
      for (const h of p) {
        if (HX.dist(prev, h) !== 1 || cb.obstacles.has(HX.key(h.c, h.r))) st.badMove++;
        if (cb.units.some((o) => o !== u && o.c === h.c && o.r === h.r && (o.kind !== 'pc' ? (o.kind === 'mon' ? o.m.hp > 0 : true) : o.ch.status !== 'dead'))) st.badMove++;
        prev = h;
      }
    },
    lunge(cb, u, t) {
      st.strikes++;
      const ranged = u.kind === 'pc' && BT.ST.weapon(u.ch) && BT.ST.weapon(u.ch).ranged;
      if (!ranged && HX.dist(u, t) !== 1) st.badStrike++;
    },
    sync(cb) {
      for (const v of cb.engaged.values()) st.maxEngaged = Math.max(st.maxEngaged, v);
      for (const g of cb.groups) st.maxOnBoard = Math.max(st.maxOnBoard, cb.units.filter((u) => u.g === g && u.m.hp > 0).length);
    },
  };
  return st;
}

(async () => {
  // 1. a big rat pack: reinforcements, adjacency, caps
  {
    const { BT, ctx } = boot();
    const G = party(BT, 4);
    const st = spyView(BT, BT.HX, ctx);
    const r = await BT.CB.fight([['rat', 12], ['kobold', 6]], { noChest: true });
    check(r === 'win', 'level-4 party beats a rat pack (' + r + ')');
    check(st.opened === 1 && st.closed === 1, 'battle view opened and closed once');
    check(st.maxOnBoard <= BT.CB.ON_BOARD, 'at most ' + BT.CB.ON_BOARD + ' of a group on the board (' + st.maxOnBoard + ')');
    check(st.maxEngaged <= BT.CB.MELEE_CAP, 'no hero beset by more than ' + BT.CB.MELEE_CAP + ' melee foes a round (' + st.maxEngaged + ')');
    check(st.badMove === 0, 'every move goes hex by hex through free hexes');
    check(st.badStrike === 0, 'melee strikes only between adjacent units');
    check(st.moves > 0 && st.strikes > 0, 'units moved and fought');
    check(G.stats.kills === 18, 'every rat and kobold was killed, reserves included (' + G.stats.kills + ')');
    check(!BT.CB.active(), 'combat state cleared');
  }
  // 2. hopeless fight is lost
  {
    const { BT } = boot();
    party(BT, 1);
    const r = await BT.CB.fight([['dragon', 1]], { noChest: true, noRun: true });
    check(r === 'lose', 'level-1 party loses to a dragon (' + r + ')');
  }
  // 3. the Song of Swiftness always escapes; songs carried from exploration are active in battle
  {
    const { BT, ctx } = boot();
    const G = party(BT, 3);
    G.fx.song = { id: 'swift', steps: 100, power: 1 };
    BT.CB.auto = false;
    ctx.menu = (o) => (o.options.some((x) => x && x.value === 'flee') ? 'flee' : o.options.filter(Boolean)[0].value);
    const r = await BT.CB.fight([['orc', 3]], {});
    check(r === 'fled', 'the Song of Swiftness lets the party flee (' + r + ')');
    check(ctx.songs.includes('swift'), 'the carried song was synced to the music during battle');
    check(ctx.songs[ctx.songs.length - 1] === 'swift', 'after battle the exploration song plays on');
  }
  // 4. a song sung in battle ends with the battle
  {
    const { BT, ctx } = boot();
    const G = party(BT, 3);
    await BT.CB.fight([['orc', 4]], { noChest: true }); // long enough for the bard to get a turn
    check(ctx.songs.includes('march'), 'the bard\'s battle song took over the music');
    check(ctx.songs[ctx.songs.length - 1] === null, 'the battle song stops when the battle ends');
    check(!G.fx.song, 'a battle song does not leak into exploration');
  }
  // 5. summons fight on the board
  {
    const { BT } = boot();
    const G = party(BT, 6);
    BT.MA.summon('wolf_ally');
    let sawSummon = false;
    BT.BV = { open(cb) { sawSummon = cb.units.some((u) => u.kind === 'summon'); } };
    const r = await BT.CB.fight([['goblin', 3]], { noChest: true });
    check(sawSummon, 'the summoned ally stands on the board');
    check(r === 'win', 'the fight with a summon is won');
  }
  // 6. AI orders are always legal
  {
    const { BT } = boot();
    party(BT, 8);
    let bad = 0, n = 0;
    BT.BV = {
      setActive(cb, u) {
        if (u.kind !== 'pc' || !BT.ST.canAct(u.ch)) return;
        const a = BT.CB.aiParty(u, 3);
        n++;
        if (!a || !a.t) bad++;
        if (a.t === 'attack' && !a.target) bad++;
        if (a.t === 'cast' && (!a.s || a.s.when === 'explore' || u.ch.sp < a.s.sp)) bad++;
        if (a.move && a.move.length > 3) bad++;
      },
    };
    await BT.CB.fight([['ghoul', 4], ['skeleton', 6]], { noChest: true });
    check(n > 0 && bad === 0, 'party AI orders are legal (' + bad + ' bad of ' + n + ')');
  }
  console.log(fail ? 'FAIL ' + fail + ' of ' + checks : 'OK combat (' + checks + ' checks)');
  process.exit(fail ? 1 : 0);
})();
