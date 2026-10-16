# Items & Magic

## Quest items and relics

| Item | id | Lore | How it's obtained |
|---|---|---|---|
| Bronze Crypt Key | `bronzekey` | Thessaly's key to the crypt gate, stolen by the Rat King's thieves | Rat King (sewers2) |
| Iron Sigil | `ironsigil` | the seal of the Iron Keep, entrusted to Morvane's tomb | Morvane (crypt2) |
| Moonstone Key | `moonkey` | the key to Malthor's tower, given to Kargath | Kargath (keep2) |
| Lyra's Locket | `locket` | silver, holding a picture of a laughing girl and her father. Stuns Malthor for 2 rounds at the start of the final fight. Buried under the Heartwood Oak in the ending. | Lyra (tower1) |
| Sun Shard | `sunshard` | the Dawn's Concord relic | the Sun-Warden (sunvault) |
| Still Hourglass | `stillglass` | the Pale Hour's Concord relic; its sand hangs motionless | the Mirror Maiden (mirrorhall) |
| Heartwood Seed | `heartseed` | the Root's Concord relic; amber, beats like a heart | the Root Horror (roothollow) |
| Irena's Still-Lily | `stilllily` | a silver lily pin, "cold as a held breath"; Irena wore it every day. Shown to Malthor in the final fight, it stills him one more round, and it adds a line to the ending | the Echo of Irena (folded2) |
| Ring of Concord | `concordring` | three bands (gold, silver, wood) twined into one | Concord quest reward |

## Notable artifacts
- **Shadowfang:** the Rat King's dagger. It quadruples a rogue's sneak-attack damage.
- **Holy Avenger:** a Dawn paladin blade from Morvane's tomb (taken from the crusaders who desecrated it), a bane of the undead.
- **Frostguard Plate:** Kargath's spare armour. It resists ice.
- **Sunblade, Dragonscale Mail, Archmage Staff:** endgame loot.
- **Lyra's Lyre:** a small silver lyre, Irena's gift to her daughter. Songs played on it are 1.75x as strong. From the Echo of Irena.
- **Horn of Thaw:** a bard's instrument that casts Inferno; a symbol of the winter's end.

## Magic
- **Four arcane schools**, taught at the Hall of Review. Magic is secular; faiths and arcane schools are separate.
  - **Conjurer:** elements and healing.
  - **Magician:** wards and force.
  - **Sorcerer:** shadow and fear.
  - **Wizard:** summoning and the highest arts.
- Each school has seven spell levels. Spell codes are four letters (`MEND`, `FIRB`, ...).
- **The Rite of Stillness** is Pale Hour ritual magic, not an arcane spell. Only Malthor has performed it, with Sevrine's teaching.
- **Class change:** mages who master three spell levels may begin a new school. Sorcerer requires Conjurer or Magician; Wizard requires Sorcerer plus one other.
- **Bard songs** (they need an instrument and "voice"; a drink at the Tavern restores voice): Warding Hymn, March of Iron, Hearthfire Lay, Lantern Song, Lullaby of Frost, Requiem and Song of Swiftness. They are folk magic, not tied to any faith. The Requiem is sung at funerals of all three faiths.
- **Song music:** while a song lasts (in battle, or carried through exploration), its own piece takes over and the regular music fades to a faint background. Battle songs are heavy folk/power metal, gentle songs classical or Irish, mystical songs Arabic/oriental. All are arrangements of public-domain melodies (see `music.md`).

| Song | Effect | Music |
|---|---|---|
| Warding Hymn | party AC -3 | Beethoven, *Ode to Joy*, as a choir-and-horns power-metal anthem |
| March of Iron | +2 hit, +3 damage | Prokofiev, March from *The Love for Three Oranges* (1919), as a stomping metal march |
| Song of Swiftness | act first, always escape | Grieg, *In the Hall of the Mountain King*, speed metal that accelerates 110 → 200 bpm |
| Hearthfire Lay | heals each round / every few steps | the *Londonderry Air* on tin whistle, fiddle, harp and bodhrán, with crackling embers |
| Lantern Song | light while exploring | Grieg, *Morning Mood*, flute and oboe trading the theme |
| Lullaby of Frost | foes fall asleep | after Rimsky-Korsakov's *Scheherazade* violin theme, on kamancheh, qanun and glass bells |
| Requiem | wracks the undead | Grieg, *Åse's Death*, recast in the Arabic Hijaz mode on ney, oud and darbuka |

## Spell table (generated: `node tools/lore-tables.js spells`)

| Code | Name | School | Lvl | SP | When | Target | Effect |
|---|---|---|---|---|---|---|---|
| SPRK | Spark Bolt | con | 1 | 2 | combat | one | 2d4 fire |
| GLOW | Glowlight | con | 1 | 2 | explore | none | light 3 |
| MEND | Minor Mend | con | 1 | 3 | both | ally | heal 1d8+2 |
| FRDT | Frost Dart | con | 2 | 4 | combat | one | 3d6 ice |
| ARMR | Arcane Armor | con | 2 | 4 | combat | party | buff {"ac":-2} |
| TRPS | Trap Sense | con | 2 | 3 | explore | none | trapsense 400 |
| FIRB | Fireburst | con | 3 | 6 | combat | group | 3d6 fire |
| HEAL | Heal | con | 3 | 6 | both | ally | heal 4d8+4; cure ["poisoned"] |
| COMP | Compass Charm | con | 3 | 3 | explore | none | compass 1000 |
| SHOK | Shockwave | con | 4 | 9 | combat | group | 4d8 lightning |
| BRIL | Brilliance | con | 4 | 6 | explore | none | light 5 |
| CURE | Cure Ailments | con | 4 | 8 | both | ally | cure ["poisoned","paralyzed"] |
| INFR | Inferno | con | 5 | 14 | combat | all | 4d8 fire |
| REST | Restoration | con | 5 | 14 | both | ally | heal full; cure ["poisoned","paralyzed","stoned"] |
| GLSP | Glacier Spear | con | 6 | 18 | combat | one | 10d10 ice |
| SUMF | Summon Salamander | con | 6 | 20 | both | none | summon salamander |
| METR | Meteor Storm | con | 7 | 30 | combat | all | 10d8 fire |
| RAIS | Rekindle Soul | con | 7 | 30 | explore | ally | heal full; raise |
| VOLT | Voltaic Touch | mag | 1 | 2 | combat | one | 1d10+2 lightning |
| SHLD | Mage Shield | mag | 1 | 2 | combat | party | buff {"ac":-1} |
| ZAPT | Trap Zap | mag | 1 | 2 | explore | none | trapsense 150 |
| SLEP | Slumber | mag | 2 | 4 | combat | group | sleep 3 |
| BLES | Blessed Blades | mag | 2 | 5 | combat | party | buff {"hit":2,"dmg":2} |
| SCRY | Scry Site | mag | 2 | 2 | explore | none | scry |
| PHAS | Phase Door | mag | 3 | 6 | explore | none | phase |
| SWRD | Spectral Sword | mag | 3 | 6 | combat | one | 6d6 force |
| LEVI | Levitation | mag | 3 | 5 | explore | none | levitate 600 |
| MIND | Mind Spike | mag | 4 | 9 | combat | group | 5d6 mind |
| HOLD | Hold Monsters | mag | 4 | 8 | combat | group | hold 3 |
| DISP | Dispel Undead | mag | 4 | 9 | combat | group | 10d6 holy (undead only) |
| WARD | Greater Ward | mag | 5 | 12 | combat | party | buff {"ac":-4,"resist":true} |
| HAST | Haste | mag | 5 | 14 | combat | party | buff {"haste":true} |
| CHNL | Chain Lightning | mag | 6 | 18 | combat | all | 6d8 lightning |
| RECL | Recall | mag | 6 | 15 | explore | none | recall |
| TIME | Time Stop | mag | 7 | 30 | combat | none | timestop 2 |
| ANNI | Annihilate | mag | 7 | 28 | combat | group | 12d10 force |
| NSGT | Night Sight | sor | 1 | 3 | explore | none | light 4 |
| FEAR | Dread | sor | 1 | 3 | combat | group | fear 0.35 |
| PHBL | Phantom Blades | sor | 2 | 5 | combat | group | 3d8 dark |
| DSEC | Detect Secrets | sor | 2 | 4 | explore | none | light 3 |
| ILLU | Illusory Ally | sor | 3 | 10 | both | none | summon phantasm |
| DRLF | Drain Life | sor | 3 | 8 | combat | one | 6d8 dark; drain 0.5 |
| TELE | Teleport | sor | 4 | 15 | explore | none | teleport |
| SHDW | Shadowfire | sor | 4 | 11 | combat | group | 6d8 dark |
| MFER | Mass Terror | sor | 5 | 14 | combat | all | fear 0.45 |
| SOUL | Soul Shield | sor | 5 | 14 | combat | party | buff {"ac":-3,"resist":true} |
| NGHT | Nightmare | sor | 6 | 20 | combat | all | 7d8 dark |
| REVL | Reveal Maze | sor | 6 | 12 | explore | none | reveal |
| DOOM | Doom | sor | 7 | 30 | combat | group | death |
| ECLP | Eclipse | sor | 7 | 32 | combat | all | 12d8 dark |
| AMIS | Arcane Missiles | wiz | 1 | 6 | combat | group | 4d6 force |
| SIMP | Summon Imp | wiz | 1 | 10 | both | none | summon imp_ally |
| HAMR | Spirit Hammer | wiz | 2 | 12 | combat | one | 10d8 holy |
| MHEL | Mass Healing | wiz | 2 | 18 | both | party | heal 4d8+4; cure ["poisoned"] |
| SDEM | Summon Demon | wiz | 3 | 25 | both | none | summon demon_ally |
| HOLI | Holy Light | wiz | 4 | 20 | combat | all | 12d6 holy (undead only) |
| STRM | Storm of Souls | wiz | 5 | 26 | combat | all | 10d8 force |
| BANI | Banishment | wiz | 6 | 30 | combat | group | death |
| SDRG | Summon Dragon | wiz | 6 | 40 | both | none | summon dragon_ally |
| APOC | Apocalypse | wiz | 7 | 45 | combat | all | 20d10 force |
| DIVR | Divine Rebirth | wiz | 7 | 50 | explore | party | heal full; cure ["poisoned","paralyzed","stoned"]; raise |
| FIGW | Call of the Wolf | item | 0 | 0 | both | none | summon wolf_ally |
| HOLY | Holy Water | item | 0 | 0 | combat | group | 4d8 holy (undead only) |

## Item table (generated: `node tools/lore-tables.js items`)

| id | Name | Slot | Stats | Price | Notes |
|---|---|---|---|---|---|
| dagger | Dagger | weapon | dmg 1d4 | 10 |  |
| club | Club | weapon | dmg 1d6 | 6 | only warrior/paladin/hunter/rogue/bard/monk |
| staff | Quarterstaff | weapon | dmg 1d6 | 15 | two-handed |
| shortsword | Short Sword | weapon | dmg 1d6 | 40 | only warrior/paladin/hunter/rogue/bard/monk |
| mace | Mace | weapon | dmg 1d7 | 50 | only warrior/paladin/hunter/bard |
| longsword | Long Sword | weapon | dmg 1d8 | 90 | only warrior/paladin/hunter/rogue/bard |
| spear | Spear | weapon | dmg 1d9 | 60 | only warrior/paladin/hunter |
| battleaxe | Battle Axe | weapon | dmg 1d10 | 150 | only warrior/paladin/hunter |
| warhammer | War Hammer | weapon | dmg 2d5 | 180 | only warrior/paladin/hunter |
| greatsword | Greatsword | weapon | dmg 2d6 | 300 | two-handed; only warrior/paladin/hunter |
| halberd | Halberd | weapon | dmg 1d12+1 | 260 | two-handed; only warrior/paladin/hunter |
| shortbow | Short Bow | weapon | dmg 1d6 | 80 | two-handed; ranged; only hunter/rogue/warrior |
| longbow | Long Bow | weapon | dmg 1d8+1 | 220 | two-handed; ranged; only hunter/warrior |
| silverdagger | Silver Dagger | weapon | dmg 1d6+1, +1 hit | 300 | magic; slays undead |
| frostbrand | Frost Brand | weapon | dmg 1d10+2, +2 hit | 1500 | magic; ice; only warrior/paladin/hunter/rogue/bard |
| flamberge | Flamberge | weapon | dmg 2d6+3, +2 hit | 2500 | magic; two-handed; fire; only warrior/paladin/hunter |
| shadowfang | Shadowfang | weapon | dmg 1d8+2, +3 hit | 2000 | magic; only rogue/bard/hunter |
| vampblade | Vampiric Blade | weapon | dmg 1d10+3, +2 hit | 4000 | magic; only warrior/paladin/hunter/rogue/bard |
| holyavenger | Holy Avenger | weapon | dmg 2d8+4, +4 hit | 9000 | magic; slays undead; only paladin |
| elvenbow | Elven Bow | weapon | dmg 1d10+3, +3 hit | 3000 | magic; two-handed; ranged; only hunter/warrior/rogue |
| dragonbow | Dragonbone Bow | weapon | dmg 2d8+4, +4 hit | 9000 | magic; two-handed; ranged; only hunter |
| emberstaff | Staff of Embers | weapon | dmg 1d8+1 | 1800 | magic; two-handed; use: FIRB; only conjurer/magician/sorcerer/wizard |
| archstaff | Archmage Staff | weapon | dmg 2d6+2, +2 hit, +15 SP | 8000 | magic; two-handed; only conjurer/magician/sorcerer/wizard |
| sunblade | Sunblade | weapon | dmg 3d8+5, +5 hit | 15000 | magic; fire; slays cold; only warrior/paladin/hunter/rogue/bard |
| monkwraps | Wraps of the Tiger | weapon | +3 hit | 5000 | magic; only monk |
| robes | Robes | armor | AC-1 | 15 |  |
| leather | Leather Armor | armor | AC-2 | 50 | only warrior/paladin/hunter/rogue/bard |
| studded | Studded Leather | armor | AC-3 | 120 | only warrior/paladin/hunter/rogue/bard |
| chain | Chain Mail | armor | AC-4 | 300 | only warrior/paladin/hunter/bard |
| scale | Scale Mail | armor | AC-5 | 700 | only warrior/paladin/hunter |
| plate | Plate Armor | armor | AC-6 | 1500 | only warrior/paladin |
| elvenchain | Elven Chain | armor | AC-6 | 2500 | magic; only warrior/paladin/hunter/rogue/bard |
| shadowleather | Shadow Leathers | armor | AC-5 | 2200 | magic; only rogue/bard/hunter/monk |
| silkrobes | Robes of the Magi | armor | AC-3, +10 SP | 3000 | magic; only conjurer/magician/sorcerer/wizard |
| frostplate | Frostguard Plate | armor | AC-9 | 8000 | magic; resist ice; only warrior/paladin |
| dragonscale | Dragonscale Mail | armor | AC-10 | 14000 | magic; resist fire; only warrior/paladin/hunter/bard |
| buckler | Buckler | shield | AC-1 | 30 | only warrior/paladin/hunter/rogue/bard |
| shield | Kite Shield | shield | AC-2 | 100 | only warrior/paladin/hunter/bard |
| towershield | Tower Shield | shield | AC-3 | 400 | only warrior/paladin |
| mirrorshield | Mirror Shield | shield | AC-5 | 6000 | magic; resist magic; only warrior/paladin/hunter/bard |
| cap | Leather Cap | helm | AC-1 | 20 |  |
| helm | Iron Helm | helm | AC-2 | 150 | only warrior/paladin/hunter/bard |
| greathelm | Great Helm of Valor | helm | AC-3, +1 hit | 2500 | magic; only warrior/paladin/hunter/bard |
| circlet | Circlet of Insight | helm | AC-1, +2 iq | 2500 | magic |
| gauntlets | Gauntlets | gloves | AC-1 | 80 | only warrior/paladin/hunter/bard |
| mightgloves | Gloves of Might | gloves | AC-1, +3 st | 3500 | magic |
| swiftgloves | Gloves of Swiftness | gloves | AC-2, +3 dx | 3500 | magic |
| ringprot | Ring of Protection | ring | AC-2 | 1200 | magic |
| ringwarm | Ring of Warmth | ring | AC-1 | 1500 | magic; resist ice |
| ringmana | Ring of Mana | ring | +12 SP | 4000 | magic |
| ringluck | Ring of Fortune | ring | AC-1, +4 lk | 2500 | magic |
| lute | Lute | instrument |  | 60 | only bard |
| silverflute | Silver Flute | instrument |  | 2000 | magic; only bard |
| frosthorn | Horn of Thaw | instrument |  | 5000 | magic; use: INFR; only bard |
| lyralyre | Lyra's Lyre | instrument |  | 6000 | magic; only bard; A small silver lyre, Irena's gift to her daughter. Its songs carry a mother's warmth. |
| harpofages | Harp of Ages | instrument |  | 10000 | magic; only bard |
| torch | Torch | use |  | 5 | use: light/steps |
| potion | Healing Potion | use |  | 40 | use: heal |
| bigpotion | Greater Healing | use |  | 200 | use: heal |
| antidote | Antidote | use |  | 30 | use: cure |
| softstone | Soft Stone Salve | use |  | 250 | use: cure |
| manapotion | Mana Draught | use |  | 150 | use: sp |
| elixir | Elixir of Life | use |  | 1500 | magic; use: heal/sp/cure |
| phoenix | Phoenix Feather | use |  | 2000 | magic; use: raise |
| firescroll | Scroll of Fireburst | use |  | 120 | use: FIRB |
| recallscroll | Scroll of Recall | use |  | 400 | use: RECL |
| lightwand | Wand of Lightning | use |  | 2500 | magic; use: SHOK |
| wolfstatue | Wolf Figurine | use |  | 1500 | magic; use: FIGW |
| holywater | Holy Water | use |  | 80 | use: HOLY |
| bronzekey | Bronze Crypt Key | quest |  | 0 | QUEST; Opens the crypt gate in the graveyard. |
| ironsigil | Iron Sigil | quest |  | 0 | QUEST; Opens the gate of the Iron Keep. |
| moonkey | Moonstone Key | quest |  | 0 | QUEST; Opens the door of Malthor's tower. |
| sunshard | Sun Shard | quest |  | 0 | QUEST; A sliver of golden crystal, warm as a summer afternoon. The Dawn's relic of the Concord. |
| stillglass | Still Hourglass | quest |  | 0 | QUEST; An hourglass whose sand hangs motionless. The Pale Hour's relic of the Concord. |
| heartseed | Heartwood Seed | quest |  | 0 | QUEST; A seed of glowing amber wood that beats faintly, like a heart. The Deep Root's relic of the Concord. |
| concordring | Ring of Concord | ring | AC-3, +1 st +1 iq +1 dx +1 cn +2 lk | 6000 | magic; resist magic; Three bands - gold, silver and wood - twined into one. |
| stilllily | Irena's Still-Lily | quest |  | 0 | QUEST; A silver lily pin, cold as a held breath. Irena wore it every day of her life. |
| locket | Lyra's Locket | quest |  | 0 | QUEST; A silver locket, cold as ice. Inside: a girl and her father, laughing. |
