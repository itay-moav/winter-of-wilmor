// The party AI: plays a hero's turn for "Auto", auto-battle and the headless tests.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MA = BT.MA, HX = BT.HX;
  const CB = BT.CB, K = CB.K;

  // ---------- the party AI (auto turns, auto-battle and the headless tests) ----------
  function aiParty(u, mp) {
    const ch = u.ch;
    const P = BT.G.party, idx = P.indexOf(ch);
    if (ch.cls === 'bard' && ST.equipped(ch, 'instrument') && !CB.S.song && ch.voice > 0) return { t: 'sing', song: D.SONGS.find((s) => s.id === 'march') };
    if (ST.isMage(ch)) {
      const known = ST.knownSpells(ch).filter((s) => s.when !== 'explore' && ch.sp >= s.sp);
      if (CB.aiHeals) {
        const hurtOne = P.filter((c) => ST.alive(c) && c.hp < c.maxhp * 0.4).sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0];
        const heal = known.filter((s) => s.heal && s.target === 'ally').sort((a, b) => b.lvl - a.lvl)[0];
        if (hurtOne && heal) return { t: 'cast', s: heal, tgt: hurtOne };
      }
      const undead = K.foes().some((f) => f.g.def.undead);
      const dmg = known.filter((s) => s.dmg && (!s.undead || undead)).sort((a, b) => b.lvl - a.lvl);
      if (dmg.length) {
        const s = dmg[0];
        let tgt = null;
        if (s.target === 'one' || s.target === 'group') {
          const list = K.foes().filter((f) => !s.undead || f.g.def.undead);
          list.sort((a, b) => (b.g.def.boss ? 99 : K.liveMembers(b.g).length) - (a.g.def.boss ? 99 : K.liveMembers(a.g).length));
          tgt = list[0] || null;
        }
        if (tgt || s.target === 'all') return { t: 'cast', s, tgt };
      }
    }
    const front = idx < 3 || u.kind === 'summon';
    const steps = front || K.isRanged(ch) ? mp : 0;
    const targets = K.attackable(u, steps);
    if (targets.length) {
      targets.sort((a, b) => (a.d || 0) - (b.d || 0) || a.unit.m.hp - b.unit.m.hp);
      const t = targets[0];
      return { t: 'attack', target: t.unit, move: t.from ? HX.path(t.reach, t.from.c, t.from.r) : null };
    }
    if (ch.cls === 'rogue' && !ch._hidden) return { t: 'hide' };
    // front-liners close the distance (and brace), the back rank holds its ground
    return { t: 'parry', move: front && mp ? K.pathToward(u, mp) : null };
  }

  CB.aiParty = (u, mp) => aiParty(u, mp);

  Object.assign(K, { aiParty });
})();
