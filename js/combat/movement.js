// Moving on the hex board: reach, paths, where a hero can strike from, closing in.
(function () {
  const U = BT.U, D = BT.D, ST = BT.ST, UI = BT.UI, MA = BT.MA, HX = BT.HX;
  const CB = BT.CB, K = CB.K;

  // ---------- movement ----------
  const blockedFor = (mover) => (c, r) => CB.S.obstacles.has(HX.key(c, r)) || !!CB.S.units.find((u) => u !== mover && u.c === c && u.r === r && K.blocks(u));

  function reachOf(u, steps) { return HX.reach(u, steps, blockedFor(u)); }

  async function moveAlong(u, path) {
    if (!path || !path.length) return;
    UI.sfx('step', { volume: 0.5 });
    const last = path[path.length - 1];
    const res = K.V('move', u, path);
    u.c = last.c; u.r = last.r;
    if (res && res.then) await res;
  }

  // Melee: hexes from which `u` (with `steps` moves) can strike `target`. Returns the best one.
  function strikeFrom(u, target, reach) {
    if (HX.adjacent(u, target)) return { c: u.c, r: u.r, d: 0 };
    let best = null;
    for (const n of HX.neighbors(target.c, target.r)) {
      const h = reach.get(HX.key(n.c, n.r));
      if (!h || h.d === 0) continue;
      if (!best || h.d < best.d || (h.d === best.d && n.c < best.c)) best = h;
    }
    return best;
  }

  function isRanged(ch) { const w = ST.weapon(ch); return !!(w && w.ranged); }

  // What a hero can attack this turn: [{unit, from}] (from = hex to move to, or null to stay)
  function attackable(u, steps) {
    if (isRanged(u.ch)) return K.foes().map((f) => ({ unit: f, from: null }));
    const reach = reachOf(u, steps);
    const out = [];
    for (const f of K.foes()) {
      const h = strikeFrom(u, f, reach);
      if (h) out.push({ unit: f, from: h.d ? { c: h.c, r: h.r } : null, d: h.d, reach });
    }
    return out;
  }

  CB.attackable = (u, steps) => attackable(u, steps);

  // The first `steps` hexes of the shortest path towards a hex next to the nearest foe.
  function pathToward(u, steps) {
    const all = reachOf(u, 40);
    let best = null;
    for (const f of K.foes()) for (const n of HX.neighbors(f.c, f.r)) {
      const h = all.get(HX.key(n.c, n.r));
      if (h && h.d > 0 && (!best || h.d < best.d)) best = h;
    }
    return best ? HX.path(all, best.c, best.r).slice(0, steps) : null;
  }

  // Walk towards the nearest hex next to `target` (or any hero if none), at most `steps` hexes.
  async function approach(u, target, steps, capOnly) {
    const all = reachOf(u, 40);
    let best = null;
    const goals = target ? [target] : K.heroes();
    for (const t of goals) {
      if (capOnly && (CB.S.engaged.get(t) || 0) >= CB.MELEE_CAP) continue;
      for (const n of HX.neighbors(t.c, t.r)) {
        const h = all.get(HX.key(n.c, n.r));
        if (h && h.d > 0 && (!best || h.d < best.d)) best = h;
      }
    }
    if (!best) return false;
    const path = HX.path(all, best.c, best.r).slice(0, steps);
    await moveAlong(u, path);
    return true;
  }

  Object.assign(K, { blockedFor, reachOf, moveAlong, strikeFrom, isRanged, attackable, approach, pathToward });
})();
