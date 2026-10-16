/* Velmoor audio, instruments: every synthesized voice in I (signature (out, t, freq, dur, vel, opts)),
 * the folk-metal and bard-song voices, per-part FX chains (FX) and the continuous pipe/gurdy drones. */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var BT = root.BT = root.BT || {};
  var K = BT.AUDIO_INTERNAL = BT.AUDIO_INTERNAL || {}; // shared internals of the js/audio/ files
  var rnd = K.rnd, mtof = K.mtof, fin = K.fin, noiseSrc = K.noiseSrc, envAD = K.envAD, envSus = K.envSus, osc = K.osc, gainN = K.gainN, filt = K.filt, noise = K.noise, parseNote = K.parseNote;

  // ---------------------------------------------------------------- instruments
  // signature: (out, t, freq, durSeconds, velocity, opts)
  var I = {};

  I.pluck = function (out, t, f, dur, v, o) {
    o = o || {};
    var c = out.context, dec = o.decay || 1.0, br = o.bright || 1, sm = o.saw == null ? 0.7 : o.saw;
    var o1 = osc(c, 'sawtooth', f), o2 = osc(c, 'triangle', f, 4);
    var sg = gainN(c, sm), lp = filt(c, 'lowpass', 0, 1.5), g = c.createGain();
    lp.frequency.setValueAtTime(Math.min(f * 9 * br, 12000), t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.1, 150), t + dec * 0.7);
    envAD(g.gain, t, 0.003, v * 0.42, dec);
    o1.connect(sg); sg.connect(lp); o2.connect(lp); lp.connect(g); g.connect(out);
    o1.start(t); o2.start(t); o1.stop(t + dec + 0.05); o2.stop(t + dec + 0.05);
    fin(o2, [o1, o2, sg, lp, g]);
  };
  I.harp = function (out, t, f, dur, v) { I.pluck(out, t, f, dur, v, { decay: 2.0, bright: 0.55, saw: 0.25 }); };
  I.lute = function (out, t, f, dur, v) { I.pluck(out, t, f, dur, v * 1.1, { decay: 0.9, bright: 0.9, saw: 0.8 }); };
  I.glass = function (out, t, f, dur, v) { I.pluck(out, t, f, dur, v * 0.8, { decay: 0.5, bright: 1.6, saw: 0.35 }); };

  I.pad = function (out, t, f, dur, v, o) {
    o = o || {};
    var c = out.context, br = o.bright || 1, a = o.att || 0.6, r = o.rel || 1.0;
    var lp = filt(c, 'lowpass', Math.max(250, Math.min(f * 3 * br, 4000)), 0.6), g = c.createGain();
    var end = envSus(g.gain, t, a, v * 0.09, dur, r);
    var nodes = [lp, g], last;
    for (var i = -1; i <= 1; i++) {
      var x = osc(c, 'sawtooth', f, i * 9 + (rnd() * 4 - 2));
      x.connect(lp); x.start(t); x.stop(end); nodes.push(x); last = x;
    }
    lp.connect(g); g.connect(out);
    fin(last, nodes);
  };
  I.strings = function (out, t, f, dur, v) { I.pad(out, t, f, dur, v, { bright: 1.1, att: 0.5, rel: 0.9 }); };
  I.drone = function (out, t, f, dur, v) { I.pad(out, t, f, dur, v * 1.3, { bright: 0.45, att: 2.0, rel: 2.5 }); };
  I.warm = function (out, t, f, dur, v) { I.pad(out, t, f, dur, v, { bright: 0.8, att: 0.9, rel: 1.4 }); };

  I.flute = function (out, t, f, dur, v) {
    var c = out.context;
    var o1 = osc(c, 'triangle', f), o2 = osc(c, 'sine', f * 2), g2 = gainN(c, 0.12);
    var lfo = osc(c, 'sine', 5 + rnd()), lg = c.createGain();
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.008, t + Math.min(0.4, dur * 0.8 + 0.05));
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.detune);
    var n = noiseSrc(c, t, dur + 0.4), bp = filt(c, 'bandpass', Math.min(f * 2, 8000), 1.2), ng = c.createGain();
    envSus(ng.gain, t, 0.04, v * 0.045, Math.min(dur, 0.12), 0.3);
    var g = c.createGain();
    var end = envSus(g.gain, t, 0.07, v * 0.32, dur, 0.18);
    o1.connect(g); o2.connect(g2); g2.connect(g); n.connect(bp); bp.connect(ng); ng.connect(out); g.connect(out);
    o1.start(t); o2.start(t); lfo.start(t); o1.stop(end); o2.stop(end); lfo.stop(end);
    fin(o1, [o1, o2, g2, lfo, lg, n, bp, ng, g]);
  };

  I.horn = function (out, t, f, dur, v) {
    var c = out.context;
    var o1 = osc(c, 'sawtooth', f, -6), o2 = osc(c, 'sawtooth', f, 6), lp = filt(c, 'lowpass', f, 1.2), g = c.createGain();
    lp.frequency.setValueAtTime(f * 1.2, t);
    lp.frequency.linearRampToValueAtTime(Math.min(f * 5, 6000), t + 0.06);
    lp.frequency.setTargetAtTime(Math.min(f * 2.6, 4000), t + 0.07, 0.2);
    var end = envSus(g.gain, t, 0.05, v * 0.17, dur, 0.22);
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(out);
    o1.start(t); o2.start(t); o1.stop(end); o2.stop(end);
    fin(o1, [o1, o2, lp, g]);
  };

  I.bell = function (out, t, f, dur, v, o) {
    var c = out.context, dec = (o && o.decay) || 2.6;
    var car = osc(c, 'sine', f), mod = osc(c, 'sine', f * 3.5), mg = c.createGain();
    mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + dec * 0.6);
    var p2 = osc(c, 'sine', f * 2.756), g2 = c.createGain();
    envAD(g2.gain, t, 0.002, v * 0.08, dec * 0.4);
    var g = c.createGain(); envAD(g.gain, t, 0.002, v * 0.2, dec);
    mod.connect(mg); mg.connect(car.frequency); car.connect(g); p2.connect(g2); g2.connect(out); g.connect(out);
    car.start(t); mod.start(t); p2.start(t);
    car.stop(t + dec + 0.05); mod.stop(t + dec + 0.05); p2.stop(t + dec + 0.05);
    fin(car, [car, mod, mg, p2, g2, g]);
  };
  I.chime = function (out, t, f, dur, v) { I.bell(out, t, f, dur, v, { decay: 1.4 }); };

  I.organ = function (out, t, f, dur, v) {
    var c = out.context, g = c.createGain();
    var end = envSus(g.gain, t, 0.03, v * 0.075, dur, 0.18);
    var R = [0.5, 1, 2, 3, 4], A = [0.45, 1, 0.55, 0.25, 0.2], nodes = [g], last;
    for (var i = 0; i < R.length; i++) {
      if (f * R[i] > 9000) continue;
      var x = osc(c, 'sine', f * R[i], rnd() * 4 - 2), xg = gainN(c, A[i]);
      x.connect(xg); xg.connect(g); x.start(t); x.stop(end); nodes.push(x, xg); last = x;
    }
    g.connect(out);
    fin(last, nodes);
  };

  var VOWEL_AH = [[730, 1, 9], [1090, 0.5, 11], [2440, 0.22, 13]];
  var VOWEL_OO = [[300, 1, 8], [870, 0.35, 10], [2240, 0.1, 12]];
  I.choir = function (out, t, f, dur, v, o) {
    var c = out.context, fm = (o && o.vowel) || VOWEL_AH;
    var o1 = osc(c, 'sawtooth', f, -8), o2 = osc(c, 'sawtooth', f, 8);
    var lfo = osc(c, 'sine', 5.2 + rnd() * 0.6), lg = gainN(c, 14);
    lfo.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune);
    var mix = c.createGain(), g = c.createGain();
    var end = envSus(g.gain, t, (o && o.att) || 0.35, v * 0.55, dur, (o && o.rel) || 0.6);
    o1.connect(mix); o2.connect(mix);
    var nodes = [o1, o2, lfo, lg, mix, g];
    for (var i = 0; i < fm.length; i++) {
      var bp = filt(c, 'bandpass', fm[i][0], fm[i][2]), bg = gainN(c, fm[i][1]);
      mix.connect(bp); bp.connect(bg); bg.connect(g); nodes.push(bp, bg);
    }
    g.connect(out);
    o1.start(t); o2.start(t); lfo.start(t); o1.stop(end); o2.stop(end); lfo.stop(end);
    fin(o1, nodes);
  };
  I.ghost = function (out, t, f, dur, v) { I.choir(out, t, f, dur, v, { vowel: VOWEL_OO, att: 0.5, rel: 1.0 }); };

  I.bass = function (out, t, f, dur, v) {
    var c = out.context;
    var o1 = osc(c, 'sawtooth', f), o2 = osc(c, 'sine', f), lp = filt(c, 'lowpass', f * 5, 3), g = c.createGain(), sg = gainN(c, 0.7);
    lp.frequency.setValueAtTime(Math.min(f * 7, 3000), t);
    lp.frequency.setTargetAtTime(f * 2, t + 0.01, 0.08);
    var end = envSus(g.gain, t, 0.006, v * 0.3, dur, 0.08);
    o1.connect(lp); o2.connect(sg); sg.connect(g); lp.connect(g); g.connect(out);
    o1.start(t); o2.start(t); o1.stop(end); o2.stop(end);
    fin(o1, [o1, o2, lp, g, sg]);
  };
  I.subbass = function (out, t, f, dur, v) {
    var c = out.context, o1 = osc(c, 'triangle', f), g = c.createGain();
    var end = envSus(g.gain, t, 0.08, v * 0.35, dur, 0.4);
    o1.connect(g); g.connect(out); o1.start(t); o1.stop(end); fin(o1, [o1, g]);
  };

  // --- percussion (freq argument is a tuning hint; 0 = default)
  I.kick = function (out, t, f, dur, v) {
    var c = out.context, o1 = osc(c, 'sine', 150), g = c.createGain();
    o1.frequency.setValueAtTime(160, t); o1.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    envAD(g.gain, t, 0.002, v * 0.85, 0.32);
    o1.connect(g); g.connect(out); o1.start(t); o1.stop(t + 0.4); fin(o1, [o1, g]);
  };
  I.snare = function (out, t, f, dur, v) {
    var c = out.context, n = noiseSrc(c, t, 0.25), hp = filt(c, 'highpass', 1400, 0.7), g = c.createGain();
    envAD(g.gain, t, 0.002, v * 0.38, 0.17);
    var o1 = osc(c, 'triangle', 200), og = c.createGain();
    o1.frequency.setValueAtTime(210, t); o1.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    envAD(og.gain, t, 0.002, v * 0.3, 0.09);
    n.connect(hp); hp.connect(g); g.connect(out); o1.connect(og); og.connect(out);
    o1.start(t); o1.stop(t + 0.15); fin(n, [n, hp, g, o1, og]);
  };
  I.hat = function (out, t, f, dur, v) {
    var c = out.context, n = noiseSrc(c, t, 0.08), hp = filt(c, 'highpass', 7500, 0.8), g = c.createGain();
    envAD(g.gain, t, 0.001, v * 0.13, 0.045);
    n.connect(hp); hp.connect(g); g.connect(out); fin(n, [n, hp, g]);
  };
  I.shaker = function (out, t, f, dur, v) {
    var c = out.context, n = noiseSrc(c, t, 0.12), hp = filt(c, 'bandpass', 5500, 1.2), g = c.createGain();
    envAD(g.gain, t, 0.015, v * 0.1, 0.06);
    n.connect(hp); hp.connect(g); g.connect(out); fin(n, [n, hp, g]);
  };
  I.tom = function (out, t, f, dur, v) {
    var c = out.context, b = f || 110, o1 = osc(c, 'sine', b), g = c.createGain();
    o1.frequency.setValueAtTime(b * 1.5, t); o1.frequency.exponentialRampToValueAtTime(b, t + 0.1);
    envAD(g.gain, t, 0.002, v * 0.6, 0.35);
    o1.connect(g); g.connect(out); o1.start(t); o1.stop(t + 0.45); fin(o1, [o1, g]);
  };
  I.frame = function (out, t, f, dur, v) { // bodhran-like frame drum
    var c = out.context, o1 = osc(c, 'sine', 95), g = c.createGain();
    o1.frequency.setValueAtTime(110, t); o1.frequency.exponentialRampToValueAtTime(62, t + 0.15);
    envAD(g.gain, t, 0.002, v * 0.6, 0.24);
    var n = noiseSrc(c, t, 0.1), bp = filt(c, 'bandpass', 500, 1.5), ng = c.createGain();
    envAD(ng.gain, t, 0.001, v * 0.22, 0.05);
    o1.connect(g); g.connect(out); n.connect(bp); bp.connect(ng); ng.connect(out);
    o1.start(t); o1.stop(t + 0.3); fin(o1, [o1, g, n, bp, ng]);
  };
  I.timp = function (out, t, f, dur, v) {
    var c = out.context, b = f || 73, o1 = osc(c, 'sine', b), o2 = osc(c, 'sine', b * 1.5), g = c.createGain(), g2 = c.createGain();
    o1.frequency.setValueAtTime(b * 1.04, t); o1.frequency.exponentialRampToValueAtTime(b, t + 0.15);
    envAD(g.gain, t, 0.004, v * 0.7, 1.3); envAD(g2.gain, t, 0.004, v * 0.2, 0.5);
    var n = noiseSrc(c, t, 0.12), lp = filt(c, 'lowpass', 600, 0.7), ng = c.createGain();
    envAD(ng.gain, t, 0.001, v * 0.25, 0.08);
    o1.connect(g); o2.connect(g2); g.connect(out); g2.connect(out); n.connect(lp); lp.connect(ng); ng.connect(out);
    o1.start(t); o2.start(t); o1.stop(t + 1.4); o2.stop(t + 0.6); fin(o1, [o1, o2, g, g2, n, lp, ng]);
  };
  I.crash = function (out, t, f, dur, v) {
    var c = out.context, n = noiseSrc(c, t, 1.6), hp = filt(c, 'highpass', 3500, 0.5), g = c.createGain();
    envAD(g.gain, t, 0.002, v * 0.2, 1.5);
    n.connect(hp); hp.connect(g); g.connect(out); fin(n, [n, hp, g]);
  };
  I.drip = function (out, t, f, dur, v) {
    var c = out.context, b = 900 + rnd() * 1100, o1 = osc(c, 'sine', b), g = c.createGain();
    o1.frequency.setValueAtTime(b, t); o1.frequency.exponentialRampToValueAtTime(b * 1.9, t + 0.06);
    envAD(g.gain, t, 0.002, v * 0.16, 0.1);
    o1.connect(g); g.connect(out); o1.start(t); o1.stop(t + 0.15); fin(o1, [o1, g]);
  };
  I.wind = function (out, t, f, dur, v) {
    var c = out.context, d = Math.max(dur, 1), n = noiseSrc(c, t, d + 1.5), bp = filt(c, 'bandpass', 300, 5), g = c.createGain();
    var b = 250 + rnd() * 200;
    bp.frequency.setValueAtTime(b, t);
    bp.frequency.linearRampToValueAtTime(b * 2.6, t + d * 0.5);
    bp.frequency.linearRampToValueAtTime(b * 1.2, t + d);
    envSus(g.gain, t, d * 0.4, v * 0.35, d * 0.6, d * 0.5);
    n.connect(bp); bp.connect(g); g.connect(out); fin(n, [n, bp, g]);
  };

  // ---------------------------------------------------------------- folk-metal voices
  // Guitar voices are meant to feed a 'dist' FX chain (amp + cabinet), see FX below.
  function gtrVoice(out, t, f, v, lpF, open) {
    var c = out.context, nodes = [], last;
    var lp = filt(c, 'lowpass', lpF, 0.9), g = c.createGain();
    var R = open ? [[1, 'sawtooth', -7], [1, 'square', 7], [1.4983, 'sawtooth', 5], [2, 'sawtooth', -4]]
                 : [[1, 'sawtooth', -6], [1, 'square', 6], [1.4983, 'sawtooth', 4]];
    for (var i = 0; i < R.length; i++) {
      var x = osc(c, R[i][1], f * R[i][0], R[i][2]); x.connect(lp); nodes.push(x); last = x;
    }
    lp.connect(g); g.connect(out); nodes.push(lp, g);
    return { g: g, lp: lp, oscs: nodes.slice(0, R.length), nodes: nodes, last: last };
  }
  I.chug = function (out, t, f, dur, v) { // palm-muted power chord
    var w = gtrVoice(out, t, f, v, 900, false), end = t + Math.min(dur, 0.16) + 0.06;
    w.lp.frequency.setValueAtTime(1300, t); w.lp.frequency.exponentialRampToValueAtTime(380, t + 0.09);
    envAD(w.g.gain, t, 0.002, v * 0.5, Math.min(dur, 0.16));
    for (var i = 0; i < w.oscs.length; i++) { w.oscs[i].start(t); w.oscs[i].stop(end); }
    fin(w.last, w.nodes);
  };
  I.gtr = function (out, t, f, dur, v) { // open ringing power chord
    var w = gtrVoice(out, t, f, v, 2600, true);
    var end = envSus(w.g.gain, t, 0.004, v * 0.42, dur, 0.25);
    w.lp.frequency.setValueAtTime(3400, t); w.lp.frequency.setTargetAtTime(1600, t + 0.05, 0.6);
    for (var i = 0; i < w.oscs.length; i++) { w.oscs[i].start(t); w.oscs[i].stop(end); }
    fin(w.last, w.nodes);
  };
  // Highland-style chanter: reedy pulse/saw through formants, quick grace-note flick before each note
  I.pipe = function (out, t, f, dur, v, o) {
    var c = out.context, gr = (o && o.grace === false) ? 0 : (f < 740 ? 784 : 880);
    if (gr && Math.abs(gr - f) < 30) gr = f * 1.335;
    var o1 = osc(c, 'sawtooth', f), o2 = osc(c, 'square', f, 5), m2 = gainN(c, 0.5);
    if (gr) {
      o1.frequency.setValueAtTime(gr, t); o1.frequency.setValueAtTime(f, t + 0.038);
      o2.frequency.setValueAtTime(gr, t); o2.frequency.setValueAtTime(f, t + 0.038);
    }
    var mix = c.createGain(), g = c.createGain();
    var b1 = filt(c, 'bandpass', 950, 2.2), b2 = filt(c, 'bandpass', 1500, 3), hp = filt(c, 'highpass', 2200, 0.7);
    var g1 = gainN(c, 1.0), g2 = gainN(c, 0.7), g3 = gainN(c, 0.12);
    o1.connect(mix); o2.connect(m2); m2.connect(mix);
    mix.connect(b1); b1.connect(g1); g1.connect(g);
    mix.connect(b2); b2.connect(g2); g2.connect(g);
    mix.connect(hp); hp.connect(g3); g3.connect(g);
    var end = envSus(g.gain, t, 0.006, v * 0.42, dur + 0.03, 0.05);
    g.connect(out);
    o1.start(t); o2.start(t); o1.stop(end); o2.stop(end);
    fin(o1, [o1, o2, m2, mix, g, b1, b2, hp, g1, g2, g3]);
  };
  // hurdy-gurdy-like bowed reed: buzzy saws, vibrato, nasal formant
  I.gurdy = function (out, t, f, dur, v) {
    var c = out.context, o1 = osc(c, 'sawtooth', f, -5), o2 = osc(c, 'sawtooth', f, 5);
    var lfo = osc(c, 'sine', 5.5), lg = gainN(c, 9);
    lfo.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune);
    var b1 = filt(c, 'bandpass', 1100, 1.6), pk = filt(c, 'peaking', 2400, 3), g = c.createGain();
    pk.gain.value = 6;
    var end = envSus(g.gain, t, 0.03, v * 0.6, dur, 0.12);
    o1.connect(b1); o2.connect(b1); b1.connect(pk); pk.connect(g); g.connect(out);
    o1.start(t); o2.start(t); lfo.start(t); o1.stop(end); o2.stop(end); lfo.stop(end);
    fin(o1, [o1, o2, lfo, lg, b1, pk, g]);
  };
  // gang-shout "HEY!" stab
  var VOW_EY = [[560, 1, 6], [1800, 0.55, 9], [2550, 0.3, 10]];
  I.shout = function (out, t, f, dur, v) {
    var c = out.context, mix = c.createGain(), g = c.createGain(), nodes = [mix, g], last;
    for (var i = -1; i <= 1; i++) {
      var x = osc(c, 'sawtooth', f * 1.08, i * 16 + rnd() * 6);
      x.frequency.setValueAtTime(f * 1.08, t); x.frequency.exponentialRampToValueAtTime(f * 0.97, t + 0.22);
      x.connect(mix); x.start(t); x.stop(t + 0.32); nodes.push(x); last = x;
    }
    for (var k = 0; k < VOW_EY.length; k++) {
      var bp = filt(c, 'bandpass', VOW_EY[k][0], VOW_EY[k][2]), bg = gainN(c, VOW_EY[k][1]);
      mix.connect(bp); bp.connect(bg); bg.connect(g); nodes.push(bp, bg);
    }
    envAD(g.gain, t, 0.012, v * 0.9, 0.24);
    g.connect(out); fin(last, nodes);
    noise(out, t, 0.08, v * 0.12, 'bandpass', 3000, 0, 1.5, 0.004); // breath/consonant
  };
  I.mkick = function (out, t, f, dur, v) { // punchy metal kick: swept sine + beater click
    var c = out.context, o1 = osc(c, 'sine', 190), g = c.createGain();
    o1.frequency.setValueAtTime(200, t); o1.frequency.exponentialRampToValueAtTime(50, t + 0.055);
    envAD(g.gain, t, 0.001, v * 0.95, 0.2);
    var n = noiseSrc(c, t, 0.02), hp = filt(c, 'highpass', 2500, 0.7), ng = c.createGain();
    envAD(ng.gain, t, 0.0005, v * 0.35, 0.012);
    o1.connect(g); g.connect(out); n.connect(hp); hp.connect(ng); ng.connect(out);
    o1.start(t); o1.stop(t + 0.25); fin(o1, [o1, g, n, hp, ng]);
  };
  I.msnare = function (out, t, f, dur, v) {
    var c = out.context, n = noiseSrc(c, t, 0.3), bp = filt(c, 'bandpass', 2000, 0.6), g = c.createGain();
    envAD(g.gain, t, 0.001, v * 0.5, 0.22);
    var o1 = osc(c, 'triangle', 190), og = c.createGain();
    o1.frequency.setValueAtTime(230, t); o1.frequency.exponentialRampToValueAtTime(170, t + 0.05);
    envAD(og.gain, t, 0.001, v * 0.45, 0.1);
    n.connect(bp); bp.connect(g); g.connect(out); o1.connect(og); og.connect(out);
    o1.start(t); o1.stop(t + 0.15); fin(n, [n, bp, g, o1, og]);
  };
  I.ride = function (out, t, f, dur, v) {
    var c = out.context, n = noiseSrc(c, t, 0.5), bp = filt(c, 'bandpass', 7500, 1.4), g = c.createGain();
    envAD(g.gain, t, 0.001, v * 0.1, 0.4);
    var p1 = osc(c, 'square', 3170), p2 = osc(c, 'square', 4630), hp = filt(c, 'highpass', 3000, 0.7), pg = c.createGain();
    envAD(pg.gain, t, 0.001, v * 0.025, 0.45);
    n.connect(bp); bp.connect(g); g.connect(out); p1.connect(hp); p2.connect(hp); hp.connect(pg); pg.connect(out);
    p1.start(t); p2.start(t); p1.stop(t + 0.5); p2.stop(t + 0.5); fin(p1, [n, bp, g, p1, p2, hp, pg]);
  };
  I.tamb = function (out, t, f, dur, v) {
    var c = out.context, n = noiseSrc(c, t, 0.2), bp = filt(c, 'bandpass', 9000, 1.8), g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v * 0.14, t + 0.002); g.gain.exponentialRampToValueAtTime(v * 0.04, t + 0.012);
    g.gain.linearRampToValueAtTime(v * 0.12, t + 0.016); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    n.connect(bp); bp.connect(g); g.connect(out); fin(n, [n, bp, g]);
  };
  I.wartom = function (out, t, f, dur, v) {
    var c = out.context, b = f || 80, o1 = osc(c, 'sine', b), g = c.createGain();
    o1.frequency.setValueAtTime(b * 1.7, t); o1.frequency.exponentialRampToValueAtTime(b, t + 0.09);
    envAD(g.gain, t, 0.001, v * 0.8, 0.6);
    var n = noiseSrc(c, t, 0.15), lp = filt(c, 'lowpass', 900, 0.8), ng = c.createGain();
    envAD(ng.gain, t, 0.001, v * 0.35, 0.09);
    o1.connect(g); g.connect(out); n.connect(lp); lp.connect(ng); ng.connect(out);
    o1.start(t); o1.stop(t + 0.7); fin(o1, [o1, g, n, lp, ng]);
  };

  // ---------------------------------------------------------------- bard-song voices (classical / Irish / Arabic)
  // delayed vibrato on a frequency param (bowed strings, reeds): depth in cents
  function vibrato(c, t, dur, rate, cents, delay, targets) {
    var lfo = osc(c, 'sine', rate + rnd() * 0.4), lg = c.createGain();
    lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(0, t + Math.min(delay, dur * 0.5));
    lg.gain.linearRampToValueAtTime(cents, t + Math.min(delay + 0.35, dur * 0.8 + 0.05));
    lfo.connect(lg);
    for (var i = 0; i < targets.length; i++) lg.connect(targets[i]);
    return [lfo, lg];
  }
  // fretless plucked lute; short pitch fall into the note, woody body resonance
  function oudNote(out, t, f, v, dec) {
    var c = out.context, o1 = osc(c, 'sawtooth', f), o2 = osc(c, 'triangle', f * 2, 3), og = gainN(c, 0.35);
    o1.frequency.setValueAtTime(f * 1.012, t); o1.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    var lp = filt(c, 'lowpass', 0, 2), body = filt(c, 'peaking', 280, 1.4), g = c.createGain();
    body.gain.value = 5;
    lp.frequency.setValueAtTime(Math.min(f * 8, 9000), t); lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.3, 200), t + dec * 0.6);
    envAD(g.gain, t, 0.002, v * 0.4, dec);
    o1.connect(lp); o2.connect(og); og.connect(lp); lp.connect(body); body.connect(g); g.connect(out);
    o1.start(t); o2.start(t); o1.stop(t + dec + 0.05); o2.stop(t + dec + 0.05);
    fin(o1, [o1, o2, og, lp, body, g]);
  }
  I.oud = function (out, t, f, dur, v) { oudNote(out, t, f, v, Math.min(1.3, 0.45 + dur * 0.5)); };
  // risha tremolo: fast repeated plucks for the length of the note
  I.oudtrem = function (out, t, f, dur, v) {
    var n = Math.max(1, Math.min(16, Math.round(dur / 0.085))), step = dur / n;
    for (var i = 0; i < n; i++) oudNote(out, t + i * step, f, v * (i % 2 ? 0.6 : 0.85) * (i === 0 ? 1.2 : 1), 0.22);
  };
  // plucked zither: two slightly detuned strings per course, bright metallic attack
  I.qanun = function (out, t, f, dur, v) {
    I.pluck(out, t, f, dur, v * 0.75, { decay: 1.3, bright: 1.5, saw: 0.45 });
    I.pluck(out, t + 0.004, f * 1.003, dur, v * 0.4, { decay: 1.0, bright: 1.2, saw: 0.3 });
  };
  // end-blown reed flute: breathy, scooped attack, slow vibrato
  I.ney = function (out, t, f, dur, v) {
    var c = out.context, o1 = osc(c, 'sine', f), o2 = osc(c, 'triangle', f, 4), m2 = gainN(c, 0.35);
    o1.frequency.setValueAtTime(f * 0.97, t); o1.frequency.exponentialRampToValueAtTime(f, t + 0.12);
    o2.frequency.setValueAtTime(f * 0.97, t); o2.frequency.exponentialRampToValueAtTime(f, t + 0.12);
    var vb = vibrato(c, t, dur, 4.6, 16, 0.35, [o1.detune, o2.detune]);
    var g = c.createGain(), end = envSus(g.gain, t, 0.14, v * 0.34, dur, 0.3);
    var n = noiseSrc(c, t, dur + 0.6), bp = filt(c, 'bandpass', Math.min(f * 1.6, 7000), 0.9), ng = c.createGain();
    envSus(ng.gain, t, 0.08, v * 0.075, dur, 0.25);
    o1.connect(g); o2.connect(m2); m2.connect(g); g.connect(out); n.connect(bp); bp.connect(ng); ng.connect(out);
    o1.start(t); o2.start(t); vb[0].start(t); o1.stop(end); o2.stop(end); vb[0].stop(end);
    fin(o1, [o1, o2, m2, vb[0], vb[1], g, n, bp, ng]);
  };
  // double reed: buzzy saw through two formants
  I.oboe = function (out, t, f, dur, v) {
    var c = out.context, o1 = osc(c, 'sawtooth', f), o2 = osc(c, 'square', f, 3), m2 = gainN(c, 0.3);
    var vb = vibrato(c, t, dur, 5.4, 10, 0.25, [o1.detune, o2.detune]);
    var mix = c.createGain(), b1 = filt(c, 'bandpass', 1150, 1.8), b2 = filt(c, 'bandpass', 2900, 2.5), g1 = gainN(c, 1), g2 = gainN(c, 0.45);
    var lp = filt(c, 'lowpass', Math.min(f * 7, 7000), 0.7), g = c.createGain();
    var end = envSus(g.gain, t, 0.045, v * 0.55, dur, 0.12);
    o1.connect(mix); o2.connect(m2); m2.connect(mix);
    mix.connect(b1); b1.connect(g1); g1.connect(lp); mix.connect(b2); b2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(out);
    o1.start(t); o2.start(t); vb[0].start(t); o1.stop(end); o2.stop(end); vb[0].stop(end);
    fin(o1, [o1, o2, m2, vb[0], vb[1], mix, b1, b2, g1, g2, lp, g]);
  };
  // bowed strings: fiddle (bright, Irish) and kamancheh (nasal, sliding into notes)
  function bowed(out, t, f, dur, v, o) {
    var c = out.context, o1 = osc(c, 'sawtooth', f, -4), o2 = osc(c, 'sawtooth', f, 4);
    if (o.slide) {
      o1.frequency.setValueAtTime(f * o.slide, t); o1.frequency.exponentialRampToValueAtTime(f, t + 0.1);
      o2.frequency.setValueAtTime(f * o.slide, t); o2.frequency.exponentialRampToValueAtTime(f, t + 0.1);
    }
    var vb = vibrato(c, t, dur, o.rate || 5.6, o.vib || 14, 0.22, [o1.detune, o2.detune]);
    var hp = filt(c, 'highpass', 220, 0.7), fm = filt(c, 'peaking', o.formant || 2600, o.q || 2.5), lp = filt(c, 'lowpass', o.lp || 5200, 0.7), g = c.createGain();
    fm.gain.value = o.boost || 6;
    var end = envSus(g.gain, t, o.att || 0.07, v * (o.lvl || 0.16), dur, o.rel || 0.2);
    o1.connect(hp); o2.connect(hp); hp.connect(fm); fm.connect(lp); lp.connect(g); g.connect(out);
    o1.start(t); o2.start(t); vb[0].start(t); o1.stop(end); o2.stop(end); vb[0].stop(end);
    fin(o1, [o1, o2, vb[0], vb[1], hp, fm, lp, g]);
  }
  I.fiddle = function (out, t, f, dur, v) { bowed(out, t, f, dur, v, { att: 0.09, rel: 0.25 }); };
  I.kamancheh = function (out, t, f, dur, v) {
    bowed(out, t, f, dur, v, { slide: 0.95, formant: 1500, q: 1.6, boost: 8, lp: 4200, vib: 22, rate: 5.0, att: 0.12, rel: 0.35, lvl: 0.17 });
  };
  // Irish tin whistle: pure tone with a breathy edge and a quick "cut" grace note on longer notes
  I.whistle = function (out, t, f, dur, v) {
    var c = out.context, o1 = osc(c, 'triangle', f), o2 = osc(c, 'sine', f * 2), g2 = gainN(c, 0.08);
    if (dur > 0.3) { o1.frequency.setValueAtTime(f * 1.335, t); o1.frequency.setValueAtTime(f, t + 0.035); }
    var vb = vibrato(c, t, dur, 5.8, 9, 0.3, [o1.detune, o2.detune]);
    var n = noiseSrc(c, t, dur + 0.3), hp = filt(c, 'bandpass', Math.min(f * 2.5, 9000), 1.0), ng = c.createGain();
    envSus(ng.gain, t, 0.02, v * 0.04, Math.min(dur, 0.15), 0.15);
    var g = c.createGain(), end = envSus(g.gain, t, 0.02, v * 0.3, dur, 0.1);
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(out); n.connect(hp); hp.connect(ng); ng.connect(out);
    o1.start(t); o2.start(t); vb[0].start(t); o1.stop(end); o2.stop(end); vb[0].stop(end);
    fin(o1, [o1, o2, g2, vb[0], vb[1], n, hp, ng, g]);
  };
  // goblet drum: freq hint < 300 = doum (deep centre stroke, pitch = hint), >= 300 = tek (rim, bandpass at hint)
  I.darbuka = function (out, t, f, dur, v) {
    var c = out.context;
    if (!f || f < 300) {
      var b = f || 90, o1 = osc(c, 'sine', b), g = c.createGain();
      o1.frequency.setValueAtTime(b * 1.6, t); o1.frequency.exponentialRampToValueAtTime(b, t + 0.05);
      envAD(g.gain, t, 0.002, v * 0.75, 0.4);
      o1.connect(g); g.connect(out); o1.start(t); o1.stop(t + 0.5); fin(o1, [o1, g]);
    } else {
      var n = noiseSrc(c, t, 0.08), bp = filt(c, 'bandpass', f, 1.6), ng = c.createGain();
      envAD(ng.gain, t, 0.0008, v * 0.5, 0.05);
      var p = osc(c, 'triangle', f * 0.31), pg = c.createGain();
      envAD(pg.gain, t, 0.0008, v * 0.25, 0.06);
      n.connect(bp); bp.connect(ng); ng.connect(out); p.connect(pg); pg.connect(out);
      p.start(t); p.stop(t + 0.1); fin(p, [n, bp, ng, p, pg]);
    }
  };
  // hearth embers: a couple of tiny crackles
  I.ember = function (out, t, f, dur, v) {
    var k = 1 + Math.floor(rnd() * 3);
    for (var i = 0; i < k; i++) noise(out, t + rnd() * 0.25, 0.012 + rnd() * 0.02, v * (0.15 + rnd() * 0.2), 'bandpass', 1500 + rnd() * 3000, 0, 1.5, 0.001);
  };

  // ---------------------------------------------------------------- per-part FX chains
  // FX[name](ctx, dest, part, section, nodeList) -> input node (nodes registered for disposal)
  var distCurve = null;
  function getDistCurve() {
    if (!distCurve) {
      var n = 2048, k = 6;
      distCurve = new Float32Array(n);
      for (var i = 0; i < n; i++) { var x = i * 2 / (n - 1) - 1; distCurve[i] = Math.tanh(k * x) / Math.tanh(k); }
    }
    return distCurve;
  }
  var FX = {
    dist: function (c, dest, p, sec, list) { // amp + cabinet
      var drive = gainN(c, p.drive || 5), ws = c.createWaveShaper();
      ws.curve = getDistCurve(); ws.oversample = '2x';
      var hp = filt(c, 'highpass', 85, 0.7), scoop = filt(c, 'peaking', 650, 1.2), pres = filt(c, 'peaking', 2600, 1.5);
      scoop.gain.value = -5; pres.gain.value = 3;
      var cab = filt(c, 'lowpass', 4600, 0.9), cab2 = filt(c, 'lowpass', 6500, 0.7), lvl = gainN(c, p.level || 0.27);
      drive.connect(ws); ws.connect(hp); hp.connect(scoop); scoop.connect(pres); pres.connect(cab); cab.connect(cab2); cab2.connect(lvl); lvl.connect(dest);
      list.push(drive, ws, hp, scoop, pres, cab, cab2, lvl);
      return drive;
    },
    echo: function (c, dest, p, sec, list) { // tempo-synced feedback delay
      var inp = c.createGain(), d = c.createDelay(2), fb = gainN(c, p.fb || 0.35), wl = gainN(c, p.wet || 0.4), tone = filt(c, 'lowpass', 2500, 0.5);
      d.delayTime.value = Math.min(1.9, (p.echo || 3) * sec.sd);
      inp.connect(dest); inp.connect(d); d.connect(tone); tone.connect(fb); fb.connect(d); tone.connect(wl); wl.connect(dest);
      list.push(inp, d, fb, wl, tone);
      return inp;
    }
  };

  // continuous drones that run for the whole life of a player (pipes / hurdy-gurdy)
  function makeDrone(pl, c, d, now) {
    var root = parseNote(d.root), f = mtof(root), kind = d.kind || 'pipe';
    var lp = filt(c, 'lowpass', kind === 'pipe' ? 1800 : 1100, 0.8), bp = filt(c, 'peaking', 1000, 1.5);
    bp.gain.value = kind === 'pipe' ? 5 : 3;
    var g = gainN(c, d.vol || 0.05), send = gainN(c, d.rev == null ? 0.3 : d.rev);
    lp.connect(bp); bp.connect(g); g.connect(pl.out); g.connect(send); send.connect(pl.wet);
    pl.nodes.push(lp, bp, g, send);
    // bass drone (root), tenor drone (root an octave up, slightly beating), fifth an octave below the tenor
    var V = [[f, 'sawtooth', 0, 1], [f * 2, 'sawtooth', 3, 0.7], [f * 2, 'square', -4, 0.3], [f * 1.5, 'sawtooth', 2, 0.45]];
    for (var i = 0; i < V.length; i++) {
      var x = osc(c, V[i][1], V[i][0], V[i][2]), xg = gainN(c, V[i][3]);
      x.connect(xg); xg.connect(lp); x.start(now); pl.srcs.push(x); pl.nodes.push(x, xg);
    }
  }

  K.I = I; K.FX = FX; K.makeDrone = makeDrone; K.VOWEL_AH = VOWEL_AH; K.VOWEL_OO = VOWEL_OO;
})();
