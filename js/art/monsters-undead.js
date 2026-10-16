/* Velmoor art: Monster sprites (300x300), group B: undead, constructs (golem, gargoyle, statue), giants and the basilisk,
 * with their shared mb_* helpers.
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
/* Monsters group B: undead, constructs, giants, basilisk              */
/* ------------------------------------------------------------------ */
/* capsule segment from (x1,y1) radius r1 to (x2,y2) radius r2 */
function mb_seg(x1, y1, r1, x2, y2, r2) {
  var dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
  return 'M' + f(x1 + nx * r1) + ' ' + f(y1 + ny * r1) + ' L' + f(x2 + nx * r2) + ' ' + f(y2 + ny * r2) +
    ' A' + f(r2) + ' ' + f(r2) + ' 0 0 0 ' + f(x2 - nx * r2) + ' ' + f(y2 - ny * r2) +
    ' L' + f(x1 - nx * r1) + ' ' + f(y1 - ny * r1) + ' A' + f(r1) + ' ' + f(r1) + ' 0 0 0 ' + f(x1 + nx * r1) + ' ' + f(y1 + ny * r1) + 'Z';
}
function mb_limb(pts, radii, fill, sw) {
  var s = '';
  for (var i = 0; i + 1 < pts.length; i++) s += P(mb_seg(pts[i][0], pts[i][1], radii[i], pts[i + 1][0], pts[i + 1][1], radii[i + 1]), fill, INK, sw == null ? 2.5 : sw);
  return s;
}
function mb_ground(d, cx, cy, rx) { return E(cx, cy, rx, rx * 0.17, d.rad([[0, '#000', 0.6], [0.6, '#000', 0.28], [1, '#000', 0]])); }
function mb_eye(gl, x, y, r, col) {
  return C(x, y, r * 2.4, col, { opacity: 0.35, filter: gl }) + C(x, y, r, col, { filter: gl }) + C(x - r * 0.2, y - r * 0.25, r * 0.42, '#fff');
}
/* horizontal cel gradient: light left, shadow right */
function mb_gh(d, c) { return d.lin([[0, shade(c, 0.28)], [0.42, c], [0.62, c], [1, shadow(c, 1.2)]], 0, 0, 1, 0); }
function mb_gv(d, c) { return d.lin([[0, shade(c, 0.25)], [0.5, c], [1, shadow(c, 1.2)]]); }
/* claws/fingers fanning from (x,y) in direction ang (deg) */
function mb_claws(x, y, ang, len, col, n, spread, w) {
  var s = ''; n = n || 3; spread = spread || 22; w = w || 3;
  for (var i = 0; i < n; i++) {
    var a = (ang + (i - (n - 1) / 2) * spread) * Math.PI / 180;
    var x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    var xm = x + Math.cos(a - 0.25) * len * 0.6, ym = y + Math.sin(a - 0.25) * len * 0.6;
    s += P('M' + f(x) + ' ' + f(y) + ' Q' + f(xm) + ' ' + f(ym) + ' ' + f(x2) + ' ' + f(y2), 'none', INK, w + 3) +
      P('M' + f(x) + ' ' + f(y) + ' Q' + f(xm) + ' ' + f(ym) + ' ' + f(x2) + ' ' + f(y2), 'none', col, w);
  }
  return s;
}
/* faceted crystal pointing up in local coords, rotated */
function mb_crystal(x, y, len, w, ang, fillA, fillB) {
  var body = P('M' + f(-w) + ' 0 L' + f(-w * 0.7) + ' ' + f(-len * 0.75) + ' L0 ' + f(-len) + ' L' + f(w * 0.7) + ' ' + f(-len * 0.75) + ' L' + f(w) + ' 0 L0 ' + f(w * 0.6) + 'Z', fillA, '#0b2a4a', 1.6) +
    P('M0 ' + f(w * 0.6) + ' L0 ' + f(-len) + ' L' + f(w * 0.7) + ' ' + f(-len * 0.75) + ' L' + f(w) + ' 0Z', fillB, null, null, { opacity: 0.85 }) +
    P('M' + f(-w * 0.45) + ' ' + f(-len * 0.1) + ' L' + f(-w * 0.35) + ' ' + f(-len * 0.7), 'none', '#ffffff', 1.4, { opacity: 0.8 });
  return T(body, x, y, 1, ang);
}

/* ---------------- skeleton ---------------- */
MONSTERS.skeleton = function (d) {
  var bone = '#efe6cc', bg = mb_gh(d, bone), gl = d.glow(2.5, 2);
  function b(x1, y1, x2, y2, w) {
    return P(mb_seg(x1, y1, w, x2, y2, w * 0.8), bg, INK, 2) + C(x1, y1, w * 1.15, bone, { stroke: INK, 'stroke-width': 2 }) + C(x2, y2, w * 0.95, bone, { stroke: INK, 'stroke-width': 2 });
  }
  var s = mb_ground(d, 150, 280, 78);
  // tattered cloth sash behind
  s += P('M128 176 L120 236 L130 228 L134 246 L142 226 L150 238 L156 200 L172 184Z', '#5a2230', INK, 2);
  // legs
  s += b(140, 192, 128, 232, 6.5) + b(128, 232, 122, 268, 5.5) + b(162, 192, 178, 232, 6.5) + b(178, 232, 186, 268, 5.5);
  s += P('M106 278 C106 268 118 264 130 268 L134 278Z', bone, INK, 2) + P('M178 268 C190 264 200 270 200 278 L176 278Z', bone, INK, 2);
  // pelvis
  s += P('M128 180 C124 198 140 206 150 200 C160 206 176 198 172 180 C160 190 140 190 128 180Z', bg, INK, 2.5) + E(140, 192, 4, 3, '#3a2e2a') + E(160, 192, 4, 3, '#3a2e2a');
  // spine
  for (var y = 110; y < 184; y += 9) s += R(145, y, 10, 7, bone, { rx: 3, stroke: INK, 'stroke-width': 1.6 });
  // ribs
  var ribs = '';
  for (var i = 0; i < 5; i++) {
    var ry = 120 + i * 10, w = 27 - i * 2.5;
    var dd = 'M153 ' + ry + ' C' + (153 + w) + ' ' + (ry - 6) + ' ' + (153 + w + 7) + ' ' + (ry + 9) + ' ' + (153 + w - 4) + ' ' + (ry + 15);
    ribs += P(dd, 'none', INK, 7) + P(dd, 'none', bone, 3.6);
  }
  s += ribs + M(ribs, 150);
  s += P('M146 116 L154 116 L153 160 L147 160Z', bone, INK, 1.6);
  // collarbones
  s += b(150, 113, 116, 117, 4.5) + b(150, 113, 184, 117, 4.5);
  // sword arm (viewer left): raised
  s += b(116, 117, 96, 152, 5.5) + b(96, 152, 84, 122, 5);
  var sword = P('M-5 -14 L-5 -96 L0 -110 L5 -96 L5 -14Z', d.lin([[0, '#c9d2dc'], [0.5, '#8a96a3'], [1, '#56606c']], 0, 0, 1, 0), INK, 2) +
    P('M0 -16 L0 -100', 'none', '#eef4ff', 1.2) + P('M-3 -40 L2 -46 L-1 -55 L3 -60', 'none', '#6b4a2a', 1.4, { opacity: 0.7 }) +
    R(-17, -18, 34, 6, '#7a5a3a', { rx: 2, stroke: INK, 'stroke-width': 2 }) + R(-3.5, -12, 7, 20, '#4a3020', { stroke: INK, 'stroke-width': 1.8 }) + C(0, 10, 4.5, '#7a5a3a', { stroke: INK, 'stroke-width': 1.8 });
  s += T(sword, 84, 124, 1, -28);
  s += C(84, 122, 7, bone, { stroke: INK, 'stroke-width': 2 }) + P('M78 118 L90 118 M78 123 L90 123', 'none', INK, 1.2);
  // shield arm
  s += b(184, 117, 204, 152, 5.5) + b(204, 152, 200, 182, 5);
  s += C(206, 176, 33, d.rad([[0, '#8a6038'], [0.8, '#5b3a20'], [1, '#3a2412']], 0.4, 0.35, 0.7), { stroke: INK, 'stroke-width': 3 }) +
    C(206, 176, 29, 'none', { stroke: '#8a8f99', 'stroke-width': 4 }) + C(206, 176, 29, 'none', { stroke: INK, 'stroke-width': 1 }) +
    P('M182 168 L230 168 M182 186 L230 186', 'none', '#3a2412', 1.5) + C(206, 176, 8, d.rad([[0, '#dfe6ee'], [1, '#6f7884']], 0.35, 0.3, 0.7), { stroke: INK, 'stroke-width': 2 }) +
    P('M220 150 L212 162 L218 170 L210 182', 'none', INK, 1.8) + P('M184 160 C186 152 192 147 198 145', 'none', '#fff', 2, { opacity: 0.35 });
  // skull
  s += P('M124 70 C122 40 178 40 176 70 C176 84 170 90 167 96 L133 96 C130 90 124 84 124 70Z', d.rad([[0, '#fffaea'], [0.7, bone], [1, '#b8a98a']], 0.38, 0.3, 0.75), INK, 2.5);
  s += P('M130 50 C138 44 150 42 160 44', 'none', '#fff', 3, { opacity: 0.8 });
  s += P('M128 74 C128 64 148 64 147 76 C146 84 132 86 128 74Z', '#1a1018') + P('M172 74 C172 64 152 64 153 76 C154 84 168 86 172 74Z', '#1a1018');
  s += mb_eye(gl, 139, 75, 3.5, '#6ff6ff') + mb_eye(gl, 161, 75, 3.5, '#6ff6ff');
  s += P('M150 80 L146 89 L154 89Z', '#1a1018');
  s += P('M136 94 L164 94 L162 108 C156 112 144 112 138 108Z', bone, INK, 2) + P('M138 99 L162 99 M143 94 L143 104 M149 94 L149 105 M155 94 L155 105', 'none', INK, 1.3);
  s += P('M132 58 L140 64 L137 70', 'none', INK, 1.3);
  return s;
};

/* ---------------- zombie ---------------- */
MONSTERS.zombie = function (d) {
  var sk = '#9db58a', sg = mb_gh(d, sk), gl = d.glow(2.5, 2);
  var s = mb_ground(d, 150, 278, 70);
  // legs
  s += P(mb_seg(136, 188, 14, 128, 246, 10), mb_gh(d, '#4a3f36'), INK, 2.5) + P(mb_seg(166, 188, 14, 176, 246, 10), mb_gh(d, '#4a3f36'), INK, 2.5);
  s += P('M116 242 L122 252 L128 244 L134 254 L140 244Z', '#4a3f36', INK, 2) + P('M164 244 L170 254 L176 244 L182 252 L188 242Z', '#4a3f36', INK, 2);
  s += P(mb_seg(128, 248, 8, 124, 270, 7), sg, INK, 2) + P(mb_seg(176, 248, 8, 182, 270, 7), sg, INK, 2);
  s += E(116, 274, 15, 6, '#3a3230', { stroke: INK, 'stroke-width': 2 }) + E(190, 274, 15, 6, '#3a3230', { stroke: INK, 'stroke-width': 2 });
  // arms back segments (upper)
  var shirt = mb_gh(d, '#5d5c78');
  s += P(mb_seg(118, 116, 13, 82, 142, 10), shirt, INK, 2.5) + P(mb_seg(182, 116, 13, 220, 138, 10), shirt, INK, 2.5);
  s += P('M74 132 L80 150 L88 140 L92 152Z', '#5d5c78', INK, 1.5);
  // torso
  s += P('M112 106 C104 140 108 172 114 198 L122 190 L130 201 L140 190 L150 202 L160 191 L170 200 L178 190 L188 198 C194 172 196 140 188 106 C170 94 130 94 112 106Z', shirt, INK, 2.5);
  s += P('M150 100 L146 140 M128 120 L136 126', 'none', '#3a3950', 1.5);
  // wound with ribs
  s += P('M150 134 L170 126 L178 148 L168 170 L150 162 L156 148Z', '#6a2a2e', INK, 2) + P('M156 140 Q166 136 174 142 M154 150 Q164 146 174 152 M156 160 Q164 156 170 162', 'none', '#e8dcc0', 2.2);
  // belt rope
  s += P('M114 186 Q150 194 186 186', 'none', '#6b5530', 4);
  // forearms + hands
  s += P(mb_seg(82, 142, 9, 64, 108, 7), sg, INK, 2.5) + P(mb_seg(220, 138, 9, 244, 104, 7), sg, INK, 2.5);
  s += C(64, 106, 9, sk, { stroke: INK, 'stroke-width': 2 }) + C(244, 102, 9, sk, { stroke: INK, 'stroke-width': 2 });
  s += mb_claws(62, 100, -100, 18, sk, 4, 20, 3.2) + mb_claws(246, 96, -80, 18, sk, 4, 20, 3.2);
  // neck
  s += P('M140 84 L160 84 L162 106 L138 106Z', sg, INK, 2);
  // head (tilted)
  var h = P('M124 62 C122 34 178 34 176 62 C177 82 168 98 150 100 C132 98 123 82 124 62Z', d.rad([[0, shade(sk, 0.2)], [0.7, sk], [1, shadow(sk, 1)]], 0.4, 0.35, 0.75), INK, 2.5);
  h += P('M126 54 C128 34 172 30 176 54 L170 48 L166 58 L160 44 L152 56 L146 42 L138 56 L132 46Z', '#2c2a22', INK, 2);
  h += P('M134 56 L128 76 M170 50 L176 72', 'none', '#2c2a22', 2);
  h += E(138, 70, 9, 8, '#1d1a1a') + E(162, 70, 8, 7, '#1d1a1a');
  h += mb_eye(gl, 138, 70, 3.8, '#e8ff5a') + C(162, 71, 1.6, '#c9c9a0');
  h += P('M128 62 L146 66 M154 64 L172 60', 'none', INK, 2.2);
  h += P('M136 84 C142 80 160 80 166 86 C162 96 140 96 136 84Z', '#2a0e12', INK, 1.8) + P('M140 84 L143 89 L146 84 L149 89 L152 84 L155 89 L158 84 L161 88', 'none', '#e8dcb8', 1.4);
  h += P('M164 40 L170 52 M166 46 L172 44 M168 50 L174 48', 'none', INK, 1.3);
  s += G(h, { transform: 'rotate(-12 150 84)' });
  return s;
};

/* ---------------- ghoul ---------------- */
MONSTERS.ghoul = function (d) {
  var sk = '#a9b2bc', sg = mb_gh(d, sk), gl = d.glow(2.5, 2);
  var s = mb_ground(d, 150, 276, 92);
  // legs crouched
  s += mb_limb([[130, 200], [92, 196], [108, 266]], [16, 12, 8], sg) + mb_limb([[170, 200], [208, 196], [192, 266]], [16, 12, 8], sg);
  s += mb_claws(104, 268, 170, 14, '#d8d0c0', 3, 22, 2.5) + mb_claws(196, 268, 10, 14, '#d8d0c0', 3, 22, 2.5);
  // torso
  s += P('M108 126 C96 168 118 216 150 216 C182 216 204 168 192 126 C176 106 124 106 108 126Z', d.rad([[0, shade(sk, 0.2)], [0.6, sk], [1, shadow(sk, 1.2)]], 0.4, 0.3, 0.8), INK, 2.5);
  for (var i = 0; i < 4; i++) { var y = 150 + i * 12; s += P('M' + (124 + i * 2) + ' ' + y + ' Q138 ' + (y - 6) + ' 146 ' + (y + 2) + ' M' + (176 - i * 2) + ' ' + y + ' Q162 ' + (y - 6) + ' 154 ' + (y + 2), 'none', shadow(sk, 1.3), 2); }
  // loin rag
  s += P('M126 200 L174 200 L170 230 L162 222 L156 236 L148 222 L140 234 L134 222 L128 230Z', '#4b4036', INK, 2);
  // arms long to ground
  s += mb_limb([[112, 134], [70, 178], [78, 258]], [14, 10, 8], sg) + mb_limb([[188, 134], [230, 178], [222, 258]], [14, 10, 8], sg);
  s += mb_claws(78, 262, 120, 22, '#e8e0d0', 4, 18, 3) + mb_claws(222, 262, 60, 22, '#e8e0d0', 4, 18, 3);
  // head low
  s += P('M100 100 L126 112 L120 122Z', sg, INK, 2) + P('M200 100 L174 112 L180 122Z', sg, INK, 2);
  s += P('M122 118 C118 84 182 84 178 118 C178 140 168 156 150 158 C132 156 122 140 122 118Z', d.rad([[0, shade(sk, 0.25)], [0.7, sk], [1, shadow(sk, 1)]], 0.4, 0.3, 0.8), INK, 2.5);
  s += P('M126 108 L146 116 L130 120Z', '#1a1418') + P('M174 108 L154 116 L170 120Z', '#1a1418');
  s += mb_eye(gl, 137, 115, 3.2, '#ffd23a') + mb_eye(gl, 163, 115, 3.2, '#ffd23a');
  s += P('M122 104 L146 112 M178 104 L154 112', 'none', INK, 2.5);
  s += P('M128 132 C138 154 162 154 172 132 C160 138 140 138 128 132Z', '#4a0c14', INK, 2);
  s += P('M130 133 L134 141 L138 135 L142 144 L146 136 L150 145 L154 136 L158 144 L162 135 L166 141 L170 133', '#f2ead8', INK, 1);
  s += P('M136 147 L140 141 L144 148 L150 142 L156 148 L160 141 L164 147', '#f2ead8', INK, 1);
  s += P('M150 120 L147 128 L153 128Z', shadow(sk, 1.2));
  return s;
};

/* ---------------- wraith ---------------- */
MONSTERS.wraith = function (d) {
  var gl = d.glow(3, 2), green = '#7dffb8';
  var s = E(150, 150, 120, 135, d.rad([[0, '#2fff9a', 0.28], [0.6, '#1a8a6a', 0.12], [1, '#000', 0]]));
  s += E(150, 284, 60, 8, d.rad([[0, '#5cffc0', 0.35], [1, '#5cffc0', 0]]));
  // scythe behind
  s += P('M238 40 L210 270', 'none', INK, 8) + P('M238 40 L210 270', 'none', '#3b2a22', 4.5);
  s += P('M240 44 C200 14 140 22 104 62 C150 40 196 42 236 66Z', d.lin([[0, '#e8f6ff'], [1, '#6c7d90']]), INK, 2.5, { filter: d.glow(2) });
  s += P('M232 52 C196 34 150 36 118 56', 'none', '#fff', 1.5, { opacity: 0.8 });
  // cloak
  var cg = d.lin([[0, '#3a2c56'], [0.55, '#191226'], [1, '#0a0812', 0.15]]);
  s += P('M150 28 C120 28 104 58 102 92 C80 110 66 150 70 190 C72 220 80 240 74 266 L94 246 L102 272 L118 248 L130 280 L146 250 L160 282 L172 250 L188 274 L198 246 L214 266 L222 238 C220 208 232 168 226 128 C220 104 204 96 198 88 C196 54 180 28 150 28Z', cg, INK, 2.5);
  s += P('M118 104 C110 150 112 200 116 246 M150 112 L148 250 M182 104 C190 150 190 200 186 244', 'none', '#4a3a70', 2, { opacity: 0.6 });
  s += P('M126 44 C114 60 112 80 114 96', 'none', '#6a58a0', 2.5, { opacity: 0.7 });
  // sleeves
  s += P('M108 98 C90 110 70 130 54 158 C66 166 82 164 92 156 C100 140 112 126 118 116Z', cg, INK, 2.5);
  s += P('M192 98 C212 110 230 126 244 150 C232 160 216 160 206 152 C198 138 188 126 182 116Z', cg, INK, 2.5);
  // bony hands
  s += mb_claws(64, 158, 150, 22, '#d8e8e0', 4, 18, 2.6) + mb_claws(226, 156, -60, 18, '#d8e8e0', 3, 22, 2.6);
  // hood void
  s += P('M150 46 C128 46 116 70 120 100 C132 114 168 114 180 100 C184 70 172 46 150 46Z', d.rad([[0, '#0a3a2a'], [0.6, '#03100c'], [1, '#000']], 0.5, 0.6, 0.6), INK, 2);
  s += mb_eye(gl, 138, 82, 4, green) + mb_eye(gl, 162, 82, 4, green);
  // wisps
  s += P('M84 230 C60 240 52 220 40 230 M220 230 C246 238 252 214 266 222 M120 268 C112 286 100 282 92 292', 'none', '#7affc0', 2, { opacity: 0.4, filter: gl });
  return s;
};

/* ---------------- ghost ---------------- */
MONSTERS.ghost = function (d) {
  var gl = d.glow(4, 2);
  var body = d.lin([[0, '#f2ffff', 0.95], [0.6, '#a8e6ff', 0.75], [1, '#5ab4ff', 0]]);
  var s = E(150, 286, 50, 7, d.rad([[0, '#8ae0ff', 0.35], [1, '#8ae0ff', 0]]));
  s += E(150, 140, 110, 120, d.rad([[0, '#8ae0ff', 0.25], [1, '#8ae0ff', 0]]));
  // flowing hair behind
  s += P('M150 34 C104 30 88 70 86 110 C80 150 60 170 44 176 C70 182 92 170 102 150 C100 184 84 206 70 214 C100 214 116 190 120 170 L180 170 C184 190 200 214 230 214 C216 206 200 184 198 150 C208 170 230 182 256 176 C240 170 220 150 214 110 C212 70 196 30 150 34Z', d.lin([[0, '#dff6ff', 0.9], [1, '#7ac8ff', 0.2]]), '#3a6a9a', 1.5, { filter: gl });
  // body
  s += P('M150 46 C120 46 108 72 110 104 C112 140 106 170 116 198 C126 224 140 240 150 276 C158 250 168 236 180 214 C194 186 188 140 190 104 C192 72 180 46 150 46Z', body, '#3a6a9a', 2, { filter: gl });
  // arms reaching
  s += P('M116 112 C96 112 70 100 50 82 C58 100 68 110 76 114 C66 118 56 116 46 112 C66 132 96 130 118 128Z', body, '#3a6a9a', 1.8);
  s += P('M184 112 C204 112 230 100 250 82 C242 100 232 110 224 114 C234 118 244 116 254 112 C234 132 204 130 182 128Z', body, '#3a6a9a', 1.8);
  // chains
  var ch = '';
  for (var i = 0; i < 5; i++) ch += E(62 + i * 2, 122 + i * 9, 3, 5, 'none', { stroke: '#5f6f86', 'stroke-width': 2.2 });
  s += ch + M(ch, 150) + R(52, 108, 18, 9, '#5f6f86', { rx: 2, stroke: INK, 'stroke-width': 1.5, transform: 'rotate(-20 61 112)' }) + R(230, 108, 18, 9, '#5f6f86', { rx: 2, stroke: INK, 'stroke-width': 1.5, transform: 'rotate(20 239 112)' });
  // face
  s += P('M130 82 C130 72 146 72 146 86 C146 98 132 98 130 82Z', '#0c1a30') + P('M170 82 C170 72 154 72 154 86 C154 98 168 98 170 82Z', '#0c1a30');
  s += C(139, 84, 2.2, '#e8ffff', { filter: gl }) + C(161, 84, 2.2, '#e8ffff', { filter: gl });
  s += P('M128 72 L146 78 M172 72 L154 78', 'none', '#3a6a9a', 1.8);
  s += E(150, 114, 9, 14, '#0c1a30') + E(150, 118, 5, 7, '#28466a');
  s += P('M128 56 C134 50 146 48 156 50', 'none', '#fff', 3, { opacity: 0.8 });
  // spectral wisps
  s += P('M150 276 C140 290 160 296 168 286 M110 210 C96 230 84 228 76 240 M190 210 C206 230 218 226 226 238', 'none', '#bff4ff', 2, { opacity: 0.5, filter: gl });
  return s;
};

/* ---------------- lich ---------------- */
MONSTERS.lich = function (d) {
  var gl = d.glow(3, 2), bone = '#e8dfc4', gc = '#7dff6a';
  var s = E(150, 150, 120, 140, d.rad([[0, '#6aff4a', 0.22], [0.6, '#2a8a3a', 0.1], [1, '#000', 0]]));
  s += mb_ground(d, 150, 280, 84);
  // staff
  s += P('M222 44 L228 280', 'none', INK, 9) + P('M222 44 L228 280', 'none', '#4a3226', 5) + P('M220 60 L222 120', 'none', '#7a5a40', 1.5);
  s += P('M208 50 C206 30 214 20 222 16 C232 22 238 32 236 50 L230 44 L226 54 L222 42 L216 54Z', '#2a2236', INK, 2);
  s += C(222, 36, 9, d.rad([[0, '#fff'], [0.35, gc], [1, '#1a6a1a']]), { stroke: INK, 'stroke-width': 1.5, filter: gl });
  // collar behind
  s += P('M96 116 L86 58 L116 94 L126 46 L150 84 L174 46 L184 94 L214 58 L204 116Z', d.lin([[0, '#5a2a7a'], [1, '#1e0c2e']]), INK, 2.5);
  // robe
  var rg = mb_gh(d, '#4b2a6e');
  s += P('M110 108 C96 150 86 220 70 280 L230 280 C214 220 204 150 190 108 C176 96 124 96 110 108Z', rg, INK, 2.5);
  s += P('M70 280 L84 268 L92 282 L104 270 L114 282 L128 270 L140 282 L160 270 L172 282 L186 270 L198 282 L212 268 L230 280Z', '#2a1440', INK, 2);
  s += P('M142 112 L134 280 L166 280 L158 112Z', d.lin([[0, '#f2d27a'], [1, '#9a6a2a']], 0, 0, 1, 0), INK, 1.8);
  for (var i = 0; i < 5; i++) s += P(starPts(150, 140 + i * 28, 5, 2, 4), '#4b2a6e', null, null, { opacity: 0.8 });
  s += P('M110 182 Q150 192 190 182 L190 192 Q150 202 110 192Z', '#2a1440', INK, 2) + C(150, 192, 6, gc, { stroke: INK, 'stroke-width': 1.5, filter: gl });
  // sleeves
  s += P('M112 112 C96 124 80 140 66 160 C76 170 92 170 100 162 C108 148 118 136 122 126Z', rg, INK, 2.5);
  s += P('M188 112 C204 124 216 136 228 150 C222 162 208 166 200 160 C192 148 184 136 180 126Z', rg, INK, 2.5);
  // hands
  s += mb_claws(78, 156, -110, 20, bone, 4, 16, 2.6) + mb_claws(222, 154, 180, 12, bone, 3, 30, 2.6);
  // orb of necromancy
  s += C(70, 116, 20, '#7dff6a', { opacity: 0.25, filter: d.blur(6) }) + C(70, 116, 13, d.rad([[0, '#fff'], [0.3, '#c8ff9a'], [0.8, gc], [1, '#1a7a2a']]), { filter: gl });
  s += P('M60 104 C68 98 80 102 82 110 M58 124 C66 132 78 130 84 122', 'none', '#eaffd8', 1.4, { opacity: 0.8 });
  // skull
  s += P('M126 84 C124 54 176 54 174 84 C174 96 168 102 166 108 L134 108 C132 102 126 96 126 84Z', d.rad([[0, '#fff8e0'], [0.7, bone], [1, '#a0926e']], 0.4, 0.3, 0.75), INK, 2.5);
  s += P('M129 86 C129 76 148 76 147 88 C146 95 132 96 129 86Z', '#120a10') + P('M171 86 C171 76 152 76 153 88 C154 95 168 96 171 86Z', '#120a10');
  s += mb_eye(gl, 139, 87, 3.6, gc) + mb_eye(gl, 161, 87, 3.6, gc);
  s += P('M150 92 L146 100 L154 100Z', '#120a10') + P('M137 106 L163 106 L161 118 C155 122 145 122 139 118Z', bone, INK, 2) + P('M139 111 L161 111 M144 106 L144 116 M150 106 L150 118 M156 106 L156 116', 'none', INK, 1.2);
  // crown
  s += P('M124 70 L122 42 L134 58 L140 34 L150 54 L160 34 L166 58 L178 42 L176 70 C160 64 140 64 124 70Z', d.lin([[0, '#ffe9a0'], [0.5, '#e0a83a'], [1, '#8a5a1a']]), INK, 2);
  s += C(150, 62, 4, '#ff3a6a', { stroke: INK, 'stroke-width': 1.2 }) + C(134, 64, 2.5, gc) + C(166, 64, 2.5, gc);
  return s;
};

/* ---------------- gargoyle ---------------- */
MONSTERS.gargoyle = function (d) {
  var st = '#8c919c', sg = mb_gh(d, st), gl = d.glow(2.5, 2), dk = shadow(st, 1.2);
  var s = mb_ground(d, 150, 282, 80);
  // pedestal
  s += R(98, 240, 104, 40, mb_gh(d, '#6b6e78'), { stroke: INK, 'stroke-width': 2.5 }) + R(86, 230, 128, 14, mb_gv(d, '#7c808a'), { stroke: INK, 'stroke-width': 2.5, rx: 2 });
  s += P('M110 252 L124 252 M150 262 L170 262 M182 248 L190 270', 'none', '#4a4c55', 1.5);
  // wings
  var wing = P('M128 128 C104 92 72 52 28 38 C40 66 18 86 20 108 C38 104 50 118 46 140 C62 130 80 140 82 160 C96 150 110 156 116 172Z', d.lin([[0, '#6e7380'], [1, '#3a3d48']], 1, 0, 0, 1), INK, 2.5) +
    P('M128 128 L28 38 M120 140 L20 108 M118 152 L46 140 M118 162 L82 160', 'none', '#2c2e36', 2) + P('M28 38 L22 28 L34 36', '#6e7380', INK, 2);
  s += wing + M(wing, 150);
  // tail
  s += P('M176 214 C220 230 240 200 232 178 C228 168 220 172 224 182 C230 200 214 218 178 204Z', sg, INK, 2.2) + P('M228 172 L240 162 L236 178Z', st, INK, 2);
  // legs crouched
  s += mb_limb([[132, 200], [104, 196], [114, 232]], [17, 13, 9], sg) + mb_limb([[168, 200], [196, 196], [186, 232]], [17, 13, 9], sg);
  s += mb_claws(112, 232, 120, 12, '#d8d4cc', 3, 30, 2.5) + mb_claws(188, 232, 60, 12, '#d8d4cc', 3, 30, 2.5);
  // torso
  s += P('M116 118 C104 150 110 190 128 212 L172 212 C190 190 196 150 184 118 C170 104 130 104 116 118Z', d.rad([[0, shade(st, 0.25)], [0.7, st], [1, dk]], 0.4, 0.3, 0.8), INK, 2.5);
  s += P('M150 132 L150 196 M130 136 Q140 146 150 140 Q160 146 170 136 M134 166 L166 166 M136 182 L164 182', 'none', dk, 2);
  // arms gripping
  s += mb_limb([[120, 126], [104, 170], [132, 228]], [12, 10, 8], sg) + mb_limb([[180, 126], [196, 170], [168, 228]], [12, 10, 8], sg);
  s += mb_claws(132, 230, 100, 10, '#d8d4cc', 3, 26, 2.5) + mb_claws(168, 230, 80, 10, '#d8d4cc', 3, 26, 2.5);
  // horns
  s += P('M128 88 C116 66 112 48 122 30 C124 50 132 64 140 78Z', d.lin([[0, '#efe6d0'], [1, '#7a6a52']]), INK, 2) + P('M172 88 C184 66 188 48 178 30 C176 50 168 64 160 78Z', d.lin([[0, '#efe6d0'], [1, '#7a6a52']]), INK, 2);
  // head
  s += P('M124 100 C120 74 180 74 176 100 C176 114 170 122 166 130 L134 130 C130 122 124 114 124 100Z', d.rad([[0, shade(st, 0.3)], [0.7, st], [1, dk]], 0.4, 0.3, 0.8), INK, 2.5);
  s += P('M114 92 L126 96 L124 106Z M186 92 L174 96 L176 106Z', st, INK, 2);
  s += P('M128 96 L148 102 L132 106Z', '#1a1418') + P('M172 96 L152 102 L168 106Z', '#1a1418');
  s += mb_eye(gl, 138, 102, 3.4, '#ffa22a') + mb_eye(gl, 162, 102, 3.4, '#ffa22a');
  s += P('M124 90 L148 99 M176 90 L152 99', 'none', INK, 3);
  s += P('M134 116 C142 128 158 128 166 116 L162 132 L138 132Z', '#2a1018', INK, 2) + P('M138 118 L140 126 L143 119 M162 118 L160 126 L157 119', '#f0ead8', INK, 1);
  s += P('M144 108 L150 112 L156 108', 'none', INK, 1.6);
  s += P('M132 82 C140 78 150 77 160 78', 'none', '#cfd4dc', 2.5, { opacity: 0.8 });
  return s;
};

/* ---------------- golem ---------------- */
MONSTERS.golem = function (d) {
  var st = '#8a7d6c', sg = mb_gh(d, st), gl = d.glow(3, 2), rune = '#5ff2ff', dk = shadow(st, 1.2);
  var s = mb_ground(d, 150, 280, 104);
  // legs
  s += P('M108 200 L144 200 L146 270 C140 278 112 278 104 270Z', sg, INK, 3) + P('M156 200 L192 200 L196 270 C188 278 160 278 154 270Z', sg, INK, 3);
  s += P('M110 236 L142 238 M158 238 L192 236', 'none', dk, 2);
  // torso
  s += P('M82 96 C66 132 78 190 100 216 L200 216 C222 190 234 132 218 96 C190 78 110 78 82 96Z', d.rad([[0, shade(st, 0.25)], [0.65, st], [1, dk]], 0.4, 0.3, 0.8), INK, 3);
  s += P('M100 120 L124 134 L118 160 M200 120 L178 136 L184 160 M112 196 L134 180 L166 182 L190 198', 'none', dk, 2.5);
  // rune core and cracks
  s += P('M150 140 L128 116 L118 96 M150 140 L174 114 L184 96 M150 140 L150 196 M150 172 L130 190 M150 172 L172 192', 'none', rune, 2.4, { filter: gl });
  s += C(150, 140, 18, d.rad([[0, '#ffffff'], [0.35, '#aaf8ff'], [0.8, '#1aa8d0'], [1, '#0a3a5a']]), { stroke: INK, 'stroke-width': 2.5, filter: gl });
  s += P(starPts(150, 140, 10, 4, 4), '#fff', null, null, { opacity: 0.9 });
  // head
  s += P('M126 50 C126 42 174 42 174 50 L178 88 C166 96 134 96 122 88Z', mb_gh(d, '#9a8d7a'), INK, 3);
  s += R(130, 64, 40, 9, '#0a1a22', { rx: 3 }) + R(134, 66, 32, 5, rune, { rx: 2.5, filter: gl });
  s += P('M130 48 L150 46', 'none', '#c8bca8', 2.5);
  // moss
  s += P('M90 92 C100 82 120 82 126 86 C118 90 112 88 106 94 C100 90 96 96 90 92Z M178 84 C190 80 206 84 212 92 C204 90 200 96 194 92 C188 94 184 88 178 84Z', '#5f8a3a', INK, 1.5);
  // arms
  s += C(78, 104, 30, d.rad([[0, shade(st, 0.3)], [0.7, st], [1, dk]], 0.35, 0.3, 0.8), { stroke: INK, 'stroke-width': 3 }) + C(222, 104, 30, d.rad([[0, shade(st, 0.3)], [0.7, st], [1, dk]], 0.35, 0.3, 0.8), { stroke: INK, 'stroke-width': 3 });
  s += P(mb_seg(70, 128, 20, 58, 182, 17), sg, INK, 3) + P(mb_seg(230, 128, 20, 242, 182, 17), sg, INK, 3);
  s += P('M30 196 C28 176 84 172 84 196 L86 236 C80 252 34 252 28 236Z', mb_gh(d, '#968a76'), INK, 3) + P('M270 196 C272 176 216 172 216 196 L214 236 C220 252 266 252 272 236Z', mb_gh(d, '#968a76'), INK, 3);
  s += P('M40 230 L76 230 M42 214 L50 230 M58 214 L60 230 M224 230 L260 230 M240 214 L242 230 M256 214 L250 230', 'none', dk, 2);
  s += P('M52 140 L62 156 L56 170 M248 140 L238 156 L244 170', 'none', rune, 2, { filter: gl });
  s += C(56, 96, 3, rune, { filter: gl }) + C(244, 96, 3, rune, { filter: gl });
  return s;
};

/* ---------------- dark knight ---------------- */
MONSTERS.dark_knight = function (d) {
  var ar = '#2e2d3c', ag = mb_gh(d, ar), gl = d.glow(3, 2), hi = '#8a7ac8', red = '#ff2a3a';
  var s = mb_ground(d, 150, 282, 88);
  // cape
  s += P('M104 98 C84 150 66 220 52 282 L70 268 L84 284 L100 266 L116 282 L150 270 L184 282 L200 266 L216 284 L230 268 L248 282 C234 220 216 150 196 98Z', d.lin([[0, '#6a1020'], [1, '#1a0408']]), INK, 2.5);
  // legs
  s += P(mb_seg(132, 200, 15, 122, 268, 11), ag, INK, 2.5) + P(mb_seg(168, 200, 15, 178, 268, 11), ag, INK, 2.5);
  s += P('M124 230 L114 222 L132 222Z M176 230 L186 222 L168 222Z', '#4a4860', INK, 2) + C(124, 232, 7, ag, { stroke: INK, 'stroke-width': 2 }) + C(176, 232, 7, ag, { stroke: INK, 'stroke-width': 2 });
  s += P('M106 280 L110 264 L134 264 L136 280Z M164 280 L166 264 L190 264 L194 280Z', ag, INK, 2.5);
  // tassets
  s += P('M112 182 L188 182 L196 222 L172 214 L150 226 L128 214 L104 222Z', ag, INK, 2.5) + P('M150 190 L150 222 M120 192 L114 214 M180 192 L186 214', 'none', hi, 1.5, { opacity: 0.6 });
  // torso
  s += P('M110 98 C102 136 110 166 118 188 L182 188 C190 166 198 136 190 98 C170 86 130 86 110 98Z', d.rad([[0, '#5a5878'], [0.6, ar], [1, '#0e0d16']], 0.38, 0.3, 0.8), INK, 2.5);
  s += P('M150 98 L150 184 M120 134 Q150 150 180 134 M124 160 Q150 172 176 160', 'none', hi, 1.6, { opacity: 0.7 });
  s += P('M150 112 L142 124 L150 140 L158 124Z', red, INK, 1.5, { filter: gl });
  // arms to pommel
  s += mb_limb([[106, 116], [104, 158], [138, 172]], [14, 12, 10], ag) + mb_limb([[194, 116], [196, 158], [162, 172]], [14, 12, 10], ag);
  // sword
  s += P('M140 192 L140 268 L150 290 L160 268 L160 192Z', d.lin([[0, '#454a5c'], [0.5, '#a4acc4'], [1, '#2a2d3a']], 0, 0, 1, 0), INK, 2.5);
  s += P('M150 196 L150 278', 'none', '#e0e6ff', 1.2) + P('M146 204 L154 214 L146 224 L154 234 L146 244 L154 254', 'none', red, 1.8, { filter: gl });
  s += P('M106 186 L194 186 L188 196 L112 196Z', d.lin([[0, '#5a5878'], [1, '#1a1922']]), INK, 2.5) + P('M106 186 L96 178 L104 192Z M194 186 L204 178 L196 192Z', '#3a3850', INK, 2);
  s += R(144, 152, 12, 34, '#3a1a24', { stroke: INK, 'stroke-width': 2 }) + C(150, 148, 7, red, { stroke: INK, 'stroke-width': 2, filter: gl });
  s += C(138, 172, 11, ag, { stroke: INK, 'stroke-width': 2.5 }) + C(162, 172, 11, ag, { stroke: INK, 'stroke-width': 2.5 });
  // pauldrons
  var paul = P('M76 124 C70 96 92 82 120 90 L122 120 C108 128 90 132 76 124Z', d.rad([[0, '#6a6890'], [0.6, ar], [1, '#0e0d16']], 0.3, 0.2, 0.9), INK, 2.5) +
    P('M80 110 C92 104 106 102 120 104', 'none', hi, 1.5) + P('M84 96 L66 70 L94 90Z M100 88 L92 62 L110 86Z', '#3a3850', INK, 2);
  s += paul + M(paul, 150);
  // helm with horns
  s += P('M130 64 C114 54 106 36 110 18 C120 34 130 42 140 50Z', d.lin([[0, '#d8ccb0'], [1, '#4a4030']]), INK, 2) + P('M170 64 C186 54 194 36 190 18 C180 34 170 42 160 50Z', d.lin([[0, '#d8ccb0'], [1, '#4a4030']]), INK, 2);
  s += P('M126 76 C124 46 176 46 174 76 L172 98 C162 108 138 108 128 98Z', d.rad([[0, '#6a6890'], [0.6, ar], [1, '#0e0d16']], 0.35, 0.25, 0.8), INK, 2.5);
  s += P('M150 52 L150 104', 'none', hi, 1.5, { opacity: 0.6 });
  s += P('M130 76 L170 76 L168 82 L154 82 L154 98 L146 98 L146 82 L132 82Z', '#05030a');
  s += P('M134 78 L146 79 M154 79 L166 78', 'none', red, 3, { filter: gl }) + C(140, 79, 5, red, { opacity: 0.4, filter: gl }) + C(160, 79, 5, red, { opacity: 0.4, filter: gl });
  return s;
};

/* ---------------- ogre ---------------- */
MONSTERS.ogre = function (d) {
  var sk = '#cfa46a', sg = mb_gh(d, sk), dk = shadow(sk, 1.1);
  var s = mb_ground(d, 150, 280, 100);
  // club behind (right)
  s += P('M222 132 L262 30', 'none', INK, 14) + P('M222 132 L262 30', 'none', '#7a5030', 9);
  s += P('M250 52 C238 26 254 4 274 10 C292 18 290 46 274 64Z', d.rad([[0, '#a4744a'], [1, '#4a2e18']], 0.4, 0.3, 0.8), INK, 3);
  s += P('M256 16 L250 6 L262 12 M282 22 L294 18 L286 30 M286 48 L298 52 L284 58 M254 54 L242 58 L250 46', '#d8d0c0', INK, 1.5);
  // legs
  s += P(mb_seg(122, 214, 22, 116, 262, 17), sg, INK, 3) + P(mb_seg(178, 214, 22, 184, 262, 17), sg, INK, 3);
  s += P('M92 280 C92 264 108 258 128 262 L134 280Z M166 280 L172 262 C192 258 208 264 208 280Z', sg, INK, 2.5);
  // body
  s += P('M90 108 C74 150 82 214 112 232 L188 232 C218 214 226 150 210 108 C182 88 118 88 90 108Z', d.rad([[0, shade(sk, 0.25)], [0.6, sk], [1, dk]], 0.4, 0.3, 0.85), INK, 3);
  s += P('M106 186 C110 222 190 222 194 186 C190 210 110 210 106 186Z', dk, null, null, { opacity: 0.5 });
  s += P('M116 132 Q132 146 148 134 M152 134 Q168 146 184 132', 'none', dk, 2.2) + P('M148 188 Q150 194 152 188', 'none', INK, 2);
  s += P('M112 150 C116 140 126 136 134 138', 'none', '#fff', 3, { opacity: 0.4 });
  // belt and loincloth
  s += P('M96 200 Q150 216 204 200 L204 214 Q150 230 96 214Z', '#5a3a22', INK, 2.5) + C(150, 214, 9, '#e8e0cc', { stroke: INK, 'stroke-width': 2 }) + P('M146 214 L148 218 M152 214 L154 218', 'none', INK, 1.5);
  s += P('M118 222 L182 222 L176 256 L166 248 L158 260 L150 248 L142 262 L134 248 L124 256Z', d.lin([[0, '#8a6a48'], [1, '#4a3420']]), INK, 2.5);
  // arms
  s += mb_limb([[96, 118], [70, 170], [76, 214]], [20, 17, 15], sg) + C(76, 218, 17, sk, { stroke: INK, 'stroke-width': 2.5 }) + P('M66 212 L86 212 M66 222 L86 222', 'none', dk, 1.5);
  s += mb_limb([[204, 118], [240, 150], [226, 116]], [20, 17, 15], sg) + C(226, 116, 15, sk, { stroke: INK, 'stroke-width': 2.5 });
  s += R(64, 176, 24, 12, '#7a5a3a', { stroke: INK, 'stroke-width': 2, rx: 3, transform: 'rotate(8 76 182)' });
  // head
  s += P('M116 82 L104 72 L118 70Z M184 82 L196 72 L182 70Z', sk, INK, 2);
  s += P('M120 72 C118 46 182 46 180 72 C182 92 174 112 150 114 C126 112 118 92 120 72Z', d.rad([[0, shade(sk, 0.25)], [0.7, sk], [1, dk]], 0.4, 0.3, 0.8), INK, 2.5);
  s += P('M146 50 C142 36 152 26 160 30 C154 34 156 42 154 50Z', '#3a2418', INK, 2);
  s += P('M128 68 L148 72 M152 72 L172 66', 'none', INK, 3.5);
  s += E(138, 78, 5, 4, '#fff8e0', { stroke: INK, 'stroke-width': 1.5 }) + E(162, 77, 6, 5, '#fff8e0', { stroke: INK, 'stroke-width': 1.5 });
  s += C(139, 78, 2.2, '#c02a1a') + C(161, 77, 2.6, '#c02a1a');
  s += P('M144 84 C144 92 156 92 156 84', sk, INK, 2);
  s += P('M130 98 C140 108 160 108 170 98 C164 102 136 102 130 98Z', '#3a1418', INK, 2);
  s += P('M134 100 L136 90 L140 101Z M166 100 L164 90 L160 101Z', '#f4ecd8', INK, 1.5);
  return s;
};

/* ---------------- troll ---------------- */
MONSTERS.troll = function (d) {
  var sk = '#6f9c88', sg = mb_gh(d, sk), gl = d.glow(2.5, 2), dk = shadow(sk, 1.2), hair = '#34522a';
  var s = mb_ground(d, 150, 280, 100);
  // legs bent
  s += mb_limb([[132, 196], [108, 232], [120, 268]], [16, 12, 9], sg) + mb_limb([[168, 196], [192, 232], [180, 268]], [16, 12, 9], sg);
  s += P('M100 278 C100 266 116 262 130 268 L132 278Z M168 278 L170 268 C184 262 200 266 200 278Z', sg, INK, 2.2);
  s += mb_claws(102, 274, 180, 8, '#ece0c8', 3, 20, 2) + mb_claws(198, 274, 0, 8, '#ece0c8', 3, 20, 2);
  // torso hunched
  s += P('M104 98 C92 132 108 180 126 204 L174 204 C192 180 208 132 196 98 C178 82 122 82 104 98Z', d.rad([[0, shade(sk, 0.25)], [0.6, sk], [1, dk]], 0.4, 0.3, 0.85), INK, 2.5);
  s += P('M128 124 Q140 134 150 126 Q160 134 172 124 M134 150 L166 150 M136 168 L164 168', 'none', dk, 2);
  s += P('M122 196 L178 196 L174 230 L162 222 L150 236 L138 222 L126 230Z', '#5a4630', INK, 2.2);
  // mane of moss behind head down back
  s += P('M110 60 C96 70 92 96 100 116 C106 104 112 100 118 104 L182 104 C188 100 194 104 200 116 C208 96 204 70 190 60Z', hair, INK, 2);
  // arms
  s += mb_limb([[108, 104], [72, 170], [62, 248]], [15, 11, 9], sg) + C(62, 252, 12, sk, { stroke: INK, 'stroke-width': 2.5 }) + mb_claws(62, 258, 100, 20, '#ece0c8', 4, 18, 2.8);
  s += mb_limb([[192, 104], [236, 140], [254, 86]], [15, 11, 9], sg) + C(254, 82, 12, sk, { stroke: INK, 'stroke-width': 2.5 }) + mb_claws(254, 76, -80, 20, '#ece0c8', 4, 20, 2.8);
  // head
  s += P('M116 74 L86 62 L112 92Z M184 74 L214 62 L188 92Z', sg, INK, 2.2);
  s += P('M118 70 C114 44 186 44 182 70 C182 94 172 112 150 116 C128 112 118 94 118 70Z', d.rad([[0, shade(sk, 0.25)], [0.7, sk], [1, dk]], 0.4, 0.3, 0.8), INK, 2.5);
  s += P('M116 64 C120 40 180 40 184 64 L176 56 L170 66 L162 52 L154 64 L146 52 L138 64 L130 54 L124 66Z', hair, INK, 2);
  s += P('M126 76 L146 80 L132 86Z', '#160c0c') + P('M174 76 L154 80 L168 86Z', '#160c0c');
  s += mb_eye(gl, 137, 81, 3, '#fff04a') + mb_eye(gl, 163, 81, 3, '#fff04a');
  s += P('M124 72 L148 78 M176 72 L152 78', 'none', INK, 3);
  s += P('M146 80 C140 92 138 104 150 108 C162 104 160 92 154 80Z', sg, INK, 2);
  s += P('M132 100 C138 110 162 110 168 100', 'none', INK, 2.5) + P('M134 104 L130 90 L140 104Z M166 104 L170 90 L160 104Z', '#f2ead0', INK, 1.5);
  // warts
  s += C(126, 94, 2, dk) + C(176, 90, 2.5, dk) + C(116, 150, 2.5, dk);
  return s;
};

/* ---------------- ice elemental ---------------- */
MONSTERS.ice_elemental = function (d) {
  var gl = d.glow(3, 2), A = d.lin([[0, '#eaffff'], [0.5, '#8fdcff'], [1, '#2a70c0']]), B = d.lin([[0, '#bdefff'], [1, '#1a4a9a']]);
  var s = E(150, 150, 125, 135, d.rad([[0, '#8ae8ff', 0.35], [0.6, '#3aa0ff', 0.12], [1, '#000', 0]]));
  s += E(150, 284, 70, 9, d.rad([[0, '#9ef0ff', 0.5], [1, '#9ef0ff', 0]]));
  // swirling snow vortex
  s += P('M72 250 C100 234 200 234 228 250 M90 268 C120 256 180 256 210 268 M60 220 C110 200 190 200 240 220', 'none', '#dff8ff', 2.5, { opacity: 0.5, filter: gl });
  // lower shards
  s += mb_crystal(150, 196, 80, 18, 180, A, B) + mb_crystal(132, 200, 60, 12, 165, A, B) + mb_crystal(168, 200, 60, 12, 195, A, B);
  // arms: shard clusters
  s += mb_crystal(108, 116, 50, 13, -120, A, B) + mb_crystal(72, 140, 46, 14, -150, A, B) + mb_crystal(52, 152, 34, 10, -170, A, B) + mb_crystal(48, 150, 30, 8, -120, A, B);
  s += mb_crystal(192, 116, 50, 13, 120, A, B) + mb_crystal(226, 100, 46, 14, 30, A, B) + mb_crystal(232, 82, 38, 10, 0, A, B) + mb_crystal(244, 92, 30, 8, 50, A, B);
  // torso crystals
  s += mb_crystal(150, 200, 110, 34, 0, A, B) + mb_crystal(124, 168, 70, 18, -25, A, B) + mb_crystal(176, 168, 70, 18, 25, A, B);
  s += mb_crystal(112, 120, 34, 14, -70, A, B) + mb_crystal(188, 120, 34, 14, 70, A, B);
  // core
  s += C(150, 140, 22, '#bff6ff', { opacity: 0.5, filter: d.blur(7) }) + C(150, 140, 10, d.rad([[0, '#fff'], [0.5, '#c8f8ff'], [1, '#48c8ff']]), { filter: gl });
  s += P(starPts(150, 140, 16, 3, 4), '#fff', null, null, { filter: gl });
  // head crystal with crown
  s += mb_crystal(150, 92, 40, 22, 0, A, B) + mb_crystal(134, 66, 22, 6, -25, A, B) + mb_crystal(166, 66, 22, 6, 25, A, B) + mb_crystal(150, 60, 26, 6, 0, A, B);
  s += P('M136 80 L146 84 L138 86Z M164 80 L154 84 L162 86Z', '#ffffff', null, null, { filter: gl }) + C(141, 83, 6, '#7af0ff', { opacity: 0.5, filter: gl }) + C(159, 83, 6, '#7af0ff', { opacity: 0.5, filter: gl });
  // sparkles
  s += sparkle(78, 80, 8, '#fff', { filter: gl }) + sparkle(222, 196, 7, '#fff', { filter: gl }) + sparkle(96, 230, 5, '#fff') + sparkle(210, 60, 5, '#fff') + sparkle(60, 200, 4, '#fff');
  for (var i = 0; i < 14; i++) s += C(40 + (i * 53) % 220, 40 + (i * 89) % 230, 1.5 + (i % 3), '#fff', { opacity: 0.7 });
  return s;
};

/* ---------------- frost giant ---------------- */
MONSTERS.frost_giant = function (d) {
  var sk = '#9cc2e4', sg = mb_gh(d, sk), gl = d.glow(2.5, 2), dk = shadow(sk, 1.1);
  var s = mb_ground(d, 150, 284, 108);
  // ice axe
  s += P('M252 266 L232 30', 'none', INK, 11) + P('M252 266 L232 30', 'none', '#5a4030', 6.5);
  s += P('M234 50 C262 34 292 52 290 86 C276 72 256 70 238 80Z', d.lin([[0, '#f0ffff'], [0.6, '#7ad0ff'], [1, '#2a6ab0']]), '#0b2a4a', 2.5, { filter: d.glow(1.5) });
  s += P('M232 52 C210 38 196 48 192 66 C204 60 218 62 230 72Z', d.lin([[0, '#f0ffff'], [1, '#4a8ad0']]), '#0b2a4a', 2.2) + P('M244 58 C262 52 278 60 284 74', 'none', '#fff', 1.5);
  // legs
  s += P(mb_seg(124, 214, 24, 118, 254, 20), mb_gh(d, '#3a4a72'), INK, 3) + P(mb_seg(176, 214, 24, 182, 254, 20), mb_gh(d, '#3a4a72'), INK, 3);
  s += P('M90 284 C88 256 104 244 124 246 C140 248 148 262 146 284Z M154 284 C152 262 160 248 176 246 C196 244 212 256 210 284Z', d.lin([[0, '#ffffff'], [1, '#b8c8dc']]), INK, 2.5);
  s += P('M96 256 L102 262 L108 254 M120 252 L124 260 L130 252 M170 252 L176 260 L182 252 M196 256 L200 262 L204 254', 'none', '#9aaac0', 1.5);
  // torso
  s += P('M82 104 C64 146 80 204 104 226 L196 226 C220 204 236 146 218 104 C190 84 110 84 82 104Z', d.rad([[0, shade(sk, 0.3)], [0.6, sk], [1, dk]], 0.38, 0.3, 0.85), INK, 3);
  s += P('M150 140 L150 210 M118 158 Q134 168 148 158 M152 158 Q166 168 182 158 M132 182 L146 184 M154 184 L168 182 M134 200 L146 201 M154 201 L166 200', 'none', dk, 2.2);
  s += P('M106 142 C110 128 124 122 136 124', 'none', '#fff', 3, { opacity: 0.45 });
  // fur kilt and belt
  s += P('M100 206 Q150 220 200 206 L210 246 L196 238 L184 252 L170 240 L156 254 L144 240 L130 252 L116 238 L102 248 L90 240Z', d.lin([[0, '#f4f8ff'], [1, '#aab8cc']]), INK, 2.5);
  s += P('M98 200 Q150 216 202 200 L202 214 Q150 230 98 214Z', '#3a3448', INK, 2.5) + P(starPts(150, 214, 11, 4, 6), d.lin([[0, '#fff'], [1, '#5ac8ff']]), INK, 1.5);
  // arms
  s += mb_limb([[88, 116], [62, 168], [64, 210]], [22, 18, 15], sg) + C(64, 216, 17, sk, { stroke: INK, 'stroke-width': 2.5 });
  s += R(46, 178, 34, 16, d.lin([[0, '#e8fbff'], [1, '#6ab0e0']]), { rx: 4, stroke: '#0b2a4a', 'stroke-width': 2, transform: 'rotate(4 63 186)' });
  s += mb_limb([[212, 116], [248, 152], [244, 112]], [22, 18, 15], sg) + C(244, 108, 15, sk, { stroke: INK, 'stroke-width': 2.5 });
  // fur mantle + ice pauldron
  s += P('M76 116 C70 92 96 80 120 84 C150 76 180 84 200 84 C214 86 226 98 222 118 C210 108 196 112 188 104 C176 112 164 104 150 110 C136 104 124 112 112 104 C102 112 88 108 76 116Z', d.lin([[0, '#ffffff'], [1, '#b8c6da']]), INK, 2.5);
  s += mb_crystal(82, 104, 30, 9, -40, d.lin([[0, '#f0ffff'], [1, '#5aa8e0']]), '#3a7ac0') + mb_crystal(96, 94, 26, 8, -15, d.lin([[0, '#f0ffff'], [1, '#5aa8e0']]), '#3a7ac0');
  // head
  s += P('M122 62 C118 32 182 32 178 62 C178 84 168 98 150 100 C132 98 122 84 122 62Z', d.rad([[0, shade(sk, 0.3)], [0.7, sk], [1, dk]], 0.4, 0.3, 0.8), INK, 2.5);
  // beard
  s += P('M122 66 C118 96 120 130 136 152 L142 140 L150 162 L158 140 L164 152 C180 130 182 96 178 66 C172 80 162 88 150 88 C138 88 128 80 122 66Z', d.lin([[0, '#ffffff'], [0.6, '#d8e8f8'], [1, '#90b0d0']]), INK, 2.5);
  s += P('M134 100 L138 130 M150 96 L150 140 M166 100 L162 130', 'none', '#9ab4d0', 1.5);
  s += P('M132 86 C140 80 160 80 168 86 C162 92 138 92 132 86Z', '#f4faff', INK, 2) + P('M142 94 Q150 98 158 94', 'none', '#3a2a40', 2);
  s += P('M136 140 L138 152 L140 140Z M160 140 L162 152 L164 140Z', '#bff0ff', null, null, { opacity: 0.9 });
  s += mb_eye(gl, 139, 68, 3.2, '#9af8ff') + mb_eye(gl, 161, 68, 3.2, '#9af8ff') + P('M128 62 L146 66 M172 62 L154 66', 'none', '#f4faff', 4) + P('M128 62 L146 66 M172 62 L154 66', 'none', INK, 1);
  s += P('M146 72 L150 80 L154 72', 'none', dk, 2);
  // helm with horns
  s += P('M120 56 C118 26 182 26 180 56 C164 50 136 50 120 56Z', d.lin([[0, '#c8d4e4'], [1, '#5a6a84']]), INK, 2.5) + P('M150 28 L150 54', 'none', '#eaf2ff', 2);
  s += P('M122 48 C104 44 92 30 94 10 C102 26 114 32 128 36Z', d.lin([[0, '#f6f0e0'], [1, '#8a7a60']]), INK, 2.2) + P('M178 48 C196 44 208 30 206 10 C198 26 186 32 172 36Z', d.lin([[0, '#f6f0e0'], [1, '#8a7a60']]), INK, 2.2);
  // snowflakes
  for (var i = 0; i < 10; i++) s += C(30 + (i * 67) % 240, 20 + (i * 41) % 120, 1.5 + (i % 2), '#fff', { opacity: 0.8 });
  return s;
};

/* ---------------- basilisk ---------------- */
MONSTERS.basilisk = function (d) {
  var sc = '#4f8a3e', gl = d.glow(3, 2), dk = '#24461e', belly = '#e0c86a';
  var sg = d.lin([[0, '#7ab85a'], [0.5, sc], [1, dk]]);
  var s = mb_ground(d, 150, 280, 112);
  // tail coil (back)
  var tail = 'M60 262 C30 250 30 220 56 214 C70 212 76 222 68 228';
  s += P(tail, 'none', INK, 24) + P(tail, 'none', sc, 18) + P(tail, 'none', dk, 18, { 'stroke-dasharray': '2 7', opacity: 0.6 });
  // main coil
  s += P('M52 262 C40 228 90 210 150 212 C214 214 266 226 256 258 C248 286 70 292 52 262Z', sg, INK, 3);
  s += P('M70 264 C100 276 210 276 240 262', 'none', belly, 7) + P('M70 264 C100 276 210 276 240 262', 'none', '#a8903a', 7, { 'stroke-dasharray': '1.5 8' });
  s += P('M70 236 C110 222 200 222 240 240', 'none', dk, 2, { 'stroke-dasharray': '6 6', opacity: 0.8 });
  // neck rising
  var neck = 'M208 236 C238 196 222 150 178 136 C146 126 130 112 132 86';
  s += P(neck, 'none', INK, 38) + P(neck, 'none', sc, 32) + P(neck, 'none', '#7ab85a', 10, { transform: 'translate(-6 -4)', opacity: 0.7 });
  var bl = 'M200 238 C226 200 212 160 176 148 C152 140 138 126 138 100';
  s += P(bl, 'none', belly, 10) + P(bl, 'none', '#a8903a', 10, { 'stroke-dasharray': '1.5 7' });
  // back spines
  for (var i = 0; i < 7; i++) {
    var t = i / 6, x = 232 - t * 70 + Math.sin(t * 3) * 14, y = 214 - t * 110;
    s += P('M' + f(x - 6) + ' ' + f(y + 4) + ' L' + f(x + 12) + ' ' + f(y - 8) + ' L' + f(x + 4) + ' ' + f(y + 10) + 'Z', '#c03a2a', INK, 1.6);
  }
  // legs
  s += mb_limb([[110, 222], [96, 246], [104, 270]], [12, 9, 7], sg) + mb_claws(104, 272, 150, 12, '#efe6cc', 3, 26, 2.4);
  s += mb_limb([[190, 226], [206, 248], [196, 272]], [12, 9, 7], sg) + mb_claws(196, 274, 30, 12, '#efe6cc', 3, 26, 2.4);
  // crown crest
  s += P('M146 72 L150 30 L160 60 L172 24 L176 62 L192 38 L186 76 Z', d.lin([[0, '#ffe28a'], [0.5, '#e05a2a'], [1, '#8a1a1a']]), INK, 2.2);
  s += P('M150 34 L156 60 M172 28 L174 62 M190 42 L184 72', 'none', '#7a1010', 1.2);
  // head
  s += P('M92 92 C92 70 112 60 142 62 C166 64 186 74 184 92 C182 104 170 108 158 106 L120 108 C104 108 92 104 92 92Z', d.rad([[0, '#9ad070'], [0.6, sc], [1, dk]], 0.4, 0.3, 0.8), INK, 2.5);
  // lower jaw open
  s += P('M104 110 C116 132 150 134 168 112 L158 108 L120 110Z', d.lin([[0, sc], [1, dk]]), INK, 2.5);
  s += P('M106 106 C120 122 148 124 160 108Z', '#5a1020', INK, 1.5);
  s += P('M110 106 L113 114 L117 106 M124 107 L127 116 L130 107 M140 107 L143 116 L146 107 M152 107 L154 114 L156 107', '#fff8e8', INK, 1);
  s += P('M112 114 L116 108 L120 116Z M132 118 L135 110 L138 118Z', '#fff8e8', INK, 1);
  s += P('M108 116 C96 120 86 116 78 122 M86 117 C80 112 74 114 70 110', 'none', '#e0306a', 2.2);
  s += C(100, 84, 1.8, INK) + C(108, 82, 1.8, INK);
  // eye
  s += E(140, 80, 11, 7, '#120810', { transform: 'rotate(-10 140 80)' }) + E(140, 80, 8, 5.5, '#c8ff3a', { filter: gl, transform: 'rotate(-10 140 80)' }) + E(140, 80, 1.6, 5, INK);
  s += C(140, 80, 20, '#c8ff3a', { opacity: 0.18, filter: gl });
  s += P('M126 70 L156 74', 'none', INK, 3) + P('M110 70 C120 66 134 64 150 66', 'none', '#c8f0a0', 2, { opacity: 0.7 });
  return s;
};
/* ---------------- statue: an inanimate stone gargoyle on a carved plinth ---------------- */
MONSTERS.statue = function (d) {
  var st = '#9b9ea4', lt = shade(st, 0.38), dk = shade(st, -0.55), mid = shade(st, -0.28), ink = '#1c1d22';
  var sh = d.lin([[0, lt], [0.45, st], [1, dk]], 0, 0, 1, 0);
  var sv = d.lin([[0, lt], [0.5, st], [1, dk]]);
  var sr = d.rad([[0, lt], [0.65, st], [1, dk]], 0.4, 0.3, 0.8);
  var snow = d.lin([[0, '#ffffff'], [1, '#d2dbe6']]);
  var crk = function (p, w) { return P(p, 'none', '#2c2d33', w || 1.6); };
  var snowP = function (p) { return P(p, snow, '#6a7a8c', 1.3); };
  var s = E(150, 284, 104, 15, d.rad([[0, '#000', 0.6], [0.6, '#000', 0.28], [1, '#000', 0]]));
  // plinth
  s += R(76, 262, 148, 22, sv, { stroke: ink, 'stroke-width': 2.5, rx: 2 });
  s += R(92, 214, 116, 50, sh, { stroke: ink, 'stroke-width': 2.5 });
  s += R(106, 223, 88, 32, mid, { stroke: ink, 'stroke-width': 1.5 }) + R(108, 225, 84, 4, dk, { opacity: 0.6 });
  s += C(150, 239, 11, 'none', { stroke: dk, 'stroke-width': 2.5 })  + P(starPts(150, 239, 7, 3, 6), dk);
  s += R(82, 200, 136, 16, sv, { stroke: ink, 'stroke-width': 2.5, rx: 2 }) + P('M84 203 L216 203', 'none', lt, 1.5, { opacity: 0.8 });
  s += crk('M98 216 L104 230 L100 240 M196 262 L200 272 L194 282 M120 262 L116 276') + P('M118 264 C118 272 120 278 118 284 M180 216 C181 230 179 240 181 262', 'none', dk, 3, { opacity: 0.3 });
  s += snowP('M80 202 C84 194 100 196 110 198 C120 194 132 197 140 196 C150 194 166 198 176 196 C190 194 206 196 220 202 C214 206 206 202 198 206 C188 202 180 207 170 204 C160 208 150 203 140 206 C130 202 120 207 110 204 C100 208 90 203 80 206Z');
  s += snowP('M78 264 C90 258 110 260 122 262 C112 266 100 264 92 268 C86 266 82 268 78 266Z');
  var body = '';
  // wings (half folded, raised)
  var wing = P('M128 128 C104 92 72 52 28 38 C40 66 18 86 20 108 C38 104 50 118 46 140 C62 130 80 140 82 160 C96 150 110 156 116 172Z', d.lin([[0, mid], [1, dk]], 1, 0, 0, 1), ink, 2.5) +
    P('M128 128 L28 38 M120 140 L20 108 M118 152 L46 140 M118 162 L82 160', 'none', '#3a3b42', 2) + P('M28 38 L22 28 L34 36', mid, ink, 2) +
    crk('M66 96 L74 104 L70 112 M44 120 L52 126', 1.3) +
    snowP('M30 40 C56 46 84 64 108 96 C116 106 122 116 126 124 C118 118 110 108 100 100 C92 94 88 98 80 88 C70 74 60 72 50 60 C44 54 38 50 30 40Z');
  body += wing + M(wing, 150);
  // tail curling over the plinth
  body += P('M176 214 C220 230 240 200 232 178 C228 168 220 172 224 182 C230 200 214 218 178 204Z', sh, ink, 2.2) + P('M228 172 L240 162 L236 178Z', st, ink, 2);
  // crouched legs and feet
  body += mb_limb([[132, 200], [104, 196], [114, 228]], [17, 13, 9], sh) + mb_limb([[168, 200], [196, 196], [186, 228]], [17, 13, 9], sh);
  body += mb_claws(112, 228, 120, 11, lt, 3, 30, 2.5) + mb_claws(188, 228, 60, 11, lt, 3, 30, 2.5);
  body += snowP('M92 190 C98 182 112 182 116 188 C108 190 100 188 92 192Z') + snowP('M208 190 C202 182 188 182 184 188 C192 190 200 188 208 192Z');
  // torso
  body += P('M116 118 C104 150 110 190 128 212 L172 212 C190 190 196 150 184 118 C170 104 130 104 116 118Z', sr, ink, 2.5);
  body += P('M150 132 L150 196 M130 136 Q140 146 150 140 Q160 146 170 136 M134 166 L166 166 M136 182 L164 182', 'none', mid, 2);
  body += crk('M162 124 L156 140 L164 152 L158 168 M126 176 L134 186');
  // arms gripping the plinth edge
  body += mb_limb([[120, 126], [104, 170], [130, 226]], [12, 10, 8], sh) + mb_limb([[180, 126], [196, 170], [170, 226]], [12, 10, 8], sh);
  body += mb_claws(130, 226, 100, 10, lt, 3, 26, 2.5) + mb_claws(170, 226, 80, 10, lt, 3, 26, 2.5);
  // horns
  var horn = d.lin([[0, lt], [1, mid]]);
  body += P('M128 88 C116 66 112 48 122 30 C124 50 132 64 140 78Z', horn, ink, 2) + P('M172 88 C184 66 188 48 178 30 C176 50 168 64 160 78Z', horn, ink, 2);
  body += crk('M120 50 L126 58', 1.2);
  // head
  body += P('M124 100 C120 74 180 74 176 100 C176 114 170 122 166 130 L134 130 C130 122 124 114 124 100Z', sr, ink, 2.5);
  body += P('M114 92 L126 96 L124 106Z M186 92 L174 96 L176 106Z', st, ink, 2);
  // carved hollow eyes (no glow - it's only stone)
  body += P('M128 95 L148 101 L132 107Z', '#16161a') + P('M172 95 L152 101 L168 107Z', '#16161a');
  body += C(138, 102, 2.2, '#4a4c54') + C(162, 102, 2.2, '#4a4c54');
  body += P('M124 89 L148 98 M176 89 L152 98', 'none', ink, 3.2);
  body += P('M134 116 C142 128 158 128 166 116 L162 132 L138 132Z', '#232328', ink, 2) + P('M138 118 L140 126 L143 119 M162 118 L160 126 L157 119 M146 130 L148 124 L150 130 L152 124 L154 130', lt, ink, 1);
  body += P('M144 108 L150 112 L156 108', 'none', ink, 1.6);
  body += crk('M168 84 L162 94 L166 100 M134 112 L130 120', 1.3);
  // snow cap on head and shoulders
  body += snowP('M126 86 C128 74 172 74 174 86 C168 84 166 90 160 86 C154 91 148 86 142 90 C136 85 132 90 126 86Z');
  body += snowP('M112 120 C116 112 128 110 134 114 C128 118 120 118 112 124Z') + snowP('M188 120 C184 112 172 110 166 114 C172 118 180 118 188 124Z');
  body += snowP('M118 32 C121 28 125 30 124 36 C122 34 120 34 118 32Z') + snowP('M182 32 C179 28 175 30 176 36 C178 34 180 34 182 32Z');
  s += G(body, { transform: 'translate(0 -10)' });
  // icicles on the cap
  s += P('M100 214 L103 226 L106 214Z M140 214 L142 222 L144 214Z M182 214 L185 230 L188 214Z', '#e8f4ff', '#7a8a9c', 0.8);
  return s;
};

/* shared with the other art files */
A.mb_crystal = mb_crystal;
})();
