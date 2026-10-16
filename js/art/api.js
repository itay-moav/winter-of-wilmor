/* Velmoor art: The public BT.art API (portrait, figure, monster, npc, npcFigure, scene, symbol and the *Keys lists).
 * Load this file last: the key lists are built from the registries filled by the other art files. Load order:
 * core, symbols, portraits, figures, keepsakes, npcs, monsters-beasts, monsters-undead, monsters-humanoids,
 * monsters-bosses, monsters-folded, scenes, api.
 * Plain script (no modules). */
(function () {
'use strict';
var root = (typeof window !== 'undefined') ? window : this;
var BT = root.BT = root.BT || {};
var A = BT.ART_INTERNAL;
/* from core.js */
var rng = A.rng, hashStr = A.hashStr, Defs = A.Defs, P = A.P, C = A.C, E = A.E, R = A.R, svgWrap = A.svgWrap, INK = A.INK, MONSTERS = A.MONSTERS,
    SCENES = A.SCENES, NPCS = A.NPCS, NPC_FIGS = A.NPC_FIGS;
/* from symbols.js */
var faithSymbol = A.faithSymbol;
/* from portraits.js */
var LOOK_COUNTS = A.LOOK_COUNTS, renderPortrait = A.renderPortrait;
/* from figures.js */
var renderFigure = A.renderFigure, figureFallback = A.figureFallback;

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */
function monsterFallback(d) {
  return E(150, 270, 80, 14, 'rgba(0,0,0,0.35)') + P('M90 270 C80 180 110 90 150 90 C190 90 220 180 210 270 Z', d.lin([[0, '#3a2e4a'], [1, '#120c18']]), INK, 3) +
    C(132, 150, 6, '#ff4040', { filter: d.glow(3) }) + C(168, 150, 6, '#ff4040', { filter: d.glow(3) });
}
var MONSTER_ORDER = ['rat', 'giant_rat', 'wererat', 'thief', 'cutthroat', 'slime', 'spider', 'bat', 'kobold', 'goblin', 'orc', 'wolf', 'skeleton', 'zombie', 'ghoul', 'wraith', 'ghost', 'lich', 'gargoyle', 'statue', 'golem', 'dark_knight', 'ogre', 'troll', 'harpy', 'cultist', 'dark_mage', 'imp', 'demon', 'wyvern', 'dragon', 'ice_elemental', 'frost_giant', 'basilisk', 'mimic', 'siren', 'dark_elf', 'vampire', 'memory', 'porcelain', 'ratking', 'morvane', 'kargath', 'malthor', 'irena_echo'];
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
