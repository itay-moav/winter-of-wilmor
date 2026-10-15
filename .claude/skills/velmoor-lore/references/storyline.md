# Main Storyline

The main quest is a chain of three keys, each held by a cursed guardian whom Malthor bound to his service. Each key opens the next area from the city. Text in the game lives in `js/data.js` (`D.STORY`) and `js/maps.js` (event text).

## Premise (intro screens)

1. Three faiths share the north: the Dawn (Velmoor), the Pale Hour (Isenmark) and the Deep Root (the buried Old Kings of Vael-Harrow). The Dawn built Velmoor on Vael-Harrow's ruins 300 years ago.
2. Lyra, daughter of court archmage Malthor, lay dying of a wasting fever. The Dawn's priests told him to let her go "to the morning". He went to **Matron Sevrine** of the Pale Hour, who taught him the **Rite of Stillness**.
3. He froze Lyra's last moment in a crystal of ice, and the rite spilled out of his tower and froze the whole city. That was one year ago.
4. The faiths are at each other's throats:
   - the Dawn blames the Pale Hour;
   - Pale Hour zealots call the winter a miracle;
   - the Root-folk say the dead walk because Malthor chained their king.
   The city guard serves Malthor under a curse, and the gates are sealed by ice.
5. The Adventurers' Guild calls for heroes.

## Act I: The Sewers (the Rat King)

- **Entry:** the Tavern (*The Frostbitten Flagon*): talk to the barkeep, then "Go down to the cellar". Maps `sewers1` → `sewers2`.
- **Hook:** tavern rumors say the Rat King's thieves stole the crypt key from Old Thessaly, the Root-Warden.
- **Lyra appearance 1 (sewers1):** a pale girl in a nightgown: "my father did not mean any of this... The Rat King has the key."
- **Lore found:**
  - Graffiti: "THE KING BELOW SEES ALL".
  - A Pale Hour tract ("REJOICE! The Still Mother has heard a father's prayer...").
  - A letter from M. telling the Rat King to keep the bronze key.
- **Boss (`sewers2` boss room): the Rat King**, a bear-sized rat in a tin crown on a throne of junk, with wererats and giant rats.
- **Reward:** the **Bronze Crypt Key** (`bronzekey`) and the dagger **Shadowfang**.
- **Expected party level:** about 4.

## Act II: Crypt of the Old Kings (King Morvane)

- **Entry:** the crypt gate (C) in the graveyard, at the city's south-west. It needs the Bronze Crypt Key. Maps `crypt1` → `crypt2`.
- **Riddle (crypt1, unlocks the stairs):** "The more of me you take, the more of me you leave behind." Answer: **footsteps** (also: steps).
- **Lyra appearance 2:** "King Morvane taught my father magic, long before any priest did... let him go down to the roots."
- **Lore found:**
  - Root tree-and-ring carvings, many chiselled over with the Dawn's sun (the crusade's desecration).
  - "NOW THE SUN-PRIESTS WALK ON OUR ROOTS."
  - Morvane's epitaph, scratched over with Pale Hour frost-runes.
- **Boss (`crypt2`): Morvane, the Hollow King**, the last king-priest of the Deep Root and Malthor's first teacher. Malthor bound him in undeath to guard the Iron Sigil. He asks forgiveness and crumbles to dust in peace when defeated.
- **Reward:** the **Iron Sigil** (`ironsigil`) and the **Holy Avenger**.
- **Expected level:** about 8.

## Act III: The Iron Keep (Kargath)

- **Entry:** the Keep gate (K), which needs the Iron Sigil. Maps `keep1` → `keep2`.
- **Riddle (keep1):** "I am always coming, but I never arrive." Answer: **tomorrow** (also: the future).
- **Lyra appearance 3:** Kargath carried her on his shoulders at the Dawn festival. Her mother took her to the Pale Hall to light candles. "Nobody ever asked which god I liked best."
- **Lore found:**
  - The Keep's Dawn chapel desecrated: its sun disc cased in ice, and a Pale Hour hourglass hung in its place.
  - A carving recalling Kargath and Lyra.
- **Boss (`keep2`): Kargath, the Iron Warden**, once the Dawn's finest knight and now cursed into frost-black armour. Freed, he lifts his visor: "Tell Lyra... old Kargath is sorry."
- **Reward:** the **Moonstone Key** (`moonkey`) and **Frostguard Plate**.
- **Expected level:** about 11.

## Act IV: Malthor's Tower

- **Entry:** the tower door (W) in the north-east, which needs the Moonstone Key. Maps `tower1` → `tower2` → `tower3` (the stairs climb up).
- **Lyra appearance 4 (tower1):** she reveals her name: "The Dawn says I should rise, the Pale Hour says I should stay, the Root says I should go down... Help my father let me go." She gives the party **Lyra's Locket** (`locket`).
- **Riddle (tower1):** "Speak the name of the one who sleeps in the crystal." Answer: **Lyra**.
- **Riddle (tower2):** "What did the father try to stop - the one thing no one can?" Answer: **time** (also: death, her death).
- **Lore found:**
  - Hundreds of clocks, all stopped at the same minute.
  - A Pale Hour altar with Malthor's note: "Sevrine says the Mother keeps what we love. Then why does Lyra never wake?"
- **Final boss (`tower3`, the Crystal Chamber): Malthor, Archmage of Winter**, with crystal sentinels and Pale Hour magi. If the party carries Lyra's Locket, he falters at the sight of it and the battle starts with a 2-round time-stop on his side.
- **Expected level:** 13-14.

## Ending

1. Malthor falls. Lyra's spirit kneels beside him: "It's time. Let me go." He lets the moment pass, and the crystal melts.
2. The snow turns to rain, then to sunlight, and the gates break free.
3. Three days later, in the graveyard:
   - Thessaly (Root) lays Lyra's locket under the great oak;
   - Aurelle (Dawn) lights a candle at sunrise;
   - Sevrine (Pale Hour) lets the candle burn down.
   The faiths pray together once.
4. Then a faith-specific line (`D.STORY.endingFaith`):
   - **dawn:** the bells ring, and Aurelle keeps Caddoc from burning the Pale Hall.
   - **pale:** Sevrine preaches "in memory - not in ice".
   - **root:** a green shoot rises where the locket lies.
   - **none:** "You never knelt at any of their altars..."
5. If the Concord side quest is complete, the Fountain of Concord runs again and each faith tends it in turn.
6. Closing line: a bard in the Frostbitten Flagon is writing your song.

After the ending the city is playable in spring: no snow, a blue sky, a flowing fountain, and no random encounters.

## Rumors by progress (Tavern)

`D.STORY.rumors[progress]`, where progress runs: 0 = no key, 1 = crypt key, 2 = sigil, 3 = moon key, 4 = Malthor defeated. Each faith's priest also has a line per progress stage (`D.STORY.faithTalk`), and so do Zeyla's fortunes and Thessaly's ancestor communion.

## Open threads (canon hooks for future content)

- What happens to **Malthor** after the thaw: exile, penance, or service to one of the faiths?
- **Isenmark's response:** did Sevrine act on her own, or under orders from Isenmark's High Matrons?
- **Brother Caddoc's** zealot faction, kept from burning the Pale Hall, may become a post-game antagonist.
- **Lyra's mother, Irena of Isenmark:** how she died, and whether the Pale Hour had a claim on Lyra.
- The rest of buried **Vael-Harrow** beneath the crypt.
