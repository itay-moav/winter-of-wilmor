/* Velmoor art: Core SVG toolkit for the procedural art: number formatting, seeded RNG, colour maths, the Defs id/gradient/filter factory,
 * element helpers and the shared registries (MONSTERS, SCENES, NPCS, NPC_FIGS). Creates BT.ART_INTERNAL.
 * Plain script (no modules); load order is listed in js/art/api.js. */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL = {};   /* helpers shared between the art files */


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
var NPC_FIGS = {};         /* key -> function(d) returning a full-body figure in 200x400 */

/* shared with the other art files */
A.f = f; A.rng = rng; A.hashStr = hashStr; A.hx = hx; A.mix = mix; A.shade = shade; A.shadow = shadow; A.Defs = Defs; A.P = P; A.C = C; A.E = E;
A.R = R; A.L = L; A.G = G; A.M = M; A.T = T; A.starPts = starPts; A.poly = poly; A.sparkle = sparkle; A.svgWrap = svgWrap; A.INK = INK;
A.MONSTERS = MONSTERS; A.SCENES = SCENES; A.NPCS = NPCS; A.NPC_FIGS = NPC_FIGS;
})();
