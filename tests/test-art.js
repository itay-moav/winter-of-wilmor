#!/usr/bin/env node
/* Smoke test for the procedural art package js/art/: loads its scripts in order in a vm sandbox
 * (window = {}) and calls every generator with every key and a sweep of portrait combinations.
 * Usage: node tests/test-art.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* same order as the <script> tags in index.html */
const ART_FILES = ['core', 'symbols', 'portraits', 'figures', 'keepsakes', 'npcs', 'monsters-beasts', 'monsters-undead',
  'monsters-humanoids', 'monsters-bosses', 'monsters-folded', 'scenes', 'api'].map(n => 'js/art/' + n + '.js');
const ctx = { window: {} };
vm.createContext(ctx);
ART_FILES.forEach(rel => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', rel), 'utf8'), ctx, { filename: rel }));
const art = ctx.window.BT && ctx.window.BT.art;

let failures = 0, checks = 0;
function fail(msg) { failures++; if (failures < 40) console.error('FAIL: ' + msg); }

const VOID_OK = /\/>$/;
function checkSvg(label, s) {
  checks++;
  if (typeof s !== 'string') return fail(label + ': not a string');
  if (!s.startsWith('<svg')) return fail(label + ': does not start with <svg');
  if (s.indexOf('undefined') >= 0) return fail(label + ': contains "undefined"');
  if (s.indexOf('NaN') >= 0) return fail(label + ': contains "NaN"');
  if (s.indexOf('Infinity') >= 0) return fail(label + ': contains "Infinity"');
  if (s.indexOf('[object') >= 0) return fail(label + ': contains "[object"');
  // balanced tags
  const stack = [];
  const re = /<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(s))) {
    const [, close, name, , self] = m;
    if (self) continue;
    if (close) {
      const top = stack.pop();
      if (top !== name) return fail(label + ': mismatched </' + name + '> (expected </' + top + '>) near ' + m.index);
    } else stack.push(name);
  }
  if (stack.length) return fail(label + ': unclosed tags ' + stack.join(','));
  // duplicate ids within one svg
  const ids = {};
  const idre = /\sid="([^"]+)"/g;
  while ((m = idre.exec(s))) {
    if (ids[m[1]]) return fail(label + ': duplicate id ' + m[1]);
    ids[m[1]] = 1;
  }
  // every url(#id) reference resolves
  const refre = /url\(#([^)]+)\)/g;
  while ((m = refre.exec(s))) if (!ids[m[1]]) return fail(label + ': dangling reference #' + m[1]);
}

if (!art) { console.error('BT.art not defined'); process.exit(1); }
['portrait', 'monster', 'npc', 'scene'].forEach(fn => { if (typeof art[fn] !== 'function') fail('missing function ' + fn); });

const REQ_MONSTERS = ['rat', 'giant_rat', 'wererat', 'thief', 'cutthroat', 'slime', 'spider', 'bat', 'kobold', 'goblin', 'orc', 'wolf', 'skeleton', 'zombie', 'ghoul', 'wraith', 'ghost', 'lich', 'gargoyle', 'golem', 'dark_knight', 'ogre', 'troll', 'harpy', 'cultist', 'dark_mage', 'imp', 'demon', 'wyvern', 'dragon', 'ice_elemental', 'frost_giant', 'basilisk', 'mimic', 'siren', 'dark_elf', 'vampire', 'ratking', 'morvane', 'kargath', 'malthor', 'statue', 'memory', 'porcelain', 'irena_echo'];
const REQ_NPCS = ['barkeep', 'innkeeper', 'priestess', 'merchant', 'guildmaster', 'sage', 'mystic', 'malthor', 'lyra', 'morvane', 'kargath', 'ratking', 'mouth', 'ghost_girl', 'matron', 'rootwarden', 'dawnpriest', 'irena'];
const REQ_SCENES = ['title', 'victory', 'gameover', 'town', 'sewers', 'crypt', 'keep', 'tower', 'folded'];

REQ_MONSTERS.forEach(k => { if (art.monsterKeys.indexOf(k) < 0) fail('monsterKeys missing ' + k); });
REQ_NPCS.forEach(k => { if (art.npcKeys.indexOf(k) < 0) fail('npcKeys missing ' + k); });

const lo = art.lookOptions;
['hair', 'hairColor', 'skin', 'eyes'].forEach(k => { if (!(lo && lo[k] > 0)) fail('lookOptions.' + k + ' invalid'); });

const RACES = ['human', 'elf', 'dwarf', 'hobbit', 'halfelf', 'halforc', 'gnome'];
const CLASSES = ['warrior', 'paladin', 'rogue', 'bard', 'hunter', 'monk', 'conjurer', 'magician', 'sorcerer', 'wizard'];
let n = 0, t0 = Date.now();
RACES.forEach((race, ri) => CLASSES.forEach((cls, ci) => ['m', 'f'].forEach((gender, gi) => {
  for (let h = 0; h < Math.max(lo.hair, 2); h++) {
    const look = { hair: h, hairColor: (h + ri + ci) % lo.hairColor, skin: (ri + h) % lo.skin, eyes: (ci + h) % lo.eyes };
    checkSvg(`portrait ${race}/${cls}/${gender}/${JSON.stringify(look)}`, art.portrait({ race, cls, gender, look, seed: n }));
    n++;
  }
})));
const portraitMs = (Date.now() - t0) / n;
// out of range / missing values
checkSvg('portrait out-of-range look', art.portrait({ race: 'elf', cls: 'bard', gender: 'f', look: { hair: 99, hairColor: -3, skin: 1000, eyes: 77 }, seed: 5 }));
checkSvg('portrait no opts', art.portrait());
checkSvg('portrait unknown race/class', art.portrait({ race: 'xx', cls: 'yy', gender: 'q' }));

REQ_MONSTERS.concat(art.monsterKeys).forEach(k => {
  checkSvg('monster ' + k, art.monster(k));
  checkSvg('monster ' + k + ' hue', art.monster(k, { hue: 120 }));
});
checkSvg('monster unknown', art.monster('nope'));
REQ_NPCS.concat(art.npcKeys).forEach(k => checkSvg('npc ' + k, art.npc(k)));
checkSvg('npc unknown', art.npc('nope'));
REQ_SCENES.forEach(k => { if (art.sceneKeys.indexOf(k) < 0) fail('sceneKeys missing ' + k); });
REQ_SCENES.concat(art.sceneKeys).forEach(k => checkSvg('scene ' + k, art.scene(k)));
checkSvg('scene unknown', art.scene('nope'));
if (typeof art.symbol !== 'function') fail('missing function symbol');
else {
  ['dawn', 'pale', 'root'].forEach(k => { checkSvg('symbol ' + k, art.symbol(k)); checkSvg('symbol ' + k + ' 24px', art.symbol(k, 24)); });
  checkSvg('symbol unknown', art.symbol('nope'));
  if (art.symbol('dawn').indexOf('viewBox="0 0 100 100"') < 0) fail('symbol viewBox');
}

// full-body figures
const REQ_FIGS = ['priestess', 'matron', 'rootwarden', 'dawnpriest', 'barkeep', 'innkeeper', 'merchant', 'guildmaster', 'sage', 'mystic', 'malthor', 'lyra', 'ghost_girl', 'kargath', 'irena'];
if (typeof art.figure !== 'function' || typeof art.npcFigure !== 'function') fail('missing figure/npcFigure');
else {
  let nf = 0, tf = Date.now();
  RACES.forEach((race, ri) => CLASSES.forEach((cls, ci) => ['m', 'f'].forEach(gender => {
    for (let h = 0; h < 3; h++) {
      const look = { hair: (h * 3 + ci) % lo.hair, hairColor: (ri + ci + h) % lo.hairColor, skin: (ri + h) % lo.skin, eyes: (ci + h) % lo.eyes };
      const sv = art.figure({ race, cls, gender, look, seed: nf });
      checkSvg(`figure ${race}/${cls}/${gender}/${h}`, sv);
      if (sv.indexOf('viewBox="0 0 200 400"') < 0) fail('figure viewBox');
      nf++;
    }
  })));
  const figMs = (Date.now() - tf) / nf;
  console.log(`${nf} figures, avg ${figMs.toFixed(2)} ms/figure.`);
  if (figMs > 15) fail('figure too slow');
  checkSvg('figure no opts', art.figure());
  checkSvg('figure out-of-range', art.figure({ race: 'zz', cls: 'qq', gender: 'f', look: { hair: 99, hairColor: -4, skin: 77, eyes: 1000 } }));
  REQ_FIGS.forEach(k => { if (art.npcFigureKeys.indexOf(k) < 0) fail('npcFigureKeys missing ' + k); });
  REQ_FIGS.concat(art.npcFigureKeys).forEach(k => checkSvg('npcFigure ' + k, art.npcFigure(k)));
  checkSvg('npcFigure unknown', art.npcFigure('nope'));
}

// id uniqueness across calls
const a = art.portrait({ race: 'human', cls: 'warrior', gender: 'm' }), b = art.portrait({ race: 'human', cls: 'warrior', gender: 'm' });
const ida = (a.match(/id="([^"]+)"/) || [])[1], idb = (b.match(/id="([^"]+)"/) || [])[1];
if (ida && ida === idb) fail('ids not unique across calls');

console.log(`${checks} checks, ${failures} failures. ${n} portraits, avg ${portraitMs.toFixed(2)} ms/portrait.`);
if (portraitMs > 5) fail('portrait too slow');
process.exit(failures ? 1 : 0);
