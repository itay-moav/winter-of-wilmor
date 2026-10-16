/* Velmoor audio, ambient tracks: title, town, tavern, temple, dungeon, crypt, tower, victory, gameover
 * and ending. Registered into the shared TRACKS table. */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var BT = root.BT = root.BT || {};
  var K = BT.AUDIO_INTERNAL = BT.AUDIO_INTERNAL || {}; // shared internals of the js/audio/ files
  var TRACKS = K.TRACKS, rep = K.rep, majorize = K.majorize;

  var TITLE_MEL =
    'A4:3 B4 C5:2 E5:2 | D5:4 C5:2 A4:2 | G4:3 A4 C5:2 G4:2 | B4:6 -:2 |' +
    'A4:3 B4 C5:2 E5:2 | F5:4 E5:2 D5:2 | E5:4 G#4:2 B4:2 | E5:6 -:2 |' +
    'A5:3 G5 F5:2 E5:2 | D5:3 E5 F5:2 D5:2 | E5:3 D5 B4:2 G4:2 | A4:6 -:2 |' +
    'F5:3 E5 D5:2 A4:2 | C5:3 B4 A4:2 E5:2 | G#4:3 A4 B4:2 E4:2 | A4:8';

  // Track definitions. bpm = beats/min, div = steps per beat, bar = steps per bar.
  var T = {
    title: {
      bpm: 76, div: 2, bar: 8, rev: 0.45,
      chords: 'Am F C G Am F E E F G Em Am Dm Am E Am',
      parts: [
        { t: 'mel', inst: 'horn', mel: TITLE_MEL, v: 0.9, vol: 1, rev: 0.35 },
        { t: 'mel', inst: 'strings', mel: TITLE_MEL, tr: -12, v: 0.35, vol: 0.6, rev: 0.5 },
        { t: 'arp', inst: 'harp', pat: [0, 1, 2, 3, 4, 3, 2, 1], oct: 3, dur: 2, v: 0.6, vol: 0.8, rev: 0.5 },
        { t: 'chord', inst: 'strings', pat: 'X.......', oct: 3, dur: 8, v: 0.6, vol: 0.7, rev: 0.6 },
        { t: 'bass', inst: 'bass', pat: 'X...x...', oct: 2, dur: 3.5, v: 0.55, vol: 0.8, rev: 0.2 },
        { t: 'bass', inst: 'timp', pat: 'X' + rep('.', 31), oct: 2, dur: 1, v: 0.6, vol: 0.8, rev: 0.4 }
      ]
    },
    town: {
      bpm: 100, div: 2, bar: 8, rev: 0.3,
      chords: 'Dm G Dm C Dm G Am Dm F C G Dm Am C Dm Dm',
      parts: [
        { t: 'mel', inst: 'lute', v: 0.9, vol: 1, rev: 0.25, mel:
          'D5 F5 A5 G5 F5:2 E5 D5 | B4:2 D5 G5 F5:2 E5:2 | D5 E5 F5 A5 G5 F5 E5 D5 | E5:3 C5 E5:2 G4:2 |' +
          'D5 F5 A5 B5 A5:2 G5 F5 | G5:2 B5 G5 D5:2 B4:2 | C5 D5 E5 C5 A4:2 E5:2 | D5:6 -:2 |' +
          'F5 G5 A5 C6 A5:2 F5:2 | G5 E5 C5 E5 G5:4 | B5:2 A5 G5 D5 B4 D5 G5 | F5:2 E5 D5 A4:4 |' +
          'A4 C5 E5 A5 G5 E5 C5 E5 | G5:3 F5 E5:2 C5:2 | D5 E5 F5 A5 G5 F5 E5 C5 | D5:6 -:2' },
        { t: 'arp', inst: 'lute', pat: [0, null, 2, null, 1, null, 2, null], oct: 3, dur: 2, v: 0.5, vol: 0.6, rev: 0.2 },
        { t: 'bass', inst: 'bass', pat: 'X...x...', oct: 2, dur: 3, v: 0.45, vol: 0.8, rev: 0.1 },
        { t: 'chord', inst: 'warm', pat: 'X.......', oct: 3, dur: 8, v: 0.35, vol: 0.5, rev: 0.4 },
        { t: 'drum', inst: 'frame', pat: 'X..x..x.X..x.ox.', v: 0.55, vol: 0.6, rev: 0.15 },
        { t: 'drum', inst: 'shaker', pat: '..x...x...x...xo', v: 0.6, vol: 0.5, rev: 0.1 },
        { t: 'rand', inst: 'bell', pat: 'x...x...', prob: 0.22, oct: 5, v: 0.4, vol: 0.6, rev: 0.6 }
      ]
    },
    tavern: {
      bpm: 116, div: 3, bar: 6, rev: 0.22,
      chords: 'D D G A D G A D D D G A D G A D G D G A Bm G A D G D G A Bm G A D',
      parts: [
        { t: 'mel', inst: 'flute', v: 0.85, vol: 1, rev: 0.2, mel:
          'F#5 A5 F#5 D5 F#5 A5 | B5:2 A5 F#5:2 D5 | G5 B5 G5 D5 G5 B5 | E5 F#5 E5 C#5 B4 A4 |' +
          'F#5 A5 F#5 D5 F#5 A5 | B5 A5 G5 F#5 E5 D5 | E5:2 F#5 E5 C#5 A4 | D5:3 D5 E5 F#5 |' +
          'F#5 A5 F#5 D5 F#5 A5 | B5:2 A5 F#5:2 D5 | G5 B5 G5 D5 G5 B5 | E5 F#5 E5 C#5 B4 A4 |' +
          'F#5 A5 F#5 D5 F#5 A5 | B5 A5 G5 F#5 E5 D5 | E5:2 F#5 E5 C#5 A4 | D5:3 -:3 |' +
          'G5:2 B5 D6:2 B5 | A5:2 F#5 D5:2 F#5 | G5 F#5 G5 B5 A5 G5 | E5 C#5 D5 E5:3 |' +
          'F#5 B5 F#5 D5 F#5 B5 | G5 B5 G5 D5 E5 F#5 | E5:2 A5 C#6 B5 A5 | D6:3 A5 F#5 E5 |' +
          'G5:2 B5 D6:2 B5 | A5:2 F#5 D5:2 F#5 | G5 F#5 G5 B5 A5 G5 | E5 C#5 D5 E5:3 |' +
          'F#5 B5 F#5 D5 F#5 B5 | G5 B5 G5 D5 E5 F#5 | E5:2 A5 C#6 B5 A5 | D5:3 -:3' },
        { t: 'arp', inst: 'lute', pat: [null, 1, 2, null, 1, 2], oct: 3, dur: 1, v: 0.5, vol: 0.6, rev: 0.15 },
        { t: 'bass', inst: 'bass', pat: 'X..x..', oct: 2, dur: 2, v: 0.5, vol: 0.8, rev: 0.05 },
        { t: 'drum', inst: 'frame', pat: 'X.xx.x|X.xx.x|X.xx.x|X.ox.xXo', v: 0.7, vol: 0.7, rev: 0.1 },
        { t: 'drum', inst: 'shaker', pat: '.x..x.', v: 0.5, vol: 0.4, rev: 0.05 }
      ]
    },
    temple: {
      gain: 1.6, bpm: 60, div: 2, bar: 8, rev: 0.7,
      chords: 'F C Dm Am Bb F Gm C F Am Bb F Dm Bb Csus4 F',
      parts: [
        { t: 'chord', inst: 'choir', pat: 'X.......', oct: 3, dur: 8.5, v: 0.55, vol: 0.9, rev: 0.7 },
        { t: 'mel', inst: 'bell', v: 0.55, vol: 0.8, rev: 0.6, mel:
          'A5:4 C6:4 | G5:4 E5:4 | F5:4 A5:2 D6:2 | C6:8 | D6:4 C6:2 Bb5:2 | A5:8 | Bb5:4 D6:2 G5:2 | E5:4 G5:4 |' +
          'F5:2 A5:2 C6:4 | E6:4 C6:4 | D6:2 C6:2 Bb5:4 | A5:8 | F5:4 A5:4 | D6:4 F6:4 | F5:4 G5:4 | F5:8' },
        { t: 'arp', inst: 'harp', pat: [0, null, 2, null, 4, null, 2, null], oct: 3, dur: 2, v: 0.3, vol: 0.5, rev: 0.6 },
        { t: 'bass', inst: 'subbass', pat: 'X.......', oct: 2, dur: 8, v: 0.5, vol: 0.7, rev: 0.3 }
      ]
    },
    dungeon: {
      gain: 1.5, bpm: 50, div: 2, bar: 8, rev: 0.75,
      chords: 'C5 C5 Db5 C5 Ab5 G5 C5 Db5 F5 G5',
      parts: [
        { t: 'chord', inst: 'drone', pat: 'X.......', oct: 1, dur: 9, v: 0.8, vol: 0.9, rev: 0.4 },
        { t: 'chord', inst: 'drone', pat: 'X.......', oct: 2, dur: 9, v: 0.45, vol: 0.7, rev: 0.6 },
        { t: 'mel', inst: 'ghost', v: 0.5, vol: 0.7, rev: 0.85, mel:
          '-:4 G4:2 Ab4:2 | G4:6 -:2 | -:2 F4:2 Ab4:2 Db5:2 | C5:8 | -:8 | -:4 Eb5:2 D5:2 | C5:4 B4:4 | -:4 Db5:2 C5:2 | -:8 | G4:6 -:2' },
        { t: 'mel', inst: 'chime', v: 0.25, vol: 0.6, rev: 0.9, mel:
          '-:8 | -:8 | -:8 | -:6 G5:2 | -:8 | -:8 | -:7 F#6:1 | -:8 | -:4 Db6:4 | -:8' },
        { t: 'rand', inst: 'drip', prob: 0.1, oct: 5, v: 0.7, vol: 0.6, rev: 0.9 },
        { t: 'drum', inst: 'wind', pat: 'X' + rep('.', 23), dur: 10, v: 0.7, vol: 0.6, rev: 0.5 },
        { t: 'drum', inst: 'kick', pat: rep('.', 32) + 'o.o.....' + rep('.', 8) + 'o.o.....' + rep('.', 24), v: 0.5, vol: 0.6, rev: 0.6 }
      ]
    },
    crypt: {
      gain: 1.4, bpm: 56, div: 2, bar: 8, rev: 0.75,
      chords: 'Dm Gm A Dm Bb Gm Edim A Gm Dm A Dm',
      parts: [
        { t: 'chord', inst: 'organ', pat: 'X.......', oct: 3, dur: 8, v: 0.6, vol: 0.85, rev: 0.6 },
        { t: 'bass', inst: 'organ', pat: 'X.......', oct: 2, dur: 8, v: 0.5, vol: 0.7, rev: 0.5 },
        { t: 'mel', inst: 'ghost', v: 0.7, vol: 0.9, rev: 0.8, mel:
          'A4:4 F4:2 D4:2 | G4:4 Bb4:4 | A4:2 C#5:2 E5:4 | D5:8 | F5:4 D5:2 Bb4:2 | G4:4 Bb4:2 D5:2 |' +
          'E5:2 G5:2 Bb4:4 | A4:8 | Bb4:4 A4:2 G4:2 | F4:4 A4:4 | E4:2 G4:2 C#5:4 | D5:8' },
        { t: 'bass', inst: 'bell', pat: 'X' + rep('.', 15), oct: 3, dur: 4, v: 0.5, vol: 0.6, rev: 0.8 },
        { t: 'drum', inst: 'wind', pat: 'X' + rep('.', 31), dur: 12, v: 0.5, vol: 0.5, rev: 0.5 }
      ]
    },
    tower: {
      gain: 1.3, bpm: 112, div: 4, bar: 16, rev: 0.5,
      chords: 'Em C Am B Em C F#dim B Am Em C B Em G F B',
      parts: [
        { t: 'arp', inst: 'glass', pat: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1], oct: 4, dur: 1, v: 0.55, vol: 0.7, rev: 0.5 },
        { t: 'mel', inst: 'flute', v: 0.7, vol: 0.8, rev: 0.55, mel:
          'E5:12 F#5:4 | G5:12 E5:4 | A5:8 C6:8 | B5:16 | E5:12 F#5:4 | G5:8 B5:8 | A5:8 C6:8 | B5:8 D#5:8 |' +
          'C6:8 B5:4 A5:4 | G5:8 E5:8 | E5:8 G5:8 | F#5:16 | B5:8 A5:4 G5:4 | D6:8 B5:8 | C6:8 A5:8 | B5:16' },
        { t: 'chord', inst: 'pad', pat: 'X.......X.......', oct: 3, dur: 7, v: 0.4, vol: 0.6, rev: 0.6 },
        { t: 'bass', inst: 'bass', pat: 'x.o.x.o.x.o.x.o.', oct: 2, dur: 1.5, v: 0.5, vol: 0.7, rev: 0.1 },
        { t: 'drum', inst: 'hat', pat: 'x.o.x.oox.o.x.oo', v: 0.5, vol: 0.5, rev: 0.3 },
        { t: 'rand', inst: 'chime', pat: 'x...............', prob: 0.5, oct: 6, v: 0.3, vol: 0.5, rev: 0.8 }
      ]
    },
    victory: {
      intro: {
        bpm: 120, div: 2, bar: 8, rev: 0.4,
        chords: 'C F G C',
        parts: [
          { t: 'mel', inst: 'horn', v: 1, vol: 1, rev: 0.35, mel:
            'C5 C5 C5 G5:3 E5:2 | F5 F5 F5 A5:3 F5:2 | G5:2 A5 B5 D6:2 B5:2 | C6:8' },
          { t: 'mel', inst: 'horn', v: 0.6, vol: 0.8, rev: 0.35, mel:
            'E4 E4 E4 C5:3 G4:2 | A4 A4 A4 C5:3 A4:2 | B4:2 C5 D5 G5:2 D5:2 | E5:8' },
          { t: 'chord', inst: 'strings', pat: 'X.......', oct: 3, dur: 8, v: 0.5, vol: 0.6, rev: 0.4 },
          { t: 'bass', inst: 'timp', pat: 'X.x.X...', oct: 2, dur: 1, v: 0.8, vol: 0.8, rev: 0.3 },
          { t: 'drum', inst: 'snare', pat: 'xxxx....', v: 0.5, vol: 0.6, rev: 0.3 },
          { t: 'drum', inst: 'crash', pat: rep('.', 24) + 'X.......', v: 0.8, vol: 0.6, rev: 0.3 }
        ]
      },
      bpm: 92, div: 2, bar: 8, rev: 0.45,
      chords: 'C F G C Am F G C F C G C',
      parts: [
        { t: 'mel', inst: 'flute', v: 0.8, vol: 0.9, rev: 0.4, mel:
          'E5:2 G5:2 C6:4 | A5:2 G5:2 F5:4 | D5:2 E5 F5 G5:4 | E5:8 | C5:2 E5:2 A5:4 | A5:2 C6:2 F5:4 |' +
          'B5:2 A5 G5 D5:4 | C5:8 | F5:2 A5:2 C6:4 | G5:2 E5:2 C5:4 | D5:2 G5:2 B5:4 | C6:8' },
        { t: 'arp', inst: 'harp', pat: [0, 1, 2, 3, 4, 3, 2, 1], oct: 3, dur: 2, v: 0.5, vol: 0.7, rev: 0.45 },
        { t: 'chord', inst: 'warm', pat: 'X.......', oct: 3, dur: 8, v: 0.45, vol: 0.6, rev: 0.5 },
        { t: 'bass', inst: 'bass', pat: 'X...x...', oct: 2, dur: 3, v: 0.4, vol: 0.7, rev: 0.1 },
        { t: 'drum', inst: 'frame', pat: 'o.......o...o...', v: 0.5, vol: 0.5, rev: 0.2 }
      ]
    },
    gameover: {
      bpm: 54, div: 2, bar: 8, rev: 0.65,
      chords: 'Gm Eb Cm D Gm Bb Eb Cm D Gm',
      parts: [
        { t: 'mel', inst: 'flute', v: 0.75, vol: 0.9, rev: 0.55, mel:
          'D5:4 Bb4:2 A4:2 | G4:6 Bb4:2 | Eb5:4 D5:2 C5:2 | A4:4 F#4:4 | G4:2 Bb4:2 D5:4 |' +
          'F5:4 D5:2 Bb4:2 | G5:4 F5:2 Eb5:2 | Eb5:2 D5:2 C5:4 | A4:4 F#4:2 A4:2 | G4:8' },
        { t: 'chord', inst: 'strings', pat: 'X.......', oct: 3, dur: 8, v: 0.5, vol: 0.7, rev: 0.6 },
        { t: 'arp', inst: 'harp', pat: [0, null, 1, null, 2, null, 1, null], oct: 3, dur: 2, v: 0.45, vol: 0.6, rev: 0.6 },
        { t: 'bass', inst: 'subbass', pat: 'X.......', oct: 2, dur: 8, v: 0.55, vol: 0.7, rev: 0.3 }
      ]
    },
    ending: {
      bpm: 66, div: 2, bar: 8, rev: 0.5,
      chords: 'A D C#m E A D E E D Bm E A D A E A',
      parts: [
        { t: 'mel', inst: 'flute', mel: TITLE_MEL, xf: majorize, v: 0.85, vol: 1, rev: 0.45 },
        { t: 'mel', inst: 'strings', mel: TITLE_MEL, xf: majorize, tr: -12, v: 0.3, vol: 0.55, rev: 0.5 },
        { t: 'arp', inst: 'harp', pat: [0, 1, 2, 4, 5, 4, 2, 1], oct: 3, dur: 2, v: 0.55, vol: 0.75, rev: 0.5 },
        { t: 'chord', inst: 'warm', pat: 'X.......', oct: 3, dur: 8.5, v: 0.5, vol: 0.65, rev: 0.6 },
        { t: 'bass', inst: 'bass', pat: 'X...x...', oct: 2, dur: 3.5, v: 0.45, vol: 0.75, rev: 0.15 },
        { t: 'rand', inst: 'bell', pat: 'x.......', prob: 0.35, oct: 5, v: 0.35, vol: 0.6, rev: 0.7 }
      ]
    }
  };
  for (var k in T) TRACKS[k] = T[k];
})();
