#!/usr/bin/env node
// Renders music tracks offline (OfflineAudioContext in headless Chrome) to 44.1 kHz stereo 16-bit WAV files.
// Usage: node tests/render-music.js [track ...]
//   default tracks: combat_underground combat_city combat_wild combat boss + the 7 bard songs + the duck demo
//   'all' renders every music track and song, 'songs' the 7 bard songs, 'duck' only the song-over-music demo.
//   Output: assets/audio/previews/<track>.wav (one full loop, including any intro).
//   The duck demo (duck_demo.wav) plays combat_city, starts song_ward at 6 s and stops it at 26 s; the script also
//   renders it with the song muted and prints the music level before / during / after the song to verify the duck.
'use strict';
const fs = require('fs');
const path = require('path');
const cdp = require('./cdp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'audio', 'previews');
const SONGS = ['song_ward', 'song_march', 'song_hearth', 'song_lantern', 'song_lull', 'song_requiem', 'song_swift'];
const DEFAULT = ['combat_underground', 'combat_city', 'combat_wild', 'combat', 'boss'].concat(SONGS, ['duck']);
const DUCK = { music: 'combat_city', song: 'song_ward', secs: 32, at: 6, until: 26 };

// Runs in the page: render + encode as WAV, keep base64 in window._wav, return metadata.
// track 'duck' renders the song-over-music demo; 'duck_muted' the same with the song silenced (to measure the duck)
const PAGE_RENDER = (track) => `(async () => {
  const A = BT.audio, D = ${JSON.stringify(DUCK)};
  let secs, buf;
  if (${JSON.stringify(track)}.startsWith('duck')) {
    secs = D.secs;
    buf = await A._renderDuck(D.music, D.song, secs, D.at, D.until, ${JSON.stringify(track)} === 'duck_muted' ? 0 : 1);
  } else {
    const L = A._loopSeconds(${JSON.stringify(track)});
    if (!L) throw new Error('unknown track ${track}');
    secs = L.intro + L.loop;
    buf = await A._renderOffline('music', ${JSON.stringify(track)}, secs);
  }
  const n = buf.length, ch = [buf.getChannelData(0), buf.getChannelData(1)];
  const bytes = new Uint8Array(44 + n * 4), dv = new DataView(bytes.buffer);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, 44100, true);
  dv.setUint32(28, 44100 * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, n * 4, true);
  let peak = 0, ss = 0, o = 44;
  const win = [0, 0, 0], wn = [0, 0, 0], sr = 44100;
  const zone = (i) => { const t = i / sr; return t > 2 && t < D.at ? 0 : t > D.at + 2 && t < D.until ? 1 : t > D.until + 2 ? 2 : -1; };
  for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) {
    const v = ch[c][i], a = Math.abs(v); if (a > peak) peak = a; ss += v * v;
    const z = zone(i); if (z >= 0) { win[z] += v * v; wn[z]++; }
    dv.setInt16(o, Math.max(-32768, Math.min(32767, Math.round(v * 32767))), true); o += 2;
  }
  let bin = ''; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  window._wav = btoa(bin);
  return { secs, peak, rms: Math.sqrt(ss / (n * 2)), b64len: window._wav.length, zones: win.map((s, i) => Math.sqrt(s / Math.max(1, wn[i]))) };
})()`;

(async () => {
  let tracks = process.argv.slice(2);
  if (!tracks.length) tracks = DEFAULT;
  fs.mkdirSync(OUT, { recursive: true });
  const T = await cdp('file://' + path.join(ROOT, 'tools', 'preview', 'audio.html'), { wait: 1500 });
  let fail = 0;
  try {
    if (tracks.length === 1 && tracks[0] === 'all') tracks = (await T.eval('BT.audio.musicTracks.concat(BT.audio.songTracks)')).concat(['duck']);
    if (tracks.length === 1 && tracks[0] === 'songs') tracks = SONGS;
    if (tracks.indexOf('duck') >= 0) tracks.push('duck_muted');
    for (const tr of tracks) {
      const t0 = Date.now();
      try {
        const info = await T.eval(PAGE_RENDER(tr));
        const parts = [];
        const SLICE = 4 * 1024 * 1024;
        for (let i = 0; i < info.b64len; i += SLICE) parts.push(await T.eval(`window._wav.slice(${i}, ${i + SLICE})`));
        const file = path.join(OUT, (tr === 'duck' ? 'duck_demo' : tr) + '.wav');
        fs.writeFileSync(file, Buffer.from(parts.join(''), 'base64'));
        const clip = info.peak >= 0.999 ? '  CLIPPING!' : '';
        if (clip) fail = 1;
        if (info.rms < 0.01) { fail = 1; console.error(`${tr}: nearly silent (rms ${info.rms.toFixed(4)})`); }
        if (tr === 'duck_muted') {
          const [pre, mid, post] = info.zones, ratio = mid / pre;
          console.log(`duck check (song muted): music rms before ${pre.toFixed(3)}  during ${mid.toFixed(3)}  after ${post.toFixed(3)}  -> ${(ratio * 100).toFixed(0)}% while singing`);
          if (!(ratio > 0.05 && ratio < 0.2 && post > pre * 0.5)) { fail = 1; console.error('duck check FAILED'); }
          fs.unlinkSync(file);
          continue;
        }
        if (tr === 'duck') {
          const [pre, mid, post] = info.zones;
          console.log(`duck demo rms: music ${pre.toFixed(3)} | song over ducked music ${mid.toFixed(3)} | music again ${post.toFixed(3)}`);
        }
        console.log(`${tr.padEnd(20)} ${info.secs.toFixed(1)}s  peak ${info.peak.toFixed(3)}  rms ${info.rms.toFixed(3)}  -> ${path.relative(ROOT, file)}  (${((Date.now() - t0) / 1000).toFixed(1)}s)${clip}`);
      } catch (e) { fail = 1; console.error(`${tr}: FAILED ${e.message}`); }
    }
    const errs = T.logs.filter((l) => /EXCEPTION|error/i.test(l));
    if (errs.length) { fail = 1; console.error(errs.join('\n')); }
  } finally { T.close(); }
  process.exit(fail);
})();
