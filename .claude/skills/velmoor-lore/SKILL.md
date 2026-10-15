---
name: velmoor-lore
description: Canon bible for "Winter of Velmoor" (this Bard's Tale-style game) - the main storyline, side quests, world history, the three religions, people and how they look, monster compendium, botanicals, places and building types, items, magic, naming and art style, and where each element lives in the code. Use whenever writing or changing story text, quests, NPCs, monsters, items, maps, buildings, art briefs or dialogue for this game, or when asked about the game's lore, so new content stays consistent with canon.
---

# Velmoor Lore Bible

The canon reference for **Winter of Velmoor**, a first-person party RPG in the spirit of *The Bard's Tale*. The setting is original: no real-world religions, symbols (never crosses), places or copyrighted Bard's Tale content.

The lore is split by topic. Read only the files you need.

## Reference index

| File | Read it when you... |
|---|---|
| [references/storyline.md](references/storyline.md) | touch the main quest: acts, bosses, keys, riddles, Lyra's appearances, endings |
| [references/side-quests.md](references/side-quests.md) | add or change optional content (the Concord of Velmoor, faith pledges, statues), or want quest seeds |
| [references/world-history.md](references/world-history.md) | need the timeline, geography, the three cities, or the cause of the winter |
| [references/religions.md](references/religions.md) | write anything involving the Dawn, the Pale Hour or the Deep Root: gods, creeds, symbols, clergy, rites, conflict, game mechanics |
| [references/people.md](references/people.md) | write an NPC or an art brief: names, roles, faiths, looks, voices, art keys |
| [references/monsters.md](references/monsters.md) | add or place monsters: lore by tier plus the stat table |
| [references/botanicals.md](references/botanicals.md) | need plants, herbs, fungi or trees (mostly lore hooks not yet in the game) |
| [references/places-and-buildings.md](references/places-and-buildings.md) | edit the city, building types and names, interiors, dungeons, or architecture by faith |
| [references/items-and-magic.md](references/items-and-magic.md) | change relics, artifacts, gear, spell schools or bard songs |
| [references/style-guide.md](references/style-guide.md) | write text or art direction: tone, naming per culture, content rules |
| [references/code-map.md](references/code-map.md) | turn lore into code: data files, event types, how to add a quest, map, NPC or monster, and the tests |

## Canon in one paragraph

Three faiths share the frozen north. **Velmoor** prays to **the Dawn** (Solenne, the Kindled Sun: *"All that sets will rise again"*). **Isenmark**, beyond the mountains, follows **the Pale Hour** (Ysra, the Still Mother: *"What is loved should never change"*). The buried Old Kings of **Vael-Harrow**, on whose ruins the Dawn's crusaders built Velmoor 300 years ago, followed **the Deep Root** (Vaelor, the Root-Below: *"We go down, so that others may grow"*).

When Lyra, daughter of the court archmage **Malthor**, was dying, the Dawn told him to let her go. He took the Pale Hour's *Rite of Stillness* from Matron Sevrine instead, froze Lyra's last moment in crystal, and the rite froze the whole city. That was one year before the game begins.

The heroes take three keys from three cursed guardians: the **Rat King** (sewers), **King Morvane** (the crypt; a Root king-priest Malthor bound in undeath) and **Kargath** (the Iron Keep; a Dawn knight). They climb the tower, and Lyra's spirit helps her father let go. Spring returns, and the three faiths pray together once.

## Rules for growing the lore

1. **Read before you write.** Check the relevant reference so names, dates, looks and faiths match. If something is not in the references it is not canon yet: decide it, then record it.
2. **Record every new canon fact in the right reference file** in the same change, including new NPCs (looks included), monsters, plants, places and quests. Keep `SKILL.md` an index; put detail in `references/`.
3. **Everything ties to the faith conflict.** New content should touch at least one faith, or the Dawn-vs-Pale-Hour-vs-Root tension, or Malthor's grief.
4. **No real-world religion.** No crosses, crescents, stars of David, real saints or real scripture. Use the three faith symbols (see `religions.md`).
5. **Art direction:** anime/JRPG style. Female characters wear revealing fantasy outfits that stay tasteful and non-explicit, and are clearly adults. Males are heroic and often muscular. Monsters are dramatic. See `people.md` and `style-guide.md`.
6. **Text in game is concise:** 1-3 sentences per message box. Put depth in optional dialogue (temple "speak with" options, notes, rumors).
7. **Stat tables are generated:** after changing data, refresh with `node tools/lore-tables.js monsters|items|spells|maps` and paste the result into the matching reference.
8. **After code changes run** `node tests/test-maps.js`, `node tests/playthrough.js 2` and `node tests/sim.js 30` (see `code-map.md`).
