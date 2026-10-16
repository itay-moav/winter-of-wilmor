// The battle loop: initiative, rounds, end-of-round effects, fleeing, victory. Entry point: CB.fight.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MA = BT.MA, HX = BT.HX;
  const CB = BT.CB, K = CB.K;

  async function endOfRound() {
    const G = BT.G;
    const s = CB.S.song;
    if (s && s.regen) {
      for (const c of G.party) if (ST.alive(c) && c.hp < c.maxhp) c.hp = Math.min(c.maxhp, c.hp + Math.round(s.regen * s.power));
    }
    if (s && s.lull) {
      const g = CB.S.groups.find((x) => K.groupAlive(x) && !x.def.nosleep && x.sleep <= 0);
      if (g && U.chance(0.4)) { g.sleep = 1; UI.log('The lullaby lulls the ' + U.esc(g.def.pl) + ' to sleep.', 'good'); }
    }
    if (s && s.requiem) {
      for (const g of CB.S.groups) {
        if (!g.def.undead || !K.groupAlive(g)) continue;
        let t = 0;
        for (const m of K.liveMembers(g)) t += K.hitMonster(g, m, U.roll(2, 6, Math.floor(s.bard.level / 2)) * s.power | 0, 'holy');
        if (t) UI.log('The Requiem wracks the ' + U.esc(g.def.pl) + ' for ' + t + '.', 'hit');
      }
      K.removeDead();
    }
    for (const g of CB.S.groups) {
      if (!K.groupAlive(g)) continue;
      if (g.def.regen) for (const m of K.liveMembers(g)) m.hp = Math.min(m.maxhp, m.hp + g.def.regen);
      if (g.sleep > 0) g.sleep--;
      if (g.held > 0) g.held--;
    }
    if (CB.S.timestop > 0) CB.S.timestop--;
    for (const c of G.party) {
      if (c.status === 'paralyzed' && U.chance(0.2)) { c.status = 'ok'; UI.log(K.nm(c) + ' can move again!', 'good'); }
      if (c.status === 'poisoned') {
        const d = U.roll(1, 3 + Math.floor(c.maxhp / 30));
        c.hp -= d;
        UI.floatText(c, '-' + d, 'dmg');
        if (c.hp <= 0) { c.hp = 0; c.status = 'dead'; UI.log(K.nm(c) + ' succumbs to poison!', 'bad'); UI.sfx('death'); }
      }
      c._parry = false;
    }
    if (K.reinforce()) K.V('build');
    UI.renderParty();
    K.V('sync');
  }

  async function runAway() {
    if (CB.S.opts.noRun) { UI.log('There is no escape!', 'bad'); return false; }
    if (CB.S.song && CB.S.song.swift) return true;
    const P = BT.ST.living();
    const pl = P.reduce((a, c) => a + c.level, 0) / Math.max(1, P.length);
    const ml = Math.max.apply(null, CB.S.groups.filter(K.groupAlive).map((g) => g.def.lvl));
    const lk = P.reduce((a, c) => a + ST.stat(c, 'lk'), 0) / Math.max(1, P.length);
    return U.chance(U.clamp(0.45 + (pl - ml) * 0.05 + (lk - 12) * 0.02, 0.1, 0.9));
  }

  // Initiative order for one round.
  function initiative() {
    const queue = [];
    for (const u of CB.S.units) {
      if (!K.alive(u)) continue;
      if (u.kind === 'pc') {
        if (!ST.canAct(u.ch)) continue;
        let init = U.rand(10) + D.statBonus(ST.stat(u.ch, 'dx')) * 2 + u.ch.level / 3;
        if (CB.S.buff.haste) init += 5;
        if (CB.S.song && CB.S.song.swift) init += 10;
        queue.push({ u, init, fn: () => K.heroTurn(u) });
      } else if (u.kind === 'summon') queue.push({ u, init: U.rand(10) + 3, fn: () => K.summonTurn(u) });
      else queue.push({ u, init: U.rand(10) + u.g.def.lvl / 2, fn: () => K.monsterTurn(u), mon: true });
    }
    queue.sort((a, b) => b.init - a.init);
    return queue;
  }

  // ---------- main ----------
  // spec: [[monsterId, count], ...]
  CB.fight = async function (spec, opts) {
    opts = opts || {};
    const G = BT.G;
    CB.S = {
      groups: K.makeGroups(spec), opts, buff: { ac: 0, hit: 0, dmg: 0 }, song: null, timestop: opts.timestop || 0, kills: [], round: 0,
      engaged: new Map(), spellSlots: CB.SPELL_SLOTS, autoAll: false, units: [], obstacles: new Set(),
    };
    G.stats.battles++;
    if (G.fx.song) {
      const sd = D.SONGS.find((s) => s.id === G.fx.song.id);
      CB.S.song = Object.assign({}, sd, { power: G.fx.song.power || 1, bard: G.party.find((c) => c.cls === 'bard') || G.party[0] });
    }
    K.setup(spec, opts);
    // battle music by terrain: underground / city / wilderness (falls back to the generic track)
    const battle = BT.STYLES[BT.MAPS[G.map].style].battle;
    const music = opts.boss ? 'boss' : battle && BT.audio && BT.audio.musicTracks.indexOf(battle) >= 0 ? battle : 'combat';
    if (BT.audio) BT.audio.music(music);
    UI.syncSong();
    UI.sfx(opts.boss ? 'roar' : 'encounter');
    BT.R.shake(opts.boss ? 12 : 5);
    UI.hideOverlay();
    K.V('open');
    UI.log('<span class="enc">' + (opts.text ? opts.text : 'You face ' + K.summary() + '!') + '</span>');
    let result = null;
    try {
      while (!result) {
        CB.S.round++;
        CB.S.engaged = new Map();
        CB.S.spellSlots = CB.SPELL_SLOTS;
        const queue = initiative();
        K.V('queue', queue.map((q) => q.u));
        K.V('round', CB.S.round);
        for (const q of queue) {
          if (K.monstersDefeated() || K.partyDefeated()) break;
          if (!K.alive(q.u) || CB.S.units.indexOf(q.u) < 0) continue;
          K.V('turn', q.u);
          await q.fn();
          if (CB.S.fled) break;
          K.removeDead();
          UI.renderParty();
          K.V('sync');
          if (q.mon) await K.wait(CB.delay);
          else await K.wait(CB.delay / 2);
        }
        if (CB.S.fled) { UI.sfx('flee'); UI.log('The party flees!'); result = 'fled'; break; }
        if (K.monstersDefeated()) { result = 'win'; break; }
        if (K.partyDefeated()) { result = 'lose'; break; }
        await endOfRound();
        if (K.monstersDefeated()) { result = 'win'; break; }
        if (K.partyDefeated()) { result = 'lose'; break; }
      }
    } finally {
      K.V('close');
    }
    for (const c of G.party) {
      c._parry = false; c._hidden = false;
      if (c.status === 'paralyzed' && result !== 'lose') { c.status = 'ok'; UI.log(K.nm(c) + ' shakes off the paralysis.'); }
    }
    const kills = CB.S.kills;
    CB.lastRounds = CB.S.round;
    CB.S = null;
    UI.syncSong();
    if (result === 'win') await victory(kills, opts);
    UI.hideOverlay();
    UI.renderParty();
    return result;
  };

  async function victory(kills, opts) {
    const G = BT.G;
    UI.sfx('victory_sting');
    if (BT.audio) BT.audio.music(BT.STYLES[BT.MAPS[G.map].style].music);
    let xp = 0, gold = 0;
    for (const d of kills) {
      xp += d.xp;
      gold += Math.round(U.roll(1, 6, 1) * Math.pow(d.lvl, 1.4) * (d.gold || 1) * 0.7) + (d.boss ? d.gold || 0 : 0);
    }
    gold += opts.gold || 0;
    const living = ST.living();
    const each = living.length ? Math.floor(xp / living.length) : 0;
    let lines = '<b>Victory!</b> Each survivor earns ' + each + ' experience.';
    for (const c of living) c.xp += each;
    if (gold && living.length) {
      const share = Math.floor(gold / living.length);
      for (const c of living) c.gold += share;
      lines += ' You find ' + gold + ' gold.';
      UI.sfx('coin');
    }
    UI.log(lines, 'good');
    const lvls = living.filter((c) => ST.canLevel(c) && !c._notified);
    for (const c of lvls) { c._notified = true; UI.log(K.nm(c) + ' has earned enough experience to advance! Visit the Hall of Review.', 'good'); }
    UI.renderParty();
    for (const id of opts.items || []) {
      const who = ST.giveParty(id);
      UI.sfx('quest');
      if (who) UI.log(K.nm(who) + ' takes the <span class="item">' + U.esc(BT.ITEMS[id].name) + '</span>.', 'good');
      else UI.log('No one has room for the ' + U.esc(BT.ITEMS[id].name) + '! (It stays here.)', 'bad');
    }
    const depth = BT.MAPS[G.map].depth || 0;
    if (opts.chest || (!opts.noChest && U.chance(depth ? 0.3 : 0.12))) await CB.chest(Math.max(1, depth), opts.chestItems);
  }


  Object.assign(K, { endOfRound, runAway, initiative, victory });
})();
