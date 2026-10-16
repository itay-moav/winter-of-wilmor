# People of Velmoor

Every entry lists role, faith, looks (written as an art brief), voice and where the person appears. The art keys refer to `js/art/` (`npcs.js`, `monsters-*.js`): `npc(key)` is the bust portrait, `npcFigure(key)` the full body, and `monster(key)` the combat sprite.

**General art direction:** anime/JRPG style, with big expressive eyes, cel shading and strong silhouettes. Female characters wear revealing fantasy outfits that are tasteful and non-explicit, and are always clearly adults. Males are heroic and often muscular. Faith colours mark allegiance: gold and white for the Dawn, silver and pale blue for the Pale Hour, brown, moss and amber for the Root.

## Principal characters

### Malthor, Archmage of Winter
- **Role and faith:** court archmage of Velmoor and the main antagonist. He had no faith until his despair drove him to the Pale Hour's rite.
- **Looks:** tall, handsome but haunted, with long silver hair and ice-blue eyes. Dark blue and silver robes, a high collar and frost crystals swirling around him. His staff carries a glowing blue gem, which cracks at the end.
- **Voice:** grief turned to defiance. "Winter is a small price for one more moment with my daughter!"
- **Appears in:** the `tower3` final boss fight and the ending. Art keys: `npc('malthor')`, `monster('malthor')`.

### Lyra
- **Role:** Malthor's daughter, about 18. Her body sleeps in the crystal and her spirit wanders as "the pale girl".
- **Faith:** raised in the Dawn, by a Pale Hour mother, and in the end she goes down to the Root.
- **Looks:** long silver hair, gentle eyes, a white nightgown or dress. As a spirit she is translucent with a soft glow; asleep, she lies encased in a faceted ice crystal.
- **Voice:** wistful, kind, a little wry. "Nobody ever asked which god I liked best."
- **Appears in:** the `lyra` events in sewers1, crypt1, keep1 and tower1, the ending, and the locket. Art keys: `npc('ghost_girl')` (unnamed), `npc('lyra')`.

### Irena of Isenmark (deceased)
- **Role and faith:** Malthor's wife and Lyra's mother, a Pale Hour devotee who died about 8 years ago of the same wasting fever that later took Lyra. She raised Lyra to light a candle for the Still Mother *and* one for the Dawn.
- **Looks:** dark hair in the same style as Lyra's, grey eyes, a warm and gentle face. A silver Isenmark gown (revealing but tasteful, clearly adult) embroidered with the Pale Hour's snowflake-and-hourglass, a **still-lily** pin at her breast and another still-lily in her hair.
- **Voice:** tender, steady. "Tell him I was never in the ice."
- **Appears in:** the family portrait in her house (`l1`), and as **the Echo of Irena** at the heart of the Folded Cellar (`folded2`). Art keys: `npc('irena')`, `npcFigure('irena')`, `monster('irena_echo')`. Her memory is told in the side quest *The Folded House* (side-quests.md).

### King Morvane, the Hollow King
- **Role and faith:** the last king-priest of the Deep Root and Malthor's first teacher (as a spirit). Bound in undeath; boss of `crypt2`.
- **Looks:** a crowned lich-king with an ancient crown, blue fire in his eye sockets, rotten royal robes and a spectral blue aura.
- **Voice:** a tormented apology. "Forgive me. I cannot stop."
- **Art keys:** `npc('morvane')`, `monster('morvane')`.

### Kargath, the Iron Warden
- **Role and faith:** once the Dawn's finest knight and captain of the guard; cursed into Malthor's warden. Boss of `keep2`.
- **Looks:** colossal frost-black armour, glowing eyes behind the visor and a greatsword. Unhelmeted when freed: a weathered, kind, bearded face.
- **Voice:** grinding iron, then gentle. "Tell Lyra... old Kargath is sorry."
- **Art keys:** `npc('kargath')`, `monster('kargath')`.

### The Rat King
- **Role:** lord of the sewer thieves, a beast grown monstrous on stolen bread and the winter's chaos. Boss of `sewers2`.
- **Looks:** a bear-sized rat in a tin crown and tattered royal robes, enthroned on stolen junk.
- **Voice:** greedy and theatrical. "Children - feast!"
- **Art keys:** `npc('ratking')`, `monster('ratking')`.

## Clergy

### High Priestess Aurelle (Dawn)
- **Looks:** a warm, dignified woman in her 30s with golden hair. White and gold vestments in the revealing-but-elegant style, with the sun disc on her chest, pendant and circlet.
- **Voice:** compassionate and honest. "The sun rises on all of us, Brother. Even on them."
- **Where:** the Temple of the Dawn. Art key: `npc('priestess')`.

### Brother Caddoc (Dawn)
- **Looks:** a stern man with greying hair, white vestments, a gold stole with sun discs and a smoking censer of sunthistle.
- **Voice:** zealous and harsh. "Pale Hour heretics pay double for the Dawn's mercy."
- **Where:** the Temple of the Dawn, when the party is sworn to the Pale Hour. Art key: `npc('dawnpriest')`.

### Matron Sevrine (Pale Hour)
- **Looks:** a beautiful, cold, serene woman with silver-white hair and ice-blue half-lidded eyes. White and pale-blue silk with sheer sleeves, a snowflake-and-hourglass circlet and pendant, and frost glitter around her.
- **Voice:** serene certainty that slowly gives way to doubt. "Perhaps I taught him the wrong prayer."
- **Where:** the Hall of the Still Mother. Art key: `npc('matron')`.

### Old Thessaly, the Root-Warden (Deep Root)
- **Looks:** a wise old woman with a crown of antlers and roots, bark-brown and moss robes, glowing amber root tattoos and a lantern.
- **Voice:** grandmotherly and earthy, and stern about the dead. "All are welcome under the Root."
- **Where:** the Barrow of the Deep Root. She holds the graveyard keys, and the crypt key was stolen from her. Art key: `npc('rootwarden')`.

### Ysolde (Pale Hour, deceased)
- **Role:** a widow and dissenting Keeper of the Still Hourglass. Her house is a side-quest location.
- **Looks:** a stern woman in silver, known only from her portrait in her parlour.

## Townsfolk

| Name | Role | Looks | Where | Art key |
|---|---|---|---|---|
| the Barkeep | runs the Frostbitten Flagon; rumors, the sewer cellar | burly and friendly, with a moustache and a white shirt, apron and mug | Tavern (T) | `barkeep` |
| the Innkeeper | runs the Warm Hearth Inn | a warm, cheerful woman | Inn (I) | `innkeeper` |
| Brannoc | the outfitter | goggles and scales, a shopkeeper's apron | Shop (S) | `merchant` |
| the Guildmaster | runs the Adventurers' Guild | a veteran adventurer with an eyepatch | Guild (A) | `guildmaster` |
| the Sage of Review | the Review Board: levels and spells | old and scholarly, with robes and a long beard | Hall of Review (R) | `sage` |
| Madame Zeyla | the Mystic: SP, fortunes, and giver of the Concord quest. Her faith is evasive; rumoured to be an Isenmark exile. | a sultry fortune-teller with violet silks, jewellery and a crystal ball | Mystic (M) | `mystic` |
| Orrin the Clockmaker | a Dawn craftsman, gone "to the Dawn" (dead); his family hid the Sun Shard | (unseen; clocks everywhere) | House Q | - |
| Malthor's household | the family townhouse (L) next to the tower; abandoned for eight years except for Malthor's study | (unseen) | House L | - |
| Bramwick the Miller | a Root-folk miller, "took the way up to go down" | (unseen) | House U | - |

## The default party (Guild "ready-made party")

| Name | Race | Class | Gender | Notes |
|---|---|---|---|---|
| Torvald | Dwarf | Warrior | M | big blond beard, shirtless with pauldron |
| Seraphine | Human | Paladin | F | dark hair, holy plate with halo glow, Dawn sun disc |
| Mei | Human | Monk | F | martial wraps, black hair |
| Lark | Half-elf | Bard | M | lute, auburn hair |
| Elowen | Elf | Conjurer | F | pink hair, flame staff |
| Nyx | Half-elf | Magician | F | red hair, glowing orb |

Player-created heroes use `portrait(opts)` and `figure(opts)` with race, class, gender and look indices.
