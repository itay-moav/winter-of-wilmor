// Map model + generation.
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

  // ---------- interiors from a block grid ----------
  // '#' solid, 'S' secret passage (looks like wall from both sides), 'D' door cell,
  // anything else is open floor (letters carry events).
  MG.fromInterior = function (rows) {
    const h = rows.length, w = rows[0].length;
    const m = MG.blank(w, h);
    m.cellType = grid(h, w, '.');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      m.cellType[y][x] = rows[y][x];
      if (rows[y][x] === '#') m.fl[y][x] |= MG.F_SOLID;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = rows[y][x];
      if (c === '#') continue;
      for (let d = 0; d < 4; d++) {
        const nx = x + U.DX[d], ny = y + U.DY[d];
        if (!MG.inside(m, nx, ny)) continue;
        const n = rows[ny][nx];
        if (n === '#') MG.setEdge(m, x, y, d, 1);
        else if (c === 'S' || n === 'S') MG.setEdge(m, x, y, d, 3);
        else if (c === 'D' || n === 'D') MG.setEdge(m, x, y, d, 2);
        else MG.setEdge(m, x, y, d, 0);
      }
    }
    return m;
  };
  MG.findChar = function (rows, ch) {
    for (let y = 0; y < rows.length; y++) { const x = rows[y].indexOf(ch); if (x >= 0) return { x, y }; }
    return null;
  };

  // ---------- dungeon generator ----------
  MG.generate = function (spec) {
    const r = U.seeded(spec.seed);
    const w = spec.w, h = spec.h;
    const m = MG.blank(w, h);
    const roomId = grid(h, w, -1);

    // Rooms
    const nRooms = spec.rooms || 4;
    for (let i = 0, tries = 0; i < nRooms && tries < 200; tries++) {
      const rw = 2 + r.int(3), rh = 2 + r.int(3);
      const rx = 1 + r.int(w - rw - 1), ry = 1 + r.int(h - rh - 1);
      let ok = true;
      for (let y = ry - 1; y <= ry + rh && ok; y++)
        for (let x = rx - 1; x <= rx + rw && ok; x++)
          if (MG.inside(m, x, y) && roomId[y][x] >= 0) ok = false;
      if (!ok) continue;
      const room = { id: i, x: rx, y: ry, w: rw, h: rh, cells: [] };
      for (let y = ry; y < ry + rh; y++)
        for (let x = rx; x < rx + rw; x++) {
          roomId[y][x] = i;
          room.cells.push([x, y]);
          if (x > rx) m.vw[y][x] = 0;
          if (y > ry) m.hw[y][x] = 0;
        }
      m.rooms.push(room);
      i++;
    }

    // Kruskal over all interior edges
    const parent = [];
    for (let i = 0; i < w * h; i++) parent.push(i);
    const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
    const union = (a, b) => { parent[find(a)] = find(b); };
    for (const room of m.rooms) for (const [x, y] of room.cells) union(y * w + x, room.y * w + room.x);
    const edges = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (x < w - 1) edges.push([x, y, 1]);
        if (y < h - 1) edges.push([x, y, 2]);
      }
    r.shuffle(edges);
    const closed = [];
    for (const [x, y, d] of edges) {
      const a = y * w + x, b = (y + U.DY[d]) * w + (x + U.DX[d]);
      if (find(a) !== find(b)) {
        union(a, b);
        const ra = roomId[y][x], rb = roomId[y + U.DY[d]][x + U.DX[d]];
        const isRoomEdge = ra !== rb && (ra >= 0 || rb >= 0);
        MG.setEdge(m, x, y, d, isRoomEdge ? 2 : (r() < (spec.doors || 0.05) ? 2 : 0));
      } else if (MG.edge(m, x, y, d) === 1) {
        closed.push([x, y, d]);
      }
    }
    // Loops (some secret)
    const nLoops = Math.floor(closed.length * (spec.loops || 0.1));
    r.shuffle(closed);
    for (let i = 0; i < nLoops; i++) {
      const [x, y, d] = closed[i];
      const ra = roomId[y][x], rb = roomId[y + U.DY[d]][x + U.DX[d]];
      const isRoomEdge = ra !== rb && (ra >= 0 || rb >= 0);
      let v = r() < (spec.secret || 0.2) ? 3 : (isRoomEdge || r() < 0.1 ? 2 : 0);
      MG.setEdge(m, x, y, d, v);
    }

    // Start cell: corner-ish dead end away from rooms
    let start = null;
    const sCand = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (roomId[y][x] < 0 && MG.wallCount(m, x, y) === 3) sCand.push([x, y]);
    sCand.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]));
    const s0 = spec.startCorner === 'se' ? sCand[sCand.length - 1] : sCand[0] || [0, 0];
    start = { x: s0[0], y: s0[1], d: 0 };
    for (let d = 0; d < 4; d++) if (MG.passable(MG.edge(m, start.x, start.y, d))) start.d = d;
    m.start = start;
    m.roomId = roomId;

    const dist = MG.bfs(m, start.x, start.y);
    m.dist = dist;
    let maxD = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) maxD = Math.max(maxD, dist[y][x]);

    const used = grid(h, w, false);
    used[start.y][start.x] = true;
    const free = (x, y) => !used[y][x] && dist[y][x] > 0;
    const all = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) all.push([x, y]);

    function pickCell(at) {
      let cand;
      const nonRoom = ([x, y]) => roomId[y][x] < 0;
      if (at === 'far') {
        cand = all.filter(([x, y]) => free(x, y) && nonRoom([x, y]));
        cand.sort((a, b) => dist[b[1]][b[0]] - dist[a[1]][a[0]]);
        cand = cand.slice(0, 3);
      } else if (at === 'deadend') {
        cand = all.filter(([x, y]) => free(x, y) && MG.wallCount(m, x, y) === 3 && dist[y][x] > maxD * 0.25);
      } else if (at === 'mid') {
        cand = all.filter(([x, y]) => free(x, y) && nonRoom([x, y]) && dist[y][x] > maxD * 0.35 && dist[y][x] < maxD * 0.65);
      } else if (at === 'near') {
        cand = all.filter(([x, y]) => free(x, y) && dist[y][x] >= 2 && dist[y][x] <= 6);
      } else if (at === 'room') {
        cand = all.filter(([x, y]) => free(x, y) && !nonRoom([x, y]));
      } else if (at === 'corridor') {
        cand = all.filter(([x, y]) => free(x, y) && nonRoom([x, y]) && MG.wallCount(m, x, y) === 2 && dist[y][x] > 3);
      } else {
        cand = all.filter(([x, y]) => free(x, y) && dist[y][x] > 3);
      }
      if (!cand.length) cand = all.filter(([x, y]) => free(x, y));
      const c = r.pick(cand);
      used[c[1]][c[0]] = true;
      return c;
    }

    function zone(flag, size) {
      const [sx, sy] = r.pick(all.filter(([x, y]) => dist[y][x] > 3));
      const q = [[sx, sy]], seen = { [sx + ',' + sy]: 1 };
      let n = 0;
      while (q.length && n < size) {
        const [x, y] = q.shift();
        if (x === start.x && y === start.y) continue;
        m.fl[y][x] |= flag;
        n++;
        for (const d of r.shuffle([0, 1, 2, 3])) {
          if (!MG.passable(MG.edge(m, x, y, d))) continue;
          const nx = x + U.DX[d], ny = y + U.DY[d];
          if (!MG.inside(m, nx, ny) || seen[nx + ',' + ny]) continue;
          seen[nx + ',' + ny] = 1;
          q.push([nx, ny]);
        }
      }
    }

    // Up stairs at start
    m.ev[start.y][start.x] = { t: 'stairs', dir: 'up' };

    // Boss room first so it gets the farthest room
    for (const f of spec.features || []) {
      if (f.at !== 'bossroom') continue;
      let best = null, bestD = -1;
      for (const room of m.rooms) {
        let md = 1e9;
        for (const [x, y] of room.cells) md = Math.min(md, dist[y][x]);
        if (md > bestD) { bestD = md; best = room; }
      }
      const ev = Object.assign({}, f);
      for (const [x, y] of best.cells) {
        used[y][x] = true;
        m.ev[y][x] = ev;
      }
      m.bossRoom = best;
    }

    for (const f of spec.features || []) {
      if (f.at === 'bossroom') continue;
      const count = f.count || 1;
      for (let i = 0; i < count; i++) {
        if (f.t === 'zone') { zone(f.flag, f.size || 5); continue; }
        const [x, y] = pickCell(f.at || 'random');
        const ev = Object.assign({}, f);
        delete ev.count;
        m.ev[y][x] = ev;
        if (f.t === 'stairs' && f.dir === 'down') m.downPos = { x, y };
      }
    }
    return m;
  };

  BT.MG = MG;
})();
