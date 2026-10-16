/* Velmoor audio, bard songs: seven arrangements of public-domain melodies, one per bard song. They play
 * on their own bus over the ducked regular music (see song() in player.js). Registered into TRACKS. */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var BT = root.BT = root.BT || {};
  var K = BT.AUDIO_INTERNAL = BT.AUDIO_INTERNAL || {}; // shared internals of the js/audio/ files
  var TRACKS = K.TRACKS, rep = K.rep, trMel = K.trMel, stacc = K.stacc, rests = K.rests;

  // Each song is an arrangement of a public-domain melody.
  (function () {
    // --- song_ward: Warding Hymn. Beethoven, Symphony No. 9, "Ode to Joy" (1824). D major power-metal anthem.
    // 16th-note steps, half-bar chords. Verse: choir + horns; chorus: horns an octave up, double kick.
    var odeA = 'F#4:4 F#4:4 G4:4 A4:4 | A4:4 G4:4 F#4:4 E4:4 | D4:4 D4:4 E4:4 F#4:4 |';
    var ode = odeA + 'F#4:6 E4:2 E4:8 |' + odeA + 'E4:6 D4:2 D4:8 |' +
      'E4:4 E4:4 F#4:4 D4:4 | E4:4 F#4:2 G4:2 F#4:4 D4:4 | E4:4 F#4:2 G4:2 F#4:4 E4:4 | D4:4 E4:4 A3:8 |' +
      odeA + 'E4:6 D4:2 D4:8';
    var odeCh = 'D D A7 D D A D A  D D A7 D D A A D  A D A D A D E7 A  D D A7 D D A A D';
    var B16 = rep('.', 16);
    TRACKS.song_ward = {
      seq: [
        { bpm: 120, div: 4, bar: 8, rev: 0.4, gain: 0.85, chords: odeCh,
          parts: [
            { t: 'mel', inst: 'choir', mel: ode, v: 0.85, vol: 0.8, rev: 0.5 },
            { t: 'mel', inst: 'horn', mel: ode, v: 0.85, vol: 0.85, rev: 0.4 },
            { t: 'mel', inst: 'horn', mel: ode, tr: -12, v: 0.6, vol: 0.6, rev: 0.35 },
            { t: 'bass', inst: 'gtr', fx: 'dist', pat: 'X.......', oct: 2, dur: 7.6, v: 0.85, vol: 0.8, rev: 0.25 },
            { t: 'bass', inst: 'bass', pat: 'X.x.X.x.', oct: 1, dur: 1.8, v: 0.7, vol: 0.55, rev: 0.03 },
            { t: 'drum', inst: 'mkick', pat: 'X.x.X.x.X.x.X.x.', v: 0.8, vol: 0.8, rev: 0.05 },
            { t: 'drum', inst: 'msnare', pat: '....X.......X...', v: 0.8, vol: 0.9, rev: 0.35 },
            { t: 'drum', inst: 'hat', pat: 'x.o.x.o.x.o.x.o.', v: 0.7, vol: 0.5, rev: 0.1 },
            { t: 'drum', inst: 'crash', pat: 'X' + rep('.', 127), v: 0.7, vol: 0.55, rev: 0.4 },
            { t: 'drum', inst: 'wartom', f: 75, pat: rep(B16, 15) + '........X.x.X.XX', v: 0.8, vol: 0.6, rev: 0.3 }
          ] },
        { bpm: 120, div: 4, bar: 8, rev: 0.4, gain: 0.85, chords: odeCh,
          parts: [
            { t: 'mel', inst: 'horn', mel: ode, tr: 12, v: 0.9, vol: 0.85, rev: 0.4 },
            { t: 'mel', inst: 'horn', mel: ode, v: 0.7, vol: 0.7, rev: 0.4 },
            { t: 'mel', inst: 'choir', mel: ode, v: 0.8, vol: 0.7, rev: 0.5 },
            { t: 'chord', inst: 'choir', pat: 'X.......', oct: 3, dur: 8, v: 0.35, vol: 0.5, rev: 0.6 },
            { t: 'chord', inst: 'organ', pat: 'X.......', oct: 3, dur: 8, v: 0.4, vol: 0.45, rev: 0.5 },
            { t: 'bass', inst: 'gtr', fx: 'dist', pat: 'X.......', oct: 2, dur: 7.6, v: 0.9, vol: 0.85, rev: 0.25 },
            { t: 'bass', inst: 'chug', fx: 'dist', pat: '..x.x.x.', oct: 2, dur: 1, v: 0.6, vol: 0.55, rev: 0.08 },
            { t: 'bass', inst: 'bass', pat: 'XxXxXxXx', oct: 1, dur: 0.9, v: 0.7, vol: 0.55, rev: 0.03 },
            { t: 'drum', inst: 'mkick', pat: 'XxXxXxXxXxXxXxXx', v: 0.75, vol: 0.8, rev: 0.05 },
            { t: 'drum', inst: 'msnare', pat: rep('....X.......X...', 15) + '....X.......XXXX', v: 0.85, vol: 0.95, rev: 0.35 },
            { t: 'drum', inst: 'ride', pat: 'X...x...X...x...', v: 0.7, vol: 0.55, rev: 0.2 },
            { t: 'drum', inst: 'crash', pat: 'X' + rep('.', 63), v: 0.75, vol: 0.55, rev: 0.4 }
          ] }
      ]
    };

    // --- song_march: March of Iron. Prokofiev, March from "The Love for Three Oranges" (1919). Heavy stomping march.
    // Melody from Prokofiev's own piano transcription (Op. 33ter), written pitch; 16th steps, half-bar chords; 3 passes.
    var mar = 'Eb4:2 -:2 F4:2 -:2 Eb4:2 -:2 Ab4:2 -:2 | B4:2 -:1 B4:1 Ab4:12 | C5:2 -:1 C5:1 Ab4:4 B4:2 -:1 B4:1 A4:4 |' +
      'Eb5:2 -:1 Eb5:1 A4:12 | G4:2 Ab4:1 Bb4:1 B4:4 G4:2 Ab4:1 Bb4:1 B4:4 | C5:2 D5:1 E5:1 Eb5:4 C5:2 D5:1 E5:1 Eb5:4 |' +
      '-:4 C5:2 C5:1 C5:1 Bb4:4 Ab4:4 | -:4 Bb4:4 F#4:6 Eb4:1 Eb4:1 |';
    var marCh = 'Ab5 Ab5 Ab5 Ab5 Ab5 F5 Eb5 A5 Eb5 Eb5 C5 C5 Ab5 Ab5 Bb5 D5 ';
    var P8 = rep('.', 128);
    TRACKS.song_march = {
      bpm: 116, div: 4, bar: 8, rev: 0.3, gain: 0.85,
      chords: rep(marCh, 3),
      parts: [
        { t: 'mel', inst: 'horn', mel: mar + mar + trMel(mar, 12), v: 0.95, vol: 0.9, rev: 0.3 },
        { t: 'mel', inst: 'horn', mel: trMel(mar, -12) + mar + mar, v: 0.7, vol: 0.7, rev: 0.3 },
        { t: 'mel', inst: 'gurdy', mel: rests(128) + stacc(mar, 0.7) + stacc(mar, 0.7), v: 0.6, vol: 0.45, rev: 0.3 },
        // palm-muted stomps on every beat, with 16th pushes in later passes
        { t: 'bass', inst: 'chug', fx: 'dist', pat: rep('X...X...X...X...', 8) + rep('X..xX...X..xX.x.', 8) + rep('X.xxX.xxX.xxX.xx', 8), oct: 2, dur: 1, v: 0.95, vol: 1, rev: 0.08 },
        { t: 'bass', inst: 'gtr', fx: 'dist', pat: P8 + rep(rep('.', 16) + 'X...............', 4) + rep(rep('.', 16) + 'X...............', 4), oct: 2, dur: 12, v: 0.8, vol: 0.7, rev: 0.25 },
        { t: 'bass', inst: 'bass', pat: rep('X...X...X...X...', 8) + rep('X.x.X.x.X.x.X.x.', 16), oct: 1, dur: 1.8, v: 0.75, vol: 0.6, rev: 0.03 },
        { t: 'chord', inst: 'shout', pat: P8 + rep(rep('.', 16) + 'X...............' + rep('.', 32), 2) + rep(rep('.', 16) + 'X.......X.......', 4), oct: 3, v: 0.7, vol: 0.55, rev: 0.4 },
        { t: 'drum', inst: 'wartom', f: 65, pat: rep('X...X...X...X...', 24), v: 0.85, vol: 0.75, rev: 0.35 },
        { t: 'drum', inst: 'wartom', f: 110, pat: rep(rep('.', 112) + 'X.x.X.x.XxXxX.X.', 3), v: 0.8, vol: 0.65, rev: 0.3 },
        { t: 'drum', inst: 'mkick', pat: rep('X.......X.......', 8) + rep('X.x.X.x.X.x.X.x.', 8) + rep('XxXxXxXxXxXxXxXx', 8), v: 0.8, vol: 0.85, rev: 0.05 },
        { t: 'drum', inst: 'msnare', pat: rep('....X.......X...', 8) + rep('....X.......X..x', 16), v: 0.85, vol: 0.95, rev: 0.3 },
        { t: 'drum', inst: 'snare', pat: rep('x.xxx.xxx.xxx.xx', 8) + rep('.', 256), v: 0.5, vol: 0.5, rev: 0.2 },
        { t: 'drum', inst: 'ride', pat: P8 + rep('X.x.X.x.X.x.X.x.', 16), v: 0.6, vol: 0.5, rev: 0.2 },
        { t: 'drum', inst: 'crash', pat: rep('X' + rep('.', 63), 6), v: 0.75, vol: 0.55, rev: 0.35 }
      ]
    };

    // --- song_swift: Song of Swiftness. Grieg, "In the Hall of the Mountain King" (Peer Gynt, 1875). B minor speed metal
    // that accelerates 110 -> 140 -> 170 -> 200 bpm, then loops. Quarter = 4 steps.
    var mk = 'B3:4 C#4:4 D4:4 E4:4 | F#4:4 D4:4 F#4:8 | F4:4 C#4:4 F4:8 | E4:4 C4:4 E4:8 |' +
      'B3:4 C#4:4 D4:4 E4:4 | F#4:4 D4:4 F#4:4 B4:4 | A4:4 F#4:4 D4:4 F#4:4 | A4:16';
    var mkF = trMel(mk, -5); // the second statement, a fifth higher (an octave down here)
    var mkCh = 'B5 B5 C#5 C5 B5 B5 D5 A5', mkChF = 'F#5 F#5 G#5 G5 F#5 F#5 A5 E5';
    var gal = 'X.xxX.xxX.xxX.xx';
    TRACKS.song_swift = {
      drone: { root: 'B1', kind: 'gurdy', vol: 0.03, rev: 0.3 },
      seq: [
        { bpm: 110, div: 4, bar: 16, rev: 0.3, gain: 0.85, chords: mkCh,
          parts: [
            { t: 'mel', inst: 'gurdy', mel: stacc(mk, 0.45), tr: 12, v: 0.8, vol: 0.8, rev: 0.3 },
            { t: 'mel', inst: 'pluck', mel: stacc(mk, 0.3), v: 0.7, vol: 0.6, rev: 0.2 },
            { t: 'bass', inst: 'chug', fx: 'dist', pat: 'X...X...X...X...', oct: 2, dur: 1, v: 0.7, vol: 0.7, rev: 0.08 },
            { t: 'bass', inst: 'bass', pat: 'X...X...X...X...', oct: 1, dur: 1.5, v: 0.6, vol: 0.55, rev: 0.03 },
            { t: 'drum', inst: 'wartom', f: 70, pat: 'X...X...X...X...', v: 0.7, vol: 0.6, rev: 0.3 },
            { t: 'drum', inst: 'hat', pat: 'x.o.x.o.x.o.x.o.', v: 0.6, vol: 0.45, rev: 0.1 },
            { t: 'drum', inst: 'msnare', pat: rep('.', 112) + '....x.x.X.X.XXXX', v: 0.8, vol: 0.8, rev: 0.3 }
          ] },
        { bpm: 140, div: 4, bar: 16, rev: 0.28, gain: 0.85, chords: mkChF,
          parts: [
            { t: 'mel', inst: 'pipe', mel: mkF, tr: 12, v: 0.85, vol: 0.8, rev: 0.3 },
            { t: 'mel', inst: 'gtr', fx: 'dist', mel: stacc(mkF, 0.6), v: 0.75, vol: 0.6, rev: 0.15 },
            { t: 'bass', inst: 'chug', fx: 'dist', pat: gal, oct: 2, dur: 1, v: 0.85, vol: 0.85, rev: 0.08 },
            { t: 'bass', inst: 'bass', pat: 'X.x.X.x.X.x.X.x.', oct: 1, dur: 1.5, v: 0.7, vol: 0.55, rev: 0.03 },
            { t: 'drum', inst: 'mkick', pat: gal, v: 0.8, vol: 0.8, rev: 0.05 },
            { t: 'drum', inst: 'msnare', pat: rep('....X.......X...', 7) + '....X...X.X.XXXX', v: 0.85, vol: 0.9, rev: 0.3 },
            { t: 'drum', inst: 'hat', pat: 'x.x.x.x.x.x.x.x.', v: 0.6, vol: 0.45, rev: 0.1 },
            { t: 'drum', inst: 'crash', pat: 'X' + rep('.', 63), v: 0.7, vol: 0.5, rev: 0.3 }
          ] },
        { bpm: 170, div: 4, bar: 16, rev: 0.25, gain: 0.85, chords: mkCh,
          parts: [
            { t: 'mel', inst: 'pipe', mel: mk, tr: 12, v: 0.9, vol: 0.8, rev: 0.25 },
            { t: 'mel', inst: 'gurdy', mel: mk, tr: 12, v: 0.6, vol: 0.45, rev: 0.25 },
            { t: 'mel', inst: 'gtr', fx: 'dist', mel: stacc(mk, 0.6), v: 0.8, vol: 0.65, rev: 0.15 },
            { t: 'bass', inst: 'chug', fx: 'dist', pat: gal, oct: 2, dur: 1, v: 0.9, vol: 0.9, rev: 0.08 },
            { t: 'bass', inst: 'bass', pat: 'XxXxXxXxXxXxXxXx', oct: 1, dur: 0.9, v: 0.7, vol: 0.55, rev: 0.03 },
            { t: 'drum', inst: 'mkick', pat: 'XxXxXxXxXxXxXxXx', v: 0.75, vol: 0.8, rev: 0.05 },
            { t: 'drum', inst: 'msnare', pat: rep('....X.......X...', 7) + '....X.X.XXXXXXXX', v: 0.85, vol: 0.9, rev: 0.3 },
            { t: 'drum', inst: 'ride', pat: 'X.x.X.x.X.x.X.x.', v: 0.65, vol: 0.5, rev: 0.2 },
            { t: 'drum', inst: 'crash', pat: 'X' + rep('.', 63), v: 0.75, vol: 0.55, rev: 0.3 }
          ] },
        { bpm: 200, div: 4, bar: 16, rev: 0.22, gain: 0.85, chords: mkCh,
          parts: [
            { t: 'mel', inst: 'pipe', mel: mk, tr: 12, v: 0.95, vol: 0.85, rev: 0.25 },
            { t: 'mel', inst: 'horn', mel: mk, v: 0.8, vol: 0.6, rev: 0.25 },
            { t: 'mel', inst: 'gtr', fx: 'dist', mel: stacc(mk, 0.7), tr: 12, v: 0.75, vol: 0.55, rev: 0.15 },
            { t: 'bass', inst: 'chug', fx: 'dist', pat: 'XxxxXxxxXxxxXxxx', oct: 2, dur: 1, v: 0.9, vol: 0.9, rev: 0.08 },
            { t: 'bass', inst: 'bass', pat: 'XxXxXxXxXxXxXxXx', oct: 1, dur: 0.9, v: 0.7, vol: 0.55, rev: 0.03 },
            { t: 'drum', inst: 'mkick', pat: 'XxXxXxXxXxXxXxXx', v: 0.75, vol: 0.8, rev: 0.05 },
            { t: 'drum', inst: 'msnare', pat: rep('..X...X...X...X.', 7) + 'X.X.X.X.XXXXXXXX', v: 0.8, vol: 0.85, rev: 0.3 },
            { t: 'drum', inst: 'crash', pat: 'X' + rep('.', 15), v: 0.7, vol: 0.5, rev: 0.3 },
            { t: 'drum', inst: 'wartom', f: 70, pat: rep('.', 112) + 'X.x.X.x.X.X.XXXX', v: 0.85, vol: 0.7, rev: 0.3 }
          ] }
      ]
    };

    // --- song_hearth: Hearthfire Lay. Traditional Irish "Londonderry Air", D major, slow and cosy.
    // Eighth-note steps, half-bar chords. Tin whistle lead, fiddle countermelody, harp, bodhran, embers.
    var lond =
      'F#5:3 E5 F#5 B5 A5 F#5 | E5 D5 B4:2 -:1 D5 F#5 G5 | A5:3 B5 A5 F#5 D5 F#5 | E5:4 -:1 C#5 D5 E5 |' +
      'F#5:3 E5 F#5 B5 A5 F#5 | E5 D5 B4:2 -:1 C#5 D5 E5 | F#5:3 G5 F#5 E5 D5 E5 | D5:4 -:1 A5 B5 C#6 |' +
      'D6:3 C#6 C#6 B5 A5 B5 | A5 F#5 D5:2 -:1 A5 B5 C#6 | D6:3 C#6 C#6 B5 A5 F#5 | E5:4 -:1 A5 A5 A5 |' +
      'F#6:3 E6 E6 D6 B5 D6 | A5 F#5 D5:2 -:1 C#5 D5 E5 | F#5 B5 A5 F#5 E5 D5 B4 C#5 | D5:5 C#5 D5 E5';
    var londCounter =
      'A4:4 F#4:4 | G4:4 B4:4 | A4:4 B4:4 | G#4:4 G4:4 | F#4:4 C5:4 | B4:4 C#5:4 | A4:4 G4:4 | F#4:4 E4:4 |' +
      'F#4:4 G4:4 | A4:4 G4:4 | F#4:4 D#5:4 | D5:4 C#5:4 | D5:4 B4:4 | A4:4 G4:4 | A4:4 G4:4 | F#4:8';
    TRACKS.song_hearth = {
      bpm: 70, div: 2, bar: 4, rev: 0.4, gain: 1.15,
      chords: 'D D G G D Bm E7 A7 D D7 G A7 D A7 D A7 D G D A7 D B7 E7 A7 D G D A7 D A7 D D',
      parts: [
        { t: 'mel', inst: 'whistle', mel: lond, v: 0.85, vol: 0.9, rev: 0.4 },
        { t: 'mel', inst: 'fiddle', mel: londCounter, v: 0.6, vol: 0.55, rev: 0.45 },
        { t: 'arp', inst: 'harp', pat: [0, 1, 2, 3, 4, 3, 2, 1], oct: 3, dur: 3, v: 0.55, vol: 0.7, rev: 0.4 },
        { t: 'chord', inst: 'warm', pat: 'X...', oct: 3, dur: 4.2, v: 0.4, vol: 0.5, rev: 0.5 },
        { t: 'bass', inst: 'bass', pat: 'X...', oct: 2, dur: 3.5, v: 0.4, vol: 0.6, rev: 0.1 },
        { t: 'drum', inst: 'frame', pat: 'X..o....x..o.ox.', v: 0.45, vol: 0.5, rev: 0.15 },
        { t: 'rand', inst: 'ember', prob: 0.18, oct: 4, v: 0.6, vol: 0.4, rev: 0.05 }
      ]
    };

    // --- song_lantern: Lantern Song. Grieg, "Morning Mood" (Peer Gynt, 1875). E major 6/8, dotted quarter = 60.
    // 16th steps (6 per dotted-quarter beat), one chord per beat. Flute and oboe trade the theme; it brightens to
    // G# major, then swells to a tutti with strings, and fades back to the flute.
    var mm = 'B5:2 G#5:2 F#5:2 E5:2 F#5:2 G#5:2 | B5:2 G#5:2 F#5:2 E5:2 F#5:1 G#5:1 F#5:1 G#5:1 |' +
      'B5:2 G#5:2 B5:2 C#6:2 G#5:2 C#6:2 | B5:2 G#5:2 F#5:2 E5:4 -:2';
    var mmE = 'E E E E E A E E ', mmG = 'G# G# G# G# G# C# G# G# ';
    TRACKS.song_lantern = {
      bpm: 60, div: 6, bar: 6, rev: 0.5, gain: 1.2,
      chords: mmE + mmE + mmG + mmG + mmE + mmE,
      parts: [
        { t: 'mel', inst: 'flute', mel: mm + ' ' + rests(48) + ' ' + trMel(mm, 4) + ' ' + rests(48) + ' ' + mm + ' ' + mm, v: 0.85, vol: 0.9, rev: 0.45 },
        { t: 'mel', inst: 'oboe', mel: rests(48) + ' ' + trMel(mm, -12) + ' ' + rests(48) + ' ' + trMel(mm, -8) + ' ' + trMel(mm, -12) + ' ' + rests(48), v: 0.75, vol: 0.75, rev: 0.45 },
        { t: 'mel', inst: 'strings', mel: rests(192) + ' ' + trMel(mm, -24) + ' ' + rests(48), v: 0.8, vol: 0.8, rev: 0.5 },
        { t: 'arp', inst: 'harp', pat: [0, null, 1, null, 2, null, 3, null, 2, null, 1, null], oct: 3, dur: 3, v: 0.5, vol: 0.65, rev: 0.45 },
        { t: 'chord', inst: 'strings', pat: 'X.....', oct: 3, dur: 6.3, v: 0.32, vol: 0.55, rev: 0.6 },
        { t: 'chord', inst: 'horn', pat: rep('.', 192) + rep('X...........', 4) + rep('.', 48), oct: 3, dur: 11, v: 0.4, vol: 0.4, rev: 0.5 },
        { t: 'bass', inst: 'subbass', pat: 'X...........', oct: 2, dur: 11, v: 0.5, vol: 0.7, rev: 0.3 },
        { t: 'rand', inst: 'chime', pat: 'x.....', prob: 0.3, oct: 6, v: 0.3, vol: 0.45, rev: 0.8 }
      ]
    };

    // --- song_lull: Lullaby of Frost. After the solo-violin theme of Rimsky-Korsakov's "Scheherazade" (1888):
    // a long high note unwinding in triplet arabesques. E minor, slow; kamancheh lead, qanun, bells, frame drum, drone.
    // 16th-triplet steps (6 per beat), half-bar chords.
    var sch = 'E6:12 D6 E6 D6 C6 D6 C6 B5 C6 B5 A5 B5 A5 | G5 A5 G5 F#5 G5 F#5 E5:6 -:6 D#5:3 E5:3 |' +
      'F#5:3 G5:3 A5:3 B5:3 C6:6 B5:3 A5:3 | B5:18 -:6 |' +
      'E6:12 D6 E6 D6 C6 D6 C6 B5 C6 B5 A5 B5 A5 | G5 A5 G5 F#5 G5 F#5 E5 F#5 E5 D#5 E5 D#5 E5:12 |' +
      'C5:3 E5:3 A5:3 C6:3 E6:12 | D#6:6 C6:3 B5:3 A5:3 G5:3 F#5:3 D#5:3 | E5:24 | -:24';
    TRACKS.song_lull = {
      bpm: 56, div: 6, bar: 12, rev: 0.6, gain: 1.35,
      drone: { root: 'E2', kind: 'gurdy', vol: 0.022, rev: 0.6 },
      chords: 'Em Am Em B7 D Am B7 B7 Em Am Em Em Am Am B7 B7 Em Em Em Em',
      parts: [
        { t: 'mel', inst: 'kamancheh', mel: sch, v: 0.85, vol: 0.85, rev: 0.6 },
        { t: 'arp', inst: 'qanun', pat: [0, 1, 2, 3, 2, 1], oct: 4, dur: 2, v: 0.45, vol: 0.55, rev: 0.55 },
        { t: 'arp', inst: 'qanun', pat: [0, null, null, null, null, null, 2, null, null, null, null, null], oct: 3, dur: 6, v: 0.5, vol: 0.5, rev: 0.5 },
        { t: 'chord', inst: 'ghost', pat: 'X...........', oct: 3, dur: 12.5, v: 0.3, vol: 0.45, rev: 0.7 },
        { t: 'rand', inst: 'glass', pat: 'x.....', prob: 0.35, oct: 6, v: 0.45, vol: 0.45, rev: 0.85 },
        { t: 'rand', inst: 'chime', pat: 'x' + rep('.', 23), prob: 0.5, oct: 5, v: 0.35, vol: 0.45, rev: 0.9 },
        { t: 'drum', inst: 'frame', pat: 'X.....' + rep('.', 6) + 'o.....' + rep('.', 6), v: 0.35, vol: 0.45, rev: 0.4 },
        { t: 'drum', inst: 'darbuka', f: 900, pat: rep('.', 9) + 'o..' + rep('.', 9) + 'o.o', v: 0.4, vol: 0.35, rev: 0.4 }
      ]
    };

    // --- song_requiem: Requiem. Grieg, "Ase's Death" (Peer Gynt, 1875), recast from B minor into B Hijaz
    // (B C D# E F# G A: the augmented second C-D#). Slow; ney, oud (plucked and tremolo), darbuka, drone, choir.
    // 16th steps, half-bar chords. A (ney alone) | A (darbuka, oud tremolo) | B (a fourth up, E Hijaz) | A (full).
    var ase = 'F#3:4 B3:4 C4:8 | F#3:4 B3:4 C4:8 | D#4:4 C4:4 B3:4 C4:2 D#4:2 | E4:4 D#4:4 C4:6 -:2 |';
    var aseE = trMel(ase, 5) + ' |';
    var reqCh = 'B C B C B Em Em C ', reqChE = 'E F E F E Am Am F ';
    var R64 = rep('.', 64);
    var maqsum = 'X...........X...', maqTek = '..x...x.o...o.x.';
    TRACKS.song_requiem = {
      bpm: 64, div: 4, bar: 8, rev: 0.6, gain: 1.05,
      drone: { root: 'B1', kind: 'gurdy', vol: 0.035, rev: 0.6 },
      chords: reqCh + reqCh + reqChE + reqCh,
      parts: [
        { t: 'mel', inst: 'ney', mel: ase + ase + aseE + ase, tr: 12, v: 0.9, vol: 0.9, rev: 0.6 },
        { t: 'mel', inst: 'oudtrem', mel: rests(64) + ' ' + ase + ' ' + rests(64) + ' ' + ase, v: 0.6, vol: 0.55, rev: 0.4 },
        { t: 'arp', inst: 'oud', pat: [0, null, null, null, 1, null, null, null], oct: 2, dur: 3, v: 0.6, vol: 0.6, rev: 0.4 },
        { t: 'chord', inst: 'ghost', pat: R64 + R64 + rep('X.......', 16), oct: 3, dur: 8.5, v: 0.35, vol: 0.55, rev: 0.75 },
        { t: 'bass', inst: 'subbass', pat: 'X.......', oct: 2, dur: 8, v: 0.45, vol: 0.6, rev: 0.3 },
        { t: 'drum', inst: 'darbuka', f: 85, pat: R64 + rep(maqsum, 12), v: 0.85, vol: 0.7, rev: 0.3 },
        { t: 'drum', inst: 'darbuka', f: 1900, pat: R64 + rep(maqTek, 12), v: 0.6, vol: 0.5, rev: 0.3 },
        { t: 'drum', inst: 'frame', pat: 'X' + rep('.', 31), v: 0.5, vol: 0.5, rev: 0.5 },
        { t: 'mel', inst: 'bell', mel: 'B4:64 | -:64 | -:64 | B4:64', tr: -12, v: 0.5, vol: 0.5, rev: 0.8 }
      ]
    };
  })();
  var SONG_IDS = ['ward', 'march', 'hearth', 'lantern', 'lull', 'requiem', 'swift'];
  var SONG_TRACKS = SONG_IDS.map(function (id) { return 'song_' + id; });

  K.SONG_IDS = SONG_IDS; K.SONG_TRACKS = SONG_TRACKS;
})();
