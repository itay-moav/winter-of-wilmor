/* Velmoor art: Monster sprites (300x300), group C: anime-style humanoids and dragons (harpy, siren, dark elf, vampire, cultist,
 * dark mage, demon, wyvern, dragon), with the shared mc_* face and body helpers.
 * Plain script (no modules); load order is listed in js/art/api.js. */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL;
/* from core.js */
var f = A.f, shade = A.shade, shadow = A.shadow, P = A.P, C = A.C, E = A.E, R = A.R, G = A.G, M = A.M, T = A.T, starPts = A.starPts,
    sparkle = A.sparkle, INK = A.INK, MONSTERS = A.MONSTERS;

/* ------------------------------------------------------------------ */
/* Monsters group C: harpy, cultist, dark_mage, demon, wyvern, dragon,  */
/* siren, dark_elf, vampire + bosses ratking, morvane, kargath, malthor */
/* ------------------------------------------------------------------ */

/* anime eye in local coords (outer corner toward +x); side=-1 mirrors */
function mc_eye(d, x, y, side, color, sc, o) {
  o = o || {};
  var white = 'M-8 -1 C-6 -7 4 -8 9 -4 C8 2 5 7 0 7 C-5 7 -8 4 -8 -1Z';
  var cl = d.clip('<path d="' + white + '"/>');
  var ig = d.lin([[0, shade(color, -0.7)], [0.45, color], [1, shade(color, 0.6)]]);
  var lash = o.lash || INK;
  var sy = sc * (o.male ? 0.78 : 1);
  var s = '';
  if (o.glow) s += C(x, y + 0.5 * sy, 6 * sc, color, { filter: d.blur(3 * sc), opacity: 0.85 });
  s += '<g transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + f(side * sc) + ' ' + f(sy) + ')">';
  s += P(white, o.sclera || '#fdfcff');
  s += '<g clip-path="' + cl + '">' +
    E(0.5, 1.5, 5.6, 7, ig) + E(0.5, 1.5, 5.6, 7, 'none', { stroke: shade(color, -0.75), 'stroke-width': 0.9 }) +
    (o.slit ? E(0.5, 1, 1, 4.6, shade(color, -0.85)) : E(0.5, 0.8, 2.7, 3.7, shade(color, -0.85))) +
    E(0.5, 5.4, 3.6, 1.7, shade(color, 0.7), { opacity: 0.75 }) +
    P('M-10 -10 L11 -10 L11 -3 C4 -6.2 -5 -5 -10 0.5Z', 'rgba(40,20,70,0.35)') + '</g>';
  s += C(-2, -2.2, 2.1, '#fff') + C(3, 3.8, 1, '#fff', { opacity: 0.9 });
  if (o.male) s += P('M-9 0.5 C-7 -8 5 -9.5 11 -5 L10.5 -3.6 C5 -7.4 -6 -6.2 -9 0.5Z', lash);
  else s += P('M-9 0.5 C-7 -8 5 -10 11 -6 L13.5 -8.2 L11.6 -3.4 C5 -7.6 -6 -6.2 -9 0.5Z', lash) + P('M9.5 -2.6 L12.6 -3.4', 'none', lash, 0.9);
  s += P('M-4 7.6 Q1 8.6 5 6.6', 'none', lash, 0.8, { opacity: 0.7 });
  return s + '</g>';
}

/* anime face, local radius ~20 at scale 1, centred on (cx,cy). chin at cy+23*s */
function mc_face(d, cx, cy, s, o) {
  var sk = o.skin, male = !!o.male;
  var face = male ? 'M-17 -4 C-17 -26 17 -26 17 -4 C17 8 12 15 6 20.5 L0 22.5 L-6 20.5 C-12 15 -17 8 -17 -4Z'
    : 'M-18 -4 C-18 -26 18 -26 18 -4 C18 9 10 18 0 23 C-10 18 -18 9 -18 -4Z';
  var out = '<g transform="translate(' + f(cx) + ' ' + f(cy) + ') scale(' + f(s) + ')">';
  var earF = d.lin([[0, shade(sk, 0.05)], [1, shadow(sk, 0.4)]]);
  if (o.ear === 'elf') {
    var ear = P('M15 -1 C24 -8 34 -16 42 -22 C36 -10 28 2 17 9Z', earF, INK, 1.2) + P('M18 1 C25 -5 31 -10 36 -15', 'none', shadow(sk, 0.7), 0.8);
    out += ear + M(ear, 0);
  } else if (o.ear !== 'none') {
    var ear2 = E(17.5, 3, 3.6, 5.6, earF, { stroke: INK, 'stroke-width': 1.1 });
    out += ear2 + M(ear2, 0);
  }
  var cl = d.clip('<path d="' + face + '"/>');
  out += P(face, d.lin([[0, shade(sk, 0.12)], [0.7, sk], [1, shadow(sk, 0.15)]]));
  out += '<g clip-path="' + cl + '">' + P('M5 -30 C14 -14 15 6 0 24 L30 24 L30 -30Z', shadow(sk, 0.6), null, null, { opacity: 0.32 }) +
    P('M-20 -12 C-8 -6 8 -6 20 -12 L20 -30 L-20 -30Z', shadow(sk, 0.8), null, null, { opacity: 0.3 }) + '</g>';
  out += P(face, 'none', INK, 1.3);
  if (o.blush !== false && !male) out += E(-10, 11, 3.6, 1.6, '#ff6f86', { opacity: 0.32 }) + E(10, 11, 3.6, 1.6, '#ff6f86', { opacity: 0.32 });
  var ec = o.eye || '#4a7fd0';
  var eo = { male: male, glow: o.glow, slit: o.slit, sclera: o.sclera, lash: o.lash };
  if (o.closed) {
    out += P('M-13 5 Q-8 8 -3 5', 'none', INK, 1.3) + P('M3 5 Q8 8 13 5', 'none', INK, 1.3);
  } else {
    out += mc_eye(d, -8.4, 4, -1, ec, 0.56, eo) + mc_eye(d, 8.4, 4, 1, ec, 0.56, eo);
  }
  var bc = o.brow || shade(o.hair || '#3a2a20', -0.35);
  if (o.angry) out += P('M-14 -6.5 L-3.5 -3.6', 'none', bc, male ? 1.8 : 1.3) + P('M14 -6.5 L3.5 -3.6', 'none', bc, male ? 1.8 : 1.3);
  else if (o.sad) out += P('M-13.5 -4.2 Q-8 -7 -3.5 -7', 'none', bc, male ? 1.6 : 1.1) + P('M13.5 -4.2 Q8 -7 3.5 -7', 'none', bc, male ? 1.6 : 1.1);
  else out += P('M-13.5 -6 Q-8.5 -9.2 -3.5 -7.4', 'none', bc, male ? 1.6 : 1.1) + P('M13.5 -6 Q8.5 -9.2 3.5 -7.4', 'none', bc, male ? 1.6 : 1.1);
  out += P('M0.8 9 L-0.4 12 L1.4 12.3', 'none', shadow(sk, 0.9), 0.8);
  var lip = o.lip || (male ? shadow(sk, 0.9) : '#b0405a');
  var m = o.mouth || 'smile';
  if (m === 'smile') out += P('M-3.4 16 Q0 18.4 3.4 16', 'none', lip, 1);
  else if (m === 'smirk') out += P('M-3 16.6 Q1 17.8 4.4 15', 'none', lip, 1);
  else if (m === 'flat') out += P('M-2.8 16.6 L2.8 16.6', 'none', lip, 0.9);
  else if (m === 'sad') out += P('M-3 17.4 Q0 15.8 3 17.4', 'none', lip, 0.9);
  else if (m === 'fang') out += P('M-4.4 15.4 Q0 20.5 4.4 15.4 Q0 16.6 -4.4 15.4Z', '#6a1424', INK, 0.7) + P('M-3 15.9 L-2.3 18.2 L-1.6 16.1Z M3 15.9 L2.3 18.2 L1.6 16.1Z', '#fff');
  else if (m === 'sing') out += E(0, 16.8, 2.6, 2.4, '#6a1a2e', { stroke: INK, 'stroke-width': 0.7 }) + E(0, 18, 1.5, 0.8, '#e66a80');
  if (o.lipFill) out += P('M-3.6 16 Q0 15 3.6 16 Q0 19.4 -3.6 16Z', o.lipFill, null, null, { opacity: 0.85 });
  return out + '</g>';
}

/* front bangs + side locks, local coords as mc_face */
function mc_bangs(cx, cy, s, fill, hl, kind) {
  var b;
  if (kind === 'part') b = 'M-21 8 C-25 -28 25 -30 21 8 Q19 -4 14 -12 Q12 -2 8 2 Q8 -9 3 -14 Q-2 -6 -10 -2 Q-6 -8 -6 -15 Q-14 -6 -21 8Z';
  else if (kind === 'swept') b = 'M-21 8 C-25 -28 25 -30 21 8 Q18 -6 12 -13 Q8 -4 -2 0 Q4 -7 4 -14 Q-6 -4 -14 2 Q-10 -6 -10 -12 Q-16 -4 -21 8Z';
  else b = 'M-21 8 C-25 -28 25 -30 21 8 Q18 -2 15 -8 Q13 0 10 4 Q9 -6 4 -11 Q2 -3 -1 1 Q-3 -8 -8 -11 Q-9 -2 -12 4 Q-14 -4 -16 -8 Q-18 -1 -21 8Z';
  var side = 'M-20 0 Q-25 16 -21 32 Q-18 20 -15 6Z';
  var out = '<g transform="translate(' + f(cx) + ' ' + f(cy) + ') scale(' + f(s) + ')">';
  out += P(side, fill, INK, 1.1) + M(P(side, fill, INK, 1.1), 0);
  out += P(b, fill, INK, 1.3);
  out += P('M-15 -15 Q0 -22.5 15 -15', 'none', hl, 2.4, { 'stroke-dasharray': '7 2 10 3', opacity: 0.85 });
  out += P('M-6 -18 Q-7 -10 -9 -6 M5 -18 Q6 -10 7 -4', 'none', 'rgba(0,0,0,0.25)', 0.8);
  return out + '</g>';
}

/* female torso: origin = shoulder line centre (cx,y0). waist at y0+58, hips at y0+92 */
var MC_FTORSO = 'M-7 -14 L7 -14 C8 -6 14 -3 24 0 C31 2 33 9 31 16 L28 22 C27 36 22 46 16 58 C18 68 26 78 29 92 L-29 92 C-26 78 -18 68 -16 58 C-22 46 -27 36 -28 22 L-31 16 C-33 9 -31 2 -24 0 C-14 -3 -8 -6 -7 -14Z';
function mc_torsoF(d, cx, y0, sk, noNavel) {
  var cl = d.clip('<path d="' + MC_FTORSO + '"/>');
  var out = '<g transform="translate(' + f(cx) + ' ' + f(y0) + ')">';
  out += P(MC_FTORSO, d.lin([[0, shade(sk, 0.1)], [1, shadow(sk, 0.15)]]));
  out += '<g clip-path="' + cl + '">' +
    P('M6 -20 C20 10 22 50 12 100 L40 100 L40 -20Z', shadow(sk, 0.6), null, null, { opacity: 0.33 }) +
    P('M-7 -14 L7 -14 L8 -2 Q0 4 -8 -2Z', shadow(sk, 0.8), null, null, { opacity: 0.4 }) +
    P('M-24 33 Q-13 42 -2 36 M24 33 Q13 42 2 36', 'none', shadow(sk, 0.7), 2, { opacity: 0.45 }) + '</g>';
  out += P(MC_FTORSO, 'none', INK, 1.4);
  out += P('M-12 4 Q-5 6 -1 3 M12 4 Q5 6 1 3', 'none', shadow(sk, 0.6), 0.8, { opacity: 0.7 });
  if (!noNavel) out += P('M0 63 Q-1 66 0 68', 'none', shadow(sk, 0.9), 1);
  return out + '</g>';
}
function mc_gshadow(cx, y, rx, ry, op) { return E(cx, y, rx, ry, 'rgba(0,0,0,' + (op || 0.35) + ')'); }
/* simple limb: tapered quad between two points with widths */
function mc_limb(x1, y1, w1, x2, y2, w2, bend) {
  var dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
  bend = bend || 0;
  var mx = (x1 + x2) / 2 + nx * bend, my = (y1 + y2) / 2 + ny * bend;
  var wm = (w1 + w2) / 2;
  return 'M' + f(x1 + nx * w1) + ' ' + f(y1 + ny * w1) + ' Q' + f(mx + nx * wm) + ' ' + f(my + ny * wm) + ' ' + f(x2 + nx * w2) + ' ' + f(y2 + ny * w2) +
    ' A' + f(w2) + ' ' + f(w2) + ' 0 0 1 ' + f(x2 - nx * w2) + ' ' + f(y2 - ny * w2) +
    ' Q' + f(mx - nx * wm) + ' ' + f(my - ny * wm) + ' ' + f(x1 - nx * w1) + ' ' + f(y1 - ny * w1) + 'Z';
}
function mc_skinFill(d, sk) { return d.lin([[0, shade(sk, 0.12)], [1, shadow(sk, 0.25)]], 0, 0, 1, 0.3); }
function mc_metal(d, c) { return d.lin([[0, shade(c, 0.55)], [0.45, c], [0.55, shade(c, -0.35)], [1, shade(c, 0.15)]], 0, 0, 0.3, 1); }

/* single feather from base point at angle a (radians) */
function mc_feather(bx, by, a, len, w, fill, ink, tip) {
  var cx = Math.cos(a), sy = Math.sin(a), nx = -sy, ny = cx;
  var tx = bx + cx * len, ty = by + sy * len, mx = bx + cx * len * 0.55, my = by + sy * len * 0.55;
  var s = P('M' + f(bx + nx * w * 0.4) + ' ' + f(by + ny * w * 0.4) + ' Q' + f(mx + nx * w) + ' ' + f(my + ny * w) + ' ' + f(tx) + ' ' + f(ty) +
    ' Q' + f(mx - nx * w * 0.8) + ' ' + f(my - ny * w * 0.8) + ' ' + f(bx - nx * w * 0.4) + ' ' + f(by - ny * w * 0.4) + 'Z', fill, INK, 1.4);
  s += P('M' + f(bx) + ' ' + f(by) + ' Q' + f(mx + nx * 1.5) + ' ' + f(my + ny * 1.5) + ' ' + f(tx - cx * 4) + ' ' + f(ty - sy * 4), 'none', ink, 0.9, { opacity: 0.7 });
  if (tip) s += P('M' + f(tx - cx * 10 + nx * 3) + ' ' + f(ty - sy * 10 + ny * 3) + ' L' + f(tx - cx * 2) + ' ' + f(ty - sy * 2), 'none', tip, 1.6, { opacity: 0.9 });
  return s;
}

/* ---------------- HARPY ---------------- */
MONSTERS.harpy = function (d) {
  var sk = '#f6d6c2', fe = '#2b8c9e', fe2 = '#123c58', gold = '#f2c14e', hair = '#cdeff2';
  var out = mc_gshadow(150, 286, 46, 6, 0.28);
  /* feathered wings built from individual feathers */
  var fgA = d.lin([[0, shade(fe, 0.45)], [0.6, fe], [1, fe2]], 0, 0, 1, 0);
  var fgB = d.lin([[0, shade(fe, 0.2)], [1, shade(fe2, -0.2)]], 0, 0, 1, 0);
  var wing = '';
  var sx = 128, sy = 116, wx = 74, wy = 58, i;
  for (i = 0; i < 12; i++) {
    var t = i / 11, bx = wx + (sx - wx) * t * 0.9, by = wy + (sy - wy) * t * 0.9;
    var a = (206 - i * 9) * Math.PI / 180, len = 74 - i * 2.8, w = 13 + i * 0.5;
    wing += mc_feather(bx, by, a, len, w, i % 2 ? fgA : fgB, fe2, i < 5 ? gold : null);
  }
  /* coverts */
  wing += P('M134 112 C110 88 86 64 60 44 C52 50 56 58 52 66 C64 70 60 80 66 86 C76 86 76 96 84 100 C92 100 94 108 102 112 C110 110 114 118 126 126Z', d.lin([[0, shade(fe, 0.55)], [1, shade(fe, 0.1)]], 1, 0, 0, 1), INK, 1.8) +
    P('M58 62 C66 62 66 74 66 84 M76 82 C82 86 82 94 84 100 M94 98 C100 102 102 108 102 112', 'none', fe2, 1, { opacity: 0.6 }) +
    P('M134 112 C110 88 86 64 60 44', 'none', shade(fe, 0.8), 2, { opacity: 0.8 });
  out += wing + M(wing, 150);
  /* back hair */
  var hg = d.lin([[0, shade(hair, 0.3)], [0.6, hair], [1, shade(hair, -0.35)]]);
  out += P('M126 54 C112 80 106 112 96 150 L112 136 L114 156 L128 132 L136 104 L164 104 L172 132 L186 156 L188 136 L204 150 C194 112 188 80 174 54 C168 28 132 28 126 54Z', hg, INK, 1.6);
  /* legs */
  var leg = P('M128 196 C116 214 116 234 128 242 L142 238 C140 226 142 212 146 204Z', d.lin([[0, fe], [1, fe2]]), INK, 1.8) +
    P('M130 238 C127 252 123 262 117 270 L126 272 C133 262 137 252 140 237Z', d.lin([[0, '#e8b04a'], [1, '#a8661e']], 0, 0, 1, 0), INK, 1.5) +
    P('M118 269 Q110 272 108 280 Q114 274 120 274Z M122 271 Q118 278 120 286 Q123 279 126 273Z M126 271 Q132 274 134 282 Q130 274 124 271Z', '#2a1a14', INK, 0.8) +
    P('M131 246 L138 245 M129 252 L136 251 M127 258 L133 258', 'none', '#7a4a16', 0.9);
  out += leg + M(leg, 150);
  /* torso */
  out += mc_torsoF(d, 150, 104, sk);
  /* feather skirt */
  out += P('M120 186 C134 180 166 180 180 186 L188 206 L178 200 L176 218 L166 204 L160 222 L150 206 L140 222 L134 204 L124 218 L122 200 L112 206Z', d.lin([[0, shade(fe, 0.2)], [1, fe2]]), INK, 1.6) +
    P('M120 187 C134 182 166 182 180 187', 'none', gold, 2.2);
  /* feather top */
  out += P('M124 126 C130 118 146 118 150 128 C154 118 170 118 176 126 C177 136 168 143 158 143 L150 138 L142 143 C132 143 123 136 124 126Z', d.lin([[0, shade(fe, 0.4)], [1, fe2]]), INK, 1.5) +
    P('M128 134 Q134 130 140 135 M160 135 Q166 130 172 134', 'none', shade(fe, 0.6), 1) +
    P('M124 126 C128 120 142 119 148 124 M152 124 C158 119 172 120 176 126', 'none', gold, 1.2);
  /* necklace */
  out += P('M140 98 Q150 108 160 98', 'none', gold, 1.4) + P('M150 106 L146 116 L150 121 L154 116Z', d.lin([[0, '#9ff'], [1, '#2a8ca0']]), INK, 0.8);
  /* head */
  out += mc_face(d, 150, 66, 1, { skin: sk, eye: '#e0a020', hair: hair, brow: '#4a7a84', mouth: 'smirk', ear: 'none', slit: true });
  out += mc_bangs(150, 66, 1, hg, '#ffffff', 'swept');
  /* feather crest in hair */
  out += P('M168 46 C182 30 196 26 210 26 C198 34 190 40 176 54Z M172 52 C188 44 200 44 212 48 C198 50 188 54 178 60Z', d.lin([[0, gold], [1, fe]], 0, 0, 1, 0), INK, 1.2);
  return out;
};

/* ---------------- SIREN ---------------- */
MONSTERS.siren = function (d) {
  var sk = '#f7e4de', hair = '#3fd0c8', tail = '#2a9fb8', tail2 = '#5a3aa8', shell = '#ffb4c8';
  var out = '';
  /* water splash + rock */
  out += E(150, 284, 120, 10, 'rgba(20,80,110,0.35)');
  out += P('M50 288 C58 248 96 232 140 236 C190 230 236 244 250 288Z', d.lin([[0, '#6a7a8c'], [1, '#232c3a']]), INK, 2.2) +
    P('M80 256 C100 246 120 246 136 252 M170 248 C196 244 216 252 228 266', 'none', '#9aa8b8', 1.5, { opacity: 0.6 });
  out += P('M30 290 Q60 270 90 286 Q120 272 150 288 Q180 272 210 288 Q240 270 270 290Z', d.lin([[0, '#bff4ff', 0.9], [1, '#2a8fb0', 0.6]]), '#e8ffff', 1.2);
  /* long back hair flowing to the right */
  var hg = d.lin([[0, shade(hair, 0.35)], [0.5, hair], [1, shade(hair, -0.4)]]);
  out += P('M126 50 C110 80 104 130 92 176 C104 172 110 182 108 196 C122 180 128 170 130 150 L132 104 L168 104 C178 140 196 160 226 168 C218 156 216 146 222 136 C204 132 190 110 184 76 C178 30 132 26 126 50Z', hg, INK, 1.6) +
    P('M128 70 C118 110 112 150 100 180 M176 70 C184 110 196 140 218 158', 'none', shade(hair, -0.45), 1, { opacity: 0.6 });
  /* tail: from hips, sweeping right across rock, fin up */
  var tg = d.lin([[0, tail], [0.6, shade(tail, -0.2)], [1, tail2]], 0, 0, 1, 0);
  out += P('M121 190 C114 220 128 246 166 250 C204 254 230 240 240 214 L232 210 C224 228 204 236 176 232 C156 230 166 210 179 190Z', tg, INK, 2);
  out += P('M126 210 Q150 216 172 210 M130 226 Q150 234 176 230 M196 238 Q206 234 214 236', 'none', shade(tail, 0.45), 1.1, { 'stroke-dasharray': '3 3', opacity: 0.8 });
  out += P('M236 214 C238 190 252 172 274 162 C268 182 270 196 282 212 C266 208 250 212 240 222Z', d.lin([[0, '#9ff3ff'], [1, tail2]], 0, 0, 1, 1), INK, 1.8) +
    P('M240 212 L264 176 M242 214 L276 204', 'none', '#e0ffff', 1, { opacity: 0.7 });
  out += P('M121 190 Q150 198 179 190 L180 198 Q150 206 120 198Z', d.lin([[0, '#c8a0ff'], [1, '#6a40b0']]), INK, 1.2);
  /* torso */
  out += mc_torsoF(d, 150, 104, sk);
  /* arms: left leaning on rock, right hand near chest */
  var sf = mc_skinFill(d, sk);
  out += P(mc_limb(124, 112, 7, 112, 160, 5.5, 4), sf, INK, 1.4) + P(mc_limb(112, 160, 5.5, 108, 204, 4.5, -3), sf, INK, 1.4) + E(107, 208, 6, 4.5, sk, { stroke: INK, 'stroke-width': 1.2 });
  out += P(mc_limb(176, 112, 7, 190, 156, 5.5, -4), sf, INK, 1.4) + P(mc_limb(190, 156, 5.5, 196, 200, 4.5, 3), sf, INK, 1.4) + E(197, 204, 6, 4.5, sk, { stroke: INK, 'stroke-width': 1.2 });
  out += C(197, 196, 2, '#fffaf0', { stroke: '#a89', 'stroke-width': 0.4 }) + C(193, 197, 1.6, '#fffaf0') + C(201, 197, 1.6, '#fffaf0');
  /* shell top */
  var sh = d.rad([[0, '#fff0f4'], [0.6, shell], [1, '#c2507a']], 0.5, 0.9, 0.9);
  var cup = P('M127 128 C128 118 146 118 148 130 C144 140 132 141 127 128Z', sh, INK, 1.3) + P('M131 122 L137 136 M137 120 L139 137 M143 122 L141 137', 'none', '#c2507a', 0.8);
  out += cup + M(cup, 150) + P('M127 128 Q120 112 140 98 M173 128 Q180 112 160 98 M148 130 Q150 132 152 130', 'none', '#f7e3b0', 1.1);
  /* pearl necklace */
  for (var i = 0; i < 7; i++) out += C(138 + i * 4, 101 + Math.sin(i / 6 * Math.PI) * 5, 1.6, '#fffaf0', { stroke: '#a89', 'stroke-width': 0.4 });
  /* head */
  out += mc_face(d, 150, 66, 1, { skin: sk, eye: '#e24aa8', hair: hair, brow: '#2a8a88', mouth: 'sing', ear: 'elf', lipFill: '#e86a90' });
  out += mc_bangs(150, 66, 1, hg, '#ffffff', 'part');
  /* fin ears / pearls in hair */
  out += C(131, 50, 3, '#fffaf0', { stroke: INK, 'stroke-width': 0.8 }) + P('M128 54 L120 46 L126 60Z', '#ffb4c8', INK, 0.8);
  /* glowing music notes */
  var gl = d.glow(2.2, 2);
  var note = function (x, y, s, c) { return T(E(0, 8, 3.6, 2.8, c, { transform: 'rotate(-20)' }) + R(2.6, -10, 1.6, 18, c) + P('M4 -10 Q12 -6 10 2', 'none', c, 1.8), x, y, s); };
  out += G(note(196, 74, 1.1, '#a6fff6') + note(224, 52, 0.85, '#ffc0ec') + note(86, 64, 0.9, '#a6fff6') + note(246, 92, 0.7, '#ffffff'), { filter: gl });
  out += sparkle(206, 104, 5, '#fff', { opacity: 0.9 }) + sparkle(70, 96, 4, '#bff', { opacity: 0.8 });
  return out;
};

/* ---------------- DARK ELF ---------------- */
MONSTERS.dark_elf = function (d) {
  var sk = '#7a6a96', hair = '#eef0ff', arm = '#241a33', trim = '#c9c2e6', mag = '#c45cff';
  var out = mc_gshadow(150, 282, 56, 8, 0.4);
  /* cape */
  out += P('M124 104 C96 150 76 220 58 282 L120 270 L150 282 L180 270 L242 282 C224 220 204 150 176 104Z', d.lin([[0, '#3a1a56'], [1, '#12081e']]), INK, 2) +
    P('M124 104 C104 150 92 220 80 276 M176 104 C196 150 208 220 220 276', 'none', '#7a3ab0', 1.5, { opacity: 0.6 });
  /* back hair */
  var hg = d.lin([[0, '#ffffff'], [0.5, hair], [1, '#8a8ab8']]);
  out += P('M126 52 C112 80 110 130 104 176 L116 166 L118 184 L128 160 L134 104 L166 104 L172 160 L182 184 L184 166 L196 176 C190 130 188 80 174 52 C168 26 132 26 126 52Z', hg, INK, 1.6);
  /* legs with thigh boots */
  var sf = mc_skinFill(d, sk);
  var bootF = d.lin([[0, '#3b2b52'], [0.5, arm], [1, '#0e0814']], 0, 0, 1, 0);
  var legL = P('M121 192 C116 220 118 244 124 280 L138 280 C138 252 142 226 148 202Z', sf, INK, 1.6) +
    P('M118 228 C120 250 122 264 120 282 L140 282 C138 262 140 244 142 228 Q130 222 118 228Z', bootF, INK, 1.6) + P('M118 228 Q130 222 142 228', 'none', trim, 1.6);
  out += legL + M(legL, 150);
  out += mc_torsoF(d, 150, 104, sk);
  /* glowing rune tattoos */
  var tg = d.glow(1.5, 1);
  out += G(P('M138 160 L142 168 L138 176 M162 160 L158 168 L162 176 M150 170 L150 180', 'none', mag, 1.2), { filter: tg, opacity: 0.85 });
  /* armour bikini: spiked bra + belt */
  var met = mc_metal(d, '#3a2c50');
  var cup = P('M126 127 C128 117 146 116 149 128 L149 137 C142 143 130 142 126 136Z', met, INK, 1.4) + P('M137 119 L136 108 L141 120Z', d.lin([[0, '#fff'], [1, trim]]), INK, 0.8);
  out += cup + M(cup, 150) + P('M126 128 C130 120 142 120 148 128 M174 128 C170 120 158 120 152 128', 'none', trim, 1) + C(150, 132, 2.5, mag, { filter: tg });
  out += P('M120 186 C134 180 166 180 180 186 L180 194 C166 190 134 190 120 194Z', met, INK, 1.4) +
    P('M138 192 L150 230 L162 192Z', d.lin([[0, '#5a2a8a'], [1, '#1a0a2a']]), INK, 1.3) + C(150, 189, 3.5, mag, { filter: tg, stroke: INK, 'stroke-width': 0.8 });
  /* pauldron spikes */
  var paul = P('M118 106 C126 98 140 102 142 110 C136 118 124 122 116 118Z', met, INK, 1.4) + P('M124 102 L114 86 L130 100Z M118 110 L104 100 L118 114Z', d.lin([[0, '#fff'], [1, trim]]), INK, 0.8);
  /* arms: left down with dagger, right raised with magic */
  out += P(mc_limb(122, 112, 7, 108, 158, 5.5, 3), sf, INK, 1.4) + P(mc_limb(108, 158, 5.5, 104, 196, 4.5, -2), sf, INK, 1.4) +
    P(mc_limb(107, 170, 5.3, 104.5, 193, 4.6, -1), bootF, INK, 1.2) + E(104, 200, 5.5, 5, sk, { stroke: INK, 'stroke-width': 1.2 }) +
    P('M101 198 L86 252 L94 248 L106 202Z', d.lin([[0, '#e8e0ff'], [1, '#7a6aa0']], 0, 0, 1, 0), INK, 1.2) + R(98, 194, 12, 4, '#c9a040', { stroke: INK, 'stroke-width': 0.8, transform: 'rotate(15 104 196)' });
  out += P(mc_limb(178, 112, 7, 208, 98, 5.5, -4), sf, INK, 1.4) + P(mc_limb(208, 98, 5.5, 226, 60, 4.5, -4), sf, INK, 1.4) +
    P(mc_limb(212, 88, 5.4, 224, 64, 4.6, -2), bootF, INK, 1.2) + E(228, 56, 5.5, 6, sk, { stroke: INK, 'stroke-width': 1.2 });
  out += paul + M(paul, 150);
  /* magic flame above hand */
  var fl = d.rad([[0, '#ffffff'], [0.35, '#f0b0ff'], [0.7, mag], [1, '#4a0a8a', 0]]);
  out += G(C(230, 36, 26, fl, { opacity: 0.8 }) + P('M230 54 C214 46 218 30 226 22 C226 30 232 32 234 18 C242 30 248 44 230 54Z', '#f6d8ff', mag, 1.5), { filter: d.glow(4, 2) });
  out += sparkle(206, 24, 5, '#f0c0ff') + sparkle(252, 64, 4, '#fff');
  out += mc_face(d, 150, 66, 1, { skin: sk, eye: '#ff3048', hair: hair, brow: '#e0e0ff', mouth: 'smirk', ear: 'elf', angry: true, glow: true, lipFill: '#3a1a4a', lash: '#120818', blush: false });
  out += mc_bangs(150, 66, 1, hg, '#ffffff', 'part');
  /* circlet */
  out += P('M130 50 Q150 42 170 50', 'none', trim, 1.6) + P('M150 42 L146 50 L150 54 L154 50Z', '#d070ff', INK, 0.8, { filter: tg });
  return out;
};

/* ---------------- VAMPIRE COUNTESS ---------------- */
MONSTERS.vampire = function (d) {
  var sk = '#f6e8ee', hair = '#1c1426', red = '#b0102c', blk = '#160c16';
  var out = mc_gshadow(150, 282, 60, 8, 0.4);
  out += C(150, 140, 120, d.rad([[0, '#ff2a4a', 0.25], [1, '#600010', 0]]));
  /* bat-wing cape */
  out += P('M122 104 C80 110 46 150 24 206 C40 200 50 206 54 216 C64 204 78 206 84 218 C90 206 104 206 110 214 L150 280 L190 214 C196 206 210 206 216 218 C222 206 236 204 246 216 C250 206 260 200 276 206 C254 150 220 110 178 104Z', d.lin([[0, '#2a0a1a'], [1, '#0a0208']]), INK, 2.2) +
    P('M124 108 C92 120 66 156 54 214 M176 108 C208 120 234 156 246 214', 'none', '#6a1028', 1.4);
  /* hair: very long */
  var hg = d.lin([[0, '#4a3a5e'], [0.4, hair], [1, '#07040a']]);
  out += P('M126 52 C108 80 102 140 92 200 C102 196 108 204 108 214 C118 196 124 176 128 150 L132 104 L168 104 L172 150 C176 176 182 196 192 214 C192 204 198 196 208 200 C198 140 192 80 174 52 C168 26 132 26 126 52Z', hg, INK, 1.6);
  /* high collar */
  var col = P('M124 104 L100 56 L114 60 L118 44 L136 92Z', d.lin([[0, red], [1, '#3a0010']]), INK, 1.6);
  out += col + M(col, 150);
  /* gown skirt with slit, one leg visible */
  var sf = mc_skinFill(d, sk);
  out += P('M172 188 C186 220 196 252 204 284 L176 284 L176 196Z', d.lin([[0, '#3a0a20'], [1, '#050003']]), INK, 1.8);
  out += P('M156 200 C160 226 166 252 170 280 L184 280 C182 252 182 226 180 196Z', sf, INK, 1.5) +
    P('M164 262 C166 270 168 276 168 282 L188 282 C186 274 184 268 182 260Z', blk, INK, 1.2);
  out += P('M120 186 C110 220 100 250 92 282 L158 282 C154 250 150 222 152 196 C160 190 172 190 180 194 L176 186Z', d.lin([[0, '#2a0a1e'], [0.6, blk], [1, '#000']]), INK, 2) +
    P('M120 190 C112 226 104 256 98 280 M138 196 C134 230 130 256 126 280', 'none', red, 1.2, { opacity: 0.7 });
  out += mc_torsoF(d, 150, 104, sk);
  /* corset bodice, bare shoulders */
  out += P('M126 126 C134 118 146 122 150 130 C154 122 166 118 174 126 C174 140 170 158 166 168 C164 178 172 186 180 192 L120 192 C128 186 136 178 134 168 C130 158 126 140 126 126Z', d.lin([[0, '#3a0a20'], [1, blk]]), INK, 1.6) +
    P('M126 126 C134 118 146 122 150 130 C154 122 166 118 174 126', 'none', red, 2) +
    P('M150 134 L150 186 M144 142 L156 150 M156 142 L144 150 M144 156 L156 164 M156 156 L144 164', 'none', red, 0.9);
  out += P('M138 98 Q150 106 162 98', 'none', red, 2.4) + P('M150 104 L146 112 L150 118 L154 112Z', '#ff2040', INK, 0.8, { filter: d.glow(1.5) });
  /* arms: one raised holding goblet, other on hip */
  out += P(mc_limb(122, 112, 7, 112, 152, 5.5, 3), sf, INK, 1.4) + P(mc_limb(112, 152, 5.5, 128, 180, 4.5, 5), sf, INK, 1.4) + E(130, 182, 5, 4.5, sk, { stroke: INK, 'stroke-width': 1.2 });
  out += P(mc_limb(178, 112, 7, 196, 146, 5.5, -3), sf, INK, 1.4) + P(mc_limb(196, 146, 5.5, 206, 108, 4.5, -4), sf, INK, 1.4) + E(206, 104, 5, 5.5, sk, { stroke: INK, 'stroke-width': 1.2 });
  /* goblet */
  out += P('M198 80 L216 80 C216 92 210 98 207 98 C204 98 198 92 198 80Z', d.lin([[0, '#ffe8a0'], [1, '#a07020']], 0, 0, 1, 0), INK, 1.2) +
    P('M199.5 83 L214.5 83 C214 90 210 95 207 95 C204 95 200 90 199.5 83Z', '#a00020') + R(206, 98, 2, 8, '#c09030', { stroke: INK, 'stroke-width': 0.6 }) + E(207, 107, 5, 1.6, '#c09030', { stroke: INK, 'stroke-width': 0.6 });
  /* face */
  out += mc_face(d, 150, 66, 1, { skin: sk, eye: '#ff1a3a', hair: hair, brow: '#1a0a14', mouth: 'fang', ear: 'elf', glow: true, lipFill: '#a0102a', lash: '#0a0008', blush: false });
  out += mc_bangs(150, 66, 1, hg, '#8a7aa8', 'part');
  /* rose in hair */
  out += C(132, 46, 5, d.rad([[0, '#ff5070'], [1, '#800018']]), { stroke: INK, 'stroke-width': 1 }) + P('M129 45 Q132 42 135 46 Q132 49 130 46', 'none', '#50000c', 0.8);
  /* bats */
  var bat = function (x, y, s) { return T(P('M0 0 C-4 -6 -10 -8 -18 -6 C-14 -4 -14 -1 -16 2 C-12 0 -8 1 -6 4 C-4 2 -2 2 0 3 C2 2 4 2 6 4 C8 1 12 0 16 2 C14 -1 14 -4 18 -6 C10 -8 4 -6 0 0Z', '#12060e', INK, 0.6) + C(-1.5, 0, 0.7, '#ff3050') + C(1.5, 0, 0.7, '#ff3050'), x, y, s); };
  out += bat(66, 70, 1.2) + bat(240, 50, 1) + bat(250, 150, 0.8) + bat(56, 132, 0.7);
  return out;
};

/* ---------------- CULTIST ---------------- */
MONSTERS.cultist = function (d) {
  var red = '#8a1426', gold = '#d8a640';
  var out = '';
  /* ritual circle */
  var gl = d.glow(2.5, 2);
  out += G(E(150, 276, 112, 16, 'none', { stroke: '#ff3a3a', 'stroke-width': 2 }) + E(150, 276, 96, 12.5, 'none', { stroke: '#ff6a3a', 'stroke-width': 1, 'stroke-dasharray': '6 4 2 4' }) +
    P('M64 276 L236 276 M100 266 L200 286 M100 286 L200 266', 'none', '#ff3a3a', 0.8, { opacity: 0.6 }), { filter: gl, opacity: 0.9 });
  out += mc_gshadow(150, 276, 64, 8, 0.45);
  var robe = d.lin([[0, shade(red, 0.15)], [0.5, red], [1, '#2a040c']]);
  var robeS = d.lin([[0, '#4a0812'], [1, '#14020a']]);
  /* robe */
  out += P('M118 96 C98 140 84 210 66 278 L234 278 C216 210 202 140 182 96Z', robe, INK, 2.4);
  out += P('M182 96 C196 150 208 210 224 278 L190 278 C186 220 176 150 164 100Z', robeS, null, null, { opacity: 0.6 });
  out += P('M120 130 C112 180 106 230 100 276 M140 120 C136 180 134 230 134 276 M166 124 C170 180 172 230 176 276', 'none', '#3a0410', 1.4, { opacity: 0.8 });
  out += P('M146 100 L144 278 L156 278 L154 100Z', d.lin([[0, '#f2d27a'], [1, '#8a6420']], 0, 0, 1, 0), INK, 1.2);
  for (var i = 0; i < 6; i++) out += P(starPts(150, 130 + i * 24, 4.5, 2, 4, 0), '#3a0410', null, null, { opacity: 0.85 });
  out += P('M66 278 Q100 270 150 278 Q200 270 234 278', 'none', gold, 2);
  /* rope belt */
  out += P('M114 176 Q150 186 186 176', 'none', '#c8b48a', 3.2) + P('M162 182 L166 214 M166 182 L172 210', 'none', '#c8b48a', 2.2);
  /* hood */
  out += P('M150 26 C126 30 108 58 106 98 C112 120 132 128 150 128 C168 128 188 120 194 98 C192 58 176 32 150 26Z', robe, INK, 2.4);
  out += P('M150 26 C170 32 186 60 192 100 C186 116 172 124 160 126 C170 100 168 60 150 26Z', robeS, null, null, { opacity: 0.6 });
  out += P('M150 50 C132 52 124 70 126 98 C134 112 166 112 174 98 C176 70 168 52 150 50Z', d.rad([[0, '#1a0a10'], [1, '#000']], 0.5, 0.4, 0.6), INK, 1.6);
  /* pale bone mask */
  out += P('M138 66 C138 58 162 58 162 66 L161 86 C158 98 154 104 150 106 C146 104 142 98 139 86Z', d.lin([[0, '#f2e8d8'], [1, '#9a8a78']]), INK, 1.2);
  out += P('M141 74 L148 77 L141 80Z M159 74 L152 77 L159 80Z', '#ff2020', null, null, { filter: d.glow(1.5, 2) });
  out += P('M150 82 L150 98 M146 96 L154 96', 'none', '#6a1a1a', 1);
  /* arms: raised dagger, other holding skull candle */
  var sleeve = d.lin([[0, red], [1, '#3a0610']], 0, 0, 1, 1);
  out += P('M178 104 C198 110 212 96 220 74 L238 82 C230 108 214 132 190 140Z', sleeve, INK, 2);
  out += P('M226 70 L218 22 Q228 34 236 70Z', d.lin([[0, '#ffffff'], [1, '#8a8aa0']], 0, 0, 1, 0), INK, 1.4) +
    P('M216 70 L246 66', 'none', gold, 4) + E(230, 78, 6, 5, '#e8d8c8', { stroke: INK, 'stroke-width': 1.2 });
  out += P('M220 22 L223 46', 'none', '#c01020', 1.4);
  out += P('M122 104 C104 116 94 140 88 166 L110 172 C112 150 118 134 128 122Z', sleeve, INK, 2);
  out += E(98, 172, 7, 5, '#e8d8c8', { stroke: INK, 'stroke-width': 1.2 });
  /* skull */
  out += P('M86 160 C86 146 110 146 110 160 C110 168 106 170 104 172 L92 172 C90 170 86 168 86 160Z', '#efe6d4', INK, 1.4) + E(93, 160, 3, 3.5, '#1a0a0a') + E(103, 160, 3, 3.5, '#1a0a0a') + P('M98 165 L96 168 L100 168Z', '#1a0a0a');
  /* candle flame on skull */
  out += R(95, 136, 6, 12, '#e8dcc0', { stroke: INK, 'stroke-width': 1 });
  out += G(P('M98 136 C92 128 96 120 98 112 C100 120 106 128 98 136Z', '#a8ff6a') + C(98, 128, 10, d.rad([[0, '#c0ff80', 0.8], [1, '#40ff40', 0]])), { filter: d.glow(2, 2) });
  return out;
};

/* ---------------- DARK MAGE ---------------- */
MONSTERS.dark_mage = function (d) {
  var sk = '#e6dcef', hair = '#b8b0d8', robe = '#2a1840', trim = '#b8a4e0', mag = '#a040ff';
  var out = mc_gshadow(150, 282, 70, 9, 0.4);
  /* aura */
  out += C(150, 150, 130, d.rad([[0, mag, 0.22], [1, mag, 0]]));
  /* staff (left) */
  out += P('M84 50 L90 50 L94 284 L86 284Z', d.lin([[0, '#5a3a2a'], [1, '#2a160e']], 0, 0, 1, 0), INK, 1.4);
  out += P('M74 54 C70 40 76 26 88 22 C100 26 106 40 102 54 C100 62 94 64 88 64 C82 64 76 62 74 54Z', '#e8e0d0', INK, 1.6) +
    P('M74 40 C62 34 58 20 64 8 C68 22 74 28 80 30Z M102 40 C114 34 118 20 112 8 C108 22 102 28 96 30Z', '#2a2030', INK, 1.2) +
    G(E(82, 44, 3.5, 3, mag) + E(94, 44, 3.5, 3, mag), { filter: d.glow(2, 2) }) + P('M84 56 L92 56 M86 52 L86 58 M90 52 L90 58', 'none', '#3a2a2a', 1);
  /* cape */
  out += P('M118 100 C92 150 66 230 46 284 L254 284 C234 230 208 150 182 100Z', d.lin([[0, '#1a0e2a'], [1, '#08040e']]), INK, 2.2);
  out += P('M118 100 C100 150 84 230 70 284 L90 284 C100 230 114 160 128 110Z', '#5a0a2a', null, null, { opacity: 0.8 });
  /* high collar */
  var col = P('M126 100 L102 50 L120 62 L124 44 L140 88Z', d.lin([[0, '#3a2058'], [1, '#120820']]), INK, 1.6) + P('M106 56 L126 98', 'none', trim, 1);
  out += col + M(col, 150);
  /* front robe */
  var rg = d.lin([[0, shade(robe, 0.2)], [0.6, robe], [1, '#0c0614']]);
  out += P('M124 100 C116 150 108 220 100 284 L200 284 C192 220 184 150 176 100Z', rg, INK, 2);
  out += P('M150 104 L150 284', 'none', trim, 2) + P('M138 104 L150 128 L162 104', 'none', trim, 1.6);
  out += P('M140 104 L150 124 L160 104Z', mc_skinFill(d, sk), INK, 1);
  out += P('M116 176 Q150 186 184 176 L184 186 Q150 196 116 186Z', '#1a0c24', INK, 1.4) + C(150, 184, 6, d.rad([[0, '#e0b0ff'], [1, mag]]), { stroke: INK, 'stroke-width': 1 });
  out += P('M110 240 Q150 248 190 240 M106 270 Q150 278 194 270', 'none', trim, 1.4, { opacity: 0.7 });
  /* sleeves & hands */
  var sv = d.lin([[0, '#3a2058'], [1, '#100818']], 0, 0, 1, 1);
  out += P('M126 104 C112 118 100 140 94 160 L110 168 C114 150 120 136 132 126Z', sv, INK, 1.8) + E(96, 160, 6, 5.5, sk, { stroke: INK, 'stroke-width': 1.2 });
  out += P('M174 104 C196 108 212 118 226 132 L214 150 C202 140 190 134 178 130Z', sv, INK, 1.8) + E(224, 140, 6, 5, sk, { stroke: INK, 'stroke-width': 1.2 });
  /* orb of dark fire */
  var og = d.rad([[0, '#ffffff'], [0.3, '#e6b0ff'], [0.65, mag], [1, '#2a0060', 0.2]]);
  out += G(C(232, 114, 20, og) + P('M232 94 C220 100 222 84 228 74 C230 84 236 82 236 72 C246 84 246 100 232 94Z', '#d090ff', null, null, { opacity: 0.8 }), { filter: d.glow(5, 2) });
  out += P('M216 104 Q232 96 248 108 M218 124 Q232 132 246 120', 'none', '#fff', 1, { opacity: 0.7 });
  out += sparkle(258, 92, 5, '#e6c0ff') + sparkle(206, 84, 4, '#fff') + sparkle(250, 140, 3.5, '#d0a0ff');
  /* back hair */
  var hg = d.lin([[0, '#ffffff'], [0.5, hair], [1, '#5a4a80']]);
  out += P('M132 46 C124 66 124 90 128 106 L140 98 L150 104 L160 98 L172 106 C176 90 176 66 168 46Z', hg, INK, 1.4);
  out += mc_face(d, 150, 66, 1, { skin: sk, male: true, eye: '#c040ff', hair: hair, brow: '#6a5a90', mouth: 'smirk', ear: 'human', angry: true, glow: true });
  out += mc_bangs(150, 66, 1, hg, '#ffffff', 'part');
  /* circlet gem */
  out += P('M130 52 Q150 44 170 52', 'none', '#c0b0e0', 1.4) + C(150, 46, 2.6, '#ff40a0', { filter: d.glow(1.5), stroke: INK, 'stroke-width': 0.6 });
  return out;
};

/* ---------------- DEMON ---------------- */
MONSTERS.demon = function (d) {
  var sk = '#c42a36', dk = '#5a0a14', horn = '#e8dcc4';
  var skin = d.lin([[0, shade(sk, 0.25)], [0.6, sk], [1, shadow(sk, 0.6)]]);
  var out = mc_gshadow(150, 280, 90, 10, 0.45);
  /* hellfire ground */
  var fire = d.lin([[0, '#fff2a0'], [0.4, '#ff9a20'], [1, '#c01a10', 0]]);
  out += G(P('M60 284 C64 264 72 270 74 256 C80 268 86 262 90 248 C96 266 104 262 108 276 L114 284Z M186 284 C190 268 198 272 200 254 C206 266 212 262 218 246 C222 262 230 262 236 272 L240 284Z', fire, null, null, { transform: 'scale(1 -1) translate(0 -568)', opacity: 0 }), {});
  out += G(P('M56 286 Q62 262 70 270 Q72 248 84 262 Q90 240 98 264 Q104 252 112 286Z M188 286 Q194 256 204 268 Q208 244 218 262 Q226 246 232 270 Q240 262 246 286Z', d.lin([[0, '#ffe680'], [0.5, '#ff7a1a'], [1, '#a01010']]), null, null, { opacity: 0.9 }), { filter: d.glow(3, 1) });
  /* wings */
  var wm = d.lin([[0, '#7a1424'], [1, '#2a040a']], 1, 0, 0, 1);
  var wing = P('M112 108 L68 52 L18 18 L26 58 Q38 70 12 96 Q42 100 26 134 Q56 128 52 166 Q76 148 100 150Z', wm, INK, 2.4) +
    P('M112 108 L68 52 L18 18 M68 52 L12 96 M68 52 L26 134 M68 52 L52 166', 'none', '#2a0408', 3) +
    P('M112 108 L68 52 L18 18', 'none', shade(sk, 0.2), 1.2);
  out += wing + M(wing, 150);
  /* tail */
  out += P('M176 212 C214 232 252 226 262 196', 'none', INK, 9) + P('M176 212 C214 232 252 226 262 196', 'none', sk, 5.5) + P('M262 196 L252 186 L272 176 L270 200Z', dk, INK, 1.6);
  /* legs (digitigrade) */
  var leg = P(mc_limb(130, 196, 19, 108, 244, 11, -4), skin, INK, 2.2) + P(mc_limb(108, 244, 10, 118, 274, 6, 3), skin, INK, 2.2) +
    P('M108 272 L130 272 L132 282 L106 282Z', '#1a0a0a', INK, 1.4);
  out += leg + M(leg, 150);
  /* torso */
  out += P('M120 96 C96 96 76 104 72 124 C68 144 80 158 98 164 C104 180 110 192 114 204 L186 204 C190 192 196 180 202 164 C220 158 232 144 228 124 C224 104 204 96 180 96 C170 102 160 106 150 106 C140 106 130 102 120 96Z', skin, INK, 2.6);
  out += P('M150 112 L150 196 M150 132 Q128 146 100 134 M150 132 Q172 146 200 134 M136 152 L164 152 M137 168 L163 168 M139 184 L161 184 M98 120 Q90 134 96 150 M202 120 Q210 134 204 150', 'none', shadow(sk, 0.9), 1.6, { opacity: 0.8 });
  out += P('M104 112 Q120 104 140 112', 'none', shade(sk, 0.5), 2, { opacity: 0.7 });
  /* loincloth */
  out += P('M112 198 L188 198 L190 212 L110 212Z', mc_metal(d, '#6a5a50'), INK, 1.6) + C(150, 205, 6, '#e8dcc4', { stroke: INK, 'stroke-width': 1.2 }) +
    E(147.5, 204, 1.3, 1.5, INK) + E(152.5, 204, 1.3, 1.5, INK);
  out += P('M124 212 L176 212 L170 250 L150 240 L130 250Z', d.lin([[0, '#2a1010'], [1, '#100404']]), INK, 1.6);
  /* arms */
  out += P(mc_limb(88, 118, 18, 58, 172, 13, 4), skin, INK, 2.4) + P(mc_limb(58, 172, 12, 66, 222, 10, -3), skin, INK, 2.4) +
    P('M56 222 L52 240 L60 230 L62 244 L68 232 L72 244 L74 228 L78 236 L76 218Z', '#1a0a0a', INK, 1.2);
  out += P(mc_limb(212, 118, 18, 248, 100, 13, 4), skin, INK, 2.4) + P(mc_limb(248, 100, 12, 254, 66, 10, 3), skin, INK, 2.4) +
    E(254, 60, 10, 9, sk, { stroke: INK, 'stroke-width': 2 });
  /* bracers */
  out += P(mc_limb(60, 196, 12, 64, 216, 11, 0), mc_metal(d, '#5a4a40'), INK, 1.4) + P(mc_limb(251, 86, 11.5, 253, 70, 10.5, 0), mc_metal(d, '#5a4a40'), INK, 1.4);
  /* fireball */
  out += G(C(254, 40, 22, d.rad([[0, '#ffffff'], [0.3, '#fff080'], [0.7, '#ff6a10'], [1, '#c01000', 0]])) +
    P('M254 20 C242 26 246 12 250 6 C254 14 260 10 260 4 C270 18 268 30 254 20Z', '#ffb030', null, null, { opacity: 0.8 }), { filter: d.glow(5, 2) });
  /* head */
  var hg = d.lin([[0, '#ffffff'], [0.5, horn], [1, '#6a5a40']]);
  out += P('M136 56 C118 50 102 30 108 4 C116 24 128 34 142 42Z', hg, INK, 2) + M(P('M136 56 C118 50 102 30 108 4 C116 24 128 34 142 42Z', hg, INK, 2), 150);
  out += P('M131 66 L112 56 L132 78Z', skin, INK, 1.8) + M(P('M131 66 L112 56 L132 78Z', skin, INK, 1.8), 150);
  out += P('M132 58 C130 38 170 38 168 58 L170 78 C168 92 160 102 150 104 C140 102 132 92 130 78Z', skin, INK, 2.2);
  out += P('M131 62 L146 68 L150 64 L154 68 L169 62 L168 56 L150 60 L132 56Z', dk, INK, 1);
  out += G(P('M136 70 L147 72 L139 76Z M164 70 L153 72 L161 76Z', '#ffe040'), { filter: d.glow(1.6, 3) });
  out += P('M137 86 Q150 98 163 86 Q150 92 137 86Z', '#2a0000', INK, 1.2) + P('M140 87 L142 92 L144 88Z M160 87 L158 92 L156 88Z M146 89 L147 92 L148 89.6Z M154 89 L153 92 L152 89.6Z', '#fff');
  out += P('M150 72 L148 80 L152 80', 'none', shadow(sk, 0.9), 1.2);
  return out;
};

/* ---------------- WYVERN ---------------- */
MONSTERS.wyvern = function (d) {
  var gc = '#3f8f4a', belly = '#d8c88a';
  var skin = d.lin([[0, shade(gc, 0.3)], [0.6, gc], [1, shadow(gc, 0.7)]]);
  var mem = d.lin([[0, '#7cc080'], [1, '#1e4a2a']], 0, 0, 1, 1);
  var out = mc_gshadow(170, 280, 90, 9, 0.35);
  /* back wing */
  out += P('M196 132 L250 30 L294 54 Q268 74 286 100 Q256 102 268 132 Q240 126 242 160 Q218 144 204 160Z', d.lin([[0, '#4a8a50'], [1, '#143a1e']], 0, 0, 1, 1), INK, 2.2) +
    P('M196 132 L250 30 L294 54 M250 30 L286 100 M250 30 L268 132 M250 30 L242 160', 'none', '#143a1e', 2.4);
  /* tail */
  out += P('M200 196 C240 206 290 228 276 266 C268 286 236 288 226 272 C244 274 260 266 256 250 C250 232 226 222 194 214Z', skin, INK, 2.2) +
    P('M226 272 L200 284 L216 262Z', '#e8e0c8', INK, 1.4) + P('M236 214 l6 -8 l2 10 M256 226 l8 -6 l0 10', '#2a5a30', INK, 1.2);
  var leg = function (x) { return P('M' + (x - 14) + ' 190 C' + (x - 30) + ' 214 ' + (x - 24) + ' 238 ' + (x - 6) + ' 246 C' + (x - 10) + ' 258 ' + (x - 12) + ' 268 ' + (x - 14) + ' 276 L' + (x + 8) + ' 276 C' + (x + 6) + ' 266 ' + (x + 6) + ' 256 ' + (x + 8) + ' 244 C' + (x + 18) + ' 228 ' + (x + 18) + ' 206 ' + (x + 12) + ' 190Z', skin, INK, 2.2) +
    P('M' + (x - 16) + ' 276 l-8 6 l9 -1Z M' + (x - 4) + ' 277 l-1 8 l5 -6Z M' + (x + 7) + ' 276 l6 6 l-1 -8Z', '#e8e0c8', INK, 0.9); };
  out += leg(204);
  /* body */
  out += P('M134 150 C136 118 178 108 208 130 C230 146 230 192 208 212 C188 226 156 224 142 202 C132 188 132 166 134 150Z', skin, INK, 2.4);
  out += P('M144 150 C146 180 162 208 192 212 C176 206 166 186 164 160Z', belly, INK, 1.2) + P('M146 162 L162 160 M149 176 L167 174 M156 190 L174 190 M166 202 L184 204', 'none', shade(belly, -0.35), 1);
  /* front wing (raised, behind neck) */
  out += P('M172 128 L120 22 L72 30 Q98 50 78 72 Q110 74 98 102 Q126 94 128 126 Q148 116 158 140Z', mem, INK, 2.4) +
    P('M172 128 L120 22 L72 30 M120 22 L78 72 M120 22 L98 102 M120 22 L128 126', 'none', '#1e4a2a', 2.6) + P('M172 128 L120 22', 'none', shade(gc, 0.5), 1.2) + P('M120 22 L112 8 L126 18Z', '#e8e0c8', INK, 1);
  out += leg(176);
  /* neck */
  out += P('M164 150 C140 124 118 116 100 112 L90 134 C108 140 124 154 138 176Z', skin, INK, 2.2);
  out += P('M100 124 C114 130 126 142 138 160', 'none', belly, 5);
  out += P('M112 110 L118 98 L122 114 M126 116 L134 104 L136 120 M140 126 L150 116 L150 132', '#2a5a30', INK, 1.4);
  /* head (bigger) */
  var head = P('M104 92 C94 82 72 82 52 90 L34 100 L52 104 L40 112 L62 114 C74 120 92 124 106 118 C112 110 112 98 104 92Z', skin, INK, 2) +
    P('M40 112 L62 114 C74 120 92 124 106 118', 'none', INK, 1.4) +
    P('M44 104 L48 109 L52 104 L56 110 L60 104 M44 101 L48 97 L52 101', '#fff', INK, 0.7) +
    P('M98 90 L132 70 L108 98Z M92 88 L114 62 L98 92Z', '#e8e0c8', INK, 1.3) +
    G(P('M72 94 L86 92 L80 98Z', '#ffe040'), { filter: d.glow(1.5, 2) }) + C(40, 96, 1.4, INK) +
    P('M82 108 Q92 112 102 108', 'none', shadow(gc, 0.9), 1);
  out += G(head, { transform: 'translate(104 112) scale(1.25) translate(-104 -112)' });
  return out;
};

/* ---------------- DRAGON ---------------- */
MONSTERS.dragon = function (d) {
  var rc = '#c8302a', belly = '#f0c060';
  var skin = d.lin([[0, shade(rc, 0.3)], [0.6, rc], [1, shadow(rc, 0.75)]]);
  var mem = d.lin([[0, '#a02a2a'], [1, '#3a0808']], 0, 0, 1, 1);
  var out = mc_gshadow(160, 282, 120, 10, 0.4);
  /* wings */
  var wingR = P('M196 120 L250 34 L296 20 L286 60 Q270 66 290 90 Q262 92 276 122 Q248 118 256 152 Q232 136 222 162 Z', mem, INK, 2.4) +
    P('M196 120 L250 34 L296 20 M250 34 L290 90 M250 34 L276 122 M250 34 L256 152', 'none', '#3a0808', 2.8) + P('M196 120 L250 34 L296 20', 'none', shade(rc, 0.4), 1.2);
  var wingL = P('M136 118 L84 40 L30 18 L36 56 Q52 64 26 88 Q56 92 36 122 Q66 118 58 152 Q86 136 100 160 Z', mem, INK, 2.4) +
    P('M136 118 L84 40 L30 18 M84 40 L26 88 M84 40 L36 122 M84 40 L58 152', 'none', '#3a0808', 2.8) + P('M136 118 L84 40 L30 18', 'none', shade(rc, 0.4), 1.2);
  out += wingR + wingL;
  /* tail curling in front at bottom */
  out += P('M210 236 C250 246 286 250 280 270 C274 286 220 288 170 284 C210 280 254 276 256 266 C258 258 232 256 206 252Z', skin, INK, 2.2) +
    P('M256 266 L272 254 L276 268Z M232 254 L240 242 L246 256Z', '#7a1010', INK, 1.2);
  /* body */
  out += P('M118 170 C112 130 150 112 186 124 C226 138 236 196 222 236 C210 268 150 274 126 252 C110 236 112 200 118 170Z', skin, INK, 2.6);
  out += P('M140 140 C130 170 132 220 150 256 C170 262 196 256 204 244 C178 220 168 180 172 130Z', d.lin([[0, shade(belly, 0.3)], [1, shade(belly, -0.3)]]), INK, 1.6);
  for (var i = 0; i < 7; i++) out += P('M' + (138 + i * 1) + ' ' + (150 + i * 16) + ' Q' + (156 + i * 2) + ' ' + (156 + i * 16) + ' ' + (174 + i * 3) + ' ' + (146 + i * 16), 'none', shade(belly, -0.45), 1.2);
  /* hind leg */
  out += P('M200 196 C232 200 240 240 226 262 L238 278 L198 280 L202 262 C192 246 188 220 200 196Z', skin, INK, 2.2) + P('M200 280 l-4 -6 M212 280 l-2 -7 M224 280 l0 -7', 'none', '#fff', 2);
  /* front legs */
  var fl = function (x) { return P('M' + (x - 12) + ' 186 C' + (x - 26) + ' 206 ' + (x - 26) + ' 236 ' + (x - 14) + ' 258 C' + (x - 20) + ' 266 ' + (x - 24) + ' 274 ' + (x - 22) + ' 280 L' + (x + 14) + ' 280 C' + (x + 14) + ' 272 ' + (x + 8) + ' 264 ' + (x + 4) + ' 258 C' + (x + 10) + ' 236 ' + (x + 14) + ' 206 ' + (x + 12) + ' 186Z', skin, INK, 2.2) +
    P('M' + (x - 10) + ' 236 Q' + (x - 4) + ' 240 ' + (x + 4) + ' 236 M' + (x - 14) + ' 270 L' + (x - 12) + ' 279 M' + (x - 2) + ' 268 L' + (x - 1) + ' 279 M' + (x + 8) + ' 270 L' + (x + 8) + ' 279', 'none', shadow(rc, 0.9), 1.2) +
    P('M' + (x - 22) + ' 280 l-4 5 l7 -2Z M' + (x - 10) + ' 281 l-2 6 l6 -3Z M' + (x + 2) + ' 281 l0 6 l5 -4Z M' + (x + 13) + ' 280 l4 5 l1 -6Z', '#f8f0e0', INK, 0.8); };
  out += fl(136) + fl(176);
  /* neck */
  out += P('M168 136 C164 108 150 88 128 78 L112 98 C130 106 140 124 140 150Z', skin, INK, 2.4);
  out += P('M136 100 C146 112 150 126 150 144', 'none', belly, 5);
  out += P('M146 82 L156 70 L158 88 L168 80 L168 98 L178 94 L174 112', '#7a1010', INK, 1.4);
  /* head (3/4, facing left) */
  out += P('M138 64 L176 34 L150 70Z M132 58 L156 22 L140 64Z', d.lin([[0, '#fff6e0'], [1, '#8a7050']]), INK, 1.6);
  out += P('M140 62 C134 48 110 46 92 54 L62 66 C56 70 56 78 62 82 L80 86 L66 98 C76 104 96 104 114 100 C132 96 146 84 140 62Z', skin, INK, 2.4);
  /* open jaw w/ fire */
  out += P('M62 82 L80 86 L66 98 Z', '#3a0000', INK, 1.2);
  out += P('M62 82 L66 86 L68 82 L72 86 L74 83 M68 96 L71 92 L74 96', '#fff', INK, 0.8);
  out += G(P('M66 90 C46 92 28 104 8 100 C20 110 34 108 40 114 C24 120 14 130 2 128 C22 140 46 124 70 94Z', d.lin([[0, '#ffffff'], [0.3, '#ffe060'], [0.8, '#ff6010'], [1, '#c01000', 0.3]], 1, 0, 0, 0)), { filter: d.glow(4, 2), opacity: 0.95 });
  out += P('M96 56 Q112 52 124 60', 'none', '#7a1010', 2);
  out += G(P('M100 62 L116 62 L108 68Z', '#ffe860'), { filter: d.glow(1.6, 3) }) + P('M106 62 L108 67', 'none', INK, 1.4);
  out += C(68, 70, 1.6, INK) + P('M120 50 L126 42 L128 54 L134 46 L136 58', 'none', INK, 1.4);
  out += P('M118 84 Q126 92 136 88', 'none', shadow(rc, 0.9), 1.4);
  return out;
};

/* shared with the other art files */
A.mc_face = mc_face; A.mc_bangs = mc_bangs; A.mc_torsoF = mc_torsoF; A.mc_gshadow = mc_gshadow; A.mc_limb = mc_limb; A.mc_skinFill = mc_skinFill;
A.mc_metal = mc_metal;
})();
