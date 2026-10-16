// Set dressing: wall decals, floor and ceiling variants, props and light sources, so every place
// looks like its description. Pure data on the map (no DOM): render.js draws it.
//   m.faceTex[(y*w+x)*4+d]  texture name for the wall face ('base' or 'base|decal')
//   m.floorTex / m.ceilTex  [y][x] texture name or null (style default); 'name@r' = rotated 90°
//   m.props                 [{x, y, tex, scale, hang}] billboards (x, y in world units)
//   m.lights                [{x, y, r, col:[r,g,b], i, flick, phase}] and m.cellLights[y*w+x] = [index...]
// Dressing uses its own seeded RNG after generation, so it never changes a level's layout.
(function () {
  const U = BT.U, MG = BT.MG;
  const DR = {};

  // Light sources by decal or prop name. r: reach in cells, col: colour, i: strength.
  const FIRE = [1.0, 0.6, 0.28], CANDLE = [1.0, 0.74, 0.42], AMBER = [1.0, 0.68, 0.3], ICE = [0.45, 0.72, 1.0], MOON = [0.55, 0.66, 0.95];
  DR.LIGHTS = {
    dc_torch: { r: 3.4, col: FIRE, i: 1.0, flick: 1 },
    pr_torchstand: { r: 3.4, col: FIRE, i: 1.0, flick: 1 },
    pr_brazier: { r: 4.0, col: FIRE, i: 1.2, flick: 1 },
    dc_candles: { r: 2.4, col: CANDLE, i: 0.7, flick: 0.6 },
    pr_candles: { r: 2.4, col: CANDLE, i: 0.75, flick: 0.6 },
    pr_lamp: { r: 2.8, col: CANDLE, i: 0.8, flick: 0.5 },
    dc_fireplace: { r: 3.8, col: FIRE, i: 1.1, flick: 1 },
    pr_stove: { r: 3.0, col: FIRE, i: 0.9, flick: 1 },
    dc_lantern_amber: { r: 3.0, col: AMBER, i: 0.85, flick: 0.4 },
    pr_amber_lantern: { r: 3.0, col: AMBER, i: 0.85, flick: 0.4 },
    dc_amberroots: { r: 1.8, col: AMBER, i: 0.45, flick: 0 },
    pr_mushrooms: { r: 2.4, col: [0.35, 0.95, 0.85], i: 0.7, flick: 0 },
    dc_crystal: { r: 2.8, col: ICE, i: 0.75, flick: 0 },
    pr_crystals: { r: 3.2, col: ICE, i: 0.9, flick: 0 },
    dc_crystal_lamp: { r: 3.2, col: ICE, i: 0.9, flick: 0.15 },
    dc_runes: { r: 2.0, col: [0.4, 0.88, 1.0], i: 0.5, flick: 0 },
    dc_sunrelief: { r: 2.6, col: [1.0, 0.86, 0.45], i: 0.6, flick: 0 },
    pr_sun_statue: { r: 3.0, col: [1.0, 0.86, 0.45], i: 0.8, flick: 0 },
    dc_window: { r: 2.0, col: MOON, i: 0.35, flick: 0 },
    dc_window_ice: { r: 1.8, col: MOON, i: 0.35, flick: 0 },
  };

  // Per-style dressing tables: [[name, weight], ...]; null = plain wall.
  DR.STYLES = {
    sewer: {
      walls: [[null, 34], ['dc_moss', 12], ['dc_algae', 14], ['dc_drip', 10], ['dc_waterline', 9], ['dc_lichen', 5], ['dc_grate', 5], ['dc_pipe', 4], ['dc_cracks', 3], ['dc_ratholes', 4], ['dc_cobweb', 2]],
      lights: [['dc_torch', 5], ['dc_torch_out', 1]], lightEvery: 9,
      corridor: 'sewer_channel', room: [[null, 55], ['puddles', 45]], water: 'water_deep',
      ceil: [[null, 65], ['ceil_drip', 35]],
      props: [['pr_barrel', 3], ['pr_crate', 3], ['pr_bones', 2], ['pr_rubble', 2], ['pr_chain_hang', 1], ['pr_cobweb_hang', 1]], propRate: 0.09,
    },
    crypt: {
      walls: [[null, 40], ['dc_lichen', 9], ['dc_cracks', 7], ['dc_cobweb', 8], ['dc_ossuary', 7], ['dc_rootsigil', 4], ['dc_sunchisel', 4], ['dc_frost', 5], ['dc_king_niche', 6], ['dc_frost_runes', 2]],
      lights: [['dc_torch', 2], ['dc_candles', 3], ['dc_torch_out', 1]], lightEvery: 11,
      corridor: [[null, 85], ['bones_floor', 15]], room: [[null, 70], ['bones_floor', 15], ['rubble_floor', 15]], water: 'water_deep',
      ceil: [[null, 60], ['ceil_cobweb', 40]],
      props: [['pr_bones', 3], ['pr_skullpile', 2], ['pr_coffin', 2], ['pr_sarcophagus', 2], ['pr_candles', 2], ['pr_cobweb_hang', 2], ['pr_statue_king', 1], ['pr_pillar', 1]], propRate: 0.11,
    },
    keep: {
      walls: [[null, 42], ['dc_banner_snow', 8], ['dc_weaponrack', 6], ['dc_shield', 6], ['dc_window_ice', 6], ['dc_chains', 5], ['dc_cracks', 5], ['dc_frost', 8]],
      lights: [['dc_torch', 5], ['dc_torch_out', 1]], lightEvery: 8,
      corridor: null, room: [[null, 80], ['rubble_floor', 20]], water: 'water_deep',
      ceil: [[null, 70], ['ceil_ice', 30]],
      props: [['pr_crate', 2], ['pr_barrel', 2], ['pr_weaponrack', 2], ['pr_cot', 1], ['pr_table_long', 1], ['pr_frozen_guard', 2], ['pr_brazier', 1]], propRate: 0.09,
    },
    tower: {
      walls: [[null, 42], ['dc_runes', 10], ['dc_crystal', 9], ['dc_frost', 10], ['dc_clocks', 5], ['dc_frost_runes', 5]],
      lights: [['dc_crystal_lamp', 3]], lightEvery: 10,
      corridor: [[null, 80], ['ice_floor', 20]], room: [[null, 65], ['ice_floor', 35]], water: 'water_deep',
      ceil: [[null, 70], ['ceil_ice', 30]],
      props: [['pr_crystals', 3], ['pr_icepillar', 2], ['pr_clock_tall', 1], ['pr_mirror_stand', 1], ['pr_icicles_hang', 2]], propRate: 0.09,
    },
    vault: {
      walls: [[null, 50], ['dc_sunrelief', 20], ['dc_candles', 6], ['dc_cracks', 3]],
      lights: [['dc_candles', 2]], lightEvery: 12,
      corridor: null, room: null, water: 'water_deep', ceil: null,
      props: [['pr_sun_statue', 2], ['pr_gold_pile', 2], ['pr_candles', 2], ['pr_pillar', 2]], propRate: 0.12,
    },
    mirror: {
      walls: [[null, 60], ['dc_frost', 20], ['dc_frost_runes', 8], ['dc_crystal', 5]],
      lights: [['dc_crystal_lamp', 1]], lightEvery: 12,
      corridor: null, room: null, water: 'water_deep', ceil: null,
      props: [['pr_mirror_stand', 3], ['pr_icepillar', 2], ['pr_altar_ice', 1], ['pr_icicles_hang', 2]], propRate: 0.12,
    },
    hollow: {
      walls: [[null, 38], ['dc_amberroots', 16], ['dc_roots', 16], ['dc_moss', 10], ['dc_rootsigil', 5]],
      lights: [['dc_lantern_amber', 3]], lightEvery: 10,
      corridor: [[null, 50], ['roots_floor', 30], ['moss_floor', 20]], room: [[null, 50], ['roots_floor', 25], ['moss_floor', 25]], water: 'water_deep',
      ceil: [[null, 40], ['ceil_roots', 60]],
      props: [['pr_roots', 3], ['pr_mushrooms', 3], ['pr_amber_lantern', 2], ['pr_bones', 1], ['pr_stalagmite', 2]], propRate: 0.13,
    },
    folded: {
      walls: [[null, 50], ['dc_frost', 14], ['dc_cobweb', 7], ['dc_cracks', 7], ['dc_drawings', 4], ['dc_painting', 4], ['dc_clockface', 3], ['dc_window', 2], ['dc_door', 4]],
      lights: [['dc_candles', 3]], lightEvery: 10,
      corridor: null, room: [[null, 60], ['rug_blue', 20], ['floor_oak', 20]], water: 'water_deep',
      ceil: null,
      props: [['pr_chair', 2], ['pr_table', 1], ['pr_rockinghorse', 1], ['pr_trunk', 2], ['pr_plant_frozen', 1], ['pr_clock_tall', 1], ['pr_coatrack', 1], ['pr_candles', 1], ['pr_cobweb_hang', 1]], propRate: 0.1,
    },
  };

  const pick = (rng, list) => (Array.isArray(list) ? U.weighted(list, rng) : list);
  const fi = (m, x, y, d) => (y * m.w + x) * 4 + d;
  const open = (m, x, y) => MG.inside(m, x, y) && !(m.fl[y][x] & MG.F_SOLID);

  function init(m) {
    m.faceTex = new Array(m.w * m.h * 4).fill(null);
    m.floorTex = []; m.ceilTex = [];
    for (let y = 0; y < m.h; y++) { m.floorTex.push(new Array(m.w).fill(null)); m.ceilTex.push(new Array(m.w).fill(null)); }
    m.props = [];
    m.lightSrc = [];
  }
  function wallFaces(m, x, y) {
    const out = [];
    for (let d = 0; d < 4; d++) if (MG.edge(m, x, y, d) === 1) out.push(d);
    return out;
  }
  function addLight(m, name, x, y, d) {
    const L = DR.LIGHTS[name];
    if (!L) return;
    const px = x + 0.5 + (d == null ? 0 : U.DX[d] * 0.42), py = y + 0.5 + (d == null ? 0 : U.DY[d] * 0.42);
    m.lightSrc.push({ x: px, y: py, cx: x, cy: y, r: L.r, col: L.col, i: L.i, flick: L.flick, phase: (x * 13 + y * 7) % 10 });
  }
  function setFace(m, x, y, d, base, decal) {
    m.faceTex[fi(m, x, y, d)] = decal ? base + '|' + decal : base;
    addLight(m, decal, x, y, d);
  }
  // A billboard against a wall of the cell (side = direction index) or in its centre (side null).
  function addProp(m, name, x, y, side, scale, hang) {
    const off = side == null ? 0 : 0.3;
    const p = { x: x + 0.5 + (side == null ? 0 : U.DX[side] * off), y: y + 0.5 + (side == null ? 0 : U.DY[side] * off), tex: name, scale: scale || 0.62, hang: !!hang };
    m.props.push(p);
    if (DR.LIGHTS[name]) { const L = DR.LIGHTS[name]; m.lightSrc.push({ x: p.x, y: p.y, cx: x, cy: y, r: L.r, col: L.col, i: L.i, flick: L.flick, phase: (x * 13 + y * 7) % 10 }); }
    return p;
  }
  const HANG = { pr_cobweb_hang: 1, pr_chain_hang: 1, pr_icicles_hang: 1 };
  const SCALE = { pr_pillar: 1.0, pr_clock_tall: 0.85, pr_icepillar: 0.95, pr_mirror_stand: 0.85, pr_statue_king: 0.85, pr_sun_statue: 0.85, pr_frozen_guard: 0.85,
    pr_bones: 0.4, pr_skullpile: 0.45, pr_rubble: 0.45, pr_mushrooms: 0.45, pr_candles: 0.5, pr_gold_pile: 0.5, pr_cobweb_hang: 0.7, pr_chain_hang: 0.7, pr_icicles_hang: 0.6,
    pr_bed: 0.62, pr_bed_child: 0.55, pr_chair: 0.5, pr_table: 0.55, pr_rockinghorse: 0.5, pr_dollhouse: 0.55, pr_trunk: 0.48, pr_sacks: 0.55, pr_millstone: 0.8, pr_gearwheel: 0.8,
    pr_wardrobe: 0.85, pr_bookcase: 0.85, pr_cupboard: 0.8, pr_lamp: 0.7, pr_coatrack: 0.75, pr_harp: 0.6, pr_plant_frozen: 0.5, pr_stove: 0.7, pr_counter: 0.6, pr_workbench: 0.62,
    pr_desk: 0.58, pr_dining: 0.6, pr_vanity: 0.65, pr_flourbin: 0.55, pr_spinning_wheel: 0.6, pr_armchair: 0.58, pr_dresser: 0.6, pr_cot: 0.5, pr_table_long: 0.55 };
  DR.scaleOf = (name) => SCALE[name] || 0.62;

  // ---------- generated dungeons ----------
  DR.dressLevel = function (m, spec) {
    const st = DR.STYLES[m.style];
    init(m);
    if (!st) { DR.computeLights(m); return m; }
    const rng = U.seeded((spec.seed || 1) * 31 + 7777);
    const base = BT.STYLES[m.style].wall, alt = BT.STYLES[m.style].wall2;
    // walls
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (!open(m, x, y)) continue;
      for (const d of wallFaces(m, x, y)) {
        const h = (x * 73856093) ^ (y * 19349663) ^ (d * 83492791);
        const b = alt && (h >>> 0) % 7 === 0 ? alt : base;
        setFace(m, x, y, d, b, pick(rng, st.walls));
      }
    }
    // light sources on walls, spread out
    const faces = [];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (open(m, x, y) && !(m.fl[y][x] & MG.F_DARK)) for (const d of wallFaces(m, x, y)) faces.push([x, y, d]);
    rng.shuffle(faces);
    const want = Math.round(m.w * m.h / (st.lightEvery || 10));
    const placed = [];
    for (const [x, y, d] of faces) {
      if (placed.length >= want) break;
      if (placed.some(([px, py]) => Math.abs(px - x) + Math.abs(py - y) < 4)) continue;
      const name = pick(rng, st.lights);
      setFace(m, x, y, d, m.faceTex[fi(m, x, y, d)].split('|')[0], name);
      placed.push([x, y]);
    }
    // floors and ceilings
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (!open(m, x, y)) continue;
      const inRoom = m.roomId && m.roomId[y][x] >= 0;
      if (m.fl[y][x] & MG.F_WATER) m.floorTex[y][x] = st.water;
      else if (!inRoom && st.corridor === 'sewer_channel') {
        const ns = MG.passable(MG.edge(m, x, y, 0)) || MG.passable(MG.edge(m, x, y, 2));
        const ew = MG.passable(MG.edge(m, x, y, 1)) || MG.passable(MG.edge(m, x, y, 3));
        m.floorTex[y][x] = ns && ew ? 'puddles' : ew ? 'sewer_channel@r' : 'sewer_channel';
      } else m.floorTex[y][x] = pick(rng, inRoom ? st.room : st.corridor) || null;
      m.ceilTex[y][x] = pick(rng, st.ceil) || null;
    }
    // props, not on event cells or the start
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (!open(m, x, y) || m.ev[y][x] || (m.start && m.start.x === x && m.start.y === y) || rng() >= (st.propRate || 0.1)) continue;
      const name = pick(rng, st.props);
      const walls = wallFaces(m, x, y);
      addProp(m, name, x, y, HANG[name] || !walls.length ? null : rng.pick(walls), DR.scaleOf(name), HANG[name]);
    }
    // dressing tied to what the level's notes describe
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const ev = m.ev[y][x];
      if (ev && ev.deco && !ev._dressed) applyFeatureDeco(m, ev, x, y, rng);
    }
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.ev[y][x]) delete m.ev[y][x]._dressed;
    DR.computeLights(m);
    return m;
  };

  // ev.deco = { walls: [...] each once, wallsAll: [...] repeated on every wall, near: radius in steps, props, propCount, floor }
  function applyFeatureDeco(m, ev, x0, y0, rng) {
    const dc = ev.deco;
    let cells;
    if (ev.t === 'boss' && m.bossRoom) { cells = m.bossRoom.cells.map(([x, y]) => [x, y]); ev._dressed = true; }
    else {
      const dist = MG.bfs(m, x0, y0);
      cells = [];
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (dist[y][x] >= 0 && dist[y][x] <= (dc.near || 0)) cells.push([x, y]);
    }
    // walls: each picture once (nearest walls first); wallsAll: a pattern repeated on every wall nearby
    const faces = [];
    for (const [x, y] of cells) for (const d of wallFaces(m, x, y)) {
      const cur = m.faceTex[fi(m, x, y, d)] || BT.STYLES[m.style].wall;
      if (!DR.LIGHTS[cur.split('|')[1]]) faces.push([x, y, d, cur.split('|')[0], Math.abs(x - x0) + Math.abs(y - y0)]); // keep the torches
    }
    faces.sort((a, b) => a[4] - b[4]);
    const once = [].concat(dc.walls || []), all = [].concat(dc.wallsAll || []);
    faces.forEach(([x, y, d, base], i) => {
      if (i < once.length) setFace(m, x, y, d, base, once[i]);
      else if (all.length) setFace(m, x, y, d, base, all[(i - once.length) % all.length]);
    });
    if (dc.floor) for (const [x, y] of cells) m.floorTex[y][x] = dc.floor;
    const props = [].concat(dc.props || []);
    if (props.length) {
      // other events' cells stay clear; the feature's own cell(s) may hold its props
      const own = (x, y) => m.ev[y][x] === ev;
      const spots = rng.shuffle(cells.filter(([x, y]) => !m.ev[y][x] || own(x, y)));
      spots.sort((a, b) => (own(a[0], a[1]) ? 1 : 0) - (own(b[0], b[1]) ? 1 : 0));
      const n = Math.min(spots.length, dc.propCount || 2);
      for (let i = 0; i < n; i++) {
        const [x, y] = spots[i];
        const name = props[i % props.length], ws = wallFaces(m, x, y);
        addProp(m, name, x, y, HANG[name] || !ws.length ? null : rng.pick(ws), DR.scaleOf(name), HANG[name]);
      }
    }
  }

  // ---------- houses (room plans) ----------
  // spec.rooms: { A: { wall, floor, ceil, windows } }; spec.decals: ['x,y,d,dc_name']; spec.props: ['x,y,pr_name,side(n|e|s|w|c)[,scale]']
  DR.dressHouse = function (m, spec) {
    init(m);
    const rooms = spec.rooms || {};
    const roomOf = (x, y) => rooms[m.roomAt[y][x]] || {};
    const explicit = {};
    for (const s of spec.decals || []) { const [x, y, d, name] = MG.parseFace(s); explicit[fi(m, x, y, d)] = name; }
    const doorDecal = {};
    for (const s of spec.doors || []) {
      const [x, y, d, kind] = MG.parseFace(s);
      if (kind === 'secret') continue;
      const nx = x + U.DX[d], ny = y + U.DY[d];
      doorDecal[fi(m, x, y, d)] = kind === 'cellar' ? 'dc_door_cellar' : 'dc_door';
      if (MG.inside(m, nx, ny)) doorDecal[fi(m, nx, ny, (d + 2) % 4)] = kind === 'cellar' ? 'dc_door_cellar' : 'dc_door';
    }
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      if (!open(m, x, y)) continue;
      const R = roomOf(x, y);
      m.floorTex[y][x] = R.floor || null;
      m.ceilTex[y][x] = R.ceil || null;
      for (let d = 0; d < 4; d++) {
        const v = MG.edge(m, x, y, d);
        if (v === 0) continue;
        const k = fi(m, x, y, d);
        const wall = R.wall || BT.STYLES[m.style].wall;
        const nx = x + U.DX[d], ny = y + U.DY[d];
        const outside = !MG.inside(m, nx, ny);
        let decal = explicit[k] || (v === 2 ? doorDecal[k] || 'dc_door' : null);
        if (!decal && outside && R.windows !== false && (x + y + d) % 3 === 0) decal = 'dc_window';
        setFace(m, x, y, d, wall, decal);
      }
    }
    for (const s of spec.props || []) {
      const p = s.split(',');
      const side = p[3] && p[3] !== 'c' ? MG.DIRS[p[3]] : null;
      addProp(m, p[2], +p[0], +p[1], side, p[4] ? +p[4] : DR.scaleOf(p[2]), HANG[p[2]]);
    }
    DR.computeLights(m);
    return m;
  };

  // Which cells each light reaches: walk through open edges (walls and closed doors block light).
  DR.computeLights = function (m) {
    m.lights = m.lightSrc || [];
    m.cellLights = new Array(m.w * m.h).fill(null);
    m.lights.forEach((L, li) => {
      const R = Math.ceil(L.r);
      const seen = { [L.cx + ',' + L.cy]: 0 };
      const q = [[L.cx, L.cy]];
      while (q.length) {
        const [x, y] = q.shift();
        const d0 = seen[x + ',' + y];
        const k = y * m.w + x;
        if (!(m.fl[y][x] & MG.F_DARK)) (m.cellLights[k] || (m.cellLights[k] = [])).push(li); // magical darkness eats light
        if (d0 >= R) continue;
        for (let d = 0; d < 4; d++) {
          if (MG.edge(m, x, y, d) !== 0) continue;
          const nx = x + U.DX[d], ny = y + U.DY[d];
          if (!MG.inside(m, nx, ny) || seen[nx + ',' + ny] != null) continue;
          seen[nx + ',' + ny] = d0 + 1;
          q.push([nx, ny]);
        }
      }
    });
    delete m.lightSrc;
  };

  // Every texture name the dressing may ask for (tests check the packs provide them).
  DR.textureNames = function () {
    const out = new Set(Object.keys(DR.LIGHTS));
    for (const k in DR.STYLES) {
      const st = DR.STYLES[k];
      for (const f of ['walls', 'lights', 'props', 'room', 'corridor', 'ceil']) {
        const v = st[f];
        if (Array.isArray(v)) { for (const [n] of v) if (n) out.add(n); } else if (typeof v === 'string') out.add(v);
      }
      if (st.water) out.add(st.water);
    }
    out.add('sewer_channel'); out.add('puddles');
    return [...out];
  };

  BT.DRESS = DR;
})();
