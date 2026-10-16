// Damage and status effects: monsters hurting heroes, heroes hurting monsters.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MA = BT.MA, HX = BT.HX;
  const CB = BT.CB, K = CB.K;

  // ---------- damage to party ----------
  function hurt(ch, dmg, el, magical) {
    if (ch.hp <= 0 || ch.status === 'dead') return 0;
    let d = dmg;
    if (magical && CB.S && CB.S.buff.resist) d = Math.floor(d / 2);
    if (el === 'ice' && BT.G.faith === 'pale' && !ch.summon) d = Math.floor(d / 2); // the Still Mother's Hush
    if (el && !ch.summon) {
      for (const it of ch.inv) if (it.eq && BT.ITEMS[it.id].resist === el) { d = Math.floor(d / 2); break; }
      if (magical) for (const it of ch.inv) if (it.eq && BT.ITEMS[it.id].resist === 'magic') { d = Math.floor(d * 0.7); break; }
    }
    d = Math.max(1, d);
    ch.hp -= d;
    UI.floatText(ch, '-' + d, 'dmg');
    const u = CB.unitFor(ch);
    if (u) K.V('float', u, '-' + d, 'dmg');
    if (ch.hp <= 0) {
      ch.hp = 0;
      if (ch.summon) {
        UI.log(K.nm(ch) + ' is destroyed and fades away!', 'bad');
        BT.G.summon = null;
      } else {
        ch.status = 'dead';
        UI.log(K.nm(ch) + ' has been killed!', 'bad');
        UI.sfx('death');
      }
      if (u) K.V('kill', u);
    }
    return d;
  }

  function inflict(ch, status) {
    if (ch.summon || !ST.alive(ch)) return false;
    if (ch.cls === 'paladin' && U.chance(0.5)) { UI.log(K.nm(ch) + ' resists with holy fortitude.'); return false; }
    if (U.chance(ST.stat(ch, 'lk') / 60)) { UI.log(K.nm(ch) + ' luckily shrugs it off.'); return false; }
    if (status === 'poisoned' && ch.status !== 'ok') return false;
    if (status === 'paralyzed' && ch.status === 'stoned') return false;
    ch.status = status;
    UI.sfx(status === 'poisoned' ? 'poison' : 'debuff');
    UI.log(K.nm(ch) + ' is ' + status + '!', 'bad');
    return true;
  }

  // ---------- damage to monsters ----------
  function hitMonster(g, m, dmg, el, attacker, magical) {
    let d = dmg;
    if (magical && g.def.mres) d = Math.floor(d * g.def.mres);
    if (BT.G.faith === 'dawn' && g.def.undead) d = Math.floor(d * 1.5); // Blessing of the Kindled Sun
    if (el && g.def.resist && g.def.resist[el] != null) d = Math.floor(d * g.def.resist[el]);
    if (d <= 0) { UI.log(U.cap(K.theName(g.def)) + ' is unharmed!'); return 0; }
    m.hp -= d;
    if (m.unit) { K.V('hit', m.unit); K.V('float', m.unit, '-' + d, 'dmg'); }
    if (m.hp <= 0) {
      m.hp = 0;
      CB.S.kills.push(g.def);
      BT.G.stats.kills++;
      UI.sfx('monster_die');
      UI.log(U.cap(K.theName(g.def)) + ' ' + (g.def.undead ? 'is destroyed' : 'falls') + '!', 'kill');
      if (g.def.boss) BT.R.shake(14);
    }
    return d;
  }

  Object.assign(K, { hurt, inflict, hitMonster });
})();
