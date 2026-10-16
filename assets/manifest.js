// Custom image overrides. Put PNG/WebP/JPG files in the matching folder under assets/images/
// (portraits, figures, npcs, monsters, scenes) and list them here; any listed image replaces the
// generated SVG art. Paths are relative to assets/. Transparent PNGs work best for figures and monsters.
window.BT_ASSETS = {
  // Party portraits (bust, ~4:5). Key: 'race_class_gender', or 'class_gender' as a fallback.
  //   e.g. 'elf_conjurer_f': 'images/portraits/elf_conjurer_f.png', 'warrior_m': 'images/portraits/warrior_m.png'
  portrait: {},
  // Full-body heroes (~1:2, transparent, in images/figures/). Same keys as portrait.
  figure: {},
  // NPC busts and full bodies. Keys: priestess, matron, rootwarden, dawnpriest, barkeep, innkeeper,
  // merchant, guildmaster, sage, mystic, malthor, lyra, irena, ghost_girl, morvane, kargath, ratking, mouth
  //   (files in images/npcs/)
  npc: {},
  npcFigure: {},
  // Monsters (transparent, ~1:1, in images/monsters/). Keys are the art keys in js/data/monsters.js, e.g. 'dragon', 'siren', 'ratking'.
  monster: {},
  // Wide scenes (16:9, in images/scenes/): title, victory, gameover, town, sewers, crypt, keep, tower, folded
  scene: {},
};
