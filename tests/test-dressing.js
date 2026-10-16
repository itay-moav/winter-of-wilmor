// Set dressing and house plans: every wall face is dressed, lights respect walls and magical
// darkness, props stay off event cells, and every house plan is consistent.
const load = require('./load');
const BT = load(load.select(load.WORLD)).BT;
BT.buildMaps();
const MG = BT.MG;
let fail = 0, checks = 0;
const check = (c, m) => { checks++; if (!c) { console.log('FAIL', m); fail++; } };

for (const id in BT.MAPS) {
  const m = BT.MAPS[id];
  if (m.style === 'town') continue;
  check(Array.isArray(m.faceTex) && m.faceTex.length === m.w * m.h * 4, id + ' has face textures');
  let undressed = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (m.fl[y][x] & MG.F_SOLID) continue;
    for (let d = 0; d < 4; d++) if (MG.edge(m, x, y, d) === 1 && !m.faceTex[(y * m.w + x) * 4 + d]) undressed++;
    if (m.fl[y][x] & MG.F_DARK) check(!m.cellLights[y * m.w + x], id + ' magical darkness at ' + x + ',' + y + ' is never lit');
  }
  check(undressed === 0, id + ' every wall face is dressed (' + undressed + ' bare)');
  for (const p of m.props) {
    const x = Math.floor(p.x), y = Math.floor(p.y);
    check(MG.inside(m, x, y) && !(m.fl[y][x] & MG.F_SOLID), id + ' prop ' + p.tex + ' stands inside the map');
    if (m.roomAt) continue; // houses place furniture by hand
    check(!m.ev[y][x] || m.ev[y][x].deco, id + ' random prop ' + p.tex + ' is not on an event cell');
  }
  for (const L of m.lights) check(L.r > 0 && L.col.length === 3, id + ' light is well formed');
  if (m.style !== 'interior') check(m.lights.length > 0, id + ' has light sources');
}
// sewers: running water in the tunnels
const sw = BT.MAPS.sewers1;
let channels = 0;
for (let y = 0; y < sw.h; y++) for (let x = 0; x < sw.w; x++) if (/sewer_channel/.test(sw.floorTex[y][x] || '')) channels++;
check(channels > 20, 'sewer tunnels carry water channels (' + channels + ')');
// described dressing appears where the notes are
const has = (m, re) => m.faceTex.some((t) => t && re.test(t)) || m.props.some((p) => re.test(p.tex));
check(has(BT.MAPS.sewers1, /dc_graffiti_crown/), 'sewers1: the crude crown graffiti is on the wall');
check(has(BT.MAPS.crypt1, /dc_king_niche/), 'crypt1: stone kings sleep in niches');
check(has(BT.MAPS.keep1, /pr_cot/), 'keep1: cots in the barracks');
check(has(BT.MAPS.tower2, /dc_clocks/), 'tower2: clocks line the walls');
check(has(BT.MAPS.sewers2, /pr_ratnest/), 'sewers2: the Rat King\'s junk throne');
check(has(BT.MAPS.folded2, /pr_harp|pr_armchair/), 'folded2: Irena\'s parlour at the heart of the fold');

// house plans
for (const spec of BT.INTERIORS) {
  const m = BT.MAPS[spec.id], h = spec.plan.length, w = spec.plan[0].length;
  check(spec.marks.length === h && spec.marks.every((r) => r.length === w) && spec.plan.every((r) => r.length === w), spec.id + ' plan and marks have the same size');
  for (const ch of new Set(spec.plan.join('').replace(/#/g, ''))) check(spec.rooms[ch], spec.id + ' room ' + ch + ' has a look');
  for (const ch of new Set(spec.marks.join('').replace(/\./g, ''))) check(spec.ev[ch], spec.id + ' mark ' + ch + ' has an event');
  for (const s of spec.doors || []) {
    const [x, y, d] = MG.parseFace(s);
    const nx = x + BT.U.DX[d], ny = y + BT.U.DY[d];
    check(MG.inside(m, x, y) && MG.inside(m, nx, ny) && spec.plan[y][x] !== spec.plan[ny][nx], spec.id + ' door ' + s + ' joins two rooms');
  }
  for (const s of spec.decals || []) {
    const [x, y, d] = MG.parseFace(s);
    check(MG.inside(m, x, y) && MG.edge(m, x, y, d) !== 0, spec.id + ' decal ' + s + ' hangs on a wall');
  }
  for (const s of spec.props || []) { const p = s.split(','); check(MG.inside(m, +p[0], +p[1]), spec.id + ' prop ' + s + ' is inside'); }
  // no house floor is a maze: every room is a block of cells, not a corridor
  for (const ch of new Set(spec.plan.join('').replace(/#/g, ''))) {
    let n = 0; for (const r of spec.plan) for (const c of r) if (c === ch) n++;
    check(n >= 2, spec.id + ' room ' + ch + ' is a real room (' + n + ' cells)');
  }
}
// the Folded House is a pocket dimension: its cellar leads into generated dungeon levels
check(BT.MAPS.l1.ev.some((r) => r.some((e) => e && e.to === 'folded1')), 'Malthor\'s cellar stair leads into the Folded Cellar');
check(BT.MAPS.folded2.up.map === 'folded1' && BT.MAPS.folded1.up.map === 'l1', 'the fold leads back up to the house');
console.log(fail ? 'FAIL ' + fail + ' of ' + checks : 'OK dressing (' + checks + ' checks)');
process.exit(fail ? 1 : 0);
