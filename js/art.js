/* Velmoor - procedural SVG art module.
 * Plain script (no modules). Exposes window.BT.art.
 * Everything is generated as SVG strings; every call gets a unique id prefix
 * so many SVGs can live on the same page at once.
 */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};

/* ------------------------------------------------------------------ */
/* Core helpers                                                        */
/* ------------------------------------------------------------------ */
var _uid = 0;

/* number formatting: keeps strings short and never emits NaN */
function f(n) { n = +n; if (!isFinite(n)) n = 0; return Math.round(n * 10) / 10; }

/* seeded RNG (mulberry32) */
function rng(seed) {
  var a = (seed | 0) ^ 0x9e3779b9;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* colors */
function hx(c) {
  c = String(c).replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  return [parseInt(c.substr(0, 2), 16) || 0, parseInt(c.substr(2, 2), 16) || 0, parseInt(c.substr(4, 2), 16) || 0];
}
function toHex(r, g, b) {
  function h(v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }
  return '#' + h(r) + h(g) + h(b);
}
function mix(a, b, t) { var A = hx(a), B = hx(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
/* t>0 lightens toward white, t<0 darkens toward black */
function shade(c, t) { return t >= 0 ? mix(c, '#ffffff', t) : mix(c, '#000000', -t); }
/* darken with a hue shift toward purple/blue: nicer anime shadows */
function shadow(c, t) { return mix(mix(c, '#2a1840', 0.35 * (t || 1)), '#000000', 0.25 * (t || 1)); }

/* defs collector: one per generated SVG */
function Defs() { this.p = 'bt' + (++_uid).toString(36) + 'x'; this.n = 0; this.list = []; }
Defs.prototype.id = function () { return this.p + (this.n++).toString(36); };
Defs.prototype.add = function (s) { this.list.push(s); };
function stopsStr(stops) {
  var s = '';
  for (var i = 0; i < stops.length; i++) {
    var st = stops[i];
    s += '<stop offset="' + f(st[0]) + '" stop-color="' + st[1] + '"' + (st[2] != null ? ' stop-opacity="' + f(st[2] * 100) / 100 + '"' : '') + '/>';
  }
  return s;
}
/* linear gradient. default vertical in bounding-box units. user=true -> userSpaceOnUse coords */
Defs.prototype.lin = function (stops, x1, y1, x2, y2, user) {
  var id = this.id();
  if (x1 == null) { x1 = 0; y1 = 0; x2 = 0; y2 = 1; }
  this.list.push('<linearGradient id="' + id + '" x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '"' + (user ? ' gradientUnits="userSpaceOnUse"' : '') + '>' + stopsStr(stops) + '</linearGradient>');
  return 'url(#' + id + ')';
};
/* radial gradient. default centered in bounding box. user=true -> userSpaceOnUse */
Defs.prototype.rad = function (stops, cx, cy, r, fx, fy, user) {
  var id = this.id();
  if (cx == null) { cx = 0.5; cy = 0.5; r = 0.5; }
  this.list.push('<radialGradient id="' + id + '" cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '"' + (fx != null ? ' fx="' + f(fx) + '" fy="' + f(fy) + '"' : '') + (user ? ' gradientUnits="userSpaceOnUse"' : '') + '>' + stopsStr(stops) + '</radialGradient>');
  return 'url(#' + id + ')';
};
/* soft glow: blurred copy merged under the source */
Defs.prototype.glow = function (std, strength) {
  var id = this.id(); strength = strength || 1;
  var merge = '';
  for (var i = 0; i < strength; i++) merge += '<feMergeNode in="b"/>';
  this.list.push('<filter id="' + id + '" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="' + f(std) + '" result="b"/><feMerge>' + merge + '<feMergeNode in="SourceGraphic"/></feMerge></filter>');
  return 'url(#' + id + ')';
};
Defs.prototype.blur = function (std) {
  var id = this.id();
  this.list.push('<filter id="' + id + '" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="' + f(std) + '"/></filter>');
  return 'url(#' + id + ')';
};
Defs.prototype.drop = function (dx, dy, std, color, op) {
  var id = this.id();
  this.list.push('<filter id="' + id + '" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="' + f(dx) + '" dy="' + f(dy) + '" stdDeviation="' + f(std) + '" flood-color="' + (color || '#000') + '" flood-opacity="' + (op == null ? 0.5 : op) + '"/></filter>');
  return 'url(#' + id + ')';
};
/* clip path from inner svg markup; returns url(#id) */
Defs.prototype.clip = function (inner) {
  var id = this.id();
  this.list.push('<clipPath id="' + id + '">' + inner + '</clipPath>');
  return 'url(#' + id + ')';
};
/* hue rotate filter */
Defs.prototype.hue = function (deg) {
  var id = this.id();
  this.list.push('<filter id="' + id + '" color-interpolation-filters="sRGB"><feColorMatrix type="hueRotate" values="' + f(deg) + '"/></filter>');
  return 'url(#' + id + ')';
};
/* fractal noise texture filter (used sparingly: stone, fog) */
Defs.prototype.noise = function (freq, oct, op, color) {
  var id = this.id();
  this.list.push('<filter id="' + id + '" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="' + freq + '" numOctaves="' + (oct || 2) + '" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 ' + hx(color || '#000')[0] / 255 + ' 0 0 0 0 ' + hx(color || '#000')[1] / 255 + ' 0 0 0 0 ' + hx(color || '#000')[2] / 255 + ' 0 0 0 ' + f((op || 0.3) * 30) / 10 + ' -' + f((op || 0.3) * 10) / 10 + '"/><feComposite in2="SourceGraphic" operator="in"/></filter>');
  return 'url(#' + id + ')';
};
Defs.prototype.out = function () { return this.list.length ? '<defs>' + this.list.join('') + '</defs>' : ''; };

/* element helpers */
function attrs(o) {
  if (!o) return '';
  if (typeof o === 'string') return ' ' + o;
  var s = '';
  for (var k in o) if (o[k] != null && o[k] !== false) s += ' ' + k + '="' + o[k] + '"';
  return s;
}
/* path(d, fill, stroke, strokeWidth, extraAttrs) */
function P(d, fill, stroke, sw, ex) {
  return '<path d="' + d + '" fill="' + (fill || 'none') + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="' + (sw == null ? 1 : sw) + '" stroke-linejoin="round" stroke-linecap="round"' : '') + attrs(ex) + '/>';
}
function C(cx, cy, r, fill, ex) { return '<circle cx="' + f(cx) + '" cy="' + f(cy) + '" r="' + f(r) + '" fill="' + (fill || 'none') + '"' + attrs(ex) + '/>'; }
function E(cx, cy, rx, ry, fill, ex) { return '<ellipse cx="' + f(cx) + '" cy="' + f(cy) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + (fill || 'none') + '"' + attrs(ex) + '/>'; }
function R(x, y, w, h, fill, ex) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="' + (fill || 'none') + '"' + attrs(ex) + '/>'; }
function L(x1, y1, x2, y2, stroke, sw, ex) { return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + stroke + '" stroke-width="' + (sw || 1) + '" stroke-linecap="round"' + attrs(ex) + '/>'; }
function G(content, ex) { return '<g' + attrs(ex) + '>' + content + '</g>'; }
/* mirror horizontally around x=cx */
function M(content, cx) { return '<g transform="matrix(-1 0 0 1 ' + f(2 * (cx == null ? 100 : cx)) + ' 0)">' + content + '</g>'; }
/* translate/scale/rotate helpers */
function T(content, x, y, s, rot) {
  return '<g transform="translate(' + f(x) + ' ' + f(y) + ')' + (rot ? ' rotate(' + f(rot) + ')' : '') + (s != null && s !== 1 ? ' scale(' + s + ')' : '') + '">' + content + '</g>';
}
/* regular star polygon points */
function starPts(cx, cy, r1, r2, n, rot) {
  var pts = [];
  rot = rot || -Math.PI / 2;
  for (var i = 0; i < n * 2; i++) {
    var r = i % 2 ? r2 : r1, a = rot + i * Math.PI / n;
    pts.push(f(cx + Math.cos(a) * r) + ',' + f(cy + Math.sin(a) * r));
  }
  return 'M' + pts.join(' L') + 'Z';
}
/* polygon from flat array [x,y,x,y...] */
function poly(arr) { var s = 'M' + f(arr[0]) + ' ' + f(arr[1]); for (var i = 2; i < arr.length; i += 2) s += ' L' + f(arr[i]) + ' ' + f(arr[i + 1]); return s + 'Z'; }
/* sparkle (4 point star) */
function sparkle(x, y, r, fill, ex) { return P('M' + f(x) + ' ' + f(y - r) + ' Q' + f(x) + ' ' + f(y) + ' ' + f(x + r) + ' ' + f(y) + ' Q' + f(x) + ' ' + f(y) + ' ' + f(x) + ' ' + f(y + r) + ' Q' + f(x) + ' ' + f(y) + ' ' + f(x - r) + ' ' + f(y) + ' Q' + f(x) + ' ' + f(y) + ' ' + f(x) + ' ' + f(y - r) + 'Z', fill, null, null, ex); }

function svgWrap(w, h, d, body, par) {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="100%"' + (par ? ' preserveAspectRatio="' + par + '"' : '') + '>' + d.out() + body + '</svg>';
}

var INK = '#1b1020';       /* standard outline color */
var MONSTERS = {};         /* key -> function(d, rnd) returning markup in 300x300 */
var SCENES = {};           /* key -> function(d, rnd) returning markup in 800x450 */
var NPCS = {};             /* key -> function(d, rnd) returning markup in 200x250 */

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

/* ------------------------------------------------------------------ */
/* Scenes (800x450)                                                    */
/* ------------------------------------------------------------------ */

/* starfield */
function sc_stars(rnd, n, ymax, col) {
  var s = '';
  for (var i = 0; i < n; i++) {
    var x = rnd() * 800, y = Math.pow(rnd(), 1.3) * ymax, big = rnd() < 0.06;
    if (big) s += sparkle(x, y, 3 + rnd() * 3, col || '#fff', { opacity: f(0.6 + rnd() * 0.4) });
    else s += C(x, y, 0.4 + rnd() * 0.9, col || '#fff', { opacity: f(0.25 + rnd() * 0.7) });
  }
  return s;
}

/* falling snow; near flakes blurred */
function sc_snow(d, rnd, n, col, op, ymin) {
  var far = '', near = '';
  col = col || '#fff'; op = op == null ? 1 : op; ymin = ymin || 0;
  for (var i = 0; i < n; i++) {
    var x = rnd() * 800, y = ymin + rnd() * (450 - ymin), z = rnd();
    if (z < 0.85) far += C(x, y, 0.6 + z * 1.6, col, { opacity: f((0.35 + rnd() * 0.5) * op) });
    else near += C(x, y, 3 + rnd() * 3.5, col, { opacity: f((0.4 + rnd() * 0.3) * op) });
  }
  return G(far) + G(near, { filter: d.blur(1.6) });
}

/* soft fog band */
function sc_fog(d, y, h, col, op) {
  return R(-20, y - h / 2, 840, h, d.lin([[0, col, 0], [0.5, col, op], [1, col, 0]]));
}

/* jagged ridge (mountains / hills) */
function sc_ridge(rnd, base, amp, step, fill, smooth, ex) {
  var s = 'M-20 460 L-20 ' + f(base - rnd() * amp), x = -20, py = base;
  while (x < 820) {
    x += step * (0.6 + rnd() * 0.8);
    var y = base - rnd() * amp;
    if (smooth) s += ' Q' + f(x - step / 2) + ' ' + f((py + y) / 2 - amp * 0.2) + ' ' + f(x) + ' ' + f(y);
    else s += ' L' + f(x) + ' ' + f(y);
    py = y;
  }
  return P(s + ' L820 460Z', fill, null, null, ex);
}

/* gothic city silhouette between x0..x1; returns markup */
function sc_city(d, rnd, o) {
  var body = '', snow = '', wins = '', x = o.x0 == null ? -30 : o.x0, x1 = o.x1 == null ? 830 : o.x1;
  var base = o.base, sw = o.snowW || 2;
  while (x < x1) {
    var w = (o.wMin || 26) + rnd() * (o.wVar || 44), h = o.hMin + rnd() * (o.hMax - o.hMin), top = base - h, t = rnd();
    if (t < 0.42) { /* gabled house */
      var rh = w * (0.45 + rnd() * 0.3);
      body += poly([x, base, x, top, x + w / 2, top - rh, x + w, top, x + w, base]);
      if (o.snow) snow += P('M' + f(x - 1.5) + ' ' + f(top + 1.5) + ' L' + f(x + w / 2) + ' ' + f(top - rh) + ' L' + f(x + w + 1.5) + ' ' + f(top + 1.5), 'none', o.snow, sw);
      if (rnd() < 0.5) body += poly([x + w * 0.7, top - rh * 0.3, x + w * 0.7, top - rh * 0.8, x + w * 0.8, top - rh * 0.8, x + w * 0.8, top - rh * 0.1]);
    } else if (t < 0.64) { /* tower with spire */
      var tw = w * 0.55, tx = x + (w - tw) / 2, sh = tw * (2 + rnd() * 1.5), lowTop = top + h * 0.4;
      body += poly([x, base, x, lowTop, tx, lowTop, tx, top, tx - 2, top, tx + tw / 2, top - sh, tx + tw + 2, top, tx + tw, top, tx + tw, lowTop, x + w, lowTop, x + w, base]);
      if (o.snow) {
        snow += P('M' + f(tx - 2) + ' ' + f(top) + ' L' + f(tx + tw / 2) + ' ' + f(top - sh) + ' L' + f(tx + tw + 2) + ' ' + f(top), 'none', o.snow, sw * 0.8);
        snow += L(x, lowTop, x + w, lowTop, o.snow, sw);
      }
    } else if (t < 0.82) { /* crenellated keep */
      var s = [x, base, x, top], mw = w / 7;
      for (var i = 0; i < 7; i++) { var mx = x + i * mw; if (i % 2 === 0) s.push(mx, top - mw, mx + mw, top - mw, mx + mw, top); else s.push(mx + mw, top); }
      s.push(x + w, base);
      body += poly(s);
      if (o.snow) snow += L(x, top - mw, x + w, top - mw, o.snow, sw * 0.7, { 'stroke-dasharray': f(mw) + ' ' + f(mw) });
    } else { /* twin-spired chapel */
      var hw = w / 2, sp = h * 0.6;
      body += poly([x, base, x, top, x + w * 0.12, top - sp, x + w * 0.24, top, x + w * 0.3, top, x + hw, top - h * 0.25, x + w * 0.7, top, x + w * 0.76, top, x + w * 0.88, top - sp, x + w, top, x + w, base]);
      if (o.snow) {
        snow += P('M' + f(x) + ' ' + f(top) + ' L' + f(x + w * 0.12) + ' ' + f(top - sp) + ' L' + f(x + w * 0.24) + ' ' + f(top), 'none', o.snow, sw * 0.7);
        snow += P('M' + f(x + w * 0.76) + ' ' + f(top) + ' L' + f(x + w * 0.88) + ' ' + f(top - sp) + ' L' + f(x + w) + ' ' + f(top), 'none', o.snow, sw * 0.7);
      }
      if (o.win) wins += C(x + hw, top + h * 0.15, Math.min(6, w * 0.1), o.win, { opacity: 0.9 });
    }
    if (o.win) {
      var ws = o.winS || 1;
      for (var wy = top + 6 * ws; wy < base - 8 * ws; wy += 11 * ws) {
        for (var wx = x + 4 * ws; wx < x + w - 6 * ws; wx += 8 * ws) {
          if (rnd() < (o.winRate || 0.2)) wins += R(wx, wy, 3 * ws, 4.5 * ws, rnd() < 0.3 ? o.win2 || o.win : o.win, { opacity: f(0.6 + rnd() * 0.4) });
        }
      }
    }
    x += w - rnd() * 6;
  }
  var out = P(body, o.fill);
  if (snow) out += G(snow, { opacity: o.snowOp || 0.85 });
  if (wins) out += G(wins, { filter: d.glow(o.glow || 1.8) });
  return out;
}

/* perspective projection */
function sc_pj(vx, vy, k, camH) { return function (X, Y, Z) { return [vx + X * k / Z, vy + (camH - Y) * k / Z]; }; }
function sc_q(pts, fill, ex) { var a = []; for (var i = 0; i < pts.length; i++) a.push(pts[i][0], pts[i][1]); return P(poly(a), fill, null, null, ex); }
function sc_ln(a, b, col, w, ex) { return L(a[0], a[1], b[0], b[1], col, w, ex); }

/* vignette */
function sc_vig(d, op, col) {
  return R(0, 0, 800, 450, d.rad([[0, col || '#000', 0], [0.6, col || '#000', 0], [1, col || '#000', op == null ? 0.7 : op]], 0.5, 0.5, 0.75));
}

/* aurora curtain band */
function sc_aurora(d, rnd, y0, amp, h, c1, c2, op) {
  var pts = [], x, i, ph = rnd() * 6;
  for (x = -40; x <= 840; x += 40) pts.push([x, y0 + Math.sin(x / 130 + ph) * amp + (rnd() - 0.5) * amp * 0.4]);
  var top = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]), bot = '';
  for (i = 1; i < pts.length; i++) top += ' L' + f(pts[i][0]) + ' ' + f(pts[i][1]);
  for (i = pts.length - 1; i >= 0; i--) bot += ' L' + f(pts[i][0]) + ' ' + f(pts[i][1] + h * (0.75 + 0.25 * Math.sin(i * 1.7)));
  var grad = d.lin([[0, c2, 0], [0.3, c2, 0.55], [0.7, c1, 0.95], [1, c1, 0]]);
  var streaks = '';
  for (i = 0; i < 46; i++) {
    var sx = rnd() * 800, pi = Math.min(pts.length - 1, Math.max(0, Math.round((sx + 40) / 40))), sy = pts[pi][1];
    streaks += L(sx, sy + h * 0.1, sx + 3, sy + h * (0.6 + rnd() * 0.4), c1, 1 + rnd() * 3, { opacity: f(0.15 + rnd() * 0.35) });
  }
  return G(P(top + bot + 'Z', grad) + streaks, { filter: d.blur(5), opacity: op || 0.7 });
}

/* moon with halo */
function sc_moon(d, x, y, r, col, halo) {
  return C(x, y, r * 4, d.rad([[0, halo || col, 0.35], [1, halo || col, 0]])) +
    C(x, y, r, d.rad([[0, '#ffffff'], [0.7, col], [1, shade(col, -0.15)]], 0.4, 0.4, 0.7)) +
    C(x + r * 0.3, y - r * 0.2, r * 0.18, shade(col, -0.12), { opacity: 0.5 }) + C(x - r * 0.35, y + r * 0.3, r * 0.12, shade(col, -0.12), { opacity: 0.4 });
}

/* sword pointing down, tip at (0,0) */
function sc_sword(d, len, w, blade, hilt) {
  var bg = d.lin([[0, shade(blade, 0.5)], [0.5, blade], [0.52, shade(blade, -0.35)], [1, shade(blade, -0.15)]], 0, 0, 1, 0);
  var gl = len * 0.22;
  return P('M0 0 L' + f(-w / 2) + ' ' + f(-w) + ' L' + f(-w / 2) + ' ' + f(-len) + ' L' + f(w / 2) + ' ' + f(-len) + ' L' + f(w / 2) + ' ' + f(-w) + 'Z', bg, INK, 1.5) +
    L(0, -w * 1.2, 0, -len + 2, shade(blade, -0.3), 1) +
    R(-w * 2.2, -len - 6, w * 4.4, 7, hilt, { stroke: INK, 'stroke-width': 1.5, rx: 2 }) +
    R(-w * 0.35, -len - 6 - gl, w * 0.7, gl, '#4a2e22', { stroke: INK, 'stroke-width': 1.5 }) +
    C(0, -len - 8 - gl, w * 0.6, hilt, { stroke: INK, 'stroke-width': 1.5 });
}

/* tiny 5 petal flower */
function sc_flower(x, y, r, col, center) {
  var s = '';
  for (var i = 0; i < 5; i++) {
    var a = i * Math.PI * 2 / 5, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.7;
    s += E(px, py, r * 0.75, r * 0.5, col, { transform: 'rotate(' + f(a * 57.3) + ' ' + f(px) + ' ' + f(py) + ')' });
  }
  return s + C(x, y, r * 0.45, center || '#ffd23a');
}

/* the dark tower of Malthor (base center bx,by; height h) */
function sc_darkTower(d, bx, by, h, fill, glowCol, wscale) {
  var w = (wscale || 1) * h * 0.11, top = by - h;
  var s = poly([bx - w, by, bx - w * 0.7, top + h * 0.3, bx - w * 0.85, top + h * 0.28, bx - w * 0.6, top + h * 0.12, bx - w * 0.9, top + h * 0.1, bx - w * 0.35, top, bx - w * 0.15, top - h * 0.1, bx, top - h * 0.18, bx + w * 0.15, top - h * 0.1, bx + w * 0.35, top, bx + w * 0.9, top + h * 0.1, bx + w * 0.6, top + h * 0.12, bx + w * 0.85, top + h * 0.28, bx + w * 0.7, top + h * 0.3, bx + w, by]);
  var gl = d.glow(3, 2);
  return C(bx, top + h * 0.05, h * 0.25, d.rad([[0, glowCol, 0.35], [1, glowCol, 0]])) +
    P(s, fill) +
    G(R(bx - w * 0.12, top + h * 0.04, w * 0.24, h * 0.06, glowCol) + R(bx - w * 0.08, top + h * 0.4, w * 0.16, h * 0.03, glowCol, { opacity: 0.7 }) + R(bx - w * 0.08, top + h * 0.6, w * 0.16, h * 0.03, glowCol, { opacity: 0.5 }), { filter: gl });
}

/* ================= TITLE ================= */
SCENES.title = function (d, rnd) {
  var s = R(0, 0, 800, 450, d.lin([[0, '#03050f'], [0.4, '#0b1836'], [0.72, '#1d3557'], [1, '#456586']]));
  s += sc_stars(rnd, 170, 320);
  s += sc_aurora(d, rnd, 40, 25, 110, '#5dffc8', '#8a5cff', 0.55);
  s += sc_aurora(d, rnd, 95, 18, 70, '#3fd7ff', '#c86bff', 0.4);
  /* calm the upper-middle for title text */
  s += E(400, 120, 260, 90, d.rad([[0, '#06102a', 0.55], [1, '#06102a', 0]]));
  s += sc_moon(d, 680, 70, 22, '#e8f2ff', '#9fd0ff');
  /* far mountains */
  s += sc_ridge(rnd, 300, 90, 55, d.lin([[0, '#9fb7d8'], [0.25, '#4a6790'], [1, '#1e3150']]), false, { opacity: 0.85 });
  s += sc_fog(d, 300, 60, '#8fb4dc', 0.35);
  /* the dark tower */
  s += sc_darkTower(d, 585, 335, 245, '#0a0f1e', '#7fd8ff');
  s += sc_ridge(rnd, 330, 40, 40, '#1a2a46', true);
  s += sc_city(d, rnd, { base: 345, hMin: 25, hMax: 70, fill: '#18263f', snow: '#a8c0e0', snowOp: 0.5, snowW: 1.5, win: '#ffcf7a', winRate: 0.08, wMin: 18, wVar: 30, winS: 0.7 });
  s += sc_fog(d, 345, 40, '#6f90b8', 0.4);
  s += sc_city(d, rnd, { base: 412, hMin: 55, hMax: 125, fill: '#0e1628', snow: '#c6d8f0', snowOp: 0.7, snowW: 1.6, win: '#ffc566', win2: '#ff9a4a', winRate: 0.18 });
  s += sc_fog(d, 405, 36, '#4e6c96', 0.3);
  /* near framing buildings at the edges */
  s += sc_city(d, rnd, { x0: -40, x1: 190, base: 440, hMin: 110, hMax: 210, fill: '#060912', snow: '#dbe6f5', snowW: 1.8, snowOp: 0.6, win: '#ffbb55', winRate: 0.25, winS: 1.5, wMin: 40, wVar: 50 });
  s += sc_city(d, rnd, { x0: 630, x1: 840, base: 440, hMin: 110, hMax: 210, fill: '#060912', snow: '#dbe6f5', snowW: 1.8, snowOp: 0.6, win: '#ffbb55', winRate: 0.25, winS: 1.5, wMin: 40, wVar: 50 });
  /* snowy ground */
  s += P('M-10 460 L-10 418 Q120 400 260 414 Q400 428 540 410 Q680 396 810 416 L810 460Z', d.lin([[0, '#e4eefb'], [1, '#8ea6c8']]));
  s += P('M-10 460 L-10 438 Q200 426 420 440 Q620 452 810 434 L810 460Z', '#b8cbe6', null, null, { opacity: 0.7 });
  s += sc_snow(d, rnd, 160);
  s += sc_vig(d, 0.65);
  return s;
};

/* ================= VICTORY ================= */
SCENES.victory = function (d, rnd) {
  var s = R(0, 0, 800, 450, d.lin([[0, '#3a4b8f'], [0.3, '#b77fb0'], [0.55, '#ffa98a'], [0.75, '#ffd9a0'], [1, '#fff3d0']]));
  var i;
  /* sun & rays */
  var rays = '';
  for (i = 0; i < 18; i++) {
    var a = -Math.PI + (i + 0.5) * Math.PI / 18 + (rnd() - 0.5) * 0.08, w = 0.03 + rnd() * 0.04;
    rays += P('M400 300 L' + f(400 + Math.cos(a - w) * 700) + ' ' + f(300 + Math.sin(a - w) * 700) + ' L' + f(400 + Math.cos(a + w) * 700) + ' ' + f(300 + Math.sin(a + w) * 700) + 'Z', '#fff6d8', null, null, { opacity: f(0.12 + rnd() * 0.15) });
  }
  s += G(rays, { filter: d.blur(4) });
  s += C(400, 300, 220, d.rad([[0, '#fff8e0', 0.95], [0.25, '#ffe2a0', 0.6], [1, '#ffb070', 0]]));
  s += C(400, 300, 42, '#fffbe8', { filter: d.glow(6, 2) });
  /* pink clouds */
  var cl = '';
  for (i = 0; i < 9; i++) {
    var cx = rnd() * 800, cy = 50 + rnd() * 140, cw = 60 + rnd() * 90;
    cl += E(cx, cy, cw, cw * 0.18, '#ffd2c8', { opacity: 0.55 }) + E(cx - cw * 0.3, cy - 6, cw * 0.45, cw * 0.18, '#ffe6da', { opacity: 0.6 }) + E(cx + cw * 0.1, cy + 4, cw * 0.8, cw * 0.1, '#c98aa8', { opacity: 0.35 });
  }
  s += G(cl, { filter: d.blur(2.5) });
  /* birds */
  for (i = 0; i < 7; i++) { var bx = 160 + rnd() * 480, by = 90 + rnd() * 110, bs = 4 + rnd() * 5; s += P('M' + f(bx - bs) + ' ' + f(by - bs * 0.4) + ' Q' + f(bx - bs * 0.4) + ' ' + f(by - bs * 0.6) + ' ' + f(bx) + ' ' + f(by) + ' Q' + f(bx + bs * 0.4) + ' ' + f(by - bs * 0.6) + ' ' + f(bx + bs) + ' ' + f(by - bs * 0.4), 'none', '#5a3a5a', 1.4); }
  /* far mountains, snow melting */
  s += sc_ridge(rnd, 300, 80, 60, d.lin([[0, '#f5e2ea'], [0.3, '#b896b8'], [1, '#8a7aa8']]), false, { opacity: 0.8 });
  s += sc_fog(d, 305, 60, '#ffe4c8', 0.5);
  /* the tower, now quiet and pale, far away */
  s += G(sc_darkTower(d, 620, 330, 170, '#7a6488', '#ffe6b0'), { opacity: 0.6 });
  s += sc_city(d, rnd, { base: 350, hMin: 30, hMax: 80, fill: '#9a7894', win: '#fff0b0', winRate: 0.12, wMin: 20, wVar: 30, winS: 0.7, glow: 1.2 });
  s += sc_fog(d, 350, 40, '#ffd6b0', 0.45);
  s += sc_city(d, rnd, { base: 380, hMin: 40, hMax: 110, fill: '#6d4f72', snow: '#ffffff', snowOp: 0.35, win: '#ffe08a', winRate: 0.2, glow: 1.5 });
  s += sc_fog(d, 380, 30, '#ffc8a0', 0.35);
  /* green hills */
  s += sc_ridge(rnd, 395, 30, 120, d.lin([[0, '#a8d07a'], [1, '#5f9a52']]), true);
  s += P('M-10 460 L-10 410 Q150 388 330 412 Q520 436 810 398 L810 460Z', d.lin([[0, '#7cbf5e'], [1, '#2f6e3c']]));
  /* lingering snow patches */
  s += E(120, 425, 50, 6, '#ffffff', { opacity: 0.8 }) + E(660, 418, 40, 5, '#ffffff', { opacity: 0.7 }) + E(470, 440, 30, 4, '#f4f8ff', { opacity: 0.7 });
  /* grass & flowers */
  var gr = '', fl = '', cols = ['#ff8fb8', '#ffe066', '#ffffff', '#9fc8ff', '#ff6f8a', '#d7a0ff'];
  for (i = 0; i < 140; i++) { var gx = rnd() * 800, gy = 405 + rnd() * 45; gr += P('M' + f(gx) + ' ' + f(gy) + ' q' + f(-2 + rnd() * 4) + ' -6 ' + f(-3 + rnd() * 6) + ' ' + f(-8 - rnd() * 6), 'none', rnd() < 0.5 ? '#3f8a44' : '#8ccf6a', 1.2); }
  for (i = 0; i < 90; i++) { var fx = rnd() * 800, fy = 410 + Math.pow(rnd(), 0.7) * 40, fr = 1.5 + (fy - 405) / 12 + rnd(); fl += sc_flower(fx, fy, fr, cols[Math.floor(rnd() * cols.length)]); }
  s += gr + fl;
  /* floating petals & sparkles */
  var pt = '';
  for (i = 0; i < 40; i++) { var px = rnd() * 800, py = 80 + rnd() * 330; pt += E(px, py, 2.5, 1.3, rnd() < 0.5 ? '#ffc0d8' : '#fff0f6', { transform: 'rotate(' + f(rnd() * 180) + ' ' + f(px) + ' ' + f(py) + ')', opacity: 0.85 }); }
  for (i = 0; i < 14; i++) pt += sparkle(rnd() * 800, 150 + rnd() * 250, 3 + rnd() * 3, '#fffbe0', { opacity: 0.8 });
  s += pt;
  s += sc_vig(d, 0.35, '#5a2a3a');
  return s;
};

/* ================= GAME OVER ================= */
SCENES.gameover = function (d, rnd) {
  var s = R(0, 0, 800, 450, d.lin([[0, '#050407'], [0.5, '#1c1118'], [0.8, '#3a2830'], [1, '#4a3a44']]));
  s += C(400, 300, 300, d.rad([[0, '#6a2a2a', 0.35], [1, '#6a2a2a', 0]]));
  /* dead trees */
  function tree(x, y, h, w) {
    var t = 'M' + f(x - w) + ' ' + f(y) + ' Q' + f(x - w * 0.3) + ' ' + f(y - h * 0.5) + ' ' + f(x - 1) + ' ' + f(y - h) + ' L' + f(x + 1) + ' ' + f(y - h) + ' Q' + f(x + w * 0.3) + ' ' + f(y - h * 0.5) + ' ' + f(x + w) + ' ' + f(y) + 'Z';
    var br = '';
    for (var i = 0; i < 6; i++) { var by = y - h * (0.35 + i * 0.1), sd = i % 2 ? 1 : -1, bl = h * (0.35 - i * 0.04); br += P('M' + f(x) + ' ' + f(by) + ' Q' + f(x + sd * bl * 0.5) + ' ' + f(by - bl * 0.2) + ' ' + f(x + sd * bl) + ' ' + f(by - bl * 0.5), 'none', '#0d090c', Math.max(1, w * 0.25)); }
    return P(t, '#0d090c') + br;
  }
  s += sc_ridge(rnd, 330, 40, 70, '#2a2026', true, { opacity: 0.7 });
  s += sc_fog(d, 330, 70, '#6a5560', 0.4);
  s += G(tree(120, 360, 170, 10) + tree(700, 350, 200, 12) + tree(40, 380, 120, 8) + tree(770, 380, 140, 8), { opacity: 0.9 });
  /* snow ground */
  s += P('M-10 460 L-10 360 Q200 340 400 352 Q600 364 810 342 L810 460Z', d.lin([[0, '#8a8494'], [0.5, '#4a4552'], [1, '#1e1a22']]));
  /* weapons */
  var w = '';
  /* half buried shield */
  w += G(E(0, 0, 44, 38, d.lin([[0, '#6a2a2a'], [1, '#2a0e10']]), { stroke: INK, 'stroke-width': 3 }) + E(0, 0, 36, 30, 'none', { stroke: '#b0903a', 'stroke-width': 4 }) + P('M0 -22 L5 0 L0 22 L-5 0Z', '#b0903a') + P('M-52 12 Q-30 2 -6 8 Q20 13 52 4 L52 46 L-52 46Z', '#6e6878'), { transform: 'translate(250 392) rotate(-14)' });
  /* broken staff */
  w += G(R(-3, -110, 6, 110, '#4a3020', { stroke: INK, 'stroke-width': 1.5 }) + P('M-3 -110 L0 -118 L3 -110Z', '#4a3020', INK, 1) + C(0, -100, 7, '#3a4f6a', { stroke: INK, 'stroke-width': 1.5 }), { transform: 'translate(560 405) rotate(68)' });
  /* the main sword, stuck in snow, scarf on hilt */
  w += G(sc_sword(d, 150, 16, '#b8c4d4', '#9a7a3a') +
    P('M-6 -180 Q-30 -166 -38 -126 Q-34 -116 -28 -122 Q-24 -156 -2 -172Z', '#8a1f2a', INK, 1.5) +
    P('M4 -180 Q20 -146 14 -106 Q22 -104 24 -112 Q30 -146 10 -180Z', '#6a1420', INK, 1.5), { transform: 'translate(400 380) rotate(6)' });
  /* second sword, tilted */
  w += G(sc_sword(d, 110, 12, '#9aa6b8', '#6a6a7a'), { transform: 'translate(505 400) rotate(-16)' });
  /* helmet */
  w += G(P('M-26 0 Q-28 -34 0 -38 Q28 -34 26 0Z', d.lin([[0, '#9aa4b4'], [1, '#3a4050']]), INK, 2.5) + R(-18, -16, 36, 5, '#141018') + R(-2, -16, 4, 16, '#141018'), { transform: 'translate(320 412) rotate(-18)' });
  /* bow */
  w += P('M600 418 Q640 360 700 400', 'none', '#5a3a22', 4) + L(600, 418, 700, 400, '#ccc', 0.8);
  s += G(w, { filter: d.drop(0, 3, 3, '#000', 0.6) });
  /* snow drifting over */
  s += G(E(400, 384, 30, 7, '#8a8494') + E(470, 398, 24, 6, '#7a7484') + E(330, 416, 34, 7, '#6a6474') + E(560, 410, 30, 5, '#6a6474') + E(250, 420, 60, 9, '#6a6474'), { filter: d.blur(2.5) });
  /* crow on the sword pommel */
  s += G(P('M0 0 Q-8 -6 -6 -14 Q-2 -20 4 -18 L12 -20 L6 -15 Q8 -6 0 0Z M-6 -8 L-18 -2 L-8 -5Z', '#050405') + C(2, -15, 0.9, '#c03030'), { transform: 'translate(392 196) scale(1.6)' });
  s += sc_snow(d, rnd, 220, '#d8d0dc', 0.7);
  s += sc_vig(d, 0.9);
  return s;
};

/* ================= TOWN STREET ================= */
SCENES.town = function (d, rnd) {
  var pj = sc_pj(400, 235, 150, 1.6);
  var s = R(0, 0, 800, 450, d.lin([[0, '#081024'], [0.5, '#1c2f52'], [1, '#3b5a82']]));
  s += sc_stars(rnd, 90, 200);
  s += sc_moon(d, 470, 60, 16, '#eef4ff', '#9cc4ff');
  s += sc_darkTower(d, 520, 210, 150, '#141c32', '#86dcff', 0.8);
  /* far buildings & cathedral at street end */
  var cb = pj(0, 0, 15)[1];
  s += sc_city(d, rnd, { x0: 280, x1: 520, base: cb, hMin: 20, hMax: 60, fill: '#2a3a58', snow: '#b8cbe4', snowOp: 0.6, snowW: 1.2, win: '#ffd07a', winRate: 0.2, wMin: 14, wVar: 20, winS: 0.6 });
  s += P(poly([360, cb, 360, cb - 60, 372, cb - 60, 380, cb - 120, 388, cb - 60, 412, cb - 60, 420, cb - 120, 428, cb - 60, 440, cb - 60, 440, cb]), '#243450') + C(400, cb - 36, 8, '#ffcf7a', { filter: d.glow(3) });
  s += sc_fog(d, cb, 50, '#6f8db8', 0.6);
  /* street */
  var sl = pj(-3, 0, 40), sr = pj(3, 0, 40);
  s += P(poly([-100, 450, 900, 450, sr[0], sr[1], sl[0], sl[1]]), d.lin([[0, '#7f97ba'], [0.2, '#a9bcd8'], [1, '#e2ebf7']]));
  [-0.7, -0.45, 0.45, 0.7].forEach(function (tx) { s += sc_ln(pj(tx, 0, 0.8), pj(tx, 0, 30), '#8295b4', 3, { opacity: 0.6 }); });
  /* houses */
  var plaster = ['#c9b79c', '#b8a48a', '#a8b4c4', '#c4a890', '#b0a0b8', '#d0c0a8'];
  var houses = [];
  [-1, 1].forEach(function (sd) {
    var z = 1.0;
    while (z < 15) { var len = 1.1 + rnd() * 1.1; houses.push({ sd: sd, z0: z, z1: z + len, H: 3 + rnd() * 1.8, col: plaster[Math.floor(rnd() * plaster.length)], lamp: rnd() < 0.45 }); z += len + 0.03; }
  });
  houses.sort(function (a, b) { return b.z0 - a.z0; });
  var wg = d.glow(2.5, 2), lg = d.glow(5, 2);
  houses.forEach(function (h) {
    var X = 3 * h.sd, zm = (h.z0 + h.z1) / 2, fog = Math.min(0.75, (zm - 1) / 14);
    var base = mix(mix(h.col, '#34405e', 0.5), '#6f8db8', fog), dark = mix('#2a1c1c', '#6f8db8', fog);
    var hs = '', pre = '';
    /* facade + gable */
    hs += sc_q([pj(X, 0, h.z0), pj(X, h.H, h.z0), pj(X, h.H + 1.5, zm), pj(X, h.H, h.z1), pj(X, 0, h.z1)], base);
    /* timbers */
    var tw = 10 / zm;
    hs += sc_ln(pj(X, 2.1, h.z0), pj(X, 2.1, h.z1), dark, tw);
    hs += sc_ln(pj(X, 0, h.z0), pj(X, h.H, h.z0), dark, tw);
    hs += sc_ln(pj(X, 0, h.z1), pj(X, h.H, h.z1), dark, tw);
    hs += sc_ln(pj(X, 2.1, h.z0), pj(X, h.H, zm), dark, tw * 0.7);
    hs += sc_ln(pj(X, 2.1, h.z1), pj(X, h.H, zm), dark, tw * 0.7);
    /* roof edge + snow */
    var p1 = pj(X, h.H, h.z0), p2 = pj(X, h.H + 1.5, zm), p3 = pj(X, h.H, h.z1);
    var gab = 'M' + f(p1[0]) + ' ' + f(p1[1]) + ' L' + f(p2[0]) + ' ' + f(p2[1]) + ' L' + f(p3[0]) + ' ' + f(p3[1]);
    hs += P(gab, 'none', mix('#2a2030', '#6f8db8', fog), 16 / zm);
    hs += G(P(gab, 'none', mix('#f4f8ff', '#a8bcd8', fog), 9 / zm), { transform: 'translate(0 ' + f(-6 / zm) + ')' });
    /* windows */
    var wins = '';
    [[1.0, 1.75], [2.5, 3.2]].forEach(function (fl, fi) {
      if (fl[1] > h.H - 0.1) return;
      var n = (h.z1 - h.z0) > 1.6 ? 2 : 1;
      for (var k = 0; k < n; k++) {
        var u0 = h.z0 + (h.z1 - h.z0) * (k + 0.3) / n, u1 = h.z0 + (h.z1 - h.z0) * (k + 0.7) / n;
        if (fi === 0 && k === 0 && h.lamp) { /* door */
          hs += sc_q([pj(X, 0, u0), pj(X, 1.5, u0), pj(X, 1.5, u1), pj(X, 0, u1)], mix('#3a2418', '#6f8db8', fog));
          continue;
        }
        var lit = rnd() < 0.65;
        var wc = lit ? (rnd() < 0.5 ? '#ffcf6e' : '#ffae4a') : mix('#1a2238', '#6f8db8', fog);
        wins += sc_q([pj(X, fl[0], u0), pj(X, fl[1], u0), pj(X, fl[1], u1), pj(X, fl[0], u1)], wc, lit ? { opacity: f(1 - fog * 0.5) } : null);
        wins += sc_ln(pj(X, (fl[0] + fl[1]) / 2, u0), pj(X, (fl[0] + fl[1]) / 2, u1), dark, 3 / zm) + sc_ln(pj(X, fl[0], (u0 + u1) / 2), pj(X, fl[1], (u0 + u1) / 2), dark, 3 / zm);
        wins += sc_ln(pj(X, fl[0], u0), pj(X, fl[0], u1), '#eef4ff', 6 / zm);
      }
    });
    hs += G(wins, { filter: wg });
    /* snow drift at base */
    hs += sc_q([pj(X, 0, h.z0), pj(X, 0.25, h.z0), pj(X, 0.3, zm), pj(X, 0.2, h.z1), pj(X, 0, h.z1), pj(X - 0.4 * h.sd, 0, zm)], mix('#eef4ff', '#a8bcd8', fog));
    /* lantern */
    if (h.lamp) {
      var lp = pj(X - 0.35 * h.sd, 2.25, zm), lb = pj(X, 2.45, zm), gp = pj(X - 0.9 * h.sd, 0, zm);
      pre = E(gp[0], gp[1], 260 / zm, 50 / zm, d.rad([[0, '#ffc870', 0.5], [1, '#ffc870', 0]]));
      hs += L(lb[0], lb[1], lp[0], lp[1] - 6 / zm, '#1a1210', 4 / zm);
      hs += C(lp[0], lp[1], 28 / zm, d.rad([[0, '#ffd890', 0.6], [1, '#ffb050', 0]]));
      hs += R(lp[0] - 6 / zm, lp[1] - 8 / zm, 12 / zm, 16 / zm, '#ffe6a0', { filter: lg, stroke: '#1a1210', 'stroke-width': f(2 / zm) });
    }
    s += pre + hs;
  });
  /* tavern sign on near left */
  var sp = pj(-2.75, 2.6, 1.9);
  s += L(sp[0] - 30, sp[1], sp[0] + 60, sp[1], '#1a1210', 5) + L(sp[0] + 18, sp[1], sp[0] + 18, sp[1] + 6, '#1a1210', 2) + L(sp[0] + 58, sp[1], sp[0] + 58, sp[1] + 6, '#1a1210', 2) +
    R(sp[0] + 10, sp[1] + 6, 56, 36, '#5a3a22', { stroke: INK, 'stroke-width': 2, rx: 3 }) +
    P('M' + f(sp[0] + 28) + ' ' + f(sp[1] + 16) + ' l0 18 l20 0 l0 -18 Z', '#c89a3a', INK, 1.5) + P('M' + f(sp[0] + 48) + ' ' + f(sp[1] + 20) + ' q6 0 6 6 q0 6 -6 6', 'none', '#c89a3a', 2) +
    R(sp[0] + 10, sp[1] + 4, 56, 5, '#f4f8ff', { rx: 2 });
  s += sc_fog(d, 300, 120, '#a8c0e0', 0.12);
  s += sc_snow(d, rnd, 200);
  s += sc_vig(d, 0.55);
  return s;
};

/* ================= SEWERS ================= */
SCENES.sewers = function (d, rnd) {
  var k = 170, pj = sc_pj(400, 225, k, 1.4);
  var s = R(0, 0, 800, 450, '#050807');
  var fogc = '#2f5a3c', i;
  /* far glow */
  s += C(400, 215, 160, d.rad([[0, '#8fe0a0', 0.55], [0.4, '#3a8a5a', 0.25], [1, '#0a1a10', 0]]));
  var Zs = [];
  for (var z = 22; z >= 0.6; z /= 1.32) Zs.push(z);
  var R0 = 2.6, WH = 1.3;
  for (i = 0; i < Zs.length - 1; i++) {
    var zf = Zs[i], zn = Zs[i + 1], fog = Math.min(1, (zn - 0.6) / 9);
    var wall = mix('#4a4436', fogc, fog * 0.8), wallD = mix('#2a261e', fogc, fog * 0.8);
    s += sc_q([pj(-R0, 0, zf), pj(-R0, WH, zf), pj(-R0, WH, zn), pj(-R0, 0, zn)], wall);
    s += sc_q([pj(R0, 0, zf), pj(R0, WH, zf), pj(R0, WH, zn), pj(R0, 0, zn)], wallD);
    for (var a = 0; a < 8; a++) {
      var a0 = Math.PI * a / 8, a1 = Math.PI * (a + 1) / 8;
      var X0 = -Math.cos(a0) * R0, Y0 = WH + Math.sin(a0) * R0, X1 = -Math.cos(a1) * R0, Y1 = WH + Math.sin(a1) * R0;
      s += sc_q([pj(X0, Y0, zf), pj(X1, Y1, zf), pj(X1, Y1, zn), pj(X0, Y0, zn)], mix(mix('#3a3428', '#1a1812', a / 8), fogc, fog * 0.8));
    }
    s += sc_q([pj(-R0, 0, zf), pj(-1.1, 0, zf), pj(-1.1, 0, zn), pj(-R0, 0, zn)], mix('#3a3a30', fogc, fog * 0.8));
    s += sc_q([pj(R0, 0, zf), pj(1.1, 0, zf), pj(1.1, 0, zn), pj(R0, 0, zn)], mix('#2e2e26', fogc, fog * 0.8));
    s += sc_q([pj(-1.1, 0, zf), pj(-1.1, -0.45, zf), pj(-1.1, -0.45, zn), pj(-1.1, 0, zn)], mix('#24241c', fogc, fog * 0.8));
    s += sc_q([pj(1.1, 0, zf), pj(1.1, -0.45, zf), pj(1.1, -0.45, zn), pj(1.1, 0, zn)], mix('#24241c', fogc, fog * 0.8));
    /* brick arch rib */
    var c = pj(0, WH, zn), r = R0 * k / zn, lb = pj(-R0, 0, zn), rb = pj(R0, 0, zn);
    var rib = 'M' + f(lb[0]) + ' ' + f(lb[1]) + ' L' + f(lb[0]) + ' ' + f(c[1]) + ' A' + f(r) + ' ' + f(r) + ' 0 0 1 ' + f(rb[0]) + ' ' + f(c[1]) + ' L' + f(rb[0]) + ' ' + f(rb[1]);
    s += P(rib, 'none', mix('#1a160f', fogc, fog * 0.6), 34 / zn);
    s += P(rib, 'none', mix('#6a5a44', fogc, fog * 0.7), 26 / zn, { 'stroke-dasharray': f(22 / zn) + ' ' + f(4 / zn), 'stroke-linecap': 'butt' });
  }
  /* brick courses */
  var lines = '';
  for (var y = 0.25; y < WH; y += 0.3) [-R0, R0].forEach(function (X) { lines += sc_ln(pj(X, y, 0.6), pj(X, y, 22), '#120f0a', 1.2, { opacity: 0.5 }); });
  for (var kk = 1; kk < 8; kk++) { var an = Math.PI * kk / 8, X = -Math.cos(an) * R0, Y = WH + Math.sin(an) * R0; lines += sc_ln(pj(X, Y, 0.6), pj(X, Y, 22), '#0c0a07', 1.2, { opacity: 0.45 }); }
  s += lines;
  /* water surface */
  var wl = pj(-1.1, -0.35, 0.6), wr = pj(1.1, -0.35, 0.6), wfl = pj(-1.1, -0.35, 22), wfr = pj(1.1, -0.35, 22);
  s += P(poly([wl[0], wl[1], wfl[0], wfl[1], wfr[0], wfr[1], wr[0], wr[1]]), d.lin([[0, '#5fbf7a'], [0.15, '#1f5a34'], [1, '#081a10']]), null, null, { opacity: 0.95 });
  s += P(poly([395, 232, 405, 232, 470, 450, 330, 450]), d.lin([[0, '#b8ffcc', 0.6], [1, '#b8ffcc', 0]]), null, null, { filter: d.blur(4) });
  var rip = '';
  for (i = 0; i < 26; i++) { var zz = 0.8 + rnd() * 10, xx = (rnd() - 0.5) * 1.8, p = pj(xx, -0.35, zz); rip += E(p[0], p[1], 40 / zz, 5 / zz, 'none', { stroke: '#9fe8b0', 'stroke-width': f(2 / zz + 0.3), opacity: f(0.2 + rnd() * 0.3) }); }
  s += rip;
  /* pipes with outflow */
  [[-R0, 1.0, 2.2], [R0, 0.9, 3.6], [-R0, 1.1, 6]].forEach(function (pp) {
    var p = pj(pp[0], pp[1], pp[2]), r = 0.3 * k / pp[2], sd = pp[0] < 0 ? 1 : -1;
    s += E(p[0], p[1], r * 0.5, r, '#2a2a22', { stroke: '#5a5040', 'stroke-width': f(r * 0.3) }) + E(p[0], p[1], r * 0.3, r * 0.7, '#050505');
    var w = pj(pp[0] * 0.43, -0.35, pp[2]);
    s += P('M' + f(p[0]) + ' ' + f(p[1] + r * 0.3) + ' Q' + f(p[0] + (w[0] - p[0]) * 0.7) + ' ' + f(p[1] + r * 0.3) + ' ' + f(w[0]) + ' ' + f(w[1]), 'none', d.lin([[0, '#9fe8b0', 0.9], [1, '#4aa86a', 0.5]]), r * 0.35);
    s += E(w[0], w[1], r * 1.5, r * 0.35, '#c8ffd8', { opacity: 0.5, filter: d.blur(2) });
  });
  /* torches */
  [[-R0, 1.25, 1.7], [R0, 1.25, 2.9], [-R0, 1.25, 5.2]].forEach(function (tp) {
    var p = pj(tp[0], tp[1], tp[2]), sc = k / tp[2] / 60, sd = tp[0] < 0 ? 1 : -1;
    s += C(p[0], p[1] - 10 * sc, 150 * sc, d.rad([[0, '#ffb050', 0.45], [0.5, '#ff8030', 0.12], [1, '#ff8030', 0]]));
    s += P('M' + f(p[0]) + ' ' + f(p[1] + 14 * sc) + ' L' + f(p[0] + sd * 8 * sc) + ' ' + f(p[1] - 4 * sc), 'none', '#2a1a10', 4 * sc);
    s += P('M' + f(p[0] + sd * 8 * sc - 4 * sc) + ' ' + f(p[1] - 4 * sc) + ' Q' + f(p[0] + sd * 8 * sc - 6 * sc) + ' ' + f(p[1] - 16 * sc) + ' ' + f(p[0] + sd * 8 * sc) + ' ' + f(p[1] - 28 * sc) + ' Q' + f(p[0] + sd * 8 * sc + 6 * sc) + ' ' + f(p[1] - 16 * sc) + ' ' + f(p[0] + sd * 8 * sc + 4 * sc) + ' ' + f(p[1] - 4 * sc) + 'Z', '#ffd27a', null, null, { filter: d.glow(3 * sc, 2) });
  });
  /* moss & slime drips */
  var moss = '';
  for (i = 0; i < 30; i++) { var mz = 0.8 + rnd() * 6, sdd = rnd() < 0.5 ? -1 : 1, mp = pj(sdd * R0, rnd() * 1.2, mz); moss += E(mp[0], mp[1], 18 / mz, 8 / mz, '#4a8a3a', { opacity: f(0.4 + rnd() * 0.4) }); }
  for (i = 0; i < 12; i++) { var dz = 0.9 + rnd() * 4, an2 = 0.4 + rnd() * 2.3, dp = pj(-Math.cos(an2) * R0, WH + Math.sin(an2) * R0, dz); moss += P('M' + f(dp[0] - 3) + ' ' + f(dp[1]) + ' q3 ' + f(30 / dz) + ' 6 0Z', '#7fd89a', null, null, { opacity: 0.6 }) + C(dp[0], dp[1] + 40 / dz, 2.5, '#9fe8b0', { opacity: 0.7 }); }
  s += moss;
  /* glowing rat eyes in the far dark */
  s += G(C(380, 228, 1.4, '#ff3a3a') + C(385, 228, 1.4, '#ff3a3a') + C(431, 232, 1.2, '#ff3a3a') + C(435, 232, 1.2, '#ff3a3a'), { filter: d.glow(1.5) });
  s += sc_fog(d, 260, 90, '#6fb88a', 0.18);
  for (i = 0; i < 40; i++) s += C(rnd() * 800, rnd() * 450, 0.8 + rnd() * 1.6, '#b8ffcc', { opacity: f(0.2 + rnd() * 0.5) });
  s += sc_vig(d, 0.85);
  return s;
};

/* ================= CRYPT ================= */
SCENES.crypt = function (d, rnd) {
  var k = 170, pj = sc_pj(400, 230, k, 1.6);
  var s = R(0, 0, 800, 450, '#06060c');
  var fogc = '#2c3a5c', i;
  var WX = 3.6, PX = 2.5, SP = 3.2, fz = 18;
  /* far wall with spectral door */
  var fw0 = pj(-WX, 0, fz), fw1 = pj(WX, 6, fz);
  s += R(fw0[0], fw1[1], fw1[0] - fw0[0], fw0[1] - fw1[1], '#26304e');
  s += C(400, 205, 120, d.rad([[0, '#9fd8ff', 0.7], [0.3, '#4a7ad0', 0.35], [1, '#1a2040', 0]]));
  var dt = pj(0, 2.8, fz), dl = pj(-0.8, 0, fz), dr = pj(0.8, 0, fz), dw = (dr[0] - dl[0]) / 2;
  s += P('M' + f(dl[0]) + ' ' + f(dl[1]) + ' L' + f(dl[0]) + ' ' + f(dt[1] + dw) + ' A' + f(dw) + ' ' + f(dw) + ' 0 0 1 ' + f(dr[0]) + ' ' + f(dt[1] + dw) + ' L' + f(dr[0]) + ' ' + f(dr[1]) + 'Z', '#dff4ff', null, null, { filter: d.glow(4, 2) });
  /* floor */
  var f0 = pj(WX, 0, fz), f1 = pj(-WX, 0, fz);
  s += P(poly([-200, 450, 1000, 450, f0[0], f0[1], f1[0], f1[1]]), d.lin([[0, '#2e3650'], [1, '#14141c']]));
  var tl = '';
  for (var tx = -3; tx <= 3; tx += 1) tl += sc_ln(pj(tx, 0, 0.7), pj(tx, 0, fz), '#0a0a10', 1.5, { opacity: 0.6 });
  for (var tz = 1; tz < fz; tz *= 1.25) tl += sc_ln(pj(-WX, 0, tz), pj(WX, 0, tz), '#0a0a10', 1.5, { opacity: 0.6 });
  s += tl;
  /* glow reflection on floor */
  s += E(400, 250, 140, 30, d.rad([[0, '#9fd8ff', 0.35], [1, '#9fd8ff', 0]]));
  var bays = [];
  for (var z = 1.2; z < fz; z += SP) bays.push(z);
  var gl = d.glow(3, 2);
  for (i = bays.length - 1; i >= 0; i--) {
    var z0 = bays[i], z1 = Math.min(fz, z0 + SP), fog = Math.min(0.85, (z0 - 1) / 14);
    var wcol = mix('#3a3a4a', fogc, fog), dcol = mix('#0e0e14', fogc, fog * 0.7);
    [-1, 1].forEach(function (sd) {
      s += sc_q([pj(sd * WX, 0, z0), pj(sd * WX, 4.2, z0), pj(sd * WX, 4.2, z1), pj(sd * WX, 0, z1)], sd < 0 ? wcol : mix(wcol, '#000', 0.25));
      /* arched niche */
      var n0 = pj(sd * WX, 1.0, z0 + SP * 0.25), n1 = pj(sd * WX, 2.3, z0 + SP * 0.25), n2 = pj(sd * WX, 2.3, z0 + SP * 0.75), n3 = pj(sd * WX, 1.0, z0 + SP * 0.75), nt = pj(sd * WX, 3.0, z0 + SP * 0.5);
      s += P('M' + f(n0[0]) + ' ' + f(n0[1]) + ' L' + f(n1[0]) + ' ' + f(n1[1]) + ' Q' + f(nt[0]) + ' ' + f(nt[1]) + ' ' + f(n2[0]) + ' ' + f(n2[1]) + ' L' + f(n3[0]) + ' ' + f(n3[1]) + 'Z', dcol);
      var sk = pj(sd * WX, 1.3, z0 + SP * 0.5), sr = 0.22 * k / (z0 + SP * 0.5);
      s += C(sk[0], sk[1], sr, mix('#c8c0a8', fogc, fog)) + C(sk[0] - sr * 0.35, sk[1], sr * 0.25, '#000') + C(sk[0] + sr * 0.35, sk[1], sr * 0.25, '#000');
      /* sarcophagus */
      var za = z0 + 0.6, zb = z0 + 2.4, xi = sd * (WX - 1.0), xo = sd * (WX - 0.05);
      s += sc_q([pj(xi, 0, za), pj(xi, 0.8, za), pj(xi, 0.8, zb), pj(xi, 0, zb)], mix('#4a4a58', fogc, fog));
      s += sc_q([pj(xo, 0.8, za), pj(xi, 0.8, za), pj(xi, 0.8, zb), pj(xo, 0.8, zb)], mix('#6a6a7c', fogc, fog));
      s += sc_q([pj(xo, 0, za), pj(xo, 0.8, za), pj(xi, 0.8, za), pj(xi, 0, za)], mix('#363644', fogc, fog));
      /* pillar */
      var pw = 0.32, p0 = pj(sd * PX - pw, 0, z0), p1 = pj(sd * PX + pw, 4.2, z0), px0 = Math.min(p0[0], p1[0]), pwid = Math.abs(p1[0] - p0[0]);
      var pg = d.lin([[0, mix('#4a4a5c', fogc, fog)], [0.35, mix('#8a8aa0', fogc, fog)], [1, mix('#1e1e26', fogc, fog)]], 0, 0, 1, 0);
      s += R(px0, p1[1], pwid, p0[1] - p1[1], pg);
      s += R(px0 - 8 / z0, p1[1], pwid + 16 / z0, 16 / z0, mix('#6a6a7a', fogc, fog));
      s += R(px0 - 8 / z0, p0[1] - 16 / z0, pwid + 16 / z0, 16 / z0, mix('#4a4a5a', fogc, fog));
      /* candle */
      var cp = pj(sd * (PX - 0.6), 0, z0 + 0.15), ch = 32 / z0;
      s += C(cp[0], cp[1] - ch - 5 / z0, 120 / z0, d.rad([[0, '#ffb860', 0.4], [1, '#ffb860', 0]]));
      s += R(cp[0] - 4 / z0, cp[1] - ch, 8 / z0, ch, '#e8e0c8') + E(cp[0], cp[1] - ch - 6 / z0, 3 / z0 + 1, 7 / z0 + 1, '#fff0b0', { filter: gl });
    });
    /* vault rib */
    var r = PX * k / z0, lb = pj(-PX, 4.2, z0), rb = pj(PX, 4.2, z0);
    var arch = 'M' + f(lb[0]) + ' ' + f(lb[1]) + ' A' + f(r) + ' ' + f(r * 0.8) + ' 0 0 1 ' + f(rb[0]) + ' ' + f(rb[1]);
    s += P(arch, 'none', mix('#101018', fogc, fog), 50 / z0) + P(arch, 'none', mix('#5a5a6a', fogc, fog), 32 / z0);
  }
  /* mist */
  var mist = '';
  for (i = 0; i < 14; i++) mist += E(rnd() * 800, 330 + rnd() * 120, 90 + rnd() * 120, 14 + rnd() * 14, '#b8d0ff', { opacity: f(0.06 + rnd() * 0.1) });
  s += G(mist, { filter: d.blur(8) });
  /* cobwebs */
  function web(cx, cy, sx, sy) {
    var w = '', rr = 120, a;
    for (a = 0; a <= 6; a++) { var an = a / 6 * Math.PI / 2; w += L(cx, cy, cx + sx * Math.cos(an) * rr, cy + sy * Math.sin(an) * rr, '#c8d0e0', 0.8); }
    for (var ring = 1; ring <= 5; ring++) {
      var rr2 = ring * 22, p = 'M' + f(cx + sx * rr2) + ' ' + f(cy);
      for (a = 1; a <= 6; a++) { var an2 = a / 6 * Math.PI / 2, pan = (a - 0.5) / 6 * Math.PI / 2; p += ' Q' + f(cx + sx * Math.cos(pan) * rr2 * 0.85) + ' ' + f(cy + sy * Math.sin(pan) * rr2 * 0.85) + ' ' + f(cx + sx * Math.cos(an2) * rr2) + ' ' + f(cy + sy * Math.sin(an2) * rr2); }
      w += P(p, 'none', '#c8d0e0', 0.7);
    }
    return G(w, { opacity: 0.35 });
  }
  s += web(0, 0, 1, 1) + web(800, 0, -1, 1);
  for (i = 0; i < 6; i++) s += C(250 + rnd() * 300, 150 + rnd() * 120, 3 + rnd() * 3, '#bfe6ff', { filter: d.glow(4, 2), opacity: 0.8 });
  s += sc_vig(d, 0.9);
  return s;
};

/* ================= KEEP ================= */
SCENES.keep = function (d, rnd) {
  var s = R(0, 0, 800, 450, d.lin([[0, '#0a0e1c'], [0.5, '#22304e'], [1, '#5a7096']]));
  var i;
  var cl = '';
  for (i = 0; i < 26; i++) { var cx = rnd() * 800, cy = rnd() * 170, w = 60 + rnd() * 120; cl += E(cx, cy, w, w * 0.25, rnd() < 0.5 ? '#2a3654' : '#1a2238', { opacity: 0.85 }); cl += E(cx - w * 0.2, cy - w * 0.08, w * 0.6, w * 0.14, '#4a5a7e', { opacity: 0.35 }); }
  s += G(cl, { filter: d.blur(6) });
  s += sc_moon(d, 210, 90, 18, '#dfe8ff', '#8fb0ff');
  s += E(210, 96, 70, 10, '#1a2238', { opacity: 0.8, filter: d.blur(4) });
  s += sc_ridge(rnd, 300, 110, 50, d.lin([[0, '#c8d8f0'], [0.3, '#58709a'], [1, '#26344e']]), false, { opacity: 0.9 });
  s += sc_fog(d, 300, 70, '#9ab4d8', 0.35);
  /* cliff */
  s += P('M240 460 L250 380 L290 330 L300 300 L330 290 L360 296 L420 286 L470 292 L520 286 L560 300 L590 330 L610 380 L630 460Z', d.lin([[0, '#3a4660'], [1, '#0e121c']]));
  s += P('M290 330 L300 300 L330 290 L360 296 L420 286 L470 292 L520 286 L560 300 L590 330 L560 320 L520 300 L470 306 L420 298 L360 308 L330 302 L305 318Z', '#dfeaf8', null, null, { opacity: 0.85 });
  /* fortress */
  var fz = d.lin([[0, '#34405e'], [0.3, '#161c2c'], [1, '#06080e']], 290, 0, 560, 0, true), kp = '', m;
  kp += R(320, 200, 200, 95, fz);
  for (m = 0; m < 10; m++) kp += R(322 + m * 20, 192, 12, 10, fz);
  kp += R(390, 110, 70, 185, fz);
  for (m = 0; m < 4; m++) kp += R(390 + m * 19, 100, 13, 12, fz);
  var towers = [[300, 160, 40], [500, 150, 44], [440, 90, 26]];
  towers.forEach(function (t) { kp += R(t[0], t[1], t[2], 300 - t[1], fz) + P(poly([t[0] - 6, t[1], t[0] + t[2] / 2, t[1] - t[2] * 1.6, t[0] + t[2] + 6, t[1]]), fz); });
  var edges = '';
  towers.forEach(function (t) { edges += L(t[0] + 1, t[1], t[0] + 1, 296, '#9fb8e0', 1.5, { opacity: 0.6 }); });
  edges += L(391, 110, 391, 200, '#9fb8e0', 1.5, { opacity: 0.5 }) + L(321, 200, 321, 295, '#9fb8e0', 1.2, { opacity: 0.4 });
  for (m = 0; m < 9; m++) edges += L(320, 212 + m * 9, 520, 212 + m * 9, '#000', 0.6, { opacity: 0.35 });
  var fr = L(320, 200, 520, 200, '#dfeaf8', 2, { opacity: 0.7 });
  towers.forEach(function (t) { fr += P('M' + f(t[0] - 6) + ' ' + f(t[1]) + ' L' + f(t[0] + t[2] / 2) + ' ' + f(t[1] - t[2] * 1.6), 'none', '#e8f2ff', 2.5, { opacity: 0.8 }); });
  for (i = 0; i < 30; i++) { var ix = 320 + rnd() * 200, ih = 4 + rnd() * 10; fr += P('M' + f(ix - 1.5) + ' 202 L' + f(ix) + ' ' + f(202 + ih) + ' L' + f(ix + 1.5) + ' 202Z', '#cfe4ff', null, null, { opacity: 0.8 }); }
  s += G(kp + edges + fr, { transform: 'translate(420 310) scale(1.15) translate(-420 -295)', filter: d.drop(0, 0, 6, '#9fd8ff', 0.25) });
  var wins = '';
  [[405, 140], [430, 140], [405, 175], [430, 175], [315, 190], [515, 180], [450, 112], [340, 240], [480, 240]].forEach(function (w, j) { wins += P('M' + f(w[0]) + ' ' + f(w[1] + 12) + ' L' + f(w[0]) + ' ' + f(w[1] + 3) + ' Q' + f(w[0] + 3) + ' ' + f(w[1] - 1) + ' ' + f(w[0] + 6) + ' ' + f(w[1] + 3) + ' L' + f(w[0] + 6) + ' ' + f(w[1] + 12) + 'Z', j === 6 ? '#ff5a5a' : '#8fe0ff'); });
  var gate = P('M402 295 L402 262 Q420 244 438 262 L438 295Z', '#8fe0ff', null, null, { opacity: 0.6, filter: d.glow(3) }) +
    P('M402 295 L402 262 Q420 244 438 262 L438 295Z', 'none', '#05060a', 2) + L(410, 255, 410, 295, '#05060a', 2) + L(420, 250, 420, 295, '#05060a', 2) + L(430, 255, 430, 295, '#05060a', 2);
  var ban = '';
  [[372, 210], [462, 210]].forEach(function (b) { ban += P('M' + b[0] + ' ' + b[1] + ' l14 0 l0 46 l-4 -6 l-3 10 l-3 -8 l-4 6Z', '#3a1018', '#05060a', 1) + C(b[0] + 7, b[1] + 16, 3, '#9fd8ff', { opacity: 0.7 }); });
  s += G(G(wins, { filter: d.glow(3, 2) }) + gate + ban, { transform: 'translate(420 310) scale(1.15) translate(-420 -295)' });
  /* bridge */
  s += P('M380 310 L460 310 L540 460 L300 460Z', d.lin([[0, '#2a3044'], [1, '#141824']]));
  for (i = 0; i < 6; i++) { var by = 310 + i * 26, bw = 40 + (by - 310) * 0.8; s += L(420 - bw, by, 420 + bw, by, '#0a0c14', 1.5, { opacity: 0.6 }); }
  s += L(380, 310, 300, 460, '#05060a', 4) + L(460, 310, 540, 460, '#05060a', 4) + L(382, 310, 304, 460, '#9fb8e0', 1.5, { opacity: 0.5 });
  /* chasm sides */
  s += P('M-10 460 L-10 340 Q120 320 250 380 L300 460Z', d.lin([[0, '#c8d8ee'], [0.15, '#55688a'], [1, '#0a0c14']]));
  s += P('M810 460 L810 330 Q700 320 600 380 L560 460Z', d.lin([[0, '#c8d8ee'], [0.15, '#55688a'], [1, '#0a0c14']]));
  s += sc_fog(d, 400, 80, '#9ab4d8', 0.25);
  var bl = '';
  for (i = 0; i < 90; i++) { var x = rnd() * 860, y = rnd() * 450, l = 10 + rnd() * 24; bl += L(x, y, x - l, y + l * 0.35, '#e8f0ff', 0.8 + rnd() * 1.2, { opacity: f(0.2 + rnd() * 0.35) }); }
  s += bl;
  s += sc_snow(d, rnd, 160);
  s += sc_vig(d, 0.75);
  return s;
};

/* ================= TOWER ================= */
SCENES.tower = function (d, rnd) {
  var s = R(0, 0, 800, 450, d.lin([[0, '#060818'], [0.45, '#141c44'], [1, '#2a4a7a']]));
  var i;
  s += sc_stars(rnd, 100, 300, '#cfe0ff');
  var vx = 400, vy = 70, vort = '';
  for (var arm = 0; arm < 4; arm++) {
    var pth = '', a0 = arm * Math.PI / 2;
    for (var rr = 12; rr < 420; rr += 12) {
      var an = a0 + rr * 0.012;
      pth += (pth ? ' L' : 'M') + f(vx + Math.cos(an) * rr) + ' ' + f(vy + Math.sin(an) * rr * 0.32);
    }
    vort += P(pth, 'none', arm % 2 ? '#6a8ae8' : '#3f56b0', 22, { opacity: 0.45 });
    vort += P(pth, 'none', '#b8d8ff', 4, { opacity: 0.35 });
  }
  s += G(vort, { filter: d.blur(6) });
  s += C(vx, vy, 90, d.rad([[0, '#d8f4ff', 0.9], [0.25, '#7fc8ff', 0.5], [1, '#2a4aa0', 0]]));
  var lt = 'M400 70', lx = 400, ly = 70;
  for (i = 0; i < 6; i++) { lx += (rnd() - 0.5) * 40 - 15; ly += 15 + rnd() * 10; lt += ' L' + f(lx) + ' ' + f(ly); }
  s += P(lt, 'none', '#e8f8ff', 2, { filter: d.glow(3, 2), opacity: 0.8 });
  s += sc_ridge(rnd, 330, 90, 45, d.lin([[0, '#b8d4f4'], [0.3, '#4a6898'], [1, '#1a2a4e']]), false);
  s += sc_fog(d, 330, 60, '#7fa8e0', 0.4);
  var tg = d.lin([[0, '#0a0e22'], [0.35, '#2a3a6a'], [0.55, '#4a6aa8'], [0.7, '#1e2a50'], [1, '#080a18']], 0, 0, 1, 0);
  var tw = 'M350 450 L366 260 L372 250 L378 160 L386 150 L390 100 L400 62 L410 100 L414 150 L422 160 L428 250 L434 260 L450 450Z';
  s += C(400, 120, 100, d.rad([[0, '#7fd8ff', 0.3], [1, '#7fd8ff', 0]]));
  s += P(tw, tg, '#05060e', 2);
  [[150, 386, 414], [250, 372, 428], [330, 362, 438]].forEach(function (b) { s += P('M' + b[1] + ' ' + b[0] + ' Q400 ' + f(b[0] + 8) + ' ' + b[2] + ' ' + b[0] + ' L' + b[2] + ' ' + f(b[0] + 5) + ' Q400 ' + f(b[0] + 13) + ' ' + b[1] + ' ' + f(b[0] + 5) + 'Z', '#5a7ac0', '#05060e', 1); });
  s += P('M378 160 L370 140 L384 150 L388 128 L394 146 L400 120 L406 146 L412 128 L416 150 L430 140 L422 160Z', '#141c3a', '#05060e', 1.5);
  var cr = '', cg = d.lin([[0, '#f0fbff'], [0.5, '#9fd8ff'], [1, '#3a7ac8']], 0, 0, 1, 1);
  [[366, 260, -1, 40], [434, 260, 1, 46], [378, 165, -1, 30], [422, 165, 1, 34], [356, 380, -1, 50], [444, 370, 1, 56]].forEach(function (c) {
    cr += P('M' + c[0] + ' ' + c[1] + ' L' + f(c[0] + c[2] * c[3]) + ' ' + f(c[1] - c[3] * 0.9) + ' L' + f(c[0] + c[2] * c[3] * 0.3) + ' ' + f(c[1] + 8) + 'Z', cg, '#1a3a6a', 1);
    cr += P('M' + c[0] + ' ' + f(c[1] + 6) + ' L' + f(c[0] + c[2] * c[3] * 0.6) + ' ' + f(c[1] - c[3] * 0.2) + ' L' + f(c[0] + c[2] * 6) + ' ' + f(c[1] + 14) + 'Z', cg, '#1a3a6a', 1);
  });
  s += cr;
  var wn = '';
  [[400, 110], [400, 200], [395, 300], [405, 380]].forEach(function (w) { wn += R(w[0] - 3, w[1], 6, 12, '#bff0ff'); });
  wn += C(400, 82, 6, '#e8fbff');
  s += G(wn, { filter: d.glow(3, 2) });
  s += E(400, 250, 90, 18, 'none', { stroke: '#8fe0ff', 'stroke-width': 1.5, 'stroke-dasharray': '6 4 2 4', opacity: 0.7, filter: d.glow(2) });
  var sh = '';
  for (i = 0; i < 22; i++) { var x = 220 + rnd() * 360, y = 60 + rnd() * 300, z = 3 + rnd() * 8; if (Math.abs(x - 400) < 40) x += x < 400 ? -50 : 50; sh += P(poly([x, y - z, x + z * 0.4, y, x, y + z * 0.8, x - z * 0.4, y]), cg, null, null, { opacity: f(0.6 + rnd() * 0.4), transform: 'rotate(' + f(rnd() * 60 - 30) + ' ' + f(x) + ' ' + f(y) + ')' }); }
  s += G(sh, { filter: d.glow(1.5) });
  s += P('M-10 460 L-10 400 Q200 380 400 395 Q600 410 810 388 L810 460Z', d.lin([[0, '#cfe4fa'], [1, '#5a7aaa']]));
  var sp2 = '';
  for (i = 0; i < 16; i++) { var gx = rnd() * 800, gh = 20 + rnd() * 60, gw = 6 + rnd() * 10; if (Math.abs(gx - 400) < 80) continue; sp2 += P(poly([gx - gw, 420, gx + (rnd() - 0.5) * 10, 420 - gh, gx + gw, 420]), cg, '#2a4a7a', 1, { opacity: 0.9 }); }
  s += sp2;
  s += sc_fog(d, 420, 40, '#dff0ff', 0.3);
  s += sc_snow(d, rnd, 120, '#dff0ff');
  s += sc_vig(d, 0.7);
  return s;
};

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */
function monsterFallback(d) {
  return E(150, 270, 80, 14, 'rgba(0,0,0,0.35)') + P('M90 270 C80 180 110 90 150 90 C190 90 220 180 210 270 Z', d.lin([[0, '#3a2e4a'], [1, '#120c18']]), INK, 3) +
    C(132, 150, 6, '#ff4040', { filter: d.glow(3) }) + C(168, 150, 6, '#ff4040', { filter: d.glow(3) });
}
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
var NPC_FIGS = {};

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

var MONSTER_ORDER = ['rat', 'giant_rat', 'wererat', 'thief', 'cutthroat', 'slime', 'spider', 'bat', 'kobold', 'goblin', 'orc', 'wolf', 'skeleton', 'zombie', 'ghoul', 'wraith', 'ghost', 'lich', 'gargoyle', 'statue', 'golem', 'dark_knight', 'ogre', 'troll', 'harpy', 'cultist', 'dark_mage', 'imp', 'demon', 'wyvern', 'dragon', 'ice_elemental', 'frost_giant', 'basilisk', 'mimic', 'siren', 'dark_elf', 'vampire', 'ratking', 'morvane', 'kargath', 'malthor'];
BT.art = {
  portrait: function (o) {
    o = o || {};
    var d = new Defs();
    return svgWrap(200, 250, d, renderPortrait(d, o), 'xMidYMid slice');
  },
  lookOptions: LOOK_COUNTS,
  monster: function (key, opts) {
    opts = opts || {};
    var d = new Defs();
    var fn = MONSTERS[key];
    var body = fn ? fn(d, rng(hashStr(key))) : monsterFallback(d);
    if (opts.hue) body = '<g filter="' + d.hue(opts.hue) + '">' + body + '</g>';
    return svgWrap(300, 300, d, body, 'xMidYMid meet');
  },
  monsterKeys: MONSTER_ORDER.filter(function (k) { return MONSTERS[k]; }).concat(Object.keys(MONSTERS).filter(function (k) { return MONSTER_ORDER.indexOf(k) < 0; })),
  npc: function (key) {
    var d = new Defs();
    var fn = NPCS[key];
    var body = fn ? fn(d, rng(hashStr(key))) : renderPortrait(d, { race: 'human', cls: 'bard', gender: 'm', seed: hashStr(key) });
    return svgWrap(200, 250, d, body, 'xMidYMid slice');
  },
  npcKeys: Object.keys(NPCS),
  scene: function (key) {
    var d = new Defs();
    var fn = SCENES[key];
    var body = fn ? fn(d, rng(hashStr(key))) : R(0, 0, 800, 450, d.lin([[0, '#0b1020'], [1, '#22304a']]));
    return svgWrap(800, 450, d, body, 'xMidYMid slice');
  },
  sceneKeys: Object.keys(SCENES),
  /* faith symbol: faith = 'dawn' | 'pale' | 'root'; size = optional pixel size (default 100%) */
  symbol: function (faith, size) {
    var d = new Defs();
    var key = (faith === 'pale' || faith === 'root') ? faith : 'dawn';
    var svg = svgWrap(100, 100, d, faithSymbol(d, key), 'xMidYMid meet');
    if (size) svg = svg.replace('width="100%" height="100%"', 'width="' + (+size || 100) + '" height="' + (+size || 100) + '"');
    return svg;
  },
  symbolKeys: ['dawn', 'pale', 'root'],
  /* full-body hero, same opts as portrait(); viewBox 0 0 200 400, transparent */
  figure: function (o) {
    var d = new Defs();
    return svgWrap(200, 400, d, renderFigure(d, o || {}), 'xMidYMid meet');
  },
  /* full-body NPC; unknown keys -> generic silhouette */
  npcFigure: function (key) {
    var d = new Defs();
    var fn = NPC_FIGS[key];
    return svgWrap(200, 400, d, fn ? fn(d) : figureFallback(d), 'xMidYMid meet');
  },
  npcFigureKeys: Object.keys(NPC_FIGS)
};
})();
