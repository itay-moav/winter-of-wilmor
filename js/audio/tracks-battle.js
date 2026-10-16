/* Velmoor audio, battle tracks: the classic combat and boss themes and the folk-metal battle music
 * by terrain (combat_underground, combat_city, combat_wild). Registered into the shared TRACKS table. */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var BT = root.BT = root.BT || {};
  var K = BT.AUDIO_INTERNAL = BT.AUDIO_INTERNAL || {}; // shared internals of the js/audio/ files
  var TRACKS = K.TRACKS, rep = K.rep;

  TRACKS.combat = {
    bpm: 152, div: 2, bar: 8, rev: 0.25,
    chords: 'Cm Cm Ab Bb Cm Cm Ab G Fm Ab Bb Cm Fm Ab G G Ab Bb Cm Cm Ab Bb G G',
    parts: [
      { t: 'mel', inst: 'horn', v: 0.95, vol: 1, rev: 0.25, mel:
        'G4:2 C5:2 D5 Eb5 F5:2 | G5:6 Eb5:2 | F5:2 Eb5:2 C5:4 | D5:2 Eb5 F5 D5:4 |' +
        'G4:2 C5:2 D5 Eb5 F5:2 | G5:4 Bb5:2 G5:2 | Ab5:3 G5 F5:2 Eb5:2 | D5:2 B4:2 G4:4 |' +
        'F5:2 Ab5:2 C6:4 | C6:2 Bb5 Ab5 Eb5:4 | F5:2 Bb5:2 D5:2 F5:2 | G5:8 |' +
        'Ab5:2 G5:2 F5:2 C5:2 | Eb5:2 F5:2 Ab5:4 | G5:2 F5:2 D5:2 B4:2 | B4:4 D5:4 |' +
        'C5:2 Eb5:2 Ab5:4 | Bb4:2 D5:2 F5:4 | G5:2 F5 Eb5 C5:4 | Eb5:2 G5:2 C6:4 |' +
        'C6:3 Bb5 Ab5:2 Eb5:2 | D5:2 F5:2 Bb5:4 | B5:4 G5:2 D5:2 | G5:4 F5:2 D5:2' },
      { t: 'bass', inst: 'bass', pat: 'XxxxXxxx', offs: [0, 0, 12, 0, 0, 7, 0, 12], oct: 1, dur: 0.85, v: 0.7, vol: 0.9, rev: 0.05 },
      { t: 'chord', inst: 'strings', pat: 'X.......', oct: 3, dur: 8, v: 0.45, vol: 0.55, rev: 0.4 },
      { t: 'chord', inst: 'lute', pat: '..x...x.', oct: 4, dur: 1, v: 0.35, vol: 0.5, rev: 0.2 },
      { t: 'drum', inst: 'kick', pat: 'X..xX.x.X..xX.x.X..xX.x.X.xxX.X.', v: 0.9, vol: 0.9, rev: 0.1 },
      { t: 'drum', inst: 'snare', pat: '..X...X...X...X...X...X...X.xXxX', v: 0.8, vol: 0.8, rev: 0.25 },
      { t: 'drum', inst: 'hat', pat: 'xoxoxoxo', v: 0.7, vol: 0.6, rev: 0.1 },
      { t: 'drum', inst: 'tom', f: 90, pat: rep('.', 120) + 'X.x.', v: 0.7, vol: 0.7, rev: 0.3 },
      { t: 'drum', inst: 'crash', pat: 'X' + rep('.', 63), v: 0.7, vol: 0.6, rev: 0.3 }
    ]
  };
  TRACKS.boss = {
    bpm: 168, div: 2, bar: 8, rev: 0.35,
    chords: 'F#m F#m G F#m F#m F#m D C# Bm Bm G G F#m F#m C# C# F#m F#m G F#m F#m F#m D C# D C G C#',
    parts: [
      { t: 'mel', inst: 'horn', v: 0.9, vol: 0.9, rev: 0.3, mel:
        'F#4:2 C#5:2 F#5:4 | E5 D5 C#5:2 A4:4 | B4:2 D5:2 G5:4 | F#5:6 -:2 | A5:2 G#5 F#5 C#5:4 | F#5:2 E5:2 C#5:4 | D5:2 F#5:2 A5:4 | G#5:4 F5:2 C#5:2 |' +
        'B4:2 D5:2 F#5:4 | F#5:2 E5:2 D5:4 | D5:2 G5:2 B5:4 | A5:2 G5:2 D5:4 | C#5:2 F#5:2 A5:4 | G#5:2 A5:2 C#6:4 | C#6:4 B5:2 G#5:2 | F5:4 G#5:4 |' +
        'F#4:2 C#5:2 F#5:4 | E5 D5 C#5:2 A4:4 | B4:2 D5:2 G5:4 | F#5:6 -:2 | A5:2 G#5 F#5 C#5:4 | F#5:2 E5:2 C#5:4 | D5:2 F#5:2 A5:4 | G#5:4 F5:2 C#5:2 |' +
        'A5:4 F#5:4 | G5:4 E5:4 | D5:4 B4:4 | C#5:2 F5:2 G#5:4' },
      { t: 'chord', inst: 'organ', pat: 'X..X..X.', oct: 3, dur: 1.2, v: 0.75, vol: 0.8, rev: 0.4 },
      { t: 'chord', inst: 'choir', pat: 'X.......', oct: 3, dur: 7, v: 0.6, vol: 0.7, rev: 0.5 },
      { t: 'bass', inst: 'bass', pat: 'XxxxXxxx', offs: [0, 0, 1, 0, 0, 0, 1, 0], oct: 1, dur: 0.85, v: 0.75, vol: 0.9, rev: 0.05 },
      { t: 'drum', inst: 'kick', pat: 'X.x.X.x.X.x.XxXx', v: 0.9, vol: 0.9, rev: 0.1 },
      { t: 'drum', inst: 'snare', pat: '..X...X...X..XXX', v: 0.8, vol: 0.75, rev: 0.25 },
      { t: 'drum', inst: 'hat', pat: 'xxxxxxxx', v: 0.6, vol: 0.5, rev: 0.1 },
      { t: 'bass', inst: 'timp', pat: 'X' + rep('.', 15), oct: 2, dur: 1, v: 0.8, vol: 0.8, rev: 0.4 },
      { t: 'drum', inst: 'crash', pat: 'X' + rep('.', 63), v: 0.7, vol: 0.6, rev: 0.3 }
    ]
  };
  // ---------------------------------------------------------------- folk-metal battle tracks
  (function () {
    var R16 = rep('.', 16), R12 = rep('.', 12);

    // --- combat_underground: D Phrygian, down-tuned chugs, doom-fast; hurdy-gurdy lead in echo/reverb
    // A (riff) | A' (riff + double-kick bursts) | B (open chords, half-time, double kick) | B' (chugs + double kick)
    var uMel =
      'D5:6 Eb5:2 F5:4 Eb5:4 | D5:8 A4:8 | G5:6 F5:2 Eb5:4 Bb4:4 | D5:12 -:4 |' +
      'F5:6 G5:2 A5:4 G5:2 F5:2 | Eb5:6 F5:2 D5:8 | D5:4 F5:4 Bb5:8 | C6:6 Bb5:2 G5:4 Eb5:4 |' +
      'D5:6 Eb5:2 F5:4 Eb5:4 | D5:8 A4:8 | G5:6 F5:2 Eb5:4 Bb4:4 | D5:12 -:4 |' +
      'F5:6 G5:2 A5:4 G5:2 F5:2 | Eb5:6 F5:2 D5:8 | D5:4 F5:4 Bb4:8 | C5:6 Bb4:2 C5:4 -:4 |' +
      'Bb5:12 A5:4 | G5:8 D5:8 | Eb5:12 F5:4 | G5:8 Bb5:8 | F5:12 Eb5:4 | D5:8 F5:8 | A4:8 E5:8 | C#5:12 -:4 |' +
      'D6:8 C6:4 Bb5:4 | G5:8 Bb5:4 G5:4 | F5:8 D5:8 | C5:8 F5:4 A5:4 | Bb5:8 A5:4 G5:4 | G5:8 Eb5:8 | E5:6 F5:2 E5:4 C#5:4 | A4:12 -:4';
    var uChugBar = 'X.xxX.xxX.xxX.xx', uOffs = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1];
    var uFill = rep(R16, 7) + '............X.x.', uFill2 = rep(R16, 7) + '.............x.X';
    TRACKS.combat_underground = {
      bpm: 150, div: 4, bar: 16, rev: 0.3, gain: 0.9,
      drone: { root: 'D2', kind: 'gurdy', vol: 0.035, rev: 0.4 },
      chords: 'D5 D5 Eb5 D5 D5 D5 Bb5 C5 D5 D5 Eb5 D5 D5 D5 Bb5 C5 G5 G5 Eb5 Eb5 Bb5 Bb5 A5 A5 G5 Eb5 Bb5 F5 G5 Eb5 A5 A5',
      parts: [
        { t: 'mel', inst: 'gurdy', mel: uMel, tr: -12, v: 0.9, vol: 0.85, rev: 0.6, fx: 'echo', echo: 3, fb: 0.38, wet: 0.45 },
        { t: 'bass', inst: 'chug', fx: 'dist', pat: rep(uChugBar, 16) + rep(R16, 8) + rep(uChugBar, 8), offs: uOffs, oct: 2, dur: 1, v: 0.9, vol: 1, rev: 0.08 },
        { t: 'bass', inst: 'gtr', fx: 'dist', pat: rep(R16, 16) + rep('X.......X.......', 8) + rep(R16, 8), oct: 2, dur: 8, v: 0.9, vol: 0.9, rev: 0.25 },
        { t: 'bass', inst: 'bass', pat: rep('X.x.X.x.X.x.X.x.', 16) + rep('X.......X.......', 8) + rep('X.x.X.x.X.x.X.x.', 8), offs: uOffs, oct: 1, dur: 1.8, v: 0.75, vol: 0.55, rev: 0.03 },
        { t: 'drum', inst: 'mkick', pat: rep('X.x.X.x.X.xxX.x.', 8) + rep('X.x.X.x.X.x.xxxx', 8) + rep('xXxXxXxXxXxXxXxX', 16), v: 0.8, vol: 0.85, rev: 0.05 },
        { t: 'drum', inst: 'msnare', pat: rep('....X.......X...', 16) + rep('........X.......', 8) + rep('....X.......X...', 8), v: 0.85, vol: 1, rev: 0.3 },
        { t: 'drum', inst: 'hat', pat: rep('x.o.x.o.x.o.x.o.', 16) + rep(R16, 16), v: 0.8, vol: 0.6, rev: 0.1 },
        { t: 'drum', inst: 'ride', pat: rep(R16, 16) + rep('X...x...X...x...', 16), v: 0.8, vol: 0.6, rev: 0.2 },
        { t: 'drum', inst: 'crash', pat: rep('X' + rep('.', 127), 4), v: 0.8, vol: 0.6, rev: 0.3 },
        { t: 'drum', inst: 'wartom', f: 110, pat: rep(uFill, 4), v: 0.8, vol: 0.7, rev: 0.3 },
        { t: 'drum', inst: 'wartom', f: 70, pat: rep(uFill2, 4), v: 0.9, vol: 0.7, rev: 0.3 }
      ]
    };

    // --- combat_city: A Mixolydian 12/8 jig-metal gallop; Highland pipes + tin whistle, gang shouts
    var cA = 'E5:3 A5:2 E5:1 C#5:2 A4:1 C#5:2 E5:1 | A5:2 B5:1 A5:2 F#5:1 E5:3 C#5:3 | D5:2 B4:1 G4:2 B4:1 D5:3 G5:3 |' +
      'F#5:2 E5:1 D5:2 E5:1 F#5:2 A5:1 F#5:2 D5:1 | E5:3 A5:2 E5:1 C#5:2 A4:1 C#5:2 E5:1 |' +
      'A5:2 B5:1 A5:2 F#5:1 E5:2 C#5:1 E5:2 F#5:1 |';
    var cB = 'F#5:6 A5:6 | E5:6 C#5:3 A4:3 | D5:6 B4:3 D5:3 | E5:9 A5:3 | A5:6 F#5:3 A5:3 | E5:6 C#5:3 E5:3 |' +
      'B4:3 D5:3 E5:3 G5:3 | F#5:3 E5:3 D5:3 B4:3 |' +
      'C#5:3 F#5:3 A5:6 | F#5:3 E5:3 D5:6 | E5:3 C#5:3 A4:3 C#5:3 | B4:6 E5:6 | F#5:3 A5:3 F#5:3 C#5:3 |' +
      'D5:3 F#5:3 A5:6 | G5:3 F#5:3 E5:3 D5:3 | A4:6 E5:3 A4:3';
    var cMel = cA + 'G5:3 F#5:2 E5:1 D5:2 B4:1 G4:3 | E5:6 B4:3 E5:3 |' +
      cA + 'G5:2 F#5:1 E5:2 D5:1 B4:2 G4:1 B4:2 D5:1 | A4:9 -:3 |' + cB;
    var gal = 'X.xX.xX.xX.x';
    TRACKS.combat_city = {
      bpm: 140, div: 3, bar: 12, rev: 0.25, gain: 0.9,
      drone: { root: 'A2', kind: 'pipe', vol: 0.04, rev: 0.3 },
      chords: 'A5 A5 G5 D5 A5 A5 G5 E5 A5 A5 G5 D5 A5 A5 G5 A5 D5 A5 G5 A5 D5 A5 E5 E5 F#5 D5 A5 E5 F#5 D5 G5 A5',
      parts: [
        { t: 'mel', inst: 'pipe', mel: cMel, v: 0.9, vol: 0.9, rev: 0.3 },
        { t: 'mel', inst: 'flute', mel: '-:192 |' + cB, tr: 12, v: 0.5, vol: 0.55, rev: 0.3 },
        { t: 'bass', inst: 'chug', fx: 'dist', pat: rep(gal, 16) + rep('XxxXxxXxxXxx', 8) + rep(gal, 8), oct: 2, dur: 1, v: 0.9, vol: 0.95, rev: 0.08 },
        { t: 'bass', inst: 'gtr', fx: 'dist', pat: rep(R12, 24) + rep('X.....X.....', 8), oct: 2, dur: 6, v: 0.8, vol: 0.7, rev: 0.2 },
        { t: 'bass', inst: 'bass', pat: rep(gal, 32), oct: 1, dur: 1.5, v: 0.7, vol: 0.55, rev: 0.03 },
        { t: 'chord', inst: 'shout', pat: rep(R12, 8) + rep(R12 + '.........X..', 4) + rep(R12, 8) + rep('X.....X.....', 8), oct: 3, v: 0.7, vol: 0.6, rev: 0.4 },
        { t: 'drum', inst: 'mkick', pat: rep(gal, 15) + 'X.xX.xXxxXxx' + rep('X..X..X..X..', 8) + rep('XxxXxxXxxXxx', 8), v: 0.8, vol: 0.85, rev: 0.05 },
        { t: 'drum', inst: 'msnare', pat: rep(rep('...X.....X..', 7) + '...X.....XXX', 4), v: 0.8, vol: 1, rev: 0.25 },
        { t: 'drum', inst: 'tamb', pat: rep('..x..x..x..x', 16) + rep('x.xx.xx.xx.x', 16), v: 0.8, vol: 0.6, rev: 0.15 },
        { t: 'drum', inst: 'frame', pat: rep('X..x..X..x..', 32), v: 0.5, vol: 0.5, rev: 0.15 },
        { t: 'drum', inst: 'crash', pat: rep('X' + rep('.', 95), 4), v: 0.8, vol: 0.6, rev: 0.3 }
      ]
    };

    // --- combat_wild: E Dorian epic; A (132 bpm: open chords, war drums) -> B (160 bpm lift: chugs, double kick)
    var wA = 'B4:8 E5:4 F#5:4 | G5:6 F#5:2 E5:4 D5:4 | E5:8 C#5:4 A4:4 | B4:16 | B4:8 E5:4 F#5:4 | A5:6 G5:2 F#5:4 D5:4 |' +
      'G5:8 B5:4 A5:4 | E5:12 C#5:4 | E5:4 F#5:4 G5:4 A5:4 | B5:8 A5:4 F#5:4 | A5:6 G5:2 E5:4 C#5:4 | E5:16 |' +
      'D5:4 G5:4 B5:8 | A5:6 G5:2 F#5:8 | E5:4 C#5:4 E5:4 A5:4 | C#5:8 E5:4 A5:4';
    var wB = 'B5:8 A5:4 G5:4 | F#5:8 A5:8 | E5:8 C#5:4 E5:4 | B4:8 E5:8 | G5:4 A5:4 B5:8 | A5:4 F#5:4 D5:8 |' +
      'E5:4 F#5:4 G5:4 A5:4 | A5:16 | B5:6 A5:2 G5:4 E5:4 | F#5:6 E5:2 D5:4 F#5:4 | E5:6 C#5:2 A4:8 | B4:4 D5:4 E5:8 |' +
      'G5:8 B5:8 | A5:6 G5:2 E5:8 | F#5:8 D#5:8 | E5:16';
    var fillHi = rep(R16, 7) + '........X.x.X...', fillLo = rep(R16, 7) + '.........x.x.XxX';
    TRACKS.combat_wild = {
      drone: { root: 'E2', kind: 'pipe', vol: 0.04, rev: 0.4 },
      seq: [
        { bpm: 132, div: 4, bar: 16, rev: 0.4, gain: 0.9,
          chords: 'E5 D5 A5 E5 E5 D5 G5 A5 E5 D5 A5 E5 G5 D5 A5 A5',
          parts: [
            { t: 'mel', inst: 'pipe', mel: wA, v: 0.9, vol: 0.85, rev: 0.4 },
            { t: 'mel', inst: 'horn', mel: wA, tr: -12, v: 0.8, vol: 0.75, rev: 0.4 },
            { t: 'bass', inst: 'gtr', fx: 'dist', pat: rep('X...............', 16), oct: 2, dur: 16, v: 0.9, vol: 0.9, rev: 0.3 },
            { t: 'bass', inst: 'chug', fx: 'dist', pat: rep(R16, 8) + rep('x.x.x.x.x.x.x.x.', 8), oct: 2, dur: 1, v: 0.7, vol: 0.7, rev: 0.1 },
            { t: 'bass', inst: 'bass', pat: rep('X.......X.......', 8) + rep('X.x.X.x.X.x.X.x.', 8), oct: 1, dur: 7, v: 0.7, vol: 0.55, rev: 0.05 },
            { t: 'drum', inst: 'wartom', f: 70, pat: rep('X..x..X.X.......', 16), v: 0.9, vol: 0.8, rev: 0.4 },
            { t: 'drum', inst: 'wartom', f: 120, pat: rep('..........X.x.x.', 16), v: 0.7, vol: 0.7, rev: 0.4 },
            { t: 'drum', inst: 'mkick', pat: rep('X.......X.......', 8) + rep('X.......X.x.....', 8), v: 0.8, vol: 0.85, rev: 0.1 },
            { t: 'drum', inst: 'msnare', pat: rep('........X.......', 8) + rep('....X.......X...', 7) + '....X.......XXXX', v: 0.85, vol: 1, rev: 0.4 },
            { t: 'drum', inst: 'crash', pat: rep('X' + rep('.', 63), 4), v: 0.8, vol: 0.6, rev: 0.4 }
          ] },
        { bpm: 160, div: 4, bar: 16, rev: 0.3, gain: 0.9,
          chords: 'G5 D5 A5 E5 G5 D5 A5 A5 E5 D5 A5 E5 G5 A5 B5 E5',
          parts: [
            { t: 'mel', inst: 'pipe', mel: wB, v: 0.9, vol: 0.85, rev: 0.35 },
            { t: 'mel', inst: 'horn', mel: wB, tr: -12, v: 0.8, vol: 0.7, rev: 0.35 },
            { t: 'bass', inst: 'chug', fx: 'dist', pat: rep('X.xxX.xxX.xxX.xx', 16), oct: 2, dur: 1, v: 0.9, vol: 0.95, rev: 0.08 },
            { t: 'bass', inst: 'gtr', fx: 'dist', pat: rep('X...............', 16), oct: 3, dur: 8, v: 0.6, vol: 0.55, rev: 0.25 },
            { t: 'bass', inst: 'bass', pat: rep('X.x.X.x.X.x.X.x.', 16), oct: 1, dur: 1.8, v: 0.75, vol: 0.55, rev: 0.03 },
            { t: 'drum', inst: 'mkick', pat: rep('X.xxX.xxX.xxX.xx', 8) + rep('xXxXxXxXxXxXxXxX', 8), v: 0.8, vol: 0.85, rev: 0.05 },
            { t: 'drum', inst: 'msnare', pat: rep('....X.......X...', 16), v: 0.85, vol: 1, rev: 0.3 },
            { t: 'drum', inst: 'ride', pat: rep('X.x.X.x.X.x.X.x.', 16), v: 0.7, vol: 0.55, rev: 0.2 },
            { t: 'drum', inst: 'wartom', f: 120, pat: rep(fillHi, 2), v: 0.8, vol: 0.7, rev: 0.3 },
            { t: 'drum', inst: 'wartom', f: 75, pat: rep(fillLo, 2), v: 0.9, vol: 0.7, rev: 0.3 },
            { t: 'drum', inst: 'crash', pat: rep('X' + rep('.', 63), 4), v: 0.8, vol: 0.6, rev: 0.3 }
          ] }
      ]
    };
  })();
})();
