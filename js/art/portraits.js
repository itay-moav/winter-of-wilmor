/* Velmoor art: Hero bust portraits (200x250): palettes and look options, materials, eyes, face, hair, body, class outfits,
 * class props, backgrounds and the renderPortrait() compositor.
 * Plain script (no modules); load order is listed in js/art/api.js. */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL;
/* from core.js */
var f = A.f, rng = A.rng, hashStr = A.hashStr, hx = A.hx, mix = A.mix, shade = A.shade, shadow = A.shadow, P = A.P, C = A.C, E = A.E, R = A.R,
    L = A.L, G = A.G, M = A.M, T = A.T, starPts = A.starPts, sparkle = A.sparkle, INK = A.INK;
/* from symbols.js */
var faithAt = A.faithAt;

/* ------------------------------------------------------------------ */
/* Portraits (200 x 250)                                               */
/* ------------------------------------------------------------------ */
var SKINS = ['#ffe9dc', '#f9d4b9', '#eab994', '#d09868', '#a06b45', '#704632'];
var HAIRC = ['#2c2436', '#5c3b2a', '#b5612c', '#efc970', '#e9edf5', '#f79cc9', '#5ba8f4', '#c9353f', '#8b5de2', '#45c69b'];
var EYEC = ['#3d80e2', '#37b263', '#8c5b2e', '#d4383d', '#9b5de8', '#e8a81e', '#2fbebe', '#97a6bb'];
var HAIR_STYLES_F = 8, HAIR_STYLES_M = 8;
var LOOK_COUNTS = { hair: 8, hairColor: HAIRC.length, skin: SKINS.length, eyes: EYEC.length };
var RACES = ['human', 'elf', 'dwarf', 'hobbit', 'halfelf', 'halforc', 'gnome'];
var CLASSES = ['warrior', 'paladin', 'rogue', 'bard', 'hunter', 'monk', 'conjurer', 'magician', 'sorcerer', 'wizard'];

function pick(arr, i) { i = (i | 0) % arr.length; if (i < 0) i += arr.length; return arr[i]; }
function both(s) { return s + M(s); }
/* shape with a cel "cast shadow" under it */
function cast(d, fill, stroke, sw, dx, dy, shCol) {
  return P(d, shCol || 'rgba(60,20,40,0.28)', null, null, 'transform="translate(' + (dx || 0) + ' ' + (dy == null ? 3 : dy) + ')"') + P(d, fill, stroke || INK, sw == null ? 1.3 : sw);
}

/* ---------- materials ---------- */
function mats(d) {
  return {
    steel: d.lin([[0, '#f5f8fc'], [0.42, '#b3bdcc'], [0.5, '#7a8598'], [0.75, '#c3cbd8'], [1, '#69738a']], 0, 0, 1, 1),
    gold: d.lin([[0, '#fff4b8'], [0.45, '#e2ae3e'], [0.55, '#b57a1c'], [1, '#f3cf6a']], 0, 0, 1, 1),
    white: d.lin([[0, '#ffffff'], [0.6, '#e6ebf5'], [1, '#aeb8d0']], 0, 0, 1, 1),
    leather: d.lin([[0, '#8a5a36'], [1, '#4a2c18']]),
    dark: d.lin([[0, '#3a3348'], [1, '#14111c']]),
    wood: d.lin([[0, '#c88a4a'], [0.5, '#9a5e2c'], [1, '#6a3c18']], 0, 0, 1, 0)
  };
}

/* ---------- eyes ---------- */
var EYE_WHITE = 'M-8.5 0.5 C-7.5 -6 3 -8.6 9.8 -4.6 C9.4 2 5.6 7.2 0 7.4 C-5.2 7.4 -8.5 4.4 -8.5 0.5Z';
var LASH_F = 'M-9.8 1 C-8.4 -7 3 -10.8 10.6 -6.2 L13.6 -8.6 L11.9 -4.8 L13.8 -4.1 L10.6 -2.7 C4 -7.6 -5 -6.6 -9.8 1Z';
var LASH_M = 'M-9.4 0.2 C-7.4 -6.2 3 -9 10.8 -5.6 L11.4 -3.4 C4 -6.6 -5.2 -5 -9.4 0.2Z';
function eyeSvg(d, c, side) {
  var x = c.eyeX * side + 100, y = c.eyeY, s = c.eyeS;
  var t = 'translate(' + f(x) + ' ' + f(y) + ') scale(' + f(-side * s * 100) / 100 + ' ' + f(s * c.eyeSY * 100) / 100 + ')';
  if (c.eyeMode === 'closed') {
    return G(P('M-9 0 Q0 6 10.5 -1', 'none', '#3a1c2a', 1.8) + P('M8 0.5 L11 2.5 M4 2.8 L5.6 5.4 M-1 3.4 L-1.4 6', 'none', '#3a1c2a', 0.9), { transform: t });
  }
  var cl = d.clip('<path d="' + EYE_WHITE + '"/>');
  var irisRX = c.fem ? 5.7 : 5.1, irisRY = c.fem ? 7 : 6.4;
  var s2 = P(EYE_WHITE, '#fdfbff');
  var inner = P('M-10 -2 C-6 -9 4 -11 11 -6 L11 0 C4 -5 -6 -4 -10 3Z', '#7c6a9a', null, null, 'opacity=".35"') +
    E(0.6, 1.4, irisRX, irisRY, c.irisG) +
    E(0.6, 1.4, irisRX, irisRY, 'none', 'stroke="' + shade(c.eye, -0.65) + '" stroke-width="0.9"') +
    E(0.6, 0.6, irisRX * 0.42, irisRY * 0.5, shade(c.eye, -0.78)) +
    P('M-3.6 4.6 Q0.6 8.2 4.8 4.6', 'none', shade(c.eye, 0.65), 1.3, 'opacity=".85"') +
    P('M-10 -2 C-6 -9 4 -11 11 -6 L11 -2.5 C4 -6.6 -6 -5.6 -10 1Z', shade(c.eye, -0.7), null, null, 'opacity=".45"');
  if (c.eyeGlow) inner += E(0.6, 1.4, irisRX, irisRY, c.eye, 'opacity=".5" filter="' + c.glowSm + '"');
  s2 += G(inner, { 'clip-path': cl });
  s2 += C(-2.2, -1.8, c.fem ? 2.2 : 1.8, '#fff') + C(3.2, 3.8, 1, '#fff', 'opacity=".9"') + C(-3.8, 2.4, 0.6, '#fff', 'opacity=".8"');
  s2 += P(c.fem ? LASH_F : LASH_M, c.lashCol);
  s2 += P('M-5 7.2 Q0.6 8.8 6.4 6', 'none', shade(c.lashCol, 0.25), 0.8, 'opacity=".7"');
  if (c.fem) s2 += P('M-6.5 -8.6 Q2 -12 9.5 -8.6', 'none', c.skinLine, 0.7, 'opacity=".7"') + P('M7.5 5.8 L9.6 6.6', 'none', c.lashCol, 0.8);
  else s2 += P('M-6 -7.6 Q2 -10.4 9 -7.4', 'none', c.skinLine, 0.6, 'opacity=".5"');
  return G(s2, { transform: t });
}

/* ---------- face ---------- */
function facePath(c) {
  var w = c.faceW, jw = c.jawW, jy = c.jawY, cy = c.chinY, L = 100 - w, Rr = 100 + w;
  return 'M' + L + ' 84 C' + L + ' 47 ' + Rr + ' 47 ' + Rr + ' 84 C' + Rr + ' 100 ' + f(100 + jw + 6) + ' ' + f(jy - 7) + ' ' + f(100 + jw) + ' ' + jy +
    ' C' + f(100 + jw - 7) + ' ' + f(jy + 7) + ' 106 ' + cy + ' 100 ' + cy + ' C94 ' + cy + ' ' + f(100 - jw + 7) + ' ' + f(jy + 7) + ' ' + f(100 - jw) + ' ' + jy +
    ' C' + f(100 - jw - 6) + ' ' + f(jy - 7) + ' ' + L + ' 100 ' + L + ' 84Z';
}
function earSvg(c) {
  var L = 100 - c.faceW;
  var d;
  if (c.ear === 'elf') d = 'M' + (L + 3) + ' 86 C' + (L - 6) + ' 82 ' + (L - 18) + ' 70 ' + (L - 27) + ' 58 C' + (L - 22) + ' 76 ' + (L - 12) + ' 98 ' + (L + 3) + ' 106Z';
  else if (c.ear === 'half') d = 'M' + (L + 3) + ' 86 C' + (L - 5) + ' 82 ' + (L - 12) + ' 76 ' + (L - 17) + ' 70 C' + (L - 15) + ' 84 ' + (L - 9) + ' 100 ' + (L + 3) + ' 106Z';
  else if (c.ear === 'small') d = 'M' + (L + 3) + ' 87 C' + (L - 5) + ' 84 ' + (L - 9) + ' 80 ' + (L - 12) + ' 77 C' + (L - 11) + ' 90 ' + (L - 7) + ' 103 ' + (L + 3) + ' 106Z';
  else d = 'M' + (L + 3) + ' 88 C' + (L - 6) + ' 82 ' + (L - 8) + ' 100 ' + (L + 2) + ' 106Z';
  var inner = 'M' + (L + 1) + ' 92 C' + (L - 3) + ' 92 ' + (L - 4) + ' 98 ' + (L) + ' 102';
  if (c.ear === 'elf') inner = 'M' + (L + 1) + ' 92 C' + (L - 8) + ' 86 ' + (L - 15) + ' 76 ' + (L - 20) + ' 68 M' + L + ' 94 C' + (L - 4) + ' 96 ' + (L - 3) + ' 100 ' + (L + 1) + ' 102';
  var s = P(d, c.skinG, c.skinOut, 1.3) + P(inner, 'none', c.skinSh, 1.2);
  return both(s);
}
function headSvg(d, c) {
  var fp = facePath(c);
  var s = '';
  s += earSvg(c);
  s += P(fp, c.skinG, c.skinOut, 1.5);
  var fc = d.clip('<path d="' + fp + '"/>');
  // cel shadows: right side + under hair
  var sh = P('M' + (100 + c.faceW - 9) + ' 60 C' + (100 + c.faceW - 2) + ' 92 ' + (100 + c.jawW) + ' 116 100 ' + (c.chinY + 2) + ' L140 140 L140 50Z', c.skinSh, null, null, 'opacity=".55"');
  sh += P('M60 70 C80 84 92 78 100 86 C110 78 122 84 140 70 L140 40 L60 40Z', c.skinSh, null, null, 'opacity=".6"');
  s += G(sh, { 'clip-path': fc });
  // blush
  var bo = c.blush != null ? c.blush : (c.fem ? 0.42 : 0.16);
  s += E(100 - c.eyeX - 2, 108, 7, 3.4, '#ff6f8a', 'opacity="' + bo + '" filter="' + c.blurSm + '"') + E(100 + c.eyeX + 2, 108, 7, 3.4, '#ff6f8a', 'opacity="' + bo + '" filter="' + c.blurSm + '"');
  if (c.fem) s += both(P('M77 107 l-1.6 2.6 M80 107 l-1.6 2.6 M83 107 l-1.6 2.6', 'none', '#e0607a', 0.6, 'opacity=".55"'));
  // eyes + brows
  s += eyeSvg(d, c, -1) + eyeSvg(d, c, 1);
  var by = c.eyeY - 13 + (c.browY || 0);
  var brow = c.fem ? 'M' + f(100 - c.eyeX - 9) + ' ' + f(by + 2.6) + ' Q' + f(100 - c.eyeX) + ' ' + f(by - 2.6) + ' ' + f(100 - c.eyeX + 9) + ' ' + f(by + 0.6) + ' Q' + f(100 - c.eyeX) + ' ' + f(by - 1) + ' ' + f(100 - c.eyeX - 9) + ' ' + f(by + 2.6) + 'Z'
    : 'M' + f(100 - c.eyeX - 10) + ' ' + f(by + 1.5) + ' Q' + f(100 - c.eyeX - 1) + ' ' + f(by - 3.4) + ' ' + f(100 - c.eyeX + 10) + ' ' + f(by + 2.6) + ' L' + f(100 - c.eyeX + 9) + ' ' + f(by + 4.4) + ' Q' + f(100 - c.eyeX - 1) + ' ' + f(by - 0.6) + ' ' + f(100 - c.eyeX - 10) + ' ' + f(by + 1.5) + 'Z';
  if (c.angry) brow = 'M' + f(100 - c.eyeX - 10) + ' ' + f(by - 1) + ' L' + f(100 - c.eyeX + 10) + ' ' + f(by + 4) + ' L' + f(100 - c.eyeX + 9) + ' ' + f(by + 6) + ' L' + f(100 - c.eyeX - 10) + ' ' + f(by + 1.5) + 'Z';
  s += both(P(brow, c.browCol, c.browCol, c.fem ? 0.6 : 0.9));
  // nose + mouth
  if (!c.mask) {
    if (c.bigNose) s += E(100, 107, 6.5, 5.5, c.skinG, 'stroke="' + c.skinOut + '" stroke-width="1.2"') + E(101.5, 109, 4, 2.6, c.skinSh, 'opacity=".5"') + C(98, 104.5, 1.6, '#fff', 'opacity=".7"');
    else s += P('M101 103 Q102.6 108 99.4 110', 'none', c.skinLine, 1.1) + C(98.4, 106, 0.9, '#fff', 'opacity=".55"');
    var my = c.mouthY;
    var mouths = c.fem ? ['M94.5 ' + my + ' Q100 ' + (my + 3.4) + ' 105.5 ' + my, 'M95 ' + (my + 0.4) + ' Q100 ' + (my + 2.2) + ' 105 ' + (my - 0.6), 'M94 ' + my + ' Q100 ' + (my + 4.4) + ' 106 ' + my + ' Q100 ' + (my + 2) + ' 94 ' + my + 'Z']
      : ['M94 ' + (my + 0.6) + ' Q100 ' + (my + 2) + ' 106 ' + my, 'M94.5 ' + (my + 1) + ' Q101 ' + (my + 1.6) + ' 106 ' + (my - 1), 'M95 ' + (my + 1) + ' L105 ' + (my + 1)];
    var mi = c.mouthI % mouths.length;
    if (c.fem && mi === 2) s += P(mouths[2], '#b8405a', '#6a2030', 0.9) + P('M97 ' + (my + 1.2) + ' Q100 ' + (my + 2.6) + ' 103 ' + (my + 1.2), 'none', '#fff', 0.8, 'opacity=".8"');
    else s += P(mouths[mi], 'none', c.fem ? '#8a3040' : '#5a2e2a', c.fem ? 1.4 : 1.3);
    if (c.fem) s += P('M98 ' + (my + 4.2) + ' Q100 ' + (my + 5) + ' 102 ' + (my + 4.2), 'none', c.skinLine, 0.7, 'opacity=".55"') + E(100, my + 2.6, 3.5, 1.3, '#ff8aa0', 'opacity=".22"');
    if (c.tusks) s += P('M92 ' + (my + 1) + ' L91.6 ' + (my - 6) + ' L95.4 ' + (my + 0.6) + 'Z', '#fbf6e8', INK, 0.8) + P('M108 ' + (my + 1) + ' L108.4 ' + (my - 6) + ' L104.6 ' + (my + 0.6) + 'Z', '#fbf6e8', INK, 0.8);
  }
  // face highlight (rim)
  s += G(P(fp, 'none', '#fff6e8', 2.5, 'opacity=".5"'), { 'clip-path': d.clip('<rect x="50" y="60" width="26" height="70"/>') });
  return s;
}

/* ---------- hair ---------- */
/* lock tips: list of [x,y] from right temple to left temple; notch y given */
function lockSeq(tips, notchY, from, to) {
  var s = '', px = from[0], py = from[1];
  for (var i = 0; i < tips.length; i++) {
    var t = tips[i];
    // into the tip: hair side bulges (control near the previous notch column, at tip height)
    s += ' Q' + f(px * 0.8 + t[0] * 0.2) + ' ' + f(t[1] - 2) + ' ' + f(t[0]) + ' ' + f(t[1]);
    var nx, ny;
    if (i < tips.length - 1) { nx = (t[0] + tips[i + 1][0]) / 2 + (t[3] || 0); ny = Math.max(notchY, Math.min(t[1], tips[i + 1][1]) - 13) + (t[2] || 0); }
    else { nx = to[0]; ny = to[1]; }
    s += ' Q' + f(nx * 0.75 + t[0] * 0.25) + ' ' + f(t[1] * 0.7 + ny * 0.3) + ' ' + f(nx) + ' ' + f(ny);
    px = nx; py = ny;
  }
  return s;
}
/* front hair cap: outer contour + side locks + bangs */
function frontCap(o) {
  var tl = o.tipL, tr = o.tipR, top = o.top || 42, wl = o.wL || 0, wr = o.wR || 0;
  var s = 'M' + f(61 - wl) + ' ' + tl + ' C' + f(55 - wl) + ' ' + f(tl - 40) + ' ' + f(51 - wl) + ' 66 66 51 C78 ' + f(top + 1) + ' 90 ' + top + ' 100 ' + top +
    ' C110 ' + top + ' 122 ' + f(top + 1) + ' 134 51 C' + f(149 + wr) + ' 66 ' + f(145 + wr) + ' ' + f(tr - 40) + ' ' + f(139 + wr) + ' ' + tr;
  var ri = o.innerR || [128, 80], li = o.innerL || [72, 80];
  s += ' C' + f(136 + wr * 0.3) + ' ' + f(tr - 20) + ' ' + f(134) + ' 100 ' + ri[0] + ' ' + ri[1];
  var tips = o.tips.map(function (t) { return [t[0], t[1] - (o.lift == null ? 4 : o.lift), t[2], t[3]]; });
  s += lockSeq(tips, o.notch || 64, ri, li);
  s += ' C67 100 ' + f(64 - wl * 0.3) + ' ' + f(tl - 20) + ' ' + f(61 - wl) + ' ' + tl + 'Z';
  return s;
}
/* spiky radial outline around (cx,cy) from angle a0..a1 (deg) */
function spikes(cx, cy, r0, r1, a0, a1, n, sweep, rnd, jit) {
  var s = '', da = (a1 - a0) / n, rad = Math.PI / 180;
  for (var i = 0; i <= n; i++) {
    var a = (a0 + da * i) * rad;
    var nx = cx + Math.cos(a) * r0, ny = cy + Math.sin(a) * r0;
    if (i === 0) s += 'M' + f(nx) + ' ' + f(ny);
    else s += ' Q' + f(cx + Math.cos(a - da * rad * 0.2) * r0 * 1.12) + ' ' + f(cy + Math.sin(a - da * rad * 0.2) * r0 * 1.12) + ' ' + f(nx) + ' ' + f(ny);
    if (i < n) {
      var rr = r1 * (1 + ((rnd ? rnd() : 0.5) - 0.5) * (jit || 0.2));
      var ta = (a0 + da * (i + 0.5) + sweep) * rad;
      s += ' Q' + f(cx + Math.cos(ta - da * rad * 0.3) * (r0 + rr) / 2) + ' ' + f(cy + Math.sin(ta - da * rad * 0.3) * (r0 + rr) / 2) + ' ' + f(cx + Math.cos(ta) * rr) + ' ' + f(cy + Math.sin(ta) * rr);
    }
  }
  return s;
}
function braid(x0, y0, x1, y1, w, n) {
  var s = '';
  for (var i = n - 1; i >= 0; i--) {
    var t = i / (n - 1), x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, ww = w * (1 - t * 0.3);
    s += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(ww) + '" ry="' + f((y1 - y0) / n * 0.75) + '" transform="rotate(' + (i % 2 ? 14 : -14) + ' ' + f(x) + ' ' + f(y) + ')"/>';
  }
  return s;
}
/* returns {back:[paths], front:path, extraFront:markup-fn, ties:[[x,y]], strands} */
function hairStyle(c, idx) {
  var r = c.rnd;
  if (c.fem) {
    switch (idx % HAIR_STYLES_F) {
      case 0: // long straight with swept bangs
        return { back: ['M66 60 C48 100 48 170 42 238 L58 232 L70 244 L86 236 L100 246 L114 236 L130 244 L142 232 L158 238 C152 170 152 100 134 60Z'],
          front: frontCap({ tipL: 156, tipR: 150, tips: [[124, 96], [114, 90], [106, 98], [96, 92], [86, 96], [78, 88]], notch: 62 }) };
      case 1: // twin tails
        return { back: ['M66 62 C56 90 58 120 64 132 L136 132 C142 120 144 90 134 62Z',
          'M66 60 C30 70 22 130 30 180 C34 210 30 230 22 248 C40 236 52 214 52 186 C54 150 50 110 70 74Z',
          'M134 60 C170 70 178 130 170 180 C166 210 170 230 178 248 C160 236 148 214 148 186 C146 150 150 110 130 74Z'],
          front: frontCap({ tipL: 122, tipR: 122, tips: [[125, 88], [116, 94], [106, 88], [98, 95], [88, 90], [78, 94]], notch: 64 }), ties: [[64, 64], [136, 64]] };
      case 2: // high ponytail
        return { back: ['M68 62 C60 92 62 120 66 134 L134 134 C140 120 142 92 132 62Z',
          'M112 46 C150 30 176 60 172 110 C170 150 178 190 166 232 C160 200 150 170 146 140 C142 110 138 80 118 58Z'],
          front: frontCap({ tipL: 128, tipR: 118, tips: [[127, 86], [118, 80], [110, 92], [99, 84], [88, 92], [77, 86]], notch: 60, top: 40 }), ties: [[120, 52]] };
      case 3: // bob
        return { back: ['M64 62 C50 90 52 124 58 138 L74 134 L86 140 L100 136 L114 140 L126 134 L142 138 C148 124 150 90 136 62Z'],
          front: frontCap({ tipL: 134, tipR: 134, wL: 3, wR: 3, tips: [[124, 92], [114, 88], [104, 93], [94, 88], [84, 93], [76, 88]], notch: 66 }) };
      case 4: // long wavy
        return { back: ['M64 58 C36 90 50 130 38 160 C28 190 46 210 36 240 C50 236 56 244 66 236 C78 246 90 238 100 246 C110 238 122 246 134 236 C144 244 150 236 164 240 C154 210 172 190 162 160 C150 130 164 90 136 58Z'],
          front: frontCap({ tipL: 150, tipR: 146, wL: 4, wR: 4, tips: [[126, 90], [116, 96], [106, 88], [96, 94], [85, 90], [77, 96]], notch: 64 }) };
      case 5: // side braid
        return { back: ['M66 62 C56 92 58 120 64 132 L136 132 C142 120 144 90 134 62Z'],
          front: frontCap({ tipL: 118, tipR: 128, tips: [[125, 90], [115, 84], [104, 92], [92, 84], [82, 92], [76, 84]], notch: 62 }),
          braid: [134, 118, 146, 236, 11, 9], ties: [[146, 230]] };
      case 6: // pixie / short layered
        return { back: ['M64 60 C54 86 58 110 62 120 L138 120 C142 110 146 86 136 60Z'],
          backSpikes: spikes(100, 84, 34, 44, 150, 390, 9, 6, r, 0.25),
          front: frontCap({ tipL: 112, tipR: 106, tips: [[126, 84], [118, 92], [108, 84], [98, 92], [86, 84], [78, 90]], notch: 60 }) };
      default: // hime cut
        return { back: ['M64 58 C50 100 52 170 48 240 L152 240 C148 170 150 100 136 58Z'],
          front: frontCap({ tipL: 128, tipR: 128, tips: [[127, 84], [118, 86], [109, 85], [100, 86], [91, 85], [82, 86], [74, 84]], notch: 76, innerR: [129, 82], innerL: [71, 82] }), hime: true };
    }
  }
  switch (idx % HAIR_STYLES_M) {
    case 0: // spiky shonen
      return { back: [], backSpikes: spikes(100, 80, 34, 54, 160, 380, 7, 8, r, 0.25),
        front: frontCap({ tipL: 106, tipR: 104, top: 40, tips: [[124, 86], [113, 78], [104, 90], [92, 80], [82, 88], [76, 78]], notch: 58, innerR: [130, 78], innerL: [70, 78] }) };
    case 1: // swept / slicked
      return { back: ['M66 60 C58 84 60 104 64 116 L136 116 C140 104 142 84 134 60Z'],
        front: frontCap({ tipL: 100, tipR: 96, top: 42, tips: [[126, 74], [116, 68], [106, 80], [94, 66], [82, 76]], notch: 56, innerR: [131, 74], innerL: [70, 76] }) };
    case 2: // messy medium
      return { back: [], backSpikes: spikes(100, 86, 32, 46, 140, 400, 12, -4, r, 0.25),
        front: frontCap({ tipL: 112, tipR: 110, wL: 3, wR: 3, tips: [[126, 88], [118, 82], [109, 92], [99, 84], [89, 92], [80, 84], [74, 88]], notch: 62 }) };
    case 3: // long flowing
      return { back: ['M64 60 C48 100 50 160 46 212 L62 206 L78 214 L100 208 L122 214 L138 206 L154 212 C150 160 152 100 136 60Z'],
        front: frontCap({ tipL: 144, tipR: 140, tips: [[126, 92], [115, 84], [104, 78], [96, 78], [85, 84], [76, 92]], notch: 56 }) };
    case 4: // samurai tail
      return { back: ['M66 60 C58 84 60 104 64 116 L136 116 C140 104 142 84 134 60Z', 'M106 46 C130 30 156 40 160 70 C164 100 152 130 160 160 C146 140 140 110 138 90 C136 70 126 60 112 56Z'],
        front: frontCap({ tipL: 118, tipR: 104, tips: [[124, 80], [112, 74], [100, 84], [88, 74], [78, 82]], notch: 56 }), ties: [[118, 48]] };
    case 5: // mohawk / undercut
      return { back: [], mohawk: true,
        backSpikes: spikes(100, 80, 26, 50, 215, 325, 6, 12, r, 0.2),
        front: 'M74 58 C80 46 92 40 100 40 C110 40 120 46 126 58 C124 66 118 72 112 74 L106 66 L100 76 L92 66 L86 74 C80 70 76 64 74 58Z' };
    case 6: // wild mane
      return { back: ['M64 60 C40 90 44 140 30 196 C44 190 46 204 56 198 C64 214 74 204 84 212 L116 212 C126 204 136 214 144 198 C154 204 156 190 170 196 C156 140 160 90 136 60Z'],
        backSpikes: spikes(100, 80, 34, 52, 150, 390, 11, 0, r, 0.3),
        front: frontCap({ tipL: 126, tipR: 124, wL: 5, wR: 5, tips: [[126, 88], [116, 80], [106, 90], [95, 80], [84, 88], [76, 80]], notch: 58 }) };
    default: // short crop
      return { back: ['M66 62 C60 82 62 98 66 106 L134 106 C138 98 140 82 134 62Z'],
        front: frontCap({ tipL: 98, tipR: 98, top: 45, tips: [[124, 72], [114, 68], [104, 74], [94, 68], [84, 72]], notch: 60, innerR: [131, 76], innerL: [69, 76] }) };
  }
}
function hairBackSvg(d, c, hs) {
  var s = '';
  for (var i = 0; i < hs.back.length; i++) s += P(hs.back[i], c.hairBackG, c.hairOut, 1.4);
  if (hs.backSpikes) s += P(hs.backSpikes + 'Z', c.hairG, c.hairOut, 1.4) + P(hs.backSpikes + 'Z', c.hairSh, null, null, 'opacity=".35"');
  // inner strand lines on back hair
  if (hs.back.length && hs.back[0].length > 60) s += P('M80 120 C78 160 74 190 70 226 M120 120 C122 160 126 190 130 226', 'none', c.hairSh, 1.2, 'opacity=".5"');
  return s;
}
function hairFrontSvg(d, c, hs) {
  var s = '';
  var fr = hs.front;
  s += P(fr, c.hairG, c.hairOut, 1.5);
  var cl = d.clip('<path d="' + fr + '"/>');
  // inner shading: lower half of locks darker
  var inner = P('M40 86 C70 70 130 70 160 86 L160 200 L40 200Z', c.hairSh, null, null, 'opacity=".35"');
  // strand lines from crown to bangs
  inner += P('M100 44 C96 58 90 70 86 86 M100 44 C104 58 110 70 114 88 M88 48 C80 60 76 72 74 84 M112 48 C120 60 124 72 126 84 M100 44 C100 60 99 72 98 88', 'none', c.hairSh, 1, 'opacity=".55"');
  // anime shine band: slivers radiating from the crown + soft band
  var band = '', offs = [-25, -17, -9, -1, 7, 15, 23];
  inner += P('M68 62 Q100 46 132 62', 'none', c.hairHi, 7, 'opacity=".22"');
  for (var bi = 0; bi < offs.length; bi++) {
    var bx = 100 + offs[bi] + (c.rnd() - 0.5) * 3, by = 57 + Math.pow(offs[bi] / 28, 2) * 8, ln = 4 + c.rnd() * 5, ang = offs[bi] / 60;
    var ux = Math.sin(ang), uy = Math.cos(ang);
    band += 'M' + f(bx - ux * ln) + ' ' + f(by - uy * ln) + ' Q' + f(bx + 1.6) + ' ' + f(by) + ' ' + f(bx + ux * ln * 1.3) + ' ' + f(by + uy * ln * 1.3) + ' Q' + f(bx - 1.6) + ' ' + f(by) + ' ' + f(bx - ux * ln) + ' ' + f(by - uy * ln) + 'Z';
  }
  inner += P(band, c.hairHi, null, null, 'opacity=".9"');
  s += G(inner, { 'clip-path': cl });
  if (hs.braid) {
    var b = hs.braid;
    var bs = braid(b[0], b[1], b[2], b[3], b[4], b[5]);
    s += G(bs, { fill: c.hairG, stroke: c.hairOut, 'stroke-width': 1.3 }) + G(bs.replace(/rx="([\d.]+)"/g, function (m, v) { return 'rx="' + f(v * 0.45) + '"'; }), { fill: c.hairHi, opacity: 0.35, transform: 'translate(-2 -2)' });
  }
  if (hs.ties) for (var i = 0; i < hs.ties.length; i++) {
    var t = hs.ties[i];
    s += P('M' + t[0] + ' ' + t[1] + ' l-9 -6 l1 12Z M' + t[0] + ' ' + t[1] + ' l9 -6 l-1 12Z', c.tieCol, INK, 1) + C(t[0], t[1], 3.2, shade(c.tieCol, 0.3), { stroke: INK, 'stroke-width': 1 });
  }
  return s;
}

/* ---------- body ---------- */
var BODY = {
  f: {
    neck: 'M91 112 C91 128 90 140 88 150 L112 150 C110 140 109 128 109 112Z',
    torso: 'M88 145 C80 151 70 154 62 159 C60 175 61 190 65 205 C69 220 71 234 69 250 L131 250 C129 234 131 220 135 205 C139 190 140 175 138 159 C130 154 120 151 112 145Z',
    arm: 'M63 157 C50 158 42 167 41 184 C40 206 42 228 40 250 L59 250 C60 232 62 214 64 198 C66 182 67 168 63 157Z',
    shoulderL: [56, 162]
  },
  m: {
    neck: 'M86 110 C86 126 85 136 82 146 L118 146 C115 136 114 126 114 110Z',
    torso: 'M86 138 C74 146 58 148 46 154 C44 175 48 195 53 212 C57 228 58 240 58 250 L142 250 C142 240 143 228 147 212 C152 195 156 175 154 154 C142 148 126 146 114 138Z',
    arm: 'M48 150 C32 151 22 164 21 184 C20 206 23 228 21 250 L47 250 C48 232 50 214 53 198 C57 180 58 162 48 150Z',
    shoulderL: [40, 160]
  }
};
function bodySvg(d, c) {
  var B = c.fem ? BODY.f : BODY.m;
  var s = '';
  s += P(B.neck, c.skinG, c.skinOut, 1.3);
  s += P('M' + (c.fem ? '90 120 Q100 138 110 120 L111 132 Q100 148 89 132Z' : '85 118 Q100 140 115 118 L116 130 Q100 150 84 130Z'), c.skinSh, null, null, 'opacity=".7"');
  s += P(B.torso, c.skinBodyG, c.skinOut, 1.4);
  var tc = d.clip('<path d="' + B.torso + '"/>');
  var det = P('M150 150 C138 180 132 214 134 250 L160 250 L160 150Z', c.skinSh, null, null, 'opacity=".55"');
  if (c.fem) {
    det += both(P('M90 151 Q80 156 66 158', 'none', c.skinLine, 0.9, 'opacity=".6"'));
    det += P('M69 198 C74 212 92 214 99 203 M101 203 C108 214 126 212 131 198', 'none', c.skinLine, 1.2, 'opacity=".7"');
    det += P('M100 220 C99 228 99 232 100 236', 'none', c.skinLine, 0.8, 'opacity=".4"') + E(100, 240, 1.2, 2.4, c.skinSh, 'opacity=".9"');
    det += P('M70 204 C80 230 88 240 98 244', 'none', '#fff', 2, 'opacity=".18"');
  } else {
    det += both(P('M84 148 Q72 152 54 154', 'none', c.skinLine, 1, 'opacity=".6"'));
    det += both(P('M100 166 C96 182 76 188 58 180', 'none', c.skinLine, 1.5, 'opacity=".75"'));
    det += P('M60 182 C70 192 90 192 100 184 C110 192 130 192 140 182 L140 188 C128 198 110 198 100 190 C90 198 72 198 60 188Z', c.skinSh, null, null, 'opacity=".35"');
    det += P('M100 186 L100 250', 'none', c.skinLine, 1.1, 'opacity=".6"');
    det += both(P('M88 204 Q94 206 99 204 M87 220 Q94 222 99 220 M88 236 Q94 238 99 236', 'none', c.skinLine, 1, 'opacity=".55"'));
    det += both(P('M66 196 C70 214 76 232 80 250', 'none', c.skinLine, 1, 'opacity=".45"'));
    det += P('M64 168 C72 160 86 160 94 166', 'none', '#fff', 2.4, 'opacity=".22"');
  }
  s += G(det, { 'clip-path': tc });
  // arms
  var arm = P(B.arm, c.skinBodyG, c.skinOut, 1.4) + G(P(c.fem ? 'M64 160 C58 190 58 220 56 250 L70 250 L70 160Z' : 'M50 156 C46 190 48 220 46 250 L60 250 L60 156Z', c.skinSh, null, null, 'opacity=".55"'), { 'clip-path': d.clip('<path d="' + B.arm + '"/>') });
  arm += P(c.fem ? 'M47 172 C44 182 44 192 45 200' : 'M28 170 C25 182 25 196 26 206', 'none', '#fff', 2.4, 'opacity=".3"');
  s += arm + M(arm.replace(/opacity="\.3"/, 'opacity="0"'));
  return s;
}

/* ---------- outfits ---------- */
var CUP_L = 'M100 183 C95 174 82 172 72 177 C64 183 63 198 71 205 C79 212 94 210 100 199Z';
function cups(d, c, fill, stroke, trim) {
  var s = both(cast(CUP_L, fill, stroke || INK, 1.3, 0, 3));
  if (trim) s += both(P('M100 184 C95 175 82 173 72 178', 'none', trim, 2.2));
  s += both(P('M76 182 C72 188 72 196 76 200', 'none', '#fff', 2, 'opacity=".45"'));
  return s;
}
function belt(c, fill, buckle, y) {
  y = y || 238;
  var s = cast('M62 ' + y + ' C80 ' + (y + 4) + ' 120 ' + (y + 4) + ' 138 ' + y + ' L139 ' + (y + 10) + ' C120 ' + (y + 14) + ' 80 ' + (y + 14) + ' 61 ' + (y + 10) + 'Z', fill, INK, 1.2, 0, 2);
  if (buckle) s += R(93, y + 1, 14, 11, buckle, { stroke: INK, 'stroke-width': 1.1, rx: 2 }) + R(97, y + 4, 6, 5, 'none', { stroke: INK, 'stroke-width': 0.9 });
  return s;
}
function pauldron(d, c, x, y, sc, fill, trim, flip) {
  var p = 'M-22 6 C-24 -10 -8 -20 8 -16 C20 -12 26 0 24 12 C14 6 -6 2 -22 6Z';
  var p2 = 'M-24 10 C-10 4 12 8 24 16 C22 24 18 28 14 30 C4 22 -10 18 -24 20Z';
  var s = cast(p2, fill, INK, 1.3, 0, 2) + cast(p, fill, INK, 1.4, 0, 2) + P('M-18 2 C-12 -10 2 -14 12 -10', 'none', '#fff', 2.2, 'opacity=".6"');
  if (trim) s += P('M-22 6 C-6 2 14 6 24 12', 'none', trim, 2) + C(0, -6, 2.2, trim, { stroke: INK, 'stroke-width': 0.8 });
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -sc : sc) + ' ' + sc + ') rotate(-14)">' + s + '</g>';
}
function capeBack(d, fill) {
  return P('M58 150 C40 160 26 190 18 250 L182 250 C174 190 160 160 142 150Z', fill, INK, 1.4);
}
function strapDiag(fill, studs) {
  var s = cast('M56 156 L68 150 L146 246 L134 252Z', fill, INK, 1.2, 0, 2);
  if (studs) for (var i = 0; i < 6; i++) s += C(64 + i * 14, 160 + i * 16.5, 2, studs, { stroke: INK, 'stroke-width': 0.7 });
  return s;
}
function runeGlyphs(d, c, cx, cy, r, n, col) {
  var s = '', g = ['M-3 -4 L3 -4 L0 4Z', 'M-3 -4 L3 4 M3 -4 L-3 4', 'M0 -4 L0 4 M-3 -1 L3 -1', 'M-3 4 L0 -4 L3 4 M-2 1 L2 1', 'M-3 -4 L3 -4 L-3 4 L3 4', 'M0 -4 C4 -2 -4 2 0 4'];
  for (var i = 0; i < n; i++) {
    var a = i / n * Math.PI * 2;
    s += '<path transform="translate(' + f(cx + Math.cos(a) * r) + ' ' + f(cy + Math.sin(a) * r) + ') rotate(' + f(a * 57.3 + 90) + ')" d="' + g[i % g.length] + '"/>';
  }
  return G(s, { fill: 'none', stroke: col, 'stroke-width': 1.3, 'stroke-linecap': 'round' });
}

var OUTFIT = {
  warrior: function (d, c, m) {
    var s = '';
    if (c.fem) {
      s += both(P('M80 176 L92 146', 'none', INK, 3.4) + P('M80 176 L92 146', 'none', '#6a4a2a', 2.2));
      s += cups(d, c, m.steel, INK, '#c9a24a');
      s += C(100, 190, 3.4, m.gold, { stroke: INK, 'stroke-width': 1 });
      s += both(C(86, 186, 1.4, '#c9a24a') + C(80, 196, 1.4, '#c9a24a'));
      s += belt(c, m.leather, m.gold, 234);
      s += P('M84 246 L116 246 L112 250 L88 250Z', '#8a1f24', INK, 1);
      s += P('M88 146 C94 150 106 150 112 146 L112 141 C106 145 94 145 88 141Z', '#3a2a24', INK, 1);
      s += both(P('M41 214 C48 218 56 218 61 214 L60 226 C54 229 47 229 41 226Z', m.leather, INK, 1.1) + P('M42 219 L60 219', 'none', '#c9a24a', 1.2));
      s += pauldron(d, c, 48, 164, 1, m.steel, '#c9a24a');
    } else {
      s += strapDiag(m.leather, '#d8d8e0');
      s += belt(c, m.leather, m.gold, 236);
      s += both(P('M22 212 C30 218 42 218 49 212 L48 228 C40 232 30 232 22 228Z', m.leather, INK, 1.1) + P('M23 219 L48 219', 'none', '#c9a24a', 1.3));
      s += P('M84 140 C92 146 108 146 116 140 L118 148 C108 154 92 154 82 148Z', '#7a5a3a', INK, 1);
      s += pauldron(d, c, 36, 160, 1.3, m.steel, '#c9a24a');
    }
    return s;
  },
  paladin: function (d, c, m) {
    var s = '';
    if (c.fem) {
      s += P('M88 146 C94 152 106 152 112 146 L114 156 C106 162 94 162 86 156Z', m.gold, INK, 1.1);
      s += cups(d, c, m.white, INK, '#d9a83c');
      s += faithAt(d, 'dawn', 100, 191, 15);
      s += belt(c, m.gold, null, 232);
      s += P('M82 242 L118 242 L114 250 L86 250Z', '#2f4f9a', INK, 1) + P('M100 242 L100 250', 'none', '#d9a83c', 2);
      s += pauldron(d, c, 50, 162, 0.85, m.white, '#d9a83c') + pauldron(d, c, 150, 162, 0.85, m.white, '#d9a83c', true);
    } else {
      var plate = 'M54 156 C70 148 86 146 100 150 C114 146 130 148 146 156 C150 184 146 214 140 250 L60 250 C54 214 50 184 54 156Z';
      s += cast(plate, m.white, INK, 1.4, 0, 3);
      s += G(P('M100 150 L100 250', 'none', '#b8c2d8', 2) + P('M58 182 C72 192 90 192 100 184 C110 192 128 192 142 182', 'none', '#9aa6c2', 1.5) + P('M60 168 C70 160 84 158 94 162', 'none', '#fff', 3, 'opacity=".8"'), { 'clip-path': d.clip('<path d="' + plate + '"/>') });
      s += P('M54 156 C70 148 86 146 100 150 C114 146 130 148 146 156', 'none', '#d9a83c', 3);
      s += faithAt(d, 'dawn', 100, 178, 30);
      s += P('M82 140 C92 148 108 148 118 140 L120 152 C108 158 92 158 80 152Z', m.gold, INK, 1.1);
      s += belt(c, m.gold, null, 236);
      s += pauldron(d, c, 36, 158, 1.25, m.white, '#d9a83c') + pauldron(d, c, 164, 158, 1.25, m.white, '#d9a83c', true);
    }
    s += C(100, c.fem ? 166 : 162, 3, '#fff7c0', { filter: c.glowSm });
    return s;
  },
  rogue: function (d, c, m) {
    var s = '', cl = '#2a2f3e';
    if (c.fem) {
      s += both(P('M76 181 L94 148', 'none', INK, 3) + P('M76 181 L94 148', 'none', '#2a2430', 2));
      s += cups(d, c, '#2b2533', INK, '#7a6a8a');
      s += P('M100 184 L100 200 M95 188 L105 196 M105 188 L95 196', 'none', '#7a6a8a', 1);
      s += P('M66 226 C80 232 120 232 134 226 L134 234 C120 240 80 240 66 234Z', '#2b2533', INK, 1.1);
      s += belt(c, m.leather, '#9aa0aa', 238);
    } else {
      var vest = 'M54 156 C66 150 80 148 88 150 L100 210 L112 150 C120 148 134 150 146 156 C150 186 146 216 142 250 L58 250 C54 216 50 186 54 156Z';
      s += cast(vest, '#2b2533', INK, 1.3, 0, 3);
      s += P('M92 160 L97 172 M90 176 L98 188 M108 160 L103 172 M110 176 L102 188', 'none', '#7a6a8a', 1.2);
      s += belt(c, m.leather, '#9aa0aa', 236);
    }
    // cloak front panels over shoulders
    var fl = c.fem ? 'M80 128 C70 146 50 152 38 162 C28 186 24 220 22 250 L58 250 C60 218 64 190 72 168 C78 156 84 146 86 132Z'
      : 'M78 126 C66 144 44 148 28 160 C18 186 16 220 14 250 L52 250 C54 218 58 190 66 168 C72 156 80 146 84 130Z';
    s += both(cast(fl, d.lin([[0, '#3c4256'], [1, '#161a24']]), INK, 1.4, 2, 2) + P(fl.replace(/^M[\d. ]+C/, 'M80 130 C'), 'none', '#5a6178', 1, 'opacity=".0"'));
    s += both(P(c.fem ? 'M40 170 C34 196 30 222 28 248' : 'M30 168 C24 196 20 222 18 248', 'none', '#5a6178', 1.5, 'opacity=".7"'));
    // scarf
    s += P(c.fem ? 'M84 138 C92 146 108 146 116 138 L120 150 C110 160 90 160 80 150Z' : 'M80 134 C90 144 110 144 120 134 L124 148 C112 158 88 158 76 148Z', '#7a2030', INK, 1.2) + P('M86 148 C94 152 106 152 114 148', 'none', '#a8394a', 1.2);
    // dagger hilt on strap
    s += T(P('M0 0 L4 -16 L8 0Z', m.steel, INK, 1) + R(1, 0, 6, 3, m.gold, { stroke: INK, 'stroke-width': 0.8 }) + R(2.5, 3, 3, 9, '#3a2418', { stroke: INK, 'stroke-width': 0.8 }), c.fem ? 118 : 120, c.fem ? 214 : 214, 1, 200);
    return s;
  },
  bard: function (d, c, m) {
    var s = '';
    if (c.fem) {
      var corset = 'M66 196 C76 208 92 210 100 202 C108 210 124 208 134 196 C136 214 132 230 132 250 L68 250 C68 230 64 214 66 196Z';
      s += both(cast('M64 184 C66 176 80 172 92 176 C98 178 100 184 100 192 C94 204 80 206 70 202 C64 198 62 190 64 184Z', '#fdf6ee', INK, 1.2, 0, 2));
      s += P('M66 184 C72 180 80 178 88 180 M70 190 C76 186 84 186 92 188', 'none', '#d8c8c0', 1);
      s += cast(corset, d.lin([[0, '#a42848'], [1, '#5a1028']]), INK, 1.3, 0, 3);
      s += P('M94 208 L106 214 M106 208 L94 214 M94 218 L106 224 M106 218 L94 224 M94 228 L106 234 M106 228 L94 234', 'none', '#f0d080', 1);
      s += P('M66 196 C76 208 92 210 100 202 C108 210 124 208 134 196', 'none', '#f0d080', 1.6);
      s += both(cast('M38 178 C40 166 52 160 62 166 C68 174 66 190 58 196 C48 198 38 192 38 178Z', '#fdf6ee', INK, 1.2, 0, 2) + P('M44 172 C48 168 54 168 58 172', 'none', '#d8c8c0', 1));
      s += P('M90 146 C96 150 104 150 110 146', 'none', '#a42848', 3) + C(100, 151, 3, '#f0d080', { stroke: INK, 'stroke-width': 0.8 });
    } else {
      var shirt = 'M50 156 C62 150 78 148 88 148 L100 196 L112 148 C122 148 138 150 150 156 C154 186 150 216 146 250 L54 250 C50 216 46 186 50 156Z';
      s += cast(shirt, '#f6efe6', INK, 1.3, 0, 3);
      var vest = 'M52 158 C62 154 72 152 80 152 L94 230 L96 250 L56 250 C52 216 48 186 52 158Z';
      s += both(cast(vest, d.lin([[0, '#2f7a5a'], [1, '#14402c']]), INK, 1.3, 2, 2) + P('M80 152 L94 230', 'none', '#f0d080', 1.6));
      s += P('M88 148 L100 196 L112 148', 'none', '#d8c8c0', 1.2);
      s += both(cast('M22 186 C20 168 32 152 50 152 C58 160 58 180 52 198 C42 204 28 200 22 186Z', '#f6efe6', INK, 1.2, 0, 2));
    }
    return s;
  },
  hunter: function (d, c, m) {
    var s = '', green = d.lin([[0, '#5a8a3a'], [1, '#2a4a1c']]);
    if (c.fem) {
      s += both(P('M80 176 L90 146', 'none', INK, 3) + P('M80 176 L90 146', 'none', '#4a3a20', 2));
      s += cups(d, c, green, INK, '#c8a060');
      s += both(P('M86 184 l-6 4 l6 3 Z', '#8ab84a', INK, 0.6));
      s += P('M66 228 C80 234 120 234 134 228 L136 238 L124 250 L112 240 L100 250 L88 240 L76 250 L64 238Z', '#6a4a2a', INK, 1.1);
    } else {
      var j = 'M52 156 C66 150 82 148 92 150 L100 176 L108 150 C118 148 134 150 148 156 C152 186 148 216 144 250 L56 250 C52 216 48 186 52 156Z';
      s += cast(j, green, INK, 1.3, 0, 3);
      s += P('M94 160 L106 166 M94 170 L106 176 M106 160 L94 166 M106 170 L94 176', 'none', '#c8a060', 1);
      s += belt(c, m.leather, '#c8a060', 236);
    }
    // quiver strap + fur mantle
    s += cast('M138 152 L148 156 L76 250 L64 250Z', '#5a3a1c', INK, 1.1, 0, 2);
    var fur = c.fem ? 'M34 170 C30 158 40 150 52 150 C62 146 74 148 82 152 L76 160 L70 156 L66 166 L60 160 L54 170 L48 162 L42 174Z'
      : 'M16 172 C12 156 28 146 44 144 C58 140 74 142 84 146 L78 156 L72 152 L66 162 L60 154 L52 166 L46 156 L38 170 L30 160 L24 176Z';
    s += cast(fur, d.lin([[0, '#c8b098'], [1, '#7a604a']]), INK, 1.2, 0, 2);
    return s;
  },
  monk: function (d, c, m) {
    var s = '';
    if (c.fem) {
      var wrap = 'M64 180 C70 176 86 174 100 178 C114 174 130 176 136 180 L136 206 C120 212 80 212 64 206Z';
      s += cast(wrap, '#f6f0e6', INK, 1.3, 0, 3);
      s += G(P('M60 186 L140 182 M60 194 L140 190 M60 202 L140 198', 'none', '#cbbfae', 1.2), { 'clip-path': d.clip('<path d="' + wrap + '"/>') });
    }
    s += P('M62 230 C80 236 120 236 138 230 L140 244 C120 250 80 250 60 244Z', '#d8641c', INK, 1.2) + P('M112 236 l10 14 l-8 0Z M112 236 l-2 14', '#d8641c', INK, 1);
    // prayer beads
    var beads = '', n = 15;
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1), a = Math.PI * (0.05 + t * 0.9);
      var bx = 100 - Math.cos(a) * (c.fem ? 22 : 30), by = 146 + Math.sin(a) * (c.fem ? 24 : 34);
      beads += C(bx, by, i === 7 ? 4.2 : 3, i === 7 ? '#c8382c' : '#7a4a22', { stroke: INK, 'stroke-width': 0.8 }) + C(bx - 1, by - 1, 1, '#fff', { opacity: 0.5 });
    }
    s += beads;
    // arm wraps
    s += both(G(P('M' + (c.fem ? '41 214 L60 210 M41 222 L60 218 M40 230 L59 226 M40 238 L59 234' : '22 212 L48 208 M22 220 L48 216 M22 228 L48 224 M21 236 L47 232'), 'none', '#f6f0e6', 4.5) + P('M' + (c.fem ? '41 214 L60 210 M41 222 L60 218 M40 230 L59 226 M40 238 L59 234' : '22 212 L48 208 M22 220 L48 216 M22 228 L48 224 M21 236 L47 232'), 'none', '#cbbfae', 0.8)));
    return s;
  },
  conjurer: function (d, c, m) {
    var s = '', red = d.lin([[0, '#e8442a'], [1, '#7a120c']]);
    if (c.fem) {
      s += both(P('M82 176 L96 148', 'none', INK, 3) + P('M82 176 L96 148', 'none', '#d9a83c', 2));
      s += cups(d, c, red, INK, '#ffcf5a');
      s += P('M100 186 C96 192 98 198 100 202 C102 198 104 192 100 186Z', '#ffcf5a', INK, 0.7);
      s += P('M64 230 C80 236 120 236 136 230 L138 240 C120 246 80 246 62 240Z', m.gold, INK, 1.1);
      s += P('M78 242 L122 242 L118 250 L82 250Z', red, INK, 1);
      // shawl over arms
      s += both(P('M64 158 C50 166 40 188 38 216 C44 224 52 226 60 222', 'none', '#ffb070', 5, 'opacity=".55"'));
      s += C(100, 150, 3.2, '#ff7a2a', { stroke: INK, 'stroke-width': 0.8, filter: c.glowSm });
    } else {
      var robe = 'M48 156 C60 150 76 148 86 150 L96 250 L52 250 C48 216 44 186 48 156Z';
      s += both(cast(robe, red, INK, 1.3, 2, 2) + P('M86 150 L96 250', 'none', '#ffcf5a', 2.4) + P('M58 200 C62 192 70 194 68 204 C66 212 72 214 76 208', 'none', '#ffcf5a', 1.2));
      s += belt(c, '#3a1a10', m.gold, 236);
    }
    return s;
  },
  magician: function (d, c, m) {
    var s = '', pur = d.lin([[0, '#6a4ac0'], [1, '#2a1a5a']]), teal = '#3ad0d0';
    if (c.fem) {
      var bod = 'M66 194 C76 206 92 208 100 200 C108 208 124 206 134 194 C136 212 134 228 132 240 L68 240 C66 228 64 212 66 194Z';
      s += cups(d, c, pur, INK, teal);
      s += cast(bod, pur, INK, 1.3, 0, 2) + P('M100 204 L100 240', 'none', teal, 1.5) + P('M68 240 L132 240', 'none', teal, 2);
      s += C(100, 190, 3, teal, { stroke: INK, 'stroke-width': 0.8, filter: c.glowSm });
    } else {
      var coat = 'M50 156 C62 150 78 148 88 150 L100 200 L112 150 C122 148 138 150 150 156 C154 186 150 216 146 250 L54 250 C50 216 46 186 50 156Z';
      s += cast(coat, pur, INK, 1.3, 0, 3) + P('M88 150 L100 200 L112 150', 'none', teal, 2) + P('M100 200 L100 250', 'none', INK, 1.2);
      s += C(96, 214, 2, m.gold) + C(96, 230, 2, m.gold) + C(104, 214, 2, m.gold) + C(104, 230, 2, m.gold);
    }
    return s;
  },
  sorcerer: function (d, c, m) {
    var s = '', blk = d.lin([[0, '#2a1e3a'], [1, '#0c0814']]), vio = '#c06aff';
    var tat = '';
    if (c.fem) {
      s += both(P('M78 178 L96 148 M84 178 L70 160', 'none', INK, 2.6) + P('M78 178 L96 148 M84 178 L70 160', 'none', '#3a2a4a', 1.6));
      s += cups(d, c, blk, INK, vio);
      s += P('M88 146 C94 150 106 150 112 146 L112 150 C106 154 94 154 88 150Z', blk, INK, 1) + C(100, 154, 2.5, vio, { filter: c.glowSm });
      s += P('M60 232 C80 238 120 238 140 232 L142 244 C120 250 80 250 58 244Z', blk, INK, 1.1);
      tat = 'M100 216 L100 230 M94 222 L106 222 M96 226 C92 230 92 234 96 236 M104 226 C108 230 108 234 104 236';
    } else {
      var robe = 'M46 156 C60 150 76 148 86 150 L94 250 L50 250 C46 216 42 186 46 156Z';
      s += both(cast(robe, blk, INK, 1.3, 2, 2) + P('M86 150 L94 250', 'none', vio, 1.6));
      tat = 'M100 168 L100 184 M90 176 L110 176 M92 170 L108 182 M108 170 L92 182';
    }
    var arm = c.fem ? 'M46 196 l4 6 l4 -6 l4 6 M46 208 L58 208' : 'M26 196 l5 7 l5 -7 l5 7 M26 210 L44 210';
    s += G(P(tat, 'none', vio, 1.4) + both(P(arm, 'none', vio, 1.3)), { filter: c.glowSm });
    return s;
  },
  wizard: function (d, c, m) {
    var s = '', blue = d.lin([[0, '#2a4ab0'], [1, '#101a50']]);
    var stars = function (pts) { var r = ''; for (var i = 0; i < pts.length; i += 2) r += P(starPts(pts[i], pts[i + 1], 3, 1.2, 4), '#ffe9a0'); return r; };
    if (c.fem) {
      s += cups(d, c, blue, INK, '#ffe9a0');
      var robe = 'M62 158 C52 160 42 168 40 186 C38 210 40 230 38 250 L78 250 C74 230 70 210 70 190 C70 174 68 164 62 158Z';
      s += both(cast(robe, blue, INK, 1.3, 2, 2) + stars([50, 196, 60, 226, 48, 240]) + P('M70 190 C70 210 74 230 78 250', 'none', '#ffe9a0', 1.6));
      s += P('M62 232 C80 238 120 238 138 232 L139 240 C120 246 80 246 61 240Z', '#ffe9a0', INK, 1);
    } else {
      var robeM = 'M48 154 C62 148 78 146 88 146 L100 186 L112 146 C122 146 138 148 152 154 C156 186 152 216 148 250 L52 250 C48 216 44 186 48 154Z';
      s += cast(robeM, blue, INK, 1.4, 0, 3) + stars([66, 180, 130, 200, 76, 226, 122, 236, 62, 206, 140, 176]);
      s += P('M88 146 L100 186 L112 146', 'none', '#ffe9a0', 2.2);
      s += P('M60 226 C80 232 120 232 140 226 L141 236 C120 242 80 242 59 236Z', '#ffe9a0', INK, 1);
    }
    return s;
  }
};

/* ---------- props behind / in front ---------- */
var PROPS = {
  warrior: {
    back: function (d, c, m) {
      return T(P('M-5 0 L5 0 L4 150 L0 160 L-4 150Z', m.steel, INK, 1.3) + P('M0 4 L0 150', 'none', '#fff', 1, 'opacity=".7"') +
        R(-16, -6, 32, 7, m.gold, { stroke: INK, 'stroke-width': 1.2, rx: 2 }) + R(-3.5, -30, 7, 24, '#4a2c18', { stroke: INK, 'stroke-width': 1.1 }) + C(0, -34, 5, m.gold, { stroke: INK, 'stroke-width': 1.1 }), 160, 72, 1, 200);
    },
    front: function (d, c, m) {
      var x = c.fem ? 34 : 26;
      return T(C(0, 0, 40, m.steel, { stroke: INK, 'stroke-width': 2 }) + C(0, 0, 33, '#8a1f24', { stroke: INK, 'stroke-width': 1.2 }) + P(starPts(0, 0, 18, 7, 4), m.gold, INK, 1) + C(0, 0, 5, m.steel, { stroke: INK, 'stroke-width': 1 }) +
        P('M-28 -16 A32 32 0 0 1 -10 -32', 'none', '#fff', 3, 'opacity=".6"'), x, 244, 1);
    }
  },
  paladin: {
    back: function (d, c, m) {
      var hy = 76;
      var rays = '';
      for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2; rays += 'M100 ' + hy + ' L' + f(100 + Math.cos(a) * 120) + ' ' + f(hy + Math.sin(a) * 120) + ' L' + f(100 + Math.cos(a + 0.08) * 120) + ' ' + f(hy + Math.sin(a + 0.08) * 120) + 'Z'; }
      return P(rays, '#fff7d0', null, null, 'opacity=".22"') + capeBack(d, d.lin([[0, '#3050a8'], [1, '#14204a']])) +
        C(100, hy - 4, 48, 'none', { stroke: '#ffe58a', 'stroke-width': 5, filter: c.glowMd }) + C(100, hy - 4, 48, 'none', { stroke: '#fffbe0', 'stroke-width': 1.6 });
    }
  },
  rogue: {
    back: function (d, c, m) {
      return P('M54 118 C42 64 72 30 100 30 C128 30 158 64 146 118 C160 150 178 190 184 250 L16 250 C22 190 40 150 54 118Z', d.lin([[0, '#353b50'], [1, '#12151e']]), INK, 1.5);
    },
    head: function (d, c, m) {
      return P('M56 124 C48 70 74 34 100 34 C126 34 152 70 144 124 L138 122 C142 76 124 50 100 50 C76 50 58 76 62 122Z', d.lin([[0, '#424a62'], [1, '#22283a']]), INK, 1.5) +
        P('M64 104 C62 74 78 54 100 52', 'none', '#6a7290', 1.4, 'opacity=".7"');
    },
    front: function (d, c, m) {
      return T(P('M-4 0 L0 -48 L4 0Z', m.steel, INK, 1.2) + P('M0 -44 L0 -2', 'none', '#fff', 0.9) + R(-10, 0, 20, 4, m.gold, { stroke: INK, 'stroke-width': 1 }) + R(-2.5, 4, 5, 16, '#3a2418', { stroke: INK, 'stroke-width': 1 }) + sparkle(0, -40, 7, '#fff'), 168, 238, 1, 18);
    }
  },
  bard: {
    front: function (d, c, m) {
      var body = 'M-30 0 C-30 -22 -14 -30 0 -26 C10 -40 30 -36 32 -16 C40 0 30 28 0 30 C-24 30 -30 16 -30 0Z';
      var s = P('M18 -18 L92 -74 L98 -66 L26 -10Z', d.lin([[0, '#6a3c18'], [1, '#3a1e0a']]), INK, 1.2) +
        P('M90 -76 L108 -92 L116 -84 L98 -66Z', '#3a1e0a', INK, 1.2) + C(104, -88, 2, m.gold) + C(110, -82, 2, m.gold) + C(100, -80, 2, m.gold) +
        cast(body, m.wood, INK, 1.6, 2, 3) + P('M-22 -2 C-22 -16 -10 -22 0 -20', 'none', '#f0c080', 2.2, 'opacity=".7"') +
        C(4, -4, 8, '#2a140a', { stroke: '#f0d080', 'stroke-width': 1.5 }) + R(-14, 10, 18, 4, '#3a1e0a', { transform: 'rotate(-36 -5 12)' }) +
        P('M-8 12 L96 -70 M-6 14 L98 -68 M-4 16 L100 -66', 'none', '#f4f0e0', 0.6);
      return T(s, c.fem ? 74 : 72, 226, 1, 0);
    }
  },
  hunter: {
    back: function (d, c, m) {
      var s = P('M28 44 C-6 110 -6 190 30 256', 'none', INK, 7) + P('M28 44 C-6 110 -6 190 30 256', 'none', d.lin([[0, '#a06a30'], [1, '#5a3410']]), 4.5) + P('M28 44 L30 256', 'none', '#f0e8d0', 0.9) + R(4, 140, 8, 18, '#3a2410', { stroke: INK, 'stroke-width': 1 });
      s += T(R(-10, 0, 20, 70, '#6a4220', { stroke: INK, 'stroke-width': 1.3, rx: 3 }) +
        P('M-6 0 L-8 -22 L-2 -14Z M0 0 L0 -26 L4 -16Z M6 0 L8 -20 L10 -10Z', '#e8e0d0', INK, 0.9) + P('M-6 0 L-8 -22 M0 0 L0 -26 M6 0 L8 -20', 'none', '#c03030', 1), 150, 80, 1, 24);
      return s;
    }
  },
  monk: {
    front: function (d, c, m) {
      var fist = 'M-16 -12 C-16 -20 16 -20 18 -10 C22 0 20 14 12 18 C0 22 -16 18 -18 8 C-20 0 -18 -6 -16 -12Z';
      var s = cast(fist, c.skinG, c.skinOut, 1.4, 0, 2) + P('M-10 -16 C-12 -8 -12 0 -10 4 M-2 -18 C-4 -8 -4 0 -2 4 M6 -18 C4 -8 4 0 6 4', 'none', c.skinLine, 1) +
        P('M-18 6 C-6 12 10 12 20 4 M-17 12 C-4 18 10 18 16 12', 'none', '#f6f0e6', 4.5) + P('M-18 6 C-6 12 10 12 20 4', 'none', '#cbbfae', 0.7) +
        P('M-12 -18 C0 -24 12 -20 16 -14', 'none', '#fff', 1.5, 'opacity=".6"');
      return T(s, 160, 222, c.fem ? 1.1 : 1.3, -12);
    },
    head: function (d, c, m) {
      return P('M66 68 C80 60 120 60 134 68 L134 76 C120 68 80 68 66 76Z', '#d8641c', INK, 1.1) + P('M66 72 C56 76 50 86 46 98 L52 96 C54 88 60 80 68 76Z', '#d8641c', INK, 1);
    }
  },
  conjurer: {
    back: function (d, c, m) {
      var s = P('M170 250 L170 76', 'none', INK, 7.5) + P('M170 250 L170 76', 'none', m.wood, 5);
      s += P('M170 80 C156 74 156 54 170 48 C184 54 184 74 170 80Z', 'none', '#7a4a20', 3);
      var fl = 'M170 66 C156 56 160 40 164 32 C166 40 170 40 170 28 C176 36 182 42 178 52 C186 48 186 40 184 36 C192 48 186 64 170 66Z';
      s += G(P(fl, '#ff7a1a') + P('M170 62 C164 56 166 48 170 42 C174 50 178 54 170 62Z', '#ffe080'), { filter: c.glowLg });
      for (var i = 0; i < 9; i++) s += C(140 + c.rnd() * 60, 30 + c.rnd() * 200, 1 + c.rnd() * 1.6, i % 2 ? '#ffb040' : '#ff6020', { filter: c.glowSm, opacity: 0.8 });
      return s;
    }
  },
  magician: {
    back: function (d, c, m) {
      return P('M56 150 C40 120 44 96 54 84 C64 110 74 128 84 140Z M144 150 C160 120 156 96 146 84 C136 110 126 128 116 140Z', d.lin([[0, '#3ad0d0'], [1, '#2a1a5a']]), INK, 1.3);
    },
    front: function (d, c, m) {
      var g = d.rad([[0, '#ffffff'], [0.35, '#9ff8ff'], [0.8, '#2ab0e0'], [1, '#1a4a9a']], 0.4, 0.35, 0.65);
      var s = C(0, 0, 30, '#5af0ff', { opacity: 0.35, filter: c.glowLg }) + C(0, 0, 18, g, { stroke: '#e0ffff', 'stroke-width': 1 }) + E(-6, -7, 6, 4, '#fff', 'opacity=".8"') +
        P('M-28 6 C-10 16 14 14 28 -2', 'none', '#bff', 1, 'opacity=".7"') + sparkle(22, -20, 6, '#fff') + sparkle(-24, -16, 4, '#bff') + sparkle(14, 26, 4, '#fff');
      return T(s, 152, 210, 1);
    }
  },
  sorcerer: {
    back: function (d, c, m) {
      var col = '#c06aff';
      return G(C(100, 82, 70, 'none', { stroke: col, 'stroke-width': 1.5, opacity: 0.8 }) + C(100, 82, 60, 'none', { stroke: col, 'stroke-width': 0.8, opacity: 0.7, 'stroke-dasharray': '3 4' }) +
        runeGlyphs(d, c, 100, 82, 65, 14, '#f0c0ff') + P(starPts(100, 82, 58, 58, 6).replace(/ L/g, ' L'), 'none', col, 0.8, 'opacity=".45"'), { filter: c.glowMd });
    },
    front: function (d, c, m) {
      return G(T(runeGlyphs(d, c, 0, 0, 1, 1, '#f6d8ff'), 30, 120, 1.6) + T(runeGlyphs(d, c, 0, 0, 1, 1, '#f6d8ff'), 172, 200, 1.4, 40) + T(runeGlyphs(d, c, 0, 0, 1, 1, '#f6d8ff'), 160, 108, 1.2, 70), { filter: c.glowMd });
    }
  },
  wizard: {
    back: function (d, c, m) {
      return P('M32 250 L32 120', 'none', INK, 7) + P('M32 250 L32 120', 'none', m.wood, 4.5) + P('M32 124 C22 110 24 96 32 88 C40 96 42 110 32 124Z', '#9ad8ff', INK, 1.2, 'filter="' + c.glowSm + '"');
    },
    head: function (d, c, m) {
      var blue = d.lin([[0, '#3a5ad0'], [1, '#14206a']]);
      var hat = 'M66 60 C78 52 88 30 102 10 C112 -4 132 -6 150 4 C134 4 122 12 118 30 C116 42 124 52 134 60Z';
      var s = cast(hat, blue, INK, 1.5, 2, 2) + P('M88 40 C94 30 100 20 110 10', 'none', '#6a8af0', 2, 'opacity=".6"');
      s += cast('M40 66 C60 52 140 52 160 66 C150 76 50 76 40 66Z', blue, INK, 1.5, 0, 3) + P('M68 58 C86 62 114 62 132 58 L133 54 C114 58 86 58 67 54Z', '#ffe9a0', INK, 0.9);
      s += P(starPts(100, 40, 5, 2, 5), '#ffe9a0') + P(starPts(116, 22, 3, 1.2, 4), '#ffe9a0') + P(starPts(84, 48, 2.5, 1, 4), '#ffe9a0') + C(150, 6, 4, '#ffe9a0', { stroke: INK, 'stroke-width': 1 });
      return s;
    }
  }
};

/* ---------- backgrounds ---------- */
var BG = {
  warrior: ['#b0343a', '#3a0a10', '#ff9a60'], paladin: ['#f6e3a8', '#7a5418', '#fffbe0'], rogue: ['#2a5468', '#060b14', '#9fd8ff'],
  bard: ['#c45a92', '#2a0f30', '#ffd0f0'], hunter: ['#5a9450', '#0c200f', '#e0ffb0'], monk: ['#f0a050', '#5a200a', '#fff0b0'],
  conjurer: ['#ff7a30', '#3a0800', '#ffe080'], magician: ['#40c0d0', '#0a1a40', '#d0ffff'], sorcerer: ['#8a40e0', '#12052c', '#f0c0ff'], wizard: ['#3a5ac0', '#050a2a', '#d0e0ff']
};
function bgSvg(d, c) {
  var b = BG[c.cls] || BG.bard, r = c.rnd;
  var s = R(0, 0, 200, 250, d.rad([[0, b[0]], [1, b[1]]], 0.5, 0.35, 0.8));
  var mo = '';
  switch (c.cls) {
    case 'warrior':
      mo += P('M20 250 L80 20 L86 22 L30 250Z M180 250 L120 20 L114 22 L170 250Z', '#000', null, null, 'opacity=".18"');
      for (var i = 0; i < 14; i++) mo += C(r() * 200, r() * 250, 0.8 + r() * 1.5, b[2], { opacity: 0.6 });
      break;
    case 'paladin':
      for (var j = 0; j < 12; j++) { var a = j / 12 * Math.PI * 2; mo += P('M100 70 L' + f(100 + Math.cos(a) * 260) + ' ' + f(70 + Math.sin(a) * 260) + ' L' + f(100 + Math.cos(a + 0.14) * 260) + ' ' + f(70 + Math.sin(a + 0.14) * 260) + 'Z', '#fff', null, null, 'opacity=".18"'); }
      break;
    case 'rogue':
      mo += C(150, 48, 22, '#e8f4ff', { opacity: 0.85, filter: c.glowMd }) + P('M0 250 L0 170 L20 170 L20 150 L40 140 L56 150 L56 130 L76 130 L76 160 L124 160 L124 120 L136 108 L148 120 L148 150 L170 150 L170 136 L200 136 L200 250Z', '#05080e', null, null, 'opacity=".7"');
      break;
    case 'bard':
      for (var k = 0; k < 6; k++) mo += T(P('M0 0 L0 -16 L8 -18 L8 -4', 'none', b[2], 1.4) + E(-2, 0, 3, 2.2, b[2]) + E(6, -3, 3, 2.2, b[2]), 20 + r() * 160, 40 + r() * 180, 0.8 + r() * 0.5, -10 + r() * 20);
      mo = G(mo, { opacity: 0.35 });
      break;
    case 'hunter':
      for (var t = 0; t < 7; t++) { var x = t * 32 - 6 + r() * 10, h = 80 + r() * 60; mo += P('M' + f(x) + ' ' + f(250 - h - 40) + ' L' + f(x + 18) + ' 250 L' + f(x - 18) + ' 250Z', '#081a0a', null, null, 'opacity=".55"'); }
      for (var u = 0; u < 10; u++) mo += C(r() * 200, r() * 200, 1.2, '#e8ff9a', { opacity: 0.7, filter: c.glowSm });
      break;
    case 'monk':
      mo += C(100, 92, 70, '#fff0c0', { opacity: 0.35 }) + P('M0 250 L0 190 L40 150 L70 180 L110 130 L150 175 L175 160 L200 180 L200 250Z', '#5a200a', null, null, 'opacity=".5"');
      break;
    case 'conjurer':
      mo += P('M0 250 C20 200 10 180 30 160 C34 190 50 190 46 150 C70 180 66 210 80 250Z M200 250 C180 200 190 180 170 160 C166 190 150 190 154 150 C130 180 134 210 120 250Z', '#ffb040', null, null, 'opacity=".3"');
      break;
    case 'magician':
      for (var v = 0; v < 16; v++) mo += sparkle(r() * 200, r() * 250, 2 + r() * 4, b[2], { opacity: 0.6 });
      break;
    case 'sorcerer':
      mo += C(100, 82, 92, 'none', { stroke: b[2], 'stroke-width': 0.8, opacity: 0.25 });
      break;
    default:
      for (var w = 0; w < 40; w++) mo += C(r() * 200, r() * 250, 0.4 + r() * 1.1, '#fff', { opacity: 0.4 + r() * 0.6 });
      mo += C(34, 40, 16, '#fff6d0', { opacity: 0.9, filter: c.glowMd }) + C(41, 36, 14, b[0]);
  }
  s += mo;
  return s;
}

/* ---------- main ---------- */
function buildCtx(d, o) {
  o = o || {};
  var look = o.look || {};
  var race = RACES.indexOf(o.race) >= 0 ? o.race : 'human';
  var cls = CLASSES.indexOf(o.cls) >= 0 ? o.cls : (o.cls === 'none' ? 'none' : 'warrior');
  var fem = o.gender === 'f';
  var seed = (o.seed | 0) + hashStr(race + cls + (o.gender || 'm')) + (look.hair | 0) * 7 + (look.eyes | 0) * 13;
  var c = { d: d, race: race, cls: cls, fem: fem, rnd: rng(seed) };
  var cu = o.custom || {};
  var skin = cu.skin || pick(SKINS, look.skin);
  if (race === 'halforc' && !cu.skin) skin = mix(skin, '#86ad62', 0.5);
  var hc = cu.hairColor || pick(HAIRC, look.hairColor);
  var ec = cu.eyeColor || pick(EYEC, look.eyes);
  c.skin = skin; c.hair = hc; c.eye = ec;
  c.skinG = d.lin([[0, shade(skin, 0.12)], [1, skin]], 0, 0, 1, 1);
  c.skinBodyG = d.lin([[0, shade(skin, 0.1)], [0.6, skin], [1, shadow(skin, 0.35)]], 0, 0, 1, 0.3);
  c.skinSh = shadow(skin, 0.45);
  c.skinLine = shadow(skin, 1.1);
  c.skinOut = mix(shadow(skin, 1.6), INK, 0.4);
  var dark = hx(hc)[0] + hx(hc)[1] + hx(hc)[2] < 200;
  c.hairHi = dark ? mix(hc, '#a8b8f0', 0.5) : mix(hc, '#ffffff', 0.6);
  c.hairSh = shadow(hc, dark ? 0.4 : 0.85);
  c.hairOut = dark ? '#0c0810' : mix(shadow(hc, 1.6), INK, 0.5);
  c.hairG = d.lin([[0, shade(hc, 0.15)], [0.5, hc], [1, shadow(hc, 0.55)]], 0, 40, 0, 160, true);
  c.hairBackG = d.lin([[0, shadow(hc, 0.3)], [1, shadow(hc, 0.75)]], 0, 40, 0, 250, true);
  c.irisG = d.lin([[0, shade(ec, -0.55)], [0.5, ec], [1, shade(ec, 0.55)]]);
  c.lashCol = dark ? '#1a0e18' : mix(shadow(hc, 1.6), '#1a0e18', 0.6);
  c.browCol = dark ? '#2a1a24' : shadow(hc, 1.1);
  c.tieCol = ['#e04a6a', '#4a8ae0', '#f0d060', '#8a5ae0', '#ffffff'][c.rnd() * 5 | 0];
  c.glowSm = d.glow(1.5); c.glowMd = d.glow(3.5); c.glowLg = d.glow(6, 2); c.blurSm = d.blur(1.6);
  // face geometry
  c.faceW = fem ? 32 : 33; c.jawW = fem ? 19 : 23; c.jawY = fem ? 120 : 119; c.chinY = fem ? 131 : 132;
  c.eyeX = 15; c.eyeY = 97; c.eyeS = fem ? 1.05 : 0.98; c.eyeSY = fem ? 1 : 0.84; c.mouthY = 117;
  c.ear = 'human'; c.bodySX = 1; c.headS = 1;
  if (race === 'elf') { c.ear = 'elf'; c.bodySX = 0.96; c.faceW -= 1; c.chinY += 1; }
  if (race === 'halfelf') c.ear = 'half';
  if (race === 'dwarf') { c.bodySX = 1.12; c.faceW += 3; c.jawW += 4; c.chinY -= 2; c.jawY -= 1; }
  if (race === 'hobbit' || race === 'gnome') { c.ear = 'small'; c.bodySX = 0.92; c.headS = 1.04; c.faceW += 2; c.jawW += 5; c.jawY -= 3; c.chinY -= 5; c.eyeS *= 1.1; c.mouthY -= 2; }
  if (race === 'gnome' && !fem) c.bigNose = true;
  if (race === 'halforc') { c.ear = 'small'; c.tusks = true; c.bodySX = fem ? 1 : 1.08; c.jawW += fem ? 2 : 5; c.browY = 1; }
  c.mouthI = (o.seed | 0) + (look.hair | 0);
  c.hairIdx = look.hair | 0;
  if (c.hairIdx < 0) c.hairIdx = -c.hairIdx;
  for (var k in cu) c[k] = cu[k];
  return c;
}
function renderPortrait(d, o) {
  var c = buildCtx(d, o);
  var m = mats(d);
  var cu = (o && o.custom) || {};
  var props = cu.props || PROPS[c.cls] || {};
  var outfit = cu.outfit || OUTFIT[c.cls] || function () { return ''; };
  var hs = cu.hairStyle ? cu.hairStyle(c) : hairStyle(c, c.hairIdx);
  if (c.race === 'dwarf' && c.fem && !hs.braid && !cu.noBraids) hs.dwarfBraids = true;
  if (props.head && c.cls === 'rogue') hs.back = [];
  var s = '';
  s += cu.bg ? cu.bg(d, c, m) : bgSvg(d, c);
  if (props.back) s += props.back(d, c, m);
  if (cu.back) s += cu.back(d, c, m);
  var bodyT = c.bodySX !== 1 ? 'translate(100 0) scale(' + c.bodySX + ' 1) translate(-100 0)' : null;
  var hT = c.headS !== 1 ? 'translate(100 132) scale(' + c.headS + ') translate(-100 -132)' : null;
  var fig = '';
  fig += G(hairBackSvg(d, c, hs), { transform: hT });
  fig += G(bodySvg(d, c) + outfit(d, c, m), { transform: bodyT });
  var head = headSvg(d, c);
  if (c.race === 'dwarf' && !c.fem && !cu.noBeard) head += beardSvg(d, c);
  if (cu.face) head += cu.face(d, c, m);
  if (hs.dwarfBraids) head += both(G(braid(70, 100, 66, 176, 8, 7), { fill: c.hairG, stroke: c.hairOut, 'stroke-width': 1.2 }) + C(66, 178, 3, '#d9a83c', { stroke: INK, 'stroke-width': 0.8 }));
  head += hairFrontSvg(d, c, hs);
  if (props.head) head += props.head(d, c, m);
  if (cu.head) head += cu.head(d, c, m);
  fig += G(head, { transform: hT });
  s += G(fig, { filter: d.drop(0, 3, 3, '#000', 0.45), opacity: cu.figOpacity });
  if (props.front) s += props.front(d, c, m);
  if (cu.front) s += cu.front(d, c, m);
  // vignette + rim light
  s += R(0, 0, 200, 250, d.rad([[0.55, '#000', 0], [1, '#000', 0.55]], 0.5, 0.45, 0.75));
  s += R(0, 0, 200, 250, d.lin([[0, '#fff', 0.12], [0.4, '#fff', 0], [1, '#000', 0.15]], 0, 0, 1, 1));
  return s;
}
function beardSvg(d, c) {
  var b = 'M66 92 C66 110 70 118 78 120 C86 112 94 114 100 118 C106 114 114 112 122 120 C130 118 134 110 134 92 C142 120 140 150 128 170 L120 162 L114 178 L106 166 L100 184 L94 166 L86 178 L80 162 L72 170 C60 150 58 120 66 92Z';
  var s = P(b, c.hairG, c.hairOut, 1.4);
  s += P('M84 130 C84 150 88 160 92 168 M100 128 L100 176 M116 130 C116 150 112 160 108 168 M74 120 C72 140 74 150 78 160 M126 120 C128 140 126 150 122 160', 'none', c.hairSh, 1, 'opacity=".6"');
  s += P('M86 114 C92 108 98 110 100 113 C102 110 108 108 114 114 C118 120 112 122 106 118 C102 117 98 117 94 118 C88 122 82 120 86 114Z', c.hairG, c.hairOut, 1.2);
  s += P('M80 138 C90 132 110 132 120 138', 'none', c.hairHi, 2, 'opacity=".5"');
  return s;
}

/* shared with the other art files */
A.LOOK_COUNTS = LOOK_COUNTS; A.both = both; A.cast = cast; A.mats = mats; A.headSvg = headSvg; A.braid = braid; A.hairStyle = hairStyle;
A.hairBackSvg = hairBackSvg; A.hairFrontSvg = hairFrontSvg; A.cups = cups; A.pauldron = pauldron; A.strapDiag = strapDiag; A.runeGlyphs = runeGlyphs;
A.PROPS = PROPS; A.buildCtx = buildCtx; A.renderPortrait = renderPortrait; A.beardSvg = beardSvg;
})();
