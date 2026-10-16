/* Velmoor art: Faith symbols of the Dawn, the Pale Hour and the Deep Root (100x100 markup), plus faithAt() to place one anywhere.
 * Plain script (no modules); load order is listed in js/art/api.js. */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL;
/* from core.js */
var f = A.f, P = A.P, C = A.C, E = A.E, R = A.R, G = A.G, T = A.T;

/* ---------- faith symbols (markup in a 100x100 box, centered on 50,50) ---------- */
function faithSymbol(d, key) {
  var s = '', i, a;
  if (key === 'pale') {
    var silver = d.lin([[0, '#ffffff'], [0.55, '#d6e8f6'], [1, '#93b4d0']], 0, 0, 1, 1);
    s += C(50, 50, 46, d.rad([[0, '#2c5274', 0.55], [1, '#0b1c30', 0.8]]));
    s += C(50, 50, 42, 'none', { stroke: '#122236', 'stroke-width': 7 }) + C(50, 50, 42, 'none', { stroke: silver, 'stroke-width': 3.6 });
    var arm = 'M50 33 L50 11 M50 25 L43 18 M50 25 L57 18 M50 17.5 L46 13 M50 17.5 L54 13';
    var arms = '';
    for (i = 0; i < 6; i++) arms += '<path transform="rotate(' + (i * 60) + ' 50 50)" d="' + arm + '"/>';
    s += G(arms, { fill: 'none', stroke: '#122236', 'stroke-width': 7, 'stroke-linecap': 'round' }) + G(arms, { fill: 'none', stroke: silver, 'stroke-width': 3.4, 'stroke-linecap': 'round' });
    s += C(50, 50, 17.5, '#163049', { stroke: '#122236', 'stroke-width': 2 }) + C(50, 50, 15.5, 'none', { stroke: silver, 'stroke-width': 1.6 });
    var glass = 'M42.5 38 L57.5 38 L51.2 50 L57.5 62 L42.5 62 L48.8 50Z';
    s += P(glass, '#e8f6ff', null, null, 'opacity=".3"') + P(glass, 'none', silver, 2.2);
    s += R(39.5, 34.5, 21, 4, silver, { rx: 1.2, stroke: '#122236', 'stroke-width': 0.8 }) + R(39.5, 61.5, 21, 4, silver, { rx: 1.2, stroke: '#122236', 'stroke-width': 0.8 });
    s += P('M45 40 L48 46', 'none', '#fff', 1.2, 'opacity=".9"');
  } else if (key === 'root') {
    var bark = d.lin([[0, '#b07a44'], [1, '#5a3618']], 0, 0, 1, 1), moss = d.rad([[0, '#a6cc5a'], [0.6, '#5f8a2e'], [1, '#2f4a16']], 0.4, 0.3, 0.8);
    s += C(50, 50, 46, d.rad([[0, '#3a2a14', 0.5], [1, '#140c04', 0.8]]));
    var roots = 'M47 62 C42 76 28 88 16 75 C5 63 5 39 16 26 C24 15 34 10 44 9 C49 9 50 13 46 15' +
      ' M53 62 C58 76 72 88 84 75 C95 63 95 39 84 26 C76 15 66 10 56 9 C51 9 50 13 54 15' +
      '';
    s += P(roots, 'none', '#1e130a', 8.5) + P(roots, 'none', bark, 5) + P('M14 60 C10 50 11 38 18 28 M86 60 C90 50 89 38 82 28', 'none', '#d8a060', 1.3, 'opacity=".8"');
    s += P('M44 65 C47 55 47 47 46 38 L54 38 C53 47 53 55 56 65Z', bark, '#1e130a', 1.8);
    s += P('M50 42 C45 37 40 35 35 31 M50 42 C55 37 60 35 65 31 M50 40 L50 28', 'none', '#1e130a', 4.5) + P('M50 42 C45 37 40 35 35 31 M50 42 C55 37 60 35 65 31 M50 40 L50 28', 'none', '#8a5a2e', 2.2);
    var can = [[50, 27, 11], [38, 32, 8.5], [62, 32, 8.5], [43, 21, 8], [57, 21, 8]];
    for (i = 0; i < can.length; i++) s += C(can[i][0], can[i][1], can[i][2] + 1.8, '#1e130a');
    for (i = 0; i < can.length; i++) s += C(can[i][0], can[i][1], can[i][2], moss);
    s += P('M40 22 C44 17 50 15 55 16', 'none', '#d4f08a', 1.6, 'opacity=".7"');
    s += C(41, 31, 2, '#ffb43a') + C(58, 25, 2, '#ffb43a') + C(51, 19, 1.6, '#ffd070');
  } else {
    var gold = d.lin([[0, '#fff6c0'], [0.5, '#f0bc40'], [1, '#b57414']], 0, 0, 1, 1);
    s += C(50, 50, 46, d.rad([[0, '#fff6d6', 0.95], [1, '#f0c868', 0.85]]));
    s += C(50, 50, 43, 'none', { stroke: '#4a2c06', 'stroke-width': 6 }) + C(50, 50, 43, 'none', { stroke: gold, 'stroke-width': 3 });
    var rays = '';
    for (i = 0; i < 8; i++) {
      a = (i * 45 - 90) * Math.PI / 180;
      var px = -Math.sin(a), py = Math.cos(a);
      rays += 'M' + f(50 + Math.cos(a) * 21 + px * 5) + ' ' + f(50 + Math.sin(a) * 21 + py * 5) + ' L' + f(50 + Math.cos(a) * 38) + ' ' + f(50 + Math.sin(a) * 38) + ' L' + f(50 + Math.cos(a) * 21 - px * 5) + ' ' + f(50 + Math.sin(a) * 21 - py * 5) + 'Z';
    }
    s += P(rays, gold, '#4a2c06', 1.6);
    s += C(50, 50, 19, d.rad([[0, '#fffbe6'], [0.55, '#ffd552'], [1, '#d08a10']], 0.4, 0.35, 0.7), { stroke: '#4a2c06', 'stroke-width': 1.8 });
    s += E(44, 43, 7, 4.5, '#fff', 'opacity=".75" transform="rotate(-30 44 43)"');
  }
  return s;
}
/* place a faith symbol centered at (x,y) with the given pixel size */
function faithAt(d, key, x, y, size) { return T(faithSymbol(d, key), x - size / 2, y - size / 2, f(size / 100 * 1000) / 1000); }

/* shared with the other art files */
A.faithSymbol = faithSymbol; A.faithAt = faithAt;
})();
