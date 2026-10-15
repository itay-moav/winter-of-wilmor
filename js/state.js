// Game state, characters, inventory, derived stats, saving.
(function () {
  const U = BT.U, D = BT.D;
  const ST = {};
  let nextId = 1;

  ST.newGame = function () {
    BT.G = {
      version: 1,
      party: [],
      roster: [],
      summon: null,
      map: 'town', x: 2, y: 1, d: 1,
      time: 8 * 25, // steps; 25 steps per hour, starts 8am
      flags: {},
      explored: {},
      fx: { light: null, compass: 0, levitate: 0, trapsense: 0, song: null },
      shop: {},
      stats: { kills: 0, steps: 0, battles: 0 },
      seen: {},
    };
    return BT.G;
  };

  // ---------- characters ----------
  ST.rollStats = function (race) {
    const mod = D.RACES[race].mod, s = {};
    for (const k of D.STATS) s[k] = U.clamp(U.roll(2, 6, 4) + mod[k], 3, 18);
    return s;
  };

  const START_KIT = {
    warrior: ['shortsword', 'leather', 'buckler', 'potion'],
    paladin: ['mace', 'leather', 'buckler', 'potion'],
    rogue: ['dagger', 'leather', 'potion', 'torch'],
    bard: ['club', 'leather', 'lute', 'potion'],
    hunter: ['shortbow', 'leather', 'potion'],
    monk: ['robes', 'potion'],
    conjurer: ['staff', 'robes', 'potion'],
    magician: ['staff', 'robes', 'potion'],
  };

  ST.makeChar = function (o) {
    const cls = D.CLASSES[o.cls];
    const base = o.base || ST.rollStats(o.race);
    const ch = {
      id: 'c' + Date.now().toString(36) + (nextId++),
      name: o.name, race: o.race, cls: o.cls, gender: o.gender || 'm',
      look: o.look || { hair: U.rand(8), hairColor: U.rand(10), skin: U.rand(6), eyes: U.rand(8) },
      seed: o.seed || U.rand(100000),
      level: 1, xp: 0, base,
      hp: 0, maxhp: 0, sp: 0, maxsp: 0,
      gold: 120 + U.rand(100),
      status: 'ok',
      inv: [],
      spells: {},
      voice: 0,
    };
    ch.maxhp = Math.max(8, cls.hd + 4 + D.statBonus(base.cn) * 2 + U.rand(Math.ceil(cls.hd / 2)));
    ch.hp = ch.maxhp;
    if (cls.school) {
      ch.spells[cls.school] = 1;
      ch.maxsp = 8 + D.statBonus(base.iq) * 2 + U.roll(1, 4);
      ch.sp = ch.maxsp;
    }
    if (o.cls === 'bard') ch.voice = ST.maxVoice(ch);
    for (const it of START_KIT[o.cls] || []) ST.give(ch, it, true);
    return ch;
  };

  ST.maxVoice = (ch) => 1 + Math.ceil(ch.level / 2);

  // ---------- inventory ----------
  ST.MAX_INV = 10;
  ST.give = function (ch, itemId, equip) {
    if (ch.inv.length >= ST.MAX_INV) return false;
    const def = BT.ITEMS[itemId];
    const it = { id: itemId };
    if (def.use && def.use.charges) it.ch = def.use.charges;
    ch.inv.push(it);
    if (equip && def.slot !== 'use' && def.slot !== 'quest') ST.equip(ch, it);
    return true;
  };
  // Give to the first party member with room.
  ST.giveParty = function (itemId) {
    for (const ch of BT.G.party) if (ST.give(ch, itemId)) return ch;
    return null;
  };
  ST.hasItem = function (itemId) {
    for (const ch of BT.G.party) for (const it of ch.inv) if (it.id === itemId) return true;
    return false;
  };
  ST.equip = function (ch, it) {
    const def = BT.ITEMS[it.id];
    if (!BT.canUse(ch, def)) return 'A ' + D.CLASSES[ch.cls].name + ' cannot use that.';
    if (def.slot === 'use' || def.slot === 'quest') return 'That cannot be equipped.';
    for (const o of ch.inv) {
      if (!o.eq || o === it) continue;
      const od = BT.ITEMS[o.id];
      if (od.slot === def.slot) o.eq = false;
      if (def.two && od.slot === 'shield') o.eq = false;
      if (def.slot === 'shield' && od.two) o.eq = false;
    }
    it.eq = true;
    ST.clampSp(ch);
    return null;
  };
  ST.unequip = function (ch, it) { it.eq = false; ST.clampSp(ch); };
  ST.equipped = function (ch, slot) {
    for (const it of ch.inv) if (it.eq && BT.ITEMS[it.id].slot === slot) return it;
    return null;
  };
  ST.weapon = (ch) => { const it = ST.equipped(ch, 'weapon'); return it ? BT.ITEMS[it.id] : null; };

  // ---------- derived stats ----------
  ST.stat = function (ch, k) {
    let v = ch.base[k];
    for (const it of ch.inv) if (it.eq) { const s = BT.ITEMS[it.id].stat; if (s && s[k]) v += s[k]; }
    return Math.min(v, 25);
  };
  ST.ac = function (ch, buffs) {
    if (ch.summon) return ch.ac + (buffs ? buffs.ac || 0 : 0);
    let ac = 10;
    let hasArmor = false;
    for (const it of ch.inv) {
      if (!it.eq) continue;
      const d = BT.ITEMS[it.id];
      if (d.ac) ac -= d.ac;
      if (d.slot === 'armor' && d.id !== 'robes') hasArmor = true;
    }
    ac -= D.statBonus(ST.stat(ch, 'dx'));
    if (ch.cls === 'monk' && !hasArmor) ac -= 1 + Math.floor(ch.level / 2);
    if (buffs) ac += buffs.ac || 0;
    return ac;
  };
  ST.acStr = (ac) => (ac < -9 ? 'LO' : String(ac));
  ST.maxSp = function (ch) {
    let v = ch.maxsp;
    for (const it of ch.inv) if (it.eq && BT.ITEMS[it.id].spBonus) v += BT.ITEMS[it.id].spBonus;
    return v;
  };
  ST.clampSp = function (ch) { ch.sp = Math.min(ch.sp, ST.maxSp(ch)); };
  ST.isMage = (ch) => Object.keys(ch.spells || {}).length > 0;
  ST.alive = (ch) => ch.status !== 'dead' && ch.status !== 'stoned';
  ST.canAct = (ch) => ch.status === 'ok' || ch.status === 'poisoned';
  ST.living = () => BT.G.party.filter(ST.alive);

  ST.knownSpells = function (ch) {
    const out = [];
    for (const s of BT.SPELL_LIST) {
      const known = ch.spells && ch.spells[s.school];
      if (known && s.lvl <= known) out.push(s);
    }
    return out;
  };

  ST.attacksPerRound = function (ch) {
    const c = D.CLASSES[ch.cls];
    if (!c.extra) return 1;
    return Math.min(4, 1 + Math.floor(ch.level / c.extra));
  };
  ST.toHit = function (ch) {
    const c = D.CLASSES[ch.cls];
    let b = Math.floor(ch.level * c.melee) + D.statBonus(ST.stat(ch, 'st')) + D.statBonus(ST.stat(ch, 'dx'));
    for (const it of ch.inv) if (it.eq && BT.ITEMS[it.id].hit) b += BT.ITEMS[it.id].hit;
    if (ch.cls === 'monk') b += Math.floor(ch.level / 3);
    return b;
  };
  ST.damageDice = function (ch) {
    const w = ST.weapon(ch);
    if (ch.cls === 'monk' && (!w || w.monkBonus)) {
      const s = 4 + 2 * Math.floor(ch.level / 2);
      return [1, s, Math.floor(ch.level / 3) + (w ? w.monkBonus : 0)];
    }
    return w ? w.dmg : [1, 2];
  };
  ST.dmgBonus = function (ch) {
    let b = D.statBonus(ST.stat(ch, 'st'));
    if (ch.cls === 'warrior' || ch.cls === 'paladin') b += Math.floor(ch.level / 4);
    return b;
  };

  // ---------- progression ----------
  ST.canLevel = (ch) => !ch.summon && ch.xp >= D.xpFor(ch.level + 1);
  ST.levelUp = function (ch) {
    const c = D.CLASSES[ch.cls];
    ch.level++;
    const hpGain = Math.max(1, U.roll(1, c.hd) + D.statBonus(ST.stat(ch, 'cn')));
    ch.maxhp += hpGain;
    ch.hp += hpGain;
    let spGain = 0;
    if (ST.isMage(ch) && c.school) {
      spGain = Math.max(1, U.roll(1, 4) + D.statBonus(ST.stat(ch, 'iq')));
      ch.maxsp += spGain;
      ch.sp += spGain;
    }
    let statUp = null;
    if (U.chance(0.5)) {
      const k = U.pick(D.STATS);
      if (ch.base[k] < 18) { ch.base[k]++; statUp = k; }
    }
    if (ch.cls === 'bard') ch.voice = ST.maxVoice(ch);
    return { hpGain, spGain, statUp };
  };

  // ---------- time ----------
  ST.HOUR = 25;
  ST.hour = () => Math.floor(BT.G.time / ST.HOUR) % 24;
  ST.isNight = () => { const h = ST.hour(); return h < 6 || h >= 20; };
  ST.timeStr = function () {
    const h = ST.hour();
    const names = [[5, 'Night'], [8, 'Dawn'], [12, 'Morning'], [14, 'Midday'], [18, 'Afternoon'], [20, 'Evening'], [24, 'Night']];
    for (const [lim, n] of names) if (h < lim) return n;
    return 'Night';
  };

  // ---------- saving ----------
  ST.SLOTS = ['auto', '1', '2', '3'];
  ST.save = function (slot) {
    const G = BT.G;
    const data = { G, when: Date.now(), where: BT.MAPS[G.map].name, lead: G.party[0] ? G.party[0].name : '-', lvl: G.party[0] ? G.party[0].level : 0 };
    try {
      localStorage.setItem('velmoor_save_' + slot, JSON.stringify(data));
      return true;
    } catch (e) { return false; }
  };
  ST.saveInfo = function (slot) {
    try {
      const s = localStorage.getItem('velmoor_save_' + slot);
      if (!s) return null;
      const d = JSON.parse(s);
      return { when: d.when, where: d.where, lead: d.lead, lvl: d.lvl, size: d.G.party.length };
    } catch (e) { return null; }
  };
  ST.load = function (slot) {
    const s = localStorage.getItem('velmoor_save_' + slot);
    if (!s) return false;
    const d = JSON.parse(s);
    BT.G = d.G;
    return true;
  };
  ST.anySave = () => ST.SLOTS.some((s) => ST.saveInfo(s));

  // ---------- explored map ----------
  ST.markExplored = function (mapId, x, y) {
    const G = BT.G, m = BT.MAPS[mapId];
    let s = G.explored[mapId];
    if (!s || s.length !== m.w * m.h) s = '0'.repeat(m.w * m.h);
    const i = y * m.w + x;
    if (s[i] === '1') return;
    G.explored[mapId] = s.slice(0, i) + '1' + s.slice(i + 1);
  };
  ST.isExplored = function (mapId, x, y) {
    const s = BT.G.explored[mapId], m = BT.MAPS[mapId];
    return !!s && s[y * m.w + x] === '1';
  };

  // Ready-made party for a quick start.
  ST.defaultParty = function () {
    const mk = (name, race, cls, gender, look, base) => ST.makeChar({ name, race, cls, gender, look, base });
    return [
      mk('Torvald', 'dwarf', 'warrior', 'm', { hair: 2, hairColor: 3, skin: 1, eyes: 2 }, { st: 18, iq: 9, dx: 12, cn: 17, lk: 10 }),
      mk('Seraphine', 'human', 'paladin', 'f', { hair: 0, hairColor: 1, skin: 0, eyes: 1 }, { st: 16, iq: 11, dx: 13, cn: 16, lk: 12 }),
      mk('Mei', 'human', 'monk', 'f', { hair: 1, hairColor: 0, skin: 2, eyes: 3 }, { st: 15, iq: 10, dx: 17, cn: 15, lk: 12 }),
      mk('Lark', 'halfelf', 'bard', 'm', { hair: 5, hairColor: 2, skin: 1, eyes: 4 }, { st: 13, iq: 13, dx: 15, cn: 14, lk: 15 }),
      mk('Elowen', 'elf', 'conjurer', 'f', { hair: 3, hairColor: 5, skin: 0, eyes: 0 }, { st: 9, iq: 18, dx: 14, cn: 12, lk: 12 }),
      mk('Nyx', 'halfelf', 'magician', 'f', { hair: 4, hairColor: 7, skin: 3, eyes: 6 }, { st: 10, iq: 17, dx: 15, cn: 13, lk: 13 }),
    ];
  };

  BT.ST = ST;
})();
