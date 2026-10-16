---
name: velmoor-music
description: How to compose and change music and sound for Winter of Velmoor - the Web Audio engine in js/audio/ (instruments, the track pattern DSL, sections, drones, FX), place and battle themes, the bard-song layer that ducks the background music, sound effects, and rendering WAVs so the user can listen. Use when adding or changing any track, song, instrument or sound effect, or when the user wants to hear audio.
---

# Making Music in Velmoor

Canon and the list of tracks: `velmoor-lore` `references/music.md`. Record every new track or song there (with its source).

## Taste and rules (from the user)
- Battle music: **heavy folk metal or bagpipes**, one variant per terrain: `combat_underground`, `combat_city`, `combat_wild` (`BT.STYLES[style].battle` picks it).
- Bard songs take over the music while they last; battle songs are metal (each different), gentle songs classical or Irish, mystical songs Arabic/oriental.
- Classical sources are welcome (Beethoven, Grieg, Rimsky-Korsakov, Prokofiev...) **only if public domain** (Prokofiev: pre-1929 works only, e.g. the *Three Oranges* March). Traditional folk tunes are fine. Transcribe carefully; say honestly when a melody is approximate.
- The user wants to **hear** it: always render WAVs and tell them the paths.

## The engine (`js/audio/`, public API `BT.audio` in `player.js`)
| File | Holds |
|---|---|
| `core.js` | settings, envelopes, oscillators, filters, noise, reverb IR, `BT.AUDIO_INTERNAL` |
| `notation.js` | chords (`'Am'`, `'D5'`, `'F#m7'`...), notes, melody strings `"A4:3 B4 C5:2 -:2"` (duration in steps, `-` rest), drum patterns (`X` accent, `x` normal, `o` ghost, `.` rest) |
| `instruments.js` | voices `I.name(out, t, freq, dur, vel, opts)`: lute, harp, strings, horn, choir, organ, flute, folk-metal `chug`/`gtr` (through `fx:'dist'`), `pipe`, `gurdy`, `shout`, metal drums, and the song voices `oud`, `oudtrem`, `qanun`, `ney`, `oboe`, `fiddle`, `kamancheh`, `whistle`, `darbuka`, `ember`; FX chains; drones |
| `tracks-ambient.js`, `tracks-battle.js`, `tracks-songs.js` | the TRACKS data |
| `sfx.js` | sound effects and their names |
| `player.js` | graph, scheduler, the song bus and ducking, offline render, `BT.audio` |

Track format:
```js
TRACKS.my_track = { bpm: 140, div: 4, bar: 16, rev: 0.3, gain: 0.9,          // div = steps per beat, bar = steps per bar
  drone: { root: 'D2', kind: 'gurdy', vol: 0.035 },                          // optional continuous drone
  chords: 'Dm Dm Bb C',                                                       // one chord per bar
  parts: [
    { t: 'mel', inst: 'pipe', mel: '...', tr: -12, v: 0.9, vol: 0.85, rev: 0.3 },
    { t: 'bass', inst: 'chug', fx: 'dist', pat: 'X.xxX.xx...', oct: 2, dur: 1 },
    { t: 'chord'|'arp'|'drum'|'rand', ... },
  ] }
// or { intro: {...section}, seq: [section, section] } for multi-tempo pieces (the Mountain King accelerates this way)
```
API: `music(track)` (idempotent; remembered before `init()`), `song(id|null)` (ducks the music to ~11%), `currentSong()`, `sfx(name, {pitch, volume})`, volume/mute functions, `musicTracks`, `songTracks`, `sfxNames`. The game syncs songs through `UI.syncSong()`. Note `js/app/main.js` wraps `BT.audio.music` before audio starts: internals must not call the public `music`.

## Workflow
1. Write or change the track; keep loops 30-70 s and the node count per step modest (songs cost ~0.1-0.2x real time).
2. `node tests/test-audio.js` (API no-ops in Node, every track compiles, names exist).
3. `node tests/render-music.js <track ...>` (or `songs`, `duck`, `all`) → `assets/audio/previews/<track>.wav`; it fails on silence, clipping or a bad duck. Aim for peaks 0.5-0.8, RMS 0.12-0.17 like the existing themes.
4. Listen: `afplay -t 25 assets/audio/previews/<track>.wav`; the gallery is `tools/preview/audio.html`.
5. In game: `node tests/browser/battle.js` covers song start/stop.
Delegating a big composition job to an agent works well: give it `js/audio/` only, the API above, the musical brief per piece and the verification steps.
