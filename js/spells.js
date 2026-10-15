// Spell definitions. Effects are interpreted by magic.js.
// when: 'combat' | 'explore' | 'both'. target: none|one|group|all|ally|party
// dmg dice gain +1 die every `scale` caster levels.
(function () {
  const S = [
    // ---------------- Conjurer: elements and healing ----------------
    { code: 'SPRK', name: 'Spark Bolt', school: 'con', lvl: 1, sp: 2, when: 'combat', target: 'one', dmg: [2, 4], scale: 3, el: 'fire', fx: 'fire' },
    { code: 'GLOW', name: 'Glowlight', school: 'con', lvl: 1, sp: 2, when: 'explore', target: 'none', light: 3, steps: 300 },
    { code: 'MEND', name: 'Minor Mend', school: 'con', lvl: 1, sp: 3, when: 'both', target: 'ally', heal: [1, 8, 2], scale: 2 },
    { code: 'FRDT', name: 'Frost Dart', school: 'con', lvl: 2, sp: 4, when: 'combat', target: 'one', dmg: [3, 6], scale: 3, el: 'ice', fx: 'ice' },
    { code: 'ARMR', name: 'Arcane Armor', school: 'con', lvl: 2, sp: 4, when: 'combat', target: 'party', buff: { ac: -2 } },
    { code: 'TRPS', name: 'Trap Sense', school: 'con', lvl: 2, sp: 3, when: 'explore', target: 'none', trapsense: 400 },
    { code: 'FIRB', name: 'Fireburst', school: 'con', lvl: 3, sp: 6, when: 'combat', target: 'group', dmg: [3, 6], scale: 4, el: 'fire', fx: 'fire' },
    { code: 'HEAL', name: 'Heal', school: 'con', lvl: 3, sp: 6, when: 'both', target: 'ally', heal: [4, 8, 4], scale: 2, cure: ['poisoned'] },
    { code: 'COMP', name: 'Compass Charm', school: 'con', lvl: 3, sp: 3, when: 'explore', target: 'none', compass: 1000 },
    { code: 'SHOK', name: 'Shockwave', school: 'con', lvl: 4, sp: 9, when: 'combat', target: 'group', dmg: [4, 8], scale: 4, el: 'lightning', fx: 'lightning' },
    { code: 'BRIL', name: 'Brilliance', school: 'con', lvl: 4, sp: 6, when: 'explore', target: 'none', light: 5, steps: 1200, secret: true },
    { code: 'CURE', name: 'Cure Ailments', school: 'con', lvl: 4, sp: 8, when: 'both', target: 'ally', cure: ['poisoned', 'paralyzed'] },
    { code: 'INFR', name: 'Inferno', school: 'con', lvl: 5, sp: 14, when: 'combat', target: 'all', dmg: [4, 8], scale: 4, el: 'fire', fx: 'fire' },
    { code: 'REST', name: 'Restoration', school: 'con', lvl: 5, sp: 14, when: 'both', target: 'ally', heal: 'full', cure: ['poisoned', 'paralyzed', 'stoned'] },
    { code: 'GLSP', name: 'Glacier Spear', school: 'con', lvl: 6, sp: 18, when: 'combat', target: 'one', dmg: [10, 10], scale: 3, el: 'ice', fx: 'ice' },
    { code: 'SUMF', name: 'Summon Salamander', school: 'con', lvl: 6, sp: 20, when: 'both', target: 'none', summon: 'salamander' },
    { code: 'METR', name: 'Meteor Storm', school: 'con', lvl: 7, sp: 30, when: 'combat', target: 'all', dmg: [10, 8], scale: 3, el: 'fire', fx: 'fire' },
    { code: 'RAIS', name: 'Rekindle Soul', school: 'con', lvl: 7, sp: 30, when: 'explore', target: 'ally', raise: true, heal: 'full' },

    // ---------------- Magician: enchantment and force ----------------
    { code: 'VOLT', name: 'Voltaic Touch', school: 'mag', lvl: 1, sp: 2, when: 'combat', target: 'one', dmg: [1, 10, 2], scale: 2, el: 'lightning', fx: 'lightning' },
    { code: 'SHLD', name: 'Mage Shield', school: 'mag', lvl: 1, sp: 2, when: 'combat', target: 'party', buff: { ac: -1 } },
    { code: 'ZAPT', name: 'Trap Zap', school: 'mag', lvl: 1, sp: 2, when: 'explore', target: 'none', trapsense: 150, zap: true },
    { code: 'SLEP', name: 'Slumber', school: 'mag', lvl: 2, sp: 4, when: 'combat', target: 'group', sleep: 3 },
    { code: 'BLES', name: 'Blessed Blades', school: 'mag', lvl: 2, sp: 5, when: 'combat', target: 'party', buff: { hit: 2, dmg: 2 } },
    { code: 'SCRY', name: 'Scry Site', school: 'mag', lvl: 2, sp: 2, when: 'explore', target: 'none', scry: true },
    { code: 'PHAS', name: 'Phase Door', school: 'mag', lvl: 3, sp: 6, when: 'explore', target: 'none', phase: true },
    { code: 'SWRD', name: 'Spectral Sword', school: 'mag', lvl: 3, sp: 6, when: 'combat', target: 'one', dmg: [6, 6], scale: 3, el: 'force', fx: 'generic' },
    { code: 'LEVI', name: 'Levitation', school: 'mag', lvl: 3, sp: 5, when: 'explore', target: 'none', levitate: 600 },
    { code: 'MIND', name: 'Mind Spike', school: 'mag', lvl: 4, sp: 9, when: 'combat', target: 'group', dmg: [5, 6], scale: 4, el: 'mind', fx: 'dark' },
    { code: 'HOLD', name: 'Hold Monsters', school: 'mag', lvl: 4, sp: 8, when: 'combat', target: 'group', hold: 3 },
    { code: 'DISP', name: 'Dispel Undead', school: 'mag', lvl: 4, sp: 9, when: 'combat', target: 'group', dmg: [10, 6], scale: 3, undead: true, el: 'holy', fx: 'holy' },
    { code: 'WARD', name: 'Greater Ward', school: 'mag', lvl: 5, sp: 12, when: 'combat', target: 'party', buff: { ac: -4, resist: true } },
    { code: 'HAST', name: 'Haste', school: 'mag', lvl: 5, sp: 14, when: 'combat', target: 'party', buff: { haste: true } },
    { code: 'CHNL', name: 'Chain Lightning', school: 'mag', lvl: 6, sp: 18, when: 'combat', target: 'all', dmg: [6, 8], scale: 4, el: 'lightning', fx: 'lightning' },
    { code: 'RECL', name: 'Recall', school: 'mag', lvl: 6, sp: 15, when: 'explore', target: 'none', recall: true },
    { code: 'TIME', name: 'Time Stop', school: 'mag', lvl: 7, sp: 30, when: 'combat', target: 'none', timestop: 2 },
    { code: 'ANNI', name: 'Annihilate', school: 'mag', lvl: 7, sp: 28, when: 'combat', target: 'group', dmg: [12, 10], scale: 3, el: 'force', fx: 'generic' },

    // ---------------- Sorcerer: shadow, fear and knowledge ----------------
    { code: 'NSGT', name: 'Night Sight', school: 'sor', lvl: 1, sp: 3, when: 'explore', target: 'none', light: 4, steps: 600 },
    { code: 'FEAR', name: 'Dread', school: 'sor', lvl: 1, sp: 3, when: 'combat', target: 'group', fear: 0.35 },
    { code: 'PHBL', name: 'Phantom Blades', school: 'sor', lvl: 2, sp: 5, when: 'combat', target: 'group', dmg: [3, 8], scale: 4, el: 'dark', fx: 'dark' },
    { code: 'DSEC', name: 'Detect Secrets', school: 'sor', lvl: 2, sp: 4, when: 'explore', target: 'none', light: 3, steps: 500, secret: true },
    { code: 'ILLU', name: 'Illusory Ally', school: 'sor', lvl: 3, sp: 10, when: 'both', target: 'none', summon: 'phantasm' },
    { code: 'DRLF', name: 'Drain Life', school: 'sor', lvl: 3, sp: 8, when: 'combat', target: 'one', dmg: [6, 8], scale: 3, drain: 0.5, el: 'dark', fx: 'dark' },
    { code: 'TELE', name: 'Teleport', school: 'sor', lvl: 4, sp: 15, when: 'explore', target: 'none', teleport: true },
    { code: 'SHDW', name: 'Shadowfire', school: 'sor', lvl: 4, sp: 11, when: 'combat', target: 'group', dmg: [6, 8], scale: 4, el: 'dark', fx: 'dark' },
    { code: 'MFER', name: 'Mass Terror', school: 'sor', lvl: 5, sp: 14, when: 'combat', target: 'all', fear: 0.45 },
    { code: 'SOUL', name: 'Soul Shield', school: 'sor', lvl: 5, sp: 14, when: 'combat', target: 'party', buff: { ac: -3, resist: true } },
    { code: 'NGHT', name: 'Nightmare', school: 'sor', lvl: 6, sp: 20, when: 'combat', target: 'all', dmg: [7, 8], scale: 4, el: 'dark', fx: 'dark' },
    { code: 'REVL', name: 'Reveal Maze', school: 'sor', lvl: 6, sp: 12, when: 'explore', target: 'none', reveal: true },
    { code: 'DOOM', name: 'Doom', school: 'sor', lvl: 7, sp: 30, when: 'combat', target: 'group', death: true },
    { code: 'ECLP', name: 'Eclipse', school: 'sor', lvl: 7, sp: 32, when: 'combat', target: 'all', dmg: [12, 8], scale: 3, el: 'dark', fx: 'dark' },

    // ---------------- Wizard: summoning and the highest arts ----------------
    { code: 'AMIS', name: 'Arcane Missiles', school: 'wiz', lvl: 1, sp: 6, when: 'combat', target: 'group', dmg: [4, 6], scale: 3, el: 'force', fx: 'generic' },
    { code: 'SIMP', name: 'Summon Imp', school: 'wiz', lvl: 1, sp: 10, when: 'both', target: 'none', summon: 'imp_ally' },
    { code: 'HAMR', name: 'Spirit Hammer', school: 'wiz', lvl: 2, sp: 12, when: 'combat', target: 'one', dmg: [10, 8], scale: 3, el: 'holy', fx: 'holy' },
    { code: 'MHEL', name: 'Mass Healing', school: 'wiz', lvl: 2, sp: 18, when: 'both', target: 'party', heal: [4, 8, 4], scale: 3, cure: ['poisoned'] },
    { code: 'SDEM', name: 'Summon Demon', school: 'wiz', lvl: 3, sp: 25, when: 'both', target: 'none', summon: 'demon_ally' },
    { code: 'HOLI', name: 'Holy Light', school: 'wiz', lvl: 4, sp: 20, when: 'combat', target: 'all', dmg: [12, 6], scale: 3, undead: true, el: 'holy', fx: 'holy' },
    { code: 'STRM', name: 'Storm of Souls', school: 'wiz', lvl: 5, sp: 26, when: 'combat', target: 'all', dmg: [10, 8], scale: 3, el: 'force', fx: 'lightning' },
    { code: 'BANI', name: 'Banishment', school: 'wiz', lvl: 6, sp: 30, when: 'combat', target: 'group', death: true },
    { code: 'SDRG', name: 'Summon Dragon', school: 'wiz', lvl: 6, sp: 40, when: 'both', target: 'none', summon: 'dragon_ally' },
    { code: 'APOC', name: 'Apocalypse', school: 'wiz', lvl: 7, sp: 45, when: 'combat', target: 'all', dmg: [20, 10], scale: 3, el: 'force', fx: 'fire' },
    { code: 'DIVR', name: 'Divine Rebirth', school: 'wiz', lvl: 7, sp: 50, when: 'explore', target: 'party', raise: true, heal: 'full', cure: ['poisoned', 'paralyzed', 'stoned'] },

    // ---------------- item-only ----------------
    { code: 'FIGW', name: 'Call of the Wolf', school: 'item', lvl: 0, sp: 0, when: 'both', target: 'none', summon: 'wolf_ally' },
    { code: 'HOLY', name: 'Holy Water', school: 'item', lvl: 0, sp: 0, when: 'combat', target: 'group', dmg: [4, 8], undead: true, el: 'holy', fx: 'holy' },
  ];

  BT.SPELLS = {};
  for (const s of S) BT.SPELLS[s.code] = s;
  BT.SPELL_LIST = S;
})();
