// The player's orders for a hero: the action menu, picking targets and hexes (keyboard or mouse).
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MA = BT.MA, HX = BT.HX;
  const CB = BT.CB, K = CB.K;

  // ---------- party commands ----------
  async function commandFor(u, mp, moved) {
    const ch = u.ch;
    for (;;) {
      K.V('setActive', u);
      const reach = K.reachOf(u, mp);
      const targets = K.attackable(u, mp);
      const spells = ST.knownSpells(ch).filter((s) => s.when !== 'explore');
      const items = MA.usableItems(ch, true);
      const isBard = ch.cls === 'bard' && ST.equipped(ch, 'instrument');
      const ranged = K.isRanged(ch);
      K.V('highlight', { reach: mp ? reach : null, targets: targets.map((t) => t.unit) });
      const opts = [
        { label: ranged ? 'Shoot' : 'Attack', key: 'a', value: 'attack', disabled: !targets.length, hint: targets.length ? '' : 'no foe in reach' },
        mp && reach.size > 1 ? { label: 'Move', key: 'm', value: 'move', hint: mp + ' hexes' } : null,
        spells.length ? { label: 'Cast spell', key: 'c', value: 'cast', disabled: ch.sp < Math.min.apply(null, spells.map((s) => s.sp)) } : null,
        isBard ? { label: 'Sing', key: 's', value: 'sing', hint: 'voice ' + ch.voice } : null,
        items.length ? { label: 'Use item', key: 'u', value: 'use' } : null,
        { label: 'Defend', key: 'p', value: 'parry', hint: 'AC -4' },
        ch.cls === 'rogue' ? { label: 'Hide in shadows', key: 'h', value: 'hide' } : null,
        moved ? { label: 'End turn', key: 'e', value: 'end' } : null,
        { label: 'Auto (this turn)', key: 't', value: 'auto' },
        { label: 'Auto-battle', key: 'z', value: 'autoall', hint: 'Esc stops' },
        { label: 'Flee', key: 'r', value: 'flee', disabled: !!CB.S.opts.noRun },
      ];
      const click = K.V('waitClick');
      const menu = UI.menu({ title: U.esc(ch.name) + (moved ? ' <span class="mhint">moved</span>' : ''), text: 'Foes: ' + K.summary() + '. Click a foe to attack or a hex to move.', options: opts });
      const pick = click ? await Promise.race([menu, click]) : await menu;
      if (pick && pick.hex) {
        UI.cancelMenu();
        const t = targets.find((x) => x.unit.c === pick.hex.c && x.unit.r === pick.hex.r);
        if (t) return { t: 'attack', target: t.unit, move: t.from ? HX.path(t.reach, t.from.c, t.from.r) : null };
        const h = reach.get(HX.key(pick.hex.c, pick.hex.r));
        if (mp && h && h.d > 0) return { t: 'move', path: HX.path(reach, h.c, h.r) };
        continue;
      }
      K.V('clearClick');
      if (pick === 'end') return { t: 'end' };
      if (pick === 'parry') return { t: 'parry' };
      if (pick === 'hide') return { t: 'hide' };
      if (pick === 'flee') return { t: 'flee' };
      if (pick === 'auto') return K.aiParty(u, mp);
      if (pick === 'autoall') { CB.S.autoAll = true; K.V('autoBanner', true); return K.aiParty(u, mp); }
      if (pick === 'move') {
        K.V('highlight', { reach, targets: [] });
        const h = await K.V('pickHex', [...reach.values()].filter((x) => x.d > 0), u);
        if (!h) continue;
        return { t: 'move', path: HX.path(reach, h.c, h.r) };
      }
      if (pick === 'attack') {
        const t = await pickTarget(ranged ? 'Shoot whom?' : 'Attack whom?', targets.map((x) => x.unit));
        if (!t) continue;
        const x = targets.find((y) => y.unit === t);
        return { t: 'attack', target: t, move: x.from ? HX.path(x.reach, x.from.c, x.from.r) : null };
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
        const it = await UI.menu({ title: 'Use which item?', options: items.map((x) => ({ label: BT.ITEMS[x.id].name + (x.ch != null ? ' (' + x.ch + ')' : ''), value: x })), cancel: null });
        if (!it) continue;
        const use = BT.ITEMS[it.id].use;
        let tgt = null;
        if (use.spell) {
          tgt = await spellTarget(BT.SPELLS[use.spell]);
          if (tgt === undefined) continue;
        } else {
          tgt = await UI.pickMember('On whom?', (c) => (use.raise ? c.status === 'dead' : c.status !== 'dead'));
          if (!tgt) continue;
        }
        return { t: 'use', it, tgt };
      }
    }
  }

  // Pick an enemy unit: numbered menu, or click its hex.
  async function pickTarget(title, units, groupMode) {
    if (!units.length) return null;
    const labels = K.V('label', units) || units.map((x, i) => i + 1);
    const click = K.V('waitClick');
    const menu = UI.menu({
      title,
      options: units.map((x, i) => {
        const n = K.liveMembers(x.g).length;
        return { label: (groupMode ? (x.g.def.boss ? '' : n + ' ') + K.gname(x.g, n) : U.esc(x.g.def.name)), hint: x.m.hp + '/' + x.m.maxhp + ' HP', value: x, key: String(labels[i]) };
      }),
      cancel: null,
    });
    const pick = click ? await Promise.race([menu, click]) : await menu;
    K.V('label', null);
    if (pick && pick.hex) {
      UI.cancelMenu();
      return units.find((x) => x.c === pick.hex.c && x.r === pick.hex.r) || null;
    }
    K.V('clearClick');
    return pick || null;
  }

  async function spellTarget(s) {
    if (s.target === 'one' || s.target === 'group') {
      let list = K.foes().filter((f) => !s.undead || f.g.def.undead);
      if (s.target === 'group') list = list.filter((f, i) => list.findIndex((y) => y.g === f.g) === i); // one per group
      const t = await pickTarget(s.target === 'group' ? 'Cast at which group?' : 'Cast at whom?', list, s.target === 'group');
      return t || undefined;
    }
    if (s.target === 'ally') {
      const t = await UI.pickMember('Cast on whom?', (c) => (s.raise ? c.status === 'dead' : c.status !== 'dead'), true);
      return t || undefined;
    }
    return null;
  }

  Object.assign(K, { commandFor, pickTarget, spellTarget });
})();
