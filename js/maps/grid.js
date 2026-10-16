// The map model: a thin-wall grid of cells, edges and zone flags, plus breadth-first search.
// Thin-wall grid: hw[y][x] = edge on the north side of cell (x,y) (y in 0..h),
//                 vw[y][x] = edge on the west side of cell (x,y) (x in 0..w).
// Edge values: 0 open, 1 wall, 2 door, 3 secret door.
// fl[y][x] zone flags: 1 dark, 2 anti-magic, 4 icy water (damage), 8 building (town, solid)
(function () {
  const U = BT.U;
  const MG = {};
  MG.F_DARK = 1;
  MG.F_ANTI = 2;
  MG.F_WATER = 4;
  MG.F_SOLID = 8;

  function grid(h, w, v) {
    const a = [];
    for (let y = 0; y < h; y++) a.push(new Array(w).fill(v));
    return a;
  }

  MG.blank = function (w, h) {
    return {
      w, h,
      hw: grid(h + 1, w, 1),
      vw: grid(h, w + 1, 1),
      fl: grid(h, w, 0),
      ev: grid(h, w, null),
      rooms: [],
    };
  };

  // Edge leaving cell (x,y) in direction d.
  MG.edge = function (m, x, y, d) {
    if (d === 0) return m.hw[y][x];
    if (d === 2) return m.hw[y + 1][x];
    if (d === 3) return m.vw[y][x];
    return m.vw[y][x + 1];
  };
  MG.setEdge = function (m, x, y, d, v) {
    if (d === 0) m.hw[y][x] = v;
    else if (d === 2) m.hw[y + 1][x] = v;
    else if (d === 3) m.vw[y][x] = v;
    else m.vw[y][x + 1] = v;
  };
  MG.inside = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h;
  MG.passable = (v) => v === 0 || v === 2 || v === 3;

  MG.bfs = function (m, sx, sy) {
    const dist = grid(m.h, m.w, -1);
    const q = [[sx, sy]];
    dist[sy][sx] = 0;
    while (q.length) {
      const [x, y] = q.shift();
      for (let d = 0; d < 4; d++) {
        if (!MG.passable(MG.edge(m, x, y, d))) continue;
        const nx = x + U.DX[d], ny = y + U.DY[d];
        if (!MG.inside(m, nx, ny) || dist[ny][nx] >= 0) continue;
        if (m.fl[ny][nx] & MG.F_SOLID) continue;
        dist[ny][nx] = dist[y][x] + 1;
        q.push([nx, ny]);
      }
    }
    return dist;
  };

  MG.wallCount = function (m, x, y) {
    let c = 0;
    for (let d = 0; d < 4; d++) if (!MG.passable(MG.edge(m, x, y, d))) c++;
    return c;
  };

  BT.MG = MG;
})();
