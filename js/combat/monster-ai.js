// A monster's turn: breath, spells, then closing in and striking (within the anti-swarm caps).
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MA = BT.MA, HX = BT.HX;
  const CB = BT.CB, K = CB.K;

  async function monsterTurn(u) {
    if (!K.alive(u)) return;
    const g = u.g, m = u.m, def = g.def;
    if (g.sleep > 0 || g.held > 0 || CB.S.timestop > 0) return;
    K.V('setActive', u);
    const name = U.cap(K.theName(def));
    const engagedNow = K.adjHeroes(u).length > 0;
    // "in melee range" for spell choice: adjacent, or close enough to engage this turn
    const closeIn = engagedNow || K.heroes().some((h) => HX.dist(u, h) <= K.monSpeed(def) + 1);
    // special abilities
    if (def.breath && (CB.S.spellSlots > 0 || def.boss) && U.chance(def.breath.chance) && (!def.breath.melee || engagedNow)) {
      CB.S.spellSlots--;
      const b = def.breath;
      UI.log(name + ' unleashes ' + b.name + '!', 'bad');
      UI.sfx(b.fx === 'ice' ? 'spell_ice' : b.fx === 'fire' ? 'spell_fire' : 'roar');
      UI.spellFx(b.fx);
      BT.R.shake(10);
      const pool = (b.melee ? K.adjHeroes(u) : K.heroes()).map((h) => h.ch);
      const tg = U.shuffle(pool).slice(0, b.targets || 2);
      for (const t of tg) {
        if (b.dmg && b.dmg[0]) K.hurt(t, U.rollD(b.dmg), b.el, true);
        if (b.stone && U.chance(b.stone)) K.inflict(t, 'stoned');
      }
      return;
    }
    if (def.spells && (CB.S.spellSlots > 0 || def.boss) && (!closeIn || U.chance(0.6))) {
      for (const sp of def.spells) {
        if (!U.chance(sp.chance)) continue;
        CB.S.spellSlots--;
        UI.log(name + ' casts ' + sp.name + '!', 'bad');
        UI.sfx(sp.fx === 'heal' ? 'spell_heal' : 'spell_' + (sp.fx || 'generic'));
        if (sp.kind !== 'heal') UI.spellFx(sp.fx || 'generic');
        if (sp.kind === 'heal') {
          const h = U.rollD(sp.dmg);
          m.hp = Math.min(m.maxhp, m.hp + h);
          UI.log(name + ' is healed.', 'bad');
        } else if (sp.kind === 'para') {
          const t = U.pick(K.heroes());
          if (t) K.inflict(t.ch, 'paralyzed');
        } else {
          const all = K.heroes().map((h) => h.ch);
          const tg = sp.kind === 'party' ? all : sp.kind === 'several' ? U.shuffle(all).slice(0, 2 + U.rand(2)) : [U.pick(all)];
          for (const t of tg) if (t) K.hurt(t, U.rollD(sp.dmg), sp.el, true);
        }
        return;
      }
    }
    // melee: strike an adjacent hero who is not already beset, else close in
    const open = () => K.adjHeroes(u).filter((h) => (CB.S.engaged.get(h) || 0) < CB.MELEE_CAP);
    if (!open().length) {
      const moved = await K.approach(u, null, K.monSpeed(def), true);
      if (!moved && !K.adjHeroes(u).length) await K.approach(u, null, K.monSpeed(def), false);
    }
    const cands = open();
    if (!cands.length) return;
    const tu = U.pick(cands);
    CB.S.engaged.set(tu, (CB.S.engaged.get(tu) || 0) + 1);
    K.V('lunge', u, tu);
    for (let a = 0; a < def.atk; a++) {
      const t = tu.ch;
      if (!K.alive(tu)) break;
      const roll = 1 + U.rand(20);
      const ac = t.summon ? t.ac + (CB.S.buff.ac || 0) : K.partyAC(t);
      if (roll === 1 || (roll !== 20 && roll + def.lvl + ac + 5 < 20)) {
        UI.log(name + ' attacks ' + K.nm(t) + ' and misses.');
        UI.sfx('miss', { volume: 0.5 });
        continue;
      }
      let d = Math.round(U.rollD(def.dmg) * (1 + def.lvl / 14));
      if (t._parry) d = Math.ceil(d / 2);
      if (def.undead && BT.G.faith === 'root') d = Math.ceil(d * 0.75); // the dead remember the Root
      UI.sfx('monster_hit');
      const dealt = K.hurt(t, d, null, false);
      UI.log(name + ' hits ' + K.nm(t) + ' for ' + dealt + '.', 'bad');
      if (t.hp > 0 && !t.summon) {
        if (def.poison && U.chance(def.poison)) K.inflict(t, 'poisoned');
        if (def.para && U.chance(def.para)) K.inflict(t, 'paralyzed');
        if (def.stone && U.chance(def.stone)) K.inflict(t, 'stoned');
      }
      if (def.drain && U.chance(def.drain)) {
        const extra = Math.ceil(dealt / 2);
        m.hp = Math.min(m.maxhp, m.hp + extra);
        if (t.hp > 0) { K.hurt(t, extra, 'dark', false); UI.log(name + ' drains ' + K.nm(t) + '\'s life!', 'bad'); }
      }
    }
  }

  Object.assign(K, { monsterTurn });
})();
