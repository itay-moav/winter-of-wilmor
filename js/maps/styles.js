// Visual and audio style of every kind of place: textures, fog, light, music, battle music.
(function () {
  const MG = BT.MG;

  // wall2: an optional variant shown on about one wall face in seven.
  BT.STYLES = {
    town: { battle: 'combat_city', wall: 'house', floor: 'cobble', ceil: 'sky', fog: [20, 26, 48], ambient: 1, music: 'town', snow: true },
    sewer: { battle: 'combat_underground', wall: 'sewer', floor: 'sewerfloor', ceil: 'sewerceil', fog: [6, 14, 10], ambient: 0.32, music: 'dungeon' },
    crypt: { battle: 'combat_underground', wall: 'crypt', wall2: 'crypt2', floor: 'cryptfloor', ceil: 'cryptceil', fog: [8, 8, 16], ambient: 0.28, music: 'crypt' },
    keep: { battle: 'combat_underground', wall: 'keep', wall2: 'keep2', floor: 'keepfloor', ceil: 'keepceil', fog: [14, 8, 6], ambient: 0.34, music: 'dungeon' },
    tower: { battle: 'combat_wild', wall: 'tower', wall2: 'tower2', floor: 'towerfloor', ceil: 'towerceil', fog: [10, 14, 30], ambient: 0.5, music: 'tower' },
    interior: { battle: 'combat_city', wall: 'woodwall', wall2: 'woodwall2', floor: 'planks', ceil: 'beams', door: 'door_interior', fog: [18, 12, 8], ambient: 0.62, music: 'tavern', scene: 'town' },
    vault: { battle: 'combat_wild', wall: 'vault', wall2: 'vault2', floor: 'vaultfloor', ceil: 'vaultceil', door: 'door_vault', fog: [30, 22, 6], ambient: 0.6, music: 'temple', scene: 'tower' },
    mirror: { battle: 'combat_wild', wall: 'mirror', wall2: 'mirror2', floor: 'mirror_floor', ceil: 'ceil_mirror', door: 'door_mirror', fog: [20, 30, 50], ambient: 0.55, music: 'tower', scene: 'tower' },
    hollow: { battle: 'combat_underground', wall: 'hollow', wall2: 'hollow2', floor: 'hollowfloor', ceil: 'hollowceil', door: 'door_hollow', fog: [8, 10, 4], ambient: 0.3, music: 'crypt', scene: 'crypt' },
    folded: { battle: 'combat_underground', wall: 'folded', wall2: 'folded2', floor: 'folded_floor', ceil: 'ceil_folded', door: 'door_folded', fog: [16, 14, 26], ambient: 0.36, music: 'crypt', scene: 'folded' },
  };
})();
