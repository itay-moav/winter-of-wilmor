// Hex-board maths: neighbours, distance, reach and paths.
const load = require('./load');
const BT = load(['js/core/util.js', 'js/combat/hex.js']).BT;
const HX = BT.HX;
let fail = 0;
const check = (c, m) => { if (!c) { console.log('FAIL', m); fail++; } };

for (let r = 0; r < HX.ROWS; r++) for (let c = 0; c < HX.COLS; c++) {
  const n = HX.neighbors(c, r);
  const interior = c > 0 && r > 0 && c < HX.COLS - 1 && r < HX.ROWS - 1;
  if (interior) check(n.length === 6, 'interior hex has 6 neighbours ' + c + ',' + r);
  for (const h of n) {
    check(HX.dist({ c, r }, h) === 1, 'neighbour at distance 1');
    check(HX.neighbors(h.c, h.r).some((b) => b.c === c && b.r === r), 'adjacency is symmetric');
    const a = HX.center(c, r), b = HX.center(h.c, h.r);
    check(Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - Math.sqrt(3)) < 1e-9, 'neighbour centres are one hex apart');
  }
}
check(HX.dist({ c: 0, r: 0 }, { c: 10, r: 0 }) === 10, 'distance along a row');
check(HX.dist({ c: 0, r: 0 }, { c: 0, r: 6 }) === 6, 'distance down the zigzag');
// reach with a wall of blocked hexes
const wall = new Set([HX.key(3, 2), HX.key(3, 3), HX.key(3, 4)]);
const reach = HX.reach({ c: 1, r: 3 }, 9, (c, r) => wall.has(HX.key(c, r)));
check(!reach.has(HX.key(3, 3)), 'blocked hex is never reached');
const p = HX.path(reach, 5, 3);
check(p.length === reach.get(HX.key(5, 3)).d, 'path length equals reach distance');
check(p.every((h, i) => HX.dist(h, i ? p[i - 1] : { c: 1, r: 3 }) === 1), 'path steps are adjacent');
check(p.every((h) => !wall.has(HX.key(h.c, h.r))), 'path avoids blocked hexes');
check(HX.reach({ c: 1, r: 3 }, 0, () => false).size === 1, 'zero steps reaches only the start');
console.log(fail ? 'FAIL ' + fail : 'OK hex');
process.exit(fail ? 1 : 0);
