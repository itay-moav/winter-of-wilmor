/* Velmoor audio, player: the live audio graph, the step scheduler (Player), bard-song ducking, offline
 * rendering for tests, and the public BT.audio API. Load last. */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : this;
  var BT = root.BT = root.BT || {};
  var K = BT.AUDIO_INTERNAL = BT.AUDIO_INTERNAL || {}; // shared internals of the js/audio/ files
  var TRACKS = K.TRACKS, AC = K.AC, settings = K.settings, saveSettings = K.saveSettings, clamp01 = K.clamp01, volCurve = K.volCurve, rnd = K.rnd, mtof = K.mtof, makeIR = K.makeIR, gainN = K.gainN, parseChord = K.parseChord, chordTone = K.chordTone, parseMel = K.parseMel, cleanPat = K.cleanPat, patVel = K.patVel, I = K.I, FX = K.FX, makeDrone = K.makeDrone, SONG_IDS = K.SONG_IDS, SONG_TRACKS = K.SONG_TRACKS, SFX = K.SFX, SFX_NAMES = K.SFX_NAMES, playSfx = K.playSfx;

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
  var curSong = null;  // bard song requested (may be pending before init)
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
    // music -> duck -> master: the duck gain drops while a bard song plays (multiplies with the volume setting)
    g.duck = gainN(c, 1); g.duck.connect(g.master);
    g.duckWet = gainN(c, 1); g.duckWet.connect(g.reverb);
    g.musicBus = gainN(c, volCurve(settings.music)); g.musicBus.connect(g.duck);
    g.musicWet = gainN(c, volCurve(settings.music)); g.musicWet.connect(g.duckWet);
    // bard songs: own bus, follows the music volume, never ducked
    g.songBus = gainN(c, volCurve(settings.music)); g.songBus.connect(g.master);
    g.songWet = gainN(c, volCurve(settings.music)); g.songWet.connect(g.reverb);
    g.sfxBus = gainN(c, volCurve(settings.sfx)); g.sfxBus.connect(g.master);
    g.sfxWet = gainN(c, volCurve(settings.sfx)); g.sfxWet.connect(g.reverb);
    return g;
  }

  // bus: optional { dry, wet } destination (default: the music bus); t0: optional start time (offline renders)
  function Player(g, name, fade, bus, t0) {
    var tr = compileTrack(name), c = g.ctx, now = t0 != null ? t0 : c.currentTime;
    this.g = g; this.name = name;
    this.out = c.createGain(); this.wet = c.createGain();
    this.out.connect(bus ? bus.dry : g.musicBus); this.wet.connect(bus ? bus.wet : g.musicWet);
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
    for (var i = 0; i < players.length; i++) if (!players[i].isSong && players[i].stopAt === Infinity) players[i].fadeOut(FADE);
    if (name) {
      var pl = new Player(G, name, FADE);
      players.push(pl);
      pl.advance(G.ctx.currentTime + 0.12);
    }
  }

  // bard songs: the song plays on its own bus while the regular music is ducked underneath
  var DUCK = 0.11, DUCK_IN = 0.8, SONG_OUT = 1.5;
  function rampTo(p, now, v, secs) {
    var cur = p.value;
    if (p.cancelAndHoldAtTime) p.cancelAndHoldAtTime(now); else { p.cancelScheduledValues(now); p.setValueAtTime(cur, now); }
    p.linearRampToValueAtTime(v, now + secs);
  }
  function setDuck(on) {
    var now = G.ctx.currentTime, v = on ? DUCK : 1, secs = on ? DUCK_IN : SONG_OUT;
    rampTo(G.duck.gain, now, v, secs); rampTo(G.duckWet.gain, now, v, secs);
  }
  function startSong(id) {
    for (var i = 0; i < players.length; i++) if (players[i].isSong && players[i].stopAt === Infinity) players[i].fadeOut(SONG_OUT);
    if (id) {
      var pl = new Player(G, 'song_' + id, 0.3, { dry: G.songBus, wet: G.songWet });
      pl.isSong = true;
      players.push(pl);
      pl.advance(G.ctx.currentTime + 0.12);
    }
    setDuck(!!id);
  }


  var lastSfx = {};

  // ---------------------------------------------------------------- public API
  function init() {
    try {
      if (!AC) return false;
      if (!G) {
        var c = new AC();
        G = buildGraph(c);
        timer = setInterval(tick, 25);
        if (curTrack) startTrack(curTrack);
        if (curSong) startSong(curSong);
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

  // bard song over the music: id in SONG_IDS, or null/undefined to stop. Same id again = no-op.
  function song(id) {
    try {
      if (id === undefined) id = null;
      if (id !== null && SONG_IDS.indexOf(id) < 0) return;
      if (id === curSong) return;
      curSong = id;
      if (!G) return; // remembered; starts on init()
      startSong(id);
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
    G.songBus.gain.setTargetAtTime(m, now, 0.03); G.songWet.gain.setTargetAtTime(m, now, 0.03);
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
  // offline "song over music" demo: music from 0, song from `at` to `until` (then 1.5 s fade), ducking as in game.
  // songVol (default 1) lets tests mute the song to measure the duck on the music alone.
  function renderDuck(music, songTrack, secs, at, until, songVol) {
    var OAC = root.OfflineAudioContext || root.webkitOfflineAudioContext;
    if (!OAC || !TRACKS[music] || !TRACKS[songTrack]) return null;
    var sr = 44100, c = new OAC(2, Math.ceil(sr * secs), sr), g = buildGraph(c);
    g.offline = true;
    var mp = new Player(g, music, 0.05);
    mp.advance(secs);
    var sv = songVol == null ? 1 : songVol;
    g.songBus.gain.value *= sv; g.songWet.gain.value *= sv;
    var sp = new Player(g, songTrack, 0.3, { dry: g.songBus, wet: g.songWet }, at);
    sp.advance(Math.min(until, secs));
    var ps = [sp.out.gain, sp.wet.gain];
    for (var i = 0; i < 2; i++) { ps[i].setValueAtTime(1, until); ps[i].linearRampToValueAtTime(0.0001, until + SONG_OUT); }
    var ds = [g.duck.gain, g.duckWet.gain];
    for (var k = 0; k < 2; k++) {
      ds[k].setValueAtTime(1, at); ds[k].linearRampToValueAtTime(DUCK, at + DUCK_IN);
      ds[k].setValueAtTime(DUCK, until); ds[k].linearRampToValueAtTime(1, until + SONG_OUT);
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
    song: song,
    currentSong: function () { return curSong; },
    musicTracks: TRACK_NAMES.slice(),
    songTracks: SONG_TRACKS.slice(),
    sfxNames: SFX_NAMES.slice(),
    _renderOffline: renderOffline,
    _renderDuck: renderDuck,
    _loopSeconds: function (name) {
      if (!TRACKS[name]) return null;
      var tr = compileTrack(name), secs = trackSections(tr), r = { intro: 0, loop: 0 };
      for (var i = 0; i < secs.length; i++) r[tr.intro && i === 0 ? 'intro' : 'loop'] += secs[i].len * secs[i].sd;
      return r;
    },
    _trackInfo: function () {
      var r = {};
      var names = TRACK_NAMES.concat(SONG_TRACKS);
      for (var i = 0; i < names.length; i++) {
        var tr = compileTrack(names[i]), secs = trackSections(tr), info = [];
        for (var k = 0; k < secs.length; k++) {
          var s = secs[k], mels = [];
          for (var j = 0; j < s.parts.length; j++) if (s.parts[j].ev) mels.push(s.parts[j].len);
          info.push({ seconds: +(s.len * s.sd).toFixed(1), steps: s.len, melodyLens: mels });
        }
        r[names[i]] = info;
      }
      return r;
    }
  };
})();
