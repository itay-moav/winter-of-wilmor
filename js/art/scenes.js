/* Velmoor art: Full-screen scenes (800x450): shared sky, snow, fog, city and perspective helpers, then the title, victory,
 * game over, town, dungeon and folded-cellar transition scenes.
 * Plain script (no modules); load order is listed in js/art/api.js. */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL;
/* from core.js */
var f = A.f, mix = A.mix, shade = A.shade, P = A.P, C = A.C, E = A.E, R = A.R, L = A.L, G = A.G, T = A.T, poly = A.poly, sparkle = A.sparkle,
    INK = A.INK, SCENES = A.SCENES;
/* from figures.js */
var lerp2 = A.lerp2;
/* from keepsakes.js */
var fh_frame = A.fh_frame;
/* from monsters-humanoids.js */
var mc_metal = A.mc_metal;

/* ------------------------------------------------------------------ */
/* Scenes (800x450)                                                    */
/* ------------------------------------------------------------------ */

/* starfield */
function sc_stars(rnd, n, ymax, col) {
  var s = '';
  for (var i = 0; i < n; i++) {
    var x = rnd() * 800, y = Math.pow(rnd(), 1.3) * ymax, big = rnd() < 0.06;
    if (big) s += sparkle(x, y, 3 + rnd() * 3, col || '#fff', { opacity: f(0.6 + rnd() * 0.4) });
    else s += C(x, y, 0.4 + rnd() * 0.9, col || '#fff', { opacity: f(0.25 + rnd() * 0.7) });
  }
  return s;
}

/* falling snow; near flakes blurred */
function sc_snow(d, rnd, n, col, op, ymin) {
  var far = '', near = '';
  col = col || '#fff'; op = op == null ? 1 : op; ymin = ymin || 0;
  for (var i = 0; i < n; i++) {
    var x = rnd() * 800, y = ymin + rnd() * (450 - ymin), z = rnd();
    if (z < 0.85) far += C(x, y, 0.6 + z * 1.6, col, { opacity: f((0.35 + rnd() * 0.5) * op) });
    else near += C(x, y, 3 + rnd() * 3.5, col, { opacity: f((0.4 + rnd() * 0.3) * op) });
  }
  return G(far) + G(near, { filter: d.blur(1.6) });
}

/* soft fog band */
function sc_fog(d, y, h, col, op) {
  return R(-20, y - h / 2, 840, h, d.lin([[0, col, 0], [0.5, col, op], [1, col, 0]]));
}

/* jagged ridge (mountains / hills) */
function sc_ridge(rnd, base, amp, step, fill, smooth, ex) {
  var s = 'M-20 460 L-20 ' + f(base - rnd() * amp), x = -20, py = base;
  while (x < 820) {
    x += step * (0.6 + rnd() * 0.8);
    var y = base - rnd() * amp;
    if (smooth) s += ' Q' + f(x - step / 2) + ' ' + f((py + y) / 2 - amp * 0.2) + ' ' + f(x) + ' ' + f(y);
    else s += ' L' + f(x) + ' ' + f(y);
    py = y;
  }
  return P(s + ' L820 460Z', fill, null, null, ex);
}

/* gothic city silhouette between x0..x1; returns markup */
function sc_city(d, rnd, o) {
  var body = '', snow = '', wins = '', x = o.x0 == null ? -30 : o.x0, x1 = o.x1 == null ? 830 : o.x1;
  var base = o.base, sw = o.snowW || 2;
  while (x < x1) {
    var w = (o.wMin || 26) + rnd() * (o.wVar || 44), h = o.hMin + rnd() * (o.hMax - o.hMin), top = base - h, t = rnd();
    if (t < 0.42) { /* gabled house */
      var rh = w * (0.45 + rnd() * 0.3);
      body += poly([x, base, x, top, x + w / 2, top - rh, x + w, top, x + w, base]);
      if (o.snow) snow += P('M' + f(x - 1.5) + ' ' + f(top + 1.5) + ' L' + f(x + w / 2) + ' ' + f(top - rh) + ' L' + f(x + w + 1.5) + ' ' + f(top + 1.5), 'none', o.snow, sw);
      if (rnd() < 0.5) body += poly([x + w * 0.7, top - rh * 0.3, x + w * 0.7, top - rh * 0.8, x + w * 0.8, top - rh * 0.8, x + w * 0.8, top - rh * 0.1]);
    } else if (t < 0.64) { /* tower with spire */
      var tw = w * 0.55, tx = x + (w - tw) / 2, sh = tw * (2 + rnd() * 1.5), lowTop = top + h * 0.4;
      body += poly([x, base, x, lowTop, tx, lowTop, tx, top, tx - 2, top, tx + tw / 2, top - sh, tx + tw + 2, top, tx + tw, top, tx + tw, lowTop, x + w, lowTop, x + w, base]);
      if (o.snow) {
        snow += P('M' + f(tx - 2) + ' ' + f(top) + ' L' + f(tx + tw / 2) + ' ' + f(top - sh) + ' L' + f(tx + tw + 2) + ' ' + f(top), 'none', o.snow, sw * 0.8);
        snow += L(x, lowTop, x + w, lowTop, o.snow, sw);
      }
    } else if (t < 0.82) { /* crenellated keep */
      var s = [x, base, x, top], mw = w / 7;
      for (var i = 0; i < 7; i++) { var mx = x + i * mw; if (i % 2 === 0) s.push(mx, top - mw, mx + mw, top - mw, mx + mw, top); else s.push(mx + mw, top); }
      s.push(x + w, base);
      body += poly(s);
      if (o.snow) snow += L(x, top - mw, x + w, top - mw, o.snow, sw * 0.7, { 'stroke-dasharray': f(mw) + ' ' + f(mw) });
    } else { /* twin-spired chapel */
      var hw = w / 2, sp = h * 0.6;
      body += poly([x, base, x, top, x + w * 0.12, top - sp, x + w * 0.24, top, x + w * 0.3, top, x + hw, top - h * 0.25, x + w * 0.7, top, x + w * 0.76, top, x + w * 0.88, top - sp, x + w, top, x + w, base]);
      if (o.snow) {
        snow += P('M' + f(x) + ' ' + f(top) + ' L' + f(x + w * 0.12) + ' ' + f(top - sp) + ' L' + f(x + w * 0.24) + ' ' + f(top), 'none', o.snow, sw * 0.7);
        snow += P('M' + f(x + w * 0.76) + ' ' + f(top) + ' L' + f(x + w * 0.88) + ' ' + f(top - sp) + ' L' + f(x + w) + ' ' + f(top), 'none', o.snow, sw * 0.7);
      }
      if (o.win) wins += C(x + hw, top + h * 0.15, Math.min(6, w * 0.1), o.win, { opacity: 0.9 });
    }
    if (o.win) {
      var ws = o.winS || 1;
      for (var wy = top + 6 * ws; wy < base - 8 * ws; wy += 11 * ws) {
        for (var wx = x + 4 * ws; wx < x + w - 6 * ws; wx += 8 * ws) {
          if (rnd() < (o.winRate || 0.2)) wins += R(wx, wy, 3 * ws, 4.5 * ws, rnd() < 0.3 ? o.win2 || o.win : o.win, { opacity: f(0.6 + rnd() * 0.4) });
        }
      }
    }
    x += w - rnd() * 6;
  }
  var out = P(body, o.fill);
  if (snow) out += G(snow, { opacity: o.snowOp || 0.85 });
  if (wins) out += G(wins, { filter: d.glow(o.glow || 1.8) });
  return out;
}

/* perspective projection */
function sc_pj(vx, vy, k, camH) { return function (X, Y, Z) { return [vx + X * k / Z, vy + (camH - Y) * k / Z]; }; }
function sc_q(pts, fill, ex) { var a = []; for (var i = 0; i < pts.length; i++) a.push(pts[i][0], pts[i][1]); return P(poly(a), fill, null, null, ex); }
function sc_ln(a, b, col, w, ex) { return L(a[0], a[1], b[0], b[1], col, w, ex); }

/* vignette */
function sc_vig(d, op, col) {
  return R(0, 0, 800, 450, d.rad([[0, col || '#000', 0], [0.6, col || '#000', 0], [1, col || '#000', op == null ? 0.7 : op]], 0.5, 0.5, 0.75));
}

/* aurora curtain band */
function sc_aurora(d, rnd, y0, amp, h, c1, c2, op) {
  var pts = [], x, i, ph = rnd() * 6;
  for (x = -40; x <= 840; x += 40) pts.push([x, y0 + Math.sin(x / 130 + ph) * amp + (rnd() - 0.5) * amp * 0.4]);
  var top = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]), bot = '';
  for (i = 1; i < pts.length; i++) top += ' L' + f(pts[i][0]) + ' ' + f(pts[i][1]);
  for (i = pts.length - 1; i >= 0; i--) bot += ' L' + f(pts[i][0]) + ' ' + f(pts[i][1] + h * (0.75 + 0.25 * Math.sin(i * 1.7)));
  var grad = d.lin([[0, c2, 0], [0.3, c2, 0.55], [0.7, c1, 0.95], [1, c1, 0]]);
  var streaks = '';
  for (i = 0; i < 46; i++) {
    var sx = rnd() * 800, pi = Math.min(pts.length - 1, Math.max(0, Math.round((sx + 40) / 40))), sy = pts[pi][1];
    streaks += L(sx, sy + h * 0.1, sx + 3, sy + h * (0.6 + rnd() * 0.4), c1, 1 + rnd() * 3, { opacity: f(0.15 + rnd() * 0.35) });
  }
  return G(P(top + bot + 'Z', grad) + streaks, { filter: d.blur(5), opacity: op || 0.7 });
}

/* moon with halo */
function sc_moon(d, x, y, r, col, halo) {
  return C(x, y, r * 4, d.rad([[0, halo || col, 0.35], [1, halo || col, 0]])) +
    C(x, y, r, d.rad([[0, '#ffffff'], [0.7, col], [1, shade(col, -0.15)]], 0.4, 0.4, 0.7)) +
    C(x + r * 0.3, y - r * 0.2, r * 0.18, shade(col, -0.12), { opacity: 0.5 }) + C(x - r * 0.35, y + r * 0.3, r * 0.12, shade(col, -0.12), { opacity: 0.4 });
}

/* sword pointing down, tip at (0,0) */
function sc_sword(d, len, w, blade, hilt) {
  var bg = d.lin([[0, shade(blade, 0.5)], [0.5, blade], [0.52, shade(blade, -0.35)], [1, shade(blade, -0.15)]], 0, 0, 1, 0);
  var gl = len * 0.22;
  return P('M0 0 L' + f(-w / 2) + ' ' + f(-w) + ' L' + f(-w / 2) + ' ' + f(-len) + ' L' + f(w / 2) + ' ' + f(-len) + ' L' + f(w / 2) + ' ' + f(-w) + 'Z', bg, INK, 1.5) +
    L(0, -w * 1.2, 0, -len + 2, shade(blade, -0.3), 1) +
    R(-w * 2.2, -len - 6, w * 4.4, 7, hilt, { stroke: INK, 'stroke-width': 1.5, rx: 2 }) +
    R(-w * 0.35, -len - 6 - gl, w * 0.7, gl, '#4a2e22', { stroke: INK, 'stroke-width': 1.5 }) +
    C(0, -len - 8 - gl, w * 0.6, hilt, { stroke: INK, 'stroke-width': 1.5 });
}

/* tiny 5 petal flower */
function sc_flower(x, y, r, col, center) {
  var s = '';
  for (var i = 0; i < 5; i++) {
    var a = i * Math.PI * 2 / 5, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.7;
    s += E(px, py, r * 0.75, r * 0.5, col, { transform: 'rotate(' + f(a * 57.3) + ' ' + f(px) + ' ' + f(py) + ')' });
  }
  return s + C(x, y, r * 0.45, center || '#ffd23a');
}

/* the dark tower of Malthor (base center bx,by; height h) */
function sc_darkTower(d, bx, by, h, fill, glowCol, wscale) {
  var w = (wscale || 1) * h * 0.11, top = by - h;
  var s = poly([bx - w, by, bx - w * 0.7, top + h * 0.3, bx - w * 0.85, top + h * 0.28, bx - w * 0.6, top + h * 0.12, bx - w * 0.9, top + h * 0.1, bx - w * 0.35, top, bx - w * 0.15, top - h * 0.1, bx, top - h * 0.18, bx + w * 0.15, top - h * 0.1, bx + w * 0.35, top, bx + w * 0.9, top + h * 0.1, bx + w * 0.6, top + h * 0.12, bx + w * 0.85, top + h * 0.28, bx + w * 0.7, top + h * 0.3, bx + w, by]);
  var gl = d.glow(3, 2);
  return C(bx, top + h * 0.05, h * 0.25, d.rad([[0, glowCol, 0.35], [1, glowCol, 0]])) +
    P(s, fill) +
    G(R(bx - w * 0.12, top + h * 0.04, w * 0.24, h * 0.06, glowCol) + R(bx - w * 0.08, top + h * 0.4, w * 0.16, h * 0.03, glowCol, { opacity: 0.7 }) + R(bx - w * 0.08, top + h * 0.6, w * 0.16, h * 0.03, glowCol, { opacity: 0.5 }), { filter: gl });
}

/* ================= TITLE ================= */
SCENES.title = function (d, rnd) {
  var s = R(0, 0, 800, 450, d.lin([[0, '#03050f'], [0.4, '#0b1836'], [0.72, '#1d3557'], [1, '#456586']]));
  s += sc_stars(rnd, 170, 320);
  s += sc_aurora(d, rnd, 40, 25, 110, '#5dffc8', '#8a5cff', 0.55);
  s += sc_aurora(d, rnd, 95, 18, 70, '#3fd7ff', '#c86bff', 0.4);
  /* calm the upper-middle for title text */
  s += E(400, 120, 260, 90, d.rad([[0, '#06102a', 0.55], [1, '#06102a', 0]]));
  s += sc_moon(d, 680, 70, 22, '#e8f2ff', '#9fd0ff');
  /* far mountains */
  s += sc_ridge(rnd, 300, 90, 55, d.lin([[0, '#9fb7d8'], [0.25, '#4a6790'], [1, '#1e3150']]), false, { opacity: 0.85 });
  s += sc_fog(d, 300, 60, '#8fb4dc', 0.35);
  /* the dark tower */
  s += sc_darkTower(d, 585, 335, 245, '#0a0f1e', '#7fd8ff');
  s += sc_ridge(rnd, 330, 40, 40, '#1a2a46', true);
  s += sc_city(d, rnd, { base: 345, hMin: 25, hMax: 70, fill: '#18263f', snow: '#a8c0e0', snowOp: 0.5, snowW: 1.5, win: '#ffcf7a', winRate: 0.08, wMin: 18, wVar: 30, winS: 0.7 });
  s += sc_fog(d, 345, 40, '#6f90b8', 0.4);
  s += sc_city(d, rnd, { base: 412, hMin: 55, hMax: 125, fill: '#0e1628', snow: '#c6d8f0', snowOp: 0.7, snowW: 1.6, win: '#ffc566', win2: '#ff9a4a', winRate: 0.18 });
  s += sc_fog(d, 405, 36, '#4e6c96', 0.3);
  /* near framing buildings at the edges */
  s += sc_city(d, rnd, { x0: -40, x1: 190, base: 440, hMin: 110, hMax: 210, fill: '#060912', snow: '#dbe6f5', snowW: 1.8, snowOp: 0.6, win: '#ffbb55', winRate: 0.25, winS: 1.5, wMin: 40, wVar: 50 });
  s += sc_city(d, rnd, { x0: 630, x1: 840, base: 440, hMin: 110, hMax: 210, fill: '#060912', snow: '#dbe6f5', snowW: 1.8, snowOp: 0.6, win: '#ffbb55', winRate: 0.25, winS: 1.5, wMin: 40, wVar: 50 });
  /* snowy ground */
  s += P('M-10 460 L-10 418 Q120 400 260 414 Q400 428 540 410 Q680 396 810 416 L810 460Z', d.lin([[0, '#e4eefb'], [1, '#8ea6c8']]));
  s += P('M-10 460 L-10 438 Q200 426 420 440 Q620 452 810 434 L810 460Z', '#b8cbe6', null, null, { opacity: 0.7 });
  s += sc_snow(d, rnd, 160);
  s += sc_vig(d, 0.65);
  return s;
};

/* ================= VICTORY ================= */
SCENES.victory = function (d, rnd) {
  var s = R(0, 0, 800, 450, d.lin([[0, '#3a4b8f'], [0.3, '#b77fb0'], [0.55, '#ffa98a'], [0.75, '#ffd9a0'], [1, '#fff3d0']]));
  var i;
  /* sun & rays */
  var rays = '';
  for (i = 0; i < 18; i++) {
    var a = -Math.PI + (i + 0.5) * Math.PI / 18 + (rnd() - 0.5) * 0.08, w = 0.03 + rnd() * 0.04;
    rays += P('M400 300 L' + f(400 + Math.cos(a - w) * 700) + ' ' + f(300 + Math.sin(a - w) * 700) + ' L' + f(400 + Math.cos(a + w) * 700) + ' ' + f(300 + Math.sin(a + w) * 700) + 'Z', '#fff6d8', null, null, { opacity: f(0.12 + rnd() * 0.15) });
  }
  s += G(rays, { filter: d.blur(4) });
  s += C(400, 300, 220, d.rad([[0, '#fff8e0', 0.95], [0.25, '#ffe2a0', 0.6], [1, '#ffb070', 0]]));
  s += C(400, 300, 42, '#fffbe8', { filter: d.glow(6, 2) });
  /* pink clouds */
  var cl = '';
  for (i = 0; i < 9; i++) {
    var cx = rnd() * 800, cy = 50 + rnd() * 140, cw = 60 + rnd() * 90;
    cl += E(cx, cy, cw, cw * 0.18, '#ffd2c8', { opacity: 0.55 }) + E(cx - cw * 0.3, cy - 6, cw * 0.45, cw * 0.18, '#ffe6da', { opacity: 0.6 }) + E(cx + cw * 0.1, cy + 4, cw * 0.8, cw * 0.1, '#c98aa8', { opacity: 0.35 });
  }
  s += G(cl, { filter: d.blur(2.5) });
  /* birds */
  for (i = 0; i < 7; i++) { var bx = 160 + rnd() * 480, by = 90 + rnd() * 110, bs = 4 + rnd() * 5; s += P('M' + f(bx - bs) + ' ' + f(by - bs * 0.4) + ' Q' + f(bx - bs * 0.4) + ' ' + f(by - bs * 0.6) + ' ' + f(bx) + ' ' + f(by) + ' Q' + f(bx + bs * 0.4) + ' ' + f(by - bs * 0.6) + ' ' + f(bx + bs) + ' ' + f(by - bs * 0.4), 'none', '#5a3a5a', 1.4); }
  /* far mountains, snow melting */
  s += sc_ridge(rnd, 300, 80, 60, d.lin([[0, '#f5e2ea'], [0.3, '#b896b8'], [1, '#8a7aa8']]), false, { opacity: 0.8 });
  s += sc_fog(d, 305, 60, '#ffe4c8', 0.5);
  /* the tower, now quiet and pale, far away */
  s += G(sc_darkTower(d, 620, 330, 170, '#7a6488', '#ffe6b0'), { opacity: 0.6 });
  s += sc_city(d, rnd, { base: 350, hMin: 30, hMax: 80, fill: '#9a7894', win: '#fff0b0', winRate: 0.12, wMin: 20, wVar: 30, winS: 0.7, glow: 1.2 });
  s += sc_fog(d, 350, 40, '#ffd6b0', 0.45);
  s += sc_city(d, rnd, { base: 380, hMin: 40, hMax: 110, fill: '#6d4f72', snow: '#ffffff', snowOp: 0.35, win: '#ffe08a', winRate: 0.2, glow: 1.5 });
  s += sc_fog(d, 380, 30, '#ffc8a0', 0.35);
  /* green hills */
  s += sc_ridge(rnd, 395, 30, 120, d.lin([[0, '#a8d07a'], [1, '#5f9a52']]), true);
  s += P('M-10 460 L-10 410 Q150 388 330 412 Q520 436 810 398 L810 460Z', d.lin([[0, '#7cbf5e'], [1, '#2f6e3c']]));
  /* lingering snow patches */
  s += E(120, 425, 50, 6, '#ffffff', { opacity: 0.8 }) + E(660, 418, 40, 5, '#ffffff', { opacity: 0.7 }) + E(470, 440, 30, 4, '#f4f8ff', { opacity: 0.7 });
  /* grass & flowers */
  var gr = '', fl = '', cols = ['#ff8fb8', '#ffe066', '#ffffff', '#9fc8ff', '#ff6f8a', '#d7a0ff'];
  for (i = 0; i < 140; i++) { var gx = rnd() * 800, gy = 405 + rnd() * 45; gr += P('M' + f(gx) + ' ' + f(gy) + ' q' + f(-2 + rnd() * 4) + ' -6 ' + f(-3 + rnd() * 6) + ' ' + f(-8 - rnd() * 6), 'none', rnd() < 0.5 ? '#3f8a44' : '#8ccf6a', 1.2); }
  for (i = 0; i < 90; i++) { var fx = rnd() * 800, fy = 410 + Math.pow(rnd(), 0.7) * 40, fr = 1.5 + (fy - 405) / 12 + rnd(); fl += sc_flower(fx, fy, fr, cols[Math.floor(rnd() * cols.length)]); }
  s += gr + fl;
  /* floating petals & sparkles */
  var pt = '';
  for (i = 0; i < 40; i++) { var px = rnd() * 800, py = 80 + rnd() * 330; pt += E(px, py, 2.5, 1.3, rnd() < 0.5 ? '#ffc0d8' : '#fff0f6', { transform: 'rotate(' + f(rnd() * 180) + ' ' + f(px) + ' ' + f(py) + ')', opacity: 0.85 }); }
  for (i = 0; i < 14; i++) pt += sparkle(rnd() * 800, 150 + rnd() * 250, 3 + rnd() * 3, '#fffbe0', { opacity: 0.8 });
  s += pt;
  s += sc_vig(d, 0.35, '#5a2a3a');
  return s;
};

/* ================= GAME OVER ================= */
SCENES.gameover = function (d, rnd) {
  var s = R(0, 0, 800, 450, d.lin([[0, '#050407'], [0.5, '#1c1118'], [0.8, '#3a2830'], [1, '#4a3a44']]));
  s += C(400, 300, 300, d.rad([[0, '#6a2a2a', 0.35], [1, '#6a2a2a', 0]]));
  /* dead trees */
  function tree(x, y, h, w) {
    var t = 'M' + f(x - w) + ' ' + f(y) + ' Q' + f(x - w * 0.3) + ' ' + f(y - h * 0.5) + ' ' + f(x - 1) + ' ' + f(y - h) + ' L' + f(x + 1) + ' ' + f(y - h) + ' Q' + f(x + w * 0.3) + ' ' + f(y - h * 0.5) + ' ' + f(x + w) + ' ' + f(y) + 'Z';
    var br = '';
    for (var i = 0; i < 6; i++) { var by = y - h * (0.35 + i * 0.1), sd = i % 2 ? 1 : -1, bl = h * (0.35 - i * 0.04); br += P('M' + f(x) + ' ' + f(by) + ' Q' + f(x + sd * bl * 0.5) + ' ' + f(by - bl * 0.2) + ' ' + f(x + sd * bl) + ' ' + f(by - bl * 0.5), 'none', '#0d090c', Math.max(1, w * 0.25)); }
    return P(t, '#0d090c') + br;
  }
  s += sc_ridge(rnd, 330, 40, 70, '#2a2026', true, { opacity: 0.7 });
  s += sc_fog(d, 330, 70, '#6a5560', 0.4);
  s += G(tree(120, 360, 170, 10) + tree(700, 350, 200, 12) + tree(40, 380, 120, 8) + tree(770, 380, 140, 8), { opacity: 0.9 });
  /* snow ground */
  s += P('M-10 460 L-10 360 Q200 340 400 352 Q600 364 810 342 L810 460Z', d.lin([[0, '#8a8494'], [0.5, '#4a4552'], [1, '#1e1a22']]));
  /* weapons */
  var w = '';
  /* half buried shield */
  w += G(E(0, 0, 44, 38, d.lin([[0, '#6a2a2a'], [1, '#2a0e10']]), { stroke: INK, 'stroke-width': 3 }) + E(0, 0, 36, 30, 'none', { stroke: '#b0903a', 'stroke-width': 4 }) + P('M0 -22 L5 0 L0 22 L-5 0Z', '#b0903a') + P('M-52 12 Q-30 2 -6 8 Q20 13 52 4 L52 46 L-52 46Z', '#6e6878'), { transform: 'translate(250 392) rotate(-14)' });
  /* broken staff */
  w += G(R(-3, -110, 6, 110, '#4a3020', { stroke: INK, 'stroke-width': 1.5 }) + P('M-3 -110 L0 -118 L3 -110Z', '#4a3020', INK, 1) + C(0, -100, 7, '#3a4f6a', { stroke: INK, 'stroke-width': 1.5 }), { transform: 'translate(560 405) rotate(68)' });
  /* the main sword, stuck in snow, scarf on hilt */
  w += G(sc_sword(d, 150, 16, '#b8c4d4', '#9a7a3a') +
    P('M-6 -180 Q-30 -166 -38 -126 Q-34 -116 -28 -122 Q-24 -156 -2 -172Z', '#8a1f2a', INK, 1.5) +
    P('M4 -180 Q20 -146 14 -106 Q22 -104 24 -112 Q30 -146 10 -180Z', '#6a1420', INK, 1.5), { transform: 'translate(400 380) rotate(6)' });
  /* second sword, tilted */
  w += G(sc_sword(d, 110, 12, '#9aa6b8', '#6a6a7a'), { transform: 'translate(505 400) rotate(-16)' });
  /* helmet */
  w += G(P('M-26 0 Q-28 -34 0 -38 Q28 -34 26 0Z', d.lin([[0, '#9aa4b4'], [1, '#3a4050']]), INK, 2.5) + R(-18, -16, 36, 5, '#141018') + R(-2, -16, 4, 16, '#141018'), { transform: 'translate(320 412) rotate(-18)' });
  /* bow */
  w += P('M600 418 Q640 360 700 400', 'none', '#5a3a22', 4) + L(600, 418, 700, 400, '#ccc', 0.8);
  s += G(w, { filter: d.drop(0, 3, 3, '#000', 0.6) });
  /* snow drifting over */
  s += G(E(400, 384, 30, 7, '#8a8494') + E(470, 398, 24, 6, '#7a7484') + E(330, 416, 34, 7, '#6a6474') + E(560, 410, 30, 5, '#6a6474') + E(250, 420, 60, 9, '#6a6474'), { filter: d.blur(2.5) });
  /* crow on the sword pommel */
  s += G(P('M0 0 Q-8 -6 -6 -14 Q-2 -20 4 -18 L12 -20 L6 -15 Q8 -6 0 0Z M-6 -8 L-18 -2 L-8 -5Z', '#050405') + C(2, -15, 0.9, '#c03030'), { transform: 'translate(392 196) scale(1.6)' });
  s += sc_snow(d, rnd, 220, '#d8d0dc', 0.7);
  s += sc_vig(d, 0.9);
  return s;
};

/* ================= TOWN STREET ================= */
SCENES.town = function (d, rnd) {
  var pj = sc_pj(400, 235, 150, 1.6);
  var s = R(0, 0, 800, 450, d.lin([[0, '#081024'], [0.5, '#1c2f52'], [1, '#3b5a82']]));
  s += sc_stars(rnd, 90, 200);
  s += sc_moon(d, 470, 60, 16, '#eef4ff', '#9cc4ff');
  s += sc_darkTower(d, 520, 210, 150, '#141c32', '#86dcff', 0.8);
  /* far buildings & cathedral at street end */
  var cb = pj(0, 0, 15)[1];
  s += sc_city(d, rnd, { x0: 280, x1: 520, base: cb, hMin: 20, hMax: 60, fill: '#2a3a58', snow: '#b8cbe4', snowOp: 0.6, snowW: 1.2, win: '#ffd07a', winRate: 0.2, wMin: 14, wVar: 20, winS: 0.6 });
  s += P(poly([360, cb, 360, cb - 60, 372, cb - 60, 380, cb - 120, 388, cb - 60, 412, cb - 60, 420, cb - 120, 428, cb - 60, 440, cb - 60, 440, cb]), '#243450') + C(400, cb - 36, 8, '#ffcf7a', { filter: d.glow(3) });
  s += sc_fog(d, cb, 50, '#6f8db8', 0.6);
  /* street */
  var sl = pj(-3, 0, 40), sr = pj(3, 0, 40);
  s += P(poly([-100, 450, 900, 450, sr[0], sr[1], sl[0], sl[1]]), d.lin([[0, '#7f97ba'], [0.2, '#a9bcd8'], [1, '#e2ebf7']]));
  [-0.7, -0.45, 0.45, 0.7].forEach(function (tx) { s += sc_ln(pj(tx, 0, 0.8), pj(tx, 0, 30), '#8295b4', 3, { opacity: 0.6 }); });
  /* houses */
  var plaster = ['#c9b79c', '#b8a48a', '#a8b4c4', '#c4a890', '#b0a0b8', '#d0c0a8'];
  var houses = [];
  [-1, 1].forEach(function (sd) {
    var z = 1.0;
    while (z < 15) { var len = 1.1 + rnd() * 1.1; houses.push({ sd: sd, z0: z, z1: z + len, H: 3 + rnd() * 1.8, col: plaster[Math.floor(rnd() * plaster.length)], lamp: rnd() < 0.45 }); z += len + 0.03; }
  });
  houses.sort(function (a, b) { return b.z0 - a.z0; });
  var wg = d.glow(2.5, 2), lg = d.glow(5, 2);
  houses.forEach(function (h) {
    var X = 3 * h.sd, zm = (h.z0 + h.z1) / 2, fog = Math.min(0.75, (zm - 1) / 14);
    var base = mix(mix(h.col, '#34405e', 0.5), '#6f8db8', fog), dark = mix('#2a1c1c', '#6f8db8', fog);
    var hs = '', pre = '';
    /* facade + gable */
    hs += sc_q([pj(X, 0, h.z0), pj(X, h.H, h.z0), pj(X, h.H + 1.5, zm), pj(X, h.H, h.z1), pj(X, 0, h.z1)], base);
    /* timbers */
    var tw = 10 / zm;
    hs += sc_ln(pj(X, 2.1, h.z0), pj(X, 2.1, h.z1), dark, tw);
    hs += sc_ln(pj(X, 0, h.z0), pj(X, h.H, h.z0), dark, tw);
    hs += sc_ln(pj(X, 0, h.z1), pj(X, h.H, h.z1), dark, tw);
    hs += sc_ln(pj(X, 2.1, h.z0), pj(X, h.H, zm), dark, tw * 0.7);
    hs += sc_ln(pj(X, 2.1, h.z1), pj(X, h.H, zm), dark, tw * 0.7);
    /* roof edge + snow */
    var p1 = pj(X, h.H, h.z0), p2 = pj(X, h.H + 1.5, zm), p3 = pj(X, h.H, h.z1);
    var gab = 'M' + f(p1[0]) + ' ' + f(p1[1]) + ' L' + f(p2[0]) + ' ' + f(p2[1]) + ' L' + f(p3[0]) + ' ' + f(p3[1]);
    hs += P(gab, 'none', mix('#2a2030', '#6f8db8', fog), 16 / zm);
    hs += G(P(gab, 'none', mix('#f4f8ff', '#a8bcd8', fog), 9 / zm), { transform: 'translate(0 ' + f(-6 / zm) + ')' });
    /* windows */
    var wins = '';
    [[1.0, 1.75], [2.5, 3.2]].forEach(function (fl, fi) {
      if (fl[1] > h.H - 0.1) return;
      var n = (h.z1 - h.z0) > 1.6 ? 2 : 1;
      for (var k = 0; k < n; k++) {
        var u0 = h.z0 + (h.z1 - h.z0) * (k + 0.3) / n, u1 = h.z0 + (h.z1 - h.z0) * (k + 0.7) / n;
        if (fi === 0 && k === 0 && h.lamp) { /* door */
          hs += sc_q([pj(X, 0, u0), pj(X, 1.5, u0), pj(X, 1.5, u1), pj(X, 0, u1)], mix('#3a2418', '#6f8db8', fog));
          continue;
        }
        var lit = rnd() < 0.65;
        var wc = lit ? (rnd() < 0.5 ? '#ffcf6e' : '#ffae4a') : mix('#1a2238', '#6f8db8', fog);
        wins += sc_q([pj(X, fl[0], u0), pj(X, fl[1], u0), pj(X, fl[1], u1), pj(X, fl[0], u1)], wc, lit ? { opacity: f(1 - fog * 0.5) } : null);
        wins += sc_ln(pj(X, (fl[0] + fl[1]) / 2, u0), pj(X, (fl[0] + fl[1]) / 2, u1), dark, 3 / zm) + sc_ln(pj(X, fl[0], (u0 + u1) / 2), pj(X, fl[1], (u0 + u1) / 2), dark, 3 / zm);
        wins += sc_ln(pj(X, fl[0], u0), pj(X, fl[0], u1), '#eef4ff', 6 / zm);
      }
    });
    hs += G(wins, { filter: wg });
    /* snow drift at base */
    hs += sc_q([pj(X, 0, h.z0), pj(X, 0.25, h.z0), pj(X, 0.3, zm), pj(X, 0.2, h.z1), pj(X, 0, h.z1), pj(X - 0.4 * h.sd, 0, zm)], mix('#eef4ff', '#a8bcd8', fog));
    /* lantern */
    if (h.lamp) {
      var lp = pj(X - 0.35 * h.sd, 2.25, zm), lb = pj(X, 2.45, zm), gp = pj(X - 0.9 * h.sd, 0, zm);
      pre = E(gp[0], gp[1], 260 / zm, 50 / zm, d.rad([[0, '#ffc870', 0.5], [1, '#ffc870', 0]]));
      hs += L(lb[0], lb[1], lp[0], lp[1] - 6 / zm, '#1a1210', 4 / zm);
      hs += C(lp[0], lp[1], 28 / zm, d.rad([[0, '#ffd890', 0.6], [1, '#ffb050', 0]]));
      hs += R(lp[0] - 6 / zm, lp[1] - 8 / zm, 12 / zm, 16 / zm, '#ffe6a0', { filter: lg, stroke: '#1a1210', 'stroke-width': f(2 / zm) });
    }
    s += pre + hs;
  });
  /* tavern sign on near left */
  var sp = pj(-2.75, 2.6, 1.9);
  s += L(sp[0] - 30, sp[1], sp[0] + 60, sp[1], '#1a1210', 5) + L(sp[0] + 18, sp[1], sp[0] + 18, sp[1] + 6, '#1a1210', 2) + L(sp[0] + 58, sp[1], sp[0] + 58, sp[1] + 6, '#1a1210', 2) +
    R(sp[0] + 10, sp[1] + 6, 56, 36, '#5a3a22', { stroke: INK, 'stroke-width': 2, rx: 3 }) +
    P('M' + f(sp[0] + 28) + ' ' + f(sp[1] + 16) + ' l0 18 l20 0 l0 -18 Z', '#c89a3a', INK, 1.5) + P('M' + f(sp[0] + 48) + ' ' + f(sp[1] + 20) + ' q6 0 6 6 q0 6 -6 6', 'none', '#c89a3a', 2) +
    R(sp[0] + 10, sp[1] + 4, 56, 5, '#f4f8ff', { rx: 2 });
  s += sc_fog(d, 300, 120, '#a8c0e0', 0.12);
  s += sc_snow(d, rnd, 200);
  s += sc_vig(d, 0.55);
  return s;
};

/* ================= SEWERS ================= */
SCENES.sewers = function (d, rnd) {
  var k = 170, pj = sc_pj(400, 225, k, 1.4);
  var s = R(0, 0, 800, 450, '#050807');
  var fogc = '#2f5a3c', i;
  /* far glow */
  s += C(400, 215, 160, d.rad([[0, '#8fe0a0', 0.55], [0.4, '#3a8a5a', 0.25], [1, '#0a1a10', 0]]));
  var Zs = [];
  for (var z = 22; z >= 0.6; z /= 1.32) Zs.push(z);
  var R0 = 2.6, WH = 1.3;
  for (i = 0; i < Zs.length - 1; i++) {
    var zf = Zs[i], zn = Zs[i + 1], fog = Math.min(1, (zn - 0.6) / 9);
    var wall = mix('#4a4436', fogc, fog * 0.8), wallD = mix('#2a261e', fogc, fog * 0.8);
    s += sc_q([pj(-R0, 0, zf), pj(-R0, WH, zf), pj(-R0, WH, zn), pj(-R0, 0, zn)], wall);
    s += sc_q([pj(R0, 0, zf), pj(R0, WH, zf), pj(R0, WH, zn), pj(R0, 0, zn)], wallD);
    for (var a = 0; a < 8; a++) {
      var a0 = Math.PI * a / 8, a1 = Math.PI * (a + 1) / 8;
      var X0 = -Math.cos(a0) * R0, Y0 = WH + Math.sin(a0) * R0, X1 = -Math.cos(a1) * R0, Y1 = WH + Math.sin(a1) * R0;
      s += sc_q([pj(X0, Y0, zf), pj(X1, Y1, zf), pj(X1, Y1, zn), pj(X0, Y0, zn)], mix(mix('#3a3428', '#1a1812', a / 8), fogc, fog * 0.8));
    }
    s += sc_q([pj(-R0, 0, zf), pj(-1.1, 0, zf), pj(-1.1, 0, zn), pj(-R0, 0, zn)], mix('#3a3a30', fogc, fog * 0.8));
    s += sc_q([pj(R0, 0, zf), pj(1.1, 0, zf), pj(1.1, 0, zn), pj(R0, 0, zn)], mix('#2e2e26', fogc, fog * 0.8));
    s += sc_q([pj(-1.1, 0, zf), pj(-1.1, -0.45, zf), pj(-1.1, -0.45, zn), pj(-1.1, 0, zn)], mix('#24241c', fogc, fog * 0.8));
    s += sc_q([pj(1.1, 0, zf), pj(1.1, -0.45, zf), pj(1.1, -0.45, zn), pj(1.1, 0, zn)], mix('#24241c', fogc, fog * 0.8));
    /* brick arch rib */
    var c = pj(0, WH, zn), r = R0 * k / zn, lb = pj(-R0, 0, zn), rb = pj(R0, 0, zn);
    var rib = 'M' + f(lb[0]) + ' ' + f(lb[1]) + ' L' + f(lb[0]) + ' ' + f(c[1]) + ' A' + f(r) + ' ' + f(r) + ' 0 0 1 ' + f(rb[0]) + ' ' + f(c[1]) + ' L' + f(rb[0]) + ' ' + f(rb[1]);
    s += P(rib, 'none', mix('#1a160f', fogc, fog * 0.6), 34 / zn);
    s += P(rib, 'none', mix('#6a5a44', fogc, fog * 0.7), 26 / zn, { 'stroke-dasharray': f(22 / zn) + ' ' + f(4 / zn), 'stroke-linecap': 'butt' });
  }
  /* brick courses */
  var lines = '';
  for (var y = 0.25; y < WH; y += 0.3) [-R0, R0].forEach(function (X) { lines += sc_ln(pj(X, y, 0.6), pj(X, y, 22), '#120f0a', 1.2, { opacity: 0.5 }); });
  for (var kk = 1; kk < 8; kk++) { var an = Math.PI * kk / 8, X = -Math.cos(an) * R0, Y = WH + Math.sin(an) * R0; lines += sc_ln(pj(X, Y, 0.6), pj(X, Y, 22), '#0c0a07', 1.2, { opacity: 0.45 }); }
  s += lines;
  /* water surface */
  var wl = pj(-1.1, -0.35, 0.6), wr = pj(1.1, -0.35, 0.6), wfl = pj(-1.1, -0.35, 22), wfr = pj(1.1, -0.35, 22);
  s += P(poly([wl[0], wl[1], wfl[0], wfl[1], wfr[0], wfr[1], wr[0], wr[1]]), d.lin([[0, '#5fbf7a'], [0.15, '#1f5a34'], [1, '#081a10']]), null, null, { opacity: 0.95 });
  s += P(poly([395, 232, 405, 232, 470, 450, 330, 450]), d.lin([[0, '#b8ffcc', 0.6], [1, '#b8ffcc', 0]]), null, null, { filter: d.blur(4) });
  var rip = '';
  for (i = 0; i < 26; i++) { var zz = 0.8 + rnd() * 10, xx = (rnd() - 0.5) * 1.8, p = pj(xx, -0.35, zz); rip += E(p[0], p[1], 40 / zz, 5 / zz, 'none', { stroke: '#9fe8b0', 'stroke-width': f(2 / zz + 0.3), opacity: f(0.2 + rnd() * 0.3) }); }
  s += rip;
  /* pipes with outflow */
  [[-R0, 1.0, 2.2], [R0, 0.9, 3.6], [-R0, 1.1, 6]].forEach(function (pp) {
    var p = pj(pp[0], pp[1], pp[2]), r = 0.3 * k / pp[2], sd = pp[0] < 0 ? 1 : -1;
    s += E(p[0], p[1], r * 0.5, r, '#2a2a22', { stroke: '#5a5040', 'stroke-width': f(r * 0.3) }) + E(p[0], p[1], r * 0.3, r * 0.7, '#050505');
    var w = pj(pp[0] * 0.43, -0.35, pp[2]);
    s += P('M' + f(p[0]) + ' ' + f(p[1] + r * 0.3) + ' Q' + f(p[0] + (w[0] - p[0]) * 0.7) + ' ' + f(p[1] + r * 0.3) + ' ' + f(w[0]) + ' ' + f(w[1]), 'none', d.lin([[0, '#9fe8b0', 0.9], [1, '#4aa86a', 0.5]]), r * 0.35);
    s += E(w[0], w[1], r * 1.5, r * 0.35, '#c8ffd8', { opacity: 0.5, filter: d.blur(2) });
  });
  /* torches */
  [[-R0, 1.25, 1.7], [R0, 1.25, 2.9], [-R0, 1.25, 5.2]].forEach(function (tp) {
    var p = pj(tp[0], tp[1], tp[2]), sc = k / tp[2] / 60, sd = tp[0] < 0 ? 1 : -1;
    s += C(p[0], p[1] - 10 * sc, 150 * sc, d.rad([[0, '#ffb050', 0.45], [0.5, '#ff8030', 0.12], [1, '#ff8030', 0]]));
    s += P('M' + f(p[0]) + ' ' + f(p[1] + 14 * sc) + ' L' + f(p[0] + sd * 8 * sc) + ' ' + f(p[1] - 4 * sc), 'none', '#2a1a10', 4 * sc);
    s += P('M' + f(p[0] + sd * 8 * sc - 4 * sc) + ' ' + f(p[1] - 4 * sc) + ' Q' + f(p[0] + sd * 8 * sc - 6 * sc) + ' ' + f(p[1] - 16 * sc) + ' ' + f(p[0] + sd * 8 * sc) + ' ' + f(p[1] - 28 * sc) + ' Q' + f(p[0] + sd * 8 * sc + 6 * sc) + ' ' + f(p[1] - 16 * sc) + ' ' + f(p[0] + sd * 8 * sc + 4 * sc) + ' ' + f(p[1] - 4 * sc) + 'Z', '#ffd27a', null, null, { filter: d.glow(3 * sc, 2) });
  });
  /* moss & slime drips */
  var moss = '';
  for (i = 0; i < 30; i++) { var mz = 0.8 + rnd() * 6, sdd = rnd() < 0.5 ? -1 : 1, mp = pj(sdd * R0, rnd() * 1.2, mz); moss += E(mp[0], mp[1], 18 / mz, 8 / mz, '#4a8a3a', { opacity: f(0.4 + rnd() * 0.4) }); }
  for (i = 0; i < 12; i++) { var dz = 0.9 + rnd() * 4, an2 = 0.4 + rnd() * 2.3, dp = pj(-Math.cos(an2) * R0, WH + Math.sin(an2) * R0, dz); moss += P('M' + f(dp[0] - 3) + ' ' + f(dp[1]) + ' q3 ' + f(30 / dz) + ' 6 0Z', '#7fd89a', null, null, { opacity: 0.6 }) + C(dp[0], dp[1] + 40 / dz, 2.5, '#9fe8b0', { opacity: 0.7 }); }
  s += moss;
  /* glowing rat eyes in the far dark */
  s += G(C(380, 228, 1.4, '#ff3a3a') + C(385, 228, 1.4, '#ff3a3a') + C(431, 232, 1.2, '#ff3a3a') + C(435, 232, 1.2, '#ff3a3a'), { filter: d.glow(1.5) });
  s += sc_fog(d, 260, 90, '#6fb88a', 0.18);
  for (i = 0; i < 40; i++) s += C(rnd() * 800, rnd() * 450, 0.8 + rnd() * 1.6, '#b8ffcc', { opacity: f(0.2 + rnd() * 0.5) });
  s += sc_vig(d, 0.85);
  return s;
};

/* ================= CRYPT ================= */
SCENES.crypt = function (d, rnd) {
  var k = 170, pj = sc_pj(400, 230, k, 1.6);
  var s = R(0, 0, 800, 450, '#06060c');
  var fogc = '#2c3a5c', i;
  var WX = 3.6, PX = 2.5, SP = 3.2, fz = 18;
  /* far wall with spectral door */
  var fw0 = pj(-WX, 0, fz), fw1 = pj(WX, 6, fz);
  s += R(fw0[0], fw1[1], fw1[0] - fw0[0], fw0[1] - fw1[1], '#26304e');
  s += C(400, 205, 120, d.rad([[0, '#9fd8ff', 0.7], [0.3, '#4a7ad0', 0.35], [1, '#1a2040', 0]]));
  var dt = pj(0, 2.8, fz), dl = pj(-0.8, 0, fz), dr = pj(0.8, 0, fz), dw = (dr[0] - dl[0]) / 2;
  s += P('M' + f(dl[0]) + ' ' + f(dl[1]) + ' L' + f(dl[0]) + ' ' + f(dt[1] + dw) + ' A' + f(dw) + ' ' + f(dw) + ' 0 0 1 ' + f(dr[0]) + ' ' + f(dt[1] + dw) + ' L' + f(dr[0]) + ' ' + f(dr[1]) + 'Z', '#dff4ff', null, null, { filter: d.glow(4, 2) });
  /* floor */
  var f0 = pj(WX, 0, fz), f1 = pj(-WX, 0, fz);
  s += P(poly([-200, 450, 1000, 450, f0[0], f0[1], f1[0], f1[1]]), d.lin([[0, '#2e3650'], [1, '#14141c']]));
  var tl = '';
  for (var tx = -3; tx <= 3; tx += 1) tl += sc_ln(pj(tx, 0, 0.7), pj(tx, 0, fz), '#0a0a10', 1.5, { opacity: 0.6 });
  for (var tz = 1; tz < fz; tz *= 1.25) tl += sc_ln(pj(-WX, 0, tz), pj(WX, 0, tz), '#0a0a10', 1.5, { opacity: 0.6 });
  s += tl;
  /* glow reflection on floor */
  s += E(400, 250, 140, 30, d.rad([[0, '#9fd8ff', 0.35], [1, '#9fd8ff', 0]]));
  var bays = [];
  for (var z = 1.2; z < fz; z += SP) bays.push(z);
  var gl = d.glow(3, 2);
  for (i = bays.length - 1; i >= 0; i--) {
    var z0 = bays[i], z1 = Math.min(fz, z0 + SP), fog = Math.min(0.85, (z0 - 1) / 14);
    var wcol = mix('#3a3a4a', fogc, fog), dcol = mix('#0e0e14', fogc, fog * 0.7);
    [-1, 1].forEach(function (sd) {
      s += sc_q([pj(sd * WX, 0, z0), pj(sd * WX, 4.2, z0), pj(sd * WX, 4.2, z1), pj(sd * WX, 0, z1)], sd < 0 ? wcol : mix(wcol, '#000', 0.25));
      /* arched niche */
      var n0 = pj(sd * WX, 1.0, z0 + SP * 0.25), n1 = pj(sd * WX, 2.3, z0 + SP * 0.25), n2 = pj(sd * WX, 2.3, z0 + SP * 0.75), n3 = pj(sd * WX, 1.0, z0 + SP * 0.75), nt = pj(sd * WX, 3.0, z0 + SP * 0.5);
      s += P('M' + f(n0[0]) + ' ' + f(n0[1]) + ' L' + f(n1[0]) + ' ' + f(n1[1]) + ' Q' + f(nt[0]) + ' ' + f(nt[1]) + ' ' + f(n2[0]) + ' ' + f(n2[1]) + ' L' + f(n3[0]) + ' ' + f(n3[1]) + 'Z', dcol);
      var sk = pj(sd * WX, 1.3, z0 + SP * 0.5), sr = 0.22 * k / (z0 + SP * 0.5);
      s += C(sk[0], sk[1], sr, mix('#c8c0a8', fogc, fog)) + C(sk[0] - sr * 0.35, sk[1], sr * 0.25, '#000') + C(sk[0] + sr * 0.35, sk[1], sr * 0.25, '#000');
      /* sarcophagus */
      var za = z0 + 0.6, zb = z0 + 2.4, xi = sd * (WX - 1.0), xo = sd * (WX - 0.05);
      s += sc_q([pj(xi, 0, za), pj(xi, 0.8, za), pj(xi, 0.8, zb), pj(xi, 0, zb)], mix('#4a4a58', fogc, fog));
      s += sc_q([pj(xo, 0.8, za), pj(xi, 0.8, za), pj(xi, 0.8, zb), pj(xo, 0.8, zb)], mix('#6a6a7c', fogc, fog));
      s += sc_q([pj(xo, 0, za), pj(xo, 0.8, za), pj(xi, 0.8, za), pj(xi, 0, za)], mix('#363644', fogc, fog));
      /* pillar */
      var pw = 0.32, p0 = pj(sd * PX - pw, 0, z0), p1 = pj(sd * PX + pw, 4.2, z0), px0 = Math.min(p0[0], p1[0]), pwid = Math.abs(p1[0] - p0[0]);
      var pg = d.lin([[0, mix('#4a4a5c', fogc, fog)], [0.35, mix('#8a8aa0', fogc, fog)], [1, mix('#1e1e26', fogc, fog)]], 0, 0, 1, 0);
      s += R(px0, p1[1], pwid, p0[1] - p1[1], pg);
      s += R(px0 - 8 / z0, p1[1], pwid + 16 / z0, 16 / z0, mix('#6a6a7a', fogc, fog));
      s += R(px0 - 8 / z0, p0[1] - 16 / z0, pwid + 16 / z0, 16 / z0, mix('#4a4a5a', fogc, fog));
      /* candle */
      var cp = pj(sd * (PX - 0.6), 0, z0 + 0.15), ch = 32 / z0;
      s += C(cp[0], cp[1] - ch - 5 / z0, 120 / z0, d.rad([[0, '#ffb860', 0.4], [1, '#ffb860', 0]]));
      s += R(cp[0] - 4 / z0, cp[1] - ch, 8 / z0, ch, '#e8e0c8') + E(cp[0], cp[1] - ch - 6 / z0, 3 / z0 + 1, 7 / z0 + 1, '#fff0b0', { filter: gl });
    });
    /* vault rib */
    var r = PX * k / z0, lb = pj(-PX, 4.2, z0), rb = pj(PX, 4.2, z0);
    var arch = 'M' + f(lb[0]) + ' ' + f(lb[1]) + ' A' + f(r) + ' ' + f(r * 0.8) + ' 0 0 1 ' + f(rb[0]) + ' ' + f(rb[1]);
    s += P(arch, 'none', mix('#101018', fogc, fog), 50 / z0) + P(arch, 'none', mix('#5a5a6a', fogc, fog), 32 / z0);
  }
  /* mist */
  var mist = '';
  for (i = 0; i < 14; i++) mist += E(rnd() * 800, 330 + rnd() * 120, 90 + rnd() * 120, 14 + rnd() * 14, '#b8d0ff', { opacity: f(0.06 + rnd() * 0.1) });
  s += G(mist, { filter: d.blur(8) });
  /* cobwebs */
  function web(cx, cy, sx, sy) {
    var w = '', rr = 120, a;
    for (a = 0; a <= 6; a++) { var an = a / 6 * Math.PI / 2; w += L(cx, cy, cx + sx * Math.cos(an) * rr, cy + sy * Math.sin(an) * rr, '#c8d0e0', 0.8); }
    for (var ring = 1; ring <= 5; ring++) {
      var rr2 = ring * 22, p = 'M' + f(cx + sx * rr2) + ' ' + f(cy);
      for (a = 1; a <= 6; a++) { var an2 = a / 6 * Math.PI / 2, pan = (a - 0.5) / 6 * Math.PI / 2; p += ' Q' + f(cx + sx * Math.cos(pan) * rr2 * 0.85) + ' ' + f(cy + sy * Math.sin(pan) * rr2 * 0.85) + ' ' + f(cx + sx * Math.cos(an2) * rr2) + ' ' + f(cy + sy * Math.sin(an2) * rr2); }
      w += P(p, 'none', '#c8d0e0', 0.7);
    }
    return G(w, { opacity: 0.35 });
  }
  s += web(0, 0, 1, 1) + web(800, 0, -1, 1);
  for (i = 0; i < 6; i++) s += C(250 + rnd() * 300, 150 + rnd() * 120, 3 + rnd() * 3, '#bfe6ff', { filter: d.glow(4, 2), opacity: 0.8 });
  s += sc_vig(d, 0.9);
  return s;
};

/* ================= KEEP ================= */
SCENES.keep = function (d, rnd) {
  var s = R(0, 0, 800, 450, d.lin([[0, '#0a0e1c'], [0.5, '#22304e'], [1, '#5a7096']]));
  var i;
  var cl = '';
  for (i = 0; i < 26; i++) { var cx = rnd() * 800, cy = rnd() * 170, w = 60 + rnd() * 120; cl += E(cx, cy, w, w * 0.25, rnd() < 0.5 ? '#2a3654' : '#1a2238', { opacity: 0.85 }); cl += E(cx - w * 0.2, cy - w * 0.08, w * 0.6, w * 0.14, '#4a5a7e', { opacity: 0.35 }); }
  s += G(cl, { filter: d.blur(6) });
  s += sc_moon(d, 210, 90, 18, '#dfe8ff', '#8fb0ff');
  s += E(210, 96, 70, 10, '#1a2238', { opacity: 0.8, filter: d.blur(4) });
  s += sc_ridge(rnd, 300, 110, 50, d.lin([[0, '#c8d8f0'], [0.3, '#58709a'], [1, '#26344e']]), false, { opacity: 0.9 });
  s += sc_fog(d, 300, 70, '#9ab4d8', 0.35);
  /* cliff */
  s += P('M240 460 L250 380 L290 330 L300 300 L330 290 L360 296 L420 286 L470 292 L520 286 L560 300 L590 330 L610 380 L630 460Z', d.lin([[0, '#3a4660'], [1, '#0e121c']]));
  s += P('M290 330 L300 300 L330 290 L360 296 L420 286 L470 292 L520 286 L560 300 L590 330 L560 320 L520 300 L470 306 L420 298 L360 308 L330 302 L305 318Z', '#dfeaf8', null, null, { opacity: 0.85 });
  /* fortress */
  var fz = d.lin([[0, '#34405e'], [0.3, '#161c2c'], [1, '#06080e']], 290, 0, 560, 0, true), kp = '', m;
  kp += R(320, 200, 200, 95, fz);
  for (m = 0; m < 10; m++) kp += R(322 + m * 20, 192, 12, 10, fz);
  kp += R(390, 110, 70, 185, fz);
  for (m = 0; m < 4; m++) kp += R(390 + m * 19, 100, 13, 12, fz);
  var towers = [[300, 160, 40], [500, 150, 44], [440, 90, 26]];
  towers.forEach(function (t) { kp += R(t[0], t[1], t[2], 300 - t[1], fz) + P(poly([t[0] - 6, t[1], t[0] + t[2] / 2, t[1] - t[2] * 1.6, t[0] + t[2] + 6, t[1]]), fz); });
  var edges = '';
  towers.forEach(function (t) { edges += L(t[0] + 1, t[1], t[0] + 1, 296, '#9fb8e0', 1.5, { opacity: 0.6 }); });
  edges += L(391, 110, 391, 200, '#9fb8e0', 1.5, { opacity: 0.5 }) + L(321, 200, 321, 295, '#9fb8e0', 1.2, { opacity: 0.4 });
  for (m = 0; m < 9; m++) edges += L(320, 212 + m * 9, 520, 212 + m * 9, '#000', 0.6, { opacity: 0.35 });
  var fr = L(320, 200, 520, 200, '#dfeaf8', 2, { opacity: 0.7 });
  towers.forEach(function (t) { fr += P('M' + f(t[0] - 6) + ' ' + f(t[1]) + ' L' + f(t[0] + t[2] / 2) + ' ' + f(t[1] - t[2] * 1.6), 'none', '#e8f2ff', 2.5, { opacity: 0.8 }); });
  for (i = 0; i < 30; i++) { var ix = 320 + rnd() * 200, ih = 4 + rnd() * 10; fr += P('M' + f(ix - 1.5) + ' 202 L' + f(ix) + ' ' + f(202 + ih) + ' L' + f(ix + 1.5) + ' 202Z', '#cfe4ff', null, null, { opacity: 0.8 }); }
  s += G(kp + edges + fr, { transform: 'translate(420 310) scale(1.15) translate(-420 -295)', filter: d.drop(0, 0, 6, '#9fd8ff', 0.25) });
  var wins = '';
  [[405, 140], [430, 140], [405, 175], [430, 175], [315, 190], [515, 180], [450, 112], [340, 240], [480, 240]].forEach(function (w, j) { wins += P('M' + f(w[0]) + ' ' + f(w[1] + 12) + ' L' + f(w[0]) + ' ' + f(w[1] + 3) + ' Q' + f(w[0] + 3) + ' ' + f(w[1] - 1) + ' ' + f(w[0] + 6) + ' ' + f(w[1] + 3) + ' L' + f(w[0] + 6) + ' ' + f(w[1] + 12) + 'Z', j === 6 ? '#ff5a5a' : '#8fe0ff'); });
  var gate = P('M402 295 L402 262 Q420 244 438 262 L438 295Z', '#8fe0ff', null, null, { opacity: 0.6, filter: d.glow(3) }) +
    P('M402 295 L402 262 Q420 244 438 262 L438 295Z', 'none', '#05060a', 2) + L(410, 255, 410, 295, '#05060a', 2) + L(420, 250, 420, 295, '#05060a', 2) + L(430, 255, 430, 295, '#05060a', 2);
  var ban = '';
  [[372, 210], [462, 210]].forEach(function (b) { ban += P('M' + b[0] + ' ' + b[1] + ' l14 0 l0 46 l-4 -6 l-3 10 l-3 -8 l-4 6Z', '#3a1018', '#05060a', 1) + C(b[0] + 7, b[1] + 16, 3, '#9fd8ff', { opacity: 0.7 }); });
  s += G(G(wins, { filter: d.glow(3, 2) }) + gate + ban, { transform: 'translate(420 310) scale(1.15) translate(-420 -295)' });
  /* bridge */
  s += P('M380 310 L460 310 L540 460 L300 460Z', d.lin([[0, '#2a3044'], [1, '#141824']]));
  for (i = 0; i < 6; i++) { var by = 310 + i * 26, bw = 40 + (by - 310) * 0.8; s += L(420 - bw, by, 420 + bw, by, '#0a0c14', 1.5, { opacity: 0.6 }); }
  s += L(380, 310, 300, 460, '#05060a', 4) + L(460, 310, 540, 460, '#05060a', 4) + L(382, 310, 304, 460, '#9fb8e0', 1.5, { opacity: 0.5 });
  /* chasm sides */
  s += P('M-10 460 L-10 340 Q120 320 250 380 L300 460Z', d.lin([[0, '#c8d8ee'], [0.15, '#55688a'], [1, '#0a0c14']]));
  s += P('M810 460 L810 330 Q700 320 600 380 L560 460Z', d.lin([[0, '#c8d8ee'], [0.15, '#55688a'], [1, '#0a0c14']]));
  s += sc_fog(d, 400, 80, '#9ab4d8', 0.25);
  var bl = '';
  for (i = 0; i < 90; i++) { var x = rnd() * 860, y = rnd() * 450, l = 10 + rnd() * 24; bl += L(x, y, x - l, y + l * 0.35, '#e8f0ff', 0.8 + rnd() * 1.2, { opacity: f(0.2 + rnd() * 0.35) }); }
  s += bl;
  s += sc_snow(d, rnd, 160);
  s += sc_vig(d, 0.75);
  return s;
};

/* ================= TOWER ================= */
SCENES.tower = function (d, rnd) {
  var s = R(0, 0, 800, 450, d.lin([[0, '#060818'], [0.45, '#141c44'], [1, '#2a4a7a']]));
  var i;
  s += sc_stars(rnd, 100, 300, '#cfe0ff');
  var vx = 400, vy = 70, vort = '';
  for (var arm = 0; arm < 4; arm++) {
    var pth = '', a0 = arm * Math.PI / 2;
    for (var rr = 12; rr < 420; rr += 12) {
      var an = a0 + rr * 0.012;
      pth += (pth ? ' L' : 'M') + f(vx + Math.cos(an) * rr) + ' ' + f(vy + Math.sin(an) * rr * 0.32);
    }
    vort += P(pth, 'none', arm % 2 ? '#6a8ae8' : '#3f56b0', 22, { opacity: 0.45 });
    vort += P(pth, 'none', '#b8d8ff', 4, { opacity: 0.35 });
  }
  s += G(vort, { filter: d.blur(6) });
  s += C(vx, vy, 90, d.rad([[0, '#d8f4ff', 0.9], [0.25, '#7fc8ff', 0.5], [1, '#2a4aa0', 0]]));
  var lt = 'M400 70', lx = 400, ly = 70;
  for (i = 0; i < 6; i++) { lx += (rnd() - 0.5) * 40 - 15; ly += 15 + rnd() * 10; lt += ' L' + f(lx) + ' ' + f(ly); }
  s += P(lt, 'none', '#e8f8ff', 2, { filter: d.glow(3, 2), opacity: 0.8 });
  s += sc_ridge(rnd, 330, 90, 45, d.lin([[0, '#b8d4f4'], [0.3, '#4a6898'], [1, '#1a2a4e']]), false);
  s += sc_fog(d, 330, 60, '#7fa8e0', 0.4);
  var tg = d.lin([[0, '#0a0e22'], [0.35, '#2a3a6a'], [0.55, '#4a6aa8'], [0.7, '#1e2a50'], [1, '#080a18']], 0, 0, 1, 0);
  var tw = 'M350 450 L366 260 L372 250 L378 160 L386 150 L390 100 L400 62 L410 100 L414 150 L422 160 L428 250 L434 260 L450 450Z';
  s += C(400, 120, 100, d.rad([[0, '#7fd8ff', 0.3], [1, '#7fd8ff', 0]]));
  s += P(tw, tg, '#05060e', 2);
  [[150, 386, 414], [250, 372, 428], [330, 362, 438]].forEach(function (b) { s += P('M' + b[1] + ' ' + b[0] + ' Q400 ' + f(b[0] + 8) + ' ' + b[2] + ' ' + b[0] + ' L' + b[2] + ' ' + f(b[0] + 5) + ' Q400 ' + f(b[0] + 13) + ' ' + b[1] + ' ' + f(b[0] + 5) + 'Z', '#5a7ac0', '#05060e', 1); });
  s += P('M378 160 L370 140 L384 150 L388 128 L394 146 L400 120 L406 146 L412 128 L416 150 L430 140 L422 160Z', '#141c3a', '#05060e', 1.5);
  var cr = '', cg = d.lin([[0, '#f0fbff'], [0.5, '#9fd8ff'], [1, '#3a7ac8']], 0, 0, 1, 1);
  [[366, 260, -1, 40], [434, 260, 1, 46], [378, 165, -1, 30], [422, 165, 1, 34], [356, 380, -1, 50], [444, 370, 1, 56]].forEach(function (c) {
    cr += P('M' + c[0] + ' ' + c[1] + ' L' + f(c[0] + c[2] * c[3]) + ' ' + f(c[1] - c[3] * 0.9) + ' L' + f(c[0] + c[2] * c[3] * 0.3) + ' ' + f(c[1] + 8) + 'Z', cg, '#1a3a6a', 1);
    cr += P('M' + c[0] + ' ' + f(c[1] + 6) + ' L' + f(c[0] + c[2] * c[3] * 0.6) + ' ' + f(c[1] - c[3] * 0.2) + ' L' + f(c[0] + c[2] * 6) + ' ' + f(c[1] + 14) + 'Z', cg, '#1a3a6a', 1);
  });
  s += cr;
  var wn = '';
  [[400, 110], [400, 200], [395, 300], [405, 380]].forEach(function (w) { wn += R(w[0] - 3, w[1], 6, 12, '#bff0ff'); });
  wn += C(400, 82, 6, '#e8fbff');
  s += G(wn, { filter: d.glow(3, 2) });
  s += E(400, 250, 90, 18, 'none', { stroke: '#8fe0ff', 'stroke-width': 1.5, 'stroke-dasharray': '6 4 2 4', opacity: 0.7, filter: d.glow(2) });
  var sh = '';
  for (i = 0; i < 22; i++) { var x = 220 + rnd() * 360, y = 60 + rnd() * 300, z = 3 + rnd() * 8; if (Math.abs(x - 400) < 40) x += x < 400 ? -50 : 50; sh += P(poly([x, y - z, x + z * 0.4, y, x, y + z * 0.8, x - z * 0.4, y]), cg, null, null, { opacity: f(0.6 + rnd() * 0.4), transform: 'rotate(' + f(rnd() * 60 - 30) + ' ' + f(x) + ' ' + f(y) + ')' }); }
  s += G(sh, { filter: d.glow(1.5) });
  s += P('M-10 460 L-10 400 Q200 380 400 395 Q600 410 810 388 L810 460Z', d.lin([[0, '#cfe4fa'], [1, '#5a7aaa']]));
  var sp2 = '';
  for (i = 0; i < 16; i++) { var gx = rnd() * 800, gh = 20 + rnd() * 60, gw = 6 + rnd() * 10; if (Math.abs(gx - 400) < 80) continue; sp2 += P(poly([gx - gw, 420, gx + (rnd() - 0.5) * 10, 420 - gh, gx + gw, 420]), cg, '#2a4a7a', 1, { opacity: 0.9 }); }
  s += sp2;
  s += sc_fog(d, 420, 40, '#dff0ff', 0.3);
  s += sc_snow(d, rnd, 120, '#dff0ff');
  s += sc_vig(d, 0.7);
  return s;
};

/* ---------------- scene: the folded cellar ---------------- */
function fh_ql(q, u, v) {
  var a = [q[0][0] + (q[1][0] - q[0][0]) * u, q[0][1] + (q[1][1] - q[0][1]) * u], b = [q[3][0] + (q[2][0] - q[3][0]) * u, q[3][1] + (q[2][1] - q[3][1]) * u];
  return [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v];
}
function fh_qpoly(q, u0, u1, v0, v1) { return [fh_ql(q, u0, v0), fh_ql(q, u1, v0), fh_ql(q, u1, v1), fh_ql(q, u0, v1)]; }
/* wallpaper on a wall quad (u = along the wall, v = top to bottom) */
function fh_paper(q, base, pat, fog, fogc, nu, nv) {
  var s = sc_q(q, mix(base, fogc, fog)), pc = mix(pat, fogc, fog), i, j;
  for (i = 1; i < nu; i++) s += sc_ln(fh_ql(q, i / nu, 0.04), fh_ql(q, i / nu, 0.96), pc, 1, { opacity: 0.55 });
  for (i = 0; i < nu; i++) for (j = 0; j < nv; j++) {
    var p = fh_ql(q, (i + 0.5) / nu, (j + 0.5 + (i % 2) * 0.5) / (nv + 0.5)), a = fh_ql(q, i / nu, 0.5), b = fh_ql(q, (i + 1) / nu, 0.5);
    var r = Math.max(0.6, Math.abs(b[0] - a[0]) * 0.16 + Math.abs(b[1] - a[1]) * 0.16);
    s += C(p[0], p[1], r, pc, { opacity: 0.75 }) + C(p[0], p[1], r * 0.4, mix('#f4e2a0', fogc, fog));
  }
  return s;
}
/* brick over part of a quad from u0 to 1, with a ragged edge where it eats the wallpaper */
function fh_brick(rnd, q, u0, base, fog, fogc, nu, nv) {
  var edge = [], i, j, col = mix(base, fogc, fog), mort = mix('#1a1014', fogc, fog * 0.8);
  for (j = 0; j <= 8; j++) edge.push(fh_ql(q, u0 + (rnd() - 0.5) * 0.12, j / 8));
  var pts = [fh_ql(q, 1, 0)];
  for (j = 0; j <= 8; j++) pts.push(edge[j]);
  pts.push(fh_ql(q, 1, 1));
  var s = sc_q(pts, col);
  for (j = 1; j < nv; j++) s += sc_ln(fh_ql(q, u0 + 0.04, j / nv), fh_ql(q, 1, j / nv), mort, 1.2, { opacity: 0.8 });
  for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) {
    var u = u0 + (1 - u0) * ((i + (j % 2) * 0.5) / nu);
    if (u > u0 + 0.06 && u < 0.99) s += sc_ln(fh_ql(q, u, j / nv), fh_ql(q, u, (j + 1) / nv), mort, 1, { opacity: 0.8 });
  }
  var e = 'M' + f(edge[0][0]) + ' ' + f(edge[0][1]);
  for (j = 1; j < edge.length; j++) e += ' L' + f(edge[j][0]) + ' ' + f(edge[j][1]);
  return s + P(e, 'none', mix('#dff2ff', fogc, fog * 0.5), 1.4, { opacity: 0.7 });
}
SCENES.folded = function (d, rnd) {
  var s = R(0, 0, 800, 450, '#04060c'), i, j, fogc = '#5a8ac8';
  var VX = 400, VY = 196, BW = 150, BTOP = -128, BBOT = 134, N = 9;
  var gl = d.glow(3, 2);
  function frame(k) {
    var sc = Math.pow(0.74, k), a = k * 7 * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), cx = VX + Math.sin(k * 0.8) * 4, cy = VY;
    return [[-BW, BTOP], [BW, BTOP], [BW, BBOT], [-BW, BBOT]].map(function (p) { return [cx + (p[0] * ca - p[1] * sa) * sc, cy + (p[0] * sa + p[1] * ca) * sc]; });
  }
  /* the far end: cold light */
  s += C(VX, VY, 260, d.rad([[0, '#e8f8ff', 0.95], [0.12, '#9ad4ff', 0.7], [0.5, '#2a5aa0', 0.25], [1, '#04060c', 0]]));
  var Fs = [];
  for (i = 0; i <= N; i++) Fs.push(frame(i));
  for (i = N; i >= 1; i--) {
    var far = Fs[i], nr = Fs[i - 1], fog = Math.min(0.92, 0.18 + i / N * 0.8), sc = Math.pow(0.74, i - 1);
    var ceil = [nr[0], nr[1], far[1], far[0]], flo = [far[3], far[2], nr[2], nr[3]];
    var lw = [nr[0], far[0], far[3], nr[3]], rw = [nr[1], far[1], far[2], nr[2]];
    s += sc_q(ceil, mix('#2a1c18', fogc, fog));
    for (j = 1; j < 4; j++) s += sc_ln(fh_ql(ceil, j / 4, 0), fh_ql(ceil, j / 4, 1), mix('#120a08', fogc, fog), Math.max(1, 6 * sc), { opacity: 0.7 });
    s += sc_q(flo, mix('#3a3640', fogc, fog));
    for (j = 1; j < 3; j++) s += sc_ln(fh_ql(flo, 0, j / 3), fh_ql(flo, 1, j / 3), mix('#14121a', fogc, fog), Math.max(0.6, 2 * sc));
    s += sc_q(fh_qpoly(flo, 0.1, 0.9, 0.5, 1), mix('#e8f6ff', fogc, fog * 0.6), { opacity: 0.35 });
    var paperA = i % 2 ? ['#d8b0b4', '#9a5868'] : ['#bcd0bc', '#4a7a5a'];
    s += fh_paper(lw, paperA[0], paperA[1], fog, fogc, 3, 3) + fh_brick(rnd, lw, i % 2 ? 0.55 : 0.3, '#8a4a3a', fog, fogc, 3, 6);
    s += fh_paper(rw, paperA[0], paperA[1], fog, fogc, 3, 3) + fh_brick(rnd, rw, i % 2 ? 0.3 : 0.6, '#8a4a3a', fog, fogc, 3, 6);
    /* a doorframe to nowhere on the side wall, every other bay */
    if (i % 2 === 0) {
      var dq = fh_qpoly(i % 4 ? lw : rw, 0.3, 0.62, 0.22, 1);
      s += sc_q(dq, mix('#0a0608', fogc, fog * 0.7)) + P(poly([dq[3][0], dq[3][1], dq[0][0], dq[0][1], dq[1][0], dq[1][1], dq[2][0], dq[2][1]]).replace(/Z$/, ''), 'none', mix('#6a4428', fogc, fog), Math.max(1, 8 * sc));
    }
    /* the doorframe of this bay, tilted further than the last */
    var fp = poly([far[0][0], far[0][1], far[1][0], far[1][1], far[2][0], far[2][1], far[3][0], far[3][1]]);
    s += P(fp, 'none', mix('#1a0e08', fogc, fog), Math.max(2, 26 * sc * 0.74)) + P(fp, 'none', mix('#7a5030', fogc, fog), Math.max(1, 16 * sc * 0.74));
    s += P(fp, 'none', mix('#e8f8ff', fogc, fog * 0.5), Math.max(0.6, 2 * sc), { opacity: 0.8 });
    /* icicles along the lintel */
    var dn = [far[3][0] - far[0][0], far[3][1] - far[0][1]], dl = Math.sqrt(dn[0] * dn[0] + dn[1] * dn[1]) || 1, ice = '';
    dn = [dn[0] / dl, dn[1] / dl];
    for (j = 1; j < 9; j++) {
      var t = j / 9 + (rnd() - 0.5) * 0.05, p0 = lerp2(far[0], far[1], t), ln = (8 + rnd() * 18) * sc * 0.74, w = 3 * sc * 0.74 + 0.4;
      ice += P(poly([p0[0] - w, p0[1], p0[0] + dn[0] * ln, p0[1] + dn[1] * ln, p0[0] + w, p0[1]]), mix('#f0fbff', fogc, fog * 0.4));
    }
    s += G(ice, { opacity: 0.85 });
  }
  /* glow from the far end over the tunnel */
  s += C(VX, VY, 70, d.rad([[0, '#ffffff', 0.9], [0.5, '#bfe8ff', 0.5], [1, '#bfe8ff', 0]]), { filter: d.blur(6) });
  /* the near part: the cellar stair */
  var f0 = Fs[0], NTL = [-60, -40], NTR = [860, -40], NBR = [800, 470], NBL = [0, 470];
  var lwq = [NTL, f0[0], f0[3], NBL], rwq = [NTR, f0[1], f0[2], NBR], cq = [NTL, NTR, f0[1], f0[0]], st = [f0[3], f0[2], NBR, NBL];
  /* ceiling: an upside-down stair, the first impossible thing */
  s += sc_q(cq, '#1c1416');
  for (j = 0; j < 7; j++) {
    var v0 = Math.pow(j / 7, 1.5), v1 = Math.pow((j + 1) / 7, 1.5);
    s += sc_q(fh_qpoly([f0[0], f0[1], NTR, NTL], 0, 1, v0, v0 + (v1 - v0) * 0.7), '#3a2a26') + sc_ln(fh_ql([f0[0], f0[1], NTR, NTL], 0, v0), fh_ql([f0[0], f0[1], NTR, NTL], 1, v0), '#8ab0d0', 1.2, { opacity: 0.5 });
  }
  /* left wall: rose wallpaper with a dado rail, fusing into brick near the door */
  s += fh_paper(lwq, '#c89aa0', '#8a4a5a', 0.12, fogc, 7, 6) + fh_brick(rnd, lwq, 0.78, '#7a3e30', 0.12, fogc, 3, 9);
  s += sc_ln(fh_ql(lwq, 0, 0.6), fh_ql(lwq, 1, 0.6), '#2a1810', 9) + sc_ln(fh_ql(lwq, 0, 0.6), fh_ql(lwq, 1, 0.6), '#8a5a34', 5);
  s += sc_q(fh_qpoly(lwq, 0, 1, 0.62, 1), '#3a2418', { opacity: 0.55 });
  /* a tilted picture frame, frosted over */
  s += T(fh_frame(d, 70, 88, '#b8975a', 'two', true), 110, 168, 1, -9);
  s += P('M76 126 C90 118 110 124 146 114 L146 120 C110 128 92 126 76 134Z', '#f4fbff', null, null, { opacity: 0.55, filter: d.blur(1.5) });
  /* right wall: brick, with a doorframe that opens onto more brick */
  s += sc_q(rwq, '#6a3428');
  s += fh_brick(rnd, rwq, 0, '#7a3e30', 0.08, fogc, 6, 14) + fh_paper(fh_qpoly(rwq, 0.75, 1, 0, 1), '#bcd0bc', '#4a7a5a', 0.1, fogc, 2, 6);
  var dq2 = fh_qpoly(rwq, 0.32, 0.56, 0.3, 0.99);
  s += sc_q(dq2, '#5a2c22') + fh_brick(rnd, dq2, 0, '#6e3628', 0.05, fogc, 3, 12);
  s += P(poly([dq2[3][0], dq2[3][1], dq2[0][0], dq2[0][1], dq2[1][0], dq2[1][1], dq2[2][0], dq2[2][1]]).replace(/Z$/, ''), 'none', '#1a0e08', 20) + P(poly([dq2[3][0], dq2[3][1], dq2[0][0], dq2[0][1], dq2[1][0], dq2[1][1], dq2[2][0], dq2[2][1]]).replace(/Z$/, ''), 'none', '#8a5a34', 13);
  /* stair treads, descending into the fold */
  var NS = 8, frostB = d.blur(3);
  for (j = 0; j < NS; j++) {
    var a0 = Math.pow(j / NS, 1.7), a1 = Math.pow((j + 1) / NS, 1.7), tread = fh_qpoly(st, 0, 1, a0, a1);
    s += sc_q(tread, d.lin([[0, mix('#5a4438', fogc, 0.3 - j * 0.03)], [1, '#2a1c16']])) + sc_q(fh_qpoly(st, 0, 1, a0, a0 + (a1 - a0) * 0.22), '#120a08', { opacity: 0.85 });
    s += sc_ln(fh_ql(st, 0, a0 + (a1 - a0) * 0.22), fh_ql(st, 1, a0 + (a1 - a0) * 0.22), '#dff2ff', 1.4, { opacity: 0.55 });
    s += G(sc_q(fh_qpoly(st, 0.0, 0.16, a0 + (a1 - a0) * 0.3, a1), '#eef8ff', { opacity: 0.45 }) + sc_q(fh_qpoly(st, 0.88, 1, a0 + (a1 - a0) * 0.4, a1), '#eef8ff', { opacity: 0.35 }), { filter: frostB });
  }
  /* cold light spilling out of the fold over the near walls, rime on every edge */
  s += R(0, 0, 800, 450, d.rad([[0, '#bfe6ff', 0.45], [0.35, '#6aa8e8', 0.22], [1, '#1a3a6a', 0.05]], 0.5, 0.44, 0.7));
  var rime = P(poly([f0[0][0], f0[0][1], f0[1][0], f0[1][1], f0[2][0], f0[2][1], f0[3][0], f0[3][1]]), 'none', '#f4fbff', 6) + sc_ln(fh_ql(lwq, 0, 0.6), fh_ql(lwq, 1, 0.6), '#f4fbff', 3) + sc_ln(NTL, f0[0], '#f4fbff', 4) + sc_ln(NTR, f0[1], '#f4fbff', 4) + sc_ln(NBL, f0[3], '#f4fbff', 4) + sc_ln(NBR, f0[2], '#f4fbff', 4);
  s += G(rime, { opacity: 0.5, filter: d.blur(2.5) });
  /* frost creeping in from the corners */
  var fern = '';
  for (i = 0; i < 26; i++) {
    var ox = rnd() < 0.5 ? rnd() * 160 : 800 - rnd() * 160, oy = rnd() < 0.5 ? rnd() * 90 : 450 - rnd() * 70, ang = rnd() * Math.PI * 2, len = 20 + rnd() * 40;
    var ex = ox + Math.cos(ang) * len, ey = oy + Math.sin(ang) * len;
    fern += sc_ln([ox, oy], [ex, ey], '#e8f8ff', 1.2);
    for (j = 1; j < 4; j++) { var px = ox + (ex - ox) * j / 4, py = oy + (ey - oy) * j / 4, bl = len * 0.25; fern += sc_ln([px, py], [px + Math.cos(ang + 0.6) * bl, py + Math.sin(ang + 0.6) * bl], '#e8f8ff', 0.8) + sc_ln([px, py], [px + Math.cos(ang - 0.6) * bl, py + Math.sin(ang - 0.6) * bl], '#e8f8ff', 0.8); }
  }
  s += G(fern, { opacity: 0.45, filter: d.blur(0.6) });
  /* the single warm candle on the stair */
  var cx = 588, cy = 398;
  s += C(cx, cy - 40, 170, d.rad([[0, '#ffb860', 0.55], [0.4, '#ff9a40', 0.18], [1, '#ff9a40', 0]]));
  s += E(cx, cy + 6, 120, 26, d.rad([[0, '#ffc070', 0.45], [1, '#ffc070', 0]]));
  s += E(cx, cy + 4, 24, 6, '#6a4a1a', { stroke: INK, 'stroke-width': 1.2 }) + E(cx, cy + 1, 22, 5, mc_metal(d, '#c8962a'), { stroke: INK, 'stroke-width': 1 });
  s += P('M' + (cx + 22) + ' ' + cy + ' C' + (cx + 34) + ' ' + (cy - 4) + ' ' + (cx + 34) + ' ' + (cy + 10) + ' ' + (cx + 22) + ' ' + (cy + 6), 'none', '#c8962a', 2.4);
  s += R(cx - 7, cy - 42, 14, 42, d.lin([[0, '#fff6e0'], [0.6, '#f0e2c0'], [1, '#c8b08a']], 0, 0, 1, 0), { stroke: INK, 'stroke-width': 1, rx: 2 });
  s += P('M' + (cx - 7) + ' ' + (cy - 38) + ' C' + (cx - 9) + ' ' + (cy - 30) + ' ' + (cx - 6) + ' ' + (cy - 26) + ' ' + (cx - 7) + ' ' + (cy - 20), 'none', '#fff6e0', 2.4);
  s += L(cx, cy - 42, cx, cy - 47, '#2a1a10', 1.2);
  s += G(P('M' + cx + ' ' + (cy - 66) + ' C' + (cx + 7) + ' ' + (cy - 56) + ' ' + (cx + 6) + ' ' + (cy - 46) + ' ' + cx + ' ' + (cy - 45) + ' C' + (cx - 6) + ' ' + (cy - 46) + ' ' + (cx - 7) + ' ' + (cy - 56) + ' ' + cx + ' ' + (cy - 66) + 'Z', '#ffd27a') +
    E(cx, cy - 51, 2.6, 5, '#fffbe8'), { filter: gl });
  /* drifting snow pulled toward the fold, and a cold vignette */
  s += sc_snow(d, rnd, 90, '#e8f6ff', 0.7);
  for (i = 0; i < 9; i++) s += sparkle(250 + rnd() * 300, 80 + rnd() * 220, 2 + rnd() * 4, '#ffffff', { opacity: f(0.5 + rnd() * 0.5) });
  s += sc_vig(d, 0.85, '#02040a');
  return s;
};
})();
