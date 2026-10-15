// Turn-based party-vs-monster-groups combat.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MA = BT.MA;
  const CB = {};
  CB.delay = 420;

  const nm = (ch) => '<b>' + U.esc(ch.name) + '</b>';
  const gname = (g, n) => U.esc(n > 1 ? g.def.pl : g.def.name);
  const liveMembers = (g) => g.members.filter((m) => m.hp > 0);
  const theName = (def) => (def.boss ? U.esc(def.name.split(',')[0]) : 'the ' + U.esc(def.name));
  const groupAlive = (g) => g.members.some((m) => m.hp > 0);

  let cb = null;
  CB.active = () => !!cb;

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

  function partyList() {
    const P = BT.G.party.slice();
    if (BT.G.summon) P.push(BT.G.summon);
    return P;
  }
  function frontTargets() {
    const alive = BT.G.party.filter(ST.alive).slice(0, 3);
    if (BT.G.summon && BT.G.summon.hp > 0) alive.push(BT.G.summon);
    return alive;
  }
  function anyTargets() {
    const alive = BT.G.party.filter(ST.alive);
    if (BT.G.summon && BT.G.summon.hp > 0) alive.push(BT.G.summon);
    return alive;
  }
  function songPower(ch) {
    const inst = ST.equipped(ch, 'instrument');
    const p = inst ? BT.ITEMS[inst.id].songPower || 1 : 1;
    return p * (1 + ch.level / 12);
  }

  function partyAC(ch) {
    let ac = ST.ac(ch, cb ? cb.buff : null);
    if (cb && cb.song && cb.song.ac) ac += Math.round(cb.song.ac * cb.song.power);
    if (ch._parry) ac -= 4;
    return ac;
  }

  function summary() {
    return cb.groups.filter(groupAlive).map((g) => {
      const n = liveMembers(g).length;
      return (g.def.boss ? '' : n + ' ') + gname(g, n) + ' (' + g.dist + "')";
    }).join(', ');
  }

  // ---------- damage to party ----------
  function hurt(ch, dmg, el, magical) {
    if (ch.hp <= 0 || ch.status === 'dead') return 0;
    let d = dmg;
    if (magical && cb && cb.buff.resist) d = Math.floor(d / 2);
    if (el === 'ice' && BT.G.faith === 'pale' && !ch.summon) d = Math.floor(d / 2); // the Still Mother's Hush
    if (el && !ch.summon) {
      for (const it of ch.inv) if (it.eq && BT.ITEMS[it.id].resist === el) { d = Math.floor(d / 2); break; }
      if (magical) for (const it of ch.inv) if (it.eq && BT.ITEMS[it.id].resist === 'magic') { d = Math.floor(d * 0.7); break; }
    }
    d = Math.max(1, d);
    ch.hp -= d;
    UI.floatText(ch, '-' + d, 'dmg');
    if (ch.hp <= 0) {
      ch.hp = 0;
      if (ch.summon) {
        UI.log(nm(ch) + ' is destroyed and fades away!', 'bad');
        BT.G.summon = null;
      } else {
        ch.status = 'dead';
        UI.log(nm(ch) + ' has been killed!', 'bad');
        UI.sfx('death');
      }
    }
    return d;
  }
  function inflict(ch, status) {
    if (ch.summon || !ST.alive(ch)) return false;
    if (ch.cls === 'paladin' && U.chance(0.5)) { UI.log(nm(ch) + ' resists with holy fortitude.'); return false; }
    if (U.chance(ST.stat(ch, 'lk') / 60)) { UI.log(nm(ch) + ' luckily shrugs it off.'); return false; }
    if (status === 'poisoned' && ch.status !== 'ok') return false;
    if (status === 'paralyzed' && ch.status === 'stoned') return false;
    ch.status = status;
    UI.sfx(status === 'poisoned' ? 'poison' : 'debuff');
    UI.log(nm(ch) + ' is ' + status + '!', 'bad');
    return true;
  }

  // ---------- damage to monsters ----------
  function hitMonster(g, m, dmg, el, attacker, magical) {
    let d = dmg;
    if (magical && g.def.mres) d = Math.floor(d * g.def.mres);
    if (BT.G.faith === 'dawn' && g.def.undead) d = Math.floor(d * 1.5); // Blessing of the Kindled Sun
    if (el && g.def.resist && g.def.resist[el] != null) d = Math.floor(d * g.def.resist[el]);
    if (d <= 0) { UI.log(U.cap(theName(g.def)) + ' is unharmed!'); return 0; }
    m.hp -= d;
    UI.hitMonster(cb.groups.indexOf(g));
    if (m.hp <= 0) {
      m.hp = 0;
      cb.kills.push(g.def);
      BT.G.stats.kills++;
      UI.sfx('monster_die');
      UI.log(U.cap(theName(g.def)) + ' ' + (g.def.undead ? 'is destroyed' : 'falls') + '!', 'kill');
      if (g.def.boss) BT.R.shake(14);
    }
    return d;
  }
  function firstLive(g) { return g.members.find((m) => m.hp > 0); }

  // ---------- party commands ----------
  async function chooseCommands() {
    const P = BT.G.party;
    const cmds = new Map();
    let i = 0;
    while (i < P.length) {
      const ch = P[i];
      if (!ST.canAct(ch)) { i++; continue; }
      const c = await commandFor(ch, i);
      if (c === 'back') {
        // step back to previous actor
        let j = i - 1;
        while (j >= 0 && !ST.canAct(P[j])) j--;
        if (j >= 0) { cmds.delete(P[j]); i = j; }
        continue;
      }
      if (c === 'abort') return null;
      cmds.set(ch, c);
      i++;
    }
    return cmds;
  }

  async function pickGroup(title, filter) {
    const opts = cb.groups.map((g, gi) => ({ g, gi })).filter(({ g }) => groupAlive(g) && (!filter || filter(g)));
    if (!opts.length) return null;
    if (opts.length === 1) return opts[0].gi;
    return UI.menu({
      title,
      options: opts.map(({ g, gi }) => ({ label: liveMembers(g).length + ' ' + gname(g, liveMembers(g).length), hint: g.dist + "'", value: gi, key: String(gi + 1) })),
      cancel: null,
    });
  }

  async function commandFor(ch, idx) {
    for (;;) {
      const w = ST.weapon(ch);
      const ranged = w && w.ranged;
      const canMelee = idx < 3 || ranged;
      const reach = (g) => ranged || g.dist <= 10;
      const meleeTargets = cb.groups.filter((g) => groupAlive(g) && reach(g));
      const spells = ST.knownSpells(ch).filter((s) => s.when !== 'explore');
      const items = MA.usableItems(ch, true);
      const isBard = ch.cls === 'bard' && ST.equipped(ch, 'instrument');
      const opts = [
        { label: ranged ? 'Shoot' : 'Attack', key: 'a', value: 'attack', disabled: !canMelee || !meleeTargets.length, hint: !canMelee ? 'back rank' : !meleeTargets.length ? 'out of reach' : '' },
        { label: 'Parry', key: 'p', value: 'parry' },
        spells.length ? { label: 'Cast spell', key: 'c', value: 'cast', disabled: ch.sp < Math.min.apply(null, spells.map((s) => s.sp)) } : null,
        isBard ? { label: 'Sing', key: 's', value: 'sing', hint: 'voice ' + ch.voice } : null,
        items.length ? { label: 'Use item', key: 'u', value: 'use' } : null,
        ch.cls === 'rogue' ? { label: 'Hide in shadows', key: 'h', value: 'hide' } : null,
        idx > 0 ? { label: 'Back', key: 'b', value: 'back' } : null,
      ];
      const pick = await UI.menu({ title: (idx + 1) + '. ' + U.esc(ch.name), text: 'Foes: ' + summary(), options: opts });
      if (pick === 'back') return 'back';
      if (pick === 'parry') return { t: 'parry' };
      if (pick === 'hide') return { t: 'hide' };
      if (pick === 'attack') {
        const gi = await pickGroup('Attack which group?', reach);
        if (gi == null) continue;
        return { t: 'attack', gi };
      }
      if (pick === 'cast') {
        const s = await MA.chooseSpell(ch, true);
        if (!s) continue;
        const tgt = await spellTarget(s);
        if (tgt === undefined) continue;
        return { t: 'cast', s, tgt };
      }
      if (pick === 'sing') {
        const song = await UI.menu({
          title: 'Which song?',
          options: D.SONGS.map((s) => ({ label: s.name, hint: s.desc, value: s })),
          cancel: null,
        });
        if (!song) continue;
        return { t: 'sing', song };
      }
      if (pick === 'use') {
        const it = await UI.menu({ title: 'Use which item?', options: items.map((it) => ({ label: BT.ITEMS[it.id].name + (it.ch != null ? ' (' + it.ch + ')' : ''), value: it })), cancel: null });
        if (!it) continue;
        const u = BT.ITEMS[it.id].use;
        let tgt = null;
        if (u.spell) {
          tgt = await spellTarget(BT.SPELLS[u.spell]);
          if (tgt === undefined) continue;
        } else {
          tgt = await UI.pickMember('On whom?', (c) => (u.raise ? c.status === 'dead' : c.status !== 'dead'));
          if (!tgt) continue;
        }
        return { t: 'use', it, tgt };
      }
    }
  }

  async function spellTarget(s) {
    if (s.target === 'one' || s.target === 'group') {
      const gi = await pickGroup('Cast at which group?', s.undead ? (g) => g.def.undead : null);
      return gi == null ? undefined : gi;
    }
    if (s.target === 'ally') {
      const t = await UI.pickMember('Cast on whom?', (c) => (s.raise ? c.status === 'dead' : c.status !== 'dead'), true);
      return t || undefined;
    }
    return null;
  }

  // ---------- actions ----------
  async function partyAttack(ch, gi) {
    let g = cb.groups[gi];
    const w = ST.weapon(ch);
    const ranged = w && w.ranged;
    if (!g || !groupAlive(g) || (!ranged && g.dist > 10)) {
      g = cb.groups.find((x) => groupAlive(x) && (ranged || x.dist <= 10));
      if (!g) { UI.log(nm(ch) + ' finds nothing to strike.'); return; }
    }
    let n = ST.attacksPerRound(ch) + (cb.buff.haste ? 1 : 0);
    const song = cb.song;
    const hitB = ST.toHit(ch) + (cb.buff.hit || 0) + (song && song.hit ? Math.round(song.hit * song.power) : 0);
    const dmgB = ST.dmgBonus(ch) + (cb.buff.dmg || 0) + (song && song.dmg ? Math.round(song.dmg * song.power) : 0);
    const sneak = ch._hidden;
    ch._hidden = false;
    let hits = 0, total = 0, killed = 0;
    for (let a = 0; a < n; a++) {
      const m = firstLive(g);
      if (!m) break;
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
        UI.log(nm(ch) + ' strikes a vital spot!', 'crit');
        UI.sfx('crit');
        d = m.hp;
      }
      d = Math.max(1, d);
      const before = m.hp;
      const dealt = hitMonster(g, m, d, w ? w.el : null, ch);
      total += dealt;
      if (before > 0 && m.hp <= 0) killed++;
      if (w && w.drain && dealt > 0) ch.hp = Math.min(ch.maxhp, ch.hp + Math.ceil(dealt / 4));
    }
    if (!hits) { UI.sfx('miss'); UI.log(nm(ch) + ' ' + (ranged ? 'shoots at' : 'swings at') + ' ' + theName(g.def) + ' and misses.'); return; }
    UI.sfx(sneak ? 'crit' : 'hit');
    UI.log(nm(ch) + (sneak ? ' strikes from the shadows at' : ' hits') + ' ' + theName(g.def) + (hits > 1 ? ' ' + hits + ' times' : '') + ' for ' + total + ' damage.' + (sneak ? '' : ''), 'hit');
  }

  async function castSpell(ch, s, tgt, fromItem) {
    if (!fromItem) {
      if (ch.sp < s.sp) { UI.log(nm(ch) + ' lacks the spell points.'); return; }
      ch.sp -= s.sp;
    }
    UI.log(nm(ch) + ' ' + (fromItem ? 'invokes' : 'casts') + ' <span class="spell">' + s.name + '</span>!');
    if (MA.antiMagic()) { UI.sfx('error'); UI.log('The magic is swallowed by the anti-magic field.', 'bad'); return; }
    const lvl = fromItem ? Math.max(ch.level || 1, 8) : ch.level;
    UI.sfx(s.fx ? 'spell_' + s.fx : s.heal ? 'spell_heal' : s.buff ? 'buff' : 'spell_generic');
    if (s.fx) UI.spellFx(s.fx);
    if (s.dmg) {
      let targets = [];
      if (s.target === 'all') targets = cb.groups.filter(groupAlive);
      else if (cb.groups[tgt] && groupAlive(cb.groups[tgt])) targets = [cb.groups[tgt]];
      else targets = cb.groups.filter(groupAlive).slice(0, 1);
      let total = 0;
      for (const g of targets) {
        if (s.undead && !g.def.undead) { UI.log('The ' + U.esc(g.def.pl) + ' are unaffected.'); continue; }
        const victims = s.target === 'one' ? [firstLive(g)] : liveMembers(g);
        for (const m of victims) {
          if (!m) continue;
          total += hitMonster(g, m, U.rollD(MA.spellDice(s, lvl)), s.el, ch, true);
        }
      }
      if (total) UI.log('It deals ' + total + ' damage.', 'hit');
      if (s.drain && total) { const h = Math.ceil(total * s.drain); ch.hp = Math.min(ch.maxhp, ch.hp + h); UI.log(nm(ch) + ' drinks ' + h + ' life.', 'good'); }
      return;
    }
    if (s.heal || s.cure || s.raise) {
      const list = s.target === 'party' ? partyList() : [tgt];
      for (const t of list) if (t) UI.log(MA.heal(t, s, lvl), 'good');
      return;
    }
    if (s.buff) {
      const b = s.buff;
      if (b.ac) cb.buff.ac = Math.max(-10, (cb.buff.ac || 0) + b.ac);
      if (b.hit) cb.buff.hit = (cb.buff.hit || 0) + b.hit;
      if (b.dmg) cb.buff.dmg = (cb.buff.dmg || 0) + b.dmg;
      if (b.resist) cb.buff.resist = true;
      if (b.haste) cb.buff.haste = true;
      UI.log('The party is empowered.', 'good');
      return;
    }
    const g = cb.groups[tgt];
    const resistChance = (gg) => U.clamp(0.8 - (gg.def.lvl - lvl) * 0.05, 0.1, 0.95);
    if (s.sleep || s.hold) {
      if (!g || !groupAlive(g)) return;
      if ((s.sleep && g.def.nosleep) || g.def.boss) { UI.log('The ' + U.esc(g.def.pl) + ' are immune!'); return; }
      if (U.chance(resistChance(g))) {
        if (s.sleep) g.sleep = s.sleep; else g.held = s.hold;
        UI.log('The ' + U.esc(g.def.pl) + ' ' + (s.sleep ? 'fall asleep!' : 'are held fast!'), 'good');
      } else UI.log('The ' + U.esc(g.def.pl) + ' resist!');
      return;
    }
    if (s.fear || s.death) {
      const gs = s.target === 'all' ? cb.groups.filter(groupAlive) : g ? [g] : [];
      for (const gg of gs) {
        if (gg.def.boss || (s.fear && gg.def.undead)) { UI.log(U.cap(theName(gg.def)) + ' is unmoved.'); continue; }
        let n = 0;
        for (const m of liveMembers(gg)) {
          const p = s.death ? U.clamp(0.65 - (gg.def.lvl - lvl) * 0.04, 0.1, 0.9) : U.clamp(s.fear - (gg.def.lvl - lvl) * 0.03, 0.05, 0.9);
          if (U.chance(p)) {
            n++;
            if (s.death) hitMonster(gg, m, m.hp, null, ch);
            else m.hp = 0;
          }
        }
        if (s.fear) UI.log(n ? n + ' ' + gname(gg, n) + ' flee in terror!' : 'The ' + U.esc(gg.def.pl) + ' stand their ground.', n ? 'good' : '');
        else if (!n) UI.log('The ' + U.esc(gg.def.pl) + ' resist the doom.');
      }
      return;
    }
    if (s.timestop) { cb.timestop = s.timestop; UI.log('Time freezes for your enemies!', 'good'); return; }
    if (s.summon) { UI.log(MA.summon(s.summon), 'good'); return; }
    UI.log('Nothing seems to happen.');
  }

  async function partyAct(ch, c) {
    if (!ST.canAct(ch)) return;
    if (c.t === 'attack') return partyAttack(ch, c.gi);
    if (c.t === 'parry') { ch._parry = true; UI.log(nm(ch) + ' parries.'); UI.sfx('block'); return; }
    if (c.t === 'hide') {
      if (U.chance(0.45 + ch.level * 0.04)) { ch._hidden = true; UI.log(nm(ch) + ' melts into the shadows.'); }
      else UI.log(nm(ch) + ' fails to hide.');
      return;
    }
    if (c.t === 'cast') return castSpell(ch, c.s, c.tgt);
    if (c.t === 'sing') {
      if (ch.voice <= 0) { UI.log(nm(ch) + '\'s voice is a hoarse croak. (Drink at the tavern to recover.)', 'bad'); return; }
      ch.voice--;
      cb.song = Object.assign({}, c.song, { power: songPower(ch), bard: ch });
      UI.sfx('song');
      UI.log(nm(ch) + ' plays the <span class="spell">' + c.song.name + '</span>. ' + c.song.desc, 'good');
      return;
    }
    if (c.t === 'use') {
      const d = BT.ITEMS[c.it.id];
      if (ch.inv.indexOf(c.it) < 0) return;
      if (d.use.spell) await castSpell(ch, BT.SPELLS[d.use.spell], c.tgt, true);
      else { UI.sfx('drink'); UI.log(nm(ch) + ' uses ' + U.esc(d.name) + '. ' + MA.applyItem(c.tgt, d.use), 'good'); }
      MA.consume(ch, c.it);
    }
  }

  async function summonAct(s) {
    if (!BT.G.summon || s.hp <= 0) return;
    const md = BT.MONSTERS[s.mid];
    const g = cb.groups.find((x) => groupAlive(x) && x.dist <= 10) || cb.groups.find(groupAlive);
    if (!g) return;
    if (g.dist > 10) { UI.log(nm(s) + ' closes in.'); return; }
    let total = 0;
    for (let a = 0; a < md.atk; a++) {
      const m = firstLive(g);
      if (!m) break;
      if (U.rand(20) + 1 + md.lvl + g.def.ac + 3 >= 20) total += hitMonster(g, m, U.rollD(md.dmg), md.el, s);
    }
    UI.sfx(total ? 'hit' : 'miss');
    UI.log(nm(s) + (total ? ' savages ' + theName(g.def) + ' for ' + total + '.' : ' misses.'), total ? 'hit' : '');
  }

  async function monsterAct(g, m) {
    if (m.hp <= 0 || !groupAlive(g)) return;
    if (g.sleep > 0 || g.held > 0 || cb.timestop > 0) return;
    const def = g.def;
    const name = U.cap(theName(def));
    // special abilities
    if (def.breath && (cb.spellSlots > 0 || def.boss) && U.chance(def.breath.chance) && (!def.breath.melee || g.dist <= 10)) {
      cb.spellSlots--;
      const b = def.breath;
      UI.log(name + ' unleashes ' + b.name + '!', 'bad');
      UI.sfx(b.fx === 'ice' ? 'spell_ice' : b.fx === 'fire' ? 'spell_fire' : 'roar');
      UI.spellFx(b.fx);
      BT.R.shake(10);
      const tg = U.shuffle(b.melee ? frontTargets() : anyTargets()).slice(0, b.targets || 2);
      for (const t of tg) {
        if (b.dmg && b.dmg[0]) hurt(t, U.rollD(b.dmg), b.el, true);
        if (b.stone && U.chance(b.stone)) inflict(t, 'stoned');
      }
      return;
    }
    if (def.spells && (cb.spellSlots > 0 || def.boss) && (g.dist > 10 || U.chance(0.6))) {
      for (const sp of def.spells) {
        if (!U.chance(sp.chance)) continue;
        cb.spellSlots--;
        UI.log(name + ' casts ' + sp.name + '!', 'bad');
        UI.sfx(sp.fx === 'heal' ? 'spell_heal' : 'spell_' + (sp.fx || 'generic'));
        if (sp.kind !== 'heal') UI.spellFx(sp.fx || 'generic');
        if (sp.kind === 'heal') {
          const h = U.rollD(sp.dmg);
          m.hp = Math.min(m.maxhp, m.hp + h);
          UI.log(name + ' is healed.', 'bad');
        } else if (sp.kind === 'para') {
          const t = U.pick(anyTargets());
          if (t) inflict(t, 'paralyzed');
        } else {
          const all = anyTargets();
          const tg = sp.kind === 'party' ? all : sp.kind === 'several' ? U.shuffle(all).slice(0, 2 + U.rand(2)) : [U.pick(all)];
          for (const t of tg) if (t) hurt(t, U.rollD(sp.dmg), sp.el, true);
        }
        return;
      }
    }
    if (g.dist > 10) return; // advances at end of round
    // melee: only so many foes fit around the front rank each round
    if (cb.meleeSlots <= 0) return;
    cb.meleeSlots--;
    for (let a = 0; a < def.atk; a++) {
      const tg = frontTargets();
      if (!tg.length) return;
      const t = U.pick(tg);
      const roll = 1 + U.rand(20);
      const ac = t.summon ? t.ac + (cb.buff.ac || 0) : partyAC(t);
      if (roll === 1 || (roll !== 20 && roll + def.lvl + ac + 5 < 20)) {
        UI.log(name + ' attacks ' + nm(t) + ' and misses.');
        UI.sfx('miss', { volume: 0.5 });
        continue;
      }
      let d = Math.round(U.rollD(def.dmg) * (1 + def.lvl / 14));
      if (t._parry) d = Math.ceil(d / 2);
      if (def.undead && BT.G.faith === 'root') d = Math.ceil(d * 0.75); // the dead remember the Root
      UI.sfx('monster_hit');
      const dealt = hurt(t, d, null, false);
      UI.log(name + ' hits ' + nm(t) + ' for ' + dealt + '.', 'bad');
      if (t.hp > 0 && !t.summon) {
        if (def.poison && U.chance(def.poison)) inflict(t, 'poisoned');
        if (def.para && U.chance(def.para)) inflict(t, 'paralyzed');
        if (def.stone && U.chance(def.stone)) inflict(t, 'stoned');
      }
      if (def.drain && U.chance(def.drain)) {
        const extra = Math.ceil(dealt / 2);
        m.hp = Math.min(m.maxhp, m.hp + extra);
        if (t.hp > 0) { hurt(t, extra, 'dark', false); UI.log(name + ' drains ' + nm(t) + '\'s life!', 'bad'); }
      }
      if (!anyTargets().length) return;
    }
  }

  async function endOfRound() {
    const G = BT.G;
    // songs
    const s = cb.song;
    if (s && s.regen) {
      for (const c of G.party) if (ST.alive(c) && c.hp < c.maxhp) c.hp = Math.min(c.maxhp, c.hp + Math.round(s.regen * s.power));
    }
    if (s && s.lull) {
      const g = cb.groups.find((x) => groupAlive(x) && !x.def.nosleep && x.sleep <= 0);
      if (g && U.chance(0.4)) { g.sleep = 1; UI.log('The lullaby lulls the ' + U.esc(g.def.pl) + ' to sleep.', 'good'); }
    }
    if (s && s.requiem) {
      for (const g of cb.groups) {
        if (!g.def.undead || !groupAlive(g)) continue;
        let t = 0;
        for (const m of liveMembers(g)) t += hitMonster(g, m, U.roll(2, 6, Math.floor(s.bard.level / 2)) * s.power | 0, 'holy');
        if (t) UI.log('The Requiem wracks the ' + U.esc(g.def.pl) + ' for ' + t + '.', 'hit');
      }
    }
    // regen & advance
    for (const g of cb.groups) {
      if (!groupAlive(g)) continue;
      if (g.def.regen) for (const m of liveMembers(g)) m.hp = Math.min(m.maxhp, m.hp + g.def.regen);
      if (g.dist > 10 && !(g.sleep > 0 || g.held > 0 || cb.timestop > 0)) g.dist -= 10;
      if (g.sleep > 0) g.sleep--;
      if (g.held > 0) g.held--;
    }
    if (cb.timestop > 0) cb.timestop--;
    // poison, paralysis wearing off
    for (const c of G.party) {
      if (c.status === 'paralyzed' && U.chance(0.2)) { c.status = 'ok'; UI.log(nm(c) + ' can move again!', 'good'); }
      if (c.status === 'poisoned') {
        const d = U.roll(1, 3 + Math.floor(c.maxhp / 30));
        c.hp -= d;
        UI.floatText(c, '-' + d, 'dmg');
        if (c.hp <= 0) { c.hp = 0; c.status = 'dead'; UI.log(nm(c) + ' succumbs to poison!', 'bad'); UI.sfx('death'); }
      }
      c._parry = false;
    }
    UI.renderParty();
    UI.showMonsters(cb.groups);
  }

  function partyDefeated() { return !BT.G.party.some(ST.canAct); }
  function monstersDefeated() { return !cb.groups.some(groupAlive); }

  async function runAway() {
    if (cb.opts.noRun) { UI.log('There is no escape!', 'bad'); return false; }
    if (cb.song && cb.song.swift) return true;
    const P = BT.ST.living();
    const pl = P.reduce((a, c) => a + c.level, 0) / Math.max(1, P.length);
    const ml = Math.max.apply(null, cb.groups.filter(groupAlive).map((g) => g.def.lvl));
    const lk = P.reduce((a, c) => a + ST.stat(c, 'lk'), 0) / Math.max(1, P.length);
    return U.chance(U.clamp(0.45 + (pl - ml) * 0.05 + (lk - 12) * 0.02, 0.1, 0.9));
  }

  async function step(fn) {
    await fn();
    UI.renderParty();
    UI.showMonsters(cb.groups);
    await U.sleep(CB.delay);
  }

  // ---------- main ----------
  // spec: [[monsterId, count], ...]
  CB.fight = async function (spec, opts) {
    opts = opts || {};
    const G = BT.G;
    cb = {
      groups: makeGroups(spec), opts, buff: { ac: 0, hit: 0, dmg: 0 }, song: null, timestop: opts.timestop || 0, kills: [], round: 0,
    };
    G.stats.battles++;
    if (G.fx.song) {
      const sd = D.SONGS.find((s) => s.id === G.fx.song.id);
      cb.song = Object.assign({}, sd, { power: G.fx.song.power || 1, bard: G.party.find((c) => c.cls === 'bard') || G.party[0] });
    }
    // battle music by terrain: underground / city / wilderness (falls back to the generic track)
    const battle = BT.STYLES[BT.MAPS[G.map].style].battle;
    const music = opts.boss ? 'boss' : battle && BT.audio && BT.audio.musicTracks.indexOf(battle) >= 0 ? battle : 'combat';
    if (BT.audio) BT.audio.music(music);
    UI.sfx(opts.boss ? 'roar' : 'encounter');
    BT.R.shake(opts.boss ? 12 : 5);
    UI.showMonsters(cb.groups);
    UI.log('<span class="enc">' + (opts.text ? opts.text : 'You face ' + summary() + '!') + '</span>');
    let result = null;
    let first = true;
    while (!result) {
      cb.round++;
      UI.showMonsters(cb.groups);
      let cmds = null;
      let fled = false;
      const choice = await UI.menu({
        title: first ? 'Encounter!' : 'Round ' + cb.round,
        text: 'You face ' + summary() + '.',
        options: [
          { label: 'Fight', key: 'f', value: 'fight' },
          { label: 'Run', key: 'r', value: 'run', disabled: !!opts.noRun },
        ],
      });
      first = false;
      if (choice === 'run') {
        if (await runAway()) { fled = true; }
        else { UI.log('You fail to escape!', 'bad'); cmds = new Map(); }
      } else {
        cmds = await chooseCommands();
      }
      if (fled) { UI.sfx('flee'); UI.log('The party flees!'); result = 'fled'; break; }

      // Build initiative queue
      const queue = [];
      cb.meleeSlots = 2 * Math.max(1, frontTargets().length);
      cb.spellSlots = 3; // the air can only hold so much hostile magic
      for (const [ch, c] of cmds) {
        let init = U.rand(10) + D.statBonus(ST.stat(ch, 'dx')) * 2 + ch.level / 3;
        if (cb.buff.haste) init += 5;
        if (cb.song && cb.song.swift) init += 10;
        queue.push({ init, fn: () => partyAct(ch, c) });
      }
      if (G.summon) { const s = G.summon; queue.push({ init: U.rand(10) + 3, fn: () => summonAct(s) }); }
      for (const g of cb.groups) {
        if (!groupAlive(g)) continue;
        // only the front of a group can reach the party each round
        for (const m of liveMembers(g).slice(0, 4)) queue.push({ init: U.rand(10) + g.def.lvl / 2, fn: () => monsterAct(g, m), mon: true });
      }
      queue.sort((a, b) => b.init - a.init);
      for (const q of queue) {
        if (monstersDefeated() || partyDefeated()) break;
        await step(q.fn);
      }
      if (monstersDefeated()) { result = 'win'; break; }
      if (partyDefeated()) { result = 'lose'; break; }
      await endOfRound();
      if (monstersDefeated()) { result = 'win'; break; }
      if (partyDefeated()) { result = 'lose'; break; }
    }
    for (const c of G.party) {
      c._parry = false; c._hidden = false;
      if (c.status === 'paralyzed' && result !== 'lose') { c.status = 'ok'; UI.log(nm(c) + ' shakes off the paralysis.'); }
    }
    const kills = cb.kills;
    cb = null;
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
    if (gold) {
      const share = Math.floor(gold / living.length);
      for (const c of living) c.gold += share;
      lines += ' You find ' + gold + ' gold.';
      UI.sfx('coin');
    }
    UI.log(lines, 'good');
    const lvls = living.filter((c) => ST.canLevel(c) && !c._notified);
    for (const c of lvls) { c._notified = true; UI.log(nm(c) + ' has earned enough experience to advance! Visit the Hall of Review.', 'good'); }
    UI.renderParty();
    for (const id of opts.items || []) {
      const who = ST.giveParty(id);
      UI.sfx('quest');
      if (who) UI.log(nm(who) + ' takes the <span class="item">' + U.esc(BT.ITEMS[id].name) + '</span>.', 'good');
      else UI.log('No one has room for the ' + U.esc(BT.ITEMS[id].name) + '! (It stays here.)', 'bad');
    }
    const depth = BT.MAPS[G.map].depth || 0;
    if (opts.chest || (!opts.noChest && U.chance(depth ? 0.3 : 0.12))) await CB.chest(Math.max(1, depth), opts.chestItems);
  }

  // Treasure chest with optional trap.
  CB.chest = async function (tier, fixedItems) {
    const G = BT.G;
    const traps = [null, null, { name: 'poison needle', dmg: [1, 6], status: 'poisoned', one: true }, { name: 'blade trap', dmg: [2, 8], one: true },
      { name: 'gas cloud', dmg: [1, 6], status: 'poisoned' }, { name: 'lightning rune', dmg: [3, 6] }, { name: 'stone curse', dmg: [0, 0], status: 'stoned', one: true }, { name: 'explosion', dmg: [4, 6] }];
    const trap = U.pick(traps.slice(0, 2 + tier + 1));
    let known = false;
    const ov = document.getElementById('overlay');
    ov.innerHTML = '<div class="chest">' + chestSvg() + '</div>';
    ov.className = 'show chestov';
    for (;;) {
      const c = await UI.menu({
        title: 'A treasure chest!', text: known ? (trap ? 'It is trapped with a <b>' + trap.name + '</b>.' : 'It does not seem to be trapped.') : 'It may be trapped.',
        options: [
          { label: 'Open it', key: 'o', value: 'open' },
          { label: 'Inspect for traps', key: 'i', value: 'inspect' },
          { label: 'Disarm trap', key: 'd', value: 'disarm' },
          { label: 'Leave it', key: 'l', value: 'leave' },
        ], cancel: 'leave',
      });
      if (c === 'leave') break;
      const who = c === 'open' ? G.party.find(ST.canAct) : await UI.pickMember(c === 'inspect' ? 'Who inspects the chest?' : 'Who disarms it?', ST.canAct);
      if (!who) continue;
      const skill = who.cls === 'rogue' ? 0.5 + who.level * 0.05 : 0.15 + D.statBonus(ST.stat(who, 'dx')) * 0.05;
      if (c === 'inspect') {
        if (U.chance(skill + 0.2) || G.fx.trapsense > 0) { known = true; UI.log(U.esc(who.name) + (trap ? ' spots a ' + trap.name + '.' : ' finds no trap.')); }
        else UI.log(U.esc(who.name) + ' sees nothing unusual.');
        continue;
      }
      let disarmed = !trap;
      if (c === 'disarm' && trap) {
        if (U.chance(skill)) { disarmed = true; UI.log(U.esc(who.name) + ' disarms the ' + trap.name + '!', 'good'); }
        else UI.log(U.esc(who.name) + ' fumbles the trap...', 'bad');
      }
      if (!disarmed) {
        UI.sfx('trap');
        BT.R.shake(8);
        UI.log('The ' + trap.name + ' goes off!', 'bad');
        const victims = trap.one ? [who] : G.party.filter(ST.alive);
        for (const v of victims) {
          if (trap.dmg[0]) {
            const d = U.rollD(trap.dmg) * Math.max(1, tier);
            v.hp -= d; UI.floatText(v, '-' + d, 'dmg');
            if (v.hp <= 0) { v.hp = 0; v.status = 'dead'; UI.log(nm(v) + ' is killed!', 'bad'); }
          }
          if (trap.status && v.status === 'ok' && U.chance(0.6)) { v.status = trap.status; UI.log(nm(v) + ' is ' + trap.status + '!', 'bad'); }
        }
        UI.renderParty();
      }
      // loot
      UI.sfx('chest');
      const gold = U.roll(tier * 2, 30, tier * 20);
      const living = ST.living();
      for (const ch of living) ch.gold += Math.floor(gold / living.length);
      UI.log('Inside the chest: ' + gold + ' gold.', 'good');
      UI.sfx('coin');
      const items = fixedItems ? fixedItems.slice() : [];
      if (!fixedItems && U.chance(0.55)) items.push(U.pick(BT.LOOT[Math.min(BT.LOOT.length - 1, tier - 1)]));
      if (!fixedItems && U.chance(0.15) && tier < BT.LOOT.length) items.push(U.pick(BT.LOOT[tier]));
      for (const id of items) {
        const r = ST.giveParty(id);
        if (r) { UI.log(nm(r) + ' finds <span class="item">' + U.esc(BT.ITEMS[id].name) + '</span>!', 'good'); UI.sfx('quest'); }
        else UI.log('You find ' + U.esc(BT.ITEMS[id].name) + ' but no one can carry it.', 'bad');
      }
      UI.renderParty();
      break;
    }
    UI.hideOverlay();
  };

  function chestSvg() {
    return '<svg viewBox="0 0 200 160" width="100%" height="100%"><defs><linearGradient id="chw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a2b"/><stop offset="1" stop-color="#4a2c12"/></linearGradient>' +
      '<radialGradient id="chg" cx="0.5" cy="0.4" r="0.6"><stop offset="0" stop-color="#ffe9a0" stop-opacity="0.9"/><stop offset="1" stop-color="#ffb030" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="100" cy="70" rx="90" ry="60" fill="url(#chg)"/>' +
      '<rect x="30" y="70" width="140" height="70" rx="6" fill="url(#chw)" stroke="#2a1606" stroke-width="4"/>' +
      '<path d="M30 72 Q100 10 170 72 Z" fill="url(#chw)" stroke="#2a1606" stroke-width="4"/>' +
      '<rect x="26" y="66" width="148" height="10" fill="#c9a24a" stroke="#5a4214" stroke-width="2"/>' +
      '<rect x="60" y="40" width="10" height="100" fill="#c9a24a" opacity="0.9"/><rect x="130" y="40" width="10" height="100" fill="#c9a24a" opacity="0.9"/>' +
      '<rect x="88" y="70" width="24" height="28" rx="3" fill="#e8c860" stroke="#5a4214" stroke-width="2"/><circle cx="100" cy="82" r="4" fill="#3a2a08"/></svg>';
  }

  BT.CB = CB;
})();
