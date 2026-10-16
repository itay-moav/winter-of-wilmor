// Spell and item effects shared by exploration and combat.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MG = BT.MG;
  const MA = {};

  MA.antiMagic = function () {
    const G = BT.G, m = BT.MAPS[G.map];
    return !!(m.fl[G.y][G.x] & MG.F_ANTI);
  };

  // Scaled dice for a spell cast at a given caster level.
  MA.spellDice = function (s, lvl) {
    const d = s.dmg || s.heal;
    if (!Array.isArray(d)) return d;
    const extra = s.scale ? Math.floor(lvl / s.scale) : 0;
    return [d[0] + extra, d[1], d[2] || 0];
  };

  MA.heal = function (target, s, lvl) {
    let msg = '';
    if (s.raise && target.status === 'dead') {
      target.status = 'ok';
      target.hp = 1;
      msg += U.esc(target.name) + ' returns to life! ';
    }
    if (target.status === 'dead') return U.esc(target.name) + ' is beyond such magic.';
    if (s.heal) {
      const before = target.hp;
      if (s.heal === 'full') target.hp = target.maxhp;
      else target.hp = Math.min(target.maxhp, target.hp + U.rollD(MA.spellDice(s, lvl)));
      const gained = target.hp - before;
      if (gained > 0) { msg += U.esc(target.name) + ' is healed for ' + gained + '. '; UI.floatText(target, '+' + gained, 'heal'); }
    }
    if (s.cure && s.cure.indexOf(target.status) >= 0) {
      msg += U.esc(target.name) + ' is cured of being ' + target.status + '. ';
      target.status = 'ok';
    }
    return msg || 'Nothing happens.';
  };

  MA.summon = function (mid) {
    const md = BT.MONSTERS[mid];
    const hp = U.rollD(md.hp);
    BT.G.summon = { id: 'summon', summon: true, mid, name: md.name, hp, maxhp: hp, ac: md.ac, level: md.lvl, status: 'ok', cls: 'summon' };
    UI.renderParty();
    return 'A ' + U.esc(md.name) + ' answers the call and joins the party!';
  };

  // Non-combat effects. Returns true if the spell was cast (SP spent).
  MA.exploreEffect = async function (caster, s) {
    const G = BT.G, m = BT.MAPS[G.map], fx = G.fx;
    const lvl = caster.level || 1;
    if (s.target === 'ally') {
      const t = await UI.pickMember('Cast ' + s.name + ' on whom?', (c) => (s.raise ? c.status === 'dead' : c.status !== 'dead'));
      if (!t) return false;
      UI.sfx('spell_heal');
      UI.spellFx('heal');
      UI.log(MA.heal(t, s, lvl), 'good');
      return true;
    }
    if (s.target === 'party' && (s.heal || s.raise || s.cure)) {
      UI.sfx('spell_heal');
      UI.spellFx('heal');
      for (const c of G.party) UI.log(MA.heal(c, s, lvl), 'good');
      return true;
    }
    if (s.light) {
      fx.light = { r: s.light, steps: s.steps, secret: !!s.secret };
      UI.sfx('spell_generic');
      UI.log('A soft light fills the area' + (s.secret ? ', revealing hidden doors.' : '.'), 'good');
      BT.R.invalidate();
      return true;
    }
    if (s.compass) { fx.compass = s.compass; UI.sfx('buff'); UI.log('A glowing compass rose appears before you.', 'good'); return true; }
    if (s.levitate) { fx.levitate = s.levitate; UI.sfx('buff'); UI.log('The party floats a hand\'s breadth off the ground.', 'good'); return true; }
    if (s.trapsense) { fx.trapsense = Math.max(fx.trapsense, s.trapsense); UI.sfx('buff'); UI.log('Your senses sharpen: traps will reveal themselves.', 'good'); return true; }
    if (s.scry) {
      UI.sfx('spell_generic');
      UI.log('You are in <b>' + U.esc(m.name) + '</b>, ' + G.x + ' east and ' + G.y + ' south of the north-west corner, facing ' + U.DIRNAME[G.d] + '.', 'info');
      return true;
    }
    if (s.phase) {
      if (m.style === 'town') { UI.log('The walls of the city resist your magic.'); return true; }
      const nx = G.x + U.DX[G.d], ny = G.y + U.DY[G.d];
      if (!MG.inside(m, nx, ny)) { UI.log('Solid rock lies beyond. The spell fizzles.'); return true; }
      MG.setEdge(m, G.x, G.y, G.d, 0);
      UI.sfx('teleport');
      UI.log('The wall before you shimmers and fades away!', 'good');
      BT.R.invalidate();
      return true;
    }
    if (s.recall) {
      if (m.style === 'town') { UI.log('You are already in the city.'); return true; }
      UI.sfx('teleport');
      UI.spellFx('generic');
      await BT.EX.changeMap('town', 2, 1, 1);
      UI.log('With a rush of wind you appear before the Adventurers\' Guild.', 'good');
      return true;
    }
    if (s.teleport) {
      if (m.style === 'town') { UI.log('The city\'s wards block teleportation.'); return false; }
      const v = await UI.input('Teleport to which square? Enter "x y" (0-' + (m.w - 1) + ', 0-' + (m.h - 1) + '). You are at ' + G.x + ' ' + G.y + '.', 'x y');
      if (!v) return false;
      const p = v.split(/[\s,]+/).map(Number);
      if (p.length < 2 || isNaN(p[0]) || isNaN(p[1]) || !MG.inside(m, p[0], p[1])) { UI.log('The spell fails to find that place.'); return true; }
      if (m.fl[p[1]][p[0]] & MG.F_ANTI) { UI.log('An anti-magic field repels you.'); return true; }
      UI.sfx('teleport');
      UI.spellFx('generic');
      G.x = p[0]; G.y = p[1];
      BT.R.snap();
      UI.log('The world twists around you...', 'good');
      await BT.EX.arrive(true);
      return true;
    }
    if (s.reveal) {
      G.flags['reveal_' + G.map] = true;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) ST.markExplored(G.map, x, y);
      UI.sfx('spell_generic');
      UI.log('The whole maze unfolds in your mind.', 'good');
      return true;
    }
    if (s.summon) {
      if (G.summon && !(await UI.confirm('Your current ally will be dismissed. Continue?'))) return false;
      UI.sfx('spell_dark');
      UI.log(MA.summon(s.summon), 'good');
      return true;
    }
    UI.log('That spell can only be cast in combat.');
    return false;
  };

  // Spell menu for a caster. Returns spell or null.
  MA.chooseSpell = async function (ch, inCombat) {
    const list = ST.knownSpells(ch).filter((s) => (inCombat ? s.when !== 'explore' : s.when !== 'combat'));
    if (!list.length) { UI.log(U.esc(ch.name) + ' knows no ' + (inCombat ? 'battle' : 'such') + ' spells.'); return null; }
    const options = list.map((s) => ({
      label: '<span class="code">' + s.code + '</span> ' + s.name, value: s, key: null,
      hint: s.sp + ' SP', disabled: ch.sp < s.sp,
    }));
    // keys: letters a.. to avoid clashing with digits for long lists
    options.forEach((o, i) => { o.key = i < 9 ? String(i + 1) : String.fromCharCode(97 + i - 9); });
    return UI.menu({ title: U.esc(ch.name) + ' - ' + ch.sp + ' SP', text: 'Choose a spell:', options, cancel: null });
  };

  MA.castOutside = async function (ch) {
    if (!ST.canAct(ch)) { UI.log(U.esc(ch.name) + ' is in no condition to cast.'); return; }
    const s = await MA.chooseSpell(ch, false);
    if (!s) return;
    if (MA.antiMagic()) { UI.sfx('error'); UI.log('The spell dies on your lips. This place drinks magic.', 'bad'); ch.sp -= s.sp; UI.renderParty(); return; }
    const ok = await MA.exploreEffect(ch, s);
    if (ok) { ch.sp -= s.sp; UI.renderParty(); UI.updateHud(); }
  };

  // Using an item outside combat.
  MA.useOutside = async function (ch, it) {
    const d = BT.ITEMS[it.id];
    const u = d.use;
    if (!u) { UI.log('Nothing happens.'); return; }
    if (!ST.canAct(ch)) { UI.log(U.esc(ch.name) + ' cannot do that now.'); return; }
    let used = false;
    if (u.light) {
      BT.G.fx.light = { r: u.light, steps: u.steps, secret: false };
      UI.sfx('door'); UI.log(U.esc(ch.name) + ' lights a torch.', 'good'); used = true; BT.R.invalidate();
    } else if (u.heal || u.cure || u.sp || u.raise) {
      const t = await UI.pickMember('Use ' + d.name + ' on whom?', (c) => (u.raise ? c.status === 'dead' : c.status !== 'dead'));
      if (!t) return;
      UI.log(MA.applyItem(t, u), 'good');
      UI.sfx('drink');
      used = true;
    } else if (u.spell) {
      const s = BT.SPELLS[u.spell];
      if (s.when === 'combat') { UI.log('That can only be used in combat.'); return; }
      if (MA.antiMagic()) { UI.log('Nothing happens here.'); return; }
      used = await MA.exploreEffect(ch, s);
    }
    if (used) MA.consume(ch, it);
    UI.renderParty();
    UI.updateHud();
  };

  MA.applyItem = function (t, u) {
    let msg = '';
    if (u.raise && t.status === 'dead') { t.status = 'ok'; t.hp = Math.max(1, Math.floor(t.maxhp / 4)); msg += U.esc(t.name) + ' rises from death! '; }
    if (t.status === 'dead') return 'It has no effect on the dead.';
    if (u.heal) { const b = t.hp; t.hp = Math.min(t.maxhp, t.hp + U.rollD(u.heal)); msg += U.esc(t.name) + ' heals ' + (t.hp - b) + '. '; UI.floatText(t, '+' + (t.hp - b), 'heal'); }
    if (u.sp && !t.summon) { const mx = ST.maxSp(t); if (mx) { const b = t.sp; t.sp = Math.min(mx, t.sp + U.rollD(u.sp)); msg += U.esc(t.name) + ' regains ' + (t.sp - b) + ' SP. '; } }
    if (u.cure && u.cure.indexOf(t.status) >= 0) { msg += U.esc(t.name) + ' is no longer ' + t.status + '. '; t.status = 'ok'; }
    return msg || 'Nothing happens.';
  };

  MA.consume = function (ch, it) {
    const d = BT.ITEMS[it.id];
    if (d.consumable) ch.inv.splice(ch.inv.indexOf(it), 1);
    else if (it.ch != null) {
      it.ch--;
      if (it.ch <= 0) {
        if (d.slot === 'use') { ch.inv.splice(ch.inv.indexOf(it), 1); UI.log('The ' + d.name + ' crumbles to dust.'); }
        else { delete it.ch; UI.log('The magic of the ' + d.name + ' is spent.'); }
      }
    }
  };

  MA.usableItems = function (ch, inCombat) {
    return ch.inv.filter((it) => {
      const d = BT.ITEMS[it.id];
      if (!d.use) return false;
      if (d.use.charges && it.ch == null) return false;
      if (d.use.spell) {
        const s = BT.SPELLS[d.use.spell];
        return inCombat ? s.when !== 'explore' : s.when !== 'combat';
      }
      if (d.use.light) return !inCombat;
      return true;
    });
  };

  BT.MA = MA;
})();
