/* Velmoor audio, notation: the pattern/track DSL - chord symbols, note names, melody strings
 * ("A4:3 B4 -:2"), drum patterns, and melody helpers (transpose, staccato, rests). */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var BT = root.BT = root.BT || {};
  var K = BT.AUDIO_INTERNAL = BT.AUDIO_INTERNAL || {}; // shared internals of the js/audio/ files

  // ---------------------------------------------------------------- music data
  var PCS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  var QUAL = {
    '': [0, 4, 7], 'm': [0, 3, 7], 'dim': [0, 3, 6], 'aug': [0, 4, 8], 'sus4': [0, 5, 7], 'sus2': [0, 2, 7],
    '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], 'maj7': [0, 4, 7, 11], '5': [0, 7], 'add9': [0, 4, 7, 14]
  };
  function parseChord(s) {
    var m = /^([A-G])([#b]?)(.*)$/.exec(s);
    if (!m || !QUAL[m[3]]) throw new Error('bad chord ' + s);
    var pc = (PCS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
    return { pc: pc, iv: QUAL[m[3]] };
  }
  function chordTone(ch, idx, oct) {
    var n = ch.iv.length, k = ((idx % n) + n) % n;
    return 12 * (oct + 1) + ch.pc + ch.iv[k] + 12 * Math.floor(idx / n);
  }
  function parseNote(s) {
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
    if (!m) throw new Error('bad note ' + s);
    return 12 * (+m[3] + 1) + PCS[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  // melody: "A4:3 B4 C5:2 -:2" (duration in steps, default 1; '-' = rest)
  function parseMel(str, xf) {
    var toks = str.replace(/\|/g, ' ').trim().split(/\s+/), ev = {}, pos = 0;
    for (var i = 0; i < toks.length; i++) {
      var p = toks[i].split(':'), d = p[1] ? +p[1] : 1;
      if (p[0] !== '-') { var m = parseNote(p[0]); if (xf) m = xf(m); ev[pos] = { m: m, d: d }; }
      pos += d;
    }
    return { ev: ev, len: pos };
  }
  // raise minor-scale degrees (C, F, G relative to A) -> A major
  function majorize(m) { var pc = m % 12; return (pc === 0 || pc === 5 || pc === 7) ? m + 1 : m; }
  function cleanPat(s) { return s.replace(/[|\s]/g, ''); }
  function patVel(pat, s) {
    var ch = pat.charAt(s % pat.length);
    return ch === 'X' ? 1 : ch === 'x' ? 0.75 : ch === 'o' ? 0.45 : 0;
  }

  var NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function noteName(m) { return NOTE_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); }
  // transpose a melody string by n semitones (the helpers pad their output with spaces so they concatenate safely)
  function trMel(str, n) {
    return str.replace(/\|/g, ' ').trim().split(/\s+/).map(function (tok) {
      var p = tok.split(':');
      if (p[0] === '-') return tok;
      return noteName(parseNote(p[0]) + n) + (p[1] ? ':' + p[1] : '');
    }).join(' ') + ' ';
  }
  // detach notes: each note keeps `keep` of its length (rounded, at least 1 step), the rest becomes a rest
  function stacc(str, keep) {
    return str.replace(/\|/g, ' ').trim().split(/\s+/).map(function (tok) {
      var p = tok.split(':'), d = p[1] ? +p[1] : 1;
      if (p[0] === '-' || d < 2) return tok;
      var on = Math.max(1, Math.round(d * keep));
      return on >= d ? tok : p[0] + ':' + on + ' -:' + (d - on);
    }).join(' ') + ' ';
  }
  function rests(n) { return ' -:' + n + ' '; }

  K.PCS = PCS; K.QUAL = QUAL; K.parseChord = parseChord; K.chordTone = chordTone; K.parseNote = parseNote; K.parseMel = parseMel; K.majorize = majorize; K.cleanPat = cleanPat; K.patVel = patVel; K.noteName = noteName; K.trMel = trMel; K.stacc = stacc; K.rests = rests;
})();
