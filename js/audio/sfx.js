/* Velmoor audio, sound effects: every one-shot SFX recipe (SFX), its reverb send, the public list of
 * names, and playSfx() which renders one onto a graph's sfx bus. */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var BT = root.BT = root.BT || {};
  var K = BT.AUDIO_INTERNAL = BT.AUDIO_INTERNAL || {}; // shared internals of the js/audio/ files
  var clamp01 = K.clamp01, rnd = K.rnd, mtof = K.mtof, fin = K.fin, noiseSrc = K.noiseSrc, envAD = K.envAD, envSus = K.envSus, osc = K.osc, gainN = K.gainN, filt = K.filt, tone = K.tone, noise = K.noise, voice = K.voice, I = K.I, VOWEL_OO = K.VOWEL_OO;

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

  K.SFX = SFX; K.SFX_REV = SFX_REV; K.SFX_NAMES = SFX_NAMES; K.playSfx = playSfx;
})();
