/* Velmoor art: Monster sprites (300x300) of the Folded House side quest: the Echo of Irena, Lingering Memory, Porcelain Sentinel.
 * Plain script (no modules); load order is listed in js/art/api.js. */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL;
/* from core.js */
var f = A.f, P = A.P, C = A.C, E = A.E, R = A.R, G = A.G, M = A.M, T = A.T, sparkle = A.sparkle, INK = A.INK, MONSTERS = A.MONSTERS;
/* from symbols.js */
var faithAt = A.faithAt;
/* from keepsakes.js */
var fh_lily = A.fh_lily, fh_frame = A.fh_frame, fh_drawing = A.fh_drawing, fh_scrap = A.fh_scrap;
/* from monsters-undead.js */
var mb_crystal = A.mb_crystal;
/* from monsters-humanoids.js */
var mc_face = A.mc_face, mc_bangs = A.mc_bangs, mc_torsoF = A.mc_torsoF, mc_gshadow = A.mc_gshadow, mc_limb = A.mc_limb, mc_skinFill = A.mc_skinFill,
    mc_metal = A.mc_metal;

/* open spread hand: wrist at (x,y), pointing at angle a (degrees) */
function fh_hand(x, y, a, sk, sc) {
  var h = E(4, 0, 5.4, 4.6, sk, { stroke: INK, 'stroke-width': 1 }), k;
  for (k = 0; k < 4; k++) { var fa = (-30 + k * 18) * Math.PI / 180, l = k === 1 || k === 2 ? 8.5 : 7; h += P(mc_limb(7 + Math.cos(fa) * 2, Math.sin(fa) * 3, 1.4, 7 + Math.cos(fa) * l, Math.sin(fa) * 3 + Math.sin(fa) * l, 1.1), sk, INK, 0.8); }
  h += P(mc_limb(4, -3, 1.6, 8, -8.5, 1.2), sk, INK, 0.8);
  return T(h, x, y, sc || 1, a);
}

/* ---------------- BOSS: THE ECHO OF IRENA ---------------- */
MONSTERS.irena_echo = function (d, rnd) {
  var sk = '#f6eaf0', hair = '#2c3050', gl = d.glow(3, 2), glS = d.glow(1.5, 2), i, a;
  var out = C(150, 136, 150, d.rad([[0, '#e8f8ff', 0.5], [0.4, '#6ab0ec', 0.22], [1, '#0a1838', 0]]));
  out += E(150, 282, 92, 12, d.rad([[0, '#dff6ff', 0.6], [1, '#9ad8ff', 0]]));
  /* halo of ice shards fanning out behind her */
  var A = d.lin([[0, '#f4fdff'], [0.5, '#9edcff'], [1, '#2a6ab8']]), B = d.lin([[0, '#d6f4ff'], [1, '#1a4a9a']]);
  var halo = '';
  for (i = 0; i < 11; i++) { a = -100 + i * 20; halo += mb_crystal(150 + Math.sin(a * Math.PI / 180) * 34, 120 - Math.cos(a * Math.PI / 180) * 34, i % 2 ? 62 : 92, i % 2 ? 9 : 13, a, A, B); }
  out += G(halo, { opacity: 0.5 });
  /* orbit ring, back half */
  out += E(150, 158, 132, 36, 'none', { stroke: '#dff6ff', 'stroke-width': 1.2, opacity: 0.3, transform: 'rotate(-10 150 158)', 'stroke-dasharray': '26 10 5 10' });
  /* fragments orbiting behind */
  out += G(T(fh_frame(d, 26, 32, '#b8c6da', 'one', true), 44, 70, 1, -16) + T(fh_drawing(), 252, 58, 0.9, 12) + T(fh_frame(d, 20, 16, '#c9b27a', 'two'), 232, 214, 1, 24), { opacity: 0.8 });
  /* the frost veil, behind */
  out += P('M150 34 C112 36 96 70 92 116 C88 168 72 220 50 270 C76 260 98 268 116 256 L184 256 C202 268 224 260 250 270 C228 220 212 168 208 116 C204 70 188 36 150 34Z',
    d.lin([[0, '#f2fbff', 0.6], [0.6, '#a8d8ff', 0.3], [1, '#9ad0ff', 0]]), '#e8f8ff', 0.8, { opacity: 0.85 });
  /* figure */
  var fig = '';
  var hg = d.lin([[0, '#5a6890'], [0.35, hair], [1, '#10142a']]);
  fig += P('M127 48 C108 76 108 120 100 160 C96 178 102 192 110 198 C112 182 118 170 124 158 L132 100 L168 100 L176 158 C182 170 188 182 190 198 C198 192 204 178 200 160 C192 120 192 76 173 48 C164 30 136 30 127 48Z', hg, INK, 1.5) +
    P('M126 70 C118 104 114 140 106 176 M174 70 C182 104 186 140 194 176', 'none', '#8aa6d0', 1, { opacity: 0.6 });
  /* trailing sheer sleeves (behind arms) */
  var veil = d.lin([[0, '#f4fbff', 0.75], [1, '#a8d8ff', 0.08]]);
  var slv = P('M104 134 C88 150 80 186 86 226 C92 204 98 186 104 168 C108 156 110 144 106 136Z M84 140 C74 156 68 180 72 206 C78 186 84 170 92 156Z', veil, '#e0f4ff', 0.7);
  fig += slv + M(slv, 150);
  var sf = mc_skinFill(d, sk);
  /* torso */
  fig += mc_torsoF(d, 150, 104, sk, true);
  /* silver skirt in two panels, fading into frost */
  var skirt = d.lin([[0, '#e4ecf8'], [0.35, '#aab8d4', 0.92], [0.8, '#8fa6cc', 0.55], [1, '#9ad0ff', 0.2]]);
  fig += P('M126 164 C114 200 98 242 78 284 L222 284 C202 242 186 200 174 164Z', skirt, '#5a6a8a', 1.1);
  fig += P('M118 200 C114 230 104 258 96 280 M162 196 C168 230 176 260 186 282 M196 230 C200 250 206 266 212 280', 'none', '#8aa0c0', 0.9, { opacity: 0.6 });
  /* bodice: deep halter V of silver silk */
  var silk = d.lin([[0, '#f4f8ff'], [0.45, '#b4c4dc'], [1, '#6a7ea4']], 0, 0, 1, 1);
  var pan = 'M141 99 C134 110 124 120 122 134 C121 146 125 156 124 166 L150 168 L150 152 C146 144 145 128 141 99Z';
  fig += P(pan, silk, INK, 1.2) + M(P(pan, silk, INK, 1.2), 150);
  fig += P('M125 140 C132 146 142 146 149 142 M175 140 C168 146 158 146 151 142', 'none', '#9ab0cc', 1, { opacity: 0.8 });
  fig += P('M128 112 Q134 120 133 132 M172 112 Q166 120 167 132', 'none', '#ffffff', 1.2, { opacity: 0.7 });
  /* silver waist chain + Pale Hour embroidery */
  fig += P('M124 166 Q150 174 176 164', 'none', '#e8f2fc', 2.6) + P('M124 166 Q150 174 176 164', 'none', '#7a8eae', 0.8, { 'stroke-dasharray': '2 2' });
  fig += faithAt(d, 'pale', 150, 182, 13);
  fig += P('M134 196 C140 204 144 214 144 226 M166 196 C160 204 156 214 156 226', 'none', '#bcd0ea', 0.8, { 'stroke-dasharray': '1.5 2.5', opacity: 0.8 });
  /* arms spread wide, palms out: shielding something behind her */
  fig += P(mc_limb(125, 109, 6, 76, 140, 3.4, 9), sf, INK, 1.2) + P(mc_limb(175, 109, 6, 224, 140, 3.4, -9), sf, INK, 1.2);
  fig += fh_hand(75, 140, 200, sk, 1) + M(fh_hand(75, 140, 200, sk, 1), 150);
  fig += P('M78 135 L80 145 M222 135 L220 145', 'none', '#e8f2fc', 2);
  fig += P('M140 101 Q150 112 160 101', 'none', '#e8f2fc', 1.2) + G(P('M150 112 L147.6 116 L150 120 L152.4 116Z', '#bff0ff', INK, 0.5), { filter: glS });
  /* still-lily pin at her breast */
  fig += fh_lily(161, 124, 0.5, 18, glS);
  /* head */
  fig += mc_face(d, 150, 66, 1, { skin: sk, eye: '#9aa8bc', hair: hair, brow: '#2a2e48', mouth: 'sad', sad: true, glow: true, ear: 'human', lipFill: '#c890a8', blush: false });
  fig += mc_bangs(150, 66, 1, hg, '#a8c8ff', 'swept');
  fig += P('M130 72 C126 96 126 118 120 140 C128 128 134 110 135 90Z M170 72 C174 96 174 118 180 140 C172 128 166 110 165 90Z', hg, INK, 1.1);
  /* veil crown: a thin silver circlet and the veil's frosted edge */
  fig += P('M124 45 C128 31 172 31 176 45 C168 39 132 39 124 45Z', d.lin([[0, '#ffffff', 0.55], [1, '#bfe6ff', 0.2]]), '#e8f8ff', 0.6);
  fig += P('M126 47 Q150 38 174 47', 'none', '#e8f2fc', 1.6) + G(P('M150 37 L147 42 L150 46 L153 42Z', '#bff0ff'), { filter: glS });
  /* frozen tear */
  fig += G(P('M140.5 77 C139 80 139.4 82.6 141 82.6 C142.6 82.6 142.8 80 140.5 77Z', '#dff8ff', '#6ab0e0', 0.5), { filter: glS });
  out += G(fig, { opacity: 0.9 });
  out += G(E(150, 270, 90, 18, '#eaf8ff', { opacity: 0.55 }) + E(110, 262, 40, 10, '#ffffff', { opacity: 0.4 }) + E(196, 266, 44, 10, '#ffffff', { opacity: 0.35 }), { filter: d.blur(6) });
  /* rim light over the figure */
  out += E(150, 150, 60, 110, d.rad([[0, '#ffffff', 0.12], [1, '#ffffff', 0]]));
  /* orbit ring, front half, and fragments in front */
  out += P('M24 176 Q150 226 276 140', 'none', '#e8faff', 1.2, { opacity: 0.4, 'stroke-dasharray': '22 9 4 9' });
  out += T(fh_frame(d, 22, 28, '#b8c6da', 'two', true), 58, 204, 1, 14);
  out += fh_lily(248, 134, 1.1, 24, glS);
  out += T(fh_frame(d, 16, 20, '#c9b27a', 'one'), 108, 248, 1, -22);
  var shard = function (x, y, s, r) { return T(P('M0 -10 L4 0 L0 10 L-4 0Z', d.lin([[0, '#ffffff'], [1, '#6ac8f0']]), '#e8fbff', 0.8) + P('M0 -10 L0 10', 'none', '#fff', 0.6), x, y, s, r); };
  var fx = '';
  for (i = 0; i < 10; i++) { a = i / 10 * Math.PI * 2 + 0.3; if (Math.sin(a) > 0.6) continue; fx += shard(150 + Math.cos(a) * 128, 160 + Math.sin(a) * 38, 0.5 + (i % 3) * 0.25, a * 57 + 90); }
  out += G(fx, { filter: glS, opacity: 0.9 });
  for (i = 0; i < 18; i++) out += C(20 + rnd() * 260, 20 + rnd() * 260, 0.8 + rnd() * 1.8, '#ffffff', { opacity: f(0.4 + rnd() * 0.5) });
  out += sparkle(74, 112, 6, '#fff', { filter: gl }) + sparkle(226, 96, 5, '#fff', { filter: gl }) + sparkle(186, 250, 4, '#dff') + sparkle(40, 150, 4, '#dff');
  return out;
};

/* ---------------- LINGERING MEMORY ---------------- */
MONSTERS.memory = function (d, rnd) {
  var gl = d.glow(3, 2), i;
  var out = C(150, 140, 135, d.rad([[0, '#cfeaff', 0.4], [0.55, '#5a9ad8', 0.14], [1, '#0a1838', 0]]));
  /* body of drifting snow: a woman-shaped drift that never quite holds together */
  var body = 'M150 44 C134 44 126 56 126 72 C126 86 132 94 140 100 C126 104 112 108 106 118 C100 130 104 150 110 166 C116 184 122 198 124 214 C126 236 120 256 112 272 C128 262 140 248 146 232 C150 250 160 268 182 282 C176 266 170 248 172 230 C174 210 180 190 188 170 C196 150 200 130 194 118 C188 108 174 104 160 100 C168 94 174 86 174 72 C174 56 166 44 150 44Z';
  out += P(body, d.lin([[0, '#f2faff', 0.8], [0.5, '#b4d8f6', 0.55], [1, '#7ab8ec', 0]]), null, null, { filter: d.blur(4) });
  out += P(body, d.rad([[0, '#ffffff', 0.45], [1, '#ffffff', 0]], 0.5, 0.35, 0.5), null, null, { filter: d.blur(2) });
  out += P('M118 130 C126 160 128 190 132 230 M182 128 C176 160 170 196 164 240 M150 110 C146 150 152 200 150 250', 'none', '#ffffff', 1.4, { opacity: 0.35, filter: d.blur(1) });
  /* arms of snow, one reaching, one trailing */
  out += P('M104 124 C82 136 66 154 52 176 C46 186 40 190 32 192 C44 196 56 190 64 180 C76 164 92 150 110 142Z', d.lin([[0, '#eaf6ff', 0.75], [1, '#9ccaf0', 0.15]], 1, 0, 0, 0), '#e8f6ff', 0.8, { filter: d.blur(1.2) });
  out += P('M196 122 C216 128 236 120 254 104 C262 96 268 94 274 96 C268 102 262 112 254 120 C238 136 218 144 198 142Z', d.lin([[0, '#eaf6ff', 0.75], [1, '#9ccaf0', 0.15]], 0, 0, 1, 0), '#e8f6ff', 0.8, { filter: d.blur(1.2) });
  /* scraps of torn floral wallpaper and picture shards caught in the drift */
  var COLS = [['#ecc9cc', '#b06878'], ['#cfe0cc', '#5a8a6a'], ['#efe4cc', '#a0785a'], ['#d4dcef', '#5a6aa8']];
  var spots = [[132, 128, 26, 20, -14], [168, 140, 22, 26, 10], [146, 172, 30, 22, 6], [124, 200, 20, 18, -24], [172, 196, 24, 18, 18], [154, 226, 18, 16, -8], [106, 156, 16, 14, 30], [190, 168, 16, 18, -20], [78, 166, 14, 12, 40], [228, 120, 14, 12, -30], [178, 254, 14, 12, 12]];
  var sc = '';
  for (i = 0; i < spots.length; i++) { var sp = spots[i], cc = COLS[i % COLS.length]; sc += T(fh_scrap(rnd, sp[2], sp[3], cc[0], cc[1]), sp[0], sp[1], 1, sp[4]); }
  out += G(sc, { opacity: 0.82 });
  out += T(fh_frame(d, 18, 22, '#c9b27a', 'two', true), 140, 150, 1, -8) + T(fh_frame(d, 14, 18, '#b8c6da', 'one', true), 196, 214, 1, 22);
  out += G(T(fh_frame(d, 12, 14, '#c9b27a', 'one'), 48, 112, 1, -30) + T(fh_scrap(rnd, 14, 12, '#ecc9cc', '#b06878'), 264, 70, 1, 20) + T(fh_scrap(rnd, 12, 10, '#cfe0cc', '#5a8a6a'), 36, 230, 1, -10), { opacity: 0.7 });
  /* a faint, sad face in the snow */
  var face = E(150, 74, 22, 26, d.rad([[0, '#ffffff', 0.7], [0.7, '#cfe8ff', 0.35], [1, '#9ccaf0', 0]]));
  face += E(141, 73, 4.6, 6.4, '#1e3a66', { opacity: 0.5, filter: d.blur(0.8) }) + E(159, 73, 4.6, 6.4, '#1e3a66', { opacity: 0.5, filter: d.blur(0.8) });
  face += C(141, 74, 1.5, '#dff8ff', { filter: gl }) + C(159, 74, 1.5, '#dff8ff', { filter: gl });
  face += P('M134 66 Q139 65 145 61.5 M166 66 Q161 65 155 61.5', 'none', '#3a5a8a', 1, { opacity: 0.45 });
  face += E(150, 91, 3, 2, '#1e3a66', { opacity: 0.4 }) + P('M145 92 Q150 88 155 92', 'none', '#2a4a7a', 1, { opacity: 0.45 });
  face += P('M140 81 C139 87 139 91 140 95', 'none', '#bfe8ff', 1, { opacity: 0.6 });
  out += face;
  /* swirling snow */
  var snow = '';
  for (i = 0; i < 70; i++) {
    var t = rnd(), ang = rnd() * Math.PI * 2, rr = 20 + rnd() * 90;
    snow += C(150 + Math.cos(ang) * rr * 0.8, 160 + Math.sin(ang) * rr * 1.1 - t * 20, 0.6 + rnd() * 1.8, '#ffffff', { opacity: f(0.35 + rnd() * 0.6) });
  }
  out += snow;
  out += P('M60 250 C90 238 110 252 140 244 M196 274 C224 262 244 270 266 256 M44 80 C66 70 84 80 96 70', 'none', '#dff6ff', 1.6, { opacity: 0.45, filter: gl });
  out += sparkle(96, 96, 5, '#fff', { filter: gl }) + sparkle(214, 230, 4, '#fff') + sparkle(236, 62, 4, '#dff');
  return out;
};

/* ---------------- PORCELAIN SENTINEL ---------------- */
MONSTERS.porcelain = function (d) {
  var gl = d.glow(2, 2), frost = '#bfeaff';
  var por = d.lin([[0, '#ffffff'], [0.55, '#eef1f6'], [1, '#b8c0d0']], 0, 0, 1, 0);
  var tin = d.lin([[0, '#6a92e0'], [0.45, '#3a62b0'], [1, '#1c3270']], 0, 0, 1, 0), gold = mc_metal(d, '#d8a838');
  var black = d.lin([[0, '#5a6070'], [0.35, '#1a1c24'], [1, '#05060a']], 0, 0, 1, 0);
  var out = mc_gshadow(150, 284, 78, 9, 0.45);
  out += C(150, 140, 140, d.rad([[0, '#8ac8ff', 0.2], [1, '#0a1838', 0]]));
  /* wind-up key at its back */
  out += P('M196 132 L230 128', 'none', INK, 7) + P('M196 132 L230 128', 'none', gold, 4);
  out += P('M228 128 C232 104 254 100 256 116 C258 128 240 130 232 128 C240 130 258 134 256 146 C252 160 232 152 228 128Z', gold, INK, 1.6) + C(246, 116, 3.5, '#2a2030') + C(246, 142, 3.5, '#2a2030');
  /* toy halberd (single crescent blade, no back spike) */
  out += P('M86 42 L94 42 L97 274 L89 274Z', d.lin([[0, '#c86a3a'], [0.5, '#8a3a1a'], [1, '#5a220c']], 0, 0, 1, 0), INK, 1.6);
  out += P('M90 6 L96 40 L84 40Z', mc_metal(d, '#a8b8d8'), INK, 1.6);
  out += P('M86 44 C64 38 50 52 50 74 C60 68 72 70 86 80Z', mc_metal(d, '#9aaed4'), INK, 1.8) + P('M82 50 C66 48 58 58 56 66', 'none', '#ffffff', 1.4, { opacity: 0.7 });
  out += P('M84 84 L96 84 L96 90 L84 90Z', gold, INK, 1) + P('M90 90 C84 100 86 108 90 112 C94 108 96 100 90 90Z', '#d83a3a', INK, 1);
  /* round painted base */
  out += P('M90 268 L210 268 L210 280 C210 290 90 290 90 280Z', d.lin([[0, '#5a8a4a'], [1, '#24401c']], 0, 0, 1, 0), INK, 1.8) + E(150, 268, 60, 10, d.lin([[0, '#8ac06a'], [1, '#4a7a3a']]), { stroke: INK, 'stroke-width': 1.8 });
  out += P('M100 266 C110 262 124 264 132 266 M170 264 C184 262 194 264 202 268', 'none', '#ffffff', 2, { opacity: 0.8 });
  /* legs: glossy porcelain trousers and black boots */
  out += P('M124 178 L146 178 L144 244 L126 244Z', por, INK, 1.8) + P('M154 178 L176 178 L174 244 L156 244Z', por, INK, 1.8);
  out += P('M134 180 L134 240 M164 180 L164 240', 'none', '#d83a3a', 2.2);
  out += P('M124 238 L146 238 L148 266 C140 270 122 270 120 266Z', black, INK, 1.8) + P('M154 238 L176 238 L180 266 C178 270 160 270 152 266Z', black, INK, 1.8);
  out += P('M127 244 L127 262 M157 244 L157 262', 'none', '#ffffff', 2, { opacity: 0.6 });
  /* tunic */
  out += P('M112 100 C104 128 106 160 112 186 L120 196 L150 190 L180 196 L188 186 C194 160 196 128 188 100 C172 92 128 92 112 100Z', tin, INK, 2.2);
  out += P('M150 98 L150 188', 'none', '#1c2a5a', 1.2);
  for (var b = 0; b < 5; b++) out += C(150, 112 + b * 15, 3, gold, { stroke: INK, 'stroke-width': 0.8 });
  out += P('M114 100 L184 176 L178 184 L110 110Z', '#f4f6fa', INK, 1.3);
  out += P('M110 168 Q150 176 190 168 L190 178 Q150 186 110 178Z', '#f4f6fa', INK, 1.3) + C(150, 177, 5.5, gold, { stroke: INK, 'stroke-width': 1 });
  out += P('M118 104 C120 130 118 160 116 186', 'none', '#8ab0ff', 1.6, { opacity: 0.5 });
  /* epaulettes */
  var ep = P('M104 98 C110 90 126 90 130 98 L128 104 L106 104Z', gold, INK, 1.4) + P('M107 104 L106 112 M111 104 L110 113 M115 104 L115 113 M119 104 L119 113 M123 104 L124 112 M127 104 L128 111', 'none', '#e8b840', 1.6);
  out += ep + M(ep, 150);
  /* arms: one gripping the halberd, one stiff at its side */
  out += P(mc_limb(110, 106, 9, 98, 140, 8, 3), tin, INK, 1.8) + P(mc_limb(98, 140, 8, 92, 162, 7, 2), tin, INK, 1.8) + R(85, 154, 14, 6, '#d83a3a', { stroke: INK, 'stroke-width': 1 });
  out += E(92, 166, 9, 8, por, { stroke: INK, 'stroke-width': 1.6 }) + P('M84 162 L100 162 M84 168 L100 168', 'none', '#b8c0d0', 1);
  out += P(mc_limb(190, 106, 9, 198, 146, 8, -1), tin, INK, 1.8) + P(mc_limb(198, 146, 8, 200, 180, 7, 0), tin, INK, 1.8) + R(192, 172, 16, 6, '#d83a3a', { stroke: INK, 'stroke-width': 1 });
  out += E(200, 186, 8.5, 9, por, { stroke: INK, 'stroke-width': 1.6 });
  /* head: painted porcelain doll face */
  out += P('M140 86 L160 86 L159 98 L141 98Z', por, INK, 1.4);
  out += E(150, 70, 24, 27, d.rad([[0, '#ffffff'], [0.65, '#eef1f6'], [1, '#aab4c6']], 0.4, 0.35, 0.7), { stroke: INK, 'stroke-width': 2 });
  out += P('M127 60 C126 68 127 74 129 78 L133 64Z M173 60 C174 68 173 74 171 78 L167 64Z', '#1a1c24', INK, 1);
  out += E(138, 80, 5.5, 4, '#ff7a8a', { opacity: 0.6 }) + E(162, 80, 5.5, 4, '#ff7a8a', { opacity: 0.6 });
  out += E(140, 68, 4.4, 5.4, '#141620') + E(160, 68, 4.4, 5.4, '#141620') + C(141.4, 66.4, 1.6, '#ffffff') + C(161.4, 66.4, 1.6, '#ffffff');
  out += G(C(140, 69.4, 1.4, frost) + C(160, 69.4, 1.4, frost), { filter: gl });
  out += P('M134 61 Q140 58 146 61 M154 61 Q160 58 166 61', 'none', '#141620', 1.1);
  out += P('M134 63 L132 61 M135.6 62.2 L134.4 59.8 M166 63 L168 61 M164.4 62.2 L165.6 59.8', 'none', '#141620', 0.8);
  out += P('M145 87 Q150 84 155 87 Q150 90.4 145 87Z', '#c8202e', INK, 0.6) + P('M148 76 L150 78', 'none', '#b8a0a8', 1);
  out += E(140, 58, 6, 3, '#ffffff', { opacity: 0.85, transform: 'rotate(-20 140 58)' });
  /* chipped cheek: a dark hollow with cold light inside */
  out += P('M163 86 L170 79 L173 85 L169 91 L163 92Z', '#060a14', INK, 1) + G(P('M166 86 L169 83 L170 88Z', frost, null, null, { opacity: 0.7 }), { filter: gl });
  /* shako */
  out += P('M126 54 L128 16 C140 12 160 12 172 16 L174 54Z', tin, INK, 2);
  out += P('M126 48 L174 48 L174 54 L126 54Z', gold, INK, 1.2) + P('M128 18 C140 14 160 14 172 18 L172 22 C160 18 140 18 128 22Z', gold, INK, 1);
  out += P('M124 54 C136 50 164 50 176 54 L172 60 C160 56 140 56 128 60Z', black, INK, 1.4) + P('M130 56 Q150 52 168 55', 'none', '#ffffff', 1, { opacity: 0.6 });
  out += C(150, 34, 7, gold, { stroke: INK, 'stroke-width': 1.2 }) + C(150, 34, 4, '#d83a3a', { stroke: INK, 'stroke-width': 0.8 });
  out += E(150, 8, 7, 9, d.rad([[0, '#ffffff'], [0.5, '#e8e8f0'], [1, '#d83a3a']]), { stroke: INK, 'stroke-width': 1.2 });
  out += P('M132 22 L131 46', 'none', '#ffffff', 2.4, { opacity: 0.45 });
  out += P('M126 57 C125 78 131 92 143 97.5 M174 57 C175 78 169 92 157 97.5', 'none', gold, 1.6);
  /* cracks with frost glowing in them */
  var cr = 'M158 44 L156 52 M152 58 L156 64 L152 72 L158 80 L155 88 M118 120 L126 132 L122 142 L130 154 M126 132 L136 130 M180 112 L172 126 L178 136 M128 200 L136 212 L132 224 M168 196 L162 208 L170 218 M200 182 L196 190';
  out += P(cr, 'none', '#05070c', 2.2) + G(P(cr, 'none', frost, 1, { opacity: 0.9 }), { filter: gl });
  /* frost crusted on shoulders, hat and boots */
  var fr = P('M126 16 C134 8 144 12 150 10 C158 12 166 8 172 16 L170 20 C160 16 140 16 128 20Z', '#f4fbff', '#9ac8e8', 0.8) +
    P('M104 98 C110 88 122 88 130 96 L127 99 C120 94 112 94 106 100Z', '#f4fbff', '#9ac8e8', 0.8) + M(P('M104 98 C110 88 122 88 130 96 L127 99 C120 94 112 94 106 100Z', '#f4fbff', '#9ac8e8', 0.8), 150) +
    P('M50 74 C56 68 64 70 70 70 L68 74Z', '#f4fbff', '#9ac8e8', 0.6);
  var ic = '';
  [[110, 104, 7], [118, 104, 5], [182, 104, 6], [190, 104, 8], [130, 60, 5], [168, 60, 6], [124, 268, 5], [176, 268, 6], [56, 72, 6]].forEach(function (p) { ic += P('M' + (p[0] - 1.6) + ' ' + p[1] + ' L' + p[0] + ' ' + (p[1] + p[2]) + ' L' + (p[0] + 1.6) + ' ' + p[1] + 'Z', '#e8f8ff', '#8ac0e0', 0.5); });
  out += fr + ic;
  out += sparkle(64, 58, 5, '#fff', { filter: gl }) + sparkle(220, 90, 4, '#dff') + sparkle(232, 240, 4, '#fff');
  return out;
};
})();
