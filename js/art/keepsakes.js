/* Velmoor art: Small keepsake props of the Folded House side quest (still-lily, picture frames, a child's drawing,
 * wallpaper scraps), shared by its monsters, Irena's portraits and the folded cellar scene.
 * Plain script (no modules); load order is listed in js/art/api.js. */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL;
/* from core.js */
var f = A.f, P = A.P, C = A.C, R = A.R, G = A.G, M = A.M, T = A.T, poly = A.poly, INK = A.INK;

/* ------------------------------------------------------------------ */
/* The Folded House: Irena of Isenmark, her Echo, the cellar's guards, */
/* and the folded-cellar transition scene                              */
/* ------------------------------------------------------------------ */
/* closed still-lily on a short stem; local coords: bud tip (0,-22), stem end (-2,16) */
function fh_lily(x, y, s, rot, glowF) {
  var pet = '#fbfdff', sh = '#c4d6ea';
  var g = P('M0 0 C1 6 0 11 -2 16', 'none', '#24452e', 2.6) + P('M0 0 C1 6 0 11 -2 16', 'none', '#6aa07a', 1.4) +
    P('M-0.5 9 C-6 8 -10 4 -12 -1 C-7 1 -3 4 -0.5 9Z', '#7ab08a', INK, 0.6);
  var side = 'M0 1 C-5 -3 -7 -11 -4 -19 C-3.6 -21 -5 -23 -7 -23 C-3 -24.5 -1 -21 -1.2 -18 C-1.5 -10 -1 -4 0 1Z';
  g += P(side, pet, INK, 0.7) + M(P(side, sh, INK, 0.7), 0);
  g += P('M0 2 C-3.4 -5 -3 -15 0 -22 C3 -15 3.4 -5 0 2Z', pet, INK, 0.7) + P('M0 -1 C-1 -7 -1 -13 0 -19', 'none', sh, 0.7);
  g += P('M-2 0.5 C-0.5 2.4 1.5 2.4 2.6 0.5', 'none', '#5a9a6a', 1.1);
  return T(glowF ? G(g, { filter: glowF }) : g, x, y, s, rot);
}
/* small picture frame centred on 0,0 (w x h); kind 'two' = mother and child, 'one' = a girl */
function fh_frame(d, w, h, col, kind, cracked) {
  var hw = w / 2, hh = h / 2, iw = w - 8, ih = h - 8;
  var s = R(-hw, -hh, w, h, col, { stroke: INK, 'stroke-width': 1.2, rx: 1.5 });
  s += R(-hw + 1.6, -hh + 1.6, w - 3.2, h - 3.2, 'none', { stroke: '#ffffff', 'stroke-width': 0.6, opacity: 0.55 });
  s += R(-iw / 2, -ih / 2, iw, ih, d.lin([[0, '#eef4fb'], [1, '#8a9ab6']]), { stroke: INK, 'stroke-width': 0.6 });
  var sil = '#3a4462';
  if (kind === 'two') {
    s += C(-iw * 0.14, -ih * 0.12, ih * 0.15, sil, { opacity: 0.75 }) + P('M' + f(-iw * 0.42) + ' ' + f(ih / 2) + ' C' + f(-iw * 0.4) + ' ' + f(ih * 0.08) + ' ' + f(iw * 0.12) + ' ' + f(ih * 0.08) + ' ' + f(iw * 0.14) + ' ' + f(ih / 2) + 'Z', sil, null, null, { opacity: 0.75 });
    s += C(iw * 0.22, ih * 0.12, ih * 0.1, sil, { opacity: 0.6 }) + P('M' + f(iw * 0.06) + ' ' + f(ih / 2) + ' C' + f(iw * 0.08) + ' ' + f(ih * 0.26) + ' ' + f(iw * 0.36) + ' ' + f(ih * 0.26) + ' ' + f(iw * 0.38) + ' ' + f(ih / 2) + 'Z', sil, null, null, { opacity: 0.6 });
  } else {
    s += C(0, -ih * 0.08, ih * 0.16, sil, { opacity: 0.7 }) + P('M' + f(-iw * 0.3) + ' ' + f(ih / 2) + ' C' + f(-iw * 0.28) + ' ' + f(ih * 0.12) + ' ' + f(iw * 0.28) + ' ' + f(ih * 0.12) + ' ' + f(iw * 0.3) + ' ' + f(ih / 2) + 'Z', sil, null, null, { opacity: 0.7 });
  }
  s += P('M' + f(-iw / 2) + ' ' + f(-ih * 0.1) + ' L' + f(-iw * 0.1) + ' ' + f(-ih / 2) + ' L' + f(iw * 0.05) + ' ' + f(-ih / 2) + ' L' + f(-iw / 2) + ' ' + f(ih * 0.08) + 'Z', '#ffffff', null, null, { opacity: 0.5 });
  if (cracked) s += P('M' + f(iw * 0.1) + ' ' + f(-ih / 2) + ' L' + f(iw * 0.02) + ' ' + f(-ih * 0.1) + ' L' + f(iw * 0.2) + ' ' + f(ih * 0.1) + ' L' + f(iw * 0.12) + ' ' + f(ih / 2) + ' M' + f(iw * 0.02) + ' ' + f(-ih * 0.1) + ' L' + f(-iw * 0.3) + ' ' + f(ih * 0.05), 'none', '#ffffff', 0.7, { opacity: 0.9 });
  return s;
}
/* a child's crayon drawing (house, father, mother, child) in a 40x30 box centred on 0,0 */
function fh_drawing() {
  var s = P('M-20 -15 L15 -15 L20 -10 L20 15 L-20 15Z', '#fbf6e8', INK, 0.8) + P('M15 -15 L15 -10 L20 -10Z', '#ddd2b8', INK, 0.5);
  s += P('M-18 11.5 Q-6 9.5 4 11 Q12 12 18 10.5', 'none', '#5aa04a', 1.3);
  s += P('M-17 11 L-17 1 L-8 1 L-8 11 M-18.5 1.5 L-12.5 -6 L-6.5 1.5 M-14 11 L-14 6.5 L-11 6.5 L-11 11', 'none', '#c0503a', 1);
  s += C(-15, -10, 2.6, '#f6c83a', { opacity: 0.9 });
  s += C(-0.5, -3.5, 1.9, 'none', { stroke: '#3a5ac0', 'stroke-width': 0.8 }) + P('M-0.5 -1.6 L-0.5 6 L-2.6 11 M-0.5 6 L1.4 11 M-0.5 -0.6 L-3.6 3.6 M-0.5 -0.6 L2.8 3.4', 'none', '#3a5ac0', 0.8);
  s += C(6, -3, 1.9, 'none', { stroke: '#8a4ab0', 'stroke-width': 0.8 }) + P('M6 -1.1 L3.4 7 L8.6 7Z M5 7 L5 11 M7 7 L7 11 M6 -0.4 L3 3.2 M6 -0.4 L10.2 4.2', 'none', '#8a4ab0', 0.8) + P('M4.6 -4.6 C3 -2 3.4 2 3.4 3', 'none', '#2a2236', 0.9);
  s += C(13, 1.8, 1.5, 'none', { stroke: '#e05a8a', 'stroke-width': 0.8 }) + P('M13 3.3 L11.2 8.4 L14.8 8.4Z M12.4 8.4 L12.4 11 M13.6 8.4 L13.6 11 M13 3.8 L10.6 5', 'none', '#e05a8a', 0.8);
  s += P('M6 -10.4 C4.6 -12.4 2.4 -10.8 3.6 -9 L6 -6.6 L8.4 -9 C9.6 -10.8 7.4 -12.4 6 -10.4Z', '#e8506a');
  return s;
}
/* torn scrap of floral wallpaper, centred on 0,0 */
function fh_scrap(rnd, w, h, col, pat) {
  var pts = [], n = 4, i;
  for (i = 0; i <= n; i++) pts.push(-w / 2 + w * i / n, -h / 2 + (rnd() - 0.5) * h * 0.3);
  for (i = 1; i <= n; i++) pts.push(w / 2 + (rnd() - 0.5) * w * 0.25, -h / 2 + h * i / n);
  for (i = n - 1; i >= 0; i--) pts.push(-w / 2 + w * i / n, h / 2 + (rnd() - 0.5) * h * 0.3);
  for (i = n - 1; i > 0; i--) pts.push(-w / 2 + (rnd() - 0.5) * w * 0.25, -h / 2 + h * i / n);
  var s = P(poly(pts), col, '#5a6a84', 0.8);
  s += P('M' + f(-w * 0.28) + ' ' + f(-h * 0.32) + ' L' + f(-w * 0.28) + ' ' + f(h * 0.32) + ' M' + f(w * 0.28) + ' ' + f(-h * 0.32) + ' L' + f(w * 0.28) + ' ' + f(h * 0.32), 'none', pat, 0.7, { opacity: 0.55 });
  var r = Math.min(w, h) * 0.09;
  [[0, -h * 0.18], [0, h * 0.2]].forEach(function (p) {
    for (var k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2; s += C(p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r, r * 0.7, pat, { opacity: 0.75 }); }
    s += C(p[0], p[1], r * 0.55, '#f4e2a0');
  });
  return s;
}

/* shared with the other art files */
A.fh_lily = fh_lily; A.fh_frame = fh_frame; A.fh_drawing = fh_drawing; A.fh_scrap = fh_scrap;
})();
