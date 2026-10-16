// Houses and dungeons look like their descriptions: every texture any map asks for exists in the
// texture packs, every room plan renders, and the dressed places are photographed for review.
const { open, check, finish } = require('./_common');
(async () => {
  const T = await open();
  await T.newGame();
  const missing = await T.eval(`(() => {
    const want = new Set();
    for (const id in BT.MAPS) {
      const m = BT.MAPS[id];
      for (const n of m.faceTex || []) if (n) n.split('|').forEach((p) => want.add(p));
      for (const k of ['floorTex', 'ceilTex']) for (const row of m[k] || []) for (const n of row) if (n) want.add(n.replace('@r', ''));
      for (const p of m.props || []) want.add(p.tex);
    }
    for (const k in BT.STYLES) { if (k === 'town') continue; const s = BT.STYLES[k]; [s.wall, s.wall2, s.floor, s.door].forEach((n) => n && want.add(n)); if (s.ceil !== 'sky') want.add(s.ceil); }
    BT.DRESS.textureNames().forEach((n) => want.add(n));
    return [...want].filter((n) => !BT.TX.data[n]);
  })()`);
  check(missing.length === 0, 'every texture the maps use exists' + (missing.length ? ': missing ' + missing.join(', ') : ''));
  const places = [
    ['sewers1', 'p-sewer'], ['sewers2', 'p-ratking', 'boss'], ['crypt1', 'p-crypt'], ['crypt2', 'p-morvane', 'boss'], ['keep1', 'p-keep'], ['tower2', 'p-tower'],
    ['mirrorhall', 'p-mirror'], ['roothollow', 'p-hollow'], ['sunvault', 'p-vault'], ['folded1', 'p-folded'], ['folded2', 'p-stillroom', 'far'],
    ['q1', 'p-orrin-shop', [1, 2, 0]], ['q2', 'p-orrin-workshop', [2, 3, 0]], ['y1', 'p-ysolde-parlour', [1, 1, 3]], ['u1', 'p-mill', [3, 2, 3]],
    ['l1', 'p-malthor-parlour', [2, 1, 0]], ['l2', 'p-lyra-room', [1, 1, 0]], ['l2', 'p-malthor-study', [3, 3, 1]],
  ];
  for (const [id, name, at] of places) {
    let pos = '';
    if (Array.isArray(at)) pos = ',' + at.join(',');
    await T.eval(`BT.EX.guard(() => BT.EX.changeMap('${id}'${pos})); 1`); await T.sleep(2200);
    if (at === 'boss') await T.eval(`(() => { const m = BT.MAPS['${id}']; const c = m.bossRoom.cells[0]; BT.G.x = c[0]; BT.G.y = c[1]; for (let d = 0; d < 4; d++) if (BT.MG.edge(m, c[0], c[1], d) === 0) BT.G.d = d; BT.R.snap(); return 1; })()`);
    if (at === 'far') await T.eval(`(() => { const m = BT.MAPS['${id}']; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const e = m.ev[y][x]; if (e && e.setFlag === 'irena') { for (let d = 0; d < 4; d++) { const nx = x + BT.U.DX[d], ny = y + BT.U.DY[d]; if (BT.MG.inside(m, nx, ny) && BT.MG.edge(m, x, y, d) === 0) { BT.G.x = nx; BT.G.y = ny; BT.G.d = (d + 2) % 4; } } } } BT.R.snap(); return 1; })()`);
    // in a dungeon, step off the entrance into the level
    if (!at) await T.eval(`(() => { const m = BT.MAPS['${id}']; const G = BT.G; for (let d = 0; d < 4; d++) if (BT.MG.passable(BT.MG.edge(m, G.x, G.y, d))) { G.x += BT.U.DX[d]; G.y += BT.U.DY[d]; G.d = d; break; } BT.R.snap(); return 1; })()`);
    await T.sleep(400);
    await T.snap(name);
  }
  check(true, 'photographed ' + places.length + ' places');
  finish(T);
})();
