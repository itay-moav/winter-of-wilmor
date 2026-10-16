# Music Canon

All music is generated in code (`js/audio/`, Web Audio). The user listens to it outside the game: render WAVs with `node tests/render-music.js [track ...]` into `assets/audio/previews/`.

## Places and moods
| Track | Where | Feel |
|---|---|---|
| `title`, `ending` | title screen, ending | the Velmoor theme in A minor; the ending turns it major |
| `town`, `tavern`, `temple` | streets, inns and houses, temples | lute and frame drum; warm; sacred |
| `dungeon`, `crypt`, `tower` | sewers and keep, crypt and hidden realms, the tower | dark ambient |
| `combat_underground` | battles below ground | D Phrygian doom-fast folk metal, hurdy-gurdy |
| `combat_city` | battles in the streets and houses | A Mixolydian 12/8 jig-metal, Highland pipes, gang shouts |
| `combat_wild` | battles in the tower and open realms | E Dorian epic, pipes over war drums, accelerating |
| `boss`, `victory`, `gameover` | boss fights, after a win, the party falls | |

## Bard songs (`BT.audio.song(id)`)
While a bard's song lasts (in battle, or carried through exploration), its own piece plays and the regular music ducks to about 11% in the background; it returns when the song fades or the battle ends. Battle songs are heavy metal, gentle songs classical or Irish, mystical songs Arabic/oriental. Arrangements of public-domain works only (Prokofiev: pre-1929 works only).

| Song | Source | Arrangement |
|---|---|---|
| Warding Hymn (`ward`) | Beethoven, *Ode to Joy* | D major 120 bpm power-metal anthem: choir and horns, organ, double kick |
| March of Iron (`march`) | Prokofiev, March from *The Love for Three Oranges* (1919) | 116 bpm stomping march: horns, hurdy-gurdy, palm mutes, war toms, "HEY!" shouts |
| Song of Swiftness (`swift`) | Grieg, *In the Hall of the Mountain King* | speed metal accelerating 110 → 140 → 170 → 200 bpm, gurdy then pipes over distorted guitar |
| Hearthfire Lay (`hearth`) | *Londonderry Air* (traditional Irish) | 70 bpm tin whistle, fiddle countermelody, harp, bodhrán, crackling embers |
| Lantern Song (`lantern`) | Grieg, *Morning Mood* | E major 6/8, flute and oboe trading the theme over strings and harp |
| Lullaby of Frost (`lull`) | after Rimsky-Korsakov, *Scheherazade* (solo violin theme) | E minor 56 bpm, kamancheh, qanun, glass bells, frame drum, drone |
| Requiem (`requiem`) | Grieg, *Åse's Death*, recast in B Hijaz | ney, oud tremolo, darbuka, choir, tolling bell |

## Rules
- Battle music: heavy folk metal or bagpipes, one variant per terrain (underground, city, wilderness).
- New songs or tracks need a public-domain source (or an original tune), a recorded entry here, and a rendered WAV for the user.
