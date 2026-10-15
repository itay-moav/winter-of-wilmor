// Item definitions. slot: weapon|armor|shield|helm|gloves|ring|instrument|use|quest
// allow: list of class ids or omitted for all.
(function () {
  const FIGHT = ['warrior', 'paladin', 'hunter'];
  const MELEE = ['warrior', 'paladin', 'hunter', 'rogue', 'bard', 'monk'];
  const LIGHT = ['warrior', 'paladin', 'hunter', 'rogue', 'bard'];
  const ARMORED = ['warrior', 'paladin', 'hunter', 'bard'];
  const MAGES = ['conjurer', 'magician', 'sorcerer', 'wizard'];

  const I = {
    // ---- weapons ----
    dagger: { name: 'Dagger', slot: 'weapon', dmg: [1, 4], price: 10 },
    club: { name: 'Club', slot: 'weapon', dmg: [1, 6], price: 6, allow: MELEE },
    staff: { name: 'Quarterstaff', slot: 'weapon', dmg: [1, 6], price: 15, two: true },
    shortsword: { name: 'Short Sword', slot: 'weapon', dmg: [1, 6], price: 40, allow: MELEE },
    mace: { name: 'Mace', slot: 'weapon', dmg: [1, 7], price: 50, allow: ['warrior', 'paladin', 'hunter', 'bard'] },
    longsword: { name: 'Long Sword', slot: 'weapon', dmg: [1, 8], price: 90, allow: LIGHT },
    spear: { name: 'Spear', slot: 'weapon', dmg: [1, 9], price: 60, allow: FIGHT },
    battleaxe: { name: 'Battle Axe', slot: 'weapon', dmg: [1, 10], price: 150, allow: FIGHT },
    warhammer: { name: 'War Hammer', slot: 'weapon', dmg: [2, 5], price: 180, allow: FIGHT },
    greatsword: { name: 'Greatsword', slot: 'weapon', dmg: [2, 6], price: 300, two: true, allow: FIGHT },
    halberd: { name: 'Halberd', slot: 'weapon', dmg: [1, 12, 1], price: 260, two: true, allow: FIGHT },
    shortbow: { name: 'Short Bow', slot: 'weapon', dmg: [1, 6], price: 80, two: true, ranged: true, allow: ['hunter', 'rogue', 'warrior'] },
    longbow: { name: 'Long Bow', slot: 'weapon', dmg: [1, 8, 1], price: 220, two: true, ranged: true, allow: ['hunter', 'warrior'] },
    // magic weapons (found, or sold back to the shop)
    silverdagger: { name: 'Silver Dagger', slot: 'weapon', dmg: [1, 6, 1], hit: 1, slay: 'undead', price: 300, magic: true },
    frostbrand: { name: 'Frost Brand', slot: 'weapon', dmg: [1, 10, 2], hit: 2, el: 'ice', price: 1500, magic: true, allow: LIGHT },
    flamberge: { name: 'Flamberge', slot: 'weapon', dmg: [2, 6, 3], hit: 2, el: 'fire', price: 2500, two: true, magic: true, allow: FIGHT },
    shadowfang: { name: 'Shadowfang', slot: 'weapon', dmg: [1, 8, 2], hit: 3, sneak: 4, price: 2000, magic: true, allow: ['rogue', 'bard', 'hunter'] },
    vampblade: { name: 'Vampiric Blade', slot: 'weapon', dmg: [1, 10, 3], hit: 2, drain: true, price: 4000, magic: true, allow: LIGHT },
    holyavenger: { name: 'Holy Avenger', slot: 'weapon', dmg: [2, 8, 4], hit: 4, slay: 'undead', price: 9000, magic: true, allow: ['paladin'] },
    elvenbow: { name: 'Elven Bow', slot: 'weapon', dmg: [1, 10, 3], hit: 3, two: true, ranged: true, price: 3000, magic: true, allow: ['hunter', 'warrior', 'rogue'] },
    dragonbow: { name: 'Dragonbone Bow', slot: 'weapon', dmg: [2, 8, 4], hit: 4, two: true, ranged: true, price: 9000, magic: true, allow: ['hunter'] },
    emberstaff: { name: 'Staff of Embers', slot: 'weapon', dmg: [1, 8, 1], two: true, price: 1800, magic: true, allow: MAGES, use: { spell: 'FIRB', charges: 12 } },
    archstaff: { name: 'Archmage Staff', slot: 'weapon', dmg: [2, 6, 2], hit: 2, two: true, price: 8000, magic: true, allow: MAGES, spBonus: 15 },
    sunblade: { name: 'Sunblade', slot: 'weapon', dmg: [3, 8, 5], hit: 5, el: 'fire', slay: 'cold', price: 15000, magic: true, allow: LIGHT },
    monkwraps: { name: 'Wraps of the Tiger', slot: 'weapon', dmg: [0, 0], hit: 3, monkBonus: 4, price: 5000, magic: true, allow: ['monk'] },

    // ---- armor (ac = how much it lowers AC) ----
    robes: { name: 'Robes', slot: 'armor', ac: 1, price: 15 },
    leather: { name: 'Leather Armor', slot: 'armor', ac: 2, price: 50, allow: LIGHT },
    studded: { name: 'Studded Leather', slot: 'armor', ac: 3, price: 120, allow: LIGHT },
    chain: { name: 'Chain Mail', slot: 'armor', ac: 4, price: 300, allow: ARMORED },
    scale: { name: 'Scale Mail', slot: 'armor', ac: 5, price: 700, allow: ['warrior', 'paladin', 'hunter'] },
    plate: { name: 'Plate Armor', slot: 'armor', ac: 6, price: 1500, allow: ['warrior', 'paladin'] },
    elvenchain: { name: 'Elven Chain', slot: 'armor', ac: 6, price: 2500, magic: true, allow: LIGHT },
    shadowleather: { name: 'Shadow Leathers', slot: 'armor', ac: 5, price: 2200, magic: true, allow: ['rogue', 'bard', 'hunter', 'monk'] },
    silkrobes: { name: 'Robes of the Magi', slot: 'armor', ac: 3, spBonus: 10, price: 3000, magic: true, allow: MAGES },
    frostplate: { name: 'Frostguard Plate', slot: 'armor', ac: 9, resist: 'ice', price: 8000, magic: true, allow: ['warrior', 'paladin'] },
    dragonscale: { name: 'Dragonscale Mail', slot: 'armor', ac: 10, resist: 'fire', price: 14000, magic: true, allow: ARMORED },

    buckler: { name: 'Buckler', slot: 'shield', ac: 1, price: 30, allow: LIGHT },
    shield: { name: 'Kite Shield', slot: 'shield', ac: 2, price: 100, allow: ARMORED },
    towershield: { name: 'Tower Shield', slot: 'shield', ac: 3, price: 400, allow: ['warrior', 'paladin'] },
    mirrorshield: { name: 'Mirror Shield', slot: 'shield', ac: 5, resist: 'magic', price: 6000, magic: true, allow: ARMORED },

    cap: { name: 'Leather Cap', slot: 'helm', ac: 1, price: 20 },
    helm: { name: 'Iron Helm', slot: 'helm', ac: 2, price: 150, allow: ARMORED },
    greathelm: { name: 'Great Helm of Valor', slot: 'helm', ac: 3, hit: 1, price: 2500, magic: true, allow: ARMORED },
    circlet: { name: 'Circlet of Insight', slot: 'helm', ac: 1, stat: { iq: 2 }, price: 2500, magic: true },

    gauntlets: { name: 'Gauntlets', slot: 'gloves', ac: 1, price: 80, allow: ARMORED },
    mightgloves: { name: 'Gloves of Might', slot: 'gloves', ac: 1, stat: { st: 3 }, price: 3500, magic: true },
    swiftgloves: { name: 'Gloves of Swiftness', slot: 'gloves', ac: 2, stat: { dx: 3 }, price: 3500, magic: true },

    ringprot: { name: 'Ring of Protection', slot: 'ring', ac: 2, price: 1200, magic: true },
    ringwarm: { name: 'Ring of Warmth', slot: 'ring', ac: 1, resist: 'ice', price: 1500, magic: true },
    ringmana: { name: 'Ring of Mana', slot: 'ring', spBonus: 12, price: 4000, magic: true },
    ringluck: { name: 'Ring of Fortune', slot: 'ring', ac: 1, stat: { lk: 4 }, price: 2500, magic: true },

    // ---- instruments ----
    lute: { name: 'Lute', slot: 'instrument', price: 60, allow: ['bard'] },
    silverflute: { name: 'Silver Flute', slot: 'instrument', songPower: 1.5, price: 2000, magic: true, allow: ['bard'] },
    frosthorn: { name: 'Horn of Thaw', slot: 'instrument', songPower: 1.5, price: 5000, magic: true, allow: ['bard'], use: { spell: 'INFR', charges: 8 } },
    harpofages: { name: 'Harp of Ages', slot: 'instrument', songPower: 2, price: 10000, magic: true, allow: ['bard'] },

    // ---- usables ----
    torch: { name: 'Torch', slot: 'use', price: 5, consumable: true, use: { light: 3, steps: 250 } },
    potion: { name: 'Healing Potion', slot: 'use', price: 40, consumable: true, use: { heal: [3, 8, 2] } },
    bigpotion: { name: 'Greater Healing', slot: 'use', price: 200, consumable: true, use: { heal: [10, 8, 10] } },
    antidote: { name: 'Antidote', slot: 'use', price: 30, consumable: true, use: { cure: ['poisoned'] } },
    softstone: { name: 'Soft Stone Salve', slot: 'use', price: 250, consumable: true, use: { cure: ['poisoned', 'paralyzed', 'stoned'] } },
    manapotion: { name: 'Mana Draught', slot: 'use', price: 150, consumable: true, use: { sp: [3, 6, 4] } },
    elixir: { name: 'Elixir of Life', slot: 'use', price: 1500, consumable: true, magic: true, use: { heal: [99, 8], sp: [20, 6], cure: ['poisoned', 'paralyzed', 'stoned'] } },
    phoenix: { name: 'Phoenix Feather', slot: 'use', price: 2000, consumable: true, magic: true, use: { raise: true } },
    firescroll: { name: 'Scroll of Fireburst', slot: 'use', price: 120, consumable: true, use: { spell: 'FIRB' } },
    recallscroll: { name: 'Scroll of Recall', slot: 'use', price: 400, consumable: true, use: { spell: 'RECL' } },
    lightwand: { name: 'Wand of Lightning', slot: 'use', price: 2500, magic: true, use: { spell: 'SHOK', charges: 10 } },
    wolfstatue: { name: 'Wolf Figurine', slot: 'use', price: 1500, magic: true, use: { spell: 'FIGW', charges: 3 } },
    holywater: { name: 'Holy Water', slot: 'use', price: 80, consumable: true, use: { spell: 'HOLY' } },

    // ---- quest ----
    bronzekey: { name: 'Bronze Crypt Key', slot: 'quest', quest: true, price: 0, desc: 'Opens the crypt gate in the graveyard.' },
    ironsigil: { name: 'Iron Sigil', slot: 'quest', quest: true, price: 0, desc: 'Opens the gate of the Iron Keep.' },
    moonkey: { name: 'Moonstone Key', slot: 'quest', quest: true, price: 0, desc: 'Opens the door of Malthor\'s tower.' },
    sunshard: { name: 'Sun Shard', slot: 'quest', quest: true, price: 0, desc: 'A sliver of golden crystal, warm as a summer afternoon. The Dawn\'s relic of the Concord.' },
    stillglass: { name: 'Still Hourglass', slot: 'quest', quest: true, price: 0, desc: 'An hourglass whose sand hangs motionless. The Pale Hour\'s relic of the Concord.' },
    heartseed: { name: 'Heartwood Seed', slot: 'quest', quest: true, price: 0, desc: 'A seed of glowing amber wood that beats faintly, like a heart. The Deep Root\'s relic of the Concord.' },
    concordring: { name: 'Ring of Concord', slot: 'ring', ac: 3, resist: 'magic', stat: { st: 1, iq: 1, dx: 1, cn: 1, lk: 2 }, price: 6000, magic: true, desc: 'Three bands - gold, silver and wood - twined into one.' },
    locket: { name: 'Lyra\'s Locket', slot: 'quest', quest: true, price: 0, desc: 'A silver locket, cold as ice. Inside: a girl and her father, laughing.' },
  };

  // Base stock always in the shop.
  BT.SHOP_STOCK = ['dagger', 'club', 'staff', 'shortsword', 'mace', 'longsword', 'spear', 'battleaxe', 'warhammer',
    'greatsword', 'halberd', 'shortbow', 'longbow', 'robes', 'leather', 'studded', 'chain', 'scale', 'plate',
    'buckler', 'shield', 'towershield', 'cap', 'helm', 'gauntlets', 'lute', 'torch', 'potion', 'bigpotion',
    'antidote', 'softstone', 'manapotion', 'firescroll', 'recallscroll', 'holywater'];

  // Loot tiers by dungeon depth (1..5).
  BT.LOOT = [
    ['potion', 'potion', 'antidote', 'torch', 'shortsword', 'leather', 'buckler', 'cap', 'firescroll', 'silverdagger'],
    ['potion', 'antidote', 'manapotion', 'chain', 'longsword', 'shield', 'helm', 'silverdagger', 'ringprot', 'firescroll', 'shortbow', 'holywater'],
    ['bigpotion', 'manapotion', 'softstone', 'frostbrand', 'ringwarm', 'elvenchain', 'emberstaff', 'longbow', 'gauntlets', 'circlet', 'silverflute', 'shadowleather'],
    ['bigpotion', 'softstone', 'elixir', 'flamberge', 'shadowfang', 'silkrobes', 'mightgloves', 'swiftgloves', 'ringluck', 'lightwand', 'wolfstatue', 'greathelm', 'elvenbow', 'phoenix'],
    ['elixir', 'phoenix', 'vampblade', 'frostplate', 'mirrorshield', 'archstaff', 'ringmana', 'monkwraps', 'frosthorn', 'holyavenger', 'dragonscale'],
  ];

  for (const k in I) I[k].id = k;
  BT.ITEMS = I;

  BT.canUse = function (ch, item) {
    if (!item.allow) return true;
    return item.allow.indexOf(ch.cls) >= 0;
  };
})();
