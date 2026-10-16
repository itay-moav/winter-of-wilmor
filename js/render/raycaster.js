// The first-person view: a raycaster over the thin-wall grid with per-face decals, per-cell floors and
// ceilings, animated water, coloured lights, billboards, snow, shake and flashes.
(function () {
  const U = BT.U, MG = BT.MG;
  const R = {};
  const W = 640, H = 400, HALF = H / 2;
  const WALLH = 1.0;      // wall height scale
  const PLANE = 0.72;     // camera plane length (FOV)
  const BACK = 0.32;      // camera sits this far behind the cell centre

  let canvas, ctx, img, buf, zbuf;
  let cam = null, anim = null, dirty = true, lastFrame = null;
  let snow = [];
  let shake = 0, flash = null;

  R.init = function (cv) {
    canvas = cv;
    canvas.width = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');
    img = ctx.createImageData(W, H);
    buf = new Uint32Array(img.data.buffer);
    zbuf = new Float32Array(W);
    for (let i = 0; i < 160; i++) snow.push({ x: Math.random() * W, y: Math.random() * H, s: 0.5 + Math.random() * 1.6, v: 0.3 + Math.random() * 0.9 });
    requestAnimationFrame(loop);
  };

  function targetCam() {
    const G = BT.G;
    const a = G.d * Math.PI / 2 - Math.PI / 2;
    return { x: G.x + 0.5 - Math.cos(a) * BACK, y: G.y + 0.5 - Math.sin(a) * BACK, a };
  }

  // Snap camera to current state (after teleports, map changes).
  R.snap = function () { cam = targetCam(); anim = null; dirty = true; };
  R.invalidate = function () { dirty = true; };

  // Animate the camera from its current pose to the state pose.
  R.animate = function (ms) {
    const to = targetCam();
    if (!cam) { cam = to; dirty = true; return Promise.resolve(); }
    // pick the shortest rotation
    let da = to.a - cam.a;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    const from = Object.assign({}, cam);
    return new Promise((res) => {
      anim = { from, to: { x: to.x, y: to.y, a: from.a + da }, t0: performance.now(), ms: ms || 150, res };
    });
  };
  R.bump = function () {
    const a = cam.a;
    const from = Object.assign({}, cam);
    const to = { x: cam.x + Math.cos(a) * 0.12, y: cam.y + Math.sin(a) * 0.12, a };
    return new Promise((res) => {
      anim = { from, to, t0: performance.now(), ms: 110, res, bounce: true };
    });
  };
  R.shake = function (amt) { shake = amt || 8; };
  R.flash = function (color, ms) { flash = { color, t0: performance.now(), ms: ms || 300 }; };

  function loop(t) {
    requestAnimationFrame(loop);
    if (!BT.G || !canvas || !BT.MAPS[BT.G.map]) return;
    if (anim) {
      let k = Math.min(1, (t - anim.t0) / anim.ms);
      let e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      if (anim.bounce) e = Math.sin(k * Math.PI);
      cam = {
        x: anim.from.x + (anim.to.x - anim.from.x) * e,
        y: anim.from.y + (anim.to.y - anim.from.y) * e,
        a: anim.from.a + (anim.to.a - anim.from.a) * e,
      };
      dirty = true;
      if (k >= 1) {
        const r = anim.res;
        if (anim.bounce) cam = anim.from;
        else cam = anim.to;
        anim = null;
        r();
      }
    }
    if (!cam) cam = targetCam();
    const style = BT.STYLES[BT.MAPS[BT.G.map].style];
    if (!style.snow && lastFrame !== null && t - lastFrame > 90) dirty = true; // torch flicker
    if (dirty) {
      draw();
      dirty = false;
      lastFrame = t;
    }
    ctx.putImageData(img, 0, 0);
    if (style.snow) drawSnow();
    if (shake > 0) {
      canvas.style.transform = 'translate(' + (Math.random() - 0.5) * shake + 'px,' + (Math.random() - 0.5) * shake + 'px)';
      shake *= 0.85;
      if (shake < 0.5) { shake = 0; canvas.style.transform = ''; }
    }
    if (flash) {
      const k = (t - flash.t0) / flash.ms;
      if (k >= 1) flash = null;
      else {
        ctx.globalAlpha = 0.55 * (1 - k);
        ctx.fillStyle = flash.color;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }
  }

  function drawSnow() {
    const wind = Math.sin(performance.now() / 3000) * 0.4;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const p of snow) {
      p.y += p.v;
      p.x += wind + Math.sin((p.y + p.s * 100) / 30) * 0.3;
      if (p.y > H) { p.y = -2; p.x = Math.random() * W; }
      if (p.x < 0) p.x += W;
      if (p.x > W) p.x -= W;
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
  }

  // ----- lighting -----
  function lightParams() {
    const G = BT.G, m = BT.MAPS[G.map], style = BT.STYLES[m.style];
    const inDark = m.fl[G.y][G.x] & MG.F_DARK;
    if (m.style === 'town') {
      const night = BT.ST.isNight();
      return { town: true, R: night ? 7 : 22, min: night ? 0.05 : 0.3, fog: night ? [8, 10, 24] : [150, 160, 180] };
    }
    let r = 1.7;
    const fx = G.fx;
    if (!inDark) {
      if (fx.light && fx.light.steps > 0) r = Math.max(r, fx.light.r + 1.2);
      if (fx.song && fx.song.id === 'lantern') r = Math.max(r, 4 * (fx.song.power || 1) + 1.2);
      r = Math.max(r, style.ambient * 6);
    } else r = 1.1;
    return { town: false, R: r, min: 0, fog: style.fog, glow: m.style === 'tower' && !inDark };
  }

  // Texture by name ('base' or 'base|decal'), falling back to the style's plain wall.
  function texNamed(name, fallback) {
    const t = name ? BT.TX.get(name) : null;
    return t || BT.TX.data[fallback] || BT.TX.data.crypt;
  }

  function texFor(m, x, y, d, v, sx, sy) {
    // (x,y) cell the ray is in, d direction crossing, v edge value. (sx,sy) neighbour cell.
    const T = BT.TX.data;
    const style = m.style;
    if (style === 'town') {
      const inside = MG.inside(m, sx, sy);
      const c = inside ? m.cellType[sy][sx] : '#';
      const b = BT.BUILDINGS[c];
      if (b && b.temple) {
        // 2x2 temples: each cell face shows one half of a wide facade
        const along = d === 0 || d === 2 ? (sx - 2) % 3 : (sy - 2) % 3;
        const left = d === 0 || d === 1 ? along === 0 : along === 1;
        return T['temple_' + b.temple + (left ? '_L' : '_R')];
      }
      if (b) return T['facade_' + c];
      if (!inside || sx === 0 || sy === 0 || sx === m.w - 1 || sy === m.h - 1) return T.citywall;
      return T['house' + ((sx * 7 + sy * 13) % BT.TX.HOUSES)];
    }
    const st = BT.STYLES[style];
    const secretShown = v === 3 && BT.G.fx.light && BT.G.fx.light.secret && BT.G.fx.light.steps > 0;
    const face = m.faceTex ? m.faceTex[(y * m.w + x) * 4 + d] : null;
    if (secretShown || (v === 2 && !m.roomAt)) return texNamed(st.door || 'door_' + style, st.wall);
    if (face) return texNamed(face, st.wall);
    if (v === 2) return texNamed(st.door || 'door_' + style, st.wall);
    const h = (x * 73856093) ^ (y * 19349663) ^ (d * 83492791);
    if ((h >>> 0) % 7 === 0 && T[st.wall + '2']) return T[st.wall + '2'];
    return T[st.wall] || T.crypt;
  }

  // Per-cell floor/ceiling textures resolved once per map: {px, rot, anim} or null.
  const ANIM = { water: 1, water_deep: 1, sewer_channel: 1 };
  function cellRefs(m, key) {
    const cacheKey = '_' + key + 'Ref';
    if (m[cacheKey] && m[cacheKey].ready === BT.TX.ready) return m[cacheKey];
    const src = m[key], out = new Array(m.w * m.h).fill(null);
    out.ready = BT.TX.ready;
    if (src) for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const n = src[y][x];
      if (!n) continue;
      const rot = n.slice(-2) === '@r', name = rot ? n.slice(0, -2) : n;
      const t = BT.TX.get(name);
      if (t) out[y * m.w + x] = { px: t.px, rot, anim: !!ANIM[name] };
    }
    m[cacheKey] = out;
    return out;
  }
  // Light strength this frame for every source (with flicker).
  function lightLevels(m, t) {
    const L = m.lights || [], out = new Float32Array(L.length);
    for (let i = 0; i < L.length; i++) {
      const s = L[i];
      out[i] = s.i * (1 - s.flick * 0.16 * (0.5 + 0.5 * Math.sin(t / (60 + s.phase * 9) + s.phase) * Math.sin(t / 37 + s.phase * 2)));
    }
    return out;
  }
  // Coloured light reaching world point (wx, wy) in cell k; adds into acc[0..2].
  function lightAt(m, lv, k, wx, wy, acc) {
    acc[0] = acc[1] = acc[2] = 0;
    const list = m.cellLights ? m.cellLights[k] : null;
    if (!list) return false;
    for (let j = 0; j < list.length; j++) {
      const s = m.lights[list[j]], dx = wx - s.x, dy = wy - s.y, r2 = s.r * s.r;
      const d2 = dx * dx + dy * dy;
      if (d2 >= r2) continue;
      const f = (1 - d2 / r2) * lv[list[j]];
      acc[0] += f * s.col[0]; acc[1] += f * s.col[1]; acc[2] += f * s.col[2];
    }
    return true;
  }

  function draw() {
    const G = BT.G, m = BT.MAPS[G.map], style = BT.STYLES[m.style];
    const T = BT.TX.data;
    const L = lightParams();
    const fogR = L.fog[0], fogG = L.fog[1], fogB = L.fog[2];
    const dirX = Math.cos(cam.a), dirY = Math.sin(cam.a);
    const plX = -dirY * PLANE, plY = dirX * PLANE;
    const px = cam.x, py = cam.y;
    const TS = BT.TX.size;
    const t = performance.now();
    const flick = L.town ? 1 : 0.94 + 0.06 * Math.sin(t / 90) * Math.sin(t / 37);

    function bright(dist) {
      let b = 1 - dist / L.R;
      if (b < L.min) b = L.min;
      if (L.glow) b = Math.max(b, 0.32 * (1 - dist / 10));
      if (b < 0) b = 0;
      return b * flick;
    }

    // ---- floor & ceiling ----
    // a style whose texture pack is missing falls back to plain stone rather than breaking the frame
    const floorT = T[style.floor] || T.cryptfloor;
    const ceilT = style.ceil === 'sky' ? null : T[style.ceil] || T.cryptceil;
    const fRef = cellRefs(m, 'floorTex'), cRef = cellRefs(m, 'ceilTex');
    const lv = lightLevels(m, t), lit = !!(m.cellLights && m.lights && m.lights.length), acc = [0, 0, 0];
    const flow = (t / 45) | 0;
    const night = BT.ST.isNight();
    const rdx0 = dirX - plX, rdy0 = dirY - plY, rdx1 = dirX + plX, rdy1 = dirY + plY;
    const posZ = HALF * WALLH;
    for (let y = HALF + 1; y < H; y++) {
      const p = y - HALF;
      const rowDist = posZ / p;
      const b = bright(rowDist);
      const stepX = rowDist * (rdx1 - rdx0) / W, stepY = rowDist * (rdy1 - rdy0) / W;
      let fx = px + rowDist * rdx0, fy = py + rowDist * rdy0;
      const yc = H - y - 1;
      const rowF = y * W, rowC = yc * W;
      const ib = 1 - b;
      const fr = fogR * ib, fg = fogG * ib, fb = fogB * ib;
      for (let x = 0; x < W; x++) {
        const cx = Math.floor(fx), cy = Math.floor(fy);
        const tx = ((fx - cx) * TS) | 0, ty = ((fy - cy) * TS) | 0;
        const wx = fx, wy = fy;
        fx += stepX; fy += stepY;
        const ti = ty * TS + tx;
        const inMap = cx >= 0 && cy >= 0 && cx < m.w && cy < m.h, k = inMap ? cy * m.w + cx : -1;
        // light: ambient falloff plus coloured sources
        let sr = b, sg = b, sb = b, w = ib;
        if (lit && inMap && lightAt(m, lv, k, wx, wy, acc)) {
          sr = Math.min(1.7, b + acc[0]); sg = Math.min(1.7, b + acc[1]); sb = Math.min(1.7, b + acc[2]);
          w = 1 - Math.min(1, b + Math.max(acc[0], acc[1], acc[2]));
        }
        const fwr = fogR * w, fwg = fogG * w, fwb = fogB * w;
        const fr0 = k >= 0 ? fRef[k] : null;
        let c;
        if (fr0) {
          let u = tx, v = ty;
          if (fr0.rot) { u = ty; v = tx; }
          if (fr0.anim) v = (v + flow) & (TS - 1);
          c = fr0.px[v * TS + u];
        } else c = floorT.px[ti];
        buf[rowF + x] = 0xff000000 | (Math.min(255, (((c >> 16) & 255) * sb + fwb) | 0) << 16) | (Math.min(255, (((c >> 8) & 255) * sg + fwg) | 0) << 8) | Math.min(255, ((c & 255) * sr + fwr) | 0);
        if (ceilT) {
          const cr0 = k >= 0 ? cRef[k] : null;
          c = cr0 ? cr0.px[ti] : ceilT.px[ti];
          buf[rowC + x] = 0xff000000 | (Math.min(255, (((c >> 16) & 255) * sb + fwb) | 0) << 16) | (Math.min(255, (((c >> 8) & 255) * sg + fwg) | 0) << 8) | Math.min(255, ((c & 255) * sr + fwr) | 0);
        }
      }
    }
    if (!ceilT) {
      // sky gradient
      for (let y = 0; y <= HALF; y++) {
        const k = y / HALF;
        let r, g, bb;
        if (night) { r = 6 + 20 * k; g = 8 + 24 * k; bb = 22 + 40 * k; }
        else if (G.flags.malthor) { r = 70 + 120 * k; g = 140 + 90 * k; bb = 230 + 20 * k; } // spring
        else { r = 120 + 80 * k; g = 135 + 75 * k; bb = 160 + 60 * k; }
        const c = 0xff000000 | ((bb | 0) << 16) | ((g | 0) << 8) | (r | 0);
        buf.fill(c, y * W, y * W + W);
      }
      if (night) {
        const sr = U.seeded(42);
        for (let i = 0; i < 90; i++) {
          const sx = sr.int(W), sy = sr.int(HALF - 10);
          buf[sy * W + sx] = 0xffffffff;
        }
      }
    }

    // ---- walls ----
    // In town the ray keeps going past short buildings so taller ones show behind them.
    const multi = m.style === 'town';
    const hits = [];
    for (let x = 0; x < W; x++) {
      zbuf[x] = 1e9;
      const camX = 2 * x / W - 1;
      const rdx = dirX + plX * camX, rdy = dirY + plY * camX;
      let mx = Math.floor(px), my = Math.floor(py);
      const ddx = Math.abs(1 / rdx), ddy = Math.abs(1 / rdy);
      let stX, stY, sdx, sdy;
      if (rdx < 0) { stX = -1; sdx = (px - mx) * ddx; } else { stX = 1; sdx = (mx + 1 - px) * ddx; }
      if (rdy < 0) { stY = -1; sdy = (py - my) * ddy; } else { stY = 1; sdy = (my + 1 - py) * ddy; }
      hits.length = 0;
      for (let i = 0; i < 64; i++) {
        let d, nd, nx = mx, ny = my, side;
        if (sdx < sdy) { d = stX > 0 ? 1 : 3; nd = sdx; nx = mx + stX; side = 0; }
        else { d = stY > 0 ? 2 : 0; nd = sdy; ny = my + stY; side = 1; }
        if (!MG.inside(m, mx, my)) {
          if (!hits.length) hits.push({ dist: nd, side, tex: T[style.wall === 'house' ? 'citywall' : style.wall] || T.crypt, h: 1.3 });
          break;
        }
        const v = MG.edge(m, mx, my, d);
        const fromOpen = !(m.fl[my][mx] & MG.F_SOLID);
        if ((v === 1 || v === 2 || v === 3) && fromOpen) {
          const tex = texFor(m, mx, my, d, v, nx, ny);
          let h = 1;
          if (multi) h = MG.inside(m, nx, ny) && m.cellH ? m.cellH[ny][nx] : 1.3;
          hits.push({ dist: nd, side, tex, h, k: my * m.w + mx });
          if (!multi) break;
          // a wall whose top is above the screen hides everything behind it
          const lh = H * WALLH / nd;
          if (HALF + lh / 2 - h * lh <= 0 || hits.length >= 10) break;
        }
        if (side === 0) { sdx += ddx; mx = nx; } else { sdy += ddy; my = ny; }
      }
      if (!hits.length) continue;
      zbuf[x] = hits[0].dist;
      for (let hi = hits.length - 1; hi >= 0; hi--) {
        const { dist, side, tex, h } = hits[hi];
        let wallX = side === 0 ? py + dist * rdy : px + dist * rdx;
        wallX -= Math.floor(wallX);
        let tx = (wallX * TS) | 0;
        if (side === 0 && rdx < 0) tx = TS - tx - 1;
        if (side === 1 && rdy > 0) tx = TS - tx - 1;
        const lh = H * WALLH / dist;
        const floorY = HALF + lh / 2;
        const top = floorY - h * lh;
        const y0 = Math.max(0, Math.ceil(top)), y1 = Math.min(H, Math.floor(floorY));
        const b = bright(dist) * (side ? 0.82 : 1);
        let ib = 1 - Math.min(1, bright(dist));
        let sr = b, sg = b, sb = b;
        if (lit && hits[hi].k != null && lightAt(m, lv, hits[hi].k, px + dist * rdx, py + dist * rdy, acc)) {
          const sh = side ? 0.82 : 1;
          sr = Math.min(1.7, b + acc[0] * sh); sg = Math.min(1.7, b + acc[1] * sh); sb = Math.min(1.7, b + acc[2] * sh);
          ib = 1 - Math.min(1, bright(dist) + Math.max(acc[0], acc[1], acc[2]));
        }
        const fr = fogR * ib, fg = fogG * ib, fb = fogB * ib;
        const tpx = tex.px;
        const mode = tex.mode;
        for (let y = y0; y < y1; y++) {
          const sH = (floorY - y) / lh; // height above the ground, in wall units
          let v;
          if (h <= 1.001) v = 1 - sH;
          else if (mode === 'stretch') v = 1 - sH / h;
          else if (mode === 'tile') { v = (h - sH) % 1; }
          else if (sH < 0.5) v = 1 - sH;            // ground floor
          else if (sH > h - 0.15) v = h - sH;       // roof eave
          else v = 0.5 - ((sH - 0.5) % 0.35);       // repeated upper storeys
          let ty = (v * TS) | 0;
          if (ty < 0) ty = 0; else if (ty >= TS) ty = TS - 1;
          const c = tpx[ty * TS + tx];
          buf[y * W + x] = 0xff000000 | ((Math.min(255, ((c >> 16) & 255) * sb + fb) | 0) << 16) | ((Math.min(255, ((c >> 8) & 255) * sg + fg) | 0) << 8) | (Math.min(255, (c & 255) * sr + fr) | 0);
        }
      }
    }
    drawSprites(m, px, py, dirX, dirY, plX, plY, bright, L.fog, lit ? lv : null);
  }

  // Which billboard (if any) to show for an event cell.
  function spriteFor(m, x, y, ev) {
    const G = BT.G, k = G.map + ':' + x + ':' + y;
    switch (ev.t) {
      case 'stairs': {
        const up = (ev.dir === 'up') !== (m.style === 'tower');
        return { tex: up ? 'sp_stairs_up' : 'sp_stairs_down', scale: up ? 0.9 : 1 };
      }
      case 'warp':
        if (ev.label === 'portal') return { tex: ev.require && !G.flags[ev.require.flag] ? 'sp_portal_off' : 'sp_portal_on', scale: 1 };
        if (ev.label === 'up') return { tex: 'sp_stairs_up', scale: 0.9 };
        if (ev.label === 'down') return { tex: 'sp_stairs_down', scale: 1 };
        return null;
      case 'fountain':
        if (ev.kind === 'town') return { tex: G.flags.malthor ? 'sp_fountain' : 'sp_frozen_fountain', scale: 0.85 };
        return { tex: 'sp_fountain', scale: 0.8 };
      case 'shrine': return { tex: ev.faith && ev.faith !== 'dawn' ? 'sp_shrine_' + ev.faith : 'sp_shrine', scale: 0.9 };
      case 'statue': return G.flags[k] === 'broken' ? { tex: 'sp_rubble', scale: 0.4 } : { tex: 'sp_statue', scale: 0.95 };
      case 'chest': return G.flags[k] ? null : { tex: 'sp_chest', scale: 0.55 };
      case 'riddle': return G.flags[ev.flag] ? null : { tex: 'sp_mouth', scale: 0.6, float: true };
      case 'msg': return ev.grave ? { tex: 'sp_grave_' + ev.grave, scale: 0.7 } : null;
    }
    return null;
  }

  function drawSprites(m, px, py, dirX, dirY, plX, plY, bright, fog, lv) {
    const T = BT.TX.data, TS = BT.TX.size;
    const list = [];
    const acc = [0, 0, 0];
    for (const p of m.props || []) {
      const sx = p.x - px, sy = p.y - py, d = sx * sx + sy * sy;
      if (d > 90) continue;
      const tx = BT.TX.get(p.tex);
      if (!tx) continue;
      list.push({ sp: { tex: p.tex, scale: p.scale, hang: p.hang }, sx, sy, d, wx: p.x, wy: p.y });
    }
    const x0 = Math.max(0, Math.floor(px) - 9), x1 = Math.min(m.w - 1, Math.floor(px) + 9);
    const y0 = Math.max(0, Math.floor(py) - 9), y1 = Math.min(m.h - 1, Math.floor(py) + 9);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const ev = m.ev[y][x];
      if (!ev) continue;
      const sp = spriteFor(m, x, y, ev);
      if (!sp || !BT.TX.get(sp.tex)) continue;
      const sx = x + 0.5 - px, sy = y + 0.5 - py;
      list.push({ sp, sx, sy, d: sx * sx + sy * sy, wx: x + 0.5, wy: y + 0.5 });
    }
    list.sort((a, b) => b.d - a.d);
    const det = dirX * plY - plX * dirY;
    for (const { sp, sx, sy, wx, wy } of list) {
      const depth = (sx * plY - plX * sy) / det;
      const lat = (dirX * sy - sx * dirY) / det;
      if (depth < (sp.hang ? 0.2 : 0.45)) continue; // what stands in your own cell would fill the screen
      const scrX = (W / 2) * (1 + lat / depth);
      const fullH = H * WALLH / depth;
      const sh = fullH * sp.scale;
      const floorY = HALF + fullH / 2;
      const top = sp.float ? HALF - sh / 2 : sp.hang ? HALF - fullH / 2 : floorY - sh;
      const left = scrX - sh / 2;
      const cx0 = Math.max(0, Math.floor(left)), cx1 = Math.min(W, Math.ceil(left + sh));
      const yy0 = Math.max(0, Math.ceil(top)), yy1 = Math.min(H, Math.floor(top + sh));
      const b = bright(depth);
      let ib = 1 - Math.min(1, b), lr = b, lg = b, lb = b;
      const ck = Math.floor(wy) * m.w + Math.floor(wx);
      if (lv && lightAt(m, lv, ck, wx, wy, acc)) {
        lr = Math.min(1.7, b + acc[0]); lg = Math.min(1.7, b + acc[1]); lb = Math.min(1.7, b + acc[2]);
        ib = 1 - Math.min(1, b + Math.max(acc[0], acc[1], acc[2]));
      }
      const fr = fog[0] * ib, fg = fog[1] * ib, fb = fog[2] * ib;
      const tpx = BT.TX.get(sp.tex).px;
      for (let col = cx0; col < cx1; col++) {
        if (depth >= zbuf[col]) continue;
        const tx = Math.min(TS - 1, ((col - left) / sh * TS) | 0);
        for (let y = yy0; y < yy1; y++) {
          const ty = Math.min(TS - 1, ((y - top) / sh * TS) | 0);
          const c = tpx[ty * TS + tx];
          const a = c >>> 24;
          if (a < 40) continue;
          const r = (c & 255) * lr + fr, g = ((c >> 8) & 255) * lg + fg, bl = ((c >> 16) & 255) * lb + fb;
          const i = y * W + col;
          if (a > 220) buf[i] = 0xff000000 | (Math.min(255, bl | 0) << 16) | (Math.min(255, g | 0) << 8) | Math.min(255, r | 0);
          else {
            const o = buf[i], k = a / 255, ik = 1 - k;
            buf[i] = 0xff000000 | (Math.min(255, (bl * k + ((o >> 16) & 255) * ik) | 0) << 16) | (Math.min(255, (g * k + ((o >> 8) & 255) * ik) | 0) << 8) | Math.min(255, (r * k + (o & 255) * ik) | 0);
          }
        }
      }
    }
  }

  R.W = W; R.H = H;
  BT.R = R;
})();
