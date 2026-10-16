// Builds every map at boot: generates and dresses the levels, builds the houses and links stairs and portals.
(function () {
  const MG = BT.MG;

  BT.MAPS = {};
  BT.buildMaps = function () {
    BT.MAPS.town = BT.buildTown();
    const dress = (m, spec) => { if (BT.DRESS) BT.DRESS.dressLevel(m, spec); };
    for (const spec of BT.LEVEL_SPECS) {
      const m = MG.generate(spec);
      Object.assign(m, spec, { features: undefined });
      dress(m, spec);
      BT.MAPS[spec.id] = m;
    }
    // Houses
    for (const spec of BT.INTERIORS) {
      const m = MG.fromRooms(spec);
      m.id = spec.id; m.name = spec.name; m.style = 'interior'; m.depth = 1; m.encounter = 0;
      m.rows = spec.marks;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const e = spec.ev[spec.marks[y][x]];
        if (e) m.ev[y][x] = Object.assign({}, e);
      }
      m.start = Object.assign({ d: 0 }, MG.findChar(spec.marks, 'e') || MG.findChar(spec.marks, 'd'));
      if (BT.DRESS) BT.DRESS.dressHouse(m, spec);
      BT.MAPS[spec.id] = m;
    }
    // Pocket realms: up-stairs lead back to the portal (or the level) they were reached from
    for (const spec of BT.POCKET_SPECS) {
      const m = MG.generate(spec);
      Object.assign(m, spec, { features: undefined });
      if (spec.upFrom.level) {
        const prev = BT.MAPS[spec.upFrom.level];
        m.up = { map: prev.id, x: prev.downPos.x, y: prev.downPos.y, d: 0 };
      } else {
        const src = BT.INTERIORS.find((i) => i.id === spec.upFrom.map);
        const p = MG.findChar(src.marks, spec.upFrom.at);
        const ev = src.ev[spec.upFrom.at];
        m.up = { map: spec.upFrom.map, x: p.x, y: p.y, d: 0, text: ev.label === 'portal' ? 'You step back through the portal.' : 'You climb the endless stair, and come up into the cellar of the house.' };
      }
      dress(m, spec);
      BT.MAPS[spec.id] = m;
    }
    // Resolve warp targets that reference a letter on another floor
    for (const id in BT.MAPS) {
      const m = BT.MAPS[id];
      if (!m.ev) continue;
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const e = m.ev[y][x];
        if (!e || e.t !== 'warp') continue;
        if (e.at) { const t = BT.INTERIORS.find((i) => i.id === e.to); Object.assign(e, MG.findChar(t.marks, e.at)); }
        else if (e.x == null) { const t = BT.MAPS[e.to]; e.x = t.start.x; e.y = t.start.y; e.d = t.start.d; }
      }
    }
    // Link "up" stairs of deeper levels to the previous level's down stairs.
    for (let i = 0; i < BT.LEVEL_SPECS.length; i++) {
      const spec = BT.LEVEL_SPECS[i];
      if (spec.up) continue;
      const prev = BT.MAPS[BT.LEVEL_SPECS[i - 1].id];
      const m = BT.MAPS[spec.id];
      m.up = { map: prev.id, x: prev.downPos.x, y: prev.downPos.y, d: 0 };
    }
  };
})();
