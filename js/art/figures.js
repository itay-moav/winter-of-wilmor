/* Velmoor art: Hero full-body figures (200x400, feet on y=390): posed limb chains, body parts, held props,
 * class outfits and the renderFigure() compositor.
 * Plain script (no modules); load order is listed in js/art/api.js. */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL;
/* from core.js */
var f = A.f, shade = A.shade, P = A.P, C = A.C, E = A.E, R = A.R, L = A.L, G = A.G, starPts = A.starPts, sparkle = A.sparkle, INK = A.INK;
/* from symbols.js */
var faithAt = A.faithAt;
/* from portraits.js */
var both = A.both, cast = A.cast, mats = A.mats, headSvg = A.headSvg, braid = A.braid, hairStyle = A.hairStyle, hairBackSvg = A.hairBackSvg,
    hairFrontSvg = A.hairFrontSvg, pauldron = A.pauldron, runeGlyphs = A.runeGlyphs, PROPS = A.PROPS, buildCtx = A.buildCtx, beardSvg = A.beardSvg;

/* ------------------------------------------------------------------ */
/* Full-body figures (200 x 400, transparent, feet on y=390)           */
/* ------------------------------------------------------------------ */
var FG = 390;
function lerp2(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
function capsule(x1, y1, r1, x2, y2, r2) {
  var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 0.001, nx = -dy / L, ny = dx / L;
  return 'M' + f(x1 + nx * r1) + ' ' + f(y1 + ny * r1) + ' L' + f(x2 + nx * r2) + ' ' + f(y2 + ny * r2) +
    ' A' + f(r2) + ' ' + f(r2) + ' 0 0 0 ' + f(x2 - nx * r2) + ' ' + f(y2 - ny * r2) + ' L' + f(x1 - nx * r1) + ' ' + f(y1 - ny * r1) +
    ' A' + f(r1) + ' ' + f(r1) + ' 0 0 0 ' + f(x1 + nx * r1) + ' ' + f(y1 + ny * r1) + 'Z';
}
function chainD(pts, rs, add) {
  var s = '';
  add = add || 0;
  for (var i = 0; i < pts.length - 1; i++) s += capsule(pts[i][0], pts[i][1], rs[i] + add, pts[i + 1][0], pts[i + 1][1], rs[i + 1] + add);
  return s;
}
/* sub-range of a polyline (t in 0..1 across the segment indices) */
function subChain(pts, rs, t0, t1) {
  var n = pts.length - 1, op = [], or = [];
  function at(t) { var x = Math.min(n - 0.0001, Math.max(0, t * n)), i = Math.floor(x), u = x - i; return [lerp2(pts[i], pts[i + 1], u), rs[i] + (rs[i + 1] - rs[i]) * u]; }
  var a = at(t0); op.push(a[0]); or.push(a[1]);
  for (var i = 1; i < n; i++) { if (i / n > t0 && i / n < t1) { op.push(pts[i]); or.push(rs[i]); } }
  var b = at(t1); op.push(b[0]); or.push(b[1]);
  return { pts: op, rs: or };
}
/* outline pass + fill pass so joints have no seams; optional cel shadow */
function drawChain(d, pts, rs, fill, ow, shCol, add) {
  var dd = chainD(pts, rs, add);
  var tr = /^rgba\(([^)]*)\)/.exec(fill);
  if (tr) {
    var parts = tr[1].split(','), alpha = parseFloat(parts[3]);
    return G(P(dd, 'none', INK, (ow == null ? 1.3 : ow) * 2) + P(dd, 'rgb(' + parts.slice(0, 3).join(',') + ')'), { opacity: f(alpha * 100) / 100 });
  }
  var s = P(dd, INK, INK, (ow == null ? 1.3 : ow) * 2);
  s += P(dd, fill);
  if (shCol) {
    var sp = [], sr = [];
    for (var i = 0; i < pts.length; i++) { sp.push([pts[i][0] + (rs[i] + (add || 0)) * 0.55, pts[i][1]]); sr.push((rs[i] + (add || 0)) * 0.62); }
    s += G(P(chainD(sp, sr), shCol, null, null, 'opacity=".5"'), { 'clip-path': d.clip('<path d="' + dd + '"/>') });
  }
  return s;
}
function angDeg(a, b) { return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; }

/* ---------- poses ---------- */
var IDLE_ARM = { e: [5, 46], h: [8, 90] };
var FIG_POSES = {
  idle: { arms: [IDLE_ARM, IDLE_ARM], legs: { k: [14, 274], a: [16, 370] } },
  warrior: { arms: [{ e: [16, 40], h: [-2, 26], front: 1, prop: 'swordShoulder' }, { e: [12, 40], h: [8, 80], front: 1, prop: 'roundShield' }], legs: { k: [22, 272], a: [30, 370] } },
  paladin: { arms: [{ e: [18, 30], h: [16, -4], prop: 'swordUp' }, { e: [2, 42], h: [-12, 70], front: 1, prop: 'kiteShield' }], legs: { k: [18, 272], a: [24, 370] } },
  rogue: { dy: 16, arms: [{ e: [24, 30], h: [10, 58], front: 1, prop: 'daggerDown' }, { e: [24, 26], h: [22, 46], front: 1, prop: 'daggerFwd' }], legs: { k: [32, 262], a: [32, 370] } },
  bard: { arms: [{ e: [18, 34], h: [10, 24], front: 1 }, { e: [10, 38], h: [-8, 60], front: 1 }], legs: { k: [10, 274], a: [20, 370] }, prop: 'lute' },
  hunter: { arms: [{ e: [32, -12], h: [62, -18], front: 1, prop: 'bow' }, { e: [32, -8], h: [-12, -20], front: 1 }], legs: { k: [22, 272], a: [30, 370] } },
  monk: { dy: 8, arms: [{ e: [16, 30], h: [0, 6], front: 1 }, { e: [30, 8], h: [58, 4], front: 1 }], legs: { k: [28, 268], a: [36, 370] } },
  conjurer: { arms: [{ e: [22, 32], h: [34, 50], front: 1, hand: 'open', fx: 'fire' }, { e: [20, 6], h: [26, -14], prop: 'staffFlame' }], legs: { k: [14, 274], a: [20, 370] } },
  magician: { arms: [{ e: [24, 22], h: [30, -4], hand: 'open', fx: 'orb' }, { e: [8, 44], h: [4, 86] }], legs: { k: [12, 274], a: [18, 370] } },
  sorcerer: { arms: [{ e: [24, 30], h: [40, 54], hand: 'open', fx: 'rune' }, { e: [24, 30], h: [40, 54], hand: 'open', fx: 'rune' }], legs: { k: [16, 274], a: [22, 370] }, fx: 'runeCircle' },
  wizard: { arms: [{ e: [16, 4], h: [18, -20], prop: 'staffCrystal' }, { e: [18, 34], h: [28, 62], hand: 'open', fx: 'sparkle' }], legs: { k: [14, 274], a: [18, 370] } }
};

var FIG_RACE = {
  human: { w: 1, h: 1, head: 1 }, elf: { w: 0.94, h: 1.04, head: 0.97 }, halfelf: { w: 0.97, h: 1.02, head: 1 },
  dwarf: { w: 1.24, h: 0.74, head: 1.04 }, hobbit: { w: 0.94, h: 0.64, head: 0.92 }, gnome: { w: 0.92, h: 0.62, head: 0.9 },
  halforc: { w: 1.14, h: 1.02, head: 1 }
};

function figSkeleton(c, pose) {
  var fem = c.fem, dy = pose.dy || 0, sk = { fem: fem, dy: dy, arms: [], legs: [] };
  var shX = fem ? 23.5 : 35.5, shY = (fem ? 104 : 106) + dy, hipX = fem ? 13 : 15, hipY = (fem ? 184 : 186) + dy;
  var ar = fem ? [6.4, 5.6, 4.4, 4.5, 3.5] : [11.5, 10.8, 7.8, 8.4, 5.8];
  var lr = fem ? [13.8, 11.4, 7, 8, 4.2] : [17, 14.6, 9.6, 10.6, 6.2];
  for (var k = 0; k < 2; k++) {
    var s = k ? 1 : -1, a = pose.arms[k] || IDLE_ARM;
    var S = [100 + s * shX, shY], E = [S[0] + s * a.e[0], S[1] + a.e[1]], H = [S[0] + s * a.h[0], S[1] + a.h[1]];
    var W = lerp2(E, H, 0.86);
    sk.arms.push({ side: s, S: S, E: E, H: H, W: W, def: a, pts: [S, lerp2(S, E, 0.45), E, lerp2(E, W, 0.4), W], rs: ar.slice() });
    var lg = (k && pose.legsR) || pose.legs;
    var Hp = [100 + s * hipX, hipY], K = [100 + s * lg.k[0], lg.k[1]], A = [100 + s * lg.a[0], lg.a[1]];
    var Cf = lerp2(K, A, 0.28); Cf[0] += s * 1.4;
    sk.legs.push({ side: s, Hp: Hp, K: K, A: A, pts: [Hp, lerp2(Hp, K, 0.42), K, Cf, A], rs: lr.slice() });
  }
  return sk;
}

/* ---------- body parts ---------- */
var FTORSO = {
  f: 'M94 76 L94 92 C88 95 80 95 74 98 C69 101 70 109 76 116 C75 122 76 130 80 137 C83 143 84 148 84 154 C82 162 74 170 74 180 C76 190 88 198 100 200 C112 198 124 190 126 180 C126 170 118 162 116 154 C116 148 117 143 120 137 C124 130 125 122 124 116 C130 109 131 101 126 98 C120 95 112 95 106 92 L106 76Z',
  m: 'M92 76 L92 92 C84 96 74 97 66 100 C60 104 61 114 70 122 C70 132 72 142 76 152 C79 160 79 166 78 174 C77 184 84 196 100 202 C116 196 123 184 122 174 C121 166 121 160 124 152 C128 142 130 132 130 122 C139 114 140 104 134 100 C126 97 116 96 108 92 L108 76Z'
};
function figTorsoSkin(d, c) {
  var tp = c.fem ? FTORSO.f : FTORSO.m;
  var s = P(tp, INK, INK, 2.6) + P(tp, c.skinBodyG);
  var det = P('M118 92 C126 120 116 150 120 170 C122 184 114 196 104 204 L140 204 L140 90Z', c.skinSh, null, null, 'opacity=".55"');
  det += P(c.fem ? 'M94 80 Q100 92 106 80 L106 88 Q100 98 94 88Z' : 'M92 80 Q100 94 108 80 L108 88 Q100 100 92 88Z', c.skinSh, null, null, 'opacity=".7"');
  if (c.fem) {
    det += both(P('M95 97 Q88 99 80 99', 'none', c.skinLine, 0.8, 'opacity=".6"'));
    det += P('M80 137 C86 142 95 141 99 135 M101 135 C105 141 114 142 120 137', 'none', c.skinLine, 1, 'opacity=".7"');
    det += E(100, 166, 0.9, 2, c.skinSh) + P('M100 146 L100 160', 'none', c.skinLine, 0.6, 'opacity=".35"');
    det += P('M82 140 C86 160 82 172 80 184', 'none', '#fff', 2, 'opacity=".2"');
  } else {
    det += both(P('M93 96 Q84 99 70 101', 'none', c.skinLine, 0.9, 'opacity=".6"'));
    det += both(P('M100 112 C97 126 84 131 72 125', 'none', c.skinLine, 1.3, 'opacity=".75"'));
    det += P('M100 130 L100 196', 'none', c.skinLine, 0.9, 'opacity=".55"');
    det += both(P('M90 143 Q95 145 99 143 M89 157 Q95 159 99 157 M90 171 Q95 173 99 171', 'none', c.skinLine, 0.9, 'opacity=".55"'));
    det += both(P('M80 150 C84 166 88 180 93 196', 'none', c.skinLine, 0.9, 'opacity=".45"'));
    det += P('M74 112 C80 104 90 104 95 108', 'none', '#fff', 2.2, 'opacity=".22"');
  }
  s += G(det, { 'clip-path': d.clip('<path d="' + tp + '"/>') });
  return s;
}
function figFoot(d, c, leg, style, col) {
  var A = leg.A, sc = c.fem ? 1 : 1.18;
  var foot = 'M-4.6 0 C-5.5 6 -6.5 10 -7 13 C-7.5 17 -2 18.6 4 18.2 C9 17.8 11.4 15 9 12 C6 9 5 4 4.6 0Z';
  var fill = style === 'boot' ? col : c.skinG;
  var s = P(foot, INK, INK, 2.4) + P(foot, fill);
  if (style === 'boot') s += P('M-7 15.5 C-2 18 6 18 10 15', 'none', shade(col, -0.5), 2) + P('M-3 3 C-4 7 -5 10 -5 12', 'none', '#fff', 1, 'opacity=".35"');
  else if (style === 'sandal') s += P('M-5 7 L5 5 M-6 11 L8 10 M0 0 L0 6', 'none', col || '#c9a24a', 1.4);
  else if (style === 'wrap') s += P('M-5 3 L5 2 M-6 7 L6 6', 'none', '#f6f0e6', 2.2) + P('M2 16.5 L2.4 14 M5 16 L5.4 13.6', 'none', c.skinLine, 0.6);
  else s += P('M2 16.5 L2.4 14 M5 16 L5.4 13.6 M7.4 15 L7.6 13', 'none', c.skinLine, 0.6);
  return '<g transform="translate(' + f(A[0]) + ' ' + f(A[1]) + ') scale(' + f(leg.side * sc) + ' ' + f((FG - A[1]) / 18.4) + ')">' + s + '</g>';
}
function figHand(d, c, arm, open, fill) {
  var r = c.fem ? 4.2 : 5.6, H = arm.H, a = angDeg(arm.E, H);
  var sh = open ? 'M-2 -3.4 C4 -4.6 10 -3 11 0 C10 3 4 4.4 -2 3.4Z M2 -3 C4 -6 7 -7.4 8 -6 C7 -4 5 -3 3 -2Z' : 'M-3 -4 C2 -6 8 -5 9 -1 C10 3 7 6 2 6 C-2 6 -4 3 -3 -4Z';
  var g = '<g transform="translate(' + f(H[0]) + ' ' + f(H[1]) + ') rotate(' + f(a) + ') scale(' + f(r / 4.2) + ')">';
  return g + P(sh, INK, INK, 2.2) + P(sh, fill || c.skinG) + (open ? '' : P('M3 -4.4 L3.6 4.6', 'none', c.skinLine, 0.6, 'opacity=".7"')) + '</g>';
}
function figArmSkin(d, c, arm) { return drawChain(d, arm.pts, arm.rs, c.skinBodyG, 1.3, c.skinSh); }
function figLegSkin(d, c, leg) { return drawChain(d, leg.pts, leg.rs, c.skinBodyG, 1.3, c.skinSh); }
function armPart(d, arm, t0, t1, fill, add, ow) { var sc = subChain(arm.pts, arm.rs, t0, t1); return drawChain(d, sc.pts, sc.rs, fill, ow == null ? 1.1 : ow, 'rgba(30,10,40,0.6)', add == null ? 1.2 : add); }
function legPart(d, leg, t0, t1, fill, add, ow) {
  var sc = subChain(leg.pts, leg.rs, t0, t1);
  var r = drawChain(d, sc.pts, sc.rs, fill, ow == null ? 1.1 : ow, 'rgba(30,10,40,0.6)', add == null ? 1.4 : add);
  if (t0 > 0.04) {
    var p0 = sc.pts[0], w = sc.rs[0] + (add == null ? 1.4 : add) + 2;
    r = G(r, { 'clip-path': d.clip('<rect x="-60" y="' + f(p0[1]) + '" width="320" height="480"/>') }) + P('M' + f(p0[0] - w + 2) + ' ' + f(p0[1]) + ' L' + f(p0[0] + w - 2) + ' ' + f(p0[1]), 'none', INK, 1.6);
  }
  return r;
}
function kneeCop(leg, fill) { return C(leg.K[0], leg.K[1], 7.5, fill, { stroke: INK, 'stroke-width': 1.3 }) + P('M' + f(leg.K[0] - 4) + ' ' + f(leg.K[1] - 3) + ' Q' + f(leg.K[0]) + ' ' + f(leg.K[1] - 7) + ' ' + f(leg.K[0] + 4) + ' ' + f(leg.K[1] - 3), 'none', '#fff', 1.2, 'opacity=".7"'); }
function wraps(d, sc, n) {
  var s = '', p = sc.pts, a = p[0], b = p[p.length - 1];
  for (var i = 1; i < n; i++) { var q = lerp2(a, b, i / n); var r = (sc.rs[0] + (sc.rs[sc.rs.length - 1] - sc.rs[0]) * i / n) + 1.6; s += 'M' + f(q[0] - r) + ' ' + f(q[1] - 1.5) + ' L' + f(q[0] + r) + ' ' + f(q[1] + 1.5); }
  return P(s, 'none', '#bfb3a2', 0.9);
}

/* ---------- held props ---------- */
function propSword(d, m, len, glow) {
  var s = P('M-3.4 -10 L3.4 -10 L2.6 ' + f(-len) + ' L0 ' + f(-len - 7) + ' L-2.6 ' + f(-len) + 'Z', m.steel, INK, 1.2) + P('M0 -12 L0 ' + f(-len), 'none', '#fff', 0.8, 'opacity=".8"');
  if (glow) s = G(P('M-3.4 -10 L3.4 -10 L2.6 ' + f(-len) + ' L0 ' + f(-len - 7) + ' L-2.6 ' + f(-len) + 'Z', '#fff6c0', null, null, 'opacity=".5"'), { filter: glow }) + s;
  return s + R(-11, -12, 22, 4.5, m.gold, { stroke: INK, 'stroke-width': 1, rx: 1.5 }) + R(-2.4, -8, 4.8, 17, '#4a2c18', { stroke: INK, 'stroke-width': 0.9 }) + C(0, 11, 3.4, m.gold, { stroke: INK, 'stroke-width': 0.9 });
}
function propDagger(m) { return P('M-2.4 -6 L2.4 -6 L0 -30Z', m.steel, INK, 1) + P('M0 -8 L0 -26', 'none', '#fff', 0.7) + R(-6, -7.5, 12, 3, m.gold, { stroke: INK, 'stroke-width': 0.8 }) + R(-1.8, -5, 3.6, 11, '#3a2418', { stroke: INK, 'stroke-width': 0.8 }); }
function propAt(content, P0, ang) { return '<g transform="translate(' + f(P0[0]) + ' ' + f(P0[1]) + ') rotate(' + f(ang) + ')">' + content + '</g>'; }
function figProp(d, c, m, arm, key) {
  var H = arm.H, fa = angDeg(arm.E, arm.H);
  switch (key) {
    case 'swordShoulder': return propAt(propSword(d, m, 78), H, arm.side < 0 ? 36 : -36);
    case 'swordUp': return propAt(propSword(d, m, 92, c.glowMd), H, arm.side * -6);
    case 'daggerDown': return propAt(propDagger(m), H, 180 + arm.side * 20);
    case 'daggerFwd': return propAt(propDagger(m), H, arm.side * 50);
    case 'roundShield': {
      var P1 = lerp2(arm.E, arm.H, 0.55);
      return propAt(C(0, 0, 25, INK) + C(0, 0, 23.5, m.steel) + C(0, 0, 19, '#8a1f24', { stroke: INK, 'stroke-width': 1.1 }) + P(starPts(0, 0, 11, 4.5, 4), m.gold, INK, 0.9) + C(0, 0, 3.6, m.steel, { stroke: INK, 'stroke-width': 0.8 }) +
        P('M-17 -9 A20 20 0 0 1 -6 -19', 'none', '#fff', 2.4, 'opacity=".6"'), P1, 0);
    }
    case 'kiteShield': {
      var sh = 'M-24 -34 C-8 -40 8 -40 24 -34 C26 -2 16 28 0 46 C-16 28 -26 -2 -24 -34Z';
      return propAt(P(sh, m.white, INK, 2) + P('M-20 -30 C-6 -35 6 -35 20 -30 C22 -2 13 24 0 40 C-13 24 -22 -2 -20 -30Z', 'none', '#d9a83c', 2) + faithAt(d, 'dawn', 0, -4, 26) + P('M-16 -26 C-10 -30 -4 -31 2 -31', 'none', '#fff', 2.2, 'opacity=".8"'), lerp2(arm.E, arm.H, 0.75), 0);
    }
    case 'bow': {
      var bw = 'M2 -64 C-22 -30 -22 30 2 64';
      return propAt(P(bw, 'none', INK, 6) + P(bw, 'none', m.wood, 3.6) + P('M-4 -46 C-12 -20 -12 20 -4 46', 'none', '#e8b070', 1, 'opacity=".6"') + R(-14, -8, 9, 16, '#3a2410', { stroke: INK, 'stroke-width': 0.9 }), H, 0);
    }
    case 'staffFlame': {
      var s = P('M0 -30 L0 200', 'none', INK, 7) + P('M0 -30 L0 200', 'none', m.wood, 4.4);
      s += P('M0 -26 C-11 -31 -11 -48 0 -53 C11 -48 11 -31 0 -26Z', 'none', '#7a4a20', 2.6);
      var fl = 'M0 -36 C-13 -43 -9 -58 -5 -65 C-4 -58 0 -58 0 -72 C6 -62 11 -57 7 -48 C14 -51 14 -58 12 -62 C20 -50 15 -38 0 -36Z';
      s += G(P(fl, '#ff7a1a') + P('M0 -40 C-6 -45 -4 -52 0 -58 C4 -51 7 -47 0 -40Z', '#ffe080'), { filter: c.glowLg });
      return propAt(s, H, 0);
    }
    case 'staffCrystal': {
      var t = P('M0 -40 L0 220', 'none', INK, 7) + P('M0 -40 L0 220', 'none', m.wood, 4.4) + P('M-7 -40 C-9 -48 -4 -52 0 -50 C4 -52 9 -48 7 -40Z', '#c9a24a', INK, 1);
      t += C(0, -60, 16, '#7ad8ff', { opacity: 0.45, filter: c.glowLg }) + P('M0 -76 L8 -60 L0 -44 L-8 -60Z', d.lin([[0, '#ffffff'], [0.5, '#9ae0ff'], [1, '#2a7ad0']], 0, 0, 1, 1), INK, 1.2) + P('M0 -72 L4 -60 L0 -48', 'none', '#fff', 1, 'opacity=".8"');
      return propAt(t, H, 0);
    }
  }
  return '';
}
function figFx(d, c, arm, key) {
  var H = arm.H;
  if (key === 'fire') return propAt(C(0, -10, 14, '#ff8a20', { opacity: 0.45, filter: c.glowLg }) + G(P('M0 -2 C-9 -8 -7 -20 -3 -26 C-2 -20 0 -20 1 -30 C6 -22 10 -16 7 -8 C9 -10 10 -14 9 -16 C14 -8 9 0 0 -2Z', '#ff7a1a') + P('M0 -4 C-4 -8 -3 -14 0 -18 C3 -12 5 -9 0 -4Z', '#ffe080'), { filter: c.glowSm }), [H[0], H[1] - 4], 0);
  if (key === 'orb') {
    var g = d.rad([[0, '#ffffff'], [0.35, '#9ff8ff'], [0.8, '#2ab0e0'], [1, '#1a4a9a']], 0.4, 0.35, 0.65);
    return propAt(C(0, 0, 22, '#5af0ff', { opacity: 0.4, filter: c.glowLg }) + C(0, 0, 13, g, { stroke: '#e0ffff', 'stroke-width': 1 }) + E(-4, -5, 4.4, 3, '#fff', 'opacity=".8"') + sparkle(16, -14, 5, '#fff') + sparkle(-16, -8, 3.4, '#bff') + sparkle(10, 18, 3, '#fff'), [H[0], H[1] - 22], 0);
  }
  if (key === 'rune') return G(C(H[0], H[1], 9, 'none', { stroke: '#d08aff', 'stroke-width': 1.2, opacity: 0.9 }) + runeGlyphs(d, c, H[0], H[1], 9, 5, '#f6d8ff') + C(H[0], H[1], 6, '#c06aff', { opacity: 0.5 }), { filter: c.glowMd });
  if (key === 'sparkle') return G(sparkle(H[0] + 6, H[1] - 10, 6, '#fff') + sparkle(H[0] - 6, H[1] - 18, 4, '#d0e0ff') + sparkle(H[0] + 12, H[1] + 2, 3, '#fff') + C(H[0], H[1] - 6, 9, '#bfd8ff', { opacity: 0.4 }), { filter: c.glowSm });
  return '';
}
function figLute(d, m, sk) {
  var body = 'M-30 0 C-30 -22 -14 -30 0 -26 C10 -40 30 -36 32 -16 C40 0 30 28 0 30 C-24 30 -30 16 -30 0Z';
  var s = P('M18 -18 L92 -74 L98 -66 L26 -10Z', d.lin([[0, '#6a3c18'], [1, '#3a1e0a']]), INK, 1.2) +
    P('M90 -76 L108 -92 L116 -84 L98 -66Z', '#3a1e0a', INK, 1.2) + C(104, -88, 2, m.gold) + C(110, -82, 2, m.gold) + C(100, -80, 2, m.gold) +
    P(body, INK, INK, 3) + P(body, m.wood) + P('M-22 -2 C-22 -16 -10 -22 0 -20', 'none', '#f0c080', 2.2, 'opacity=".7"') +
    C(4, -4, 8, '#2a140a', { stroke: '#f0d080', 'stroke-width': 1.5 }) + P('M-8 12 L96 -70 M-6 14 L98 -68 M-4 16 L100 -66', 'none', '#f4f0e0', 0.6);
  return '<g transform="translate(118 ' + f(170 + sk.dy) + ') scale(-0.72 0.72)">' + s + '</g>';
}

/* ---------- figure outfits (torso coords; legs/arms are posed chains) ---------- */
var FCUP = 'M100 119 C96 114 87 113 81 117 C76 121 76 131 81 136 C86 140 95 139 100 132Z';
var FBOT = 'M76 178 C88 183 112 183 124 178 L120 186 C112 192 105 198 100 200 C95 198 88 192 80 186Z';
var FSKIRT = 'M74 174 C88 180 112 180 126 174 L138 214 C114 222 86 222 62 214Z';
var FCAPE = 'M76 98 C62 150 52 240 42 330 L62 322 L82 334 L100 324 L118 334 L138 322 L158 330 C148 240 138 150 124 98Z';
var MCAPE = 'M68 100 C52 150 42 240 32 336 L54 326 L76 340 L100 328 L124 340 L146 326 L168 336 C158 240 148 150 132 100Z';
var MCROTCH = 'M77 172 C90 177 110 177 123 172 L122 198 L100 212 L78 198Z';
var MCHEST = 'M70 104 C80 98 90 96 96 96 L100 118 L104 96 C110 96 120 98 130 104 C134 120 128 140 124 152 C122 162 122 168 123 176 L77 176 C78 168 78 162 76 152 C72 140 66 120 70 104Z';
function fBelt(y, fill, buckle) {
  var s = cast('M75 ' + y + ' C88 ' + (y + 5) + ' 112 ' + (y + 5) + ' 125 ' + y + ' L125 ' + (y + 7) + ' C112 ' + (y + 12) + ' 88 ' + (y + 12) + ' 75 ' + (y + 7) + 'Z', fill, INK, 1.1, 0, 2);
  if (buckle) s += R(95, y + 2, 10, 8, buckle, { stroke: INK, 'stroke-width': 0.9, rx: 1.5 });
  return s;
}
function mBelt(y, fill, buckle) {
  var s = cast('M77 ' + y + ' C90 ' + (y + 5) + ' 110 ' + (y + 5) + ' 123 ' + y + ' L123 ' + (y + 8) + ' C110 ' + (y + 13) + ' 90 ' + (y + 13) + ' 77 ' + (y + 8) + 'Z', fill, INK, 1.1, 0, 2);
  if (buckle) s += R(94, y + 2, 12, 9, buckle, { stroke: INK, 'stroke-width': 0.9, rx: 1.5 });
  return s;
}
function fCups(d, fill, trim, strapCol) {
  var s = both(P('M86 116 L95 91', 'none', INK, 2.6) + P('M86 116 L95 91', 'none', strapCol || trim || fill, 1.4));
  s += both(cast(FCUP, fill, INK, 1.2, 0, 2));
  if (trim) s += both(P('M100 120 C96 115 87 114 81 118', 'none', trim, 1.8));
  s += both(P('M83 121 C81 125 81 129 83 132', 'none', '#fff', 1.4, 'opacity=".5"'));
  return s;
}
function plates(fill, trim, y0, y1, n, w) {
  var s = '', i, x;
  for (i = 0; i < n; i++) {
    x = 100 + (i - (n - 1) / 2) * w * 0.92;
    var sp = (i - (n - 1) / 2) * 4;
    s += cast('M' + f(x - w / 2) + ' ' + y0 + ' L' + f(x + w / 2) + ' ' + y0 + ' L' + f(x + w / 2 + sp * 0.6) + ' ' + y1 + ' L' + f(x - w / 2 + sp * 0.6) + ' ' + y1 + 'Z', fill, INK, 1.1, 0, 2);
    if (trim) s += P('M' + f(x - w / 2 + sp * 0.6) + ' ' + (y1 - 2) + ' L' + f(x + w / 2 + sp * 0.6) + ' ' + (y1 - 2), 'none', trim, 1.4);
  }
  return s;
}
function strips(fill, y0, y1, xs) {
  var s = '';
  for (var i = 0; i < xs.length; i++) { var x = xs[i]; s += cast('M' + (x - 6) + ' ' + y0 + ' L' + (x + 6) + ' ' + y0 + ' L' + (x + 5 + (x - 100) * 0.12) + ' ' + y1 + ' L' + (x + (x - 100) * 0.12) + ' ' + (y1 + 5) + ' L' + (x - 5 + (x - 100) * 0.12) + ' ' + y1 + 'Z', fill, INK, 1, 0, 2); }
  return s;
}
function pantsLegs(d, fill) { return function (leg) { return legPart(d, leg, 0, 0.97, fill, 1.8); }; }
function bootsLegs(d, fill, t0, extra) { return function (leg) { return legPart(d, leg, t0 == null ? 0.52 : t0, 1, fill, 1.6) + (extra ? extra(leg) : ''); }; }
function starsOn(pts) { var r = ''; for (var i = 0; i < pts.length; i += 2) r += P(starPts(pts[i], pts[i + 1], 2.6, 1, 4), '#ffe9a0'); return r; }
var HALO = function (d, c) { return C(100, 68, 50, 'none', { stroke: '#ffe58a', 'stroke-width': 6, filter: c.glowMd }) + C(100, 68, 50, 'none', { stroke: '#fffbe0', 'stroke-width': 1.8 }); };
var HOOD_BACK = function (d) { return P('M52 122 C40 64 70 28 100 28 C130 28 160 64 148 122 C140 140 60 140 52 122Z', d.lin([[0, '#353b50'], [1, '#12151e']]), INK, 1.5); };

var FIG_OUTFIT = {
  warrior: function (d, c, m, sk) {
    var o = { foot: { style: 'boot', col: c.fem ? '#9aa4b4' : '#6a4a2a' } };
    if (c.fem) {
      o.torso = P('M93 86 C97 89 103 89 107 86 L107 82 C103 85 97 85 93 82Z', '#3a2a24', INK, 0.8) + fCups(d, m.steel, '#c9a24a', '#6a4a2a') + C(100, 126, 2.4, m.gold, { stroke: INK, 'stroke-width': 0.8 }) +
        cast(FBOT, m.steel, INK, 1.1, 0, 2) + fBelt(172, m.leather, m.gold) + plates(m.steel, '#c9a24a', 181, 206, 3, 13) + pauldron(d, c, 73, 103, 0.6, m.steel, '#c9a24a');
      o.legs = function (leg) { return legPart(d, leg, 0.5, 1, m.steel, 1.4) + kneeCop(leg, m.steel); };
      o.back = P('M78 100 C66 150 62 210 58 260 L80 250 L100 262 L120 250 L142 260 C138 210 134 150 122 100Z', d.lin([[0, '#a02028'], [1, '#4a0a10']]), INK, 1.3);
    } else {
      o.torso = cast('M64 104 L74 98 L126 182 L116 188Z', m.leather, INK, 1.1, 0, 2) + mBelt(172, m.leather, m.gold) + strips(d.lin([[0, '#6a4428'], [1, '#3a2414']]), 182, 236, [86, 100, 114]) +
        both(P('M78 182 C70 196 70 212 74 222 L84 214 C82 204 84 194 86 184Z', '#7a6048', INK, 1)) + pauldron(d, c, 66, 104, 0.85, m.steel, '#c9a24a');
      for (var i = 0; i < 5; i++) o.torso += C(72 + i * 11, 108 + i * 17, 1.6, '#d8d8e0', { stroke: INK, 'stroke-width': 0.6 });
      o.legs = function (leg) { return legPart(d, leg, 0.55, 1, m.leather, 1.6) + legPart(d, leg, 0.53, 0.6, '#d0c0a8', 3); };
    }
    o.arm = function (arm) { return armPart(d, arm, 0.55, 0.98, m.leather, 1.2); };
    return o;
  },
  paladin: function (d, c, m, sk) {
    var o = { foot: { style: 'boot', col: '#e6ebf5' }, headBack: HALO };
    o.back = P(c.fem ? FCAPE : MCAPE, d.lin([[0, '#3050a8'], [1, '#14204a']]), INK, 1.4);
    if (c.fem) {
      o.torso = P('M92 84 C96 90 104 90 108 84 L110 94 C104 98 96 98 90 94Z', m.gold, INK, 1) + fCups(d, m.white, '#d9a83c', '#d9a83c') + faithAt(d, 'dawn', 100, 126, 9) +
        cast(FBOT, m.white, INK, 1.1, 0, 2) + fBelt(172, m.gold) + plates(m.white, '#d9a83c', 181, 210, 3, 14) +
        pauldron(d, c, 73, 102, 0.55, m.white, '#d9a83c') + pauldron(d, c, 127, 102, 0.55, m.white, '#d9a83c', true);
      o.legs = function (leg) { return legPart(d, leg, 0.24, 1, m.white, 1.5) + kneeCop(leg, m.gold); };
      o.arm = function (arm) { return armPart(d, arm, 0.55, 0.98, m.white, 1.3); };
    } else {
      o.torso = cast(MCHEST.replace('L100 118 L104', 'L100 100 L104'), m.white, INK, 1.4, 0, 2) + P('M70 104 C80 98 90 96 100 98 C110 96 120 98 130 104', 'none', '#d9a83c', 2.2) +
        faithAt(d, 'dawn', 100, 126, 22) + P('M88 96 C94 102 106 102 112 96 L112 90 C106 94 94 94 88 90Z', m.gold, INK, 1) +
        mBelt(172, m.gold) + plates(m.white, '#d9a83c', 182, 222, 3, 17) + pauldron(d, c, 66, 104, 0.8, m.white, '#d9a83c') + pauldron(d, c, 134, 104, 0.8, m.white, '#d9a83c', true);
      o.legs = function (leg) { return legPart(d, leg, 0, 1, m.white, 1.6) + kneeCop(leg, m.gold); };
      o.arm = function (arm) { return armPart(d, arm, 0, 0.98, m.white, 1.4); };
    }
    o.hand = '#e6ebf5';
    return o;
  },
  rogue: function (d, c, m, sk) {
    var dk = '#2b2533', cl = d.lin([[0, '#3c4256'], [1, '#161a24']]);
    var o = { foot: { style: 'boot', col: '#2a2430' }, headBack: HOOD_BACK, hood: true };
    o.back = P(c.fem ? 'M74 96 C56 140 50 200 48 268 L66 256 L82 270 L100 258 L118 270 L134 256 L152 268 C150 200 144 140 126 96Z' : 'M66 98 C48 140 42 200 40 276 L60 264 L78 278 L100 266 L122 278 L140 264 L160 276 C158 200 152 140 134 98Z', cl, INK, 1.4);
    var scarf = P(c.fem ? 'M90 84 C96 92 104 92 110 84 L114 94 C106 102 94 102 86 94Z' : 'M88 84 C94 92 106 92 112 84 L117 96 C108 104 92 104 83 96Z', '#7a2030', INK, 1.1);
    if (c.fem) {
      o.torso = fCups(d, dk, '#7a6a8a', '#2a2430') + cast(FBOT, dk, INK, 1.1, 0, 2) + fBelt(170, m.leather, '#9aa0aa') + R(112, 176, 9, 10, m.leather, { stroke: INK, 'stroke-width': 0.9, rx: 2 }) + scarf;
      o.legs = function (leg) { return legPart(d, leg, 0.2, 1, '#2a2430', 1.6) + legPart(d, leg, 0.2, 0.24, '#4a4058', 2.4); };
    } else {
      o.torso = cast(MCHEST, dk, INK, 1.2, 0, 2) + P('M90 104 L96 114 M88 120 L97 130 M110 104 L104 114 M112 120 L103 130', 'none', '#7a6a8a', 1) + mBelt(172, m.leather, '#9aa0aa') + cast(MCROTCH, '#2a2430', INK, 1.1, 0, 2) + scarf;
      o.legs = function (leg) { return legPart(d, leg, 0, 0.97, '#33303e', 1.8) + legPart(d, leg, 0.5, 1, '#2a2430', 2.2); };
    }
    o.arm = function (arm) { return armPart(d, arm, 0.6, 0.98, '#2a2430', 1.2); };
    return o;
  },
  bard: function (d, c, m, sk) {
    var o = { foot: { style: 'boot', col: '#6a4022' } };
    var red = d.lin([[0, '#a42848'], [1, '#5a1028']]);
    if (c.fem) {
      o.torso = both(cast('M78 120 C80 113 90 111 98 114 C101 117 100 124 99 130 C94 137 84 138 80 134 C77 130 76 125 78 120Z', '#fdf6ee', INK, 1.1, 0, 2)) +
        cast('M80 136 C88 141 112 141 120 136 L117 172 C108 176 92 176 83 172Z', red, INK, 1.2, 0, 2) + P('M95 142 L105 148 M105 142 L95 148 M95 152 L105 158 M105 152 L95 158 M95 162 L105 168 M105 162 L95 168', 'none', '#f0d080', 0.9) +
        cast(FSKIRT, red, INK, 1.2, 0, 3) + P('M62 214 C86 222 114 222 138 214', 'none', '#f0d080', 2) + P('M90 88 C96 92 104 92 110 88', 'none', '#a42848', 2.4);
      o.legs = function (leg) { return legPart(d, leg, 0.46, 1, '#6a4022', 1.6) + legPart(d, leg, 0.46, 0.5, '#8a5a32', 2.4); };
    } else {
      o.torso = cast(MCHEST.replace('L100 118 L104', 'L100 130 L104'), '#f6efe6', INK, 1.2, 0, 2) +
        both(cast('M70 104 C76 100 84 98 88 98 L98 176 L77 176 C78 168 78 162 76 152 C72 140 66 120 70 104Z', d.lin([[0, '#2f7a5a'], [1, '#14402c']]), INK, 1.2, 0, 2) + P('M88 98 L98 176', 'none', '#f0d080', 1.3)) +
        mBelt(172, m.leather, m.gold) + cast(MCROTCH, '#5a3a22', INK, 1.1, 0, 2);
      o.legs = function (leg) { return legPart(d, leg, 0, 0.97, '#6a4a2e', 1.8) + legPart(d, leg, 0.5, 1, '#4a2a14', 2.2); };
      o.back = P('M120 98 C140 140 146 200 140 250 L126 240 L118 250 C124 200 122 140 110 100Z', d.lin([[0, '#2f7a5a'], [1, '#14402c']]), INK, 1.2);
    }
    o.arm = function (arm) { return armPart(d, arm, 0, 0.36, '#fdf6ee', c.fem ? 3.4 : 3) + (c.fem ? '' : armPart(d, arm, 0.36, 0.98, '#f6efe6', 1.4)); };
    return o;
  },
  hunter: function (d, c, m, sk) {
    var green = d.lin([[0, '#5a8a3a'], [1, '#2a4a1c']]), fur = d.lin([[0, '#c8b098'], [1, '#7a604a']]);
    var o = { foot: { style: 'boot', col: '#5a3a1c' } };
    o.back = '<g transform="translate(128 96) rotate(24)">' + R(-9, -14, 18, 66, '#6a4220', { stroke: INK, 'stroke-width': 1.3, rx: 3 }) + P('M-5 -14 L-7 -34 L-1 -26Z M1 -14 L1 -38 L5 -28Z M6 -14 L8 -32 L10 -22Z', '#e8e0d0', INK, 0.9) + '</g>';
    var strap = cast(c.fem ? 'M120 96 L128 100 L82 178 L74 174Z' : 'M126 98 L134 102 L82 180 L74 176Z', '#5a3a1c', INK, 1, 0, 2);
    var mantle = cast(c.fem ? 'M62 108 C60 98 68 92 78 92 C86 90 94 91 98 94 L92 100 L88 96 L84 104 L79 98 L74 108 L70 100 L66 110Z' : 'M54 110 C52 98 62 90 74 90 C84 88 94 89 98 92 L92 100 L88 95 L83 104 L78 97 L72 108 L67 99 L61 112Z', fur, INK, 1.1, 0, 2);
    if (c.fem) {
      o.torso = fCups(d, green, '#c8a060', '#4a3a20') + fBelt(170, '#6a4a2a', '#c8a060') + strips(green, 178, 214, [82, 94, 106, 118]) + strap + mantle;
      o.legs = function (leg) { var sc = subChain(leg.pts, leg.rs, 0.46, 1); return legPart(d, leg, 0.46, 1, '#6a4428', 1.6) + wraps(d, sc, 6); };
    } else {
      o.torso = cast(MCHEST.replace('L100 118 L104', 'L100 112 L104'), green, INK, 1.2, 0, 2) + P('M95 100 L105 104 M95 106 L105 110 M105 100 L95 104 M105 106 L95 110', 'none', '#c8a060', 0.9) +
        mBelt(172, '#5a3a1c', '#c8a060') + cast(MCROTCH, '#4a5a30', INK, 1.1, 0, 2) + strap + mantle;
      o.legs = function (leg) { return legPart(d, leg, 0, 0.97, '#4a5a30', 1.8) + legPart(d, leg, 0.52, 1, '#5a3a1c', 2.2); };
    }
    o.arm = function (arm) { return arm.side < 0 ? armPart(d, arm, 0.5, 0.98, '#5a3a1c', 1.3) : ''; };
    return o;
  },
  monk: function (d, c, m, sk) {
    var o = { foot: { style: 'wrap' } };
    var beads = '', n = 13, sash = '#d8641c';
    for (var i = 0; i < n; i++) { var a = Math.PI * (0.08 + i / (n - 1) * 0.84); beads += C(100 - Math.cos(a) * (c.fem ? 13 : 18), 88 + Math.sin(a) * (c.fem ? 20 : 26), i === 6 ? 2.8 : 2, i === 6 ? '#c8382c' : '#7a4a22', { stroke: INK, 'stroke-width': 0.6 }); }
    if (c.fem) {
      var wrap = 'M77 116 C88 112 112 112 123 116 L122 138 C110 142 90 142 78 138Z';
      o.torso = cast(wrap, '#f6f0e6', INK, 1.2, 0, 2) + G(P('M74 121 L126 119 M74 127 L126 125 M74 133 L126 131', 'none', '#cbbfae', 1), { 'clip-path': d.clip('<path d="' + wrap + '"/>') }) +
        cast('M74 174 C88 180 112 180 126 174 L134 206 L112 212 L100 200 L88 212 L66 206Z', d.lin([[0, '#a84a1c'], [1, '#6a2a0a']]), INK, 1.1, 0, 2) + fBelt(170, sash) + P('M108 178 L116 214 L110 216 L104 180Z', sash, INK, 1) + beads;
      o.legs = function (leg) { var sc = subChain(leg.pts, leg.rs, 0.6, 0.97); return legPart(d, leg, 0.6, 0.97, '#f6f0e6', 1.4) + wraps(d, sc, 5); };
    } else {
      o.torso = mBelt(170, sash) + cast(MCROTCH, '#a84a1c', INK, 1.1, 0, 2) + P('M110 176 L118 216 L112 218 L105 178Z', sash, INK, 1) + beads;
      o.legs = function (leg) { var sc = subChain(leg.pts, leg.rs, 0.78, 0.97); return legPart(d, leg, 0, 0.8, d.lin([[0, '#c8642a'], [1, '#7a3412']]), 4) + legPart(d, leg, 0.78, 0.97, '#f6f0e6', 1.4) + wraps(d, sc, 3); };
    }
    o.arm = function (arm) { var sc = subChain(arm.pts, arm.rs, 0.55, 0.98); return armPart(d, arm, 0.55, 0.98, '#f6f0e6', 1.2) + wraps(d, sc, 4); };
    o.hand = '#f6f0e6';
    return o;
  },
  conjurer: function (d, c, m, sk) {
    var red = d.lin([[0, '#e8442a'], [1, '#7a120c']]);
    var o = { foot: { style: c.fem ? 'sandal' : 'boot', col: c.fem ? '#e2ae3e' : '#3a1a10' } };
    if (c.fem) {
      o.back = P('M76 176 L124 176 L142 350 L100 356 L58 350Z', d.lin([[0, '#a8200c'], [1, '#4a0804']]), INK, 1.2);
      o.torso = fCups(d, red, '#ffcf5a', '#d9a83c') + P('M100 124 C97 128 98 132 100 134 C102 132 103 128 100 124Z', '#ffcf5a') + cast(FBOT, red, INK, 1, 0, 2) +
        cast('M90 180 L110 180 L114 336 L100 346 L86 336Z', red, INK, 1.1, 0, 2) + P('M90 180 L86 336 M110 180 L114 336', 'none', '#ffcf5a', 1.2) + fBelt(170, m.gold) + C(100, 90, 2.4, '#ff7a2a', { filter: c.glowSm });
      o.arm = function (arm) { return armPart(d, arm, 0.86, 0.95, m.gold, 1.8) + armPart(d, arm, 0.25, 0.32, m.gold, 1.4); };
    } else {
      o.back = P('M68 100 C56 160 50 240 46 300 L154 300 C150 240 144 160 132 100Z', d.lin([[0, '#a8200c'], [1, '#4a0804']]), INK, 1.3);
      o.torso = cast(MCROTCH, '#3a1a10', INK, 1.1, 0, 2) + both(cast('M70 104 C78 99 86 98 90 98 L96 176 L94 300 L66 296 C70 240 74 190 76 152 C72 140 66 120 70 104Z', red, INK, 1.2, 0, 2) + P('M90 98 L96 176 L94 300', 'none', '#ffcf5a', 1.6) + P('M76 220 C80 212 86 214 84 222 C82 230 88 232 90 226', 'none', '#ffcf5a', 1)) + mBelt(170, '#3a1a10', m.gold);
      o.legs = function (leg) { return legPart(d, leg, 0, 0.97, '#3a1a14', 1.8) + legPart(d, leg, 0.55, 1, '#2a1208', 2.2); };
    }
    return o;
  },
  magician: function (d, c, m, sk) {
    var pur = d.lin([[0, '#6a4ac0'], [1, '#2a1a5a']]), teal = '#3ad0d0';
    var o = { foot: { style: 'boot', col: '#3a2a7a' } };
    o.headBack = function (dd, cc, mm) { return PROPS.magician.back(dd, cc, mm); };
    if (c.fem) {
      o.torso = fCups(d, pur, teal, '#3a2a7a') + cast('M80 136 C88 141 112 141 120 136 L118 172 C108 176 92 176 82 172Z', pur, INK, 1.1, 0, 2) + P('M100 140 L100 174', 'none', teal, 1.2) +
        cast(FSKIRT.replace('L138 214 C114 222 86 222 62 214', 'L134 206 C114 214 86 214 66 206'), pur, INK, 1.1, 0, 2) + P('M66 206 C86 214 114 214 134 206', 'none', teal, 1.8) + C(100, 126, 2.2, teal, { filter: c.glowSm });
      o.legs = function (leg) { return legPart(d, leg, 0.2, 1, '#3a2a7a', 1.6) + legPart(d, leg, 0.2, 0.24, teal, 2.2); };
      o.arm = function (arm) { return armPart(d, arm, 0.45, 0.98, '#3a2a7a', 1.1); };
    } else {
      o.back = P('M68 100 C56 160 52 240 50 300 L150 300 C148 240 144 160 132 100Z', d.lin([[0, '#4a2a9a'], [1, '#1a0a3a']]), INK, 1.3);
      o.torso = cast(MCHEST.replace('L100 118 L104', 'L100 128 L104'), pur, INK, 1.2, 0, 2) + P('M96 96 L100 128 L104 96', 'none', teal, 1.6) + cast(MCROTCH, '#2a2440', INK, 1.1, 0, 2) +
        both(cast('M76 170 L98 172 L96 300 L64 296Z', pur, INK, 1.1, 0, 2) + P('M98 172 L96 300', 'none', teal, 1.4)) + mBelt(166, '#2a1a4a', m.gold);
      o.legs = function (leg) { return legPart(d, leg, 0, 0.97, '#2a2440', 1.8) + legPart(d, leg, 0.55, 1, '#1a1430', 2.2); };
      o.arm = function (arm) { return armPart(d, arm, 0, 0.98, pur, 1.5); };
    }
    return o;
  },
  sorcerer: function (d, c, m, sk) {
    var blk = d.lin([[0, '#2a1e3a'], [1, '#0c0814']]), vio = '#c06aff';
    var o = { foot: { style: 'boot', col: '#1a1424' } };
    var tat = function (sc) { var p = sc.pts, a = p[0], b = p[p.length - 1], q = lerp2(a, b, 0.5); return G(P('M' + f(q[0] - 3) + ' ' + f(q[1] - 6) + ' l3 4 l3 -4 M' + f(q[0] - 3) + ' ' + f(q[1] + 2) + ' l6 0', 'none', vio, 1.1), { filter: c.glowSm }); };
    if (c.fem) {
      o.back = P('M78 178 L122 178 L130 300 L100 310 L70 300Z', blk, INK, 1.1);
      o.torso = both(P('M84 118 L96 92 M88 118 L76 106', 'none', '#3a2a4a', 1.3)) + fCups(d, blk, vio, '#3a2a4a') + P('M93 86 C97 89 103 89 107 86', 'none', '#1a1424', 2.4) + C(100, 90, 1.8, vio, { filter: c.glowSm }) +
        cast(FBOT, blk, INK, 1, 0, 2) + cast('M90 182 L110 182 L108 290 L100 298 L92 290Z', blk, INK, 1.1, 0, 2) + P('M92 290 L100 298 L108 290', 'none', vio, 1.2) + fBelt(172, '#1a1424', vio) +
        G(P('M100 150 L100 162 M95 156 L105 156', 'none', vio, 1.1), { filter: c.glowSm });
      o.legs = function (leg) { return legPart(d, leg, 0.28, 1, '#1a1424', 1.6) + legPart(d, leg, 0.28, 0.32, vio, 2) + tat(subChain(leg.pts, leg.rs, 0, 0.28)); };
    } else {
      o.back = P('M66 100 C52 170 48 260 46 376 L154 376 C152 260 148 170 134 100Z', blk, INK, 1.3);
      o.torso = cast(MCROTCH, '#1a1424', INK, 1.1, 0, 2) + both(cast('M70 104 C78 99 86 98 90 98 L94 176 L92 376 L60 372 C66 300 72 200 76 152 C72 140 66 120 70 104Z', blk, INK, 1.2, 0, 2) + P('M90 98 L94 176 L92 376', 'none', vio, 1.4)) +
        G(P('M100 112 L100 128 M92 120 L108 120 M94 114 L106 126 M106 114 L94 126', 'none', vio, 1.3), { filter: c.glowSm }) + mBelt(172, '#2a1e3a', vio);
      o.legs = function (leg) { return legPart(d, leg, 0, 0.97, '#221a2e', 1.8); };
    }
    o.arm = function (arm) { return tat(subChain(arm.pts, arm.rs, 0, 0.45)); };
    return o;
  },
  wizard: function (d, c, m, sk) {
    var blue = d.lin([[0, '#2a4ab0'], [1, '#101a50']]);
    var o = { foot: { style: 'boot', col: '#1a2a6a' } };
    if (c.fem) {
      o.back = P('M74 96 C58 160 50 260 46 372 L154 372 C150 260 142 160 126 96Z', blue, INK, 1.3) + starsOn([62, 200, 70, 260, 58, 320, 138, 210, 130, 280, 142, 340]);
      o.torso = fCups(d, blue, '#ffe9a0', '#1a2a6a') + cast(FSKIRT.replace('L138 214 C114 222 86 222 62 214', 'L132 206 C114 213 86 213 68 206'), blue, INK, 1.1, 0, 2) + P('M68 206 C86 213 114 213 132 206', 'none', '#ffe9a0', 1.8) + fBelt(170, '#ffe9a0') + starsOn([86, 196, 112, 200]);
      o.legs = function (leg) { return legPart(d, leg, 0.5, 1, '#1a2a6a', 1.6); };
      o.arm = function (arm) { return armPart(d, arm, 0.5, 0.98, '#1a2a6a', 1.2); };
    } else {
      o.torso = cast('M70 104 C80 98 90 96 96 96 L100 120 L104 96 C110 96 120 98 130 104 C134 120 128 140 124 152 C124 200 140 300 144 376 L56 376 C60 300 76 200 76 152 C72 140 66 120 70 104Z', blue, INK, 1.4, 0, 3) +
        P('M96 96 L100 120 L104 96', 'none', '#ffe9a0', 1.8) + mBelt(166, '#ffe9a0') + starsOn([84, 130, 116, 140, 80, 220, 118, 250, 90, 300, 112, 330, 70, 340, 130, 360]);
      o.arm = function (arm) { return armPart(d, arm, 0, 0.98, blue, 2.2); };
    }
    return o;
  }
};
function figGroundFx(d, c, key) {
  if (key !== 'runeCircle') return '';
  return G(E(100, 386, 70, 12, 'none', { stroke: '#c06aff', 'stroke-width': 1.6 }) + E(100, 386, 58, 9, 'none', { stroke: '#e0b0ff', 'stroke-width': 0.8, 'stroke-dasharray': '3 3' }) + E(100, 386, 64, 10, '#c06aff', { opacity: 0.15 }), { filter: c.glowMd });
}

/* ---------- figure renderer ---------- */
function renderFigure(d, o) {
  o = o || {};
  var c = buildCtx(d, o), m = mats(d), cu = o.custom || {};
  var pose = typeof cu.pose === 'object' ? cu.pose : (FIG_POSES[cu.pose || c.cls] || FIG_POSES.idle);
  var sk = figSkeleton(c, pose);
  var outfitFn = cu.figOutfit || FIG_OUTFIT[c.cls] || function () { return { foot: { style: 'bare' } }; };
  var of = outfitFn(d, c, m, sk) || {};
  var hs = cu.hairStyle ? cu.hairStyle(c) : hairStyle(c, c.hairIdx);
  if (c.race === 'dwarf' && c.fem && !hs.braid && !cu.noBraids) hs.dwarfBraids = true;
  if (of.hood) hs.back = [];
  var props = cu.props || PROPS[c.cls] || {};
  var rc = FIG_RACE[c.race] || FIG_RACE.human;
  var wS = rc.w * (c.race === 'halforc' && c.fem ? 0.94 : 1) * (cu.bodySX || 1), hS = rc.h;
  var bodyT = 'translate(100 ' + FG + ') scale(' + f(wS * 1000) / 1000 + ' ' + f(hS * 1000) / 1000 + ') translate(-100 -' + FG + ')';
  var tT = (sk.dy ? 'translate(0 ' + sk.dy + ')' : '') + (c.fem ? '' : ' translate(100 0) scale(1.14 1) translate(-100 0)');
  var chinY = FG - (FG - (82 + sk.dy)) * hS, hsc = 0.6 * rc.head;
  var headT = 'translate(100 ' + f(chinY) + ') scale(' + f(hsc * 1000) / 1000 + ') translate(-100 -132)';
  if (!tT) tT = null;
  var s = E(100, FG, 48 * wS, 7, d.rad([[0, '#000', 0.45], [1, '#000', 0]]));
  // back layer
  var back = figGroundFx(d, c, pose.fx) + G((of.back || '') + (cu.figBack ? cu.figBack(d, c, m, sk) : ''), { transform: tT });
  s += G(back, { transform: bodyT });
  var hb = (of.headBack ? of.headBack(d, c, m) : '') + (cu.headBack ? cu.headBack(d, c, m) : '') + hairBackSvg(d, c, hs);
  s += G(hb, { transform: headT });
  // legs + back arms + torso
  var body = '', i, arm;
  for (i = 0; i < 2; i++) {
    var leg = sk.legs[i];
    body += figLegSkin(d, c, leg) + (of.legs ? of.legs(leg) : '') + figFoot(d, c, leg, (of.foot || {}).style || 'bare', (of.foot || {}).col);
  }
  function drawArm(a) {
    var r = '', def = a.def, over = def.prop === 'roundShield' || def.prop === 'kiteShield';
    if (def.prop && !over) r += figProp(d, c, m, a, def.prop);
    r += figArmSkin(d, c, a) + (of.arm ? of.arm(a) : '');
    r += figHand(d, c, a, def.hand === 'open', of.hand);
    if (def.prop && over) r += figProp(d, c, m, a, def.prop);
    if (def.fx) r += figFx(d, c, a, def.fx);
    return r;
  }
  for (i = 0; i < 2; i++) if (!sk.arms[i].def.front) body += drawArm(sk.arms[i]);
  body += G(figTorsoSkin(d, c) + (of.torso || '') + (cu.figTorso ? cu.figTorso(d, c, m, sk) : ''), { transform: tT });
  s += G(body, { transform: bodyT });
  // head
  var head = headSvg(d, c);
  if (c.race === 'dwarf' && !c.fem && !cu.noBeard) head += beardSvg(d, c);
  if (cu.face) head += cu.face(d, c, m);
  if (hs.dwarfBraids) head += both(G(braid(70, 100, 66, 176, 8, 7), { fill: c.hairG, stroke: c.hairOut, 'stroke-width': 1.2 }) + C(66, 178, 3, '#d9a83c', { stroke: INK, 'stroke-width': 0.8 }));
  head += hairFrontSvg(d, c, hs);
  if (props.head) head += props.head(d, c, m);
  if (cu.head) head += cu.head(d, c, m);
  s += G(head, { transform: headT });
  // front layer
  var front = '';
  if (pose.prop === 'lute') front += figLute(d, m, sk);
  if (cu.figMid) front += cu.figMid(d, c, m, sk);
  for (i = 0; i < 2; i++) if (sk.arms[i].def.front) front += drawArm(sk.arms[i]);
  if (c.cls === 'hunter' && !cu.pose) {
    var B = sk.arms[0].H, Hh = sk.arms[1].H;
    front += P('M' + f(B[0] + 2) + ' ' + f(B[1] - 64) + ' L' + f(Hh[0]) + ' ' + f(Hh[1]) + ' L' + f(B[0] + 2) + ' ' + f(B[1] + 64), 'none', '#f0e8d0', 0.8);
    front += P('M' + f(Hh[0]) + ' ' + f(Hh[1]) + ' L' + f(B[0] - 10) + ' ' + f(B[1]), 'none', '#6a4220', 1.6) + propAt(P('M0 0 L8 -3 L8 3Z', m.steel, INK, 0.7), [B[0] - 16, B[1] + 0.2], 0) +
      propAt(P('M0 0 L-8 -4 L-6 0 L-8 4Z', '#c03030', INK, 0.6), [Hh[0] - 4, Hh[1] - (Hh[1] - B[1]) * 0.05], 0);
  }
  if (cu.figFront) front += cu.figFront(d, c, m, sk);
  s += G(front, { transform: bodyT });
  return G(s, { opacity: cu.figOpacity });
}
function figureFallback(d) {
  var g = d.lin([[0, '#3a3a4a'], [1, '#14141c']]);
  return E(100, FG, 44, 7, d.rad([[0, '#000', 0.45], [1, '#000', 0]])) + P('M100 30 C116 30 124 44 122 60 C120 74 112 82 100 82 C88 82 80 74 78 60 C76 44 84 30 100 30Z M100 88 C122 88 136 96 140 112 L146 200 L132 204 L128 140 L126 380 L106 386 L100 250 L94 386 L74 380 L72 140 L68 204 L54 200 L60 112 C64 96 78 88 100 88Z', g, INK, 2);
}

/* shared with the other art files */
A.lerp2 = lerp2; A.armPart = armPart; A.legPart = legPart; A.kneeCop = kneeCop; A.propAt = propAt; A.FBOT = FBOT; A.MCAPE = MCAPE;
A.MCROTCH = MCROTCH; A.MCHEST = MCHEST; A.fBelt = fBelt; A.mBelt = mBelt; A.fCups = fCups; A.plates = plates; A.renderFigure = renderFigure;
A.figureFallback = figureFallback;
})();
