#!/usr/bin/env node
// Loads the js/audio/ package in a Node vm with a minimal fake window (no AudioContext) and checks
// that every API call is a safe no-op and that all required track / sfx names exist.
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

// the audio package, in index.html load order
var FILES = ['core', 'notation', 'instruments', 'tracks-ambient', 'tracks-battle', 'tracks-songs', 'sfx', 'player']
  .map(function (f) { return path.join('js', 'audio', f + '.js'); });
var store = {};
var win = {
  localStorage: {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem: function (k, v) { store[k] = String(v); }
  },
  setTimeout: setTimeout, setInterval: setInterval, clearInterval: clearInterval, console: console
};
win.window = win;
var ctx = vm.createContext(win);
FILES.forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), ctx, { filename: f });
});

var fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.error('FAIL: ' + msg); } else console.log('ok   ' + msg); }
function safe(label, fn) {
  try { fn(); ok(true, label); } catch (e) { ok(false, label + ' threw ' + e); }
}

var A = win.BT && win.BT.audio;
ok(!!A, 'BT.audio exists');

var TRACKS = ['title', 'town', 'tavern', 'temple', 'dungeon', 'crypt', 'tower', 'combat', 'boss', 'victory', 'gameover', 'ending',
  'combat_underground', 'combat_city', 'combat_wild'];
var SFX = ['step', 'bump', 'door', 'stairs', 'menu_move', 'menu_select', 'error', 'coin', 'chest', 'trap', 'hit', 'crit', 'miss',
  'block', 'monster_hit', 'monster_die', 'party_hurt', 'death', 'spell_fire', 'spell_ice', 'spell_lightning', 'spell_heal',
  'spell_holy', 'spell_dark', 'spell_generic', 'buff', 'debuff', 'poison', 'teleport', 'levelup', 'song', 'drink', 'encounter',
  'flee', 'victory_sting', 'roar', 'magic_mouth', 'page', 'quest'];

TRACKS.forEach(function (t) { ok(A.musicTracks.indexOf(t) >= 0, 'musicTracks has ' + t); });
SFX.forEach(function (s) { ok(A.sfxNames.indexOf(s) >= 0, 'sfxNames has ' + s); });

['init', 'music', 'sfx', 'setMusicVolume', 'setSfxVolume', 'getMusicVolume', 'getSfxVolume', 'toggleMute', 'isMuted']
  .forEach(function (f) { ok(typeof A[f] === 'function', 'has function ' + f); });

// calls before init
safe('music before init', function () { TRACKS.forEach(function (t) { A.music(t); }); A.music(null); A.music('nope'); A.music(); });
safe('sfx before init', function () { SFX.forEach(function (s) { A.sfx(s); A.sfx(s, { pitch: 1.5, volume: 0.3 }); }); A.sfx('nope'); A.sfx(); });
safe('init without AudioContext', function () { A.init(); A.init(); });
safe('music after failed init', function () { TRACKS.forEach(function (t) { A.music(t); A.music(t); }); A.music(null); });
safe('sfx after failed init', function () { SFX.forEach(function (s) { A.sfx(s, {}); }); });
safe('volume setters', function () { A.setMusicVolume(0.3); A.setSfxVolume(0.6); A.setMusicVolume(7); A.setSfxVolume(-1); A.setMusicVolume('x'); });
ok(A.getMusicVolume() === 0, 'music volume clamped/sanitised (got ' + A.getMusicVolume() + ')');
A.setMusicVolume(0.4); A.setSfxVolume(0.5);
ok(A.getMusicVolume() === 0.4 && A.getSfxVolume() === 0.5, 'volume getters');
var m0 = A.isMuted();
safe('toggleMute', function () { A.toggleMute(); });
ok(A.isMuted() === !m0, 'isMuted toggles');
A.toggleMute();
var saved = JSON.parse(store.bt_audio || '{}');
ok(saved.music === 0.4 && saved.sfx === 0.5, 'settings persisted in localStorage bt_audio');

// bard songs: separate list, safe no-ops without Web Audio, remembered before init
var SONGS = ['ward', 'march', 'hearth', 'lantern', 'lull', 'requiem', 'swift'];
ok(typeof A.song === 'function' && typeof A.currentSong === 'function', 'has song() and currentSong()');
ok(Array.isArray(A.songTracks) && A.songTracks.length === 7, 'songTracks lists 7 tracks');
SONGS.forEach(function (id) {
  ok(A.songTracks.indexOf('song_' + id) >= 0, 'songTracks has song_' + id);
  ok(A.musicTracks.indexOf('song_' + id) < 0, 'musicTracks does not list song_' + id + ' (combat picks battle themes from it)');
  var L = A._loopSeconds('song_' + id);
  ok(L && L.loop >= 30 && L.loop <= 70, 'song_' + id + ' loop is 30-70 s (' + (L && L.loop.toFixed(1)) + ' s)');
});
ok(A.currentSong() === null, 'no song by default');
safe('song() calls without Web Audio', function () { SONGS.forEach(function (id) { A.song(id); A.song(id); }); });
ok(A.currentSong() === 'swift', 'currentSong remembers the last requested song (got ' + A.currentSong() + ')');
safe('unknown song id ignored', function () { A.song('nope'); A.song(42); A.song('song_ward'); });
ok(A.currentSong() === 'swift', 'unknown ids leave the song unchanged');
safe('music() while a song is set', function () { A.music('combat_city'); A.music('town'); });
ok(A.currentSong() === 'swift', 'music() does not touch the song');
safe('song(null) / song()', function () { A.song(null); A.song('lull'); A.song(); });
ok(A.currentSong() === null, 'song() with no id stops the song');
ok(A._renderDuck('town', 'song_ward', 5, 1, 3) === null, '_renderDuck is null without OfflineAudioContext');

// track data sanity: every melody must exactly span its section
var info = A._trackInfo();
Object.keys(info).forEach(function (t) {
  info[t].forEach(function (sec, i) {
    var good = sec.melodyLens.every(function (l) { return l === sec.steps; });
    ok(good, t + (info[t].length > 1 ? ' [section ' + (i + 1) + ']' : '') + ': ' + sec.seconds + 's, ' + sec.steps + ' steps, melody lens ' + sec.melodyLens.join(','));
  });
});

console.log(fails ? '\n' + fails + ' FAILURE(S)' : '\nALL TESTS PASSED');
process.exit(fails ? 1 : 0);
