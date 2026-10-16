// Hand-made maps: the city from a block grid, houses from room plans.
(function () {
  const U = BT.U, MG = BT.MG;
  const grid = (h, w, v) => { const a = []; for (let y = 0; y < h; y++) a.push(new Array(w).fill(v)); return a; };

  // ---------- town from a block grid ----------
  // '#' house, '.' street, 'g' graveyard ground, 'f' fountain, 'x' statue, letters = special buildings
  MG.fromBlocks = function (rows, buildings) {
    const h = rows.length, w = rows[0].length;
    const m = MG.blank(w, h);
    m.cellType = grid(h, w, '.');
    const isOpen = (c) => c === '.' || c === 'g' || c === 'f' || c === 'x';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = rows[y][x];
        m.cellType[y][x] = c;
        if (!isOpen(c)) m.fl[y][x] |= MG.F_SOLID;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const c = rows[y][x];
        if (!isOpen(c)) continue; // edges are set from the street side
        for (let d = 0; d < 4; d++) {
          const nx = x + U.DX[d], ny = y + U.DY[d];
          if (!MG.inside(m, nx, ny)) continue;
          const n = rows[ny][nx];
          if (isOpen(c) && isOpen(n)) MG.setEdge(m, x, y, d, 0);
          else if (isOpen(c) && buildings[n]) MG.setEdge(m, x, y, d, 2);
          else MG.setEdge(m, x, y, d, 1);
        }
      }
    }
    return m;
  };

  // ---------- houses from a room plan ----------
  // spec.plan: rows of room letters ('#' = no floor). Walls stand between different rooms;
  // spec.doors: ['x,y,d'] (d = n|e|s|w, append ',secret' for a secret door) open them again.
  // spec.marks: rows of event letters ('.' = nothing), as in BT.INTERIORS legends.
  MG.DIRS = { n: 0, e: 1, s: 2, w: 3 };
  MG.fromRooms = function (spec) {
    const plan = spec.plan, h = plan.length, w = plan[0].length;
    const m = MG.blank(w, h);
    m.cellType = grid(h, w, '.');
    m.roomAt = grid(h, w, null);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const r = plan[y][x];
      m.roomAt[y][x] = r === '#' ? null : r;
      m.cellType[y][x] = spec.marks ? spec.marks[y][x] : '.';
      if (r === '#') m.fl[y][x] |= MG.F_SOLID;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!m.roomAt[y][x]) continue;
      for (let d = 0; d < 4; d++) {
        const nx = x + U.DX[d], ny = y + U.DY[d];
        if (!MG.inside(m, nx, ny)) continue;
        MG.setEdge(m, x, y, d, m.roomAt[ny][nx] === m.roomAt[y][x] ? 0 : 1);
      }
    }
    for (const s of spec.doors || []) {
      const [x, y, d, kind] = MG.parseFace(s);
      MG.setEdge(m, x, y, d, kind === 'secret' ? 3 : 2);
    }
    return m;
  };
  // 'x,y,d[,extra]' -> [x, y, dirIndex, extra]
  MG.parseFace = function (s) {
    const p = s.split(',');
    return [+p[0], +p[1], MG.DIRS[p[2]], p[3]];
  };

  MG.findChar = function (rows, ch) {
    for (let y = 0; y < rows.length; y++) { const x = rows[y].indexOf(ch); if (x >= 0) return { x, y }; }
    return null;
  };
})();
