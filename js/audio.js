/* Velmoor audio module: all music and sound effects synthesized live with the Web Audio API.
 * Plain script (no modules). Exposes window.BT.audio.
 * Every public call is a safe no-op before init() or when Web Audio is unavailable.
 */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  root.BT = root.BT || {};
  var BT = root.BT;
  var AC = root.AudioContext || root.webkitAudioContext || null;
  var STORE = 'bt_audio';

  // ---------------------------------------------------------------- settings
  var settings = { music: 0.7, sfx: 0.85, muted: false };
  function loadSettings() {
    try {
      var s = root.localStorage && root.localStorage.getItem(STORE);
      if (s) {
        var o = JSON.parse(s);
        if (typeof o.music === 'number') settings.music = clamp01(o.music);
        if (typeof o.sfx === 'number') settings.sfx = clamp01(o.sfx);
        if (typeof o.muted === 'boolean') settings.muted = o.muted;
      }
    } catch (e) { /* ignore */ }
  }
  function saveSettings() {
    try { if (root.localStorage) root.localStorage.setItem(STORE, JSON.stringify(settings)); } catch (e) { /* ignore */ }
  }
  function clamp01(v) { v = +v; if (!(v >= 0)) return 0; return v > 1 ? 1 : v; }
  function volCurve(v) { return v * v; }
  loadSettings();

  var rnd = Math.random;
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function rep(s, n) { var r = ''; for (var i = 0; i < n; i++) r += s; return r; }

  // ---------------------------------------------------------------- low-level helpers
  function fin(src, nodes) {
    src.onended = function () {
      for (var i = 0; i < nodes.length; i++) { try { nodes[i].disconnect(); } catch (e) { /* */ } }
    };
  }
  function getNoise(c) {
    if (!c._btNoise) {
      var len = Math.floor(c.sampleRate * 2), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = rnd() * 2 - 1;
      c._btNoise = b;
    }
    return c._btNoise;
  }
  function noiseSrc(c, t, dur) {
    var s = c.createBufferSource();
    s.buffer = getNoise(c); s.loop = true;
    s.start(t, rnd() * 1.5); s.stop(t + dur + 0.05);
    return s;
  }
  function makeIR(c, secs, decay) {
    var len = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, len, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch), y = 0, pre = Math.floor(c.sampleRate * 0.012);
      for (var i = 0; i < len; i++) {
        if (i < pre) { d[i] = 0; continue; }
        var x = (rnd() * 2 - 1) * Math.pow(1 - i / len, decay);
        var a = 0.85 - 0.7 * (i / len);          // darker as it decays
        y += a * (x - y);
        d[i] = y;
      }
    }
    return b;
  }
  // percussive envelope
  function envAD(p, t, a, peak, d) {
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(peak, t + a);
    p.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  // sustained envelope (robust to any dur/attack combination); returns end time
  function envSus(p, t, a, peak, dur, r) {
    p.setValueAtTime(0, t);
    p.setTargetAtTime(peak, t, a / 3);
    p.setTargetAtTime(0, t + Math.max(dur, 0.01), r / 3);
    return t + Math.max(dur, 0.01) + r * 1.7;
  }
  function osc(c, type, f, det) {
    var o = c.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; return o;
  }
  function gainN(c, v) { var g = c.createGain(); g.gain.value = v; return g; }
  function filt(c, type, f, q) { var b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q != null) b.Q.value = q; return b; }

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
      var cab = filt(c, 'lowpass', 4600, 0.9), cab2 = filt(c, 'lowpass', 6500, 0.7), lvl = gainN(c, p.level || 0.22);
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

  var TITLE_MEL =
    'A4:3 B4 C5:2 E5:2 | D5:4 C5:2 A4:2 | G4:3 A4 C5:2 G4:2 | B4:6 -:2 |' +
    'A4:3 B4 C5:2 E5:2 | F5:4 E5:2 D5:2 | E5:4 G#4:2 B4:2 | E5:6 -:2 |' +
    'A5:3 G5 F5:2 E5:2 | D5:3 E5 F5:2 D5:2 | E5:3 D5 B4:2 G4:2 | A4:6 -:2 |' +
    'F5:3 E5 D5:2 A4:2 | C5:3 B4 A4:2 E5:2 | G#4:3 A4 B4:2 E4:2 | A4:8';

  // Track definitions. bpm = beats/min, div = steps per beat, bar = steps per bar.
  var TRACKS = {
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
    combat: {
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
    },
    boss: {
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
      bpm: 150, div: 4, bar: 16, rev: 0.3, gain: 1,
      drone: { root: 'D2', kind: 'gurdy', vol: 0.035, rev: 0.4 },
      chords: 'D5 D5 Eb5 D5 D5 D5 Bb5 C5 D5 D5 Eb5 D5 D5 D5 Bb5 C5 G5 G5 Eb5 Eb5 Bb5 Bb5 A5 A5 G5 Eb5 Bb5 F5 G5 Eb5 A5 A5',
      parts: [
        { t: 'mel', inst: 'gurdy', mel: uMel, tr: -12, v: 0.9, vol: 0.85, rev: 0.6, fx: 'echo', echo: 3, fb: 0.38, wet: 0.45 },
        { t: 'bass', inst: 'chug', fx: 'dist', pat: rep(uChugBar, 16) + rep(R16, 8) + rep(uChugBar, 8), offs: uOffs, oct: 2, dur: 1, v: 0.9, vol: 1, rev: 0.08 },
        { t: 'bass', inst: 'gtr', fx: 'dist', pat: rep(R16, 16) + rep('X.......X.......', 8) + rep(R16, 8), oct: 2, dur: 8, v: 0.9, vol: 0.9, rev: 0.25 },
        { t: 'bass', inst: 'bass', pat: rep('X.x.X.x.X.x.X.x.', 16) + rep('X.......X.......', 8) + rep('X.x.X.x.X.x.X.x.', 8), offs: uOffs, oct: 1, dur: 1.8, v: 0.75, vol: 0.9, rev: 0.03 },
        { t: 'drum', inst: 'mkick', pat: rep('X.x.X.x.X.xxX.x.', 8) + rep('X.x.X.x.X.x.xxxx', 8) + rep('xXxXxXxXxXxXxXxX', 16), v: 0.8, vol: 0.85, rev: 0.05 },
        { t: 'drum', inst: 'msnare', pat: rep('....X.......X...', 16) + rep('........X.......', 8) + rep('....X.......X...', 8), v: 0.85, vol: 0.8, rev: 0.3 },
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
      bpm: 140, div: 3, bar: 12, rev: 0.25, gain: 1,
      drone: { root: 'A2', kind: 'pipe', vol: 0.04, rev: 0.3 },
      chords: 'A5 A5 G5 D5 A5 A5 G5 E5 A5 A5 G5 D5 A5 A5 G5 A5 D5 A5 G5 A5 D5 A5 E5 E5 F#5 D5 A5 E5 F#5 D5 G5 A5',
      parts: [
        { t: 'mel', inst: 'pipe', mel: cMel, v: 0.9, vol: 0.9, rev: 0.3 },
        { t: 'mel', inst: 'flute', mel: '-:192 |' + cB, tr: 12, v: 0.5, vol: 0.55, rev: 0.3 },
        { t: 'bass', inst: 'chug', fx: 'dist', pat: rep(gal, 16) + rep('XxxXxxXxxXxx', 8) + rep(gal, 8), oct: 2, dur: 1, v: 0.9, vol: 0.95, rev: 0.08 },
        { t: 'bass', inst: 'gtr', fx: 'dist', pat: rep(R12, 24) + rep('X.....X.....', 8), oct: 2, dur: 6, v: 0.8, vol: 0.7, rev: 0.2 },
        { t: 'bass', inst: 'bass', pat: rep(gal, 32), oct: 1, dur: 1.5, v: 0.7, vol: 0.85, rev: 0.03 },
        { t: 'chord', inst: 'shout', pat: rep(R12, 8) + rep(R12 + '.........X..', 4) + rep(R12, 8) + rep('X.....X.....', 8), oct: 3, v: 0.7, vol: 0.6, rev: 0.4 },
        { t: 'drum', inst: 'mkick', pat: rep(gal, 15) + 'X.xX.xXxxXxx' + rep('X..X..X..X..', 8) + rep('XxxXxxXxxXxx', 8), v: 0.8, vol: 0.85, rev: 0.05 },
        { t: 'drum', inst: 'msnare', pat: rep(rep('...X.....X..', 7) + '...X.....XXX', 4), v: 0.8, vol: 0.75, rev: 0.25 },
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
        { bpm: 132, div: 4, bar: 16, rev: 0.4, gain: 1,
          chords: 'E5 D5 A5 E5 E5 D5 G5 A5 E5 D5 A5 E5 G5 D5 A5 A5',
          parts: [
            { t: 'mel', inst: 'pipe', mel: wA, v: 0.9, vol: 0.85, rev: 0.4 },
            { t: 'mel', inst: 'horn', mel: wA, tr: -12, v: 0.8, vol: 0.75, rev: 0.4 },
            { t: 'bass', inst: 'gtr', fx: 'dist', pat: rep('X...............', 16), oct: 2, dur: 16, v: 0.9, vol: 0.9, rev: 0.3 },
            { t: 'bass', inst: 'chug', fx: 'dist', pat: rep(R16, 8) + rep('x.x.x.x.x.x.x.x.', 8), oct: 2, dur: 1, v: 0.7, vol: 0.7, rev: 0.1 },
            { t: 'bass', inst: 'bass', pat: rep('X.......X.......', 8) + rep('X.x.X.x.X.x.X.x.', 8), oct: 1, dur: 7, v: 0.7, vol: 0.85, rev: 0.05 },
            { t: 'drum', inst: 'wartom', f: 70, pat: rep('X..x..X.X.......', 16), v: 0.9, vol: 0.8, rev: 0.4 },
            { t: 'drum', inst: 'wartom', f: 120, pat: rep('..........X.x.x.', 16), v: 0.7, vol: 0.7, rev: 0.4 },
            { t: 'drum', inst: 'mkick', pat: rep('X.......X.......', 8) + rep('X.......X.x.....', 8), v: 0.8, vol: 0.85, rev: 0.1 },
            { t: 'drum', inst: 'msnare', pat: rep('........X.......', 8) + rep('....X.......X...', 7) + '....X.......XXXX', v: 0.85, vol: 0.8, rev: 0.4 },
            { t: 'drum', inst: 'crash', pat: rep('X' + rep('.', 63), 4), v: 0.8, vol: 0.6, rev: 0.4 }
          ] },
        { bpm: 160, div: 4, bar: 16, rev: 0.3, gain: 1,
          chords: 'G5 D5 A5 E5 G5 D5 A5 A5 E5 D5 A5 E5 G5 A5 B5 E5',
          parts: [
            { t: 'mel', inst: 'pipe', mel: wB, v: 0.9, vol: 0.85, rev: 0.35 },
            { t: 'mel', inst: 'horn', mel: wB, tr: -12, v: 0.8, vol: 0.7, rev: 0.35 },
            { t: 'bass', inst: 'chug', fx: 'dist', pat: rep('X.xxX.xxX.xxX.xx', 16), oct: 2, dur: 1, v: 0.9, vol: 0.95, rev: 0.08 },
            { t: 'bass', inst: 'gtr', fx: 'dist', pat: rep('X...............', 16), oct: 3, dur: 8, v: 0.6, vol: 0.55, rev: 0.25 },
            { t: 'bass', inst: 'bass', pat: rep('X.x.X.x.X.x.X.x.', 16), oct: 1, dur: 1.8, v: 0.75, vol: 0.85, rev: 0.03 },
            { t: 'drum', inst: 'mkick', pat: rep('X.xxX.xxX.xxX.xx', 8) + rep('xXxXxXxXxXxXxXxX', 8), v: 0.8, vol: 0.85, rev: 0.05 },
            { t: 'drum', inst: 'msnare', pat: rep('....X.......X...', 16), v: 0.85, vol: 0.8, rev: 0.3 },
            { t: 'drum', inst: 'ride', pat: rep('X.x.X.x.X.x.X.x.', 16), v: 0.7, vol: 0.55, rev: 0.2 },
            { t: 'drum', inst: 'wartom', f: 120, pat: rep(fillHi, 2), v: 0.8, vol: 0.7, rev: 0.3 },
            { t: 'drum', inst: 'wartom', f: 75, pat: rep(fillLo, 2), v: 0.9, vol: 0.7, rev: 0.3 },
            { t: 'drum', inst: 'crash', pat: rep('X' + rep('.', 63), 4), v: 0.8, vol: 0.6, rev: 0.3 }
          ] }
      ]
    };
  })();
  var TRACK_NAMES = ['title', 'town', 'tavern', 'temple', 'dungeon', 'crypt', 'tower', 'combat', 'boss', 'victory', 'gameover', 'ending',
    'combat_underground', 'combat_city', 'combat_wild'];

  // compile track data (pure data, done once)
  function compileSection(s) {
    if (s._c) return s;
    s.sd = 60 / (s.bpm * s.div);
    s.chordData = s.chords.trim().split(/\s+/).map(parseChord);
    s.len = s.chordData.length * s.bar;
    for (var i = 0; i < s.parts.length; i++) {
      var p = s.parts[i];
      if (p.mel) { var pm = parseMel(p.mel, p.xf); p.ev = pm.ev; p.len = pm.len; }
      if (typeof p.pat === 'string') p.pat = cleanPat(p.pat);
      if (!I[p.inst]) throw new Error('unknown instrument ' + p.inst);
    }
    s._c = true;
    return s;
  }
  function compileTrack(name) {
    var tr = TRACKS[name];
    if (tr.intro) compileSection(tr.intro);
    if (tr.seq) { for (var i = 0; i < tr.seq.length; i++) compileSection(tr.seq[i]); }
    else compileSection(tr);
    return tr;
  }
  // sections a player walks through; loop restarts at loopStart
  function trackSections(tr) {
    var secs = tr.intro ? [tr.intro] : [];
    return secs.concat(tr.seq || [tr]);
  }

  // ---------------------------------------------------------------- audio graph
  var G = null;        // live graph
  var timer = null;
  var players = [];
  var curTrack = null; // track requested (may be pending before init)
  var FADE = 1.0;

  function buildGraph(c) {
    var g = { ctx: c };
    g.master = gainN(c, settings.muted ? 0 : 1);
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4;
    comp.attack.value = 0.004; comp.release.value = 0.25;
    var post = gainN(c, 0.9);
    g.master.connect(comp); comp.connect(post); post.connect(c.destination);
    g.reverb = c.createConvolver();
    g.reverb.buffer = makeIR(c, 2.8, 2.6);
    var revRet = gainN(c, 0.8);
    g.reverb.connect(revRet); revRet.connect(g.master);
    g.musicBus = gainN(c, volCurve(settings.music)); g.musicBus.connect(g.master);
    g.musicWet = gainN(c, volCurve(settings.music)); g.musicWet.connect(g.reverb);
    g.sfxBus = gainN(c, volCurve(settings.sfx)); g.sfxBus.connect(g.master);
    g.sfxWet = gainN(c, volCurve(settings.sfx)); g.sfxWet.connect(g.reverb);
    return g;
  }

  function Player(g, name, fade) {
    var tr = compileTrack(name), c = g.ctx, now = c.currentTime;
    this.g = g; this.name = name;
    this.out = c.createGain(); this.wet = c.createGain();
    this.out.connect(g.musicBus); this.wet.connect(g.musicWet);
    this.out.gain.setValueAtTime(0.0001, now); this.out.gain.linearRampToValueAtTime(1, now + fade + 0.01);
    this.wet.gain.setValueAtTime(0.0001, now); this.wet.gain.linearRampToValueAtTime(1, now + fade + 0.01);
    this.secs = trackSections(tr);
    this.loopStart = tr.intro ? 1 : 0;
    this.nodes = [this.out, this.wet];
    this.srcs = [];
    this.pn = [];
    if (tr.drone) makeDrone(this, c, tr.drone, now);
    for (var si = 0; si < this.secs.length; si++) {
      var sec = this.secs[si], arr = [];
      for (var i = 0; i < sec.parts.length; i++) {
        var p = sec.parts[i], pg = gainN(c, (p.vol == null ? 1 : p.vol) * (sec.gain || 1)), ps = gainN(c, p.rev == null ? (sec.rev || 0.3) : p.rev);
        pg.connect(this.out); pg.connect(ps); ps.connect(this.wet);
        this.nodes.push(pg, ps);
        arr.push(p.fx ? FX[p.fx](c, pg, p, sec, this.nodes) : pg);
      }
      this.pn.push(arr);
    }
    this.si = 0; this.step = 0; this.next = now + 0.06;
    this.stopAt = Infinity;
  }
  Player.prototype.fadeOut = function (fade) {
    var c = this.g.ctx, now = c.currentTime;
    var gs = [this.out.gain, this.wet.gain];
    for (var i = 0; i < 2; i++) {
      var p = gs[i], v = p.value;
      if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(now); else { p.cancelScheduledValues(now); p.setValueAtTime(v, now); }
      p.linearRampToValueAtTime(0.0001, now + fade);
    }
    this.stopAt = now + fade;
  };
  Player.prototype.dispose = function () {
    for (var j = 0; j < this.srcs.length; j++) { try { this.srcs[j].stop(); } catch (e) { /* */ } }
    for (var i = 0; i < this.nodes.length; i++) { try { this.nodes[i].disconnect(); } catch (e) { /* */ } }
    this.nodes = []; this.dead = true;
  };
  Player.prototype.advance = function (until) {
    var c = this.g.ctx;
    // after a long stall (e.g. throttled background tab) skip forward instead of bursting notes
    if (this.next < c.currentTime - 0.25) {
      while (this.next < c.currentTime) this._inc();
    }
    var lim = Math.min(until, this.stopAt);
    while (this.next < lim) {
      this.playStep(this.secs[this.si], this.pn[this.si], this.step, this.next);
      this._inc();
    }
  };
  Player.prototype._inc = function () {
    var sec = this.secs[this.si];
    this.next += sec.sd; this.step++;
    if (this.step >= sec.len) { this.step = 0; this.si++; if (this.si >= this.secs.length) this.si = this.loopStart; }
  };
  Player.prototype.playStep = function (sec, outs, s, t) {
    var bar = Math.floor(s / sec.bar), ch = sec.chordData[bar % sec.chordData.length], sd = sec.sd;
    for (var i = 0; i < sec.parts.length; i++) {
      var p = sec.parts[i], out = outs[i], inst = I[p.inst], v = p.v || 0.7, k, a;
      try {
        switch (p.t) {
          case 'mel':
            var e = p.ev[s % p.len];
            if (e) inst(out, t, mtof(e.m + (p.tr || 0)), e.d * sd * 0.95, v * (0.92 + rnd() * 0.08));
            break;
          case 'arp':
            var ev = p.every || 1;
            if (s % ev === 0) {
              var idx = p.pat[Math.floor(s / ev) % p.pat.length];
              if (idx != null) inst(out, t, mtof(chordTone(ch, idx, p.oct)), (p.dur || 1) * sd, v * (0.85 + rnd() * 0.15));
            }
            break;
          case 'chord':
            a = patVel(p.pat, s);
            if (a) for (k = 0; k < ch.iv.length; k++) inst(out, t, mtof(chordTone(ch, k, p.oct)), (p.dur || sec.bar) * sd, v * a);
            break;
          case 'bass':
            a = patVel(p.pat, s);
            if (a) inst(out, t, mtof(chordTone(ch, 0, p.oct) + (p.offs ? p.offs[s % p.offs.length] : 0)), (p.dur || 1) * sd, v * a);
            break;
          case 'drum':
            a = patVel(p.pat, s);
            if (a) inst(out, t, p.f || 0, (p.dur || 1) * sd, v * a);
            break;
          case 'rand':
            if ((!p.pat || patVel(p.pat, s)) && rnd() < p.prob) {
              inst(out, t, mtof(chordTone(ch, Math.floor(rnd() * ch.iv.length * 2), p.oct)), (p.dur || 2) * sd, v * (0.6 + rnd() * 0.4));
            }
            break;
        }
      } catch (err) { /* never let one bad note kill the scheduler */ }
    }
  };

  function tick() {
    if (!G) return;
    var c = G.ctx, now = c.currentTime;
    var hidden = root.document && root.document.hidden;
    var horizon = now + (hidden ? 1.5 : 0.12);
    for (var i = players.length - 1; i >= 0; i--) {
      var pl = players[i];
      if (now > pl.stopAt + 0.5) { pl.dispose(); players.splice(i, 1); continue; }
      pl.advance(horizon);
    }
  }

  function startTrack(name) {
    for (var i = 0; i < players.length; i++) if (players[i].stopAt === Infinity) players[i].fadeOut(FADE);
    if (name) {
      var pl = new Player(G, name, FADE);
      players.push(pl);
      pl.advance(G.ctx.currentTime + 0.12);
    }
  }

  // ---------------------------------------------------------------- SFX
  function tone(out, t, f, dur, type, vol, to, a) {
    var c = out.context, o = osc(c, type || 'sine', f), g = c.createGain();
    if (to) o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);
    envAD(g.gain, t, a || 0.005, vol, Math.max(dur - (a || 0.005), 0.01));
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05); fin(o, [o, g]);
    return o;
  }
  function noise(out, t, dur, vol, ft, f, to, q, a) {
    var c = out.context, n = noiseSrc(c, t, dur), fl = filt(c, ft || 'lowpass', f || 1000, q == null ? 1 : q), g = c.createGain();
    if (to) fl.frequency.exponentialRampToValueAtTime(Math.max(to, 20), t + dur);
    envAD(g.gain, t, a || 0.003, vol, Math.max(dur - (a || 0.003), 0.01));
    n.connect(fl); fl.connect(g); g.connect(out); fin(n, [n, fl, g]);
    return fl;
  }
  // vocal-ish sound: saw through formant filters
  function voice(out, t, f, to, dur, vol, fm, a) {
    a = a || 0.02;
    var c = out.context, o = osc(c, 'sawtooth', f), g = c.createGain(), nodes = [o, g];
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    envAD(g.gain, t, a || 0.02, vol, dur);
    for (var i = 0; i < fm.length; i++) {
      var bp = filt(c, 'bandpass', fm[i][0], fm[i][2]), bg = gainN(c, fm[i][1]);
      o.connect(bp); bp.connect(bg); bg.connect(g); nodes.push(bp, bg);
    }
    g.connect(out); o.start(t); o.stop(t + a + dur + 0.05); fin(o, nodes);
    return o;
  }
  function crackle(out, t, dur, n, vol, f) {
    for (var i = 0; i < n; i++) noise(out, t + rnd() * dur, 0.015 + rnd() * 0.02, vol * (0.4 + rnd() * 0.6), 'bandpass', f * (0.6 + rnd() * 0.8), 0, 2);
  }
  var VOW_OOF = [[500, 1, 5], [900, 0.5, 6]];
  var VOW_UH = [[600, 1, 6], [1000, 0.6, 7], [2400, 0.15, 8]];

  // each: function(out, t, pitch) -> duration seconds
  var SFX = {
    step: function (o, t, p) {
      var f = (280 + rnd() * 220) * p;
      noise(o, t, 0.09 + rnd() * 0.03, 0.55, 'lowpass', f, f * 0.5, 1);
      tone(o, t, (70 + rnd() * 15) * p, 0.08, 'sine', 0.35, 45 * p);
      return 0.2;
    },
    bump: function (o, t, p) {
      tone(o, t, 95 * p, 0.28, 'sine', 0.9, 38 * p);
      noise(o, t, 0.12, 0.6, 'lowpass', 260 * p, 120, 1);
      voice(o, t + 0.04, 150 * p, 95 * p, 0.2, 0.55, VOW_OOF, 0.02);
      return 0.4;
    },
    door: function (o, t, p) {
      var c = o.context, d = 0.9;
      var s = osc(c, 'sawtooth', 70 * p), bp = filt(c, 'bandpass', 900 * p, 7), g = c.createGain();
      var am = osc(c, 'square', 28), amg = gainN(c, 0.5), dc = gainN(c, 0);
      s.frequency.setValueAtTime(70 * p, t);
      s.frequency.linearRampToValueAtTime(95 * p, t + 0.25);
      s.frequency.linearRampToValueAtTime(62 * p, t + 0.55);
      s.frequency.linearRampToValueAtTime(110 * p, t + d);
      am.frequency.setValueAtTime(22, t); am.frequency.linearRampToValueAtTime(40, t + d);
      bp.frequency.setValueAtTime(700 * p, t); bp.frequency.linearRampToValueAtTime(1400 * p, t + d);
      envSus(g.gain, t, 0.06, 0.5, d - 0.1, 0.1);
      am.connect(amg); amg.connect(g.gain);
      s.connect(bp); bp.connect(g); g.connect(o);
      s.start(t); am.start(t); s.stop(t + d + 0.3); am.stop(t + d + 0.3); fin(s, [s, bp, g, am, amg, dc]);
      tone(o, t + d, 85 * p, 0.25, 'sine', 0.8, 45 * p);
      noise(o, t + d, 0.15, 0.5, 'lowpass', 400 * p, 150, 1);
      return d + 0.5;
    },
    stairs: function (o, t, p) {
      for (var i = 0; i < 5; i++) {
        var tt = t + i * 0.13, f = (420 - i * 45) * p;
        noise(o, tt, 0.1, 0.5 - i * 0.05, 'lowpass', f, f * 0.4, 1.5);
        tone(o, tt, (90 - i * 6) * p, 0.09, 'sine', 0.35, 50 * p);
      }
      return 0.9;
    },
    menu_move: function (o, t, p) {
      tone(o, t, 1900 * p, 0.025, 'square', 0.07, 1500 * p, 0.001);
      return 0.06;
    },
    menu_select: function (o, t, p) {
      tone(o, t, 880 * p, 0.08, 'triangle', 0.3, 0, 0.003);
      tone(o, t + 0.06, 1320 * p, 0.14, 'triangle', 0.3, 0, 0.003);
      return 0.25;
    },
    error: function (o, t, p) {
      tone(o, t, 160 * p, 0.28, 'square', 0.16, 140 * p);
      tone(o, t, 152 * p, 0.28, 'sawtooth', 0.12, 133 * p);
      return 0.35;
    },
    coin: function (o, t, p) {
      tone(o, t, 1480 * p, 0.09, 'square', 0.08, 0, 0.002);
      I.bell(o, t + 0.07, 1975 * p, 0.3, 0.6, { decay: 0.6 });
      for (var i = 0; i < 6; i++) I.bell(o, t + 0.04 + i * 0.045 + rnd() * 0.02, (2600 + rnd() * 2600) * p, 0.1, 0.28, { decay: 0.25 });
      return 0.8;
    },
    chest: function (o, t, p) {
      var c = o.context, s = osc(c, 'sawtooth', 80 * p), bp = filt(c, 'bandpass', 1100 * p, 8), g = c.createGain();
      s.frequency.setValueAtTime(80 * p, t); s.frequency.linearRampToValueAtTime(130 * p, t + 0.45);
      envSus(g.gain, t, 0.04, 0.4, 0.35, 0.1);
      s.connect(bp); bp.connect(g); g.connect(o); s.start(t); s.stop(t + 0.6); fin(s, [s, bp, g]);
      noise(o, t, 0.03, 0.5, 'highpass', 2500 * p, 0, 1); // latch click
      tone(o, t + 0.45, 90 * p, 0.2, 'sine', 0.6, 50 * p);
      noise(o, t + 0.45, 0.1, 0.35, 'lowpass', 500 * p, 0, 1);
      var n = [72, 76, 79, 84, 88];
      for (var i = 0; i < n.length; i++) I.bell(o, t + 0.55 + i * 0.06, mtof(n[i]) * p, 0.2, 0.35, { decay: 1.0 });
      return 1.8;
    },
    trap: function (o, t, p) {
      noise(o, t, 0.04, 1.0, 'highpass', 1800 * p, 0, 0.8, 0.001);
      tone(o, t, 900 * p, 0.05, 'square', 0.3, 200 * p, 0.001);
      tone(o, t, 120 * p, 0.15, 'sine', 0.6, 50 * p);
      noise(o, t + 0.05, 1.1, 0.35, 'highpass', 4000 * p, 6000 * p, 0.7, 0.05);
      return 1.3;
    },
    hit: function (o, t, p) {
      noise(o, t, 0.1, 0.4, 'bandpass', 2600 * p, 700 * p, 1.5, 0.02);
      noise(o, t + 0.07, 0.1, 0.8, 'lowpass', 1800 * p, 300, 0.8, 0.001);
      tone(o, t + 0.07, 140 * p, 0.16, 'sine', 0.8, 50 * p);
      return 0.35;
    },
    crit: function (o, t, p) {
      noise(o, t, 0.12, 0.5, 'bandpass', 3000 * p, 600 * p, 1.5, 0.02);
      noise(o, t + 0.09, 0.2, 1.0, 'lowpass', 2500 * p, 200, 0.8, 0.001);
      tone(o, t + 0.09, 110 * p, 0.45, 'sine', 1.0, 32 * p);
      tone(o, t + 0.09, 60 * p, 0.35, 'triangle', 0.5, 30 * p);
      I.bell(o, t + 0.09, 620 * p, 0.3, 0.5, { decay: 0.9 });
      noise(o, t + 0.09, 0.6, 0.25, 'highpass', 4000, 0, 0.7);
      return 1.0;
    },
    miss: function (o, t, p) {
      var f = noise(o, t, 0.28, 0.45, 'bandpass', 500 * p, 0, 2.5, 0.08);
      f.frequency.setValueAtTime(500 * p, t);
      f.frequency.exponentialRampToValueAtTime(2600 * p, t + 0.12);
      f.frequency.exponentialRampToValueAtTime(400 * p, t + 0.28);
      return 0.35;
    },
    block: function (o, t, p) {
      noise(o, t, 0.03, 0.6, 'highpass', 2000 * p, 0, 0.8, 0.001);
      var P = [820, 1263, 1907, 2680];
      for (var i = 0; i < P.length; i++) tone(o, t, P[i] * p, 0.35 - i * 0.05, 'sine', 0.2 - i * 0.03, 0, 0.001);
      tone(o, t, 120 * p, 0.12, 'sine', 0.5, 70 * p);
      return 0.45;
    },
    monster_hit: function (o, t, p) {
      noise(o, t, 0.13, 0.75, 'lowpass', 900 * p, 250, 1.5, 0.002);
      tone(o, t, 210 * p, 0.16, 'sine', 0.6, 70 * p);
      voice(o, t + 0.02, 110 * p, 80 * p, 0.2, 0.45, VOW_UH, 0.01);
      return 0.35;
    },
    monster_die: function (o, t, p) {
      var c = o.context, v = voice(o, t, 200 * p, 38 * p, 0.95, 0.6, VOW_UH, 0.03);
      var lfo = osc(c, 'sine', 14), lg = gainN(c, 18 * p);
      lfo.connect(lg); lg.connect(v.frequency); lfo.start(t); lfo.stop(t + 1.05); fin(lfo, [lfo, lg]);
      noise(o, t, 0.9, 0.35, 'lowpass', 1200 * p, 150, 1, 0.05);
      tone(o, t + 0.6, 80 * p, 0.4, 'sine', 0.6, 35 * p);
      return 1.2;
    },
    party_hurt: function (o, t, p) {
      tone(o, t, 120 * p, 0.15, 'sine', 0.7, 55 * p);
      noise(o, t, 0.08, 0.5, 'lowpass', 800 * p, 200, 1, 0.001);
      voice(o, t + 0.02, 230 * p, 160 * p, 0.2, 0.55, VOW_UH, 0.015);
      return 0.35;
    },
    death: function (o, t, p) {
      voice(o, t, 260 * p, 90 * p, 1.0, 0.5, VOW_UH, 0.03);
      var n = [62, 58, 55, 50];
      for (var i = 0; i < n.length; i++) I.bell(o, t + 0.25 + i * 0.32, mtof(n[i]) * p, 0.3, 0.45, { decay: 1.8 });
      I.pad(o, t + 0.2, mtof(38) * p, 1.6, 0.9, { bright: 0.6, att: 0.3, rel: 1.0 });
      return 3.0;
    },
    spell_fire: function (o, t, p) {
      var f = noise(o, t, 0.9, 0.7, 'lowpass', 300 * p, 0, 1.2, 0.15);
      f.frequency.setValueAtTime(300 * p, t);
      f.frequency.exponentialRampToValueAtTime(3200 * p, t + 0.35);
      f.frequency.exponentialRampToValueAtTime(500 * p, t + 0.9);
      tone(o, t, 70 * p, 0.8, 'sawtooth', 0.12, 45 * p, 0.1);
      tone(o, t, 55 * p, 0.8, 'sine', 0.5, 40 * p, 0.1);
      crackle(o, t + 0.1, 0.8, 14, 0.5, 2500 * p);
      return 1.1;
    },
    spell_ice: function (o, t, p) {
      noise(o, t, 0.7, 0.3, 'highpass', 5000 * p, 9000, 0.7, 0.2);
      var n = [88, 91, 95, 98, 100, 103, 107];
      for (var i = 0; i < n.length; i++) I.bell(o, t + i * 0.06 + rnd() * 0.03, mtof(n[i]) * 0.5 * p, 0.2, 0.35, { decay: 0.9 });
      tone(o, t, 2400 * p, 0.6, 'sine', 0.08, 4800 * p, 0.05);
      return 1.3;
    },
    spell_lightning: function (o, t, p) {
      var c = o.context, n = noiseSrc(c, t, 0.7), hp = filt(c, 'highpass', 900 * p, 0.7), g = c.createGain();
      var sq = osc(c, 'square', 30), sg = gainN(c, 0.6);
      sq.frequency.setValueAtTime(45, t); sq.frequency.linearRampToValueAtTime(12, t + 0.6);
      envAD(g.gain, t, 0.002, 0.8, 0.6);
      sq.connect(sg); sg.connect(g.gain);
      n.connect(hp); hp.connect(g); g.connect(o); sq.start(t); sq.stop(t + 0.7); fin(n, [n, hp, g, sq, sg]);
      tone(o, t, 75 * p, 0.9, 'sine', 0.9, 30 * p);
      noise(o, t + 0.05, 1.0, 0.4, 'lowpass', 300, 80, 0.8, 0.05);
      crackle(o, t, 0.5, 10, 0.6, 4000 * p);
      return 1.2;
    },
    spell_heal: function (o, t, p) {
      var n = [72, 76, 79, 84, 88, 91];
      for (var i = 0; i < n.length; i++) I.bell(o, t + i * 0.075, mtof(n[i]) * p, 0.2, 0.4, { decay: 1.2 });
      tone(o, t, 600 * p, 0.6, 'sine', 0.12, 1800 * p, 0.2);
      for (var k = 0; k < 6; k++) tone(o, t + 0.2 + rnd() * 0.5, (3000 + rnd() * 3000) * p, 0.1, 'sine', 0.06, 0, 0.002);
      return 1.6;
    },
    spell_holy: function (o, t, p) {
      var n = [60, 64, 67, 72];
      for (var i = 0; i < n.length; i++) I.choir(o, t, mtof(n[i]) * p, 0.9, 0.45, { att: 0.25, rel: 0.6 });
      I.bell(o, t + 0.1, mtof(84) * p, 0.5, 0.45, { decay: 2.0 });
      I.bell(o, t + 0.3, mtof(91) * p, 0.5, 0.3, { decay: 2.0 });
      return 2.2;
    },
    spell_dark: function (o, t, p) {
      var c = o.context, a = osc(c, 'sawtooth', 55 * p), b = osc(c, 'sawtooth', 58.3 * p), lp = filt(c, 'lowpass', 1200 * p, 4), g = c.createGain();
      lp.frequency.setValueAtTime(1500 * p, t); lp.frequency.exponentialRampToValueAtTime(120, t + 1.1);
      envSus(g.gain, t, 0.15, 0.35, 0.8, 0.4);
      a.connect(lp); b.connect(lp); lp.connect(g); g.connect(o);
      a.start(t); b.start(t); a.stop(t + 1.8); b.stop(t + 1.8); fin(a, [a, b, lp, g]);
      var f = noise(o, t, 1.0, 0.35, 'bandpass', 300 * p, 0, 3, 0.7);
      f.frequency.setValueAtTime(2000 * p, t); f.frequency.exponentialRampToValueAtTime(200 * p, t + 1.0);
      voice(o, t + 0.1, 70 * p, 50 * p, 1.0, 0.3, VOWEL_OO, 0.3);
      return 1.8;
    },
    spell_generic: function (o, t, p) {
      var s = tone(o, t, 400 * p, 0.6, 'triangle', 0.3, 1300 * p, 0.05);
      var c = o.context, lfo = osc(c, 'sine', 11), lg = gainN(c, 40 * p);
      lfo.connect(lg); lg.connect(s.frequency); lfo.start(t); lfo.stop(t + 0.65); fin(lfo, [lfo, lg]);
      for (var i = 0; i < 4; i++) I.bell(o, t + 0.25 + i * 0.07, (1600 + i * 400) * p, 0.1, 0.22, { decay: 0.6 });
      return 1.1;
    },
    buff: function (o, t, p) {
      tone(o, t, mtof(67) * p, 0.18, 'triangle', 0.3, 0, 0.01);
      tone(o, t + 0.1, mtof(71) * p, 0.18, 'triangle', 0.3, 0, 0.01);
      tone(o, t + 0.2, mtof(74) * p, 0.35, 'triangle', 0.32, 0, 0.01);
      I.bell(o, t + 0.2, mtof(86) * p, 0.3, 0.25, { decay: 0.9 });
      return 0.8;
    },
    debuff: function (o, t, p) {
      var c = o.context, s = osc(c, 'sawtooth', 600 * p), s2 = osc(c, 'sawtooth', 600 * p, 30), lp = filt(c, 'lowpass', 1400, 3), g = c.createGain();
      s.frequency.exponentialRampToValueAtTime(260 * p, t + 0.5); s2.frequency.exponentialRampToValueAtTime(250 * p, t + 0.5);
      envAD(g.gain, t, 0.02, 0.2, 0.55);
      s.connect(lp); s2.connect(lp); lp.connect(g); g.connect(o);
      s.start(t); s2.start(t); s.stop(t + 0.6); s2.stop(t + 0.6); fin(s, [s, s2, lp, g]);
      return 0.7;
    },
    poison: function (o, t, p) {
      for (var i = 0; i < 8; i++) {
        var f = (250 + rnd() * 450) * p;
        tone(o, t + i * 0.07 + rnd() * 0.03, f, 0.07, 'sine', 0.3, f * 1.8, 0.005);
      }
      noise(o, t, 0.6, 0.12, 'bandpass', 900 * p, 400, 4, 0.1);
      return 0.8;
    },
    teleport: function (o, t, p) {
      var s = tone(o, t, 200 * p, 0.9, 'sine', 0.3, 2400 * p, 0.05);
      var s2 = tone(o, t, 300 * p, 0.9, 'triangle', 0.15, 3600 * p, 0.05);
      var c = o.context, lfo = osc(c, 'sine', 22), lg = gainN(c, 60 * p);
      lfo.connect(lg); lg.connect(s.frequency); lg.connect(s2.frequency); lfo.start(t); lfo.stop(t + 0.95); fin(lfo, [lfo, lg]);
      noise(o, t, 0.9, 0.25, 'bandpass', 400 * p, 5000 * p, 3, 0.2);
      return 1.1;
    },
    levelup: function (o, t, p) {
      var n = [60, 64, 67, 72, 76, 79];
      for (var i = 0; i < n.length; i++) I.horn(o, t + i * 0.08, mtof(n[i]) * p, 0.12, 0.7);
      var ch = [72, 76, 79, 84];
      for (var k = 0; k < ch.length; k++) I.horn(o, t + 0.5, mtof(ch[k]) * p, 0.7, 0.55);
      I.bell(o, t + 0.5, mtof(96) * p, 0.5, 0.3, { decay: 1.5 });
      I.timp(o, t + 0.5, 65 * p, 1, 0.6);
      return 1.8;
    },
    song: function (o, t, p) {
      var n = [50, 57, 62, 66, 69, 74];
      for (var i = 0; i < n.length; i++) I.pluck(o, t + i * 0.028, mtof(n[i]) * p, 1, 0.65, { decay: 1.6, bright: 0.8, saw: 0.6 });
      return 1.9;
    },
    drink: function (o, t, p) {
      for (var i = 0; i < 3; i++) {
        var tt = t + i * 0.17, f = (180 + rnd() * 40) * p;
        tone(o, tt, f, 0.11, 'sine', 0.55, f * 2.2, 0.01);
        noise(o, tt, 0.09, 0.15, 'bandpass', 600 * p, 1200 * p, 5, 0.01);
      }
      return 0.65;
    },
    encounter: function (o, t, p) {
      var n = [43, 46, 49, 55, 58];  // diminished brass cluster
      for (var i = 0; i < n.length; i++) I.horn(o, t, mtof(n[i]) * p, 0.9, 0.8);
      I.timp(o, t, 49 * p, 1, 1.0);
      I.kick(o, t, 0, 1, 0.9);
      I.crash(o, t, 0, 1, 0.8);
      for (var k = 0; k < 6; k++) I.snare(o, t + 0.5 + k * 0.05, 0, 1, 0.25 + k * 0.08);
      I.timp(o, t + 0.8, 55 * p, 1, 1.0);
      return 2.0;
    },
    flee: function (o, t, p) {
      for (var i = 0; i < 6; i++) {
        var f = (350 + rnd() * 150) * p;
        noise(o, t + i * 0.085, 0.07, 0.45, 'lowpass', f, f * 0.5, 1);
      }
      var w = noise(o, t + 0.1, 0.45, 0.3, 'bandpass', 600 * p, 2400 * p, 2, 0.1);
      return 0.7;
    },
    victory_sting: function (o, t, p) {
      var n = [67, 67, 67, 72];
      var d = [0, 0.11, 0.22, 0.36];
      for (var i = 0; i < n.length; i++) I.horn(o, t + d[i], mtof(n[i]) * p, i < 3 ? 0.08 : 0.8, 0.8);
      var ch = [60, 64, 67];
      for (var k = 0; k < ch.length; k++) I.horn(o, t + 0.36, mtof(ch[k]) * p, 0.8, 0.5);
      I.timp(o, t + 0.36, 65 * p, 1, 0.7);
      I.crash(o, t + 0.36, 0, 1, 0.5);
      return 1.8;
    },
    roar: function (o, t, p) {
      var c = o.context, s = voice(o, t, 90 * p, 60 * p, 1.2, 0.6, [[400, 1, 3], [900, 0.6, 4], [2200, 0.2, 5]], 0.2);
      var j = osc(c, 'sawtooth', 23), jg = gainN(c, 18 * p);
      j.connect(jg); jg.connect(s.frequency); j.start(t); j.stop(t + 1.5); fin(j, [j, jg]);
      noise(o, t, 1.2, 0.4, 'lowpass', 900 * p, 300, 1, 0.2);
      tone(o, t, 50 * p, 1.2, 'sine', 0.4, 35 * p, 0.2);
      return 1.6;
    },
    magic_mouth: function (o, t, p) {
      var c = o.context, n = noiseSrc(c, t, 1.8), g = c.createGain(), nodes = [n, g];
      var F = [[700, 1200], [300, 2300], [500, 900], [400, 2000]];
      envSus(g.gain, t, 0.15, 0.9, 1.3, 0.3);
      for (var k = 0; k < 2; k++) {
        var bp = filt(c, 'bandpass', F[0][k], 12);
        for (var i = 1; i < F.length; i++) bp.frequency.linearRampToValueAtTime(F[i][k] * p, t + i * 0.4);
        n.connect(bp); bp.connect(g); nodes.push(bp);
      }
      var am = osc(c, 'sine', 6), amg = gainN(c, 0.4);
      am.connect(amg); amg.connect(g.gain); am.start(t); am.stop(t + 1.9); nodes.push(am, amg);
      g.connect(o); fin(n, nodes);
      I.ghost(o, t, mtof(55) * p, 1.3, 0.3);
      I.ghost(o, t, mtof(61) * p, 1.3, 0.25);
      return 2.2;
    },
    page: function (o, t, p) {
      for (var i = 0; i < 4; i++) noise(o, t + i * 0.05 + rnd() * 0.03, 0.05 + rnd() * 0.04, 0.25 + rnd() * 0.2, 'bandpass', (2500 + rnd() * 2500) * p, 0, 1.2, 0.005);
      return 0.35;
    },
    quest: function (o, t, p) {
      var n = [79, 84, 88, 91];
      for (var i = 0; i < n.length; i++) I.bell(o, t + i * 0.1, mtof(n[i]) * p, 0.3, 0.45, { decay: 1.6 });
      I.pad(o, t, mtof(72) * p, 0.6, 0.6, { bright: 1.2, att: 0.1, rel: 0.8 });
      return 2.0;
    }
  };
  var SFX_REV = { step: 0.1, bump: 0.1, menu_move: 0, menu_select: 0.05, error: 0.05, page: 0.05, stairs: 0.25, door: 0.3,
    spell_holy: 0.6, spell_heal: 0.5, magic_mouth: 0.7, death: 0.5, quest: 0.5, levelup: 0.4, encounter: 0.4, roar: 0.4 };
  var SFX_NAMES = ['step', 'bump', 'door', 'stairs', 'menu_move', 'menu_select', 'error', 'coin', 'chest', 'trap', 'hit', 'crit',
    'miss', 'block', 'monster_hit', 'monster_die', 'party_hurt', 'death', 'spell_fire', 'spell_ice', 'spell_lightning',
    'spell_heal', 'spell_holy', 'spell_dark', 'spell_generic', 'buff', 'debuff', 'poison', 'teleport', 'levelup', 'song',
    'drink', 'encounter', 'flee', 'victory_sting', 'roar', 'magic_mouth', 'page', 'quest'];

  var lastSfx = {};
  function playSfx(g, name, opts, t) {
    var c = g.ctx, p = 1, vol = 1;
    if (opts) {
      if (typeof opts.pitch === 'number' && opts.pitch > 0) p = Math.max(0.25, Math.min(4, opts.pitch));
      if (typeof opts.volume === 'number') vol = clamp01(opts.volume);
    }
    var out = gainN(c, vol), send = gainN(c, SFX_REV[name] == null ? 0.25 : SFX_REV[name]);
    out.connect(g.sfxBus); out.connect(send); send.connect(g.sfxWet);
    var d = SFX[name](out, t, p) || 2;
    var cleanup = function () { try { out.disconnect(); send.disconnect(); } catch (e) { /* */ } };
    if (g.offline) return d;
    setTimeout(cleanup, (d + (t - c.currentTime) + 0.5) * 1000);
    return d;
  }

  // ---------------------------------------------------------------- public API
  function init() {
    try {
      if (!AC) return false;
      if (!G) {
        var c = new AC();
        G = buildGraph(c);
        timer = setInterval(tick, 25);
        if (curTrack) startTrack(curTrack);
      }
      if (G.ctx.state === 'suspended' && G.ctx.resume) { var pr = G.ctx.resume(); if (pr && pr.catch) pr.catch(function () {}); }
      return true;
    } catch (e) { G = null; return false; }
  }

  function music(track) {
    try {
      if (track === undefined) track = null;
      if (track !== null && !TRACKS[track]) return;
      if (track === curTrack) return;
      curTrack = track;
      if (!G) return; // remembered; starts on init()
      startTrack(track);
    } catch (e) { /* no-op */ }
  }

  function sfx(name, opts) {
    try {
      if (!G || !SFX[name] || settings.muted) return;
      var c = G.ctx, now = c.currentTime;
      if (c.state !== 'running' && c.resume) { var pr = c.resume(); if (pr && pr.catch) pr.catch(function () {}); }
      // rate-limit identical sounds stacking within 35ms
      if (lastSfx[name] && now - lastSfx[name] < 0.035) return;
      lastSfx[name] = now;
      playSfx(G, name, opts, now + 0.005);
    } catch (e) { /* no-op */ }
  }

  function applyVolumes() {
    if (!G) return;
    var c = G.ctx, now = c.currentTime, m = volCurve(settings.music), s = volCurve(settings.sfx);
    G.musicBus.gain.setTargetAtTime(m, now, 0.03); G.musicWet.gain.setTargetAtTime(m, now, 0.03);
    G.sfxBus.gain.setTargetAtTime(s, now, 0.03); G.sfxWet.gain.setTargetAtTime(s, now, 0.03);
    G.master.gain.setTargetAtTime(settings.muted ? 0 : 1, now, 0.05);
  }
  function setMusicVolume(v) { try { settings.music = clamp01(v); saveSettings(); applyVolumes(); } catch (e) { /* */ } }
  function setSfxVolume(v) { try { settings.sfx = clamp01(v); saveSettings(); applyVolumes(); } catch (e) { /* */ } }
  function toggleMute() { try { settings.muted = !settings.muted; saveSettings(); applyVolumes(); } catch (e) { /* */ } return settings.muted; }

  // offline rendering for tests: returns Promise<AudioBuffer> or null
  function renderOffline(kind, name, secs) {
    var OAC = root.OfflineAudioContext || root.webkitOfflineAudioContext;
    if (!OAC) return null;
    var sr = 44100, c = new OAC(2, Math.ceil(sr * secs), sr), g = buildGraph(c);
    g.offline = true;
    if (kind === 'music') {
      var pl = new Player(g, name, 0.05);
      pl.advance(secs);
    } else {
      playSfx(g, name, null, 0.05);
    }
    return c.startRendering();
  }

  BT.audio = {
    init: init,
    music: music,
    sfx: sfx,
    setMusicVolume: setMusicVolume,
    setSfxVolume: setSfxVolume,
    getMusicVolume: function () { return settings.music; },
    getSfxVolume: function () { return settings.sfx; },
    toggleMute: toggleMute,
    isMuted: function () { return settings.muted; },
    currentTrack: function () { return curTrack; },
    musicTracks: TRACK_NAMES.slice(),
    sfxNames: SFX_NAMES.slice(),
    _renderOffline: renderOffline,
    _loopSeconds: function (name) {
      if (!TRACKS[name]) return null;
      var tr = compileTrack(name), secs = trackSections(tr), r = { intro: 0, loop: 0 };
      for (var i = 0; i < secs.length; i++) r[tr.intro && i === 0 ? 'intro' : 'loop'] += secs[i].len * secs[i].sd;
      return r;
    },
    _trackInfo: function () {
      var r = {};
      for (var i = 0; i < TRACK_NAMES.length; i++) {
        var tr = compileTrack(TRACK_NAMES[i]), secs = trackSections(tr), info = [];
        for (var k = 0; k < secs.length; k++) {
          var s = secs[k], mels = [];
          for (var j = 0; j < s.parts.length; j++) if (s.parts[j].ev) mels.push(s.parts[j].len);
          info.push({ seconds: +(s.len * s.sd).toFixed(1), steps: s.len, melodyLens: mels });
        }
        r[TRACK_NAMES[i]] = info;
      }
      return r;
    }
  };
})();
