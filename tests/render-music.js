#!/usr/bin/env node
// Renders music tracks offline (OfflineAudioContext in headless Chrome) to 44.1 kHz stereo 16-bit WAV files.
// Usage: node tests/render-music.js [track ...]
//   default tracks: combat_underground combat_city combat_wild combat boss
//   'all' renders every track. Output: assets/audio-previews/<track>.wav (one full loop, including any intro).
'use strict';
const fs = require('fs');
const path = require('path');
const cdp = require('./cdp');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'audio-previews');
const DEFAULT = ['combat_underground', 'combat_city', 'combat_wild', 'combat', 'boss'];

// Runs in the page: render + encode as WAV, keep base64 in window._wav, return metadata.
const PAGE_RENDER = (track) => `(async () => {
  const A = BT.audio, L = A._loopSeconds(${JSON.stringify(track)});
  if (!L) throw new Error('unknown track ${track}');
  const secs = L.intro + L.loop;
  const buf = await A._renderOffline('music', ${JSON.stringify(track)}, secs);
  const n = buf.length, ch = [buf.getChannelData(0), buf.getChannelData(1)];
  const bytes = new Uint8Array(44 + n * 4), dv = new DataView(bytes.buffer);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  str(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, 44100, true);
  dv.setUint32(28, 44100 * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true);
  str(36, 'data'); dv.setUint32(40, n * 4, true);
  let peak = 0, ss = 0, o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < 2; c++) {
    const v = ch[c][i], a = Math.abs(v); if (a > peak) peak = a; ss += v * v;
    dv.setInt16(o, Math.max(-32768, Math.min(32767, Math.round(v * 32767))), true); o += 2;
  }
  let bin = ''; const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
  window._wav = btoa(bin);
  return { secs, peak, rms: Math.sqrt(ss / (n * 2)), b64len: window._wav.length };
})()`;

(async () => {
  let tracks = process.argv.slice(2);
  if (!tracks.length) tracks = DEFAULT;
  fs.mkdirSync(OUT, { recursive: true });
  const T = await cdp('file://' + path.join(ROOT, 'audio-preview.html'), { wait: 1500 });
  let fail = 0;
  try {
    if (tracks.length === 1 && tracks[0] === 'all') tracks = await T.eval('BT.audio.musicTracks');
    for (const tr of tracks) {
      const t0 = Date.now();
      try {
        const info = await T.eval(PAGE_RENDER(tr));
        const parts = [];
        const SLICE = 4 * 1024 * 1024;
        for (let i = 0; i < info.b64len; i += SLICE) parts.push(await T.eval(`window._wav.slice(${i}, ${i + SLICE})`));
        const file = path.join(OUT, tr + '.wav');
        fs.writeFileSync(file, Buffer.from(parts.join(''), 'base64'));
        const clip = info.peak >= 0.999 ? '  CLIPPING!' : '';
        if (clip) fail = 1;
        console.log(`${tr.padEnd(20)} ${info.secs.toFixed(1)}s  peak ${info.peak.toFixed(3)}  rms ${info.rms.toFixed(3)}  -> ${path.relative(ROOT, file)}  (${((Date.now() - t0) / 1000).toFixed(1)}s)${clip}`);
      } catch (e) { fail = 1; console.error(`${tr}: FAILED ${e.message}`); }
    }
    const errs = T.logs.filter((l) => /EXCEPTION|error/i.test(l));
    if (errs.length) { fail = 1; console.error(errs.join('\n')); }
  } finally { T.close(); }
  process.exit(fail);
})();
