// Custom image overrides. Drop PNG/WebP/JPG files into this folder and list them here;
// any listed image replaces the generated SVG art. Paths are relative to assets/.
// Transparent PNGs work best for figures and monsters.
window.BT_ASSETS = {
  // Party portraits (bust, ~4:5). Key: 'race_class_gender', or 'class_gender' as a fallback.
  //   e.g. 'elf_conjurer_f': 'portraits/elf_conjurer_f.png', 'warrior_m': 'portraits/warrior_m.png'
  portrait: {},
  // Full-body heroes (~1:2, transparent). Same keys as portrait.
  figure: {},
  // NPC busts and full bodies. Keys: priestess, matron, rootwarden, dawnpriest, barkeep, innkeeper,
  // merchant, guildmaster, sage, mystic, malthor, lyra, ghost_girl, morvane, kargath, ratking, mouth
  npc: {},
  npcFigure: {},
  // Monsters (transparent, ~1:1). Keys are the art keys in js/monsters.js, e.g. 'dragon', 'siren', 'ratking'.
  monster: {},
  // Wide scenes (16:9): title, victory, gameover, town, sewers, crypt, keep, tower
  scene: {},
};
