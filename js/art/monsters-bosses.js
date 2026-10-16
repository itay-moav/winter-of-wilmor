/* Velmoor art: Boss sprites (300x300) of the main story: the Rat King, King Morvane, Kargath and Malthor.
 * Plain script (no modules); load order is listed in js/art/api.js. */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL;
/* from core.js */
var shade = A.shade, shadow = A.shadow, P = A.P, C = A.C, E = A.E, R = A.R, G = A.G, M = A.M, T = A.T, starPts = A.starPts, sparkle = A.sparkle,
    INK = A.INK, MONSTERS = A.MONSTERS;
/* from monsters-humanoids.js */
var mc_face = A.mc_face, mc_bangs = A.mc_bangs, mc_gshadow = A.mc_gshadow, mc_skinFill = A.mc_skinFill, mc_metal = A.mc_metal;

/* ---------------- BOSS: RAT KING ---------------- */
MONSTERS.ratking = function (d) {
  var fur = '#8a7c74', pink = '#e8a0a8', red = '#8a1424', gold = '#f0c040';
  var furG = d.lin([[0, shade(fur, 0.3)], [0.6, fur], [1, shadow(fur, 0.6)]]);
  var wood = d.lin([[0, '#7a5434'], [1, '#2e1c10']]);
  var out = mc_gshadow(150, 284, 130, 10, 0.45);
  /* throne back of junk */
  out += P('M58 210 L62 60 L78 66 L84 34 L104 50 L118 20 L134 44 L150 12 L166 44 L182 20 L196 50 L216 34 L222 66 L238 60 L242 210Z', wood, INK, 2.4);
  out += P('M78 66 L84 200 M104 50 L106 200 M196 50 L194 200 M216 34 L216 200', 'none', '#1e120a', 2, { opacity: 0.8 });
  out += C(84, 96, 16, mc_metal(d, '#7a7068'), { stroke: INK, 'stroke-width': 2 }) + C(84, 96, 5, '#a08a40', { stroke: INK, 'stroke-width': 1 }) + P('M70 88 L98 104', 'none', INK, 1.4);
  out += P('M206 70 L236 110 L230 114 L200 74Z', '#c8c0b0', INK, 1.2) + P('M196 66 L212 62 L210 78Z', '#8a8070', INK, 1);
  out += P('M224 120 L246 64 L250 66 L230 124Z', mc_metal(d, '#9a9aa8'), INK, 1.2) + R(218, 118, 18, 5, '#5a3a1a', { stroke: INK, 'stroke-width': 1, transform: 'rotate(-20 227 120)' });
  out += P('M140 12 L150 0 L160 12 L150 22Z', '#c02040', INK, 1.2) + C(150, 11, 2, '#fff', { opacity: 0.7 });
  /* tail */
  out += P('M196 236 C236 238 270 252 262 272 C256 286 220 288 196 280', 'none', INK, 7) + P('M196 236 C236 238 270 252 262 272 C256 286 220 288 196 280', 'none', pink, 4) +
    P('M226 244 l1 -3 M244 254 l3 -2 M258 266 l3 0', 'none', INK, 1);
  /* robe body */
  var robe = d.lin([[0, shade(red, 0.2)], [0.5, red], [1, '#2a0408']]);
  out += P('M98 108 C76 140 64 200 60 252 L72 246 L80 258 L94 248 L104 262 L118 250 L132 260 L150 248 L168 260 L182 250 L196 262 L206 248 L220 258 L228 246 L240 252 C236 200 224 140 202 108 C182 98 118 98 98 108Z', robe, INK, 2.4);
  out += P('M100 120 C90 170 86 210 86 246 M200 120 C210 170 214 210 214 246', 'none', '#3a0610', 1.4, { opacity: 0.8 });
  out += P('M104 240 L112 226 L118 244 M186 236 L194 222 L198 242', 'none', '#2a0408', 1.4);
  /* belly */
  out += P('M128 124 C116 170 120 222 150 236 C180 222 184 170 172 124Z', furG, INK, 1.8) + P('M136 160 Q150 168 164 160 M134 190 Q150 198 166 190', 'none', shadow(fur, 0.8), 1.2, { opacity: 0.6 });
  /* feet */
  var foot = P('M120 240 C110 244 106 252 112 256 L136 256 C138 248 134 242 128 240Z', pink, INK, 1.6) + P('M110 256 l-4 4 M118 257 l-2 5 M126 257 l0 5 M134 256 l2 4', 'none', '#f8f0e0', 1.8);
  out += foot + M(foot, 150);
  /* junk pile in front */
  out += E(92, 268, 26, 16, d.lin([[0, '#8a5a30'], [1, '#3a2010']], 0, 0, 1, 0), { stroke: INK, 'stroke-width': 2 }) + P('M70 262 Q92 268 114 262 M70 274 Q92 280 114 274', 'none', '#2a1a10', 2);
  out += R(178, 252, 46, 34, wood, { stroke: INK, 'stroke-width': 2, transform: 'rotate(-6 200 268)' }) + P('M182 258 L222 284 M222 256 L184 284', 'none', '#2e1c10', 1.5);
  out += P('M120 272 C120 262 140 262 140 272 C140 278 136 280 134 282 L126 282 C124 280 120 278 120 272Z', '#ece2cc', INK, 1.4) + C(126, 272, 2.4, '#1a0a0a') + C(134, 272, 2.4, '#1a0a0a');
  for (var i = 0; i < 9; i++) out += E(140 + i * 7 - (i % 3) * 3, 282 - (i % 3) * 3, 4, 2, d.lin([[0, '#fff2a0'], [1, '#b08010']]), { stroke: INK, 'stroke-width': 0.6 });
  out += P('M60 284 L70 250 L74 252 L66 284Z', mc_metal(d, '#a0a0b0'), INK, 1);
  /* arms */
  var sv = d.lin([[0, red], [1, '#3a0610']], 0, 0, 1, 1);
  out += P('M100 116 C84 130 76 160 80 190 L104 192 C104 168 108 148 118 134Z', sv, INK, 2) + E(92, 194, 10, 7, pink, { stroke: INK, 'stroke-width': 1.4 }) + P('M84 196 l-3 5 M90 199 l-1 5 M97 199 l1 5', 'none', '#f8f0e0', 1.6);
  out += P('M200 116 C216 126 224 144 222 164 L200 168 C198 152 192 140 184 134Z', sv, INK, 2);
  /* scepter */
  out += P('M210 250 L222 70 L228 70 L218 250Z', d.lin([[0, '#f0d070'], [1, '#806010']], 0, 0, 1, 0), INK, 1.4) +
    C(225, 60, 12, '#ece2cc', { stroke: INK, 'stroke-width': 1.6 }) + C(221, 58, 3, '#1a0a0a') + C(229, 58, 3, '#1a0a0a') +
    G(C(221, 58, 1.4, '#ff3030') + C(229, 58, 1.4, '#ff3030'), { filter: d.glow(1.5, 2) }) + P('M216 50 L218 40 L222 48 L225 36 L228 48 L232 40 L234 50Z', gold, INK, 1);
  out += E(214, 168, 9, 8, pink, { stroke: INK, 'stroke-width': 1.4 });
  /* ermine collar */
  out += P('M94 112 C108 136 192 136 206 112 C200 96 100 96 94 112Z', d.lin([[0, '#ffffff'], [1, '#c8c0d0']]), INK, 2);
  for (i = 0; i < 6; i++) out += P('M' + (108 + i * 17) + ' ' + (112 + (i % 2) * 6) + ' l-1.5 5 l3 0Z', INK);
  /* head */
  var ear = C(114, 52, 19, furG, { stroke: INK, 'stroke-width': 2 }) + C(115, 53, 12, d.rad([[0, '#ffc0c8'], [1, '#c87080']]));
  out += ear + M(ear, 150);
  out += P('M150 44 C118 44 106 66 112 88 C118 104 136 118 150 124 C164 118 182 104 188 88 C194 66 182 44 150 44Z', furG, INK, 2.4);
  out += P('M150 86 C136 86 130 104 140 116 C144 122 156 122 160 116 C170 104 164 86 150 86Z', d.lin([[0, '#c8bab0'], [1, '#8a7a70']]), INK, 1.2);
  out += P('M132 70 L146 76 M168 70 L154 76', 'none', INK, 2.4);
  out += G(E(138, 80, 6, 5, '#ff2020') + E(162, 80, 6, 5, '#ff2020'), { filter: d.glow(2, 2) }) + E(138, 80, 2.4, 3, '#200000') + E(162, 80, 2.4, 3, '#200000') + C(136, 78, 1.4, '#fff') + C(160, 78, 1.4, '#fff');
  out += E(150, 114, 6, 4, d.rad([[0, '#ffb0c0'], [1, '#c05070']]), { stroke: INK, 'stroke-width': 1.2 });
  out += P('M145 119 L145 130 L150 131 L150 119Z M150 119 L150 131 L155 130 L155 119Z', '#f6e6a0', INK, 1);
  out += P('M138 112 L100 104 M138 116 L98 118 M140 120 L104 132 M162 112 L200 104 M162 116 L202 118 M160 120 L196 132', 'none', '#e8e0d8', 0.9, { opacity: 0.9 });
  /* crown (tilted) */
  var crown = P('M124 46 L124 18 L136 32 L150 10 L164 32 L176 18 L176 46Z', d.lin([[0, '#fff2a0'], [0.5, gold], [1, '#8a5a10']]), INK, 2) +
    R(124, 40, 52, 8, d.lin([[0, '#f8d860'], [1, '#a07010']]), { stroke: INK, 'stroke-width': 1.6 }) +
    C(150, 44, 3.4, '#20a060', { stroke: INK, 'stroke-width': 0.8 }) + C(136, 44, 2.4, '#c02040') + C(164, 44, 2.4, '#2060c0') +
    C(124, 18, 2.6, gold, { stroke: INK, 'stroke-width': 1 }) + C(150, 10, 2.8, gold, { stroke: INK, 'stroke-width': 1 }) + C(176, 18, 2.6, gold, { stroke: INK, 'stroke-width': 1 });
  out += G(crown, { transform: 'rotate(-10 150 44)' });
  out += sparkle(170, 20, 5, '#fff') + sparkle(222, 40, 4, '#fff8c0');
  return out;
};

/* ---------------- BOSS: MORVANE THE LICH KING ---------------- */
MONSTERS.morvane = function (d) {
  var bone = '#e6dfcc', blue = '#5ad0ff', robe = '#141a34', trim = '#3ac0d8';
  var out = '';
  out += C(150, 140, 140, d.rad([[0, blue, 0.4], [0.5, '#2060c0', 0.18], [1, '#102040', 0]]));
  var wisp = d.lin([[0, blue, 0.6], [1, blue, 0]]);
  out += G(P('M60 200 C30 160 40 100 80 70 C70 110 80 150 100 180Z M240 200 C270 160 260 100 220 70 C230 110 220 150 200 180Z M110 280 C80 260 60 280 40 270 C60 250 90 250 120 260Z', wisp), { filter: d.blur(3) });
  /* staff */
  out += P('M84 60 L90 60 L94 270 L86 270Z', d.lin([[0, '#4a4060'], [1, '#141020']], 0, 0, 1, 0), INK, 1.4);
  out += P('M72 62 C66 40 78 20 88 14 C98 20 110 40 104 62 L98 54 C100 40 94 30 88 26 C82 30 76 40 78 54Z', d.lin([[0, '#c8b070'], [1, '#5a4818']]), INK, 1.4);
  out += G(C(88, 44, 9, d.rad([[0, '#ffffff'], [0.5, blue], [1, '#1050a0']])) + P('M88 30 C80 24 84 12 88 2 C92 12 98 22 88 30Z', '#bff0ff', null, null, { opacity: 0.85 }), { filter: d.glow(4, 2) });
  /* robes, tattered & fading */
  var rg = d.lin([[0, shade(robe, 0.2)], [0.65, robe], [1, robe, 0]]);
  out += P('M110 106 C92 160 78 220 64 278 L92 262 L106 280 L124 262 L138 282 L150 266 L162 282 L176 262 L194 280 L208 262 L236 278 C222 220 208 160 190 106Z', rg, null, null);
  out += P('M110 106 C92 160 80 210 70 250 M190 106 C208 160 220 210 230 250', 'none', INK, 2.4);
  out += P('M140 108 L134 250 M160 108 L166 250', 'none', trim, 2, { opacity: 0.85 });
  for (var i = 0; i < 5; i++) out += P(starPts(150, 180 + i * 18, 4, 1.6, 4, 0), trim, null, null, { opacity: 0.8 - i * 0.12 });
  /* ribcage */
  out += P('M134 108 L166 108 L162 160 L138 160Z', '#06080e', INK, 1.4);
  out += G(P('M150 110 L150 158 M150 118 Q140 116 136 124 M150 118 Q160 116 164 124 M150 128 Q140 126 137 134 M150 128 Q160 126 163 134 M150 138 Q141 136 138 144 M150 138 Q159 136 162 144 M150 148 Q142 146 140 152 M150 148 Q158 146 160 152', 'none', bone, 2.2) + C(150, 132, 6, blue, { opacity: 0.6, filter: d.blur(3) }), {});
  out += P('M116 160 L184 160 L182 170 L118 170Z', d.lin([[0, '#d8c070'], [1, '#6a5418']]), INK, 1.4) + C(150, 165, 4, blue, { filter: d.glow(2), stroke: INK, 'stroke-width': 0.8 });
  /* mantle with spikes */
  var mant = P('M112 98 C96 100 80 110 74 128 L100 132 L124 120Z', d.lin([[0, '#2a3460'], [1, '#0a0e20']]), INK, 2) + P('M90 112 L66 92 L96 108Z M80 122 L56 116 L82 128Z', d.lin([[0, '#e8e0c8'], [1, '#8a8068']]), INK, 1.2) + P('M78 126 L100 130 L122 118', 'none', trim, 1.4);
  out += mant + M(mant, 150);
  /* arms: left holds staff, right casts */
  var sv = d.lin([[0, '#2a3460'], [1, '#0a0e20']], 0, 0, 1, 1);
  out += P('M114 112 C100 126 94 146 92 162 L108 168 C110 150 116 136 124 128Z', sv, INK, 1.8);
  out += P('M94 156 C100 156 104 160 104 166 L98 170 Z', bone, INK, 1.2) + P('M84 157 L100 158 M83 162 L100 163 M84 167 L99 168', 'none', INK, 4) + P('M84 157 L100 158 M83 162 L100 163 M84 167 L99 168', 'none', bone, 2.4);
  out += P('M186 112 C204 118 216 130 226 146 L212 160 C204 148 194 140 182 134Z', sv, INK, 1.8);
  out += P('M220 150 L234 138 M222 154 L240 146 M224 158 L242 156 M218 158 L228 166', 'none', bone, 2.6) + P('M220 150 L234 138 M222 154 L240 146 M224 158 L242 156 M218 158 L228 166', 'none', INK, 0.6, { opacity: 0.5 });
  out += G(C(246, 140, 16, d.rad([[0, '#ffffff'], [0.4, '#a8ecff'], [0.8, blue], [1, '#1050a0', 0]])) + P('M246 124 C236 116 244 104 246 94 C250 104 258 114 246 124Z', '#bff0ff', null, null, { opacity: 0.8 }), { filter: d.glow(5, 2) });
  /* skull head */
  out += P('M130 72 C128 46 172 46 170 72 C170 82 166 88 164 92 L161 104 L139 104 L136 92 C134 88 130 82 130 72Z', d.lin([[0, '#fffaf0'], [0.6, bone], [1, '#8a8070']]), INK, 2);
  out += P('M136 74 C136 66 146 66 147 74 C147 80 142 84 139 84 C137 84 136 80 136 74Z M164 74 C164 66 154 66 153 74 C153 80 158 84 161 84 C163 84 164 80 164 74Z', '#06080e');
  out += G(C(142, 76, 2.8, blue) + C(158, 76, 2.8, blue), { filter: d.glow(2, 3) }) + C(142, 76, 1.2, '#fff') + C(158, 76, 1.2, '#fff');
  out += P('M150 84 L147 92 L153 92Z', '#06080e');
  out += P('M140 96 L160 96 L159 104 L141 104Z', '#f2ecdc', INK, 1) + P('M144 96 L144 104 M148 96 L148 104 M152 96 L152 104 M156 96 L156 104', 'none', INK, 0.8);
  out += P('M132 82 Q136 92 140 96 M168 82 Q164 92 160 96', 'none', shadow(bone, 0.8), 1);
  /* crown */
  out += P('M126 60 L124 24 L136 40 L142 10 L150 32 L158 10 L164 40 L176 24 L174 60 Q150 52 126 60Z', d.lin([[0, '#5a6a80'], [0.5, '#2a3040'], [1, '#141820']]), INK, 2) +
    P('M126 60 Q150 52 174 60', 'none', '#c8b070', 2.4) + P('M142 10 L150 32 L158 10', 'none', '#8aa0c0', 1);
  out += G(P('M150 38 L146 46 L150 52 L154 46Z', blue) + C(134, 52, 2.2, blue) + C(166, 52, 2.2, blue), { filter: d.glow(2, 2) });
  out += sparkle(110, 40, 4, '#bff') + sparkle(200, 60, 5, '#bff') + sparkle(190, 220, 4, '#8ef');
  return out;
};

/* ---------------- BOSS: KARGATH THE CURSED KNIGHT ---------------- */
MONSTERS.kargath = function (d) {
  var steel = '#2a2f3c', ice = '#bfe8ff', glowc = '#5ae0ff';
  var met = d.lin([[0, '#6a7488'], [0.35, steel], [0.6, '#12151d'], [1, '#3a4252']], 0, 0, 1, 1);
  var metV = d.lin([[0, '#5a6478'], [0.5, steel], [1, '#0e1016']]);
  var frost = function (path) { return P(path, 'none', ice, 1.6, { opacity: 0.85 }); };
  var out = mc_gshadow(150, 284, 120, 11, 0.5);
  out += E(150, 280, 140, 22, d.rad([[0, '#9adcff', 0.35], [1, '#9adcff', 0]]));
  /* cape */
  out += P('M96 100 C80 160 66 220 50 286 L70 276 L84 288 L100 274 L120 288 L180 288 L200 274 L216 288 L230 276 L250 286 C234 220 220 160 204 100Z', d.lin([[0, '#3a1028'], [1, '#0e0408']]), INK, 2.2);
  /* legs */
  var leg = P('M112 206 L146 206 L144 284 L102 284 Z', metV, INK, 2.2) + P('M104 236 C110 228 140 228 146 236 L144 252 C138 246 112 246 106 252Z', met, INK, 1.8) +
    P('M100 276 L148 276 L148 288 L96 288Z', met, INK, 1.8) + frost('M106 238 Q124 232 142 238 M102 278 L146 278');
  out += leg + M(leg, 150);
  /* torso */
  out += P('M104 94 L196 94 C206 122 204 164 192 196 L108 196 C96 164 94 122 104 94Z', met, INK, 2.6);
  out += P('M150 96 L150 194 M112 120 Q150 136 188 120 M108 156 Q150 168 192 156', 'none', '#0a0c12', 2) + frost('M110 100 L190 100 M114 124 Q150 138 186 124');
  out += G(P('M140 112 L150 104 L160 112 L150 124Z', glowc, null, null, { opacity: 0.85 }), { filter: d.glow(2.5, 2) });
  /* faulds */
  out += P('M104 192 L196 192 L204 222 L96 222Z', metV, INK, 2.2) + P('M100 206 L200 206 M150 192 L150 222', 'none', '#0a0c12', 1.6) + frost('M104 194 L196 194');
  /* greatsword (planted) */
  var blade = d.lin([[0, '#f0faff'], [0.45, '#a8c0d8'], [0.55, '#5a6a80'], [1, '#c8e0f0']], 0, 0, 1, 0);
  out += P('M139 150 L161 150 L159 266 L150 290 L141 266Z', blade, INK, 2);
  out += G(P('M150 160 L150 260', 'none', glowc, 1.6, { 'stroke-dasharray': '6 4 2 4' }), { filter: d.glow(2, 2) });
  out += P('M100 138 C112 134 188 134 200 138 L196 152 C184 146 116 146 104 152Z', met, INK, 2) + C(100, 145, 6, metV, { stroke: INK, 'stroke-width': 1.6 }) + C(200, 145, 6, metV, { stroke: INK, 'stroke-width': 1.6 });
  out += R(144, 100, 12, 38, '#20140e', { stroke: INK, 'stroke-width': 1.4 });
  out += C(150, 96, 8, metV, { stroke: INK, 'stroke-width': 1.8 }) + G(C(150, 96, 3.5, glowc), { filter: d.glow(2, 2) });
  /* arms down to the hilt */
  var arm = P('M76 132 C68 150 70 170 82 182 L100 176 C96 162 96 150 100 138Z', metV, INK, 2.2) + P('M82 182 C96 168 116 140 136 118 L146 132 C128 150 108 176 98 190Z', met, INK, 2.2) +
    P('M128 108 L148 108 L150 134 L130 138 C126 130 124 118 128 108Z', metV, INK, 2) + P('M132 116 L148 116 M132 124 L148 124', 'none', '#0a0c12', 1.2);
  out += arm + M(arm, 150);
  /* pauldrons */
  var paul = P('M122 92 C92 80 56 90 46 118 C44 136 54 148 68 148 C76 132 96 122 124 118Z', met, INK, 2.4) +
    P('M114 104 C90 98 66 106 56 124 C60 132 64 138 68 140', 'none', '#0a0c12', 1.8) +
    P('M70 92 L52 56 L82 88Z M92 86 L84 54 L102 84Z', d.lin([[0, '#c8d8e8'], [1, '#2a3040']]), INK, 1.6) +
    frost('M50 112 C62 92 90 84 118 92') +
    P('M56 146 L58 160 L62 146 L64 156 L68 146', ice, '#8ab8d8', 0.8);
  out += paul + M(paul, 150);
  /* helmet */
  var horn = P('M130 46 C110 40 96 22 100 2 C108 20 120 28 136 34Z', d.lin([[0, '#e8f4ff'], [1, '#3a4252']]), INK, 1.8);
  out += horn + M(horn, 150);
  out += P('M126 62 C124 32 176 32 174 62 L172 84 L150 96 L128 84Z', met, INK, 2.4);
  out += P('M150 30 L150 96', 'none', '#0a0c12', 1.4) + frost('M130 44 Q150 32 170 44');
  out += P('M132 58 L168 58 L168 66 L155 66 L155 86 L145 86 L145 66 L132 66Z', '#020306', INK, 1.2);
  out += G(P('M135 60 L146 61 L144 64 L136 63Z M165 60 L154 61 L156 64 L164 63Z', glowc), { filter: d.glow(2, 3) });
  /* ice crystals at feet */
  var cr = function (x, h, r) { return P('M' + x + ' 288 L' + (x - 6) + ' ' + (288 - h * 0.5) + ' L' + x + ' ' + (288 - h) + ' L' + (x + 6) + ' ' + (288 - h * 0.5) + 'Z', d.lin([[0, '#ffffff'], [1, '#5ab0e0', 0.7]]), '#e0f8ff', 1, { transform: 'rotate(' + r + ' ' + x + ' 288)' }); };
  out += cr(70, 34, -20) + cr(84, 22, 10) + cr(222, 30, 18) + cr(236, 20, -6) + cr(150, 26, 0);
  for (var i = 0; i < 10; i++) out += C(40 + i * 24, 30 + (i * 37) % 200, 1.5 + (i % 3), '#e8f8ff', { opacity: 0.7 });
  return out;
};

/* ---------------- BOSS: MALTHOR THE ARCHMAGE ---------------- */
MONSTERS.malthor = function (d) {
  var sk = '#f0e2da', hair = '#dfe6f2', robe = '#1a2a5a', silver = '#d0dcea', ice = '#9fe6ff';
  var out = mc_gshadow(150, 284, 70, 9, 0.4);
  out += C(150, 140, 140, d.rad([[0, '#7ad0ff', 0.3], [0.6, '#2a5aa0', 0.12], [1, '#102040', 0]]));
  /* swirling frost ring (back half) */
  out += E(150, 150, 120, 34, 'none', { stroke: '#bfefff', 'stroke-width': 1.2, opacity: 0.25, transform: 'rotate(-14 150 150)', 'stroke-dasharray': '30 12 6 12' });
  /* long hair back */
  var hg = d.lin([[0, '#ffffff'], [0.45, hair], [1, '#6a7898']]);
  out += P('M129 46 C112 74 106 120 98 168 C108 160 114 170 114 178 C122 160 128 140 130 120 L134 92 L166 92 L170 120 C172 140 178 160 186 178 C186 170 192 160 202 168 C194 120 188 74 171 46 C164 30 136 30 129 46Z', hg, INK, 1.6) +
    P('M126 70 C118 100 112 130 104 160 M174 70 C182 100 188 130 196 160 M132 90 C128 120 122 146 116 170 M168 90 C172 120 178 146 184 170', 'none', '#7a88a8', 1, { opacity: 0.7 });
  /* staff */
  out += P('M88 54 L94 54 L98 284 L90 284Z', d.lin([[0, '#c8d4e8'], [0.5, '#5a6a90'], [1, '#2a3460']], 0, 0, 1, 0), INK, 1.4);
  out += P('M78 56 C70 36 80 14 94 8 C86 22 86 36 92 48 C98 36 98 22 92 10 C108 18 112 40 104 56Z', d.lin([[0, '#f0f6ff'], [1, '#6a7aa0']]), INK, 1.4);
  out += G(C(91, 32, 10, d.rad([[0, '#ffffff'], [0.4, '#a8f0ff'], [1, '#2a80d0']])) + C(91, 32, 22, d.rad([[0, ice, 0.6], [1, ice, 0]])), { filter: d.glow(4, 2) });
  out += P('M91 22 L84 32 L91 42 L98 32Z', 'none', '#fff', 1, { opacity: 0.8 });
  /* robe */
  var rg = d.lin([[0, shade(robe, 0.25)], [0.6, robe], [1, '#080c20']]);
  out += P('M124 92 C108 140 94 220 80 286 L220 286 C206 220 192 140 176 92Z', rg, INK, 2.2);
  out += P('M176 92 C188 150 200 220 212 286 L180 286 C176 220 170 150 162 96Z', '#04081a', null, null, { opacity: 0.45 });
  out += P('M150 100 L150 286', 'none', silver, 2.2) + P('M140 100 L150 286 M160 100 L150 286', 'none', silver, 0.8, { opacity: 0.4 });
  out += P('M84 270 Q150 282 216 270', 'none', silver, 2.4) + P('M90 252 Q150 262 210 252', 'none', silver, 1, { 'stroke-dasharray': '4 3' });
  for (var i = 0; i < 4; i++) out += P(starPts(150, 200 + i * 20, 5, 1.6, 6, 0), silver, null, null, { opacity: 0.8 });
  out += P('M118 162 Q150 172 182 162 L182 172 Q150 182 118 172Z', mc_metal(d, '#8a9ab0'), INK, 1.4) + P('M150 162 L144 170 L150 180 L156 170Z', ice, INK, 1, { filter: d.glow(1.5) });
  /* chest V */
  out += P('M140 96 L150 124 L160 96Z', mc_skinFill(d, sk), INK, 1.2);
  /* mantle + high collar */
  var col = P('M132 94 L118 54 L128 60 L130 44 L144 86Z', d.lin([[0, '#e8f0ff'], [1, '#5a6a90']]), INK, 1.6);
  out += col + M(col, 150);
  var mant = P('M128 92 C108 94 94 104 90 124 L112 134 L146 112Z', d.lin([[0, '#3a5090'], [1, '#101c40']]), INK, 2) + P('M92 122 L112 132 L146 110', 'none', silver, 1.8);
  out += mant + M(mant, 150);
  /* arms */
  var sv = d.lin([[0, '#2a3e7a'], [1, '#0a1230']], 0, 0, 1, 1);
  out += P('M118 112 C104 126 98 146 96 162 L112 168 C114 150 120 136 128 128Z', sv, INK, 1.8) + E(96, 162, 6, 5.5, sk, { stroke: INK, 'stroke-width': 1.2 });
  out += P('M182 112 C202 116 216 126 228 140 L216 154 C206 144 194 138 182 134Z', sv, INK, 1.8) + P('M222 136 L232 146 L218 160 L212 150Z', silver, INK, 1.2) + E(232, 142, 6, 5, sk, { stroke: INK, 'stroke-width': 1.2 });
  /* frost crystals swirling around hand */
  var shard = function (x, y, s, r) { return T(P('M0 -10 L4 0 L0 10 L-4 0Z', d.lin([[0, '#ffffff'], [1, '#6ac8f0']]), '#e8fbff', 0.8) + P('M0 -10 L0 10', 'none', '#fff', 0.6), x, y, s, r); };
  var fx = '';
  for (i = 0; i < 9; i++) { var a = i / 9 * Math.PI * 2; fx += shard(238 + Math.cos(a) * 30, 130 + Math.sin(a) * 18, 0.6 + (i % 3) * 0.25, a * 57 + 90); }
  out += G(fx + C(238, 130, 10, d.rad([[0, '#ffffff'], [0.5, ice], [1, ice, 0]])), { filter: d.glow(2, 1) });
  var flake = function (x, y, s) { return T(P('M0 -6 L0 6 M-5.2 -3 L5.2 3 M-5.2 3 L5.2 -3', 'none', '#e8fbff', 1.2), x, y, s); };
  out += flake(60, 120, 1) + flake(250, 70, 0.8) + flake(210, 210, 1.1) + flake(70, 220, 0.7) + flake(270, 180, 0.6);
  /* face */
  out += mc_face(d, 150, 60, 1, { skin: sk, male: true, eye: '#5ab8ff', hair: hair, brow: '#9aa6c0', mouth: 'flat', ear: 'human', sad: true, glow: true });
  out += mc_bangs(150, 60, 1, hg, '#ffffff', 'part');
  /* front locks over shoulders */
  out += P('M130 74 C126 96 124 116 118 136 C126 124 132 108 134 90Z M170 74 C174 96 176 116 182 136 C174 124 168 108 166 90Z', hg, INK, 1.2);
  /* silver circlet */
  out += P('M130 46 Q150 38 170 46', 'none', silver, 1.6) + G(P('M150 37 L147 43 L150 47 L153 43Z', ice), { filter: d.glow(1.5, 2) });
  /* front half of frost ring */
  out += P('M34 172 Q150 220 268 128', 'none', '#dff8ff', 1.2, { opacity: 0.35, 'stroke-dasharray': '24 10 4 10' });
  out += shard(56, 168, 0.7, 30) + shard(110, 200, 0.6, 70) + shard(268, 128, 0.7, 120);
  return out;
};
})();
