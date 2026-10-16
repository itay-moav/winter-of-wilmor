/* Velmoor art: Named NPCs: bust portraits (NPCS, 200x250) and full-body figures (NPC_FIGS, 200x400),
 * built on the hero portrait and figure renderers or drawn directly.
 * Plain script (no modules); load order is listed in js/art/api.js. */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL;
/* from core.js */
var f = A.f, shade = A.shade, P = A.P, C = A.C, E = A.E, R = A.R, L = A.L, G = A.G, T = A.T, starPts = A.starPts, sparkle = A.sparkle, INK = A.INK,
    NPCS = A.NPCS, NPC_FIGS = A.NPC_FIGS;
/* from symbols.js */
var faithAt = A.faithAt;
/* from portraits.js */
var both = A.both, cast = A.cast, cups = A.cups, pauldron = A.pauldron, strapDiag = A.strapDiag, renderPortrait = A.renderPortrait,
    beardSvg = A.beardSvg;
/* from figures.js */
var armPart = A.armPart, legPart = A.legPart, kneeCop = A.kneeCop, propAt = A.propAt, FBOT = A.FBOT, MCAPE = A.MCAPE, MCROTCH = A.MCROTCH,
    MCHEST = A.MCHEST, fBelt = A.fBelt, mBelt = A.mBelt, fCups = A.fCups, plates = A.plates, renderFigure = A.renderFigure;
/* from keepsakes.js */
var fh_lily = A.fh_lily;

/* ------------------------------------------------------------------ */
/* NPC portraits (200 x 250)                                           */
/* ------------------------------------------------------------------ */
function npcBg(d, top, bottom, extra) {
  return function (dd, c) { return R(0, 0, 200, 250, dd.rad([[0, top], [1, bottom]], 0.5, 0.35, 0.8)) + (extra ? extra(dd, c) : ''); };
}
function tavernBg(dd, c) {
  var s = '';
  for (var i = 0; i < 4; i++) s += R(0, 40 + i * 50, 200, 4, '#3a1c0a', { opacity: 0.6 });
  for (var j = 0; j < 7; j++) s += T(R(-6, -10, 12, 14, '#c88a3a', { stroke: '#3a1c0a', 'stroke-width': 1, rx: 2 }) + R(-5, -12, 10, 4, '#fff6e0', { rx: 2 }), 16 + j * 28, 36, 1);
  s += C(170, 70, 18, '#ffcf70', { opacity: 0.45, filter: c.glowLg });
  return s;
}
function mustache(col, out) {
  return P('M100 112 C94 108 86 110 82 116 C88 114 92 116 96 116 C98 116 99 115 100 114 C101 115 102 116 104 116 C108 116 112 114 118 116 C114 110 106 108 100 112Z', col, out, 1);
}
function apronOutfit(shirt, apron, fem) {
  return function (d, c, m) {
    var s = '';
    if (fem) {
      s += both(cast('M38 178 C40 164 54 158 64 166 C70 176 66 192 58 198 C46 200 38 192 38 178Z', shirt, INK, 1.2, 0, 2));
      s += both(cast('M64 184 C66 176 80 172 92 176 C98 178 100 184 100 192 C94 204 80 206 70 202 C64 198 62 190 64 184Z', shirt, INK, 1.2, 0, 2));
      s += cast('M66 196 C76 208 92 210 100 202 C108 210 124 208 134 196 C136 214 132 230 132 250 L68 250 C68 230 64 214 66 196Z', '#5a7a3a', INK, 1.3, 0, 3);
      s += P('M94 208 L106 214 M106 208 L94 214 M94 220 L106 226 M106 220 L94 226', 'none', '#f0e0b0', 1);
      s += cast('M74 226 C90 230 110 230 126 226 L130 250 L70 250Z', apron, INK, 1.2, 0, 2);
    } else {
      s += cast('M46 154 C60 148 76 146 86 146 L100 170 L114 146 C124 146 140 148 154 154 C158 186 150 216 146 250 L54 250 C50 216 42 186 46 154Z', shirt, INK, 1.3, 0, 3);
      s += both(cast('M20 196 C20 172 30 152 48 150 C58 160 58 186 52 204 C40 208 28 206 20 196Z', shirt, INK, 1.2, 0, 2) + P('M22 192 C32 198 44 200 52 196', 'none', '#c8b8a0', 1.5));
      s += cast('M64 176 L136 176 L142 250 L58 250Z', apron, INK, 1.3, 0, 3) + P('M64 176 L84 146 M136 176 L116 146', 'none', apron, 3) + R(84, 196, 32, 18, 'none', { stroke: shade(apron, -0.3), 'stroke-width': 1.2 });
      s += cast('M120 150 C134 146 148 150 156 158 L150 196 C144 186 136 176 126 170Z', '#e8e0c8', INK, 1.1, 0, 2) + P('M128 160 L148 172 M126 168 L146 180', 'none', '#c03030', 1.4);
    }
    return s;
  };
}
function mug() {
  return function (d, c, m) {
    var s = R(-16, -22, 32, 40, d.lin([[0, '#d8a050'], [1, '#8a5a20']], 0, 0, 1, 0), { stroke: INK, 'stroke-width': 1.4, rx: 3 }) +
      P('M16 -14 C30 -14 30 10 16 10', 'none', INK, 6) + P('M16 -14 C30 -14 30 10 16 10', 'none', '#b07a30', 3.5) +
      P('M-18 -22 C-20 -34 -6 -36 0 -30 C6 -38 20 -34 18 -22Z', '#fffaf0', INK, 1.2) + R(-16, -8, 32, 3, '#5a3a14', { opacity: 0.6 }) + R(-16, 8, 32, 3, '#5a3a14', { opacity: 0.6 }) + R(-12, -18, 4, 30, '#fff', { opacity: 0.3 });
    return T(s, 158, 228, 1.1, -6);
  };
}
function simpleRobe(col, trim, collar) {
  return function (d, c, m) {
    var g = d.lin([[0, shade(col, 0.15)], [1, shade(col, -0.45)]]);
    var s = '';
    if (collar) s += P('M60 156 C46 120 50 96 58 82 C68 110 78 128 88 142Z M140 156 C154 120 150 96 142 82 C132 110 122 128 112 142Z', d.lin([[0, collar], [1, shade(col, -0.5)]]), INK, 1.3);
    s += cast('M46 154 C60 148 76 146 86 146 L100 176 L114 146 C124 146 140 148 154 154 C158 186 152 216 148 250 L52 250 C48 216 42 186 46 154Z', g, INK, 1.4, 0, 3);
    s += both(cast('M22 196 C20 172 30 152 48 150 C58 160 58 186 52 204 C40 208 28 206 22 196Z', g, INK, 1.2, 0, 2));
    s += P('M86 146 L100 176 L114 146 M100 176 L100 250', 'none', trim, 2.2);
    return s;
  };
}
function crystalBall(d, c) {
  var g = d.rad([[0, '#ffffff'], [0.3, '#f0c8ff'], [0.75, '#8a40d0'], [1, '#2a0a4a']], 0.4, 0.35, 0.65);
  return T(C(0, 0, 34, '#d080ff', { opacity: 0.35, filter: c.glowLg }) + P('M-20 24 L20 24 L14 34 L-14 34Z', '#c9a24a', INK, 1.2) + C(0, 0, 24, g, { stroke: '#f0d8ff', 'stroke-width': 1.2 }) +
    E(-8, -9, 7, 4.5, '#fff', 'opacity=".75"') + P('M-10 6 C-2 0 6 10 12 2', 'none', '#fff', 1.2, 'opacity=".6"') + sparkle(26, -22, 6, '#fff') + sparkle(-28, -12, 4, '#f6d8ff'), 100, 216, 1);
}
function frostParticles(c, n, col) {
  var s = '';
  for (var i = 0; i < n; i++) {
    var x = c.rnd() * 200, y = c.rnd() * 250, r = 2 + c.rnd() * 4;
    s += P('M' + f(x) + ' ' + f(y - r) + ' L' + f(x + r * 0.5) + ' ' + f(y) + ' L' + f(x) + ' ' + f(y + r) + ' L' + f(x - r * 0.5) + ' ' + f(y) + 'Z', col || '#dff4ff', null, null, 'opacity="' + f(0.5 + c.rnd() * 0.5) + '" filter="' + c.glowSm + '"');
  }
  return s;
}
function npcPortrait(d, base, cu) { base.custom = cu; return renderPortrait(d, base); }

NPCS.barkeep = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'm', look: { hair: 7, skin: 2, eyes: 2 }, seed: 3 }, {
    hairColor: '#6a3a22', bodySX: 1.12, bg: npcBg(d, '#a8642a', '#2a1006', tavernBg), outfit: apronOutfit('#f2ead8', '#7a5232'), props: {},
    face: function (dd, c) { return mustache(c.hairG, c.hairOut) + P('M76 112 C80 126 90 134 100 134 C110 134 120 126 124 112 C122 128 112 138 100 138 C88 138 78 128 76 112Z', c.hair, null, null, 'opacity=".25"'); },
    front: mug()
  });
};
NPCS.innkeeper = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'f', look: { hair: 2, skin: 1, eyes: 1 }, seed: 1 }, {
    hairColor: '#b5612c', tieCol: '#3a8a4a', bg: npcBg(d, '#c07a3a', '#3a1608', tavernBg), outfit: apronOutfit('#fbf4e6', '#f4eee0', true), props: {}, mouthI: 2,
    front: function (dd, c) { return T(R(-6, -20, 12, 22, '#fff6e0', { stroke: INK, 'stroke-width': 1 }) + P('M0 -20 C-5 -28 0 -34 0 -38 C4 -32 6 -26 0 -20Z', '#ffcf50', null, null, 'filter="' + c.glowMd + '"') + E(0, 4, 16, 5, '#b08a50', { stroke: INK, 'stroke-width': 1 }), 162, 236, 1); }
  });
};
NPCS.priestess = function (d) {
  return npcPortrait(d, { race: 'halfelf', cls: 'paladin', gender: 'f', look: { hair: 7, skin: 0, eyes: 5 }, seed: 2 }, {
    hairColor: '#f4e6b0',
    props: { back: function (dd, c) { var r = ''; for (var i = 0; i < 18; i++) { var a = i / 18 * Math.PI * 2; r += 'M100 80 L' + f(100 + Math.cos(a) * 200) + ' ' + f(80 + Math.sin(a) * 200) + ' L' + f(100 + Math.cos(a + 0.07) * 200) + ' ' + f(80 + Math.sin(a + 0.07) * 200) + 'Z'; } return P(r, '#fff', null, null, 'opacity=".25"') + P('M58 150 C38 170 30 210 26 250 L174 250 C170 210 162 170 142 150Z', 'rgba(255,255,255,0.55)', '#d9a83c', 1); } },
    outfit: function (dd, c, m) {
      var s = both(P('M80 176 L92 146', 'none', '#d9a83c', 2)) + cups(dd, c, m.white, INK, '#d9a83c') + faithAt(dd, 'dawn', 100, 190, 14);
      s += P('M88 146 C94 151 106 151 112 146', 'none', '#d9a83c', 1.6) + G(faithAt(dd, 'dawn', 100, 158, 14), { filter: c.glowSm });
      s += P('M64 232 C80 238 120 238 136 232 L137 240 C120 246 80 246 63 240Z', m.gold, INK, 1) + P('M84 242 L116 242 L112 250 L88 250Z', '#fff', INK, 1);
      s += both(P('M41 212 C48 216 56 216 61 212 L61 220 C54 223 47 223 41 220Z', m.gold, INK, 1));
      return s;
    },
    head: function (dd, c, m) { return P('M68 70 C80 64 120 64 132 70 L130 74 C118 68 82 68 70 74Z', m.gold, INK, 1) + G(faithAt(dd, 'dawn', 100, 64, 17), { filter: c.glowSm }); },
    bg: npcBg(d, '#fff4d0', '#9a7a3a')
  });
};
NPCS.merchant = function (d) {
  return npcPortrait(d, { race: 'gnome', cls: 'none', gender: 'm', look: { hair: 2, skin: 1, eyes: 0 }, seed: 4 }, {
    hairColor: '#e0d8d0', props: {}, outfit: simpleRobe('#8a5a2a', '#e0b040'),
    bg: npcBg(d, '#5a7a8a', '#141e26', function (dd, c) { var s = ''; for (var i = 0; i < 3; i++) { s += R(0, 60 + i * 60, 200, 5, '#3a2210'); for (var j = 0; j < 6; j++) s += R(8 + j * 32 + (i * 7 % 10), 38 + i * 60, 12, 22, ['#c04040', '#40a0c0', '#c0a040', '#60c060'][(i + j) % 4], { rx: 3, opacity: 0.6 }); } return s; }),
    head: function (dd, c, m) {
      return P('M64 66 C80 60 120 60 136 66 L136 74 C120 68 80 68 64 74Z', '#4a2c18', INK, 1) + both(C(86, 66, 9, m.gold, { stroke: INK, 'stroke-width': 1.3 }) + C(86, 66, 6.5, dd.rad([[0, '#bff6ff'], [1, '#3a8ab0']]), { stroke: INK, 'stroke-width': 0.8 }) + C(84, 64, 2, '#fff'));
    },
    face: function (dd, c) { return mustache('#e0d8d0', '#8a8078'); },
    front: function (dd, c, m) { return T(L(0, -40, 0, 20, INK, 4) + L(0, -40, 0, 20, '#c9a24a', 2) + L(-30, -36, 30, -36, '#c9a24a', 3) + P('M-30 -36 L-40 -10 L-20 -10Z M30 -36 L20 -6 L40 -6Z', 'none', '#c9a24a', 1) + E(-30, -10, 12, 4, m.gold, { stroke: INK, 'stroke-width': 1 }) + E(30, -6, 12, 4, m.gold, { stroke: INK, 'stroke-width': 1 }) + C(-30, -16, 4, '#ffd040', { stroke: INK, 'stroke-width': 0.8 }) + R(-14, 20, 28, 6, '#4a2c18', { stroke: INK, 'stroke-width': 1 }), 150, 214, 1); }
  });
};
var NPC_FUR = 'M14 172 C10 154 28 144 46 142 C62 138 78 140 88 146 L80 156 L74 150 L66 162 L58 152 L50 166 L42 154 L34 170 L26 158 L20 176Z';
NPCS.guildmaster = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'm', look: { hair: 1, skin: 2, eyes: 0 }, seed: 5 }, {
    hairColor: '#7a7680', props: {}, angry: true, bodySX: 1.06,
    outfit: function (dd, c, m) {
      var furG = dd.lin([[0, '#d0c0a8'], [1, '#6a5a48']]);
      return simpleRobe('#5a3a22', '#c9a24a')(dd, c, m) + strapDiag(m.leather, '#d8d8e0') + both(cast(NPC_FUR, furG, INK, 1.2, 0, 2));
    },
    bg: npcBg(d, '#7a3a2a', '#1a0a08', function (dd, c) { return P('M30 0 L70 0 L70 120 L50 104 L30 120Z M130 0 L170 0 L170 120 L150 104 L130 120Z', '#3a0a0a', '#c9a24a', 1.5, 'opacity=".7"') + P(starPts(50, 50, 10, 4, 5) + starPts(150, 50, 10, 4, 5), '#c9a24a', null, null, 'opacity=".7"'); }),
    face: function (dd, c) {
      return P('M74 84 L126 78', 'none', INK, 2) + E(115, 97, 10, 8.5, '#1a1218', { stroke: INK, 'stroke-width': 1 }) + P('M108 92 C112 90 118 90 121 93', 'none', '#4a3a40', 1) +
        P('M82 86 L90 108 M84 88 L82 92 M86 96 L84 100', 'none', '#a04848', 1.3, 'opacity=".8"') + P('M80 118 C86 126 96 130 100 131 C108 130 116 124 120 116 C118 128 110 136 100 136 C90 136 82 128 80 118Z', '#5a5058', null, null, 'opacity=".35"');
    }
  });
};
NPCS.sage = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'm', look: { hair: 3, skin: 1, eyes: 7 }, seed: 6 }, {
    hairColor: '#eceef4', props: {}, eyeSY: 0.6, outfit: simpleRobe('#3a4a8a', '#e0c060'),
    bg: npcBg(d, '#6a5030', '#140c06', function (dd, c) { var s = ''; for (var i = 0; i < 4; i++) { s += R(0, 50 + i * 50, 200, 4, '#2a1808'); for (var j = 0; j < 14; j++) s += R(4 + j * 14, 24 + i * 50, 10, 26, ['#7a2a2a', '#2a4a7a', '#4a6a2a', '#7a6a2a'][(i * 3 + j) % 4], { opacity: 0.55 }); } return s; }),
    face: function (dd, c) {
      return beardSvg(dd, c) + P('M76 90 L82 92 M118 92 L124 90 M90 76 C96 74 104 74 110 76', 'none', c.skinLine, 0.8) +
        both(C(85, 98, 9, 'rgba(200,230,255,0.25)', { stroke: '#c9a24a', 'stroke-width': 1.6 })) + P('M94 97 Q100 94 106 97', 'none', '#c9a24a', 1.4);
    }
  });
};
NPCS.mystic = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'f', look: { hair: 4, skin: 3, eyes: 4 }, seed: 7 }, {
    hairColor: '#2c2436', props: {}, mouthI: 2,
    outfit: function (dd, c, m) {
      var s = both(P('M80 176 L94 146', 'none', '#e2ae3e', 1.6)) + cups(dd, c, dd.lin([[0, '#c040a0'], [1, '#5a1050']]), INK, '#ffd060');
      for (var i = 0; i < 9; i++) s += C(72 + i * 7, 206 + Math.sin(i / 8 * Math.PI) * 4, 2, m.gold, { stroke: INK, 'stroke-width': 0.5 });
      s += P('M62 230 C80 236 120 236 138 230 L140 240 C120 246 80 246 60 240Z', m.gold, INK, 1) + P('M70 240 L130 240 L136 250 L64 250Z', 'rgba(200,80,180,0.6)', INK, 1);
      s += both(P('M64 160 C46 170 38 200 40 236', 'none', '#e0a0ff', 5, 'opacity=".4"'));
      return s;
    },
    head: function (dd, c, m) {
      var s = P('M62 72 C70 52 130 52 138 72 C130 66 70 66 62 72Z', '#8a2070', INK, 1.2);
      for (var i = 0; i < 9; i++) s += C(70 + i * 7.5, 70 + Math.sin(i / 8 * Math.PI) * 4, 2.2, m.gold, { stroke: INK, 'stroke-width': 0.5 });
      return s + P('M100 74 L103 79 L100 84 L97 79Z', '#ff60c0', INK, 0.8, 'filter="' + c.glowSm + '"');
    },
    bg: npcBg(d, '#7a2a8a', '#14051c', function (dd, c) { var s = ''; for (var i = 0; i < 30; i++) s += C(c.rnd() * 200, c.rnd() * 250, 0.5 + c.rnd(), '#ffe0ff', { opacity: 0.6 }); return s + C(100, 90, 80, 'none', { stroke: '#ffd060', 'stroke-width': 0.6, opacity: 0.4 }); }),
    front: crystalBall
  });
};
NPCS.malthor = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'm', look: { hair: 3, skin: 0, eyes: 6 }, seed: 8 }, {
    hairColor: '#dfe6f2', eyeColor: '#7ad8ff', eyeGlow: true, props: {}, angry: true,
    outfit: function (dd, c, m) {
      var s = simpleRobe('#1c2a6a', '#cfd8e8', '#9ab0d8')(dd, c, m);
      s += P('M100 180 L108 196 L100 212 L92 196Z', '#7ad8ff', INK, 1, 'filter="' + c.glowMd + '"');
      s += both(P('M50 160 L60 180 L54 200 M60 180 L74 186', 'none', '#cfd8e8', 1.2, 'opacity=".7"'));
      return s;
    },
    face: function (dd, c) { return both(P('M80 104 C82 108 86 110 90 110', 'none', c.skinLine, 0.8, 'opacity=".6"')); },
    head: function (dd, c, m) { return P('M70 66 L84 60 L100 50 L116 60 L130 66 L122 64 L100 56 L78 64Z', '#cfd8e8', INK, 1) + P('M100 50 L104 58 L100 64 L96 58Z', '#7ad8ff', INK, 0.8, 'filter="' + c.glowSm + '"'); },
    bg: npcBg(d, '#3a6aa8', '#04081c', function (dd, c) { return C(100, 90, 90, '#7ad8ff', { opacity: 0.15, filter: c.glowLg }); }),
    front: function (dd, c) { return frostParticles(c, 22); }
  });
};
NPCS.lyra = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'f', look: { hair: 0, skin: 0, eyes: 0 }, seed: 9 }, {
    hairColor: '#eef2fa', eyeMode: 'closed', props: {}, mouthI: 1,
    outfit: function (dd, c, m) {
      return both(P('M82 178 L92 146', 'none', '#cfe0f0', 2)) + cast('M64 182 C70 174 86 172 100 178 C114 172 130 174 136 182 C140 210 136 230 138 250 L62 250 C64 230 60 210 64 182Z', dd.lin([[0, '#ffffff'], [1, '#b8d0ea']]), INK, 1.3, 0, 3) +
        P('M70 196 C80 204 92 204 100 198 C108 204 120 204 130 196', 'none', '#9ab8e0', 1.2);
    },
    head: function (dd, c) { return P('M72 64 C78 58 84 58 86 64 C80 62 76 62 72 64Z', '#bfe6ff', INK, 0.8) + C(79, 62, 2, '#fff'); },
    bg: npcBg(d, '#9ad0f0', '#0a2a4a'),
    front: function (dd, c) {
      var ice = 'M100 6 L160 40 L178 140 L160 236 L100 250 L40 236 L22 140 L40 40Z';
      return P(ice, dd.lin([[0, '#e8f8ff', 0.35], [0.5, '#a0d8ff', 0.18], [1, '#e8f8ff', 0.4]], 0, 0, 1, 1), '#e8f8ff', 2, 'opacity=".95"') +
        P('M100 6 L100 250 M40 40 L100 120 L160 40 M22 140 L100 120 L178 140 M40 236 L100 120 L160 236', 'none', '#fff', 0.8, 'opacity=".35"') +
        P('M44 50 L70 46 L56 120Z', '#fff', null, null, 'opacity=".25"') + frostParticles(c, 14, '#fff');
    }
  });
};
NPCS.ghost_girl = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'f', look: { hair: 1, skin: 0, eyes: 6 }, seed: 10 }, {
    skin: '#d8ecfa', hairColor: '#f0f6ff', eyeColor: '#7ae0e0', tieCol: '#9ad8ff', props: {}, figOpacity: 0.78, mouthI: 0,
    outfit: function (dd, c) { return cast('M62 160 C76 152 90 150 100 152 C110 150 124 152 138 160 C142 200 150 230 160 250 L40 250 C50 230 58 200 62 160Z', dd.lin([[0, '#f0f8ff'], [1, '#a8d0ec']]), '#6a9ac0', 1.2, 0, 3) + P('M86 152 C92 162 108 162 114 152', 'none', '#9ac8e8', 2); },
    bg: npcBg(d, '#2a4a5a', '#05080c', function (dd, c) { return C(100, 110, 90, '#9af0ff', { opacity: 0.18, filter: c.glowLg }) + P('M0 250 L0 190 L30 190 L30 180 L60 180 L60 250Z M140 250 L140 170 C150 150 170 150 180 170 L180 250Z', '#0a1418', null, null, 'opacity=".8"'); }),
    front: function (dd, c) { var s = ''; for (var i = 0; i < 10; i++) s += C(20 + c.rnd() * 160, 120 + c.rnd() * 130, 1.5 + c.rnd() * 2, '#c0ffff', { opacity: 0.6, filter: c.glowSm }); return s; }
  });
};

/* ---- non-human NPC portraits, drawn directly ---- */
NPCS.matron = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'f', look: { hair: 0, skin: 0, eyes: 0 }, seed: 11 }, {
    hairColor: '#eef3fb', eyeColor: '#7fd2ff', eyeSY: 0.86, mouthI: 1, blush: 0.22, props: {},
    outfit: function (dd, c, m) {
      var silk = dd.lin([[0, '#ffffff'], [0.6, '#dceefc'], [1, '#9cc4e4']], 0, 0, 1, 1);
      var s = both(P('M80 176 L94 146', 'none', '#cfe0f0', 1.8));
      s += cups(dd, c, silk, INK, '#a8cce8');
      s += C(100, 189, 2.6, '#bff0ff', { stroke: '#8fb0cc', 'stroke-width': 0.8, filter: c.glowSm });
      s += P('M64 230 C80 236 120 236 136 230', 'none', '#e4f0fa', 2.6) + P('M66 236 C80 241 120 241 134 236', 'none', '#bcd4ea', 1.4);
      s += P('M86 234 C95 236 105 236 114 234 L120 250 L80 250Z', silk, INK, 1);
      s += both(P('M62 158 C46 166 38 192 37 250 L60 250 C60 220 62 190 68 168Z', 'rgba(205,232,255,0.38)', '#b8d8f0', 0.8));
      s += P('M88 145 C94 151 106 151 112 145', 'none', '#dceefc', 1.6) + faithAt(dd, 'pale', 100, 156, 12);
      return s;
    },
    head: function (dd, c, m) {
      return P('M67 72 C80 64 120 64 133 72 L131 76 C118 69 82 69 69 76Z', dd.lin([[0, '#ffffff'], [1, '#9ab8d4']]), INK, 0.9) +
        G(faithAt(dd, 'pale', 100, 64, 19), { filter: c.glowSm });
    },
    bg: npcBg(d, '#cfeaff', '#0a2244', function (dd, c) {
      var pil = dd.lin([[0, '#e8f6ff', 0.55], [1, '#5a86b0', 0.25]], 0, 0, 1, 0);
      var s = R(8, 0, 24, 250, pil) + R(168, 0, 24, 250, pil);
      s += P('M32 250 L32 80 C32 18 168 18 168 80 L168 250', 'none', '#e8f6ff', 3, 'opacity=".45"');
      for (var i = 0; i < 12; i++) { var x = 6 + i * 17; s += P('M' + x + ' 0 L' + (x + 7) + ' 0 L' + (x + 3.5) + ' ' + (10 + (i * 7) % 18) + 'Z', '#f0faff', null, null, 'opacity=".6"'); }
      return s + C(100, 90, 70, '#bff0ff', { opacity: 0.25, filter: c.glowLg });
    }),
    front: function (dd, c) { return frostParticles(c, 20, '#ffffff'); }
  });
};
NPCS.rootwarden = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'f', look: { hair: 4, skin: 2, eyes: 5 }, seed: 12 }, {
    hairColor: '#bdb6aa', eyeColor: '#e8a81e', eyeSY: 0.7, mouthI: 1, blush: 0.08, props: {},
    outfit: function (dd, c, m) {
      var amber = '#ffb43a';
      var s = simpleRobe('#6a4428', '#7a9a3a')(dd, c, m);
      s += both(cast(NPC_FUR, dd.lin([[0, '#8aae4a'], [1, '#334a18']]), INK, 1.2, 0, 2));
      s += G(P('M94 126 C92 134 96 140 92 147 M106 126 C108 134 104 140 108 147 M28 200 C34 210 30 220 36 230 M172 200 C166 210 170 220 164 230', 'none', amber, 1.2), { filter: c.glowSm });
      s += P('M88 146 C94 154 106 154 112 146', 'none', '#3a2410', 1.4) + faithAt(dd, 'root', 100, 166, 22);
      return s;
    },
    face: function (dd, c) {
      var ln = c.skinLine;
      return both(P('M71 95 L66 93 M71 99 L65 99.5 M71 103 L66 106', 'none', ln, 0.7, 'opacity=".8"') + P('M79 106 Q85 109 92 106', 'none', ln, 0.7, 'opacity=".7"') +
        P('M91 109 C88 113 88 117 91 121', 'none', ln, 0.8, 'opacity=".7"') + P('M86 124 C90 128 94 130 98 130', 'none', ln, 0.6, 'opacity=".5"')) +
        G(both(P('M74 110 C78 114 78 118 74 123 M76 117 L81 118', 'none', '#ffb43a', 1)), { filter: c.glowSm });
    },
    head: function (dd, c, m) {
      var ant = 'M78 62 C72 46 66 34 56 20 M68 42 C60 40 54 35 49 28 M61 31 C63 23 63 16 60 9 M74 53 C67 53 61 50 56 45';
      var s = both(P(ant, 'none', '#24160a', 6) + P(ant, 'none', dd.lin([[0, '#e0c8a0'], [1, '#8a6a48']]), 3.4));
      s += P('M65 71 C80 61 120 61 135 71', 'none', '#24160a', 6) + P('M65 71 C80 61 120 61 135 71', 'none', '#6a4424', 4) + P('M66 70 C78 66 84 70 92 64 C100 70 108 62 118 68 C124 64 130 70 134 70', 'none', '#a07040', 1.2);
      s += E(84, 64, 4, 2.2, '#7aa63a', { transform: 'rotate(-30 84 64)', stroke: INK, 'stroke-width': 0.6 }) + E(118, 64, 4, 2.2, '#7aa63a', { transform: 'rotate(30 118 64)', stroke: INK, 'stroke-width': 0.6 });
      s += C(100, 63, 3, '#ffb43a', { stroke: INK, 'stroke-width': 0.7, filter: c.glowSm });
      return s;
    },
    bg: npcBg(d, '#2e4a24', '#050a04', function (dd, c) {
      var s = '';
      for (var i = 0; i < 9; i++) { var x = 8 + i * 23 + (i % 2) * 6, l = 40 + (i * 37) % 80; s += P('M' + x + ' 0 C' + (x - 8) + ' ' + f(l * 0.4) + ' ' + (x + 8) + ' ' + f(l * 0.7) + ' ' + (x - 2) + ' ' + l, 'none', '#3a2814', 2 + (i % 3), 'opacity=".8"'); }
      for (var j = 0; j < 14; j++) s += C(c.rnd() * 200, 20 + c.rnd() * 220, 1 + c.rnd() * 1.4, '#ffd060', { filter: c.glowSm, opacity: 0.85 });
      return s;
    }),
    front: function (dd, c) {
      var s = C(0, 6, 26, '#ffb43a', { opacity: 0.4, filter: c.glowLg });
      s += P('M0 -40 L0 -22', 'none', '#2a1a0a', 2) + C(0, -42, 4, 'none', { stroke: '#2a1a0a', 'stroke-width': 2 });
      s += P('M-12 -14 L12 -14 L8 -22 L-8 -22Z', '#5a3a1c', INK, 1.1);
      s += R(-11, -14, 22, 26, dd.rad([[0, '#fff4c0'], [0.5, '#ffb43a'], [1, '#a05a10']]), { stroke: INK, 'stroke-width': 1.2, rx: 2 });
      s += P('M-11 -1 L11 -1 M0 -14 L0 12', 'none', '#3a2410', 1.6) + P('M-4 4 C-6 -2 0 -6 0 -10 C2 -4 6 -2 4 4 C3 7 -3 7 -4 4Z', '#fff8d0', null, null, 'filter="' + c.glowSm + '"');
      s += P('M-14 12 L14 12 L10 18 L-10 18Z', '#5a3a1c', INK, 1.1);
      return T(s, 160, 214, 1.15);
    }
  });
};
NPCS.dawnpriest = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'm', look: { hair: 7, skin: 1, eyes: 5 }, seed: 13 }, {
    hairColor: '#8a8890', eyeColor: '#e8a81e', angry: true, eyeSY: 0.76, mouthI: 2, props: {},
    outfit: function (dd, c, m) {
      var s = simpleRobe('#f4efe4', '#d9a83c')(dd, c, m);
      s += both(cast('M84 146 L94 156 L90 250 L74 250Z', m.gold, INK, 1.1, 1, 2));
      s += faithAt(dd, 'dawn', 83, 226, 14) + faithAt(dd, 'dawn', 117, 226, 14);
      s += P('M88 146 C92 160 108 160 112 146', 'none', '#b57a1c', 1.4) + faithAt(dd, 'dawn', 100, 172, 26);
      return s;
    },
    face: function (dd, c) { return P('M97 83 L98.5 89 M103 83 L101.5 89', 'none', c.skinLine, 0.9) + both(P('M90 110 C88 114 89 118 91 121', 'none', c.skinLine, 0.8, 'opacity=".7"')); },
    bg: npcBg(d, '#fff0c0', '#6a3a0a', function (dd, c) {
      var r = '';
      for (var i = 0; i < 16; i++) { var a = i / 16 * Math.PI * 2; r += 'M100 70 L' + f(100 + Math.cos(a) * 220) + ' ' + f(70 + Math.sin(a) * 220) + ' L' + f(100 + Math.cos(a + 0.1) * 220) + ' ' + f(70 + Math.sin(a + 0.1) * 220) + 'Z'; }
      return P(r, '#fff', null, null, 'opacity=".2"') + P('M20 250 L20 60 C20 30 50 30 50 60 L50 250Z M150 250 L150 60 C150 30 180 30 180 60 L180 250Z', '#fff8e0', null, null, 'opacity=".22"') + G(faithAt(dd, 'dawn', 100, 70, 120), { opacity: 0.18 });
    }),
    front: function (dd, c, m) {
      var s = P('M-6 -84 L0 -14', 'none', '#7a5a20', 1.4) + P('M6 -84 L0 -14', 'none', '#7a5a20', 1.4);
      for (var i = 0; i < 4; i++) s += P('M' + f(-4 + i * 3) + ' ' + f(-8 - i * 4) + ' C' + f(-14 + i * 6) + ' ' + f(-26 - i * 10) + ' ' + f(10 - i * 4) + ' ' + f(-34 - i * 10) + ' ' + f(-2 + i * 3) + ' ' + f(-52 - i * 10), 'none', '#f4f0ea', 3 - i * 0.5, 'opacity="' + f(0.5 - i * 0.1) + '" filter="' + c.glowSm + '"');
      s += C(0, 4, 22, '#ff9a30', { opacity: 0.4, filter: c.glowLg });
      s += P('M-8 -14 C-8 -20 8 -20 8 -14Z', m.gold, INK, 1) + C(0, -20, 2.2, m.gold, { stroke: INK, 'stroke-width': 0.8 });
      s += C(0, 4, 15, m.gold, { stroke: INK, 'stroke-width': 1.4 }) + P('M-15 2 L15 2', 'none', '#8a5a14', 1.2);
      s += C(-7, 8, 2.2, '#ffcf50', { filter: c.glowSm }) + C(0, 11, 2.2, '#ff8a20', { filter: c.glowSm }) + C(7, 8, 2.2, '#ffcf50', { filter: c.glowSm }) + C(-4, -5, 1.6, '#ff8a20') + C(4, -5, 1.6, '#ff8a20');
      s += E(-5, -3, 4, 2.4, '#fff', 'opacity=".55"') + P('M-6 19 L6 19 L4 24 L-4 24Z', m.gold, INK, 1);
      return T(s, 160, 206, 1);
    }
  });
};

/* ---- non-human NPC portraits ---- */
function npcFrame(d, s) {
  return s + R(0, 0, 200, 250, d.rad([[0.55, '#000', 0], [1, '#000', 0.6]], 0.5, 0.45, 0.75));
}
NPCS.morvane = function (d) {
  var gl = d.glow(4, 2), sm = d.glow(1.5);
  var bone = d.lin([[0, '#f4efe0'], [1, '#9a9078']]);
  var s = R(0, 0, 200, 250, d.rad([[0, '#2a5a9a'], [1, '#02040c']], 0.5, 0.4, 0.8));
  s += E(100, 110, 80, 100, '#4aa0ff', { opacity: 0.25, filter: d.blur(14) });
  s += P('M30 250 C34 190 60 160 100 156 C140 160 166 190 170 250Z', d.lin([[0, '#2a1a4a'], [1, '#0a0614']]), INK, 1.5);
  s += P('M60 168 C80 182 120 182 140 168 L146 186 C120 200 80 200 54 186Z', d.lin([[0, '#e0b040'], [1, '#7a5010']]), INK, 1.2);
  for (var i = 0; i < 5; i++) s += C(72 + i * 14, 186 + (i % 2) * 2, 3, ['#40a0ff', '#c03040'][i % 2], { stroke: INK, 'stroke-width': 0.6 });
  var skull = 'M62 92 C60 52 80 36 100 36 C120 36 140 52 138 92 C138 110 130 118 126 126 L122 146 C112 152 88 152 78 146 L74 126 C70 118 62 110 62 92Z';
  s += P(skull, bone, INK, 1.8);
  s += P('M118 46 C132 56 136 76 132 100 C130 112 126 120 122 130', 'none', '#7a7060', 4, 'opacity=".5"');
  s += both(P('M70 96 C72 84 82 80 92 84 C96 90 94 102 86 106 C78 108 70 104 70 96Z', '#0a0610', INK, 1));
  s += both(C(82, 95, 4, '#8ad8ff', { filter: gl }) + C(82, 95, 1.8, '#fff'));
  s += P('M100 108 L95 120 L105 120Z', '#1a1018', INK, 1);
  s += P('M80 132 L120 132 M84 128 L84 140 M90 128 L90 142 M96 128 L96 143 M102 128 L102 143 M108 128 L108 142 M114 128 L114 140', 'none', INK, 1.3);
  s += P('M84 60 L90 72 M88 66 L96 68', 'none', '#6a6050', 1);
  s += P('M60 58 L66 18 L78 44 L90 10 L100 40 L110 10 L122 44 L134 18 L140 58 C120 50 80 50 60 58Z', d.lin([[0, '#ffe080'], [1, '#9a6a10']]), INK, 1.6);
  s += C(100, 46, 5, '#40a0ff', { stroke: INK, 'stroke-width': 1, filter: sm }) + C(76, 50, 3, '#c03040') + C(124, 50, 3, '#c03040');
  for (var j = 0; j < 12; j++) s += C(20 + (j * 37 % 160), 40 + (j * 53 % 200), 1.5, '#9ad8ff', { filter: sm, opacity: 0.7 });
  return npcFrame(d, s);
};
NPCS.kargath = function (d) {
  var gl = d.glow(4, 2);
  var steel = d.lin([[0, '#5a6478'], [0.5, '#1a1e2a'], [1, '#0a0c12']], 0, 0, 1, 1);
  var horn = 'M64 54 C50 40 40 24 36 6 C56 18 66 30 74 42Z';
  var s = R(0, 0, 200, 250, d.rad([[0, '#4a5a7a'], [1, '#05070c']], 0.5, 0.4, 0.8));
  s += P('M10 250 C14 200 30 170 60 160 L140 160 C170 170 186 200 190 250Z', steel, INK, 1.6);
  s += both(P('M10 200 C10 168 30 150 60 150 C70 160 70 180 64 196 C44 200 24 204 10 200Z', steel, INK, 1.5) + P('M20 172 C30 160 44 156 56 158', 'none', '#e0f4ff', 2.5, 'opacity=".8"'));
  s += both(P(horn, steel, INK, 1.5));
  s += P('M60 120 C56 60 76 30 100 30 C124 30 144 60 140 120 C136 146 120 160 100 162 C80 160 64 146 60 120Z', steel, INK, 1.8);
  s += P('M70 92 L130 92 L126 104 L74 104Z', '#020204', INK, 1.2) + P('M100 104 L100 150 M90 112 L90 140 M110 112 L110 140', 'none', '#020204', 3);
  s += both(P('M76 98 L92 96 L90 100 L78 101Z', '#9af0ff', null, null, 'filter="' + gl + '"'));
  s += P('M72 50 C80 38 92 34 100 34 M64 120 C66 100 64 80 72 60', 'none', '#e8f8ff', 3, 'opacity=".75"');
  s += P('M60 120 L62 128 L66 122 L70 132 L74 124 M126 124 L130 132 L134 122 L138 128 L140 120', 'none', '#e8f8ff', 1.5);
  s += P('M90 160 L110 160 L106 250 L94 250Z', d.lin([[0, '#c0d0e0'], [1, '#5a6a80']], 0, 0, 1, 0), INK, 1.2) + R(70, 196, 60, 8, '#3a2a1a', { stroke: INK, 'stroke-width': 1 });
  for (var i = 0; i < 24; i++) { var x = (i * 47) % 200, y = (i * 71) % 250; s += sparkle(x, y, 2 + (i % 3), '#e8f8ff', { opacity: 0.7 }); }
  return npcFrame(d, s);
};
NPCS.ratking = function (d) {
  var fur = d.lin([[0, '#8a7a6a'], [1, '#3a2e26']]);
  var s = R(0, 0, 200, 250, d.rad([[0, '#5a6a3a'], [1, '#0a0c04']], 0.5, 0.4, 0.8));
  s += P('M0 250 L0 200 L20 180 L36 196 L50 170 L70 190 L130 190 L150 170 L166 196 L180 176 L200 196 L200 250Z', '#1a1408', null, null, 'opacity=".8"');
  s += P('M20 250 C24 200 50 170 100 166 C150 170 176 200 180 250Z', d.lin([[0, '#8a1a3a'], [1, '#3a0614']]), INK, 1.5);
  s += P('M40 190 C60 176 80 172 100 172 C120 172 140 176 160 190 L156 204 C120 190 80 190 44 204Z', '#f0ece0', INK, 1.2);
  for (var i = 0; i < 8; i++) s += C(50 + i * 14, 196 - Math.sin(i / 7 * Math.PI) * 8, 2, '#1a1a1a');
  s += both(P('M62 70 C40 40 40 20 60 22 C76 26 82 50 78 72Z', fur, INK, 1.5) + P('M62 64 C50 44 50 32 60 32 C70 36 72 52 72 66Z', '#d89a9a'));
  s += P('M60 90 C56 66 76 52 100 52 C124 52 144 66 140 90 C138 110 126 124 116 140 C110 152 104 160 100 160 C96 160 90 152 84 140 C74 124 62 110 60 90Z', fur, INK, 1.8);
  s += P('M84 128 C90 140 96 148 100 150 C104 148 110 140 116 128 C108 132 92 132 84 128Z', '#c8b8a8', null, null, 'opacity=".6"');
  s += E(100, 152, 7, 5, '#d87a8a', { stroke: INK, 'stroke-width': 1.2 }) + C(98, 150, 1.5, '#fff');
  s += both(P('M76 92 C80 84 92 84 94 94 C90 102 80 102 76 92Z', '#1a0606', INK, 1) + C(86, 92, 3.5, '#ff3a2a', { filter: d.glow(2.5) }) + C(85, 91, 1.2, '#fff'));
  s += both(P('M92 152 L60 146 M92 155 L58 158 M93 158 L62 168', 'none', '#e0d8d0', 0.8));
  s += P('M96 158 L96 166 L100 164Z M104 158 L104 166 L100 164Z', '#fff8e0', INK, 0.6);
  s += P('M68 60 L72 30 L84 48 L100 22 L116 48 L128 30 L132 60 C112 54 88 54 68 60Z', d.lin([[0, '#ffe080'], [1, '#8a5a10']]), INK, 1.5) + C(100, 44, 4, '#40c060', { stroke: INK, 'stroke-width': 0.8 }) + P('M76 50 L88 58 M120 48 L114 56', 'none', INK, 1);
  return npcFrame(d, s);
};
NPCS.mouth = function (d) {
  var s = R(0, 0, 200, 250, '#4a4a52');
  var stone = d.lin([[0, '#8a8a94'], [1, '#4a4a54']]);
  for (var r = 0; r < 7; r++) for (var c2 = 0; c2 < 4; c2++) {
    var x = c2 * 60 - (r % 2) * 30 - 10, y = r * 38 - 10;
    s += R(x + 2, y + 2, 56, 34, stone, { stroke: '#22222a', 'stroke-width': 2, rx: 4 }) + P('M' + (x + 6) + ' ' + (y + 6) + ' L' + (x + 50) + ' ' + (y + 6), 'none', '#b0b0ba', 1.5, 'opacity=".6"');
  }
  s += P('M30 90 C40 60 160 60 170 90 L176 180 C140 210 60 210 24 180Z', '#000', null, null, 'opacity=".25" filter="' + d.blur(6) + '"');
  var eyeGlow = d.glow(3, 2);
  s += both(P('M54 92 C60 78 84 76 92 88 C82 96 64 98 54 92Z', '#0a0a10', '#22222a', 2) + C(74, 88, 4, '#ffae40', { filter: eyeGlow }));
  var lip = d.lin([[0, '#a8a8b2'], [1, '#5a5a64']]);
  s += P('M44 152 C70 158 130 158 156 152 C140 196 60 196 44 152Z', '#120608', INK, 2);
  s += P('M62 156 L68 166 L74 157 M80 158 L86 168 L92 158 M108 158 L114 168 L120 158 M126 157 L132 166 L138 156', '#e8e0d0', INK, 0.8);
  s += P('M90 182 C96 174 106 174 112 182 C106 186 96 186 90 182Z', '#8a3a4a');
  s += P('M40 150 C60 128 84 126 100 134 C116 126 140 128 160 150 C140 146 120 144 100 148 C80 144 60 146 40 150Z', lip, INK, 2);
  s += P('M40 150 C60 190 140 190 160 150 C150 200 50 200 40 150Z', lip, INK, 2);
  s += P('M60 116 L70 126 M150 110 L136 124 M100 60 L104 74', 'none', '#22222a', 1.5);
  s += C(100, 168, 70, '#ffae40', { opacity: 0.08, filter: d.blur(10) });
  return npcFrame(d, s);
};


/* ---------- NPC full-body figures ---------- */
var FDRESS = 'M80 134 C90 140 110 140 120 134 C122 150 118 160 118 170 C130 230 140 300 146 376 C116 386 84 386 54 376 C60 300 70 230 82 170 C82 160 78 150 80 134Z';
var MROBE = 'M70 104 C80 98 90 96 96 96 L100 118 L104 96 C110 96 120 98 130 104 C134 120 128 140 124 152 C124 200 140 300 144 376 L56 376 C60 300 76 200 76 152 C72 140 66 120 70 104Z';
var FSARONG_BACK = 'M76 176 L124 176 L142 350 L100 356 L58 350Z';
var FSARONG_FRONT = 'M90 180 L110 180 L114 336 L100 346 L86 336Z';
function figFrost(c, n, col, y0, y1) {
  var s = '';
  for (var i = 0; i < n; i++) {
    var x = 20 + c.rnd() * 160, y = (y0 || 20) + c.rnd() * ((y1 || 360) - (y0 || 20)), r = 2 + c.rnd() * 3.5;
    s += P('M' + f(x) + ' ' + f(y - r) + ' L' + f(x + r * 0.5) + ' ' + f(y) + ' L' + f(x) + ' ' + f(y + r) + ' L' + f(x - r * 0.5) + ' ' + f(y) + 'Z', col || '#dff4ff', null, null, 'opacity="' + f(0.5 + c.rnd() * 0.5) + '" filter="' + c.glowSm + '"');
  }
  return s;
}
function npcFig(base, cu) { return function (d) { base.cls = 'none'; base.custom = cu; return renderFigure(d, base); }; }
var POSE_CLASP = { arms: [{ e: [6, 44], h: [-13, 76], front: 1 }, { e: [6, 44], h: [-13, 76], front: 1 }], legs: { k: [12, 274], a: [14, 370] } };
var POSE_HIPS = { arms: [{ e: [20, 38], h: [4, 70] }, { e: [20, 38], h: [4, 70] }], legs: { k: [16, 274], a: [22, 370] } };
var POSE_BLESS = { arms: [{ e: [8, 44], h: [8, 86] }, { e: [22, 22], h: [20, -10], hand: 'open' }], legs: { k: [12, 274], a: [16, 370] } };
var POSE_STAFF = { arms: [{ e: [16, 34], h: [20, 60], front: 1 }, { e: [10, 44], h: [10, 84], front: 1 }], legs: { k: [14, 274], a: [18, 370] } };

NPC_FIGS.priestess = npcFig({ race: 'halfelf', gender: 'f', look: { hair: 7, skin: 0, eyes: 5 }, seed: 2 }, {
  hairColor: '#f4e6b0', pose: POSE_BLESS, props: {},
  headBack: function (d, c) { return G(faithAt(d, 'dawn', 100, 70, 130), { opacity: 0.35, filter: c.glowMd }); },
  head: function (d, c, m) { return P('M68 70 C80 64 120 64 132 70 L130 74 C118 68 82 68 70 74Z', m.gold, INK, 1) + G(faithAt(d, 'dawn', 100, 64, 17), { filter: c.glowSm }); },
  figOutfit: function (d, c, m) {
    return {
      foot: { style: 'sandal', col: '#e2ae3e' },
      back: P('M74 98 C56 160 50 260 44 360 L156 360 C150 260 144 160 126 98Z', 'rgba(255,255,255,0.45)', '#d9a83c', 1) + P(FSARONG_BACK, '#f4f0e6', INK, 1),
      torso: P('M92 84 C96 90 104 90 108 84 L110 94 C104 98 96 98 90 94Z', m.gold, INK, 1) + fCups(d, m.white, '#d9a83c', '#d9a83c') + faithAt(d, 'dawn', 100, 126, 9) + cast(FBOT, m.white, INK, 1, 0, 2) +
        cast(FSARONG_FRONT, m.white, INK, 1.1, 0, 2) + faithAt(d, 'dawn', 100, 206, 14) + fBelt(170, m.gold),
      arm: function (arm) { return armPart(d, arm, 0.25, 0.32, m.gold, 1.4) + armPart(d, arm, 0.86, 0.96, m.gold, 1.6); }
    };
  },
  figFront: function (d, c, m, sk) { var H = sk.arms[1].H; return C(H[0], H[1] - 8, 16, '#fff2b0', { opacity: 0.5, filter: c.glowLg }) + sparkle(H[0] + 4, H[1] - 18, 6, '#fff') + sparkle(H[0] - 8, H[1] - 6, 3.5, '#fff6c0'); }
});
NPC_FIGS.matron = npcFig({ race: 'human', gender: 'f', look: { hair: 0, skin: 0, eyes: 0 }, seed: 11 }, {
  hairColor: '#eef3fb', eyeColor: '#7fd2ff', eyeSY: 0.86, mouthI: 1, blush: 0.22, pose: POSE_CLASP, props: {},
  head: function (d, c) { return P('M67 72 C80 64 120 64 133 72 L131 76 C118 69 82 69 69 76Z', d.lin([[0, '#ffffff'], [1, '#9ab8d4']]), INK, 0.9) + G(faithAt(d, 'pale', 100, 64, 19), { filter: c.glowSm }); },
  figOutfit: function (d, c, m) {
    var silk = d.lin([[0, '#ffffff'], [0.6, '#dceefc'], [1, '#9cc4e4']], 0, 0, 1, 1);
    return {
      foot: { style: 'sandal', col: '#cfe0f0' },
      back: P('M74 98 C58 160 50 260 46 372 L154 372 C150 260 142 160 126 98Z', 'rgba(200,230,255,0.35)', '#b8d8f0', 0.8) + P(FSARONG_BACK, d.lin([[0, '#e8f4ff'], [1, '#8ab0d4']]), INK, 1),
      torso: P('M93 86 C97 90 103 90 107 86', 'none', '#dceefc', 1.6) + faithAt(d, 'pale', 100, 96, 9) + fCups(d, silk, '#a8cce8', '#cfe0f0') + cast(FBOT, silk, INK, 1, 0, 2) +
        cast(FSARONG_FRONT, silk, INK, 1.1, 0, 2) + P('M75 172 C88 178 112 178 125 172', 'none', '#e4f0fa', 2.4) + P('M78 178 C90 184 110 184 122 178', 'none', '#bcd4ea', 1.3) + faithAt(d, 'pale', 100, 200, 12),
      arm: function (arm) { return armPart(d, arm, 0.1, 0.98, 'rgba(205,232,255,0.45)', 2.6, 0.5); }
    };
  },
  figFront: function (d, c) { return figFrost(c, 22, '#ffffff'); }
});
NPC_FIGS.rootwarden = npcFig({ race: 'human', gender: 'f', look: { hair: 4, skin: 2, eyes: 5 }, seed: 12 }, {
  hairColor: '#bdb6aa', eyeColor: '#e8a81e', eyeSY: 0.7, mouthI: 1, blush: 0.08, pose: { arms: [{ e: [16, 34], h: [22, 58], front: 1 }, { e: [10, 42], h: [22, 76], front: 1 }], legs: { k: [12, 274], a: [16, 370] } }, props: {},
  face: function (d, c) { var ln = c.skinLine; return both(P('M71 95 L66 93 M71 99 L65 99.5 M71 103 L66 106', 'none', ln, 0.7, 'opacity=".8"') + P('M79 106 Q85 109 92 106', 'none', ln, 0.7, 'opacity=".7"') + P('M91 109 C88 113 88 117 91 121', 'none', ln, 0.8, 'opacity=".7"')) + G(both(P('M74 110 C78 114 78 118 74 123 M76 117 L81 118', 'none', '#ffb43a', 1)), { filter: c.glowSm }); },
  head: function (d, c) {
    var ant = 'M78 62 C72 46 66 34 56 20 M68 42 C60 40 54 35 49 28 M61 31 C63 23 63 16 60 9 M74 53 C67 53 61 50 56 45';
    return both(P(ant, 'none', '#24160a', 6) + P(ant, 'none', d.lin([[0, '#e0c8a0'], [1, '#8a6a48']]), 3.4)) + P('M65 71 C80 61 120 61 135 71', 'none', '#24160a', 6) + P('M65 71 C80 61 120 61 135 71', 'none', '#6a4424', 4) + C(100, 63, 3, '#ffb43a', { stroke: INK, 'stroke-width': 0.7, filter: c.glowSm });
  },
  figOutfit: function (d, c, m) {
    var bark = d.lin([[0, '#7a5232'], [1, '#3a2414']]), moss = d.lin([[0, '#8aae4a'], [1, '#334a18']]);
    return {
      foot: { style: 'boot', col: '#3a2414' },
      torso: cast(FDRESS.replace('M80 134 C90 140 110 140 120 134', 'M76 100 C90 96 110 96 124 100'), bark, INK, 1.3, 0, 3) + P('M100 100 L100 376', 'none', '#7a9a3a', 1.6) +
        cast('M70 112 C66 100 76 92 88 92 C96 90 104 90 112 92 C124 92 134 100 130 112 L124 108 L120 118 L114 108 L108 120 L100 110 L92 120 L86 108 L80 118 L76 108Z', moss, INK, 1.1, 0, 2) +
        faithAt(d, 'root', 100, 134, 18) + G(P('M84 150 C88 170 82 190 88 210 M116 150 C112 170 118 190 112 210', 'none', '#ffb43a', 1), { filter: c.glowSm, opacity: 0.8 }),
      arm: function (arm) { return armPart(d, arm, 0, 0.94, bark, 2.6); }
    };
  },
  figBack: function (d, c, m, sk) {
    var H = sk.arms[0].H, st = 'M' + f(H[0]) + ' ' + f(H[1] - 120) + ' C' + f(H[0] - 6) + ' ' + f(H[1] - 60) + ' ' + f(H[0] + 4) + ' ' + f(H[1] + 60) + ' ' + f(H[0] - 2) + ' ' + f(H[1] + 196);
    return P(st, 'none', INK, 7) + P(st, 'none', '#6a4424', 4.4) + P('M' + f(H[0]) + ' ' + f(H[1] - 120) + ' C' + f(H[0] - 14) + ' ' + f(H[1] - 132) + ' ' + f(H[0] - 12) + ' ' + f(H[1] - 140) + ' ' + f(H[0] - 4) + ' ' + f(H[1] - 144), 'none', '#6a4424', 3) + E(H[0] + 4, H[1] - 118, 4, 2.2, '#7aa63a', { stroke: INK, 'stroke-width': 0.6 });
  },
  figFront: function (d, c, m, sk) {
    var H = sk.arms[1].H;
    var s = C(0, 22, 22, '#ffb43a', { opacity: 0.45, filter: c.glowLg }) + P('M0 0 L0 8', 'none', '#2a1a0a', 2) + P('M-9 8 L9 8 L6 2 L-6 2Z', '#5a3a1c', INK, 1) +
      R(-8, 8, 16, 20, d.rad([[0, '#fff4c0'], [0.5, '#ffb43a'], [1, '#a05a10']]), { stroke: INK, 'stroke-width': 1.1, rx: 2 }) + P('M-8 18 L8 18 M0 8 L0 28', 'none', '#3a2410', 1.3) + P('M-10 28 L10 28 L7 33 L-7 33Z', '#5a3a1c', INK, 1);
    for (var i = 0; i < 8; i++) s += C(-60 + c.rnd() * 120, -160 + c.rnd() * 240, 1.4, '#ffd060', { filter: c.glowSm, opacity: 0.8 });
    return propAt(s, H, 0);
  }
});
NPC_FIGS.dawnpriest = npcFig({ race: 'human', gender: 'm', look: { hair: 7, skin: 1, eyes: 5 }, seed: 13 }, {
  hairColor: '#8a8890', eyeColor: '#e8a81e', angry: true, eyeSY: 0.76, mouthI: 2, props: {}, pose: { arms: [{ e: [8, 44], h: [6, 86] }, { e: [22, 30], h: [30, 40], front: 1 }], legs: { k: [14, 274], a: [18, 370] } },
  face: function (d, c) { return P('M97 83 L98.5 89 M103 83 L101.5 89', 'none', c.skinLine, 0.9); },
  figOutfit: function (d, c, m) {
    var wht = d.lin([[0, '#ffffff'], [1, '#c8c0b0']]);
    return {
      foot: { style: 'boot', col: '#8a6a3a' },
      torso: cast(MROBE, wht, INK, 1.4, 0, 3) + P('M96 96 L100 118 L104 96', 'none', '#d9a83c', 1.8) + both(cast('M88 98 L96 100 L92 360 L82 358Z', m.gold, INK, 1, 0, 2)) +
        faithAt(d, 'dawn', 88, 300, 12) + faithAt(d, 'dawn', 112, 300, 12) + P('M90 98 C92 112 108 112 110 98', 'none', '#b57a1c', 1.2) + faithAt(d, 'dawn', 100, 128, 22) + mBelt(166, '#d9a83c'),
      arm: function (arm) { return armPart(d, arm, 0, 0.94, wht, 2.4); }
    };
  },
  figFront: function (d, c, m, sk) {
    var H = sk.arms[1].H, s = P('M-2 0 L0 46 M2 0 L0 46', 'none', '#7a5a20', 1.1);
    for (var i = 0; i < 4; i++) s += P('M' + f(-2 + i * 2) + ' ' + f(40 - i * 8) + ' C' + f(-12 + i * 5) + ' ' + f(20 - i * 12) + ' ' + f(10 - i * 4) + ' ' + f(10 - i * 12) + ' ' + f(-2 + i * 3) + ' ' + f(-10 - i * 12), 'none', '#f4f0ea', 2.4 - i * 0.4, 'opacity="' + f(0.5 - i * 0.1) + '" filter="' + c.glowSm + '"');
    s += C(0, 58, 16, '#ff9a30', { opacity: 0.4, filter: c.glowLg }) + P('M-6 47 C-6 42 6 42 6 47Z', m.gold, INK, 1) + C(0, 58, 11, m.gold, { stroke: INK, 'stroke-width': 1.2 }) + P('M-11 57 L11 57', 'none', '#8a5a14', 1);
    s += C(-5, 61, 1.8, '#ffcf50', { filter: c.glowSm }) + C(0, 63, 1.8, '#ff8a20', { filter: c.glowSm }) + C(5, 61, 1.8, '#ffcf50', { filter: c.glowSm }) + E(-4, 54, 3, 1.8, '#fff', 'opacity=".55"');
    return propAt(s, H, 0);
  }
});
NPC_FIGS.barkeep = npcFig({ race: 'human', gender: 'm', look: { hair: 7, skin: 2, eyes: 2 }, seed: 3 }, {
  hairColor: '#6a3a22', bodySX: 1.1, props: {}, pose: { arms: [{ e: [18, 38], h: [6, 70] }, { e: [24, 26], h: [26, -4], front: 1 }], legs: { k: [16, 274], a: [22, 370] } },
  face: function (d, c) { return mustache(c.hairG, c.hairOut); },
  figOutfit: function (d, c, m) {
    return {
      foot: { style: 'boot', col: '#3a2414' },
      torso: cast(MCHEST.replace('L100 118 L104', 'L100 112 L104'), '#f2ead8', INK, 1.2, 0, 2) + cast(MCROTCH, '#4a3a2a', INK, 1.1, 0, 2) + cast('M78 128 L122 128 L130 290 L70 290Z', '#7a5232', INK, 1.2, 0, 3) + P('M78 128 L90 96 M122 128 L110 96', 'none', '#7a5232', 3) + R(88, 170, 24, 16, 'none', { stroke: '#5a3a1e', 'stroke-width': 1.2 }) +
        cast('M110 98 C120 96 128 100 132 106 L128 136 C124 128 118 120 112 116Z', '#e8e0c8', INK, 1, 0, 2),
      legs: function (leg) { return legPart(d, leg, 0, 0.97, '#4a3a2a', 1.8) + legPart(d, leg, 0.55, 1, '#3a2414', 2.2); },
      arm: function (arm) { return armPart(d, arm, 0, 0.45, '#f2ead8', 2.6); }
    };
  },
  figFront: function (d, c, m, sk) {
    var H = sk.arms[1].H;
    var s = R(-10, -28, 20, 26, d.lin([[0, '#d8a050'], [1, '#8a5a20']], 0, 0, 1, 0), { stroke: INK, 'stroke-width': 1.2, rx: 2 }) + P('M10 -22 C19 -22 19 -8 10 -8', 'none', INK, 4) + P('M10 -22 C19 -22 19 -8 10 -8', 'none', '#b07a30', 2.4) +
      P('M-11 -28 C-12 -36 -4 -37 0 -33 C4 -38 12 -36 11 -28Z', '#fffaf0', INK, 1);
    return propAt(s, [H[0] + 2, H[1] + 4], 0);
  }
});
NPC_FIGS.innkeeper = npcFig({ race: 'human', gender: 'f', look: { hair: 2, skin: 1, eyes: 1 }, seed: 1 }, {
  hairColor: '#b5612c', tieCol: '#3a8a4a', mouthI: 2, props: {}, pose: POSE_HIPS,
  figOutfit: function (d, c, m) {
    return {
      foot: { style: 'boot', col: '#5a3a1c' },
      torso: both(cast('M78 120 C80 113 90 111 98 114 C101 117 100 124 99 130 C94 137 84 138 80 134 C77 130 76 125 78 120Z', '#fbf4e6', INK, 1.1, 0, 2)) +
        cast('M80 136 C88 141 112 141 120 136 L117 172 C108 176 92 176 83 172Z', '#5a7a3a', INK, 1.2, 0, 2) + P('M95 142 L105 148 M105 142 L95 148 M95 152 L105 158 M105 152 L95 158', 'none', '#f0e0b0', 0.9) +
        cast('M74 170 C88 176 112 176 126 170 L144 300 C116 310 84 310 56 300Z', d.lin([[0, '#5a7a3a'], [1, '#2a4a1c']]), INK, 1.2, 0, 3) + cast('M84 176 L116 176 L122 282 C108 288 92 288 78 282Z', '#f4eee0', INK, 1.1, 0, 2),
      legs: function (leg) { return legPart(d, leg, 0.6, 1, '#5a3a1c', 1.6); },
      arm: function (arm) { return armPart(d, arm, 0, 0.36, '#fbf4e6', 3); }
    };
  }
});
NPC_FIGS.merchant = npcFig({ race: 'gnome', gender: 'm', look: { hair: 2, skin: 1, eyes: 0 }, seed: 4 }, {
  hairColor: '#e0d8d0', props: {}, pose: { arms: [{ e: [12, 42], h: [6, 80] }, { e: [24, 24], h: [30, 4], front: 1 }], legs: { k: [16, 274], a: [20, 370] } },
  face: function (d, c) { return mustache('#e0d8d0', '#8a8078'); },
  head: function (d, c, m) { return P('M64 66 C80 60 120 60 136 66 L136 74 C120 68 80 68 64 74Z', '#4a2c18', INK, 1) + both(C(86, 66, 9, m.gold, { stroke: INK, 'stroke-width': 1.3 }) + C(86, 66, 6.5, d.rad([[0, '#bff6ff'], [1, '#3a8ab0']]), { stroke: INK, 'stroke-width': 0.8 })); },
  figOutfit: function (d, c, m) {
    return {
      foot: { style: 'boot', col: '#4a2c18' },
      torso: cast(MCHEST, '#f0e6d0', INK, 1.1, 0, 2) + both(cast('M70 104 C76 100 84 98 88 98 L98 200 L77 200 C78 168 78 162 76 152 C72 140 66 120 70 104Z', d.lin([[0, '#9a6a3a'], [1, '#4a2c14']]), INK, 1.2, 0, 2)) + cast(MCROTCH, '#5a4a6a', INK, 1.1, 0, 2) + mBelt(170, '#3a2414', m.gold) + R(110, 176, 10, 12, '#7a5a2a', { stroke: INK, 'stroke-width': 0.8, rx: 3 }),
      legs: function (leg) { return legPart(d, leg, 0, 0.97, '#5a4a6a', 1.8) + legPart(d, leg, 0.6, 1, '#4a2c18', 2.2); },
      arm: function (arm) { return armPart(d, arm, 0, 0.9, '#f0e6d0', 2); }
    };
  },
  figFront: function (d, c, m, sk) {
    var H = sk.arms[1].H;
    var s = L(0, -30, 0, 6, INK, 3.4) + L(0, -30, 0, 6, '#c9a24a', 1.8) + L(-22, -26, 22, -26, '#c9a24a', 2.4) + P('M-22 -26 L-30 -6 L-14 -6Z M22 -26 L14 -4 L30 -4Z', 'none', '#c9a24a', 0.9) +
      E(-22, -6, 9, 3, m.gold, { stroke: INK, 'stroke-width': 0.9 }) + E(22, -4, 9, 3, m.gold, { stroke: INK, 'stroke-width': 0.9 }) + C(-22, -10, 3, '#ffd040', { stroke: INK, 'stroke-width': 0.6 });
    return propAt(s, H, 0);
  }
});
NPC_FIGS.guildmaster = npcFig({ race: 'human', gender: 'm', look: { hair: 1, skin: 2, eyes: 0 }, seed: 5 }, {
  hairColor: '#7a7680', angry: true, bodySX: 1.04, props: {}, pose: POSE_HIPS,
  face: function (d, c) { return P('M74 84 L126 78', 'none', INK, 2) + E(115, 97, 10, 8.5, '#1a1218', { stroke: INK, 'stroke-width': 1 }) + P('M82 86 L90 108', 'none', '#a04848', 1.3, 'opacity=".8"'); },
  figOutfit: function (d, c, m) {
    var coat = d.lin([[0, '#6a4428'], [1, '#2a180c']]);
    return {
      foot: { style: 'boot', col: '#2a180c' },
      back: P('M68 100 C56 160 52 240 48 320 L152 320 C148 240 144 160 132 100Z', coat, INK, 1.3),
      torso: cast(MCHEST.replace('L100 118 L104', 'L100 110 L104'), '#3a3040', INK, 1.1, 0, 2) + cast(MCROTCH, '#3a3040', INK, 1, 0, 2) + both(cast('M70 104 C78 99 86 98 90 98 L96 176 L94 316 L62 312 C68 240 74 190 76 152 C72 140 66 120 70 104Z', coat, INK, 1.2, 0, 2)) +
        cast('M66 104 L76 98 L128 182 L118 188Z', m.leather, INK, 1.1, 0, 2) + mBelt(170, m.leather, m.gold) +
        cast('M54 112 C50 98 62 90 76 88 C90 86 110 86 124 88 C138 90 150 98 146 112 L138 106 L132 116 L124 104 L116 114 L108 102 L100 112 L92 102 L84 114 L76 104 L68 116 L62 106Z', d.lin([[0, '#d0c0a8'], [1, '#6a5a48']]), INK, 1.1, 0, 2),
      legs: function (leg) { return legPart(d, leg, 0, 0.97, '#3a3040', 1.8) + legPart(d, leg, 0.5, 1, '#2a180c', 2.4); },
      arm: function (arm) { return armPart(d, arm, 0, 0.94, coat, 2.2); }
    };
  },
  figFront: function (d, c, m, sk) { return propAt(R(-3, 0, 6, 70, '#3a2418', { stroke: INK, 'stroke-width': 1 }) + R(-10, -3, 20, 4, m.gold, { stroke: INK, 'stroke-width': 0.8 }) + R(-2.5, -18, 5, 15, '#2a1a10', { stroke: INK, 'stroke-width': 0.8 }) + C(0, -20, 3, m.gold), [72, 186], 16); }
});
NPC_FIGS.sage = npcFig({ race: 'human', gender: 'm', look: { hair: 3, skin: 1, eyes: 7 }, seed: 6 }, {
  hairColor: '#eceef4', eyeSY: 0.6, props: {}, pose: POSE_STAFF,
  face: function (d, c) { return beardSvg(d, c) + both(C(85, 98, 9, 'rgba(200,230,255,0.25)', { stroke: '#c9a24a', 'stroke-width': 1.6 })) + P('M94 97 Q100 94 106 97', 'none', '#c9a24a', 1.4); },
  figOutfit: function (d, c, m) {
    var robe = d.lin([[0, '#4a5aa0'], [1, '#1a2450']]);
    return { foot: { style: 'boot', col: '#3a2414' }, torso: cast(MROBE, robe, INK, 1.4, 0, 3) + P('M96 96 L100 118 L104 96 M100 118 L100 376', 'none', '#e0c060', 1.8) + mBelt(166, '#7a2a2a'), arm: function (arm) { return armPart(d, arm, 0, 0.94, robe, 3); } };
  },
  figBack: function (d, c, m, sk) { var H = sk.arms[0].H; return P('M' + f(H[0]) + ' ' + f(H[1] - 110) + ' L' + f(H[0]) + ' ' + f(H[1] + 206), 'none', INK, 7) + P('M' + f(H[0]) + ' ' + f(H[1] - 110) + ' L' + f(H[0]) + ' ' + f(H[1] + 206), 'none', m.wood, 4.4) + C(H[0], H[1] - 114, 6, '#c9a24a', { stroke: INK, 'stroke-width': 1 }); },
  figFront: function (d, c, m, sk) { var H = sk.arms[1].H; return propAt(R(-14, -4, 28, 20, '#7a2a2a', { stroke: INK, 'stroke-width': 1.2, rx: 2 }) + R(-12, -2, 24, 16, '#f4ead0', { stroke: INK, 'stroke-width': 0.6 }) + P('M0 -2 L0 14', 'none', INK, 1), [H[0] - 4, H[1] - 4], -10); }
});
NPC_FIGS.mystic = npcFig({ race: 'human', gender: 'f', look: { hair: 4, skin: 3, eyes: 4 }, seed: 7 }, {
  hairColor: '#2c2436', mouthI: 2, props: {}, pose: { arms: [{ e: [20, 30], h: [22, 4], hand: 'open' }, { e: [18, 38], h: [6, 70] }], legs: { k: [8, 274], a: [20, 370] } },
  head: function (d, c, m) { var s = P('M62 72 C70 52 130 52 138 72 C130 66 70 66 62 72Z', '#8a2070', INK, 1.2); for (var i = 0; i < 9; i++) s += C(70 + i * 7.5, 70 + Math.sin(i / 8 * Math.PI) * 4, 2.2, m.gold, { stroke: INK, 'stroke-width': 0.5 }); return s; },
  figOutfit: function (d, c, m) {
    var mag = d.lin([[0, '#c040a0'], [1, '#5a1050']]), sheer = 'rgba(220,120,220,0.45)';
    var coins = ''; for (var i = 0; i < 9; i++) coins += C(76 + i * 6, 184 + Math.sin(i / 8 * Math.PI) * 6, 1.8, m.gold, { stroke: INK, 'stroke-width': 0.4 });
    return {
      foot: { style: 'sandal', col: '#e2ae3e' },
      torso: fCups(d, mag, '#ffd060', '#e2ae3e') + cast(FBOT, mag, INK, 1, 0, 2) + fBelt(172, m.gold) + coins,
      legs: function (leg) { return legPart(d, leg, 0.02, 0.9, sheer, 4.5, 0.6) + legPart(d, leg, 0.86, 0.9, m.gold, 3.6); },
      arm: function (arm) { return armPart(d, arm, 0.86, 0.95, m.gold, 1.6) + armPart(d, arm, 0.25, 0.32, m.gold, 1.4); }
    };
  },
  figFront: function (d, c, m, sk) {
    var H = sk.arms[0].H, g = d.rad([[0, '#ffffff'], [0.3, '#f0c8ff'], [0.75, '#8a40d0'], [1, '#2a0a4a']], 0.4, 0.35, 0.65);
    return propAt(C(0, 0, 24, '#d080ff', { opacity: 0.4, filter: c.glowLg }) + C(0, 0, 14, g, { stroke: '#f0d8ff', 'stroke-width': 1 }) + E(-5, -5, 4.5, 3, '#fff', 'opacity=".75"') + sparkle(16, -14, 5, '#fff') + sparkle(-16, -8, 3, '#f6d8ff'), [H[0], H[1] - 22], 0);
  }
});
NPC_FIGS.malthor = npcFig({ race: 'human', gender: 'm', look: { hair: 3, skin: 0, eyes: 6 }, seed: 8 }, {
  hairColor: '#dfe6f2', eyeColor: '#7ad8ff', eyeGlow: true, angry: true, props: {}, pose: 'wizard',
  head: function (d, c) { return P('M70 66 L84 60 L100 50 L116 60 L130 66 L122 64 L100 56 L78 64Z', '#cfd8e8', INK, 1) + P('M100 50 L104 58 L100 64 L96 58Z', '#7ad8ff', INK, 0.8, 'filter="' + c.glowSm + '"'); },
  headBack: function (d, c, m) { return P('M60 156 C46 120 50 96 58 82 C68 110 78 128 88 142Z M140 156 C154 120 150 96 142 82 C132 110 122 128 112 142Z', d.lin([[0, '#9ab0d8'], [1, '#0e1640']]), INK, 1.3); },
  figOutfit: function (d, c, m) {
    var robe = d.lin([[0, '#2a3a8a'], [1, '#0a1030']]);
    return {
      foot: { style: 'boot', col: '#0e1640' },
      back: P('M66 100 C50 170 44 260 40 380 L160 380 C156 260 150 170 134 100Z', d.lin([[0, '#1a2a6a'], [1, '#050818']]), INK, 1.3),
      torso: cast(MROBE, robe, INK, 1.4, 0, 3) + P('M96 96 L100 118 L104 96 M100 118 L100 376', 'none', '#cfd8e8', 1.8) + both(P('M82 200 L90 220 L84 240 M90 220 L98 224', 'none', '#cfd8e8', 1, 'opacity=".7"')) + mBelt(166, '#cfd8e8') + P('M100 126 L106 136 L100 146 L94 136Z', '#7ad8ff', INK, 1, 'filter="' + c.glowMd + '"'),
      arm: function (arm) { return armPart(d, arm, 0, 0.94, robe, 2.6); }
    };
  },
  figFront: function (d, c) { return figFrost(c, 26); }
});
NPC_FIGS.lyra = npcFig({ race: 'human', gender: 'f', look: { hair: 0, skin: 0, eyes: 0 }, seed: 9 }, {
  hairColor: '#eef2fa', eyeColor: '#9ad8ff', mouthI: 1, blush: 0.3, props: {}, pose: POSE_CLASP, figOpacity: 0.85,
  headBack: function (d, c) { return C(100, 100, 70, '#bfe8ff', { opacity: 0.45, filter: c.glowLg }); },
  head: function (d, c) { return P('M72 64 C78 58 84 58 86 64 C80 62 76 62 72 64Z', '#bfe6ff', INK, 0.8) + C(79, 62, 2, '#fff'); },
  figOutfit: function (d, c, m) {
    var dress = d.lin([[0, '#ffffff'], [0.7, '#d8ecff'], [1, '#9ac8f0', 0.2]]);
    return {
      foot: { style: 'bare' },
      back: E(100, 220, 80, 170, '#9ad8ff', { opacity: 0.25, filter: c.glowLg }),
      torso: both(P('M84 118 L94 92', 'none', '#cfe0f0', 1.4)) + cast(FDRESS.replace('M80 134 C90 140 110 140 120 134', 'M78 120 C86 112 96 114 100 120 C104 114 114 112 122 120'), dress, '#6a9ac0', 1.1, 0, 2) +
        P('M84 140 C92 146 108 146 116 140', 'none', '#9ab8e0', 1.2)
    };
  },
  figFront: function (d, c) { return figFrost(c, 18, '#ffffff'); }
});
NPC_FIGS.ghost_girl = npcFig({ race: 'human', gender: 'f', look: { hair: 1, skin: 0, eyes: 6 }, seed: 10 }, {
  skin: '#d8ecfa', hairColor: '#f0f6ff', eyeColor: '#7ae0e0', tieCol: '#9ad8ff', props: {}, figOpacity: 0.72, mouthI: 0,
  pose: { arms: [{ e: [10, 42], h: [4, 82] }, { e: [20, 28], h: [26, 4], hand: 'open' }], legs: { k: [10, 274], a: [12, 362] } },
  figOutfit: function (d, c, m) {
    return {
      foot: { style: 'bare' },
      back: E(100, 220, 70, 160, '#9af0ff', { opacity: 0.2, filter: c.glowLg }),
      torso: cast('M78 104 C86 98 94 96 100 98 C106 96 114 98 122 104 C124 140 118 160 120 176 C132 230 140 290 150 330 L130 322 L116 336 L100 324 L84 336 L70 322 L50 330 C60 290 68 230 80 176 C82 160 76 140 78 104Z', d.lin([[0, '#f0f8ff'], [1, '#a8d0ec']]), '#6a9ac0', 1.2, 0, 3) + P('M90 100 C94 108 106 108 110 100', 'none', '#9ac8e8', 1.6)
    };
  },
  figFront: function (d, c) { var s = ''; for (var i = 0; i < 10; i++) s += C(40 + c.rnd() * 120, 200 + c.rnd() * 180, 1.5 + c.rnd() * 2, '#c0ffff', { opacity: 0.6, filter: c.glowSm }); return s; }
});
NPC_FIGS.kargath = npcFig({ race: 'human', gender: 'm', look: { hair: 6, skin: 1, eyes: 6 }, seed: 14 }, {
  hairColor: '#dfe6f0', eyeColor: '#8ae8ff', angry: true, bodySX: 1.08, props: {},
  pose: { arms: [{ e: [10, 40], h: [-32, 64], front: 1 }, { e: [10, 40], h: [-32, 64], front: 1 }], legs: { k: [20, 272], a: [28, 370] } },
  face: function (d, c) { return P('M114 84 L120 108 M116 90 L113 94', 'none', '#a05050', 1.4, 'opacity=".8"') + both(P('M80 104 C82 108 86 110 90 110', 'none', c.skinLine, 0.8, 'opacity=".6"')); },
  figOutfit: function (d, c, m) {
    var steel = d.lin([[0, '#5a6478'], [0.5, '#1a1e2a'], [1, '#0a0c12']], 0, 0, 1, 1), frost = '#e8f8ff';
    return {
      foot: { style: 'boot', col: '#1a1e2a' }, hand: '#2a2e3a',
      back: P(MCAPE, d.lin([[0, '#2a3048'], [1, '#08090e']]), INK, 1.4),
      torso: cast(MCHEST.replace('L100 118 L104', 'L100 100 L104'), steel, INK, 1.4, 0, 2) + P('M70 104 C80 98 90 96 100 98 C110 96 120 98 130 104', 'none', frost, 1.6, 'opacity=".8"') + P('M100 104 L100 170 M80 130 Q100 140 120 130', 'none', '#6a7488', 1.2) +
        mBelt(172, '#2a2e3a', '#8a94a8') + plates(steel, frost, 182, 224, 3, 17) + pauldron(d, c, 66, 104, 0.85, steel, frost) + pauldron(d, c, 134, 104, 0.85, steel, frost, true),
      legs: function (leg) { return legPart(d, leg, 0, 1, steel, 1.6) + kneeCop(leg, '#3a4252'); },
      arm: function (arm) { return armPart(d, arm, 0, 0.98, steel, 1.4); }
    };
  },
  figMid: function (d, c, m, sk) {
    var x = 100, y = sk.arms[0].H[1];
    var blade = d.lin([[0, '#c0d0e0'], [0.5, '#f0f6ff'], [1, '#5a6a80']], 0, 0, 1, 0);
    var s = P('M' + (x - 6) + ' ' + f(y + 12) + ' L' + (x + 6) + ' ' + f(y + 12) + ' L' + (x + 5) + ' 372 L' + x + ' 384 L' + (x - 5) + ' 372Z', blade, INK, 1.3) + P('M' + x + ' ' + f(y + 16) + ' L' + x + ' 370', 'none', '#fff', 0.8) +
      R(x - 18, y + 8, 36, 6, '#3a4252', { stroke: INK, 'stroke-width': 1.1, rx: 2 }) + R(x - 3.5, y - 12, 7, 20, '#2a1a10', { stroke: INK, 'stroke-width': 1 }) + C(x, y - 14, 5, '#8ae8ff', { stroke: INK, 'stroke-width': 1, filter: c.glowSm });
    for (var i = 0; i < 10; i++) s += sparkle(40 + c.rnd() * 120, 60 + c.rnd() * 300, 2 + c.rnd() * 2.5, '#e8f8ff', { opacity: 0.7 });
    return s;
  }
});

/* ---------------- Irena of Isenmark, as she was in life ---------------- */
function fh_irenaBg(dd, c) {
  var s = R(0, 0, 200, 250, dd.rad([[0, '#ffdcae'], [0.55, '#b06a48'], [1, '#2a1424']], 0.62, 0.35, 0.85));
  /* frosted window on the left, warm room on the right */
  s += P('M6 120 L6 48 C6 20 58 20 58 48 L58 120Z', dd.lin([[0, '#9ac8ec'], [1, '#2a4a7a']]), '#4a2a1c', 4) + P('M23 120 L23 26 M41 120 L41 26', 'none', '#4a2a1c', 2.2);
  s += P('M8 118 C14 104 22 112 30 102 C36 110 46 104 56 116 L56 118Z', '#f4fbff', null, null, 'opacity=".85"') + C(18, 46, 1.4, '#fff') + C(44, 56, 1.2, '#fff') + C(24, 90, 1.2, '#fff') + C(48, 96, 1.4, '#fff');
  s += R(0, 118, 64, 6, '#4a2a1c', { rx: 1.5 });
  s += C(166, 70, 30, '#ffcf70', { opacity: 0.5, filter: c.glowLg }) + R(162, 74, 8, 30, '#f4ead0', { stroke: '#5a3a24', 'stroke-width': 0.8 }) + E(166, 68, 3, 6, '#fff2b0', { filter: c.glowSm });
  s += P('M176 250 L176 196 C176 186 196 186 196 196 L196 250Z', '#3a2030', null, null, 'opacity=".6"');
  return s;
}
function fh_irenaOutfit(dd, c, m) {
  var silk = dd.lin([[0, '#ffffff'], [0.55, '#dbe6f2'], [1, '#9aaecc']], 0, 0, 1, 1);
  var s = both(P('M62 158 C46 168 38 194 37 250 L60 250 C60 220 62 190 68 168Z', 'rgba(222,234,250,0.42)', '#c4d6ea', 0.8));
  s += P('M66 202 C70 214 72 232 70 250 L130 250 C128 232 130 214 134 202 C122 211 110 211 100 205 C90 211 78 211 66 202Z', silk, INK, 1.2);
  s += cups(dd, c, silk, INK, '#b4c6de');
  s += P('M70 214 C80 220 92 220 100 216 C108 220 120 220 130 214', 'none', '#9cb0cc', 1, 'opacity=".9"');
  s += both(P('M74 226 C80 232 86 236 92 236 M78 240 C84 244 90 246 96 246', 'none', '#b4c6de', 0.8, 'stroke-dasharray="1.5 2"'));
  s += faithAt(dd, 'pale', 100, 228, 13);
  s += P('M86 146 C92 154 108 154 114 146', 'none', '#e4eef8', 1.2);
  s += fh_lily(124, 182, 0.62, 18);
  return s;
}
function fh_irenaHead(dd, c) {
  return P('M126 62 C132 58 138 60 140 66', 'none', '#dfe8f2', 2.2) + C(127, 62, 1.6, '#ffffff') + C(133, 60, 1.6, '#ffffff') + C(139, 63, 1.6, '#ffffff') + fh_lily(132, 58, 0.5, 52);
}
NPCS.irena = function (d) {
  return npcPortrait(d, { race: 'human', cls: 'none', gender: 'f', look: { hair: 0, skin: 0, eyes: 7 }, seed: 15 }, {
    hairColor: '#2c2436', eyeColor: '#8e9ab0', mouthI: 0, blush: 0.4, props: {},
    outfit: fh_irenaOutfit,
    head: fh_irenaHead,
    bg: fh_irenaBg,
    front: function (dd, c) { var s = ''; for (var i = 0; i < 8; i++) s += C(120 + c.rnd() * 80, 20 + c.rnd() * 160, 0.8 + c.rnd() * 1.4, '#fff2c8', { opacity: f(0.4 + c.rnd() * 0.4) }); return s; }
  });
};
NPC_FIGS.irena = npcFig({ race: 'human', gender: 'f', look: { hair: 0, skin: 0, eyes: 7 }, seed: 15 }, {
  hairColor: '#2c2436', eyeColor: '#8e9ab0', mouthI: 0, blush: 0.4, props: {},
  pose: { arms: [{ e: [8, 44], h: [4, 86] }, { e: [14, 40], h: [-12, 30], front: 1 }], legs: { k: [12, 274], a: [16, 370] } },
  headBack: function (d, c) { return C(100, 100, 66, '#ffe2b8', { opacity: 0.3, filter: c.glowLg }); },
  head: fh_irenaHead,
  figOutfit: function (d, c, m) {
    var silk = d.lin([[0, '#ffffff'], [0.55, '#dbe6f2'], [1, '#9aaecc']], 0, 0, 1, 1);
    var gown = 'M80 134 C90 140 110 140 120 134 C122 150 118 160 118 170 C130 230 140 300 146 376 C128 382 110 384 98 382 C96 320 94 262 92 216 C86 262 76 320 64 378 L54 376 C60 300 70 230 82 170 C82 160 78 150 80 134Z';
    return {
      foot: { style: 'sandal', col: '#cfdcea' },
      back: P('M74 98 C58 160 50 260 46 372 L154 372 C150 260 142 160 126 98Z', 'rgba(222,234,250,0.38)', '#c4d6ea', 0.8),
      torso: fCups(d, silk, '#b4c6de', '#dfe8f2') + cast(gown, silk, INK, 1.1, 0, 2) +
        P('M80 140 C90 146 110 146 120 140', 'none', '#9cb0cc', 1) + faithAt(d, 'pale', 100, 154, 11) +
        P('M88 166 C92 180 94 196 93 210 M112 166 C112 200 118 240 122 270', 'none', '#b4c6de', 0.8, 'stroke-dasharray="1.5 2"') +
        P('M64 372 C80 378 120 380 144 374', 'none', '#b4c6de', 1.4) + fh_lily(89, 114, 0.42, -12),
      arm: function (arm) { return armPart(d, arm, 0.12, 0.98, 'rgba(222,234,250,0.45)', 2.6, 0.5); }
    };
  },
  figFront: function (d, c) { var s = ''; for (var i = 0; i < 10; i++) s += C(30 + c.rnd() * 140, 30 + c.rnd() * 330, 0.8 + c.rnd() * 1.4, '#fff2c8', { opacity: f(0.35 + c.rnd() * 0.4) }); return s; }
});
})();
