/* Velmoor art: Monster sprites (300x300), group A: vermin, rogues, slimes, critters and goblinoids, with their shared ma_* helpers.
 * Plain script (no modules); load order is listed in js/art/api.js. */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL;
/* from core.js */
var f = A.f, shade = A.shade, shadow = A.shadow, P = A.P, C = A.C, E = A.E, R = A.R, G = A.G, M = A.M, T = A.T, INK = A.INK, MONSTERS = A.MONSTERS;

/* ------------------------------------------------------------------ */
/* Monsters, group A: vermin, rogues, slimes, critters, goblinoids     */
/* ------------------------------------------------------------------ */
/* ground shadow */
function ma_sh(d, cx, w, y, op) {
  var o = op == null ? 0.55 : op;
  return E(cx == null ? 150 : cx, y || 279, w || 90, (w || 90) * 0.13, d.rad([[0, '#000', o], [0.6, '#000', o * 0.4], [1, '#000', 0]]));
}
/* tapered capsule between two points */
function ma_limb(x1, y1, x2, y2, w1, w2) {
  var dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
  return 'M' + f(x1 + nx * w1) + ' ' + f(y1 + ny * w1) + ' L' + f(x2 + nx * w2) + ' ' + f(y2 + ny * w2) +
    ' A' + f(w2) + ' ' + f(w2) + ' 0 0 0 ' + f(x2 - nx * w2) + ' ' + f(y2 - ny * w2) +
    ' L' + f(x1 - nx * w1) + ' ' + f(y1 - ny * w1) + ' A' + f(w1) + ' ' + f(w1) + ' 0 0 0 ' + f(x1 + nx * w1) + ' ' + f(y1 + ny * w1) + 'Z';
}
/* filled limb with outline */
function ma_L(x1, y1, x2, y2, w1, w2, fill, sw) { return P(ma_limb(x1, y1, x2, y2, w1, w2), fill, INK, sw == null ? 2.2 : sw); }
/* cel-shaded shape: base fill, clipped inner shading markup, outline on top */
function ma_cel(d, sh, base, inner, sw) {
  var cp = d.clip('<path d="' + sh + '"/>');
  return P(sh, base) + (inner ? G(inner, { 'clip-path': cp }) : '') + P(sh, 'none', INK, sw == null ? 2.5 : sw);
}
/* glowing round eye */
function ma_eye(gl, x, y, r, col) {
  return C(x, y, r * 2.2, col, { opacity: 0.35, filter: gl }) + C(x, y, r, col, { filter: gl }) + C(x - r * 0.35, y - r * 0.35, r * 0.38, '#fff');
}
/* horizontal shading gradient for limbs */
function ma_lg(d, c) { return d.lin([[0, shade(c, 0.18)], [0.5, c], [1, shadow(c, 0.9)]], 0, 0, 1, 0); }
/* vertical body gradient */
function ma_vg(d, c) { return d.lin([[0, shade(c, 0.15)], [0.6, c], [1, shadow(c, 0.8)]]); }

/* ---------------- rats ---------------- */
function ma_rat(d, giant) {
  var fur = giant ? '#5d5060' : '#857a6c', dk = giant ? '#2c2230' : '#4a3f38', belly = giant ? '#9a8a96' : '#c4b5a4';
  var pink = '#e59aa6', gl = d.glow(2.5, 2), eyeC = giant ? '#ff2a2a' : '#ff5a3a';
  var s = '';
  var tail = 'M238 236 C270 240 290 214 284 184 C280 166 268 156 272 138 C278 150 290 160 293 180 C300 222 278 254 236 252Z';
  s += ma_cel(d, tail, d.lin([[0, '#f2b6bf'], [1, '#b8606f']]), P('M246 250 C276 246 292 220 288 190', 'none', '#8a3c4c', 2, { opacity: 0.5 }), 2.2);
  var tufts = [[108, 172], [126, 160], [146, 152], [168, 148], [190, 149], [210, 155], [228, 166], [242, 182]];
  var sp = '';
  for (var i = 0; i < tufts.length; i++) {
    var t = tufts[i], h = giant ? 22 + (i % 2) * 8 : 10 + (i % 2) * 4;
    sp += 'M' + f(t[0] - 10) + ' ' + f(t[1] + 8) + ' L' + f(t[0] + 9) + ' ' + f(t[1] - h) + ' L' + f(t[0] + 11) + ' ' + f(t[1] + 8) + 'Z ';
  }
  s += P(sp, dk, INK, 2);
  s += ma_L(176, 240, 166, 266, 9, 7, shadow(fur));
  var body = 'M78 214 C84 170 128 146 178 148 C226 150 252 186 248 226 C246 252 222 266 186 266 L116 266 C92 262 74 240 78 214Z';
  s += ma_cel(d, body, ma_vg(d, fur),
    E(170, 272, 100, 42, shadow(fur, 0.9)) + E(140, 248, 46, 18, belly) + E(150, 166, 56, 10, shade(fur, 0.3), { opacity: 0.6 }) +
    P('M120 190 Q136 184 150 192 M160 176 Q176 170 190 178 M196 196 Q210 190 222 198', 'none', dk, 1.6, { opacity: 0.6 }) +
    (giant ? P('M150 200 L176 186 M156 208 L180 194', 'none', '#c87a86', 2.2) : ''));
  s += ma_cel(d, 'M180 226 C178 196 222 190 236 214 C246 234 232 256 210 258 C192 258 182 244 180 226Z', fur,
    E(220, 252, 30, 16, shadow(fur, 0.9)) + P('M188 214 Q206 198 228 208', 'none', shade(fur, 0.3), 3, { opacity: 0.6 }), 2.2);
  s += P('M188 256 L232 260 C242 262 242 270 232 271 L186 271 C182 268 182 258 188 256Z', pink, INK, 2) + P('M200 271 L202 266 M212 271 L214 266 M222 271 L224 266', 'none', INK, 1.2);
  s += ma_L(114, 222, 104, 262, 11, 8, fur);
  s += P('M90 260 L114 260 C120 262 120 270 114 271 L86 271 C82 268 84 262 90 260Z', pink, INK, 2) + P('M92 271 L90 266 M100 271 L99 266', 'none', INK, 1.2);
  s += ma_cel(d, 'M96 170 C82 142 98 120 118 126 C136 132 136 158 122 174Z', fur, P('M102 164 C94 146 104 134 116 137 C126 141 126 156 118 166Z', pink) + P('M104 160 C100 148 106 140 114 141', 'none', '#fff', 2, { opacity: 0.4 }), 2.2);
  var head = 'M120 170 C102 158 70 164 52 182 C42 192 32 200 20 205 C11 209 12 220 22 222 C44 228 72 240 98 237 C120 234 134 214 132 194 C131 184 127 175 120 170Z';
  s += ma_cel(d, head, ma_vg(d, fur), E(80, 244, 60, 18, shadow(fur, 0.9)) + E(60, 230, 30, 9, belly) + P('M40 192 Q70 170 108 172', 'none', shade(fur, 0.35), 4, { opacity: 0.5 }));
  if (giant) {
    s += P('M22 222 C40 240 66 244 90 232 C70 234 44 232 22 222Z', '#5a0d18', INK, 2);
    s += P('M27 221 L34 221 L33 236 L28 234Z M36 223 L42 224 L41 236 L37 236Z', '#f4e6b0', INK, 1.2);
    s += P('M52 230 L56 238 L60 231 M66 232 L70 240 L73 232', '#f4e6b0', INK, 1);
  } else {
    s += P('M26 222 Q50 230 76 226', 'none', INK, 2) + P('M28 221 L34 221 L33 231 L29 230Z', '#f4e6b0', INK, 1.2);
  }
  s += P('M54 180 L84 190', 'none', INK, giant ? 4 : 3);
  s += E(68, 194, 8, 6.5, '#2a0808', { stroke: INK, 'stroke-width': 1.5 }) + ma_eye(gl, 68, 194, giant ? 5.5 : 4.5, eyeC);
  if (giant) s += P('M58 178 L80 206 M62 176 L84 202', 'none', '#d07a86', 1.6);
  s += C(17, 211, 5.5, pink, { stroke: INK, 'stroke-width': 1.6 }) + C(15, 209, 1.6, '#fff', { opacity: 0.8 });
  s += P('M36 208 L2 194 M36 212 L0 212 M38 216 L6 228', 'none', '#e8e0d8', 1, { opacity: 0.75 });
  return s;
}
MONSTERS.rat = function (d) { return ma_sh(d, 150, 95, 276) + T(ma_rat(d, false), 34, 72, 0.75); };
MONSTERS.giant_rat = function (d) { return ma_sh(d, 150, 120, 278) + T(ma_rat(d, true), 6, 21, 0.95); };

/* ---------------- wererat ---------------- */
MONSTERS.wererat = function (d) {
  var fur = '#6e6058', dk = '#3a2f2c', lt = '#a8988a', pink = '#d98f98', gl = d.glow(2.5, 2);
  var lg = ma_lg(d, fur), s = ma_sh(d, 150, 90);
  s += ma_cel(d, 'M160 204 C220 214 262 232 262 186 C262 156 246 142 254 118 C262 140 282 152 280 188 C278 246 214 232 156 218Z', d.lin([[0, '#f0aab4'], [1, '#a85060']]), '', 2.2);
  [-1, 1].forEach(function (k) {
    var fx = 150 + 30 * k;
    s += ma_L(150 + 22 * k, 192, 150 + 40 * k, 232, 17, 12, lg) + ma_L(150 + 40 * k, 232, fx, 266, 10, 7, lg) +
      P('M' + f(fx - 16) + ' 262 L' + f(fx + 14) + ' 262 L' + f(fx + 20) + ' 275 L' + f(fx - 20) + ' 275Z', pink, INK, 2) +
      P('M' + f(fx - 20) + ' 275 l-5 3 M' + f(fx) + ' 276 l0 4 M' + f(fx + 20) + ' 275 l5 3', 'none', '#f2ead0', 2.2);
  });
  s += P('M122 194 L178 194 L174 240 L166 230 L158 244 L150 232 L142 246 L134 230 L126 240Z', d.lin([[0, '#6b4a2c'], [1, '#3a2614']]), INK, 2);
  var torso = 'M116 112 C98 122 94 150 102 176 C108 196 130 204 150 204 C170 204 192 196 198 176 C206 150 202 122 184 112 C168 104 132 104 116 112Z';
  s += ma_cel(d, torso, ma_vg(d, fur), E(150, 156, 28, 34, lt, { opacity: 0.9 }) + E(196, 170, 26, 60, shadow(fur, 0.9)) +
    P('M134 140 Q150 150 166 140 M138 168 Q150 172 162 168 M140 184 Q150 188 160 184', 'none', dk, 1.6, { opacity: 0.6 }));
  var vest = 'M116 112 C100 122 96 150 102 176 L110 192 L116 182 L122 194 L128 180 L132 142 C132 126 128 116 116 112Z';
  s += P(vest, d.lin([[0, '#5a4630'], [1, '#2e2216']]), INK, 2) + M(P(vest, d.lin([[0, '#4a3826'], [1, '#22180e']]), INK, 2), 150);
  s += R(120, 188, 60, 9, '#2a1a10', { stroke: INK, 'stroke-width': 1.8 }) + R(144, 186, 12, 13, '#b89a50', { stroke: INK, 'stroke-width': 1.5 });
  [-1, 1].forEach(function (k) {
    var sx = 150 + 36 * k, ex = 150 + 70 * k, hx2 = 150 + 82 * k;
    s += ma_L(sx, 120, ex, 152, 14, 10, lg) + ma_L(ex, 152, hx2, 108, 10, 9, lg);
    s += E(hx2, 104, 11, 10, fur, { stroke: INK, 'stroke-width': 2 });
    for (var i = -1; i <= 1; i++) {
      var cx = hx2 + i * 7;
      s += P('M' + f(cx - 2.5) + ' 98 Q' + f(cx + i * 3) + ' 82 ' + f(cx + i * 6 + k * 2) + ' 74 Q' + f(cx + 2) + ' 86 ' + f(cx + 3) + ' 98Z', '#f2ead0', INK, 1.4);
    }
    s += P('M' + f(sx - 18 * k) + ' 108 L' + f(sx + 4 * k) + ' 96 L' + f(sx + 2 * k) + ' 106 L' + f(sx + 16 * k) + ' 100 L' + f(sx + 12 * k) + ' 114Z', fur, INK, 1.8);
  });
  [-1, 1].forEach(function (k) {
    s += C(150 + 40 * k, 50, 22, fur, { stroke: INK, 'stroke-width': 2.4 }) + C(150 + 40 * k, 51, 14, pink) + C(150 + 37 * k, 46, 5, '#fff', { opacity: 0.35 });
  });
  var head = 'M150 42 C178 42 192 60 188 82 C184 102 166 120 150 134 C134 120 116 102 112 82 C108 60 122 42 150 42Z';
  s += ma_cel(d, head, ma_vg(d, fur), P('M136 100 C140 92 160 92 164 100 C166 114 158 128 150 136 C142 128 134 114 136 100Z', lt) + E(186, 90, 18, 40, shadow(fur, 0.9)) +
    P('M140 44 L146 34 L150 44 L156 32 L160 46', fur, INK, 1.5));
  s += P('M138 132 Q150 156 162 132 Q150 140 138 132Z', '#5a0d18', INK, 1.8) + P('M145 133 L149 133 L149 144 L145 142Z M151 133 L155 133 L155 142 L151 144Z', '#f4e6b0', INK, 1);
  s += E(150, 128, 7, 5, pink, { stroke: INK, 'stroke-width': 1.6 }) + C(148, 126, 1.6, '#fff');
  [-1, 1].forEach(function (k) {
    s += P('M' + f(150 + 30 * k) + ' 74 L' + f(150 + 8 * k) + ' 84', 'none', INK, 3.5);
    s += P('M' + f(150 + 26 * k) + ' 80 Q' + f(150 + 17 * k) + ' 78 ' + f(150 + 9 * k) + ' 87 Q' + f(150 + 19 * k) + ' 90 ' + f(150 + 26 * k) + ' 80Z', '#ff2a2a', INK, 1.4, { filter: gl });
    s += P('M' + f(150 + 30 * k) + ' 104 L' + f(150 + 56 * k) + ' 98 M' + f(150 + 30 * k) + ' 110 L' + f(150 + 56 * k) + ' 112', 'none', '#e8e0d8', 1, { opacity: 0.7 });
  });
  return s;
};

/* ---------------- rogues: thief & cutthroat ---------------- */
function ma_rogue(d, cut) {
  var skin = cut ? '#c98e64' : '#f2c9a8', cloth = cut ? '#5a2a22' : '#2c2e44', clothDk = shadow(cloth), leather = '#5a3a24', gl = d.glow(2, 2);
  var eyeC = cut ? '#ff3b2a' : '#ffd23a', steel = d.lin([[0, '#f4f8ff'], [0.5, '#a8b4c8'], [1, '#5a6478']], 0, 0, 1, 0);
  var s = ma_sh(d, 150, 95);
  if (!cut) {
    s += ma_cel(d, 'M118 100 C88 140 58 220 36 272 L74 256 L96 276 L124 252 L150 272 L176 252 L204 276 L226 256 L264 272 C242 220 212 140 182 100Z',
      d.lin([[0, '#3a3c58'], [1, '#14141f']]), P('M150 110 L150 270', 'none', '#000', 30, { opacity: 0.25 }), 2.4);
  } else {
    s += P('M176 108 C200 130 214 160 222 196 L210 190 L214 214 L200 200 C194 170 186 140 170 116Z', '#7a2a24', INK, 2);
  }
  var pants = ma_lg(d, cut ? '#4a3a2c' : '#2a2a38'), boot = ma_lg(d, '#3a2418');
  s += ma_L(138, 178, 116, 226, 13, 10, pants) + ma_L(116, 226, 108, 268, 10, 8, boot);
  s += ma_L(162, 178, 184, 226, 13, 10, pants) + ma_L(184, 226, 192, 268, 10, 8, boot);
  s += P('M96 264 L118 262 L120 276 L90 276 C88 270 90 266 96 264Z', '#2a180e', INK, 2) + P('M204 264 L182 262 L180 276 L210 276 C212 270 210 266 204 264Z', '#2a180e', INK, 2);
  s += P('M106 236 L120 234 M180 234 L194 236', 'none', '#8a6a4a', 2.5);
  var torso = cut ? 'M112 110 C106 132 124 160 128 184 L172 184 C176 160 194 132 188 110 C172 100 128 100 112 110Z' : 'M116 110 C112 130 128 160 130 184 L170 184 C172 160 188 130 184 110 C172 102 128 102 116 110Z';
  if (cut) {
    var vestG = d.lin([[0, '#6a3a2a'], [1, '#3a1e14']]);
    s += ma_cel(d, torso, ma_vg(d, skin), P('M150 120 L150 180 M128 138 Q140 146 150 140 Q160 146 172 138 M136 156 L164 156 M138 168 L162 168', 'none', shadow(skin), 1.6, { opacity: 0.7 }) +
      E(182, 150, 14, 50, shadow(skin), { opacity: 0.6 }) +
      P('M112 110 L130 112 L136 184 L118 184Z', vestG, INK, 1.5) + P('M188 110 L170 112 L164 184 L182 184Z', vestG, INK, 1.5));
    s += P('M134 132 L160 150', 'none', '#e8a090', 2) + P('M134 132 L160 150', 'none', '#a04a3a', 0.8);
  } else {
    s += ma_cel(d, torso, ma_vg(d, cloth), P('M150 104 L150 184', 'none', clothDk, 2) + E(180, 150, 14, 50, clothDk, { opacity: 0.6 }) +
      P('M120 112 L178 176', 'none', leather, 7) +
      R(136, 124, 6, 16, '#a88a50', { transform: 'rotate(-48 139 132)', stroke: INK, 'stroke-width': 1 }) + R(156, 146, 6, 16, '#a88a50', { transform: 'rotate(-48 159 154)', stroke: INK, 'stroke-width': 1 }));
  }
  s += R(126, 176, 48, 9, leather, { stroke: INK, 'stroke-width': 1.8 }) + R(144, 175, 12, 11, '#d0b060', { stroke: INK, 'stroke-width': 1.4 });
  s += P('M130 185 L146 185 L142 210 L136 206 L132 214Z', cut ? '#7a2a24' : '#3a3c58', INK, 1.6);
  var arm = cut ? ma_lg(d, skin) : ma_lg(d, cloth), aw = cut ? 12 : 10, glove = cut ? arm : ma_lg(d, leather);
  s += ma_L(116, 116, 98, 154, aw, aw - 2, arm) + ma_L(98, 154, 86, 186, aw - 2, aw - 3, glove);
  s += P(cut ? 'M84 194 C70 206 62 222 66 244 C72 232 80 220 90 206Z' : 'M82 196 L68 240 L74 240 L88 198Z', steel, INK, 1.6);
  s += R(78, 190, 14, 5, '#c8a050', { stroke: INK, 'stroke-width': 1.2, transform: 'rotate(20 85 192)' });
  s += C(86, 190, 8, skin, { stroke: INK, 'stroke-width': 2 });
  s += ma_L(184, 116, 208, 142, aw, aw - 2, arm) + ma_L(208, 142, 214, 102, aw - 2, aw - 3, glove);
  s += P(cut ? 'M212 92 C206 72 210 52 226 38 C222 56 222 74 220 92Z' : 'M211 92 L218 36 L224 92Z', steel, INK, 1.6);
  s += R(204, 90, 20, 5, '#c8a050', { stroke: INK, 'stroke-width': 1.2 });
  s += C(214, 99, 8, skin, { stroke: INK, 'stroke-width': 2 });
  s += P(cut ? 'M214 86 L214 50' : 'M217 86 L218 46', 'none', '#fff', 1.2, { opacity: 0.8 });
  s += R(141, 96, 18, 16, shadow(skin));
  var face = 'M150 52 C168 52 176 66 175 84 C174 100 164 112 150 118 C136 112 126 100 125 84 C124 66 132 52 150 52Z';
  if (!cut) {
    s += P('M150 38 C118 40 104 66 108 94 C110 110 118 118 124 122 L176 122 C182 118 190 110 192 94 C196 66 182 40 150 38Z', d.lin([[0, '#44466a'], [1, '#1c1c2c']]), INK, 2.4);
  }
  s += ma_cel(d, face, skin, E(176, 90, 14, 40, shadow(skin), { opacity: 0.6 }) + (cut ? '' : P('M120 50 L180 50 L180 72 Q150 64 120 72Z', '#000', null, null, { opacity: 0.35 })), 2);
  if (cut) {
    s += P('M124 82 C120 58 136 44 152 46 C170 46 182 60 176 82 L170 70 L162 76 L156 66 L146 74 L138 66 L132 76Z', '#2a1a14', INK, 1.8);
    s += P('M124 72 C130 52 172 50 178 72 C172 62 130 62 124 72Z', '#9a2a22', INK, 1.8) + P('M176 66 L196 74 L188 80 L198 90 L178 78Z', '#9a2a22', INK, 1.6);
  } else {
    s += P('M128 74 L134 88 L138 74 L146 90 L150 74 L156 90 L160 74 L166 88 L172 74 C164 62 136 62 128 74Z', '#d8dde8', INK, 1.5);
    s += P('M150 38 C118 40 104 66 108 94 C110 108 116 116 122 120 C118 100 120 70 150 60 C180 70 182 100 178 120 C184 116 190 108 192 94 C196 66 182 40 150 38Z', d.lin([[0, '#55587e'], [1, '#262638']]), INK, 2.2);
    s += P('M150 38 C164 30 176 26 190 30 C178 34 170 40 166 46Z', '#3a3c58', INK, 2);
  }
  [-1, 1].forEach(function (k) {
    var ex = 150 + 12 * k;
    if (cut && k === 1) {
      s += P('M130 80 L186 74', 'none', '#1a1010', 2) + E(ex, 87, 8, 6, '#1a1010', { stroke: INK, 'stroke-width': 1.5 });
      return;
    }
    s += P('M' + f(ex - 8 * k) + ' 86 Q' + f(ex) + ' 81 ' + f(ex + 8 * k) + ' 84 Q' + f(ex + 2 * k) + ' 91 ' + f(ex - 7 * k) + ' 89Z', '#fff', INK, 1);
    s += C(ex - 0.5 * k, 86.5, 3.4, eyeC, { filter: gl }) + C(ex - 0.5 * k, 86.5, 1.5, '#200') + C(ex - 1.5 * k, 85, 1, '#fff');
    s += P('M' + f(ex - 9 * k) + ' 85 Q' + f(ex) + ' 79 ' + f(ex + 10 * k) + ' 83', 'none', INK, 2.2);
    s += P('M' + f(ex - 9 * k) + ' 77 L' + f(ex + 9 * k) + ' 80', 'none', cut ? '#2a1a14' : '#c8ccd8', 2.4);
  });
  if (cut) {
    s += P('M140 104 Q150 108 162 102', 'none', INK, 1.6) + P('M144 104 L146 107 M150 105 L151 108 M156 104 L156 107', 'none', '#fff', 1);
    s += P('M134 76 L142 98', 'none', '#b05040', 1.6) + P('M128 96 Q150 122 174 96', 'none', '#3a2418', 1, { opacity: 0.5 });
  } else {
    s += P('M125 93 C134 98 166 98 175 93 C176 106 164 118 150 120 C136 118 124 106 125 93Z', d.lin([[0, '#3a3c58'], [1, '#1a1a28']]), INK, 1.8);
    s += P('M134 104 Q150 108 166 104', 'none', '#5a5e88', 1.2);
  }
  return s;
}
MONSTERS.thief = function (d) { return ma_rogue(d, false); };
MONSTERS.cutthroat = function (d) { return ma_rogue(d, true); };

/* ---------------- slime ---------------- */
MONSTERS.slime = function (d) {
  var gl = d.glow(4, 1);
  var s = ma_sh(d, 150, 110, 278, 0.45);
  s += E(150, 274, 112, 14, '#3fbf4a', { opacity: 0.55 });
  var blob = 'M150 92 C158 112 176 116 196 128 C228 148 248 186 252 222 C256 262 226 276 150 276 C74 276 44 262 48 222 C52 186 72 148 104 128 C124 116 144 112 150 92Z';
  s += P(blob, '#6cff6a', null, null, { opacity: 0.35, filter: gl });
  s += P(blob, d.rad([[0, '#d8ffb0'], [0.45, '#5fe05a'], [0.85, '#1f9a3a'], [1, '#0e5a28']], 0.4, 0.35, 0.75), INK, 3, { 'fill-opacity': 0.92 });
  s += E(150, 238, 60, 22, '#0e6a2a', { opacity: 0.35 });
  s += P('M120 244 L138 238 L134 250Z', '#e8e0c8', null, null, { opacity: 0.5 }) + C(176, 248, 7, '#e8c040', { opacity: 0.55 }) + C(188, 242, 5, '#e8c040', { opacity: 0.45 });
  s += C(96, 230, 6, '#c8ffc0', { opacity: 0.5 }) + C(210, 214, 4, '#c8ffc0', { opacity: 0.5 }) + C(110, 252, 3.5, '#c8ffc0', { opacity: 0.5 }) + C(200, 182, 3, '#c8ffc0', { opacity: 0.6 });
  s += P('M76 214 C78 172 104 140 136 128', 'none', '#fff', 9, { opacity: 0.55 }) + C(146, 116, 4, '#fff', { opacity: 0.8 }) + E(226, 230, 6, 14, '#fff', { opacity: 0.25 });
  [-1, 1].forEach(function (k) {
    var ex = 150 + 28 * k;
    s += E(ex, 196, 12, 16, '#0a2a12') + C(ex - 4, 190, 5, '#fff') + C(ex + 3, 201, 2, '#fff') + E(ex, 202, 6, 4, '#ff3a3a', { opacity: 0.8, filter: gl });
    s += P('M' + f(150 + 46 * k) + ' 172 L' + f(150 + 14 * k) + ' 184', 'none', '#0a2a12', 5);
  });
  s += P('M116 222 Q150 252 184 222 Q150 236 116 222Z', '#0a2a12') + P('M124 226 L130 236 L134 229Z M166 229 L170 236 L176 226Z', '#fff');
  s += P('M70 250 Q66 266 72 270 Q78 266 74 250Z M228 248 Q232 264 226 270 Q220 264 224 248Z', '#4cd458', INK, 1.5);
  return s;
};

/* ---------------- spider ---------------- */
MONSTERS.spider = function (d) {
  var chit = '#2e2438', hi = '#6a5488', gl = d.glow(2.2, 2), lg = d.lin([[0, hi], [0.4, chit], [1, '#120c18']], 0, 0, 1, 1);
  var s = ma_sh(d, 150, 130);
  var legs = [
    [[134, 152], [104, 62], [92, 268]],
    [[128, 162], [44, 84], [14, 262]],
    [[126, 176], [26, 158], [46, 284]],
    [[132, 188], [94, 128], [68, 82]]
  ];
  function leg(Lg) {
    return ma_L(Lg[0][0], Lg[0][1], Lg[1][0], Lg[1][1], 10, 7.5, lg, 2.4) + ma_L(Lg[1][0], Lg[1][1], Lg[2][0], Lg[2][1], 7.5, 2.5, lg, 2.4) + P('M' + f((Lg[1][0] * 2 + Lg[2][0]) / 3) + ' ' + f((Lg[1][1] * 2 + Lg[2][1]) / 3) + ' l-4 -6 M' + f((Lg[1][0] + Lg[2][0] * 2) / 3) + ' ' + f((Lg[1][1] + Lg[2][1] * 2) / 3) + ' l-4 -6', 'none', INK, 1.4) +
      C(Lg[1][0], Lg[1][1], 9, chit, { stroke: INK, 'stroke-width': 2 }) + C(Lg[1][0] - 2, Lg[1][1] - 2, 2.5, hi);
  }
  var back = leg(legs[0]) + leg(legs[1]);
  s += back + M(back, 150);
  var abd = 'M150 40 C200 40 226 76 222 116 C218 150 186 170 150 170 C114 170 82 150 78 116 C74 76 100 40 150 40Z';
  s += ma_cel(d, abd, d.rad([[0, '#5a4870'], [0.6, chit], [1, '#0e0814']], 0.4, 0.3, 0.8),
    P('M150 60 L170 92 L150 104 L130 92Z M150 112 L166 136 L150 150 L134 136Z', '#d0202a', INK, 1.5) +
    P('M100 80 Q150 56 200 80 M92 110 Q150 96 208 110', 'none', '#7a6498', 2, { opacity: 0.5 }) + E(124, 70, 18, 8, '#fff', { opacity: 0.2 }), 3);
  var front = leg(legs[2]) + leg(legs[3]);
  s += front + M(front, 150);
  s += ma_L(136, 200, 120, 222, 5, 3.5, lg, 1.8) + ma_L(164, 200, 180, 222, 5, 3.5, lg, 1.8);
  var ceph = 'M150 150 C176 150 192 168 190 190 C188 210 170 222 150 222 C130 222 112 210 110 190 C108 168 124 150 150 150Z';
  s += ma_cel(d, ceph, d.rad([[0, '#6a5488'], [0.6, chit], [1, '#0e0814']], 0.4, 0.3, 0.8), E(140, 162, 16, 6, '#fff', { opacity: 0.2 }), 3);
  var fg = d.lin([[0, '#3a2a48'], [1, '#d8d0c0']]);
  s += P('M136 210 C130 224 132 238 142 246 C140 234 142 224 146 214Z', fg, INK, 1.8);
  s += P('M164 210 C170 224 168 238 158 246 C160 234 158 224 154 214Z', fg, INK, 1.8);
  s += P('M142 246 Q141 256 143 260 Q145 256 143 246Z', '#7aff5a', null, null, { filter: gl, opacity: 0.9 });
  s += ma_eye(gl, 138, 182, 6.5, '#ff2a2a') + ma_eye(gl, 162, 182, 6.5, '#ff2a2a');
  s += ma_eye(gl, 126, 170, 3.5, '#ff4a3a') + ma_eye(gl, 174, 170, 3.5, '#ff4a3a') + ma_eye(gl, 142, 166, 3.2, '#ff4a3a') + ma_eye(gl, 158, 166, 3.2, '#ff4a3a');
  return s;
};

/* ---------------- bat ---------------- */
MONSTERS.bat = function (d) {
  var fur = '#3e2c44', gl = d.glow(2.5, 2);
  var s = ma_sh(d, 150, 70, 282, 0.3);
  var wing = 'M140 132 C110 92 62 62 10 62 C24 78 28 92 24 108 C40 104 54 110 56 126 C70 118 86 124 88 140 C102 134 116 142 120 160 C128 152 136 152 140 160Z';
  var w = ma_cel(d, wing, d.lin([[0, '#6a3a6a'], [0.6, '#3a1c40'], [1, '#1c0c22']], 1, 0, 0, 1),
    P('M136 136 L62 84 M62 84 L12 64 M62 84 L26 106 M62 84 L56 124 M86 108 L88 138 M104 120 L118 158', 'none', '#1a0a1e', 2.4) +
    P('M136 132 L64 82', 'none', '#a070a0', 1.2, { opacity: 0.6 }) + C(62, 84, 3.5, '#d8c8d0', { stroke: INK, 'stroke-width': 1 }), 2.4);
  s += w + M(w, 150);
  s += ma_cel(d, 'M150 116 C172 116 180 140 178 162 C176 186 162 200 150 200 C138 200 124 186 122 162 C120 140 128 116 150 116Z', ma_vg(d, fur),
    E(150, 168, 14, 22, '#6a5470') + E(172, 170, 10, 30, '#1a0e1e', { opacity: 0.6 }), 2.4);
  s += P('M138 196 L134 210 L140 204 L142 212 L146 200Z M162 196 L166 210 L160 204 L158 212 L154 200Z', '#d8c8b8', INK, 1.4);
  var ear = P('M134 102 L114 52 L148 92Z', fur, INK, 2.2) + P('M134 98 L120 64 L142 92Z', '#b05a7a');
  s += ear + M(ear, 150);
  s += ma_cel(d, 'M150 88 C168 88 176 100 174 114 C172 128 162 138 150 138 C138 138 128 128 126 114 C124 100 132 88 150 88Z', ma_vg(d, fur), E(170, 120, 8, 18, '#1a0e1e', { opacity: 0.5 }), 2.2);
  s += P('M144 112 L150 118 L156 112 L150 108Z', '#2a1a2a', INK, 1.2);
  s += P('M138 122 Q150 136 162 122 Q150 126 138 122Z', '#5a0d18', INK, 1.4) + P('M141 123 L143 131 L145 124Z M159 123 L157 131 L155 124Z', '#fff', INK, 0.8);
  s += P('M132 100 L146 106 L136 110Z', '#ff2a2a', INK, 1, { filter: gl }) + P('M168 100 L154 106 L164 110Z', '#ff2a2a', INK, 1, { filter: gl });
  return s;
};

/* ---------------- kobold ---------------- */
MONSTERS.kobold = function (d) {
  var sc = '#c4562e', bel = '#eba468', gl = d.glow(2, 2), lg = ma_lg(d, sc);
  var s = ma_sh(d, 150, 80);
  s += ma_cel(d, 'M168 196 C206 206 238 236 270 266 C236 262 206 240 166 218Z', ma_vg(d, sc), P('M180 210 L196 218 M206 226 L220 238 M232 246 L246 256', 'none', shadow(sc), 2), 2.2);
  s += P('M98 280 L120 40', 'none', INK, 7) + P('M98 280 L120 40', 'none', '#8a5a30', 4);
  s += P('M120 22 L128 46 L120 52 L112 44Z', d.lin([[0, '#e8eef6'], [1, '#6a7488']], 0, 0, 1, 0), INK, 1.8) + P('M114 50 L124 56 M113 54 L123 60', 'none', '#c84a2a', 2);
  [-1, 1].forEach(function (k) {
    var fx = 150 + 22 * k;
    s += ma_L(150 + 14 * k, 198, 150 + 28 * k, 234, 12, 9, lg) + ma_L(150 + 28 * k, 234, fx, 266, 8, 6, lg);
    s += P('M' + f(fx - 13) + ' 264 L' + f(fx + 13) + ' 264 L' + f(fx + 17) + ' 276 L' + f(fx - 17) + ' 276Z', sc, INK, 1.8) +
      P('M' + f(fx - 17) + ' 276 l-4 2 M' + f(fx) + ' 276 l0 4 M' + f(fx + 17) + ' 276 l4 2', 'none', '#f4ead0', 2);
  });
  var torso = 'M128 134 C116 150 116 186 124 202 L176 202 C184 186 184 150 172 134 C162 128 138 128 128 134Z';
  s += ma_cel(d, torso, ma_vg(d, sc), P('M134 146 C140 140 160 140 166 146 L168 196 L132 196Z', bel) + P('M134 158 L166 158 M133 170 L167 170 M133 182 L167 182', 'none', '#c87a40', 1.6) + E(178, 170, 10, 34, shadow(sc), { opacity: 0.6 }));
  s += P('M128 140 L172 196', 'none', '#5a3a20', 6) + P('M122 192 L178 192 L174 220 L160 212 L150 224 L140 212 L126 220Z', '#7a5230', INK, 1.8);
  s += ma_L(128, 142, 106, 168, 9, 7, lg) + ma_L(106, 168, 110, 150, 7, 6, lg) + C(110, 148, 7, sc, { stroke: INK, 'stroke-width': 1.8 });
  s += ma_L(172, 142, 192, 170, 9, 7, lg) + ma_L(192, 170, 198, 196, 7, 6, lg);
  s += ma_cel(d, 'M198 160 C214 162 222 178 220 194 C218 210 206 218 196 214 C184 210 180 194 182 178 C184 166 190 160 198 160Z', d.rad([[0, '#a8743a'], [1, '#5a3a18']]),
    C(200, 188, 6, '#b0b8c4', { stroke: INK, 'stroke-width': 1.2 }) + P('M186 176 L216 176 M184 196 L218 196', 'none', '#3a2410', 1.4), 2.2);
  var horn = P('M128 78 C114 62 100 56 90 62 C104 66 112 76 120 90Z', '#e8dcc0', INK, 1.8);
  s += horn + M(horn, 150);
  var head = 'M150 64 C174 64 186 82 184 100 C182 118 170 132 150 138 C130 132 118 118 116 100 C114 82 126 64 150 64Z';
  s += ma_cel(d, head, ma_vg(d, sc), P('M134 110 C138 102 162 102 166 110 C166 124 158 134 150 138 C142 134 134 124 134 110Z', bel) + E(182, 104, 12, 30, shadow(sc), { opacity: 0.6 }) +
    P('M142 72 L150 66 L158 72 M140 82 L150 76 L160 82', 'none', shadow(sc), 1.6));
  s += P('M136 126 Q150 134 164 126', 'none', INK, 1.8) + P('M140 127 L142 131 L144 128Z M156 128 L158 131 L160 127Z', '#fff', INK, 0.8);
  s += C(145, 114, 1.6, INK) + C(155, 114, 1.6, INK);
  [-1, 1].forEach(function (k) {
    var ex = 150 + 15 * k;
    s += P('M' + f(ex - 8 * k) + ' 96 Q' + f(ex) + ' 89 ' + f(ex + 9 * k) + ' 92 Q' + f(ex + 3 * k) + ' 102 ' + f(ex - 7 * k) + ' 99Z', '#ffd23a', INK, 1.4, { filter: gl });
    s += E(ex, 96, 1.4, 4, '#200');
    s += P('M' + f(ex - 10 * k) + ' 88 L' + f(ex + 10 * k) + ' 92', 'none', INK, 2.6);
  });
  return s;
};

/* ---------------- goblin ---------------- */
MONSTERS.goblin = function (d) {
  var sk = '#74ad52', gl = d.glow(2, 2), lg = ma_lg(d, sk);
  var s = ma_sh(d, 150, 80);
  [-1, 1].forEach(function (k) {
    var fx = 150 + 20 * k;
    s += ma_L(150 + 14 * k, 206, 150 + 26 * k, 240, 9, 7, lg) + ma_L(150 + 26 * k, 240, fx, 268, 7, 6, lg);
    s += P('M' + f(fx - 8 * k) + ' 264 C' + f(fx + 10 * k) + ' 262 ' + f(fx + 26 * k) + ' 268 ' + f(fx + 26 * k) + ' 276 L' + f(fx - 12 * k) + ' 276Z', sk, INK, 1.8);
  });
  var body = 'M126 136 C110 150 106 190 118 212 L182 212 C194 190 190 150 174 136 C160 130 140 130 126 136Z';
  s += ma_cel(d, body, ma_vg(d, sk), E(150, 186, 26, 22, shade(sk, 0.2)) + E(182, 176, 12, 40, shadow(sk), { opacity: 0.6 }));
  s += P('M116 150 L130 140 L172 140 L186 150 L182 196 L174 188 L166 200 L156 190 L148 202 L138 190 L128 200 L118 192Z', d.lin([[0, '#7a5a3a'], [1, '#4a3420']]), INK, 2) + E(150, 186, 22, 14, sk) +
    P('M118 198 L182 198 L176 230 L166 220 L156 234 L146 222 L136 234 L126 220Z', '#5a4028', INK, 1.8) + R(116, 196, 68, 7, '#3a2414', { stroke: INK, 'stroke-width': 1.5 });
  s += ma_L(124, 146, 102, 176, 8, 6, lg) + ma_L(102, 176, 98, 206, 6, 5, lg);
  s += P('M92 206 L96 218 M98 208 L100 220 M104 206 L106 216', 'none', INK, 2.4) + C(98, 206, 7, sk, { stroke: INK, 'stroke-width': 1.8 });
  s += P('M206 92 L232 26 L262 38 L238 100Z', d.lin([[0, '#d8dee6'], [0.6, '#8a929e'], [1, '#5a5048']], 0, 0, 1, 0), INK, 2.2) + P('M232 26 L262 38', 'none', '#fff', 1.4) +
    C(244, 58, 2.5, '#5a4a40') + P('M216 70 L226 74 M238 82 L230 90', 'none', '#8a4a2a', 3, { opacity: 0.6 });
  s += P('M214 98 L222 116', 'none', INK, 7) + P('M214 98 L222 116', 'none', '#5a3a20', 4.5);
  s += ma_L(176, 146, 204, 132, 8, 6, lg) + ma_L(204, 132, 216, 108, 6, 5, lg) + C(217, 106, 7, sk, { stroke: INK, 'stroke-width': 1.8 });
  var ear = 'M118 94 C92 84 60 68 30 70 C52 88 80 112 118 116Z';
  var ears = ma_cel(d, ear, ma_vg(d, sk), P('M112 98 C90 90 70 82 50 78 C70 94 90 106 112 110Z', '#c4757a', null, null, { opacity: 0.7 }), 2.2);
  s += ears + M(ears, 150);
  var head = 'M150 56 C180 56 194 80 192 104 C190 126 174 142 150 144 C126 142 110 126 108 104 C106 80 120 56 150 56Z';
  s += ma_cel(d, head, ma_vg(d, sk), E(188, 110, 16, 40, shadow(sk), { opacity: 0.55 }) + E(132, 72, 16, 8, '#fff', { opacity: 0.2 }));
  s += P('M136 58 L130 40 L142 54 L146 34 L152 54 L162 38 L160 58', '#2a2020', INK, 1.5);
  [-1, 1].forEach(function (k) {
    var ex = 150 + 18 * k;
    s += P('M' + f(ex - 11 * k) + ' 98 Q' + f(ex) + ' 86 ' + f(ex + 12 * k) + ' 90 Q' + f(ex + 6 * k) + ' 104 ' + f(ex - 10 * k) + ' 101Z', '#ffe14a', INK, 1.6, { filter: gl });
    s += E(ex + 1 * k, 95, 2, 5, '#c41010') + C(ex - 3 * k, 92, 1.5, '#fff');
    s += P('M' + f(ex - 14 * k) + ' 84 L' + f(ex + 14 * k) + ' 90', 'none', '#2a4018', 4);
  });
  s += P('M148 96 C158 104 164 118 154 124 C148 126 144 120 146 114Z', shade(sk, 0.1), INK, 1.6);
  s += P('M118 118 C134 140 166 140 184 116 C168 128 134 130 118 118Z', '#3a0a12', INK, 1.8);
  s += P('M122 121 L128 130 L132 124 L138 133 L142 126 L148 134 L152 127 L158 133 L162 125 L168 131 L172 123 L178 125Z', '#f8f0d0');
  return s;
};

/* ---------------- orc ---------------- */
MONSTERS.orc = function (d) {
  var sk = '#6a8a50', gl = d.glow(2, 2), lg = ma_lg(d, sk), metal = d.lin([[0, '#c8ccd4'], [0.5, '#6a707c'], [1, '#2e323a']]);
  var s = ma_sh(d, 150, 110);
  s += P('M200 260 L240 46', 'none', INK, 9) + P('M200 260 L240 46', 'none', '#6a4424', 6);
  s += ma_cel(d, 'M236 52 C252 20 288 22 296 54 C284 64 276 82 278 104 C262 92 248 86 232 86Z', d.lin([[0, '#e8ecf2'], [0.5, '#9aa2ae'], [1, '#4a505a']], 1, 0, 0, 1),
    P('M244 40 C262 26 284 30 292 52', 'none', '#fff', 2.5, { opacity: 0.8 }) + P('M256 70 L266 64 M262 80 L270 78', 'none', '#7a2a1a', 3, { opacity: 0.6 }), 2.4);
  s += P('M232 50 L210 40 L220 60 L206 66 L230 82Z', metal, INK, 2);
  var bootG = ma_lg(d, '#4a3224');
  [-1, 1].forEach(function (k) {
    var lx = 150 + 36 * k;
    s += ma_L(150 + 22 * k, 206, lx, 244, 20, 15, lg);
    s += ma_L(lx, 240, lx, 268, 15, 14, bootG);
    s += P('M' + f(lx - 20) + ' 262 L' + f(lx + 20) + ' 262 L' + f(lx + 24) + ' 278 L' + f(lx - 24) + ' 278Z', '#3a2618', INK, 2);
    s += P('M' + f(lx - 15) + ' 246 L' + f(lx + 15) + ' 246', 'none', '#2a1a10', 3);
  });
  var torso = 'M98 110 C88 140 102 180 116 204 L184 204 C198 180 212 140 202 110 C182 98 118 98 98 110Z';
  s += ma_cel(d, torso, ma_vg(d, sk), P('M150 118 L150 196 M118 132 Q134 150 150 140 Q166 150 182 132 M128 162 L172 162 M130 178 L170 178', 'none', shadow(sk), 2, { opacity: 0.8 }) +
    E(196, 150, 18, 60, shadow(sk), { opacity: 0.55 }) + E(126, 128, 16, 8, '#fff', { opacity: 0.18 }) + E(174, 128, 16, 8, '#fff', { opacity: 0.18 }));
  s += P('M104 112 L196 196', 'none', '#3a2414', 9) + P('M104 112 L196 196', 'none', '#6a4a2a', 6) + C(150, 154, 6, '#b0b4bc', { stroke: INK, 'stroke-width': 1.4 });
  s += R(112, 196, 76, 14, '#3a2414', { stroke: INK, 'stroke-width': 2 }) + P('M128 210 L172 210 L166 252 L150 244 L134 252Z', '#6a2a1e', INK, 2);
  s += ma_cel(d, 'M150 192 C160 192 166 198 166 206 C166 214 160 220 150 220 C140 220 134 214 134 206 C134 198 140 192 150 192Z', '#e8dcc0', C(145, 204, 3, '#2a1a10') + C(155, 204, 3, '#2a1a10') + P('M146 214 L154 214', 'none', '#2a1a10', 1.5), 1.6);
  s += ma_L(96, 120, 82, 170, 19, 15, lg) + ma_L(82, 170, 86, 212, 15, 12, lg) + ma_L(84, 186, 86, 210, 14, 13, bootG) + C(86, 218, 13, sk, { stroke: INK, 'stroke-width': 2 });
  s += ma_L(204, 120, 220, 166, 19, 15, lg) + ma_L(220, 166, 212, 204, 15, 12, lg) + ma_L(218, 180, 212, 202, 14, 13, bootG) + C(210, 210, 13, sk, { stroke: INK, 'stroke-width': 2 });
  var pd = 'M70 112 C72 84 108 80 124 102 C122 122 98 134 74 130Z';
  var pauld = P('M80 96 L66 72 L92 88Z M98 86 L96 60 L110 84Z', metal, INK, 1.8) + ma_cel(d, pd, metal, P('M80 104 Q96 92 116 100', 'none', '#fff', 2, { opacity: 0.6 }), 2.4);
  s += pauld + M(pauld, 150);
  s += R(136, 96, 28, 16, shadow(sk));
  var ear = P('M122 70 L104 58 L124 82Z', sk, INK, 1.8);
  s += ear + M(ear, 150);
  var head = 'M150 40 C172 40 182 54 182 72 C182 92 172 106 150 110 C128 106 118 92 118 72 C118 54 128 40 150 40Z';
  s += ma_cel(d, head, ma_vg(d, sk), E(180, 80, 12, 34, shadow(sk), { opacity: 0.55 }));
  s += P('M140 44 C138 22 162 22 160 44 Z M150 30 C170 26 182 40 184 60 C176 46 166 40 154 40Z', '#1a1418', INK, 1.6);
  s += P('M126 86 C132 108 168 108 174 86 C164 96 136 96 126 86Z', shade(sk, 0.08), INK, 1.8);
  s += P('M134 94 L130 72 L141 92Z', '#f4ead0', INK, 1.4) + P('M166 94 L170 72 L159 92Z', '#f4ead0', INK, 1.4);
  s += P('M124 66 L148 74 L152 74 L176 66 L176 60 L150 68 L124 60Z', shadow(sk), INK, 1.6);
  s += P('M128 70 L144 76 L132 78Z', '#ff2a1a', INK, 1, { filter: gl }) + P('M172 70 L156 76 L168 78Z', '#ff2a1a', INK, 1, { filter: gl });
  s += P('M146 80 L150 86 L154 80', 'none', INK, 1.5) + P('M168 50 L160 66', 'none', '#c86a5a', 2);
  return s;
};

/* ---------------- wolf ---------------- */
MONSTERS.wolf = function (d) {
  var fur = '#8a9bb4', dk = '#3c4a66', lt = '#e2eaf4', gl = d.glow(2.5, 2), lg = ma_lg(d, fur);
  var s = ma_sh(d, 150, 120);
  s += ma_L(118, 196, 122, 240, 13, 9, shadow(fur)) + ma_L(122, 240, 118, 268, 9, 7, shadow(fur)) + ma_L(206, 210, 212, 244, 14, 9, shadow(fur)) + ma_L(212, 244, 204, 268, 9, 7, shadow(fur));
  s += E(116, 271, 11, 5, dk, { stroke: INK, 'stroke-width': 1.8 }) + E(202, 271, 11, 5, dk, { stroke: INK, 'stroke-width': 1.8 });
  s += ma_cel(d, 'M252 168 C278 160 296 138 288 104 C300 128 302 166 282 190 C274 198 262 198 256 192Z', ma_vg(d, fur), P('M292 120 C296 150 286 176 268 190', 'none', lt, 3, { opacity: 0.6 }), 2.2);
  s += P('M90 138 L96 112 L106 132 L114 104 L124 128 L136 102 L144 126 L158 104 L164 128 L180 112 L184 134 L200 122 L198 150 L92 150Z', fur, INK, 2);
  var body = 'M70 150 C100 124 170 128 212 136 C248 142 268 168 262 200 C258 222 240 230 224 232 L120 228 C96 224 78 198 70 150Z';
  s += ma_cel(d, body, ma_vg(d, fur), E(170, 238, 110, 30, dk, { opacity: 0.8 }) + P('M100 140 Q160 126 236 146', 'none', lt, 5, { opacity: 0.45 }) +
    P('M130 170 Q150 164 168 172 M180 160 Q198 156 214 164', 'none', dk, 1.8, { opacity: 0.6 }));
  s += P('M74 160 C78 184 86 204 100 214 L104 202 L110 214 L114 198 C102 186 94 168 92 150Z', lt, INK, 1.8);
  s += ma_cel(d, 'M206 200 C204 170 248 164 260 190 C268 210 254 232 232 234 C216 234 208 220 206 200Z', fur, E(240, 230, 28, 14, dk, { opacity: 0.7 }), 2.2);
  s += ma_L(236, 220, 252, 248, 14, 10, lg) + ma_L(252, 248, 242, 268, 10, 8, lg) + E(240, 271, 13, 5.5, fur, { stroke: INK, 'stroke-width': 1.8 });
  s += ma_cel(d, 'M76 176 C80 160 112 160 116 182 C118 200 104 214 94 236 L80 236 C78 216 72 196 76 176Z', fur, E(108, 210, 14, 30, dk, { opacity: 0.5 }), 2.2) + ma_L(86, 232, 74, 266, 10, 8, lg) + E(70, 270, 13, 5.5, fur, { stroke: INK, 'stroke-width': 1.8 });
  s += P('M60 272 l-3 2 M66 274 l-1 3 M74 274 l0 3', 'none', '#f0f0f0', 1.6);
  s += P('M98 150 L60 168 L20 178 L26 192 L64 194 C82 194 96 184 100 172Z', '#5a0d18', INK, 2);
  s += ma_cel(d, 'M70 170 L22 182 C16 184 18 192 26 192 L64 194 C80 194 92 186 96 176Z', ma_vg(d, fur), E(60, 196, 30, 6, dk, { opacity: 0.6 }), 2);
  s += P('M28 182 L32 174 L35 183Z M54 178 L57 171 L60 178Z', '#f8f4e8', INK, 1);
  s += ma_cel(d, 'M104 138 C88 124 62 126 44 138 L14 154 C8 158 10 166 18 167 L64 170 C82 170 98 162 106 150Z', ma_vg(d, fur),
    P('M40 140 Q70 126 100 136', 'none', lt, 3, { opacity: 0.5 }) + P('M26 156 L58 150 M30 162 L60 160', 'none', dk, 1.4, { opacity: 0.6 }), 2.2);
  s += P('M20 166 L22 176 L26 167Z M34 167 L36 180 L40 168Z M50 168 L52 176 L55 168Z', '#f8f4e8', INK, 1);
  s += E(13, 158, 6, 4.5, '#141418', { stroke: INK, 'stroke-width': 1 }) + C(11, 156, 1.4, '#fff', { opacity: 0.8 });
  s += P('M86 132 L98 92 L112 138Z', fur, INK, 2) + P('M92 128 L98 104 L106 132Z', dk);
  s += P('M78 130 L82 102 L92 128Z', shadow(fur), INK, 1.6);
  s += P('M52 142 L72 136 L76 146Z', '#7ae8ff', INK, 1.4, { filter: gl }) + C(68, 142, 1.6, '#003');
  s += P('M48 136 L78 132', 'none', INK, 2.6);
  s += C(8, 186, 5, '#cfefff', { opacity: 0.4 }) + C(4, 198, 3.5, '#cfefff', { opacity: 0.3 });
  return s;
};

/* ---------------- imp ---------------- */
MONSTERS.imp = function (d) {
  var sk = '#c8343a', gl = d.glow(3, 2), lg = ma_lg(d, sk);
  var s = ma_sh(d, 150, 60, 282, 0.3);
  var wing = 'M134 128 C104 86 64 62 30 70 C44 80 48 94 44 106 C58 102 68 108 70 120 C82 114 94 120 96 132 C108 128 120 134 128 146Z';
  var w = ma_cel(d, wing, d.lin([[0, '#7a1a3a'], [1, '#2a0814']], 1, 0, 0, 1), P('M132 130 L70 84 M70 84 L32 72 M70 84 L46 104 M70 84 L70 118 M92 104 L96 130', 'none', '#1a0610', 2), 2.2);
  s += w + M(w, 150);
  var tl = 'M156 180 C196 204 232 190 238 222 C242 242 226 250 216 240';
  s += P(tl, 'none', INK, 8) + P(tl, 'none', sk, 4.5);
  s += P('M216 240 L198 248 L210 236 L204 222 L222 236Z', '#8a1a24', INK, 1.8);
  s += ma_L(140, 180, 122, 204, 8, 6, lg) + ma_L(122, 204, 130, 228, 6, 5, lg) + P('M122 226 L138 226 L140 234 L120 234Z', shadow(sk), INK, 1.6);
  s += ma_L(160, 180, 180, 198, 8, 6, lg) + ma_L(180, 198, 186, 222, 6, 5, lg) + P('M178 220 L194 220 L196 228 L176 228Z', shadow(sk), INK, 1.6);
  s += ma_cel(d, 'M134 124 C124 140 126 170 136 186 L164 186 C174 170 176 140 166 124Z', ma_vg(d, sk), E(166, 160, 8, 30, shadow(sk), { opacity: 0.6 }) + P('M150 140 L150 176 M140 156 L160 156', 'none', shadow(sk), 1.4));
  s += P('M132 178 L168 178 L162 196 L150 190 L138 196Z', '#2a1418', INK, 1.6);
  s += ma_L(166, 132, 188, 148, 7, 5, lg) + ma_L(188, 148, 176, 168, 5, 4.5, lg) + C(175, 170, 5, sk, { stroke: INK, 'stroke-width': 1.6 });
  s += ma_L(134, 132, 110, 124, 7, 5, lg) + ma_L(110, 124, 100, 100, 5, 4.5, lg) + C(99, 97, 6, sk, { stroke: INK, 'stroke-width': 1.6 });
  s += C(96, 70, 26, '#ff8a20', { opacity: 0.35, filter: gl });
  s += P('M96 92 C78 92 70 74 78 60 C80 70 86 66 84 56 C92 62 94 50 94 42 C104 52 104 60 108 54 C116 66 114 90 96 92Z', d.rad([[0, '#fffbd0'], [0.4, '#ffd040'], [0.8, '#ff6a10'], [1, '#c41a10']], 0.5, 0.7, 0.7), INK, 1.4, { filter: gl });
  var horn = P('M132 82 C120 62 124 44 136 34 C134 52 138 66 144 76Z', '#2a1418', INK, 1.6);
  s += horn + M(horn, 150);
  var ear = P('M122 96 L96 84 L122 108Z', sk, INK, 1.8);
  s += ear + M(ear, 150);
  s += ma_cel(d, 'M150 70 C170 70 182 84 180 102 C178 118 166 128 150 130 C134 128 122 118 120 102 C118 84 130 70 150 70Z', ma_vg(d, sk), E(178, 104, 10, 26, shadow(sk), { opacity: 0.6 }) + E(138, 80, 10, 5, '#fff', { opacity: 0.25 }));
  [-1, 1].forEach(function (k) {
    var ex = 150 + 13 * k;
    s += P('M' + f(ex - 8 * k) + ' 100 Q' + f(ex) + ' 92 ' + f(ex + 9 * k) + ' 94 Q' + f(ex + 4 * k) + ' 104 ' + f(ex - 7 * k) + ' 103Z', '#ffe040', INK, 1.4, { filter: gl });
    s += E(ex, 99, 1.4, 3.6, '#200');
    s += P('M' + f(ex - 10 * k) + ' 89 L' + f(ex + 10 * k) + ' 94', 'none', INK, 2.4);
  });
  s += P('M134 112 Q150 128 168 110 Q150 118 134 112Z', '#3a0610', INK, 1.6) + P('M138 113 L140 119 L142 114Z M162 113 L160 119 L158 114Z', '#fff');
  return s;
};

/* ---------------- mimic ---------------- */
MONSTERS.mimic = function (d) {
  var gl = d.glow(2.5, 2), wood = d.lin([[0, '#a8682e'], [1, '#5a3014']]), gold = d.lin([[0, '#fff0a0'], [0.5, '#e0a830'], [1, '#8a5a10']]);
  var s = ma_sh(d, 150, 120);
  s += P('M68 98 L232 98 L236 186 L64 186Z', d.rad([[0, '#6a0a20'], [0.7, '#2a0010'], [1, '#0a0006']], 0.5, 0.55, 0.6), INK, 2.5);
  s += ma_eye(gl, 118, 136, 8, '#ffe040') + ma_eye(gl, 182, 136, 8, '#ffe040');
  s += E(118, 136, 2, 7, '#200') + E(182, 136, 2, 7, '#200');
  var lid = 'M62 104 C62 46 238 46 238 104 L236 116 L64 116Z';
  s += ma_cel(d, lid, wood, P('M64 72 Q150 54 236 72 M64 90 Q150 76 236 90', 'none', '#4a2410', 1.6) + R(92, 40, 18, 80, gold) + R(190, 40, 18, 80, gold) + R(60, 108, 180, 9, gold) + E(150, 62, 60, 8, '#fff', { opacity: 0.15 }), 2.6);
  var up = '', lo = '';
  for (var i = 0; i < 9; i++) {
    var x = 76 + i * 18.5, h = 18 + (i % 3 === 1 ? 12 : 0) + (i === 0 || i === 8 ? -6 : 0);
    up += 'M' + f(x - 7) + ' 116 L' + f(x) + ' ' + f(116 + h) + ' L' + f(x + 7) + ' 116Z ';
    var x2 = 84 + i * 16.5;
    if (i < 8) lo += 'M' + f(x2 - 7) + ' 180 L' + f(x2) + ' ' + f(180 - 14 - (i % 2) * 8) + ' L' + f(x2 + 7) + ' 180Z ';
  }
  s += P(up, '#f4ecd0', INK, 1.4) + P(lo, '#f4ecd0', INK, 1.4);
  s += ma_cel(d, 'M138 170 C128 202 106 216 100 242 C96 264 120 270 128 254 C136 236 152 226 162 202 C168 186 164 172 156 168Z', d.lin([[0, '#e0507a'], [1, '#8a1a3a']]),
    P('M150 178 C142 204 124 222 114 248', 'none', '#6a1030', 1.6) + E(132, 200, 6, 12, '#fff', { opacity: 0.3, transform: 'rotate(30 132 200)' }), 2);
  var box = 'M62 178 L238 178 L242 272 L58 272Z';
  s += P(box, wood, INK, 2.6);
  s += P('M60 210 L240 210 M59 242 L241 242', 'none', '#4a2410', 1.6);
  s += R(90, 178, 20, 94, gold, { stroke: INK, 'stroke-width': 1.5 }) + R(190, 178, 20, 94, gold, { stroke: INK, 'stroke-width': 1.5 }) + R(58, 178, 184, 10, gold, { stroke: INK, 'stroke-width': 1.5 });
  s += P('M212 188 L239 188 L242 272 L216 272Z', '#000', null, null, { opacity: 0.25 });
  s += P('M136 192 L164 192 L164 220 Q150 230 136 220Z', gold, INK, 1.8) + C(150, 204, 4, '#1a0a06') + P('M148 206 L146 216 L154 216 L152 206Z', '#1a0a06');
  s += P('M200 180 Q202 196 198 206 Q196 196 196 180Z', '#d8f0ff', null, null, { opacity: 0.6 });
  [[44, 274], [62, 280], [250, 276], [262, 270], [236, 282], [80, 284]].forEach(function (c) { s += E(c[0], c[1], 8, 3.5, gold, { stroke: INK, 'stroke-width': 1.2 }); });
  return s;
};
})();
