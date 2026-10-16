// Carrying out hero and summon actions: attacks, spells, songs, items.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MA = BT.MA, HX = BT.HX;
  const CB = BT.CB, K = CB.K;

  // ---------- actions ----------
  async function partyAttack(u, target) {
    const ch = u.ch;
    const w = ST.weapon(ch);
    const ranged = w && w.ranged;
    const next = () => (ranged ? K.onBoard(target.g)[0] || K.foes()[0] : K.adjFoes(u)[0]);
    if (!target || !K.alive(target) || (!ranged && !HX.adjacent(u, target))) target = next();
    if (!target) { UI.log(K.nm(ch) + ' finds nothing to strike.'); return; }
    const n = ST.attacksPerRound(ch) + (CB.S.buff.haste ? 1 : 0);
    const song = CB.S.song;
    const hitB = ST.toHit(ch) + (CB.S.buff.hit || 0) + (song && song.hit ? Math.round(song.hit * song.power) : 0);
    const dmgB = ST.dmgBonus(ch) + (CB.S.buff.dmg || 0) + (song && song.dmg ? Math.round(song.dmg * song.power) : 0);
    const sneak = ch._hidden;
    ch._hidden = false;
    let hits = 0, total = 0;
    const g0 = target.g;
    K.V('lunge', u, target);
    for (let a = 0; a < n; a++) {
      if (!target || !K.alive(target)) target = next();
      if (!target) break;
      const g = target.g, m = target.m;
      const roll = 1 + U.rand(20);
      const asleep = g.sleep > 0 || g.held > 0;
      const hit = sneak || asleep || roll === 20 || (roll !== 1 && roll + hitB + g.def.ac + 3 >= 20);
      if (!hit) continue;
      hits++;
      let d = U.rollD(ST.damageDice(ch)) + dmgB;
      if (roll === 20) d *= 2;
      if (sneak) d *= (w && w.sneak) || 3;
      if (w && w.slay === 'undead' && g.def.undead) d *= 2;
      if (w && w.slay === 'cold' && g.def.resist && g.def.resist.ice === 0) d = Math.floor(d * 1.5);
      if (ch.cls === 'hunter' && !g.def.boss && U.chance(Math.min(0.3, 0.04 + ch.level * 0.02))) {
        UI.log(K.nm(ch) + ' strikes a vital spot!', 'crit');
        UI.sfx('crit');
        d = m.hp;
      }
      d = Math.max(1, d);
      const dealt = K.hitMonster(g, m, d, w ? w.el : null, ch);
      total += dealt;
      if (w && w.drain && dealt > 0) ch.hp = Math.min(ch.maxhp, ch.hp + Math.ceil(dealt / 4));
    }
    K.removeDead();
    if (!hits) { UI.sfx('miss'); UI.log(K.nm(ch) + ' ' + (ranged ? 'shoots at' : 'swings at') + ' ' + K.theName(g0.def) + ' and misses.'); return; }
    UI.sfx(sneak ? 'crit' : 'hit');
    UI.log(K.nm(ch) + (sneak ? ' strikes from the shadows at' : ranged ? ' shoots' : ' hits') + ' ' + K.theName(g0.def) + (hits > 1 ? ' ' + hits + ' times' : '') + ' for ' + total + ' damage.', 'hit');
  }

  async function castSpell(ch, s, tgt, fromItem) {
    if (!fromItem) {
      if (ch.sp < s.sp) { UI.log(K.nm(ch) + ' lacks the spell points.'); return; }
      ch.sp -= s.sp;
    }
    UI.log(K.nm(ch) + ' ' + (fromItem ? 'invokes' : 'casts') + ' <span class="spell">' + s.name + '</span>!');
    if (MA.antiMagic()) { UI.sfx('error'); UI.log('The magic is swallowed by the anti-magic field.', 'bad'); return; }
    const lvl = fromItem ? Math.max(ch.level || 1, 8) : ch.level;
    UI.sfx(s.fx ? 'spell_' + s.fx : s.heal ? 'spell_heal' : s.buff ? 'buff' : 'spell_generic');
    if (s.fx) UI.spellFx(s.fx);
    // the target unit (a monster) may have died since the order was given
    const tu = tgt && tgt.kind === 'mon' ? tgt : null;
    const tg = tu ? tu.g : null;
    if (s.dmg) {
      let groups = [];
      if (s.target === 'all') groups = CB.S.groups.filter(K.groupAlive);
      else if (tg && K.groupAlive(tg)) groups = [tg];
      else groups = CB.S.groups.filter(K.groupAlive).slice(0, 1);
      let total = 0;
      for (const g of groups) {
        if (s.undead && !g.def.undead) { UI.log('The ' + U.esc(g.def.pl) + ' are unaffected.'); continue; }
        let victims;
        if (s.target === 'one') victims = [tu && tu.m.hp > 0 && tu.g === g ? tu.m : (K.onBoard(g)[0] || {}).m || K.liveMembers(g)[0]];
        else victims = K.liveMembers(g);
        K.V('blast', g, s.fx || 'generic');
        for (const m of victims) if (m) total += K.hitMonster(g, m, U.rollD(MA.spellDice(s, lvl)), s.el, ch, true);
      }
      K.removeDead();
      if (total) UI.log('It deals ' + total + ' damage.', 'hit');
      if (s.drain && total) { const h = Math.ceil(total * s.drain); ch.hp = Math.min(ch.maxhp, ch.hp + h); UI.log(K.nm(ch) + ' drinks ' + h + ' life.', 'good'); }
      return;
    }
    if (s.heal || s.cure || s.raise) {
      const list = s.target === 'party' ? K.partyList() : [tgt];
      for (const t of list) if (t) UI.log(MA.heal(t, s, lvl), 'good');
      return;
    }
    if (s.buff) {
      const b = s.buff;
      if (b.ac) CB.S.buff.ac = Math.max(-10, (CB.S.buff.ac || 0) + b.ac);
      if (b.hit) CB.S.buff.hit = (CB.S.buff.hit || 0) + b.hit;
      if (b.dmg) CB.S.buff.dmg = (CB.S.buff.dmg || 0) + b.dmg;
      if (b.resist) CB.S.buff.resist = true;
      if (b.haste) CB.S.buff.haste = true;
      UI.log('The party is empowered.', 'good');
      return;
    }
    const g = tg;
    const resistChance = (gg) => U.clamp(0.8 - (gg.def.lvl - lvl) * 0.05, 0.1, 0.95);
    if (s.sleep || s.hold) {
      if (!g || !K.groupAlive(g)) return;
      if ((s.sleep && g.def.nosleep) || g.def.boss) { UI.log('The ' + U.esc(g.def.pl) + ' are immune!'); return; }
      if (U.chance(resistChance(g))) {
        if (s.sleep) g.sleep = s.sleep; else g.held = s.hold;
        UI.log('The ' + U.esc(g.def.pl) + ' ' + (s.sleep ? 'fall asleep!' : 'are held fast!'), 'good');
      } else UI.log('The ' + U.esc(g.def.pl) + ' resist!');
      return;
    }
    if (s.fear || s.death) {
      const gs = s.target === 'all' ? CB.S.groups.filter(K.groupAlive) : g ? [g] : [];
      for (const gg of gs) {
        if (gg.def.boss || (s.fear && gg.def.undead)) { UI.log(U.cap(K.theName(gg.def)) + ' is unmoved.'); continue; }
        let n = 0;
        for (const m of K.liveMembers(gg)) {
          const p = s.death ? U.clamp(0.65 - (gg.def.lvl - lvl) * 0.04, 0.1, 0.9) : U.clamp(s.fear - (gg.def.lvl - lvl) * 0.03, 0.05, 0.9);
          if (U.chance(p)) {
            n++;
            if (s.death) K.hitMonster(gg, m, m.hp, null, ch);
            else m.hp = 0;
          }
        }
        if (s.fear) UI.log(n ? n + ' ' + K.gname(gg, n) + ' flee in terror!' : 'The ' + U.esc(gg.def.pl) + ' stand their ground.', n ? 'good' : '');
        else if (!n) UI.log('The ' + U.esc(gg.def.pl) + ' resist the doom.');
      }
      K.removeDead();
      return;
    }
    if (s.timestop) { CB.S.timestop = s.timestop; UI.log('Time freezes for your enemies!', 'good'); return; }
    if (s.summon) {
      UI.log(MA.summon(s.summon), 'good');
      const caster = CB.unitFor(ch);
      CB.S.units = CB.S.units.filter((x) => x.kind !== 'summon');
      if (BT.G.summon) K.addHero(BT.G.summon, caster ? caster.c + 1 : 2, caster ? caster.r : 3);
      K.V('build');
      return;
    }
    UI.log('Nothing seems to happen.');
  }

  async function perform(u, c) {
    const ch = u.ch;
    if (c.move && c.move.length) await K.moveAlong(u, c.move);
    if (c.t === 'attack') return partyAttack(u, c.target);
    if (c.t === 'parry') { ch._parry = true; UI.log(K.nm(ch) + ' takes a defensive stance.'); UI.sfx('block'); return; }
    if (c.t === 'hide') {
      if (U.chance(0.45 + ch.level * 0.04)) { ch._hidden = true; UI.log(K.nm(ch) + ' melts into the shadows.'); K.V('sync'); }
      else UI.log(K.nm(ch) + ' fails to hide.');
      return;
    }
    if (c.t === 'cast') return castSpell(ch, c.s, c.tgt);
    if (c.t === 'sing') {
      if (ch.voice <= 0) { UI.log(K.nm(ch) + '\'s voice is a hoarse croak. (Drink at the tavern to recover.)', 'bad'); return; }
      ch.voice--;
      CB.S.song = Object.assign({}, c.song, { power: K.songPower(ch), bard: ch });
      UI.sfx('song');
      UI.syncSong();
      UI.log(K.nm(ch) + ' plays the <span class="spell">' + c.song.name + '</span>. ' + c.song.desc, 'good');
      return;
    }
    if (c.t === 'use') {
      const d = BT.ITEMS[c.it.id];
      if (ch.inv.indexOf(c.it) < 0) return;
      if (d.use.spell) await castSpell(ch, BT.SPELLS[d.use.spell], c.tgt, true);
      else { UI.sfx('drink'); UI.log(K.nm(ch) + ' uses ' + U.esc(d.name) + '. ' + MA.applyItem(c.tgt, d.use), 'good'); }
      MA.consume(ch, c.it);
    }
  }

  async function heroTurn(u) {
    const ch = u.ch;
    if (!ST.canAct(ch)) return;
    let mp = K.speed(u), moved = false;
    for (let guard = 0; guard < 12; guard++) {
      K.V('setActive', u);
      const auto = CB.auto || CB.S.autoAll;
      const c = auto ? K.aiParty(u, mp) : await K.commandFor(u, mp, moved);
      K.V('highlight', null);
      if (c.t === 'move') {
        await K.moveAlong(u, c.path);
        mp = Math.max(0, mp - c.path.length);
        moved = true;
        continue;
      }
      if (c.t === 'end') return;
      if (c.t === 'flee') {
        if (await K.runAway()) { CB.S.fled = true; return; }
        UI.log(K.nm(ch) + ' looks for a way out, but there is none!', 'bad');
        return;
      }
      await perform(u, c);
      return;
    }
  }

  async function summonTurn(u) {
    const s = u.ch;
    if (!K.alive(u)) return;
    const md = BT.MONSTERS[s.mid];
    const reach = K.reachOf(u, K.speed(u));
    const opts = K.foes().map((f) => ({ f, h: K.strikeFrom(u, f, reach) })).filter((x) => x.h).sort((a, b) => a.h.d - b.h.d);
    if (!opts.length) {
      const near = K.foes().sort((a, b) => HX.dist(u, a) - HX.dist(u, b))[0];
      if (near) { await K.approach(u, near, K.speed(u), false); UI.log(K.nm(s) + ' closes in.'); }
      return;
    }
    const { f, h } = opts[0];
    if (h.d) await K.moveAlong(u, HX.path(reach, h.c, h.r));
    const g = f.g;
    let total = 0;
    K.V('lunge', u, f);
    for (let a = 0; a < md.atk; a++) {
      const m = f.m.hp > 0 ? f.m : (K.adjFoes(u)[0] || {}).m;
      if (!m) break;
      const gg = m.unit ? m.unit.g : g;
      if (U.rand(20) + 1 + md.lvl + gg.def.ac + 3 >= 20) total += K.hitMonster(gg, m, U.rollD(md.dmg), md.el, s);
    }
    K.removeDead();
    UI.sfx(total ? 'hit' : 'miss');
    UI.log(K.nm(s) + (total ? ' savages ' + K.theName(g.def) + ' for ' + total + '.' : ' misses.'), total ? 'hit' : '');
  }

  Object.assign(K, { partyAttack, castSpell, perform, heroTurn, summonTurn });
})();
