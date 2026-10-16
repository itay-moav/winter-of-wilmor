/* Velmoor audio, core: persisted volume settings and the low-level Web Audio helpers (envelopes,
 * oscillators, filters, noise, impulse responses, one-shot tones) shared by every other audio file. */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var BT = root.BT = root.BT || {};
  var K = BT.AUDIO_INTERNAL = BT.AUDIO_INTERNAL || {}; // shared internals of the js/audio/ files
  K.TRACKS = K.TRACKS || {}; // track table, filled by the tracks-*.js files

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

  // ---------------------------------------------------------------- synthesis shortcuts (shared by instruments and sfx)
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

  K.AC = AC; K.settings = settings; K.saveSettings = saveSettings; K.clamp01 = clamp01; K.volCurve = volCurve; K.rnd = rnd; K.mtof = mtof; K.rep = rep; K.fin = fin; K.getNoise = getNoise; K.noiseSrc = noiseSrc; K.makeIR = makeIR; K.envAD = envAD; K.envSus = envSus; K.osc = osc; K.gainN = gainN; K.filt = filt; K.tone = tone; K.noise = noise; K.voice = voice;
})();
