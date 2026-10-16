// Hex-grid maths for the battle board (no DOM). Pointy-top hexes in "odd-r" offset
// coordinates: odd rows are shifted half a hex to the right. Cells are {c, r}.
(function () {
  const HX = {};
  HX.COLS = 11;
  HX.ROWS = 7;

  HX.key = (c, r) => r * HX.COLS + c;
  HX.unkey = (k) => ({ c: k % HX.COLS, r: Math.floor(k / HX.COLS) });
  HX.inside = (c, r) => c >= 0 && r >= 0 && c < HX.COLS && r < HX.ROWS;

  // neighbour offsets for even and odd rows: E, NE, NW, W, SW, SE
  const NB = [
    [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]],
    [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]],
  ];
  HX.neighbors = function (c, r) {
    const out = [];
    for (const [dc, dr] of NB[r & 1]) {
      const nc = c + dc, nr = r + dr;
      if (HX.inside(nc, nr)) out.push({ c: nc, r: nr });
    }
    return out;
  };

  function cube(c, r) {
    const x = c - (r - (r & 1)) / 2;
    return [x, r, -x - r];
  }
  HX.dist = function (a, b) {
    const p = cube(a.c, a.r), q = cube(b.c, b.r);
    return Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]), Math.abs(p[2] - q[2]));
  };
  HX.adjacent = (a, b) => HX.dist(a, b) === 1;

  // Centre of a hex on the flat board, with hexes of circumradius 1.
  HX.center = function (c, r) {
    return { x: Math.sqrt(3) * (c + 0.5 * (r & 1)) + Math.sqrt(3) / 2, y: 1 + 1.5 * r };
  };
  HX.boardSize = () => ({ w: Math.sqrt(3) * (HX.COLS + 0.5), h: 1.5 * (HX.ROWS - 1) + 2 });

  // Breadth-first reach from `from` over at most `steps` moves. blocked(c, r) -> true if the
  // hex cannot be entered. Returns a Map key -> {c, r, d, prev} (the start has d = 0).
  HX.reach = function (from, steps, blocked) {
    const out = new Map();
    out.set(HX.key(from.c, from.r), { c: from.c, r: from.r, d: 0, prev: null });
    let frontier = [from];
    for (let d = 1; d <= steps && frontier.length; d++) {
      const next = [];
      for (const h of frontier) {
        for (const n of HX.neighbors(h.c, h.r)) {
          const k = HX.key(n.c, n.r);
          if (out.has(k) || blocked(n.c, n.r)) continue;
          out.set(k, { c: n.c, r: n.r, d, prev: HX.key(h.c, h.r) });
          next.push(n);
        }
      }
      frontier = next;
    }
    return out;
  };
  // The path (excluding the start) to a hex in a reach map.
  HX.path = function (reach, c, r) {
    const path = [];
    let k = HX.key(c, r);
    while (reach.has(k) && reach.get(k).prev != null) {
      const h = reach.get(k);
      path.unshift({ c: h.c, r: h.r });
      k = h.prev;
    }
    return path;
  };

  BT.HX = HX;
})();
